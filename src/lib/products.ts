import { rupees } from "./money";

/**
 * The catalogue. This is the only file you edit to change what the shop sells.
 *
 * It is deliberately a plain TypeScript module rather than database rows:
 * a five-product store does not need an admin CMS, and keeping prices in
 * version control means a mispriced product is a one-line revert.
 *
 * Prices are in paise. Use rupees(1299) rather than writing 129900.
 */

export type Variant = {
  id: string;
  /** Shown on the size selector when a product has more than one variant. */
  name: string;
  pricePaise: number;
  /** Struck-through reference price. Omit if you are not running a discount. */
  comparePricePaise?: number;
  /** Height of the rose including the stem. */
  heightCm: number;
  /** Real weight in grams. Plush is light but bulky, see shipping.ts. */
  weightGrams: number;
  inStock: boolean;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Short line under the product name in listings. */
  subtitle: string;
  colour: string;
  /** Hex swatch shown on the colour picker. */
  swatch: string;
  images: { src: string; alt: string }[];
  description: string;
  highlights: string[];
  variants: Variant[];
  /** Surfaced on the home page. */
  featured: boolean;
  badge?: string;
};

/**
 * One rose, one price. Every colourway is the same physical product.
 *
 * TODO: heightCm and weightGrams are estimates from the product photos.
 * Measure an actual rose and correct them. The height is quoted on the product
 * page, and the weight is what you will use to sanity-check courier rates.
 */
const ROSE_PRICE = rupees(1999);
const ROSE_COMPARE_PRICE = rupees(2499);
const ROSE_HEIGHT_CM = 100;
const ROSE_WEIGHT_G = 800;

function roseVariant(prefix: string): Variant[] {
  return [
    {
      id: `${prefix}-std`,
      name: `${ROSE_HEIGHT_CM} cm with stem`,
      pricePaise: ROSE_PRICE,
      comparePricePaise: ROSE_COMPARE_PRICE,
      heightCm: ROSE_HEIGHT_CM,
      weightGrams: ROSE_WEIGHT_G,
      inStock: true,
    },
  ];
}

const SHARED_HIGHLIGHTS = [
  "Ultra-soft velvet plush, skin-friendly and non-shedding",
  "Bendable padded stem, holds its shape as a pillow or a prop",
  "Hypoallergenic PP cotton filling, spot clean with a damp cloth",
  "Arrives gift-ready in a Petalora sleeve with a blank message card",
];

const SHARED_DESCRIPTION = `A rose that never needs water and never drops a petal. Each Petalora bloom is
hand-finished from soft velvet plush, with a padded stem you can bend, hug or prop against a
headboard. It works as a gift, as a photo prop and as the softest cushion in the room, all at once.`;

export const products: Product[] = [
  {
    id: "rose-blush",
    slug: "plush-rose-blush-pink",
    name: "The Blush Rose",
    subtitle: "Giant plush rose in soft blush pink",
    colour: "Blush Pink",
    swatch: "#F4A8C0",
    images: [
      { src: "/products/rose-pink-lifestyle.jpeg", alt: "Blush pink plush rose belted into a car seat at dusk" },
      { src: "/products/rose-pink.jpeg", alt: "Blush pink plush rose with green stem on a white background" },
    ],
    description: SHARED_DESCRIPTION,
    highlights: SHARED_HIGHLIGHTS,
    variants: roseVariant("blush"),
    featured: true,
    badge: "Bestseller",
  },
  {
    id: "rose-fuchsia",
    slug: "plush-rose-fuchsia",
    name: "The Fuchsia Rose",
    subtitle: "Giant plush rose in deep fuchsia",
    colour: "Fuchsia",
    swatch: "#E8256F",
    images: [
      { src: "/products/rose-hotpink.jpeg", alt: "Fuchsia plush rose with green stem on a white background" },
    ],
    description: SHARED_DESCRIPTION,
    highlights: SHARED_HIGHLIGHTS,
    variants: roseVariant("fuchsia"),
    featured: true,
  },
  {
    id: "rose-red",
    slug: "plush-rose-classic-red",
    name: "The Classic Red Rose",
    subtitle: "Giant plush rose in true romantic red",
    colour: "Classic Red",
    swatch: "#D6182B",
    images: [
      { src: "/products/rose-red-lifestyle.jpeg", alt: "Red plush rose belted into a car seat at dusk" },
    ],
    description: SHARED_DESCRIPTION,
    highlights: SHARED_HIGHLIGHTS,
    variants: roseVariant("red"),
    featured: true,
    badge: "Most gifted",
  },
  {
    id: "rose-duo",
    slug: "plush-rose-duo-gift-set",
    name: "The Duo Gift Set",
    subtitle: "Two roses, your choice of colours, in one box",
    colour: "Mixed",
    swatch: "#C2698C",
    images: [
      { src: "/products/rose-red-lifestyle.jpeg", alt: "Red plush rose belted into a car seat at dusk" },
      { src: "/products/rose-pink-lifestyle.jpeg", alt: "Blush pink plush rose belted into a car seat at dusk" },
    ],
    description: `Two Petalora roses packed together in a single ribboned box, so the gift arrives as one
piece rather than two parcels. Tell us your colour pairing in the gift note at checkout and we will
match it. Priced below buying the two roses separately.`,
    highlights: [
      "Two full-size roses, colours of your choice",
      "Single ribboned gift box, no loose packaging",
      "Handwritten message card included",
      "Saves against buying both roses individually",
    ],
    variants: [
      {
        id: "duo-std",
        name: "Two roses, one box",
        // Two roses would be 3998 bought separately. The 499 saving is the
        // reason to pick the set, and it still nets more per order than one.
        pricePaise: rupees(3499),
        comparePricePaise: ROSE_PRICE * 2,
        heightCm: ROSE_HEIGHT_CM,
        weightGrams: ROSE_WEIGHT_G * 2,
        inStock: true,
      },
    ],
    featured: true,
    badge: "Save more",
  },
];

const bySlug = new Map(products.map((p) => [p.slug, p]));
const byId = new Map(products.map((p) => [p.id, p]));

export function getProductBySlug(slug: string): Product | undefined {
  return bySlug.get(slug);
}

export function getProductById(id: string): Product | undefined {
  return byId.get(id);
}

/**
 * Resolve a (productId, variantId) pair from an untrusted request body.
 * Returns undefined if either does not exist, which the caller must treat as
 * a rejected line rather than a zero-priced one.
 */
export function resolveVariant(
  productId: string,
  variantId: string,
): { product: Product; variant: Variant } | undefined {
  const product = byId.get(productId);
  if (!product) return undefined;
  const variant = product.variants.find((v) => v.id === variantId);
  if (!variant) return undefined;
  return { product, variant };
}

export function priceRange(product: Product): { min: number; max: number } {
  const prices = product.variants.map((v) => v.pricePaise);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
