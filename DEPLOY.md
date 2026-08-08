# Deploying Petalora to Cloudflare

Everything is built and tested against the real Workers runtime. What is left
needs your Cloudflare account, which is why you have to run these yourself:
`wrangler login` opens a browser for you to approve, and nobody else can do
that step for you.

Total time: about ten minutes. Cost: nothing, this fits the free plan.

---

## 1. Log in to Cloudflare

If you do not have an account, make one first at
[dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up). Then, in
this project directory:

```bash
pnpm wrangler login
```

A browser tab opens. Approve it, come back to the terminal.

> In this Claude Code session you can run it inline by typing
> `! pnpm wrangler login` so the output lands in the conversation.

## 2. Create the database

```bash
pnpm wrangler d1 create petalora-db
```

It prints a block ending in something like:

```
database_id = "8f4e1a2b-3c5d-4e6f-9a0b-1c2d3e4f5a6b"
```

Copy that id into `wrangler.jsonc`, replacing `local-dev-placeholder`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "petalora-db",
    "database_id": "8f4e1a2b-...",   // <- paste here
    "migrations_dir": "migrations"
  }
],
```

Then create the tables on the real database:

```bash
pnpm d1:migrate:remote
```

## 3. Set your secrets

These are encrypted by Cloudflare and never appear in the repo. Each command
prompts you to paste the value.

```bash
pnpm wrangler secret put ADMIN_PASSWORD
pnpm wrangler secret put RAZORPAY_KEY_ID
pnpm wrangler secret put RAZORPAY_KEY_SECRET
pnpm wrangler secret put RAZORPAY_WEBHOOK_SECRET
```

`NEXT_PUBLIC_RAZORPAY_KEY_ID` is different: it is baked into the browser bundle
at build time, so it is a plain var, not a secret. Put it in `.env.local`
before you build. It is safe to expose, that is what a Razorpay key id is for.

If you have not set up Razorpay yet, skip the three Razorpay lines. The shop
deploys and runs fine on cash on delivery only, and the online payment option
greys out by itself.

## 4. Deploy

```bash
pnpm cf:deploy
```

You get a URL like `https://petalora.<your-subdomain>.workers.dev`. That is
your live link.

## 5. Point Razorpay at it

In the Razorpay dashboard, Settings -> Webhooks, add:

```
https://petalora.<your-subdomain>.workers.dev/api/webhooks/razorpay
```

Subscribe it to `payment.captured` and `payment.failed`, and set the secret to
whatever you gave `RAZORPAY_WEBHOOK_SECRET` above.

Do not skip this. The webhook is what confirms an order when a customer pays
by UPI and their phone dies before the browser redirects back.

## 6. Your own domain (optional)

Buy a domain, add it to Cloudflare, then in the dashboard go to
Workers & Pages -> petalora -> Settings -> Domains & Routes -> Add custom
domain. Cloudflare handles the DNS and the TLS certificate.

Then update `NEXT_PUBLIC_SITE_URL` in `wrangler.jsonc` to the real domain and
redeploy, so the sitemap and metadata point at the right host.

---

## Redeploying after a change

```bash
pnpm cf:deploy
```

If you changed `migrations/`, run `pnpm d1:migrate:remote` too.

## Working locally

```bash
pnpm d1:migrate:local   # once, creates the local database
pnpm dev                # http://localhost:3000, hot reload
```

`pnpm dev` gets a local Miniflare-backed D1 through
`initOpenNextCloudflareForDev()`, so development and production run the same
database code rather than diverging.

To exercise the real Workers runtime before deploying:

```bash
pnpm cf:preview
```

That is worth doing for anything touching payments or the database, because it
runs the actual bundle in workerd rather than in Node.

## Inspecting the live database

```bash
# recent orders
pnpm wrangler d1 execute petalora-db --remote \
  --command "SELECT number, status, name, city, totalPaise FROM \"Order\" ORDER BY createdAt DESC LIMIT 20"

# live logs
pnpm wrangler tail
```

## Free plan limits

| Limit | Free plan | What it means here |
| --- | --- | --- |
| Worker requests | 100,000/day | Far beyond a new shop's traffic |
| Worker size | 3 MB compressed | Current bundle is well inside this |
| D1 rows read | 5 million/day | An order read is a handful of rows |
| D1 rows written | 100,000/day | An order is ~3 writes |
| D1 storage | 5 GB | Orders are tiny text rows |

Static assets and images are served from Cloudflare's CDN and do not count
against Worker requests.

## If something breaks

**`D1 binding 'DB' is missing`.** The `database_id` in `wrangler.jsonc` is
still the placeholder, or you have not run the migration.

**Admin page will not accept the password.** `ADMIN_PASSWORD` was not set as a
secret, or it is still the `.env.example` placeholder, which is rejected on
purpose.

**Payments say unavailable.** The Razorpay secrets are missing, or
`NEXT_PUBLIC_RAZORPAY_KEY_ID` was not in `.env.local` at build time. Rebuild
after adding it.

**Orders stuck as PENDING.** The webhook is not reaching you. Check the URL in
the Razorpay dashboard and that `RAZORPAY_WEBHOOK_SECRET` matches on both
sides. `pnpm wrangler tail` shows the incoming requests.
