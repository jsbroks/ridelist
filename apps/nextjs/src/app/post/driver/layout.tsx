import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Ride",
  description:
    "Share your ride and connect with passengers heading your way. Post your trip details, set your price, and help others travel across Canada.",
  openGraph: {
    title: "Post a Ride | RideList",
    description:
      "Share your ride and connect with passengers heading your way. Post your trip details and help others travel across Canada.",
  },
};

export default function PostRideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
