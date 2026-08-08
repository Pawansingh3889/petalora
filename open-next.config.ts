import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext turns the Next build into a Cloudflare Worker.
 *
 * No incremental cache is configured. Every dynamic route in this app is
 * either a payment endpoint or an order page that must read live state, and
 * all of them already declare `force-dynamic`. The static pages are served
 * from Workers Assets, which is its own CDN cache. Adding an R2 or KV cache
 * here would buy nothing and add a failure mode.
 */
export default defineCloudflareConfig();
