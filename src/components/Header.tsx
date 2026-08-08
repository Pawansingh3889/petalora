"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { site } from "@/lib/site";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/shipping";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "Our Story" },
  { href: "/shipping", label: "Delivery" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const { count, hydrated } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-plum-800 px-4 py-2 text-center text-xs font-medium tracking-wide text-plum-50 sm:text-sm">
        Free shipping across India above {formatINR(FREE_SHIPPING_THRESHOLD_PAISE)} &middot;
        Dispatched from {site.dispatch.origin}
      </div>

      <nav
        className="border-b border-plum-100 bg-cream-50/95 backdrop-blur"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/logo.jpeg"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 rounded-full object-cover"
              priority
            />
            <span className="font-display text-2xl font-semibold tracking-tight text-plum-900">
              {site.name}
            </span>
          </Link>

          <ul className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`text-sm font-medium transition-colors hover:text-plum-700 ${
                    pathname === item.href ? "text-plum-700" : "text-ink-soft"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1">
            <Link
              href="/cart"
              className="relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-plum-50"
            >
              <CartIcon />
              <span className="hidden sm:inline">Cart</span>
              {/* Suppress the badge until hydration so the server-rendered
                  header and the first client render agree. */}
              {hydrated && count > 0 && (
                <span
                  className="absolute -top-0.5 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-plum-600 px-1.5 text-[11px] font-semibold text-white sm:static sm:h-5"
                  aria-label={`${count} items in cart`}
                >
                  {count}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-full p-2 text-ink transition-colors hover:bg-plum-50 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <ul id="mobile-menu" className="border-t border-plum-100 bg-cream-50 px-4 py-2 md:hidden">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  // Close on tap rather than in an effect on pathname: tapping
                  // the link the user is already on must also close the menu,
                  // and that navigation fires no pathname change.
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-plum-50 py-3 text-sm font-medium text-ink last:border-0"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M3 3h2l.6 3M7 13h10l3-7H5.6M7 13 5.6 6M7 13l-1.2 4H19" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
