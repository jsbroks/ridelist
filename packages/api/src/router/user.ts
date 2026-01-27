import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, count, eq } from "@app/db";
import * as schema from "@app/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = {
  // Get a user by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userData = await ctx.db.query.user.findFirst({
        where: eq(schema.user.id, input.id),
      });

      if (!userData) {
        return null;
      }

      return {
        id: userData.id,
        name: userData.name,
        image: userData.image,
        bio: userData.bio,
        createdAt: userData.createdAt,
      };
    }),

  // Get profile stats for a user
  profileStats: publicProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [tripsJoinedCount] = await ctx.db
        .select({ count: count() })
        .from(schema.passengerRoute)
        .where(eq(schema.passengerRoute.passengerId, input.userId));

      // Count rides completed as driver
      const [completedAsDriverCount] = await ctx.db
        .select({ count: count() })
        .from(schema.trip)
        .where(
          and(
            eq(schema.trip.driverId, input.userId),
            eq(schema.trip.status, "completed"),
          ),
        );

      return {
        tripsCompletedAsDriver: completedAsDriverCount?.count ?? 0,
        tripsJoined: tripsJoinedCount?.count ?? 0,
      };
    }),

  // Get listed (active) rides for a user
  listedTrips: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const trips = await ctx.db.query.trip.findMany({
        where: and(
          eq(schema.trip.driverId, input.userId),
          eq(schema.trip.status, "scheduled"),
        ),
        orderBy: (trip, { asc }) => [asc(trip.departureTime)],
        limit: input.limit,
      });

      return trips;
    }),

  // Get completed trips for a user (as driver or passenger)
  completedTrips: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get rides completed as driver
      const driverTrips = await ctx.db.query.trip.findMany({
        where: and(
          eq(schema.trip.driverId, input.userId),
          eq(schema.trip.status, "completed"),
        ),
        orderBy: (trip, { desc }) => [desc(trip.departureTime)],
        limit: input.limit,
      });

      // Get rides completed as passenger
      const passengerTrips = await ctx.db.query.trip.findMany({
        where: eq(schema.trip.driverId, input.userId),
        with: {
          driverRoute: true,
          bookings: {
            where: and(
              eq(schema.booking.passengerId, input.userId),
              eq(schema.booking.status, "completed"),
            ),
            with: {
              passenger: true,
            },
          },
        },
      });

      // Combine and sort by departure time
      const allRides = [
        ...driverTrips.map((r) => ({ ...r, role: "driver" as const })),
        ...passengerTrips.map((r) => ({ ...r, role: "passenger" as const })),
      ]
        .sort(
          (a, b) =>
            new Date(b.departureTime).getTime() -
            new Date(a.departureTime).getTime(),
        )
        .slice(0, input.limit);

      return allRides;
    }),

  // Update current user's profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        image: z.string().url().optional(),
        bio: z.string().max(500).optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await ctx.db
        .update(schema.user)
        .set(input)
        .where(eq(schema.user.id, ctx.session.user.id))
        .returning();

      return updatedUser;
    }),

  // Get current user's privacy settings
  getPrivacySettings: protectedProcedure.query(async ({ ctx }) => {
    const userData = await ctx.db.query.user.findFirst({
      where: eq(schema.user.id, ctx.session.user.id),
      columns: {
        showPhoneNumber: true,
        phoneNumber: true,
      },
    });

    return {
      showPhoneNumber: userData?.showPhoneNumber ?? false,
      hasPhoneNumber: !!userData?.phoneNumber,
    };
  }),

  // Update current user's privacy settings
  updatePrivacySettings: protectedProcedure
    .input(
      z.object({
        showPhoneNumber: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await ctx.db
        .update(schema.user)
        .set({ showPhoneNumber: input.showPhoneNumber })
        .where(eq(schema.user.id, ctx.session.user.id))
        .returning({
          showPhoneNumber: schema.user.showPhoneNumber,
        });

      return updatedUser;
    }),

  // Update current user's phone number
  updatePhoneNumber: protectedProcedure
    .input(
      z.object({
        phoneNumber: z.string().max(20).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await ctx.db
        .update(schema.user)
        .set({ phoneNumber: input.phoneNumber })
        .where(eq(schema.user.id, ctx.session.user.id))
        .returning({
          phoneNumber: schema.user.phoneNumber,
        });

      return updatedUser;
    }),
} satisfies TRPCRouterRecord;
