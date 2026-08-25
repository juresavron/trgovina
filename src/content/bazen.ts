import type {
  Category,
  Collection,
  PdpContent,
  PdpPhoto,
  ProductCard,
  ShopContent,
} from "./types";
import { OWN_MEDIA } from "../themes/studio/own-media";
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
    (m.swimJets > 0 ? " s protitočno šobo, " : ", ") +
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
      src: "/media/kategorija-masazni-bazeni.jpeg",
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
      src: "/media/kategorija-swim-spa.jpeg",
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
    note: "Cenik logistike: razred pallet_xl · cona SI. Ogled uskladimo pred potrditvijo termina.",
    // Straight from the supplier's sheet. Nothing here is rounded to suit the
    // layout — the weights in particular are what the terrace has to carry.
    spec: [
      ["Kapaciteta", seating(m)],
      ["Šobe", String(m.jets)],
      ["Črpalke", m.jetPumps[0] + " × " + m.jetPumps[1] + " KM + obtočna 0,35 KM"],
      ["Krmilnik", "Balboa BP200 G2+ · " + m.topside + " · grelec 3 kW"],
      ["Filter", m.filterSf + " sf"],
      ["Školjka", "ameriški akril, 7 barv · izolacija 2 cm"],
      ["Mere", footprint(m) + " · višina " + m.mm[2] / 10 + " cm"],
      ["Teža", m.dryKg + " kg prazen · " + m.filledKg + " kg poln"],
      ["Priklop", "220 V / 380 V"],
      ["Garancija", "2–5 let, odvisno od sklopa"],
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
      ["Ogled pred dostavo", "brezplačno preverimo dostop in elektriko"],
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
          ". Vsak model je na voljo v sedmih barvah školjke — katerih sedmih, " +
          "potrdimo ob naročilu.",
      ],
      [
        "Mere in teža",
        footprint(m) + ", višina " + m.mm[2] / 10 + " cm. Prazen tehta " +
          m.dryKg + " kg, napolnjen " + m.filledKg +
          " kg — nosilnost terase preverimo pred dostavo.",
      ],
      [
        "Dostava in montaža",
        "Bazen pripeljemo, postavimo, priklopimo in zaženemo. Pred dostavo " +
          "brezplačno preverimo dostop, podlago in električni priklop. " +
          "Cenik logistike: razred pallet_xl, cona SI.",
      ],
      [
        "Garancija",
        "2–5 let, odvisno od sklopa. Rezervni deli in servis prek naše mreže.",
      ],
    ],
    finishes: [...SHELL_FINISHES],
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
      ["Dolžina", swimFootprint(m)],
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
      ["Filtracija", m.skimmers + " × " + m.filterSf + " sf"],
      ["Školjka", "ameriški akril · izolacija 2 cm"],
      ["Mere", swimFootprint(m) + " · višina " + m.mm[2] / 10 + " cm"],
      // Omitted entirely where the supplier states no mass. A dash would read
      // as "none"; an estimate would be a structural claim nobody made.
      ...(m.dryKg && m.filledKg
        ? ([["Teža", m.dryKg + " kg prazen · " + m.filledKg + " kg poln"]] as [string, string][])
        : []),
      ["Priklop", "220 V / 380 V"],
      ["Garancija", "2–5 let, odvisno od sklopa"],
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
      ["Ogled pred dostavo", "preverimo dostop, podlago in nosilnost"],
      ["Servis in rezervni deli", "lastna servisna mreža"],
    ],
    panels: [
      [
        "Opis izdelka",
        "Akrilna školjka " +
          swimFootprint(m) +
          " z izolacijo 2 cm, pocinkan nosilni okvir in PS obloga. " +
          (m.swimJets > 0
            ? m.swimJets +
              " protitočne šobe ustvarijo tok, v katerem se plava na mestu — "
            : "") +
          "poleg " + counted(m.jets, MASSAGE_JETS) + " za sprostitev po plavanju.",
      ],
      [
        "Mere in prostor",
        swimFootprint(m) + ", višina " + m.mm[2] / 10 + " cm. " +
          (m.dryKg && m.filledKg
            ? "Prazen tehta " + m.dryKg + " kg, napolnjen " + m.filledKg + " kg. "
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
 */
const collections: Collection[] = [
  {
    path: "/masazni-bazeni",
    navLabel: "Masažni bazeni",
    h1: "Masažni bazeni",
    intro:
      "Akrilni masažni bazeni od 195 do 230 cm, za pet ali šest oseb. " +
      "Vsak model ima ogrevanje, filtracijo in izoliran pokrov. Na teraso ga " +
      "pripeljemo, priklopimo in zaženemo.",
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
      "Bazeni od 450 do 580 cm, v katerih se plava na mestu. Daljša školjka " +
      "pomeni pravo plavanje, ne le močnejšega toka — in ob njem sedežni del " +
      "za sprostitev po treningu.",
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
  nav: ["Trgovina", "O nas", "Vodniki", "Dostava in montaža", "Kontakt"],
  artKey: "pool",
  kicker: "Masažni bazen · Slovenija",
  h1: "Masažni bazen za pet ali šest oseb.",
  // No price in the hero copy while COST_INPUTS is unset. Naming a figure
  // here and a dash on the cards would be worse than naming neither, and a
  // price in an h1's sub is the one a customer remembers.
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
  stats: [
    ["3 modeli", "od 195 do 230 cm"],
    ["do 50", "masažnih šob"],
    ["3 kW", "grelec, Balboa krmilnik"],
    ["410 kg", "prazen — dostava z ekipo"],
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
    },
  ],
  moat: {
    h2: "Od terase do prve kopeli v enem dnevu.",
    steps: [
      ["Ogled lokacije", "Preverimo dostop, podlago in električni priklop."],
      ["Priprava priklopa", "Navodila za vašega električarja ali izvedba z našim partnerjem."],
      ["Dostava na teraso", "Ekipa z opremo za prenos — tudi čez ograjo, če je treba."],
      ["Priklop in zagon", "Napolnimo, zaženemo filtracijo in ogrevanje ter umerimo šobe."],
      ["Predaja", "Pokažemo vzdrževanje: 10 minut na teden, nič več."],
    ],
    claim: ["Bazen tehta štiristo kilogramov. ", "Premaknemo ga mi."],
  },
  // ⚠️ BOTH OF THESE ARE INVENTED, AND ARE FLAGGED AS SUCH.
  //
  // Nobody said these words. "Družina Novak" and "Sandra P." are not
  // customers, and the two models they name — BAZEN RELAX 5 and PAKET TERASA
  // — do not exist: this shop sells BAZEN 195/210/230 and SWIM 450/580. They
  // were written as layout filler and then rendered under the heading
  // "Preverjena mnenja strank" with a "Preverjen nakup" chip on each, which
  // turns filler into a claim that these are verified purchases.
  //
  // That claim is on the Annex I blacklist of the Unfair Commercial Practices
  // Directive (points 23b and 23c, added by Omnibus 2019/2161 and transposed
  // in ZVPot-1) — banned outright, no balancing test. See ShopContent.reviews.
  //
  // They stay here, flagged, rather than being deleted, so the band still has
  // something to lay out while the design is finished. `placeholder: true`
  // keeps them off a live site: the launch gate refuses live: true while any
  // review carries it. Replace them with real ones — quote, person and order
  // — and drop the flag together.
  reviews: [
    {
      q: "Ekipa je bazen prenesla čez ograjo terase brez ene praske. Zvečer smo že sedeli v topli vodi.",
      who: "Družina Novak, Domžale",
      model: "BAZEN 230",
      placeholder: true,
    },
    {
      q: "Ogled pred nakupom je rešil vse dileme — povedali so, kam ga postaviti in kaj mora pripraviti električar.",
      who: "Sandra P., Koper",
      model: "BAZEN 195",
      placeholder: true,
    },
  ],
  guides: [
    ["Vodnik za nakup", "Masažni bazen na terasi: kaj preveriti pred nakupom?"],
    ["Cene 2026", "Koliko stane masažni bazen? Nakup in obratovanje."],
    ["Pozimi", "Masažni bazen pozimi: stroški in nasveti."],
  ],
  categories,
  collections,
  // Distinct from the home page's on purpose: the hub's job is "both
  // families, all six models", where home leads with the keyword.
  hubMetaDescription:
    "Masažni bazeni od 195 do 230 cm in swim spa bazeni od 450 do 580 cm. " +
    "Mere, specifikacije in cene, z dostavo, priklopom in zagonom po Sloveniji.",
  pdp: pdpFor(flagship),
  // Both families' pages. The router matches any slug in here, so the swim
  // spa cards link at real pages rather than at a 404.
  pdps: [...OFFERED_MODELS.map(pdpFor), ...OFFERED_SWIMSPAS.map(pdpForSwim)],
  footNote:
    "Specialist za masažne bazene v Sloveniji. Razstavni bazen v Ljubljani — pridite ga pogledat v živo.",
};
