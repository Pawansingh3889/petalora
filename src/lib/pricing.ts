import { resolveVariant } from "./products";
import { COD_FEE_PAISE, codAvailable, quoteShipping } from "./shipping";
import { zoneForPincode } from "./pincode";

/**
 * Authoritative order maths.
 *
 * The browser sends product ids, variant ids and quantities. It never sends
 * prices, and if it did we would ignore them: every rupee charged is derived
 * here from the server-side catalogue. This is the one function standing
 * between the shop and someone editing a price to 1 in devtools.
 */

export type CartLineInput = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type PricedLine = {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  imageUrl: string;
  unitPaise: number;
  quantity: number;
  linePaise: number;
};

export type PricedOrder = {
  lines: PricedLine[];
  subtotalPaise: number;
  shippingPaise: number;
  codFeePaise: number;
  totalPaise: number;
  zoneLabel: string;
  etaDays: string;
  freeShippingApplied: boolean;
};

export class PricingError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "PricingError";
  }
}

const MAX_QUANTITY_PER_LINE = 10;
const MAX_LINES = 20;

export function priceOrder(
  input: CartLineInput[],
  opts: { pincode: string; paymentMethod: "RAZORPAY" | "COD" },
): PricedOrder {
  if (input.length === 0) {
    throw new PricingError("Your cart is empty.", "EMPTY_CART");
  }
  if (input.length > MAX_LINES) {
    throw new PricingError("Too many different items in one order.", "TOO_MANY_LINES");
  }

  const lines: PricedLine[] = [];

  for (const line of input) {
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      throw new PricingError(
        `Quantity must be a whole number between 1 and ${MAX_QUANTITY_PER_LINE}.`,
        "BAD_QUANTITY",
      );
    }

    const resolved = resolveVariant(line.productId, line.variantId);
    if (!resolved) {
      throw new PricingError("One of the items is no longer available.", "UNKNOWN_VARIANT");
    }
    const { product, variant } = resolved;

    if (!variant.inStock) {
      throw new PricingError(`${product.name} (${variant.name}) is out of stock.`, "OUT_OF_STOCK");
    }

    lines.push({
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      variantName: variant.name,
      imageUrl: product.images[0]?.src ?? "",
      unitPaise: variant.pricePaise,
      quantity,
      linePaise: variant.pricePaise * quantity,
    });
  }

  const subtotalPaise = lines.reduce((sum, l) => sum + l.linePaise, 0);
  const quote = quoteShipping(subtotalPaise, opts.pincode);

  let codFeePaise = 0;
  if (opts.paymentMethod === "COD") {
    const zone = zoneForPincode(opts.pincode);
    if (!codAvailable(subtotalPaise + quote.shippingPaise, zone)) {
      throw new PricingError(
        "Cash on delivery is not available for this order. Please pay online.",
        "COD_UNAVAILABLE",
      );
    }
    codFeePaise = COD_FEE_PAISE;
  }

  return {
    lines,
    subtotalPaise,
    shippingPaise: quote.shippingPaise,
    codFeePaise,
    totalPaise: subtotalPaise + quote.shippingPaise + codFeePaise,
    zoneLabel: quote.zoneLabel,
    etaDays: quote.etaDays,
    freeShippingApplied: quote.isFree,
  };
}
