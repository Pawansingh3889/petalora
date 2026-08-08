"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import { INDIAN_STATES, isValidPincode, lookupPincode } from "@/lib/pincode";
import { COD_FEE_PAISE, codAvailable, quoteShipping } from "@/lib/shipping";
import { zoneForPincode } from "@/lib/pincode";
import { site } from "@/lib/site";
import { loadRazorpay, openRazorpay, type RazorpayHandlerResponse } from "@/lib/razorpay-client";

type PaymentMethod = "RAZORPAY" | "COD";

// NEXT_PUBLIC_ vars are inlined at build time, so this is a constant.
// The placeholder key in .env.example is all x's; treat that as unconfigured
// so a fresh clone falls back to cash on delivery instead of sending the
// customer to a gateway call that will fail.
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
const ONLINE_PAYMENT_AVAILABLE =
  RAZORPAY_KEY.startsWith("rzp_") && !RAZORPAY_KEY.includes("xxxx");

/**
 * Picks the method to actually charge with. Honours the customer's preference
 * when it is available, otherwise falls back to whatever is. Returns null when
 * neither works, which disables the submit button rather than letting them
 * submit an order the server will reject.
 */
function resolvePayment(
  preferred: PaymentMethod,
  onlineOk: boolean,
  codOk: boolean,
): PaymentMethod | null {
  if (preferred === "RAZORPAY" && onlineOk) return "RAZORPAY";
  if (preferred === "COD" && codOk) return "COD";
  if (onlineOk) return "RAZORPAY";
  if (codOk) return "COD";
  return null;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  giftMessage: "",
};

type FormState = typeof EMPTY_FORM;

/**
 * Shapes returned by /api/checkout. Declared rather than inferred because
 * Response.json() is typed `unknown` under the Workers runtime types, which is
 * correct: the body really is untyped until we say what we expect.
 */
type CheckoutError = { error?: string; fields?: Record<string, string> };

type CheckoutSuccess =
  | { paymentMethod: "COD"; orderNumber: string; orderId: string; redirectTo: string }
  | {
      paymentMethod: "RAZORPAY";
      orderNumber: string;
      orderId: string;
      razorpayOrderId: string;
      amountPaise: number;
      keyId: string;
      prefill: { name: string; email: string; contact: string };
    };

type VerifyResponse = { ok?: boolean; redirectTo?: string };

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotalPaise, hydrated, clear } = useCart();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [preferredPayment, setPreferredPayment] = useState<PaymentMethod>(
    ONLINE_PAYMENT_AVAILABLE ? "RAZORPAY" : "COD",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Send an empty cart back to the shop rather than showing a checkout that
  // cannot be completed.
  useEffect(() => {
    if (hydrated && lines.length === 0 && !submitting) {
      router.replace("/cart");
    }
  }, [hydrated, lines.length, submitting, router]);

  const quote = useMemo(
    () => quoteShipping(subtotalPaise, isValidPincode(form.pincode) ? form.pincode : undefined),
    [subtotalPaise, form.pincode],
  );

  const zone = isValidPincode(form.pincode) ? zoneForPincode(form.pincode) : "NATIONAL";
  const codAllowed = codAvailable(subtotalPaise + quote.shippingPaise, zone);

  // Derived rather than stored. If the customer picks COD and then enters a
  // PIN code where we do not offer it, the selection falls back on the next
  // render instead of the server rejecting the order. Keeping their preference
  // in state means it comes back if they correct the PIN code.
  const paymentMethod = resolvePayment(preferredPayment, ONLINE_PAYMENT_AVAILABLE, codAllowed);

  const codFee = paymentMethod === "COD" ? COD_FEE_PAISE : 0;
  const total = subtotalPaise + quote.shippingPaise + codFee;

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function handlePincode(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    update("pincode", digits);
    // Auto-fill the state so the customer does not scroll a 36-item dropdown.
    // Still editable, since the prefix table is an approximation.
    const info = lookupPincode(digits);
    if (info) {
      setForm((f) => ({ ...f, pincode: digits, state: info.state }));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    if (!paymentMethod) {
      setFormError("No payment method is available for this address. Please contact us.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentMethod,
          items: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            quantity: l.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as CheckoutError;
        setErrors(data.fields ?? {});
        setFormError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        // Move focus to the first thing that is wrong.
        const firstField = data.fields ? Object.keys(data.fields)[0] : null;
        if (firstField) {
          document.getElementById(firstField)?.focus();
        }
        return;
      }

      const data = (await res.json()) as CheckoutSuccess;

      if (data.paymentMethod === "COD") {
        clear();
        router.push(data.redirectTo);
        return;
      }

      await startRazorpay(data);
    } catch (error) {
      console.error(error);
      setFormError("We could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  async function startRazorpay(data: {
    razorpayOrderId: string;
    amountPaise: number;
    keyId: string;
    orderNumber: string;
    orderId: string;
    prefill: { name: string; email: string; contact: string };
  }) {
    try {
      await loadRazorpay();
    } catch {
      setFormError("Could not load the payment window. Check your connection and try again.");
      setSubmitting(false);
      return;
    }

    const instance = openRazorpay({
      key: data.keyId,
      amount: data.amountPaise,
      currency: "INR",
      name: site.name,
      description: `Order ${data.orderNumber}`,
      image: "/logo.jpeg",
      order_id: data.razorpayOrderId,
      prefill: data.prefill,
      notes: { orderNumber: data.orderNumber },
      theme: { color: "#8b3a62" },
      handler: (response: RazorpayHandlerResponse) => {
        void verifyPayment(response, data.orderId);
      },
      modal: {
        ondismiss: () => {
          // Customer closed the window. The order stays PENDING; if they did
          // in fact pay, the webhook will still confirm it.
          setSubmitting(false);
          setFormError(
            "Payment window closed. Your order is saved as unpaid, you can try again.",
          );
        },
      },
    });

    instance.on("payment.failed", (response) => {
      setSubmitting(false);
      setFormError(
        response.error?.description ?? "The payment did not go through. Please try again.",
      );
    });
  }

  async function verifyPayment(response: RazorpayHandlerResponse, orderId: string) {
    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      if (!res.ok) {
        // The money may well have left the customer's account. Do not tell
        // them the payment failed; send them to the order page, which reads
        // live status and will flip to confirmed when the webhook lands.
        clear();
        router.push(`/order/${orderId}`);
        return;
      }

      const data = (await res.json()) as VerifyResponse;
      clear();
      router.push(data.redirectTo ?? `/order/${orderId}`);
    } catch {
      clear();
      router.push(`/order/${orderId}`);
    }
  }

  if (!hydrated || lines.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-plum-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl font-semibold text-plum-900">Checkout</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Shipping across India from {site.dispatch.origin}. All prices include tax.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-plum-300 bg-plum-50 px-4 py-3 text-sm text-plum-900"
            >
              {formError}
            </div>
          )}

          <Fieldset legend="Contact">
            <Field
              id="name"
              label="Full name"
              value={form.name}
              onChange={(v) => update("name", v)}
              error={errors.name}
              autoComplete="name"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => update("email", v)}
                error={errors.email}
                autoComplete="email"
                hint="Order updates go here"
                required
              />
              <Field
                id="phone"
                label="Mobile number"
                type="tel"
                value={form.phone}
                onChange={(v) => update("phone", v)}
                error={errors.phone}
                autoComplete="tel"
                hint="For delivery calls"
                required
              />
            </div>
          </Fieldset>

          <Fieldset legend="Delivery address">
            <Field
              id="addressLine1"
              label="House / flat number and street"
              value={form.addressLine1}
              onChange={(v) => update("addressLine1", v)}
              error={errors.addressLine1}
              autoComplete="address-line1"
              required
            />
            <Field
              id="addressLine2"
              label="Area, colony or sector"
              value={form.addressLine2}
              onChange={(v) => update("addressLine2", v)}
              error={errors.addressLine2}
              autoComplete="address-line2"
              optional
            />
            <Field
              id="landmark"
              label="Landmark"
              value={form.landmark}
              onChange={(v) => update("landmark", v)}
              error={errors.landmark}
              hint="Helps the courier find you"
              optional
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                id="pincode"
                label="PIN code"
                value={form.pincode}
                onChange={handlePincode}
                error={errors.pincode}
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={6}
                required
              />
              <Field
                id="city"
                label="City"
                value={form.city}
                onChange={(v) => update("city", v)}
                error={errors.city}
                autoComplete="address-level2"
                required
              />
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-ink">
                  State
                </label>
                <select
                  id="state"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  autoComplete="address-level1"
                  required
                  aria-invalid={Boolean(errors.state)}
                  className="mt-1.5 w-full rounded-lg border border-plum-200 bg-white px-3 py-2.5 text-sm focus:border-plum-500"
                >
                  <option value="">Select</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state && <p className="mt-1 text-xs text-plum-700">{errors.state}</p>}
              </div>
            </div>

            {isValidPincode(form.pincode) && (
              <p className="rounded-lg bg-cream-100 px-3 py-2 text-sm text-ink-soft">
                {quote.zoneLabel} · estimated delivery in {quote.etaDays}
              </p>
            )}
          </Fieldset>

          <Fieldset legend="Gift message" hint="Optional. Handwritten on a card, no invoice in the box.">
            <div>
              <label htmlFor="giftMessage" className="sr-only">
                Gift message
              </label>
              <textarea
                id="giftMessage"
                value={form.giftMessage}
                onChange={(e) => update("giftMessage", e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Happy birthday, Aditi. Love, R."
                className="w-full rounded-lg border border-plum-200 bg-white px-3 py-2.5 text-sm focus:border-plum-500"
              />
              <p className="mt-1 text-xs text-ink-soft">
                {form.giftMessage.length}/300 characters
              </p>
            </div>
          </Fieldset>

          <Fieldset legend="Payment">
            <div className="space-y-3">
              <PaymentOption
                checked={paymentMethod === "RAZORPAY"}
                onSelect={() => setPreferredPayment("RAZORPAY")}
                disabled={!ONLINE_PAYMENT_AVAILABLE}
                title="Pay online"
                body={
                  ONLINE_PAYMENT_AVAILABLE
                    ? "UPI, credit and debit cards, netbanking, wallets. Secured by Razorpay."
                    : "Online payment is not set up yet. Please use cash on delivery."
                }
              />
              <PaymentOption
                checked={paymentMethod === "COD"}
                onSelect={() => setPreferredPayment("COD")}
                disabled={!codAllowed}
                title={`Cash on delivery (+${formatINR(COD_FEE_PAISE)})`}
                body={
                  codAllowed
                    ? "Pay the courier when the parcel arrives."
                    : "Not available for this PIN code or order value."
                }
              />
              {!paymentMethod && (
                <p role="alert" className="text-sm text-plum-700">
                  We cannot take payment for this address online or on delivery. Please{" "}
                  <Link href="/contact" className="underline underline-offset-4">
                    contact us
                  </Link>{" "}
                  and we will arrange it manually.
                </p>
              )}
            </div>
          </Fieldset>
        </div>

        <aside className="h-fit rounded-2xl bg-cream-100 p-6 lg:sticky lg:top-32">
          <h2 className="font-display text-xl font-semibold text-plum-900">Your order</h2>

          <ul className="mt-4 space-y-3">
            {lines.map((line) => (
              <li key={`${line.productId}-${line.variantId}`} className="flex gap-3">
                <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-lg bg-white">
                  <Image src={line.imageSrc} alt="" fill sizes="56px" className="object-cover" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-plum-800 text-[11px] font-semibold text-white">
                    {line.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{line.productName}</p>
                  <p className="text-xs text-ink-soft">{line.variantName}</p>
                </div>
                <p className="text-sm font-medium text-ink">{formatINR(line.linePaise)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-plum-200 pt-4 text-sm">
            <Row label="Subtotal" value={formatINR(subtotalPaise)} />
            <Row
              label="Shipping"
              value={
                !isValidPincode(form.pincode)
                  ? "Enter PIN code"
                  : quote.isFree
                    ? "Free"
                    : formatINR(quote.shippingPaise)
              }
            />
            {codFee > 0 && <Row label="COD handling" value={formatINR(codFee)} />}
            <div className="flex justify-between border-t border-plum-200 pt-3 text-base">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-semibold text-plum-900">{formatINR(total)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={submitting || !paymentMethod}
            className="mt-6 w-full rounded-full bg-plum-800 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-900 disabled:cursor-not-allowed disabled:bg-plum-400"
          >
            {submitting
              ? "Please wait..."
              : paymentMethod === "COD"
                ? `Place order · ${formatINR(total)}`
                : `Pay ${formatINR(total)}`}
          </button>

          <p className="mt-3 text-center text-xs text-ink-soft">
            By placing this order you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/returns" className="underline underline-offset-2">
              refund policy
            </Link>
            .
          </p>
        </aside>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="font-display text-2xl font-semibold text-plum-900">{legend}</legend>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  required = false,
  optional = false,
  autoComplete,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "text" | "tel" | "email";
  maxLength?: number;
}) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-soft">(optional)</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={`mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm focus:border-plum-500 ${
          error ? "border-plum-500" : "border-plum-200"
        }`}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-plum-700">
          {error}
        </p>
      )}
    </div>
  );
}

function PaymentOption({
  checked,
  onSelect,
  title,
  body,
  disabled = false,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  body: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors ${
        checked ? "border-plum-600 bg-plum-50" : "border-plum-100 bg-white hover:border-plum-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <input
        type="radio"
        name="paymentMethod"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="mt-1 h-4 w-4 shrink-0 accent-plum-700"
      />
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm text-ink-soft">{body}</span>
      </span>
    </label>
  );
}
