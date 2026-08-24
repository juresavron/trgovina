import type { ShopContent } from "./types";

export const kopalnaContent: ShopContent = {
  nav: ["Kadi", "Primerjava", "Vodniki", "Dostava in montaža", "Kontakt"],
  artKey: "bathtub",
  kicker: "Prostostoječa kad · Slovenija",
  h1: "Prostostoječa kad iz litega marmorja.",
  sub: "Mineralni liv, mat površina, topel otip — nič akrila. Dvočlanska ekipa jo prinese tudi v prvo nadstropje, postavi in priklopi. Od 1.390 € z DDV.",
  cta: "Izberite svojo kad",
  metaDescription:
    "Prostostoječa kad iz litega marmorja z dostavo in montažo po vsej Sloveniji. Mineralni liv, mat bela, od 1.390 € z DDV. Razstavni salon v Ljubljani.",
  trust: [
    "Dostava in postavitev po vsej Sloveniji",
    "Tudi v nadstropje — brez dvigala",
    "Mineralni liv, ne akril",
    "Do 24 mesečnih obrokov",
  ],
  stats: [
    ["170 kg", "teža kadi"],
    ["1700 mm", "dolžina"],
    ["6 mm", "debelina stene"],
    ["10 let", "garancije na liv"],
  ],
  products: [
    {
      name: "KAD OVAL 1700",
      desc: "Prostostoječa kad iz litega marmorja, mat bela. Za glavno kopalnico.",
      meta: "1700 × 800 × 580 mm · 170 kg · mineralni liv",
      price: "1.690 €",
      art: "bathtub",
      badge: "Najbolje prodajana",
    },
    {
      name: "KAD OVAL 1500",
      desc: "Krajša različica za kopalnice, kjer šteje vsak centimeter.",
      meta: "1500 × 750 × 570 mm · 145 kg · mineralni liv",
      price: "1.390 €",
      art: "bathtub",
    },
    {
      util: true,
      h: "Bo šla skozi vrata?",
      p: "Pred naročilom brezplačno preverimo vrata, stopnišče in odtok.",
      cta: "Naročite ogled →",
    },
  ],
  moat: {
    h2: "Sto sedemdeset kilogramov, ki jih ne boste nosili vi.",
    steps: [
      ["Naročilo in klic", "Preverimo širino vrat, stopnišče in mesto odtoka."],
      ["Dvočlanska ekipa", "Kad prinesemo v kopalnico — tudi v nadstropje brez dvigala."],
      ["Postavitev", "Izravnamo jo do desetinke stopinje; brez tega se voda ne odteka."],
      ["Priklop", "Sifon in odtok priklopimo ter preizkusimo tesnjenje."],
      ["Prva kopel", "Embalažo odpeljemo. Vi samo napolnite."],
    ],
    claim: ["Nemški spletni trgovci v Slovenijo te kadi ne dostavijo. ", "Mi jo prinesemo v nadstropje."],
  },
  reviews: [
    {
      q: "Kad so prinesli v prvo nadstropje po ozkem stopnišču brez ene praske na zidu. Mislila sem, da bo to nemogoče.",
      who: "Nina T., Ljubljana",
      model: "KAD OVAL 1700",
    },
    {
      q: "Razlika med litim marmorjem in akrilom se čuti takoj — voda ostane topla veliko dlje, kot sem pričakoval.",
      who: "Gregor M., Nova Gorica",
      model: "KAD OVAL 1500",
    },
  ],
  guides: [
    ["Vodnik za nakup", "Liti marmor ali akril — kaj se res splača?"],
    ["Cene 2026", "Koliko stane prostostoječa kad? Z dostavo in priklopom."],
    ["Pred nakupom", "Koliko prostora potrebuje prostostoječa kad?"],
  ],
  pdp: {
    slug: "oval-1700",
    eyebrow: "Najbolje prodajana",
    title: "KAD OVAL 1700",
    sub: "Prostostoječa kad iz litega marmorja: mat bela površina, 6 mm stena, topel otip in počasno ohlajanje vode.",
    price: "1.690 €",
    priceCents: 169000,
    cfg: [
      ["Dolžina", ["1500 mm — 1.390 €", "1700 mm — 1.690 €"], 1],
      ["Površina", ["Mat bela", "Sijaj bela (+120 €)"], 0],
      ["Odtok", ["Standardni sifon", "Talni odtok (+90 €)"], 0],
    ],
    freight: [
      ["Dostava — dvočlanska ekipa, v kopalnico", "119 €", false],
      ["Postavitev in izravnava", "vključeno", true],
      ["Odvoz embalaže", "vključeno", true],
    ],
    note: "Cenik logistike: razred two_man · cona SI. Priklop na odtok uskladimo z vašim vodovodarjem.",
    spec: [
      ["Zunanje mere", "1700 × 800 × 580 mm"],
      ["Material", "liti marmor (mineralni liv)"],
      ["Debelina stene", "6 mm"],
      ["Teža", "170 kg"],
      ["Prostornina", "230 l"],
      ["Površina", "mat bela"],
      ["Dobavni rok", "21 dni"],
      ["Garancija", "10 let na liv"],
    ],
    bar: ["KAD OVAL 1700", "mat bela · dostava v kopalnico", "1.809 €", "V košarico"],
  },
  footNote:
    "Specialist za prostostoječe kadi v Sloveniji. Razstavni salon v Ljubljani — pridite se je dotakniti.",
};
