import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${site.legalName} collects, uses and protects your personal information.`,
};

export default function PrivacyPage() {
  return (
    <Prose
      title="Privacy policy"
      intro="What we collect, why we collect it, and what we never do with it."
    >
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Order details:</strong> your name, email, phone number and delivery address. We
          need these to take payment and to get the parcel to you.
        </li>
        <li>
          <strong>Gift messages:</strong> if you write one, we store it until the order ships so we
          can print the card.
        </li>
        <li>
          <strong>Payment references:</strong> the Razorpay order and payment ids for your
          transaction. We do <strong>not</strong> receive or store your card number, CVV, UPI PIN
          or netbanking password. Those go directly to Razorpay.
        </li>
      </ul>

      <h2>What we do with it</h2>
      <ul>
        <li>Process, pack and deliver your order.</li>
        <li>Send you order confirmations and tracking updates.</li>
        <li>Answer your questions when you contact support.</li>
        <li>Meet our tax and accounting obligations.</li>
      </ul>
      <p>
        We do not send marketing email unless you ask us to, and{" "}
        <strong>we never sell or rent your data to anyone.</strong>
      </p>

      <h2>Who we share it with</h2>
      <p>Only the parties who need it to complete your order:</p>
      <ul>
        <li>
          <strong>Razorpay</strong>, to process your payment, under their own privacy policy.
        </li>
        <li>
          <strong>Courier partners</strong>, who receive your name, address and phone number so
          they can deliver and call you if they cannot find the address.
        </li>
        <li>
          <strong>Government authorities</strong>, where we are legally required to disclose.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        This site sets a small number of cookies and uses your browser&rsquo;s local storage. Your
        cart is kept in local storage so it survives a page reload. A session cookie is set only if
        you sign in to the shop admin. We do not run third-party advertising or tracking cookies.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Order records are retained for as long as tax law requires, currently eight years. Gift
        messages are deleted once the order is delivered.
      </p>

      <h2>Security</h2>
      <p>
        The site runs over HTTPS. Payment credentials never touch our servers. Access to the order
        database is limited to the people who pack and dispatch orders.
      </p>

      <h2>Your rights</h2>
      <p>
        Write to <a href={`mailto:${site.email}`}>{site.email}</a> to see what we hold about you,
        correct it, or ask us to delete it. We will respond within 30 days. We may need to keep
        order records that tax law requires us to retain, and we will tell you if that applies.
      </p>

      <h2>Children</h2>
      <p>
        This shop is intended for adults. We do not knowingly collect information from children
        under 18.
      </p>

      <h2>Contact</h2>
      <p>
        {site.legalName}, {site.address.line1}, {site.address.city}, {site.address.state}{" "}
        {site.address.pincode}. Email <a href={`mailto:${site.email}`}>{site.email}</a>, phone{" "}
        {site.phone}.
      </p>
    </Prose>
  );
}
