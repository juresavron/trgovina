import type { ShopContent } from "./types";

export const savnaContent: ShopContent = {
  nav: ["Savne", "Primerjava", "Vodniki", "Dostava in montaža", "Kontakt"],
  artKey: "saunaCabin",
  kicker: "Infrardeča savna · Slovenija",
  h1: "Infrardeča savna za vaš dom.",
  sub: "Karbonski grelniki, hemlock les in poraba, manjša od likalnika. Dvočlanska ekipa jo prinese, sestavi in preizkusi — prvo savnanje še isti večer. Od 1.490 € z DDV.",
  cta: "Izberite svojo savno",
  metaDescription:
    "Infrardeča savna z dostavo in montažo po vsej Sloveniji. Karbonski grelniki, priklop v navadno vtičnico, od 1.490 € z DDV. Razstavni salon v Ljubljani.",
  trust: [
    "Dostava in montaža po vsej Sloveniji",
    "Priklop v navadno vtičnico, 230 V",
    "Razstavni salon — Ljubljana",
    "Do 24 mesečnih obrokov",
  ],
  stats: [
    ["30 min", "sestavljanje panelov"],
    ["230 V", "navadna vtičnica"],
    ["≈ 0,25 €", "strošek ene seje"],
    ["3 leta", "garancije"],
  ],
  products: [
    {
      name: "SAVNA DUO",
      desc: "Infrardeča savna za 2 osebi. V kopalnico, spalnico ali klet — brez posegov.",
      meta: "2 osebi · 1750 W · 230 V · 1,45 m³",
      price: "1.490 €",
      art: "saunaCabin",
    },
    {
      name: "SAVNA QUATTRO",
      desc: "Infrardeča savna za 4 osebe. Družinska seja brez čakanja na vrsto.",
      meta: "4 osebe · 2400 W · 230 V · 2,20 m³",
      price: "1.990 €",
      art: "saunaCabin",
      badge: "Najbolje prodajana",
    },
    {
      util: true,
      h: "DUO ali QUATTRO?",
      p: "Primerjava mer, moči in porabe — ena stran, vsi podatki.",
      cta: "Odprite primerjavo →",
    },
  ],
  moat: {
    h2: "Od naročila do prvega savnanja — brez vašega znoja.",
    steps: [
      ["Naročilo danes", "Potrditev naročila in termin klica v 24 urah."],
      ["Osebni klic", "Preverimo prostor, vrata in vtičnico ter se dogovorimo za termin."],
      ["Dvočlanska ekipa", "Savno prinesemo v prostor po vaši izbiri — ne na pločnik."],
      ["Montaža in preizkus", "Paneli se sestavijo v uri; grelnike preizkusimo pred odhodom."],
      ["Prvi večer v savni", "Embalažo odpeljemo s seboj. Vi samo prižgete."],
    ],
    claim: ["To je naša lastna logistika, ne zunanji izvajalec. ", "Zato si jo upamo obljubiti."],
  },
  reviews: [
    {
      q: "Postavljena v nedeljo dopoldne, zvečer sva se že savnala. Ekipa je odnesla vso embalažo — stanovanje je ostalo čisto.",
      who: "Marjan K., Kranj",
      model: "SAVNA QUATTRO",
    },
    {
      q: "Najbolj me je presenetila poraba: po mesecu vsakodnevne uporabe na položnici ni bilo šoka.",
      who: "Petra Z., Celje",
      model: "SAVNA DUO",
    },
  ],
  guides: [
    ["Vodnik za nakup", "Infrardeča ali finska savna — katera je za vas?"],
    ["Cene 2026", "Koliko stane infrardeča savna? Realne številke, z montažo."],
    ["Poraba", "Koliko elektrike res porabi infrardeča savna?"],
  ],
  pdp: {
    slug: "quattro",
    eyebrow: "Najbolje prodajana",
    title: "SAVNA QUATTRO",
    sub: "Infrardeča savna za 4 osebe: karbonski grelniki po celotni višini, hemlock les, kromoterapija in Bluetooth.",
    price: "1.990 €",
    priceCents: 199000,
    cfg: [
      ["Velikost", ["Za 2 osebi — 1.490 €", "Za 4 osebe — 1.990 €"], 1],
      ["Montaža", ["Sestavim sam (navodila + video)", "Ekipa sestavi — 99 €"], 1],
      ["Dodatno", ["Brez", "Aromaterapija — 49 €"], 0],
    ],
    freight: [
      ["Dostava — dvočlanska ekipa, v prostor po izbiri", "99 €", false],
      ["Montaža in preizkus (~1 h)", "99 €", false],
      ["Odvoz embalaže", "vključeno", true],
    ],
    note: "Cenik logistike: razred pallet_xl · cona SI. Ekipa pokliče uro pred prihodom.",
    spec: [
      ["Zunanje mere", "150 × 150 × 190 cm"],
      ["Grelniki", "karbonski, 2400 W"],
      ["Priklop", "230 V, navadna vtičnica"],
      ["Segrevanje", "10–15 min"],
      ["Poraba na sejo", "≈ 1,2 kWh"],
      ["Les", "hemlock"],
      ["Dobavni rok", "14 dni"],
      ["Garancija", "3 leta"],
    ],
    bar: ["SAVNA QUATTRO", "4 osebe · montaža z ekipo", "2.188 €", "V košarico"],
  },
  footNote:
    "Specialist za infrardeče savne v Sloveniji. Razstavni salon v Ljubljani — pridite in preizkusite.",
};
