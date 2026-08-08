import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing here is secret, but there is no reason for a crawler to index
      // a customer's order page, the admin login, or a half-finished cart.
      disallow: ["/admin", "/api/", "/order/", "/cart", "/checkout"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
