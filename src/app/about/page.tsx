import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our story",
  description: `${site.legalName} makes giant plush roses that never wilt. Packed and shipped by hand from Delhi.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="text-5xl font-semibold text-plum-900">Our story</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
        Petalora started with a simple annoyance: a bouquet costs a small fortune and is in the bin
        by Thursday.
      </p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:items-center">
        <div className="relative aspect-4/5 overflow-hidden rounded-3xl">
          <Image
            src="/products/rose-pink-lifestyle.jpeg"
            alt="Blush pink plush rose belted into a car seat at dusk"
            fill
            sizes="(max-width: 640px) 90vw, 400px"
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-5 text-[15px] leading-relaxed text-ink-soft">
          <p>
            We wanted to make the version you keep. Something that carries the same meaning as a
            rose but is still on the bed a year later, a bit squashed and a lot loved.
          </p>
          <p>
            So we found velvet plush soft enough to sleep on, a stem you can actually bend, and a
            bloom big enough that handing it over is an event. Then we spent a long time on the
            unglamorous part: filling that holds its shape, seams that survive being hugged, and a
            box that arrives in one piece after four days on a truck.
          </p>
          <p>
            Everything is checked, wrapped and packed by hand at our studio in{" "}
            {site.dispatch.origin}, then sent out across India. When you message us, you are
            messaging the people who packed your box.
          </p>
        </div>
      </div>

      <section className="mt-16 grid gap-6 sm:grid-cols-3">
        {[
          {
            t: "We pick every piece",
            d: "Each rose is inspected for seams, shade and fill before it goes in a box. The ones that do not pass do not ship.",
          },
            {
            t: "We ship fast",
            d: `Out of ${site.dispatch.origin} in ${site.dispatch.processingDays}, because a gift that arrives after the occasion is not a gift.`,
          },
          {
            t: "We answer",
            d: "Email, phone or WhatsApp. No ticket numbers, no chatbot loops.",
          },
        ].map((item) => (
          <div key={item.t} className="rounded-2xl bg-cream-100 p-6">
            <h2 className="font-display text-xl font-semibold text-plum-900">{item.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.d}</p>
          </div>
        ))}
      </section>

      <div className="mt-14 text-center">
        <Link
          href="/shop"
          className="inline-block rounded-full bg-plum-800 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-900"
        >
          See the collection
        </Link>
      </div>
    </div>
  );
}
