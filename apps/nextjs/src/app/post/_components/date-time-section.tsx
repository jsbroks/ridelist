"use client";

import type React from "react";
import { format, startOfDay } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";

import { Button } from "@app/ui/button";
import { Calendar } from "@app/ui/calendar";
import { Checkbox } from "@app/ui/checkbox";
import { Input } from "@app/ui/input";
import { Label } from "@app/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@app/ui/popover";

interface DatePickerProps {
  id: string;
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  id,
  label,
  value,
  onChange,
  open,
  onOpenChange,
  minDate,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="h-10 w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="text-muted-foreground size-4" />
            {value ? (
              format(value, "PPP")
            ) : (
              <span className="text-muted-foreground">Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(newDate) => {
              onChange(newDate);
              onOpenChange(false);
            }}
            disabled={(d) => d < startOfDay(minDate ?? new Date())}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

interface TimePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (time: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  id,
  label,
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Clock className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          id={id}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 pl-10"
        />
      </div>
    </div>
  );
};

interface DateTimeSectionProps {
  date: Date | undefined;
  departureTime: string;
  isRoundTrip: boolean;
  returnDate: Date | undefined;
  returnTime: string;
  calendarOpen: boolean;
  returnCalendarOpen: boolean;
  onDateChange: (date: Date | undefined) => void;
  onDepartureTimeChange: (time: string) => void;
  onRoundTripChange: (isRoundTrip: boolean) => void;
  onReturnDateChange: (date: Date | undefined) => void;
  onReturnTimeChange: (time: string) => void;
  onCalendarOpenChange: (open: boolean) => void;
  onReturnCalendarOpenChange: (open: boolean) => void;
}

export const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  date,
  departureTime,
  isRoundTrip,
  returnDate,
  returnTime,
  calendarOpen,
  returnCalendarOpen,
  onDateChange,
  onDepartureTimeChange,
  onRoundTripChange,
  onReturnDateChange,
  onReturnTimeChange,
  onCalendarOpenChange,
  onReturnCalendarOpenChange,
}) => {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <CalendarIcon className="text-primary size-5" />
        <h2 className="font-semibold">Date & Time</h2>
      </div>

      <div className="space-y-6">
        {/* Departure */}
        <div>
          <p className="text-muted-foreground mb-3 text-sm">Departure</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <DatePicker
              id="date"
              label="Date"
              value={date}
              onChange={onDateChange}
              open={calendarOpen}
              onOpenChange={onCalendarOpenChange}
            />
            <TimePicker
              id="time"
              label="Time"
              value={departureTime}
              onChange={onDepartureTimeChange}
            />
          </div>
        </div>

        {/* Round Trip Toggle */}
        <div className="flex items-center gap-3">
          <Checkbox
            id="round-trip"
            checked={isRoundTrip}
            onCheckedChange={(checked) => {
              onRoundTripChange(checked === true);
              if (!checked) {
                onReturnDateChange(undefined);
                onReturnTimeChange("");
              }
            }}
          />
          <Label htmlFor="round-trip" className="cursor-pointer font-normal">
            This is a round trip (optional)
          </Label>
        </div>

        {/* Return - only shown if round trip */}
        {isRoundTrip && (
          <div>
            <p className="text-muted-foreground mb-3 text-sm">Return</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <DatePicker
                id="return-date"
                label="Date"
                value={returnDate}
                onChange={onReturnDateChange}
                open={returnCalendarOpen}
                onOpenChange={onReturnCalendarOpenChange}
                minDate={date}
              />
              <TimePicker
                id="return-time"
                label="Time"
                value={returnTime}
                onChange={onReturnTimeChange}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
