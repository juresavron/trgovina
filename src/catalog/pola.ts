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
 * a side. A swim spa is a 3.9–5.8 m unit with counter-current jets, and none
 * of these can be sold as one. The swim spas arrived as their own 2026 price
 * list and live in src/catalog/swimspa.ts — separate module, separate
 * freight class, separate buying question. See docs/SUPPLIER-SWIMSPA-2026.md.
 */

import { displayPrice, displayPriceCents, envelopeOf, type PackedUnit } from "./pricing";
import { jetsText } from "./count";
import {
  GENERATED_CABINET_FINISHES,
  GENERATED_SHELL_FINISHES,
} from "./finishes.generated";

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
  /**
   * What the supplier's packing list states for this model's crate, where it
   * states one at all. Freight bills on this, not on `mm`.
   *
   * ⚠️ `pack.netKg` AND `dryKg` DISAGREE ON EVERY MODEL THE LIST COVERS, by
   * 3% to 15%, and the disagreement is carried rather than resolved — the two
   * numbers come from two supplier documents and nobody here can say which is
   * right. `dryKg` stays what the site publishes as "prazen"; `pack` is used
   * for freight and for the crate a customer has to get through a gate. See
   * the ⚠️ in docs/SUPPLIER-POLA-2026.md for the question to put to Celina.
   */
  pack?: PackedUnit;
  /**
   * The thermal cover's own crate — it ships as a separate package, with its
   * own volume and its own weight.
   *
   * Nothing costs it yet: `breakdownFor` prices an add-on as goods + duty +
   * margin with no freight line, on the reasoning that an option is fitted at
   * the factory and travels inside the shell. That is true of a jet light and
   * false of a cover, which is a 0,5–1,05 m³ package in its own right. Stated
   * here so the gap is visible and can be closed deliberately.
   */
  packCover?: PackedUnit;
  /** Balboa topside control panel. */
  topside: "TP600" | "TP500S";
  /** The options this model's page offers, in the supplier's own prices. */
  addons: readonly Addon[];
  /**
   * Where this model sits in the offered range — "Mali", "Srednji", "Veliki".
   * Absent on models the shop does not sell.
   */
  tier?: string;
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
    slug: "veliki-230",
    name: "BAZEN 230",
    tier: "Veliki",
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
    pack: { mm: [2380, 970, 2460], cbm: 5.68, cbmStated: true, netKg: 470, grossKg: 560 },
    packCover: { mm: [1230, 2360, 360], cbm: 1.05, cbmStated: true, netKg: 23, grossKg: 43 },
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
    // ⚠️ 4,97 IS THE SHEET'S FIGURE AND IT DOES NOT MATCH THE SHEET'S OWN
    // DIMENSIONS: 0,98 × 2,21 × 2,27 m is 4,916 m³. The other three rows
    // reconcile exactly, so this is the supplier disagreeing with itself, not
    // a slip here. Carried as stated. Not an offered model; ask before it
    // becomes one. See the test that names it in pricing.test.ts.
    pack: { mm: [980, 2210, 2270], cbm: 4.97, cbmStated: true, netKg: 380, grossKg: 460 },
    packCover: { mm: [2150, 1050, 230], cbm: 0.52, cbmStated: true, netKg: 21, grossKg: 22 },
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
    slug: "srednji-210",
    name: "BAZEN 210",
    tier: "Srednji",
    fobUsd: 2730,
    mm: [2100, 2100, 880],
    seats: 6,
    lounges: 1,
    jets: 37,
    jetPumps: [1, 3],
    filterSf: 100,
    dryKg: 370,
    filledKg: 1870,
    pack: { mm: [970, 2220, 2280], cbm: 4.91, cbmStated: true, netKg: 380, grossKg: 480 },
    packCover: { mm: [2130, 1050, 230], cbm: 0.51, cbmStated: true, netKg: 20, grossKg: 21 },
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
    slug: "mali-195",
    name: "BAZEN 195",
    tier: "Mali",
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
    pack: { mm: [920, 2080, 2190], cbm: 4.19, cbmStated: true, netKg: 320, grossKg: 400 },
    packCover: { mm: [2130, 1040, 360], cbm: 0.8, cbmStated: true, netKg: 20, grossKg: 40 },
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
const TRANSCRIBED_SHELL_FINISHES: readonly string[] = [
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

/**
 * Cabinet panel colours. The PS skirt, not the shell.
 *
 * ⚠️ IN SLOVENIAN, AND THE SHELL NAMES ABOVE ARE NOT — the difference is what
 * kind of string each list holds.
 *
 * These six are plain colour words. The supplier's sheet writes them in
 * English because the sheet is in English, but "Light Grey" carries no
 * information a translation could lose: it is grey, and light. Rendering it
 * untranslated on a Slovenian storefront is not respect for a trade name, it
 * is an untranslated string — which is exactly how it was reported.
 *
 * The shell finishes are the opposite. "Canyon", "Odyssey" and "Oyster Opal"
 * are the acrylic manufacturer's names for particular marbled sheets; they
 * identify the goods on an order, and nothing in this repository knows what
 * colour "Canyon" actually is. Translating them would either invent a
 * description of a product nobody here has seen — the same rule that stops us
 * drawing a swatch for them — or produce a name the supplier would not
 * recognise on a purchase order. So they stay as the chart prints them, and
 * the note in the buy column says they are the manufacturer's own names so a
 * reader can see that the English is deliberate.
 *
 * If the supplier ever publishes a Slovenian colour chart, this is where it
 * lands and the note comes out.
 */
const TRANSCRIBED_CABINET_FINISHES: readonly string[] = [
  "Svetlo siva",
  "Zlato rjava",
  "Temno siva",
  "Rjava",
  "Črna",
  "Siva",
];

/* ================= WHICH LIST THE SITE ACTUALLY RENDERS =================
 *
 * ⚠️ THE PHOTOGRAPH DECIDES, AND THAT IS THE INVERSION.
 *
 * The two arrays above are a TRANSCRIPTION of the supplier's colour chart.
 * They were also, until now, the definition of what could be photographed:
 * admin/site-images.ts built one upload slot per transcribed name, so a
 * colour this shop physically holds but the transcription missed had nowhere
 * to go, and a colour on the chart that the shop cannot show still occupied a
 * tile on the product page.
 *
 * The uploaded set wins where there is one. finishes.generated.ts is written
 * from the `finishes` table by scripts/sync-finishes.mjs, and a row exists
 * there because somebody uploaded a swatch and the name came off the file.
 *
 * ALL OR NOTHING, PER KIND. Merging the two would put colours the shop can
 * show beside colours it cannot, in one row, with nothing on the page telling
 * them apart — which is worse than either list alone. So a kind with any
 * uploads renders exactly those; a kind with none falls back to the
 * transcription, which is what the site rendered before this existed and is
 * still the honest answer for a shop that has photographed nothing yet.
 *
 * The fallback is also what makes this safe to deploy on a build that could
 * not reach Supabase: sync-finishes fails soft and leaves the generated file
 * alone, exactly as sync-reviews does.
 */
export const SHELL_FINISHES: readonly string[] =
  GENERATED_SHELL_FINISHES.length > 0
    ? GENERATED_SHELL_FINISHES.map((f) => f.name)
    : TRANSCRIBED_SHELL_FINISHES;

export const CABINET_FINISHES: readonly string[] =
  GENERATED_CABINET_FINISHES.length > 0
    ? GENERATED_CABINET_FINISHES.map((f) => f.name)
    : TRANSCRIBED_CABINET_FINISHES;

/**
 * Whether a kind's list came from uploaded photographs rather than the
 * transcription. The product page's colour note says different things in the
 * two cases — see pdp.ts — because "the chart lists ten and your model takes
 * seven" is a statement about the manufacturer's chart, and once the list is
 * the shop's own swatches it is no longer true or needed.
 */
export const SHELL_FINISHES_ARE_PHOTOGRAPHED = GENERATED_SHELL_FINISHES.length > 0;


/**
 * WHAT THE SHOP ACTUALLY SELLS.
 *
 * Three shells, one per size, smallest first — the ladder a buyer choosing a
 * hot tub actually walks. The other six stay in POLA_MODELS above because that
 * array is the transcription of the supplier's price list and deleting rows
 * from it would lose data the business paid for; they simply are not offered.
 * Everything that renders reads THIS.
 *
 * One thing the ladder does NOT do is track capacity, and it is worth knowing
 * before writing copy around it: the 210 seats six (one lounger, five seats)
 * while the 230 seats five (two loungers, three seats). "Bigger" here means
 * more terrace and more loungers, not more people — so a card that shows only
 * a size would mislead, and every one of them shows the seating too.
 */
export const OFFERED_MODELS: readonly PolaModel[] = ["ZR805", "ZR804", "ZR801"].map(
  (code) => POLA_MODELS.find((m) => m.code === code)!,
);

/** Look one up by URL segment. */
export function polaBySlug(slug: string): PolaModel | undefined {
  return OFFERED_MODELS.find((m) => m.slug === slug);
}

/** Metres, as Slovenian writes them: "2,30 × 2,30 m". */
/**
 * The dimension is one token: NBSP around the multiply sign and before the
 * unit, so "1,95 × 1,95 m" can never split across lines — at 390px the card
 * meta wrapped it to "1,95 ×" / "1,95 m", the classic spec-line typo. The
 * meta line still breaks freely at its middot separators.
 */
export function footprint(m: PolaModel): string {
  const s = (mm: number) => (mm / 1000).toFixed(2).replace(".", ",");
  return s(m.mm[0]) + "\u00a0×\u00a0" + s(m.mm[1]) + "\u00a0m";
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
  // jetsText for the same reason swimspa.ts's metaLine uses it: today every
  // offered tub counts 35–50 jets and the raw " šob" happens to be right,
  // but the first model with 2–4 jets would print the wrong form.
  return seating(m) + " · " + jetsText(m.jets) + " · " + footprint(m);
}

/** The display price for a model, or the unset dash. */
export function modelPrice(m: PolaModel): string {
  return displayPrice({ kind: "unit", fobUsd: m.fobUsd, envelope: envelopeOf(m.mm, m.dryKg, m.pack) });
}

/**
 * The display price for one option. Rounded on the `addon` tier, because a
 * €14 pillow light taken up to a shell's retail point would be priced at €90.
 */
export function addonPrice(x: Addon): string {
  return displayPrice({ kind: "addon", fobUsd: x.fobUsd });
}

/** The same figure as a number, for the buy bar's total. 0 when unpriced. */
export function addonPriceCents(x: Addon): number {
  return displayPriceCents({ kind: "addon", fobUsd: x.fobUsd });
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
  return displayPriceCents({ kind: "unit", fobUsd: m.fobUsd, envelope: envelopeOf(m.mm, m.dryKg, m.pack) });
}
