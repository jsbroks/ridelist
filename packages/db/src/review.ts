import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { ride } from "./ride";

// Enum
export const reviewTypeEnum = pgEnum("review_type", [
  "driver_to_passenger", // Driver reviewing a passenger
  "passenger_to_driver", // Passenger reviewing a driver
]);

// Table
export const review = pgTable(
  "review",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    rideId: uuid("ride_id")
      .notNull()
      .references(() => ride.id, { onDelete: "cascade" }),

    // Who is leaving the review
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Who is being reviewed
    revieweeId: text("reviewee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Type of review (driver reviewing passenger or vice versa)
    type: reviewTypeEnum("type").notNull(),

    // Rating from 1-5
    rating: integer("rating").notNull(),

    // Optional review text
    comment: text("comment"),

    // Whether the review is visible (can be hidden by admin for moderation)
    isVisible: integer("is_visible").notNull().default(1),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("review_ride_id_idx").on(table.rideId),
    index("review_reviewer_id_idx").on(table.reviewerId),
    index("review_reviewee_id_idx").on(table.revieweeId),
    index("review_rating_idx").on(table.rating),
    // Unique constraint: one review per reviewer/reviewee/ride combination
    unique("review_unique").on(
      table.rideId,
      table.reviewerId,
      table.revieweeId,
    ),
  ],
);

// Relations
export const reviewRelations = relations(review, ({ one }) => ({
  ride: one(ride, {
    fields: [review.rideId],
    references: [ride.id],
  }),
  reviewer: one(user, {
    fields: [review.reviewerId],
    references: [user.id],
    relationName: "reviewsGiven",
  }),
  reviewee: one(user, {
    fields: [review.revieweeId],
    references: [user.id],
    relationName: "reviewsReceived",
  }),
}));

// Zod schemas
export const CreateReviewSchema = createInsertSchema(review, {
  rideId: z.string().uuid(),
  revieweeId: z.string().min(1),
  type: z.enum(["driver_to_passenger", "passenger_to_driver"]),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
}).omit({
  id: true,
  reviewerId: true,
  isVisible: true,
  createdAt: true,
  updatedAt: true,
});

export const ReviewSchema = createSelectSchema(review);
