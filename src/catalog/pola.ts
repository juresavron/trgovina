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

import { displayPrice, displayPriceCents, priceFromFob } from "./pricing";

/**
 * An option the supplier prices separately from the shell.
 *
 * Availability and price BOTH vary by model — the cabinet insulation is $70 on
 * eight models and $60 on ZR807, the rim LED is $85 at sixteen pieces and $43
 * at eight, and half the models are not offered an air blower at all. So these
 * are carried per model rather than as one shared list: a shared list would be
 * shorter to write and would quote the wrong price on at least two pages.
 */
export interface Addon {
  /** Stable identity: the form field name, and later the variant SKU. */
  key: string;
  /** Slovenian label, as the page shows it. */
  label: string;
  /** The supplier's FOB price, whole US dollars. Cost basis. */
  fobUsd: number;
  /** Quantity, where the supplier states one that differs between models. */
  qty?: string;
  /** Which heading the option sits under on the page. */
  group: string;
}

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
  /** The options this model's page offers, in the supplier's own prices. */
  addons: readonly Addon[];
}

/**
 * Labels, in one place so nine models cannot disagree about what a thing is
 * called. The keys are the supplier's own option names, flattened.
 */
const L = {
  cover: "Termo pokrov",
  lifter: "Dvigalo za termo pokrov",
  step: "Stopnica",
  rimLed: "LED osvetlitev roba",
  jetLed: "LED osvetlitev šob in ventilov",
  blower: "Zračna masaža s šobami",
  blowerAroma: "Zračna masaža s šobami in aromaterapijo",
  audio: "Bluetooth ojačevalnik z zvočniki",
  skirtLed: "LED osvetlitev obloge",
  fountain: "LED vodomet",
  cupHolder: "LED držalo za kozarce",
  waterfall: "LED slap z ventilom",
  insulation: "Izolacija ohišja in dna",
  bag: "Transportna torba",
  pillowLed: "LED osvetlitev vzglavnika",
} as const;

/**
 * Which heading each option belongs under.
 *
 * Fourteen options in one flat column is a list nobody reads: every row is the
 * same shape, the same length and the same weight, so the eye has nothing to
 * navigate by and the expensive choices sit level with the cup holders. Four
 * headings turn it into something you can scan for the decision you came to
 * make.
 *
 * Derived from the key rather than written on all 104 entries, so a group can
 * never disagree with itself between models.
 */
const G: Record<keyof typeof L, string> = {
  cover: "Pokrov in dostop",
  lifter: "Pokrov in dostop",
  step: "Pokrov in dostop",
  blower: "Masaža in zvok",
  blowerAroma: "Masaža in zvok",
  audio: "Masaža in zvok",
  rimLed: "Osvetlitev",
  jetLed: "Osvetlitev",
  skirtLed: "Osvetlitev",
  fountain: "Osvetlitev",
  cupHolder: "Osvetlitev",
  waterfall: "Osvetlitev",
  pillowLed: "Osvetlitev",
  insulation: "Zaščita in izolacija",
  bag: "Zaščita in izolacija",
};

/**
 * The order the headings appear in: what the tub needs to be usable outdoors
 * first, then what it does, then the lights, then what protects it. Not the
 * supplier's order, which is whatever fitted on their page.
 */
export const ADDON_GROUP_ORDER: readonly string[] = [
  "Pokrov in dostop",
  "Masaža in zvok",
  "Osvetlitev",
  "Zaščita in izolacija",
];

const a = (key: keyof typeof L, fobUsd: number, qty?: string): Addon =>
  qty
    ? { key, label: L[key], fobUsd, qty, group: G[key] }
    : { key, label: L[key], fobUsd, group: G[key] };

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
    addons: [
      a("cover", 153),
      a("lifter", 75),
      a("step", 60),
      a("rimLed", 85, "16 kosov"),
      a("jetLed", 107, "16 šob in 4 ventili"),
      a("blowerAroma", 120),
      a("audio", 80),
      a("skirtLed", 58),
      a("fountain", 22, "2 kosa"),
      a("cupHolder", 17, "2 kosa"),
      a("waterfall", 15),
      a("pillowLed", 14, "3 kosi"),
      a("insulation", 70),
      a("bag", 83),
    ],
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
    addons: [
      a("cover", 153),
      a("lifter", 75),
      a("step", 60),
      a("rimLed", 85, "16 kosov"),
      a("blowerAroma", 120),
      a("audio", 80),
      a("skirtLed", 58),
      a("fountain", 30, "3 kosi"),
      a("cupHolder", 36, "5 kosov"),
      a("waterfall", 15),
      a("insulation", 70),
      a("bag", 83),
    ],
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
    addons: [
      a("cover", 153),
      a("lifter", 75),
      a("step", 60),
      a("rimLed", 85, "16 kosov"),
      a("blowerAroma", 120),
      a("audio", 80),
      a("skirtLed", 58),
      a("fountain", 30, "3 kosi"),
      a("waterfall", 15),
      a("insulation", 70),
      // The list prices this at 153, the same as the cover, where every other
      // model puts the bag at 70–83. Carried as printed; flagged for the
      // supplier in docs/SUPPLIER-POLA-2026.md rather than quietly corrected.
      a("bag", 153),
    ],
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
    addons: [
      a("cover", 153),
      a("lifter", 75),
      a("step", 60),
      a("rimLed", 85, "16 kosov"),
      a("jetLed", 107, "16 šob in 4 ventili"),
      a("blower", 100),
      a("audio", 80),
      a("skirtLed", 58),
      a("fountain", 30, "3 kosi"),
      a("cupHolder", 42, "6 kosov"),
      a("waterfall", 15),
      a("pillowLed", 14, "1 kos"),
      // $60 here where every other model prices the same insulation at $70.
      a("insulation", 60),
      a("bag", 83),
    ],
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
    addons: [
      a("cover", 130),
      a("step", 60),
      a("rimLed", 85, "16 kosov"),
      a("jetLed", 110, "16 šob in 3 ventili"),
      a("audio", 80),
      a("skirtLed", 58),
      a("fountain", 30, "3 kosi"),
      a("cupHolder", 23, "3 kosi"),
      a("waterfall", 15),
      a("insulation", 70),
    ],
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
    addons: [
      a("cover", 130),
      a("step", 60),
      a("rimLed", 85, "16 kosov"),
      a("jetLed", 110, "16 šob in 3 ventili"),
      a("blowerAroma", 120),
      a("audio", 80),
      a("skirtLed", 58),
      a("fountain", 30, "3 kosi"),
      a("cupHolder", 23, "4 kosi"),
      a("waterfall", 15),
      a("insulation", 70),
    ],
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
    addons: [
      a("cover", 115),
      a("lifter", 75),
      a("step", 60),
      a("rimLed", 85, "16 kosov"),
      a("jetLed", 104, "16 šob in 3 ventili"),
      a("audio", 80),
      a("skirtLed", 58),
      a("fountain", 30, "3 kosi"),
      a("cupHolder", 17, "2 kosa"),
      a("insulation", 70),
    ],
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
    addons: [
      a("cover", 130),
      a("step", 60),
      // Eight pieces at $85 here; ZR809 prices the same eight at $43.
      a("rimLed", 85, "8 kosov"),
      a("jetLed", 110, "16 šob in 5 ventilov"),
      a("audio", 80),
      a("skirtLed", 58),
      a("fountain", 22, "2 kosa"),
      a("cupHolder", 23, "3 kosi"),
      a("waterfall", 15),
      a("insulation", 70),
    ],
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
    addons: [
      a("cover", 130),
      a("lifter", 75),
      a("step", 60),
      a("rimLed", 43, "8 kosov"),
      a("jetLed", 110, "16 šob in 5 ventilov"),
      a("audio", 80),
      a("skirtLed", 58),
      a("fountain", 22, "2 kosa"),
      a("cupHolder", 23, "3 kosi"),
      a("waterfall", 15),
      a("insulation", 70),
      a("bag", 70),
    ],
  },
];

/**
 * Acrylic shell finishes, as the price list names them.
 *
 * NAMES, NOT SWATCHES. Every model's sheet says "7 colors for options" and the
 * colour page prints ten finish names across two groups, so which seven apply
 * to a given model is not something this document answers — and the finishes
 * are marbled acrylics ("Silver white marble", "Ocean Wave"), which no hex
 * value describes. Rendering invented circles would be a picture of the goods
 * that nobody has seen. The page lists what we actually know: the names.
 *
 * Ask the supplier which seven per model, and for swatch images, before this
 * becomes a colour picker.
 */
export const SHELL_FINISHES: readonly string[] = [
  "Midnight",
  "Canyon",
  "Silver white marble",
  "Oyster Opal",
  "Gypsum",
  "Opal",
  "Ocean Wave",
  "Mediterranean",
  "Sunset",
  "Odyssey",
];

/** Cabinet panel colours. The PS skirt, not the shell. */
export const CABINET_FINISHES: readonly string[] = [
  "Light Grey",
  "Gold brown",
  "Dark Grey",
  "Brown",
  "Black",
  "Grey",
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
 * The display price for one option. Rounded on the `addon` tier, because a
 * €14 pillow light taken up to a shell's retail point would be priced at €90.
 */
export function addonPrice(x: Addon): string {
  return displayPrice(x.fobUsd, "addon");
}

/** The same figure as a number, for the buy bar's total. 0 when unpriced. */
export function addonPriceCents(x: Addon): number {
  return displayPriceCents(x.fobUsd, "addon");
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
  return displayPriceCents(m.fobUsd);
}
