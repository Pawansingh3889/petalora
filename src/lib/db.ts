import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Data access for Cloudflare D1.
 *
 * This talks to D1 directly rather than through Prisma. That is a deliberate
 * choice for this deployment target, not a shortcut:
 *
 *   - Prisma on Workers needs its 2.2 MB WebAssembly query engine bundled into
 *     the Worker. The Workers free plan caps a script at 3 MB compressed, and
 *     a Next.js server bundle plus that engine does not comfortably fit.
 *   - Prisma's `@prisma/client` wrapper resolves to the native Node engine
 *     under this bundler regardless of the `workerd` export condition, which
 *     fails at runtime with a missing-engine error.
 *   - The whole query surface of this shop is the eight functions below.
 *
 * Every statement is prepared and bound. No value is ever interpolated into
 * SQL text, including in the dynamic UPDATE builder, which whitelists column
 * names rather than accepting them from a caller.
 *
 * Money is INTEGER paise. Timestamps are ISO 8601 strings in UTC.
 */

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED";

export type PaymentMethod = "RAZORPAY" | "COD";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "FAILED",
  "REFUNDED",
];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export type OrderItemRow = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  imageUrl: string;
  unitPaise: number;
  quantity: number;
};

export type OrderRow = {
  id: string;
  number: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  email: string;
  phone: string;
  name: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  couponCode: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  courier: string | null;
  trackingNumber: string | null;
  notes: string | null;
  giftMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderWithItems = OrderRow & { items: OrderItemRow[] };

/**
 * The D1 binding, which only exists inside a request. Locally this is a
 * Miniflare-backed database wired up by initOpenNextCloudflareForDev().
 */
async function d1(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) {
    throw new Error(
      "D1 binding `DB` is missing. Check d1_databases in wrangler.jsonc, and run " +
        "`pnpm d1:migrate:local` at least once so the local database exists.",
    );
  }
  return env.DB;
}

function now(): string {
  return new Date().toISOString();
}

/**
 * Next readable order number, e.g. PTL-1042.
 *
 * One atomic statement: the upsert increments and returns in the same round
 * trip, so two checkouts landing together cannot read the same value. Starts
 * at 1001 so the first order is not PTL-1.
 */
export async function nextOrderNumber(): Promise<string> {
  const db = await d1();
  const row = await db
    .prepare(
      `INSERT INTO Counter (name, value) VALUES ('order', 1001)
       ON CONFLICT(name) DO UPDATE SET value = value + 1
       RETURNING value`,
    )
    .first<{ value: number }>();

  if (!row) throw new Error("Failed to allocate an order number");
  return `PTL-${row.value}`;
}

export type NewOrder = {
  number: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  giftMessage: string | null;
  subtotalPaise: number;
  shippingPaise: number;
  totalPaise: number;
  items: Omit<OrderItemRow, "id" | "orderId">[];
};

/**
 * Writes the order and its lines. D1's batch() runs the statements in one
 * implicit transaction, so a failure part way cannot leave an order with only
 * some of its items.
 */
export async function createOrder(input: NewOrder): Promise<{ id: string; number: string }> {
  const db = await d1();
  // randomUUID is unguessable, which matters: the confirmation URL is keyed on
  // this id and shows a full delivery address.
  const id = crypto.randomUUID();
  const timestamp = now();

  const orderStmt = db
    .prepare(
      `INSERT INTO "Order" (
         id, number, status, paymentMethod, email, phone, name,
         addressLine1, addressLine2, landmark, city, state, pincode,
         subtotalPaise, shippingPaise, discountPaise, totalPaise,
         giftMessage, createdAt, updatedAt
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.number,
      input.status,
      input.paymentMethod,
      input.email,
      input.phone,
      input.name,
      input.addressLine1,
      input.addressLine2,
      input.landmark,
      input.city,
      input.state,
      input.pincode,
      input.subtotalPaise,
      input.shippingPaise,
      input.totalPaise,
      input.giftMessage,
      timestamp,
      timestamp,
    );

  const itemStmts = input.items.map((item) =>
    db
      .prepare(
        `INSERT INTO OrderItem (
           id, orderId, productId, productName, variantId, variantName,
           imageUrl, unitPaise, quantity
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        id,
        item.productId,
        item.productName,
        item.variantId,
        item.variantName,
        item.imageUrl,
        item.unitPaise,
        item.quantity,
      ),
  );

  await db.batch([orderStmt, ...itemStmts]);
  return { id, number: input.number };
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const db = await d1();
  const order = await db
    .prepare(`SELECT * FROM "Order" WHERE id = ?`)
    .bind(id)
    .first<OrderRow>();
  if (!order) return null;

  const items = await db
    .prepare(`SELECT * FROM OrderItem WHERE orderId = ?`)
    .bind(id)
    .all<OrderItemRow>();

  return { ...order, items: items.results };
}

export async function getOrderByNumber(number: string): Promise<OrderRow | null> {
  const db = await d1();
  return db.prepare(`SELECT * FROM "Order" WHERE number = ?`).bind(number).first<OrderRow>();
}

export async function getOrderByRazorpayOrderId(
  razorpayOrderId: string,
): Promise<OrderRow | null> {
  const db = await d1();
  return db
    .prepare(`SELECT * FROM "Order" WHERE razorpayOrderId = ?`)
    .bind(razorpayOrderId)
    .first<OrderRow>();
}

/** Columns an update is allowed to touch. Anything else is a programming error. */
const UPDATABLE = [
  "status",
  "razorpayOrderId",
  "razorpayPaymentId",
  "razorpaySignature",
  "courier",
  "trackingNumber",
  "notes",
] as const;

export type OrderPatch = Partial<{
  status: OrderStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  courier: string | null;
  trackingNumber: string | null;
  notes: string | null;
}>;

export async function updateOrder(id: string, patch: OrderPatch): Promise<void> {
  const columns = UPDATABLE.filter((c) => c in patch);
  if (columns.length === 0) return;

  const db = await d1();
  // Column names come from the UPDATABLE whitelist, never from the caller's
  // key strings, so this cannot be turned into injected SQL. Values are bound.
  const assignments = columns.map((c) => `${c} = ?`).join(", ");
  const values = columns.map((c) => patch[c] ?? null);

  await db
    .prepare(`UPDATE "Order" SET ${assignments}, updatedAt = ? WHERE id = ?`)
    .bind(...values, now(), id)
    .run();
}

/** Admin order book, newest first, with lines joined in. */
export async function listOrders(limit = 200): Promise<OrderWithItems[]> {
  const db = await d1();
  const orders = await db
    .prepare(`SELECT * FROM "Order" ORDER BY createdAt DESC LIMIT ?`)
    .bind(limit)
    .all<OrderRow>();

  if (orders.results.length === 0) return [];

  // One query for every line belonging to the page of orders we just read,
  // rather than one query per order.
  const ids = orders.results.map((o) => o.id);
  const placeholders = ids.map(() => "?").join(", ");
  const items = await db
    .prepare(`SELECT * FROM OrderItem WHERE orderId IN (${placeholders})`)
    .bind(...ids)
    .all<OrderItemRow>();

  const byOrder = new Map<string, OrderItemRow[]>();
  for (const item of items.results) {
    const list = byOrder.get(item.orderId);
    if (list) list.push(item);
    else byOrder.set(item.orderId, [item]);
  }

  return orders.results.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] }));
}
