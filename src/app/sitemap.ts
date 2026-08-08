import type { MetadataRoute } from "next";
import { products } from "@/lib/products";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: "", priority: 1 },
    { path: "/shop", priority: 0.9 },
    { path: "/about", priority: 0.6 },
    { path: "/faq", priority: 0.6 },
    { path: "/shipping", priority: 0.5 },
    { path: "/returns", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
    { path: "/terms", priority: 0.3 },
    { path: "/privacy", priority: 0.3 },
  ];

  return [
    ...staticPages.map((page) => ({
      url: `${BASE}${page.path}`,
      changeFrequency: "weekly" as const,
      priority: page.priority,
    })),
    ...products.map((product) => ({
      url: `${BASE}/product/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
