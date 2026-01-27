"use client";

import type React from "react";
import { ArrowRight, MapPin } from "lucide-react";

import type { PlacePrediction } from "~/app/_components/location-picker";
import { LocationPicker } from "~/app/_components/location-picker";

interface RouteSectionProps {
  fromLocation: PlacePrediction | null;
  toLocation: PlacePrediction | null;
  onFromLocationChange: (location: PlacePrediction | null) => void;
  onToLocationChange: (location: PlacePrediction | null) => void;
  children?: React.ReactNode;
}

export const RouteSection: React.FC<RouteSectionProps> = ({
  fromLocation,
  toLocation,
  onFromLocationChange,
  onToLocationChange,
  children,
}) => {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <MapPin className="text-primary size-5" />
        <h2 className="font-semibold">Route Details</h2>
      </div>

      <div className="space-y-4">
        <LocationPicker
          id="from-location"
          label="Leaving from"
          placeholder="Enter departure city..."
          value={fromLocation}
          onChange={onFromLocationChange}
          inputClassName="h-10"
        />

        <div className="flex justify-center">
          <ArrowRight className="text-muted-foreground size-4 rotate-90" />
        </div>

        <LocationPicker
          id="to-location"
          label="Going to"
          placeholder="Enter destination city..."
          value={toLocation}
          onChange={onToLocationChange}
          inputClassName="h-10"
        />
      </div>

      {children}
    </section>
  );
};
