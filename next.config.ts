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
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|mp3|m4a|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/pelaminan/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/motive/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
