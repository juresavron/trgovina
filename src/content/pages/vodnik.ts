import type { GuidePage } from "../pages";
import { priceRangeText } from "../price-range";

/**
 * THE BUYING GUIDES, EACH AT ITS OWN URL.
 *
 * ⚠️ THEY USED TO BE THREE SECTIONS OF ONE PAGE, AND THAT COST THE WHOLE
 * LADDER. /vodniki was 375 words carrying all three, with one <title>
 * ("Vodniki"), one h1 ("Vodniki") and one URL — so the three queries
 * docs/SEO.md §1 names as the topical-authority mechanism ("masažni bazen na
 * terasi", "koliko stane masažni bazen", "masažni bazen pozimi") had no page
 * to rank. None of those strings appeared in the title, the h1 or the URL.
 * Worse, the shop's config has carried a "/guide" segment (/vodnik) from the
 * start and NOTHING was ever routed at it: /vodnik and /vodnik/x both 404'd.
 *
 * Now each guide is a page. The bodies are the same words, moved rather than
 * rewritten — the only edits are the ones the audits asked for, marked where
 * they occur — and each one takes the section heading it already had as its
 * h1, plus a title and a description built around the query it answers.
 *
 * /vodniki stays as the index that links to them, which is what the home
 * page's three cards have always pointed at.
 */

/** One guide, at /vodnik/<slug>. */
export const GUIDE_PAGES: readonly GuidePage[] = [
  {
    slug: "masazni-bazen-na-terasi",
    key: "/guide",
    h1: "Masažni bazen na terasi: kaj preveriti pred nakupom",
    seoTitle: "Masažni bazen na terasi — kaj preveriti pred nakupom",
    lead:
      // The model is the LAST of the four, and saying so as "model je zadnja
      // od njih" made the reader resolve a feminine adjective against a
      // masculine noun by way of an elided "stvar". The ordinal says it
      // outright and reads faster.
      "Štiri stvari po vrsti, in model je četrta: podlaga, pot do lokacije, " +
      "elektrika in šele nato izbira bazena.",
    metaDescription:
      "Masažni bazen na terasi: nosilnost podlage, širina poti, električni priklop in " +
      "kaj preveriti, preden izberete model. Ogled lokacije je brezplačen.",
    blocks: [
    {
      kind: "steps",
      items: [
        [
          "Podlaga, ne model",
          "Napolnjen masažni bazen tehta od 1.500 do 2.210 kilogramov, z ljudmi v njem pa " +
            "še nekaj sto več; napolnjen swim spa od 5.750 do 8.490 kilogramov. Betonska " +
            // ⚠️ "brez razmisleka" TOLD A READER NOT TO CHECK, about 2.210 kg plus
            // bathers on a slab of unstated thickness over unstated ground. It
            // was the only sentence on the site that did; every other surface
            // hedges ("ali to velja za vašo lokacijo, preverimo ob ogledu").
            "plošča navadno ni sporna, lesena terasa in balkon pa pogosto sta, in to " +
            "je stvar konstrukcije, ne občutka.",
        ],
        [
          "Pot do lokacije",
          "Izmerite najožje mesto na poti: vrata, prehod med hišo in ograjo, ovinek na " +
            "stopnišču. Bazen se prenaša postrani, a širina školjke je fizična meja, ki se " +
            "je ne da obiti.",
        ],
        [
          "Elektrika",
          "Bazen potrebuje svoj odklopnik in zaščitno stikalo; koliko natanko, je odvisno " +
            "od grelca in števila črpalk v modelu. Za vsak model damo pisna navodila, ki " +
            "jih vaš električar preprosto izvede.",
        ],
        [
          "Šele nato model",
          "Koliko oseb, koliko šob, kakšna ležalna pozicija. Ta izbira je prijetna in jo " +
            "lahko naredite v miru; prve tri točke pa določijo, kaj je sploh mogoče.",
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
  },
  {
    slug: "koliko-stane-masazni-bazen",
    key: "/guide",
    h1: "Koliko stane masažni bazen",
    seoTitle: "Koliko stane masažni bazen — cena nakupa in obratovanja",
    lead:
      "Nakupna cena, kaj je v njej in kaj ni, in zakaj mesečnega zneska za " +
      "obratovanje nihče ne more pošteno napovedati.",
    metaDescription:
      "Koliko stane masažni bazen: modeli od 6.690 do 21.690 EUR z DDV, kaj cena " +
      "vključuje, kaj se obračuna po ponudbi in od česa je odvisno obratovanje.",
    blocks: [
    {
      kind: "prose",
      // The site's only three-line h2 stair-stepped 20/12/14 characters at
      // every width. The dropped subtitle is the first sentence's job anyway.
      p: [
        // ⚠️ THE RANGE IS STATED HERE, AND IT USED TO BE WITHHELD. This is the
        // page that answers "koliko stane masažni bazen", and its whole first
        // paragraph was a redirect: "Nakupna cena modela je na strani vsakega
        // modela." A guide that refuses the number in its own title cannot
        // rank for it and does not help the reader who typed it.
        //
        // The monthly OPERATING figure stays withheld two paragraphs down, and
        // that refusal is right — it depends on use, temperature, cover and
        // tariff, none of which the shop knows. The purchase range does not
        // depend on any of them; it is on the shop's own price list.
        //
        // ⚠️ AND IT IS DERIVED, NOT TYPED. priceRangeText() reads the offered
        // models, so a price change moves this sentence with it rather than
        // leaving a stale figure on the page that ranks for the query.
        "Masažni bazeni stanejo " + priceRangeText("tub") + " z DDV, swim spa bazeni " +
          priceRangeText("swim") + " z DDV; cena vsakega modela je na njegovi strani. " +
          "V ceni so ogled lokacije, zagon in predaja; dostavo obračunamo po ponudbi, ker je " +
          "odvisna od naslova in dostopa. Cena ne vključuje priprave podlage in " +
          "elektroinštalacije na vaši strani.",
        "Pri obratovanju sta glavni postavki ogrevanje in filtracija. Obe sta odvisni od stvari, " +
          "ki jih ne moremo napovedati namesto vas: kako pogosto bazen uporabljate, na kateri " +
          "temperaturi ga držite, kako dobro je pokrit in kakšna je vaša cena elektrike. Zato " +
          "nikjer ne navajamo mesečnega zneska; vsaka taka številka bi bila ugibanje.",
        "Kar zanesljivo drži: dobro pokrit bazen porabi bistveno manj kot slabo pokrit, zato je " +
          "termo pokrov prvi in ne zadnji dodatek.",
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
  },
  {
    slug: "masazni-bazen-pozimi",
    key: "/guide",
    h1: "Masažni bazen pozimi",
    seoTitle: "Masažni bazen pozimi — delovanje, stroški in praznjenje",
    lead:
      // ⚠️ "PRIDE NA SVOJ RAČUN", NOT "JE NA SVOJEM". Biti na svojem means to
      // be on one's own land, or to insist on one's own view — neither of
      // which is "comes into its own", which is the sentence this wanted.
      "Pozimi masažni bazen pride na svoj račun. Praznjenje čez zimo je pogosta " +
      "napaka, ne previdnost.",
    metaDescription:
      "Masažni bazen pozimi: zakaj deluje bolje kot poleti, kaj naredi pokrov in " +
      "zakaj je prazen bazen v mrazu bolj ogrožen kot poln.",
    blocks: [
    {
      kind: "prose",
      p: [
        "Bazen pozimi dela in se uporablja. To je zanj najboljši letni čas. Voda ostane topla, " +
          "izolacija školjke in pokrov pa opravita večino dela.",
        "Praznjenje čez zimo je pogosta napaka. Prazen bazen v mrazu je bolj ogrožen kot poln " +
          "in delujoč, ker v ceveh in črpalkah ostane voda. Če bazena res ne boste " +
          "uporabljali, mora biti za zimo pravilno pripravljen. Povejte nam, pa vam razložimo " +
          "postopek za vaš model.",
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
  },
];
