"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/money";
import type { Product } from "@/lib/products";
import { PincodeCheck } from "./PincodeCheck";

/**
 * Gallery, size picker and add-to-cart for a single product. Client-side
 * because all three share the selected-variant state.
 */
export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();

  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [activeImage, setActiveImage] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const saving = variant.comparePricePaise
    ? variant.comparePricePaise - variant.pricePaise
    : 0;

  function handleAdd() {
    add({ productId: product.id, variantId: variant.id, quantity: 1 });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2200);
  }

  function handleBuyNow() {
    add({ productId: product.id, variantId: variant.id, quantity: 1 });
    router.push("/checkout");
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      {/* Gallery */}
      <div>
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream-100">
          <Image
            src={product.images[activeImage].src}
            alt={product.images[activeImage].alt}
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
            priority
          />
        </div>

        {product.images.length > 1 && (
          <div className="mt-3 flex gap-3">
            {product.images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setActiveImage(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === activeImage}
                className={`relative aspect-square w-20 overflow-hidden rounded-xl ring-2 transition-colors ${
                  i === activeImage ? "ring-plum-600" : "ring-transparent hover:ring-plum-200"
                }`}
              >
                <Image src={img.src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buy box */}
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-plum-600 uppercase">
          {product.colour}
        </p>
        <h1 className="mt-2 text-4xl leading-tight font-semibold text-plum-900 sm:text-5xl">
          {product.name}
        </h1>
        <p className="mt-2 text-base text-ink-soft">{product.subtitle}</p>

        <div className="mt-5 flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-semibold text-ink">{formatINR(variant.pricePaise)}</span>
          {variant.comparePricePaise && (
            <>
              <span className="text-lg text-ink-soft line-through">
                {formatINR(variant.comparePricePaise)}
              </span>
              <span className="rounded-full bg-plum-100 px-2.5 py-1 text-xs font-semibold text-plum-800">
                Save {formatINR(saving)}
              </span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-ink-soft">Inclusive of all taxes</p>

        {/* Size picker, only when there is a choice to make. A radio group with
            one option is noise. */}
        {product.variants.length > 1 ? (
        <fieldset className="mt-7">
          <legend className="text-sm font-semibold text-ink">Choose a size</legend>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {product.variants.map((v) => {
              const selected = v.id === variant.id;
              return (
                <label
                  key={v.id}
                  className={`cursor-pointer rounded-xl border-2 px-3 py-3 text-center transition-colors ${
                    selected
                      ? "border-plum-600 bg-plum-50"
                      : "border-plum-100 bg-white hover:border-plum-300"
                  } ${v.inStock ? "" : "cursor-not-allowed opacity-40"}`}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={selected}
                    disabled={!v.inStock}
                    onChange={() => setVariantId(v.id)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-ink">{v.heightCm} cm</span>
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    {formatINR(v.pricePaise)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        ) : (
          <p className="mt-6 text-sm text-ink-soft">
            <span className="font-medium text-ink">{variant.name}</span> · one size, the only one
            we make
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!variant.inStock}
            className="flex-1 rounded-full bg-plum-800 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-900 disabled:cursor-not-allowed disabled:bg-plum-300"
          >
            {justAdded ? "Added to cart" : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!variant.inStock}
            className="flex-1 rounded-full px-6 py-3.5 text-sm font-semibold text-plum-800 ring-1 ring-plum-300 transition-colors hover:bg-plum-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now
          </button>
        </div>

        <p aria-live="polite" className="sr-only">
          {justAdded ? `${product.name}, ${variant.name}, added to cart` : ""}
        </p>

        {justAdded && (
          <p className="mt-3 text-sm text-plum-700">
            Added.{" "}
            <Link href="/cart" className="font-semibold underline underline-offset-4">
              Go to cart
            </Link>
          </p>
        )}

        <PincodeCheck subtotalPaise={variant.pricePaise} />

        <div className="mt-8 border-t border-plum-100 pt-6">
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink-soft">
            {product.description}
          </p>
          <ul className="mt-5 space-y-2.5">
            {product.highlights.map((h) => (
              <li key={h} className="flex gap-2.5 text-sm text-ink">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-plum-400" />
                {h}
              </li>
            ))}
          </ul>

          <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-ink-soft">Height</dt>
              <dd className="font-medium text-ink">{variant.heightCm} cm with stem</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Weight</dt>
              <dd className="font-medium text-ink">{variant.weightGrams} g</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Material</dt>
              <dd className="font-medium text-ink">Velvet plush, PP cotton fill</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Care</dt>
              <dd className="font-medium text-ink">Spot clean only</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
