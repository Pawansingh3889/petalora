# Petalora

Online store for Petalora plush roses. Next.js storefront, Razorpay payments,
cash on delivery, and a small admin panel for dispatch. Ships from Delhi to
anywhere in India.

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Static product pages, server routes for payments |
| Language | TypeScript, strict | |
| Styling | Tailwind v4 | Tokens live in `src/app/globals.css` |
| Hosting | Cloudflare Workers (OpenNext) | Free tier, edge delivery, D1 in the same account |
| Database | Cloudflare D1 (SQLite) | Native to Workers, no external service to pay for |
| Payments | Razorpay | UPI, cards, netbanking, wallets |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in, gitignored
pnpm d1:migrate:local        # creates the local D1 database
pnpm dev                     # http://localhost:3000
```

The site runs immediately without Razorpay keys, with cash on delivery as the
only payment method. Add keys when you are ready to take online payments.

**To deploy, see [DEPLOY.md](./DEPLOY.md).**

## Commands

```bash
pnpm dev                # dev server, with a local D1
pnpm lint               # eslint
pnpm typecheck          # tsc --noEmit

pnpm cf:preview         # build and run in the real Workers runtime
pnpm cf:deploy          # build and ship to Cloudflare
pnpm cf:typegen         # regenerate binding types after editing wrangler.jsonc

pnpm d1:migrate:local   # apply migrations/ to the local database
pnpm d1:migrate:remote  # apply migrations/ to the live database
```

## Setting up Razorpay

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com) and
   complete KYC. You need a PAN, a bank account and a business address.
2. **API keys.** Account & Settings → API Keys → Generate. You get a key id
   (`rzp_test_...`) and a secret shown exactly once. Put them in `.env.local`:

   ```
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxx"   # public, sent to the browser
   RAZORPAY_KEY_ID="rzp_test_xxx"
   RAZORPAY_KEY_SECRET="xxx"                    # server only, never expose
   ```

3. **Webhook.** Settings → Webhooks → Add New Webhook.
   - URL: `https://yourdomain.com/api/webhooks/razorpay`
   - Active events: `payment.captured` and `payment.failed`
   - Set a secret and copy it into `RAZORPAY_WEBHOOK_SECRET`

   The webhook is not optional. It is what confirms an order when the customer
   pays but closes the tab before the browser callback fires.

4. **Test it** with test keys before going live. Razorpay's test cards:
   success `4111 1111 1111 1111`, any future expiry, any CVV. Test UPI id
   `success@razorpay`.
5. **Go live** by swapping in `rzp_live_` keys and adding a live-mode webhook.
   Razorpay reviews your site first, see the launch checklist below.

## How a payment actually flows

```
browser                     our server                  Razorpay
   |  POST /api/checkout         |                          |
   |---------------------------->|                          |
   |                             |  recompute every price   |
   |                             |  create PENDING order    |
   |                             |  POST /v1/orders ------->|
   |                             |<------- order_id --------|
   |<-- order_id + amount -------|                          |
   |                                                        |
   |  open Razorpay Checkout, customer pays ----------------|
   |<------------- signed handshake ------------------------|
   |  POST /api/payment/verify   |                          |
   |---------------------------->| verify HMAC, CONFIRM     |
   |                             |                          |
   |            (independently)  |<--- webhook: captured ---|
   |                             |  verify HMAC, CONFIRM    |
```

Two things matter here:

- **Prices are never trusted from the browser.** The client sends product ids,
  variant ids and quantities. `src/lib/pricing.ts` recomputes every rupee from
  the server-side catalogue. Razorpay will only accept a payment for the exact
  amount we registered, so a tampered cart cannot underpay.
- **Confirmation happens twice, idempotently.** The browser callback is the
  fast path; the webhook is the reliable one. Both converge on the same state,
  and neither can downgrade an order that has already shipped.

## Project layout

```
src/
  app/
    page.tsx                       home
    shop/                          listing
    product/[slug]/                product detail (statically generated)
    cart/  checkout/               cart and checkout
    order/[id]/                    confirmation, keyed on a random id
    track/                         order lookup by number + email
    admin/                         password-gated dispatch panel
    api/
      checkout/                    creates the order and the Razorpay order
      payment/verify/              verifies the browser handshake
      webhooks/razorpay/           verifies and applies gateway events
    shipping/ returns/ terms/ privacy/ contact/ faq/ about/
  components/
  lib/
    products.ts                    THE CATALOGUE - edit this to change stock
    site.ts                        contact details, address, dispatch promises
    pricing.ts                     authoritative order maths
    shipping.ts                    zone rates, free-shipping threshold, COD
    pincode.ts                     PIN code to state and zone
    money.ts                       paise helpers
    cart.tsx                       cart store (localStorage, cross-tab synced)
    razorpay.ts                    server-side gateway calls and HMAC checks
    admin-auth.ts                  signed-cookie admin session
    db.ts                          D1 data access, the only SQL in the project
migrations/0001_init.sql           database schema, applied with wrangler
wrangler.jsonc                     Worker name, bindings, compatibility flags
open-next.config.ts                Next -> Cloudflare Worker adapter
```

## Day-to-day changes

**Prices, sizes, colours, stock:** `src/lib/products.ts`. Prices are written
as `rupees(1299)` and stored as integer paise everywhere. Set `inStock: false`
to grey a size out without deleting it.

**Contact details, address, dispatch cut-off:** `src/lib/site.ts`. Every page
and policy reads from here.

**Shipping rates and free-shipping threshold:** `src/lib/shipping.ts`. The
rate card on the shipping policy page is generated from the same table, so it
cannot drift out of sync with what checkout charges.

**Adding product photos:** drop them in `public/products/` and reference them
in `products.ts`. Every image needs real alt text.

## Admin

`/admin`, gated by `ADMIN_PASSWORD` from the environment. One password, no user
accounts, a signed cookie valid for 12 hours. That is a deliberate trade-off
for a one-person shop. If staff who should not see revenue ever need access,
replace `src/lib/admin-auth.ts` with real accounts.

From there you can see every order, mark it shipped, and record the courier and
tracking number, which then shows on the customer's order and tracking pages.

## Going to production

Deployment is a separate document: **[DEPLOY.md](./DEPLOY.md)**. It covers
`wrangler login`, creating the D1 database, setting secrets, deploying, wiring
the Razorpay webhook and adding a custom domain.

### Why D1 and not Prisma

An earlier version of this project used Prisma. It was removed for this
deployment target, for three concrete reasons:

1. Prisma on Workers requires its 2.2 MB WebAssembly query engine in the
   bundle. The Workers free plan caps a script at 3 MB compressed.
2. Under this bundler, `@prisma/client` resolved to the native Node engine
   despite the `workerd` export condition, and failed at runtime with a
   missing-engine error.
3. The entire query surface of this shop is eight functions.

`src/lib/db.ts` now talks to D1 directly with prepared, bound statements. It is
the only file in the project containing SQL. If the shop ever outgrows D1, that
one file is what you rewrite.

### Launch checklist

- [ ] Replace the placeholder email, phone, WhatsApp number and postal address
      in `src/lib/site.ts`. Razorpay checks these during activation.
- [ ] Set `ADMIN_PASSWORD` as a Cloudflare secret. The app refuses to
      authenticate against the placeholder from `.env.example`.
- [ ] Confirm the four policy pages read correctly for your business:
      `/shipping`, `/returns`, `/terms`, `/privacy`.
- [ ] Set real prices and sizes in `products.ts`, and photograph the actual
      product against a plain background for the listing shots.
- [ ] Test a live payment with a small real amount, then refund it.
- [ ] Check the free-shipping threshold still leaves margin once you know your
      real courier rates. Plush bills on volumetric weight, not actual weight,
      so a 90 cm rose can bill like 4 to 5 kg.
- [ ] Point `NEXT_PUBLIC_SITE_URL` in `wrangler.jsonc` at your real domain.

## What is deliberately not here

- **Email.** Nothing is sent to customers yet. The order confirmation page and
  `/track` are the only status surfaces. This is the biggest gap for a real
  shop. Add Resend and call it on the CONFIRMED transition in
  `api/payment/verify` and the webhook.
- **Inventory counts.** `inStock` is a manual boolean, not a stock level.
- **Discount codes.** The `couponCode` and `discountPaise` columns exist in the
  schema but nothing writes to them yet.
- **Image optimisation.** Workers has no sharp binary, so `next/image` runs
  unoptimised and Cloudflare's CDN does the caching. Compress your photos
  before committing them.
- **Customer accounts.** Checkout is guest-only, which is right for gifting.
- **Analytics.** No tracking scripts. Add them if you want them.
