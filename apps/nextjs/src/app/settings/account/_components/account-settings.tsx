"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, LogOut, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@app/ui/alert-dialog";
import { Button } from "@app/ui/button";
import { Input } from "@app/ui/input";

import { authClient } from "~/auth/client";
import { SettingsCard, SettingsRow } from "../../_components/settings-card";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface AccountSettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ user }) => {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleSignOutAllDevices = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== user.email) return;

    setIsDeleting(true);
    try {
      // Note: This would need a proper API endpoint to delete the account
      // await authClient.deleteAccount();
      console.log("Account deletion requested for:", user.id);
      router.push("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Connected Accounts"
        description="Manage your connected social accounts"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <GoogleIcon className="size-6" />
              <div>
                <p className="font-medium">Google</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Connected
            </Button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Password"
        description="Change your password or set one if you signed up with a social account"
      >
        <SettingsRow
          label="Password"
          description="Set or update your account password"
        >
          <Button variant="outline" className="gap-2">
            <KeyRound className="size-4" />
            Change Password
          </Button>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard
        title="Sessions"
        description="Manage your active sessions and sign out from other devices"
      >
        <SettingsRow
          label="Sign out everywhere"
          description="Sign out from all devices including this one"
        >
          <Button
            variant="outline"
            onClick={handleSignOutAllDevices}
            disabled={isSigningOut}
            className="gap-2"
          >
            {isSigningOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Sign out all devices
          </Button>
        </SettingsRow>
      </SettingsCard>

      <SettingsCard
        title="Danger Zone"
        description="Irreversible and destructive actions"
        className="border-destructive/50"
      >
        <SettingsRow
          label="Delete Account"
          description="Permanently delete your account and all associated data"
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="size-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">
                    This action cannot be undone. This will permanently delete
                    your account and remove all your data from our servers.
                  </span>
                  <span className="block">
                    Type{" "}
                    <span className="font-mono font-semibold">
                      {user.email}
                    </span>{" "}
                    to confirm.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Enter your email"
                className="mt-2"
              />
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setDeleteConfirmation("")}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== user.email || isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  variant="destructive"
                  size="sm"
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SettingsRow>
      </SettingsCard>
    </div>
  );
};
