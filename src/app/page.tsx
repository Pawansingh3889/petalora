import Link from "next/link";
import Image from "next/image";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/shipping";
import { site } from "@/lib/site";

export default function HomePage() {
  const featured = products.filter((p) => p.featured);

  return (
    <>
      <Hero />
      <TrustStrip />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="collection">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-plum-600 uppercase">
              The collection
            </p>
            <h2 id="collection" className="mt-2 text-4xl font-semibold text-plum-900">
              Roses that never wilt
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-sm font-medium text-plum-700 underline underline-offset-4 hover:text-plum-900"
          >
            View all
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 2} />
          ))}
        </div>
      </section>

      <WhyPetalora />
      <GiftingCta />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-plum-50 to-cream-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-plum-600 uppercase">
            Handpicked plush · Delhi
          </p>
          <h1 className="mt-4 text-5xl leading-[1.05] font-semibold text-plum-900 sm:text-6xl">
            A rose she keeps
            <span className="block text-plum-600 italic">long after the flowers go.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg">
            Giant velvet plush roses with a bendable stem. Soft enough to sleep on, striking
            enough to gift. No water, no wilting, no petals on the floor.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-plum-800 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-900"
            >
              Shop the collection
            </Link>
            <Link
              href="/product/plush-rose-classic-red"
              className="rounded-full px-6 py-3.5 text-sm font-semibold text-plum-800 ring-1 ring-plum-300 transition-colors hover:bg-plum-50"
            >
              The Classic Red
            </Link>
          </div>

          <p className="mt-6 text-sm text-ink-soft">
            Free delivery above {formatINR(FREE_SHIPPING_THRESHOLD_PAISE)} · Ships from{" "}
            {site.dispatch.origin} in {site.dispatch.processingDays}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="relative aspect-3/4 overflow-hidden rounded-3xl">
            <Image
              src="/products/rose-red-lifestyle.jpeg"
              alt="Red plush rose belted into a car seat at dusk"
              fill
              sizes="(max-width: 1024px) 45vw, 300px"
              className="object-cover"
              priority
            />
          </div>
          <div className="relative mt-8 aspect-3/4 overflow-hidden rounded-3xl">
            <Image
              src="/products/rose-pink-lifestyle.jpeg"
              alt="Blush pink plush rose belted into a car seat at dusk"
              fill
              sizes="(max-width: 1024px) 45vw, 300px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const TRUST = [
  { title: "Never wilts", body: "Velvet plush, not fresh cut. It looks the same in a year." },
  { title: "Ships from Delhi", body: "Same-day dispatch on orders before 2 PM, pan-India delivery." },
  { title: "Pay your way", body: "UPI, cards, netbanking, wallets or cash on delivery." },
  { title: "Gift ready", body: "Arrives in a Petalora sleeve with a blank message card." },
];

function TrustStrip() {
  return (
    <section className="border-y border-plum-100 bg-white">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-7 px-4 py-9 sm:px-6 lg:grid-cols-4">
        {TRUST.map((item) => (
          <li key={item.title}>
            <p className="font-display text-lg font-semibold text-plum-900">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WhyPetalora() {
  return (
    <section className="bg-plum-50">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-square overflow-hidden rounded-3xl">
          <Image
            src="/products/rose-pink.jpeg"
            alt="Blush pink plush rose with a green padded stem"
            fill
            sizes="(max-width: 1024px) 90vw, 500px"
            className="object-contain"
          />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-plum-600 uppercase">
            Why Petalora
          </p>
          <h2 className="mt-3 text-4xl font-semibold text-plum-900">
            Built to be hugged, not just looked at
          </h2>
          <dl className="mt-7 space-y-5">
            {[
              {
                t: "Skin-friendly velvet",
                d: "Short-pile velvet plush that does not shed. Safe against skin and safe for kids over three.",
              },
              {
                t: "A stem that bends",
                d: "The padded stem holds a shape. Curl it round a headboard, a car seat or an arm.",
              },
              {
                t: "Filled to hold shape",
                d: "Hypoallergenic PP cotton, packed firm enough that the bloom does not flatten under weight.",
              },
              {
                t: "Spot clean in seconds",
                d: "A damp cloth and mild soap. No dry cleaning, no special care.",
              },
            ].map((row) => (
              <div key={row.t}>
                <dt className="font-semibold text-ink">{row.t}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{row.d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function GiftingCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl bg-plum-800 px-6 py-14 text-center sm:px-12">
        <h2 className="font-display text-4xl font-semibold text-white">Gifting something?</h2>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-plum-100">
          Add a message at checkout and we will write it on a card and tuck it inside the box.
          No invoice goes in the parcel, so the price stays between us.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-plum-900 transition-colors hover:bg-cream-100"
        >
          Choose a rose
        </Link>
      </div>
    </section>
  );
}
