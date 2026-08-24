import type { ShopContent } from "./types";

export const kadContent: ShopContent = {
  nav: ["Ledene kadi", "Primerjava", "Vodniki", "Dostava in montaža", "Kontakt"],
  artKey: "tub",
  kicker: "Ledena kad · Slovenija",
  h1: "Ledena kad s pravim hlajenjem.",
  sub: "Voda na 3 °C ob kateri koli uri — brez vreč ledu. Hladilnik, filtracija in UV v enem sistemu. Postavimo jo tja, kjer jo boste zares uporabljali. 2.490 € z DDV.",
  cta: "Izberite svojo kad",
  metaDescription:
    "Ledena kad z aktivnim hlajenjem do 3 °C, filtracijo in UV. Dostava in postavitev po vsej Sloveniji, 2.490 € z DDV. Za dom, klub ali studio.",
  trust: [
    "Dostava in postavitev po vsej Sloveniji",
    "Priklop v navadno vtičnico, 230 V",
    "Voda ostane čista do 3 tedne",
    "Financiranje za športne klube",
  ],
  stats: [
    ["3 °C", "ciljna temperatura"],
    ["800 W", "hladilna moč"],
    ["45 dB", "glasnost hladilnika"],
    ["230 V", "navadna vtičnica"],
  ],
  products: [
    {
      name: "KAD PRO",
      desc: "Ledena kad s hladilnikom, filtracijo in UV. Pripravljena vsako jutro.",
      meta: "3 °C · 800 W · 230 V · 1,50 m³",
      price: "2.490 €",
      art: "tub",
      badge: "Priporočamo",
    },
    {
      name: "PAKET PRO+",
      desc: "KAD PRO s pokrovom, stopnico in digitalnim termometrom.",
      meta: "komplet · 3 °C · 230 V",
      price: "2.790 €",
      art: "tub",
    },
    {
      util: true,
      h: "Kad za klub ali studio?",
      p: "Večja frekvenca uporabe zahteva drugačen filter in servisni plan.",
      cta: "Ponudba za podjetja →",
    },
  ],
  moat: {
    h2: "Mi jo pripeljemo, priklopimo in umerimo. Vi samo vstopite.",
    steps: [
      ["Naročilo in klic", "Preverimo lokacijo, podlago in vtičnico."],
      ["Dostava — dvočlanska ekipa", "Na teraso, v kopalnico ali v garažo. Kamor rečete."],
      ["Postavitev in priklop", "Napolnimo, priklopimo hlajenje in filtracijo."],
      ["Umeritev na 3 °C", "Sistem umerimo in preverimo cikel čiščenja."],
      ["Prva kopel", "Z vodičem za varen začetek: 3 minute so dovolj."],
    ],
    claim: ["Montaža ni doplačilo — pri ledeni kadi je vključena. ", "Vedno."],
  },
  reviews: [
    {
      q: "Od dostave do prve kopeli je minilo štirideset minut. Voda je bila na treh stopinjah naslednje jutro in vsako jutro od takrat.",
      who: "Rok B., Maribor",
      model: "KAD PRO",
    },
    {
      q: "Za naš klub je pomembno, da je voda čista brez dnevnega dela. Filter in UV to rešita — enkrat na teden preverim, to je vse.",
      who: "AtletiKa, Ljubljana",
      model: "PAKET PRO+",
    },
  ],
  guides: [
    ["Vodnik za nakup", "Ledena kad ali mrzla prha — kaj sploh deluje?"],
    ["Cene 2026", "Koliko stane ledena kad? Nakup, poraba, vzdrževanje."],
    ["Protokol", "Kako začeti: 3 minute pri 10 °C, nato navzdol."],
  ],
  pdp: {
    slug: "pro",
    eyebrow: "Priporočamo",
    title: "KAD PRO",
    sub: "Ledena kad z aktivnim hlajenjem do 3 °C, filtracijo in UV-sterilizacijo. Za dom, klub ali studio.",
    price: "2.490 €",
    priceCents: 249000,
    cfg: [
      ["Paket", ["KAD PRO — 2.490 €", "PRO+ s pokrovom in stopnico — 2.790 €"], 0],
      ["Postavitev", ["Zunaj (terasa, vrt)", "Znotraj (kopalnica, garaža)"], 0],
      ["Servis", ["Osnovni", "Letni pregled — 89 €/leto"], 0],
    ],
    freight: [
      ["Dostava — dvočlanska ekipa", "99 €", false],
      ["Postavitev, priklop in umeritev", "vključeno", true],
      ["Odvoz embalaže", "vključeno", true],
    ],
    note: "Cenik logistike: razred two_man · cona SI. Postavitev je del razreda in se ji ni mogoče odpovedati.",
    spec: [
      ["Prostornina", "320 l"],
      ["Hlajenje", "do 3 °C, 800 W"],
      ["Filtracija", "mehanska + UV"],
      ["Priklop", "230 V, navadna vtičnica"],
      ["Glasnost", "45 dB"],
      ["Mere", "180 × 80 × 75 cm"],
      ["Dobavni rok", "14 dni"],
      ["Garancija", "3 leta"],
    ],
    bar: ["KAD PRO", "3 °C · filtracija + UV", "2.490 €", "V košarico"],
  },
  footNote:
    "Specialist za hladno terapijo v Sloveniji. Testna kopel v Ljubljani — pridite na prvo potopitev.",
};
