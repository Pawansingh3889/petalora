import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Returns and refunds",
  description: `Petalora accepts returns within ${site.returnWindowDays} days for damaged, defective or wrong items. How to raise a claim and how refunds are processed.`,
};

export default function ReturnsPage() {
  return (
    <Prose
      title="Returns and refunds"
      intro="If something arrives damaged, defective or simply wrong, we will make it right."
    >
      <h2>The window</h2>
      <p>
        You have <strong>{site.returnWindowDays} days from delivery</strong> to raise a return or
        replacement request. After that we can usually still help, but we cannot promise a refund.
      </p>

      <h2>What we accept</h2>
      <ul>
        <li>The item arrived damaged, stained or torn.</li>
        <li>You received the wrong colour, size or product.</li>
        <li>The parcel was missing an item you paid for.</li>
        <li>The item is manufacturing defective, for example a split seam or loose stem wire.</li>
      </ul>

      <h2>What we cannot accept</h2>
      <ul>
        <li>Items that have been used, washed or are no longer in saleable condition.</li>
        <li>Returns raised after {site.returnWindowDays} days from delivery.</li>
        <li>
          Minor variation in shade between the photographs and the item. Screens differ and dye
          lots differ slightly. This is not a defect.
        </li>
        <li>
          Plush that looks flat straight out of the box. It compresses in transit and recovers
          within a few hours.
        </li>
        <li>Personalised or custom-assembled gift sets, unless they are damaged or defective.</li>
      </ul>

      <h2>How to raise a claim</h2>
      <ol className="list-decimal space-y-2 pl-5 text-ink-soft">
        <li>
          Email <a href={`mailto:${site.email}`}>{site.email}</a> or WhatsApp us within{" "}
          {site.returnWindowDays} days of delivery.
        </li>
        <li>Include your order number and photographs of the item and the outer packaging.</li>
        <li>
          We respond within 2 working days with either a replacement, a refund, or a pickup
          arrangement.
        </li>
      </ol>
      <p>
        Please keep the original packaging until the claim is settled. An unopened-box photo is
        often what settles a transit damage claim with the courier.
      </p>

      <h2>Refunds</h2>
      <p>
        Approved refunds are issued to the original payment method through Razorpay. We initiate
        within <strong>2 working days</strong> of approving the claim, and the money reaches your
        account in <strong>5 to 7 working days</strong> after that, depending on your bank. UPI
        refunds are usually faster than card refunds.
      </p>
      <p>
        For cash on delivery orders we refund by UPI or bank transfer to an account in the name of
        the person who placed the order. We will ask you for those details when the claim is
        approved.
      </p>
      <p>
        Where a return is our fault, we pay the return shipping. Where you have changed your mind
        and we have agreed to accept the return as a goodwill exception, the outbound and return
        shipping charges are deducted from the refund.
      </p>

      <h2>Cancellations</h2>
      <p>
        You can cancel free of charge any time before the order is dispatched. Email us with your
        order number and we will refund in full. Once the parcel is with the courier we cannot
        cancel it, but you can refuse delivery and raise a return once it comes back to us.
      </p>

      <h2>Still stuck?</h2>
      <p>
        Write to <a href={`mailto:${site.email}`}>{site.email}</a> or call {site.phone}. A real
        person reads every message.
      </p>
    </Prose>
  );
}
