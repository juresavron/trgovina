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

## Packing list (received 2026-08-28)

A **second document** from the supplier, covering four of the nine models —
including all three the shop offers. It states what actually goes into a
container: the crate, its cubic volume, and net and gross mass.

| Model | Crate (mm) | CBM | Net kg | Gross kg | Cover crate (mm) | CBM | Net | Gross |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ZR801 | 2380 × 970 × 2460 | 5.68 | 470 | 560 | 1230 × 2360 × 360 | 1.05 | 23 | 43 |
| ZR803 | 980 × 2210 × 2270 | **4.97** | 380 | 460 | 2150 × 1050 × 230 | 0.52 | 21 | 22 |
| ZR804 | 970 × 2220 × 2280 | 4.91 | 380 | 480 | 2130 × 1050 × 230 | 0.51 | 20 | 21 |
| ZR805 | 920 × 2080 × 2190 | 4.19 | 320 | 400 | 2130 × 1040 × 360 | 0.80 | 20 | 40 |

Transcribed into `pack` and `packCover` on `PolaModel`. The first dimension is
the crate's HEIGHT — the sheet leads with it, unlike the price list, which
leads with footprint.

**Crating is 22–34% of the shell's own volume**, and that is the reason this
document changed the pricing. `envelopeOf` used to compute freight from shell
dimensions; a forwarder bills the crate. The gap is not uniform — it is
22–34% on these tubs against 3–5% on the swim spas, whose crate is the shell
plus 25 mm a side — so a shell basis under-freighted the whole hot tub line by
about a quarter *relative to* the swim spas. Freight now bills on `pack.cbm`.
The six offered models each moved 100–200 € (+1.5–3%), all still inside the
competitor band the inputs were calibrated against.

**The covers ship as separate packages.** 0.51–1.05 m³ and 21–43 kg gross,
each nearly a quarter of its tub's crate volume. `breakdownFor` prices an
add-on with no freight line at all, on the reasoning that an option is fitted
at the factory and travels inside the shell. That is true of a jet light and
false of a cover. Recorded in `packCover`; not yet costed.

### ⚠️ Open questions on the packing list

1. **Net mass disagrees with the price list on every model.** The price list's
   "dry" column against the packing list's net:

   | Model | Price list dry | Packing list net | Gap |
   | --- | --- | --- | --- |
   | ZR801 | 410 kg | 470 kg | +15% |
   | ZR803 | 370 kg | 380 kg | +3% |
   | ZR804 | 370 kg | 380 kg | +3% |
   | ZR805 | 300 kg | 320 kg | +7% |

   Net mass on a packing list is the goods without the crate, which is what
   "dry" ought to mean. Both are carried — `dryKg` is what the site publishes
   as "prazen", `pack.netKg` is what shipping uses — and neither has been
   edited to agree with the other. **Ask which is right**; the site prints the
   lower figure today, and it prints it on a page where a customer is deciding
   whether a terrace will hold the thing.

2. **ZR803's stated CBM does not match its own stated dimensions.** 980 × 2210
   × 2270 mm is 4.916 m³; the sheet says 4.97. The other three rows reconcile
   to three decimals. Carried as stated, named as a known exception in
   `pricing.test.ts`. ZR803 is not offered, so nothing prices off it — resolve
   it before that changes.

3. **Nothing states units per container.** The crate CBM is now known and the
   forwarder's rate is not, so `freightPerCbmEur: 60` remains an assumption
   with one half of its inputs settled. One forwarder invoice closes it.

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
