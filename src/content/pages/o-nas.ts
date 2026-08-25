import type { Page } from "../pages";

/**
 * Who the shop is. Two claims here are checkable and were checked against the
 * transcription rather than written from memory:
 *
 *   - the masses. OFFERED_MODELS in catalog/pola.ts state 300/370/410 kg dry
 *     and 1.500/1.870/2.210 kg filled, so the range is 300–410 and 1.500–2.210
 *     — NOT "over two tonnes", which is true of the 230 alone. Only one of the
 *     three offered hot tubs passes two tonnes and a page may not promote that
 *     one model's figure to the family.
 *   - the count. Three hot tubs and three swim spas, from OFFERED_MODELS and
 *     OFFERED_SWIMSPAS. If either array changes, this paragraph changes.
 */
export const ABOUT: Page = {
  key: "/about",
  h1: "O nas",
  lead:
    "Prodajamo in postavljamo masažne bazene in swim spa bazene po vsej Sloveniji. " +
    "Ne pošiljamo jih s špediterjem na dvorišče — pripeljemo jih, priklopimo in zaženemo.",
  metaDescription:
    "Specialist za masažne bazene in swim spa bazene v Sloveniji. Ogled lokacije, dostava, " +
    "priklop in zagon z lastno ekipo, servis in rezervni deli.",
  blocks: [
    {
      kind: "prose",
      h: "Kaj delamo",
      p: [
        "Masažni bazen ni paket, ki bi ga dostavljalec pustil pred vrati. Prazen tehta od 300 " +
          "do 410 kilogramov, napolnjen od 1.500 do 2.210 kilogramov; swim spa bazeni so še " +
          "precej težji. Zato je prodaja šele prvi del posla; drugi je, da bazen pride na " +
          "teraso, se priklopi na elektriko in prvi večer dela.",
        "Ponudbo smo namenoma zožili. Trije masažni bazeni od 195 do 230 cm in trije swim spa " +
          "bazeni od 450 do 580 cm — modeli, ki jih imamo v rokah, za katere imamo fotografije, " +
          "rezervne dele in servisno zgodovino. Katalog s petdesetimi modeli, od katerih polovice " +
          "prodajalec ni nikoli videl, ni izbira, ampak izgovor.",
      ],
    },
    {
      kind: "prose",
      h: "Kako delamo",
      p: [
        "Pred vsako dostavo pride nekdo od nas na lokacijo. Pogleda dostop, podlago in električni " +
          "priklop ter pove, kaj je treba pripraviti. Ta obisk je razlog, da se dostave ne " +
          "ponesrečijo — težave s prehodom, nosilnostjo terase ali premajhnim odklopnikom se " +
          "vedno pokažejo prej, kot pride tovornjak.",
        "Po zagonu vas naučimo vzdrževanja. Traja približno deset minut na teden in to je vse, " +
          "kar bazen zahteva od vas.",
      ],
    },
    { kind: "imprint" },
    { kind: "contact", h: "Kje nas dobite" },
    {
      kind: "cta",
      h: "Poglejte ponudbo",
      p: "Trije masažni bazeni in trije swim spa bazeni — mere, specifikacije in cene.",
      label: "V trgovino",
      href: "/trgovina",
    },
  ],
};
