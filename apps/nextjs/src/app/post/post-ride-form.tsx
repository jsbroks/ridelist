"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, startOfDay } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  CalendarIcon,
  Car,
  Clock,
  DollarSign,
  Info,
  Loader2,
  Luggage,
  MapPin,
  Navigation,
  PawPrint,
  Plus,
  Snowflake,
  Users,
  X,
} from "lucide-react";

import { Button } from "@app/ui/button";
import { Calendar } from "@app/ui/calendar";
import { Checkbox } from "@app/ui/checkbox";
import { Input } from "@app/ui/input";
import { Label } from "@app/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@app/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/ui/select";
import { Separator } from "@app/ui/separator";
import { Textarea } from "@app/ui/textarea";

import type { PlacePrediction } from "~/app/_components/location-picker";
import type { RouteInfo, TownSuggestion } from "~/app/_components/route-map";
import { LocationPicker } from "~/app/_components/location-picker";
import { Navbar } from "~/app/_components/navbar";
import { RouteMap } from "~/app/_components/route-map";

interface PostRideFormProps {
  googleMapsApiKey: string | undefined;
}

export function PostRideForm({ googleMapsApiKey }: PostRideFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [fromLocation, setFromLocation] = useState<PlacePrediction | null>(
    null,
  );
  const [toLocation, setToLocation] = useState<PlacePrediction | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [departureTime, setDepartureTime] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState("");
  const [seats, setSeats] = useState("1");
  const [price, setPrice] = useState("");
  const [luggageSize, setLuggageSize] = useState("medium");
  const [hasWinterTires, setHasWinterTires] = useState(false);
  const [allowsBikes, setAllowsBikes] = useState(false);
  const [allowsSkis, setAllowsSkis] = useState(false);
  const [allowsPets, setAllowsPets] = useState(false);
  const [notes, setNotes] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [returnCalendarOpen, setReturnCalendarOpen] = useState(false);

  // Route and stops state
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [townSuggestions, setTownSuggestions] = useState<TownSuggestion[]>([]);
  const [stops, setStops] = useState<TownSuggestion[]>([]);
  const [hasAutoPopulatedStops, setHasAutoPopulatedStops] = useState(false);
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [manualStopInput, setManualStopInput] =
    useState<PlacePrediction | null>(null);

  // Handle route info changes
  const handleRouteInfoChange = (info: RouteInfo | null) => {
    setRouteInfo(info);
    // Reset auto-population flag when route changes
    if (!info) {
      setHasAutoPopulatedStops(false);
      setStops([]);
    }
  };

  // Handle town suggestions changes and auto-populate stops
  const handleTownSuggestionsChange = (towns: TownSuggestion[]) => {
    setTownSuggestions(towns);

    // Auto-populate stops if trip is over 50km and hasn't been auto-populated yet
    if (
      routeInfo &&
      routeInfo.distanceKm > 50 &&
      !hasAutoPopulatedStops &&
      towns.length > 0
    ) {
      setStops(towns);
      setHasAutoPopulatedStops(true);
    }
  };

  // Add a stop from suggestions
  const addStop = (town: TownSuggestion) => {
    if (!stops.some((s) => s.placeId === town.placeId)) {
      setStops([...stops, town]);
    }
  };

  // Add a stop from manual input
  const addManualStop = (place: PlacePrediction | null) => {
    if (place && !stops.some((s) => s.placeId === place.placeId)) {
      setStops([...stops, { name: place.mainText, placeId: place.placeId }]);
      setManualStopInput(null);
      setIsAddingStop(false);
    }
  };

  // Remove a stop
  const removeStop = (placeId: string) => {
    setStops(stops.filter((s) => s.placeId !== placeId));
  };

  const canSubmit =
    fromLocation && toLocation && date && departureTime && price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

    // Simulate API call
    console.log("Posting ride:", {
      from: fromLocation,
      to: toLocation,
      stops: stops.map((s) => ({ name: s.name, placeId: s.placeId })),
      date,
      departureTime,
      isRoundTrip,
      returnDate: isRoundTrip ? returnDate : undefined,
      returnTime: isRoundTrip ? returnTime : undefined,
      seats: parseInt(seats),
      price: parseFloat(price),
      luggageSize,
      preferences: {
        winterTires: hasWinterTires,
        bikes: allowsBikes,
        skis: allowsSkis,
        pets: allowsPets,
      },
      notes,
      routeInfo,
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Background */}
      <div className="from-primary/5 via-background to-background fixed inset-0 -z-10 bg-linear-to-br" />
      <div className="from-primary/10 fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] via-transparent to-transparent" />

      <Navbar />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Back link */}
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Post a Ride
            </h1>
            <p className="text-muted-foreground">
              Share your journey and connect with passengers heading your way.
            </p>
          </div>

          {/* Two column layout */}
          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Form Column */}
            <div className="w-full lg:max-w-2xl">
              <form onSubmit={handleSubmit}>
                <div className="space-y-10">
                  {/* Route Section */}
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
                        onChange={setFromLocation}
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
                        onChange={setToLocation}
                        inputClassName="h-10"
                      />
                    </div>

                    {/* Stops Section - Shows when route is set */}
                    {fromLocation && toLocation && (
                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">
                              Stops Along the Way
                            </Label>
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
                              <div
                                key={stop.placeId}
                                className="bg-primary/10 border-primary/20 flex items-center gap-2 rounded-full border py-1.5 pr-2 pl-3"
                              >
                                <span className="bg-primary/20 text-primary flex size-5 items-center justify-center rounded-full text-xs font-medium">
                                  {index + 1}
                                </span>
                                <span className="text-sm font-medium">
                                  {stop.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeStop(stop.placeId)}
                                  className="text-muted-foreground hover:text-foreground ml-1 transition-colors"
                                >
                                  <X className="size-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Suggested stops */}
                        {townSuggestions.filter(
                          (town) =>
                            !stops.some((s) => s.placeId === town.placeId),
                        ).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-muted-foreground text-xs">
                              Suggested stops:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {townSuggestions
                                .filter(
                                  (town) =>
                                    !stops.some(
                                      (s) => s.placeId === town.placeId,
                                    ),
                                )
                                .map((town) => (
                                  <button
                                    key={town.placeId}
                                    type="button"
                                    onClick={() => addStop(town)}
                                    className="hover:border-primary hover:bg-primary/5 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors"
                                  >
                                    <Plus className="size-3.5" />
                                    {town.name}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Manual stop input */}
                        {isAddingStop ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <LocationPicker
                                  id="manual-stop"
                                  label=""
                                  placeholder="Search for a location..."
                                  value={manualStopInput}
                                  onChange={(place) => {
                                    setManualStopInput(place);
                                    if (place) {
                                      addManualStop(place);
                                    }
                                  }}
                                  inputClassName="h-9"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setIsAddingStop(false);
                                  setManualStopInput(null);
                                }}
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsAddingStop(true)}
                            className="hover:border-primary hover:bg-primary/5 flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm transition-colors"
                          >
                            <Plus className="size-4" />
                            Add a stop
                          </button>
                        )}

                        {/* Empty state */}
                        {stops.length === 0 &&
                          townSuggestions.length === 0 &&
                          !isAddingStop && (
                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                              <Navigation className="size-4" />
                              <span>
                                No stops added yet. Add stops or wait for route
                                suggestions.
                              </span>
                            </div>
                          )}
                      </div>
                    )}
                  </section>

                  <Separator />

                  {/* Date & Time Section */}
                  <section>
                    <div className="mb-6 flex items-center gap-3">
                      <CalendarIcon className="text-primary size-5" />
                      <h2 className="font-semibold">Date & Time</h2>
                    </div>

                    <div className="space-y-6">
                      {/* Departure */}
                      <div>
                        <p className="text-muted-foreground mb-3 text-sm">
                          Departure
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Popover
                              open={calendarOpen}
                              onOpenChange={setCalendarOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  id="date"
                                  variant="outline"
                                  className="h-10 w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="text-muted-foreground size-4" />
                                  {date ? (
                                    format(date, "PPP")
                                  ) : (
                                    <span className="text-muted-foreground">
                                      Pick a date
                                    </span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={date}
                                  onSelect={(newDate) => {
                                    setDate(newDate);
                                    setCalendarOpen(false);
                                  }}
                                  disabled={(d) => d < startOfDay(new Date())}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <div className="relative">
                              <Clock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                              <Input
                                id="time"
                                type="time"
                                value={departureTime}
                                onChange={(e) =>
                                  setDepartureTime(e.target.value)
                                }
                                className="h-10 pl-10"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Round Trip Toggle */}
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="round-trip"
                          checked={isRoundTrip}
                          onCheckedChange={(checked) => {
                            setIsRoundTrip(checked === true);
                            if (!checked) {
                              setReturnDate(undefined);
                              setReturnTime("");
                            }
                          }}
                        />
                        <Label
                          htmlFor="round-trip"
                          className="cursor-pointer font-normal"
                        >
                          This is a round trip (optional)
                        </Label>
                      </div>

                      {/* Return - only shown if round trip */}
                      {isRoundTrip && (
                        <div>
                          <p className="text-muted-foreground mb-3 text-sm">
                            Return
                          </p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="return-date">Date</Label>
                              <Popover
                                open={returnCalendarOpen}
                                onOpenChange={setReturnCalendarOpen}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    id="return-date"
                                    variant="outline"
                                    className="h-10 w-full justify-start text-left font-normal"
                                  >
                                    <CalendarIcon className="text-muted-foreground size-4" />
                                    {returnDate ? (
                                      format(returnDate, "PPP")
                                    ) : (
                                      <span className="text-muted-foreground">
                                        Pick a date
                                      </span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={returnDate}
                                    onSelect={(newDate) => {
                                      setReturnDate(newDate);
                                      setReturnCalendarOpen(false);
                                    }}
                                    disabled={(d) =>
                                      d < startOfDay(date ?? new Date())
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="return-time">Time</Label>
                              <div className="relative">
                                <Clock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                <Input
                                  id="return-time"
                                  type="time"
                                  value={returnTime}
                                  onChange={(e) =>
                                    setReturnTime(e.target.value)
                                  }
                                  className="h-10 pl-10"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <Separator />

                  {/* Seats & Price Section */}
                  <section>
                    <div className="mb-6 flex items-center gap-3">
                      <Car className="text-primary size-5" />
                      <h2 className="font-semibold">Seats & Price</h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="seats">Available Seats</Label>
                        <div className="relative">
                          <Users className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                          <Select value={seats} onValueChange={setSeats}>
                            <SelectTrigger id="seats" className="h-10 pl-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} {num === 1 ? "seat" : "seats"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Price per Seat (CAD)</Label>
                        <div className="relative">
                          <DollarSign className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="5"
                            placeholder="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="h-10 pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    {price && (
                      <p className="text-muted-foreground mt-4 text-sm">
                        Total for {seats}{" "}
                        {parseInt(seats) === 1 ? "seat" : "seats"}:{" "}
                        <span className="text-primary font-semibold">
                          ${(parseFloat(price) * parseInt(seats)).toFixed(2)}{" "}
                          CAD
                        </span>
                      </p>
                    )}
                  </section>

                  <Separator />

                  {/* Trip Preferences Section */}
                  <section>
                    <div className="mb-6 flex items-center gap-3">
                      <Luggage className="text-primary size-5" />
                      <h2 className="font-semibold">Trip Preferences</h2>
                    </div>

                    <div className="space-y-6">
                      {/* Luggage Space */}
                      <div className="space-y-3">
                        <Label>Luggage Space</Label>
                        <p className="text-muted-foreground text-sm">
                          Let passengers know how much space you have for their
                          luggage.
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            {
                              value: "small",
                              label: "Small",
                              desc: "Backpack only",
                            },
                            {
                              value: "medium",
                              label: "Medium",
                              desc: "1 carry-on",
                            },
                            {
                              value: "large",
                              label: "Large",
                              desc: "Large suitcase",
                            },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setLuggageSize(option.value)}
                              className={`rounded-lg border p-3 text-left transition-colors ${
                                luggageSize === option.value
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-primary/50"
                              }`}
                            >
                              <p className="font-medium">{option.label}</p>
                              <p className="text-muted-foreground text-xs">
                                {option.desc}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Additional Options */}
                      <div className="space-y-3">
                        <Label>Additional Options</Label>
                        <p className="text-muted-foreground text-sm">
                          What else can passengers bring or expect?
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label
                            htmlFor="winter-tires"
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                              hasWinterTires
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/50"
                            }`}
                          >
                            <Checkbox
                              id="winter-tires"
                              checked={hasWinterTires}
                              onCheckedChange={(checked) =>
                                setHasWinterTires(checked === true)
                              }
                            />
                            <Snowflake className="text-muted-foreground size-4" />
                            <span>Winter tires</span>
                          </label>

                          <label
                            htmlFor="bikes"
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                              allowsBikes
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/50"
                            }`}
                          >
                            <Checkbox
                              id="bikes"
                              checked={allowsBikes}
                              onCheckedChange={(checked) =>
                                setAllowsBikes(checked === true)
                              }
                            />
                            <Bike className="text-muted-foreground size-4" />
                            <span>Bikes</span>
                          </label>

                          <label
                            htmlFor="skis"
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                              allowsSkis
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/50"
                            }`}
                          >
                            <Checkbox
                              id="skis"
                              checked={allowsSkis}
                              onCheckedChange={(checked) =>
                                setAllowsSkis(checked === true)
                              }
                            />
                            <Snowflake className="text-muted-foreground size-4" />
                            <span>Skis & snowboards</span>
                          </label>

                          <label
                            htmlFor="pets"
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                              allowsPets
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/50"
                            }`}
                          >
                            <Checkbox
                              id="pets"
                              checked={allowsPets}
                              onCheckedChange={(checked) =>
                                setAllowsPets(checked === true)
                              }
                            />
                            <PawPrint className="text-muted-foreground size-4" />
                            <span>Pets</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Additional Info Section */}
                  <section>
                    <div className="mb-6 flex items-center gap-3">
                      <Info className="text-primary size-5" />
                      <h2 className="font-semibold">Additional Information</h2>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="E.g., Pickup location details, stops along the way, music preferences..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <p className="text-muted-foreground text-xs">
                        Include any relevant details to help passengers decide.
                      </p>
                    </div>
                  </section>

                  <Separator />

                  {/* Submit */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                    <p className="text-muted-foreground text-sm">
                      By posting, you agree to our{" "}
                      <Link
                        href="/terms"
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Terms of Service
                      </Link>
                    </p>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={!canSubmit || isSubmitting}
                      className="gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Car className="size-4" />
                          Post Ride
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Map Column - Sticky on large screens */}
            <div className="hidden lg:block lg:flex-1">
              <div className="sticky top-24 h-[500px]">
                <RouteMap
                  apiKey={googleMapsApiKey}
                  fromPlaceId={fromLocation?.placeId ?? null}
                  toPlaceId={toLocation?.placeId ?? null}
                  fromName={fromLocation?.mainText}
                  toName={toLocation?.mainText}
                  stops={stops}
                  onRouteInfoChange={handleRouteInfoChange}
                  onTownSuggestionsChange={handleTownSuggestionsChange}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
