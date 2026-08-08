import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/money";
import { priceRange, type Product } from "@/lib/products";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { min, max } = priceRange(product);
  const cheapest = product.variants.reduce((a, b) => (a.pricePaise <= b.pricePaise ? a : b));
  // "From Rs 1,999" only makes sense when there is a range to be at the bottom of.
  const singlePrice = min === max;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-plum-100 transition-shadow hover:shadow-lg hover:shadow-plum-100/60"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-cream-100">
        <Image
          src={product.images[0].src}
          alt={product.images[0].alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={priority}
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-plum-800 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl leading-tight font-semibold text-plum-900">
            {product.name}
          </h3>
          <span
            className="mt-1 h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: product.swatch }}
            aria-hidden="true"
          />
        </div>

        <p className="mt-1 text-sm text-ink-soft">{product.subtitle}</p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-base font-semibold text-ink">
            {singlePrice ? formatINR(min) : `From ${formatINR(min)}`}
          </span>
          {cheapest.comparePricePaise && (
            <span className="text-sm text-ink-soft line-through">
              {formatINR(cheapest.comparePricePaise)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
