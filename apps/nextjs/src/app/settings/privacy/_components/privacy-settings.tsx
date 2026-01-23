"use client";

import type React from "react";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@app/ui/button";
import { Checkbox } from "@app/ui/checkbox";
import { Label } from "@app/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/ui/select";

import {
  SettingsCard,
  SettingsRow,
} from "../../_components/settings-card";

export const PrivacySettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [profileVisibility, setProfileVisibility] = useState("everyone");
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [allowMessaging, setAllowMessaging] = useState(true);
  const [showRideHistory, setShowRideHistory] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage({
        type: "success",
        text: "Privacy settings saved",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({
        type: "error",
        text: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadData = async () => {
    setIsDownloading(true);
    try {
      // Simulate data export
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // In a real app, this would trigger a download
      console.log("Data export requested");
    } catch (error) {
      console.error("Failed to download data:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Profile Privacy"
        description="Control who can see your profile information"
      >
        <div className="space-y-6">
          <SettingsRow
            label="Profile visibility"
            description="Who can view your profile"
          >
            <Select
              value={profileVisibility}
              onValueChange={setProfileVisibility}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="verified">Verified users only</SelectItem>
                <SelectItem value="connections">My connections only</SelectItem>
              </SelectContent>
            </Select>
          </SettingsRow>

          <SettingsRow
            label="Show email address"
            description="Display your email on your profile"
          >
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-email"
                  checked={showEmail}
                  onCheckedChange={(checked) => setShowEmail(checked === true)}
                />
                <Label htmlFor="show-email" className="cursor-pointer text-sm">
                  {showEmail ? "Visible" : "Hidden"}
                </Label>
              </div>
            </div>
          </SettingsRow>

          <SettingsRow
            label="Show phone number"
            description="Display your phone number on your profile"
          >
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-phone"
                  checked={showPhone}
                  onCheckedChange={(checked) => setShowPhone(checked === true)}
                />
                <Label htmlFor="show-phone" className="cursor-pointer text-sm">
                  {showPhone ? "Visible" : "Hidden"}
                </Label>
              </div>
            </div>
          </SettingsRow>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Communication"
        description="Control how others can contact you"
      >
        <div className="space-y-6">
          <SettingsRow
            label="Allow messages"
            description="Let other users send you messages"
          >
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allow-messaging"
                  checked={allowMessaging}
                  onCheckedChange={(checked) =>
                    setAllowMessaging(checked === true)
                  }
                />
                <Label
                  htmlFor="allow-messaging"
                  className="cursor-pointer text-sm"
                >
                  {allowMessaging ? "Allowed" : "Blocked"}
                </Label>
              </div>
            </div>
          </SettingsRow>

          <SettingsRow
            label="Show ride history"
            description="Display your past rides on your profile"
          >
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-history"
                  checked={showRideHistory}
                  onCheckedChange={(checked) =>
                    setShowRideHistory(checked === true)
                  }
                />
                <Label
                  htmlFor="show-history"
                  className="cursor-pointer text-sm"
                >
                  {showRideHistory ? "Visible" : "Hidden"}
                </Label>
              </div>
            </div>
          </SettingsRow>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Your Data"
        description="Download or manage your personal data"
      >
        <SettingsRow
          label="Download your data"
          description="Get a copy of all data associated with your account"
        >
          <Button
            variant="outline"
            onClick={handleDownloadData}
            disabled={isDownloading}
            className="gap-2"
          >
            {isDownloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Download Data
          </Button>
        </SettingsRow>
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
          Save Settings
        </Button>
      </div>
    </div>
  );
};
