import type { Page } from "../pages";

/**
 * ⚠️ NOT ONE CONTACT FACT IS WRITTEN IN THIS FILE. The telephone number, the
 * e-mail address and the postal address all come from ShopConfig through the
 * `contact` and `imprint` blocks, which render an unset value as visibly
 * unset rather than as prose nobody can correct — see src/lib/filled.ts. That
 * is also why this page states no opening hours, no branch, no map and no
 * travel directions: nobody has supplied any of them, and a contact page is
 * the worst page on a site to guess on.
 *
 * What it does carry is the part of the conversation the shop already knows,
 * because the rest of the site already promises it: the site survey is free,
 * the offer is written and carries one figure with DDV, the delivery is
 * quoted per address, the ground work and the electrics are the customer's.
 * Every one of those appears on /dostava-in-montaza, /pogosta-vprasanja or in
 * PdpContent.freight, and this page may not out-claim them.
 *
 * The one response-time claim on the page — one working day — was here
 * before and is left as it was found. It is the shop's own promise, not a
 * figure invented to fill a line.
 */
export const CONTACT: Page = {
  key: "/contact",
  h1: "Kontakt",
  lead:
    "Pokličite ali pišite. Na vprašanja o merah, dostopu in priklopu po telefonu " +
    "odgovorimo sproti, na e-pošto v enem delovnem dnevu, " +
    "za ponudbo pa potrebujemo le naslov in nekaj fotografij prostora.",
  metaDescription:
    "Kontakt za masažne bazene in swim spa bazene: telefon, e-pošta in naslov. " +
    "Svetovanje pred nakupom, ogled lokacije in dogovor za dostavo.",
  blocks: [
    // The notes are RESTATEMENTS, not new promises: both response times are
    // this page's own lead sentence, and "seat, not a showroom" is what
    // /pogosta-vprasanja and the showroom copy already say. A visitor who
    // reads an address on a contact page and drives to Koper expecting to
    // see a pool is the failure this one line prevents.
    {
      kind: "contact",
      h: "Kako do nas",
      notes: {
        phone: "Odgovorimo sproti.",
        email: "Odgovor v enem delovnem dnevu.",
        address: "Sedež podjetja. Razstavnega salona nimamo.",
      },
    },
    // ⚠️ THE FORM COMES FIRST, ABOVE THE PROSE THAT USED TO STAND IN FOR IT.
    //
    // The product page's configurator resolves a model, a shell colour, a
    // cabinet colour and the options, and carries them here in the query
    // string. Until this block existed the visitor met a telephone number and
    // three paragraphs, and everything they had just chosen was theirs to
    // retype. The paragraphs below are still worth reading — they say WHAT to
    // tell us — but they are now the note beside the form rather than the
    // only way to answer it.
    {
      kind: "enquiry",
      h: "Povprašajte za ponudbo",
      p:
        "Odgovorimo v enem delovnem dnevu. Obvezna sta samo ime in en stik; " +
        "vse drugo pomaga, da je prvi odgovor uporaben.",
    },
    {
      kind: "prose",
      h: "Kaj nam poveste",
      p: [
        "Če že veste, kam bi bazen postavili, nam to opišite: kraj, nadstropje ali teraso, " +
          "širino najožjega prehoda in kako daleč je do električne omarice. S temi podatki lahko " +
          "povemo, ali je model izvedljiv, še preden se dogovorimo za ogled.",
        "Fotografija prostora in poti do njega pove več kot dolg opis. Pošljite jo po e-pošti.",
        "Če še ne veste, kam bi ga postavili, povejte, koliko ljudi naj sprejme in ali vas bolj " +
          "zanima sedenje in masaža ali plavanje. To je razlika med masažnim bazenom in swim spa " +
          "bazenom (med školjko od 195 do 230 cm in školjko od 450 do 580 cm) in od nje je odvisno " +
          "vse drugo: podlaga, dostop, poraba in cena.",
      ],
    },
    {
      kind: "qa",
      h: "Na kaj odgovorimo po telefonu",
      items: [
        [
          "Ali bo bazen šel skozi moja vrtna vrata?",
          "Povejte širino najožjega mesta na poti in model, ki vas zanima, in odgovor dobite " +
            "takoj. Kadar je razlika majhna ali je na poti ovinek, stopnice ali škarpa, to " +
            "preverimo na ogledu. Takrat se odloči tudi, ali gre bazen čez ograjo ali z " +
            "dvigalom.",
        ],
        [
          "Katera velikost je prava za mojo teraso?",
          "Povejte mere prostora in kaj stoji ob njem. Poleg mer školjke potrebujete še prostor " +
            "za dostop do servisne odprtine s črpalkami in krmilnikom; brez njega vsak kasnejši " +
            "servis pomeni premikanje bazena.",
        ],
        [
          "Koliko stane dostava?",
          "Odvisna je od naslova in dostopa do mesta postavitve, zato je znesek v pisni ponudbi " +
            "in ne v ceniku. Povejte kraj in kakšen je dostop, pa vemo, kaj vprašati naprej.",
        ],
        [
          "Ali lahko dobim ceno kar po telefonu?",
          "Za ceno potrebujemo model in konfiguracijo, za končni znesek pa še naslov, ker je od " +
            "njega odvisna dostava. Zavezujoča cena je zato vedno v pisni ponudbi in ne v " +
            "telefonskem pogovoru.",
        ],
        [
          "Ali lahko bazen prej vidim v živo?",
          "Razstavnega salona nimamo, zato bazena pred nakupom ne moremo pokazati v živo. " +
            "Pošljemo pa vam vzorčnik barv školjke, vse mere in specifikacije so na strani " +
            "vsakega modela, na brezplačnem ogledu lokacije pa z merami v roki povemo, kako " +
            "velik bo pri vas videti.",
        ],
      ],
    },
    {
      kind: "steps",
      h: "Kaj sledi",
      items: [
        ["Odgovor", "Na klic odgovorimo sproti, na e-pošto v enem delovnem dnevu."],
        ["Ogled lokacije", "Brezplačen. Preverimo dostop, podlago in električni priklop."],
        [
          "Ponudba",
          "Model in konfiguracija, dostava, priklop in zagon: vse v eni številki z DDV. " +
            "Kar v ponudbi piše, je tudi cena posla.",
        ],
        // The fourth step, added after the competitive teardown: the best
        // shops in this category publish the WHOLE arc, because the silence
        // after "we sent the offer" is where enquiries die — the buyer
        // should know the story ends in water, not in paperwork.
        [
          "Dostava in prva kopel",
          "Na dogovorjeni dan bazen pripeljemo, postavimo, napolnimo in zaženemo. " +
            "Preden odidemo, voda kroži in se greje, vi pa veste, kaj pomeni vsaka tipka.",
        ],
      ],
    },
    {
      kind: "facts",
      h: "Kaj je v ponudbi",
      rows: [
        ["Model in konfiguracija", "Izbrani model z izbranimi dodatki, s ceno z DDV."],
        [
          "Dostava",
          "Z ekipo in opremo za prenos, obračunana po ponudbi glede na naslov in dostop.",
        ],
        [
          "Priklop in zagon",
          "Polnjenje, zagon filtracije in ogrevanja, umeritev šob in predaja z navodili za " +
            "vzdrževanje.",
        ],
        ["Ogled lokacije", "Brezplačen in opravljen pred dostavo, ne na dan dostave."],
        [
          "Česa v ponudbi ni",
          "Priprave podlage in elektroinštalacije na vaši strani. Za priklop dobite pisna " +
            "navodila za svojega električarja; če ga nimate, izvedbo prevzame naš partner.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Klic ali e-pošta",
      p: [
        "Po telefonu je hitrejše vse, kar je vprašanje in odgovor: ali model gre skozi prehod, " +
          "kaj mora pripraviti električar, kako poteka dostavni dan. Po e-pošti je bolje vse, " +
          "kar ima priloge: mere, fotografije prostora in poti, tloris terase.",
        "Kadar na to stran pridete s strani modela, je ta naveden nad kontaktnimi podatki in se " +
          "prepiše tudi v zadevo e-pošte. Pustite ga tam: tako že ob odpiranju sporočila vemo, " +
          "o katerem bazenu teče beseda, in vam ni treba ničesar opisovati dvakrat.",
      ],
    },
    { kind: "imprint", h: "Podatki o podjetju" },
    {
      kind: "cta",
      h: "Morda je odgovor že tu",
      p: "Postavitev, poraba, vzdrževanje, dostava in garancija na enem mestu.",
      label: "Pogosta vprašanja",
      href: "/pogosta-vprasanja",
    },
  ],
};
