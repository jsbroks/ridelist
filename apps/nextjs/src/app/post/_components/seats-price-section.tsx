"use client";

import type React from "react";
import { Car, DollarSign, Users } from "lucide-react";

import { Input } from "@app/ui/input";
import { Label } from "@app/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@app/ui/select";

interface SeatsPriceSectionProps {
  seats: string;
  price: string;
  onSeatsChange: (seats: string) => void;
  onPriceChange: (price: string) => void;
}

export const SeatsPriceSection: React.FC<SeatsPriceSectionProps> = ({
  seats,
  price,
  onSeatsChange,
  onPriceChange,
}) => {
  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        <Car className="text-primary size-5" />
        <h2 className="font-semibold">Seats & Price</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="seats">Available Seats</Label>
          <div className="relative">
            <Users className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Select value={seats} onValueChange={onSeatsChange}>
              <SelectTrigger id="seats" className="h-10 pl-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? "seat" : "seats"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price per Seat (CAD)</Label>
          <div className="relative">
            <DollarSign className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="price"
              type="number"
              min="0"
              step="5"
              placeholder="0"
              value={price}
              onChange={(e) => onPriceChange(e.target.value)}
              className="h-10 pl-10"
            />
          </div>
        </div>
      </div>

      {price && (
        <p className="text-muted-foreground mt-4 text-sm">
          Total for {seats} {parseInt(seats) === 1 ? "seat" : "seats"}:{" "}
          <span className="text-primary font-semibold">
            ${(parseFloat(price) * parseInt(seats)).toFixed(2)} CAD
          </span>
        </p>
      )}
    </section>
  );
};
