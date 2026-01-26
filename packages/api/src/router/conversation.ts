import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, isNull, ne } from "@app/db";
import { conversation, message, ride, rideRequest } from "@app/db/schema";

import { protectedProcedure } from "../trpc";

export const conversationRouter = {
  // Get or create a conversation for a ride request
  getOrCreate: protectedProcedure
    .input(z.object({ rideRequestId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the user is part of this ride request (driver or passenger)
      const request = await ctx.db.query.rideRequest.findFirst({
        where: eq(rideRequest.id, input.rideRequestId),
        with: { ride: true },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ride request not found",
        });
      }

      const isDriver = request.ride.driverId === ctx.session.user.id;
      const isPassenger = request.passengerId === ctx.session.user.id;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this ride request",
        });
      }

      // Check if conversation already exists
      const existing = await ctx.db.query.conversation.findFirst({
        where: eq(conversation.rideRequestId, input.rideRequestId),
      });

      if (existing) {
        return existing;
      }

      // Create new conversation
      const [newConversation] = await ctx.db
        .insert(conversation)
        .values({ rideRequestId: input.rideRequestId })
        .returning();

      return newConversation;
    }),

  // Send a message in a conversation
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the conversation exists and user is part of it
      const conv = await ctx.db.query.conversation.findFirst({
        where: eq(conversation.id, input.conversationId),
        with: {
          rideRequest: {
            with: { ride: true },
          },
        },
      });

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const isDriver = conv.rideRequest.ride.driverId === ctx.session.user.id;
      const isPassenger = conv.rideRequest.passengerId === ctx.session.user.id;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this conversation",
        });
      }

      // Create the message
      const [newMessage] = await ctx.db
        .insert(message)
        .values({
          conversationId: input.conversationId,
          senderId: ctx.session.user.id,
          content: input.content,
        })
        .returning();

      return newMessage;
    }),

  // Get messages for a conversation
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify user is part of the conversation
      const conv = await ctx.db.query.conversation.findFirst({
        where: eq(conversation.id, input.conversationId),
        with: {
          rideRequest: {
            with: { ride: true },
          },
        },
      });

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const isDriver = conv.rideRequest.ride.driverId === ctx.session.user.id;
      const isPassenger = conv.rideRequest.passengerId === ctx.session.user.id;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this conversation",
        });
      }

      // Fetch messages
      const messages = await ctx.db.query.message.findMany({
        where: eq(message.conversationId, input.conversationId),
        orderBy: desc(message.createdAt),
        limit: input.limit,
        with: { sender: true },
      });

      return messages;
    }),

  // Mark messages as read
  markAsRead: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is part of the conversation
      const conv = await ctx.db.query.conversation.findFirst({
        where: eq(conversation.id, input.conversationId),
        with: {
          rideRequest: {
            with: { ride: true },
          },
        },
      });

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const isDriver = conv.rideRequest.ride.driverId === ctx.session.user.id;
      const isPassenger = conv.rideRequest.passengerId === ctx.session.user.id;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this conversation",
        });
      }

      // Mark all unread messages from the other user as read
      await ctx.db
        .update(message)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(message.conversationId, input.conversationId),
            ne(message.senderId, ctx.session.user.id),
            isNull(message.readAt),
          ),
        );

      return { success: true };
    }),

  // List all conversations for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get all ride requests where user is passenger
    const passengerRequests = await ctx.db.query.rideRequest.findMany({
      where: eq(rideRequest.passengerId, userId),
      with: {
        ride: { with: { driver: true } },
        conversation: {
          with: {
            messages: {
              orderBy: desc(message.createdAt),
              limit: 1,
            },
          },
        },
      },
    });

    // Get all rides where user is driver
    const driverRides = await ctx.db.query.ride.findMany({
      where: eq(ride.driverId, userId),
      with: {
        requests: {
          with: {
            passenger: true,
            conversation: {
              with: {
                messages: {
                  orderBy: desc(message.createdAt),
                  limit: 1,
                },
              },
            },
          },
        },
      },
    });

    type ConversationItem = {
      id: string;
      rideRequestId: string;
      rideRequestStatus: string;
      rideId: string;
      fromName: string;
      toName: string;
      departureTime: Date;
      otherUser: { id: string; name: string | null; image: string | null };
      lastMessage: {
        content: string;
        createdAt: Date;
        senderId: string;
      } | null;
      createdAt: Date;
    };

    const conversations: ConversationItem[] = [];

    // Add passenger conversations
    for (const r of passengerRequests) {
      if (r.conversation) {
        conversations.push({
          id: r.conversation.id,
          rideRequestId: r.id,
          rideRequestStatus: r.status,
          rideId: r.ride.id,
          fromName: r.ride.fromName,
          toName: r.ride.toName,
          departureTime: r.ride.departureTime,
          otherUser: {
            id: r.ride.driver.id,
            name: r.ride.driver.name,
            image: r.ride.driver.image,
          },
          lastMessage: r.conversation.messages[0] ?? null,
          createdAt: r.conversation.createdAt,
        });
      }
    }

    // Add driver conversations
    for (const driverRide of driverRides) {
      for (const req of driverRide.requests) {
        if (req.conversation) {
          conversations.push({
            id: req.conversation.id,
            rideRequestId: req.id,
            rideRequestStatus: req.status,
            rideId: driverRide.id,
            fromName: driverRide.fromName,
            toName: driverRide.toName,
            departureTime: driverRide.departureTime,
            otherUser: {
              id: req.passenger.id,
              name: req.passenger.name,
              image: req.passenger.image,
            },
            lastMessage: req.conversation.messages[0] ?? null,
            createdAt: req.conversation.createdAt,
          });
        }
      }
    }

    // Sort by last message date (most recent first)
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ?? a.createdAt;
      const bTime = b.lastMessage?.createdAt ?? b.createdAt;
      return bTime.getTime() - aTime.getTime();
    });

    return conversations;
  }),

  // Get a single conversation by ride request ID
  getByRideRequest: protectedProcedure
    .input(z.object({ rideRequestId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.db.query.rideRequest.findFirst({
        where: eq(rideRequest.id, input.rideRequestId),
        with: {
          ride: { with: { driver: true } },
          passenger: true,
          conversation: {
            with: {
              messages: {
                orderBy: desc(message.createdAt),
                limit: 20,
                with: { sender: true },
              },
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ride request not found",
        });
      }

      const isDriver = request.ride.driverId === ctx.session.user.id;
      const isPassenger = request.passengerId === ctx.session.user.id;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this ride request",
        });
      }

      return {
        rideRequest: request,
        conversation: request.conversation,
        otherUser: isDriver ? request.passenger : request.ride.driver,
      };
    }),
} satisfies TRPCRouterRecord;
