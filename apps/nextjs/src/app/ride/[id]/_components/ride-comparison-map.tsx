"use client";

import { useEffect, useRef } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";

interface RouteGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

interface RideComparisonMapProps {
  apiKey?: string;
  // Driver's route (stored in database)
  driverRoute: RouteGeometry;
  fromName: string;
  toName: string;
  // Optional: User's comparison route (from search params)
  userPickupPlaceId?: string | null;
  userDropoffPlaceId?: string | null;
  userPickupName?: string | null;
  userDropoffName?: string | null;
}

const CANADA_CENTER = { lat: 56.1304, lng: -106.3468 };
const DEFAULT_ZOOM = 3;

// Render the driver's stored route geometry
function DriverRouteRenderer({
  route,
}: {
  route: { type: "LineString"; coordinates: [number, number][] };
}) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof window === "undefined" || !window.google?.maps) return;

    polylineRef.current?.setMap(null);

    const path = route.coordinates.map(
      ([lng, lat]) => new google.maps.LatLng(lat, lng),
    );

    polylineRef.current = new google.maps.Polyline({
      path,
      map,
      strokeColor: "#ef4444", // Red for driver route
      strokeWeight: 5,
      strokeOpacity: 0.8,
      zIndex: 1,
    });

    const bounds = new google.maps.LatLngBounds();
    path.forEach((point) => bounds.extend(point));
    map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });

    return () => {
      polylineRef.current?.setMap(null);
    };
  }, [map, route]);

  return null;
}

// Render the user's comparison route in blue
function UserRouteRenderer({
  pickupPlaceId,
  dropoffPlaceId,
  driverRoute,
}: {
  pickupPlaceId: string;
  dropoffPlaceId: string;
  driverRoute: { type: "LineString"; coordinates: [number, number][] };
}) {
  const map = useMap();
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(
    null,
  );
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null,
  );

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
        preserveViewport: true,
        polylineOptions: {
          strokeColor: "#3b82f6", // Blue for user route
          strokeWeight: 4,
          strokeOpacity: 0.8,
          zIndex: 2,
        },
      });
    } else {
      directionsRendererRef.current.setMap(map);
    }

    return () => {
      directionsRendererRef.current?.setMap(null);
    };
  }, [map]);

  useEffect(() => {
    const service = directionsServiceRef.current;
    const renderer = directionsRendererRef.current;

    if (!service || !renderer || !pickupPlaceId || !dropoffPlaceId) return;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof window === "undefined" || !window.google?.maps) return;

    void service
      .route({
        origin: { placeId: pickupPlaceId },
        destination: { placeId: dropoffPlaceId },
        travelMode: window.google.maps.TravelMode.DRIVING,
      })
      .then((response: google.maps.DirectionsResult) => {
        renderer.setDirections(response);

        // Extend bounds to include both routes
        if (map) {
          const bounds = new google.maps.LatLngBounds();

          // Add driver route points
          driverRoute.coordinates.forEach(([lng, lat]) => {
            bounds.extend(new google.maps.LatLng(lat, lng));
          });

          // Add user route bounds
          const userBounds = response.routes[0]?.bounds;
          if (userBounds) {
            bounds.union(userBounds);
          }

          map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        }
      })
      .catch((e: unknown) => {
        console.error("User route directions request failed:", e);
      });
  }, [map, pickupPlaceId, dropoffPlaceId, driverRoute]);

  return null;
}

function MapContent({
  driverRoute,
  fromName,
  toName,
  userPickupPlaceId,
  userDropoffPlaceId,
  userPickupName,
  userDropoffName,
}: Omit<RideComparisonMapProps, "apiKey">) {
  const hasUserRoute = userPickupPlaceId && userDropoffPlaceId;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <Map
        defaultCenter={CANADA_CENTER}
        defaultZoom={DEFAULT_ZOOM}
        gestureHandling="cooperative"
        disableDefaultUI
        mapId="ride-comparison-map"
        className="h-full w-full"
      >
        <DriverRouteRenderer route={driverRoute} />

        {hasUserRoute && (
          <UserRouteRenderer
            pickupPlaceId={userPickupPlaceId}
            dropoffPlaceId={userDropoffPlaceId}
            driverRoute={driverRoute}
          />
        )}
      </Map>

      {/* Route Legend Overlay */}
      <div className="absolute top-4 right-4 left-4 z-10">
        <div className="bg-card/95 rounded-lg border p-3 shadow-lg backdrop-blur-sm">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-1 w-5 rounded-full bg-[#ef4444]" />
              <span className="text-muted-foreground">Driver&apos;s route:</span>
              <span className="truncate font-medium">
                {fromName} → {toName}
              </span>
            </div>
            {hasUserRoute && (
              <div className="flex items-center gap-2">
                <div className="h-1 w-5 rounded-full bg-[#3b82f6]" />
                <span className="text-muted-foreground">Your route:</span>
                <span className="truncate font-medium">
                  {userPickupName ?? "Pickup"} → {userDropoffName ?? "Dropoff"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RideComparisonMap({
  apiKey,
  ...props
}: RideComparisonMapProps) {
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
