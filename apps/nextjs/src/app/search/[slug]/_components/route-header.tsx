"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, MapPin } from "lucide-react";

import { Skeleton } from "@app/ui/skeleton";

import { useTRPC } from "~/trpc/react";

interface RouteHeaderProps {
  fromPlaceId: string | null;
  toPlaceId: string | null;
  dateParam: string | null;
}

export function RouteHeader({
  fromPlaceId,
  toPlaceId,
  dateParam,
}: RouteHeaderProps) {
  const trpc = useTRPC();

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

  const isLoading = fromLoading || toLoading;

  if (!fromPlaceId || !toPlaceId) return null;

  if (isLoading) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-4" />
        <Skeleton className="h-5 w-32" />
      </div>
    );
  }

  if (!fromData || !toData) return null;

  return (
    <div className="text-muted-foreground mt-2 flex items-center gap-2 text-lg">
      <MapPin className="size-5" />
      <span>{fromData.name}</span>
      <ArrowRight className="size-4" />
      <span>{toData.name}</span>
      {dateParam && (
        <>
          <span className="mx-2">•</span>
          <Calendar className="size-4" />
          <span>{dateParam}</span>
        </>
      )}
    </div>
  );
}
