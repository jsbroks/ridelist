import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, asc, desc, eq, gte, lte, or } from "@app/db";
import { CreateRideWantedSchema, rideWanted } from "@app/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

// Pre-filter radius in degrees (~100km)
const PREFILTER_DEGREES = 0.9;

/**
 * Check if a point is within ~100km of either the ride wanted's start or end point
 */
function isPointNearEndpoints(pointLat: number, pointLng: number) {
  return or(
    // Near origin point
    and(
      gte(rideWanted.fromLat, pointLat - PREFILTER_DEGREES),
      lte(rideWanted.fromLat, pointLat + PREFILTER_DEGREES),
      gte(rideWanted.fromLng, pointLng - PREFILTER_DEGREES),
      lte(rideWanted.fromLng, pointLng + PREFILTER_DEGREES),
    ),
    // Near destination point
    and(
      gte(rideWanted.toLat, pointLat - PREFILTER_DEGREES),
      lte(rideWanted.toLat, pointLat + PREFILTER_DEGREES),
      gte(rideWanted.toLng, pointLng - PREFILTER_DEGREES),
      lte(rideWanted.toLng, pointLng + PREFILTER_DEGREES),
    ),
  );
}

export const rideWantedRouter = {
  // List all active ride wanted posts
  list: publicProcedure
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

      const requests = await ctx.db.query.rideWanted.findMany({
        where: and(
          eq(rideWanted.status, "active"),
          gte(rideWanted.departureTime, new Date()),
        ),
        orderBy: asc(rideWanted.departureTime),
        limit: limit + 1,
        with: { passenger: true },
      });

      let nextCursor: string | undefined = undefined;
      if (requests.length > limit) {
        const nextItem = requests.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: requests,
        nextCursor,
      };
    }),

  // Search for ride wanted posts along a route
  search: publicProcedure
    .input(
      z.object({
        // Driver's starting point
        from: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        // Driver's destination
        to: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        // Search radius in kilometers
        radiusKm: z.number().min(1).max(100).default(25),
        // Date filter
        date: z.coerce.date().optional(),
        // Max results
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const searchDate = input.date ?? new Date();

      // Fetch active ride wanted posts, pre-filtered by bounding box
      const requests = await ctx.db.query.rideWanted.findMany({
        where: and(
          eq(rideWanted.status, "active"),
          gte(rideWanted.departureTime, searchDate),
          // Passenger's origin should be near driver's route
          isPointNearEndpoints(input.from.lat, input.from.lng),
          isPointNearEndpoints(input.to.lat, input.to.lng),
        ),
        orderBy: asc(rideWanted.departureTime),
        with: { passenger: true },
      });

      // Calculate distances and filter
      const matchingRequests = requests
        .map((r) => {
          // Simple distance calculation (Haversine approximation)
          const fromDistanceKm = haversineDistance(
            input.from.lat,
            input.from.lng,
            r.fromLat,
            r.fromLng,
          );
          const toDistanceKm = haversineDistance(
            input.to.lat,
            input.to.lng,
            r.toLat,
            r.toLng,
          );

          return {
            ...r,
            fromDistanceKm: Math.round(fromDistanceKm * 10) / 10,
            toDistanceKm: Math.round(toDistanceKm * 10) / 10,
          };
        })
        .filter(({ fromDistanceKm, toDistanceKm }) => {
          // Both origin and destination must be within radius
          return fromDistanceKm <= input.radiusKm && toDistanceKm <= input.radiusKm;
        })
        .sort((a, b) => a.fromDistanceKm - b.fromDistanceKm)
        .slice(0, input.limit);

      return matchingRequests;
    }),

  // Get a single ride wanted by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.rideWanted.findFirst({
        where: eq(rideWanted.id, input.id),
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

  // Get ride wanted posts by the current user
  myPosts: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.rideWanted.findMany({
      where: eq(rideWanted.passengerId, ctx.session.user.id),
      orderBy: desc(rideWanted.departureTime),
      with: {
        offers: {
          with: {
            driver: true,
          },
        },
      },
    });
  }),

  // Create a new ride wanted post
  create: protectedProcedure
    .input(CreateRideWantedSchema)
    .mutation(async ({ ctx, input }) => {
      const [newRideWanted] = await ctx.db
        .insert(rideWanted)
        .values({
          ...input,
          passengerId: ctx.session.user.id,
        })
        .returning();

      if (!newRideWanted) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create ride wanted post",
        });
      }

      return newRideWanted;
    }),

  // Update a ride wanted post (only by the passenger)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: CreateRideWantedSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.rideWanted.findFirst({
        where: and(
          eq(rideWanted.id, input.id),
          eq(rideWanted.passengerId, ctx.session.user.id),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ride wanted post not found or you don't have permission to update it",
        });
      }

      const [updated] = await ctx.db
        .update(rideWanted)
        .set(input.data)
        .where(eq(rideWanted.id, input.id))
        .returning();

      return updated;
    }),

  // Cancel a ride wanted post (only by the passenger)
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.rideWanted.findFirst({
        where: and(
          eq(rideWanted.id, input.id),
          eq(rideWanted.passengerId, ctx.session.user.id),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ride wanted post not found or you don't have permission to cancel it",
        });
      }

      const [cancelled] = await ctx.db
        .update(rideWanted)
        .set({ status: "cancelled" })
        .where(eq(rideWanted.id, input.id))
        .returning();

      return cancelled;
    }),

  // Delete a ride wanted post (only by the passenger, only if no accepted offers)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.rideWanted.findFirst({
        where: and(
          eq(rideWanted.id, input.id),
          eq(rideWanted.passengerId, ctx.session.user.id),
        ),
        with: {
          offers: true,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ride wanted post not found or you don't have permission to delete it",
        });
      }

      const hasAcceptedOffers = existing.offers.some((o) => o.status === "accepted");

      if (hasAcceptedOffers) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete ride wanted with accepted offers. Cancel it instead.",
        });
      }

      await ctx.db.delete(rideWanted).where(eq(rideWanted.id, input.id));

      return { success: true };
    }),
} satisfies TRPCRouterRecord;

// Helper function to calculate distance between two points using Haversine formula
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
