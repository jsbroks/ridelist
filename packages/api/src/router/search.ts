import type { TRPCRouterRecord } from "@trpc/server";
import * as turf from "@turf/turf";
import { z } from "zod/v4";

import { and, eq, gte } from "@app/db";
import { driverRoute, passengerRoute, trip } from "@app/db/schema";

import { publicProcedure } from "../trpc";

const latLng = z.object({
  lat: z.number(),
  lng: z.number(),
});

const routeGeometrySchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

export const searchRouter = {
  /**
   * Search for upcoming trips (for passengers looking for a ride)
   * Finds trips on driver routes that pass near the passenger's pickup and dropoff locations
   */
  findDrivers: publicProcedure
    .input(
      z.object({
        pickup: latLng,
        dropoff: latLng,
        radiusKm: z.number().min(1).max(50).default(10),
        date: z.coerce.date().optional(),
        minSeats: z.number().min(1).max(10).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const searchDate = input.date ?? new Date();

      // Fetch scheduled trips with available seats
      const trips = await ctx.db.query.trip.findMany({
        where: and(
          eq(trip.status, "scheduled"),
          gte(trip.departureTime, searchDate),
        ),
        with: {
          driverRoute: true,
          driver: true,
        },
      });

      // Filter trips by route proximity using Turf.js
      const matchingTrips = trips
        .filter((t) => t.status === "scheduled")
        .map((t) => {
          const line = turf.lineString(t.driverRoute.routeGeometry.coordinates);
          const pickupPoint = turf.point([input.pickup.lng, input.pickup.lat]);
          const dropoffPoint = turf.point([
            input.dropoff.lng,
            input.dropoff.lat,
          ]);

          // Find nearest points on the route
          const pickupNearest = turf.nearestPointOnLine(line, pickupPoint, {
            units: "kilometers",
          });
          const dropoffNearest = turf.nearestPointOnLine(line, dropoffPoint, {
            units: "kilometers",
          });

          const pickupDistanceKm =
            Math.round(pickupNearest.properties.dist * 10) / 10;
          const dropoffDistanceKm =
            Math.round(dropoffNearest.properties.dist * 10) / 10;
          const pickupAlongRouteKm = pickupNearest.properties.location;
          const dropoffAlongRouteKm = dropoffNearest.properties.location;

          return {
            ...t,
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
        .sort((a, b) => a.pickupDistanceKm - b.pickupDistanceKm)
        .slice(0, input.limit);

      return matchingTrips;
    }),

  /**
   * Search for passenger routes along a driver's route
   * Finds passengers whose origin and destination fall along the driver's route
   */
  findPassengers: publicProcedure
    .input(
      z.object({
        // Driver's route geometry
        routeGeometry: routeGeometrySchema,

        // Search radius - how far from the route a passenger can be
        radiusKm: z.number().min(1).max(50).default(10),
        date: z.coerce.date().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const searchDate = input.date ?? new Date();

      // Fetch active passenger routes
      const passengerRoutes = await ctx.db.query.passengerRoute.findMany({
        where: and(
          eq(passengerRoute.status, "active"),
          gte(passengerRoute.departureTime, searchDate),
        ),
        with: {
          passenger: true,
        },
      });

      // Create driver's route line
      const driverLine = turf.lineString(input.routeGeometry.coordinates);

      // Find passengers along the route
      const matchingRoutes = passengerRoutes
        .map((pr) => {
          // Passenger's origin and destination points
          const originPoint = turf.point([pr.fromLng, pr.fromLat]);
          const destinationPoint = turf.point([pr.toLng, pr.toLat]);

          // Find nearest points on the driver's route
          const originNearest = turf.nearestPointOnLine(
            driverLine,
            originPoint,
            { units: "kilometers" },
          );
          const destinationNearest = turf.nearestPointOnLine(
            driverLine,
            destinationPoint,
            { units: "kilometers" },
          );

          // Distance from route (perpendicular)
          const originDistanceKm =
            Math.round(originNearest.properties.dist * 10) / 10;
          const destinationDistanceKm =
            Math.round(destinationNearest.properties.dist * 10) / 10;

          // Position along the driver's route
          const originAlongRouteKm = originNearest.properties.location;
          const destinationAlongRouteKm =
            destinationNearest.properties.location;

          return {
            ...pr,
            originDistanceKm,
            destinationDistanceKm,
            originAlongRouteKm,
            destinationAlongRouteKm,
          };
        })
        .filter(
          ({
            originDistanceKm,
            destinationDistanceKm,
            originAlongRouteKm,
            destinationAlongRouteKm,
          }) => {
            // Both origin and destination must be within radius of the route
            if (originDistanceKm > input.radiusKm) return false;
            if (destinationDistanceKm > input.radiusKm) return false;
            // Passenger's origin must come before destination along the route (same direction)
            if (originAlongRouteKm >= destinationAlongRouteKm) return false;
            return true;
          },
        )
        // Sort by origin position along route (passengers to pick up first)
        .sort((a, b) => a.originAlongRouteKm - b.originAlongRouteKm)
        .slice(0, input.limit);

      return matchingRoutes;
    }),

  /**
   * Get a driver route by ID with its trips
   */
  driverRouteById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.driverRoute.findFirst({
        where: eq(driverRoute.id, input.id),
        with: {
          driver: true,
          trips: {
            with: {
              bookings: {
                with: {
                  passenger: true,
                },
              },
            },
          },
          requests: {
            with: {
              passenger: true,
            },
          },
        },
      });
    }),

  /**
   * Get a trip by ID
   */
  tripById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.trip.findFirst({
        where: eq(trip.id, input.id),
        with: {
          driver: true,
          driverRoute: true,
          bookings: {
            with: {
              passenger: true,
            },
          },
        },
      });
    }),

  /**
   * Get a passenger route by ID
   */
  passengerRouteById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.passengerRoute.findFirst({
        where: eq(passengerRoute.id, input.id),
        with: {
          passenger: true,
          offers: {
            with: {
              driver: true,
            },
          },
        },
      });
    }),
} satisfies TRPCRouterRecord;
