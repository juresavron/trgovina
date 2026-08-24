# Architecture — one kernel, N shops

## Thesis

Launch many single-keyword shops (sauna, cryo chamber, …) on **one commerce
kernel**: one Cloudflare Worker, one database, one payment pipeline, one
logistics engine — and one config file per shop. The cost of a failed shop
rounds to zero (a domain + a tenant file), so the portfolio can afford
experiments; the shops that hit get the full weight of shared logistics.

**SEO is priority #1** (see `docs/SEO.md`): the target is position 1 in
Slovenia for each shop's head term. Every architectural choice below is
downstream of that.

## Lineage — what we take from which repo

| Source | What we take | What we leave |
| --- | --- | --- |
| `onlyworld` (fans-network) | The entire multi-tenant chassis: Host→tenant resolution with hard 404 for unknown hosts, `live:false` → 503+noindex edge gate, one-Worker/many-custom-domains deploy, oklch theme tokens, localized `routeSlugs`, launch-readiness tests, IndexNow/sitemap plumbing, TanStack Start SSR | country/creator domain logic, i18n catalogs (we're sl-SI first) |
| `ocenagor-landing-lovable-13` | The payment discipline, kept as law (below); CookieConsent + legal page structure (terms/privacy/cookies, sl); Google Ads conversion wiring | the SPA serving model (no SSR — disqualifying for SEO), the hand-written TS catalogue (doesn't scale to 10 shops), "orders live in Stripe" (doesn't survive freight) |
| `ocenagor-lovable-72` | domain activate/verify/deactivate automation pattern | the booking domain model |

Verified along the way: `mediasped-landing-lovable-15` and
`ocenagor-lovable-15` contain no payment stack — Stripe lives in
`ocenagor-landing-lovable-13` (`create-payment-intent`, `stripe-webhook`,
`_shared/catalogue.ts`, `STRIPE.md`).

## Stack

- **Edge**: one Cloudflare Worker, TanStack Start SSR (React 19, Vite),
  custom-domain routes per shop apex + www.
- **Data**: Supabase Postgres (`db/schema.sql`) + Edge Functions for the
  payment path (they work identically from any host, which is what made
  ocenagor's Netlify→Workers move free).
- **Payments**: Stripe Payment Element on our own checkout page.
- **Config**: `src/tenants/*.ts` — one `ShopConfig` per shop
  (see `src/tenants/types.ts`).

## Request path

```
request → Worker
  resolveShop(Host)      unknown host → 404 (edge, pre-router)
  live gate              live:false → 503 + noindex (meta + x-robots-tag)
  canonicalization       apex, no trailing slash, lowercase
  SSR render             ShopConfig + catalog rows → full HTML at the edge
```

Cross-shop canonical leakage is the worst available bug in a keyword network;
the hard-404 rule is the guarantee against it.

## Commerce invariants (inherited from STRIPE.md — these are laws)

1. **The browser never sets a price.** The cart posts variants + quantities;
   `create-payment-intent` reprices from `product_variants.price_cents` and
   the freight engine. A client claiming `price: 1` is charged the real
   amount.
2. **Only the webhook marks an order paid.** A `return_url` visit is
   forgeable by anyone who types the URL.
3. **The order row exists before the card step** (`status='pending'`) — the
   row IS the lead; checkout abandoners are contactable, with their exact
   configuration attached.
4. **Fresh `crypto.randomUUID()` idempotency key per attempt.** Never derive
   it from the body (the truncated-hash incident locked a customer out for
   24 h).
5. **CORS by parsed `url.origin` against an allow-list** — never suffix
   matching.
6. **Cart input is hostile twice**: validated on localStorage read and again
   in the Edge Function.

New, beyond ocenagor:

7. **Rate limiting on `create-payment-intent`** via the `rate_limits` table —
   closes the hole STRIPE.md documented and shipped anyway; ten shops on one
   endpoint multiply the exposure tenfold.
8. **Per-shop `statement_descriptor_suffix`** on every PaymentIntent. One
   Stripe account serves the network, but a €5k charge whose card statement
   names a sibling brand is a chargeback.
9. **VAT snapshot per order** (`vat_country`, `vat_rate`) — OSS-ready. The
   €10k cross-border B2C threshold is two sauna orders to Austria; when it
   trips, registration is an accounting task, not a schema migration.

## Orders & fulfilment (what a €69 store didn't need)

`orders` + `order_items` (immutable snapshots) + `order_events` (append-only
ledger). Status models the physical journey — `pending → paid → scheduled →
in_transit → delivered → installed → completed` — with `withdrawn` because the
EU 14-day clock starts at **delivery**, not payment. Freight quotes persist
verbatim on the order (`freight_quote` jsonb) so any charge can be explained
line-by-line, years later.

## Freight engine (`src/lib/freight.ts`)

The logistics moat as a pure, tested function. Five classes
(`parcel → pallet → pallet_xl → two_man → white_glove`), zone lanes, service
add-ons (lift-gate, room-of-choice, installation, removal) with
included-service logic (white-glove *contains* installation — never
double-charged, cannot be deselected for cryo chambers). Unknown destinations
and unpriced lanes **throw** — "pokličite nas" at checkout beats a silently
wrong charge. 15 tests pin the behavior.

## Deploy model & blast radius

One Worker serves every shop (the onlyworld pattern), so:

- Routing a zone not Active in our account fails the **entire network's**
  deploy (error 10082). The pre-deploy zone probe from onlyworld's workflow
  carries over as-is.
- `workers_dev: true` stays — the workers.dev host is QA + Lighthouse target.
- Per-shop rollout never touches routing or zones: flip `live` in the tenant
  file (a one-line deploy of the shared Worker) + the `is_live` row. The
  dangerous class of change — wrangler routes — happens only when a domain
  is added, under the zone-probe gate.

## Admin

One admin (the onlyworld site-switcher pattern) over all shops: catalog CRUD,
order pipeline board (the `status` lifecycle as columns), review moderation
with verification, per-shop analytics funnel (land → configure → cart → paid).

## Build order

1. **Kernel** (this commit): tenants, freight engine, schema, docs.
2. **Chassis port**: TanStack Start app on the Worker — SSR routes, shop
   resolution, live gate, canonicalization, sitemap/IndexNow.
3. **Storefront**: design system (docs/DESIGN.md) → home, PLP, PDP,
   configurator, guides, delivery page, trust pages.
4. **Checkout**: cart → `create-payment-intent` (reprice + rate-limit +
   order row) → Payment Element → webhook → order pipeline.
5. **Admin** + review verification.
6. **Pilot content**: savna catalog + 6 guides; krio catalog + 6 guides.
7. Domains, GSC/Bing, launch gates, `live: true`.
