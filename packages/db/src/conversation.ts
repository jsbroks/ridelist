import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { rideRequest } from "./ride-request";
import { rideWantedOffer } from "./ride-wanted";

// Conversation - A conversation thread between a driver and passenger
// Can be linked to either a ride request OR a ride-wanted offer (exactly one must be set)
export const conversation = pgTable(
  "conversation",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),

    // Link to ride request (passenger requesting to join a driver's ride)
    rideRequestId: uuid("ride_request_id")
      .unique()
      .references(() => rideRequest.id, { onDelete: "cascade" }),

    // Link to ride-wanted offer (driver offering to fulfill a passenger's ride-wanted post)
    rideWantedOfferId: uuid("ride_wanted_offer_id")
      .unique()
      .references(() => rideWantedOffer.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("conversation_ride_request_id_idx").on(table.rideRequestId),
    index("conversation_ride_wanted_offer_id_idx").on(table.rideWantedOfferId),
    // Ensure exactly one of rideRequestId or rideWantedOfferId is set
    check(
      "conversation_context_check",
      sql`(ride_request_id IS NOT NULL AND ride_wanted_offer_id IS NULL) OR (ride_request_id IS NULL AND ride_wanted_offer_id IS NOT NULL)`,
    ),
  ],
);

// Message - An individual message within a conversation
export const message = pgTable(
  "message",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    content: text("content").notNull(),

    // When the recipient read this message (null = unread)
    readAt: timestamp("read_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("message_conversation_id_idx").on(table.conversationId),
    index("message_sender_id_idx").on(table.senderId),
    index("message_created_at_idx").on(table.createdAt),
  ],
);

// Relations
export const conversationRelations = relations(
  conversation,
  ({ one, many }) => ({
    rideRequest: one(rideRequest, {
      fields: [conversation.rideRequestId],
      references: [rideRequest.id],
    }),
    rideWantedOffer: one(rideWantedOffer, {
      fields: [conversation.rideWantedOfferId],
      references: [rideWantedOffer.id],
    }),
    messages: many(message),
  }),
);

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
}));

// Zod schemas
export const CreateConversationSchema = createInsertSchema(conversation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ConversationSchema = createSelectSchema(conversation);

export const CreateMessageSchema = createInsertSchema(message, {
  content: z.string().min(1).max(2000),
}).omit({
  id: true,
  readAt: true,
  createdAt: true,
});

export const MessageSchema = createSelectSchema(message);
