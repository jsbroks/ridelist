"use client";

import { useEffect, useRef, useState } from "react";
import { decode } from "@googlemaps/polyline-codec";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

export interface TownSuggestion {
  name: string;
  placeId: string;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  distanceKm: number;
  geometry: GeoJSON.LineString; // GeoJSON LineString for the route
}

interface RouteMapProps {
  apiKey?: string;
  fromPlaceId: string | null;
  toPlaceId: string | null;
  fromName?: string;
  toName?: string;
  stops?: TownSuggestion[];
  onRouteInfoChange?: (info: RouteInfo | null) => void;
  onTownSuggestionsChange?: (towns: TownSuggestion[]) => void;
}

// Default center on Canada
const CANADA_CENTER = { lat: 56.1304, lng: -106.3468 };
const DEFAULT_ZOOM = 3;

function DirectionsRenderer({
  fromPlaceId,
  toPlaceId,
  onRouteInfoChange,
  onTownSuggestionsChange,
}: {
  fromPlaceId: string;
  toPlaceId: string;
  onRouteInfoChange?: (info: RouteInfo | null) => void;
  onTownSuggestionsChange?: (towns: TownSuggestion[]) => void;
}) {
  const map = useMap();
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(
    null,
  );
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null,
  );
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [_townSuggestions, setTownSuggestions] = useState<TownSuggestion[]>([]);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Use refs for callbacks to avoid triggering effect re-runs
  const onRouteInfoChangeRef = useRef(onRouteInfoChange);
  const onTownSuggestionsChangeRef = useRef(onTownSuggestionsChange);
  onRouteInfoChangeRef.current = onRouteInfoChange;
  onTownSuggestionsChangeRef.current = onTownSuggestionsChange;

  // Extract towns along the route using reverse geocoding
  const extractTownsAlongRoute = async (
    route: google.maps.DirectionsRoute,
    distanceKm: number,
  ) => {
    const path = route.overview_path;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!path || path.length < 2) return;

    geocoderRef.current ??= new google.maps.Geocoder();
    const geocoder = geocoderRef.current;

    const towns: TownSuggestion[] = [];
    const seenPlaceIds = new Set<string>();

    // Sample every 30km along the route, excluding start and end
    const SAMPLE_INTERVAL_KM = 20;
    const numSamples = Math.floor(distanceKm / SAMPLE_INTERVAL_KM);

    // If the trip is too short, don't sample any intermediate points
    if (numSamples < 1) {
      setTownSuggestions([]);
      onTownSuggestionsChangeRef.current?.([]);
      return;
    }

    // Calculate sample indices based on distance intervals
    const sampleIndices: number[] = [];
    for (let i = 1; i <= numSamples; i++) {
      const percentage = (i * SAMPLE_INTERVAL_KM) / distanceKm;
      // Don't sample too close to the end (within 10% of destination)
      if (percentage < 0.9) {
        const index = Math.floor(path.length * percentage);
        sampleIndices.push(index);
      }
    }

    for (const index of sampleIndices) {
      const point = path[index];
      if (!point) continue;

      try {
        const result = await geocoder.geocode({ location: point });
        // Find a locality (city/town) result
        const locality = result.results.find(
          (r) =>
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            r.types.includes("locality") ?? r.types.includes("sublocality"),
        );

        if (locality && !seenPlaceIds.has(locality.place_id)) {
          seenPlaceIds.add(locality.place_id);
          // Extract just the city name from the formatted address
          const cityName =
            locality.address_components.find(
              (c) =>
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                c.types.includes("locality") ?? c.types.includes("sublocality"),
            )?.long_name ?? locality.formatted_address.split(",")[0];

          if (cityName) {
            towns.push({
              name: cityName,
              placeId: locality.place_id,
            });
          }
        }
      } catch (e) {
        console.error("Geocoding failed for point:", e);
      }
    }

    setTownSuggestions(towns);
    onTownSuggestionsChangeRef.current?.(towns);
  };

  // Initialize directions service and renderer
  useEffect(() => {
    if (!map) return;

    // Check if google is defined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof window === "undefined" || !window.google?.maps) return;

    const googleMaps = window.google.maps;

    directionsServiceRef.current ??= new googleMaps.DirectionsService();

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new googleMaps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        preserveViewport: true, // We'll manually fit bounds with padding
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
        const route = response.routes[0];
        const leg = route?.legs[0];
        const distanceKm = (leg?.distance?.value ?? 0) / 1000;

        // Fit bounds with padding for overlays (top header + bottom info panel)
        if (route?.bounds && map) {
          map.fitBounds(route.bounds, {
            top: 80,
            bottom: 100,
            left: 20,
            right: 20,
          });
        }

        if (leg && route?.overview_polyline) {
          // Decode Google's polyline and convert to GeoJSON LineString
          const decoded = decode(route.overview_polyline);
          const geometry: GeoJSON.LineString = {
            type: "LineString",
            // Convert from [lat, lng] to GeoJSON [lng, lat] format
            coordinates: decoded.map(([lat, lng]) => [lng, lat]),
          };

          const info: RouteInfo = {
            distance: leg.distance?.text ?? "",
            duration: leg.duration?.text ?? "",
            distanceKm,
            geometry,
          };
          setRouteInfo(info);
          onRouteInfoChangeRef.current?.(info);
        }
        // Extract towns along the route only if callback is provided
        if (route && onTownSuggestionsChangeRef.current) {
          void extractTownsAlongRoute(route, distanceKm);
        }
      })
      .catch((e: unknown) => {
        console.error("Directions request failed:", e);
        setRouteInfo(null);
        setTownSuggestions([]);
        onRouteInfoChangeRef.current?.(null);
        onTownSuggestionsChangeRef.current?.([]);
      });
  }, [fromPlaceId, toPlaceId, map]);

  if (!routeInfo) return null;

  return (
    <div className="pointer-events-auto absolute right-4 bottom-4 left-4 z-10">
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

// Type for stop locations cache
type StopLocationCache = Record<string, google.maps.LatLngLiteral>;

// Component to render markers for stops
function StopMarkers({ stops }: { stops: TownSuggestion[] }) {
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
              {/* Custom marker pin */}
              <div className="relative">
                <div className="bg-primary flex size-5 items-center justify-center rounded-full border border-white shadow-md">
                  <span className="text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                </div>
                {/* Pin tail */}
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
  onRouteInfoChange,
  onTownSuggestionsChange,
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
          <DirectionsRenderer
            fromPlaceId={fromPlaceId}
            toPlaceId={toPlaceId}
            onRouteInfoChange={onRouteInfoChange}
            onTownSuggestionsChange={onTownSuggestionsChange}
          />
        )}
        {stops.length > 0 && <StopMarkers stops={stops} />}
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
