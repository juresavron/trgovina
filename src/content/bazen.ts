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
  length as swimLength,
  metaLine as swimMetaLine,
  modelPrice as swimModelPrice,
  modelPriceCents as swimModelPriceCents,
  seating as swimSeating,
} from "../catalog/swimspa";
import type { PolaModel } from "../catalog/pola";
import { jetsText } from "../catalog/count";
import { catalogPricingReady } from "../catalog/pricing";
import { filterAreaText, kgText, litresText } from "../catalog/count";
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
const SWIM_JETS = ["protitočna šoba", "protitočni šobi", "protitočne šobe", "protitočnih šob"] as const;
/**
 * "…je namenjena sprostitvi" — the whole predicate, selected on the same
 * last-two-digits rule as the noun. It was `(n < 5 ? " so" : " je") +
 * " namenjenih"`: the verb switched but the participle stayed genitive, so
 * 2–4 jets would have printed "so namenjenih", and <5 is a units test that
 * the dual of 102 would fail. Latent (SWIM 450's 4 jets take the no-swim-jet
 * branch), but the whole point of count.ts is that this class of bug does
 * not wait to be reachable.
 */
const AIMED_AT_REST = [
  "je namenjena sprostitvi",
  "sta namenjeni sprostitvi",
  "so namenjene sprostitvi",
  "je namenjenih sprostitvi",
] as const;
function aimedAtRest(n: number): string {
  const t = n % 100;
  return AIMED_AT_REST[t === 1 ? 0 : t === 2 ? 1 : t === 3 || t === 4 ? 2 : 3]!;
}
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
 *
 * ⚠️ HISTORICAL FALLBACK, FULLY SHADOWED TODAY. Every OWN_MEDIA entry now
 * ships a non-empty alt straight from the database (the admin's alt writer
 * maintains them), so the `p.alt ||` below never falls through to this table
 * and its texts have already drifted from what actually renders. Do NOT edit
 * a caption here expecting the page to change — edit it in /admin. The table
 * stays only as the last-resort text for a future photo synced without one.
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
/**
 * The bare noun, still agreeing. Two callers, both fighting for room: the
 * sticky buy bar is a cramped strip, and a <title> has about sixty characters
 * — "38 masažnih šob" spends fifteen of them on an adjective, and the jet
 * count is the only figure separating the two SWIM 580s, so it has to fit.
 * On the page proper the adjective stays (MASSAGE_JETS), where telling a
 * masažna šoba from a protitočna one is worth the words.
 */
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


/**
 * A height in centimetres, in Slovenian.
 *
 * ⚠️ m.mm[2] / 10 EMITS A JAVASCRIPT DECIMAL POINT. Every offered model's
 * height is a multiple of 10 mm today, so the division has always produced a
 * whole number and the bug has never shown — but the supplier's own packing
 * list already disagrees with the price list on one of them (SUPPLIER-SWIMSPA
 * records ZR7861 at 1420 mm against 1400), and the first height that is not a
 * round number of centimetres would render "135.5 cm" with an English
 * separator, in the spec table and in the panel a buyer reads before hiring a
 * crane. The rest of this file has used the comma form for years — footprint()
 * and the pump strings both do — so this is the one number that could still
 * slip through.
 */
function heightCm(mm: number): string {
  const cm = mm / 10;
  return (Number.isInteger(cm) ? String(cm) : cm.toFixed(1).replace(".", ",")) + " cm";
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
      // The false branch is a NON-FUNCTIONAL fact on purpose: while the
      // entry model's sheet lists no counter-current jet the card may not
      // promise swimming for the family — seats are the fact all three share.
      (swimSpaFamilyHasSwimJets() ? " · s protitočno šobo" : " · 3 do 7 oseb"),
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
/**
 * Slovenian count, all four forms, keyed on the LAST TWO DIGITS.
 *
 * ⚠️ NOT n % 10. 101 takes the singular and 111 does not; 22 takes the dual
 * and 12 does not. Every count on this site goes through a function shaped
 * like this one for that reason — see catalog/count.ts, which does the same
 * job for jets and is not general enough to reuse here.
 */
function plural(n: number, f: readonly [string, string, string, string]): string {
  const t = n % 100;
  if (t === 1) return n + " " + f[0];
  if (t === 2) return n + " " + f[1];
  if (t === 3 || t === 4) return n + " " + f[2];
  return n + " " + f[3];
}

const MESTO = ["mesto", "mesti", "mesta", "mest"] as const;
const OSEBA = ["osebo", "osebi", "osebe", "oseb"] as const;
const LEZALNIK = ["ležalnik", "ležalnika", "ležalniki", "ležalnikov"] as const;
const SEDEZ = ["sedež", "sedeža", "sedeži", "sedežev"] as const;
const CRPALKA = ["črpalka", "črpalki", "črpalke", "črpalk"] as const;

/**
 * The one sentence that says why THIS hot tub, among the three offered.
 *
 * ⚠️ COMPUTED, NEVER WRITTEN PER MODEL. A hand-written "največ šob v ponudbi"
 * is true until the day a model with more is added, and then it is a false
 * superlative sitting on a live product page that nobody remembers to edit.
 * Every claim below is derived from OFFERED_MODELS at build time, so the
 * range rewrites its own copy — and a superlative that stops being true
 * stops being printed.
 *
 * The order is the order a buyer decides in: how many people, then how much
 * massage, then price. A model that leads on nothing takes the honest middle
 * position rather than an invented distinction — being the smallest of three
 * IS a reason, and it is the one that comes with the lowest price.
 */
function standsOut(m: PolaModel): string {
  const others = OFFERED_MODELS.filter((x) => x.code !== m.code);
  const most = (pick: (x: PolaModel) => number): boolean =>
    others.every((x) => pick(x) < pick(m));
  const least = (pick: (x: PolaModel) => number): boolean =>
    others.every((x) => pick(x) > pick(m));

  // ⚠️ EVERY COUNT STAYS IN THE COUNTING FORM, and the sentences are built to
  // let it. Slovenian declines after a preposition — "s 6 mest" is wrong
  // where "s šestimi mesti" is right — so an interpolated numeral cannot sit
  // behind "s", "na" or "ob" without spelling the numeral out in the correct
  // case, which is four more forms per noun and a new way to be wrong. The
  // list form ("X: a, b in c") needs only the nominative and the counting
  // genitive, which is exactly what plural() produces, and it scans better
  // in a panel anyway.
  if (most((x) => x.seats)) {
    return (
      "Edini masažni bazen v ponudbi, ki sprejme " + plural(m.seats, OSEBA) +
      ": " + plural(m.lounges, LEZALNIK) + " in " +
      plural(m.seats - m.lounges, SEDEZ) + ". "
    );
  }
  if (most((x) => x.jets)) {
    return (
      "Največ masaže med masažnimi bazeni: " + jetsText(m.jets) + ", " +
      plural(m.jetPumps[0], CRPALKA) + " po " + m.jetPumps[1] + " KM in " +
      plural(m.lounges, LEZALNIK) + ". "
    );
  }
  if (least((x) => x.mm[0] * x.mm[1])) {
    return (
      "Najmanjši in najcenejši od treh masažnih bazenov: " +
      plural(m.seats, MESTO) + ", od tega " + plural(m.lounges, LEZALNIK) + ". "
    );
  }
  return "";
}

function pdpFor(m: PolaModel): PdpContent {
  return {
    slug: m.slug,
    code: m.code,
    family: "masažni bazen",
    // The fallback DERIVES: the old second branch asserted "Ležalnik in pet
    // sedežev" for any non-two-lounger model — including one with none.
    eyebrow:
      m.tier ??
      (m.lounges === 2
        ? "Dva ležalnika"
        : m.lounges === 1
          ? "En ležalnik"
          : "Brez ležalnika"),
    title: m.name,
    // A sentence, not a spec line: seating(m)'s middot form ("5 oseb · 2
    // ležalnika") is right in the cards and wrong mid-sentence — and this
    // string is also the meta description and the JSON-LD description.
    sub:
      "Akrilni masažni bazen " +
      footprint(m) +
      " za " +
      seating(m).replace(" · ", ", od tega ") +
      ": " +
      counted(m.jets, ADJUSTABLE_JETS) +
      ", ogrevanje in filtracija.",
    // Footprint and seats: the two things a tub is chosen on, and the two a
    // model code cannot say. seating() returns "5 oseb · 2 ležalnika" — the
    // lounger count belongs on the page, not in a 60-character line.
    titleSpec:
      "masažni bazen " + footprint(m) + " za " + seating(m).split(" · ")[0],
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
      ["Ogled lokacije pred ponudbo", "vključeno", true],
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
      // The SUPPLIER'S per-model count, not the picker's: the sheet's
      // standard line says "7 shell colours" while the chart names ten
      // shades across the range, and the swatch note beside the picker is
      // where that tension is explained to the buyer. The spec table states
      // what the sheet states; a length-derived count here printed "10 barv"
      // against the note's "sedem" on the same page. (Also: no counted()
      // needed while the literal is 7, but keep the two digits' agreement in
      // mind if the sheet ever changes.)
      // ⚠️ NO COLOUR COUNT HERE. It said "7 barv" while the picker two screens
      // up listed ten, and the colour panel below it explained the gap in a
      // sentence ("the chart lists ten, the specification seven"). Three
      // numbers for one fact on one page, and the spec table — the row a
      // buyer trusts most, and the one the printable technical sheet carries
      // — held the one nobody could check.
      //
      // The count is now stated only where it is derived: the picker renders
      // the colours the shop can actually show (catalog/finishes.generated.ts),
      // so it counts itself and cannot drift.
      ["Školjka", "ameriški akril · izolacija 2 cm"],
      ["Mere", footprint(m) + " · višina " + heightCm(m.mm[2])],
      ["Teža", kgText(m.dryKg) + " prazen · " + kgText(m.filledKg) + " poln"],
      // The supplier's own code, printed. It is what an order, a warranty
      // claim and a spare part are matched on — a buyer quoting "ZR805" on
      // the phone saves both sides the "the small one, the 195" dance.
      // "Električni priklop": bare "Priklop" also labels the configurator's
      // who-wires-it group on the same page — one word, two meanings.
      ["Električni priklop", "230 V / 400 V"],
      ["Garancija", "3 leta"],
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
      // ⚠️ "SERVIS UREJAMO SAMI", NOT "LASTNA SERVISNA MREŽA". A network is a
      // claim about scale — branches, engineers, coverage — and the note above
      // heroTrust says in as many words that the service network "is among the
      // claims still waiting on the owner". It was excluded from the hero for
      // that reason and shipped one band lower and on all six product pages.
      // What the shop can say without waiting for anybody is who is
      // responsible, which is the part a buyer actually wants: not a
      // subcontractor. One word from the owner puts the network back.
      ["Servis in rezervni deli", "servis urejamo sami"],
    ],
    panels: [
      [
        "Opis izdelka",
        // ⚠️ THIS PANEL USED TO RESTATE THE SPEC TABLE DIRECTLY ABOVE IT.
        //
        // It opened "Akrilna školjka 2,30 × 2,30 m z izolacijo 2 cm…" — the
        // footprint, the insulation, the controller and the heater, every one
        // of them a row in the table a reader had just passed. The one thing
        // the page never said was why a buyer would want THIS model rather
        // than the one 400 € cheaper beside it, and that is the only question
        // a product page exists to answer.
        //
        // It leads with the distinction now, and the distinction is COMPUTED
        // from the offered range rather than written per model: nothing here
        // can claim "most jets" once a model with more is added, and a range
        // that changes rewrites its own copy. The construction detail stays
        // as the second half, because a buyer choosing between two of these
        // does eventually want to know what the frame is made of.
        standsOut(m) +
          "Akrilna školjka " +
          footprint(m) +
          " z izolacijo 2 cm, aluminijast nosilni okvir in PS obloga. " +
          "Krmilnik Balboa BP200 G2+ s " +
          m.topside +
          " in grelcem 3 kW, ozon in podvodna osvetlitev so del osnovne opreme.",
      ],
      // ⚠️ NO "BARVE ŠKOLJKE IN OBLOGE" PANEL. It listed all sixteen colour
      // names — which are the labels under the sixteen radio tiles two screens
      // above it — and then repeated the picker's own note WORD FOR WORD:
      // "Proizvajalčeva barvna karta našteva deset odtenkov, specifikacija
      // modela pa sedem…", which also lives in pdp.ts.
      //
      // The copy is not the problem; the DIVERGENCE is. The renderer guards
      // that sentence on SHELL_FINISHES_ARE_PHOTOGRAPHED and drops it the
      // moment the shop uploads its own swatches, because it stops being true:
      // those ARE the colours then, with a photograph behind each. The panel
      // had no such guard, so on the first upload the picker would fall silent
      // and the panel would go on telling a buyer that the tiles they can see
      // might turn out to be seven — a contradiction with itself, on the page
      // where the colour is chosen.
      //
      // One source, and it is the one next to the swatches.
      [
        "Mere in teža",
        footprint(m) + ", višina " + heightCm(m.mm[2]) + ". Prazen tehta " +
          kgText(m.dryKg) + ", napolnjen " + kgText(m.filledKg) +
          // "pred ponudbo", not "pred dostavo". The correction at the
          // assurance strip above ("the visit happens before the OFFER") was
          // never applied here, so the panel told a buyer the survey happens
          // after they have committed — the opposite of the shop's argument,
          // and the one thing this page is selling.
          ". Nosilnost terase preverimo na brezplačnem ogledu, pred ponudbo.",
        // ⚠️ THE PANELS ARE SUMMARIES AND THEY USED TO BE DEAD ENDS. Each of
        // the three below is capped at 320 characters by studio.test.ts —
        // correctly, they are two lines under a heading — and behind each one
        // the site already has a whole page. A reader who opens "Mere in teža"
        // because they are worried about the terrace was told the load is
        // checked at a free visit and given no way to ask for one.
        "Brezplačen ogled lokacije pred ponudbo",
        "/showroom",
      ],
      // ⚠️ THE FOUR THINGS BUYERS ASK MOST WERE ON NO PRODUCT PAGE.
      //
      // Rendered, each of these six pages contained zero occurrences of
      // vzdrževan*, pozim*, strošk*, klor, brom, kemij* or poraba — while
      // /pogosta-vprasanja answers exactly them ("Koliko elektrike porabi?",
      // "Koliko dela je z vzdrževanjem?", "Kako pogosto je treba zamenjati
      // vodo?", "Ali lahko bazen uporabljam pozimi?") and no product page
      // linked to it except through the global footer.
      //
      // EVERY FIGURE HERE IS ALREADY ON THE PAGE OR DERIVED FROM IT. The
      // litres are filledKg − dryKg, the same subtraction /primerjava
      // publishes; the filter area is the spec row; the ten minutes is the
      // site's own figure at faq.ts:119, dostava.ts:74 and o-nas.ts:106.
      //
      // ⚠️ AND NO RUNNING-COST NUMBER. The cost guide refuses to quote one
      // because it depends on use, temperature, cover and tariff — none of
      // which this shop knows — and that refusal is right. The panel links to
      // the guide instead of undermining it.
      [
        "Voda in vzdrževanje",
        "Bazen drži približno " + litresText(m.dryKg, m.filledKg) +
          " vode, filtracija pa teče prek filtra " + filterAreaText(m.filterSf) +
          ". Vzdrževanje je preverjanje vode, čiščenje filtra in doziranje — " +
          "približno deset minut na teden; postopek pokažemo ob predaji.",
        "Poraba, vzdrževanje in zimska uporaba",
        "/faq",
      ],
      [
        "Dostava in montaža",
        // ⚠️ "PRED PONUDBO", NOT "PRED DOSTAVO", and this panel used to say
        // the second while the "Mere in teža" panel two boxes above it said
        // the first — one product page stating both. The correction was made
        // at the assurance strip and at that panel and never reached here.
        // It is not a detail: a survey before DELIVERY is a logistics step
        // after the customer has committed, and a survey before the OFFER is
        // the shop's whole argument for having no showroom.
        "Bazen pripeljemo, postavimo, priklopimo in zaženemo. Pred ponudbo " +
          "brezplačno preverimo dostop, podlago in električni priklop. " +
          "Ceno dostave pripravimo po ponudbi. Odvisna je od naslova in " +
          "dostopa do mesta postavitve.",
        // The anchor carries the words the page ranks for. /dostava-in-montaza
        // takes 52 links from this site and not one of them said what it is
        // about: the nav says "Dostava", the footer says "Dostava", the
        // assurance strip says "Dostava po vsej Sloveniji".
        "Kako poteka dostava in montaža masažnega bazena",
        "/delivery",
      ],
      [
        "Garancija",
        // ⚠️ "PREK NAŠE MREŽE" IS GONE, AND IT WAS THE ONE CLAIM THIS SHOP
        // HAD ALREADY DECIDED IT MAY NOT MAKE. A network is an assertion
        // about scale — branches, engineers, coverage — and the note beside
        // the hero's assurance strip (content/bazen.ts, `assure`) says in as
        // many words that the service network "is among the claims still
        // waiting on the owner", which is why the strip says "servis urejamo
        // sami" instead. Both product panels then said the other thing, on
        // the six pages where a buyer is deciding. One word from the owner
        // puts the network back; until then the two say the same thing.
        "Tri leta. Rezervne dele in servis urejamo sami.",
        // The two-year statutory conformity right is NOT the three-year
        // manufacturer's guarantee, and this panel names only the second. The
        // page that sets them side by side is the terms page; sending the
        // reader there is the difference between a number and their rights.
        "Garancija in zakonsko jamstvo za skladnost blaga",
        // The SECTION, not the top of the page: the terms run nine headings
        // and this link names one of them. See panelMore in themes/studio/pdp.ts.
        "/terms#s6-jamstvo-za-skladnost-blaga-in-garancija",
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
  const swimJets = m.swimJets > 0 ? counted(m.swimJets, SWIM_JETS) + ", " : "";
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
      // ⚠️ THE SAME replace() THE TUB STANDFIRST DOES, and the reason is the
      // same: swimSeating()'s middot form is right in the cards and wrong mid
      // sentence. Rendered "za 7 oseb · 1 ležalnik: 3 protitočne šobe…" on all
      // three swim spa pages — and this string is also the meta description
      // and the JSON-LD description, so the middot travelled to the search
      // result too.
      swimSeating(m).replace(" · ", ", od tega ") +
      ": " +
      swimJets +
      counted(m.jets, MASSAGE_JETS) +
      ", ogrevanje in filtracija.",
    // Length and JETS, not seats. The two 580s are the same length and seat
    // the same seven people; the jet count is the only figure that separates
    // them, and it is the one the family's own copy leads with.
    titleSpec:
      "swim spa " + swimLength(m) + ", " +
      swimSeating(m).split(" · ")[0] + ", " + counted(m.jets, JETS_SHORT),
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
      // "izredni prevoz", not "izredni tovor": ZCes-1 names the MOVEMENT, and
      // that is the phrase a haulier, a permit and a road authority all use.
      "Za swim spa je potreben izredni prevoz: dostop, podlago in nosilnost preverimo na " +
      "lokaciji, preden potrdimo termin.",
    spec: [
      // Length ALONE: the label says one dimension, so the value carries
      // one — the full footprint repeats below under "Mere" where it belongs.
      ["Dolžina", (m.mm[0] / 1000).toFixed(2).replace(".", ",") + " m"],
      ["Kapaciteta", swimSeating(m)],
      // ⚠️ WORDS, NOT AN EM DASH. The absence is the point on SWIM 450, so it has
      // to survive being read aloud: the cell's only text was "—", which a
      // screen reader at default punctuation announces as nothing at all — the
      // row said "Protitočne šobe" and then silence. The panel below already
      // states it in words.
      ["Protitočne šobe", m.swimJets > 0 ? String(m.swimJets) : "ni navedeno"],
      ["Masažne šobe", String(m.jets)],
      [
        "Črpalke",
        (m.turbine ? "turbina + " : "") +
          m.jetPumps[0] + " × " + m.jetPumps[1] + " KM · obtočna " +
          m.circPumps[0] + " × " + String(m.circPumps[1]).replace(".", ",") + " KM",
      ],
      ["Krmilnik", "Balboa · " + m.topside + " · grelec 3 kW"],
      // "Filter" on the tubs and "Filtracija" here, for the same fact. The value
      // already carries the skimmer count, so the rename bought nothing and
      // broke the row rhythm the two comparison tables are meant to share.
      ["Filter", m.skimmers + " × " + filterAreaText(m.filterSf)],
      // ⚠️ NO INSULATION LINE. "izolacija 2 cm" is the POLA sheet's shell
      // line; the swim-spa sheet's common list states shell, frame, cabinet,
      // base, heater, control and voltages — no shell insulation — and
      // cabinet+bottom insulation is a PRICED OPTION on these units. The
      // shell colour is the sheet's own: silver white.
      ["Školjka", "ameriški akril · silver white"],
      ["Mere", swimFootprint(m) + " · višina " + heightCm(m.mm[2])],
      // Omitted entirely where the supplier states no mass. A dash would read
      // as "none"; an estimate would be a structural claim nobody made.
      ...(typeof m.dryKg === "number" && typeof m.filledKg === "number"
        ? ([["Teža", kgText(m.dryKg) + " prazen · " + kgText(m.filledKg) + " poln"]] as [string, string][])
        : []),
      // "Električni priklop", not "Priklop": the configurator's who-wires-it
      // group on the same page is already labelled "Priklop". The tub spec was
      // renamed for exactly this and the swim spa spec was not, so these three
      // pages printed the word twice with two meanings.
      ["Električni priklop", "230 V / 400 V"],
      ["Garancija", "3 leta"],
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
      // ⚠️ "SERVIS UREJAMO SAMI", NOT "LASTNA SERVISNA MREŽA". A network is a
      // claim about scale — branches, engineers, coverage — and the note above
      // heroTrust says in as many words that the service network "is among the
      // claims still waiting on the owner". It was excluded from the hero for
      // that reason and shipped one band lower and on all six product pages.
      // What the shop can say without waiting for anybody is who is
      // responsible, which is the part a buyer actually wants: not a
      // subcontractor. One word from the owner puts the network back.
      ["Servis in rezervni deli", "servis urejamo sami"],
    ],
    panels: [
      [
        "Opis izdelka",
        "Akrilna školjka " +
          swimFootprint(m) +
          ", pocinkan nosilni okvir in PS obloga. " +
          // Two whole sentences, not a lead-in and a tail: the tail used to
          // assume the lead-in, so SWIM 450 — the one model with no
          // counter-current jets — rendered "…obloga. poleg 4 masažne šobe…",
          // a lowercase fragment with a dangling preposition.
          (m.swimJets > 0
            ? counted(m.swimJets, SWIM_JETS) +
              (m.swimJets % 100 === 1 ? " ustvari" : m.swimJets % 100 === 2 ? " ustvarita" : " ustvarijo") +
              " tok, v katerem se plava na mestu; " +
              counted(m.jets, MASSAGE_JETS) + " " + aimedAtRest(m.jets) +
              " po plavanju."
            // ⚠️ THIS BRANCH IS THE MODEL THAT CANNOT SWIM, so it must not
            // end "po plavanju". SWIM 450 lists no counter-current jet at all
            // (swimspa.ts: "The supplier's sheet really does say four … this
            // one lists no swim jet"), which is why the guard above exists —
            // and both branches then finished with the same tail, so the one
            // model with nothing to swim against still told the reader the
            // jets were for afterwards, in the first panel a buyer opens, on
            // a 16.790 EUR page whose h1 says swim spa. /primerjava already
            // discloses the gap; this page did not.
            // ⚠️ NO TAIL HERE. aimedAtRest() ALREADY ENDS "sprostitvi".
            // The sibling branch appends " po plavanju" to it, which reads
            // "38 masažnih šob je namenjenih sprostitvi po plavanju" — so this
            // one was given " za sprostitev" by symmetry and rendered "4
            // masažne šobe so namenjene sprostitvi ZA SPROSTITEV", on the one
            // page of six that takes this branch.
            : counted(m.jets, MASSAGE_JETS) + " " + aimedAtRest(m.jets) +
              ". Protitočnih šob dobavitelj za ta model ne navaja."),
      ],
      [
        "Mere in prostor",
        swimFootprint(m) + ", višina " + heightCm(m.mm[2]) + ". " +
          (typeof m.dryKg === "number" && typeof m.filledKg === "number"
            ? "Prazen tehta " + kgText(m.dryKg) + ", napolnjen " + kgText(m.filledKg) + ". "
            : "Teže dobavitelj za ta model ne navaja; pred ponudbo jo pridobimo " +
              "in preverimo nosilnost podlage. ") +
          "Swim spa praviloma stoji na betonski plošči, ne na terasi.",
        "Brezplačen ogled lokacije pred ponudbo",
        "/showroom",
      ],
      // The same panel the tubs carry — see the note there for why the four
      // questions buyers ask most were on no product page.
      //
      // ⚠️ THE LITRE SENTENCE IS CONDITIONAL HERE. Three models in the
      // supplier's list state no mass and one of the three we sell is among
      // them (see the note on pdpForSwim), so the subtraction that gives the
      // litres has nothing to work from. The panel drops that clause rather
      // than estimating, exactly as "Mere in prostor" above drops the weights.
      [
        "Voda in vzdrževanje",
        (typeof m.dryKg === "number" && typeof m.filledKg === "number"
          ? "Swim spa drži približno " + litresText(m.dryKg, m.filledKg) +
            " vode, filtracija pa teče prek filtra " + filterAreaText(m.filterSf) + ". "
          : "Filtracija teče prek filtra " + filterAreaText(m.filterSf) +
            "; količino vode dobimo iz teže, ki je dobavitelj za ta model ne navaja. ") +
          "Vzdrževanje je preverjanje vode, čiščenje filtra in doziranje — " +
          "približno deset minut na teden; postopek pokažemo ob predaji.",
        "Poraba, vzdrževanje in zimska uporaba",
        "/faq",
      ],
      [
        "Dostava in montaža",
        "Swim spa pripeljemo, postavimo, priklopimo in zaženemo. Zaradi " +
          "dolžine je zanj potreben izredni prevoz: dostop in prostor za dvig " +
          "preverimo na lokaciji pred potrditvijo termina.",
        "Kako poteka dostava in montaža swim spa bazena",
        "/delivery",
      ],
      [
        "Garancija",
        // ⚠️ "PREK NAŠE MREŽE" IS GONE, AND IT WAS THE ONE CLAIM THIS SHOP
        // HAD ALREADY DECIDED IT MAY NOT MAKE. A network is an assertion
        // about scale — branches, engineers, coverage — and the note beside
        // the hero's assurance strip (content/bazen.ts, `assure`) says in as
        // many words that the service network "is among the claims still
        // waiting on the owner", which is why the strip says "servis urejamo
        // sami" instead. Both product panels then said the other thing, on
        // the six pages where a buyer is deciding. One word from the owner
        // puts the network back; until then the two say the same thing.
        "Tri leta. Rezervne dele in servis urejamo sami.",
        // The two-year statutory conformity right is NOT the three-year
        // manufacturer's guarantee, and this panel names only the second. The
        // page that sets them side by side is the terms page; sending the
        // reader there is the difference between a number and their rights.
        "Garancija in zakonsko jamstvo za skladnost blaga",
        // The SECTION, not the top of the page: the terms run nine headings
        // and this link names one of them. See panelMore in themes/studio/pdp.ts.
        "/terms#s6-jamstvo-za-skladnost-blaga-in-garancija",
      ],
    ],
    // ⚠️ NO SHELL LIST EITHER — the sheet states ONE shell colour for every
    // swim spa ("silver white 6427"), so the ten-shade hot-tub chart rendered
    // here as a live choice was an inherited assumption dressed as a
    // configurator: the picked shade travelled into the enquiry mail as an
    // agreed configuration nobody can honour. The spec row states the sheet's
    // own colour instead. Same reasoning as the cabinet note below.
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
    // The h1 names the page; the title has to win a result list. "Masažni
    // bazeni | Masažni bazeni Vrelec" printed the category noun twice and
    // offered a searcher nothing to choose on. No figures here on purpose:
    // "za 5 ali 6 oseb" and "od 195 do 230 cm" are in the description, which
    // is cheap to correct, while a title with a stale number is the line
    // Google shows.
    seoTitle: "Masažni bazeni za doma in vrt",
    intro:
      "Trije modeli, ki se ne razlikujejo samo po velikosti. BAZEN 195 meri " +
      "1,95 × 1,95 m in je edini, ki se umesti tja, kamor druga dva ne gresta: " +
      "pet mest, od tega dva ležalnika, 35 šob, ena črpalka 3 KM in 1.500 " +
      "kilogramov, ko je poln. BAZEN 210 meri 2,10 × 2,10 m in sprejme največ " +
      "ljudi: šest mest z enim ležalnikom in 37 šob, napolnjen 1.870 " +
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
    // ⚠️ NO "ZA PLAVANJE NA MESTU" HERE. It is the obvious differentiator and
    // it is a family promise this shop cannot make: SWIM 450 lists no
    // counter-current jet at all, which is why swimSpaFamilyHasSwimJets()
    // exists and why the intro above branches on it. A title is the one line
    // a searcher reads before clicking; it may not claim what the range does
    // not uniformly do.
    seoTitle: "Swim spa bazeni — mere in cene",
    intro:
      // ⚠️ THE OTHER NAMES, AS NAMES — AND THE FAMILY IS NOT RENAMED AFTER
      // THEM. The owner asked for this family to be called "Plavalni
      // (protitočni) bazeni", and the second word is a claim it cannot carry:
      // protitok IS the counter-current, SWIM 450 lists swimJets: 0
      // (catalog/swimspa.ts), swimSpaFamilyHasSwimJets() returns false, and
      // swimspa.test.ts pins that with "does not advertise a counter-current
      // jet the range cannot deliver". A family named after the jet asserts it
      // for all three, and the h1 would then contradict the sentence four
      // lines below it on the same screen; the SWIM 450 breadcrumb would carry
      // a swimming-pool label into the SERP on the one model with no swim jet.
      //
      // So the words arrive the way jacuzzi and whirlpool did on the FAQ: as
      // what people CALL the thing, in a sentence that describes usage and
      // asserts nothing about any model. "swim spa" stays the family name and
      // stays in all 27 internal anchors that use navLabel.
      "Swim spa bazenu se reče tudi plavalni bazen, tisti s tokom pa " +
      "protitočni — pri nas ostaja swim spa, ker vsi trije modeli niso enaki. " +
      "Tri školjke, pri katerih je prva številka dolžina. Od nje je odvisno, " +
      "koliko plavanja je v bazenu in koliko vrta potrebujete zanj. SWIM 450 " +
      "meri 4,50 × 2,28 m in je vstopni model: najkrajša školjka v ponudbi, " +
      "tri mesta, štiri šobe in 5.750 kilogramov, ko je polna. Modela 580 sta " +
      "dolga 5,80 m in imata sedem mest z enim ležalnikom. SWIM 580 HIDRO ima " +
      "38 šob in tri črpalke 3 KM, napolnjen tehta 8.490 kilogramov; SWIM 580 " +
      "MAXI ima 94 šob (največ v vsej ponudbi) in pet črpalk 3 KM, " +
      "napolnjen pa je lažji, 7.360 kilogramov. " +
      (swimSpaFamilyHasSwimJets()
        ? "Tok za plavanje na mestu ustvarijo protitočne šobe, ki jih ima vsak " +
          "od treh modelov. "
        // ⚠️ NOT "KOLIKO JIH IMA POSAMEZEN MODEL" — that presupposes every
        // model has some, and this branch runs precisely because one does not.
        // The guard above knows it; the sentence under the guard did not.
        : "Tok za plavanje na mestu ustvarijo protitočne šobe, ki jih nimajo vsi trije " +
          "modeli: modela 580 imata po tri, za SWIM 450 pa jih dobaviteljev list ne " +
          "navaja. ") +
      "Swim spa praviloma stoji na betonski plošči, ne na terasi. Dostop " +
      "in prostor za dvig preverimo na lokaciji pred potrditvijo termina.",
    metaDescription:
      // ⚠️ AND NOT "ZA PLAVANJE NA MESTU". The seoTitle six lines above
      // carries a note explaining at length why it may not say this — SWIM
      // 450 lists no counter-current jet and swimSpaFamilyHasSwimJets() is
      // false — and the description then said it anyway, in the line the
      // searcher actually reads under the title.
      "Swim spa bazeni od 450 do 580 cm za tri do sedem oseb. " +
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
  // ⚠️ A KEYWORD AND A COUNTRY JOINED BY A MIDDOT IS NOT A SENTENCE. This
  // read "Masažni bazen · Slovenija": two nouns, no verb, nobody in it, and
  // it repeated a word the h1 says two lines below it. It is the first line
  // on the home page and it now sits beside a wordmark that says MASAŽNI
  // BAZENI already, so the repetition was about to be threefold.
  //
  // The keyword stays in first position, which is the only SEO constraint
  // this line has; the other two words go on the thing that separates this
  // shop from a catalogue, in the voice the rest of the site uses — first
  // person plural, present tense.
  //
  // ⚠️ NO "PO VSEJ SLOVENIJI" HERE. The obvious version reads "pripeljemo po
  // vsej Sloveniji" and it is three lines above a marquee that already says
  // "DOSTAVA, PRIKLOP IN ZAGON PO VSEJ SLOVENIJI" — both visible in the same
  // first screen. The geography is not lost; it is stated by the device
  // directly under this one.
  kicker: "Masažni bazeni · pripeljemo in zaženemo",
  // ⚠️ THE H1 SELLS THE DIFFERENCE, NOT THE SPEC — and it keeps the keyword
  // in the first two words, which is the only SEO constraint it has.
  //
  // It read "Masažni bazen za pet ali šest oseb." That is a line from a
  // price list. It answers a question nobody arrives with: anyone shopping
  // for a hot tub already knows roughly how many people sit in one, and the
  // seat count is on every card two screens down. What they do NOT know, and
  // what actually decides where they buy, is who solves the hard part — a
  // 1.430 kg object that has to cross a garden, sit on something that holds
  // it and be wired by an electrician.
  //
  // That is this shop's whole argument, made at length on /o-nas and
  // /dostava-in-montaza, and the hero was the one place not making it.
  // Five words now do: the noun for the crawler, the promise for the reader.
  // The seat counts move to the sub, where a spec belongs.
  h1: "Masažni bazen, ki ga postavimo mi.",
  // No price in the hero copy even now that COST_INPUTS is set. A figure in
  // an h1's sub is the one a customer remembers, and it would go stale the
  // day the inputs move — the cards and the PDPs derive theirs and this line
  // would not.
  // ⚠️ THIS LINE IS THE STATEMENT BAND'S ONLY PROSE, under the heading "Od
  // terase do prve kopeli — vse opravimo mi." Two things follow: it has to
  // COVER THE WHOLE SHOP (it still sold a three-model, 195–230 cm range two
  // bands above a stats row saying "6 modelov / 195–580 cm"), and it has to
  // DELIVER THE ARC the heading promises — ogled, dostava, priklop, zagon —
  // because moat.steps render on /dostava-in-montaza, not here. Spelled-out
  // numerals, because the ring device cuts numerals in this band.
  sub: "Trije masažni bazeni od 195 do 230 cm za pet ali šest oseb in trije swim spa bazeni od 450 do 580 cm. Pridemo pogledat lokacijo, bazen pripeljemo, priklopimo, zaženemo in predamo. Vi pripravite kopalke.",
  cta: "Izberite svoj bazen",
  metaDescription:
    "Masažni bazeni za 5 ali 6 oseb, 35–50 šob, akrilna školjka in ogrevanje. Ogled lokacije, dostava na teraso in zagon po vsej Sloveniji.",
  // ⚠️ THREE CONFIRMED PROOFS, CHOSEN BY WHAT IS SETTLED RATHER THAN BY WHAT
  // SELLS BEST.
  //
  // `trust` below reads well in a ticker and could NOT be reused here: two of
  // its four entries — the service network and the 36 instalments — are among
  // the claims still waiting on the owner, and the hero is the last surface on
  // the site where an unconfirmed one belongs.
  //
  // What is left is stronger than it looks, because each is checkable by the
  // visitor within one click:
  //   - the price floor is DERIVED from the offered models, so it cannot drift
  //     from the figures on their own pages, and it says the quiet part out
  //     loud on a six-thousand-euro purchase;
  //   - the free site visit is the shop's real differentiator and has a whole
  //     page behind it;
  //   - delivery-and-commissioning is the promise every product page,
  //     /dostava-in-montaza and the terms already make.
  heroTrust: [
    "Modeli od " + modelPrice(OFFERED_MODELS[0]!) + " z DDV",
    "Brezplačen ogled lokacije pred nakupom",
    "Dostava, priklop in zagon po vsej Sloveniji",
  ],
  // The four strings that used to live in shared render code. See the notes
  // beside each field in content/types.ts for what each one was doing there.
  homeTitleTail: "cena in dostava",
  membershipBody:
    "Pridemo pogledat, kam bi bazen postavili, brezplačno in brez obveznosti.",
  blogLead:
    "Kaj je pri masažnem bazenu res pomembno — velikost, poraba, priprava " +
    "terase in vzdrževanje. Brez prodajnih obljub, ki jih ne moremo držati.",
  blogMetaDescription:
    "Nasveti o masažnih bazenih in swim spa bazenih: izbira velikosti, priprava " +
    "podlage in priklopa, poraba, vzdrževanje in dostava po Sloveniji.",
  swatchMessage: "Prosim za vzorčnik barv školjke.",
  trust: [
    "Dostava in zagon po vsej Sloveniji",
    "Ogled lokacije pred ponudbo",
    "Servis in rezervne dele urejamo sami",
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
      // "Pred nakupom", not "pred dostavo": the visit is the shop's
      // see-before-you-buy offer and every other surface places it before
      // the purchase — logistics wording undersold it here.
      p: "Napolnjen bazen tehta do 2.210 kg, swim spa še precej več. Pred nakupom brezplačno preverimo nosilnost, dostop in elektriko.",
      cta: "Naročite ogled",
      // The page WRITTEN for this errand. It pointed at /kontakt while the
      // closing band's identical promise pointed at /ogled-lokacije — the
      // same click, two destinations on one scroll.
      href: "/ogled-lokacije",
    },
  ],
  moat: {
    h2: "Od terase do prve kopeli vse opravimo mi.",
    steps: [
      ["Ogled lokacije", "Preverimo dostop, podlago in električni priklop."],
      ["Priprava priklopa", "Navodila za vašega električarja ali izvedba z našim partnerjem."],
      ["Dostava na teraso", "Ekipa z opremo za prenos, tudi čez ograjo, če je treba."],
      ["Priklop in zagon", "Napolnimo, zaženemo filtracijo in ogrevanje ter umerimo šobe."],
      // ⚠️ "PRIBLIŽNO", AND "NIČ VEČ" IS GONE. /dostava-in-montaza,
      // /pogosta-vprasanja and /o-nas all hedge this figure ("Približno deset
      // minut na teden"); the home page was the one surface that turned the
      // estimate into a promise, and added an absolute to it. Nobody has
      // measured a week of anybody's maintenance.
      ["Predaja", "Pokažemo vzdrževanje: približno deset minut na teden."],
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
    claim: ["Bazen tehta tudi tisoč štiristo trideset kilogramov. ", "Premaknemo ga mi."],
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
  // Describes the quotes and claims nothing beyond them. SPLIT IN TWO, because
  // the two halves are not equally true: how a quote was handled is true
  // whoever wrote it, while "kupile pri nas" is the purchase claim and answers
  // to `verified` exactly as the chip does. These four carry order_id NULL, so
  // today only the first line prints. See reviewsLeadVerified in types.ts.
  // OUR OWN INSTALLATIONS — empty, and empty is the correct state.
  //
  // The band on /o-nas renders one figure per entry and nothing at all with
  // none, so it costs the page nothing until the first job is photographed.
  // Upload the picture to a montaza-* slot in /admin, then write the entry:
  //
  //   installations: [
  //     { slot: "montaza-1", model: "BAZEN 230", place: "Domžale", month: "marec 2026" },
  //   ],
  //
  // The entry is the assertion — see the note on `installations` in
  // content/types.ts for why this band, alone on the site, may not fall back
  // to the shop's product photography. Town only, never an address.
  reviewsLead: "Objavljena so tako, kot smo jih prejeli.",
  reviewsLeadVerified: "Zapisali so jih stranke, ki so pri nas kupile bazen.",
  reviews: GENERATED_REVIEWS["bazen"] ?? [],
  // ⚠️ SLUGS NOW, NOT FRAGMENTS. These used to be the derived section ids on
  // /vodniki, because the three guides were three sections of that one page.
  // They are pages now (content/pages/vodnik.ts), so a card is a door to a
  // URL rather than a scroll position — which is also what lets each guide
  // rank for the query it answers.
  guides: [
    ["Vodnik za nakup", "Masažni bazen na terasi: kaj preveriti pred nakupom?",
      "masazni-bazen-na-terasi"],
    ["Cene 2026", "Koliko stane masažni bazen? Nakup in obratovanje.",
      "koliko-stane-masazni-bazen"],
    // ⚠️ NOT "stroški in nasveti". The card promised a cost answer this guide
    // does not give — see the note on its seoTitle in pages/vodnik.ts. The
    // cost question has its own guide one card above.
    ["Pozimi", "Masažni bazen pozimi: zakaj deluje bolje kot poleti.",
      "masazni-bazen-pozimi"],
  ],
  categories,
  collections,
  // Distinct from the home page's on purpose: the hub's job is "both
  // families, all six models", where home leads with the keyword.
  // ⚠️ "cene, z dostavo" stood here — a snippet reading as delivery-inclusive
  // prices, against pogoji.ts and both freight tables ("po ponudbi"). The
  // SERP line is a price surface like any other: what it says about the
  // composition must match what the page says beside the figure.
  // ⚠️ SHORT ENOUGH TO SURVIVE THE SNIPPET. This measured 969px at 14px Arial
  // against Google's ~920px desktop cap, so it was cut mid-clause and the
  // clause it lost was "dostava po ponudbi" — the one a buyer of a 400 kg
  // object most needs. Rewritten to 149 characters, which measures inside the
  // cap with the delivery term intact.
  hubMetaDescription:
    "Masažni bazeni 195–230 cm in swim spa 450–580 cm. Cene z DDV, priklop " +
    "in zagon vključena, dostava po ponudbi.",
  // The lede states the decision; the two cards under it carry the facts the
  // decision turns on. What used to be here — one nine-line paragraph doing
  // both jobs — is the reason hubChoice exists; see its note in types.ts.
  hubIntro:
    // "stvar" twice in one sentence, and then "Vsakega" — masculine, with no
    // masculine noun anywhere in the paragraph to attach to. The reader had to
    // reach back to "bazen" inside a subordinate clause to resolve it.
    "Najprej se odločite med dvema bazenoma, ki nista različici istega. Razlika " +
    "ni v velikosti, ampak v tem, kaj v bazenu počnete. Od tega je odvisno " +
    "vse drugo: podlaga, dostop, priprava priklopa in cena dostave. Oba " +
    "pripeljemo, priklopimo in zaženemo.",
  // EVERY FIGURE IS THE CATALOGUE'S — the same ranges the collection intros
  // walk model by model: 195/210/230 cm square at 1.500–2.210 kg filled, and
  // 450–580 cm long at 5.750–8.490 kg filled.
  hubChoice: [
    {
      label: "Masažni bazen",
      text:
        "Kvadratna školjka, v kateri se sedi in leži: masaža, ne plavanje. " +
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
        // Two colons in one sentence, a clause with no subject ("so 3 KM"),
        // and a "jih" whose antecedent could be the jets or the pumps.
        "Število šob ni ocena kakovosti. Šobe poganjajo črpalke, in te so pri vseh šestih " +
          "modelih po 3 KM — razlikuje se njihovo število, od ene do petih. " +
          "Zato ob številu šob poglejte število črpalk, saj to pove, koliko šob dela pod " +
          "polnim pritiskom hkrati.",
        // "od BAZENA 210": the preposition governs the genitive. /primerjava
          // declines the identical sentence correctly, so the shop shipped both.
        "Število mest tudi ni isto kot velikost. BAZEN 230 je večji od BAZENA 210 in ima eno " +
          "mesto manj, ker ima dva ležalnika namesto enega: ležalnik zasede prostor dveh " +
          "sedežev. Če radi ležite, je manj mest pravzaprav tisto, kar iščete.",
        // ⚠️ "nekaj sto kilogramov in ga je mogoče prestaviti" IS TRUE OF THREE
          // MODELS OF SIX. The hot tubs are 300/370/410 kg dry; the swim spas
          // are 1.050/1.260/1.430 — and this same paragraph names two of them
          // three sentences later. The home page's own stats band says "1.430
          // kg · najtežji model, prazen — dostava z ekipo", and /swim-spa's
          // table prints all three. Promising a EUR 16.790–21.690 buyer they
          // can shift it is the exact claim the free site visit exists to
          // protect against.
          // ⚠️ TWO RANGES, NOT ONE. This read "poln je od 1.500 do 8.490
          // kilogramov", which describes a continuum the catalogue does not
          // have: nothing exists between 2.210 and 5.750, and the sentence had
          // also lost the subject that would say which family it meant.
          // "zdržati proti čemu" is not Slovenian either; the load is
          // something the base has to carry, not something it faces.
          "Teža, ki šteje, je teža napolnjenega bazena, ne praznega. Napolnjen masažni bazen " +
          "tehta od 1.500 do 2.210 kilogramov, napolnjen swim spa pa od 5.750 do 8.490 — " +
          "in to je številka, ki jo mora zdržati podlaga. Največji swim spa v ponudbi " +
          "tudi ni tisti z največ šobami: SWIM 580 MAXI ima 94 šob pri 7.360 kilogramih, " +
          "SWIM 580 HIDRO pa 38 pri 8.490.",
      ],
    },
    {
      h: "Kaj sledi, ko model izberete",
      p: [
        "Vrstni red je obrnjen od pričakovanega: najprej prostor, dostop in podlaga, šele " +
          "nato konfiguracija. Zato pridemo na vaš naslov pogledat, kam bi bazen postavili, " +
          "preden karkoli kupite. Ogled je brezplačen po vsej Sloveniji in vas k ničemur ne " +
          "zavezuje. Če se izkaže, da izbrani model pri vas ni izvedljiv, vam to povemo.",
        "Cene modelov na tej strani so v evrih in vključujejo DDV. Vključujejo zagon, " +
          // "ni zaračunan v ceni" reads equally as "it is free" and as "it is
          // not covered — you will be billed for it", on the one paragraph
          // this page devotes to money. /pogoji-poslovanja says it plainly.
          "umeritev in predajo; ogled lokacije opravimo brezplačno, že pred ponudbo. Dostava z ekipo in " +
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
    // pogledat v živo". There is no showroom; this names the thing the shop
    // really does, which is the same promise the moat band makes.
    //
    // ⚠️ AND IT SAID IT WITH NO VERB IN IT. The replacement read "Specialist
    // za masažne bazene v Sloveniji. Dostava, priklop in zagon po vsej
    // Sloveniji, z brezplačnim ogledom lokacije pred nakupom." — three faults
    // in 131 characters. "Specialist za" is a status nobody can check,
    // claimed as a noun, on a site whose /o-nas page refuses to state a
    // founding year or an installation count for exactly that reason;
    // "Sloveniji" appears twice; and the second sentence is four
    // nominalisations with no verb at all, so the promise the whole shop
    // rests on was written as a directory entry. It also quietly stopped
    // selling the swim spas, which the footer's own link column lists.
    //
    // Five verbs now, all first-person plural, Slovenia once. It sits
    // directly under the new signature, which is the other reason it had to
    // stop being a label.
    "Prodajamo masažne in swim spa bazene po vsej Sloveniji. Pred nakupom pridemo " +
      "pogledat lokacijo, nato bazen pripeljemo, priklopimo in zaženemo.",
};
