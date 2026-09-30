import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The rule engine reads the government data files at runtime; ship them with every route.
  outputFileTracingIncludes: {
    "/api/**": ["./data/**/*.json"],
  },
  // The service worker must always be re-checked, or a phone could keep an old one for a day.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
