"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import { ArrowRightLeft, CalendarIcon, MapPin, Search } from "lucide-react";

import { Button } from "@app/ui/button";
import { Calendar } from "@app/ui/calendar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@app/ui/combobox";
import { Label } from "@app/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@app/ui/popover";

import { useTRPC } from "~/trpc/react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string | null;
  types: string[];
}

interface LocationPickerProps {
  label: string;
  placeholder: string;
  value: PlacePrediction | null;
  onChange: (value: PlacePrediction | null) => void;
}

function LocationPicker({
  label,
  placeholder,
  value,
  onChange,
}: LocationPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(inputValue, 300);

  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.places.autocomplete.queryOptions(
      { input: debouncedQuery, includePrimaryTypes: [] },
      { enabled: debouncedQuery.length > 0 },
    ),
  );

  const predictions = data?.predictions ?? [];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Combobox
        open={open}
        onOpenChange={setOpen}
        value={value}
        onValueChange={onChange}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
      >
        <ComboboxInput
          placeholder={placeholder}
          className="h-9 w-full"
          value={value?.mainText}
          showClear={!!inputValue || !!value}
        />
        <ComboboxContent>
          <ComboboxList>
            {isLoading && debouncedQuery && (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                <span>Searching...</span>
              </div>
            )}
            {!isLoading &&
              predictions.map((prediction) => (
                <ComboboxItem key={prediction.placeId} value={prediction}>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <MapPin className="text-muted-foreground size-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {prediction.mainText}
                      </p>
                      {prediction.secondaryText && (
                        <p className="text-muted-foreground truncate text-xs">
                          {prediction.secondaryText}
                        </p>
                      )}
                    </div>
                  </div>
                </ComboboxItem>
              ))}
            {!isLoading && debouncedQuery && predictions.length === 0 && (
              <ComboboxEmpty>
                No places found for "{debouncedQuery}"
              </ComboboxEmpty>
            )}
            {!debouncedQuery && (
              <ComboboxEmpty>Start typing to search for places</ComboboxEmpty>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

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
