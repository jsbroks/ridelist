import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, gte } from "@app/db";
import * as schema from "@app/db/schema";

import { protectedProcedure } from "../trpc";

export const tripRouter = {
  /**
   * Get a trip by ID
   */
  byId: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.trip.findFirst({
        where: eq(schema.trip.id, input.id),
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
   * Get trips for a driver route
   */
  byDriverRoute: protectedProcedure
    .input(
      z.object({
        driverRouteId: z.uuid(),
        status: z
          .enum(["scheduled", "in_progress", "completed", "cancelled"])
          .optional(),
        upcoming: z.boolean().optional(),
      }),
    )
    .query(({ ctx, input }) => {
      const conditions = [eq(schema.trip.driverRouteId, input.driverRouteId)];

      if (input.status) {
        conditions.push(eq(schema.trip.status, input.status));
      }

      if (input.upcoming) {
        conditions.push(gte(schema.trip.departureTime, new Date()));
      }

      return ctx.db.query.trip.findMany({
        where: and(...conditions),
        orderBy: [desc(schema.trip.departureTime)],
        with: {
          driver: true,
          bookings: {
            with: {
              passenger: true,
            },
          },
        },
      });
    }),

  /**
   * Get trips for the current user (as driver)
   */
  myTrips: protectedProcedure
    .input(
      z
        .object({
          status: z
            .enum(["scheduled", "in_progress", "completed", "cancelled"])
            .optional(),
          upcoming: z.boolean().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => {
      const conditions = [eq(schema.trip.driverId, ctx.session.user.id)];

      if (input?.status) {
        conditions.push(eq(schema.trip.status, input.status));
      }

      if (input?.upcoming) {
        conditions.push(gte(schema.trip.departureTime, new Date()));
      }

      return ctx.db.query.trip.findMany({
        where: and(...conditions),
        orderBy: [desc(schema.trip.departureTime)],
        with: {
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
   * Update a trip (only by the driver)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        data: z.object({
          departureTime: z.coerce.date().optional(),
          seatsAvailable: z.number().int().min(0).max(10).optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingTrip = await ctx.db.query.trip.findFirst({
        where: and(
          eq(schema.trip.id, input.id),
          eq(schema.trip.driverId, ctx.session.user.id),
        ),
      });

      if (!existingTrip) {
        throw new Error(
          "Trip not found or you don't have permission to update it",
        );
      }

      if (existingTrip.status !== "scheduled") {
        throw new Error("Can only update scheduled trips");
      }

      const [updatedTrip] = await ctx.db
        .update(schema.trip)
        .set(input.data)
        .where(eq(schema.trip.id, input.id))
        .returning();

      return updatedTrip;
    }),

  /**
   * Start a trip (mark as in progress)
   */
  start: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingTrip = await ctx.db.query.trip.findFirst({
        where: and(
          eq(schema.trip.id, input.id),
          eq(schema.trip.driverId, ctx.session.user.id),
        ),
      });

      if (!existingTrip) {
        throw new Error("Trip not found or you don't have permission");
      }

      if (existingTrip.status !== "scheduled") {
        throw new Error("Can only start scheduled trips");
      }

      const [updatedTrip] = await ctx.db
        .update(schema.trip)
        .set({
          status: "in_progress",
          actualDepartureTime: new Date(),
        })
        .where(eq(schema.trip.id, input.id))
        .returning();

      return updatedTrip;
    }),

  /**
   * Complete a trip
   */
  complete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingTrip = await ctx.db.query.trip.findFirst({
        where: and(
          eq(schema.trip.id, input.id),
          eq(schema.trip.driverId, ctx.session.user.id),
        ),
      });

      if (!existingTrip) {
        throw new Error("Trip not found or you don't have permission");
      }

      if (existingTrip.status !== "in_progress") {
        throw new Error("Can only complete trips that are in progress");
      }

      const [updatedTrip] = await ctx.db
        .update(schema.trip)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(schema.trip.id, input.id))
        .returning();

      // Also mark all confirmed bookings as completed
      await ctx.db
        .update(schema.booking)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(
          and(
            eq(schema.booking.tripId, input.id),
            eq(schema.booking.status, "confirmed"),
          ),
        );

      return updatedTrip;
    }),

  /**
   * Cancel a trip (only by the driver, only if scheduled)
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existingTrip = await ctx.db.query.trip.findFirst({
        where: and(
          eq(schema.trip.id, input.id),
          eq(schema.trip.driverId, ctx.session.user.id),
        ),
      });

      if (!existingTrip)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found or you don't have permission",
        });

      const [cancelledTrip] = await ctx.db
        .update(schema.trip)
        .set({ status: "cancelled" })
        .where(eq(schema.trip.id, input.id))
        .returning();

      // Also cancel all confirmed bookings
      await ctx.db
        .update(schema.booking)
        .set({ status: "cancelled_by_driver" })
        .where(
          and(
            eq(schema.booking.tripId, input.id),
            eq(schema.booking.status, "confirmed"),
          ),
        );

      return cancelledTrip;
    }),
} satisfies TRPCRouterRecord;
