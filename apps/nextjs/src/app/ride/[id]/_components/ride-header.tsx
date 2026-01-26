import { format } from "date-fns";
import { Calendar, Car, MapPin, Users } from "lucide-react";

import { Badge } from "@app/ui/badge";

import type { PlacePrediction } from "~/app/_components/location-picker";
import { UserRouteSelector } from "./user-route-selector";

interface RideHeaderProps {
  ride: {
    id: string;
    fromName: string;
    toName: string;
    departureTime: Date;
    availableSeats: number;
    pricePerSeat: number | null;
  };
  initialPickup: PlacePrediction | null;
  initialDropoff: PlacePrediction | null;
}

export const RideHeader: React.FC<RideHeaderProps> = ({
  ride,
  initialPickup,
  initialDropoff,
}) => {
  const hasUserRoute = initialPickup ?? initialDropoff;

  return (
    <section className="space-y-8">
      {/* User's Request Section - Show prominently if they have a route */}
      {hasUserRoute ? (
        <div className="space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              Your request
            </Badge>
            <h1 className="text-2xl font-bold md:text-3xl">
              {initialPickup?.mainText ?? "Select pickup"} to{" "}
              {initialDropoff?.mainText ?? "Select dropoff"}
            </h1>
          </div>
          <UserRouteSelector
            rideId={ride.id}
            initialPickup={initialPickup}
            initialDropoff={initialDropoff}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold md:text-3xl">
            {ride.fromName} to {ride.toName}
          </h1>
          <p className="text-muted-foreground">
            Enter your pickup and dropoff to see how this ride works for you.
          </p>
          <UserRouteSelector
            rideId={ride.id}
            initialPickup={initialPickup}
            initialDropoff={initialDropoff}
          />
        </div>
      )}

      {/* Driver's Route Info */}
      <div className="bg-muted/50 space-y-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <Car className="text-muted-foreground size-4" />
          <span className="text-muted-foreground text-sm font-medium">
            Driver&apos;s route
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">From</p>
              <p className="font-medium">{ride.fromName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-4 shrink-0 text-red-500" />
            <div>
              <p className="text-muted-foreground text-xs">To</p>
              <p className="font-medium">{ride.toName}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground size-4" />
            <span>{format(new Date(ride.departureTime), "EEE, MMM d")}</span>
            <span className="text-muted-foreground">at</span>
            <span>{format(new Date(ride.departureTime), "h:mm a")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground size-4" />
            <span>
              {ride.availableSeats} seat{ride.availableSeats === 1 ? "" : "s"}{" "}
              available
            </span>
          </div>
          <div className="font-medium">
            ${(ride.pricePerSeat ?? 0) / 100} per seat
          </div>
        </div>
      </div>
    </section>
  );
};
