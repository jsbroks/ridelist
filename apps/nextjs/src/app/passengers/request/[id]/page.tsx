import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Bike,
  Calendar,
  Clock,
  Dog,
  Luggage,
  MapPin,
  MessageSquare,
  Snowflake,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Badge } from "@app/ui/badge";
import { Button } from "@app/ui/button";
import { Separator } from "@app/ui/separator";

import { getSession } from "~/auth/server";
import { fetchQuery, trpc } from "~/trpc/server";

interface RideWantedPageProps {
  params: Promise<{ id: string }>;
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

export async function generateMetadata({
  params,
}: RideWantedPageProps): Promise<Metadata> {
  const { id } = await params;

  const rideWanted = await fetchQuery(
    trpc.rideWanted.byId.queryOptions({ id }),
  ).catch(() => null);

  if (!rideWanted) {
    return {
      title: "Ride Request Not Found",
    };
  }

  const departureDate = format(
    new Date(rideWanted.departureTime),
    "MMMM d, yyyy",
  );

  return {
    title: `${rideWanted.fromName} to ${rideWanted.toName}`,
    description: `Passenger looking for a ride from ${rideWanted.fromName} to ${rideWanted.toName} on ${departureDate}. ${rideWanted.seatsNeeded} seat${rideWanted.seatsNeeded !== 1 ? "s" : ""} needed.`,
    openGraph: {
      title: `Ride Request: ${rideWanted.fromName} → ${rideWanted.toName} | RideList`,
      description: `Passenger looking for a ride from ${rideWanted.fromName} to ${rideWanted.toName} on ${departureDate}.`,
    },
  };
}

export default async function RideWantedPage({ params }: RideWantedPageProps) {
  const { id } = await params;

  const [rideWanted, session] = await Promise.all([
    fetchQuery(trpc.rideWanted.byId.queryOptions({ id })).catch(() => null),
    getSession(),
  ]);

  if (!rideWanted) {
    notFound();
  }

  const departureDate = new Date(rideWanted.departureTime);
  const isOwnRequest = session?.user?.id === rideWanted.passengerId;
  const isLoggedIn = !!session?.user;

  return (
    <main className="container py-8">
      {/* Back button */}
      <Link
        href="/passengers"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to all requests
      </Link>

      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Badge variant="secondary">Ride Request</Badge>
            {rideWanted.status === "active" && (
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            )}
            {rideWanted.status === "fulfilled" && (
              <Badge variant="default" className="bg-blue-500">
                Fulfilled
              </Badge>
            )}
            {rideWanted.status === "cancelled" && (
              <Badge variant="destructive">Cancelled</Badge>
            )}
            {rideWanted.status === "expired" && (
              <Badge variant="outline">Expired</Badge>
            )}
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            {rideWanted.fromName} → {rideWanted.toName}
          </h1>

          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4" />
              <span>{format(departureDate, "EEEE, MMMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4" />
              <span>{format(departureDate, "h:mm a")}</span>
            </div>
            {rideWanted.flexibilityMinutes &&
              rideWanted.flexibilityMinutes > 0 && (
                <Badge variant="secondary">
                  ±{rideWanted.flexibilityMinutes} min flexible
                </Badge>
              )}
          </div>
        </div>

        {/* Route Details */}
        <div className="bg-card mb-8 rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Route Details</h2>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center pt-1">
              <div className="bg-primary size-3 rounded-full" />
              <div className="bg-border my-1 h-12 w-px" />
              <div className="size-3 rounded-full bg-red-500" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="font-medium">{rideWanted.fromName}</p>
                {rideWanted.fromAddress && (
                  <p className="text-muted-foreground text-sm">
                    {rideWanted.fromAddress}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium">{rideWanted.toName}</p>
                {rideWanted.toAddress && (
                  <p className="text-muted-foreground text-sm">
                    {rideWanted.toAddress}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="bg-card mb-8 rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Trip Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                <Users className="text-primary size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Seats Needed</p>
                <p className="font-medium">{rideWanted.seatsNeeded}</p>
              </div>
            </div>
            {rideWanted.maxPricePerSeat && (
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex size-10 items-center justify-center rounded-full">
                  <span className="text-primary text-lg font-bold">$</span>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Max Budget</p>
                  <p className="font-medium">
                    ${(rideWanted.maxPricePerSeat / 100).toFixed(0)} per seat
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Preferences */}
          {(rideWanted.luggageSize ||
            rideWanted.hasBike ||
            rideWanted.hasSkis ||
            rideWanted.hasPet) && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-muted-foreground mb-2 text-sm">
                  Special Requirements
                </p>
                <div className="flex flex-wrap gap-2">
                  {rideWanted.luggageSize && (
                    <Badge variant="outline" className="gap-1">
                      <Luggage className="size-3" />
                      {rideWanted.luggageSize} luggage
                    </Badge>
                  )}
                  {rideWanted.hasBike && (
                    <Badge variant="outline" className="gap-1">
                      <Bike className="size-3" />
                      Bringing a bike
                    </Badge>
                  )}
                  {rideWanted.hasSkis && (
                    <Badge variant="outline" className="gap-1">
                      <Snowflake className="size-3" />
                      Bringing skis
                    </Badge>
                  )}
                  {rideWanted.hasPet && (
                    <Badge variant="outline" className="gap-1">
                      <Dog className="size-3" />
                      Traveling with pet
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Description */}
        {rideWanted.description && (
          <div className="bg-card mb-8 rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold">Additional Notes</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {rideWanted.description}
            </p>
          </div>
        )}

        {/* Passenger Info */}
        <div className="bg-card mb-8 rounded-xl border p-6">
          <h2 className="mb-4 text-lg font-semibold">Passenger</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarImage
                  src={rideWanted.passenger.image ?? undefined}
                  alt={rideWanted.passenger.name}
                />
                <AvatarFallback>
                  {getInitials(rideWanted.passenger.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-medium">
                  {rideWanted.passenger.name}
                </p>
                <Link
                  href={`/profile/${rideWanted.passenger.username ?? rideWanted.passenger.id}`}
                  className="text-primary text-sm hover:underline"
                >
                  View profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isOwnRequest && rideWanted.status === "active" && (
          <div className="bg-card rounded-xl border p-6">
            <h2 className="mb-4 text-lg font-semibold">Interested?</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              If you&apos;re heading in this direction and have space in your
              car, reach out to this passenger and offer them a ride.
            </p>
            {isLoggedIn ? (
              <div className="flex gap-3">
                <Button asChild>
                  <Link href={`/messages?new=${rideWanted.passengerId}`}>
                    <MessageSquare className="mr-2 size-4" />
                    Send Message
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/post">Post Your Ride</Link>
                </Button>
              </div>
            ) : (
              <Button asChild>
                <Link href="/login">Login to Contact</Link>
              </Button>
            )}
          </div>
        )}

        {isOwnRequest && (
          <div className="bg-muted/50 rounded-xl border border-dashed p-6 text-center">
            <MapPin className="text-muted-foreground mx-auto mb-2 size-8" />
            <p className="text-muted-foreground text-sm">
              This is your ride request. Drivers can see this and reach out to
              you.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
