import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { conversation } from "./conversation";
import { ride } from "./ride";

// Enum
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

// Table
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

// Relations
export const rideRequestRelations = relations(rideRequest, ({ one }) => ({
  ride: one(ride, {
    fields: [rideRequest.rideId],
    references: [ride.id],
  }),
  passenger: one(user, {
    fields: [rideRequest.passengerId],
    references: [user.id],
  }),
  conversation: one(conversation),
}));

// Zod schemas
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
