-- Petalora schema, Cloudflare D1 (SQLite).
--
-- Money is INTEGER paise throughout. Never store currency as a float.
-- Timestamps are ISO 8601 strings in UTC, written by the application.
--
-- Apply with:
--   pnpm d1:migrate:local     (development)
--   pnpm d1:migrate:remote    (production)

CREATE TABLE "Order" (
    id            TEXT NOT NULL PRIMARY KEY,   -- random UUID, used in the public order URL
    number        TEXT NOT NULL,               -- human-facing, e.g. PTL-1042

    status        TEXT NOT NULL DEFAULT 'PENDING',
    paymentMethod TEXT NOT NULL,

    -- Customer
    email         TEXT NOT NULL,
    phone         TEXT NOT NULL,
    name          TEXT NOT NULL,

    -- Shipping address. India only, dispatched from Delhi.
    addressLine1  TEXT NOT NULL,
    addressLine2  TEXT,
    landmark      TEXT,
    city          TEXT NOT NULL,
    state         TEXT NOT NULL,
    pincode       TEXT NOT NULL,

    -- Amounts in paise. 49900 == Rs 499.00
    subtotalPaise INTEGER NOT NULL,
    shippingPaise INTEGER NOT NULL,
    discountPaise INTEGER NOT NULL DEFAULT 0,
    totalPaise    INTEGER NOT NULL,
    couponCode    TEXT,

    -- Razorpay linkage
    razorpayOrderId   TEXT,
    razorpayPaymentId TEXT,
    razorpaySignature TEXT,

    -- Fulfilment
    courier        TEXT,
    trackingNumber TEXT,
    notes          TEXT,
    giftMessage    TEXT,

    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);

CREATE TABLE OrderItem (
    id          TEXT NOT NULL PRIMARY KEY,
    orderId     TEXT NOT NULL,

    -- Denormalised on purpose: an order line must keep the name, variant and
    -- price it was actually bought at, even if the catalogue changes later.
    productId   TEXT NOT NULL,
    productName TEXT NOT NULL,
    variantId   TEXT NOT NULL,
    variantName TEXT NOT NULL,
    imageUrl    TEXT NOT NULL,
    unitPaise   INTEGER NOT NULL,
    quantity    INTEGER NOT NULL,

    CONSTRAINT OrderItem_orderId_fkey
      FOREIGN KEY (orderId) REFERENCES "Order" (id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Sequence for readable order numbers.
CREATE TABLE Counter (
    name  TEXT NOT NULL PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
);

-- Two orders must never share a public number, and a Razorpay order maps to
-- exactly one of ours. These are correctness constraints, not just indexes:
-- they are what makes the webhook handler safe to retry.
CREATE UNIQUE INDEX Order_number_key ON "Order"(number);
CREATE UNIQUE INDEX Order_razorpayOrderId_key ON "Order"(razorpayOrderId);

CREATE INDEX Order_status_idx ON "Order"(status);
CREATE INDEX Order_createdAt_idx ON "Order"(createdAt);
CREATE INDEX OrderItem_orderId_idx ON OrderItem(orderId);
