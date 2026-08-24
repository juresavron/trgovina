import type { ShopContent } from "./types";

export const foteljContent: ShopContent = {
  nav: ["Fotelji", "Primerjava", "Vodniki", "Dostava in montaža", "Kontakt"],
  artKey: "chair",
  kicker: "Masažni fotelj · Slovenija",
  h1: "Masažni fotelj s 4D tehnologijo.",
  sub: "SL-vodilo od vratu do stegen, 4D-valjčki, ogrevanje in gravitacija nič. Prinesemo ga v dnevno sobo, sestavimo in umerimo po vaši postavi. 1.790 € z DDV.",
  cta: "Izberite svoj fotelj",
  metaDescription:
    "Masažni fotelj s 4D masažo in SL-vodilom. Dostava v prostor, sestavljanje in umeritev po postavi. 1.790 € z DDV, preizkus v salonu v Ljubljani.",
  trust: [
    "Dostava v prostor po vaši izbiri",
    "Preizkus v salonu — Ljubljana",
    "Umeritev po postavi ob dostavi",
    "Do 24 mesečnih obrokov",
  ],
  stats: [
    ["4D", "valjčki z globino"],
    ["135 cm", "SL-vodilo"],
    ["18", "programov masaže"],
    ["230 V", "navadna vtičnica"],
  ],
  products: [
    {
      name: "FOTELJ 4D PRO",
      desc: "4D-masaža s SL-vodilom, ogrevanjem in položajem gravitacije nič.",
      meta: "4D · SL-vodilo · ogrevanje · 1,50 m³",
      price: "1.790 €",
      art: "chair",
      badge: "Najbolje prodajan",
    },
    {
      name: "FOTELJ 3D",
      desc: "3D-masaža z S-vodilom — vstopni model z istim šasijskim ogrodjem.",
      meta: "3D · S-vodilo · 230 V",
      price: "1.290 €",
      art: "chair",
    },
    {
      util: true,
      h: "Preizkusite ga v salonu",
      p: "Petnajst minut v fotelju pove več kot sto opisov. Brez najave.",
      cta: "Kje nas najdete →",
    },
  ],
  moat: {
    h2: "V dnevno sobo, sestavljen in umerjen.",
    steps: [
      ["Naročilo in klic", "Preverimo širino vrat, stopnišče in prostor."],
      ["Dvočlanska ekipa", "Fotelj prinesemo v prostor po vaši izbiri."],
      ["Sestavljanje", "Nasloni in stranice se sestavijo v pol ure."],
      ["Umeritev po postavi", "Višina, ramena, dolžina nog — umerimo za vsakega uporabnika."],
      ["Odvoz embalaže", "Karton in folijo odpeljemo s seboj."],
    ],
    claim: ["Fotelj tehta devetdeset kilogramov. ", "Vaš hrbet ga ne bo nosil — naš bo."],
  },
  reviews: [
    {
      q: "Umeritev ob dostavi je bila vredna več kot fotelj sam — nastavili so ga po moji višini in ženini posebej.",
      who: "Tomaž H., Novo mesto",
      model: "FOTELJ 4D PRO",
    },
    {
      q: "Prinesli so ga v tretje nadstropje brez dvigala in brez pripomb. Embalaže nisem niti videla.",
      who: "Alenka S., Ljubljana",
      model: "FOTELJ 4D PRO",
    },
  ],
  guides: [
    ["Vodnik za nakup", "Masažni fotelj: 2D, 3D ali 4D — razlika, ki jo čutite"],
    ["Cene 2026", "Koliko stane masažni fotelj? Realne številke."],
    ["Tehnika", "SL ali S vodilo — zakaj je oblika vodila pomembna?"],
  ],
  pdp: {
    slug: "4d-pro",
    eyebrow: "Najbolje prodajan",
    title: "FOTELJ 4D PRO",
    sub: "4D-masažni fotelj s SL-vodilom: valjčki sledijo krivulji hrbtenice od vratu do stegen, z ogrevanjem in 18 programi.",
    price: "1.790 €",
    priceCents: 179000,
    cfg: [
      ["Model", ["3D — 1.290 €", "4D PRO — 1.790 €"], 1],
      ["Obloga", ["Tehnično usnje, grafit", "Tehnično usnje, bež"], 0],
      ["Dostava", ["Do vrat", "V prostor + umeritev — 79 €"], 1],
    ],
    freight: [
      ["Dostava — dvočlanska ekipa, v prostor", "79 €", false],
      ["Sestavljanje in umeritev po postavi", "vključeno", true],
      ["Odvoz embalaže", "vključeno", true],
    ],
    note: "Cenik logistike: razred two_man · cona SI. Pred dostavo preverimo širino vrat in stopnišča.",
    spec: [
      ["Masaža", "4D, 18 programov"],
      ["Vodilo", "SL, 135 cm"],
      ["Ogrevanje", "ledveno, 3 stopnje"],
      ["Priklop", "230 V"],
      ["Nosilnost", "do 150 kg"],
      ["Mere", "165 × 80 × 120 cm"],
      ["Dobavni rok", "7 dni"],
      ["Garancija", "3 leta"],
    ],
    bar: ["FOTELJ 4D PRO", "grafit · v prostor + umeritev", "1.869 €", "V košarico"],
  },
  footNote:
    "Specialist za masažne fotelje v Sloveniji. Salon v Ljubljani — pridite na petnajst minut zase.",
};
