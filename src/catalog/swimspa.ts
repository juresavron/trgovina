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
 * direction. That freight model is now per cubic metre (see pricing.ts), so
 * nothing ships wrong
 * today — this is a note for whoever fills the inputs in.
 */

import { type Addon, ADDON_GROUP_ORDER } from "./pola";
import { displayPrice, displayPriceCents, envelopeOf, type PackedUnit } from "./pricing";
import { jetsText, filterAreaText } from "./count";

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
  /**
   * What the supplier's packing list states for this model's crate.
   *
   * ⚠️ `pack.netKg` IS 250–450 KG ABOVE `dryKg` on all three models the list
   * covers — the SWIM 450 is 1.050 kg on the price list and 1.500 kg net on
   * the packing list, a 43% gap. Two supplier documents, and nothing here can
   * say which is right. Both are carried; `dryKg` is what the site publishes,
   * `pack` is what freight and access planning use. See the ⚠️ in
   * docs/SUPPLIER-SWIMSPA-2026.md — this is a launch question, because a
   * terrace is engineered against a mass.
   */
  pack?: PackedUnit;
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
    tier: "Vstopni",
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
    pack: { mm: [4525, 2305, 1445], cbm: 15.07, cbmStated: false, netKg: 1500, grossKg: 1520 },
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
    // ⚠️ OFFERED, AND THE SHEET GIVES NO MASS. A 5 m shell holds somewhere
    // near seven tonnes filled and it goes on somebody's terrace; the
    // delivery-and-commissioning promise cannot be made against a figure the
    // supplier never gave. Not estimated from the 3.9 m model. Ask before
    // this one is published.
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
    // Was "SWIM 580 KOMBI". The name was invented here from "1 lounger and 6
    // seats" and it has to go: "kombi" reads as combination unit, which is
    // exactly the claim under dispute on the ZR7807, and asserting it on a
    // DIFFERENT model would put the disputed word on the one page that never
    // had any claim to it. The owner calls this one the Outdoor Hydrotherapy
    // Swim Spa, which is what it is.
    slug: "swim-580-hidro",
    name: "SWIM 580 HIDRO",
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
    pack: { mm: [5825, 2305, 1425], cbm: 19.13, cbmStated: false, netKg: 1850, grossKg: 1870 },
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
    // 94 jets is the most on the entire price list, by 32. A factual badge,
    // and deliberately NOT "Kombinirani" — see the dual-zone note below.
    tier: "Največ šob",
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
    pack: { mm: [5825, 2265, 1375], cbm: 18.14, cbmStated: false, netKg: 1510, grossKg: 1530 },
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
 * Three units, shortest first, chosen by the owner. The other six stay in
 * SWIMSPA_MODELS above because that array is the transcription of the
 * supplier's price list and deleting rows would lose data the business paid
 * for; they simply are not offered. Everything that renders reads THIS.
 *
 * The ladder is not one dimension, and copy written around it has to know
 * that:
 *
 *   ZR6801, 3.90 m — the only unit under four metres, and the reason it is
 *     here is not price. It fits a garden that cannot take a 5.8 m shell,
 *     which is a different customer rather than a cheaper one. Nothing is cut
 *     from it but length: full 3 × 3 HP jet pumps and 2 × 100 sf filtration,
 *     the same as the step above.
 *
 *   ZR6802, 5.00 m — where the current becomes a swim. Same pumps, same
 *     filtration, $910 more. NOT a pure length upgrade, though it is close
 *     enough to sell as one: the jet count goes DOWN, 46 to 44, over a metre
 *     more shell. Worth knowing before a comparison table prints it as an
 *     increase.
 *
 *   ZR7860, 5.80 m — the one with a different story rather than more of the
 *     same. Two control systems, two circulation pumps, two ozonators, three
 *     skimmers at 100 sf each (the best filtration on the list), 1,530 kg dry
 *     (the heaviest, by 80 kg over the ZR7809 Turbine). See the ⚠️ below
 *     before writing the dual-zone claim.
 */
export const OFFERED_SWIMSPAS: readonly SwimSpaModel[] = [
  "ZR7861",
  "ZR7809",
  "ZR7807",
].map((code) => SWIMSPA_MODELS.find((m) => m.code === code)!);

/**
 * ⚠️ TWO THINGS THE SHOP GAVE UP BY NARROWING TO THESE THREE, both of which
 * were its own stated reasons for the earlier range.
 *
 * THE SUB-FOUR-METRE UNIT IS GONE. The ZR6801 at 3.90 m was chosen because it
 * "fits gardens that simply cannot take a 5.8 m unit — that's a different
 * customer, not a cheaper one". The range now starts at 4.50 m, so that
 * customer has nothing to buy. Worth knowing before someone asks why the
 * small-garden enquiries stop converting.
 *
 * THE DUAL-ZONE CANDIDATE IS GONE. On the price list's own evidence — two
 * drainage outlets, two topside panels, three skimmers — the ZR7860 was the
 * unit most likely to actually hold two temperatures at once. It is not
 * offered. The ZR7807 remains and was NAMED as the dual-zone combo, which is
 * exactly the disagreement recorded below and now the only one that matters,
 * because it is the only one still on sale.
 *
 * Both are recoverable: the models stay transcribed, and re-offering either
 * is one entry in the array above plus photography.
 */

/**
 * ⚠️ WHICH MODEL IS THE DUAL-ZONE COMBO IS NOT SETTLED, AND THE SHEET AND THE
 * OWNER DISAGREE.
 *
 * The ZR7807 was added as "Dual Zone Swim Spa and Hot Tub Combo". The price
 * list points the other way, and it points hard — a dual-zone unit is two
 * separate bodies of water, and two bodies of water each need their own drain
 * and their own topside panel:
 *
 *                     ZR7807            ZR7860
 *   Drainage outlets  1                 2
 *   Skimmers          2 x 100 sf        3 x 100 sf
 *   Topside panels    1 x TP600         2 x TP600
 *   Control systems   BP6013G3/BP200G2  1x BP200G2 + 1x BP6013G2
 *   Circulation       2 x 0.35 HP       2 x 1 HP
 *
 * On that evidence the ZR7860 is the dual-zone unit and the ZR7807 is a very
 * well-jetted single-zone swim spa — it has the most jets on the entire list,
 * 94, which is a real distinction and not this one.
 *
 * Either the supplier markets the ZR7807 under that name and its sheet is
 * abbreviated, or the two codes have been crossed. Both are ordinary; neither
 * is guessable from here. So NEITHER model claims two temperatures at once —
 * ZR7860_DUAL_ZONE_CONFIRMED is still false and there is no equivalent flag
 * for the ZR7807, because a flag nobody has set is not evidence.
 *
 * TIERS ARE NOT A LADDER ANY MORE, and that is deliberate. Three of the five
 * models are 5.80 m, so a size word cannot separate them and a made-up
 * hierarchy (Veliki, Večji, Največji) would be inventing rank the catalogue
 * does not have. A tier is set only where it says something true AND
 * distinct: Vstopni for the only unit under four metres, Srednji for the
 * 4.50, "Največ šob" for the 94-jet ZR7807, Vrhunski for the best-equipped
 * ZR7860. The plain 5.80 m ZR7809 carries none, because there is nothing
 * true and short to say about it that its own spec line does not already
 * say.
 */
export const ZR7807_DUAL_ZONE_CONFIRMED = false;

/**
 * ⚠️ THE ZR7861 IS IN THE RANGE, AND THE SHEET SAYS IT HAS NO SWIM JET.
 *
 * The owner supplied eight photographs of it and asked for it in the range,
 * in place of the ZR6802 — it is 4.50 m, which sits between the 3.90 m entry
 * and the 5.80 m top, and swapping the 5.00 m model keeps the only unit under
 * four metres, which serves a garden the others cannot fit.
 *
 * What has not changed is question 1 in docs/SUPPLIER-SWIMSPA-2026.md. The
 * price list gives this model FOUR hydrotherapy jets in total and lists no
 * counter-current jet at all, where every other unit on the same sheet runs
 * 38–94 jets plus three swim jets. A counter-current jet is not a feature of
 * a swim spa, it is the definition of one: without it a 4.5 m shell is a very
 * long hot tub.
 *
 * So the specification is carried EXACTLY as written — swimJets: 0, jets: 4 —
 * and nothing on the page claims otherwise. `swimSpaFamilyHasSwimJets()`
 * below exists so the category card cannot advertise a counter-current jet
 * for a family in which one of three models has none.
 *
 * That is the honest state, not a good one: the page will describe a swim spa
 * whose stated equipment does not match the category it sits in. The fix is a
 * corrected sheet from the supplier, not different copy.
 */
export function swimSpaFamilyHasSwimJets(): boolean {
  return OFFERED_SWIMSPAS.every((m) => m.swimJets > 0);
}

/**
 * ⚠️ THE DUAL-ZONE CLAIM IS NOT YET SUPPORTED BY THE SUPPLIER'S SHEET.
 *
 * The ZR7860 is intended to be sold on "swim pool and hot tub at different
 * temperatures at the same time", which is the strongest story in the
 * category and the reason the price jump is explicable. The hardware the
 * sheet states is consistent with it — 1 × BP200G2 + 1 × BP6013G2, two TP600
 * panels, two circulation pumps, two ozonators — but consistent is not the
 * same as stated. The sheet never uses the words dual zone, never mentions a
 * partition between two bodies of water, and lists the heater exactly as
 * every other model does: "3kw", singular.
 *
 * Two temperatures at once needs two heated volumes. Until the supplier
 * confirms a partition and a second heater, this is a functional claim about
 * the goods with nothing behind it — the exact category ZVPot and the
 * Consumer Protection Act treat as misleading, on the single most persuasive
 * sentence on the page. Confirm it, then write it.
 */
export const ZR7860_DUAL_ZONE_CONFIRMED = false;

/** Look one up by URL segment. */
export function swimSpaBySlug(slug: string): SwimSpaModel | undefined {
  return OFFERED_SWIMSPAS.find((m) => m.slug === slug);
}

/** Metres, as Slovenian writes them: "5,80 × 2,28 m". */
/**
 * The dimension is one token: NBSP around the multiply sign and before the
 * unit, so "1,95 × 1,95 m" can never split across lines — at 390px the card
 * meta wrapped it to "1,95 ×" / "1,95 m", the classic spec-line typo. The
 * meta line still breaks freely at its middot separators.
 */
/**
 * The LENGTH alone, for a <title>.
 *
 * A swim spa is chosen on length — it is the first number in its own model
 * name — and the full footprint costs eight more characters than a title has
 * to spare. The width is on the page, in the spec table and in the standfirst.
 */
export function length(m: SwimSpaModel): string {
  return (m.mm[0] / 1000).toFixed(2).replace(".", ",") + "\u00a0m";
}

export function footprint(m: SwimSpaModel): string {
  const s = (mm: number) => (mm / 1000).toFixed(2).replace(".", ",");
  return s(m.mm[0]) + "\u00a0×\u00a0" + s(m.mm[1]) + "\u00a0m";
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
  // jetsText, never `jets + " šob"`: SWIM 450 has four jets, and four takes
  // the third form — the raw concatenation shipped "4 šob" on three pages.
  return footprint(m) + " · " + seating(m) + " · " + jetsText(m.jets);
}

/** The display price for a model, or the unset dash. */
export function modelPrice(m: SwimSpaModel): string {
  return displayPrice({ kind: "unit", fobUsd: m.fobUsd, envelope: envelopeOf(m.mm, m.dryKg, m.pack) });
}

/** The gross price in cents for schema.org, or 0 when the inputs are unset. */
export function modelPriceCents(m: SwimSpaModel): number {
  return displayPriceCents({ kind: "unit", fobUsd: m.fobUsd, envelope: envelopeOf(m.mm, m.dryKg, m.pack) });
}
