import { rupees } from "./money";
import { zoneForPincode, type ShippingZone } from "./pincode";

/**
 * Shipping rules for a Delhi-origin store selling bulky-but-light plush.
 *
 * Couriers bill plush on volumetric weight, not real weight: a 90 cm rose
 * weighs 750 g but bills like 4-5 kg. The flat rates below are set to cover
 * that, and the free-shipping threshold sits above the price of the smallest
 * rose so a single Classic never ships free at a loss.
 *
 * All of this is recomputed server-side at checkout. The client copy is only
 * ever a quote.
 */

/**
 * Deliberately set to exactly the price of one rose, so every mainland order
 * ships free and the storefront can advertise it without an asterisk.
 *
 * That means you absorb the courier cost on every order: roughly Rs 49 in NCR
 * and Rs 99 elsewhere, against Rs 1,999 of revenue. That is a marketing
 * decision, not an accident. Raise this to rupees(2499) if you would rather a
 * single rose paid its own postage and only the Duo set shipped free.
 *
 * If you change the rose price in products.ts, revisit this number: the two
 * are coupled, and a rose priced at 1899 against a 1999 threshold would
 * silently start charging shipping on your hero product.
 */
export const FREE_SHIPPING_THRESHOLD_PAISE = rupees(1999);

const RATES: Record<ShippingZone, { paise: number; label: string; etaDays: string }> = {
  NCR: {
    paise: rupees(49),
    label: "Delhi NCR",
    etaDays: "1-2 days",
  },
  NATIONAL: {
    paise: rupees(99),
    label: "Rest of India",
    etaDays: "3-6 days",
  },
  REMOTE: {
    paise: rupees(199),
    label: "Northeast, J&K, Ladakh, hills and islands",
    etaDays: "6-10 days",
  },
};

/** Cash on delivery handling fee, and the ceiling above which we do not offer it. */
export const COD_FEE_PAISE = rupees(59);
export const COD_MAX_ORDER_PAISE = rupees(4000);

export type ShippingQuote = {
  zone: ShippingZone;
  zoneLabel: string;
  etaDays: string;
  shippingPaise: number;
  isFree: boolean;
  /** Paise still to spend to cross the free-shipping line, 0 once crossed. */
  amountToFreePaise: number;
};

export function quoteShipping(subtotalPaise: number, pincode: string | undefined): ShippingQuote {
  const zone = pincode ? zoneForPincode(pincode) : "NATIONAL";
  const rate = RATES[zone];

  // Free shipping applies to mainland rates only. Remote deliveries genuinely
  // cost more than the margin on one rose, so they always carry the fee.
  const isFree = subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE && zone !== "REMOTE";

  return {
    zone,
    zoneLabel: rate.label,
    etaDays: rate.etaDays,
    shippingPaise: isFree ? 0 : rate.paise,
    isFree,
    amountToFreePaise: Math.max(0, FREE_SHIPPING_THRESHOLD_PAISE - subtotalPaise),
  };
}

export function codAvailable(totalPaise: number, zone: ShippingZone): boolean {
  // COD on remote pincodes has a high RTO rate and the return leg costs as
  // much as the outbound. Prepaid only there.
  return totalPaise <= COD_MAX_ORDER_PAISE && zone !== "REMOTE";
}

/** Rate card for the shipping policy page. */
export function rateCard() {
  return (Object.keys(RATES) as ShippingZone[]).map((zone) => ({
    zone,
    ...RATES[zone],
  }));
}
