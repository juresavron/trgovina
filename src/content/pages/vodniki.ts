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
  lead:
    "Trije vodniki: kaj preveriti pred nakupom, koliko stane nakup in obratovanje, " +
    "in kako je z bazenom pozimi.",
  metaDescription:
    "Vodniki za nakup masažnega bazena: nosilnost podlage in dostop, cena nakupa in " +
    "obratovanja, ter delovanje pozimi.",
  blocks: [
    // ⚠️ AN INDEX NEEDS ITS OWN VOICE, and this one was three titles and a
    // lead. themes/studio/blog.ts makes the argument for the post list and it
    // is the same argument here: "left as a bare list of cards it is also the
    // site's only indexable page that says nothing in its own voice — the
    // reader gets three headlines and no idea what the series is for".
    //
    // What this paragraph carries is the ORDER, which is the one thing a
    // reader choosing between three guides cannot see from three titles: the
    // first decides whether a model is possible at their address, the second
    // what it costs, the third what happens after. Every figure it alludes to
    // is published on the guide it points at.
    //
    // It is deliberately NOT the blog index's standing paragraph reworded —
    // that one is about the posts and this one is about the order — because
    // two pages carrying the same sentence is the duplication a link-and-a-
    // line index exists to avoid.
    {
      kind: "prose",
      p: [
        "Vrstni red ni naključen. Prvi vodnik pove, ali je model pri vas sploh " +
          "izvedljiv: koliko tehta poln bazen, kod ga bomo pripeljali in kaj mora " +
          "pripraviti električar. Drugi pove, koliko stane nakup in kaj se " +
          "obračuna posebej. Tretji odgovarja na vprašanje, ki pride za tem — " +
          "kako je z bazenom pozimi.",
        "Številke v vseh treh so iz specifikacij modelov, ne iz ocen; kjer " +
          "odgovora nimamo, to piše. Kar se ne da odgovoriti na daljavo — ali " +
          "podlaga zdrži in ali model pride do mesta postavitve — pogledamo na " +
          "brezplačnem ogledu pred ponudbo.",
      ],
    },
    // The index IS the links — but a link and a line, not a link alone. The
    // note here used to say a summary "would be a fourth copy of text that
    // already has a URL", and that is true of the guides' own opening
    // sentences, which is why none of them is repeated below. What these
    // three lines carry is the QUESTION each guide answers, which appears
    // nowhere else: a reader choosing between three titles was being asked to
    // guess.
    //
    // ⚠️ AND audit-seo.mjs WILL GO ON CALLING THIS PAGE THIN, WHATEVER IS
    // WRITTEN HERE. It counts the words in <main> with <nav> stripped out —
    // deliberately, so that shared chrome cannot make a thin page look
    // substantial — and a links block IS a <nav>, because it is navigation.
    // So every word below is invisible to that count by design, and the
    // number it reports (40) is the lead paragraph alone.
    //
    // That is the right outcome twice over: the block is correctly marked up,
    // and /vodniki is not a page that needs to rank. It exists to give the
    // nav's "VODNIKI" a destination and to hand three guides their internal
    // links. Padding an index to three hundred words to satisfy a threshold
    // would make it worse for the only person who opens it.
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
