"use client";

import Link from "next/link";
import { useActionState } from "react";
import { trackOrder, type TrackResult } from "./actions";

const INITIAL: TrackResult = { status: "idle" };

export default function TrackPage() {
  const [result, formAction, pending] = useActionState(trackOrder, INITIAL);

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-semibold text-plum-900">Track your order</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Enter the order number from your confirmation email along with the email you ordered with.
      </p>

      <form action={formAction} className="mt-8 space-y-4">
        <div>
          <label htmlFor="number" className="block text-sm font-medium text-ink">
            Order number
          </label>
          <input
            id="number"
            name="number"
            required
            placeholder="PTL-1001"
            className="mt-1.5 w-full rounded-lg border border-plum-200 bg-white px-3 py-2.5 text-sm focus:border-plum-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1.5 w-full rounded-lg border border-plum-200 bg-white px-3 py-2.5 text-sm focus:border-plum-500"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-plum-800 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-900 disabled:bg-plum-400"
        >
          {pending ? "Looking..." : "Find my order"}
        </button>
      </form>

      <div aria-live="polite" className="mt-6">
        {result.status === "error" && (
          <p className="rounded-xl border border-plum-300 bg-plum-50 px-4 py-3 text-sm text-plum-900">
            {result.message}
          </p>
        )}

        {result.status === "found" && (
          <div className="rounded-2xl bg-cream-100 p-5">
            <p className="font-display text-xl font-semibold text-plum-900">
              {result.order.number}
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Status</dt>
                <dd className="font-medium text-ink">{result.order.statusLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Placed on</dt>
                <dd className="text-ink">{result.order.placedOn}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Delivering to</dt>
                <dd className="text-ink">{result.order.state}</dd>
              </div>
              {result.order.trackingNumber && (
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Tracking</dt>
                  <dd className="text-ink">
                    {result.order.courier} {result.order.trackingNumber}
                  </dd>
                </div>
              )}
            </dl>
            <Link
              href={result.order.detailUrl}
              className="mt-4 inline-block text-sm font-semibold text-plum-700 underline underline-offset-4"
            >
              See full order
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
