import type { Metadata } from "next";
import {
  Car,
  Leaf,
  MapPin,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@app/ui/button";

import { HydrateClient } from "~/trpc/server";
import { Navbar } from "./_components/navbar";
import { PopularRoutes } from "./_components/popular-routes";
import { RideSearchWithState } from "./_components/ride-search";

export const metadata: Metadata = {
  title: "Find & Share Rides Across Canada | RideList",
  description:
    "Browse thousands of rides across Canada. Connect directly with drivers heading your way. Save money, reduce emissions, and travel together with RideList - Canada's rideshare marketplace.",
  openGraph: {
    title: "Find & Share Rides Across Canada | RideList",
    description:
      "Browse thousands of rides across Canada. Connect directly with drivers heading your way. Save money and travel together.",
  },
};

// JSON-LD structured data for the homepage
const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RideList",
  url: "https://ridelist.ca",
  description:
    "Canada's rideshare marketplace. Find and share rides, connect with drivers and passengers directly.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://ridelist.ca/rides?from={from}&to={to}",
    },
    "query-input": "required name=from required name=to",
  },
};

const stats = [
  { label: "Active Members", value: "50K+", icon: Users },
  { label: "Rides Posted", value: "250K+", icon: Car },
  { label: "Cities Connected", value: "500+", icon: MapPin },
  { label: "CO₂ Saved (tons)", value: "1,200+", icon: Leaf },
];

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

// Decorative person SVG
function Person({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 80"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="20" cy="12" r="10" className="fill-primary/30" />
      <ellipse cx="20" cy="50" rx="15" ry="25" className="fill-primary/20" />
      <rect
        x="5"
        y="70"
        width="12"
        height="8"
        rx="2"
        className="fill-primary/25"
      />
      <rect
        x="23"
        y="70"
        width="12"
        height="8"
        rx="2"
        className="fill-primary/25"
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

export default function HomePage() {
  return (
    <HydrateClient>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <div className="flex min-h-screen flex-col overflow-x-hidden">
        {/* Hero Section */}
        <section
          className="relative overflow-hidden border-b"
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
            <FloatingCar className="animate-float-slow absolute bottom-32 left-[15%] w-16 opacity-30" />

            {/* Floating people */}
            <Person className="animate-float-delayed absolute right-[12%] bottom-40 w-10 opacity-50" />
            <Person className="animate-float absolute top-32 left-[20%] w-8 opacity-30" />

            {/* Decorative circles */}
            <div className="bg-primary/10 animate-pulse-slow absolute top-16 right-[20%] size-32 rounded-full blur-3xl" />
            <div className="bg-primary/5 animate-pulse-slow animation-delay-500 absolute bottom-20 left-[10%] size-48 rounded-full blur-3xl" />

            {/* Sparkle dots */}
            <div className="bg-primary/40 animate-bounce-gentle absolute top-24 right-[30%] size-2 rounded-full" />
            <div className="bg-primary/30 animate-bounce-gentle animation-delay-300 absolute top-48 left-[25%] size-3 rounded-full" />
            <div className="bg-primary/20 animate-bounce-gentle animation-delay-500 absolute right-[25%] bottom-36 size-2 rounded-full" />
          </div>

          <div className="relative container py-20 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <div className="bg-primary/10 text-primary animate-fade-in animation-delay-200 mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <Sparkles className="size-4" />
                Canada&apos;s Rideshare Marketplace
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Find Your Next Ride,
                <br />
                <span className="text-primary relative">
                  Connect Directly
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 8 Q75 2, 150 8 T298 8"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="text-primary/40"
                    />
                  </svg>
                </span>
              </h1>

              <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-lg sm:text-xl">
                The marketplace for ridesharing across Canada. Browse posted
                rides, connect with drivers, and arrange your trip directly.
              </p>
            </div>

            <div>
              <RideSearchWithState />
            </div>

            {/* Road decoration under search */}
            <RoadPath className="mx-auto mt-8 hidden w-96 opacity-50 lg:block" />
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b py-12" aria-label="Platform statistics">
          <div className="container">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="group text-center transition-transform hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="bg-primary/10 group-hover:bg-primary/20 mx-auto mb-3 flex size-12 items-center justify-center rounded-full transition-all group-hover:scale-110">
                    <stat.icon className="text-primary size-6 transition-transform group-hover:scale-110" />
                  </div>
                  <p className="text-3xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Routes */}
        <PopularRoutes />

        {/* CTA Section */}
        <section
          className="bg-primary/5 relative overflow-hidden py-20"
          aria-label="Post a ride"
        >
          {/* Animated background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="bg-primary/10 animate-pulse-slow absolute top-1/2 left-1/4 size-64 -translate-y-1/2 rounded-full blur-3xl" />
            <div className="bg-primary/5 animate-pulse-slow animation-delay-500 absolute top-1/2 right-1/4 size-48 -translate-y-1/2 rounded-full blur-3xl" />
            <FloatingCar className="animate-float absolute bottom-8 left-8 w-16 opacity-20" />
            <FloatingCar className="animate-float-delayed absolute top-8 right-8 w-20 opacity-20" />
          </div>

          <div className="relative container text-center">
            <div className="mb-4 text-5xl">🚗</div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Have Empty Seats?
            </h2>
            <p className="text-muted-foreground mx-auto mb-8 max-w-2xl">
              Post your ride and connect with passengers heading your way. Share
              the cost, share the journey.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="group shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                <Car className="size-4 transition-transform group-hover:rotate-12" />
                Post a Ride
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="group transition-all hover:scale-105"
              >
                <MapPin className="size-4" />
                Browse All Rides
              </Button>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section
          className="border-t py-12"
          aria-label="Trust and safety features"
        >
          <div className="container">
            <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
              {[
                { icon: Shield, text: "Verified Profiles" },
                { icon: Star, text: "User Reviews" },
                { icon: MessageCircle, text: "Direct Messaging" },
                { icon: Users, text: "Active Community" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="group flex items-center gap-2 transition-transform hover:scale-105"
                >
                  <item.icon className="text-primary size-5 transition-transform group-hover:scale-110" />
                  <span className="text-muted-foreground text-sm">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-muted/30 border-t py-12" role="contentinfo">
          <div className="container">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="group flex items-center gap-2">
                <Car
                  className="text-primary size-6 transition-transform group-hover:rotate-12"
                  aria-hidden="true"
                />
                <span className="text-xl font-bold">RideList</span>
              </div>
              <p className="text-muted-foreground text-sm">
                © 2026 RideList. Connecting Canadians, one ride at a time.
              </p>
              <nav
                className="text-muted-foreground flex gap-6 text-sm"
                aria-label="Footer navigation"
              >
                <a
                  href="/about"
                  className="hover:text-primary transition-colors hover:underline"
                >
                  About
                </a>
                <a
                  href="/safety"
                  className="hover:text-primary transition-colors hover:underline"
                >
                  Safety
                </a>
                <a
                  href="/help"
                  className="hover:text-primary transition-colors hover:underline"
                >
                  Help
                </a>
                <a
                  href="/terms"
                  className="hover:text-primary transition-colors hover:underline"
                >
                  Terms
                </a>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </HydrateClient>
  );
}
