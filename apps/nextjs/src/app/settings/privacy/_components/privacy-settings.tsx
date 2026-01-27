"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Checkbox } from "@app/ui/checkbox";
import { Label } from "@app/ui/label";

import { useTRPC } from "~/trpc/react";
import { SettingsCard, SettingsRow } from "../../_components/settings-card";

interface PrivacySettingsProps {
  initialSettings: {
    showPhoneNumber: boolean;
    hasPhoneNumber: boolean;
  };
}

export const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  initialSettings,
}) => {
  const router = useRouter();
  const trpc = useTRPC();
  const [showPhoneNumber, setShowPhoneNumber] = useState(
    initialSettings.showPhoneNumber,
  );

  const updatePrivacyMutation = useMutation(
    trpc.user.updatePrivacySettings.mutationOptions(),
  );

  const handleToggleShowPhone = async (checked: boolean) => {
    setShowPhoneNumber(checked);
    try {
      await updatePrivacyMutation.mutateAsync({ showPhoneNumber: checked });
      router.refresh();
    } catch {
      // Revert on error
      setShowPhoneNumber(!checked);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Profile Privacy"
        description="Control who can see your contact information"
      >
        <SettingsRow
          label="Show phone number"
          description="Display your phone number on your profile"
        >
          <div className="flex justify-end">
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-phone"
                checked={showPhoneNumber}
                onCheckedChange={(checked) =>
                  void handleToggleShowPhone(checked === true)
                }
                disabled={updatePrivacyMutation.isPending}
              />
              <Label htmlFor="show-phone" className="cursor-pointer text-sm">
                {showPhoneNumber ? "Visible" : "Hidden"}
              </Label>
              {updatePrivacyMutation.isPending && (
                <Loader2 className="text-muted-foreground size-4 animate-spin" />
              )}
            </div>
          </div>
        </SettingsRow>
      </SettingsCard>

      {updatePrivacyMutation.isError && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          Failed to save settings. Please try again.
        </div>
      )}
    </div>
  );
};
