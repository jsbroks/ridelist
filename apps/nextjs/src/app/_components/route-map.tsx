"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { useEffect, useRef, useState } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

interface RouteMapProps {
  apiKey?: string;
  fromPlaceId: string | null;
  toPlaceId: string | null;
  fromName?: string;
  toName?: string;
}

interface RouteInfo {
  distance: string;
  duration: string;
}

// Default center on Canada
const CANADA_CENTER = { lat: 56.1304, lng: -106.3468 };
const DEFAULT_ZOOM = 4;

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
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Initialize directions service and renderer
  useEffect(() => {
    if (!map) return;

    // Check if google is defined
    if (typeof window === "undefined" || !window.google?.maps) return;

    const googleMaps = window.google.maps;

    directionsServiceRef.current ??= new googleMaps.DirectionsService();

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new googleMaps.DirectionsRenderer({
        map,
        suppressMarkers: false,
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
    if (typeof window === "undefined" || !window.google?.maps) return;

    void service
      .route({
        origin: { placeId: fromPlaceId },
        destination: { placeId: toPlaceId },
        travelMode: window.google.maps.TravelMode.DRIVING,
      })
      .then((response: google.maps.DirectionsResult) => {
        renderer.setDirections(response);
        const route = response.routes[0];
        const leg = route?.legs[0];
        if (leg) {
          setRouteInfo({
            distance: leg.distance?.text ?? "",
            duration: leg.duration?.text ?? "",
          });
        }
      })
      .catch((e: unknown) => {
        console.error("Directions request failed:", e);
        setRouteInfo(null);
      });
  }, [fromPlaceId, toPlaceId]);

  if (!routeInfo) return null;

  return (
    <div className="absolute right-4 bottom-4 left-4 z-10">
      <div className="bg-card/95 rounded-lg border p-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Distance:</span>{" "}
            <span className="font-medium">{routeInfo.distance}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>{" "}
            <span className="font-medium">{routeInfo.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapContent({
  fromPlaceId,
  toPlaceId,
  fromName,
  toName,
}: Omit<RouteMapProps, "apiKey">) {
  const hasRoute = fromPlaceId && toPlaceId;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <Map
        defaultCenter={CANADA_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="cooperative"
        disableDefaultUI
        mapId="route-preview-map"
        className="h-full w-full"
      >
        {hasRoute && (
          <DirectionsRenderer fromPlaceId={fromPlaceId} toPlaceId={toPlaceId} />
        )}
      </Map>

      {/* Empty state overlay */}
      {!hasRoute && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-card/90 rounded-xl border p-6 text-center shadow-lg backdrop-blur-sm">
            <MapPin className="text-primary mx-auto mb-3 size-8" />
            <p className="font-medium">Route Preview</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Select departure and destination
              <br />
              to see your route
            </p>
          </div>
        </div>
      )}

      {/* Route info header */}
      {hasRoute && (fromName ?? toName) && (
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
      )}
    </div>
  );
}

export function RouteMap({ apiKey, ...props }: RouteMapProps) {
  if (!apiKey) {
    return (
      <div className="bg-muted/50 flex h-full w-full items-center justify-center rounded-xl border">
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
