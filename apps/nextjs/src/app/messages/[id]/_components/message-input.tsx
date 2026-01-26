"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";

import { Button } from "@app/ui/button";
import { Textarea } from "@app/ui/textarea";
import { toast } from "@app/ui/toast";

import { useTRPC } from "~/trpc/react";

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation(
    trpc.conversation.sendMessage.mutationOptions({
      onSuccess: () => {
        setContent("");
        void queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error("Failed to send message", {
          description: error.message,
        });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;

    sendMessageMutation.mutate({
      conversationId,
      content: trimmedContent,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isSubmitting = sendMessageMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          maxLength={2000}
          disabled={isSubmitting}
          className="min-h-[44px] resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
