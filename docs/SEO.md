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

### Resolved: studio's fonts, and the inlined sheet

Two things this section had flagged are now closed.

**Font origins: two down to one.** Studio used to load Clash Display and
Satoshi from Fontshare alongside DM Sans from Google — two render-blocking
third-party stylesheets. Those faces were replaced with verified Google
equivalents (docs/STUDIO-BASELINE.md §1), so the theme now makes a single
font request. The change was forced by Slovenian glyph coverage rather than by
performance, but it pays here too.

**The inlined stylesheet.** The sheet is inlined into every document's head,
so it is render-blocking *and* part of the HTML payload — charged twice. These
modules are heavily commented by design, and measurement showed 66 KB of a
154 KB sheet was comments: 43% of what every visitor downloaded before
anything could paint, to read prose written for us. Comments are now stripped
at module scope and never reach the wire (94 KB, and `src/render/size.test.ts`
fails the build above 100 KB).

Measured again after the 2026-08 audit: the sheet is 129 KB raw and **15 KB
brotli**, and the whole document is 19-21 KB brotli. Only studio is compiled
in, so the "every theme's rules" reduction this section used to propose does
not apply to these shops. What remains is the real trade: inlining costs a
repeat visitor 15 KB per navigation and saves a first-time visitor a
render-blocking round trip. Search traffic is overwhelmingly first-time and
single-page, so the inline stays — but the number is now written down rather
than assumed, and `scripts/audit-seo.mjs` reports the compressed size on every
run.

### The 2026-08 audit

`scripts/audit-seo.mjs` reads what a CRAWLER sees — head, structured data,
link graph, sitemap — the way `audit-site.mjs` reads what a person sees. It
found, and this pass fixed:

- **Organization structured data published placeholders on every page.**
  `"telephone": "+386 00 000 000"`, `"streetAddress": "TODO"`,
  `"postalCode": "0000"` — asserted to Google in machine-readable form and
  ingested into the knowledge panel. The same rule the codebase already
  applied to Offers (no price nobody set) and Reviews (none fabricated) now
  applies to identity: an unset field is omitted. The four predicates that
  decide "set" moved to `src/lib/filled.ts`, because there were three copies
  and the third one had none.
- **No BreadcrumbList anywhere** — six product pages and two collections
  showed the raw URL path in the SERP instead of a trail.
- **No ItemList on the two pages built to rank.** To a crawler
  /masazni-bazeni was three anchors in a div rather than a category.
- **No FAQPage**, so /pogosta-vprasanja could not win an accordion result.
  Built from the page's own qa blocks, never a second list, because markup
  whose answers a visitor cannot read is a manual action.
- **No og:image on any page.** Every link pasted into WhatsApp, Viber or
  Slack rendered as a bare text card. Product pages now share their own lead
  photograph; everything else shares the hero.
- **Eleven subpages were crawl dead ends** with one outbound body link each.
  A short onward block at the foot of every editorial and legal page now
  points at the two collections and the catalogue, by name.

Two checks were **removed** as false positives, which matters as much as the
additions: an unsized-image warning that fired on 26 images while measured
CLS was 0.0009, and a robots.txt error that fired on a correct pre-live
closure. Layout shift is now measured in the browser by `audit-site.mjs`
instead of guessed from markup.

Still open, and the owner's to close: **thin copy** on /razstavni-salon (117
words), /kontakt (177), /financiranje (215), /o-nas (255) and /trgovina
(258). Words cannot be invented here — every one of those pages needs the
shop's own account of what it does.

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

### What is enforced, and what is merely true

The four rules above were prose until `src/tenants/cross-shop.test.ts`. It
gates, for every PAIR of registered shops: no shared sentence of eight words
or more, no shop naming a sibling's domain anywhere in its markup, no two
shops chasing the same head term, and no review appearing under two
companies. The predicates are tested against a synthesised second shop, so
they are not vacuous while only one is registered.

**What is deliberately NOT chased.** Measured on a rendered page, every shop
on this Worker serves the same `/assets/site-<hash>.css` and `.js` filenames
(the sheet is shared, so its content hash is), the same `public/favicon.svg`
bytes, and the same `data-theme` where two shops pick the same theme. One
Cloudflare account and one IP are shared too.

None of that is a ranking signal. Google does not penalise shared hosting, a
shared stylesheet or a shared favicon; what it acts on is duplicate and
templated content, thin doorway pages, and link schemes — which is what the
list above forbids and the test file gates. Making the asset filenames
per-shop is possible and buys nothing, so it is not done. Recorded here so
the next person does not spend a week on a footprint that costs no rank.

What the site does NOT carry at all, and must not start carrying: any
analytics, tag manager or verification snippet. A shared GA property is the
one item on this list that WOULD tie the shops together in a way that
matters, and `content/pages/piskotki.ts` documents the absence as the reason
the cookie page can say what it says.

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
