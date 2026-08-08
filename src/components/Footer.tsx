import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Razorpay's activation review checks that a working site publishes contact
 * details and the four policy pages. Keeping them in the footer of every page
 * is the simplest way to satisfy that and it is what customers expect anyway.
 */
const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All roses" },
      { href: "/shop?filter=bestsellers", label: "Bestsellers" },
      { href: "/track", label: "Track your order" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/shipping", label: "Shipping & delivery" },
      { href: "/returns", label: "Returns & refunds" },
      { href: "/contact", label: "Contact us" },
      { href: "/faq", label: "FAQs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/terms", label: "Terms & conditions" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-plum-100 bg-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl font-semibold text-plum-900">{site.name}</p>
            <p className="mt-2 text-sm text-ink-soft">{site.tagline}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              {site.description}
            </p>
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-plum-700 underline underline-offset-4"
            >
              Instagram
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-soft transition-colors hover:text-plum-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-plum-100 pt-8 text-sm text-ink-soft">
          <address className="not-italic">
            <strong className="font-semibold text-ink">{site.legalName}</strong>
            <br />
            {site.address.line1}, {site.address.line2}
            <br />
            {site.address.city}, {site.address.state} {site.address.pincode}, {site.address.country}
            <br />
            <a href={`mailto:${site.email}`} className="hover:text-plum-700">
              {site.email}
            </a>
            {" · "}
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-plum-700">
              {site.phone}
            </a>
          </address>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p>
              &copy; {new Date().getFullYear()} {site.legalName}. All rights reserved.
            </p>
            <p className="flex items-center gap-2">
              <span>Secure payments by</span>
              <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#072654] ring-1 ring-plum-100">
                Razorpay
              </span>
              <span className="text-xs">UPI · Cards · Netbanking · Wallets</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
