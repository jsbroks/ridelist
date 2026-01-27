"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow, startOfDay } from "date-fns";
import { Calendar, Car, MapPin, Navigation, Star, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Button } from "@app/ui/button";
import { Skeleton } from "@app/ui/skeleton";

import { useTRPC } from "~/trpc/react";
import { useSearchContext } from "./search-context";

interface SearchResultsProps {
  fromPlaceId: string | null;
  toPlaceId: string | null;
  date?: string | null;
  mode?: "driver" | "passenger";
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

interface TripData {
  id: string;
  departureTime: Date;
  seatsAvailable: number;
  pickupDistanceKm: number;
  dropoffDistanceKm: number;
  driverRoute: {
    fromName: string;
    toName: string;
    pricePerSeat: number | null;
    routeGeometry: GeoJSON.LineString;
  };
  driver: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface SearchTripCardProps {
  trip: TripData;
  fromPlaceId: string;
  toPlaceId: string;
}

// Group trips by date and sort from newest to oldest
function groupTripsByDate(trips: TripData[]): Map<string, TripData[]> {
  const grouped = new Map<string, TripData[]>();

  // Sort trips by departure time (newest first)
  const sortedTrips = [...trips].sort(
    (a, b) =>
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
  );

  for (const trip of sortedTrips) {
    const dateKey = startOfDay(new Date(trip.departureTime)).toISOString();
    const existing = grouped.get(dateKey) ?? [];
    grouped.set(dateKey, [...existing, trip]);
  }

  // Sort date keys (earliest dates first for upcoming trips)
  const sortedEntries = [...grouped.entries()].sort(
    ([a], [b]) => new Date(a).getTime() - new Date(b).getTime(),
  );

  return new Map(sortedEntries);
}

// Format date header
function formatDateHeader(dateKey: string): string {
  const date = new Date(dateKey);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMMM d");
}

function SearchTripCard({ trip, fromPlaceId, toPlaceId }: SearchTripCardProps) {
  const departureDate = new Date(trip.departureTime);
  const { setHoveredTrip } = useSearchContext();

  const handleMouseEnter = () => {
    const { driverRoute, id } = trip;
    setHoveredTrip({
      id,
      routeGeometry: driverRoute.routeGeometry,
      fromName: driverRoute.fromName,
      toName: driverRoute.toName,
    });
  };

  const handleMouseLeave = () => {
    setHoveredTrip(null);
  };

  return (
    <Link
      href={`/ride/${trip.id}?pickup=${fromPlaceId}&dropoff=${toPlaceId}`}
      className="block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="hover:bg-muted/50 hover:border-primary/20 rounded-lg border p-4 transition-all">
        {/* Top row: Driver info and price */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage
                src={trip.driver.image ?? undefined}
                alt={trip.driver.name}
              />
              <AvatarFallback>{getInitials(trip.driver.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{trip.driver.name}</p>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <Star className="size-3 fill-yellow-400 text-yellow-400" />
                <span>New driver</span>
              </div>
            </div>
          </div>
          {/* Departure time - prominent */}
          <div className="text-center">
            <p className="text-xl font-bold">
              {format(departureDate, "h:mm a")}
            </p>
            <p className="text-muted-foreground text-xs">departure</p>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-xl font-bold">
              ${((trip.driverRoute.pricePerSeat ?? 0) / 100).toFixed(0)}
            </p>
            <p className="text-muted-foreground text-xs">per seat</p>
          </div>
        </div>

        {/* Route info */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            {/* From */}
            <div className="min-w-0 shrink-0">
              <p className="truncate font-medium">
                {trip.driverRoute.fromName}
              </p>
              <p className="text-muted-foreground text-xs">
                ~{trip.pickupDistanceKm} km from pickup
              </p>
            </div>

            {/* Arrow connector */}
            <div className="flex grow items-center gap-1.5">
              <div className="bg-primary size-2 rounded-full" />
              <div className="bg-border h-px w-full" />
              <div className="size-2 rounded-full bg-red-500" />
            </div>

            {/* To */}
            <div className="min-w-0 shrink-0 text-right">
              <p className="truncate font-medium">{trip.driverRoute.toName}</p>
              <p className="text-muted-foreground text-xs">
                ~{trip.dropoffDistanceKm} km from dropoff
              </p>
            </div>
          </div>
        </div>

        {/* Bottom row: seats available */}
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="text-muted-foreground size-4" />
          <span>
            {trip.seatsAvailable} seat{trip.seatsAvailable !== 1 ? "s" : ""}{" "}
            available
          </span>
        </div>
      </div>
    </Link>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="ml-auto h-6 w-12" />
              <Skeleton className="ml-auto h-3 w-14" />
            </div>
          </div>
          <div className="mb-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchResults({
  fromPlaceId,
  toPlaceId,
  date,
  mode = "driver",
}: SearchResultsProps) {
  const trpc = useTRPC();
  const isPassengerSearch = mode === "passenger";

  // Fetch place details to get lat/lng
  const { data: fromData, isLoading: fromLoading } = useQuery(
    trpc.places.getDetails.queryOptions(
      { placeId: fromPlaceId ?? "" },
      { enabled: !!fromPlaceId },
    ),
  );

  const { data: toData, isLoading: toLoading } = useQuery(
    trpc.places.getDetails.queryOptions(
      { placeId: toPlaceId ?? "" },
      { enabled: !!toPlaceId },
    ),
  );

  // Only search when we have both locations with coordinates
  const canSearch =
    !!fromData?.location && !!toData?.location && !!fromPlaceId && !!toPlaceId;

  const from = {
    lat: fromData?.location?.lat ?? 0,
    lng: fromData?.location?.lng ?? 0,
  };
  const to = {
    lat: toData?.location?.lat ?? 0,
    lng: toData?.location?.lng ?? 0,
  };

  // Search for trips
  const {
    data: tripResults,
    isLoading: tripLoading,
    error: tripError,
  } = useQuery(
    trpc.search.findDrivers.queryOptions(
      {
        pickup: from,
        dropoff: to,
        date: date ? new Date(date) : undefined,
        radiusKm: 25,
        limit: 20,
      },
      { enabled: canSearch && !isPassengerSearch },
    ),
  );

  const searchResults = tripResults;
  const searchError = tripError;
  const searchLoading = tripLoading;

  const isLoading = fromLoading || toLoading || (canSearch && searchLoading);

  // Group trips by date (must be before early returns for hook rules)
  const groupedTrips = useMemo(() => {
    if (!tripResults) return new Map<string, TripData[]>();
    const tripsWithSeats = tripResults.map((trip) => ({
      ...trip,
      seatsAvailable: 0,
    }));
    return groupTripsByDate(tripsWithSeats);
  }, [tripResults]);

  if (isLoading) {
    return <SearchResultsSkeleton />;
  }

  if (!fromPlaceId || !toPlaceId) {
    return (
      <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <Navigation className="text-muted-foreground mb-4 size-12" />
        <h3 className="text-lg font-medium">Missing route information</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Please provide both &apos;from&apos; and &apos;to&apos; place IDs in
          the URL
        </p>
      </div>
    );
  }

  if (!fromData?.location || !toData?.location) {
    return (
      <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <MapPin className="text-muted-foreground mb-4 size-12" />
        <h3 className="text-lg font-medium">Location not found</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          We couldn&apos;t find the coordinates for the selected locations.
        </p>
      </div>
    );
  }

  if (searchError) {
    return (
      <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        {isPassengerSearch ? (
          <Users className="text-muted-foreground mb-4 size-12" />
        ) : (
          <Car className="text-muted-foreground mb-4 size-12" />
        )}
        <h3 className="text-lg font-medium">Something went wrong</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          We couldn&apos;t load the search results. Please try again.
        </p>
      </div>
    );
  }

  if (!searchResults || searchResults.length === 0) {
    return (
      <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        {isPassengerSearch ? (
          <Users className="text-muted-foreground mb-4 size-12" />
        ) : (
          <Car className="text-muted-foreground mb-4 size-12" />
        )}
        <h3 className="text-lg font-medium">
          {isPassengerSearch ? "No passengers found" : "No trips available"}
        </h3>
        <p className="text-muted-foreground mt-1 text-center text-sm">
          {isPassengerSearch ? (
            <>
              No passengers are looking for rides along this route yet.
              <br />
              Check back later or post your trip to let them find you!
            </>
          ) : (
            <>
              No trips found for this route yet.
              <br />
              Check back later or post your own trip!
            </>
          )}
        </p>
        <Button className="mt-4" asChild>
          <a href="/post/driver">Post a Trip</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {[...groupedTrips.entries()].map(([dateKey, trips]) => (
        <div key={dateKey}>
          {/* Date header */}
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="text-muted-foreground size-4" />
            <h3 className="text-sm font-semibold">
              {formatDateHeader(dateKey)}
            </h3>
            <span className="text-muted-foreground text-xs">
              ({trips.length} trip{trips.length !== 1 ? "s" : ""})
            </span>
          </div>

          {/* Trips for this date */}
          <div className="space-y-3">
            {trips.map((trip) => (
              <SearchTripCard
                key={trip.id}
                trip={trip}
                fromPlaceId={fromPlaceId}
                toPlaceId={toPlaceId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SearchResultsHeader({
  fromPlaceId,
  toPlaceId,
  date,
  mode = "driver",
}: SearchResultsProps) {
  const trpc = useTRPC();
  const isPassengerSearch = mode === "passenger";

  // Fetch place details to get lat/lng
  const { data: fromData, isLoading: fromLoading } = useQuery(
    trpc.places.getDetails.queryOptions(
      { placeId: fromPlaceId ?? "" },
      { enabled: !!fromPlaceId },
    ),
  );

  const { data: toData, isLoading: toLoading } = useQuery(
    trpc.places.getDetails.queryOptions(
      { placeId: toPlaceId ?? "" },
      { enabled: !!toPlaceId },
    ),
  );

  // Only search when we have both locations with coordinates
  const canSearch =
    !!fromData?.location && !!toData?.location && !!fromPlaceId && !!toPlaceId;

  const { data: tripResults, isLoading: tripLoading } = useQuery(
    trpc.search.findDrivers.queryOptions(
      {
        pickup: {
          lat: fromData?.location?.lat ?? 0,
          lng: fromData?.location?.lng ?? 0,
        },
        dropoff: {
          lat: toData?.location?.lat ?? 0,
          lng: toData?.location?.lng ?? 0,
        },
        date: date ? new Date(date) : undefined,
        radiusKm: 25,
        limit: 20,
      },
      { enabled: canSearch && !isPassengerSearch },
    ),
  );

  const { data: passengerResults, isLoading: passengerLoading } = useQuery(
    trpc.search.findPassengers.queryOptions(
      {
        routeGeometry: {
          type: "LineString" as const,
          coordinates: [], // This would need the driver's route geometry
        },
        date: date ? new Date(date) : undefined,
        radiusKm: 50,
        limit: 20,
      },
      { enabled: false }, // Disabled until we have driver's route
    ),
  );

  const searchResults = isPassengerSearch ? passengerResults : tripResults;
  const searchLoading = isPassengerSearch ? passengerLoading : tripLoading;

  const isLoading = fromLoading || toLoading || (canSearch && searchLoading);

  if (!fromData?.location || !toData?.location) return null;

  const count = searchResults?.length ?? 0;
  const label = isPassengerSearch ? "passenger" : "trip";

  return (
    <span className="text-muted-foreground text-sm">
      {isLoading
        ? "Searching..."
        : `${count} ${label}${count !== 1 ? "s" : ""} found`}
    </span>
  );
}
