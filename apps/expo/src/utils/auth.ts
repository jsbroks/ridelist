import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";
import { phoneNumberClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getBaseUrl } from "./base-url";

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    usernameClient(),
    phoneNumberClient(),
    expoClient({
      scheme: "expo",
      storagePrefix: "expo",
      storage: SecureStore,
    }),
  ],
});
