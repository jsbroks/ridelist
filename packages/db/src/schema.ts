import { relations, sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";

// Enums
export const rideStatusEnum = pgEnum("ride_status", [
  "active",
  "full",
  "cancelled",
  "completed",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

export const reviewTypeEnum = pgEnum("review_type", [
  "driver_to_passenger", // Driver reviewing a passenger
  "passenger_to_driver", // Passenger reviewing a driver
]);

// Ride - A ride offered by a driver
export const ride = pgTable(
  "ride",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    driverId: text("driver_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Origin
    fromPlaceId: varchar("from_place_id", { length: 256 }).notNull(),
    fromName: varchar("from_name", { length: 256 }).notNull(),
    fromAddress: text("from_address"),
    fromLat: doublePrecision("from_lat").notNull(),
    fromLng: doublePrecision("from_lng").notNull(),

    // Destination
    toPlaceId: varchar("to_place_id", { length: 256 }).notNull(),
    toName: varchar("to_name", { length: 256 }).notNull(),
    toAddress: text("to_address"),
    toLat: doublePrecision("to_lat").notNull(),
    toLng: doublePrecision("to_lng").notNull(),

    // Trip details
    departureTime: timestamp("departure_time", {
      withTimezone: true,
    }).notNull(),
    distanceKm: doublePrecision("distance_km"),
    durationMinutes: integer("duration_minutes"),
    routePolyline: text("route_polyline"), // Encoded polyline from Google Directions

    // Capacity & pricing
    totalSeats: integer("total_seats").notNull().default(3),
    availableSeats: integer("available_seats").notNull().default(3),
    pricePerSeat: integer("price_per_seat"), // in cents

    // Additional info
    description: text("description"),
    status: rideStatusEnum("status").notNull().default("active"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ride_driver_id_idx").on(table.driverId),
    index("ride_from_place_id_idx").on(table.fromPlaceId),
    index("ride_to_place_id_idx").on(table.toPlaceId),
    index("ride_departure_time_idx").on(table.departureTime),
    index("ride_status_idx").on(table.status),
  ],
);

// RideRequest - A request from a passenger to join a ride
export const rideRequest = pgTable(
  "ride_request",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    rideId: uuid("ride_id")
      .notNull()
      .references(() => ride.id, { onDelete: "cascade" }),
    passengerId: text("passenger_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Passenger's pickup/dropoff preferences (optional, may differ from ride origin/dest)
    pickupPlaceId: varchar("pickup_place_id", { length: 256 }),
    pickupName: varchar("pickup_name", { length: 256 }),
    pickupLat: doublePrecision("pickup_lat"),
    pickupLng: doublePrecision("pickup_lng"),

    dropoffPlaceId: varchar("dropoff_place_id", { length: 256 }),
    dropoffName: varchar("dropoff_name", { length: 256 }),
    dropoffLat: doublePrecision("dropoff_lat"),
    dropoffLng: doublePrecision("dropoff_lng"),

    seatsRequested: integer("seats_requested").notNull().default(1),
    message: text("message"),
    status: requestStatusEnum("status").notNull().default("pending"),

    respondedAt: timestamp("responded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ride_request_ride_id_idx").on(table.rideId),
    index("ride_request_passenger_id_idx").on(table.passengerId),
    index("ride_request_status_idx").on(table.status),
  ],
);

// Review - A rating/review left by one user for another after a ride
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

export const rideRelations = relations(ride, ({ one, many }) => ({
  driver: one(user, { fields: [ride.driverId], references: [user.id] }),
  requests: many(rideRequest),
  reviews: many(review),
}));

export const rideRequestRelations = relations(rideRequest, ({ one }) => ({
  ride: one(ride, {
    fields: [rideRequest.rideId],
    references: [ride.id],
  }),
  passenger: one(user, {
    fields: [rideRequest.passengerId],
    references: [user.id],
  }),
}));

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
export const CreateRideSchema = createInsertSchema(ride, {
  fromPlaceId: z.string().min(1),
  fromName: z.string().min(1).max(256),
  fromLat: z.number(),
  fromLng: z.number(),
  toPlaceId: z.string().min(1),
  toName: z.string().min(1).max(256),
  toLat: z.number(),
  toLng: z.number(),
  departureTime: z.coerce.date(),
  totalSeats: z.number().int().min(1).max(10).optional(),
  pricePerSeat: z.number().int().min(0).optional(),
  description: z.string().max(1000).optional(),
  routePolyline: z.string().optional(),
}).omit({
  id: true,
  driverId: true,
  availableSeats: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const RideSchema = createSelectSchema(ride);

export const CreateRideRequestSchema = createInsertSchema(rideRequest, {
  seatsRequested: z.number().int().min(1).max(10).optional(),
  message: z.string().max(500).optional(),
}).omit({
  id: true,
  passengerId: true,
  status: true,
  respondedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const RideRequestSchema = createSelectSchema(rideRequest);

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

// Legacy Post table (can be removed later)
export const Post = pgTable("post", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export * from "./auth-schema";
