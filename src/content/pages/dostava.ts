import type { Page } from "../pages";

/**
 * The delivery page restates the five steps of content.moat.steps in full.
 * The home page shows them as five short lines; here each one gets the
 * paragraph a person planning a delivery day actually needs. Nothing is
 * promised here that the storefront does not already promise — no price, no
 * fixed lead time, because neither is stated anywhere else on the site.
 *
 * THE MASSES ARE THE SUPPLIER'S, not a round number that sounded right. The
 * three offered hot tubs are 300/370/410 kg dry and 1.500/1.870/2.210 kg
 * filled (catalog/pola.ts); the three offered swim spas are 1.050/1.260/1.430
 * kg dry and 5.750/7.360/8.490 kg filled (catalog/swimspa.ts). This page is
 * where a customer decides whether their terrace can take it, so the range is
 * printed rather than the flagship's single figure.
 */
export const DELIVERY: Page = {
  key: "/delivery",
  h1: "Dostava in montaža",
  lead:
    "Bazen pripeljemo, prenesemo na mesto, priklopimo in zaženemo. " +
    "Vaša naloga je pripraviti podlago in električni priklop; pri obojem svetujemo vnaprej.",
  // The five steps are the page's content, not its description: this named
  // all five and ran to 176 characters, which is cut off mid-list in the
  // result. Naming the promise and two of the steps fits and reads better.
  metaDescription:
    "Dostava in montaža masažnega bazena po vsej Sloveniji: brezplačen ogled lokacije, " +
    "prenos na teraso, priklop in zagon ter predaja z navodili.",
  blocks: [
    {
      kind: "steps",
      h: "Pet korakov",
      items: [
        [
          "Ogled lokacije",
          // "Zanimajo", not "Zanima": four coordinated subjects, one of them plural.
          "Pridemo pogledat, kam bo bazen postavljen. Zanimajo nas širina prehodov, ovire na poti, " +
            "nosilnost podlage in razdalja do električne omarice. Ogled je brezplačen in je " +
            "razlog, da se dostave ne ponesrečijo.",
        ],
        [
          "Priprava priklopa",
          "Dobite pisna navodila za svojega električarja: presek vodnika, odklopnik in " +
            "zaščitno stikalo za konkreten model. Če električarja nimate, izvedbo prevzame " +
            "naš partner.",
        ],
        [
          "Dostava na teraso",
          "Pride ekipa z opremo za prenos. Bazen gre lahko tudi čez ograjo ali po stopnicah, " +
            "če drugače ne gre. Kako natanko, se dogovorimo že ob ogledu.",
        ],
        [
          "Priklop in zagon",
          "Bazen napolnimo, zaženemo filtracijo in ogrevanje ter umerimo šobe. Preden odidemo, " +
            "voda kroži in se greje.",
        ],
        [
          "Predaja",
          "Pokažemo, kako se vzdržuje: preverjanje vode, čiščenje filtra in doziranje. " +
            "Približno deset minut na teden.",
        ],
      ],
    },
    // Operator-managed slot — see the figure note in content/pages.ts.
    { kind: "figure", slot: "dostava" },
    {
      kind: "prose",
      h: "Kaj pripravite vi",
      p: [
        "Podlago, ki nosi težo napolnjenega bazena in ljudi v njem. Masažni bazen prazen tehta " +
          "od 300 do 410 kilogramov, napolnjen od 1.500 do 2.210 kilogramov; napolnjen swim " +
          "spa bazen od 5.750 do 8.490 kilogramov. Betonska plošča, tlakovci na pripravljenem " +
          "nasutju ali ustrezno dimenzionirana terasa so v redu; kaj od tega velja za vašo " +
          "lokacijo, povemo ob ogledu.",
        "Električni priklop po navodilih, ki jih dobite v drugem koraku, in dostop do vode za " +
          "prvo polnjenje. Priprava podlage in elektroinštalacija sta na vaši strani; " +
            "kaj točno je treba pripraviti, povemo po ogledu.",
      ],
    },
    {
      kind: "qa",
      h: "Pogosta vprašanja o dostavi",
      items: [
        [
          "Kam vse dostavljate?",
          "Po vsej Sloveniji.",
        ],
        // ⚠️ THE PAGE NAMED AFTER DELIVERY NEVER SAID DELIVERY IS CHARGED.
        // Every other surface does — pogoji.ts ("se obračuna po ponudbi"),
        // faq.ts, vodniki.ts and the freight row on all six product pages —
        // and this page's lead promises the whole chain ("pripeljemo,
        // prenesemo na mesto, priklopimo in zaženemo") without once using the
        // word cost. A buyer arriving here from a search for delivery, which
        // is what this page is for, left believing it was included.
        [
          "Koliko stane dostava?",
          "Dostavo obračunamo po ponudbi, ker je odvisna od naslova, dostopa in modela. " +
            "Znesek dobite v pisni ponudbi, preden karkoli potrdite. Ogled lokacije, zagon " +
            "in predaja so vključeni v ceno bazena.",
        ],
        [
          "Kaj pa, če do terase ni poti za voziček?",
          "Zato pridemo na ogled. Ekipa ima opremo za prenos čez ograje in po stopnicah; kadar " +
            "tudi to ne zadošča, se vnaprej dogovorimo za dvig z avtodvigalom. To se ugotovi " +
            "ob ogledu, ne na dan dostave.",
        ],
        [
          "Ali moram biti ob dostavi doma?",
          "Da. Ob predaji pokažemo vzdrževanje in skupaj preverimo, da vse dela.",
        ],
        [
          "Koliko časa traja postavitev?",
          "Sam prenos in priklop običajno nekaj ur. Voda se nato ogreva do prve kopeli, " +
            "koliko časa, je odvisno od modela in temperature vode ob polnjenju.",
        ],
      ],
    },
    {
      kind: "cta",
      h: "Dogovorimo se za ogled",
      p: "Brezplačen in nezavezujoč. Po njem veste, kateri model je izvedljiv in kaj je treba pripraviti.",
      label: "Pokličite nas",
      href: "/kontakt",
    },
  ],
};
