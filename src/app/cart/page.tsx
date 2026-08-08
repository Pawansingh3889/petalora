"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/shipping";

export default function CartPage() {
  const { lines, subtotalPaise, setQuantity, remove, hydrated, count } = useCart();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded bg-plum-100" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <h1 className="text-4xl font-semibold text-plum-900">Your cart is empty</h1>
        <p className="mt-3 text-ink-soft">Nothing in here yet. The roses are waiting.</p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded-full bg-plum-800 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-900"
        >
          Shop the collection
        </Link>
      </div>
    );
  }

  const toFree = Math.max(0, FREE_SHIPPING_THRESHOLD_PAISE - subtotalPaise);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold text-plum-900">
        Your cart <span className="text-xl font-normal text-ink-soft">({count})</span>
      </h1>

      {toFree > 0 && (
        <p className="mt-4 rounded-xl bg-plum-50 px-4 py-3 text-sm text-plum-800">
          Add {formatINR(toFree)} more for free delivery.
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-plum-100">
          {lines.map((line) => (
            <li key={`${line.productId}-${line.variantId}`} className="flex gap-4 py-5">
              <Link
                href={`/product/${line.productSlug}`}
                className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-cream-100"
              >
                <Image
                  src={line.imageSrc}
                  alt={line.imageAlt}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/product/${line.productSlug}`}
                      className="font-display text-lg font-semibold text-plum-900 hover:underline"
                    >
                      {line.productName}
                    </Link>
                    <p className="text-sm text-ink-soft">{line.variantName}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-ink">{formatINR(line.linePaise)}</p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full ring-1 ring-plum-200">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.variantId, line.quantity - 1)}
                      className="px-3 py-1.5 text-lg leading-none text-ink-soft hover:text-plum-700"
                      aria-label={`Decrease quantity of ${line.productName}`}
                    >
                      &minus;
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium" aria-live="polite">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.variantId, line.quantity + 1)}
                      className="px-3 py-1.5 text-lg leading-none text-ink-soft hover:text-plum-700"
                      aria-label={`Increase quantity of ${line.productName}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(line.productId, line.variantId)}
                    className="text-sm text-ink-soft underline underline-offset-4 hover:text-plum-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl bg-cream-100 p-6 lg:sticky lg:top-32">
          <h2 className="font-display text-xl font-semibold text-plum-900">Order summary</h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="font-medium text-ink">{formatINR(subtotalPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd className="text-ink-soft">Calculated at checkout</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-6 block rounded-full bg-plum-800 px-6 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-plum-900"
          >
            Checkout
          </Link>
          <Link
            href="/shop"
            className="mt-3 block text-center text-sm text-ink-soft underline underline-offset-4 hover:text-plum-700"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
