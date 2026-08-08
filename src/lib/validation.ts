import { z } from "zod";
import { INDIAN_STATES, isValidPincode } from "./pincode";

/**
 * Request schemas. Everything crossing the network boundary is parsed here
 * before it reaches business logic, so route handlers only ever see values
 * that have already been shape-checked and trimmed.
 */

const phone = z
  .string()
  .trim()
  // Accept the forms Indian customers actually type: 98765 43210,
  // +91 9876543210, 09876543210. Normalised to ten digits below.
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0091|91|0)/, ""))
  .pipe(
    z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  );

export const cartLineSchema = z.object({
  productId: z.string().min(1).max(64),
  variantId: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(10),
});

export const checkoutSchema = z.object({
  items: z.array(cartLineSchema).min(1, "Your cart is empty").max(20),

  name: z.string().trim().min(2, "Enter the recipient's full name").max(80),
  email: z.email("Enter a valid email address").max(120),
  phone,

  addressLine1: z.string().trim().min(5, "Enter the house or flat number and street").max(160),
  addressLine2: z.string().trim().max(160).optional().or(z.literal("")),
  landmark: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter the city").max(80),
  state: z.enum(INDIAN_STATES, { message: "Choose a state" }),
  pincode: z
    .string()
    .trim()
    .refine(isValidPincode, "Enter a valid 6-digit PIN code"),

  giftMessage: z.string().trim().max(300).optional().or(z.literal("")),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const verifySchema = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

/** Flattens a ZodError into { field: message } for the form to render. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    // Keep the first error per field: showing four messages under one input
    // is noise, and fixing the first usually clears the rest.
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
