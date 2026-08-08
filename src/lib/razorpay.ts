import "server-only";
import crypto from "node:crypto";

/**
 * Razorpay server-side integration.
 *
 * Talks to the REST API directly rather than through the SDK: the two calls we
 * need are a POST and an HMAC comparison, and this keeps the secret key on a
 * code path we can read end to end.
 *
 * Never import this from a client component. The `server-only` import above
 * turns that mistake into a build error rather than a leaked key.
 */

const API_BASE = "https://api.razorpay.com/v1";

function credentials(): { keyId: string; keySecret: string } {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local",
    );
  }
  return { keyId, keySecret };
}

/**
 * True only when real keys are present. The placeholders in .env.example are
 * runs of x's, and treating those as configured would send a customer to
 * Razorpay Checkout and fail at the gateway. Rejecting them here instead means
 * a fresh clone cleanly falls back to cash on delivery.
 *
 * Must agree with the equivalent check in the checkout page, which reads the
 * public key id in the browser.
 */
export function isRazorpayConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID ?? "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return (
    keyId.startsWith("rzp_") &&
    !keyId.includes("xxxx") &&
    keySecret.length > 0 &&
    !keySecret.includes("xxxx")
  );
}

function authHeader(): string {
  const { keyId, keySecret } = credentials();
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
};

/**
 * Opens a Razorpay order. `amountPaise` must be the server-computed total:
 * Razorpay will only accept a payment for exactly this amount, which is what
 * stops a tampered client from paying less than the cart is worth.
 */
export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<RazorpayOrder> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay order creation failed (${res.status}): ${body}`);
  }

  return (await res.json()) as RazorpayOrder;
}

/**
 * Verifies the handshake Razorpay Checkout hands back to the browser.
 *
 * signature == HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 *
 * Without this check, anyone could POST a fake success to our verify endpoint
 * and get an order marked paid.
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const { keySecret } = credentials();
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");

  return timingSafeEqual(expected, params.signature);
}

/**
 * Verifies a webhook body against the webhook secret, which is a different
 * secret from the API key secret. Must be run against the raw request body:
 * JSON.parse then re-stringify changes the bytes and breaks the HMAC.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not set");
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(expected, signature);
}

/** Constant-time compare, so we do not leak the signature byte by byte. */
function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
