"use server";

import { getOrderByNumber } from "@/lib/db";

/**
 * Order lookup for customers who do not have their confirmation link.
 *
 * Requires the order number AND the email it was placed with. The order
 * number alone is guessable (they are sequential), so the email is what
 * actually authorises the lookup. We return the same "not found" message for
 * a wrong number and a wrong email, so this cannot be used to test whether a
 * given email has ever ordered.
 */

export type TrackResult =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "found";
      order: {
        number: string;
        state: string;
        statusLabel: string;
        placedOn: string;
        courier: string | null;
        trackingNumber: string | null;
        detailUrl: string;
      };
    };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Confirmed, packing now",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

export async function trackOrder(
  _prev: TrackResult,
  formData: FormData,
): Promise<TrackResult> {
  const number = String(formData.get("number") ?? "")
    .trim()
    .toUpperCase();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!number || !email) {
    return { status: "error", message: "Enter both your order number and email." };
  }

  const order = await getOrderByNumber(number);

  if (!order || order.email.toLowerCase() !== email) {
    return {
      status: "error",
      message: "We could not find an order with that number and email. Check both and try again.",
    };
  }

  return {
    status: "found",
    order: {
      number: order.number,
      state: order.state,
      statusLabel: STATUS_LABEL[order.status] ?? order.status,
      // createdAt is stored as an ISO string, not a Date.
      placedOn: new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      courier: order.courier,
      trackingNumber: order.trackingNumber,
      detailUrl: `/order/${order.id}`,
    },
  };
}
