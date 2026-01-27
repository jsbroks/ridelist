"use client";

import type React from "react";
import Link from "next/link";
import { Car, Loader2 } from "lucide-react";

import { Button } from "@app/ui/button";

interface FormSubmitProps {
  canSubmit: boolean;
  isSubmitting: boolean;
}

export const FormSubmit: React.FC<FormSubmitProps> = ({
  canSubmit,
  isSubmitting,
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
      <p className="text-muted-foreground text-sm">
        By posting, you agree to our{" "}
        <Link
          href="/terms"
          className="text-primary underline-offset-4 hover:underline"
        >
          Terms of Service
        </Link>
      </p>
      <Button
        type="submit"
        size="lg"
        disabled={!canSubmit || isSubmitting}
        className="gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Posting...
          </>
        ) : (
          <>
            <Car className="size-4" />
            Post Ride
          </>
        )}
      </Button>
    </div>
  );
};
