"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  Bike,
  Calendar,
  Clock,
  Dog,
  Luggage,
  MapPin,
  Snowflake,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Badge } from "@app/ui/badge";
import { Skeleton } from "@app/ui/skeleton";

import { useTRPC } from "~/trpc/react";

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface RideWantedCardProps {
  request: {
    id: string;
    fromName: string;
    toName: string;
    departureTime: Date;
    seatsNeeded: number;
    maxPricePerSeat: number | null;
    flexibilityMinutes: number | null;
    description: string | null;
    luggageSize: string | null;
    hasBike: boolean | null;
    hasSkis: boolean | null;
    hasPet: boolean | null;
    passenger: {
      id: string;
      name: string;
      image: string | null;
    };
  };
}

function RideWantedCard({ request }: RideWantedCardProps) {
  const departureDate = new Date(request.departureTime);

  return (
    <Link href={`/passengers/request/${request.id}`} className="block">
      <div className="hover:bg-muted/50 hover:border-primary/20 rounded-lg border p-4 transition-all">
        {/* Top row: Passenger info and budget */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage
                src={request.passenger.image ?? undefined}
                alt={request.passenger.name}
              />
              <AvatarFallback>
                {getInitials(request.passenger.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{request.passenger.name}</p>
              <div className="text-muted-foreground flex items-center gap-1 text-sm">
                <Users className="size-3" />
                <span>
                  {request.seatsNeeded} seat{request.seatsNeeded !== 1 ? "s" : ""}{" "}
                  needed
                </span>
              </div>
            </div>
          </div>
          {request.maxPricePerSeat && (
            <div className="text-right">
              <p className="text-xl font-bold">
                Up to ${(request.maxPricePerSeat / 100).toFixed(0)}
              </p>
              <p className="text-muted-foreground text-sm">per seat</p>
            </div>
          )}
        </div>

        {/* Route info */}
        <div className="mb-4 space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="bg-primary size-2 rounded-full" />
              <div className="bg-border h-8 w-px" />
              <div className="size-2 rounded-full bg-red-500" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="font-medium">{request.fromName}</p>
              </div>
              <div>
                <p className="font-medium">{request.toName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description if present */}
        {request.description && (
          <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
            {request.description}
          </p>
        )}

        {/* Bottom row: Date, time, preferences */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar className="text-muted-foreground size-4" />
            <span>{format(departureDate, "EEE, MMM d")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="text-muted-foreground size-4" />
            <span>{format(departureDate, "h:mm a")}</span>
          </div>
          {request.flexibilityMinutes && request.flexibilityMinutes > 0 && (
            <Badge variant="secondary" className="text-xs">
              ±{request.flexibilityMinutes} min flexible
            </Badge>
          )}
          {request.luggageSize && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Luggage className="size-3" />
              {request.luggageSize}
            </Badge>
          )}
          {request.hasBike && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Bike className="size-3" />
              Bike
            </Badge>
          )}
          {request.hasSkis && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Snowflake className="size-3" />
              Skis
            </Badge>
          )}
          {request.hasPet && (
            <Badge variant="outline" className="gap-1 text-xs">
              <Dog className="size-3" />
              Pet
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}

function RideWantedListSkeleton() {
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
              <Skeleton className="ml-auto h-6 w-16" />
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

export function RideWantedList() {
  const trpc = useTRPC();

  const { data, isLoading, error } = useQuery(
    trpc.rideWanted.list.queryOptions({ limit: 20 }),
  );

  if (isLoading) {
    return <RideWantedListSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <Users className="text-muted-foreground mb-4 size-12" />
        <h3 className="text-lg font-medium">Something went wrong</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          We couldn&apos;t load the ride requests. Please try again.
        </p>
      </div>
    );
  }

  if (!data?.items || data.items.length === 0) {
    return (
      <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <MapPin className="text-muted-foreground mb-4 size-12" />
        <h3 className="text-lg font-medium">No ride requests yet</h3>
        <p className="text-muted-foreground mt-1 text-center text-sm">
          No passengers are currently looking for rides.
          <br />
          Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.items.map((request) => (
        <RideWantedCard key={request.id} request={request} />
      ))}
    </div>
  );
}
