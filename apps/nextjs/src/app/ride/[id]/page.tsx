import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  Bike,
  Car,
  Luggage,
  PawPrint,
  Snowflake,
  Star,
  Zap,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Badge } from "@app/ui/badge";
import { Separator } from "@app/ui/separator";

import { getSession } from "~/auth/server";
import { env } from "~/env";
import { fetchQuery, trpc } from "~/trpc/server";
import { RideComparisonMap } from "./_components/ride-comparison-map";
import { UserRouteSelector } from "./_components/user-route-selector";

interface RidePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    pickup?: string; // User's pickup place ID
    dropoff?: string; // User's dropoff place ID
  }>;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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

  // Get driver stats and optionally user's place details for comparison
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

  return (
    <main className="container py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Content Column */}
        <div className="w-full space-y-10 lg:max-w-2xl">
          {/* Header */}
          <section className="mb-8 space-y-6">
            <h1 className="text-2xl font-bold md:text-3xl">
              {ride.fromName} to {ride.toName}
            </h1>

            <div className="space-y-2">
              <div className="flex items-center">
                <span className="w-32 font-medium">Departing:</span>{" "}
                <span>
                  {format(new Date(ride.departureTime), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-medium">Pickup:</span>{" "}
                <span>{ride.fromName}</span>
              </div>
              <div className="flex items-center">
                <span className="w-32 font-medium">Dropoff:</span>{" "}
                <span>{ride.toName}</span>
              </div>
            </div>

            <div>
              {ride.availableSeats} seat{ride.availableSeats === 1 ? "" : "s"}{" "}
              left • ${(ride.pricePerSeat ?? 0) / 100} per seat
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Request a ride</h2>
              <p className="text-muted-foreground text-sm">
                Enter your pickup and dropoff locations to see how they align
                with the driver&apos;s route.
              </p>
              <UserRouteSelector
                rideId={ride.id}
                initialPickup={
                  userPickupDetails && userPickupPlaceId
                    ? {
                        placeId: userPickupPlaceId,
                        description: userPickupDetails.name ?? "",
                        mainText: userPickupDetails.name ?? "",
                        secondaryText:
                          userPickupDetails.formattedAddress ?? null,
                        types: [],
                      }
                    : null
                }
                initialDropoff={
                  userDropoffDetails && userDropoffPlaceId
                    ? {
                        placeId: userDropoffPlaceId,
                        description: userDropoffDetails.name ?? "",
                        mainText: userDropoffDetails.name ?? "",
                        secondaryText:
                          userDropoffDetails.formattedAddress ?? null,
                        types: [],
                      }
                    : null
                }
              />
            </div>
          </section>

          <Separator />

          <section className="space-y-6">
            <Link
              href={`/profile/${ride.driver.id}`}
              className="group flex items-center gap-4"
            >
              <Avatar className="size-16">
                <AvatarImage
                  src={ride.driver.image ?? undefined}
                  alt={ride.driver.name}
                />
                <AvatarFallback className="text-lg">
                  {getInitials(ride.driver.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold group-hover:underline">
                  {ride.driver.name}
                </p>
                {driverStats?.averageRating != null ? (
                  <div className="mt-1 flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {driverStats.averageRating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      ({driverStats.totalReviews} reviews)
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    No reviews yet
                  </span>
                )}
              </div>
            </Link>

            <div>
              {ride.description ? (
                <div style={{ whiteSpace: "pre-wrap" }}>{ride.description}</div>
              ) : (
                <span className="text-muted-foreground text-sm">
                  No description
                </span>
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Vehicle & Amenities</h2>

            {/* Vehicle info - placeholder for future data */}
            <div className="flex items-center gap-4 rounded-lg border p-4">
              <div className="bg-muted flex size-16 items-center justify-center rounded-lg">
                <Car className="text-muted-foreground size-8" />
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">
                  Vehicle details not provided
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Contact the driver for more information about the vehicle
                </p>
              </div>
            </div>

            {/* Amenities */}
            <div>
              <p className="text-muted-foreground mb-3 text-sm">
                Ride features
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Luggage size */}
                {ride.luggageSize && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Luggage className="size-3" />
                    {ride.luggageSize === "small"
                      ? "Small luggage"
                      : ride.luggageSize === "medium"
                        ? "Medium luggage"
                        : "Large luggage"}
                  </Badge>
                )}

                {/* Winter tires */}
                {ride.hasWinterTires && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Snowflake className="size-3" />
                    Winter tires
                  </Badge>
                )}

                {/* Bikes allowed */}
                {ride.allowsBikes && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Bike className="size-3" />
                    Bikes
                  </Badge>
                )}

                {/* Skis allowed */}
                {ride.allowsSkis && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Snowflake className="size-3" />
                    Skis
                  </Badge>
                )}

                {/* Pets allowed */}
                {ride.allowsPets && (
                  <Badge variant="secondary" className="gap-1.5">
                    <PawPrint className="size-3" />
                    Pet friendly
                  </Badge>
                )}

                {/* A/C */}
                {ride.hasAC && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Snowflake className="size-3" />
                    A/C
                  </Badge>
                )}

                {/* Phone charging */}
                {ride.hasPhoneCharging && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Zap className="size-3" />
                    Phone charging
                  </Badge>
                )}

                {/* Show message if no features specified */}
                {!ride.luggageSize &&
                  !ride.hasWinterTires &&
                  !ride.allowsBikes &&
                  !ride.allowsSkis &&
                  !ride.allowsPets &&
                  !ride.hasAC &&
                  !ride.hasPhoneCharging && (
                    <p className="text-muted-foreground text-sm">
                      No specific features listed for this ride.
                    </p>
                  )}
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Request a ride</h2>
            <p className="text-muted-foreground text-sm">
              Enter your pickup and dropoff locations to see how they align with
              the driver&apos;s route.
            </p>
            <UserRouteSelector
              rideId={ride.id}
              initialPickup={
                userPickupDetails && userPickupPlaceId
                  ? {
                      placeId: userPickupPlaceId,
                      description: userPickupDetails.name ?? "",
                      mainText: userPickupDetails.name ?? "",
                      secondaryText: userPickupDetails.formattedAddress ?? null,
                      types: [],
                    }
                  : null
              }
              initialDropoff={
                userDropoffDetails && userDropoffPlaceId
                  ? {
                      placeId: userDropoffPlaceId,
                      description: userDropoffDetails.name ?? "",
                      mainText: userDropoffDetails.name ?? "",
                      secondaryText:
                        userDropoffDetails.formattedAddress ?? null,
                      types: [],
                    }
                  : null
              }
            />
          </section>
        </div>

        {/* Map Column - Sticky on large screens */}
        <div className="hidden lg:block lg:flex-1">
          <div className="sticky top-24 h-[500px]">
            <RideComparisonMap
              apiKey={googleMapsApiKey}
              driverRoute={ride.routeGeometry}
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
