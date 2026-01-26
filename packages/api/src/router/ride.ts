import type { TRPCRouterRecord } from "@trpc/server";
import { decode } from "@googlemaps/polyline-codec";
import * as turf from "@turf/turf";
import { z } from "zod/v4";

import { and, asc, desc, eq, gte } from "@app/db";
import { CreateRideSchema, ride } from "@app/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

/**
 * Calculate distance from a point to a decoded polyline route
 * Returns distance in kilometers
 */
function getDistanceToRoute(
  lat: number,
  lng: number,
  routePolyline: string,
): number {
  const decoded = decode(routePolyline);
  // Turf expects [lng, lat] format (GeoJSON standard)
  const line = turf.lineString(decoded.map(([pLat, pLng]) => [pLng, pLat]));
  const point = turf.point([lng, lat]);
  return turf.pointToLineDistance(point, line, { units: "kilometers" });
}

export const rideRouter = {
  // Search for rides along a route (finds rides passing near pickup/dropoff locations)
  search: publicProcedure
    .input(
      z.object({
        // User's pickup location
        pickupLat: z.number(),
        pickupLng: z.number(),
        // User's dropoff location (optional)
        dropoffLat: z.number().optional(),
        dropoffLng: z.number().optional(),
        // Search radius in kilometers
        radiusKm: z.number().min(1).max(50).default(15),
        // Date filter (only show rides on or after this date)
        date: z.coerce.date().optional(),
        // Max results
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const searchDate = input.date ?? new Date();

      // Fetch active rides with polylines
      const rides = await ctx.db.query.ride.findMany({
        where: and(
          eq(ride.status, "active"),
          gte(ride.departureTime, searchDate),
        ),
        orderBy: asc(ride.departureTime),
        with: {
          driver: true,
        },
      });

      // Filter rides by proximity to the route using Turf.js
      const ridesWithPolyline = rides.filter(
        (r): r is typeof r & { routePolyline: string } => !!r.routePolyline,
      );

      const matchingRides = ridesWithPolyline
        .map((r) => {
          const pickupDistance = getDistanceToRoute(
            input.pickupLat,
            input.pickupLng,
            r.routePolyline,
          );

          // Calculate dropoff distance if provided
          let dropoffDistance: number | undefined;
          if (
            input.dropoffLat !== undefined &&
            input.dropoffLng !== undefined
          ) {
            dropoffDistance = getDistanceToRoute(
              input.dropoffLat,
              input.dropoffLng,
              r.routePolyline,
            );
          }

          return {
            ...r,
            pickupDistanceKm: Math.round(pickupDistance * 10) / 10,
            dropoffDistanceKm: dropoffDistance
              ? Math.round(dropoffDistance * 10) / 10
              : undefined,
          };
        })
        .filter(({ pickupDistanceKm, dropoffDistanceKm }) => {
          // Pickup must be within radius
          if (pickupDistanceKm > input.radiusKm) return false;
          // If dropoff specified, it must also be within radius
          if (
            dropoffDistanceKm !== undefined &&
            dropoffDistanceKm > input.radiusKm
          ) {
            return false;
          }
          return true;
        })
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
