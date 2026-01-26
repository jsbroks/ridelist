import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, eq } from "@app/db";
import { conversation, message, ride, rideRequest } from "@app/db/schema";

import { protectedProcedure } from "../trpc";

export const rideRequestRouter = {
  // Create a ride request with optional initial message
  create: protectedProcedure
    .input(
      z.object({
        rideId: z.string().uuid(),
        pickupPlaceId: z.string().optional(),
        pickupName: z.string().optional(),
        pickupLat: z.number().optional(),
        pickupLng: z.number().optional(),
        dropoffPlaceId: z.string().optional(),
        dropoffName: z.string().optional(),
        dropoffLat: z.number().optional(),
        dropoffLng: z.number().optional(),
        seatsRequested: z.number().int().min(1).max(10).default(1),
        message: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify the ride exists and is active
      const targetRide = await ctx.db.query.ride.findFirst({
        where: eq(ride.id, input.rideId),
      });

      if (!targetRide) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ride not found",
        });
      }

      if (targetRide.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This ride is no longer accepting requests",
        });
      }

      // Cannot request your own ride
      if (targetRide.driverId === userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot request your own ride",
        });
      }

      // Check if user already has a pending request for this ride
      const existingRequest = await ctx.db.query.rideRequest.findFirst({
        where: and(
          eq(rideRequest.rideId, input.rideId),
          eq(rideRequest.passengerId, userId),
          eq(rideRequest.status, "pending"),
        ),
      });

      if (existingRequest) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a pending request for this ride",
        });
      }

      // Check available seats
      if (targetRide.availableSeats < input.seatsRequested) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Only ${targetRide.availableSeats} seats available`,
        });
      }

      // Create ride request
      const [newRequest] = await ctx.db
        .insert(rideRequest)
        .values({
          rideId: input.rideId,
          passengerId: userId,
          pickupPlaceId: input.pickupPlaceId,
          pickupName: input.pickupName,
          pickupLat: input.pickupLat,
          pickupLng: input.pickupLng,
          dropoffPlaceId: input.dropoffPlaceId,
          dropoffName: input.dropoffName,
          dropoffLat: input.dropoffLat,
          dropoffLng: input.dropoffLng,
          seatsRequested: input.seatsRequested,
          message: input.message,
        })
        .returning();

      if (!newRequest) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create ride request",
        });
      }

      // Create conversation for this request
      const [newConversation] = await ctx.db
        .insert(conversation)
        .values({
          rideRequestId: newRequest.id,
        })
        .returning();

      // If there's an initial message, create it
      if (input.message && newConversation) {
        await ctx.db.insert(message).values({
          conversationId: newConversation.id,
          senderId: userId,
          content: input.message,
        });
      }

      return {
        request: newRequest,
        conversationId: newConversation?.id,
      };
    }),

  // Get requests made by the current user
  myRequests: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.rideRequest.findMany({
      where: eq(rideRequest.passengerId, ctx.session.user.id),
      orderBy: (rideRequest, { desc }) => [desc(rideRequest.createdAt)],
      with: {
        ride: {
          with: { driver: true },
        },
        conversation: true,
      },
    });
  }),

  // Get requests for a specific ride (driver only)
  forRide: protectedProcedure
    .input(z.object({ rideId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user is the driver
      const targetRide = await ctx.db.query.ride.findFirst({
        where: and(
          eq(ride.id, input.rideId),
          eq(ride.driverId, ctx.session.user.id),
        ),
      });

      if (!targetRide) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ride not found or you are not the driver",
        });
      }

      return ctx.db.query.rideRequest.findMany({
        where: eq(rideRequest.rideId, input.rideId),
        orderBy: (rideRequest, { desc }) => [desc(rideRequest.createdAt)],
        with: {
          passenger: true,
          conversation: true,
        },
      });
    }),

  // Accept a ride request (driver only)
  accept: protectedProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.query.rideRequest.findFirst({
        where: eq(rideRequest.id, input.requestId),
        with: { ride: true },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.ride.driverId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the driver can accept requests",
        });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request is no longer pending",
        });
      }

      if (request.ride.availableSeats < request.seatsRequested) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Not enough seats available",
        });
      }

      // Update request status
      const [updatedRequest] = await ctx.db
        .update(rideRequest)
        .set({
          status: "accepted",
          respondedAt: new Date(),
        })
        .where(eq(rideRequest.id, input.requestId))
        .returning();

      // Decrease available seats
      await ctx.db
        .update(ride)
        .set({
          availableSeats: request.ride.availableSeats - request.seatsRequested,
        })
        .where(eq(ride.id, request.rideId));

      return updatedRequest;
    }),

  // Reject a ride request (driver only)
  reject: protectedProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.query.rideRequest.findFirst({
        where: eq(rideRequest.id, input.requestId),
        with: { ride: true },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.ride.driverId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the driver can reject requests",
        });
      }

      if (request.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request is no longer pending",
        });
      }

      const [updatedRequest] = await ctx.db
        .update(rideRequest)
        .set({
          status: "rejected",
          respondedAt: new Date(),
        })
        .where(eq(rideRequest.id, input.requestId))
        .returning();

      return updatedRequest;
    }),

  // Cancel a ride request (passenger only)
  cancel: protectedProcedure
    .input(z.object({ requestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.query.rideRequest.findFirst({
        where: and(
          eq(rideRequest.id, input.requestId),
          eq(rideRequest.passengerId, ctx.session.user.id),
        ),
        with: { ride: true },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      if (request.status === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Request is already cancelled",
        });
      }

      // If request was accepted, restore seats
      if (request.status === "accepted") {
        await ctx.db
          .update(ride)
          .set({
            availableSeats:
              request.ride.availableSeats + request.seatsRequested,
          })
          .where(eq(ride.id, request.rideId));
      }

      const [updatedRequest] = await ctx.db
        .update(rideRequest)
        .set({ status: "cancelled" })
        .where(eq(rideRequest.id, input.requestId))
        .returning();

      return updatedRequest;
    }),
} satisfies TRPCRouterRecord;
