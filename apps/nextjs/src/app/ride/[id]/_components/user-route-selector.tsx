"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Car, Loader2 } from "lucide-react";

import { Button } from "@app/ui/button";
import { Textarea } from "@app/ui/textarea";
import { toast } from "@app/ui/toast";

import type { PlacePrediction } from "~/app/_components/location-picker";
import { LocationPicker } from "~/app/_components/location-picker";
import { useTRPC } from "~/trpc/react";

interface UserRouteSelectorProps {
  rideId: string;
  initialPickup?: PlacePrediction | null;
  initialDropoff?: PlacePrediction | null;
}

export function UserRouteSelector({
  rideId,
  initialPickup = null,
  initialDropoff = null,
}: UserRouteSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();
  const [message, setMessage] = useState("");

  const createRequestMutation = useMutation(
    trpc.rideRequest.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Ride request sent!", {
          description: "The driver will be notified of your request.",
        });
        // Redirect to the conversation or requests page
        if (data.conversationId) {
          router.push(`/messages/${data.conversationId}`);
        } else {
          router.push("/my-requests");
        }
      },
      onError: (error) => {
        toast.error("Failed to send request", {
          description: error.message,
        });
      },
    }),
  );

  const updateUrl = useCallback(
    (pickup: PlacePrediction | null, dropoff: PlacePrediction | null) => {
      const params = new URLSearchParams(searchParams);

      if (pickup) {
        params.set("pickup", pickup.placeId);
      } else {
        params.delete("pickup");
      }

      if (dropoff) {
        params.set("dropoff", dropoff.placeId);
      } else {
        params.delete("dropoff");
      }

      const newUrl =
        params.toString() === ""
          ? `/ride/${rideId}`
          : `/ride/${rideId}?${params.toString()}`;

      router.replace(newUrl);
    },
    [rideId, router, searchParams],
  );

  const handlePickupChange = (value: PlacePrediction | null) => {
    const currentDropoff = searchParams.get("dropoff");
    const dropoff = currentDropoff
      ? initialDropoff?.placeId === currentDropoff
        ? initialDropoff
        : null
      : null;
    updateUrl(value, dropoff ?? initialDropoff);
  };

  const handleDropoffChange = (value: PlacePrediction | null) => {
    const currentPickup = searchParams.get("pickup");
    const pickup = currentPickup
      ? initialPickup?.placeId === currentPickup
        ? initialPickup
        : null
      : null;
    updateUrl(pickup ?? initialPickup, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createRequestMutation.mutate({
      rideId,
      pickupPlaceId: initialPickup?.placeId,
      pickupName: initialPickup?.mainText,
      dropoffPlaceId: initialDropoff?.placeId,
      dropoffName: initialDropoff?.mainText,
      message: message.trim() || undefined,
    });
  };

  const isSubmitting = createRequestMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <LocationPicker
          label="Your pickup"
          placeholder="Where do you need to be picked up?"
          value={initialPickup}
          onChange={handlePickupChange}
          id="user-pickup"
        />
        <LocationPicker
          label="Your dropoff"
          placeholder="Where are you going?"
          value={initialDropoff}
          onChange={handleDropoffChange}
          id="user-dropoff"
        />
      </div>

      <Textarea
        placeholder="Add a message to the driver (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={500}
        disabled={isSubmitting}
      />

      <Button
        type="submit"
        variant="default"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Sending request...
          </>
        ) : (
          <>
            <Car className="mr-2 size-4" />
            Request a ride
          </>
        )}
      </Button>
    </form>
  );
}
