import type { Page } from "../pages";

/**
 * The free site visit — and the page that used to claim a showroom.
 *
 * ⚠️ THERE IS NO SHOWROOM. THERE NEVER WAS. This page carried the headline
 * "Razstavni salon v Ljubljani", the footer of every page carried "Razstavni
 * bazen v Ljubljani — pridite ga pogledat v živo", and two FAQs answered "da,
 * v Ljubljani". None of it was true: the shop has no display floor and no
 * display tub anywhere. A claim that a person can drive somewhere and see the
 * goods is a claim about the nature of the service under UCPD Article 6 as
 * transposed in ZVPot-1 — and, long before the law, it is the promise whose
 * breach a customer discovers by standing in the wrong city.
 *
 * So the page was not softened; the premise was replaced. What the shop
 * genuinely offers, and has promised on every other page since the beginning,
 * is the OPPOSITE errand: we come to the customer, before they buy anything,
 * and check the thing that actually decides the purchase — whether the tub
 * fits, whether the path is wide enough, whether the base holds 2.210 kg.
 * For a 400 kg object that is a better offer than a showroom, and it is real.
 *
 * ⚠️ WHAT THIS PAGE STILL MAY NOT SAY. Nobody has stated that a customer can
 * see a unit anywhere — not at a partner, not at an installation, not on a
 * video call. Every one of those would be an invented promise, and inventing
 * one is exactly how the previous version of this page came to exist. What
 * the site DOES already promise, and what this page therefore offers in place
 * of a viewing, is the colour sample book sent on request (see the swatch
 * note on the product pages) and the full published specification.
 *
 * The figures are the catalogue's own — 195–230 cm of footprint and 82–88 cm
 * of shell height from catalog/pola.ts, 1.500–2.210 kg filled from the same
 * file, 5.750–8.490 kg filled from catalog/swimspa.ts.
 */
export const SHOWROOM: Page = {
  key: "/showroom",
  h1: "Brezplačen ogled lokacije",
  lead:
    "Preden karkoli kupite, pridemo pogledat, kam bi bazen postavili. Ogled je brezplačen " +
    "in vas k ničemur ne zavezuje.",
  metaDescription:
    "Brezplačen ogled lokacije po vsej Sloveniji: preverimo dostop, podlago in električni " +
    "priklop, preden se odločite za model. Brez obveznosti.",
  blocks: [
    {
      kind: "prose",
      h: "Zakaj ogled in ne razstavni salon",
      p: [
        "Razstavnega salona nimamo in vam ga ne bomo obljubljali. Namesto da bi vi vozili k " +
          "bazenu, pridemo mi k vam — in to je pri tem izdelku bolj uporabno, kot se sliši. " +
          "V salonu bi videli, kako je školjka videti. Doma izveste tisto, kar odloča: ali " +
          "bazen sploh pride do mesta postavitve in ali podlaga zdrži, ko je poln.",
        "Napolnjen masažni bazen tehta od 1.500 do 2.210 kilogramov, napolnjen swim spa " +
          "bazen od 5.750 do 8.490 kilogramov, in največji del te teže je voda. Ali to " +
          "prenese vaša terasa, se po telefonu ne da presoditi in v nobenem salonu ne " +
          "izve. Zato je ogled pri vas.",
        "Ogled je brezplačen tudi, če se za nakup na koncu ne odločite. Če se izkaže, da " +
          "model, ki ste ga izbrali, pri vas ni izvedljiv, vam to povemo — to je pogosto " +
          "najkoristnejši izid obiska.",
      ],
    },
    {
      kind: "steps",
      h: "Kako poteka",
      items: [
        [
          "Pokličete ali pišete",
          "Povejte naslov in kateri model vas zanima. Termin uskladimo po telefonu.",
        ],
        [
          "Pridemo na vaš naslov",
          "Izmerimo mesto postavitve in pot do njega, pogledamo podlago in električni priklop. " +
            "Vzame približno pol ure.",
        ],
        [
          "Povemo, kaj smo videli",
          "Kateri modeli so pri vas izvedljivi, kaj bi bilo treba pripraviti in kje so ozka " +
            "grla. Če je treba podlago ali elektriko urediti, povemo, kaj točno.",
        ],
        [
          "Ponudba",
          "Model in konfiguracija, dostava, priklop in zagon — vse v eni številki z DDV. " +
            "Ogled je do tu brezplačen in brez obveznosti.",
        ],
      ],
    },
    {
      kind: "facts",
      h: "Kaj pripravite za ogled",
      rows: [
        [
          "Mesto postavitve",
          "Približna predstava, kam bi bazen postavili. Natančno izmerimo mi — pomembno je " +
            "le, da se pogovarjamo o istem kotu vrta.",
        ],
        [
          "Dostop do dvorišča",
          "Če je pot do hiše zaprta z zapornico, vrati na ključ ali dogovorom s sosedom, to " +
            "povejte vnaprej — tovornjak na dan dostave to ugotovi prepozno.",
        ],
        [
          "Podlaga",
          "Kaj je pod predvidenim mestom: betonska plošča, tlakovci, lesena terasa ali teren. " +
            "Pri leseni terasi je koristno vedeti, kako je zgrajena in na čem stoji.",
        ],
        [
          "Elektrika",
          "Kje je električna omarica. Razdaljo in pot izmerimo na kraju samem.",
        ],
        [
          "Kdo je doma",
          "Dobro je, če je prisoten nekdo, ki odloča o nakupu in pozna hišo — polovica " +
            "vprašanj je o tem, kaj je pod tlakovci in kje teče kabel.",
        ],
      ],
    },
    // Operator-managed slot; falls back to the shop's own photography. See
    // the figure note in content/pages.ts — and the page's own warning above:
    // no caption, because a caption here would be one more promised sight.
    // AFTER the facts table, not before it: two wide blocks back to back
    // read as band-then-table with the prose orphaned around them.
    { kind: "figure", slot: "ogled-lokacije" },
    {
      kind: "qa",
      h: "Pogosta vprašanja",
      items: [
        [
          "Ali lahko bazen kje vidim v živo?",
          "Razstavnega salona nimamo, zato vam bazena pred nakupom ne moremo pokazati v " +
            "živo. Kar lahko: pošljemo vam vzorčnik barv školjke, na strani vsakega modela " +
            "so vse mere, teže in specifikacije, na ogledu pa z merami v roki povemo, kako " +
            "velik bo pri vas videti. Če je za vas ogled v živo pogoj za nakup, vam to " +
            "povemo odkrito, namesto da bi vas vozili naokoli.",
        ],
        [
          "Koliko stane ogled?",
          "Nič, po vsej Sloveniji, tudi če se za nakup ne odločite.",
        ],
        [
          "Kako hitro lahko pridete?",
          "Termin uskladimo po telefonu; odvisen je od naslova in od tega, kdaj ste doma. " +
            "Ko se dogovorimo za dan, se ga držimo.",
        ],
        [
          "Ali me bo na ogledu kdo priganjal k nakupu?",
          "Ne. Na ogledu merimo in odgovarjamo na vprašanja. Ponudbo dobite pisno po njem, " +
            "da jo v miru preberete.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Česa tudi ogled ne pove",
      p: [
        "Ene stvari tudi na vašem naslovu ni mogoče izvedeti: koliko bo bazen porabil " +
          "električne energije. Poraba je odvisna od temperature, ki jo držite, pogostosti " +
          "uporabe, kakovosti pokrova in zunanjih razmer — zato mesečnega zneska ne " +
          "navajamo nikjer na tej strani.",
        "Prav tako na ogledu ne izvedete, kako bo bazen deloval pri polni moči. Črpalka " +
          "pri najvišji stopnji ni tiha; kako glasno je to, si vsak predstavlja drugače. " +
          "Ob predaji vam vse stopnje pokažemo in nastavimo — takrat je bazen vaš in " +
          "poln, kar je edino stanje, v katerem se to res sliši.",
      ],
    },
    // No Naslov row: the seat in Koper is an office, not a place to visit,
    // and printing it here would rebuild the very expectation this page was
    // rewritten to remove.
    { kind: "contact", h: "Dogovor za ogled", omitAddress: true },
    {
      kind: "cta",
      h: "Naročite brezplačen ogled",
      p: "Pokličite ali pišite — povejte naslov in kateri model vas zanima.",
      label: "Kontakt",
      href: "/kontakt",
    },
  ],
};
