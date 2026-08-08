import type { Metadata } from "next";
import { listOrders } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import { formatINR } from "@/lib/money";
import { AdminLogin } from "./AdminLogin";
import { logout, updateOrder } from "./actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "REFUNDED",
] as const;

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-emerald-100 text-emerald-900",
  SHIPPED: "bg-sky-100 text-sky-900",
  DELIVERED: "bg-slate-200 text-slate-800",
  CANCELLED: "bg-plum-100 text-plum-900",
  FAILED: "bg-red-100 text-red-900",
  REFUNDED: "bg-plum-100 text-plum-900",
};

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLogin />;
  }

  const orders = await listOrders(200);

  // Revenue counts only money we have actually taken or will take on delivery.
  // Pending and failed orders are not sales.
  const earned = orders.filter((o) =>
    ["CONFIRMED", "SHIPPED", "DELIVERED"].includes(o.status),
  );
  const revenue = earned.reduce((sum, o) => sum + o.totalPaise, 0);
  const toShip = orders.filter((o) => o.status === "CONFIRMED").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-plum-900">Orders</h1>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-ink-soft underline underline-offset-4 hover:text-plum-700"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Orders" value={String(orders.length)} />
        <Stat label="Paid or COD" value={String(earned.length)} />
        <Stat label="To dispatch" value={String(toShip)} highlight={toShip > 0} />
        <Stat label="Revenue" value={formatINR(revenue)} />
      </div>

      {orders.length === 0 ? (
        <p className="mt-12 text-ink-soft">No orders yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <details
              key={order.id}
              className="rounded-2xl bg-white ring-1 ring-plum-100"
              open={order.status === "CONFIRMED"}
            >
              <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-4">
                <span className="font-mono text-sm font-semibold text-plum-900">
                  {order.number}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    STATUS_STYLE[order.status] ?? "bg-slate-100"
                  }`}
                >
                  {order.status}
                </span>
                <span className="text-sm text-ink">{order.name}</span>
                <span className="text-sm text-ink-soft">
                  {order.city}, {order.pincode}
                </span>
                <span className="ml-auto text-sm font-semibold text-ink">
                  {formatINR(order.totalPaise)}
                </span>
                <span className="rounded bg-cream-100 px-2 py-0.5 text-xs text-ink-soft">
                  {order.paymentMethod === "COD" ? "COD" : "Prepaid"}
                </span>
              </summary>

              <div className="grid gap-6 border-t border-plum-100 p-4 lg:grid-cols-2">
                <div>
                  <h2 className="text-sm font-semibold text-ink">Ship to</h2>
                  <address className="mt-1.5 text-sm leading-relaxed text-ink-soft not-italic">
                    {order.name}
                    <br />
                    {order.addressLine1}
                    {order.addressLine2 && (
                      <>
                        <br />
                        {order.addressLine2}
                      </>
                    )}
                    {order.landmark && (
                      <>
                        <br />
                        Near {order.landmark}
                      </>
                    )}
                    <br />
                    {order.city}, {order.state} {order.pincode}
                    <br />
                    {order.phone} · {order.email}
                  </address>

                  <h2 className="mt-4 text-sm font-semibold text-ink">Items</h2>
                  <ul className="mt-1.5 space-y-1 text-sm text-ink-soft">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity} × {item.productName} ({item.variantName}) ={" "}
                        {formatINR(item.unitPaise * item.quantity)}
                      </li>
                    ))}
                  </ul>

                  {order.giftMessage && (
                    <>
                      <h2 className="mt-4 text-sm font-semibold text-ink">Gift card message</h2>
                      <p className="mt-1 rounded-lg bg-cream-100 p-3 text-sm text-ink italic">
                        {order.giftMessage}
                      </p>
                    </>
                  )}

                  {order.razorpayPaymentId && (
                    <p className="mt-4 font-mono text-xs text-ink-soft">
                      {order.razorpayPaymentId}
                    </p>
                  )}
                  {order.notes && (
                    <p className="mt-2 text-xs text-plum-700">Note: {order.notes}</p>
                  )}
                </div>

                <form action={updateOrder} className="space-y-3">
                  <input type="hidden" name="id" value={order.id} />

                  <div>
                    <label
                      htmlFor={`status-${order.id}`}
                      className="block text-sm font-medium text-ink"
                    >
                      Status
                    </label>
                    <select
                      id={`status-${order.id}`}
                      name="status"
                      defaultValue={order.status}
                      className="mt-1 w-full rounded-lg border border-plum-200 bg-white px-3 py-2 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor={`courier-${order.id}`}
                        className="block text-sm font-medium text-ink"
                      >
                        Courier
                      </label>
                      <input
                        id={`courier-${order.id}`}
                        name="courier"
                        defaultValue={order.courier ?? ""}
                        placeholder="Delhivery"
                        className="mt-1 w-full rounded-lg border border-plum-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor={`tracking-${order.id}`}
                        className="block text-sm font-medium text-ink"
                      >
                        Tracking number
                      </label>
                      <input
                        id={`tracking-${order.id}`}
                        name="trackingNumber"
                        defaultValue={order.trackingNumber ?? ""}
                        className="mt-1 w-full rounded-lg border border-plum-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="rounded-full bg-plum-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-plum-900"
                  >
                    Save
                  </button>

                  <p className="text-xs text-ink-soft">
                    Placed{" "}
                    {new Date(order.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </form>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-plum-100" : "bg-cream-100"}`}>
      <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-plum-900">{value}</p>
    </div>
  );
}
