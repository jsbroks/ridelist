"use client";

import type React from "react";
import { Navigation, Plus, X } from "lucide-react";

import { Button } from "@app/ui/button";
import { Label } from "@app/ui/label";

import type { PlacePrediction } from "~/app/_components/location-picker";
import type { RouteInfo, TownSuggestion } from "~/app/_components/route-map";
import { LocationPicker } from "~/app/_components/location-picker";

interface StopBadgeProps {
  stop: TownSuggestion;
  index: number;
  onRemove: (placeId: string) => void;
}

export const StopBadge: React.FC<StopBadgeProps> = ({
  stop,
  index,
  onRemove,
}) => {
  return (
    <div className="bg-primary/10 border-primary/20 flex items-center gap-2 rounded-full border py-1.5 pr-2 pl-3">
      <span className="bg-primary/20 text-primary flex size-5 items-center justify-center rounded-full text-xs font-medium">
        {index + 1}
      </span>
      <span className="text-sm font-medium">{stop.name}</span>
      <button
        type="button"
        onClick={() => onRemove(stop.placeId)}
        className="text-muted-foreground hover:text-foreground ml-1 transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
};

interface SuggestedStopButtonProps {
  town: TownSuggestion;
  onAdd: (town: TownSuggestion) => void;
}

export const SuggestedStopButton: React.FC<SuggestedStopButtonProps> = ({
  town,
  onAdd,
}) => {
  return (
    <button
      type="button"
      onClick={() => onAdd(town)}
      className="hover:border-primary hover:bg-primary/5 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
    >
      <Plus className="size-3.5" />
      {town.name}
    </button>
  );
};

interface ManualStopInputProps {
  value: PlacePrediction | null;
  onChange: (place: PlacePrediction | null) => void;
  onCancel: () => void;
}

export const ManualStopInput: React.FC<ManualStopInputProps> = ({
  value,
  onChange,
  onCancel,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <LocationPicker
            id="manual-stop"
            label=""
            placeholder="Search for a location..."
            value={value}
            onChange={onChange}
            inputClassName="h-9"
          />
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
};

interface StopsSectionProps {
  stops: TownSuggestion[];
  townSuggestions: TownSuggestion[];
  routeInfo: RouteInfo | null;
  isAddingStop: boolean;
  manualStopInput: PlacePrediction | null;
  onAddStop: (town: TownSuggestion) => void;
  onRemoveStop: (placeId: string) => void;
  onManualStopChange: (place: PlacePrediction | null) => void;
  onStartAddingStop: () => void;
  onCancelAddingStop: () => void;
}

export const StopsSection: React.FC<StopsSectionProps> = ({
  stops,
  townSuggestions,
  routeInfo,
  isAddingStop,
  manualStopInput,
  onAddStop,
  onRemoveStop,
  onManualStopChange,
  onStartAddingStop,
  onCancelAddingStop,
}) => {
  const availableSuggestions = townSuggestions.filter(
    (town) => !stops.some((s) => s.placeId === town.placeId),
  );

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Stops Along the Way</Label>
          <p className="text-muted-foreground mt-1 text-xs">
            Add pickup/dropoff points for passengers
            {routeInfo && routeInfo.distanceKm > 50 && (
              <span className="text-primary ml-1">
                (auto-suggested for trips over 50km)
              </span>
            )}
          </p>
        </div>
        {routeInfo && (
          <span className="text-muted-foreground text-xs">
            {routeInfo.distance} • {routeInfo.duration}
          </span>
        )}
      </div>

      {/* Current stops */}
      {stops.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stops.map((stop, index) => (
            <StopBadge
              key={stop.placeId}
              stop={stop}
              index={index}
              onRemove={onRemoveStop}
            />
          ))}
        </div>
      )}

      {/* Suggested stops */}
      {availableSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">Suggested stops:</p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((town) => (
              <SuggestedStopButton
                key={town.placeId}
                town={town}
                onAdd={onAddStop}
              />
            ))}
          </div>
        </div>
      )}

      {/* Manual stop input */}
      {isAddingStop ? (
        <ManualStopInput
          value={manualStopInput}
          onChange={onManualStopChange}
          onCancel={onCancelAddingStop}
        />
      ) : (
        <button
          type="button"
          onClick={onStartAddingStop}
          className="hover:border-primary hover:bg-primary/5 flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm transition-colors"
        >
          <Plus className="size-4" />
          Add a stop
        </button>
      )}

      {/* Empty state */}
      {stops.length === 0 && townSuggestions.length === 0 && !isAddingStop && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Navigation className="size-4" />
          <span>
            No stops added yet. Add stops or wait for route suggestions.
          </span>
        </div>
      )}
    </div>
  );
};
