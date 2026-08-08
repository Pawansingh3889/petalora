import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getOrderById } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { site, whatsappLink } from "@/lib/site";

/**
 * Order confirmation, reached straight after checkout.
 *
 * Keyed on the order's random cuid rather than its sequential number: this
 * page shows a full delivery address and phone number, so a guessable URL
 * would be an enumeration hole.
 */

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

// Always read live: the status flips from PENDING to CONFIRMED when the
// Razorpay webhook lands, and a cached page would show the old value.
export const dynamic = "force-dynamic";

const STATUS_COPY = {
  PENDING: {
    heading: "Payment pending",
    body: "We have your order but have not seen the payment yet. If money has left your account it will confirm within a few minutes. Refresh this page, or write to us with your order number.",
    tone: "warn",
  },
  CONFIRMED: {
    heading: "Order confirmed",
    body: "Thank you. We are packing your rose now and will send tracking as soon as it leaves our Delhi studio.",
    tone: "good",
  },
  SHIPPED: {
    heading: "On its way",
    body: "Your parcel has left our studio.",
    tone: "good",
  },
  DELIVERED: {
    heading: "Delivered",
    body: "This order has been delivered. We hope it landed well.",
    tone: "good",
  },
  CANCELLED: {
    heading: "Order cancelled",
    body: "This order was cancelled. Any payment made is being refunded to the original method.",
    tone: "bad",
  },
  FAILED: {
    heading: "Payment did not go through",
    body: "The payment was not completed, so we have not started this order. Nothing has been charged. You can place it again from your cart.",
    tone: "bad",
  },
  REFUNDED: {
    heading: "Refunded",
    body: "This order has been refunded. Banks take 5-7 working days to post it.",
    tone: "bad",
  },
} as const;

const TONE_CLASS = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  bad: "border-plum-300 bg-plum-50 text-plum-900",
} as const;

export default async function OrderPage({ params }: Props) {
  const { id } = await params;

  const order = await getOrderById(id);

  if (!order) notFound();

  const copy = STATUS_COPY[order.status];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold tracking-[0.18em] text-plum-600 uppercase">
        Order {order.number}
      </p>
      <h1 className="mt-2 text-4xl font-semibold text-plum-900">{copy.heading}</h1>

      <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${TONE_CLASS[copy.tone]}`}>
        {copy.body}
      </div>

      {order.trackingNumber && (
        <div className="mt-4 rounded-xl bg-cream-100 px-4 py-3 text-sm">
          <span className="text-ink-soft">Tracking</span>{" "}
          <strong className="text-ink">
            {order.courier} {order.trackingNumber}
          </strong>
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-plum-900">What you ordered</h2>
        <ul className="mt-4 divide-y divide-plum-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-4 py-4">
              <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg bg-cream-100">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-ink">{item.productName}</p>
                <p className="text-sm text-ink-soft">
                  {item.variantName} · Qty {item.quantity}
                </p>
              </div>
              <p className="font-medium text-ink">{formatINR(item.unitPaise * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-plum-100 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="text-ink">{formatINR(order.subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Shipping and handling</dt>
            <dd className="text-ink">
              {order.shippingPaise === 0 ? "Free" : formatINR(order.shippingPaise)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-plum-100 pt-2 text-base">
            <dt className="font-semibold text-ink">
              Total {order.paymentMethod === "COD" ? "(pay on delivery)" : "paid"}
            </dt>
            <dd className="font-semibold text-plum-900">{formatINR(order.totalPaise)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-semibold text-plum-900">Delivering to</h2>
          <address className="mt-2 text-sm leading-relaxed text-ink-soft not-italic">
            <strong className="font-medium text-ink">{order.name}</strong>
            <br />
            {order.addressLine1}
            {order.addressLine2 && (
              <>
                <br />
                {order.addressLine2}
              </>
            )}
            {order.landmark && (
              <>
                <br />
                Near {order.landmark}
              </>
            )}
            <br />
            {order.city}, {order.state} {order.pincode}
            <br />
            {order.phone}
          </address>
        </div>

        <div>
          <h2 className="font-display text-xl font-semibold text-plum-900">Need help?</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Quote order <strong className="text-ink">{order.number}</strong> and we will pick it up
            from there.
          </p>
          <div className="mt-3 flex flex-col gap-1.5 text-sm">
            <a href={`mailto:${site.email}`} className="text-plum-700 underline underline-offset-4">
              {site.email}
            </a>
            <a
              href={whatsappLink(`Hi Petalora, I need help with order ${order.number}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-plum-700 underline underline-offset-4"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      {order.giftMessage && (
        <section className="mt-10 rounded-2xl bg-cream-100 p-5">
          <h2 className="font-display text-lg font-semibold text-plum-900">Your gift message</h2>
          <p className="mt-2 text-sm text-ink italic">&ldquo;{order.giftMessage}&rdquo;</p>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/shop"
          className="rounded-full bg-plum-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-plum-900"
        >
          Continue shopping
        </Link>
        <Link
          href="/track"
          className="rounded-full px-6 py-3 text-sm font-semibold text-plum-800 ring-1 ring-plum-300 transition-colors hover:bg-plum-50"
        >
          Track an order
        </Link>
      </div>
    </div>
  );
}
