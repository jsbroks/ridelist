"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Badge } from "@app/ui/badge";

interface Conversation {
  id: string;
  rideRequestId: string;
  rideRequestStatus: string;
  rideId: string;
  fromName: string;
  toName: string;
  departureTime: Date;
  otherUser: {
    id: string;
    name: string | null;
    image: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: Date;
    senderId: string;
  } | null;
  createdAt: Date;
}

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
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
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Pending
        </Badge>
      );
    case "accepted":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Accepted
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          Rejected
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Cancelled
        </Badge>
      );
    default:
      return null;
  }
}

export function ConversationList({
  conversations,
  currentUserId,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="text-muted-foreground mb-4 size-12" />
        <h3 className="text-lg font-semibold">No messages yet</h3>
        <p className="text-muted-foreground mt-1 max-w-sm">
          When you request a ride or receive a request, your conversations will
          appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {conversations.map((conversation) => {
        const isOwnMessage =
          conversation.lastMessage?.senderId === currentUserId;

        return (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            className="hover:bg-muted/50 flex items-start gap-4 p-4 transition-colors"
          >
            <Avatar className="size-12">
              <AvatarImage
                src={conversation.otherUser.image ?? undefined}
                alt={conversation.otherUser.name ?? "User"}
              />
              <AvatarFallback>
                {getInitials(conversation.otherUser.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium">
                  {conversation.otherUser.name ?? "Unknown User"}
                </p>
                <div className="flex items-center gap-2">
                  {getStatusBadge(conversation.rideRequestStatus)}
                  {conversation.lastMessage && (
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(
                        new Date(conversation.lastMessage.createdAt),
                        { addSuffix: true },
                      )}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground mt-0.5 text-sm">
                {conversation.fromName} → {conversation.toName}
              </p>

              {conversation.lastMessage && (
                <p className="text-muted-foreground mt-1 truncate text-sm">
                  {isOwnMessage ? "You: " : ""}
                  {conversation.lastMessage.content}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
