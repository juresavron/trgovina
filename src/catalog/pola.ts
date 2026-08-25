/**
 * The Pola Deluxe Series, as the site's catalogue.
 *
 * Transcribed from the supplier's 2026 price list; the full transcription,
 * including the options list and the commercial terms, is in
 * docs/SUPPLIER-POLA-2026.md. This module carries only what a storefront
 * renders or prices from.
 *
 * ⚠️ NAMES AND SLUGS ARE PLACEHOLDERS, but factual ones. Every token in them
 * is measured — shell size in centimetres and jet count — because the shop
 * has not chosen marketing names yet and inventing nine of them would put
 * copy on the page that nobody has approved. When real names arrive, `name`
 * and `slug` change and nothing else does. What is NOT a placeholder is the
 * specification: those figures are the supplier's own and must not be edited
 * to suit a layout.
 *
 * ⚠️ THERE IS NO SWIM SPA HERE. Every model is a square hot tub, 1.95–2.30 m
 * a side. A swim spa is a 3.8–7 m unit with a counter-current jet, and none
 * of these can be sold as one. See the note under the same heading in
 * docs/SUPPLIER-POLA-2026.md.
 */

import { displayPrice, priceFromFob } from "./pricing";

export interface PolaModel {
  /** The supplier's model code. The identity that survives renaming. */
  code: string;
  /** URL segment under the shop's "/product" route. */
  slug: string;
  /** Card and PDP heading. Placeholder — see the module note. */
  name: string;
  /** FOB Huangpu, whole US dollars. Cost basis; never displayed. */
  fobUsd: number;
  /** Shell footprint and depth, millimetres. */
  mm: readonly [width: number, depth: number, height: number];
  /** Total seating positions, loungers included. */
  seats: number;
  /** Reclined positions, of those seats. */
  lounges: number;
  /** Jets, as the supplier's own total. */
  jets: number;
  /**
   * Set when the per-size jet lines do not add up to `jets`, with the sum
   * they do make. Four models in the list disagree with themselves; the
   * discrepancy is carried rather than silently resolved, because jet count
   * is the number this category is compared on. Nothing renders it — it is
   * here so the supplier can be asked, and so a future spec table cannot
   * print a figure that was quietly picked.
   */
  jetPartsSum?: number;
  /** Jet pumps, horsepower each (a 0.35 HP circulation pump is standard). */
  jetPumps: readonly [count: number, hp: number];
  /** Filter area, square feet. */
  filterSf: number;
  dryKg: number;
  filledKg: number;
  /** Balboa topside control panel. */
  topside: "TP600" | "TP500S";
}

/**
 * Ordered largest shell first, then by jet count — the order a buyer choosing
 * a size reads them in. ZR806 is absent from the supplier's list; the
 * sequence really does skip it.
 */
export const POLA_MODELS: readonly PolaModel[] = [
  {
    code: "ZR810",
    slug: "230-lezalnik-55",
    name: "BAZEN 230/55",
    fobUsd: 3160,
    mm: [2300, 2300, 880],
    seats: 6,
    lounges: 1,
    jets: 55,
    jetPumps: [2, 3],
    filterSf: 50,
    dryKg: 410,
    filledKg: 2210,
    topside: "TP600",
  },
  {
    code: "ZR801",
    slug: "230-dva-lezalnika-50",
    name: "BAZEN 230/50",
    fobUsd: 3140,
    mm: [2300, 2300, 880],
    seats: 5,
    lounges: 2,
    jets: 50,
    jetPartsSum: 47,
    jetPumps: [2, 3],
    filterSf: 100,
    dryKg: 410,
    filledKg: 2210,
    topside: "TP600",
  },
  {
    code: "ZR802",
    slug: "230-lezalnik-42",
    name: "BAZEN 230/42",
    fobUsd: 3100,
    mm: [2300, 2300, 880],
    seats: 6,
    lounges: 1,
    jets: 42,
    jetPartsSum: 40,
    jetPumps: [2, 3],
    filterSf: 100,
    dryKg: 410,
    filledKg: 2210,
    topside: "TP600",
  },
  {
    code: "ZR807",
    slug: "230-dva-lezalnika-41",
    name: "BAZEN 230/41",
    fobUsd: 3100,
    mm: [2300, 2300, 880],
    seats: 5,
    lounges: 2,
    jets: 41,
    jetPumps: [2, 3],
    filterSf: 50,
    dryKg: 410,
    filledKg: 2210,
    topside: "TP600",
  },
  {
    code: "ZR803",
    slug: "210-dva-lezalnika-38",
    name: "BAZEN 210/38",
    fobUsd: 2730,
    mm: [2100, 2100, 880],
    seats: 5,
    lounges: 2,
    jets: 38,
    jetPartsSum: 40,
    jetPumps: [1, 3],
    filterSf: 100,
    dryKg: 370,
    filledKg: 1870,
    topside: "TP500S",
  },
  {
    code: "ZR804",
    slug: "210-lezalnik-37",
    name: "BAZEN 210/37",
    fobUsd: 2730,
    mm: [2100, 2100, 880],
    seats: 6,
    lounges: 1,
    jets: 37,
    jetPumps: [1, 3],
    filterSf: 100,
    dryKg: 370,
    filledKg: 1870,
    topside: "TP500S",
  },
  {
    code: "ZR805",
    slug: "195-dva-lezalnika-35",
    name: "BAZEN 195/35",
    fobUsd: 2630,
    mm: [1950, 1950, 820],
    seats: 5,
    lounges: 2,
    jets: 35,
    jetPartsSum: 28,
    jetPumps: [1, 3],
    filterSf: 100,
    dryKg: 300,
    filledKg: 1500,
    topside: "TP500S",
  },
  {
    code: "ZR808",
    slug: "200-sedezi-34",
    name: "BAZEN 200/34",
    fobUsd: 2635,
    mm: [2000, 2000, 820],
    seats: 5,
    lounges: 0,
    jets: 34,
    jetPumps: [1, 3],
    filterSf: 50,
    dryKg: 300,
    filledKg: 1600,
    topside: "TP500S",
  },
  {
    code: "ZR809",
    slug: "210-dva-lezalnika-32",
    name: "BAZEN 210/32",
    fobUsd: 2700,
    mm: [2100, 2100, 820],
    seats: 5,
    lounges: 2,
    jets: 32,
    jetPumps: [1, 3],
    filterSf: 100,
    dryKg: 300,
    filledKg: 1600,
    topside: "TP500S",
  },
];

/** Look one up by URL segment. */
export function polaBySlug(slug: string): PolaModel | undefined {
  return POLA_MODELS.find((m) => m.slug === slug);
}

/** Metres, as Slovenian writes them: "2,30 × 2,30 m". */
export function footprint(m: PolaModel): string {
  const s = (mm: number) => (mm / 1000).toFixed(2).replace(".", ",");
  return s(m.mm[0]) + " × " + s(m.mm[1]) + " m";
}

/**
 * The seating line. Spelled out rather than "5 oseb · 2 ležalnika" everywhere
 * because Slovenian counts in four grammatical forms and "2 ležalnika" is
 * dual, not plural — getting this wrong is the sort of thing that makes a
 * shop read as machine-translated.
 */
export function seating(m: PolaModel): string {
  const people =
    m.seats === 1 ? "1 oseba" : m.seats === 2 ? "2 osebi" : m.seats <= 4 ? m.seats + " osebe" : m.seats + " oseb";
  if (m.lounges === 0) return people;
  const l = m.lounges === 1 ? "1 ležalnik" : m.lounges === 2 ? "2 ležalnika" : m.lounges + " ležalnikov";
  return people + " · " + l;
}

/** The card's spec line: who fits, how many jets, how much terrace it needs. */
export function metaLine(m: PolaModel): string {
  return seating(m) + " · " + m.jets + " šob · " + footprint(m);
}

/** The display price for a model, or the unset dash. */
export function modelPrice(m: PolaModel): string {
  return displayPrice(m.fobUsd);
}

/**
 * The gross price in cents for schema.org, or 0 when the inputs are unset.
 *
 * 0 is the signal to omit the Offer entirely rather than publish one. A
 * Product with a price nobody set is a structured-data claim about money,
 * which is the category of error that earns a manual action — the same
 * reasoning that already keeps Review schema off these pages.
 */
export function modelPriceCents(m: PolaModel): number {
  return priceFromFob(m.fobUsd)?.displayEur ?? 0;
}
