import type { Page } from "../pages";

/**
 * The showroom is a claim the site already makes in footNote — "Razstavni
 * bazen v Ljubljani". The page states that and renders the address from
 * ShopConfig, which is TODO today and therefore renders as visibly unset
 * rather than as an invented street.
 *
 * ⚠️ WHAT THIS PAGE STILL DOES NOT KNOW, AND MAY NOT GUESS. The city is the
 * only thing anybody has written down about the showroom. The street, the
 * opening hours, which models stand on the floor, whether one of them is
 * filled and heated, and whether a swim spa is there at all are facts nobody
 * has supplied. Every one of them would send a person across the country to
 * look at something that is not there, so not one of them is stated here.
 * Where the page would need such a fact it asks the visitor to raise it when
 * booking — "povejte ob dogovoru za termin" — which is true, useful and
 * invents nothing.
 *
 * So the page was lengthened along the axis that needs no showroom fact at
 * all: what a visit is FOR. Why a shell has to be sat in rather than read off
 * a drawing, what to measure before coming, and what a visit can settle and
 * what it cannot. The figures are the catalogue's own — 195–230 cm of
 * footprint and 82–88 cm of shell height from catalog/pola.ts, 1.500–2.210 kg
 * filled from the same file, 5.750–8.490 kg filled from catalog/swimspa.ts.
 * The counts of models are OFFERED_MODELS.length and OFFERED_SWIMSPAS.length.
 */
export const SHOWROOM: Page = {
  key: "/showroom",
  h1: "Razstavni salon v Ljubljani",
  lead:
    "Bazen si je vredno ogledati v živo. Mere na papirju povedo malo o tem, kako globok je " +
    "sedež, kam pridejo noge in kako velika je školjka v resnici.",
  metaDescription:
    "Razstavni masažni bazen v Ljubljani — globino, sedeže in mere preverite v živo. " +
    "Obisk po dogovoru, s svetovanjem za vašo lokacijo.",
  blocks: [
    {
      kind: "prose",
      h: "Zakaj bazen pogledati v živo",
      p: [
        "Mere na papirju so natančne in vseeno prazne. Med školjko 195 × 195 cm in školjko " +
          "230 × 230 cm je 35 centimetrov v vsako smer — na risbi je to skoraj nič, na terasi " +
          "pa razlika med bazenom, ki se komaj umesti, in takim, okoli katerega se da hoditi.",
        "Drugo je sedež. Podatek o višini školjke — od 82 do 88 centimetrov — pove, kako visoka " +
          "je školjka, ne pa, kako globoko boste sedeli v njej. Kam vam seže voda in ali je " +
          "ležalnik dovolj dolg za vašo postavo, se izve tako, da se vanj usedete. To vzame pol " +
          "minute in odgovori na vprašanje, o katerem se sicer ugiba tedne.",
        "Tretje je zvok. Črpalka pri polni moči ni tiha in kako glasno je to, si vsak " +
          "predstavlja drugače. Če bazen ob vašem obisku deluje, ga poslušajte pri najvišji in " +
          "ne pri najnižji stopnji.",
      ],
    },
    {
      kind: "prose",
      h: "Obisk po dogovoru",
      p: [
        "Razstavni bazen je v Ljubljani. Za obisk se dogovorimo vnaprej po telefonu, da vas " +
          "sprejme nekdo, ki zna odgovoriti na vprašanja o vaši konkretni lokaciji.",
        "Prinesite mere prostora in fotografijo poti do njega. V pol ure se da razčistiti, " +
          "kateri model je pri vas izvedljiv in kaj bi bilo treba pripraviti.",
        "Ob dogovoru za termin povejte, kateri model vas zanima in kaj bi radi videli ali " +
          "preizkusili. Kaj bo tisti dan na ogled in v kakšnem stanju, vam povemo vnaprej — to " +
          "je odgovor, ki je bolj uporaben po telefonu kot pred vrati.",
        "Ogled salona in ogled lokacije nista isto. V salonu se odločite za model; na vašem " +
          "naslovu preverimo dostop, podlago in električni priklop. Slednji je ločen brezplačen " +
          "obisk, ki ga opravimo pri vas pred dostavo.",
      ],
    },
    {
      kind: "facts",
      h: "Kaj prinesti s seboj",
      rows: [
        [
          "Mere mesta postavitve",
          "Širina in dolžina prostora, kamor bi bazen postavili, in kaj stoji ob njem — zid, " +
            "ograja, streha, okno.",
        ],
        [
          "Najožje mesto na poti",
          "Vrtna vrata, prehod med hišo in ograjo, ovinek na stopnišču. Meri se najožje mesto, " +
            "ne najširše.",
        ],
        [
          "Fotografije poti",
          "Od mesta, kamor lahko pripelje tovornjak, do mesta postavitve. Nekaj posnetkov pove " +
            "več kot dolg opis.",
        ],
        [
          "Podlaga",
          "Kaj je pod predvidenim mestom: betonska plošča, tlakovci, lesena terasa ali teren. " +
            "Pri terasi je pomembno, kako je zgrajena in na čem stoji.",
        ],
        [
          "Elektrika",
          "Kje je električna omarica, kako daleč je do mesta postavitve in kaj je vmes.",
        ],
        [
          "Višinske razlike",
          "Stopnice, škarpa, klančina. Vsaka višinska razlika na poti je vprašanje, kako bo " +
            "bazen prišel do mesta.",
        ],
      ],
    },
    {
      kind: "qa",
      h: "Pogosta vprašanja o obisku",
      items: [
        [
          "Ali lahko pridem brez najave?",
          "Bolje je, da se dogovorimo vnaprej. Termin pomeni, da si za vas nekdo vzame čas in " +
            "da pride tisti, ki zna odgovoriti na vprašanja o vaši lokaciji.",
        ],
        [
          "Kateri modeli so v salonu?",
          "Povejte ob dogovoru za termin, kateri model vas zanima, in vam povemo, kaj boste " +
            "lahko videli. Ponudba obsega tri masažne bazene od 195 do 230 cm in tri swim spa " +
            "bazene od 450 do 580 cm; swim spa je zaradi dolžine drugačen razstavni problem " +
            "kot masažni bazen.",
        ],
        [
          "Ali lahko bazen preizkusim?",
          "Povejte vnaprej, kaj bi radi preizkusili — sedeti v suhi školjki je nekaj drugega " +
            "kot slišati črpalko in čutiti šobe. Kaj bo ob vašem terminu mogoče, vam povemo " +
            "pred prihodom.",
        ],
        [
          "Se v salonu dogovorimo tudi za ceno in dostavo?",
          "Ceno modela v izbrani konfiguraciji in dostavo dobite v pisni ponudbi. Zaporedje je " +
            "običajno tako: najprej model, nato ogled lokacije, nato ponudba z eno " +
            "številko z DDV.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Česa v salonu ni mogoče preveriti",
      p: [
        "Dveh stvari v salonu ni mogoče izvedeti. Prvo je, koliko bo bazen porabil pri vas: poraba je " +
          "odvisna od temperature, ki jo držite, pogostosti uporabe, kakovosti pokrova in " +
          "zunanjih razmer, zato mesečnega zneska ne navajamo nikjer.",
        "Drugo je, ali vaša podlaga zdrži. Napolnjen masažni bazen tehta od 1.500 do 2.210 " +
          "kilogramov, napolnjen swim spa bazen od 5.750 do 8.490 kilogramov, in največji del " +
          "te teže je voda. Tega po telefonu ni mogoče presoditi — zato je ogled lokacije " +
          "ločen brezplačen obisk.",
      ],
    },
    // No Naslov row: the only address the config holds is the company seat
    // in Koper, and printing it under this page's Ljubljana headline claimed
    // it as the showroom's address. The visit is by appointment; the exact
    // location comes with the appointment.
    { kind: "contact", h: "Kontakt za dogovor", omitAddress: true },
    {
      kind: "cta",
      h: "Dogovorite se za termin",
      p: "Pokličite in povejte, kdaj vam ustreza in kateri model vas zanima.",
      label: "Kontakt",
      href: "/kontakt",
    },
  ],
};
