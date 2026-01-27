import type { TRPCRouterRecord } from "@trpc/server";

import { count, sql, sum } from "@app/db";
import { ride, user } from "@app/db/schema";

import { publicProcedure } from "../trpc";

export const statsRouter = {
  /**
   * Get aggregated statistics for the homepage
   * Returns: active members, rides posted, cities connected, and estimated CO2 saved
   */
  homepage: publicProcedure.query(async ({ ctx }) => {
    // Run all count queries in parallel for efficiency
    const [usersResult, ridesResult, citiesResult] = await Promise.all([
      // Count total users
      ctx.db.select({ count: count() }).from(user),

      // Count total rides and sum distance for CO2 calculation
      ctx.db
        .select({
          count: count(),
          totalDistanceKm: sum(ride.distanceKm),
        })
        .from(ride),

      // Count distinct cities (both origin and destination)
      ctx.db
        .select({
          count: sql<number>`(
            SELECT COUNT(*) FROM (
              SELECT DISTINCT ${ride.fromName} AS city FROM ${ride}
              UNION
              SELECT DISTINCT ${ride.toName} AS city FROM ${ride}
            ) AS unique_cities
          )`.as("count"),
        })
        .from(ride)
        .limit(1),
    ]);

    const activeMembers = usersResult[0]?.count ?? 0;
    const ridesPosted = ridesResult[0]?.count ?? 0;
    const totalDistanceKm = Number(ridesResult[0]?.totalDistanceKm) || 0;
    const citiesConnected = citiesResult[0]?.count ?? 0;

    // CO2 calculation:
    // Average car emits ~120g CO2/km
    // Ridesharing typically has 2-3 passengers, so we estimate ~80g saved per km
    // (one less car on the road for that distance)
    // Convert to tons (divide by 1,000,000)
    const co2SavedTons = Math.round((totalDistanceKm * 80) / 1_000_000);

    return {
      activeMembers,
      ridesPosted,
      citiesConnected,
      co2SavedTons,
    };
  }),
} satisfies TRPCRouterRecord;
