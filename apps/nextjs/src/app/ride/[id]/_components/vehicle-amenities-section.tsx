import { Bike, Car, Luggage, PawPrint, Snowflake, Zap } from "lucide-react";

import { Badge } from "@app/ui/badge";

interface RidePreferences {
  luggageSize: string | null;
  hasWinterTires: boolean | null;
  allowsBikes: boolean | null;
  allowsSkis: boolean | null;
  allowsPets: boolean | null;
  hasAC: boolean | null;
  hasPhoneCharging: boolean | null;
}

interface VehicleAmenitiesSectionProps {
  preferences: RidePreferences;
}

export const VehicleAmenitiesSection: React.FC<VehicleAmenitiesSectionProps> = ({
  preferences,
}) => {
  const {
    luggageSize,
    hasWinterTires,
    allowsBikes,
    allowsSkis,
    allowsPets,
    hasAC,
    hasPhoneCharging,
  } = preferences;
  const hasAnyFeature =
    luggageSize ||
    hasWinterTires ||
    allowsBikes ||
    allowsSkis ||
    allowsPets ||
    hasAC ||
    hasPhoneCharging;

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Vehicle & Amenities</h2>

      {/* Vehicle info - placeholder for future data */}
      <div className="flex items-center gap-4 rounded-lg border p-4">
        <div className="bg-muted flex size-16 items-center justify-center rounded-lg">
          <Car className="text-muted-foreground size-8" />
        </div>
        <div className="flex-1">
          <p className="text-muted-foreground text-sm">
            Vehicle details not provided
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Contact the driver for more information about the vehicle
          </p>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <p className="text-muted-foreground mb-3 text-sm">Ride features</p>
        <div className="flex flex-wrap gap-2">
          {luggageSize && (
            <Badge variant="secondary" className="gap-1.5">
              <Luggage className="size-3" />
              {luggageSize === "small"
                ? "Small luggage"
                : luggageSize === "medium"
                  ? "Medium luggage"
                  : "Large luggage"}
            </Badge>
          )}

          {hasWinterTires && (
            <Badge variant="secondary" className="gap-1.5">
              <Snowflake className="size-3" />
              Winter tires
            </Badge>
          )}

          {allowsBikes && (
            <Badge variant="secondary" className="gap-1.5">
              <Bike className="size-3" />
              Bikes
            </Badge>
          )}

          {allowsSkis && (
            <Badge variant="secondary" className="gap-1.5">
              <Snowflake className="size-3" />
              Skis
            </Badge>
          )}

          {allowsPets && (
            <Badge variant="secondary" className="gap-1.5">
              <PawPrint className="size-3" />
              Pet friendly
            </Badge>
          )}

          {hasAC && (
            <Badge variant="secondary" className="gap-1.5">
              <Snowflake className="size-3" />
              A/C
            </Badge>
          )}

          {hasPhoneCharging && (
            <Badge variant="secondary" className="gap-1.5">
              <Zap className="size-3" />
              Phone charging
            </Badge>
          )}

          {!hasAnyFeature && (
            <p className="text-muted-foreground text-sm">
              No specific features listed for this ride.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
