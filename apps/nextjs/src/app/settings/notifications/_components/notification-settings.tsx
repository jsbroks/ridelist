"use client";

import type React from "react";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@app/ui/button";
import { Checkbox } from "@app/ui/checkbox";
import { Label } from "@app/ui/label";

import {
  SettingsCard,
  SettingsRow,
} from "../../_components/settings-card";

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const NotificationSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [emailNotifications, setEmailNotifications] = useState<
    NotificationPreference[]
  >([
    {
      id: "ride_requests",
      label: "Ride requests",
      description: "When someone requests to join your ride",
      enabled: true,
    },
    {
      id: "ride_updates",
      label: "Ride updates",
      description: "Changes to rides you're participating in",
      enabled: true,
    },
    {
      id: "messages",
      label: "Messages",
      description: "New messages from other users",
      enabled: true,
    },
    {
      id: "marketing",
      label: "Marketing emails",
      description: "News, promotions, and updates from RideList",
      enabled: false,
    },
  ]);

  const [pushNotifications, setPushNotifications] = useState<
    NotificationPreference[]
  >([
    {
      id: "ride_reminders",
      label: "Ride reminders",
      description: "Reminders before your scheduled rides",
      enabled: true,
    },
    {
      id: "instant_messages",
      label: "Instant messages",
      description: "Real-time notifications for new messages",
      enabled: true,
    },
    {
      id: "price_alerts",
      label: "Price alerts",
      description: "Notifications when rides match your saved searches",
      enabled: false,
    },
  ]);

  const toggleEmailPreference = (id: string) => {
    setEmailNotifications((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref,
      ),
    );
  };

  const togglePushPreference = (id: string) => {
    setPushNotifications((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref,
      ),
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({
        type: "success",
        text: "Notification preferences saved",
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setMessage({
        type: "error",
        text: "Failed to save preferences. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Email Notifications"
        description="Choose what emails you want to receive"
      >
        <div className="space-y-6">
          {emailNotifications.map((pref) => (
            <SettingsRow
              key={pref.id}
              label={pref.label}
              description={pref.description}
            >
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`email-${pref.id}`}
                    checked={pref.enabled}
                    onCheckedChange={() => toggleEmailPreference(pref.id)}
                  />
                  <Label
                    htmlFor={`email-${pref.id}`}
                    className="cursor-pointer text-sm"
                  >
                    {pref.enabled ? "Enabled" : "Disabled"}
                  </Label>
                </div>
              </div>
            </SettingsRow>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Push Notifications"
        description="Manage notifications on your device"
      >
        <div className="space-y-6">
          {pushNotifications.map((pref) => (
            <SettingsRow
              key={pref.id}
              label={pref.label}
              description={pref.description}
            >
              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`push-${pref.id}`}
                    checked={pref.enabled}
                    onCheckedChange={() => togglePushPreference(pref.id)}
                  />
                  <Label
                    htmlFor={`push-${pref.id}`}
                    className="cursor-pointer text-sm"
                  >
                    {pref.enabled ? "Enabled" : "Disabled"}
                  </Label>
                </div>
              </div>
            </SettingsRow>
          ))}
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
        <Button onClick={handleSave} disabled={isLoading} className="gap-2">
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
};
