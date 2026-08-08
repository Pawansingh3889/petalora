import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createOrder, nextOrderNumber, updateOrder } from "@/lib/db";
import { PricingError, priceOrder } from "@/lib/pricing";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/razorpay";
import { checkoutSchema, fieldErrors } from "@/lib/validation";

/**
 * POST /api/checkout
 *
 * Creates a PENDING order from a validated cart, then opens a matching
 * Razorpay order for prepaid checkouts. Returns everything the browser needs
 * to launch Razorpay Checkout.
 *
 * The client sends ids and quantities only. Every rupee is recomputed here.
 */

// OpenNext runs every route in the Worker's Node compatibility layer. The
// edge runtime is not supported, and node:crypto is needed here anyway.
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
    input = checkoutSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please check the highlighted fields.", fields: fieldErrors(error) },
        { status: 400 },
      );
    }
    throw error;
  }

  if (input.paymentMethod === "RAZORPAY" && !isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Online payment is not available right now. Please choose cash on delivery." },
      { status: 503 },
    );
  }

  // Authoritative totals.
  let priced;
  try {
    priced = priceOrder(input.items, {
      pincode: input.pincode,
      paymentMethod: input.paymentMethod,
    });
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    throw error;
  }

  const number = await nextOrderNumber();

  const order = await createOrder({
    number,
    // Cash on delivery needs no gateway, so it is confirmed on creation.
    status: input.paymentMethod === "COD" ? "CONFIRMED" : "PENDING",
    paymentMethod: input.paymentMethod,
    name: input.name,
    email: input.email,
    phone: input.phone,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2 || null,
    landmark: input.landmark || null,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    giftMessage: input.giftMessage || null,
    subtotalPaise: priced.subtotalPaise,
    // The COD handling fee rides in the shipping column so the order total
    // always equals subtotal + shipping - discount, with no fourth term.
    shippingPaise: priced.shippingPaise + priced.codFeePaise,
    totalPaise: priced.totalPaise,
    items: priced.lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      variantId: line.variantId,
      variantName: line.variantName,
      imageUrl: line.imageUrl,
      unitPaise: line.unitPaise,
      quantity: line.quantity,
    })),
  });

  if (input.paymentMethod === "COD") {
    return NextResponse.json({
      orderNumber: order.number,
      orderId: order.id,
      paymentMethod: "COD" as const,
      // The confirmation page is keyed on the random cuid, not the sequential
      // order number: PTL-1002 is trivially guessable from PTL-1001, and that
      // page shows a customer's full delivery address.
      redirectTo: `/order/${order.id}`,
    });
  }

  try {
    const razorpayOrder = await createRazorpayOrder({
      amountPaise: priced.totalPaise,
      receipt: order.number,
      notes: {
        orderNumber: order.number,
        customerName: input.name,
        pincode: input.pincode,
      },
    });

    await updateOrder(order.id, { razorpayOrderId: razorpayOrder.id });

    return NextResponse.json({
      orderNumber: order.number,
      orderId: order.id,
      paymentMethod: "RAZORPAY" as const,
      razorpayOrderId: razorpayOrder.id,
      // Echoed back so the browser cannot be tricked into opening Razorpay for
      // a different amount than we recorded.
      amountPaise: priced.totalPaise,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name: input.name,
        email: input.email,
        contact: input.phone,
      },
    });
  } catch (error) {
    // The order row already exists, so mark it failed rather than leaving a
    // PENDING row that nothing will ever resolve.
    await updateOrder(order.id, {
      status: "FAILED",
      notes: "Razorpay order creation failed",
    });
    console.error("[checkout] razorpay order failed", error);
    return NextResponse.json(
      { error: "We could not reach the payment gateway. Please try again." },
      { status: 502 },
    );
  }
}
