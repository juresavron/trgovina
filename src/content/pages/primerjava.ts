import type { Page } from "../pages";

/**
 * The comparison page deliberately carries NO price and NO per-model spec
 * table. Prices are provisional and gated (see catalogPricingReady), and a
 * comparison table is the single easiest place to state a number against an
 * identified product — exactly what ZVPot governs. So this page compares the
 * two FAMILIES on the axes a buyer actually chooses between, and sends them to
 * the model pages for figures, which are generated from the transcription.
 *
 * WHAT IT DOES CARRY IS MASS, because that is the axis the two families really
 * differ on and the one a terrace is engineered against: 300–410 kg dry and
 * 1.500–2.210 kg filled for the three offered hot tubs, 1.050–1.430 kg dry and
 * 5.750–8.490 kg filled for the three offered swim spas. All six figures are
 * the supplier's own; none is interpolated. (Three swim spas in the price list
 * state no mass at all — none of those three is offered, so this table has no
 * gap to fill and no reason to invent one.)
 *
 * AND IT DOES NOT SELL THE FAMILY ON A COUNTER-CURRENT JET. The SWIM 450's
 * sheet lists none, so "plavanje na mestu" is a per-model property here, not a
 * family promise — swimSpaFamilyHasSwimJets() returns false and this page has
 * to agree with it.
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
    // The same six axes and the same figures the facts rows carried — only
    // the SHAPE changed: label | masažni | swim spa, so the eye runs down a
    // family's own column instead of re-parsing each row for the middot that
    // separated the two.
    {
      kind: "compare",
      h: "Masažni bazen proti swim spa bazenu",
      cols: ["Masažni bazen", "Swim spa"],
      rows: [
        ["Mere školjke", "195–230 cm, v kvadrat", "450–580 cm, v dolžino"],
        ["Namen", "Sedenje, masaža, sprostitev", "Daljša školjka za plavanje in sprostitev"],
        ["Prostor", "Gre na teraso", "Praviloma vrt in betonska plošča"],
        ["Teža prazen", "300–410 kg", "1.050–1.430 kg"],
        ["Teža napolnjen", "1.500–2.210 kg", "5.750–8.490 kg"],
        ["Dostava", "Z ekipo in opremo za prenos", "Enako — in dostop je pogosto odločilen"],
      ],
    },
    {
      kind: "prose",
      h: "Kako izbrati velikost",
      p: [
        "Pri masažnih bazenih je odločitev najprej prostorska in šele nato o številu sedežev. " +
          "Najmanjši model se umesti tja, kamor večji ne gre; največji ponudi več prostora za " +
          "iztegnjene noge in več šob. Večja školjka pa ne pomeni več ljudi: BAZEN 210 sprejme " +
          "šest oseb z enim ležalnikom, BAZEN 230 pet oseb z dvema. Mere in specifikacije vseh " +
          "treh modelov so na njihovih straneh.",
        "Pri swim spa bazenih je merilo dolžina — od nje je odvisen občutek plavanja. Daljša " +
          "školjka pomeni tudi večjo maso, večjo količino vode in več zahtev do podlage.",
        "Protitočne šobe, ki ustvarijo tok za plavanje na mestu, niso enake pri vseh treh " +
          "modelih — koliko jih ima posamezen model, piše v njegovi specifikaciji. Preverite " +
          "jo, preden se odločite za plavanje na mestu.",
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
    // The six models by name, because this page withholds prices ON PURPOSE
    // (see the block above — a price belongs beside its configuration) and
    // then pointed a reader who had just compared models at a hub where they
    // would have to find their model again. The comparison's natural next
    // step is THE model's page, and a crawler reads the same six links as
    // this page passing its comparison intent to the pages that convert it.
    {
      kind: "links",
      h: "Strani modelov",
      // [label, href] — THE ORDER THE RENDERER READS. These shipped once as
      // [href, label]: every link showed the raw URL as its text and
      // navigated to "/BAZEN%20195". The proofread caught it; the structure
      // test below the fragment sweep now pins the direction.
      items: [
        ["BAZEN 195", "/bazen/mali-195"],
        ["BAZEN 210", "/bazen/srednji-210"],
        ["BAZEN 230", "/bazen/veliki-230"],
        ["SWIM 450", "/bazen/swim-450"],
        ["SWIM 580 HIDRO", "/bazen/swim-580-hidro"],
        ["SWIM 580 MAXI", "/bazen/swim-580-maxi"],
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
