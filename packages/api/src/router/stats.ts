import type { TRPCRouterRecord } from "@trpc/server";

import { count, eq, sql, sum } from "@app/db";
import * as schema from "@app/db/schema";

import { publicProcedure } from "../trpc";

export const statsRouter = {
  /**
   * Get aggregated statistics for the homepage
   * Returns: active members, rides posted, cities connected, and estimated CO2 saved
   */
  homepage: publicProcedure.query(async ({ ctx }) => {
    // Run all count queries in parallel for efficiency
    const [usersResult, tripsResult, routesResult, citiesResult] =
      await Promise.all([
        // Count total users
        ctx.db.select({ count: count() }).from(schema.user),

        // Count completed trips and sum distance (route distance * trips)
        ctx.db
          .select({
            tripsCount: count(),
            totalDistanceKm: sum(schema.driverRoute.distanceKm),
          })
          .from(schema.trip)
          .innerJoin(
            schema.driverRoute,
            eq(schema.trip.driverRouteId, schema.driverRoute.id),
          )
          .where(eq(schema.trip.status, "completed")),

        // Count total routes
        ctx.db.select({ count: count() }).from(schema.driverRoute),

        // Count distinct cities (both origin and destination)
        ctx.db
          .select({
            count: sql<number>`(
            SELECT COUNT(*) FROM (
              SELECT DISTINCT ${schema.driverRoute.fromName} AS city FROM ${schema.driverRoute}
              UNION
              SELECT DISTINCT ${schema.driverRoute.toName} AS city FROM ${schema.driverRoute}
            ) AS unique_cities
          )`.as("count"),
          })
          .from(schema.driverRoute)
          .limit(1),
      ]);

    const activeMembers = Number(usersResult[0]?.count ?? 0);
    const routesPosted = routesResult[0]?.count ?? 0;
    const tripsCompleted = tripsResult[0]?.tripsCount ?? 0;
    const totalDistanceKm = Number(tripsResult[0]?.totalDistanceKm) || 0;
    const citiesConnected = citiesResult[0]?.count ?? 0;

    // CO2 calculation:
    // Average car emits ~120g CO2/km
    // Ridesharing typically has 2-3 passengers, so we estimate ~80g saved per km
    // (one less car on the road for that distance)
    // Convert to tons (divide by 1,000,000)
    const co2SavedTons = Math.round((totalDistanceKm * 80) / 1_000_000);

    return {
      activeMembers,
      routesPosted,
      tripsCompleted,
      citiesConnected,
      co2SavedTons,
    };
  }),
} satisfies TRPCRouterRecord;
