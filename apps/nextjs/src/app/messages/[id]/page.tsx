import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Badge } from "@app/ui/badge";

import { getSession } from "~/auth/server";
import { fetchQuery, trpc } from "~/trpc/server";
import { MessageInput } from "./_components/message-input";
import { MessageThread } from "./_components/message-thread";

interface ConversationPageProps {
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

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { id: conversationId } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Get all conversations to find this one's context
  const conversations = await fetchQuery(
    trpc.conversation.list.queryOptions(),
  ).catch(() => []);

  const conversation = conversations.find((c) => c.id === conversationId);

  if (!conversation) {
    notFound();
  }

  // Get messages for this conversation
  const messages = await fetchQuery(
    trpc.conversation.getMessages.queryOptions({
      conversationId,
      limit: 50,
    }),
  ).catch(() => []);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Link
          href="/messages"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>

        <Avatar className="size-10">
          <AvatarImage
            src={conversation.otherUser.image ?? undefined}
            alt={conversation.otherUser.name ?? "User"}
          />
          <AvatarFallback>
            {getInitials(conversation.otherUser.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">
              {conversation.otherUser.name ?? "Unknown User"}
            </p>
            {getStatusBadge(conversation.rideRequestStatus)}
          </div>
          <p className="text-muted-foreground truncate text-sm">
            {conversation.fromName} → {conversation.toName}
          </p>
        </div>

        <Link
          href={`/ride/${conversation.rideId}`}
          className="text-primary text-sm hover:underline"
        >
          View Ride
        </Link>
      </div>

      {/* Messages */}
      <MessageThread messages={messages} currentUserId={session.user.id} />

      {/* Input */}
      <MessageInput conversationId={conversationId} />
    </div>
  );
}
