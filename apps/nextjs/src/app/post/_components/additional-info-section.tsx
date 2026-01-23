"use client";

import type React from "react";
import { Info } from "lucide-react";

import { Label } from "@app/ui/label";
import { Textarea } from "@app/ui/textarea";

interface AdditionalInfoSectionProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  notes,
  onNotesChange,
}) => {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <Info className="text-primary size-5" />
        <h2 className="font-semibold">Additional Information</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="E.g., Pickup location details, stops along the way, music preferences..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-muted-foreground text-xs">
          Include any relevant details to help passengers decide.
        </p>
      </div>
    </section>
  );
};
