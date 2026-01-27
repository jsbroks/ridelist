import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, isNull, ne } from "@app/db";
import * as schema from "@app/db/schema";

import { protectedProcedure } from "../trpc";

export interface ConversationItem {
  id: string;
  bookingId: string;
  bookingStatus: string;
  tripId: string;
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
}

export const conversationRouter = {
  // Get or create a conversation for a booking
  getOrCreate: protectedProcedure
    .input(z.object({ bookingId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the user is part of this booking (driver or passenger)
      const bookingData = await ctx.db.query.booking.findFirst({
        where: eq(schema.booking.id, input.bookingId),
        with: { trip: true },
      });

      if (!bookingData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      const isDriver = bookingData.trip.driverId === ctx.session.user.id;
      const isPassenger = bookingData.passengerId === ctx.session.user.id;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this booking",
        });
      }

      // Check if conversation already exists
      const existing = await ctx.db.query.conversation.findFirst({
        where: eq(schema.conversation.bookingId, input.bookingId),
      });

      if (existing) {
        return existing;
      }

      // Create new conversation
      const [newConversation] = await ctx.db
        .insert(schema.conversation)
        .values({ bookingId: input.bookingId })
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
        where: eq(schema.conversation.id, input.conversationId),
        with: {
          booking: {
            with: { trip: true },
          },
        },
      });

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const isDriver = conv.booking.trip.driverId === ctx.session.user.id;
      const isPassenger = conv.booking.passengerId === ctx.session.user.id;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this conversation",
        });
      }

      // Create the message
      const [newMessage] = await ctx.db
        .insert(schema.message)
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
        where: eq(schema.conversation.id, input.conversationId),
        with: {
          booking: {
            with: { trip: true },
          },
        },
      });

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const isDriver = conv.booking.trip.driverId === ctx.session.user.id;
      const isPassenger = conv.booking.passengerId === ctx.session.user.id;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this conversation",
        });
      }

      // Fetch messages
      const messages = await ctx.db.query.message.findMany({
        where: eq(schema.message.conversationId, input.conversationId),
        orderBy: desc(schema.message.createdAt),
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
        where: eq(schema.conversation.id, input.conversationId),
        with: {
          booking: {
            with: { trip: true },
          },
        },
      });

      if (!conv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      const isDriver = conv.booking.trip.driverId === ctx.session.user.id;
      const isPassenger = conv.booking.passengerId === ctx.session.user.id;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this conversation",
        });
      }

      // Mark all unread messages from the other user as read
      await ctx.db
        .update(schema.message)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(schema.message.conversationId, input.conversationId),
            ne(schema.message.senderId, ctx.session.user.id),
            isNull(schema.message.readAt),
          ),
        );

      return { success: true };
    }),

  // List all conversations for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get all bookings where user is passenger
    const passengerBookings = await ctx.db.query.booking.findMany({
      where: eq(schema.booking.passengerId, userId),
      with: {
        trip: {
          with: {
            driver: true,
            driverRoute: true,
          },
        },
        conversations: {
          with: {
            messages: {
              orderBy: desc(schema.message.createdAt),
              limit: 1,
              with: { sender: true },
            },
          },
        },
      },
    });

    // Get all trips where user is driver
    const driverTrips = await ctx.db.query.trip.findMany({
      where: eq(schema.trip.driverId, userId),
      with: {
        driverRoute: true,
        bookings: {
          with: {
            passenger: true,
            conversations: {
              with: {
                messages: {
                  orderBy: desc(schema.message.createdAt),
                  limit: 1,
                },
              },
            },
          },
        },
      },
    });

    const conversations: ConversationItem[] = [];

    // Add passenger conversations
    for (const booking of passengerBookings) {
      for (const conv of booking.conversations) {
        conversations.push({
          id: conv.id,
          bookingId: booking.id,
          bookingStatus: booking.status,
          tripId: booking.trip.id,
          fromName: booking.trip.driverRoute.fromName,
          toName: booking.trip.driverRoute.toName,
          departureTime: booking.trip.departureTime,
          otherUser: {
            id: booking.trip.driver.id,
            name: booking.trip.driver.name,
            image: booking.trip.driver.image,
          },
          lastMessage: conv.messages[0] ?? null,
          createdAt: conv.createdAt,
        });
      }
    }

    // Add driver conversations
    for (const trip of driverTrips) {
      for (const booking of trip.bookings) {
        for (const conv of booking.conversations) {
          conversations.push({
            id: conv.id,
            bookingId: booking.id,
            bookingStatus: booking.status,
            tripId: trip.id,
            fromName: trip.driverRoute.fromName,
            toName: trip.driverRoute.toName,
            departureTime: trip.departureTime,
            otherUser: {
              id: booking.passenger.id,
              name: booking.passenger.name,
              image: booking.passenger.image,
            },
            lastMessage: conv.messages[0] ?? null,
            createdAt: conv.createdAt,
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

  // Get a single conversation by booking ID
  getByBooking: protectedProcedure
    .input(z.object({ bookingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const bookingData = await ctx.db.query.booking.findFirst({
        where: eq(schema.booking.id, input.bookingId),
        with: {
          trip: {
            with: {
              driver: true,
              driverRoute: true,
            },
          },
          passenger: true,
          conversations: {
            with: {
              messages: {
                orderBy: desc(schema.message.createdAt),
                limit: 20,
                with: { sender: true },
              },
            },
          },
        },
      });

      if (!bookingData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found",
        });
      }

      const isDriver = bookingData.trip.driverId === ctx.session.user.id;
      const isPassenger = bookingData.passengerId === ctx.session.user.id;

      if (!isDriver && !isPassenger) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not part of this booking",
        });
      }

      // Get the first conversation (there should be at most one per booking)
      const conversation = bookingData.conversations[0] ?? null;

      return {
        booking: bookingData,
        conversation,
        otherUser: isDriver ? bookingData.passenger : bookingData.trip.driver,
      };
    }),
} satisfies TRPCRouterRecord;
