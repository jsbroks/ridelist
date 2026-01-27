import { relations } from "drizzle-orm";
import {
  boolean,
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

// Enum
export const rideWantedStatusEnum = pgEnum("ride_wanted_status", [
  "active",
  "fulfilled",
  "cancelled",
  "expired",
]);

// Table
export const rideWanted = pgTable(
  "ride_wanted",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    passengerId: text("passenger_id")
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
    flexibilityMinutes: integer("flexibility_minutes").default(30), // How flexible the departure time is

    // Passenger needs
    seatsNeeded: integer("seats_needed").notNull().default(1),
    maxPricePerSeat: integer("max_price_per_seat"), // in cents, optional budget cap

    // Additional info
    description: text("description"),
    status: rideWantedStatusEnum("status").notNull().default("active"),

    // Preferences
    luggageSize: varchar("luggage_size", { length: 16 }), // 'small', 'medium', 'large'
    hasBike: boolean("has_bike").default(false),
    hasSkis: boolean("has_skis").default(false),
    hasPet: boolean("has_pet").default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ride_wanted_passenger_id_idx").on(table.passengerId),
    index("ride_wanted_from_place_id_idx").on(table.fromPlaceId),
    index("ride_wanted_to_place_id_idx").on(table.toPlaceId),
    index("ride_wanted_departure_time_idx").on(table.departureTime),
    index("ride_wanted_status_idx").on(table.status),
  ],
);

// Relations
export const rideWantedRelations = relations(rideWanted, ({ one, many }) => ({
  passenger: one(user, {
    fields: [rideWanted.passengerId],
    references: [user.id],
  }),
  offers: many(rideWantedOffer),
}));

// Offer status enum
export const rideWantedOfferStatusEnum = pgEnum("ride_wanted_offer_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

// Offers from drivers responding to ride-wanted posts
export const rideWantedOffer = pgTable(
  "ride_wanted_offer",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    rideWantedId: uuid("ride_wanted_id")
      .notNull()
      .references(() => rideWanted.id, { onDelete: "cascade" }),
    driverId: text("driver_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Optional: link to an existing ride if driver has one
    // rideId: uuid("ride_id").references(() => ride.id, { onDelete: "set null" }),

    // Proposed pickup/dropoff (may differ from requested origin/dest)
    pickupPlaceId: varchar("pickup_place_id", { length: 256 }),
    pickupName: varchar("pickup_name", { length: 256 }),
    pickupLat: doublePrecision("pickup_lat"),
    pickupLng: doublePrecision("pickup_lng"),

    dropoffPlaceId: varchar("dropoff_place_id", { length: 256 }),
    dropoffName: varchar("dropoff_name", { length: 256 }),
    dropoffLat: doublePrecision("dropoff_lat"),
    dropoffLng: doublePrecision("dropoff_lng"),

    proposedDepartureTime: timestamp("proposed_departure_time", {
      withTimezone: true,
    }),
    pricePerSeat: integer("price_per_seat"), // in cents
    seatsAvailable: integer("seats_available"),

    message: text("message"),
    status: rideWantedOfferStatusEnum("status").notNull().default("pending"),

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
    index("ride_wanted_offer_ride_wanted_id_idx").on(table.rideWantedId),
    index("ride_wanted_offer_driver_id_idx").on(table.driverId),
    index("ride_wanted_offer_status_idx").on(table.status),
  ],
);

// Offer relations
export const rideWantedOfferRelations = relations(
  rideWantedOffer,
  ({ one }) => ({
    rideWanted: one(rideWanted, {
      fields: [rideWantedOffer.rideWantedId],
      references: [rideWanted.id],
    }),
    driver: one(user, {
      fields: [rideWantedOffer.driverId],
      references: [user.id],
    }),
    conversation: one(conversation),
  }),
);

// Zod schemas
export const CreateRideWantedSchema = createInsertSchema(rideWanted, {
  fromPlaceId: z.string().min(1),
  fromName: z.string().min(1).max(256),
  fromLat: z.number(),
  fromLng: z.number(),
  toPlaceId: z.string().min(1),
  toName: z.string().min(1).max(256),
  toLat: z.number(),
  toLng: z.number(),
  departureTime: z.coerce.date(),
  flexibilityMinutes: z.number().int().min(0).max(1440).optional(),
  seatsNeeded: z.number().int().min(1).max(10).optional(),
  maxPricePerSeat: z.number().int().min(0).optional(),
  description: z.string().max(1000).optional(),
  luggageSize: z.enum(["small", "medium", "large"]).optional(),
  hasBike: z.boolean().optional(),
  hasSkis: z.boolean().optional(),
  hasPet: z.boolean().optional(),
}).omit({
  id: true,
  passengerId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const RideWantedSchema = createSelectSchema(rideWanted);

export const CreateRideWantedOfferSchema = createInsertSchema(rideWantedOffer, {
  pricePerSeat: z.number().int().min(0).optional(),
  seatsAvailable: z.number().int().min(1).max(10).optional(),
  message: z.string().max(500).optional(),
  proposedDepartureTime: z.coerce.date().optional(),
}).omit({
  id: true,
  driverId: true,
  status: true,
  respondedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const RideWantedOfferSchema = createSelectSchema(rideWantedOffer);
