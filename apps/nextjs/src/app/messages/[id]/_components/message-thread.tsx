"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface MessageThreadProps {
  messages: Message[];
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

export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Messages come in descending order, reverse for display
  const sortedMessages = [...messages].reverse();

  if (sortedMessages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">
          No messages yet. Start the conversation!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {sortedMessages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;

        return (
          <div
            key={message.id}
            className={`flex items-end gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}
          >
            {!isOwnMessage && (
              <Avatar className="size-8">
                <AvatarImage
                  src={message.sender.image ?? undefined}
                  alt={message.sender.name ?? "User"}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(message.sender.name)}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              <p className="wrap-break-word whitespace-pre-wrap">
                {message.content}
              </p>
              <p
                className={`mt-1 text-xs ${
                  isOwnMessage
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                }`}
              >
                {format(new Date(message.createdAt), "h:mm a")}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
