"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Separator } from "@app/ui/separator";
import { toast } from "@app/ui/toast";

import type { PlacePrediction } from "~/app/_components/location-picker";
import type { RouteInfo } from "~/app/_components/route-map";
import { Navbar } from "~/app/_components/navbar";
import { RouteMap } from "~/app/_components/route-map";
import { useTRPC } from "~/trpc/react";
import {
  AdditionalInfoSection,
  DateTimeSection,
  FormSubmit,
  RouteSection,
  SeatsPriceSection,
  TripPreferencesSection,
} from "./_components";

// Form data interface
interface PostRideFormData {
  // Route
  fromLocation: PlacePrediction | null;
  toLocation: PlacePrediction | null;

  // Date & Time
  date: Date | undefined;
  departureTime: string;
  isRoundTrip: boolean;
  returnDate: Date | undefined;
  returnTime: string;

  // Seats & Price
  seats: string;
  price: string;

  // Preferences
  luggageSize: string;
  hasWinterTires: boolean;
  allowsBikes: boolean;
  allowsSkis: boolean;
  allowsPets: boolean;
  hasAC: boolean;
  hasPhoneCharging: boolean;

  // Additional
  notes: string;
}

interface PostRideFormProps {
  googleMapsApiKey: string | undefined;
}

// Helper to parse duration string like "5 hours 30 mins" into minutes
function parseDurationToMinutes(duration: string): number | undefined {
  const hoursMatch = /(\d+)\s*(?:hour|hr|h)/i.exec(duration);
  const minsMatch = /(\d+)\s*(?:min|m)/i.exec(duration);

  const hours = hoursMatch ? parseInt(hoursMatch[1] ?? "0") : 0;
  const mins = minsMatch ? parseInt(minsMatch[1] ?? "0") : 0;

  const total = hours * 60 + mins;
  return total > 0 ? total : undefined;
}

// Combine date and time into a single Date object
function combineDateAndTime(dateValue: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(":").map(Number);
  const combined = new Date(dateValue);
  combined.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return combined;
}

export const PostRideForm: React.FC<PostRideFormProps> = ({
  googleMapsApiKey,
}) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // React Hook Form
  const { control, setValue, handleSubmit } = useForm<PostRideFormData>({
    defaultValues: {
      fromLocation: null,
      toLocation: null,
      date: undefined,
      departureTime: "",
      isRoundTrip: false,
      returnDate: undefined,
      returnTime: "",
      seats: "1",
      price: "",
      luggageSize: "medium",
      hasWinterTires: false,
      allowsBikes: false,
      allowsSkis: false,
      allowsPets: false,
      hasAC: false,
      hasPhoneCharging: false,
      notes: "",
    },
  });

  // Watch form values for controlled components using useWatch hook
  const fromLocation = useWatch({ control, name: "fromLocation" });
  const toLocation = useWatch({ control, name: "toLocation" });
  const date = useWatch({ control, name: "date" });
  const departureTime = useWatch({ control, name: "departureTime" });
  const isRoundTrip = useWatch({ control, name: "isRoundTrip" });
  const returnDate = useWatch({ control, name: "returnDate" });
  const returnTime = useWatch({ control, name: "returnTime" });
  const seats = useWatch({ control, name: "seats" });
  const price = useWatch({ control, name: "price" });
  const luggageSize = useWatch({ control, name: "luggageSize" });
  const hasWinterTires = useWatch({ control, name: "hasWinterTires" });
  const allowsBikes = useWatch({ control, name: "allowsBikes" });
  const allowsSkis = useWatch({ control, name: "allowsSkis" });
  const allowsPets = useWatch({ control, name: "allowsPets" });
  const hasAC = useWatch({ control, name: "hasAC" });
  const hasPhoneCharging = useWatch({ control, name: "hasPhoneCharging" });
  const notes = useWatch({ control, name: "notes" });

  // tRPC mutation for creating a ride
  const createRideMutation = useMutation(
    trpc.ride.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Ride posted successfully!");
        void queryClient.invalidateQueries();
        router.push(`/ride/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // UI state for calendar popovers
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [returnCalendarOpen, setReturnCalendarOpen] = useState(false);

  // Route info state (from map component)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Fetch place details using tRPC
  const fetchPlaceDetails = async (placeId: string) => {
    return queryClient.fetchQuery(
      trpc.places.getDetails.queryOptions({ placeId }),
    );
  };

  const canSubmit =
    fromLocation && toLocation && date && departureTime && price;
  const isSubmitting = createRideMutation.isPending;

  const onSubmit = async (data: PostRideFormData) => {
    if (!data.fromLocation || !data.toLocation || !data.date) return;

    try {
      // Fetch location details for from and to
      const [fromDetails, toDetails] = await Promise.all([
        fetchPlaceDetails(data.fromLocation.placeId),
        fetchPlaceDetails(data.toLocation.placeId),
      ]);

      if (!fromDetails.location || !toDetails.location) {
        toast.error("Failed to get location coordinates. Please try again.");
        return;
      }

      // Combine date and time
      const departureDatetime = combineDateAndTime(
        data.date,
        data.departureTime,
      );

      // Convert price to cents
      const priceInCents = Math.round(parseFloat(data.price) * 100);

      // Parse duration from route info
      const durationMinutes = routeInfo?.duration
        ? parseDurationToMinutes(routeInfo.duration)
        : undefined;

      if (routeInfo?.geometry == null) {
        toast.error("Failed to get route geometry. Please try again.");
        return;
      }
      // Create the ride using tRPC mutation
      createRideMutation.mutate({
        fromPlaceId: data.fromLocation.placeId,
        fromName: data.fromLocation.mainText,
        fromAddress: fromDetails.formattedAddress ?? undefined,
        fromLat: fromDetails.location.lat,
        fromLng: fromDetails.location.lng,
        toPlaceId: data.toLocation.placeId,
        toName: data.toLocation.mainText,
        toAddress: toDetails.formattedAddress ?? undefined,
        toLat: toDetails.location.lat,
        toLng: toDetails.location.lng,
        departureTime: departureDatetime,
        totalSeats: parseInt(data.seats),
        pricePerSeat: priceInCents,
        description: data.notes || undefined,
        distanceKm: routeInfo.distanceKm,
        durationMinutes,
        routeGeometry: {
          type: "LineString" as const,
          coordinates: routeInfo.geometry.coordinates.map(
            ([lng, lat]) => [lng, lat] as [number, number],
          ),
        },
        // Preferences
        luggageSize: data.luggageSize as "small" | "medium" | "large",
        hasWinterTires: data.hasWinterTires,
        allowsBikes: data.allowsBikes,
        allowsSkis: data.allowsSkis,
        allowsPets: data.allowsPets,
        hasAC: data.hasAC,
        hasPhoneCharging: data.hasPhoneCharging,
      });
    } catch (error) {
      console.error("Error preparing ride data:", error);
      toast.error("Failed to get location details. Please try again.");
    }
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
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-10">
                  {/* Route Section */}
                  <RouteSection
                    fromLocation={fromLocation}
                    toLocation={toLocation}
                    onFromLocationChange={(loc) =>
                      setValue("fromLocation", loc)
                    }
                    onToLocationChange={(loc) => setValue("toLocation", loc)}
                  />

                  {/* <Separator /> */}

                  {/* Date & Time Section */}
                  <DateTimeSection
                    date={date}
                    departureTime={departureTime}
                    isRoundTrip={isRoundTrip}
                    returnDate={returnDate}
                    returnTime={returnTime}
                    calendarOpen={calendarOpen}
                    returnCalendarOpen={returnCalendarOpen}
                    onDateChange={(d) => setValue("date", d)}
                    onDepartureTimeChange={(t) => setValue("departureTime", t)}
                    onRoundTripChange={(v) => setValue("isRoundTrip", v)}
                    onReturnDateChange={(d) => setValue("returnDate", d)}
                    onReturnTimeChange={(t) => setValue("returnTime", t)}
                    onCalendarOpenChange={setCalendarOpen}
                    onReturnCalendarOpenChange={setReturnCalendarOpen}
                  />

                  <Separator />

                  {/* Seats & Price Section */}
                  <SeatsPriceSection
                    seats={seats}
                    price={price}
                    onSeatsChange={(s) => setValue("seats", s)}
                    onPriceChange={(p) => setValue("price", p)}
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
                      hasAC,
                      hasPhoneCharging,
                    }}
                    onLuggageSizeChange={(s) => setValue("luggageSize", s)}
                    onWinterTiresChange={(v) => setValue("hasWinterTires", v)}
                    onBikesChange={(v) => setValue("allowsBikes", v)}
                    onSkisChange={(v) => setValue("allowsSkis", v)}
                    onPetsChange={(v) => setValue("allowsPets", v)}
                    onACChange={(v: boolean) => setValue("hasAC", v)}
                    onPhoneChargingChange={(v: boolean) =>
                      setValue("hasPhoneCharging", v)
                    }
                  />

                  <Separator />

                  {/* Additional Info Section */}
                  <AdditionalInfoSection
                    notes={notes}
                    onNotesChange={(n) => setValue("notes", n)}
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
                  onRouteInfoChange={setRouteInfo}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
