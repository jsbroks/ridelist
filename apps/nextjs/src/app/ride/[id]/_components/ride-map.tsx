"use client";

import { useEffect, useRef, useState } from "react";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

interface Stop {
  name: string;
  placeId: string;
}

interface RideMapProps {
  apiKey?: string;
  fromPlaceId: string;
  toPlaceId: string;
  fromName: string;
  toName: string;
  stops?: Stop[];
}

// Default center on Canada
const CANADA_CENTER = { lat: 56.1304, lng: -106.3468 };
const DEFAULT_ZOOM = 3;

function DirectionsRenderer({
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
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null,
  );

  // Initialize directions service and renderer
  useEffect(() => {
    if (!map) return;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof window === "undefined" || !window.google?.maps) return;

    const googleMaps = window.google.maps;

    directionsServiceRef.current ??= new googleMaps.DirectionsService();

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new googleMaps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        preserveViewport: false,
        polylineOptions: {
          strokeColor: "hsl(var(--primary))",
          strokeWeight: 4,
          strokeOpacity: 0.8,
        },
      });
    } else {
      directionsRendererRef.current.setMap(map);
    }

    return () => {
      directionsRendererRef.current?.setMap(null);
    };
  }, [map]);

  // Calculate route when places change
  useEffect(() => {
    const service = directionsServiceRef.current;
    const renderer = directionsRendererRef.current;

    if (!service || !renderer || !fromPlaceId || !toPlaceId) return;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof window === "undefined" || !window.google?.maps) return;

    void service
      .route({
        origin: { placeId: fromPlaceId },
        destination: { placeId: toPlaceId },
        travelMode: window.google.maps.TravelMode.DRIVING,
      })
      .then((response: google.maps.DirectionsResult) => {
        renderer.setDirections(response);
      })
      .catch((e: unknown) => {
        console.error("Directions request failed:", e);
      });
  }, [fromPlaceId, toPlaceId]);

  return null;
}

// Type for stop locations cache
type StopLocationCache = Record<string, google.maps.LatLngLiteral>;

// Component to render markers for stops
function StopMarkers({ stops }: { stops: Stop[] }) {
  const [stopLocations, setStopLocations] = useState<StopLocationCache>({});
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof window === "undefined" || !window.google?.maps) return;
    if (stops.length === 0) {
      setStopLocations({});
      return;
    }

    geocoderRef.current ??= new google.maps.Geocoder();
    const geocoder = geocoderRef.current;

    const fetchLocations = async () => {
      const newLocations: StopLocationCache = {};

      for (const stop of stops) {
        // Skip if we already have this location cached
        const cachedLocation = stopLocations[stop.placeId];
        if (cachedLocation) {
          newLocations[stop.placeId] = cachedLocation;
          continue;
        }

        try {
          const result = await geocoder.geocode({ placeId: stop.placeId });
          const location = result.results[0]?.geometry.location;
          if (location) {
            newLocations[stop.placeId] = {
              lat: location.lat(),
              lng: location.lng(),
            };
          }
        } catch (e) {
          console.error("Failed to geocode stop:", stop.name, e);
        }
      }

      setStopLocations(newLocations);
    };

    void fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  return (
    <>
      {stops.map((stop, index) => {
        const location = stopLocations[stop.placeId];
        if (!location) return null;

        return (
          <AdvancedMarker key={stop.placeId} position={location}>
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="bg-primary flex size-6 items-center justify-center rounded-full border-2 border-white shadow-md">
                  <span className="text-xs font-bold text-white">
                    {index + 1}
                  </span>
                </div>
                <div className="border-primary absolute -bottom-1 left-1/2 size-0 -translate-x-1/2 border-x-4 border-t-[5px] border-x-transparent" />
              </div>
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}

function MapContent({
  fromPlaceId,
  toPlaceId,
  fromName,
  toName,
  stops = [],
}: Omit<RideMapProps, "apiKey">) {
  return (
    <div className="relative h-full w-full">
      <Map
        defaultCenter={CANADA_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="cooperative"
        disableDefaultUI
        mapId="ride-detail-map"
        className="h-full w-full"
      >
        <DirectionsRenderer fromPlaceId={fromPlaceId} toPlaceId={toPlaceId} />
        {stops.length > 0 && <StopMarkers stops={stops} />}
      </Map>

      {/* Route info header */}
      <div className="absolute top-4 right-4 left-4 z-10">
        <div className="bg-card/95 rounded-lg border p-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="text-primary size-4 shrink-0" />
            <span className="truncate font-medium">{fromName}</span>
            <span className="text-muted-foreground">→</span>
            <span className="truncate font-medium">{toName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RideMap({ apiKey, ...props }: RideMapProps) {
  if (!apiKey) {
    return (
      <div className="bg-muted/50 flex h-full w-full items-center justify-center">
        <div className="text-center">
          <MapPin className="text-muted-foreground mx-auto mb-2 size-8" />
          <p className="text-muted-foreground text-sm">Map unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapContent {...props} />
    </APIProvider>
  );
}
