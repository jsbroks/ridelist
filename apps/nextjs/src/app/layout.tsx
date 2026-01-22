import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { cn } from "@app/ui";
import { ThemeProvider, ThemeToggle } from "@app/ui/theme";
import { Toaster } from "@app/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

const siteUrl =
  env.VERCEL_ENV === "production"
    ? "https://ridelist.ca"
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RideList - Canada's Rideshare Marketplace",
    template: "%s | RideList",
  },
  description:
    "Find and share rides across Canada. Connect directly with drivers and passengers, save money, and reduce your carbon footprint with RideList.",
  keywords: [
    "rideshare",
    "carpool",
    "ride sharing",
    "Canada",
    "Toronto",
    "Montreal",
    "Vancouver",
    "Calgary",
    "Edmonton",
    "Ottawa",
    "travel",
    "transportation",
    "eco-friendly",
    "cost sharing",
  ],
  authors: [{ name: "RideList" }],
  creator: "RideList",
  publisher: "RideList",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: siteUrl,
    siteName: "RideList",
    title: "RideList - Canada's Rideshare Marketplace",
    description:
      "Find and share rides across Canada. Connect directly with drivers and passengers, save money, and reduce your carbon footprint.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RideList - Canada's Rideshare Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RideList - Canada's Rideshare Marketplace",
    description:
      "Find and share rides across Canada. Connect directly with drivers and passengers.",
    images: ["/og-image.png"],
    creator: "@ridelist",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "Transportation",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// JSON-LD structured data for the organization
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "RideList",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description:
    "Canada's rideshare marketplace connecting drivers and passengers for affordable, eco-friendly travel.",
  foundingDate: "2026",
  areaServed: {
    "@type": "Country",
    name: "Canada",
  },
  sameAs: [],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <div className="fixed right-4 bottom-4">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
