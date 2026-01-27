import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { booking } from "./booking";

// Conversation - A conversation thread between a driver and passenger for a booking
export const conversation = pgTable(
  "conversation",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),

    // Link to booking (the driver-passenger connection)
    bookingId: uuid("booking_id")
      .notNull()
      .unique()
      .references(() => booking.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("conversation_booking_id_idx").on(table.bookingId)],
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
    booking: one(booking, {
      fields: [conversation.bookingId],
      references: [booking.id],
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

// Type exports
export type Conversation = typeof conversation.$inferSelect;
export type NewConversation = typeof conversation.$inferInsert;
export type Message = typeof message.$inferSelect;
export type NewMessage = typeof message.$inferInsert;
