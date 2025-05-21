"use client";
import { createAuthClient } from "better-auth/react";
import { apiKeyClient } from "better-auth/client/plugins";

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.log("Warning: NEXT_PUBLIC_API_URL environment variable is not set");
} else {
  console.log("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL);
}

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.sector-iot.space";

export const authClient = createAuthClient({
  baseURL: baseUrl, // the base url of your auth server
  plugins: [apiKeyClient()],
});
