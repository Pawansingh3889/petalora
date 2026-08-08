import type { Metadata } from "next";
import { Prose } from "@/components/Prose";
import { formatINR } from "@/lib/money";
import { FREE_SHIPPING_THRESHOLD_PAISE, COD_FEE_PAISE, rateCard } from "@/lib/shipping";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping and delivery",
  description:
    "Petalora ships across India from Delhi. Rates, delivery timelines and dispatch cut-offs.",
};

export default function ShippingPage() {
  const rates = rateCard();

  return (
    <Prose
      title="Shipping and delivery"
      intro={`Everything ships from our studio in ${site.dispatch.origin} to anywhere in India.`}
    >
      <h2>Dispatch</h2>
      <p>
        Orders placed before <strong>{site.dispatch.sameDayCutoffLabel}</strong> on a working day
        are packed and handed to the courier the same day. Everything else goes out the next
        working day. We do not dispatch on Sundays or national holidays.
      </p>
      <p>
        Once your parcel leaves us you will get the courier name and tracking number by email, and
        it will also show on your{" "}
        <a href="/track">order tracking page</a>.
      </p>

      <h2>Rates and timelines</h2>
      <p>
        Free delivery on every prepaid or COD order above{" "}
        <strong>{formatINR(FREE_SHIPPING_THRESHOLD_PAISE)}</strong>, except to the remote zone
        below. Delivery estimates start from the dispatch date, not the order date.
      </p>

      <div className="overflow-x-auto">
        <table className="mt-4 w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-plum-200">
              <th className="py-2 pr-4 font-semibold text-ink">Zone</th>
              <th className="py-2 pr-4 font-semibold text-ink">Charge</th>
              <th className="py-2 font-semibold text-ink">Estimated delivery</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            {rates.map((rate) => (
              <tr key={rate.zone} className="border-b border-plum-100">
                <td className="py-2.5 pr-4">{rate.label}</td>
                <td className="py-2.5 pr-4">{formatINR(rate.paise)}</td>
                <td className="py-2.5">{rate.etaDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Cash on delivery</h2>
      <p>
        COD is available on most mainland PIN codes for orders up to a set value, with a{" "}
        {formatINR(COD_FEE_PAISE)} handling fee. It is not offered to the remote zone, where the
        return leg costs more than the order. If COD is unavailable for your address the option
        will be greyed out at checkout.
      </p>

      <h2>Packaging</h2>
      <p>
        Every rose ships in a Petalora sleeve inside a corrugated outer box. Plush is compressible,
        so parcels can look smaller than the finished product: give the bloom a shake and it
        returns to shape within an hour.
      </p>
      <p>
        Gift orders never include a printed invoice. If you added a gift message we write it on a
        card and place it inside the box.
      </p>

      <h2>Delays outside our control</h2>
      <p>
        Courier networks slow down during festivals, elections, strikes and extreme weather. We
        will keep you updated by email if your parcel is caught in one, but the timelines above are
        estimates from the courier, not guarantees.
      </p>

      <h2>Wrong or incomplete address</h2>
      <p>
        Please double-check the PIN code and phone number at checkout. If a parcel is returned to
        us because the address was wrong or nobody was reachable, we can re-ship it once you pay
        the return and re-delivery charge. Write to{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> as soon as you spot a mistake and we will
        try to correct it before dispatch.
      </p>

      <h2>International</h2>
      <p>We currently ship within India only.</p>
    </Prose>
  );
}
