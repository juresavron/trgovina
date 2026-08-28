import type { Page } from "../pages";

/**
 * The guides page. content.guides carries three titles the home page prints as
 * cards; the articles behind them are not written yet, so this page answers
 * the three questions directly rather than linking to pages that do not exist.
 * A card that links nowhere is worse than no card.
 */
export const GUIDES: Page = {
  key: "/guides",
  h1: "Vodniki",
  lead:
    "Kar je treba vedeti pred nakupom masažnega bazena: kje sme stati, koliko stane " +
    "obratovanje in kaj se z njim dogaja pozimi.",
  metaDescription:
    "Vodniki za nakup masažnega bazena: kaj preveriti pred nakupom, koliko stane nakup in " +
    "obratovanje ter kako bazen deluje pozimi.",
  blocks: [
    // A `steps` block, not prose — and it was prose once. The guide's whole
    // argument is an ORDER ("prvo … drugo … tretje … šele četrto"), and as
    // four paragraphs that order was buried in a wall the eye cannot rank.
    // The ordinals moved out of the sentences and into the numerals; not a
    // fact changed.
    {
      kind: "steps",
      h: "Masažni bazen na terasi: kaj preveriti pred nakupom",
      items: [
        [
          "Podlaga, ne model",
          "Napolnjen masažni bazen tehta od 1.500 do 2.210 kilogramov, z ljudmi v njem pa " +
            "še nekaj sto več; napolnjen swim spa od 5.750 do 8.490 kilogramov. Betonska " +
            "plošča to nosi brez razmisleka, lesena terasa in balkon pa ne nujno, in to " +
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
      kind: "prose",
      // The site's only three-line h2 stair-stepped 20/12/14 characters at
      // every width. The dropped subtitle is the first sentence's job anyway.
      h: "Koliko stane masažni bazen",
      p: [
        "Nakupna cena modela je na strani vsakega modela; ogled lokacije, zagon in predaja so " +
          "vključeni, dostavo pa obračunamo po ponudbi, ker je odvisna od lokacije in dostopa. " +
          "Cena modela ne vključuje priprave podlage in elektroinštalacije na vaši strani.",
        "Pri obratovanju sta glavni postavki ogrevanje in filtracija. Obe sta odvisni od stvari, " +
          "ki jih ne moremo napovedati namesto vas: kako pogosto bazen uporabljate, na kateri " +
          "temperaturi ga držite, kako dobro je pokrit in kakšna je vaša cena elektrike. Zato " +
          "nikjer ne navajamo mesečnega zneska; vsaka taka številka bi bila ugibanje.",
        "Kar zanesljivo drži: dobro pokrit bazen porabi bistveno manj kot slabo pokrit, zato je " +
          "termo pokrov prvi in ne zadnji dodatek.",
      ],
    },
    {
      kind: "prose",
      h: "Masažni bazen pozimi",
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
};
