import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { Separator } from "@app/ui/separator";

import { getSession } from "~/auth/server";
import { env } from "~/env";
import { fetchQuery, trpc } from "~/trpc/server";
import { DriverSection } from "./_components/driver-section";
import { RideComparisonMap } from "./_components/ride-comparison-map";
import { RideHeader } from "./_components/ride-header";
import { VehicleAmenitiesSection } from "./_components/vehicle-amenities-section";

interface RidePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    pickup?: string;
    dropoff?: string;
  }>;
}

export async function generateMetadata({
  params,
}: RidePageProps): Promise<Metadata> {
  const { id } = await params;

  const ride = await fetchQuery(trpc.ride.byId.queryOptions({ id })).catch(
    () => null,
  );

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

export default async function RidePage({
  params,
  searchParams,
}: RidePageProps) {
  const { id } = await params;
  const { pickup: userPickupPlaceId, dropoff: userDropoffPlaceId } =
    await searchParams;

  const [ride, session] = await Promise.all([
    fetchQuery(trpc.ride.byId.queryOptions({ id })).catch(() => null),
    getSession(),
  ]);

  if (!ride) {
    notFound();
  }

  const [driverStats, userPickupDetails, userDropoffDetails] =
    await Promise.all([
      fetchQuery(
        trpc.review.stats.queryOptions({ userId: ride.driverId }),
      ).catch(() => null),
      userPickupPlaceId
        ? fetchQuery(
            trpc.places.getDetails.queryOptions({ placeId: userPickupPlaceId }),
          ).catch(() => null)
        : null,
      userDropoffPlaceId
        ? fetchQuery(
            trpc.places.getDetails.queryOptions({
              placeId: userDropoffPlaceId,
            }),
          ).catch(() => null)
        : null,
    ]);

  const _isOwnRide = session?.user.id === ride.driverId;
  const _isLoggedIn = !!session?.user;
  const googleMapsApiKey = env.GOOGLE_MAPS_API_KEY;

  const initialPickup =
    userPickupDetails && userPickupPlaceId
      ? {
          placeId: userPickupPlaceId,
          description: userPickupDetails.name ?? "",
          mainText: userPickupDetails.name ?? "",
          secondaryText: userPickupDetails.formattedAddress ?? null,
          types: [],
        }
      : null;

  const initialDropoff =
    userDropoffDetails && userDropoffPlaceId
      ? {
          placeId: userDropoffPlaceId,
          description: userDropoffDetails.name ?? "",
          mainText: userDropoffDetails.name ?? "",
          secondaryText: userDropoffDetails.formattedAddress ?? null,
          types: [],
        }
      : null;

  // Prepare route geometry for direction check
  const routeGeometry = {
    type: "LineString" as const,
    coordinates: ride.routeGeometry.coordinates.map(
      (coord) => [coord[0], coord[1]] as [number, number],
    ),
  };

  return (
    <main className="container py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Content Column */}
        <div className="w-full space-y-10 lg:max-w-2xl">
          <RideHeader
            ride={{
              id: ride.id,
              fromName: ride.fromName,
              toName: ride.toName,
              departureTime: ride.departureTime,
              availableSeats: ride.availableSeats,
              pricePerSeat: ride.pricePerSeat,
            }}
            initialPickup={initialPickup}
            initialDropoff={initialDropoff}
            routeGeometry={routeGeometry}
            userPickupLocation={userPickupDetails?.location ?? null}
            userDropoffLocation={userDropoffDetails?.location ?? null}
          />

          {/* Mobile Map - Show below Driver's route on mobile */}
          <div className="h-[300px] overflow-hidden rounded-xl lg:hidden">
            <RideComparisonMap
              apiKey={googleMapsApiKey}
              driverRoute={{
                type: "LineString",
                coordinates: ride.routeGeometry.coordinates.map(
                  (coord) => [coord[0], coord[1]] as [number, number],
                ),
              }}
              fromName={ride.fromName}
              toName={ride.toName}
              userPickupPlaceId={userPickupPlaceId}
              userDropoffPlaceId={userDropoffPlaceId}
              userPickupName={userPickupDetails?.name}
              userDropoffName={userDropoffDetails?.name}
            />
          </div>

          <Separator />

          <DriverSection
            driver={{
              id: ride.driver.id,
              name: ride.driver.name,
              image: ride.driver.image,
            }}
            description={ride.description}
            stats={driverStats}
          />

          <Separator />

          <VehicleAmenitiesSection preferences={ride} />
        </div>

        {/* Map Column - Sticky on large screens */}
        <div className="hidden lg:block lg:flex-1">
          <div className="sticky top-24 h-[500px]">
            <RideComparisonMap
              apiKey={googleMapsApiKey}
              driverRoute={{
                type: "LineString",
                coordinates: ride.routeGeometry.coordinates.map(
                  (coord) => [coord[0], coord[1]] as [number, number],
                ),
              }}
              fromName={ride.fromName}
              toName={ride.toName}
              userPickupPlaceId={userPickupPlaceId}
              userDropoffPlaceId={userDropoffPlaceId}
              userPickupName={userPickupDetails?.name}
              userDropoffName={userDropoffDetails?.name}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
