import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Explicitly expose GEMINI_API_KEY to the server-side
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
  // Ensure environment variables are available in API routes
  serverRuntimeConfig: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
};

export default nextConfig;
