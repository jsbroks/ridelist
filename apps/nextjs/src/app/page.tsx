import {
  Car,
  DollarSign,
  Leaf,
  MapPin,
  Shield,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@app/ui/button";

import { HydrateClient } from "~/trpc/server";

import { RideSearch } from "./_components/ride-search";

const stats = [
  { label: "Active Riders", value: "50K+", icon: Users },
  { label: "Rides Completed", value: "250K+", icon: Car },
  { label: "Cities Connected", value: "500+", icon: MapPin },
  { label: "CO₂ Saved (tons)", value: "1,200+", icon: Leaf },
];

const howItWorks = [
  {
    step: "1",
    title: "Search",
    description:
      "Enter your departure and destination cities, along with your preferred travel date.",
  },
  {
    step: "2",
    title: "Choose",
    description:
      "Browse available rides, compare prices, and check driver ratings to find your perfect match.",
  },
  {
    step: "3",
    title: "Book",
    description:
      "Reserve your seat instantly. Payment is secure and held until your trip is complete.",
  },
  {
    step: "4",
    title: "Ride",
    description:
      "Meet your driver at the pickup point and enjoy the journey. Rate your experience after.",
  },
];

const features = [
  {
    icon: DollarSign,
    title: "Save Money",
    description:
      "Split travel costs with fellow passengers. Save up to 75% compared to driving alone or taking the bus.",
  },
  {
    icon: Shield,
    title: "Travel Safely",
    description:
      "Verified profiles, ratings, and reviews help you choose trusted drivers and passengers.",
  },
  {
    icon: Leaf,
    title: "Go Green",
    description:
      "Reduce your carbon footprint by sharing rides. Every shared trip means fewer cars on the road.",
  },
  {
    icon: Users,
    title: "Meet People",
    description:
      "Connect with fellow travelers, make new friends, and turn long drives into enjoyable experiences.",
  },
];

const popularRoutes = [
  { from: "Toronto", to: "Montreal", price: "$45", time: "5h" },
  { from: "Vancouver", to: "Calgary", price: "$85", time: "10h" },
  { from: "Ottawa", to: "Toronto", price: "$35", time: "4h" },
  { from: "Edmonton", to: "Calgary", price: "$25", time: "3h" },
  { from: "Halifax", to: "Moncton", price: "$30", time: "2.5h" },
  { from: "Winnipeg", to: "Regina", price: "$55", time: "5.5h" },
];

export default function HomePage() {
  return (
    <HydrateClient>
      <div className="flex min-h-screen flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b">
          <div className="from-primary/5 via-background to-background absolute inset-0 bg-gradient-to-br" />
          <div className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent absolute inset-0" />

          <div className="container relative py-20 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
                <Car className="size-4" />
                Canada's Rideshare Community
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Share the Journey,
                <br />
                <span className="text-primary">Split the Cost</span>
              </h1>

              <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-lg sm:text-xl">
                Connect with drivers heading your way. Save money, reduce
                emissions, and make new friends on the road across Canada.
              </p>
            </div>

            <RideSearch />
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b py-12">
          <div className="container">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="bg-primary/10 mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
                    <stat.icon className="text-primary size-6" />
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

        {/* How It Works */}
        <section className="py-20">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                How It Works
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                Getting started is easy. Find a ride in minutes and start saving
                on your next trip.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-4">
              {howItWorks.map((item, index) => (
                <div key={item.step} className="relative text-center">
                  {index < howItWorks.length - 1 && (
                    <div className="bg-border absolute top-6 left-1/2 hidden h-0.5 w-full md:block" />
                  )}
                  <div className="bg-primary text-primary-foreground relative z-10 mx-auto mb-4 flex size-12 items-center justify-center rounded-full text-lg font-bold">
                    {item.step}
                  </div>
                  <h3 className="mb-2 font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted/30 border-y py-20">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                Why Choose RideList?
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                Join thousands of Canadians who are already saving money and
                traveling smarter.
              </p>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-card flex gap-4 rounded-xl border p-6 shadow-sm"
                >
                  <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <feature.icon className="text-primary size-6" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Routes */}
        <section className="py-20">
          <div className="container">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                Popular Routes
              </h2>
              <p className="text-muted-foreground mx-auto max-w-2xl">
                Discover the most traveled routes across Canada. New rides are
                posted every day.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularRoutes.map((route) => (
                <button
                  key={`${route.from}-${route.to}`}
                  className="bg-card hover:border-primary/50 group flex items-center justify-between rounded-lg border p-4 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 group-hover:bg-primary/20 flex size-10 items-center justify-center rounded-full transition-colors">
                      <Car className="text-primary size-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {route.from} → {route.to}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        ~{route.time} drive
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-semibold">{route.price}</p>
                    <p className="text-muted-foreground text-xs">from</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              Ready to Start Sharing Rides?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl opacity-90">
              Whether you're a driver with empty seats or a passenger looking
              for a ride, RideList connects you with the right people.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary">
                <Car className="size-4" />
                Offer a Ride
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 bg-transparent hover:bg-primary-foreground/10"
              >
                Find a Ride
              </Button>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="border-t py-12">
          <div className="container">
            <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
              <div className="flex items-center gap-2">
                <Shield className="text-primary size-5" />
                <span className="text-muted-foreground text-sm">
                  Verified Profiles
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="text-primary size-5" />
                <span className="text-muted-foreground text-sm">
                  4.8 Average Rating
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="text-primary size-5" />
                <span className="text-muted-foreground text-sm">
                  Secure Payments
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-primary size-5" />
                <span className="text-muted-foreground text-sm">
                  24/7 Support
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-muted/30 border-t py-12">
          <div className="container">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2">
                <Car className="text-primary size-6" />
                <span className="text-xl font-bold">RideList</span>
              </div>
              <p className="text-muted-foreground text-sm">
                © 2026 RideList. Connecting Canadians, one ride at a time.
              </p>
              <div className="text-muted-foreground flex gap-6 text-sm">
                <a href="#" className="hover:text-foreground transition-colors">
                  About
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Safety
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Help
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </HydrateClient>
  );
}
