import type { LineString } from "geojson";
import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
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
import { review } from "./review";
import { rideRequest } from "./ride-request";

// Enum
export const rideStatusEnum = pgEnum("ride_status", [
  "active",
  "full",
  "cancelled",
  "completed",
]);

// Table
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
    routeGeometry: jsonb("route_geometry").notNull().$type<LineString>(), // GeoJSON LineString

    // Capacity & pricing
    totalSeats: integer("total_seats").notNull().default(3),
    availableSeats: integer("available_seats").notNull().default(3),
    pricePerSeat: integer("price_per_seat"), // in cents

    // Additional info
    description: text("description"),
    status: rideStatusEnum("status").notNull().default("active"),

    // Preferences
    luggageSize: varchar("luggage_size", { length: 16 }), // 'small', 'medium', 'large'
    hasWinterTires: boolean("has_winter_tires").default(false),
    allowsBikes: boolean("allows_bikes").default(false),
    allowsSkis: boolean("allows_skis").default(false),
    allowsPets: boolean("allows_pets").default(false),
    hasAC: boolean("has_ac").default(false),
    hasPhoneCharging: boolean("has_phone_charging").default(false),

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

// Relations
export const rideRelations = relations(ride, ({ one, many }) => ({
  driver: one(user, { fields: [ride.driverId], references: [user.id] }),
  requests: many(rideRequest),
  reviews: many(review),
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
  routeGeometry: z.object({
    type: z.literal("LineString"),
    coordinates: z.array(z.tuple([z.number(), z.number()])),
  }),
  // Preferences
  luggageSize: z.enum(["small", "medium", "large"]).optional(),
  hasWinterTires: z.boolean().optional(),
  allowsBikes: z.boolean().optional(),
  allowsSkis: z.boolean().optional(),
  allowsPets: z.boolean().optional(),
  hasAC: z.boolean().optional(),
  hasPhoneCharging: z.boolean().optional(),
}).omit({
  id: true,
  driverId: true,
  availableSeats: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const RideSchema = createSelectSchema(ride);
