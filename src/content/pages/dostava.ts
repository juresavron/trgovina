import type { Page } from "../pages";

/**
 * The delivery page restates the five steps of content.moat.steps in full.
 * The home page shows them as five short lines; here each one gets the
 * paragraph a person planning a delivery day actually needs. Nothing is
 * promised here that the storefront does not already promise — no price, no
 * fixed lead time, because neither is stated anywhere else on the site.
 */
export const DELIVERY: Page = {
  key: "/delivery",
  h1: "Dostava in montaža",
  lead:
    "Bazen pripeljemo, prenesemo na mesto, priklopimo in zaženemo. " +
    "Vaša naloga je pripraviti podlago in električni priklop — pri obojem svetujemo vnaprej.",
  metaDescription:
    "Dostava in montaža masažnega bazena po vsej Sloveniji: ogled lokacije, priprava priklopa, " +
    "prenos na teraso, zagon filtracije in ogrevanja ter predaja z navodili za vzdrževanje.",
  blocks: [
    {
      kind: "steps",
      h: "Pet korakov",
      items: [
        [
          "Ogled lokacije",
          "Pridemo pogledat, kam bo bazen postavljen. Zanima nas širina prehodov, ovire na poti, " +
            "nosilnost podlage in razdalja do električne omarice. Ogled je brezplačen in je " +
            "razlog, da se dostave ne ponesrečijo.",
        ],
        [
          "Priprava priklopa",
          "Dobite pisna navodila za svojega elektrikarja — presek vodnika, odklopnik in zaščitno " +
            "stikalo za konkreten model. Če elektrikarja nimate, izvedbo prevzame naš partner.",
        ],
        [
          "Dostava na teraso",
          "Pride ekipa z opremo za prenos. Bazen zna iti tudi čez ograjo ali po stopnicah, " +
            "če drugače ne gre — kako natanko, se dogovorimo že ob ogledu.",
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
    {
      kind: "prose",
      h: "Kaj pripravite vi",
      p: [
        "Podlago, ki nosi težo polnega bazena. Masažni bazen prazen tehta okoli štiristo " +
          "kilogramov, poln z ljudmi pa preko dveh ton; swim spa bazeni so bistveno težji. " +
          "Betonska plošča, tlakovci na pripravljenem nasutju ali ustrezno dimenzionirana terasa " +
          "so v redu — kaj od tega velja za vašo lokacijo, povemo ob ogledu.",
        "Električni priklop po navodilih, ki jih dobite v drugem koraku, in dostop do vode za " +
          "prvo polnjenje. Nič drugega.",
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
        [
          "Kaj pa, če do terase ni poti za voziček?",
          "Zato pridemo na ogled. Ekipa ima opremo za prenos čez ograje in po stopnicah; kadar " +
            "tudi to ne zadošča, se dogovorimo za dvigalo. To se ugotovi ob ogledu, ne na dan dostave.",
        ],
        [
          "Ali morava biti doma?",
          "Da. Ob predaji pokažemo vzdrževanje in skupaj preverimo, da vse dela.",
        ],
        [
          "Koliko časa traja postavitev?",
          "Sam prenos in priklop običajno nekaj ur. Voda se nato ogreva do prve kopeli — " +
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
