"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@app/ui/button";

import type { PlacePrediction } from "~/app/_components/location-picker";
import { LocationPicker } from "~/app/_components/location-picker";

interface UserRouteSelectorProps {
  rideId: string;
  initialPickup?: PlacePrediction | null;
  initialDropoff?: PlacePrediction | null;
}

export function UserRouteSelector({
  rideId,
  initialPickup = null,
  initialDropoff = null,
}: UserRouteSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateUrl = useCallback(
    (pickup: PlacePrediction | null, dropoff: PlacePrediction | null) => {
      const params = new URLSearchParams(searchParams);

      if (pickup) {
        params.set("pickup", pickup.placeId);
      } else {
        params.delete("pickup");
      }

      if (dropoff) {
        params.set("dropoff", dropoff.placeId);
      } else {
        params.delete("dropoff");
      }

      const newUrl =
        params.toString() === ""
          ? `/ride/${rideId}`
          : `/ride/${rideId}?${params.toString()}`;

      router.replace(newUrl);
    },
    [rideId, router, searchParams],
  );

  const handlePickupChange = (value: PlacePrediction | null) => {
    const currentDropoff = searchParams.get("dropoff");
    const dropoff = currentDropoff
      ? initialDropoff?.placeId === currentDropoff
        ? initialDropoff
        : null
      : null;
    updateUrl(value, dropoff ?? initialDropoff);
  };

  const handleDropoffChange = (value: PlacePrediction | null) => {
    const currentPickup = searchParams.get("pickup");
    const pickup = currentPickup
      ? initialPickup?.placeId === currentPickup
        ? initialPickup
        : null
      : null;
    updateUrl(pickup ?? initialPickup, value);
  };

  const handleClear = () => {
    updateUrl(null, null);
  };

  const hasComparison =
    searchParams.has("pickup") || searchParams.has("dropoff");

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <LocationPicker
          label="Your pickup"
          placeholder="Where do you need to be picked up?"
          value={initialPickup}
          onChange={handlePickupChange}
          id="user-pickup"
        />
        <LocationPicker
          label="Your dropoff"
          placeholder="Where are you going?"
          value={initialDropoff}
          onChange={handleDropoffChange}
          id="user-dropoff"
        />
      </div>

      {hasComparison && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="mr-2 size-4" />
          Clear locations
        </Button>
      )}
    </div>
  );
}
