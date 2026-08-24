import type { ShopContent } from "./types";

export const biljardContent: ShopContent = {
  nav: ["Mize", "Primerjava", "Vodniki", "Dostava in montaža", "Kontakt"],
  artKey: "billiard",
  kicker: "Biljardna miza · Slovenija",
  h1: "Biljardna miza s škriljasto ploščo.",
  sub: "Tridelna škriljasta plošča, turnirsko sukno in monter, ki jo izravna na desetinko milimetra. Postavitev je vključena — brez nje miza ni miza. Od 2.290 € z DDV.",
  cta: "Izberite svojo mizo",
  metaDescription:
    "Biljardna miza s škriljasto ploščo, z dostavo, montažo in izravnavo po vsej Sloveniji. Turnirsko sukno, od 2.290 € z DDV.",
  trust: [
    "Montaža in izravnava vključena",
    "Tridelna škriljasta plošča",
    "Lasten monter, ne zunanji izvajalec",
    "Do 36 mesečnih obrokov",
  ],
  stats: [
    ["3-delna", "škriljasta plošča"],
    ["19 mm", "debelina škrilja"],
    ["0,1 mm", "toleranca izravnave"],
    ["5 let", "garancije na okvir"],
  ],
  products: [
    {
      name: "MIZA 7FT",
      desc: "Za dnevne sobe in manjše prostore. Ista plošča in sukno kot večja.",
      meta: "213 × 122 cm · 3-delni škrilj · igralna soba 5,5 × 4,3 m",
      price: "2.290 €",
      art: "billiard",
    },
    {
      name: "MIZA 8FT",
      desc: "Standard za klube in igralnice. Turnirske mere, turnirsko sukno.",
      meta: "244 × 137 cm · 3-delni škrilj · igralna soba 5,8 × 4,5 m",
      price: "2.890 €",
      art: "billiard",
      badge: "Najbolje prodajana",
    },
    {
      util: true,
      h: "Koliko prostora potrebujete?",
      p: "Miza potrebuje dolžino palice na vsaki strani. Izmerimo z vami po telefonu.",
      cta: "Preverite prostor →",
    },
  ],
  moat: {
    h2: "Mizo dostavi in sestavi isti monter.",
    steps: [
      ["Naročilo in izmera", "Po telefonu preverimo prostor, dostop in podlago."],
      ["Dostava po delih", "Okvir in tri plošče škrilja pridejo ločeno — drugače ne gre skozi vrata."],
      ["Sestavljanje", "Okvir postavimo, plošče spojimo in zabrusimo stike."],
      ["Izravnava", "Z libelo izravnamo na desetinko milimetra. To je cela razlika."],
      ["Sukno in predaja", "Sukno napnemo, žepe montiramo, embalažo odpeljemo."],
    ],
    claim: ["Mizo zna pripeljati vsak. ", "Izravna jo lahko le monter."],
  },
  reviews: [
    {
      q: "Prejšnjo mizo mi je postavil prevoznik in krogle so vlekle v levo. Ta stoji, kot mora — razlika je očitna že po prvem udarcu.",
      who: "Damjan R., Celje",
      model: "MIZA 8FT",
    },
    {
      q: "Tri plošče škrilja so prinesli v klet po zunanjih stopnicah. Sestavljanje in izravnava sta trajala dobre tri ure.",
      who: "Klub Zvezda, Maribor",
      model: "MIZA 8FT",
    },
  ],
  guides: [
    ["Vodnik za nakup", "7ft ali 8ft — koliko prostora res potrebujete?"],
    ["Cene 2026", "Koliko stane biljardna miza? Nakup, montaža, sukno."],
    ["Tehnika", "Zakaj škriljasta plošča in ne MDF?"],
  ],
  pdp: {
    slug: "8ft",
    eyebrow: "Najbolje prodajana",
    title: "MIZA 8FT",
    sub: "Biljardna miza s tridelno škriljasto ploščo 19 mm, turnirskim suknom in izravnavo na desetinko milimetra.",
    price: "2.890 €",
    priceCents: 289000,
    cfg: [
      ["Velikost", ["7ft — 2.290 €", "8ft — 2.890 €"], 1],
      ["Sukno", ["Turnirsko zeleno", "Turnirsko modro", "Turnirsko sivo"], 0],
      ["Oprema", ["Osnovni komplet", "Klubski komplet (+240 €)"], 0],
    ],
    freight: [
      ["Dostava — dvočlanska ekipa, po delih", "199 €", false],
      ["Sestavljanje, izravnava in napenjanje sukna", "vključeno", true],
      ["Odvoz embalaže", "vključeno", true],
    ],
    note: "Cenik logistike: razred white_glove · cona SI. Montaža je del razreda in se ji ni mogoče odpovedati — neizravnana miza ni igralna.",
    spec: [
      ["Igralna površina", "244 × 137 cm"],
      ["Plošča", "škrilj, 3-delna, 19 mm"],
      ["Toleranca izravnave", "0,1 mm"],
      ["Sukno", "turnirsko, 21 oz"],
      ["Okvir", "masiven les"],
      ["Teža", "približno 350 kg"],
      ["Dobavni rok", "28 dni"],
      ["Garancija", "5 let na okvir"],
    ],
    bar: ["MIZA 8FT", "zeleno sukno · montaža vključena", "3.089 €", "V košarico"],
  },
  footNote:
    "Specialist za biljardne mize v Sloveniji. Razstavna miza v Ljubljani — pridite odigrat partijo.",
};
