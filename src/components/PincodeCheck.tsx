"use client";

import { useState } from "react";
import { formatINR } from "@/lib/money";
import { isValidPincode, lookupPincode } from "@/lib/pincode";
import { quoteShipping } from "@/lib/shipping";

/**
 * Delivery estimate on the product page. Indian shoppers expect this before
 * they add to cart, and answering it here rather than at checkout removes a
 * reason to abandon.
 *
 * Runs entirely client-side: the rate card and PIN table are plain data, so
 * there is no reason to make the customer wait on a round trip. The binding
 * price is still recomputed on the server at checkout.
 */
export function PincodeCheck({ subtotalPaise }: { subtotalPaise: number }) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<
    { ok: true; state: string; eta: string; shipping: number; free: boolean } | { ok: false } | null
  >(null);

  function check(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidPincode(pincode)) {
      setResult({ ok: false });
      return;
    }
    const info = lookupPincode(pincode);
    const quote = quoteShipping(subtotalPaise, pincode);
    setResult({
      ok: true,
      state: info?.state ?? "India",
      eta: quote.etaDays,
      shipping: quote.shippingPaise,
      free: quote.isFree,
    });
  }

  return (
    <div className="mt-7 rounded-2xl bg-cream-100 p-4">
      <form onSubmit={check}>
        <label htmlFor="pincode-check" className="text-sm font-semibold text-ink">
          Check delivery to your PIN code
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="pincode-check"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            placeholder="110001"
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setResult(null);
            }}
            className="w-32 rounded-lg border border-plum-200 bg-white px-3 py-2 text-sm tracking-wider focus:border-plum-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-plum-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-plum-800"
          >
            Check
          </button>
        </div>
      </form>

      {result && (
        <p className="mt-3 text-sm" aria-live="polite">
          {result.ok ? (
            <span className="text-ink">
              Delivers to <strong>{result.state}</strong> in{" "}
              <strong>{result.eta}</strong> ·{" "}
              {result.free ? (
                <span className="font-semibold text-plum-700">Free shipping</span>
              ) : (
                <>Shipping {formatINR(result.shipping)}</>
              )}
            </span>
          ) : (
            <span className="text-plum-700">Enter a valid 6-digit Indian PIN code.</span>
          )}
        </p>
      )}
    </div>
  );
}
