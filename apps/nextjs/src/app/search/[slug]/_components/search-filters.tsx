"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { parse } from "date-fns";

import type { PlacePrediction } from "~/app/_components/location-picker";
import { RideSearch } from "~/app/_components/ride-search";
import { useTRPC } from "~/trpc/react";

interface SearchFiltersProps {
  fromPlaceId: string | null;
  toPlaceId: string | null;
  dateParam: string | null;
  searchType?: "rides" | "wanted";
}

export function SearchFilters({
  fromPlaceId,
  toPlaceId,
  dateParam,
  searchType = "rides",
}: SearchFiltersProps) {
  const trpc = useTRPC();

  // Track user overrides separately from derived values
  const [fromOverride, setFromOverride] = useState<PlacePrediction | null>(
    null,
  );
  const [toOverride, setToOverride] = useState<PlacePrediction | null>(null);
  const [date, setDate] = useState<Date | undefined>(() => {
    if (dateParam) {
      const parsed = parse(dateParam, "yyyy-MM-dd", new Date());
      return isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  });

  const { data: fromData } = useQuery(
    trpc.places.getDetails.queryOptions(
      { placeId: fromPlaceId ?? "" },
      { enabled: !!fromPlaceId },
    ),
  );

  const { data: toData } = useQuery(
    trpc.places.getDetails.queryOptions(
      { placeId: toPlaceId ?? "" },
      { enabled: !!toPlaceId },
    ),
  );

  // Derive from location: use override if set, otherwise derive from query
  const fromLocation = useMemo<PlacePrediction | null>(() => {
    if (fromOverride !== null) return fromOverride;
    if (!fromData || !fromPlaceId) return null;
    return {
      placeId: fromPlaceId,
      description: fromData.formattedAddress ?? "",
      mainText: fromData.name ?? "",
      secondaryText: fromData.formattedAddress ?? null,
      types: [],
    };
  }, [fromOverride, fromData, fromPlaceId]);

  // Derive to location: use override if set, otherwise derive from query
  const toLocation = useMemo<PlacePrediction | null>(() => {
    if (toOverride !== null) return toOverride;
    if (!toData || !toPlaceId) return null;
    return {
      placeId: toPlaceId,
      description: toData.formattedAddress ?? "",
      mainText: toData.name ?? "",
      secondaryText: toData.formattedAddress ?? null,
      types: [],
    };
  }, [toOverride, toData, toPlaceId]);

  return (
    <RideSearch
      showLabels={false}
      fromLocation={fromLocation}
      onLocationChange={setFromOverride}
      toLocation={toLocation}
      onToLocationChange={setToOverride}
      date={date}
      onDateChange={setDate}
      mode={searchType === "wanted" ? "passengers" : "rides"}
    />
  );
}
