import type { Metadata } from "next";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/shipping";

export const metadata: Metadata = {
  title: "Shop plush roses",
  description:
    "Giant velvet plush roses in blush pink, fuchsia and classic red. Three sizes, gift-ready packaging, delivered across India from Delhi.",
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-5xl font-semibold text-plum-900">The collection</h1>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Every rose comes in three sizes and arrives gift-wrapped. Free delivery across India on
          orders above {formatINR(FREE_SHIPPING_THRESHOLD_PAISE)}.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}
