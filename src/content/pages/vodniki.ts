import type { Page } from "../pages";

/**
 * The guides INDEX.
 *
 * ⚠️ IT USED TO BE THE GUIDES THEMSELVES. The note that stood here said the
 * articles "are not written yet, so this page answers the three questions
 * directly rather than linking to pages that do not exist" — true when it was
 * written, and it cost the whole long-tail ladder: 375 words under one title,
 * one h1 and one URL, so none of the three queries had a page to rank. They
 * are written now, one per URL, in ./vodnik.ts. This page lists them.
 */
export const GUIDES: Page = {
  key: "/guides",
  h1: "Vodniki za nakup masažnega bazena",
  seoTitle: "Vodniki za nakup masažnega bazena",
  // ⚠️ THE COUNT IN THE LEAD IS A CLAIM ABOUT THE LIST BELOW IT. This said
  // "trije vodniki" and named three subjects while GUIDE_PAGES held four — the
  // index was wrong about its own contents from the moment the fourth guide
  // shipped, and nothing said so. structure.test.ts now reads the numeral off
  // this page and checks it against the count.
  lead:
    "Šest vodnikov v treh korakih: ali je bazen pri vas izvedljiv, kateri model " +
    "izbrati in kaj sledi po dostavi.",
  metaDescription:
    "Vodniki za nakup masažnega bazena: nosilnost podlage in dostop, velikost in " +
    "šobe, cena nakupa in obratovanja, vzdrževanje in delovanje pozimi.",
  blocks: [
    // ⚠️ AN INDEX NEEDS ITS OWN VOICE, and this one was three titles and a
    // lead. themes/studio/blog.ts makes the argument for the post list and it
    // is the same argument here: "left as a bare list of cards it is also the
    // site's only indexable page that says nothing in its own voice — the
    // reader gets three headlines and no idea what the series is for".
    //
    // What this paragraph carries is the ORDER, which is the one thing a
    // reader choosing between six guides cannot see from six titles: which of
    // them decide whether a model is possible at their address, which help
    // pick one, and which answer what happens after. Every figure it alludes
    // to is published on the guide it points at.
    //
    // It is deliberately NOT the blog index's standing paragraph reworded —
    // that one is about the posts and this one is about the order — because
    // two pages carrying the same sentence is the duplication a link-and-a-
    // line index exists to avoid.
    {
      kind: "prose",
      p: [
        // ⚠️ SKUPINE, NE VRSTILNI ŠTEVNIKI. This paragraph used to walk the
        // list as "prvi / drugi / tretji", which reads only while the list is
        // three long: at six the ordinals stop pointing at anything a reader
        // can find, and the first two guides are not a sequence anyway. The
        // grouping is the thing the index knows and three titles do not.
        "Vodniki so v treh skupinah. Prva pove, ali je bazen pri vas sploh " +
          "izvedljiv: koliko tehta poln bazen, kod ga bomo pripeljali in kaj mora " +
          "pripraviti električar. Druga pomaga izbrati model: koliko oseb sprejme " +
          "kateri, koliko prostora zasede, koliko šob poganja ena črpalka in " +
          "koliko vse skupaj stane. Tretja odgovarja na to, kar pride po dostavi " +
          "— vzdrževanje in zima.",
        // ⚠️ THE INDEX NAMES WHAT ITS CHILDREN ACTUALLY CARRY, and until the
        // guides were deepened it had nothing concrete to name. Three titles
        // and an ordering do not help a reader choose; three FIGURES do, and
        // each of these is the thing its guide was rewritten around. None of
        // it is a guide's opening sentence reworded — the note below rules
        // that out and still does.
        "Kaj v njih dobite, konkretno. Vodnik o terasi pove, koliko kilogramov na " +
          "kvadratni meter pomeni poln bazen — številka, ki jo lahko pokažete " +
          "izvajalcu terase ali statiku — in katere tri mere na poti do mesta " +
          "postavitve nam povejte, da dostava ne bo improvizacija. Vodnik o ceni " +
          "pokaže, kaj loči tri masažne bazene po ceni: med prvima dvema je razlika " +
          "predvsem večja školjka, med drugim in tretjim pa druga masažna črpalka " +
          "in trinajst šob več. Vodnik o zimi izračuna, zakaj izklop ni prihranek — " +
          "koliko kilovatnih ur potrebuje 1.800 litrov za trideset stopinj in " +
          "koliko ur to pomeni pri 3-kilovatnem grelcu.",
        "Druge tri odgovarjajo na vprašanja, ki jih specifikacija zastavi in ne " +
          "reši. Vodnik o velikosti pove, kateri model sprejme največ ljudi — in " +
          "to ni največji. Vodnik o šobah pove, koliko šob poganja ena črpalka pri " +
          "vsakem modelu, kar je uporabnejša številka od skupnega števila šob. " +
          "Vodnik o vzdrževanju pove, zakaj je filtrirna površina pri vseh treh " +
          "modelih enaka, prostornina pa ne, in kaj to pomeni za delo z bazenom.",
        "Številke v vseh so iz specifikacij modelov, ne iz ocen; kjer " +
          "odgovora nimamo, to piše. Kar se ne da odgovoriti na daljavo — ali " +
          "podlaga zdrži in ali model pride do mesta postavitve — pogledamo na " +
          "brezplačnem ogledu pred ponudbo.",
      ],
    },
    // The index IS the links — but a link and a line, not a link alone. The
    // note here used to say a summary "would be a fourth copy of text that
    // already has a URL", and that is true of the guides' own opening
    // sentences, which is why none of them is repeated below. What these
    // lines carry is the QUESTION each guide answers, which appears nowhere
    // else: a reader choosing between titles was being asked to guess.
    //
    // ⚠️ THE NOTE THAT STOOD HERE BLAMED THE PAGE FOR A BUG IN THE SCRIPT.
    // It said audit-seo.mjs "will go on calling this page thin, whatever is
    // written here", because the count strips <nav> and a links block IS a
    // <nav> — so "every word below is invisible to that count by design" and
    // the reported number was the lead alone.
    //
    // The premise was right and the conclusion was not. Stripping <nav> is
    // there so shared chrome cannot inflate a thin page, and taking <main>
    // already achieves that: the header and footer are outside it. What the
    // extra strip removed was this block, which a reader reads. The script
    // now removes only .st-page-toc, the section index that restates the
    // page's own headings, and this page measures 224 words rather than 132
    // — the same page, counted honestly.
    //
    // The rest of the old note still holds: /vodniki exists to give the nav's
    // "VODNIKI" a destination and to hand the guides their internal links,
    // and padding an index to clear a threshold would make it worse for the
    // one person who opens it. The paragraphs added above are not padding —
    // they name the figure each guide was written around, which is the one
    // thing a reader choosing between titles cannot see.
    {
      kind: "links",
      h: "Vsi vodniki",
      items: [
        [
          "Masažni bazen na terasi: kaj preveriti pred nakupom",
          "/vodnik/masazni-bazen-na-terasi",
          "Koliko tehta poln bazen, kako široka mora biti pot do mesta postavitve in " +
            "kaj potrebuje vaš električar — vse to preden izberete model.",
        ],
        [
          "Koliko stane masažni bazen",
          "/vodnik/koliko-stane-masazni-bazen",
          "Cene modelov, kaj je v njih in kaj se obračuna posebej, ter zakaj mesečnega " +
            "zneska za obratovanje ne navajamo nikjer.",
        ],
        [
          "Katera velikost masažnega bazena",
          "/vodnik/velikost-masaznega-bazena",
          "Koliko oseb sprejme kateri model, koliko kvadratnih metrov zasede in zakaj " +
            "največji bazen pri nas ni tisti z največ sedeži.",
        ],
        [
          "Šobe in črpalke masažnega bazena",
          "/vodnik/sobe-in-crpalke",
          "Koliko šob poganja ena črpalka pri katerem modelu, kaj prinese druga " +
            "masažna črpalka in zakaj obtočna v ta seštevek ne sodi.",
        ],
        [
          "Vzdrževanje masažnega bazena",
          "/vodnik/vzdrzevanje-masaznega-bazena",
          "Kaj opravi obtočna črpalka s filtrom, kaj ostane vam in zakaj je pri " +
            "večjem modelu dela enako, vode pa več.",
        ],
        [
          "Masažni bazen pozimi",
          "/vodnik/masazni-bazen-pozimi",
          "Zakaj je zima za bazen najboljši letni čas in zakaj je prazen bazen v mrazu " +
            "bolj ogrožen kot poln in delujoč.",
        ],
      ],
    },
    {
      kind: "cta",
      h: "Ostalo vprašanje?",
      p: "Na vprašanja o dostopu, podlagi in priklopu odgovorimo po telefonu, brez obveznosti.",
      label: "Kontakt",
      href: "/kontakt",
    },
  ],
};
