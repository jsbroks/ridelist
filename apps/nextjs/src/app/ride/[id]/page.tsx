import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { getSession } from "~/auth/server";
import { env } from "~/env";
import { fetchQuery, trpc } from "~/trpc/server";
import { RideDetails } from "./_components/ride-details";
import { RideMap } from "./_components/ride-map";

interface RidePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: RidePageProps): Promise<Metadata> {
  const { id } = await params;

  const ride = await fetchQuery(
    trpc.ride.byId.queryOptions({ id }),
  ).catch(() => null);

  if (!ride) {
    return {
      title: "Ride Not Found",
    };
  }

  const departureDate = format(new Date(ride.departureTime), "MMMM d, yyyy");

  return {
    title: `${ride.fromName} to ${ride.toName}`,
    description: `Rideshare from ${ride.fromName} to ${ride.toName} on ${departureDate}. ${ride.availableSeats} seats available.`,
    openGraph: {
      title: `${ride.fromName} → ${ride.toName} | RideList`,
      description: `Rideshare from ${ride.fromName} to ${ride.toName} on ${departureDate}. ${ride.availableSeats} seats available.`,
    },
  };
}

export default async function RidePage({ params }: RidePageProps) {
  const { id } = await params;

  const [ride, session] = await Promise.all([
    fetchQuery(trpc.ride.byId.queryOptions({ id })).catch(() => null),
    getSession(),
  ]);

  if (!ride) {
    notFound();
  }

  // Get driver stats
  const driverStats = await fetchQuery(
    trpc.review.stats.queryOptions({ userId: ride.driverId }),
  ).catch(() => null);

  const isOwnRide = session?.user?.id === ride.driverId;
  const isLoggedIn = !!session?.user;
  const googleMapsApiKey = env.GOOGLE_MAPS_API_KEY;

  return (
    <main className="container py-8">
      {/* Map */}
      <div className="mb-8 h-[300px] overflow-hidden rounded-xl border">
        <RideMap
          apiKey={googleMapsApiKey}
          fromPlaceId={ride.fromPlaceId}
          toPlaceId={ride.toPlaceId}
          fromName={ride.fromName}
          toName={ride.toName}
          stops={ride.stops.map((s) => ({
            name: s.name,
            placeId: s.placeId,
          }))}
        />
      </div>

      <RideDetails
        ride={{
          id: ride.id,
          fromName: ride.fromName,
          fromAddress: ride.fromAddress,
          toName: ride.toName,
          toAddress: ride.toAddress,
          departureTime: ride.departureTime,
          totalSeats: ride.totalSeats,
          availableSeats: ride.availableSeats,
          pricePerSeat: ride.pricePerSeat,
          description: ride.description,
          status: ride.status,
          distanceKm: ride.distanceKm,
          durationMinutes: ride.durationMinutes,
          driver: {
            id: ride.driver.id,
            name: ride.driver.name,
            image: ride.driver.image,
            createdAt: ride.driver.createdAt,
          },
          stops: ride.stops.map((s) => ({
            id: s.id,
            name: s.name,
            address: s.address,
            orderIndex: s.orderIndex,
          })),
        }}
        isOwnRide={isOwnRide}
        isLoggedIn={isLoggedIn}
        driverRating={driverStats?.averageRating ?? null}
        driverReviewCount={driverStats?.totalReviews ?? 0}
      />
    </main>
  );
}
