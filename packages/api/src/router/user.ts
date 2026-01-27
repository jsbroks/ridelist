import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, count, eq } from "@app/db";
import { ride, rideRequest, user } from "@app/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = {
  // Get a user by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userData = await ctx.db.query.user.findFirst({
        where: eq(user.id, input.id),
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
      // Count rides posted by user
      const [postedCount] = await ctx.db
        .select({ count: count() })
        .from(ride)
        .where(eq(ride.driverId, input.userId));

      // Count rides completed as driver
      const [completedAsDriverCount] = await ctx.db
        .select({ count: count() })
        .from(ride)
        .where(
          and(eq(ride.driverId, input.userId), eq(ride.status, "completed")),
        );

      // Count rides joined as passenger (accepted requests)
      const [joinedCount] = await ctx.db
        .select({ count: count() })
        .from(rideRequest)
        .where(
          and(
            eq(rideRequest.passengerId, input.userId),
            eq(rideRequest.status, "accepted"),
          ),
        );

      return {
        ridesPosted: postedCount?.count ?? 0,
        ridesCompletedAsDriver: completedAsDriverCount?.count ?? 0,
        ridesJoined: joinedCount?.count ?? 0,
      };
    }),

  // Get listed (active) rides for a user
  listedRides: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const rides = await ctx.db.query.ride.findMany({
        where: and(eq(ride.driverId, input.userId), eq(ride.status, "active")),
        orderBy: (ride, { asc }) => [asc(ride.departureTime)],
        limit: input.limit,
      });

      return rides;
    }),

  // Get completed rides for a user (as driver or passenger)
  completedRides: publicProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get rides completed as driver
      const driverRides = await ctx.db.query.ride.findMany({
        where: and(
          eq(ride.driverId, input.userId),
          eq(ride.status, "completed"),
        ),
        orderBy: (ride, { desc }) => [desc(ride.departureTime)],
        limit: input.limit,
      });

      // Get rides completed as passenger
      const passengerRequests = await ctx.db.query.rideRequest.findMany({
        where: and(
          eq(rideRequest.passengerId, input.userId),
          eq(rideRequest.status, "accepted"),
        ),
        with: {
          ride: true,
        },
        limit: input.limit,
      });

      const passengerRides = passengerRequests
        .filter((r) => r.ride.status === "completed")
        .map((r) => ({
          ...r.ride,
          role: "passenger" as const,
        }));

      // Combine and sort by departure time
      const allRides = [
        ...driverRides.map((r) => ({ ...r, role: "driver" as const })),
        ...passengerRides,
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
        .update(user)
        .set(input)
        .where(eq(user.id, ctx.session.user.id))
        .returning();

      return updatedUser;
    }),

  // Update current user's bio
  updateBio: protectedProcedure
    .input(
      z.object({
        bio: z.string().max(500).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updatedUser] = await ctx.db
        .update(user)
        .set({ bio: input.bio })
        .where(eq(user.id, ctx.session.user.id))
        .returning();

      return updatedUser;
    }),

  // Get current user's privacy settings
  getPrivacySettings: protectedProcedure.query(async ({ ctx }) => {
    const userData = await ctx.db.query.user.findFirst({
      where: eq(user.id, ctx.session.user.id),
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
        .update(user)
        .set({ showPhoneNumber: input.showPhoneNumber })
        .where(eq(user.id, ctx.session.user.id))
        .returning({
          showPhoneNumber: user.showPhoneNumber,
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
        .update(user)
        .set({ phoneNumber: input.phoneNumber })
        .where(eq(user.id, ctx.session.user.id))
        .returning({
          phoneNumber: user.phoneNumber,
        });

      return updatedUser;
    }),
} satisfies TRPCRouterRecord;
