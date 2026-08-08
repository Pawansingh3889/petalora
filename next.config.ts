import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Prisma is NOT listed in serverExternalPackages. With driver adapters the
  // client is plain JavaScript talking to a D1 binding, with no native query
  // engine to keep outside the bundle, and a Worker cannot require from
  // node_modules at runtime anyway. It has to be bundled.

  images: {
    // Cloudflare Workers has no sharp binary, so Next's optimiser cannot run.
    // The product photography is already sized and compressed, and Cloudflare
    // serves it from the edge, so this only costs the AVIF/WebP conversion.
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stops the site being framed into a phishing page that overlays a
          // fake checkout on top of the real one.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

// Gives `next dev` the same Cloudflare bindings the deployed Worker gets,
// backed by a local Miniflare D1. Without this, getCloudflareContext() has
// nothing to return in development and every database call fails.
void initOpenNextCloudflareForDev();

export default nextConfig;
