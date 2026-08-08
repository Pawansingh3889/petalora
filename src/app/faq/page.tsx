import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_PAISE } from "@/lib/shipping";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Common questions about Petalora plush roses, sizes, care, delivery and payment.",
};

const FAQS = [
  {
    q: "Is this a real flower?",
    a: "No, and that is the point. It is a soft toy shaped like a rose, made from velvet plush with a padded bendable stem. It never needs water and never wilts.",
  },
  {
    q: "How big is it really?",
    a: "About 100 cm from the tip of the bloom to the end of the stem. For scale, that is roughly the height of a three-year-old, and the bloom itself is about the size of a dinner plate. We make one size.",
  },
  {
    q: "It arrived looking flat. Is it defective?",
    a: "Almost certainly not. Plush is compressed to fit the box. Shake the bloom out, separate the petals with your hands and leave it for an hour or two. It fills back out on its own.",
  },
  {
    q: "Can I wash it?",
    a: "Spot clean only, with a damp cloth and a little mild soap, then air dry. Do not put it in a washing machine or a dryer: the fill will clump and the stem wire can rust.",
  },
  {
    q: "Is it safe for children?",
    a: "It is suitable for ages three and above. It contains a bendable wire stem, so it is not a toy for babies or toddlers who chew.",
  },
  {
    q: "Do you deliver to my city?",
    a: "We deliver to every serviceable PIN code in India. Enter yours on any product page to see the exact charge and timeline before you buy.",
  },
  {
    q: "How much is delivery?",
    a: `Free above ${formatINR(FREE_SHIPPING_THRESHOLD_PAISE)} on mainland addresses. Below that it is a flat charge by zone, shown on the shipping policy page and again at checkout.`,
  },
  {
    q: "How fast will it arrive?",
    a: `We dispatch from ${site.dispatch.origin} within ${site.dispatch.processingDays}. After that it is 1 to 2 days in Delhi NCR, 3 to 6 days for the rest of mainland India, and up to 10 days for the Northeast and the islands.`,
  },
  {
    q: "Can I pay cash on delivery?",
    a: "Yes on most mainland PIN codes, with a small handling fee. It is not available for remote zones or high-value orders. The option will show at checkout if your address qualifies.",
  },
  {
    q: "Is online payment safe?",
    a: "Payments run through Razorpay, which handles UPI, cards, netbanking and wallets. Your card and UPI details go straight to them and never touch our servers.",
  },
  {
    q: "Will the price be visible in the parcel?",
    a: "No. We never put a printed invoice in the box. If you add a gift message we write it on a card and tuck it inside.",
  },
  {
    q: "Can I order in bulk for a wedding or my company?",
    a: `Yes. Email ${site.email} with quantities, colours and your delivery city and we will send a quote within two working days.`,
  },
];

export default function FaqPage() {
  // FAQPage structured data, so these can appear as expandable answers in
  // Google results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Prose title="Questions, answered" intro="If yours is not here, just ask.">
        <dl className="space-y-6">
          {FAQS.map((item) => (
            <div key={item.q} className="border-b border-plum-100 pb-6 last:border-0">
              <dt className="font-display text-xl font-semibold text-plum-900">{item.q}</dt>
              <dd className="mt-2 text-ink-soft">{item.a}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8">
          Still stuck? Email <a href={`mailto:${site.email}`}>{site.email}</a> or{" "}
          <a href="/contact">get in touch</a>.
        </p>
      </Prose>
    </>
  );
}
