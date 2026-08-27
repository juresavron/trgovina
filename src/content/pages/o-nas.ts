import type { Page } from "../pages";

/**
 * Who the shop is.
 *
 * ⚠️ THE COUNTS ARE READ OFF THE OFFERED ARRAYS, NOT REMEMBERED. The comment
 * that used to stand here dated from before the swim spa range was narrowed,
 * so it was a claim about the catalogue written from memory of an earlier
 * catalogue. Checked again: OFFERED_MODELS in catalog/pola.ts holds ZR805,
 * ZR804 and ZR801 — three, 195 to 230 cm — and OFFERED_SWIMSPAS in
 * catalog/swimspa.ts holds ZR7861, ZR7809 and ZR7807 — three, 450 to 580 cm.
 * Six models. If either array changes, every sentence here that counts them
 * changes with it.
 *
 * THE MASSES ARE THE SUPPLIER'S, and the page states the FILLED ones only —
 * that is the figure a terrace is engineered against and the one the site
 * survey is about. OFFERED_MODELS give 1.500/1.870/2.210 kg filled, so the
 * range is 1.500–2.210; OFFERED_SWIMSPAS give 5.750/7.360/8.490, so 5.750–
 * 8.490. Never "over two tonnes", which is true of the BAZEN 230 alone and
 * which a page may not promote from one model to the whole family. (The dry
 * masses — 300–410 and 1.050–1.430 — are on /dostava-in-montaza and
 * /primerjava, which is where somebody planning a lift needs them.)
 *
 * ⚠️ WHAT THIS PAGE STILL DOES NOT KNOW, AND MAY NOT GUESS. Nobody has
 * supplied a founding year, a number of installations, a headcount, a
 * service-response time, how long a spare part stays available, or any
 * certification — so not one of them is stated. An "about us" page is exactly
 * where those get invented, and every one of them is checkable by the person
 * who would be let down by it. The address and the phone come from ShopConfig
 * through the imprint and contact blocks, which render an unset value as
 * visibly unset; see src/lib/filled.ts.
 *
 * Nothing promised here is new. The site survey, the written instructions for
 * the electrician, the transfer over a fence, the commissioning, the ten
 * minutes a week and the 2–5 year guarantee all appear on
 * /dostava-in-montaza, /pogosta-vprasanja or the product pages already.
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
        "Masažni bazen ni paket, ki bi ga dostavljalec pustil pred vrati. Napolnjen tehta od " +
          "1.500 do 2.210 kilogramov, swim spa bazen od 5.750 do 8.490. Prodaja je zato šele " +
          "prvi del posla; drugi je, da bazen pride na mesto, se priklopi na elektriko in " +
          "prvi večer dela.",
        "Prav zato tega dela ne oddajamo naprej. Kdor bazen pripelje, ga tudi zažene in pokaže, " +
          "kako se vzdržuje. Kadar se kaj zatakne, ni nikogar, na kogar bi lahko pokazali.",
      ],
    },
    // The photograph bands are SLOTS, not statements — see the figure note in
    // content/pages.ts. Until the owner uploads something real (the team, the
    // van, an installation) each falls back to the shop's own product
    // photography, which is true by definition. No caption on any of them:
    // a caption would be a claim about a picture this file cannot see.
    { kind: "figure", slot: "o-nas-1" },
    {
      kind: "prose",
      h: "Zakaj šest modelov in ne petdeset",
      p: [
        "Ponudbo smo namenoma zožili: trije masažni bazeni od 195 do 230 cm in trije swim spa " +
          "bazeni od 450 do 580 cm. Šest modelov, ki jih imamo v rokah, za katere imamo " +
          "fotografije, rezervne dele in servisno zgodovino. Katalog s petdesetimi modeli, od " +
          "katerih polovice prodajalec ni nikoli videl, ni izbira, ampak izgovor.",
        "Ozek izbor ni omejitev, ampak pogoj za odgovor. Ali bo bazen šel skozi vaša vrtna " +
          "vrata, se da po telefonu povedati samo za model, ki smo ga že nosili. Iz istega razloga " +
          "imamo dele na zalogi in vsi trije masažni bazeni tečejo na istem krmilniku Balboa " +
          "BP200 G2+ z grelcem 3 kW.",
      ],
    },
    {
      kind: "prose",
      h: "Kako delamo",
      p: [
        "Pred dostavo pride nekdo od nas na lokacijo. Ta brezplačen obisk je razlog, da " +
          "se dostave ne ponesrečijo: težave s prehodom, nosilnostjo terase ali premajhnim " +
          "odklopnikom se pokažejo prej, kot pride tovornjak.",
        "Za priklop dobite pisna navodila za svojega električarja — presek vodnika, odklopnik " +
          "in zaščitno stikalo za konkreten model; če električarja nimate, izvedbo prevzame " +
          "naš partner.",
        "Na dan dostave pride ekipa z opremo za prenos, po potrebi čez ograjo ali po " +
          "stopnicah. Bazen napolnimo, zaženemo filtracijo in ogrevanje ter umerimo šobe; " +
          "preden odidemo, voda kroži in se greje. Nato vas naučimo vzdrževanja — približno " +
          "deset minut na teden in to je vse, kar bazen zahteva od vas.",
      ],
    },
    { kind: "figure", slot: "o-nas-2" },
    {
      kind: "facts",
      h: "Kaj pogledamo ob ogledu lokacije",
      rows: [
        [
          "Najožje mesto na poti",
          "Vrtna vrata, prehod med hišo in ograjo, ovinek na stopnišču. Od najožjega mesta je " +
            "odvisno, ali gre bazen po tleh, čez ograjo ali z avtodvigalom.",
        ],
        [
          "Podlaga in nosilnost",
          "Kaj je pod predvidenim mestom in ali nosi napolnjen bazen: 1.500 do 2.210 " +
            "kilogramov pri masažnem, 5.750 do 8.490 pri swim spa bazenu.",
        ],
        [
          "Električni priklop",
          "Kje je električna omarica, kako daleč je do mesta postavitve in kaj je vmes. Priklop " +
            "je 220 V ali 380 V.",
        ],
        [
          "Prostor okoli školjke",
          "Dostop do servisne odprtine, kjer so črpalke in krmilnik. Brez njega vsak kasnejši " +
            "servis pomeni premikanje bazena.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Kaj pomeni servisna zgodovina",
      p: [
        "Servisna zgodovina ni oglasna beseda, ampak zapis: kateri del na katerem modelu je " +
          "odpovedal, po kolikšnem času in kaj ga je nadomestilo. Za šest modelov se tak zapis " +
          "da voditi, za petdeset se ne.",
        "Čez pet let to pomeni, da se pogovarjamo o modelu, ki ga poznamo in smo ga sami " +
          "dostavili in zagnali. Kako dolgo je posamezen del dobavljiv, je odvisno od " +
          "dobavitelja — tega ne obljubljamo z letnico.",
      ],
    },
    {
      kind: "qa",
      h: "Ko kaj odpove",
      items: [
        [
          "Koga pokličem, če bazen preneha greti?",
          "Nas. Servis opravi naša servisna mreža, rezervne dele za modele, ki jih prodajamo, " +
            "pa imamo na zalogi. Povejte model in kaj se dogaja: ali voda kroži in kaj kaže " +
            "krmilnik.",
        ],
        [
          "Kakšna je garancija?",
          "Od dveh do petih let, odvisno od sklopa; rok in obseg sta v garancijskem listu, ki " +
            "ga dobite ob predaji. To je prostovoljna zaveza proizvajalca. Ločeno od nje imate " +
            "kot potrošnik zakonske pravice pri neskladnosti blaga: za neskladnost, ki se pokaže " +
            "v dveh letih od dobave, odgovarjamo mi kot prodajalec.",
        ],
        [
          "Ali je treba bazen za servis premakniti?",
          "Ne, če je ob postavitvi ostal dostop do servisne odprtine. Če ga ni, se premikanju ni " +
            "mogoče izogniti — zato o njem govorimo že ob ogledu in ne ob prvi okvari.",
        ],
      ],
    },
    { kind: "imprint" },
    { kind: "contact", h: "Kje nas dobite" },
    {
      kind: "cta",
      h: "Poglejte ponudbo",
      p: "Šest modelov — trije masažni in trije swim spa bazeni. Mere, specifikacije in cene.",
      label: "V trgovino",
      href: "/trgovina",
    },
  ],
};
