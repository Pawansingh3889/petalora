/**
 * Types and loader for Razorpay's hosted Checkout script.
 *
 * The script must come from checkout.razorpay.com at runtime; it cannot be
 * bundled, and self-hosting a copy breaks when Razorpay updates it.
 */

export type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  prefill: { name: string; email: string; contact: string };
  notes?: Record<string, string>;
  theme?: { color: string };
  modal?: { ondismiss?: () => void };
};

type RazorpayFailureResponse = {
  error: { description?: string; reason?: string };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let loader: Promise<void> | null = null;

/** Loads Checkout once and reuses the same promise for later calls. */
export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout can only load in the browser"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Clear the cached promise so a retry can attempt a fresh load rather
      // than resolving against the failed one forever.
      loader = null;
      reject(new Error("Failed to load Razorpay Checkout. Check your connection."));
    };
    document.body.appendChild(script);
  });

  return loader;
}

export function openRazorpay(options: RazorpayOptions): RazorpayInstance {
  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout is not loaded");
  }
  const instance = new window.Razorpay(options);
  instance.open();
  return instance;
}

export type { RazorpayOptions, RazorpayFailureResponse };
