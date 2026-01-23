"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Separator } from "@app/ui/separator";

import type { PlacePrediction } from "~/app/_components/location-picker";
import type { RouteInfo, TownSuggestion } from "~/app/_components/route-map";
import { Navbar } from "~/app/_components/navbar";
import { RouteMap } from "~/app/_components/route-map";
import {
  AdditionalInfoSection,
  DateTimeSection,
  FormSubmit,
  RouteSection,
  SeatsPriceSection,
  StopsSection,
  TripPreferencesSection,
} from "./_components";

interface PostRideFormProps {
  googleMapsApiKey: string | undefined;
}

export const PostRideForm: React.FC<PostRideFormProps> = ({
  googleMapsApiKey,
}) => {
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
    if (!info) {
      setHasAutoPopulatedStops(false);
      setStops([]);
    }
  };

  // Handle town suggestions changes and auto-populate stops
  const handleTownSuggestionsChange = (towns: TownSuggestion[]) => {
    setTownSuggestions(towns);

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

  // Stop management handlers
  const addStop = (town: TownSuggestion) => {
    if (!stops.some((s) => s.placeId === town.placeId)) {
      setStops([...stops, town]);
    }
  };

  const handleManualStopChange = (place: PlacePrediction | null) => {
    setManualStopInput(place);
    if (place && !stops.some((s) => s.placeId === place.placeId)) {
      setStops([...stops, { name: place.mainText, placeId: place.placeId }]);
      setManualStopInput(null);
      setIsAddingStop(false);
    }
  };

  const removeStop = (placeId: string) => {
    setStops(stops.filter((s) => s.placeId !== placeId));
  };

  const canSubmit =
    fromLocation && toLocation && date && departureTime && price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);

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
                  <RouteSection
                    fromLocation={fromLocation}
                    toLocation={toLocation}
                    onFromLocationChange={setFromLocation}
                    onToLocationChange={setToLocation}
                  >
                    {fromLocation && toLocation && (
                      <StopsSection
                        stops={stops}
                        townSuggestions={townSuggestions}
                        routeInfo={routeInfo}
                        isAddingStop={isAddingStop}
                        manualStopInput={manualStopInput}
                        onAddStop={addStop}
                        onRemoveStop={removeStop}
                        onManualStopChange={handleManualStopChange}
                        onStartAddingStop={() => setIsAddingStop(true)}
                        onCancelAddingStop={() => {
                          setIsAddingStop(false);
                          setManualStopInput(null);
                        }}
                      />
                    )}
                  </RouteSection>

                  <Separator />

                  {/* Date & Time Section */}
                  <DateTimeSection
                    date={date}
                    departureTime={departureTime}
                    isRoundTrip={isRoundTrip}
                    returnDate={returnDate}
                    returnTime={returnTime}
                    calendarOpen={calendarOpen}
                    returnCalendarOpen={returnCalendarOpen}
                    onDateChange={setDate}
                    onDepartureTimeChange={setDepartureTime}
                    onRoundTripChange={setIsRoundTrip}
                    onReturnDateChange={setReturnDate}
                    onReturnTimeChange={setReturnTime}
                    onCalendarOpenChange={setCalendarOpen}
                    onReturnCalendarOpenChange={setReturnCalendarOpen}
                  />

                  <Separator />

                  {/* Seats & Price Section */}
                  <SeatsPriceSection
                    seats={seats}
                    price={price}
                    onSeatsChange={setSeats}
                    onPriceChange={setPrice}
                  />

                  <Separator />

                  {/* Trip Preferences Section */}
                  <TripPreferencesSection
                    preferences={{
                      luggageSize,
                      hasWinterTires,
                      allowsBikes,
                      allowsSkis,
                      allowsPets,
                    }}
                    onLuggageSizeChange={setLuggageSize}
                    onWinterTiresChange={setHasWinterTires}
                    onBikesChange={setAllowsBikes}
                    onSkisChange={setAllowsSkis}
                    onPetsChange={setAllowsPets}
                  />

                  <Separator />

                  {/* Additional Info Section */}
                  <AdditionalInfoSection
                    notes={notes}
                    onNotesChange={setNotes}
                  />

                  <Separator />

                  {/* Submit */}
                  <FormSubmit
                    canSubmit={!!canSubmit}
                    isSubmitting={isSubmitting}
                  />
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
};
