"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

import { RouteMap } from "~/app/_components/route-map";
import { useTRPC } from "~/trpc/react";

interface SearchMapProps {
  fromPlaceId: string | null;
  toPlaceId: string | null;
}

export function SearchMap({ fromPlaceId, toPlaceId }: SearchMapProps) {
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
  const hasRoute = !!fromData && !!toData && !!fromPlaceId && !!toPlaceId;

  if (isLoading) {
    return (
      <div className="bg-muted/30 flex h-full items-center justify-center">
        <div className="text-center">
          <MapPin className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">Loading route...</p>
        </div>
      </div>
    );
  }

  if (!hasRoute) {
    return (
      <div className="bg-muted/30 flex h-full items-center justify-center">
        <div className="text-center">
          <MapPin className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">
            Select a route to view the map
          </p>
        </div>
      </div>
    );
  }

  return (
    <RouteMap
      fromPlaceId={fromPlaceId}
      toPlaceId={toPlaceId}
      fromName={fromData.name ?? undefined}
      toName={toData.name ?? undefined}
      stops={[]}
    />
  );
}
