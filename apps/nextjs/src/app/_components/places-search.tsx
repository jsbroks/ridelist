"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@app/ui/combobox";

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

export function PlacesSearch() {
  const [inputValue, setInputValue] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlacePrediction | null>(
    null,
  );
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
    <div className="mx-auto w-full max-w-xl space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          Places Autocomplete (Canada)
        </h2>
        <p className="text-muted-foreground text-sm">
          Search and select a place using the Google Places Autocomplete API
        </p>
      </div>

      <Combobox
        open={open}
        onOpenChange={setOpen}
        value={selectedPlace}
        onValueChange={setSelectedPlace}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
      >
        <ComboboxInput
          placeholder="Search for a place in Canada..."
          className="w-full"
          value={selectedPlace?.mainText}
          showClear={!!inputValue}
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
                    <MapPin className="text-muted-foreground size-4" />
                    <div>
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
            {debouncedQuery === "" ||
              (debouncedQuery !== "" &&
                predictions.length === 0 &&
                !isLoading && (
                  <ComboboxEmpty>
                    {debouncedQuery === "" &&
                      "Start typing to search for places"}
                    {debouncedQuery !== "" &&
                      `No places found for "${debouncedQuery}"`}
                  </ComboboxEmpty>
                ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {selectedPlace && (
        <div className="bg-muted/50 rounded-lg border p-4">
          <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
            Selected Place
          </p>
          <p className="font-medium">{selectedPlace.mainText}</p>
          {selectedPlace.secondaryText && (
            <p className="text-muted-foreground text-sm">
              {selectedPlace.secondaryText}
            </p>
          )}
          <p className="text-muted-foreground mt-2 font-mono text-xs">
            Place ID: {selectedPlace.placeId}
          </p>
        </div>
      )}
    </div>
  );
}
