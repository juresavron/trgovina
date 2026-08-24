# SEO — the #1 priority

The objective, stated plainly: **every shop in the network ranks #1 in
Slovenia for its one head term.** Not top 3 — #1. Everything in this document
exists to serve that, and any feature that conflicts with it loses.

Slovenia makes this goal achievable in a way Germany or the US never would:
head terms like *finska savna* or *kriokomora* have real commercial volume but
thin, mostly-outdated competition — regional importers with 2015-era sites,
horizontal marketplaces with one thin category page, and .com players with no
Slovenian content. A technically clean, genuinely deep, genuinely Slovenian
site with real logistics behind it is not fighting for scraps; it is often the
first serious entrant.

## 1. The one-keyword architecture

Each shop is a **topical authority hub for exactly one term**:

- The **domain** carries the keyword (`finskasavna.si`, `kriokomora.si`).
  Fresh registrations only — an expired/aged domain is a named Google spam
  vector (doctrine inherited from onlyworld's DEPLOY.md).
- The **homepage is the keyword landing page** — not a generic storefront.
  H1 contains the head term; the page answers the query fully: what it is,
  which models, what they cost, how delivery works, why us.
- **Every internal route reinforces the term** via `ShopConfig.keyword`
  interpolation: titles, H1s, breadcrumbs, anchor text. The `routeSlugs` are
  Slovenian and keyword-bearing (`/savne`, `/dostava-in-montaza`) —
  Latin-ASCII, immutable after launch, because slugs are SEO capital.
- **Supporting content ladders up**: guides target the long tail
  (*finska ali infrardeča savna*, *savna na 230v ali 400v*,
  *koliko stane savna*), each internally linked to the money pages, none
  competing with the homepage for the head term. One page = one query
  cluster; cannibalization is a bug and gets a canonical or a merge.

## 2. Technical baseline (the chassis already does this)

Inherited from onlyworld's Worker and kept as hard requirements:

- **SSR at the edge.** Every page renders complete HTML at the Cloudflare
  edge. No client-rendered content that matters to ranking. This is why the
  ocenagor SPA pattern is NOT the storefront chassis — its commerce layer
  ports into the SSR chassis, not the other way around.
- **One canonical URL form.** Apex domain, no www (301 via zone Redirect
  Rule), no trailing slash, lowercase; the worker normalizes before the
  router runs.
- **Unknown Host = hard 404 at the edge.** A misconfigured domain must never
  render another shop's canonicals — cross-shop canonical leakage is the
  single worst available bug in a keyword network.
- **Pre-live = 503 + noindex** (meta AND `x-robots-tag`). Attach domains
  early to warm TLS; never leak an unfinished store into the index.
- **Sitemap + IndexNow** per shop; ping on content change.
- **Search Console (Domain property) + Bing Webmaster Tools per domain.**
  Bing matters beyond its share: it is what ChatGPT/Copilot retrieve
  against — a domain absent from Bing is invisible to AI answers no matter
  how good the on-page work is.
- **AI crawlers allowed** at the zone (Bot Fight Mode off, AI-blocking off).
  *Kupi finsko savno* questions are increasingly asked to assistants; being
  the citation is the new #1.

## 3. Structured data — the high-AOV rich result stack

Rendered server-side, per shop, from `ShopConfig` + catalog rows:

| Schema | Where | Why |
| --- | --- | --- |
| `Organization` + `LocalBusiness` | sitewide | trust block: name, address, phone, `sameAs` (own socials only, never a sibling's) |
| `Product` + `Offer` (price, availability, `priceCurrency`) | PDP | price rich result — decisive for commercial queries |
| `AggregateRating` + `Review` | PDP | stars in the SERP; **verified reviews only**, matched to orders |
| `FAQPage` | FAQ + guide pages | owns SERP real estate below the fold |
| `BreadcrumbList` | all | reinforces the hub structure |
| `Article` | guides | E-E-A-T surface with a real author |

## 4. Performance budget (Core Web Vitals as a gate, not a wish)

- **LCP < 1.5 s** on mid-range mobile — hero imagery via image CDN with
  explicit dimensions, AVIF/WebP, `fetchpriority=high` on exactly one image.
- **CLS = 0** — every image and embed has reserved space; fonts load
  `font-display: optional`-adjacent with metric-compatible fallbacks.
- **INP < 200 ms** — the storefront ships near-zero JS on content pages;
  islands only where interaction exists (configurator, cart).
- Budget enforced in CI (Lighthouse against the workers.dev QA host); a red
  budget blocks deploy exactly like a failing test.

## 5. E-E-A-T for a store that ships pallets

Google's quality raters ask "would you trust this site with €5,000?" — so the
trust architecture IS the SEO:

- Real legal entity, VAT ID, street address, phone in the footer of every
  page (from `ShopConfig.contact`/`company` — launch gates, not decoration).
- Photographed installations, named customers (with consent), review photos.
- The **delivery & installation page** (`/dostava-in-montaza`) written with
  real operational detail — crew size, vehicle, lead times, what happens on
  delivery day. Competitors can copy words but not the operation; depth here
  is unfakeable and directly answers the buyer's biggest anxiety.
- An author with a name and a face on every guide.

## 6. The network rule: shared kernel, zero shared footprint

Ten single-keyword shops from one owner is a pattern Google explicitly
polices (doorway/site-network). The defense is genuine differentiation:

- **Shared:** code, infrastructure, logistics, payment rails. All invisible.
- **Never shared:** copy (no template sentences with swapped nouns),
  photography, product data, guides, social profiles, review pools.
  `DesignMode` + per-shop accent + per-shop imagery must make siblings read
  as different companies.
- **No cross-linking between shops.** No shared "our brands" footer, no
  common GA property leaking in page source, no shared `sameAs`.
- Each shop must stand alone as "the Slovenian specialist for X". If a shop
  cannot justify real content depth, it does not launch — a thin shop risks
  the network, not just itself.

## 7. Launch sequence per shop (SEO order of operations)

1. Register fresh domain → add zone → wait Active → route (10082 doctrine).
2. Ship pre-live (503+noindex): full catalog, ≥6 guides, delivery page,
   trust block complete — the site launches *finished*, not iterated in
   public. Google's first crawl forms a lasting quality impression.
3. Flip `live: true` + `is_live` → deploy → GSC + Bing verification →
   submit sitemap → IndexNow ping.
4. Google Business Profile (showroom address) — the local pack for
   "[keyword] slovenija" queries is a second #1 slot.
5. Paid search on the exact head term from day one: Ads data feeds keyword
   refinement while organic matures, and owning both ad + organic + local
   pack is how "first hit" becomes literally true on the pixel level.
6. Weekly: GSC query report → new guide targeting every query with
   impressions and no dedicated page.
