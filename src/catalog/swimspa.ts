/**
 * The 2026 swim spa series, as the site's catalogue.
 *
 * Transcribed from the supplier's 2026 swim spa price list; the full
 * transcription, including the commercial terms and every discrepancy found
 * in it, is in docs/SUPPLIER-SWIMSPA-2026.md. This module carries only what a
 * storefront renders or prices from.
 *
 * WHY THIS IS A SEPARATE MODULE FROM pola.ts, rather than nine more rows in
 * it. These are not big hot tubs. A Pola shell is 1.95–2.30 m square, 300–410
 * kg dry and 2.2 tonnes filled; these run 3.90–5.80 m long, up to 1.53 tonnes
 * dry and 8.5 tonnes filled, and every one of them carries counter-current
 * swim jets that no Pola model has. That difference is not cosmetic:
 *
 *   - It changes the buying question. A hot tub buyer asks how many people
 *     fit; a swim spa buyer asks whether they can swim in it and what the
 *     terrace can hold.
 *   - It changes the freight. A 2 m pallet and a 5.8 m out-of-gauge load are
 *     not the same shipment, and CostInputs.freightPerUnitEur is ONE number.
 *     See the warning under COST above.
 *   - It changes the installation. Eight and a half tonnes over a terrace is
 *     a structural question, not a delivery question.
 *
 * ⚠️ NAMES AND SLUGS ARE PLACEHOLDERS, but factual ones, exactly as in
 * pola.ts: every token is measured — length in centimetres and jet count —
 * because the shop has not chosen marketing names and inventing nine would
 * put unapproved copy on the page. When real names arrive, `name` and `slug`
 * change and nothing else does. The SPECIFICATION is not a placeholder: those
 * figures are the supplier's own and must not be edited to suit a layout.
 *
 * ⚠️ COST. Nothing here can be priced until CostInputs is split by product
 * line. `freightPerUnitEur` is a single flat figure, which was correct while
 * the catalogue was one line of similar pallets. Applied across both lines it
 * would under-price the swim spas by whatever a 5.8 m unit costs to ship over
 * a 2 m one, and over-price the hot tubs by the same error in the other
 * direction. catalogPricingReady() is still false, so nothing ships wrong
 * today — this is a note for whoever fills the inputs in.
 */

import { type Addon, ADDON_GROUP_ORDER } from "./pola";
import { displayPrice, displayPriceCents } from "./pricing";

export { ADDON_GROUP_ORDER };

export interface SwimSpaModel {
  /** The supplier's model code. The identity that survives renaming. */
  code: string;
  /** URL segment under the shop's "/product" route. */
  slug: string;
  /** Card and PDP heading. Placeholder — see the module note. */
  name: string;
  /** FOB Huangpu, whole US dollars. Cost basis; never displayed. */
  fobUsd: number;
  /** Shell footprint and depth, millimetres. */
  mm: readonly [length: number, width: number, height: number];
  /** Total seating positions, loungers included. */
  seats: number;
  /** Reclined positions, of those seats. */
  lounges: number;
  /** Hydrotherapy jets, as the supplier's own total — swim jets excluded. */
  jets: number;
  /**
   * Set when the per-size jet lines do not add up to `jets`, with the sum
   * they do make. Carried rather than silently resolved, for the same reason
   * as in pola.ts: jet count is the number this category is compared on.
   */
  jetPartsSum?: number;
  /**
   * Counter-current swim jets. THE defining feature of the category — a unit
   * with none of these is not a swim spa whatever the price list calls it.
   * 0 means the supplier's sheet states none, which on this list is itself
   * a question rather than a specification (see ZR7861).
   */
  swimJets: number;
  /** Jet pumps, horsepower each. */
  jetPumps: readonly [count: number, hp: number];
  /** True where the sheet specifies a turbine in place of one jet pump. */
  turbine?: boolean;
  /** Circulation pumps, horsepower each. */
  circPumps: readonly [count: number, hp: number];
  /** Filter area, square feet per skimmer. */
  filterSf: number;
  /** Skimmers. Two on most, three on the ZR7860. */
  skimmers: number;
  /**
   * Dry and filled mass, kilograms. Absent where the supplier's sheet omits
   * them — three models give no figure at all, and a filled mass is the
   * number a terrace is engineered against, so it is left missing rather
   * than estimated from a similar model.
   */
  dryKg?: number;
  filledKg?: number;
  /** Balboa topside control panel. */
  topside: "TP600" | "TP500S" | "TOUCH3";
  /** The options this model's page offers, in the supplier's own prices. */
  addons: readonly Addon[];
  /**
   * Where this model sits in the offered range. Absent on models the shop
   * does not sell.
   */
  tier?: string;
}

/**
 * Labels, in one place so nine models cannot disagree about what a thing is
 * called. Mostly the same vocabulary as the hot tubs — the supplier sells the
 * same options across both lines — plus the two this list adds.
 */
const L = {
  cover: "Termo pokrov",
  lifter: "Dvigalo za termo pokrov",
  step: "Stopnice",
  rimLed: "LED osvetlitev roba",
  blowerAroma: "Zračna masaža s šobami in aromaterapijo",
  audio: "Bluetooth ojačevalnik z zvočniki",
  fountain: "LED vodomet",
  cupHolder: "LED držalo za kozarce",
  waterfall: "LED slap",
  handrail: "Nerjavno držalo",
  insulation: "Izolacija ohišja in dna",
  bag: "Transportna torba",
} as const;

/** Which heading each option belongs under. Same four as the hot tubs. */
const G: Record<keyof typeof L, string> = {
  cover: "Pokrov in dostop",
  lifter: "Pokrov in dostop",
  step: "Pokrov in dostop",
  handrail: "Pokrov in dostop",
  blowerAroma: "Masaža in zvok",
  audio: "Masaža in zvok",
  rimLed: "Osvetlitev",
  fountain: "Osvetlitev",
  cupHolder: "Osvetlitev",
  waterfall: "Osvetlitev",
  insulation: "Zaščita in izolacija",
  bag: "Zaščita in izolacija",
};

const a = (key: keyof typeof L, fobUsd: number, qty?: string): Addon =>
  qty
    ? { key, label: L[key], fobUsd, qty, group: G[key] }
    : { key, label: L[key], fobUsd, group: G[key] };

/**
 * Ordered shortest shell first — the order a buyer choosing a length reads
 * them in, and here length is the whole decision: it is what you swim in and
 * what has to fit in the garden.
 *
 * The sequence is the supplier's and it is not tidy. Two families run in
 * parallel (ZR68xx and ZR78xx) and the codes interleave by size rather than
 * by family, so reading these in code order tells you nothing.
 */
export const SWIMSPA_MODELS: readonly SwimSpaModel[] = [
  {
    code: "ZR6801",
    slug: "swim-390",
    name: "SWIM 390",
    fobUsd: 6250,
    mm: [3900, 2280, 1350],
    seats: 3,
    lounges: 0,
    jets: 46,
    swimJets: 3,
    jetPumps: [3, 3],
    circPumps: [1, 0.35],
    filterSf: 100,
    skimmers: 2,
    dryKg: 880,
    filledKg: 6280,
    topside: "TP600",
    addons: [
      a("cover", 290),
      a("lifter", 75),
      a("step", 230),
      a("handrail", 42),
      a("blowerAroma", 120),
      a("audio", 165, "4 zvočniki"),
      a("rimLed", 85, "16 kosov"),
      a("waterfall", 30, "2 kosa"),
      a("insulation", 142),
      a("bag", 141),
    ],
  },
  {
    code: "ZR7861",
    slug: "swim-450",
    name: "SWIM 450",
    fobUsd: 6859,
    mm: [4500, 2280, 1400],
    seats: 3,
    lounges: 0,
    // The supplier's sheet really does say four. Every other model on the
    // list runs 38–94, and this one lists no swim jet at all — on a price
    // list of swim spas. Carried as written; see the questions in
    // docs/SUPPLIER-SWIMSPA-2026.md.
    jets: 4,
    swimJets: 0,
    jetPumps: [3, 3],
    circPumps: [1, 1],
    filterSf: 100,
    skimmers: 2,
    dryKg: 1050,
    filledKg: 5750,
    topside: "TOUCH3",
    addons: [
      a("cover", 360),
      a("lifter", 75),
      a("step", 230, "3 stopnice"),
      a("handrail", 42),
      a("audio", 165, "4 zvočniki"),
      a("rimLed", 106, "22 kosov"),
      a("fountain", 60, "6 kosov"),
      a("cupHolder", 17, "2 kosa"),
      a("insulation", 142),
      a("bag", 160),
    ],
  },
  {
    code: "ZR6802",
    slug: "swim-500",
    name: "SWIM 500",
    fobUsd: 7160,
    mm: [5000, 2240, 1370],
    seats: 3,
    lounges: 0,
    jets: 44,
    swimJets: 3,
    jetPumps: [3, 3],
    circPumps: [1, 0.35],
    filterSf: 100,
    skimmers: 2,
    topside: "TP600",
    addons: [
      a("cover", 380),
      a("lifter", 75),
      a("step", 230),
      a("handrail", 42),
      a("blowerAroma", 120),
      a("audio", 165, "4 zvočniki"),
      a("rimLed", 85, "16 kosov"),
      a("waterfall", 30, "2 kosa"),
      a("insulation", 190),
      a("bag", 170),
    ],
  },
  {
    code: "ZR6803",
    slug: "swim-580-globoki",
    name: "SWIM 580 GLOBOKI",
    fobUsd: 8430,
    mm: [5800, 2280, 1620],
    seats: 3,
    lounges: 0,
    jets: 44,
    swimJets: 3,
    jetPumps: [3, 3],
    circPumps: [1, 0.35],
    filterSf: 100,
    skimmers: 2,
    topside: "TP600",
    addons: [
      a("cover", 435),
      a("lifter", 75),
      a("step", 230),
      a("handrail", 42),
      a("blowerAroma", 120),
      a("audio", 165, "4 zvočniki"),
      a("rimLed", 85, "16 kosov"),
      a("waterfall", 30, "2 kosa"),
      a("insulation", 225),
      a("bag", 220),
    ],
  },
  {
    code: "ZR7809",
    slug: "swim-580-kombi",
    name: "SWIM 580 KOMBI",
    fobUsd: 8530,
    mm: [5800, 2280, 1400],
    seats: 7,
    lounges: 1,
    jets: 38,
    swimJets: 3,
    jetPumps: [3, 3],
    circPumps: [1, 1],
    // Half the filter area of the similarly sized ZR7807 and a third of the
    // ZR7860's, on the same 5.8 m shell. Carried as written; asked about.
    filterSf: 50,
    skimmers: 2,
    dryKg: 1430,
    filledKg: 8490,
    topside: "TP600",
    addons: [
      a("cover", 420),
      a("lifter", 75),
      a("step", 230),
      a("handrail", 42),
      a("blowerAroma", 120),
      a("audio", 165, "4 zvočniki"),
      a("rimLed", 85, "16 kosov"),
      a("fountain", 60, "6 kosov"),
      a("cupHolder", 32, "2 kosa"),
      a("insulation", 222),
      a("bag", 180),
    ],
  },
  {
    code: "ZR7801",
    slug: "swim-580-lezalnik",
    name: "SWIM 580 LEŽALNIK",
    fobUsd: 8857,
    mm: [5800, 2200, 1550],
    seats: 5,
    lounges: 1,
    jets: 62,
    swimJets: 3,
    jetPumps: [4, 3],
    circPumps: [2, 0.35],
    filterSf: 100,
    skimmers: 2,
    topside: "TP600",
    addons: [
      // NOTE: this is the one model on the list with NO thermal cover price.
      // Every other quotes $290–$435. Not invented here — a cover a customer
      // is charged for at a number nobody quoted is the kind of error that
      // ends up in a chargeback.
      a("lifter", 75),
      a("step", 230),
      a("handrail", 42),
      a("blowerAroma", 120),
      a("audio", 80, "2 zvočnika"),
      a("rimLed", 190, "36 kosov"),
      a("fountain", 60, "6 kosov"),
      a("waterfall", 30, "2 kosa"),
      a("insulation", 250),
      a("bag", 150),
    ],
  },
  {
    code: "ZR7807",
    slug: "swim-580-maxi",
    name: "SWIM 580 MAXI",
    fobUsd: 9150,
    mm: [5800, 2240, 1350],
    seats: 7,
    lounges: 1,
    jets: 94,
    swimJets: 3,
    jetPumps: [5, 3],
    circPumps: [2, 0.35],
    filterSf: 100,
    skimmers: 2,
    dryKg: 1260,
    filledKg: 7360,
    topside: "TP600",
    addons: [
      a("cover", 420),
      a("lifter", 75),
      a("step", 230),
      a("handrail", 42),
      a("blowerAroma", 120),
      a("audio", 80, "2 zvočnika"),
      a("rimLed", 85, "16 kosov"),
      a("fountain", 30, "3 kosi"),
      a("insulation", 222),
      a("bag", 180),
    ],
  },
  {
    code: "ZR7860",
    slug: "swim-580-dvojni",
    name: "SWIM 580 DVOJNI",
    fobUsd: 9330,
    mm: [5800, 2280, 1450],
    seats: 7,
    lounges: 1,
    jets: 59,
    swimJets: 3,
    jetPumps: [5, 3],
    circPumps: [2, 1],
    filterSf: 100,
    skimmers: 3,
    dryKg: 1530,
    filledKg: 8430,
    topside: "TP600",
    addons: [
      a("cover", 420),
      a("lifter", 75),
      a("step", 230),
      a("handrail", 42),
      a("blowerAroma", 120),
      a("audio", 165, "4 zvočniki"),
      a("rimLed", 85, "16 kosov"),
      a("fountain", 60, "6 kosov"),
      a("cupHolder", 32, "2 kosa"),
      a("insulation", 222),
      a("bag", 180),
    ],
  },
  {
    // The supplier lists this under the SAME code as the ZR7809 above, with
    // "(Turbine)" appended. It is a different unit at a $3,000 premium, so it
    // is carried with a disambiguated code: two SKUs cannot share an
    // identity, and the identity is what an order, a warranty claim and a
    // spare part are all matched on.
    code: "ZR7809-T",
    slug: "swim-580-turbo",
    name: "SWIM 580 TURBO",
    fobUsd: 11530,
    mm: [5800, 2280, 1400],
    seats: 7,
    lounges: 1,
    jets: 38,
    swimJets: 3,
    jetPumps: [2, 3],
    turbine: true,
    circPumps: [1, 1],
    filterSf: 50,
    skimmers: 2,
    dryKg: 1450,
    filledKg: 8530,
    topside: "TP600",
    addons: [
      a("cover", 420),
      a("lifter", 75),
      a("step", 230),
      a("handrail", 42),
      a("blowerAroma", 120),
      a("audio", 165, "4 zvočniki"),
      a("rimLed", 85, "16 kosov"),
      a("fountain", 60, "6 kosov"),
      a("cupHolder", 32, "2 kosa"),
      a("insulation", 222),
      a("bag", 180),
    ],
  },
];

/**
 * WHAT THE SHOP ACTUALLY SELLS.
 *
 * Empty until the range is chosen. The hot tubs were narrowed from nine to
 * three — one per size — and the same call has not been made here, so nothing
 * is offered rather than all nine being published by default. The array above
 * is the transcription and stays complete; this is the shop's decision, and
 * it is a decision, not an oversight.
 */
export const OFFERED_SWIMSPAS: readonly SwimSpaModel[] = [];

/** Look one up by URL segment. */
export function swimSpaBySlug(slug: string): SwimSpaModel | undefined {
  return OFFERED_SWIMSPAS.find((m) => m.slug === slug);
}

/** Metres, as Slovenian writes them: "5,80 × 2,28 m". */
export function footprint(m: SwimSpaModel): string {
  const s = (mm: number) => (mm / 1000).toFixed(2).replace(".", ",");
  return s(m.mm[0]) + " × " + s(m.mm[1]) + " m";
}

/**
 * The seating line. Same four-form problem Slovenian always has — see the
 * note on pola.ts's seating().
 */
export function seating(m: SwimSpaModel): string {
  const people =
    m.seats === 1 ? "1 oseba" : m.seats === 2 ? "2 osebi" : m.seats <= 4 ? m.seats + " osebe" : m.seats + " oseb";
  if (m.lounges === 0) return people;
  const l = m.lounges === 1 ? "1 ležalnik" : m.lounges === 2 ? "2 ležalnika" : m.lounges + " ležalnikov";
  return people + " · " + l;
}

/**
 * The card's spec line. Leads with LENGTH, not with seating, because that is
 * the question this category is bought on: a swim spa is chosen by what you
 * can swim in and what fits in the garden, and only then by who sits in it.
 * The hot tub's line leads with seating for the mirror-image reason.
 */
export function metaLine(m: SwimSpaModel): string {
  return footprint(m) + " · " + seating(m) + " · " + m.jets + " šob";
}

/** The display price for a model, or the unset dash. */
export function modelPrice(m: SwimSpaModel): string {
  return displayPrice(m.fobUsd);
}

/** The gross price in cents for schema.org, or 0 when the inputs are unset. */
export function modelPriceCents(m: SwimSpaModel): number {
  return displayPriceCents(m.fobUsd);
}
