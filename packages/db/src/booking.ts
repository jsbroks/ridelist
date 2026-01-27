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
import { driverRoute, passengerRequest } from "./driver-route";
import { driverOffer } from "./passenger-route";
import { review } from "./review";

// ============================================================================
// ENUMS
// ============================================================================

export const tripStatusEnum = pgEnum("trip_status", [
  "scheduled", // Trip is confirmed and upcoming
  "in_progress", // Trip is happening
  "completed", // Trip finished
  "cancelled", // Trip was cancelled
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed", // Booking confirmed, awaiting trip
  "completed", // Successfully completed
  "no_show_driver", // Driver didn't show up
  "no_show_passenger", // Passenger didn't show up
  "cancelled_by_driver",
  "cancelled_by_passenger",
]);

// ============================================================================
// TRIP TABLE - Each occurrence of a driver route
// ============================================================================

export const trip = pgTable(
  "trip",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),

    // Link to the route template
    driverRouteId: uuid("driver_route_id")
      .notNull()
      .references(() => driverRoute.id, { onDelete: "cascade" }),

    // The driver (denormalized for easier queries)
    driverId: text("driver_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Timing for this specific occurrence
    departureTime: timestamp("departure_time", {
      withTimezone: true,
    }).notNull(),

    // If created from accepting a driver offer on a passenger route
    driverOfferId: uuid("driver_offer_id").references(() => driverOffer.id, {
      onDelete: "set null",
    }),

    // Execution status
    status: tripStatusEnum("status").notNull().default("scheduled"),

    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("trip_driver_route_id_idx").on(table.driverRouteId),
    index("trip_driver_id_idx").on(table.driverId),
    index("trip_departure_time_idx").on(table.departureTime),
    index("trip_status_idx").on(table.status),
    index("trip_driver_offer_id_idx").on(table.driverOfferId),
  ],
);

export const tripRelations = relations(trip, ({ one, many }) => ({
  driverRoute: one(driverRoute, {
    fields: [trip.driverRouteId],
    references: [driverRoute.id],
  }),
  driver: one(user, {
    fields: [trip.driverId],
    references: [user.id],
  }),
  driverOffer: one(driverOffer, {
    fields: [trip.driverOfferId],
    references: [driverOffer.id],
  }),
  bookings: many(booking),
}));

// ============================================================================
// BOOKING TABLE - One passenger's reservation on a trip
// ============================================================================

export const booking = pgTable(
  "booking",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trip.id, { onDelete: "cascade" }),
    passengerId: text("passenger_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Origin of booking (how this booking was created)
    passengerRequestId: uuid("passenger_request_id").references(
      () => passengerRequest.id,
      { onDelete: "set null" },
    ),

    // Passenger's specific pickup/dropoff (may differ from trip route)
    pickupPlaceId: varchar("pickup_place_id", { length: 256 }),
    pickupName: varchar("pickup_name", { length: 256 }),
    pickupLat: doublePrecision("pickup_lat"),
    pickupLng: doublePrecision("pickup_lng"),

    dropoffPlaceId: varchar("dropoff_place_id", { length: 256 }),
    dropoffName: varchar("dropoff_name", { length: 256 }),
    dropoffLat: doublePrecision("dropoff_lat"),
    dropoffLng: doublePrecision("dropoff_lng"),

    seatsBooked: integer("seats_booked").notNull().default(1),
    pricePerSeat: integer("price_per_seat"), // in cents

    status: bookingStatusEnum("status").notNull().default("confirmed"),

    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("booking_trip_id_idx").on(table.tripId),
    index("booking_passenger_id_idx").on(table.passengerId),
    index("booking_passenger_request_id_idx").on(table.passengerRequestId),
    index("booking_status_idx").on(table.status),
  ],
);

export const bookingRelations = relations(booking, ({ one, many }) => ({
  trip: one(trip, {
    fields: [booking.tripId],
    references: [trip.id],
  }),
  passenger: one(user, {
    fields: [booking.passengerId],
    references: [user.id],
  }),
  passengerRequest: one(passengerRequest, {
    fields: [booking.passengerRequestId],
    references: [passengerRequest.id],
  }),
  conversations: many(conversation),
  reviews: many(review),
}));

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const CreateTripSchema = createInsertSchema(trip, {
  departureTime: z.coerce.date(),
}).omit({
  id: true,
  driverId: true,
  actualDepartureTime: true,
  status: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateBookingSchema = createInsertSchema(booking, {
  seatsBooked: z.number().int().min(1).max(10).default(1),
  pricePerSeat: z.number().int().min(0).optional(),
}).omit({
  id: true,
  status: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const TripSchema = createSelectSchema(trip);
export const BookingSchema = createSelectSchema(booking);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Trip = typeof trip.$inferSelect;
export type NewTrip = typeof trip.$inferInsert;
export type Booking = typeof booking.$inferSelect;
export type NewBooking = typeof booking.$inferInsert;
export type TripStatus = (typeof tripStatusEnum.enumValues)[number];
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
