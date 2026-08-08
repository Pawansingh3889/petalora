import { NextResponse } from "next/server";
import { getOrderByRazorpayOrderId, updateOrder } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

/**
 * POST /api/webhooks/razorpay
 *
 * The reliable half of payment confirmation. The browser callback can be lost
 * (tab closed, phone died mid-UPI, flaky network); this cannot. Razorpay
 * retries a failing webhook, so a customer whose money left their account
 * always ends up with a CONFIRMED order.
 *
 * Set this up at Dashboard -> Settings -> Webhooks with the URL
 *   https://yourdomain.com/api/webhooks/razorpay
 * subscribed to payment.captured and payment.failed.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RazorpayWebhookPayload = {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        error_description?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Must hash the exact bytes Razorpay sent. Parsing to JSON and
  // re-stringifying would reorder keys and change whitespace, breaking the HMAC.
  const rawBody = await request.text();

  let verified: boolean;
  try {
    verified = verifyWebhookSignature(rawBody, signature);
  } catch (error) {
    console.error("[webhook] secret not configured", error);
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!verified) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: RazorpayWebhookPayload;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const razorpayOrderId = payment?.order_id;

  if (!razorpayOrderId) {
    // An event type we do not care about. Acknowledge it so Razorpay stops
    // retrying: a non-2xx here would have it redeliver forever.
    return NextResponse.json({ received: true });
  }

  const order = await getOrderByRazorpayOrderId(razorpayOrderId);
  if (!order) {
    console.warn("[webhook] no local order for razorpay order", razorpayOrderId);
    return NextResponse.json({ received: true });
  }

  switch (event.event) {
    case "payment.captured": {
      // Idempotent: replays and the browser callback racing this both land on
      // the same state. Never downgrade an order already SHIPPED or DELIVERED.
      if (order.status === "PENDING" || order.status === "FAILED") {
        await updateOrder(order.id, {
          status: "CONFIRMED",
          razorpayPaymentId: payment?.id ?? order.razorpayPaymentId,
        });
      }
      break;
    }

    case "payment.failed": {
      // Only mark failed if nothing has succeeded yet. A customer whose first
      // UPI attempt failed and second succeeded must not end up FAILED because
      // the two webhooks arrived out of order.
      if (order.status === "PENDING") {
        await updateOrder(order.id, {
          status: "FAILED",
          notes: payment?.error_description ?? "Payment failed at gateway",
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
