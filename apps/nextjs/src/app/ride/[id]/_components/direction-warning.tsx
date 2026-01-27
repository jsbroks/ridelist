"use client";

import { useMemo } from "react";
import * as turf from "@turf/turf";
import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@app/ui/alert";

interface DirectionWarningProps {
  routeGeometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  userPickupLocation: { lat: number; lng: number } | null;
  userDropoffLocation: { lat: number; lng: number } | null;
}

export function DirectionWarning({
  routeGeometry,
  userPickupLocation,
  userDropoffLocation,
}: DirectionWarningProps) {
  const isWrongDirection = useMemo(() => {
    // Need both locations to check direction
    if (!userPickupLocation || !userDropoffLocation) return false;

    try {
      const line = turf.lineString(routeGeometry.coordinates);
      const pickupPoint = turf.point([
        userPickupLocation.lng,
        userPickupLocation.lat,
      ]);
      const dropoffPoint = turf.point([
        userDropoffLocation.lng,
        userDropoffLocation.lat,
      ]);

      // Find nearest points on the route
      const pickupNearest = turf.nearestPointOnLine(line, pickupPoint, {
        units: "kilometers",
      });
      const dropoffNearest = turf.nearestPointOnLine(line, dropoffPoint, {
        units: "kilometers",
      });

      // Get position along the route (distance from start)
      const pickupAlongRoute = pickupNearest.properties.location ?? 0;
      const dropoffAlongRoute = dropoffNearest.properties.location ?? 0;

      // If pickup is after dropoff along the route, user is going the wrong direction
      return pickupAlongRoute >= dropoffAlongRoute;
    } catch (error) {
      console.error("Error calculating direction:", error);
      return false;
    }
  }, [routeGeometry, userPickupLocation, userDropoffLocation]);

  if (!isWrongDirection) return null;

  return (
    <Alert variant="destructive" className="border-orange-500/50 bg-orange-500/10">
      <AlertTriangle className="size-4 text-orange-600" />
      <AlertTitle className="text-orange-600">Wrong direction</AlertTitle>
      <AlertDescription className="text-orange-600/90">
        Your pickup and dropoff points are in the opposite direction of this
        ride. The driver is traveling from their start point to their
        destination, but your route goes the other way.
      </AlertDescription>
    </Alert>
  );
}
