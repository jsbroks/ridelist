import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to RideList to find rides, post trips, and connect with drivers and passengers across Canada.",
  openGraph: {
    title: "Sign In | RideList",
    description:
      "Sign in to RideList to find rides, post trips, and connect with drivers and passengers across Canada.",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
