/* eslint-disable @typescript-eslint/no-unnecessary-condition */
"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

import { useTRPC } from "~/trpc/react";
import { useSearchContext } from "./search-context";

// Default center on Canada
const CANADA_CENTER = { lat: 56.1304, lng: -106.3468 };
const DEFAULT_ZOOM = 3;

interface SearchMapProps {
  fromPlaceId: string | null;
  toPlaceId: string | null;
  googleMapsApiKey: string | undefined;
}

// Component to render the user's search route (blue line)
function UserRoute({
  fromPlaceId,
  toPlaceId,
}: {
  fromPlaceId: string;
  toPlaceId: string;
}) {
  const map = useMap();
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(
    null,
  );
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;
    if (typeof window === "undefined" || !window.google?.maps) return;

    directionsServiceRef.current ??= new google.maps.DirectionsService();
    const service = directionsServiceRef.current;

    void service
      .route({
        origin: { placeId: fromPlaceId },
        destination: { placeId: toPlaceId },
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((response) => {
        const route = response.routes[0];
        if (!route?.overview_path) return;

        // Clean up previous polyline
        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }

        // Create the user's route polyline (blue)
        polylineRef.current = new google.maps.Polyline({
          path: route.overview_path,
          geodesic: true,
          strokeColor: "#3B82F6", // Blue
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
          zIndex: 2, // Above the driver's route
        });

        // Fit bounds to show the route
        if (route.bounds) {
          map.fitBounds(route.bounds, {
            top: 60,
            bottom: 80,
            left: 20,
            right: 20,
          });
        }
      })
      .catch((e) => {
        console.error("Failed to fetch user route:", e);
      });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, fromPlaceId, toPlaceId]);

  return null;
}

// Component to render the hovered trip's route polyline (red line)
function DriverRoute() {
  const map = useMap();
  const { hoveredTrip } = useSearchContext();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    // Clean up previous polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!hoveredTrip?.routeGeometry) return;

    // Convert GeoJSON coordinates to Google Maps LatLng
    // GeoJSON uses [lng, lat], Google Maps uses {lat, lng}
    const path = hoveredTrip.routeGeometry.coordinates.map(
      (coord): google.maps.LatLngLiteral => ({
        lat: coord[1] ?? 0,
        lng: coord[0] ?? 0,
      }),
    );

    // Create the driver's route polyline (red)
    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#EF4444", // Red
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map,
      zIndex: 1, // Below the user's route
    });

    // Fit bounds to show both routes
    const bounds = new google.maps.LatLngBounds();
    path.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, { top: 60, bottom: 80, left: 20, right: 20 });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, hoveredTrip]);

  return null;
}

// Component to render search location markers (blue for user's route)
function SearchMarkers({
  fromLocation,
  toLocation,
}: {
  fromLocation: { lat: number; lng: number } | null;
  toLocation: { lat: number; lng: number } | null;
}) {
  return (
    <>
      {fromLocation && (
        <AdvancedMarker position={fromLocation}>
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-md">
                <span className="text-xs font-bold text-white">A</span>
              </div>
              <div className="absolute -bottom-1 left-1/2 size-0 -translate-x-1/2 border-x-4 border-t-[6px] border-x-transparent border-t-blue-500" />
            </div>
          </div>
        </AdvancedMarker>
      )}
      {toLocation && (
        <AdvancedMarker position={toLocation}>
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-md">
                <span className="text-xs font-bold text-white">B</span>
              </div>
              <div className="absolute -bottom-1 left-1/2 size-0 -translate-x-1/2 border-x-4 border-t-[6px] border-x-transparent border-t-blue-500" />
            </div>
          </div>
        </AdvancedMarker>
      )}
    </>
  );
}

// Inner map content component
function MapContent({
  fromLocation,
  toLocation,
  fromName,
  toName,
  fromPlaceId,
  toPlaceId,
}: {
  fromLocation: { lat: number; lng: number } | null;
  toLocation: { lat: number; lng: number } | null;
  fromName: string | null;
  toName: string | null;
  fromPlaceId: string;
  toPlaceId: string;
}) {
  const { hoveredTrip } = useSearchContext();

  return (
    <div className="relative h-full w-full">
      <Map
        defaultCenter={CANADA_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="cooperative"
        disableDefaultUI
        mapId="search-map"
        className="h-full w-full"
      >
        <UserRoute fromPlaceId={fromPlaceId} toPlaceId={toPlaceId} />
        <SearchMarkers fromLocation={fromLocation} toLocation={toLocation} />
        <DriverRoute />
      </Map>

      {/* Route info header with your route */}
      {(fromName ?? toName) && (
        <div className="absolute top-4 right-4 left-4 z-10">
          <div className="bg-card/95 rounded-lg border p-3 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm">
              <div className="size-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground text-xs">Your route:</span>
              <span className="truncate font-medium">{fromName}</span>
              <span className="text-muted-foreground">→</span>
              <span className="truncate font-medium">{toName}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend and hovered trip info */}
      <div className="absolute right-4 bottom-4 left-4 z-10">
        <div className="bg-card/95 rounded-lg border p-3 shadow-lg backdrop-blur-sm">
          {hoveredTrip ? (
            <div className="space-y-2">
              {/* Driver's route */}
              <div className="flex items-center gap-2 text-sm">
                <div className="size-3 rounded-full bg-red-500" />
                <span className="text-muted-foreground text-xs">
                  Driver&apos;s route:
                </span>
                <span className="truncate font-medium">
                  {hoveredTrip.fromName}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="truncate font-medium">
                  {hoveredTrip.toName}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-4 rounded bg-blue-500" />
                  <span className="text-muted-foreground">Your route</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-4 rounded bg-red-500" />
                  <span className="text-muted-foreground">
                    Driver&apos;s route
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground text-center text-xs">
                Hover over a trip to preview the driver&apos;s route
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchMap({
  fromPlaceId,
  toPlaceId,
  googleMapsApiKey,
}: SearchMapProps) {
  const trpc = useTRPC();

  const { data: fromData, isLoading: fromLoading } = useQuery(
    trpc.places.getDetails.queryOptions(
      { placeId: fromPlaceId ?? "" },
      { enabled: !!fromPlaceId },
    ),
  );

  const { data: toData, isLoading: toLoading } = useQuery(
    trpc.places.getDetails.queryOptions(
      { placeId: toPlaceId ?? "" },
      { enabled: !!toPlaceId },
    ),
  );

  const isLoading = fromLoading || toLoading;
  const hasRoute = !!fromData && !!toData && !!fromPlaceId && !!toPlaceId;

  if (isLoading) {
    return (
      <div className="bg-muted/30 flex h-full items-center justify-center">
        <div className="text-center">
          <MapPin className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">Loading route...</p>
        </div>
      </div>
    );
  }

  if (!hasRoute) {
    return (
      <div className="bg-muted/30 flex h-full items-center justify-center">
        <div className="text-center">
          <MapPin className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">
            Select a route to view the map
          </p>
        </div>
      </div>
    );
  }

  if (!googleMapsApiKey) {
    return (
      <div className="bg-muted/50 flex h-full items-center justify-center">
        <div className="text-center">
          <MapPin className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">Map unavailable</p>
        </div>
      </div>
    );
  }

  const fromLocation = fromData.location
    ? { lat: fromData.location.lat, lng: fromData.location.lng }
    : null;
  const toLocation = toData.location
    ? { lat: toData.location.lat, lng: toData.location.lng }
    : null;

  return (
    <APIProvider apiKey={googleMapsApiKey}>
      <MapContent
        fromLocation={fromLocation}
        toLocation={toLocation}
        fromName={fromData.name ?? null}
        toName={toData.name ?? null}
        fromPlaceId={fromPlaceId}
        toPlaceId={toPlaceId}
      />
    </APIProvider>
  );
}
