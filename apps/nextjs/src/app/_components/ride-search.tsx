"use client";

import { useState } from "react";
import { format, startOfDay } from "date-fns";
import { ArrowRightLeft, CalendarIcon, Search } from "lucide-react";

import { Button } from "@app/ui/button";
import { Calendar } from "@app/ui/calendar";
import { Label } from "@app/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@app/ui/popover";

import type { PlacePrediction } from "~/app/_components/location-picker";
import { LocationPicker } from "~/app/_components/location-picker";

export function RideSearch() {
  const [fromLocation, setFromLocation] = useState<PlacePrediction | null>(
    null,
  );
  const [toLocation, setToLocation] = useState<PlacePrediction | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleSearch = () => {
    console.log("Search:", {
      from: fromLocation,
      to: toLocation,
      date: date,
    });
  };

  const canSearch = fromLocation && toLocation;

  const handleSwapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="bg-card/80 rounded-xl border p-6 shadow-lg backdrop-blur-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_auto]">
          <LocationPicker
            label="From"
            placeholder="Leaving from..."
            value={fromLocation}
            onChange={setFromLocation}
          />

          <div className="flex items-end justify-center pb-1">
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
            label="To"
            placeholder="Going to..."
            value={toLocation}
            onChange={setToLocation}
          />

          <div className="space-y-2">
            <Label>Date (optional)</Label>
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
                    setDate(newDate);
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
              className="w-full lg:w-auto"
              size="lg"
              disabled={!canSearch}
              onClick={handleSearch}
            >
              <Search className="size-4" />
              Search Rides
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
