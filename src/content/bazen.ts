import type { PdpContent, ProductCard, ShopContent } from "./types";
import type { PolaModel } from "../catalog/pola";
import {
  POLA_MODELS,
  footprint,
  metaLine,
  modelPrice,
  modelPriceCents,
  seating,
} from "../catalog/pola";
import { PRICE_UNSET } from "../catalog/pricing";

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
const models: ProductCard[] = POLA_MODELS.map((m) => ({
  name: m.name,
  desc: "Akrilna školjka " + footprint(m) + ", " + m.jets + " masažnih šob, " + seating(m) + ".",
  meta: metaLine(m),
  price: modelPrice(m),
  art: "pool" as const,
  slug: m.slug,
  ...(m.jets === 55 ? { badge: "Največ šob" } : {}),
  ...(m.mm[0] === 1950 ? { badge: "Najmanjši tloris" } : {}),
}));

/** The flagship: the larger shell in its more wanted layout, two loungers. */
const flagship = POLA_MODELS.find((m) => m.code === "ZR801")!;

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
    eyebrow: m.lounges === 2 ? "Dva ležalnika" : m.lounges === 1 ? "Ležalnik in pet sedežev" : "Šest sedežev",
    title: m.name,
    sub:
      "Akrilni masažni bazen " +
      footprint(m) +
      " za " +
      seating(m) +
      ": " +
      m.jets +
      " nastavljivih šob, ogrevanje in filtracija.",
    price: modelPrice(m),
    priceCents: modelPriceCents(m),
    // Option names without figures: the supplier prices these in USD FOB too,
    // so a euro price for a cover lifter needs the same landed-cost pass the
    // shells need. An option listed without a price is honest; one listed with
    // a guessed price is not.
    cfg: [
      ["Termo pokrov", ["Osnovni", "S škarjastim dvigalom"], 0],
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
    bar: [m.name, seating(m) + " · " + m.jets + " šob", modelPrice(m), "V košarico"],
  };
}

export const bazenContent: ShopContent = {
  nav: ["Bazeni", "Primerjava", "Vodniki", "Dostava in montaža", "Kontakt"],
  artKey: "pool",
  kicker: "Masažni bazen · Slovenija",
  h1: "Masažni bazen za pet ali šest oseb.",
  // No price in the hero copy while COST_INPUTS is unset. Naming a figure
  // here and a dash on the cards would be worse than naming neither, and a
  // price in an h1's sub is the one a customer remembers.
  sub: "Devet modelov od 195 do 230 cm, od dvaintridesetih do petinpetdesetih šob, akrilna školjka in ogrevanje. Na teraso ga pripeljemo, priklopimo in zaženemo — vi pripravite kopalke.",
  cta: "Izberite svoj bazen",
  metaDescription:
    "Masažni bazeni za 5 ali 6 oseb, 32–55 šob, akrilna školjka in ogrevanje. Ogled lokacije, dostava na teraso in zagon po vsej Sloveniji.",
  trust: [
    "Dostava in zagon po vsej Sloveniji",
    "Ogled lokacije pred dostavo",
    "Servisna mreža in rezervni deli",
    "Do 36 mesečnih obrokov",
  ],
  // Every figure here is the supplier's own — the previous set led with a
  // temperature the price list does not state.
  stats: [
    ["9 modelov", "od 195 do 230 cm"],
    ["do 55", "masažnih šob"],
    ["3 kW", "grelec, Balboa krmilnik"],
    ["410 kg", "prazen — dostava z ekipo"],
  ],
  products: [
    ...models,
    {
      util: true,
      h: "Bo terasa zdržala?",
      p: "Napolnjen bazen tehta do 2.210 kg. Pred dostavo brezplačno preverimo nosilnost, dostop in elektriko.",
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
  reviews: [
    {
      q: "Ekipa je bazen prenesla čez ograjo terase brez ene praske. Zvečer smo že sedeli v topli vodi.",
      who: "Družina Novak, Domžale",
      model: "BAZEN RELAX 5",
    },
    {
      q: "Ogled pred nakupom je rešil vse dileme — povedali so, kam ga postaviti in kaj mora pripraviti električar.",
      who: "Sandra P., Koper",
      model: "PAKET TERASA",
    },
  ],
  guides: [
    ["Vodnik za nakup", "Masažni bazen na terasi: kaj preveriti pred nakupom?"],
    ["Cene 2026", "Koliko stane masažni bazen? Nakup in obratovanje."],
    ["Pozimi", "Masažni bazen pozimi: stroški in nasveti."],
  ],
  pdp: pdpFor(flagship),
  pdps: POLA_MODELS.map(pdpFor),
  footNote:
    "Specialist za masažne bazene v Sloveniji. Razstavni bazen v Ljubljani — pridite ga pogledat v živo.",
};
