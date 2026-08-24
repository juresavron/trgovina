# Launch catalog — the five products

The starting lineup (owner-provided, 2026-08-24). The m³ figures are shipping
volumes; the € figures are **landed costs**, not retail — they price the
container, and they price the risk of a failed shop at almost nothing.

| Product | Volume | Landed cost | Shop | Freight class | Placeholder retail* |
| --- | --- | --- | --- | --- | --- |
| Infrared sauna, 2-person | 1.45 m³ | €605 | `savna` — infrardeca-savna.si | `pallet` | €1.490 |
| Infrared sauna, 4-person | 2.20 m³ | €653 | `savna` | `pallet_xl` | €1.990 |
| Cold plunge tub + chiller | 1.50 m³ | €991 | `kad` — ledena-kad.si | `two_man` | €2.490 |
| Acrylic hot tub, 5-person | 4.40 m³ | €737 | `bazen` — masazni-bazen.si | `pallet_xl` | €2.990 |
| Massage chair, 4D SL-track | 1.50 m³ | €716 | `fotelj` — masazni-fotelj.si | `two_man` | €1.790 |
| Freestanding cast-marble bath, 1700 | ~1.2 m³ · 170 kg | $386–1,150 FOB | `kopalna` — prostostojeca-kad.si | `two_man` | €1.690 |
| Slate billiard table, 8ft | 3-part slate · ~350 kg | $1,100–1,650 FOB | `biljard` — biljardna-miza.si | `white_glove` | €2.890 |

\* **Retail prices are placeholders** at ~2.5–4× landed cost, rounded to
retail-psychological points, gross incl. 22% DDV. The owner sets final
pricing; both `product_variants.price_cents` (what Stripe charges) and the
storefront copy follow from that one decision.

## Why these are a good kernel fit

- **Freight classes span the engine**: pallet, pallet_xl, two_man — the
  logistics moat is exercised from day one (installation as an add-on on
  `two_man`/`pallet_xl`; the hot tub likely wants a site-check step in the
  order pipeline before scheduling).
- **Volumes are the billing driver upstream**: 1.45–4.40 m³ per unit is what
  the container math runs on — `products.volume_m3` stores it so purchasing
  and freight quoting read the same number.
- **Four keyword shops, one kernel**: each product family is a head term with
  real Slovenian commercial volume and weak SERP competition
  (*infrardeča savna*, *ledena kad*, *masažni bazen*, *masažni fotelj*).
- **Theme reuse is proven immediately**: savna and fotelj both wear `zarja`
  with different accents and compositions; kad wears `lednik`; bazen wears
  `salon`.

## Margin sanity (per unit, placeholder retail, before ads)

Retail − landed − ~€60–120 outbound freight − 22% DDV contained in retail.
Roughly: sauna 2p ≈ €560, sauna 4p ≈ €880, plunge ≈ €960, hot tub ≈ €1.680,
chair ≈ €700 gross margin per unit. Ads for these terms in SI are cheap
(low competition); the constraint is content + trust, not CAC.

## Shops 5 and 6 — the second wave (owner-selected, market research)

### `kopalna` — freestanding stone-resin baths

**Why it fits.** badshop.de does not serve SI or HR at all. A 170 kg cast-marble
tub is exactly the delivery nobody wants to make: two people, up a staircase,
fragile surface — every property that makes it hard to ship makes it hard to
compete with us. It also joins the existing cluster: savna / kad / bazen /
kopalna share a buyer, a crew, a freight lane and potentially a container.

**Margin discipline is the whole thesis.** €1.690 retail against $386 FOB is
~4.8× landed; against $1,150 it is ~1.6× and not worth the pallet. **Stone resin
only** — acrylic at $192–350 FOB is pallet-able, and pallet-able means the
Germans already ship it.

**Known competitor:** kopalnica-online.si (Maribor) does this and serves both
countries. One regional incumbent is not saturation — the wager is that they do
not own the head term.

### `biljard` — slate billiard tables

**The research rates this contested and it is right:** German shops ship here at
~€350 flat, so the freight fence is low; there are four-plus incumbents in a
2.1M market (biljardshop.eu Brežice, biljardist.si, bellamar, igralni-aparati);
biljardshop already carries a Chinese factory brand (Europool by Rasson); and
purchase frequency is roughly once a decade, which is the worst pairing with SEO
investment because the ranking never compounds against repeat demand.

**It is launched anyway on the kernel's own logic:** shop #6 costs a config file
and a domain, so a contested category is a cheap bet rather than a commitment.

**And the differentiator is encoded, not asserted.** The research's own
conclusion — *"the moat is the fitter, not the freight"* — is why this shop
ships as **`white_glove`**: the one freight class where installation sits inside
the class and cannot be declined (`src/lib/freight.ts`, INCLUDED_SERVICES).
A three-piece slate bed must be carried in, assembled, levelled to a tenth of a
millimetre and clothed. Selling the table without owning the fitter is the
failure mode; the freight class refuses to let us.

## Evaluated and not launched

**Heavy safes / gun cabinets.** The cleanest moat evidence in the study — two
German specialists decline SI and HR outright, and demand is documented and
rising (SI ~160,000 firearms across 45,025 owners in 2022, up from ~40,000
owners in 2015; HR 314,783 legal firearms, ~6% of adults). Not launched because
two gates sit in front of it:

1. **Certification is the business, and it is slow.** EN 1143-1 / EN 14450 is
   what insurers demand and what $45–100 factories do not carry. Certifying is
   possible — per-model testing at ECB•S or VdS, roughly €5–15k per SKU plus a
   factory audit and months of lead time — and once paid it is a moat a
   drop-shipper cannot cross. But it commits capital to specific SKUs before
   revenue, which inverts the "a failed shop costs €0" economics that make this
   kernel worth having.
2. **Paid-channel risk, unpriced in the study.** Firearm-adjacent advertising is
   a policy minefield; safes themselves are usually permitted but accounts in
   the vertical get flagged and reviews are inconsistent. **Verify against
   current Google Ads and Meta policy before committing** — the launch model
   assumes paid and organic running together, and an SEO-only path changes the
   payback timeline completely.
3. Anchoring into structural concrete is also a heavier liability class than
   carrying, and on an insurance-rated safe the *installation* may need to be
   certified for the customer's cover to hold.

Also note it is a **second cluster, not a fifth shop**: different buyer, crew,
keyword universe and compliance surface from the wellness cluster.

**Decision gate if revisited:** does any supplier already hold EN 14450 S1/S2 on
a shippable model, and will Google Ads accept the vertical? Two yeses make it
the strongest moat found; either no makes it a capital project wearing a keyword
shop's clothes.

## Open items (owner decisions)

1. Final retail prices (the table above is a proposal shape, not a number).
2. Warranty terms per product family (drives PDP copy + `orders` flow).
3. Hot tub installation: own crew or partnered electrician/plumber?
4. Domain confirmations — all six are placeholders until registered.
5. Bath SKU selection: the €1.690 retail only works at the low end of the
   $386–1,150 FOB band. Confirm a stone-resin supplier under ~$600 FOB.
6. Billiard fitter: own crew or contracted? The white_glove class promises
   installation on every order — that promise needs a name behind it.
