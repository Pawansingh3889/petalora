import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with ${site.legalName}. Email, phone, WhatsApp and our Delhi address.`,
};

export default function ContactPage() {
  return (
    <Prose title="Contact us" intro="A real person reads every message. Usually within a day.">
      <div className="grid gap-4 sm:grid-cols-2">
        <ContactCard
          label="Email"
          value={site.email}
          href={`mailto:${site.email}`}
          note="Best for order issues. Include your order number."
        />
        <ContactCard
          label="WhatsApp"
          value={site.phone}
          href={whatsappLink("Hi Petalora, I have a question about")}
          note="Fastest for a quick question."
        />
        <ContactCard
          label="Phone"
          value={site.phone}
          href={`tel:${site.phone.replace(/\s/g, "")}`}
          note="Mon to Sat, 10 AM to 7 PM IST."
        />
        <ContactCard
          label="Instagram"
          value="@petalora"
          href={site.instagram}
          note="New colours and drops go here first."
        />
      </div>

      <h2>Our address</h2>
      <address className="text-ink-soft not-italic">
        {site.legalName}
        <br />
        {site.address.line1}
        <br />
        {site.address.line2}
        <br />
        {site.address.city}, {site.address.state} {site.address.pincode}
        <br />
        {site.address.country}
      </address>
      <p>
        This is our packing studio, not a retail shop, so please write before visiting.
      </p>

      <h2>Order questions</h2>
      <p>
        If you already have an order number, the quickest route is{" "}
        <a href="/track">order tracking</a>. It shows live status and the courier tracking number
        as soon as your parcel is dispatched.
      </p>

      <h2>Bulk and corporate orders</h2>
      <p>
        We take bulk orders for weddings, corporate gifting and resale. Email us with quantities,
        colours and your delivery city and we will send a quote within two working days.
      </p>
    </Prose>
  );
}

function ContactCard({
  label,
  value,
  href,
  note,
}: {
  label: string;
  value: string;
  href: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl bg-cream-100 p-5">
      <p className="text-xs font-semibold tracking-wide text-plum-600 uppercase">{label}</p>
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className="mt-1 block font-medium text-plum-800 underline underline-offset-4"
      >
        {value}
      </a>
      <p className="mt-1.5 text-sm text-ink-soft">{note}</p>
    </div>
  );
}
