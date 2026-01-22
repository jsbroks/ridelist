import type { Metadata } from "next";

import { Navbar } from "~/app/_components/navbar";
import { fetchQuery, trpc } from "~/trpc/server";
import { SearchFilters } from "./_components/search-filters";
import { SearchMap } from "./_components/search-map";
import {
  SearchResults,
  SearchResultsHeader,
} from "./_components/search-results";

interface SearchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string; date?: string }>;
}

export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Format the slug for display
  const formattedSlug = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: formattedSlug,
    description: `Find rideshare options for ${formattedSlug}. Browse available rides and connect with drivers.`,
    openGraph: {
      title: `${formattedSlug} | RideList`,
      description: `Find rideshare options for ${formattedSlug}. Browse available rides and connect with drivers.`,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const {
    from: fromPlaceId,
    to: toPlaceId,
    date: dateParam,
  } = await searchParams;

  const [fromPlace, toPlace] = await Promise.all([
    fromPlaceId
      ? fetchQuery(
          trpc.places.getDetails.queryOptions({ placeId: fromPlaceId }),
        )
      : null,
    toPlaceId
      ? fetchQuery(trpc.places.getDetails.queryOptions({ placeId: toPlaceId }))
      : null,
  ]);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <SearchFilters
          fromPlaceId={fromPlaceId ?? null}
          toPlaceId={toPlaceId ?? null}
          dateParam={dateParam ?? null}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Ride listings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {fromPlace?.name} to {toPlace?.name}
              </h2>
              <SearchResultsHeader
                fromPlaceId={fromPlaceId ?? null}
                toPlaceId={toPlaceId ?? null}
              />
            </div>

            <SearchResults
              fromPlaceId={fromPlaceId ?? null}
              toPlaceId={toPlaceId ?? null}
            />
          </div>

          {/* Map sidebar */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="overflow-hidden rounded-lg border">
              <div className="bg-muted/50 border-b px-4 py-3">
                <h3 className="font-medium">Route Overview</h3>
              </div>
              <div className="h-[400px]">
                <SearchMap
                  fromPlaceId={fromPlaceId ?? null}
                  toPlaceId={toPlaceId ?? null}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
