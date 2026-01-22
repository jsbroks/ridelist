import type { MetadataRoute } from "next";

import { env } from "~/env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    env.VERCEL_ENV === "production"
      ? "https://ridelist.ca"
      : "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/signup"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
