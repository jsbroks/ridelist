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

// ============================================================================
// ENUMS
// ============================================================================

export const passengerRouteStatusEnum = pgEnum("passenger_route_status", [
  "active", // Looking for a ride
  "fulfilled", // Found a ride (driver offer accepted)
  "closed", // No longer looking
]);

export const driverOfferStatusEnum = pgEnum("driver_offer_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

// ============================================================================
// PASSENGER ROUTE TABLE (Ride Wanted Listing)
// ============================================================================

export const passengerRoute = pgTable(
  "passenger_route",
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

    // Desired trip details
    departureTime: timestamp("departure_time", {
      withTimezone: true,
    }).notNull(),
    flexibilityMinutes: integer("flexibility_minutes").default(30),
    description: text("description"),

    // Passenger needs
    seatsNeeded: integer("seats_needed").notNull().default(1),
    maxPricePerSeat: integer("max_price_per_seat"), // in cents, optional budget cap

    // Passenger items
    luggageSize: varchar("luggage_size", { length: 16 }), // 'small', 'medium', 'large'
    hasBike: boolean("has_bike").default(false),
    hasSkis: boolean("has_skis").default(false),
    hasPet: boolean("has_pet").default(false),

    // Listing status
    status: passengerRouteStatusEnum("status").notNull().default("active"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("passenger_route_passenger_id_idx").on(table.passengerId),
    index("passenger_route_from_place_id_idx").on(table.fromPlaceId),
    index("passenger_route_to_place_id_idx").on(table.toPlaceId),
    index("passenger_route_departure_time_idx").on(table.departureTime),
    index("passenger_route_status_idx").on(table.status),
  ],
);

export const passengerRouteRelations = relations(
  passengerRoute,
  ({ one, many }) => ({
    passenger: one(user, {
      fields: [passengerRoute.passengerId],
      references: [user.id],
    }),
    offers: many(driverOffer),
  }),
);

// ============================================================================
// DRIVER OFFER TABLE (Driver offering to fulfill a passenger's route)
// When accepted, creates a driverRoute + trip + booking
// ============================================================================

export const driverOffer = pgTable(
  "driver_offer",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    passengerRouteId: uuid("passenger_route_id")
      .notNull()
      .references(() => passengerRoute.id, { onDelete: "cascade" }),
    driverId: text("driver_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Proposed pickup/dropoff (may differ from passenger's request)
    pickupPlaceId: varchar("pickup_place_id", { length: 256 }),
    pickupName: varchar("pickup_name", { length: 256 }),
    pickupLat: doublePrecision("pickup_lat"),
    pickupLng: doublePrecision("pickup_lng"),

    dropoffPlaceId: varchar("dropoff_place_id", { length: 256 }),
    dropoffName: varchar("dropoff_name", { length: 256 }),
    dropoffLat: doublePrecision("dropoff_lat"),
    dropoffLng: doublePrecision("dropoff_lng"),

    seatsOffered: integer("seats_offered").notNull().default(1),
    proposedDepartureTime: timestamp("proposed_departure_time", {
      withTimezone: true,
    }),
    proposedPricePerSeat: integer("proposed_price_per_seat"), // in cents

    message: text("message"),
    status: driverOfferStatusEnum("status").notNull().default("pending"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("driver_offer_passenger_route_id_idx").on(table.passengerRouteId),
    index("driver_offer_driver_id_idx").on(table.driverId),
    index("driver_offer_status_idx").on(table.status),
  ],
);

export const driverOfferRelations = relations(driverOffer, ({ one }) => ({
  passengerRoute: one(passengerRoute, {
    fields: [driverOffer.passengerRouteId],
    references: [passengerRoute.id],
  }),
  driver: one(user, {
    fields: [driverOffer.driverId],
    references: [user.id],
  }),
}));

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const CreatePassengerRouteSchema = createInsertSchema(passengerRoute, {
  fromPlaceId: z.string().min(1),
  fromName: z.string().min(1).max(256),
  fromAddress: z.string().max(500).optional(),
  fromLat: z.number(),
  fromLng: z.number(),
  toPlaceId: z.string().min(1),
  toName: z.string().min(1).max(256),
  toAddress: z.string().max(500).optional(),
  toLat: z.number(),
  toLng: z.number(),
  departureTime: z.coerce.date(),
  flexibilityMinutes: z.number().int().min(0).max(1440).optional(),
  description: z.string().max(1000).optional(),
  seatsNeeded: z.number().int().min(1).max(10).default(1),
  maxPricePerSeat: z.number().int().min(0).optional(),
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

export const CreateDriverOfferSchema = createInsertSchema(driverOffer, {
  seatsOffered: z.number().int().min(1).max(10).default(1),
  proposedPricePerSeat: z.number().int().min(0).optional(),
  proposedDepartureTime: z.coerce.date().optional(),
  message: z.string().max(500).optional(),
}).omit({
  id: true,
  driverId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Select schemas
export const PassengerRouteSchema = createSelectSchema(passengerRoute);
export const DriverOfferSchema = createSelectSchema(driverOffer);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PassengerRoute = typeof passengerRoute.$inferSelect;
export type NewPassengerRoute = typeof passengerRoute.$inferInsert;
export type DriverOffer = typeof driverOffer.$inferSelect;
export type NewDriverOffer = typeof driverOffer.$inferInsert;
export type PassengerRouteStatus =
  (typeof passengerRouteStatusEnum.enumValues)[number];
export type DriverOfferStatus =
  (typeof driverOfferStatusEnum.enumValues)[number];
