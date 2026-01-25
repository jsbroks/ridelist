"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  Calendar,
  Car,
  Clock,
  DollarSign,
  Flag,
  MapPin,
  MessageCircle,
  Share2,
  Star,
  Users,
} from "lucide-react";

import { cn } from "@app/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Badge } from "@app/ui/badge";
import { Button } from "@app/ui/button";
import { Textarea } from "@app/ui/textarea";

interface RideStop {
  id: string;
  name: string;
  address?: string | null;
  orderIndex: number;
}

interface Driver {
  id: string;
  name: string;
  image?: string | null;
  createdAt?: Date;
}

interface Ride {
  id: string;
  fromName: string;
  fromAddress?: string | null;
  toName: string;
  toAddress?: string | null;
  departureTime: Date;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat?: number | null;
  description?: string | null;
  status: "active" | "full" | "cancelled" | "completed";
  distanceKm?: number | null;
  durationMinutes?: number | null;
  driver: Driver;
  stops: RideStop[];
}

interface RideDetailsProps {
  ride: Ride;
  isOwnRide: boolean;
  isLoggedIn: boolean;
  driverRating?: number | null;
  driverReviewCount?: number;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

const StatusBadge: React.FC<{ status: Ride["status"] }> = ({ status }) => {
  const variants = {
    active: { label: "Active", className: "bg-green-500/10 text-green-600" },
    full: { label: "Full", className: "bg-yellow-500/10 text-yellow-600" },
    cancelled: { label: "Cancelled", className: "bg-red-500/10 text-red-600" },
    completed: { label: "Completed", className: "bg-blue-500/10 text-blue-600" },
  };

  const variant = variants[status];

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
};

export const RideDetails: React.FC<RideDetailsProps> = ({
  ride,
  isOwnRide,
  isLoggedIn,
  driverRating,
  driverReviewCount = 0,
}) => {
  const [message, setMessage] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  const departureDate = new Date(ride.departureTime);
  const isPast = departureDate < new Date();
  const canRequest =
    isLoggedIn &&
    !isOwnRide &&
    ride.status === "active" &&
    ride.availableSeats > 0 &&
    !isPast;

  const handleRequestRide = async () => {
    setIsRequesting(true);
    // TODO: Implement ride request via tRPC
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRequesting(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      void navigator.share({
        title: `Ride from ${ride.fromName} to ${ride.toName}`,
        text: `Check out this ride on RideList`,
        url: window.location.href,
      });
    } else {
      void navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main Content */}
      <div className="space-y-6 lg:col-span-2">
        {/* Route Header */}
        <div className="rounded-xl border p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={ride.status} />
              {isPast && ride.status === "active" && (
                <Badge variant="outline" className="bg-muted">
                  Past
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="size-4" />
            </Button>
          </div>

          {/* Route */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="bg-primary flex size-10 items-center justify-center rounded-full">
                  <MapPin className="size-5 text-white" />
                </div>
                <div className="bg-border my-2 h-16 w-0.5" />
                <div className="bg-primary flex size-10 items-center justify-center rounded-full">
                  <Flag className="size-5 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-lg font-semibold">{ride.fromName}</p>
                  {ride.fromAddress && (
                    <p className="text-muted-foreground text-sm">
                      {ride.fromAddress}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold">{ride.toName}</p>
                  {ride.toAddress && (
                    <p className="text-muted-foreground text-sm">
                      {ride.toAddress}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stops */}
            {ride.stops.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  Stops along the way
                </p>
                <div className="flex flex-wrap gap-2">
                  {ride.stops
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((stop, index) => (
                      <div
                        key={stop.id}
                        className="bg-muted flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {index + 1}.
                        </span>
                        <span>{stop.name}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trip Details */}
        <div className="rounded-xl border p-6">
          <h2 className="mb-4 font-semibold">Trip Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                <Calendar className="text-primary size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Date</p>
                <p className="font-medium">
                  {format(departureDate, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                <Clock className="text-primary size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Departure Time</p>
                <p className="font-medium">{format(departureDate, "h:mm a")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                <Users className="text-primary size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Available Seats</p>
                <p className="font-medium">
                  {ride.availableSeats} of {ride.totalSeats} seats
                </p>
              </div>
            </div>
            {ride.pricePerSeat && (
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                  <DollarSign className="text-primary size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Price per Seat</p>
                  <p className="font-medium">
                    {formatPrice(ride.pricePerSeat)}
                  </p>
                </div>
              </div>
            )}
            {ride.distanceKm && (
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                  <Car className="text-primary size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Distance</p>
                  <p className="font-medium">{ride.distanceKm.toFixed(0)} km</p>
                </div>
              </div>
            )}
            {ride.durationMinutes && (
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                  <ArrowRight className="text-primary size-5" />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">
                    Estimated Duration
                  </p>
                  <p className="font-medium">
                    {formatDuration(ride.durationMinutes)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {ride.description && (
          <div className="rounded-xl border p-6">
            <h2 className="mb-3 font-semibold">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {ride.description}
            </p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Driver Card */}
        <div className="rounded-xl border p-6">
          <h2 className="mb-4 font-semibold">Driver</h2>
          <Link
            href={`/profile/${ride.driver.id}`}
            className="group flex items-center gap-4"
          >
            <Avatar className="size-16">
              <AvatarImage
                src={ride.driver.image ?? undefined}
                alt={ride.driver.name}
              />
              <AvatarFallback className="text-lg">
                {getInitials(ride.driver.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold group-hover:underline">
                {ride.driver.name}
              </p>
              {driverRating !== null && driverRating !== undefined && (
                <div className="mt-1 flex items-center gap-1">
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {driverRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    ({driverReviewCount} reviews)
                  </span>
                </div>
              )}
              {ride.driver.createdAt && (
                <p className="text-muted-foreground mt-1 text-sm">
                  Member since{" "}
                  {format(new Date(ride.driver.createdAt), "MMMM yyyy")}
                </p>
              )}
            </div>
          </Link>

          {!isOwnRide && isLoggedIn && (
            <Button variant="outline" className="mt-4 w-full gap-2">
              <MessageCircle className="size-4" />
              Message Driver
            </Button>
          )}
        </div>

        {/* Price Card */}
        {ride.pricePerSeat && (
          <div className="rounded-xl border p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <span className="text-muted-foreground text-sm">
                Price per seat
              </span>
              <span className="text-2xl font-bold">
                {formatPrice(ride.pricePerSeat)}
              </span>
            </div>
            {ride.availableSeats > 0 && (
              <p className="text-muted-foreground text-sm">
                {ride.availableSeats}{" "}
                {ride.availableSeats === 1 ? "seat" : "seats"} available
              </p>
            )}
          </div>
        )}

        {/* Request Form */}
        {canRequest && (
          <div className="rounded-xl border p-6">
            <h2 className="mb-4 font-semibold">Request to Join</h2>
            <div className="space-y-4">
              <Textarea
                placeholder="Introduce yourself and let the driver know about your trip..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
              <Button
                className="w-full"
                onClick={handleRequestRide}
                disabled={isRequesting}
              >
                {isRequesting ? "Sending Request..." : "Send Request"}
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                The driver will review your request and get back to you
              </p>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {!isLoggedIn && (
          <div className="rounded-xl border p-6 text-center">
            <p className="text-muted-foreground mb-4 text-sm">
              Sign in to request a seat on this ride
            </p>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        )}

        {isOwnRide && (
          <div className="rounded-xl border p-6">
            <h2 className="mb-4 font-semibold">Manage Your Ride</h2>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Edit Ride
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Cancel Ride
              </Button>
            </div>
          </div>
        )}

        {ride.status === "full" && !isOwnRide && (
          <div className="bg-muted rounded-xl border p-6 text-center">
            <Users className="text-muted-foreground mx-auto mb-2 size-8" />
            <p className="font-medium">This ride is full</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Check back later or find another ride
            </p>
          </div>
        )}

        {ride.status === "cancelled" && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/50">
            <p className="font-medium text-red-600 dark:text-red-400">
              This ride has been cancelled
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
