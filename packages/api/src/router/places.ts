import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { publicProcedure } from "../trpc";

const GOOGLE_PLACES_AUTOCOMPLETE_URL =
  "https://places.googleapis.com/v1/places:autocomplete";

interface PlacePrediction {
  placeId: string;
  text: {
    text: string;
    matches?: { startOffset: number; endOffset: number }[];
  };
  structuredFormat: {
    mainText: {
      text: string;
      matches?: { startOffset: number; endOffset: number }[];
    };
    secondaryText?: {
      text: string;
      matches?: { startOffset: number; endOffset: number }[];
    };
  };
  types?: string[];
}

interface GoogleAutocompleteResponse {
  suggestions?: {
    placePrediction?: PlacePrediction;
  }[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

export const placesRouter = {
  autocomplete: publicProcedure
    .input(
      z.object({
        input: z.string().min(1),
        sessionToken: z.string().optional(),
        includePrimaryTypes: z.array(z.string()).optional(),
      }),
    )
    .query(async ({ input }) => {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Google Maps API key is not configured",
        });
      }

      const requestBody: Record<string, unknown> = {
        input: input.input,
        includedRegionCodes: ["CA"],
      };

      if (input.sessionToken) {
        requestBody.sessionToken = input.sessionToken;
      }

      if (input.includePrimaryTypes) {
        requestBody.includedPrimaryTypes = input.includePrimaryTypes;
      }

      const response = await fetch(GOOGLE_PLACES_AUTOCOMPLETE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as GoogleAutocompleteResponse;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            errorData.error?.message ??
            "Failed to fetch autocomplete suggestions",
        });
      }

      const data = (await response.json()) as GoogleAutocompleteResponse;

      const predictions = (data.suggestions ?? [])
        .map((s) => s.placePrediction)
        .filter((p): p is PlacePrediction => p !== undefined);

      return {
        predictions: predictions.map((prediction) => ({
          placeId: prediction.placeId,
          description: prediction.text.text,
          mainText: prediction.structuredFormat.mainText.text,
          secondaryText:
            prediction.structuredFormat.secondaryText?.text ?? null,
          types: prediction.types ?? [],
        })),
      };
    }),
} satisfies TRPCRouterRecord;
