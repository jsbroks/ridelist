import type { TRPCRouterRecord } from "@trpc/server";
import * as turf from "@turf/turf";
import { z } from "zod/v4";

import { and, asc, desc, eq, gte, lte, or } from "@app/db";
import { CreateRideSchema, ride } from "@app/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

const latLng = z.object({
  lat: z.number(),
  lng: z.number(),
});

// Pre-filter radius in degrees (~100km)
// 1 degree latitude ≈ 111km, so 100km ≈ 0.9 degrees
const PREFILTER_DEGREES = 0.9;

/**
 * Check if a point is within ~100km of either the ride's start or end point
 * This is a rough bounding box filter to reduce results before expensive Turf.js calculations
 */
function isPointNearEndpoints(pointLat: number, pointLng: number) {
  return or(
    // Near start point
    and(
      gte(ride.fromLat, pointLat - PREFILTER_DEGREES),
      lte(ride.fromLat, pointLat + PREFILTER_DEGREES),
      gte(ride.fromLng, pointLng - PREFILTER_DEGREES),
      lte(ride.fromLng, pointLng + PREFILTER_DEGREES),
    ),
    // Near end point
    and(
      gte(ride.toLat, pointLat - PREFILTER_DEGREES),
      lte(ride.toLat, pointLat + PREFILTER_DEGREES),
      gte(ride.toLng, pointLng - PREFILTER_DEGREES),
      lte(ride.toLng, pointLng + PREFILTER_DEGREES),
    ),
  );
}

export const rideRouter = {
  // Search for rides along a route (finds rides passing near pickup/dropoff locations)
  search: publicProcedure
    .input(
      z.object({
        // User's pickup location
        pickup: latLng,
        // User's dropoff location (optional)
        dropoff: latLng,
        // Search radius in kilometers
        radiusKm: z.number().min(1).max(50).default(10),
        // Date filter (only show rides on or after this date)
        date: z.coerce.date().optional(),
        // Max results
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const searchDate = input.date ?? new Date();

      // Fetch active rides, pre-filtered by bounding box around endpoints
      // This reduces the dataset before expensive Turf.js calculations
      const rides = await ctx.db.query.ride.findMany({
        where: and(
          eq(ride.status, "active"),
          gte(ride.departureTime, searchDate),
          // Pickup must be within ~100km of ride's start or end
          isPointNearEndpoints(input.pickup.lat, input.pickup.lng),
          // Dropoff must be within ~100km of ride's start or end
          isPointNearEndpoints(input.dropoff.lat, input.dropoff.lng),
        ),
        orderBy: asc(ride.departureTime),
        with: { driver: true },
      });

      // Filter rides by proximity to the route and direction using Turf.js
      const matchingRides = rides
        .map((r) => {
          const line = turf.lineString(r.routeGeometry.coordinates);
          const pickupPoint = turf.point([input.pickup.lng, input.pickup.lat]);
          const dropoffPoint = turf.point([
            input.dropoff.lng,
            input.dropoff.lat,
          ]);

          // Find nearest points on the route and their distances
          const pickupNearest = turf.nearestPointOnLine(line, pickupPoint, {
            units: "kilometers",
          });
          const dropoffNearest = turf.nearestPointOnLine(line, dropoffPoint, {
            units: "kilometers",
          });

          // Distance from route (perpendicular)
          const pickupDistanceKm =
            Math.round(pickupNearest.properties.dist * 10) / 10;
          const dropoffDistanceKm =
            Math.round(dropoffNearest.properties.dist * 10) / 10;

          // Position along the route (from start)
          const pickupAlongRouteKm = pickupNearest.properties.location;
          const dropoffAlongRouteKm = dropoffNearest.properties.location;

          return {
            ...r,
            pickupDistanceKm,
            dropoffDistanceKm,
            pickupAlongRouteKm,
            dropoffAlongRouteKm,
          };
        })
        .filter(
          ({
            pickupDistanceKm,
            dropoffDistanceKm,
            pickupAlongRouteKm,
            dropoffAlongRouteKm,
          }) => {
            // Both pickup and dropoff must be within radius
            if (pickupDistanceKm > input.radiusKm) return false;
            if (dropoffDistanceKm > input.radiusKm) return false;
            // Pickup must come before dropoff along the route (same direction)
            if (pickupAlongRouteKm >= dropoffAlongRouteKm) return false;
            return true;
          },
        )
        // Sort by closest pickup distance
        .sort((a, b) => a.pickupDistanceKm - b.pickupDistanceKm)
        .slice(0, input.limit);

      return matchingRides;
    }),

  // Get a single ride by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.ride.findFirst({
        where: eq(ride.id, input.id),
        with: {
          driver: true,
          requests: true,
        },
      });
    }),

  // Get rides posted by the current user
  myRides: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.ride.findMany({
      where: eq(ride.driverId, ctx.session.user.id),
      orderBy: desc(ride.departureTime),
      with: {
        requests: {
          with: {
            passenger: true,
          },
        },
      },
    });
  }),

  // Create a new ride
  create: protectedProcedure
    .input(CreateRideSchema)
    .mutation(async ({ ctx, input }) => {
      const { ...rideData } = input;

      // Insert the ride
      const [newRide] = await ctx.db
        .insert(ride)
        .values({
          ...rideData,
          driverId: ctx.session.user.id,
          availableSeats: rideData.totalSeats ?? 3,
        })
        .returning();

      if (!newRide) {
        throw new Error("Failed to create ride");
      }

      return newRide;
    }),

  // Update a ride (only by the driver)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: CreateRideSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingRide = await ctx.db.query.ride.findFirst({
        where: and(
          eq(ride.id, input.id),
          eq(ride.driverId, ctx.session.user.id),
        ),
      });

      if (!existingRide) {
        throw new Error(
          "Ride not found or you don't have permission to update it",
        );
      }

      const [updatedRide] = await ctx.db
        .update(ride)
        .set(input.data)
        .where(eq(ride.id, input.id))
        .returning();

      return updatedRide;
    }),

  // Cancel a ride (only by the driver)
  cancel: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingRide = await ctx.db.query.ride.findFirst({
        where: and(
          eq(ride.id, input.id),
          eq(ride.driverId, ctx.session.user.id),
        ),
      });

      if (!existingRide) {
        throw new Error(
          "Ride not found or you don't have permission to cancel it",
        );
      }

      const [cancelledRide] = await ctx.db
        .update(ride)
        .set({ status: "cancelled" })
        .where(eq(ride.id, input.id))
        .returning();

      return cancelledRide;
    }),

  // Delete a ride (only by the driver, only if no accepted requests)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingRide = await ctx.db.query.ride.findFirst({
        where: and(
          eq(ride.id, input.id),
          eq(ride.driverId, ctx.session.user.id),
        ),
        with: {
          requests: true,
        },
      });

      if (!existingRide) {
        throw new Error(
          "Ride not found or you don't have permission to delete it",
        );
      }

      const hasAcceptedRequests = existingRide.requests.some(
        (r) => r.status === "accepted",
      );

      if (hasAcceptedRequests) {
        throw new Error(
          "Cannot delete ride with accepted requests. Cancel it instead.",
        );
      }

      await ctx.db.delete(ride).where(eq(ride.id, input.id));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
