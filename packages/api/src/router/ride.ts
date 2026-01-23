import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, gte } from "@app/db";
import { CreateRideSchema, ride, rideStop } from "@app/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

// Schema for creating stops along with a ride
const CreateRideStopSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().min(1).max(256),
  address: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
});

const CreateRideWithStopsSchema = CreateRideSchema.extend({
  stops: z.array(CreateRideStopSchema).optional(),
});

export const rideRouter = {
  // Get all active rides (upcoming)
  list: publicProcedure
    .input(
      z
        .object({
          fromPlaceId: z.string().optional(),
          toPlaceId: z.string().optional(),
          limit: z.number().min(1).max(50).default(20),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      const now = new Date();
      return ctx.db.query.ride.findMany({
        where: and(
          eq(ride.status, "active"),
          gte(ride.departureTime, now),
          input?.fromPlaceId
            ? eq(ride.fromPlaceId, input.fromPlaceId)
            : undefined,
          input?.toPlaceId ? eq(ride.toPlaceId, input.toPlaceId) : undefined,
        ),
        orderBy: desc(ride.departureTime),
        limit: input?.limit ?? 20,
        with: {
          driver: true,
          stops: true,
        },
      });
    }),

  // Get a single ride by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.ride.findFirst({
        where: eq(ride.id, input.id),
        with: {
          driver: true,
          stops: {
            orderBy: (stops, { asc }) => [asc(stops.orderIndex)],
          },
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
        stops: true,
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
    .input(CreateRideWithStopsSchema)
    .mutation(async ({ ctx, input }) => {
      const { stops, ...rideData } = input;

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

      // Insert stops if provided
      if (stops && stops.length > 0) {
        await ctx.db.insert(rideStop).values(
          stops.map((stop, index) => ({
            rideId: newRide.id,
            placeId: stop.placeId,
            name: stop.name,
            address: stop.address,
            lat: stop.lat,
            lng: stop.lng,
            orderIndex: index,
          })),
        );
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
