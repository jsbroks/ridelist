"use client";

import type React from "react";
import type { LucideIcon } from "lucide-react";
import { Bike, Luggage, PawPrint, Snowflake } from "lucide-react";

import { Checkbox } from "@app/ui/checkbox";
import { Label } from "@app/ui/label";

interface LuggageOptionProps {
  value: string;
  label: string;
  description: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
}

export const LuggageOption: React.FC<LuggageOptionProps> = ({
  value,
  label,
  description,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`rounded-lg border p-3 text-left transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "hover:border-primary/50"
      }`}
    >
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground text-xs">{description}</p>
    </button>
  );
};

interface PreferenceCheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  Icon: LucideIcon;
}

export const PreferenceCheckbox: React.FC<PreferenceCheckboxProps> = ({
  id,
  label,
  checked,
  onCheckedChange,
  Icon,
}) => {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
        checked ? "border-primary bg-primary/5" : "hover:border-primary/50"
      }`}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(c === true)}
      />
      <Icon className="text-muted-foreground size-4" />
      <span>{label}</span>
    </label>
  );
};

const LUGGAGE_OPTIONS = [
  { value: "small", label: "Small", description: "Backpack only" },
  { value: "medium", label: "Medium", description: "1 carry-on" },
  { value: "large", label: "Large", description: "Large suitcase" },
] as const;

interface TripPreferences {
  luggageSize: string;
  hasWinterTires: boolean;
  allowsBikes: boolean;
  allowsSkis: boolean;
  allowsPets: boolean;
}

interface TripPreferencesSectionProps {
  preferences: TripPreferences;
  onLuggageSizeChange: (size: string) => void;
  onWinterTiresChange: (value: boolean) => void;
  onBikesChange: (value: boolean) => void;
  onSkisChange: (value: boolean) => void;
  onPetsChange: (value: boolean) => void;
}

export const TripPreferencesSection: React.FC<TripPreferencesSectionProps> = ({
  preferences,
  onLuggageSizeChange,
  onWinterTiresChange,
  onBikesChange,
  onSkisChange,
  onPetsChange,
}) => {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <Luggage className="text-primary size-5" />
        <h2 className="font-semibold">Trip Preferences</h2>
      </div>

      <div className="space-y-6">
        {/* Luggage Space */}
        <div className="space-y-3">
          <Label>Luggage Space</Label>
          <p className="text-muted-foreground text-sm">
            Let passengers know how much space you have for their luggage.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {LUGGAGE_OPTIONS.map((option) => (
              <LuggageOption
                key={option.value}
                value={option.value}
                label={option.label}
                description={option.description}
                isSelected={preferences.luggageSize === option.value}
                onSelect={onLuggageSizeChange}
              />
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-3">
          <Label>Additional Options</Label>
          <p className="text-muted-foreground text-sm">
            What else can passengers bring or expect?
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <PreferenceCheckbox
              id="winter-tires"
              label="Winter tires"
              checked={preferences.hasWinterTires}
              onCheckedChange={onWinterTiresChange}
              Icon={Snowflake}
            />
            <PreferenceCheckbox
              id="bikes"
              label="Bikes"
              checked={preferences.allowsBikes}
              onCheckedChange={onBikesChange}
              Icon={Bike}
            />
            <PreferenceCheckbox
              id="skis"
              label="Skis & snowboards"
              checked={preferences.allowsSkis}
              onCheckedChange={onSkisChange}
              Icon={Snowflake}
            />
            <PreferenceCheckbox
              id="pets"
              label="Pets"
              checked={preferences.allowsPets}
              onCheckedChange={onPetsChange}
              Icon={PawPrint}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
