import type { Metadata } from "next";
import { Car, Users } from "lucide-react";

import { HydrateClient } from "~/trpc/server";
import { Navbar } from "../_components/navbar";
import { RideSearchWithState } from "../_components/ride-search";
import { RideWantedList } from "./_components/ride-wanted-list";

export const metadata: Metadata = {
  title: "Find Passengers | RideList",
  description:
    "Browse ride requests from passengers looking for a ride. Connect with travelers heading your way and offer them a seat.",
  openGraph: {
    title: "Find Passengers | RideList",
    description:
      "Browse ride requests from passengers looking for a ride. Connect with travelers heading your way.",
  },
};

export default function PassengersPage() {
  return (
    <HydrateClient>
      <div className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden"
          aria-label="Find passengers"
        >
          <Navbar />

          {/* Background gradients */}
          <div className="from-primary/5 via-background to-background absolute inset-0 bg-linear-to-br" />
          <div className="from-primary/10 absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] via-transparent to-transparent" />

          {/* Decorative elements */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="bg-primary/10 animate-pulse-slow absolute top-16 right-[20%] size-32 rounded-full blur-3xl" />
            <div className="bg-primary/5 animate-pulse-slow animation-delay-500 absolute bottom-20 left-[10%] size-48 rounded-full blur-3xl" />
          </div>

          <div className="relative container py-16 lg:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <div className="bg-primary/10 text-primary animate-fade-in animation-delay-200 mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <Users className="size-4" />
                For Drivers
              </div>

              <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Find Passengers
                <span className="text-primary relative ml-2">
                  Looking for Rides
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
                Enter your route to find passengers who need a ride along your
                way, or browse all active ride requests below.
              </p>
            </div>

            <div className="mx-auto max-w-4xl">
              <RideSearchWithState mode="passengers" />
            </div>
          </div>
        </section>

        {/* Ride Requests Section */}
        <section className="container py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              Recent Ride Requests
            </h2>
            <p className="text-muted-foreground mt-1">
              Passengers looking for a ride
            </p>
          </div>
          <RideWantedList />
        </section>

        {/* Footer */}
        <footer className="bg-muted/30 mt-auto border-t py-8" role="contentinfo">
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
