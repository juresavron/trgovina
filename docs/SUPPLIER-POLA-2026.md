# Supplier reference — Pola Deluxe Series, 2026 price list

Transcribed from the supplier's 2026 Pola Deluxe Series price list. This is
**cost basis and specification**, not shop content: nothing here is a price a
customer may be shown, and nothing here has been converted, marked up or
taxed. See "What this is not" at the end before wiring any of it into
`src/content/`.

Manufacturer: iSpas, Guangzhou, China. Port of loading: Huangpu.

## The catalogue is hot tubs, not swim spas

Every model in this list is a **square hot tub** between 1.95 m and 2.30 m on
a side and 0.82–0.88 m deep, seating five or six. A swim spa is a different
product: a 3.8–7 m long unit with a counter-current swim jet, bought to swim
against rather than to sit in. There is no swim spa in this price list, and no
model here can be sold as one — the largest is 2.3 m end to end.

This matters because the two are different search markets, different price
brackets, different delivery problems (a swim spa needs a crane and a slab,
not four people and a terrace) and different shops. Recorded here so the
distinction does not quietly get lost between the price list and the site.

## Models

Prices are **USD, FOB Huangpu** — see "What this is not".

| Model | FOB USD | Dimensions (mm) | Seating | Jets | Pumps | Filter | Dry / filled |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ZR801 | 3 140 | 2300 × 2300 × 880 | 2 lounges + 3 seats | 50 | 1 × 0.35 HP circ, 2 × 3 HP jet | 1 × 100 sf | 410 / 2 210 kg |
| ZR802 | 3 100 | 2300 × 2300 × 880 | 1 lounge + 5 seats | 42 | 1 × 0.35 HP circ, 2 × 3 HP jet | 1 × 100 sf | 410 / 2 210 kg |
| ZR803 | 2 730 | 2100 × 2100 × 880 | 2 lounges + 3 seats | 38 | 1 × 0.35 HP circ, 1 × 3 HP jet | 1 × 100 sf | 370 / 1 870 kg |
| ZR804 | 2 730 | 2100 × 2100 × 880 | 1 lounge + 5 seats | 37 | 1 × 0.35 HP circ, 1 × 3 HP jet | 1 × 100 sf | 370 / 1 870 kg |
| ZR805 | 2 630 | 1950 × 1950 × 820 | 2 lounges + 3 seats | 35 | 1 × 0.35 HP circ, 1 × 3 HP jet | 1 × 100 sf | 300 / 1 500 kg |
| ZR807 | 3 100 | 2300 × 2300 × 880 | 2 lounges + 3 seats | 41 | 1 × 0.35 HP circ, 2 × 3 HP jet | 1 × 50 sf | 410 / 2 210 kg |
| ZR808 | 2 635 | 2000 × 2000 × 820 | 5 seats | 34 | 1 × 0.35 HP circ, 1 × 3 HP jet | 1 × 50 sf | 300 / 1 600 kg |
| ZR809 | 2 700 | 2100 × 2100 × 820 | 2 lounges + 3 seats | 32 | 1 × 0.35 HP circ, 1 × 3 HP jet | 1 × 100 sf | 300 / 1 600 kg |
| ZR810 | 3 160 | 2300 × 2300 × 880 | 1 lounge + 5 seats | 55 | 1 × 0.35 HP circ, 2 × 3 HP jet | 1 × 50 sf | 410 / 2 210 kg |

**ZR806 is not in the list.** The sequence runs 801–805, then 807–810. Worth
asking the supplier whether it is discontinued or simply omitted, before a
model number gets quoted that cannot be ordered.

### Jet breakdown

| Model | 5″ | 3.5″ | 2.5″ | 2″ | 1″ | Total |
| --- | --- | --- | --- | --- | --- | --- |
| ZR801 | 5 | 4 | 12 | 24 | 2 | 50 (+ 3 unlisted) |
| ZR802 | 8 | 4 | 6 | 22 | — | 42 (+ 2 unlisted) |
| ZR803 | 3 | 6 | 2 | 27 | 2 | 38 (parts sum to 40) |
| ZR804 | 4 | — | — | 27 + 4 | 2 | 37 |
| ZR805 | 6 | — | — | 20 | 2 | 35 (+ 7 unlisted) |
| ZR807 | 3 | 6 | 6 | 26 | — | 41 |
| ZR808 | 3 | 4 | 7 | 13 | 7 | 34 |
| ZR809 | 4 | 6 | 5 | 15 | 2 | 32 |
| ZR810 | 4 | 13 | 13 | 25 | — | 55 |

Four models do not add up. ZR801, ZR802 and ZR805 list fewer jets by size
than their stated total (by 3, 2 and 7); ZR803 lists two more. The gaps are
recorded rather than reconciled — the price list disagrees with itself, and
picking which line to believe would put an invented number on a spec sheet.
The supplier should confirm before any of these reach a product page: jet
count is the single number this category is compared on. The other five
(ZR804, ZR807, ZR808, ZR809, ZR810) reconcile exactly.

## Standard on every model

Nothing below is an option; it is what the base FOB price includes.

- US acrylic shell, 7 shell colours
- Aluminium support frame; PS panel with PS corner skirt; ABS base
- 2 cm shell insulation
- Balboa BP200 G2+ control system with 3 kW heater
  (TP600 topside on ZR801/802/807/810, TP500S on the rest)
- 220 V / 380 V / 110 V
- Ozone, 1 pc
- 1 underwater light
- 3 headrest pillows, 2 air valves, 1 drainage outlet
- Suction: 4 pcs on the 2 × 3 HP models, 2 pcs on the rest

## Options

Priced per unit, USD, FOB. **Availability, quantity AND price all vary by
model**, which is why `src/catalog/pola.ts` carries them per model rather than
as one shared list — a shared list would be shorter to write and would quote
the wrong price on at least two pages. Three specifics worth knowing:

- **The cabinet insulation is $70 on eight models and $60 on ZR807.**
- **The rim LED at eight pieces is $85 on ZR808 and $43 on ZR809.** Same item,
  same quantity, roughly double. One of the two is wrong.
- **ZR802 prices the spa bag at $153**, which is also its spa cover price,
  where every other model puts the bag at $70–83. It looks like the cover's
  figure landed on the bag's row. Carried as printed rather than corrected,
  and flagged here.
- Only five models are offered an air blower at all (ZR801, ZR802, ZR804 with
  aroma; ZR807 without; ZR810 with). The other four have no blower line.

Ask the supplier to confirm the second and third before any of it is quoted.

| Option | USD |
| --- | --- |
| Spa cover | 115 / 130 / 153 by shell size |
| Cover lifter | 75 |
| Step | 60 |
| Rim LED light, 8 pcs | 43 |
| Rim LED light, 16 pcs | 85 |
| LED light in jets (16 pcs) + valves | 104–110 |
| Air blower with air jets | 100 |
| Air blower with air jets + aroma | 120 |
| Bluetooth amplifier with speakers | 80 |
| LED lights on skirt panel | 58 |
| Cabinet and bottom insulation | 60–70 |
| LED fountain, 2 pcs | 22 |
| LED fountain, 3 pcs | 30 |
| LED cup holder, 2 / 3 / 4 / 5 / 6 pcs | 17 / 23 / 23 / 36 / 42 |
| LED waterfall + control valve | 15 |
| LED pillow light | 14 |
| Spa bag | 70–83 |

## Commercial terms

- Payment: T/T, 30 % down payment, 70 % before shipment
- Delivery: within 30 days after down payment
- Port of loading: Huangpu, China
- Warranty: 2–5 years, varying by part
- Quotation validity: 30 days

## What this is not

**These are not shop prices, and none of them may be rendered on a page.**

An FOB figure is the goods on the quay in Guangzhou. Between it and a price a
Slovenian customer may be shown sit: sea freight and insurance, EU import duty
on the tariff line, customs clearance, inland transport, 22 % DDV, the
warranty and service provision the shop's own copy promises, delivery-and-
commissioning labour (this network's whole differentiator, and on a 410 kg dry
unit it is not small), payment costs, returns provision, and margin. The
exchange rate moves; the quote expires in 30 days.

So the site's product prices have to come from a landed-cost calculation the
business owns, and be quoted in EUR including DDV — required for consumer
sales under Directive 98/6/EC as transposed in ZVPot, which is also why
`commerce.ts` shows each model its own price rather than a range.

**Provisional prices are on the page now.** The business asked for figures to
review rather than dashes, so `PROVISIONAL_EUR_PER_USD` in
`src/catalog/pricing.ts` converts the FOB list price and nothing else. Those
numbers are COST — no freight, no duty, no delivery labour, no margin — and
are far too low to sell at. They are rounded to a plain ten rather than onto a
retail point, the product page prints "Cene so informativne in še niso
dokončne", and the Product JSON-LD omits its Offer entirely, because a price
nobody decided must not be published as structured data.

Until the real calculation exists, a shop carrying these models cannot go
`live: true`. The same rule already applies to imagery: the launch gate in
`src/tenants/media.test.ts` blocks a live shop that is still showing the
source theme's furniture, and a made-up price is a worse claim than a
borrowed photograph.
