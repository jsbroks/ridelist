import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, avg, count, desc, eq, inArray, sql } from "@app/db";
import * as schema from "@app/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const reviewRouter = {
  // Get a single review by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.review.findFirst({
        where: and(
          eq(schema.review.id, input.id),
          eq(schema.review.isVisible, 1),
        ),
        with: {
          reviewer: true,
          reviewee: true,
          booking: {
            with: {
              trip: true,
            },
          },
        },
      });
    }),

  // Get reviews received by a user
  forUser: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.query.review.findMany({
        where: and(
          eq(schema.review.revieweeId, input.userId),
          eq(schema.review.isVisible, 1),
          input.cursor ? sql`${schema.review.id} < ${input.cursor}` : undefined,
        ),
        orderBy: desc(schema.review.createdAt),
        limit: input.limit + 1,
        with: {
          reviewer: true,
          booking: {
            with: {
              trip: {
                with: {
                  driverRoute: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (reviews.length > input.limit) {
        const nextItem = reviews.pop();
        nextCursor = nextItem?.id;
      }

      return {
        reviews,
        nextCursor,
      };
    }),

  // Get reviews given by a user
  byUser: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.query.review.findMany({
        where: and(
          eq(schema.review.reviewerId, input.userId),
          eq(schema.review.isVisible, 1),
          input.cursor ? sql`${schema.review.id} < ${input.cursor}` : undefined,
        ),
        orderBy: desc(schema.review.createdAt),
        limit: input.limit + 1,
        with: {
          reviewee: true,
          booking: {
            with: {
              trip: {
                with: {
                  driverRoute: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (reviews.length > input.limit) {
        const nextItem = reviews.pop();
        nextCursor = nextItem?.id;
      }

      return {
        reviews,
        nextCursor,
      };
    }),

  // Get reviews for a specific booking
  forBooking: publicProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.review.findMany({
        where: and(
          eq(schema.review.bookingId, input.bookingId),
          eq(schema.review.isVisible, 1),
        ),
        orderBy: desc(schema.review.createdAt),
        with: {
          reviewer: true,
          reviewee: true,
        },
      });
    }),

  // Get reviews for a specific trip (all bookings)
  forTrip: publicProcedure
    .input(z.object({ tripId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get all bookings for the trip
      const bookings = await ctx.db.query.booking.findMany({
        where: eq(schema.booking.tripId, input.tripId),
        columns: { id: true },
      });

      const bookingIds = bookings.map((b) => b.id);
      if (bookingIds.length === 0) return [];

      return ctx.db.query.review.findMany({
        where: and(
          sql`${schema.review.bookingId} IN (${sql.join(
            bookingIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          eq(schema.review.isVisible, 1),
        ),
        orderBy: desc(schema.review.createdAt),
        with: {
          reviewer: true,
          reviewee: true,
        },
      });
    }),

  // Get rating statistics for a user
  stats: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // Get average rating and total count
      const [aggregates] = await ctx.db
        .select({
          averageRating: avg(schema.review.rating),
          totalReviews: count(),
        })
        .from(schema.review)
        .where(
          and(
            eq(schema.review.revieweeId, input.userId),
            eq(schema.review.isVisible, 1),
          ),
        );

      // Get rating distribution
      const distribution = await ctx.db
        .select({
          rating: schema.review.rating,
          count: count(),
        })
        .from(schema.review)
        .where(
          and(
            eq(schema.review.revieweeId, input.userId),
            eq(schema.review.isVisible, 1),
          ),
        )
        .groupBy(schema.review.rating);

      // Create a map for easy lookup
      const ratingMap = new Map(distribution.map((d) => [d.rating, d.count]));

      return {
        averageRating: aggregates?.averageRating
          ? parseFloat(Number(aggregates.averageRating).toFixed(1))
          : null,
        totalReviews: aggregates?.totalReviews ?? 0,
        distribution: {
          1: ratingMap.get(1) ?? 0,
          2: ratingMap.get(2) ?? 0,
          3: ratingMap.get(3) ?? 0,
          4: ratingMap.get(4) ?? 0,
          5: ratingMap.get(5) ?? 0,
        },
      };
    }),

  // Get reviews received by the current user
  myReviews: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().uuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const reviews = await ctx.db.query.review.findMany({
        where: and(
          eq(schema.review.revieweeId, ctx.session.user.id),
          eq(schema.review.isVisible, 1),
          input?.cursor
            ? sql`${schema.review.id} < ${input.cursor}`
            : undefined,
        ),
        orderBy: desc(schema.review.createdAt),
        limit: limit + 1,
        with: {
          reviewer: true,
          booking: {
            with: {
              trip: {
                with: {
                  driverRoute: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (reviews.length > limit) {
        const nextItem = reviews.pop();
        nextCursor = nextItem?.id;
      }

      return {
        reviews,
        nextCursor,
      };
    }),

  // Get reviews given by the current user
  myGivenReviews: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          cursor: z.string().uuid().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const reviews = await ctx.db.query.review.findMany({
        where: and(
          eq(schema.review.reviewerId, ctx.session.user.id),
          input?.cursor
            ? sql`${schema.review.id} < ${input.cursor}`
            : undefined,
        ),
        orderBy: desc(schema.review.createdAt),
        limit: limit + 1,
        with: {
          reviewee: true,
          booking: {
            with: {
              trip: {
                with: {
                  driverRoute: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (reviews.length > limit) {
        const nextItem = reviews.pop();
        nextCursor = nextItem?.id;
      }

      return {
        reviews,
        nextCursor,
      };
    }),

  // Check if a review can be created (user participated in the booking and hasn't reviewed yet)
  canReview: protectedProcedure
    .input(
      z.object({
        bookingId: z.string().uuid(),
        revieweeId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if the booking exists and is completed
      const bookingData = await ctx.db.query.booking.findFirst({
        where: eq(schema.booking.id, input.bookingId),
        with: {
          trip: true,
        },
      });

      if (!bookingData) {
        return { canReview: false, reason: "Booking not found" };
      }

      if (bookingData.status !== "completed") {
        return { canReview: false, reason: "Booking is not completed yet" };
      }

      // Check if user was part of this booking
      const isDriver = bookingData.trip.driverId === userId;
      const isPassenger = bookingData.passengerId === userId;

      if (!isDriver && !isPassenger) {
        return { canReview: false, reason: "You were not part of this trip" };
      }

      // Check if reviewee was part of this booking
      const revieweeIsDriver = bookingData.trip.driverId === input.revieweeId;
      const revieweeIsPassenger = bookingData.passengerId === input.revieweeId;

      if (!revieweeIsDriver && !revieweeIsPassenger) {
        return {
          canReview: false,
          reason: "User was not part of this booking",
        };
      }

      // Can't review yourself
      if (userId === input.revieweeId) {
        return { canReview: false, reason: "You cannot review yourself" };
      }

      // Check if review already exists
      const existingReview = await ctx.db.query.review.findFirst({
        where: and(
          eq(schema.review.bookingId, input.bookingId),
          eq(schema.review.reviewerId, userId),
          eq(schema.review.revieweeId, input.revieweeId),
        ),
      });

      if (existingReview) {
        return {
          canReview: false,
          reason: "You have already reviewed this user for this booking",
        };
      }

      return { canReview: true, reason: null };
    }),

  // Create a new review
  create: protectedProcedure
    .input(schema.CreateReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Validate that the booking exists and is completed
      const bookingData = await ctx.db.query.booking.findFirst({
        where: eq(schema.booking.id, input.bookingId),
        with: {
          trip: true,
        },
      });

      if (!bookingData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      if (bookingData.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only review completed bookings",
        });
      }

      // Verify participation
      const isDriver = bookingData.trip.driverId === userId;
      const isPassenger = bookingData.passengerId === userId;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You were not part of this trip",
        });
      }

      // Verify reviewee participation
      const revieweeIsDriver = bookingData.trip.driverId === input.revieweeId;
      const revieweeIsPassenger = bookingData.passengerId === input.revieweeId;

      if (!revieweeIsDriver && !revieweeIsPassenger) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User was not part of this booking",
        });
      }

      // Can't review yourself
      if (userId === input.revieweeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot review yourself",
        });
      }

      // Verify review type matches the roles
      if (isDriver && input.type !== "driver_to_passenger") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "As the driver, you can only leave driver_to_passenger reviews",
        });
      }

      if (isPassenger && !isDriver && input.type !== "passenger_to_driver") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "As a passenger, you can only leave passenger_to_driver reviews",
        });
      }

      // Check for existing review
      const existingReview = await ctx.db.query.review.findFirst({
        where: and(
          eq(schema.review.bookingId, input.bookingId),
          eq(schema.review.reviewerId, userId),
          eq(schema.review.revieweeId, input.revieweeId),
        ),
      });

      if (existingReview) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already reviewed this user for this booking",
        });
      }

      // Create the review
      const [newReview] = await ctx.db
        .insert(schema.review)
        .values({
          ...input,
          reviewerId: userId,
        })
        .returning();

      return newReview;
    }),

  // Update a review (only by the reviewer)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingReview = await ctx.db.query.review.findFirst({
        where: and(
          eq(schema.review.id, input.id),
          eq(schema.review.reviewerId, ctx.session.user.id),
        ),
      });

      if (!existingReview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found or you don't have permission to update it",
        });
      }

      const updateData: { rating?: number; comment?: string } = {};
      if (input.rating !== undefined) updateData.rating = input.rating;
      if (input.comment !== undefined) updateData.comment = input.comment;

      const [updatedReview] = await ctx.db
        .update(schema.review)
        .set(updateData)
        .where(eq(schema.review.id, input.id))
        .returning();

      return updatedReview;
    }),

  // Delete a review (only by the reviewer)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingReview = await ctx.db.query.review.findFirst({
        where: and(
          eq(schema.review.id, input.id),
          eq(schema.review.reviewerId, ctx.session.user.id),
        ),
      });

      if (!existingReview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found or you don't have permission to delete it",
        });
      }

      await ctx.db.delete(schema.review).where(eq(schema.review.id, input.id));

      return { success: true };
    }),

  // Get pending reviews (completed bookings where user hasn't left a review)
  pendingReviews: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const completedBookingStates = [
      "completed",
      "no_show_driver",
      "no_show_passenger",
    ] as const;

    // Get completed bookings where user was driver (need to review passengers)
    const driverTrips = await ctx.db.query.trip.findMany({
      where: and(
        eq(schema.trip.driverId, userId),
        inArray(schema.trip.status, ["completed", "cancelled"] as const),
      ),
      with: {
        driverRoute: true,
        bookings: {
          where: inArray(schema.booking.status, completedBookingStates),
          with: {
            passenger: true,
            reviews: {
              where: eq(schema.review.reviewerId, userId),
            },
          },
        },
      },
    });

    // Get completed bookings where user was passenger (need to review driver)
    const passengerBookings = await ctx.db.query.booking.findMany({
      where: and(
        eq(schema.booking.passengerId, userId),
        inArray(schema.booking.status, completedBookingStates),
      ),
      with: {
        trip: {
          with: {
            driver: true,
            driverRoute: true,
          },
        },
        reviews: {
          where: eq(schema.review.reviewerId, userId),
        },
      },
    });

    const pendingReviews: {
      bookingId: string;
      tripName: string;
      revieweeId: string;
      revieweeName: string;
      revieweeImage: string | null;
      type: "driver_to_passenger" | "passenger_to_driver";
    }[] = [];

    // Check driver trips for unreviewed passengers
    for (const tripData of driverTrips) {
      for (const booking of tripData.bookings) {
        const hasReviewed = booking.reviews.some(
          (r) => r.revieweeId === booking.passengerId,
        );
        if (!hasReviewed) {
          pendingReviews.push({
            bookingId: booking.id,
            tripName: `${tripData.driverRoute.fromName} → ${tripData.driverRoute.toName}`,
            revieweeId: booking.passengerId,
            revieweeName: booking.passenger.name,
            revieweeImage: booking.passenger.image,
            type: "driver_to_passenger",
          });
        }
      }
    }

    // Check passenger bookings for unreviewed drivers
    for (const booking of passengerBookings) {
      const hasReviewed = booking.reviews.some(
        (r) => r.revieweeId === booking.trip.driverId,
      );
      if (!hasReviewed) {
        pendingReviews.push({
          bookingId: booking.id,
          tripName: `${booking.trip.driverRoute.fromName} → ${booking.trip.driverRoute.toName}`,
          revieweeId: booking.trip.driverId,
          revieweeName: booking.trip.driver.name,
          revieweeImage: booking.trip.driver.image,
          type: "passenger_to_driver",
        });
      }
    }

    return pendingReviews;
  }),
} satisfies TRPCRouterRecord;
