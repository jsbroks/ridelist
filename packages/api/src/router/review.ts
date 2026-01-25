import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, avg, count, desc, eq, sql } from "@app/db";
import {
  CreateReviewSchema,
  review,
  ride,
  rideRequest,
  user,
} from "@app/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const reviewRouter = {
  // Get a single review by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.review.findFirst({
        where: and(eq(review.id, input.id), eq(review.isVisible, 1)),
        with: {
          reviewer: true,
          reviewee: true,
          ride: true,
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
          eq(review.revieweeId, input.userId),
          eq(review.isVisible, 1),
          input.cursor ? sql`${review.id} < ${input.cursor}` : undefined,
        ),
        orderBy: desc(review.createdAt),
        limit: input.limit + 1,
        with: {
          reviewer: true,
          ride: true,
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
          eq(review.reviewerId, input.userId),
          eq(review.isVisible, 1),
          input.cursor ? sql`${review.id} < ${input.cursor}` : undefined,
        ),
        orderBy: desc(review.createdAt),
        limit: input.limit + 1,
        with: {
          reviewee: true,
          ride: true,
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

  // Get reviews for a specific ride
  forRide: publicProcedure
    .input(z.object({ rideId: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.review.findMany({
        where: and(eq(review.rideId, input.rideId), eq(review.isVisible, 1)),
        orderBy: desc(review.createdAt),
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
          averageRating: avg(review.rating),
          totalReviews: count(),
        })
        .from(review)
        .where(
          and(eq(review.revieweeId, input.userId), eq(review.isVisible, 1)),
        );

      // Get rating distribution
      const distribution = await ctx.db
        .select({
          rating: review.rating,
          count: count(),
        })
        .from(review)
        .where(
          and(eq(review.revieweeId, input.userId), eq(review.isVisible, 1)),
        )
        .groupBy(review.rating);

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
          eq(review.revieweeId, ctx.session.user.id),
          eq(review.isVisible, 1),
          input?.cursor ? sql`${review.id} < ${input.cursor}` : undefined,
        ),
        orderBy: desc(review.createdAt),
        limit: limit + 1,
        with: {
          reviewer: true,
          ride: true,
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
          eq(review.reviewerId, ctx.session.user.id),
          input?.cursor ? sql`${review.id} < ${input.cursor}` : undefined,
        ),
        orderBy: desc(review.createdAt),
        limit: limit + 1,
        with: {
          reviewee: true,
          ride: true,
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

  // Check if a review can be created (user participated in the ride and hasn't reviewed yet)
  canReview: protectedProcedure
    .input(
      z.object({
        rideId: z.string().uuid(),
        revieweeId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if the ride exists and is completed
      const rideData = await ctx.db.query.ride.findFirst({
        where: eq(ride.id, input.rideId),
        with: {
          requests: {
            where: eq(rideRequest.status, "accepted"),
          },
        },
      });

      if (!rideData) {
        return { canReview: false, reason: "Ride not found" };
      }

      if (rideData.status !== "completed") {
        return { canReview: false, reason: "Ride is not completed yet" };
      }

      // Check if user was part of this ride
      const isDriver = rideData.driverId === userId;
      const isPassenger = rideData.requests.some(
        (r) => r.passengerId === userId,
      );

      if (!isDriver && !isPassenger) {
        return { canReview: false, reason: "You were not part of this ride" };
      }

      // Check if reviewee was part of this ride
      const revieweeIsDriver = rideData.driverId === input.revieweeId;
      const revieweeIsPassenger = rideData.requests.some(
        (r) => r.passengerId === input.revieweeId,
      );

      if (!revieweeIsDriver && !revieweeIsPassenger) {
        return {
          canReview: false,
          reason: "User was not part of this ride",
        };
      }

      // Can't review yourself
      if (userId === input.revieweeId) {
        return { canReview: false, reason: "You cannot review yourself" };
      }

      // Check if review already exists
      const existingReview = await ctx.db.query.review.findFirst({
        where: and(
          eq(review.rideId, input.rideId),
          eq(review.reviewerId, userId),
          eq(review.revieweeId, input.revieweeId),
        ),
      });

      if (existingReview) {
        return {
          canReview: false,
          reason: "You have already reviewed this user for this ride",
        };
      }

      return { canReview: true, reason: null };
    }),

  // Create a new review
  create: protectedProcedure
    .input(CreateReviewSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Validate that the ride exists and is completed
      const rideData = await ctx.db.query.ride.findFirst({
        where: eq(ride.id, input.rideId),
        with: {
          requests: {
            where: eq(rideRequest.status, "accepted"),
          },
        },
      });

      if (!rideData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ride not found",
        });
      }

      if (rideData.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only review completed rides",
        });
      }

      // Verify participation
      const isDriver = rideData.driverId === userId;
      const isPassenger = rideData.requests.some(
        (r) => r.passengerId === userId,
      );

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You were not part of this ride",
        });
      }

      // Verify reviewee participation
      const revieweeIsDriver = rideData.driverId === input.revieweeId;
      const revieweeIsPassenger = rideData.requests.some(
        (r) => r.passengerId === input.revieweeId,
      );

      if (!revieweeIsDriver && !revieweeIsPassenger) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User was not part of this ride",
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
          message: "As the driver, you can only leave driver_to_passenger reviews",
        });
      }

      if (isPassenger && !isDriver && input.type !== "passenger_to_driver") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "As a passenger, you can only leave passenger_to_driver reviews",
        });
      }

      // Check for existing review
      const existingReview = await ctx.db.query.review.findFirst({
        where: and(
          eq(review.rideId, input.rideId),
          eq(review.reviewerId, userId),
          eq(review.revieweeId, input.revieweeId),
        ),
      });

      if (existingReview) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You have already reviewed this user for this ride",
        });
      }

      // Create the review
      const [newReview] = await ctx.db
        .insert(review)
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
          eq(review.id, input.id),
          eq(review.reviewerId, ctx.session.user.id),
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
        .update(review)
        .set(updateData)
        .where(eq(review.id, input.id))
        .returning();

      return updatedReview;
    }),

  // Delete a review (only by the reviewer)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingReview = await ctx.db.query.review.findFirst({
        where: and(
          eq(review.id, input.id),
          eq(review.reviewerId, ctx.session.user.id),
        ),
      });

      if (!existingReview) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Review not found or you don't have permission to delete it",
        });
      }

      await ctx.db.delete(review).where(eq(review.id, input.id));

      return { success: true };
    }),

  // Get pending reviews (rides completed where user hasn't left a review)
  pendingReviews: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get completed rides where user was driver
    const driverRides = await ctx.db.query.ride.findMany({
      where: and(eq(ride.driverId, userId), eq(ride.status, "completed")),
      with: {
        requests: {
          where: eq(rideRequest.status, "accepted"),
          with: {
            passenger: true,
          },
        },
        reviews: {
          where: eq(review.reviewerId, userId),
        },
      },
    });

    // Get completed rides where user was passenger
    const passengerRequests = await ctx.db.query.rideRequest.findMany({
      where: and(
        eq(rideRequest.passengerId, userId),
        eq(rideRequest.status, "accepted"),
      ),
      with: {
        ride: {
          with: {
            driver: true,
            reviews: {
              where: eq(review.reviewerId, userId),
            },
          },
        },
      },
    });

    const pendingReviews: Array<{
      rideId: string;
      rideName: string;
      revieweeId: string;
      revieweeName: string;
      revieweeImage: string | null;
      type: "driver_to_passenger" | "passenger_to_driver";
    }> = [];

    // Check driver rides for unreviewed passengers
    for (const rideData of driverRides) {
      for (const request of rideData.requests) {
        const hasReviewed = rideData.reviews.some(
          (r) => r.revieweeId === request.passengerId,
        );
        if (!hasReviewed) {
          pendingReviews.push({
            rideId: rideData.id,
            rideName: `${rideData.fromName} → ${rideData.toName}`,
            revieweeId: request.passengerId,
            revieweeName: request.passenger.name,
            revieweeImage: request.passenger.image,
            type: "driver_to_passenger",
          });
        }
      }
    }

    // Check passenger rides for unreviewed drivers
    for (const request of passengerRequests) {
      if (request.ride.status !== "completed") continue;

      const hasReviewed = request.ride.reviews.some(
        (r) => r.revieweeId === request.ride.driverId,
      );
      if (!hasReviewed) {
        pendingReviews.push({
          rideId: request.ride.id,
          rideName: `${request.ride.fromName} → ${request.ride.toName}`,
          revieweeId: request.ride.driverId,
          revieweeName: request.ride.driver.name,
          revieweeImage: request.ride.driver.image,
          type: "passenger_to_driver",
        });
      }
    }

    return pendingReviews;
  }),
} satisfies TRPCRouterRecord;
