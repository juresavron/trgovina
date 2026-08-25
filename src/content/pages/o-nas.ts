import type { Page } from "../pages";

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
        "Masažni bazen ni paket, ki ga pustiš pred vrati. Prazen tehta med tristo in štiristo " +
          "kilogramov, poln pa več kot dve toni — swim spa bazeni tudi bistveno več. Zato je " +
          "prodaja šele prvi del posla; drugi je, da bazen pride na teraso, se priklopi na " +
          "elektriko in prvi večer dela.",
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
      p: "Šest modelov, vsi s cenami, merami in specifikacijo.",
      label: "V trgovino",
      href: "/trgovina",
    },
  ],
};
