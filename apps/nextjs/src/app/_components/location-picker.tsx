"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";

import { cn } from "@app/ui";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@app/ui/combobox";
import { Label } from "@app/ui/label";

import { useTRPC } from "~/trpc/react";

function useDebounce<T>(value: T, delay: number): [T, (value: T) => void] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return [debouncedValue, setDebouncedValue];
}

export interface PlacePrediction {
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
  id?: string;
  inputClassName?: string;
}

export function LocationPicker({
  label,
  placeholder,
  value,
  onChange,
  id,
  inputClassName,
}: LocationPickerProps) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useDebounce(inputValue, 300);

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
      <Label htmlFor={id}>{label}</Label>
      <Combobox
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (isOpen) {
            setInputValue(value?.mainText ?? "");
            setDebouncedQuery(value?.mainText ?? "");
          }
        }}
        value={value}
        onValueChange={onChange}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
      >
        <ComboboxInput
          id={id}
          placeholder={placeholder}
          className={cn("h-9 w-full", inputClassName)}
          value={open ? inputValue : value?.mainText}
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
                No places found for &quot;{debouncedQuery}&quot;
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
