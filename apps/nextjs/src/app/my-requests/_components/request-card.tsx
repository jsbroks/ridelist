"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Loader2,
  MapPin,
  MessageSquare,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Badge } from "@app/ui/badge";
import { Button } from "@app/ui/button";
import { toast } from "@app/ui/toast";

import { useTRPC } from "~/trpc/react";

interface RideRequest {
  id: string;
  rideId: string;
  status: string;
  seatsRequested: number;
  message: string | null;
  pickupName: string | null;
  dropoffName: string | null;
  createdAt: Date;
  ride: {
    id: string;
    fromName: string;
    toName: string;
    departureTime: Date;
    driver: {
      id: string;
      name: string;
      image: string | null;
    };
  };
  conversation: {
    id: string;
  } | null;
}

interface RequestCardProps {
  request: RideRequest;
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

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Accepted
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Rejected
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          Cancelled
        </Badge>
      );
    default:
      return null;
  }
}

export function RequestCard({ request }: RequestCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation(
    trpc.rideRequest.cancel.mutationOptions({
      onSuccess: () => {
        toast.success("Request cancelled");
        void queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error("Failed to cancel request", {
          description: error.message,
        });
      },
    }),
  );

  const canCancel =
    request.status === "pending" || request.status === "accepted";
  const isCancelling = cancelMutation.isPending;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-12">
            <AvatarImage
              src={request.ride.driver.image ?? undefined}
              alt={request.ride.driver.name}
            />
            <AvatarFallback>
              {getInitials(request.ride.driver.name)}
            </AvatarFallback>
          </Avatar>

          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/ride/${request.ride.id}`}
                className="font-medium hover:underline"
              >
                {request.ride.fromName} → {request.ride.toName}
              </Link>
              {getStatusBadge(request.status)}
            </div>

            <p className="text-muted-foreground mt-1 text-sm">
              Driver: {request.ride.driver.name}
            </p>

            <div className="text-muted-foreground mt-2 flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Calendar className="size-4" />
                {format(
                  new Date(request.ride.departureTime),
                  "EEE, MMM d 'at' h:mm a",
                )}
              </span>
              <span className="flex items-center gap-1">
                <Users className="size-4" />
                {request.seatsRequested} seat
                {request.seatsRequested !== 1 ? "s" : ""} requested
              </span>
            </div>

            {(request.pickupName ?? request.dropoffName) && (
              <div className="text-muted-foreground mt-2 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  {request.pickupName ?? "Not specified"} →{" "}
                  {request.dropoffName ?? "Not specified"}
                </span>
              </div>
            )}

            {request.message && (
              <p className="bg-muted mt-3 rounded p-2 text-sm">
                &ldquo;{request.message}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        {request.conversation && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/messages/${request.conversation.id}`}>
              <MessageSquare className="mr-2 size-4" />
              View Messages
            </Link>
          </Button>
        )}

        <Button variant="outline" size="sm" asChild>
          <Link href={`/ride/${request.ride.id}`}>View Ride</Link>
        </Button>

        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => cancelMutation.mutate({ requestId: request.id })}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <X className="mr-2 size-4" />
            )}
            Cancel Request
          </Button>
        )}
      </div>
    </div>
  );
}
