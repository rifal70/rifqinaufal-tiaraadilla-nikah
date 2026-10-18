import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components disabled on purpose: every page here is private and per-session
  // (cookie-gated), so there is nothing to prerender or share between users.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb", // admin uploads; Netlify functions cap bodies at ~6MB
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
