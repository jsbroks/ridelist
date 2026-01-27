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
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";
import { trip } from "./booking";

// ============================================================================
// ENUMS
// ============================================================================

export const driverRouteStatusEnum = pgEnum("driver_route_status", [
  "active", // Accepting new bookings
  "paused", // Temporarily not accepting
  "closed", // No longer active
]);

export const passengerRequestStatusEnum = pgEnum("passenger_request_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

// ============================================================================
// DRIVER ROUTE TABLE (Template/Definition)
// ============================================================================

export const driverRoute = pgTable(
  "driver_route",
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

    // Route geometry (planned route)
    routeGeometry: jsonb("route_geometry").notNull().$type<LineString>(),
    distanceKm: doublePrecision("distance_km"),
    durationMinutes: integer("duration_minutes"),

    // Capacity & pricing (defaults for trips)
    seatsOffered: integer("seats_offered").notNull().default(3),
    pricePerSeat: integer("price_per_seat"), // in cents

    // Vehicle amenities
    luggageSize: varchar("luggage_size", { length: 16 }), // 'small', 'medium', 'large'
    hasWinterTires: boolean("has_winter_tires").default(false),
    allowsBikes: boolean("allows_bikes").default(false),
    allowsSkis: boolean("allows_skis").default(false),
    allowsPets: boolean("allows_pets").default(false),
    hasAC: boolean("has_ac").default(false),
    hasPhoneCharging: boolean("has_phone_charging").default(false),

    // Recurrence settings
    rrule: text("rrule"), // e.g., "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
    baseTime: time("base_time"), // e.g., "08:00:00" - time of day for recurring trips
    validFrom: timestamp("valid_from", { withTimezone: true }), // when recurrence starts
    validUntil: timestamp("valid_until", { withTimezone: true }), // when recurrence ends

    // For one-time trips without recurrence
    description: text("description"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("driver_route_driver_id_idx").on(table.driverId),
    index("driver_route_from_place_id_idx").on(table.fromPlaceId),
    index("driver_route_to_place_id_idx").on(table.toPlaceId),
  ],
);

export const driverRouteRelations = relations(driverRoute, ({ one, many }) => ({
  driver: one(user, {
    fields: [driverRoute.driverId],
    references: [user.id],
  }),
  trips: many(trip),
  requests: many(passengerRequest),
}));

// ============================================================================
// PASSENGER REQUEST TABLE (Passenger requesting to join a driver's route)
// ============================================================================

export const passengerRequest = pgTable(
  "passenger_request",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    driverRouteId: uuid("driver_route_id")
      .notNull()
      .references(() => driverRoute.id, { onDelete: "cascade" }),
    passengerId: text("passenger_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Which trip occurrence they want (optional - could be for any upcoming trip)
    tripId: uuid("trip_id").references(() => trip.id, { onDelete: "set null" }),

    // Custom pickup/dropoff (may differ from driver's route)
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
    status: passengerRequestStatusEnum("status").notNull().default("pending"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("passenger_request_driver_route_id_idx").on(table.driverRouteId),
    index("passenger_request_passenger_id_idx").on(table.passengerId),
    index("passenger_request_trip_id_idx").on(table.tripId),
    index("passenger_request_status_idx").on(table.status),
  ],
);

export const passengerRequestRelations = relations(
  passengerRequest,
  ({ one }) => ({
    driverRoute: one(driverRoute, {
      fields: [passengerRequest.driverRouteId],
      references: [driverRoute.id],
    }),
    trip: one(trip, {
      fields: [passengerRequest.tripId],
      references: [trip.id],
    }),
    passenger: one(user, {
      fields: [passengerRequest.passengerId],
      references: [user.id],
    }),
  }),
);

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const routeGeometrySchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

export const CreateDriverRouteSchema = createInsertSchema(driverRoute, {
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
  routeGeometry: routeGeometrySchema,
  distanceKm: z.number().optional(),
  durationMinutes: z.number().int().optional(),
  seatsOffered: z.number().int().min(1).max(10).default(3),
  pricePerSeat: z.number().int().min(0).optional(),
  luggageSize: z.enum(["small", "medium", "large"]).optional(),
  hasWinterTires: z.boolean().optional(),
  allowsBikes: z.boolean().optional(),
  allowsSkis: z.boolean().optional(),
  allowsPets: z.boolean().optional(),
  hasAC: z.boolean().optional(),
  hasPhoneCharging: z.boolean().optional(),
  rrule: z.string().optional(),
  baseTime: z.string().optional(), // "HH:MM:SS" format
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  description: z.string().max(1000).optional(),
}).omit({
  id: true,
  driverId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const CreatePassengerRequestSchema = createInsertSchema(
  passengerRequest,
  {
    seatsRequested: z.number().int().min(1).max(10).default(1),
    message: z.string().max(500).optional(),
  },
).omit({
  id: true,
  passengerId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Select schemas
export const DriverRouteSchema = createSelectSchema(driverRoute);
export const PassengerRequestSchema = createSelectSchema(passengerRequest);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DriverRoute = typeof driverRoute.$inferSelect;
export type NewDriverRoute = typeof driverRoute.$inferInsert;
export type PassengerRequest = typeof passengerRequest.$inferSelect;
export type NewPassengerRequest = typeof passengerRequest.$inferInsert;
export type DriverRouteStatus =
  (typeof driverRouteStatusEnum.enumValues)[number];
export type PassengerRequestStatus =
  (typeof passengerRequestStatusEnum.enumValues)[number];
