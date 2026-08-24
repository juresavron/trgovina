import type { ShopContent } from "./types";

export const bazenContent: ShopContent = {
  nav: ["Bazeni", "Primerjava", "Vodniki", "Dostava in montaža", "Kontakt"],
  artKey: "pool",
  kicker: "Masažni bazen · Slovenija",
  h1: "Masažni bazen za pet oseb.",
  sub: "Akrilna školjka, več kot štirideset šob, ogrevanje in filtracija. Na teraso ga pripeljemo, priklopimo in zaženemo — vi pripravite kopalke. 2.990 € z DDV.",
  cta: "Izberite svoj bazen",
  metaDescription:
    "Masažni bazen za 5 oseb z ogrevanjem in 40+ šobami. Ogled lokacije, dostava na teraso in zagon po vsej Sloveniji. 2.990 € z DDV.",
  trust: [
    "Dostava in zagon po vsej Sloveniji",
    "Ogled lokacije pred dostavo",
    "Servisna mreža in rezervni deli",
    "Do 36 mesečnih obrokov",
  ],
  stats: [
    ["5 oseb", "udobno, brez gneče"],
    ["40+", "masažnih šob"],
    ["38 °C", "tudi sredi zime"],
    ["4,40 m³", "dostava z ekipo"],
  ],
  products: [
    {
      name: "BAZEN RELAX 5",
      desc: "Akrilni masažni bazen za 5 oseb z ogrevanjem in LED-osvetlitvijo.",
      meta: "5 oseb · 40+ šob · ogrevanje",
      price: "2.990 €",
      art: "pool",
      badge: "Najbolje prodajan",
    },
    {
      name: "PAKET TERASA",
      desc: "RELAX 5 s termo pokrovom, stopnico in podlogo za teraso.",
      meta: "komplet za zunanjo postavitev",
      price: "3.390 €",
      art: "pool",
    },
    {
      util: true,
      h: "Bo terasa zdržala?",
      p: "Pred dostavo brezplačno preverimo nosilnost, dostop in elektriko.",
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
    claim: ["Bazen je težak štiristo kilogramov. ", "Za vas ga premikamo mi."],
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
  pdp: {
    slug: "relax-5",
    eyebrow: "Najbolje prodajan",
    title: "BAZEN RELAX 5",
    sub: "Akrilni masažni bazen za pet oseb: 40+ šob, ogrevanje do 38 °C, LED-osvetlitev in filtracija.",
    price: "2.990 €",
    priceCents: 299000,
    cfg: [
      ["Paket", ["RELAX 5 — 2.990 €", "PAKET TERASA — 3.390 €"], 0],
      ["Priklop", ["Moj električar (navodila)", "Naš partner — po ponudbi"], 0],
      ["Servis", ["Osnovni", "Letni pregled — 129 €/leto"], 0],
    ],
    freight: [
      ["Dostava z ekipo in opremo za prenos", "149 €", false],
      ["Zagon, umeritev in predaja", "vključeno", true],
      ["Ogled lokacije pred dostavo", "vključeno", true],
    ],
    note: "Cenik logistike: razred pallet_xl · cona SI. Ogled uskladimo pred potrditvijo termina.",
    spec: [
      ["Kapaciteta", "5 oseb"],
      ["Šobe", "42, nastavljive"],
      ["Ogrevanje", "do 38 °C"],
      ["Priklop", "230 V / 16 A"],
      ["Mere", "200 × 200 × 90 cm"],
      ["Volumen dostave", "4,40 m³"],
      ["Dobavni rok", "21 dni"],
      ["Garancija", "3 leta, školjka 5 let"],
    ],
    bar: ["BAZEN RELAX 5", "5 oseb · ogrevanje · LED", "2.990 €", "V košarico"],
  },
  footNote:
    "Specialist za masažne bazene v Sloveniji. Razstavni bazen v Ljubljani — pridite ga pogledat v živo.",
};
