import type { Page } from "../pages";

/**
 * The comparison page deliberately carries NO price and NO per-model spec
 * table. Prices are provisional and gated (see catalogPricingReady), and a
 * comparison table is the single easiest place to state a number against an
 * identified product — exactly what ZVPot governs. So this page compares the
 * two FAMILIES on the axes a buyer actually chooses between, and sends them to
 * the model pages for figures, which are generated from the transcription.
 */
export const COMPARE: Page = {
  key: "/compare",
  h1: "Primerjava modelov",
  lead:
    "Prva odločitev ni model, ampak vrsta bazena. Masažni bazen je za sedenje in sprostitev, " +
    "swim spa pa za plavanje — razlika je v dolžini, teži in tem, kaj zahtevata od prostora.",
  metaDescription:
    "Primerjava masažnih bazenov in swim spa bazenov: mere, teža, prostor in namen. " +
    "Kateri tip bazena je pravi za vašo teraso ali vrt.",
  blocks: [
    {
      kind: "facts",
      h: "Masažni bazen proti swim spa bazenu",
      rows: [
        ["Dolžina", "Masažni bazen 195–230 cm · swim spa 450–580 cm"],
        ["Namen", "Masažni bazen: sedenje, masaža, sprostitev · Swim spa: plavanje na mestu in sprostitev"],
        ["Prostor", "Masažni bazen gre na teraso · Swim spa praviloma zahteva vrt in pripravljeno podlago"],
        ["Teža", "Masažni bazen prazen okoli 300–410 kg · Swim spa bistveno več, glejte stran modela"],
        ["Dostava", "Oboje z ekipo in opremo za prenos · Pri swim spa je dostop pogosto odločilen"],
      ],
    },
    {
      kind: "prose",
      h: "Kako izbrati velikost",
      p: [
        "Pri masažnih bazenih je odločitev najprej prostorska in šele nato o številu sedežev. " +
          "Najmanjši model se umesti tja, kamor večji ne gre; največji ponudi več prostora za " +
          "iztegnjene noge in več šob. Vse tri mere in specifikacije so na straneh modelov.",
        "Pri swim spa bazenih je merilo dolžina — od nje je odvisen občutek plavanja. Daljša " +
          "školjka pomeni tudi večjo maso, večjo količino vode in več zahtev do podlage.",
      ],
    },
    {
      kind: "prose",
      h: "Česa v tabeli ni",
      p: [
        "Namenoma ne primerjamo modelov po ceni na tej strani. Cena velja za točno določen " +
          "model v točno določeni konfiguraciji in je navedena tam, kjer je tudi vse, kar vanjo " +
          "spada — na strani modela.",
      ],
    },
    {
      kind: "cta",
      h: "Poglejte obe družini",
      p: "Masažni bazeni in swim spa bazeni, vsak s svojimi merami in specifikacijo.",
      label: "V trgovino",
      href: "/trgovina",
    },
  ],
};
