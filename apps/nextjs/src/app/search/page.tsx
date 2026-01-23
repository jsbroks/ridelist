import type { Metadata } from "next";
import { Car, Search } from "lucide-react";

import { HydrateClient } from "~/trpc/server";
import { Navbar } from "../_components/navbar";
import { PopularRoutes } from "../_components/popular-routes";
import { RideSearchWithState } from "../_components/ride-search";

export const metadata: Metadata = {
  title: "Search Rides | RideList",
  description:
    "Search for rideshare options across Canada. Find drivers heading your way, compare routes, and connect directly.",
  openGraph: {
    title: "Search Rides | RideList",
    description:
      "Search for rideshare options across Canada. Find drivers heading your way and connect directly.",
  },
};

// Decorative floating car SVG
function FloatingCar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="10"
        y="25"
        width="80"
        height="25"
        rx="8"
        className="fill-primary/20"
      />
      <rect
        x="25"
        y="10"
        width="50"
        height="20"
        rx="6"
        className="fill-primary/30"
      />
      <circle cx="25" cy="50" r="8" className="fill-primary/40" />
      <circle cx="75" cy="50" r="8" className="fill-primary/40" />
      <circle cx="25" cy="50" r="4" className="fill-background" />
      <circle cx="75" cy="50" r="4" className="fill-background" />
      <rect
        x="30"
        y="15"
        width="15"
        height="10"
        rx="2"
        className="fill-primary/10"
      />
      <rect
        x="55"
        y="15"
        width="15"
        height="10"
        rx="2"
        className="fill-primary/10"
      />
    </svg>
  );
}

// Decorative road/path SVG
function RoadPath({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 50 Q100 20, 200 50 T400 50"
        stroke="currentColor"
        strokeWidth="4"
        strokeDasharray="12 8"
        className="text-primary/20"
      />
    </svg>
  );
}

export default function SearchPage() {
  return (
    <HydrateClient>
      <div className="flex min-h-screen flex-col overflow-x-hidden">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden"
          aria-label="Search for rides"
        >
          <Navbar />

          {/* Animated background gradients */}
          <div className="from-primary/5 via-background to-background absolute inset-0 bg-linear-to-br" />
          <div className="from-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] via-transparent to-transparent" />

          {/* Animated decorative elements */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Floating cars */}
            <FloatingCar className="animate-float absolute top-20 left-[5%] w-24 opacity-60" />
            <FloatingCar className="animate-float-delayed absolute top-40 right-[8%] w-20 opacity-40" />

            {/* Decorative circles */}
            <div className="bg-primary/10 animate-pulse-slow absolute top-16 right-[20%] size-32 rounded-full blur-3xl" />
            <div className="bg-primary/5 animate-pulse-slow animation-delay-500 absolute bottom-20 left-[10%] size-48 rounded-full blur-3xl" />

            {/* Sparkle dots */}
            <div className="bg-primary/40 animate-bounce-gentle absolute top-24 right-[30%] size-2 rounded-full" />
            <div className="bg-primary/30 animate-bounce-gentle animation-delay-300 absolute top-48 left-[25%] size-3 rounded-full" />
          </div>

          <div className="relative container py-16 lg:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <div className="bg-primary/10 text-primary animate-fade-in animation-delay-200 mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <Search className="size-4" />
                Find Your Perfect Ride
              </div>

              <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Search Rides
                <span className="text-primary relative ml-2">
                  Across Canada
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 200 8"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 6 Q50 2, 100 6 T198 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="text-primary/40"
                    />
                  </svg>
                </span>
              </h1>

              <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-base sm:text-lg">
                Enter your departure and destination to find drivers heading
                your way. Connect directly and arrange your trip.
              </p>
            </div>

            <div>
              <RideSearchWithState />
            </div>

            {/* Road decoration under search */}
            <RoadPath className="mx-auto mt-6 hidden w-80 opacity-50 lg:block" />
          </div>
        </section>

        {/* Popular Routes */}
        <PopularRoutes />

        {/* Footer */}
        <footer className="bg-muted/30 mt-30 border-t py-8" role="contentinfo">
          <div className="container">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="group flex items-center gap-2">
                <Car
                  className="text-primary size-5 transition-transform group-hover:rotate-12"
                  aria-hidden="true"
                />
                <span className="font-bold">RideList</span>
              </div>
              <p className="text-muted-foreground text-sm">
                © 2026 RideList. Connecting Canadians, one ride at a time.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </HydrateClient>
  );
}
