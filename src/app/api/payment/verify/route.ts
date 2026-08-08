import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getOrderByRazorpayOrderId, updateOrder } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { verifySchema } from "@/lib/validation";

/**
 * POST /api/payment/verify
 *
 * Called by the browser with the handshake Razorpay Checkout returns on
 * success. Confirms the order only if the HMAC signature checks out.
 *
 * This is the fast path so the customer sees a confirmation immediately. The
 * webhook at /api/webhooks/razorpay is the reliable path: it still fires if
 * the customer closes the tab before this request lands.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request body." }, { status: 400 });
  }

  let input;
  try {
    input = verifySchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid payment response." }, { status: 400 });
    }
    throw error;
  }

  const order = await getOrderByRazorpayOrderId(input.razorpay_order_id);

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const valid = verifyPaymentSignature({
    razorpayOrderId: input.razorpay_order_id,
    razorpayPaymentId: input.razorpay_payment_id,
    signature: input.razorpay_signature,
  });

  if (!valid) {
    // Only a still-pending order may be failed by a bad signature. Never
    // downgrade one that has already been paid: razorpay_order_id is visible
    // to the buyer's browser, so otherwise anyone holding it could POST
    // garbage and flip a captured order to FAILED.
    if (order.status === "PENDING") {
      await updateOrder(order.id, {
        status: "FAILED",
        notes: "Signature verification failed",
      });
    }
    // Deliberately vague: a caller probing this endpoint learns only that it
    // did not work, not which part of the payload was wrong.
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  // The webhook may have confirmed this already. Confirming twice is harmless
  // but we avoid rewriting a shipped order back to CONFIRMED.
  const alreadySettled = order.status !== "PENDING" && order.status !== "FAILED";

  if (!alreadySettled) {
    await updateOrder(order.id, {
      status: "CONFIRMED",
      razorpayPaymentId: input.razorpay_payment_id,
      razorpaySignature: input.razorpay_signature,
    });
  }

  return NextResponse.json({
    ok: true,
    orderNumber: order.number,
    orderId: order.id,
    redirectTo: `/order/${order.id}`,
  });
}
