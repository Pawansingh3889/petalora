/**
 * All money in this codebase is an integer count of paise. Never store or
 * pass rupees as a float: 0.1 + 0.2 problems turn into real refunds.
 *
 * 49900 paise === Rs 499.00
 */

export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    // Whole-rupee prices are the norm in Indian retail, so hide ".00" but keep
    // decimals when a value genuinely has paise (a discount split, say).
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/** Rupees to paise, for writing prices readably in the catalogue. */
export function rupees(amount: number): number {
  return Math.round(amount * 100);
}
