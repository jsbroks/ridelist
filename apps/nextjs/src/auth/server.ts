import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { nextCookies } from "better-auth/next-js";

import { initAuth } from "@app/auth";

import { env } from "~/env";

const baseUrl = env.BASE_URL;

export const auth = initAuth({
  baseUrl,
  secret: env.AUTH_SECRET,
  googleClientId: env.AUTH_GOOGLE_CLIENT_ID,
  googleClientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
  extraPlugins: [nextCookies()],
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
