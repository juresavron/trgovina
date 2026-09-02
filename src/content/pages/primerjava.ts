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
 *
 * THE WATER FIGURES ARE DERIVED, NOT NEW DATA: filledKg − dryKg, per offered
 * model, which is the mass of the water and therefore its volume in litres to
 * within the density of warm water. Hot tubs 1.200/1.500/1.800 kg, swim spas
 * 4.700/6.100/7.060 kg. Nothing is rounded up and nothing is interpolated —
 * both halves of every subtraction are the supplier's own figures, already
 * printed in the table above as dry and filled mass.
 *
 * ⚠️ AND STILL NO CONSUMPTION FIGURE. Water volume is why a swim spa costs
 * more to hold at temperature, and saying so is safe; saying HOW MUCH more is
 * not, because it depends on the temperature held, the frequency of use, the
 * cover and the weather. /ogled-lokacije says the same thing in the same
 * words, and this page may not quietly become the one place a monthly number
 * appears.
 *
 * SHELL HEIGHT is the last axis added, from mm[2]: 820/880/880 mm across the
 * three hot tubs and 1.400/1.400/1.350 mm across the three swim spas. It is
 * the difference between a tub you sit in and one you stand in, and it is the
 * figure a raised terrace has to be planned around.
 */
export const COMPARE: Page = {
  key: "/compare",
  // ⚠️ THE H1 CARRIES THE QUALIFIER TOO NOW, and the note below explains only
  // half of why it did not. It is right that a reader who has arrived already
  // knows what shop they are in — and an h1 is not written only for them. It
  // is the strongest on-page signal after the title, and a strict scan of
  // this page's rendered content headings found the product named in 0 of
  // them. The three guide pages already do it the other way (their h1 IS the
  // query), so the content layer was inconsistent with itself.
  h1: "Masažni bazen ali swim spa: primerjava modelov",
  seoTitle: "Swim spa ali masažni bazen?",
  lead:
    "Prva odločitev ni model, ampak vrsta bazena. Masažni bazen je za sedenje in sprostitev, " +
    "swim spa pa za plavanje. Razlikujeta se v dolžini, teži in v tem, kaj zahtevata od prostora.",
  metaDescription:
    "Primerjava masažnih bazenov in swim spa bazenov: mere, teža, prostor in namen. " +
    "Kateri tip bazena je pravi za vašo teraso ali vrt.",
  blocks: [
    // ⚠️ THE NAMING QUESTION, ANSWERED BEFORE THE COMPARISON. This page is
    // where a searcher lands on "kateri bazen" queries, and a good share of
    // them arrive having typed jacuzzi or whirlpool: those words appeared
    // nowhere on the site until the FAQ's first question, and one page
    // answering a disambiguation query is thin coverage of it.
    //
    // Same rule as there: it describes what people MEAN by the words, and
    // claims nothing about a trademark the shop does not stock. The full
    // answer stays on /pogosta-vprasanja rather than being copied here.
    {
      kind: "prose",
      p: [
        "Najprej o besedah, ker jih je za isto stvar več. Jacuzzi (džakuzi) je ime " +
          "proizvajalca, ki se je prijelo za vso kategorijo, whirlpool opisuje vrtinčenje " +
          "vode, sliši se tudi vroča kad — vse to je pri nas masažni bazen. Swim spa je " +
          "nekaj drugega: daljša školjka, v kateri se plava na mestu proti toku.",
      ],
    },
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
        ["Višina školjke", "82–88 cm", "135–140 cm"],
        ["Teža prazen", "300–410 kg", "1.050–1.430 kg"],
        ["Teža napolnjen", "1.500–2.210 kg", "5.750–8.490 kg"],
        ["Dostava", "Z ekipo in opremo za prenos", "Enako, in dostop je pogosto odločilen"],
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
        "Pri swim spa bazenih je merilo dolžina, od katere je odvisen občutek plavanja. Daljša " +
          "školjka pomeni tudi večjo maso, večjo količino vode in več zahtev do podlage.",
        // ⚠️ "NISO ENAKE" AND "KOLIKO JIH IMA" BOTH PRESUPPOSE SOME. SWIM 450
        // has none — this page says so plainly fifty lines further down — so
        // the reader who stops here is told the models differ in a count that
        // one of them does not have. Say it once, in both places it is said.
        "Protitočnih šob, ki ustvarijo tok za plavanje na mestu, nimajo vsi trije modeli: " +
          "modela 580 imata po tri, za SWIM 450 pa jih dobaviteljev list ne navaja. " +
          "Preverite specifikacijo modela, preden se odločite za plavanje na mestu.",
      ],
    },
    {
      kind: "prose",
      h: "Koliko vode boste greli",
      p: [
        "Razlika med prazno in napolnjeno težo je voda, in prav ta številka loči družini bolj " +
          "kot dolžina školjke. Masažni bazen drži od 1.200 do 1.800 litrov, swim spa pa od " +
          "4.700 do 7.060, približno štirikrat toliko. Vsaka od teh štirih številk je " +
          "razlika med podatkoma iz tabele zgoraj.",
        "Posledica je preprosta in velja ne glede na tarifo: več vode se dlje greje in dražje " +
          "drži na temperaturi. Koliko dražje, vam ne bomo napisali: poraba je odvisna od " +
          "temperature, ki jo držite, pogostosti uporabe, kakovosti pokrova in vremena, zato " +
          "mesečnega zneska ne navajamo nikjer na tej strani. Kdor swim spa izbira zaradi " +
          "plavanja, naj to vseeno upošteva kot stalen in ne kot enkraten strošek.",
        "Ista številka odloča tudi pri menjavi vode in pri prvem polnjenju: 7.000 litrov je " +
          "drugačen opravek kot 1.500 in traja dlje, kot večina pričakuje.",
      ],
    },
    {
      kind: "prose",
      h: "Globina in vstop",
      p: [
        "Masažni bazen je visok 82 do 88 centimetrov, tako da se vanj stopi in sede. Swim spa je " +
          "visok 135 do 140, kar je globina, v kateri odrasel človek stoji in plava. Razlika " +
          "približno pol metra se na papirju bere kot podrobnost, na dvorišču pa določi, kako " +
          "se v bazen sploh pride.",
        "Če bazen stoji na terasi in ni vgreznjen, je rob toliko višji od tal. Stopnica je " +
          "med opcijami na strani vsakega modela; ali jo pri vas potrebujete, je eno od " +
          "vprašanj, na katera odgovorimo na ogledu, ker je odvisno od višine podlage.",
      ],
    },
    {
      kind: "qa",
      h: "Kar nas pri tej odločitvi največkrat vprašajo",
      items: [
        [
          "Ali gre swim spa na teraso?",
          "Praviloma ne. Školjka je dolga 4,5 do 5,8 metra, široka 2,24 do 2,28 metra in napolnjena " +
            "tehta od 5.750 do 8.490 kilogramov. To je obremenitev, ki jo lesena ali " +
            "nadgrajena terasa redko prenese. Swim spa zato skoraj vedno stoji na betonski " +
            "plošči na terenu. Masažni bazen je pri 1.500 do 2.210 kilogramih pogosto " +
            "izvedljiv tudi na terasi, a to je treba pogledati na kraju samem, ne po telefonu.",
        ],
        [
          "Se v masažnem bazenu da plavati?",
          "Ne. Vsi trije modeli so kvadratni, s stranico od 1,95 do 2,30 metra, in nobeden nima " +
            "protitočnih šob. Za plavanje na mestu je swim spa, a tudi tam preverite " +
            "specifikacijo posameznega modela; SWIM 450 protitočnih šob ne navaja.",
        ],
        [
          "Kateri sprejme največ ljudi?",
          "Med masažnimi bazeni BAZEN 210 s šestimi mesti, med swim spa bazeni SWIM 580 " +
            "HIDRO in SWIM 580 MAXI s sedmimi. Število mest pa ni isto kot velikost školjke: " +
            "BAZEN 230 je večji od BAZENA 210 in ima eno mesto manj, ker ima dva ležalnika " +
            "namesto enega.",
        ],
        [
          "Katera je najpogostejša napaka pri izbiri?",
          "Izbrati po številu sedežev in šele nato pogledati, ali model pride do mesta " +
            "postavitve in ali podlaga zdrži. Vrstni red je obraten: najprej prostor, dostop " +
            "in podlaga, potem konfiguracija. Zato je ogled lokacije brezplačen in pred " +
            "ponudbo.",
        ],
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
        // The ROUTE KEY, resolved per shop by render/sections.ts resolveHref()
        // — the same rule the universal pages follow, so a rename of the
        // finder's slug cannot leave this page pointing at a 404.
        ["Kateri je pravi za vas? — dve do tri vprašanja", "/finder"],
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
