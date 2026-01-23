"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Button } from "@app/ui/button";
import { Input } from "@app/ui/input";
import { Label } from "@app/ui/label";

import { authClient } from "~/auth/client";
import { SettingsCard, SettingsRow } from "./settings-card";

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    username?: string | null;
  };
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user }) => {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await authClient.updateUser({
        name,
        username: username || undefined,
      });

      setMessage({ type: "success", text: "Profile updated successfully" });
      router.refresh();
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsCard
        title="Profile Picture"
        description="Your profile picture is visible to other users"
      >
        <div className="flex items-center gap-6">
          <Avatar className="size-20">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="text-xl">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Camera className="size-4" />
              Change photo
            </Button>
            <p className="text-muted-foreground text-xs">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Personal Information"
        description="Update your personal details"
      >
        <div className="space-y-6">
          <SettingsRow label="Full Name" description="Your display name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </SettingsRow>

          <SettingsRow
            label="Username"
            description="Your unique identifier on RideList"
          >
            <div className="relative">
              <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                @
              </span>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="pl-7"
              />
            </div>
          </SettingsRow>

          <SettingsRow label="Email" description="Your email address">
            <Input value={user.email} disabled className="bg-muted" />
          </SettingsRow>
        </div>
      </SettingsCard>

      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.type === "success"
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="gap-2">
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
};
