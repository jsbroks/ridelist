"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfDay } from "date-fns";
import GithubSlugger from "github-slugger";
import { ArrowRightLeft, CalendarIcon, Search, Users } from "lucide-react";

import { Button } from "@app/ui/button";
import { Calendar } from "@app/ui/calendar";
import { Label } from "@app/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@app/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/ui/select";

import type { PlacePrediction } from "~/app/_components/location-picker";
import { LocationPicker } from "~/app/_components/location-picker";

const slugger = new GithubSlugger();

type SearchMode = "driver" | "passenger";

interface RideSearchProps {
  showLabels?: boolean;
  fromLocation?: PlacePrediction | null;
  onLocationChange?: (location: PlacePrediction | null) => void;
  toLocation?: PlacePrediction | null;
  onToLocationChange?: (location: PlacePrediction | null) => void;
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  mode?: SearchMode;
  onModeChange?: (mode: SearchMode) => void;
}

interface RideSearchWithStateProps {
  showLabels?: boolean;
  initialFromLocation?: PlacePrediction | null;
  initialToLocation?: PlacePrediction | null;
  initialDate?: Date;
  initialMode?: SearchMode;
}

export function RideSearchWithState({
  showLabels = true,
  initialFromLocation = null,
  initialToLocation = null,
  initialDate,
  initialMode = "driver",
}: RideSearchWithStateProps) {
  const [fromLocation, setFromLocation] = useState<PlacePrediction | null>(
    initialFromLocation,
  );
  const [toLocation, setToLocation] = useState<PlacePrediction | null>(
    initialToLocation,
  );
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [mode, setMode] = useState<SearchMode>(initialMode);
  return (
    <RideSearch
      showLabels={showLabels}
      fromLocation={fromLocation}
      onLocationChange={setFromLocation}
      toLocation={toLocation}
      onToLocationChange={setToLocation}
      date={date}
      onDateChange={setDate}
      mode={mode}
      onModeChange={setMode}
    />
  );
}

export function RideSearch({
  showLabels = true,
  fromLocation,
  onLocationChange,
  toLocation,
  onToLocationChange,
  date,
  onDateChange,
  onModeChange,
  mode = "driver",
}: RideSearchProps) {
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSearch = () => {
    if (!fromLocation || !toLocation) return;

    // Create a URL-friendly slug from the route
    slugger.reset();
    const slug = slugger.slug(
      fromLocation.mainText + " to " + toLocation.mainText,
    );

    const from = fromLocation.placeId;
    const to = toLocation.placeId;

    // Build URL with search params
    const params = new URLSearchParams({ from, to, mode });

    if (date) {
      params.set("date", format(date, "yyyy-MM-dd"));
    }

    router.push(`/search/${slug}?${params.toString()}`);
  };

  const canSearch = fromLocation && toLocation;

  const handleSwapLocations = () => {
    const temp = fromLocation;
    onLocationChange?.(toLocation ?? null);
    onToLocationChange?.(temp ?? null);
  };

  const isPassengerMode = mode === "passenger";

  return (
    <div className="bg-card/80 rounded-xl border p-6 shadow-lg backdrop-blur-sm">
      <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto_1fr_auto_auto]">
        <div>
          {showLabels && (
            <Label className="pb-2">I&apos;m looking for...</Label>
          )}
          <Select value={mode} onValueChange={onModeChange}>
            <SelectTrigger className="w-full min-w-48">
              <SelectValue placeholder="Select a mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="passengers">Passengers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <LocationPicker
          label={
            showLabels
              ? isPassengerMode
                ? "Your Starting Point"
                : "From"
              : undefined
          }
          placeholder={
            isPassengerMode
              ? "Where are you leaving from..."
              : "Leaving from..."
          }
          value={fromLocation ?? null}
          onChange={
            onLocationChange ??
            (() => {
              /* empty */
            })
          }
        />

        <div className="flex items-end justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={handleSwapLocations}
            disabled={!fromLocation && !toLocation}
          >
            <ArrowRightLeft className="size-4" />
            <span className="sr-only">Swap locations</span>
          </Button>
        </div>

        <LocationPicker
          label={
            showLabels
              ? isPassengerMode
                ? "Your Destination"
                : "To"
              : undefined
          }
          placeholder={
            isPassengerMode ? "Where are you heading..." : "Going to..."
          }
          value={toLocation ?? null}
          onChange={
            onToLocationChange ??
            (() => {
              /* empty */
            })
          }
        />

        <div className="space-y-2">
          {showLabels && <Label>Date (optional)</Label>}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-9 w-full justify-start text-left font-normal lg:w-48"
              >
                <CalendarIcon className="text-muted-foreground size-4" />
                {date ? (
                  format(date, "PPP")
                ) : (
                  <span className="text-muted-foreground">Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  onDateChange?.(newDate);
                  setCalendarOpen(false);
                }}
                disabled={(date) => date < startOfDay(new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-end">
          <Button
            className="h-9 w-full lg:w-auto"
            size="lg"
            disabled={!canSearch}
            onClick={handleSearch}
          >
            {isPassengerMode ? (
              <Users className="size-4" />
            ) : (
              <Search className="size-4" />
            )}
            {isPassengerMode ? "Find Passengers" : "Find a Driver"}
          </Button>
        </div>
      </div>
    </div>
  );
}
