import type { Metadata } from "next";

import { Navbar } from "~/app/_components/navbar";
import { env } from "~/env";
import { fetchQuery, trpc } from "~/trpc/server";
import { SearchProvider } from "./_components/search-context";
import { SearchFilters } from "./_components/search-filters";
import { SearchMap } from "./_components/search-map";
import {
  SearchResults,
  SearchResultsHeader,
} from "./_components/search-results";

interface SearchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string; date?: string; type?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { type } = await searchParams;
  const isPassengerSearch = type === "wanted";

  // Format the slug for display
  const formattedSlug = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (isPassengerSearch) {
    return {
      title: `Find Passengers: ${formattedSlug}`,
      description: `Find passengers looking for rides along ${formattedSlug}. Connect with travelers and fill your empty seats.`,
      openGraph: {
        title: `Find Passengers: ${formattedSlug} | RideList`,
        description: `Find passengers looking for rides along ${formattedSlug}. Connect with travelers and fill your empty seats.`,
      },
    };
  }

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
    type: searchType,
  } = await searchParams;
  const isPassengerSearch = searchType === "wanted";

  const [fromPlace, toPlace] = await Promise.all([
    fromPlaceId
      ? fetchQuery(
          trpc.places.getDetails.queryOptions({ placeId: fromPlaceId }),
        ).catch(() => null)
      : null,
    toPlaceId
      ? fetchQuery(
          trpc.places.getDetails.queryOptions({ placeId: toPlaceId }),
        ).catch(() => null)
      : null,
  ]);

  const googleMapsApiKey = env.GOOGLE_MAPS_API_KEY;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <SearchFilters
          fromPlaceId={fromPlaceId ?? null}
          toPlaceId={toPlaceId ?? null}
          dateParam={dateParam ?? null}
          searchType={isPassengerSearch ? "wanted" : "rides"}
        />

        <SearchProvider>
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
                  date={dateParam}
                  searchType={isPassengerSearch ? "wanted" : "rides"}
                />
              </div>

              <SearchResults
                fromPlaceId={fromPlaceId ?? null}
                toPlaceId={toPlaceId ?? null}
                date={dateParam}
                searchType={isPassengerSearch ? "wanted" : "rides"}
              />
            </div>

            {/* Map sidebar */}
            <div className="lg:sticky lg:top-4 lg:self-start">
              <div className="overflow-hidden rounded-lg border">
                <div className="h-[400px]">
                  <SearchMap
                    googleMapsApiKey={googleMapsApiKey}
                    fromPlaceId={fromPlaceId ?? null}
                    toPlaceId={toPlaceId ?? null}
                  />
                </div>
              </div>
            </div>
          </div>
        </SearchProvider>
      </main>
    </div>
  );
}
