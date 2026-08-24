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

\* **Retail prices are placeholders** at ~2.5–4× landed cost, rounded to
retail-psychological points, gross incl. 22% DDV. The owner sets final
pricing; both `product_variants.price_cents` (what Stripe charges) and the
storefront copy follow from that one decision.

## Why these five are a good kernel fit

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

## Open items (owner decisions)

1. Final retail prices (the table above is a proposal shape, not a number).
2. Warranty terms per product family (drives PDP copy + `orders` flow).
3. Hot tub installation: own crew or partnered electrician/plumber?
4. Domain confirmations — all four are placeholders until registered.
