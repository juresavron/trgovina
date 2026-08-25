# Supplier — 2026 Swim Spa price list

Transcribed from `2026_Swimspa_Price_List_.pdf`, 11 pages, received 25 Aug 2026.
Same supplier as the Pola Deluxe series (`SUPPLIER-POLA-2026.md`): Celina Huang,
international sales director, Guangzhou. `src/catalog/swimspa.ts` carries what
the storefront renders; this file is the record of what the sheet actually said,
including the parts of it that do not add up.

## Commercial terms

Identical to the Pola list, and quoted on every page:

| | |
|---|---|
| Payment | T/T 30% down payment, 70% before shipment |
| Delivery | Within 30 days after down payment |
| Port of loading | Huangpu, China |
| Warranty | 2–5 years, subject to different parts |
| Quotation validity | 30 days |

All prices below are **FOB Huangpu, US dollars**. They are a cost basis, not a
selling price — nothing between the quay and a shelf price (freight, duty, VAT,
delivery, installation, margin) is in them.

## The range

Nine units. Two families run in parallel — `ZR68xx` and `ZR78xx` — and the codes
interleave by size rather than by family, so code order tells you nothing.
Ordered here by length, which is how the category is actually bought.

| Code | FOB USD | Length × width × height (mm) | Seating | Jets | Swim jets | Jet pumps | Circ. pump | Dry kg | Filled kg |
|---|---|---|---|---|---|---|---|---|---|
| ZR6801 | 6,250 | 3900 × 2280 × 1350 | 3 seats | 46 | 3 | 3 × 3 HP | 1 × 0.35 HP | 880 | 6,280 |
| ZR7861 | 6,859 | 4500 × 2280 × 1400 | 3 seats | **4** | **none stated** | 3 × 3 HP | 1 × 1 HP | 1,050 | 5,750 |
| ZR6802 | 7,160 | 5000 × 2240 × 1370 | 3 seats | 44 | 3 | 3 × 3 HP | 1 × 0.35 HP | — | — |
| ZR6803 | 8,430 | 5800 × 2280 × **1620** | 3 seats | 44 | 3 | 3 × 3 HP | 1 × 0.35 HP | — | — |
| ZR7809 | 8,530 | 5800 × 2280 × 1400 | 1 lounger + 6 | 38 | 3 | 3 × 3 HP | 1 × 1 HP | 1,430 | 8,490 |
| ZR7801 | 8,857 | 5800 × 2200 × 1550 | 1 lounger + 4 | 62 | 3 | 4 × 3 HP | 2 × 0.35 HP | — | — |
| ZR7807 | 9,150 | 5800 × 2240 × 1350 | 1 lounger + 6 | 94 | 3 | 5 × 3 HP | 2 × 0.35 HP | 1,260 | 7,360 |
| ZR7860 | 9,330 | 5800 × 2280 × 1450 | 1 lounger + 6 | 59 | 3 | 5 × 3 HP | 2 × 1 HP | 1,530 | 8,430 |
| ZR7809 (Turbine) | 11,530 | 5800 × 2280 × 1400 | 1 lounger + 6 | 38 | 3 | turbine + 2 × 3 HP | 1 × 1 HP | 1,450 | 8,530 |

Common to every model: US acrylic shell, silver white 6427; galvanised steel
frame; PS cabinet in optional colours; PVC base; 3 kW heater; Balboa control
system; 220 V / 380 V / 110 V.

### Jet breakdowns, where the sheet gives one

Every stated breakdown reconciles with its stated total — unlike the Pola list,
where four of nine disagreed with themselves.

| Code | 1″ | 2″ | 2.5″ | 3.5″ | 4″ | 5″ | Sum | Stated |
|---|---|---|---|---|---|---|---|---|
| ZR6801 | 10 | 8 | 22 | 2 | 4 | — | 46 | 46 ✓ |
| ZR7861 | 2 | — | — | — | — | 2 | 4 | 4 ✓ |
| ZR7809 | 4 | 22 | 4 | 4 | — | 4 | 38 | 38 ✓ |
| ZR7807 | 50 | — | 14 | 2 | 10 | 18 | 94 | 94 ✓ |
| ZR7860 | 4 | 32 | 4 | 15 | — | 4 | 59 | 59 ✓ |

ZR6802, ZR6803 and ZR7801 state a total with no breakdown.

## Options

Priced per model. The prices move with size and with the piece counts, and the
counts differ, so these are carried per model in code rather than as one shared
list — the same decision, for the same reason, as the Pola options.

| Option | Range across the list |
|---|---|
| Thermal cover | $290 / $360 / $380 / $420 / $435 — **absent on ZR7801** |
| Cover lifter | $75 on all nine |
| Step | $230 on all nine (ZR7861: "3 stairs") |
| Stainless steel handrail | $42 on all nine |
| Rim LED light | $85 (16 pcs) · $106 (22 pcs) · $190 (36 pcs) |
| Air blower with jets + aroma | $120 — absent on ZR7861 |
| Bluetooth amplifier | $165 (4 speakers) · $80 (2 speakers) |
| LED fountain | $30 (3 pcs) · $60 (6 pcs) |
| LED cup holders | $17 (2 pcs, ZR7861) · $32 (2 pcs, elsewhere) |
| 2 × waterfall with LED | $30 |
| Cabinet and bottom insulation | $142 / $190 / $222 / $225 / $250 |
| Spa bag | $141 / $150 / $160 / $170 / $180 / $220 |

## ⚠️ Questions for the supplier

Carried in the code as written, never silently corrected. Each of these changes
either what a page claims or what a customer is charged.

1. **ZR7861 lists four jets in total, and no swim jet.** Every other model on
   the list runs 38–94 hydrotherapy jets plus three counter-current swim jets.
   A 4.5 m unit with four jets and no swim jet is not a swim spa in any sense
   a buyer would accept. Is a line missing from the sheet, or is this a
   different kind of product that got filed with the swim spas?

2. **ZR7801 has no thermal cover price.** Every other model quotes one, $290 to
   $435. A cover is not optional equipment in a Slovenian winter, so this is
   not a line we can leave blank on a product page — and it is not a number we
   can guess, because guessing it means charging a customer a price nobody
   quoted.

3. **ZR7809 appears twice under one code**, the second time as "(Turbine)" at a
   $3,000 premium. Two SKUs cannot share an identity — orders, warranty claims
   and spare parts are all matched on it. Carried in code as `ZR7809-T` pending
   a real code from the supplier.

4. **Three models give no dry or filled mass**: ZR6802, ZR6803, ZR7801. For a
   hot tub that is a nuisance; here it is a blocker. These units run to 8.5
   tonnes filled, which is a structural question about the terrace they stand
   on, and the site cannot promise delivery and commissioning against a mass
   nobody stated. Not estimated from a similar model — a load-bearing figure
   invented to fill a table is worse than a missing one.

5. **ZR7809 has 2 × 50 sf of filtration** where the similarly sized ZR7807 has
   2 × 100 sf and the ZR7860 has 3 × 100 sf, on the same 5.8 m shell and a
   comparable water volume. Correct, or a typo?

6. **ZR6803 is 1,620 mm tall** against 1,350–1,550 mm across the rest. On a
   5.8 m shell with only 3 seats and 44 jets, that reads like a deep swim
   tank rather than a taller version of the others. Confirm what the extra
   270 mm is for — it changes both the copy and the freight envelope.

## ⚠️ Cost model

`CostInputs.freightPerUnitEur` in `src/catalog/pricing.ts` is a **single flat
figure**. That was correct while the catalogue was one line of similar pallets:
every Pola shell is 1.95–2.30 m square and 300–410 kg dry.

It is not correct across both lines. These units are 3.9–5.8 m long and up to
1.53 tonnes dry — a different shipment class entirely, very likely out-of-gauge
or flat-rack rather than a container pallet. One number applied to both lines
under-prices the swim spas by whatever the difference is and over-prices the hot
tubs by the same error in the other direction.

`catalogPricingReady()` still returns `false`, so nothing ships mispriced today.
But the inputs cannot simply be filled in as they stand: **freight has to become
per line (or per model) before either catalogue can be priced.**
