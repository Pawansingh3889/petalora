import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: `The terms on which ${site.legalName} sells through this website.`,
};

export default function TermsPage() {
  return (
    <Prose
      title="Terms and conditions"
      intro={`These terms govern your use of this website and any order you place with ${site.legalName}.`}
    >
      <p>
        By placing an order you accept these terms. If you do not accept them, please do not order.
      </p>

      <h2>Who we are</h2>
      <p>
        {site.legalName}, {site.address.line1}, {site.address.city}, {site.address.state}{" "}
        {site.address.pincode}, {site.address.country}. Contact:{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>, {site.phone}.
      </p>

      <h2>Products and pricing</h2>
      <ul>
        <li>
          All prices are in Indian Rupees and include applicable taxes. Shipping is shown
          separately at checkout.
        </li>
        <li>
          Product photographs are representative. Handmade plush varies slightly in shade, seam
          placement and stem curve between pieces.
        </li>
        <li>
          Dimensions are approximate and measured with the stem extended, with a tolerance of
          roughly two centimetres.
        </li>
        <li>
          We may change prices at any time. The price binding on an order is the price shown at the
          moment you complete payment.
        </li>
        <li>
          If a product is listed at an obviously incorrect price because of a technical error, we
          may cancel the order and refund you in full rather than fulfil it.
        </li>
      </ul>

      <h2>Orders</h2>
      <p>
        Your order is an offer to buy. It is accepted when we confirm it, and we may decline an
        order where the item is out of stock, the address is not serviceable, the payment is
        flagged, or we reasonably suspect fraud or resale. Where we decline after payment, we
        refund in full.
      </p>

      <h2>Payment</h2>
      <p>
        Online payments are processed by Razorpay Software Private Limited. We never see or store
        your card number, UPI PIN or netbanking credentials. Cash on delivery is available on
        selected PIN codes and order values, with the handling fee shown at checkout.
      </p>

      <h2>Delivery</h2>
      <p>
        See our <a href="/shipping">shipping policy</a>. Delivery timelines are estimates provided
        by our courier partners and are not guaranteed. Risk in the goods passes to you on
        delivery.
      </p>

      <h2>Returns</h2>
      <p>
        See our <a href="/returns">returns and refunds policy</a>, which forms part of these terms.
      </p>

      <h2>Age and intended use</h2>
      <p>
        Our plush is intended for ages three and above. It is a decorative and comfort item, not
        safety equipment. Do not use it as a car seat cushion, a headrest or anything that
        interferes with a seatbelt, an airbag or a driver&rsquo;s field of view. Any lifestyle
        photograph on this site showing a rose in a vehicle is a styling shot of a parked car, not
        a suggestion to travel with it.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The Petalora name, logo, photographs and site copy belong to us. You may not reproduce them
        commercially without written permission.
      </p>

      <h2>Liability</h2>
      <p>
        We are responsible for supplying goods that match their description and are of satisfactory
        quality. To the extent permitted by law, our total liability for any order is limited to
        the amount you paid for it. Nothing here limits liability for death or personal injury
        caused by our negligence, or for fraud.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of India. Disputes are subject to the exclusive
        jurisdiction of the courts at {site.address.city}.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The version that applies to your order is the one published when
        you placed it.
      </p>
    </Prose>
  );
}
