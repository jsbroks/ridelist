"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Car, Navigation } from "lucide-react";

import { Button } from "@app/ui/button";
import { Skeleton } from "@app/ui/skeleton";

import { useTRPC } from "~/trpc/react";

interface SearchResultsProps {
  fromPlaceId: string | null;
  toPlaceId: string | null;
}

export function SearchResults({ fromPlaceId, toPlaceId }: SearchResultsProps) {
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
  const hasRoute = !!fromData && !!toData;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
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

  if (hasRoute) {
    return (
      <div className="bg-muted/50 flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <Car className="text-muted-foreground mb-4 size-12" />
        <h3 className="text-lg font-medium">No rides available</h3>
        <p className="text-muted-foreground mt-1 text-center text-sm">
          No rides found for this route yet.
          <br />
          Check back later or post your own ride!
        </p>
        <Button className="mt-4" asChild>
          <a href="/post">Post a Ride</a>
        </Button>
      </div>
    );
  }

  return null;
}

export function SearchResultsHeader({
  fromPlaceId,
  toPlaceId,
}: SearchResultsProps) {
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
  const hasRoute = !!fromData && !!toData;

  if (!hasRoute) return null;

  return (
    <span className="text-muted-foreground text-sm">
      {isLoading ? "Loading..." : "0 rides found"}
    </span>
  );
}
