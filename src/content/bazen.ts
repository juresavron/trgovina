import type {
  Category,
  Collection,
  PdpContent,
  PdpPhoto,
  ProductCard,
  ShopContent,
} from "./types";
import { OWN_MEDIA } from "../themes/studio/own-media";
import { GENERATED_REVIEWS } from "./reviews.generated";
import type { SwimSpaModel } from "../catalog/swimspa";
import {
  OFFERED_SWIMSPAS,
  swimSpaFamilyHasSwimJets,
  footprint as swimFootprint,
  metaLine as swimMetaLine,
  modelPrice as swimModelPrice,
  modelPriceCents as swimModelPriceCents,
  seating as swimSeating,
} from "../catalog/swimspa";
import type { PolaModel } from "../catalog/pola";
import { catalogPricingReady } from "../catalog/pricing";
import { filterAreaText, kgText } from "../catalog/count";
import {
  CABINET_FINISHES,
  OFFERED_MODELS,
  SHELL_FINISHES,
  addonPrice,
  addonPriceCents,
  footprint,
  metaLine,
  modelPrice,
  modelPriceCents,
  seating,
} from "../catalog/pola";
import { PRICE_UNSET } from "../catalog/pricing";

/**
 * A counted noun in Slovenian, given its four forms.
 *
 * WHY A HELPER RATHER THAN THREE FIXES. Three call sites concatenated a
 * number straight onto a GENITIVE plural — "masažnih šob", "nastavljivih
 * šob" — which is right for five and up and wrong for everything below.
 * Measured against the catalogue: the hot tubs carry 35, 37 and 50 jets, so
 * two of those sites read correctly today by arithmetic rather than by
 * design. The swim spas carry 4, 38 and 94, and the 4 is SWIM 450 — the one
 * model that printed "4 masažnih šob".
 *
 * That is the whole reason this is a helper. A bug that only appears when a
 * supplier figure happens to fall below five is invisible on five pages out
 * of six, and it comes back the day a model with two pumps or one jet is
 * added. Passing the forms in makes the agreement a property of the phrase
 * instead of a property of the numbers that happen to be in the catalogue.
 *
 * Forms are [1, 2, 3-4, 5+] — the four Slovenian numeral classes, on the
 * last two digits.
 */
function counted(n: number, forms: readonly [string, string, string, string]): string {
  const t = n % 100;
  const i = t === 1 ? 0 : t === 2 ? 1 : t === 3 || t === 4 ? 2 : 3;
  return n + " " + forms[i];
}

const MASSAGE_JETS = ["masažna šoba", "masažni šobi", "masažne šobe", "masažnih šob"] as const;
/**
 * Every model the shop actually offers, both families, for the figures that
 * describe the RANGE rather than one product.
 *
 * ⚠️ dryKg IS OPTIONAL ON A SWIM SPA — the catalogue omits it where the
 * supplier's sheet states no mass, deliberately, because a dash reads as
 * "none" and an estimate is a structural claim nobody made. So the mass
 * figure below filters rather than assuming, and a model with no stated mass
 * simply does not raise the maximum.
 */
const allOffered: readonly { mm: readonly number[]; jets: number; dryKg?: number }[] = [
  ...OFFERED_MODELS,
  ...OFFERED_SWIMSPAS,
];

/** The heaviest empty mass the supplier actually states, across both families. */
const heaviestDryKg = Math.max(
  ...allOffered.map((m) => m.dryKg).filter((kg): kg is number => typeof kg === "number"),
);

/**
 * The offer, built from the supplier catalogue rather than typed out.
 *
 * Nine models differing only in shell size, seating layout and jet count is
 * exactly the case where hand-written cards drift: one gets repriced, another
 * keeps last season's jet count, and the comparison table stops agreeing with
 * the product pages. The specification comes from src/catalog/pola.ts and the
 * price from the landed-cost calculation, so a card cannot disagree with
 * either.
 *
 * This does not breach the anti-doorway rule in docs/SEO.md §6 — that rule is
 * about copy shared BETWEEN shops. These are variants of one product line
 * within one shop, which is what a catalogue is.
 */

/**
 * Alt text for the photographs, by model slug and in file order.
 *
 * Written from what is actually visible in each frame and no further. "Šobe v
 * hrbtnem naslonu" is describable; the number of them is not, at this
 * resolution, and a count invented for alt text is a specification claim made
 * in the one place nobody proofreads. The cabinet is never called wooden: the
 * price list says PS panel, and it only looks like wood.
 *
 * These are product photographs, so the alt is content rather than decoration
 * — a screen reader needs it, and image search is a real channel for goods at
 * this price.
 */
const PHOTO_ALT: Readonly<Record<string, readonly string[]>> = {
  "veliki-230": [
    "Masažni bazen od zgoraj — dva ležalnika, trije sedeži in razporeditev masažnih šob.",
    "Notranjost akrilne školjke z masažnimi šobami v hrbtnem naslonu.",
    "Nožni del školjke z večjimi masažnimi šobami.",
    "Bazen z vklopljeno modro LED osvetlitvijo školjke.",
    "Bazen s turkizno osvetljeno školjko in svetlobnim trakom v oblogi.",
    "Bazen z zeleno osvetljeno školjko in svetlobnim trakom v oblogi.",
    "Bližnji posnetek dveh masažnih šob v školjki.",
    "Sedežni del školjke z masažnimi šobami.",
    "Bazen s strani — temna obloga s svetlobnim trakom.",
    "Masažni bazen s tričetrtinskega pogleda — bela školjka in temna obloga.",
  ],
  "mali-195": [
    "Masažni bazen od zgoraj — razporeditev sedežev, ležalnikov in masažnih šob v marmorirani školjki.",
    "Bazen s tričetrtinskega pogleda — marmorirana školjka in temna obloga.",
    "Notranjost školjke z vzglavnikom in masažnimi šobami.",
    "Kotni sedež z masažnimi šobami.",
    "Sedežni del školjke z vzglavnikoma in masažnimi šobami.",
    "Bazen s strani — obloga in marmorirana školjka.",
  ],
};

/** The photographs a model has, paired with their alt text. */
function photosFor(m: PolaModel): PdpPhoto[] {
  const set = OWN_MEDIA["bazen/" + m.slug] ?? [];
  return set.map((p, i) => ({
    src: p.src,
    ...(p.w && p.h ? { w: p.w, h: p.h } : {}),
    widths: p.widths,
    // Alt now travels WITH the photograph, from Supabase through the
    // generated index, because that is where the picture itself lives and the
    // two must not be edited in different places. PHOTO_ALT below is the
    // older local table, kept only as the fallback for anything the index
    // has not described.
    alt: p.alt || PHOTO_ALT[m.slug]?.[i] || m.name + " — fotografija " + (i + 1) + ".",
  }));
}

/**
 * THE TWO FAMILIES, as the rail under the hero shows them.
 *
 * The shop sells one thing in two very different sizes, and until now the rail
 * printed three MODEL cards — which meant the page's second device answered
 * "which of these three?" before it had answered "which kind of thing?". With
 * a 3.90–5.80 m line alongside a 1.95–2.30 m one that is the wrong first
 * question by a wide margin: a buyer with a terrace and a buyer with a garden
 * are not choosing between neighbouring options, they are in different
 * markets.
 *
 * Each card carries a RANGE, which a model card may not. A range against an
 * identified product would breach ZVPot (Directive 98/6/EC — the price shown
 * for an identified product must be that product's); against a family it is
 * simply what the family costs, and it is the number that tells a visitor
 * whether to keep reading.
 *
 * The measurement in `meta` is the one each family is actually chosen on:
 * hot tubs by how much terrace they need, swim spas by how long a swim is.
 */
function familyRange(prices: string[]): string {
  const nums = prices
    .map((p) => Number(p.replace(/[^0-9]/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return PRICE_UNSET;
  const lo = prices[nums.indexOf(Math.min(...nums))]!;
  const hi = prices[nums.indexOf(Math.max(...nums))]!;
  // U+2013 EN DASH between endpoints, per Slovenian typographic practice.
  return lo === hi ? lo : lo + " – " + hi;
}

/** Centimetres, shortest to longest: "195–230 cm". */
function sizeSpan(mms: number[]): string {
  const cm = mms.map((mm) => Math.round(mm / 10));
  const lo = Math.min(...cm);
  const hi = Math.max(...cm);
  return lo === hi ? lo + " cm" : lo + "–" + hi + " cm";
}

/**
 * The swim spa cards.
 *
 * No photography exists for this family, so every card wears the drawing —
 * which is the honest state, and the drawing is drawn to the right proportion
 * so a card cannot imply a 2 m tub. The description leads with LENGTH because
 * that is what the family is chosen on; the hot tub cards lead with the
 * footprint for the mirror-image reason.
 */
/** The photographs a swim spa has, paired with their alt text. */
function swimPhotosFor(m: SwimSpaModel): PdpPhoto[] {
  const set = OWN_MEDIA["bazen/" + m.slug] ?? [];
  return set.map((p) => ({
    src: p.src,
    ...(p.w && p.h ? { w: p.w, h: p.h } : {}),
    widths: p.widths,
    alt: p.alt || m.name,
  }));
}

const swimSpas: ProductCard[] = OFFERED_SWIMSPAS.map((m) => ({
  name: m.name,
  // The counter-current jet is named only where the model HAS one. It was
  // written into every card as a constant, which was true of the range until
  // the ZR7861 joined it — the one model whose sheet lists none.
  desc:
    "Akrilna školjka " +
    swimFootprint(m) +
    (m.swimJets === 1
      ? " s protitočno šobo, "
      : m.swimJets > 1
        ? " s protitočnimi šobami, "
        : ", ") +
    counted(m.jets, MASSAGE_JETS) +
    ", " +
    swimSeating(m) +
    ".",
  meta: swimMetaLine(m),
  price: swimModelPrice(m),
  art: "swimspa" as const,
  slug: m.slug,
  // A photograph beats the drawing. Only the ZR7861 has any today.
  ...(swimPhotosFor(m)[0] ? { photo: swimPhotosFor(m)[0]! } : {}),
  ...(m.tier ? { badge: m.tier } : {}),
}));

/**
 * "3 modeli", but "5 modelov".
 *
 * Slovenian counts in four forms and the count line was using the plural for
 * everything, which was correct while both families had three models and
 * became wrong the moment the swim spa range grew to five. Same class of
 * error as "2 ležalnika" — see seating() in pola.ts — and the same
 * consequence: a shop that gets its own numerals wrong reads as machine
 * translated, which on a EUR 6-9k purchase is not a small thing.
 *
 *   1        model      (singular)
 *   2        modela     (dual)
 *   3, 4     modeli     (plural)
 *   5 and up modelov    (genitive plural)
 */
/** The sticky buy bar is a cramped strip, so the noun is bare — still agreeing. */
const JETS_SHORT = ["šoba", "šobi", "šobe", "šob"] as const;

const ADJUSTABLE_JETS = [
  "nastavljiva šoba", "nastavljivi šobi", "nastavljive šobe", "nastavljivih šob",
] as const;

function modelCount(n: number): string {
  const t = n % 100;
  if (t === 1) return n + " model";
  if (t === 2) return n + " modela";
  if (t === 3 || t === 4) return n + " modeli";
  return n + " modelov";
}

const categories: Category[] = [
  {
    name: "Masažni bazeni",
    meta:
      modelCount(OFFERED_MODELS.length) +
      " · " +
      sizeSpan(OFFERED_MODELS.map((m) => m.mm[0])) +
      " · za 5 ali 6 oseb",
    price: familyRange(OFFERED_MODELS.map((m) => modelPrice(m))),
    href: "/masazni-bazeni",
    // The photograph supplied for this family, under a clean alias because the
    // file in the bucket is named "Generated Image August 25, 2026 - 6_06PM
    // Large" — see src/media-aliases.ts. It replaced a ZR801 product shot,
    // which was a picture of ONE model standing for the whole family.
    //
    // The alt says only what is certain. This build cannot open the file, and
    // "na terasi" — which is what it said a moment ago — was a guess about a
    // setting nobody here has seen. An alt is the picture for a screen reader
    // user; inventing its contents is worse than describing less.
    photo: {
      src: "/media/site/kategorija-masazni-bazeni.webp",
      widths: [],
      alt: "Masažni bazen",
    },
    art: "pool" as const,
  },
  {
    name: "Swim spa bazeni",
    // The counter-current claim is DERIVED, not written. It is the one thing
    // that separates this family from the hot tubs, so it is exactly the
    // claim that must not survive a model joining the range without one —
    // and the ZR7861's sheet lists none. See the note on
    // swimSpaFamilyHasSwimJets().
    meta:
      modelCount(OFFERED_SWIMSPAS.length) +
      " · " +
      sizeSpan(OFFERED_SWIMSPAS.map((m) => m.mm[0])) +
      (swimSpaFamilyHasSwimJets() ? " · s protitočno šobo" : " · za plavanje in sprostitev"),
    price: familyRange(OFFERED_SWIMSPAS.map((m) => swimModelPrice(m))),
    href: "/swim-spa",
    // The photograph supplied for this family, under a clean alias for the
    // same reason as the card above — see src/media-aliases.ts. It replaces a
    // SWIM 580 HIDRO product shot picked by POSITION in its set, because this
    // build cannot open the bucket and so could not choose one by looking.
    // A picture chosen for the category beats a frame chosen by index.
    //
    // The alt says only what is certain, for the reason given above.
    photo: {
      src: "/media/site/kategorija-swim-spa.webp",
      widths: [],
      alt: "Swim spa bazen",
    },
    art: "swimspa" as const,
  },
];

const models: ProductCard[] = OFFERED_MODELS.map((m) => ({
  name: m.name,
  desc: "Akrilna školjka " + footprint(m) + ", " + counted(m.jets, MASSAGE_JETS) + ", " + seating(m) + ".",
  meta: metaLine(m),
  price: modelPrice(m),
  art: "pool" as const,
  slug: m.slug,
  ...(photosFor(m)[0] ? { photo: photosFor(m)[0] } : {}),
  ...(m.tier ? { badge: m.tier } : {}),
}));

/** The flagship: the larger shell in its more wanted layout, two loungers. */
const flagship = OFFERED_MODELS.find((m) => m.code === "ZR801")!;

/**
 * One product page per model.
 *
 * The parts that differ between models are derived from the specification;
 * the parts that are the shop's promise rather than the product's — how it
 * gets there, what the connection needs, what the service costs — are the
 * same sentences on all nine, because they are the same offer.
 */
function pdpFor(m: PolaModel): PdpContent {
  return {
    slug: m.slug,
    code: m.code,
    family: "masažni bazen",
    eyebrow: m.tier ?? (m.lounges === 2 ? "Dva ležalnika" : "Ležalnik in pet sedežev"),
    title: m.name,
    sub:
      "Akrilni masažni bazen " +
      footprint(m) +
      " za " +
      seating(m) +
      ": " +
      counted(m.jets, ADJUSTABLE_JETS) +
      ", ogrevanje in filtracija.",
    price: modelPrice(m),
    priceCents: modelPriceCents(m),
    // Option names without figures: the supplier prices these in USD FOB too,
    // so a euro price for a cover lifter needs the same landed-cost pass the
    // shells need. An option listed without a price is honest; one listed with
    // a guessed price is not.
    // The cover moved out of here and into `addons`, where it is a real
    // priced option rather than a choice with no figure beside it. What is
    // left is the two decisions that are genuinely a conversation.
    cfg: [
      ["Priklop", ["Moj električar (navodila)", "Naš partner — po ponudbi"], 0],
      ["Servis", ["Osnovni", "Letni pregled — po ponudbi"], 0],
    ],
    freight: [
      ["Dostava z ekipo in opremo za prenos", "po ponudbi", false],
      ["Zagon, umeritev in predaja", "vključeno", true],
      ["Ogled lokacije pred dostavo", "vključeno", true],
    ],
    // ⚠️ THIS LINE USED TO PRINT "razred pallet_xl · cona SI" — the freight
    // engine's own enum, rendered to a customer. It is a key in
    // src/lib/freight.ts, not Slovenian, and a buyer reading it learns
    // nothing except that something leaked out of the back office.
    note:
      "Dostava se obračuna po ponudbi: bazen te velikosti potuje na paleti " +
      "in cena je odvisna od naslova in dostopa. Ogled uskladimo pred " +
      "potrditvijo termina.",
    // Straight from the supplier's sheet. Nothing here is rounded to suit the
    // layout — the weights in particular are what the terrace has to carry.
    spec: [
      ["Kapaciteta", seating(m)],
      ["Šobe", String(m.jets)],
      ["Črpalke", m.jetPumps[0] + " × " + m.jetPumps[1] + " KM + obtočna 0,35 KM"],
      ["Krmilnik", "Balboa BP200 G2+ · " + m.topside + " · grelec 3 kW"],
      // Square metres first: the supplier states square feet, the buyer
      // thinks in m², and "100 sf" was the one unit on the page that was
      // neither Slovenian nor translated.
      ["Filter", filterAreaText(m.filterSf)],
      // The colour count is the PICKER'S list, not a typed number: the price
      // list's standard line says "7 shell colours" while the supplier's own
      // chart names ten, and the page offering ten swatches beside a spec row
      // claiming seven contradicted itself. One source now feeds both; which
      // count the supplier really honours is an open question for them, and
      // resolving it means editing SHELL_FINISHES, not this row.
      ["Školjka", "ameriški akril, " + SHELL_FINISHES.length + " barv · izolacija 2 cm"],
      ["Mere", footprint(m) + " · višina " + m.mm[2] / 10 + " cm"],
      ["Teža", kgText(m.dryKg) + " prazen · " + kgText(m.filledKg) + " poln"],
      // The supplier's own code, printed. It is what an order, a warranty
      // claim and a spare part are matched on — a buyer quoting "ZR805" on
      // the phone saves both sides the "the small one, the 195" dance.
      ["Priklop", "220 V / 380 V"],
      ["Garancija", "2–5 let, odvisno od sklopa"],
      // Last, in BOTH families: the two comparison tables sit one click
      // apart and the row rhythm should not change between them.
      ["Koda modela", m.code],
    ],
    bar: [m.name, seating(m) + " · " + counted(m.jets, JETS_SHORT), modelPrice(m), "V košarico"],
    addons: m.addons.map((x) => ({
      key: x.key,
      label: x.label,
      price: addonPrice(x),
      priceCents: addonPriceCents(x),
      group: x.group,
      ...(x.qty ? { qty: x.qty } : {}),
    })),
    // The assurance row. Every one of these is something the shop already
    // promises elsewhere on the site — none of it is new copy invented to
    // fill four boxes.
    assure: [
      ["Dostava po vsej Sloveniji", "z ekipo in opremo za prenos"],
      ["14 dni za vračilo", "zakonska pravica ob nakupu na daljavo"],
      // "pred dostavo" understated it: the visit happens before the OFFER,
      // costs nothing, and binds the visitor to nothing — which is the whole
      // reason it beats a showroom for a 400 kg object. See pages/salon.ts.
      ["Brezplačen ogled lokacije", "pred nakupom, brez obveznosti"],
      ["Servis in rezervni deli", "lastna servisna mreža"],
    ],
    panels: [
      [
        "Opis izdelka",
        "Akrilna školjka " +
          footprint(m) +
          " z izolacijo 2 cm, aluminijast nosilni okvir in PS obloga. " +
          "Krmilnik Balboa BP200 G2+ s " +
          m.topside +
          " in grelcem 3 kW, ozon in podvodna osvetlitev so del osnovne opreme.",
      ],
      [
        "Barve školjke in obloge",
        "Školjka: " + SHELL_FINISHES.join(" · ") +
          ". Obloga: " + CABINET_FINISHES.join(" · ") +
          ". Proizvajalčeva barvna karta našteva deset odtenkov, specifikacija modela " +
          "pa sedem — kateri veljajo za vaš model, " +
          "potrdimo ob naročilu.",
      ],
      [
        "Mere in teža",
        footprint(m) + ", višina " + m.mm[2] / 10 + " cm. Prazen tehta " +
          kgText(m.dryKg) + ", napolnjen " + kgText(m.filledKg) +
          " — nosilnost terase preverimo pred dostavo.",
      ],
      [
        "Dostava in montaža",
        "Bazen pripeljemo, postavimo, priklopimo in zaženemo. Pred dostavo " +
          "brezplačno preverimo dostop, podlago in električni priklop. " +
          "Ceno dostave pripravimo po ponudbi — odvisna je od naslova in " +
          "dostopa do mesta postavitve.",
      ],
      [
        "Garancija",
        "2–5 let, odvisno od sklopa. Rezervni deli in servis prek naše mreže.",
      ],
    ],
    finishes: [...SHELL_FINISHES],
    cabinetFinishes: [...CABINET_FINISHES],
    ...(photosFor(m).length ? { photos: photosFor(m) } : {}),
    // Every figure on this page is a provisional conversion of the supplier's
    // cost until COST_INPUTS is set. The page shows them; the structured data
    // does not.
    pricesProvisional: !catalogPricingReady(),
  };
}

/**
 * One product page per swim spa.
 *
 * Mirrors pdpFor above and differs exactly where the product does. The shop's
 * promise — delivery, the site survey, the return right, the warranty — is
 * the same sentences, because it is the same offer. What is not the same:
 *
 *   - The spec leads with LENGTH and carries the counter-current jets, which
 *     are what make this a swim spa rather than a long hot tub.
 *   - The mass line is conditional. Three models in the supplier's list state
 *     none, and one of the three we sell is among them. A filled mass is the
 *     figure a terrace is engineered against, so the row is OMITTED rather
 *     than filled with an estimate — see docs/SUPPLIER-SWIMSPA-2026.md.
 *   - There is no dual-zone claim anywhere, on any model. The ZR7860's
 *     hardware is consistent with one and the sheet never states it; the
 *     claim stays off the page until the supplier confirms a partition and a
 *     second heater.
 */
function pdpForSwim(m: SwimSpaModel): PdpContent {
  // Named where the model HAS one, omitted where it does not — never
  // announced as missing. "protitočna šoba ni navedena" is accurate and it is
  // terrible copy: it puts a negative in the one sentence a buyer reads
  // before deciding to keep reading, and it reads as a defect rather than as
  // a gap in a supplier's spreadsheet. The absence is still stated, in the
  // spec table where a buyer goes looking for it, as an em dash against
  // "Protitočne šobe". Not claiming is honest; advertising an absence is
  // just bad writing.
  const swimJets = m.swimJets > 0 ? m.swimJets + " protitočne šobe, " : "";
  return {
    slug: m.slug,
    code: m.code,
    family: "swim spa",
    eyebrow: m.tier ?? "Swim spa",
    title: m.name,
    sub:
      "Akrilni swim spa " +
      swimFootprint(m) +
      " za " +
      swimSeating(m) +
      ": " +
      swimJets +
      counted(m.jets, MASSAGE_JETS) +
      ", ogrevanje in filtracija.",
    price: swimModelPrice(m),
    priceCents: swimModelPriceCents(m),
    cfg: [
      ["Priklop", ["Moj električar (navodila)", "Naš partner — po ponudbi"], 0],
      ["Servis", ["Osnovni", "Letni pregled — po ponudbi"], 0],
    ],
    freight: [
      ["Dostava z ekipo in opremo za prenos", "po ponudbi", false],
      ["Zagon, umeritev in predaja", "vključeno", true],
      ["Ogled lokacije in preveritev nosilnosti", "vključeno", true],
    ],
    note:
      "Swim spa je izredni tovor: dostop, podlago in nosilnost preverimo na " +
      "lokaciji, preden potrdimo termin.",
    spec: [
      // Length ALONE: the label says one dimension, so the value carries
      // one — the full footprint repeats below under "Mere" where it belongs.
      ["Dolžina", (m.mm[0] / 1000).toFixed(2).replace(".", ",") + " m"],
      ["Kapaciteta", swimSeating(m)],
      ["Protitočne šobe", m.swimJets > 0 ? String(m.swimJets) : "—"],
      ["Masažne šobe", String(m.jets)],
      [
        "Črpalke",
        (m.turbine ? "turbina + " : "") +
          m.jetPumps[0] + " × " + m.jetPumps[1] + " KM · obtočna " +
          m.circPumps[0] + " × " + String(m.circPumps[1]).replace(".", ",") + " KM",
      ],
      ["Krmilnik", "Balboa · " + m.topside + " · grelec 3 kW"],
      ["Filtracija", m.skimmers + " × " + filterAreaText(m.filterSf)],
      ["Školjka", "ameriški akril · izolacija 2 cm"],
      ["Mere", swimFootprint(m) + " · višina " + m.mm[2] / 10 + " cm"],
      // Omitted entirely where the supplier states no mass. A dash would read
      // as "none"; an estimate would be a structural claim nobody made.
      ...(m.dryKg && m.filledKg
        ? ([["Teža", kgText(m.dryKg) + " prazen · " + kgText(m.filledKg) + " poln"]] as [string, string][])
        : []),
      ["Priklop", "220 V / 380 V"],
      ["Garancija", "2–5 let, odvisno od sklopa"],
      // The supplier's own code — same reason the tub spec prints it.
      ["Koda modela", m.code],
    ],
    bar: [m.name, swimFootprint(m) + " · " + counted(m.jets, JETS_SHORT), swimModelPrice(m), "V košarico"],
    addons: m.addons.map((x) => ({
      key: x.key,
      label: x.label,
      price: addonPrice(x),
      priceCents: addonPriceCents(x),
      group: x.group,
      ...(x.qty ? { qty: x.qty } : {}),
    })),
    assure: [
      ["Dostava po vsej Sloveniji", "z ekipo in opremo za prenos"],
      ["14 dni za vračilo", "zakonska pravica ob nakupu na daljavo"],
      ["Brezplačen ogled lokacije", "pred nakupom, brez obveznosti"],
      ["Servis in rezervni deli", "lastna servisna mreža"],
    ],
    panels: [
      [
        "Opis izdelka",
        "Akrilna školjka " +
          swimFootprint(m) +
          " z izolacijo 2 cm, pocinkan nosilni okvir in PS obloga. " +
          // Two whole sentences, not a lead-in and a tail: the tail used to
          // assume the lead-in, so SWIM 450 — the one model with no
          // counter-current jets — rendered "…obloga. poleg 4 masažne šobe…",
          // a lowercase fragment with a dangling preposition.
          (m.swimJets > 0
            ? m.swimJets +
              " protitočne šobe ustvarijo tok, v katerem se plava na mestu; " +
              counted(m.jets, MASSAGE_JETS) + (m.jets < 5 ? " so" : " je") +
              " namenjenih sprostitvi po plavanju."
            : counted(m.jets, MASSAGE_JETS) +
              " so namenjene sprostitvi po plavanju."),
      ],
      [
        "Mere in prostor",
        swimFootprint(m) + ", višina " + m.mm[2] / 10 + " cm. " +
          (m.dryKg && m.filledKg
            ? "Prazen tehta " + kgText(m.dryKg) + ", napolnjen " + kgText(m.filledKg) + ". "
            : "Teže dobavitelj za ta model ne navaja; pred dostavo jo pridobimo " +
              "in preverimo nosilnost podlage. ") +
          "Swim spa praviloma stoji na betonski plošči, ne na terasi.",
      ],
      [
        "Dostava in montaža",
        "Swim spa pripeljemo, postavimo, priklopimo in zaženemo. Zaradi " +
          "dolžine je to izredni tovor — dostop in prostor za dvig " +
          "preverimo na lokaciji pred potrditvijo termina.",
      ],
      [
        "Garancija",
        "2–5 let, odvisno od sklopa. Rezervni deli in servis prek naše mreže.",
      ],
    ],
    finishes: [...SHELL_FINISHES],
    // ⚠️ NO CABINET LIST FOR A SWIM SPA, DELIBERATELY. catalog/swimspa.ts says
    // nothing about colours at all — the supplier's swim-spa sheets carry no
    // finish page — so the shell list above is already an inheritance from the
    // hot tubs rather than a fact about these models. Adding a second borrowed
    // list would double an assumption rather than state a fact, and the buy
    // column now renders these as a CHOICE the buyer makes: offering six
    // cabinet colours nobody has confirmed for a swim spa is the kind of claim
    // that becomes an argument at delivery. Ask the supplier, then fill it in.
    ...(swimPhotosFor(m).length ? { photos: swimPhotosFor(m) } : {}),
    pricesProvisional: !catalogPricingReady(),
  };
}

/**
 * The two listing pages.
 *
 * Each family's models live here rather than on the home page. The home page
 * is the keyword landing page and a route in; these are where a visitor
 * actually chooses, so they get the full grid, their own H1 and their own
 * meta description — "masažni bazen" and "swim spa" are different queries
 * with different intent and one URL cannot rank honestly for both.
 *
 * ⚠️ AN `intro` IS THE ONLY PROSE THESE BANDS HAVE, AND IT ALSO CARRIES
 * /trgovina. The hub renders exactly three strings of its own — hubIntro and
 * these two intros — and nothing else on it is a sentence: the grid is names,
 * spec lines and prices. So an intro that says "akrilni bazeni od 195 do 230
 * cm" leaves the hub with no answer to the question it exists to answer,
 * which is not "what do you sell" but "which of these is mine". Each one
 * therefore walks its own ladder, model by model, on the axes the catalogue
 * actually holds.
 *
 * EVERY FIGURE IS THE CATALOGUE'S. Hot tubs, from OFFERED_MODELS: 1,95/2,10/
 * 2,30 m square, 82 cm shell height on the 195 and 88 on the other two, 5·2 /
 * 6·1 / 5·2 seats and loungers, 35/37/50 jets, 1/1/2 jet pumps at 3 HP,
 * 100 sf filtration and a 3 kW heater throughout, 1.500/1.870/2.210 kg
 * filled. Swim spas, from OFFERED_SWIMSPAS: 4,50/5,80/5,80 m long, 3/7/7
 * seats, 4/38/94 jets, 3/3/5 jet pumps at 3 HP, 5.750/8.490/7.360 kg filled.
 *
 * ⚠️ TWO TRAPS IN THAT LIST, BOTH OF WHICH THE OLD COPY FELL INTO.
 *
 * BIGGER IS NOT MORE PEOPLE. The 210 seats six and the 230 seats five — see
 * the note on OFFERED_MODELS — so the largest hot tub is sold here on room
 * and loungers, never on capacity. Nor is heavier more jets: the 94-jet SWIM
 * 580 MAXI is 7.360 kg filled and the 38-jet SWIM 580 HIDRO is 8.490.
 *
 * AND THE FAMILY MAY NOT BE SOLD ON A COUNTER-CURRENT JET. This intro used to
 * open "Bazeni od 450 do 580 cm, v katerih se plava na mestu" — a promise
 * made for all three, while the SWIM 450's sheet lists no swim jet at all.
 * The claim is now derived from swimSpaFamilyHasSwimJets(), exactly as the
 * category card's meta line already derives it, so it cannot outlive a model
 * joining the range without one.
 *
 * The hot tub intro also dropped "izoliran pokrov", which it stated as
 * standard equipment. The thermal cover is a priced Addon on every model in
 * catalog/pola.ts, and the product pages moved it into `addons` for that
 * reason; a listing page may not hand it back as included.
 */
const collections: Collection[] = [
  {
    path: "/masazni-bazeni",
    navLabel: "Masažni bazeni",
    h1: "Masažni bazeni",
    intro:
      "Trije modeli, ki se ne razlikujejo samo po velikosti. BAZEN 195 meri " +
      "1,95 × 1,95 m in je edini, ki se umesti tja, kamor druga dva ne gresta: " +
      "pet mest, od tega dva ležalnika, 35 šob, ena črpalka 3 KM in 1.500 " +
      "kilogramov, ko je poln. BAZEN 210 meri 2,10 × 2,10 m in sprejme največ " +
      "ljudi — šest mest z enim ležalnikom in 37 šob, napolnjen 1.870 " +
      "kilogramov. BAZEN 230 meri 2,30 × 2,30 m in ni bazen za več ljudi, " +
      "ampak za več prostora: pet mest z dvema ležalnikoma, 50 šob, dve " +
      "črpalki 3 KM in 2.210 kilogramov. Školjka je pri najmanjšem visoka 82 " +
      "cm, pri drugih dveh 88. Ogrevanje 3 kW, filter z 9,3 m² površine in krmilnik " +
      "Balboa imajo vsi trije; na teraso jih pripeljemo, priklopimo in " +
      "zaženemo.",
    metaDescription:
      "Masažni bazeni za 5 ali 6 oseb, od 195 do 230 cm. Akrilna školjka, " +
      "35–50 šob, ogrevanje in filtracija. Dostava, priklop in zagon po vsej Sloveniji.",
    products: models,
  },
  {
    path: "/swim-spa",
    navLabel: "Swim spa",
    h1: "Swim spa bazeni",
    intro:
      "Tri školjke, pri katerih je prva številka dolžina — od nje je odvisno, " +
      "koliko plavanja je v bazenu in koliko vrta potrebujete zanj. SWIM 450 " +
      "meri 4,50 × 2,28 m in je vstopni model: najkrajša školjka v ponudbi, " +
      "tri mesta, štiri šobe in 5.750 kilogramov, ko je polna. Modela 580 sta " +
      "dolga 5,80 m in imata sedem mest z enim ležalnikom. SWIM 580 HIDRO ima " +
      "38 šob in tri črpalke 3 KM, napolnjen tehta 8.490 kilogramov; SWIM 580 " +
      "MAXI ima 94 šob — največ v vsej ponudbi — in pet črpalk 3 KM, " +
      "napolnjen pa je lažji, 7.360 kilogramov. " +
      (swimSpaFamilyHasSwimJets()
        ? "Tok za plavanje na mestu ustvarijo protitočne šobe, ki jih ima vsak " +
          "od treh modelov. "
        : "Tok za plavanje na mestu ustvarijo protitočne šobe; koliko jih ima " +
          "posamezen model, piše v njegovi specifikaciji. ") +
      "Swim spa praviloma stoji na betonski plošči in ne na terasi — dostop " +
      "in prostor za dvig preverimo na lokaciji pred potrditvijo termina.",
    metaDescription:
      "Swim spa bazeni od 450 do 580 cm za plavanje na mestu in sprostitev. " +
      "Akrilna školjka, ogrevanje in filtracija, dostava in zagon po Sloveniji.",
    products: swimSpas,
  },
];

export const bazenContent: ShopContent = {
  // HOME is the wordmark, so the five slots are SHOP, ABOUT, BLOG, DELIVERY,
  // CONTACT. It was five pages about hot tubs with no route to the swim spas
  // at all.
  // "Dostava", not "Dostava in montaža": the nav is a rail on a phone, and
  // the three-word label was the one that dissolved into the edge fade with
  // KONTAKT pushed off-screen entirely. The page's own h1 keeps the full
  // name; a nav label is a handle, not a title.
  // 5 and 6 are APPENDED — see the nav note in types.ts. "Kateri bazen?"
  // over "Izbira": the nav is the one place a label has to work with no
  // sentence around it, and the question names what the visitor gets.
  nav: ["Trgovina", "O nas", "Vodniki", "Dostava", "Kontakt", "Primerjava", "Kateri bazen?"],
  artKey: "pool",
  kicker: "Masažni bazen · Slovenija",
  h1: "Masažni bazen za pet ali šest oseb.",
  // No price in the hero copy even now that COST_INPUTS is set. A figure in
  // an h1's sub is the one a customer remembers, and it would go stale the
  // day the inputs move — the cards and the PDPs derive theirs and this line
  // would not.
  sub: "Trije modeli — mali, srednji in veliki, od 195 do 230 cm. Akrilna školjka, od petintrideset do petdeset šob, ogrevanje in filtracija. Na teraso ga pripeljemo, priklopimo in zaženemo — vi pripravite kopalke.",
  cta: "Izberite svoj bazen",
  metaDescription:
    "Masažni bazeni za 5 ali 6 oseb, 35–50 šob, akrilna školjka in ogrevanje. Ogled lokacije, dostava na teraso in zagon po vsej Sloveniji.",
  trust: [
    "Dostava in zagon po vsej Sloveniji",
    "Ogled lokacije pred dostavo",
    "Servisna mreža in rezervni deli",
    "Do 36 mesečnih obrokov",
  ],
  // Every figure here is the supplier's own — the previous set led with a
  // temperature the price list does not state.
  // ⚠️ DERIVED, BECAUSE EVERY ONE OF THESE WAS WRONG.
  //
  // They were typed out when this shop sold three hot tubs, and they stayed
  // typed out when it started selling six models across two families. The
  // trust band on the home page — the one headed "Zakaj kupci izberejo
  // masažni bazen" — has therefore been telling visitors:
  //
  //   "3 modeli, od 195 do 230 cm"   there are SIX, from 195 to 580 cm
  //   "do 50 masažnih šob"           the SWIM 580 MAXI has 94
  //   "410 kg prazen"                that is the biggest TUB; a swim spa
  //                                  is 1.050 to 1.430 kg empty
  //
  // Three understatements of the shop's own range, in the band whose entire
  // job is to be believed. It is the same fault the catalogue prose was
  // audited for — a family-level claim made from one model's figure — and it
  // survived here because a literal cannot go stale loudly.
  //
  // So they come from the catalogue now. A model added or removed moves these
  // numbers with it, and there is nothing left to forget to update.
  // ⚠️ THE VALUE LEADS WITH THE NUMBER, and that is a rendering contract, not
  // a style. statValue only animates a figure it can parse off the FRONT of
  // the string and only when it is 10 or more (see countable), so "do 1.430
  // kg" is a dead stat where "1.430 kg" counts up. A first pass put the
  // qualifier in the value and silently removed the only counter on the page;
  // studio.test.ts caught it. The qualifier belongs in the label anyway —
  // that is what the second half of the pair is for.
  stats: [
    [modelCount(allOffered.length), sizeSpan(allOffered.map((m) => m.mm[0]!))],
    [String(Math.max(...allOffered.map((m) => m.jets))), "največ masažnih šob"],
    ["3 kW", "grelec, krmilnik Balboa"],
    [
      String(heaviestDryKg).replace(/\B(?=(\d{3})+(?!\d))/, ".") + " kg",
      "najtežji model, prazen — dostava z ekipo",
    ],
  ],
  // THE HOME PAGE SHOWS A SELECTION, NOT THE CATALOGUE.
  //
  // It used to print every hot tub, and then every swim spa under it — eight
  // cards, two headings, before a visitor had been told the shop sells two
  // different things. Worse, once the full grids moved to their own pages
  // this list would have been the hot tubs ALONE, so the landing page of a
  // two-family shop would have shown one family.
  //
  // So: the ends of each ladder. The smallest and largest hot tub, the
  // shortest and longest swim spa — which is the pair of questions a visitor
  // actually arrives with ("how small can it be", "how big does it get"), and
  // it puts both families above the fold of the grid. The full lists are one
  // click away on /masazni-bazeni and /swim-spa, where the category cards and
  // the nav both point.
  products: [
    models[0]!,
    models[models.length - 1]!,
    swimSpas[0]!,
    swimSpas[swimSpas.length - 1]!,
    {
      util: true,
      h: "Bo terasa zdržala?",
      p: "Napolnjen bazen tehta do 2.210 kg, swim spa še precej več. Pred dostavo brezplačno preverimo nosilnost, dostop in elektriko.",
      cta: "Naročite ogled →",
      // The enquiry page, not the flagship model: the tile promises a site
      // survey, and the survey is booked by writing or calling.
      href: "/kontakt",
    },
  ],
  moat: {
    h2: "Od terase do prve kopeli — vse opravimo mi.",
    steps: [
      ["Ogled lokacije", "Preverimo dostop, podlago in električni priklop."],
      ["Priprava priklopa", "Navodila za vašega električarja ali izvedba z našim partnerjem."],
      ["Dostava na teraso", "Ekipa z opremo za prenos — tudi čez ograjo, če je treba."],
      ["Priklop in zagon", "Napolnimo, zaženemo filtracijo in ogrevanje ter umerimo šobe."],
      ["Predaja", "Pokažemo vzdrževanje: 10 minut na teden, nič več."],
    ],
    // ⚠️ "ŠTIRISTO KILOGRAMOV" WAS ONE MODEL'S FIGURE STANDING FOR SIX.
    //
    // 410 kg is the BAZEN 230 empty — the heaviest hot tub, and the lightest
    // thing in this half of the catalogue. A swim spa is 1.050 to 1.430 kg
    // before a drop of water goes in. So the page's one display sentence, the
    // sentence the whole moat band exists to deliver, understated the problem
    // it is claiming to solve by a factor of three.
    //
    // Understating your own difficulty is a strange way to build trust: the
    // reader who has priced a crane knows the number is wrong, and the reader
    // who has not is being told this is easier than it is. "Tudi tisoč
    // štiristo" is the real range's top, spelled out because the ring device
    // cuts this sentence and a numeral would be cut with it.
    claim: ["Bazen tehta tudi tisoč štiristo kilogramov. ", "Premaknemo ga mi."],
  },
  // ⚠️ THE TWO INVENTED REVIEWS ARE GONE, AND THIS IS WHERE THEY WERE.
  //
  // "Družina Novak, Domžale" and "Sandra P., Koper" were written as layout
  // filler and then rendered under a heading about customer opinion. They
  // named BAZEN RELAX 5 and PAKET TERASA — models that have never existed —
  // and they were flagged `placeholder: true`, which kept the chip off them
  // and kept the shop from going live. Flagged filler is still filler on the
  // page a customer reads.
  //
  // Reviews come from the database now, written into
  // content/reviews.generated.ts by scripts/sync-reviews.mjs on every deploy,
  // and entered by the owner in /admin/mnenja from what customers actually
  // sent. Until there is one, the band renders NOTHING — renderStudioTestimonials
  // returns "" for an empty list, which is the honest state of a shop that has
  // not been paid yet, and a far better one than two strangers who do not
  // exist praising a product that does not either.
  reviews: GENERATED_REVIEWS["bazen"] ?? [],
  // The fragments are the sections' derived ids on /vodniki — pinned by
  // structure.test.ts, which renders that page and fails the moment a
  // reworded heading changes an id out from under a card.
  guides: [
    ["Vodnik za nakup", "Masažni bazen na terasi: kaj preveriti pred nakupom?",
      "s1-masazni-bazen-na-terasi-kaj-preveriti-pr"],
    ["Cene 2026", "Koliko stane masažni bazen? Nakup in obratovanje.",
      "s2-koliko-stane-masazni-bazen"],
    ["Pozimi", "Masažni bazen pozimi: stroški in nasveti.",
      "s3-masazni-bazen-pozimi"],
  ],
  categories,
  collections,
  // Distinct from the home page's on purpose: the hub's job is "both
  // families, all six models", where home leads with the keyword.
  hubMetaDescription:
    "Masažni bazeni od 195 do 230 cm in swim spa bazeni od 450 do 580 cm. " +
    "Mere, specifikacije in cene, z dostavo, priklopom in zagonom po Sloveniji.",
  // The lede states the decision; the two cards under it carry the facts the
  // decision turns on. What used to be here — one nine-line paragraph doing
  // both jobs — is the reason hubChoice exists; see its note in types.ts.
  hubIntro:
    "Najprej se odločite med dvema stvarema, ki nista različici iste stvari. Razlika " +
    "ni v velikosti, ampak v tem, kaj v bazenu počnete — od tega pa je odvisno " +
    "vse drugo: podlaga, dostop, priprava priklopa in cena dostave. Vsakega " +
    "pripeljemo, priklopimo in zaženemo.",
  // EVERY FIGURE IS THE CATALOGUE'S — the same ranges the collection intros
  // walk model by model: 195/210/230 cm square at 1.500–2.210 kg filled, and
  // 450–580 cm long at 5.750–8.490 kg filled.
  hubChoice: [
    {
      label: "Masažni bazen",
      text:
        "Kvadratna školjka, v kateri se sedi in leži — masaža, ne plavanje. " +
        "Praviloma gre na teraso.",
      facts: [
        ["Velikost", "195–230 cm"],
        ["Napolnjen tehta", "1.500–2.210 kg"],
        ["Mesta", "5 ali 6 oseb"],
      ],
      anchor: "#masazni-bazeni",
      anchorLabel: "Trije modeli",
    },
    {
      label: "Swim spa bazen",
      text:
        "Podolgovata školjka, narejena za plavanje in sprostitev. Praviloma " +
        "stoji na betonski plošči, ne na terasi.",
      facts: [
        ["Dolžina", "450–580 cm"],
        ["Napolnjen tehta", "5.750–8.490 kg"],
        ["Mesta", "3 do 7 oseb"],
      ],
      anchor: "#swim-spa",
      anchorLabel: "Trije modeli",
    },
  ],
  // ⚠️ EVERY FIGURE BELOW IS THE CATALOGUE'S, and the three that carry the
  // argument are the ones the hub's own grid prints: 5·2 seats on the 230
  // against 6·1 on the smaller 210, 94 jets at 7.360 kg against 38 at 8.490,
  // and jetPumps' horsepower, which is 3 on all six models while the COUNT
  // runs 1, 1, 2, 3, 3, 5. Nothing here is a manufacturer claim about
  // performance — a pump count and a jet count are facts, and the sentence
  // joining them says only that the first bounds the second.
  //
  // The price paragraph is a VERBATIM restatement of pogoji.ts's "Cene"
  // section, deliberately: the price composition previously differed between
  // the terms and the product pages, which is a misleading price indication
  // whichever version is right. A third surface is a third chance to drift,
  // so this one repeats the words rather than paraphrasing them.
  hubOutro: [
    {
      h: "Kako brati te številke",
      p: [
        "Število šob ni ocena kakovosti. Šobo je treba pognati, in to delajo črpalke: pri " +
          "vseh šestih modelih so 3 KM, razlikuje pa se, koliko jih je — od ene do petih. " +
          "Zato ob številu šob poglejte število črpalk, saj to pove, koliko šob dela pod " +
          "polnim pritiskom hkrati.",
        "Število mest tudi ni isto kot velikost. BAZEN 230 je večji od BAZEN 210 in ima eno " +
          "mesto manj, ker ima dva ležalnika namesto enega — ležalnik zasede prostor dveh " +
          "sedežev. Če radi ležite, je manj mest pravzaprav tisto, kar iščete.",
        "Teža, ki šteje, je teža napolnjenega bazena, ne praznega. Prazen model je nekaj " +
          "sto kilogramov in ga je mogoče prestaviti; poln je od 1.500 do 8.490 kilogramov " +
          "in to je številka, proti kateri mora zdržati podlaga. Največji swim spa v ponudbi " +
          "tudi ni tisti z največ šobami: SWIM 580 MAXI ima 94 šob pri 7.360 kilogramih, " +
          "SWIM 580 HIDRO pa 38 pri 8.490.",
      ],
    },
    {
      h: "Kaj sledi, ko model izberete",
      p: [
        "Vrstni red je obrnjen od pričakovanega: najprej prostor, dostop in podlaga, šele " +
          "nato konfiguracija. Zato pridemo na vaš naslov pogledat, kam bi bazen postavili, " +
          "preden karkoli kupite — ogled je brezplačen po vsej Sloveniji in vas k ničemur ne " +
          "zavezuje. Če se izkaže, da izbrani model pri vas ni izvedljiv, vam to povemo.",
        "Cene modelov na tej strani so v evrih in vključujejo DDV. Vključujejo zagon, " +
          "umeritev in predajo; ogled lokacije ni zaračunan v ceni. Dostava z ekipo in " +
          "opremo za prenos se obračuna po ponudbi, ker je odvisna od lokacije in dostopa. " +
          "Cene ne vključujejo priprave podlage, gradbenih del in elektroinštalacije na " +
          "strani kupca.",
      ],
    },
  ],
  pdp: pdpFor(flagship),
  // Both families' pages. The router matches any slug in here, so the swim
  // spa cards link at real pages rather than at a 404.
  pdps: [...OFFERED_MODELS.map(pdpFor), ...OFFERED_SWIMSPAS.map(pdpForSwim)],
  footNote:
    // The footer of EVERY page said "Razstavni bazen v Ljubljani — pridite ga
    // pogledat v živo". There is no showroom; this now names the thing the
    // shop really does, which is the same promise the moat band makes.
    "Specialist za masažne bazene v Sloveniji. Dostava, priklop in zagon po vsej Sloveniji — z brezplačnim ogledom lokacije pred nakupom.",
};
