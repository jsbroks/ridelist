import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, gte } from "@app/db";
import * as schema from "@app/db/schema";
import { CreateDriverRouteSchema } from "@app/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

const routeGeometrySchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

export const driversRouteRouter = {
  tripsSearch: publicProcedure
    .input(
      z.object({
        pickup: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        dropoff: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        radiusKm: z.number().min(1).max(50).default(10),
        date: z.coerce.date().optional(),
        minSeats: z.number().min(1).max(10).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.trip.findMany({
        where: and(
          eq(schema.trip.status, "scheduled"),
          gte(schema.trip.departureTime, input.date ?? new Date()),
        ),
        orderBy: [desc(schema.trip.departureTime)],
        limit: input.limit,
      });
    }),

  /**
   * Get a driver route by ID (public)
   */
  byId: publicProcedure
    .input(z.object({ id: z.uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.driverRoute.findFirst({
        where: eq(schema.driverRoute.id, input.id),
        with: {
          driver: true,
          trips: {
            orderBy: [desc(schema.trip.departureTime)],
            limit: 10,
            with: {
              bookings: {
                with: {
                  passenger: true,
                },
              },
            },
          },
        },
      });
    }),

  /**
   * Get all driver routes for the current user
   */
  myRoutes: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.driverRoute.findMany({
      where: eq(schema.driverRoute.driverId, ctx.session.user.id),
      orderBy: [desc(schema.driverRoute.createdAt)],
      with: {
        trips: {
          orderBy: [desc(schema.trip.departureTime)],
          limit: 5,
          with: {
            bookings: {
              with: {
                passenger: true,
              },
            },
          },
        },
      },
    });
  }),

  /**
   * Create a new driver route with an initial trip
   */
  create: protectedProcedure
    .input(
      CreateDriverRouteSchema.extend({
        departureTime: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { departureTime, ...routeData } = input;

      const [newRoute] = await ctx.db
        .insert(schema.driverRoute)
        .values({
          ...routeData,
          driverId: ctx.session.user.id,
        })
        .returning();

      if (!newRoute) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create driver route",
        });
      }

      // Create initial trip for the route
      const [newTrip] = await ctx.db
        .insert(schema.trip)
        .values({
          driverRouteId: newRoute.id,
          driverId: ctx.session.user.id,
          departureTime,
        })
        .returning();

      return { route: newRoute, trip: newTrip };
    }),

  /**
   * Update a driver route
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        data: z.object({
          // Origin
          fromPlaceId: z.string().min(1).optional(),
          fromName: z.string().min(1).max(256).optional(),
          fromAddress: z.string().max(500).optional(),
          fromLat: z.number().optional(),
          fromLng: z.number().optional(),

          // Destination
          toPlaceId: z.string().min(1).optional(),
          toName: z.string().min(1).max(256).optional(),
          toAddress: z.string().max(500).optional(),
          toLat: z.number().optional(),
          toLng: z.number().optional(),

          // Route geometry
          routeGeometry: routeGeometrySchema.optional(),
          distanceKm: z.number().optional(),
          durationMinutes: z.number().int().optional(),

          // Capacity & pricing
          seatsOffered: z.number().int().min(1).max(10).optional(),
          pricePerSeat: z.number().int().min(0).optional(),

          // Vehicle amenities
          luggageSize: z.enum(["small", "medium", "large"]).optional(),
          hasWinterTires: z.boolean().optional(),
          allowsBikes: z.boolean().optional(),
          allowsSkis: z.boolean().optional(),
          allowsPets: z.boolean().optional(),
          hasAC: z.boolean().optional(),
          hasPhoneCharging: z.boolean().optional(),

          // Recurrence
          rrule: z.string().optional(),
          baseTime: z.string().optional(),
          validFrom: z.coerce.date().optional(),
          validUntil: z.coerce.date().optional(),

          // Description
          description: z.string().max(1000).optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingRoute = await ctx.db.query.driverRoute.findFirst({
        where: and(
          eq(schema.driverRoute.id, input.id),
          eq(schema.driverRoute.driverId, ctx.session.user.id),
        ),
      });

      if (!existingRoute) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver route not found or you don't have permission",
        });
      }

      const [updatedRoute] = await ctx.db
        .update(schema.driverRoute)
        .set(input.data)
        .where(eq(schema.driverRoute.id, input.id))
        .returning();

      return updatedRoute;
    }),

  /**
   * Delete a driver route (only if no active trips)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingRoute = await ctx.db.query.driverRoute.findFirst({
        where: and(
          eq(schema.driverRoute.id, input.id),
          eq(schema.driverRoute.driverId, ctx.session.user.id),
        ),
        with: {
          trips: {
            where: eq(schema.trip.status, "scheduled"),
          },
        },
      });

      if (!existingRoute) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver route not found or you don't have permission",
        });
      }

      if (existingRoute.trips.length > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Cannot delete route with scheduled trips. Cancel or complete all trips first.",
        });
      }

      await ctx.db
        .delete(schema.driverRoute)
        .where(eq(schema.driverRoute.id, input.id));

      return { success: true };
    }),

  /**
   * Create a new trip for this driver route
   */
  createTrip: protectedProcedure
    .input(
      z.object({
        driverRouteId: z.uuid(),
        departureTime: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const route = await ctx.db.query.driverRoute.findFirst({
        where: and(
          eq(schema.driverRoute.id, input.driverRouteId),
          eq(schema.driverRoute.driverId, ctx.session.user.id),
        ),
      });

      if (!route) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver route not found or you don't have permission",
        });
      }

      const [newTrip] = await ctx.db
        .insert(schema.trip)
        .values({
          driverRouteId: input.driverRouteId,
          driverId: ctx.session.user.id,
          departureTime: input.departureTime,
        })
        .returning();

      return newTrip;
    }),

  /**
   * Get pending requests for a driver route
   */
  getRequests: protectedProcedure
    .input(
      z.object({
        driverRouteId: z.uuid(),
        status: z
          .enum(["pending", "accepted", "rejected", "cancelled"])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const route = await ctx.db.query.driverRoute.findFirst({
        where: and(
          eq(schema.driverRoute.id, input.driverRouteId),
          eq(schema.driverRoute.driverId, ctx.session.user.id),
        ),
      });

      if (!route) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Driver route not found or you don't have permission",
        });
      }

      const conditions = [
        eq(schema.passengerRequest.driverRouteId, input.driverRouteId),
      ];

      if (input.status) {
        conditions.push(eq(schema.passengerRequest.status, input.status));
      }

      return ctx.db.query.passengerRequest.findMany({
        where: and(...conditions),
        orderBy: [desc(schema.passengerRequest.createdAt)],
        with: {
          passenger: true,
          trip: true,
        },
      });
    }),

  /**
   * Accept a passenger request
   */
  acceptRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.uuid(),
        tripId: z.uuid().optional(), // Optional: assign to specific trip
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.query.passengerRequest.findFirst({
        where: eq(schema.passengerRequest.id, input.requestId),
        with: {
          driverRoute: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.driverRoute.driverId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to accept this request",
        });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Can only accept pending requests",
        });
      }

      // If tripId is provided, verify it belongs to this route and create a booking
      if (input.tripId) {
        const tripRecord = await ctx.db.query.trip.findFirst({
          where: and(
            eq(schema.trip.id, input.tripId),
            eq(schema.trip.driverRouteId, request.driverRouteId),
          ),
        });

        if (!tripRecord) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Trip not found or doesn't belong to this route",
          });
        }

        // Create booking
        await ctx.db.insert(schema.booking).values({
          tripId: input.tripId,
          passengerId: request.passengerId,
          passengerRequestId: request.id,
          pickupPlaceId: request.pickupPlaceId,
          pickupName: request.pickupName,
          pickupLat: request.pickupLat,
          pickupLng: request.pickupLng,
          dropoffPlaceId: request.dropoffPlaceId,
          dropoffName: request.dropoffName,
          dropoffLat: request.dropoffLat,
          dropoffLng: request.dropoffLng,
          seatsBooked: request.seatsRequested,
          pricePerSeat: request.driverRoute.pricePerSeat,
        });
      }

      // Update request status
      const [updatedRequest] = await ctx.db
        .update(schema.passengerRequest)
        .set({
          status: "accepted",
          tripId: input.tripId ?? request.tripId,
        })
        .where(eq(schema.passengerRequest.id, input.requestId))
        .returning();

      return updatedRequest;
    }),

  /**
   * Reject a passenger request
   */
  rejectRequest: protectedProcedure
    .input(z.object({ requestId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.query.passengerRequest.findFirst({
        where: eq(schema.passengerRequest.id, input.requestId),
        with: {
          driverRoute: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.driverRoute.driverId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to reject this request",
        });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Can only reject pending requests",
        });
      }

      const [updatedRequest] = await ctx.db
        .update(schema.passengerRequest)
        .set({ status: "rejected" })
        .where(eq(schema.passengerRequest.id, input.requestId))
        .returning();

      return updatedRequest;
    }),
} satisfies TRPCRouterRecord;
