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
    {
      kind: "prose",
      h: "Masažni bazen na terasi: kaj preveriti pred nakupom",
      p: [
        "Prvo vprašanje ni model, ampak podlaga. Poln masažni bazen z ljudmi presega dve toni, " +
          "swim spa bazen pa je lahko večkratnik tega. Betonska plošča to nosi brez razmisleka; " +
          "lesena terasa in balkon pa ne nujno, in to je stvar konstrukcije, ne občutka.",
        "Drugo je pot do lokacije. Merite najožje mesto na poti — vrata, prehod med hišo in " +
          "ograjo, ovinek na stopnišču. Bazen se prenaša postrani, a širina školjke je fizična " +
          "meja, ki se je ne da obiti.",
        "Tretje je elektrika. Bazen potrebuje svoj odklopnik in zaščitno stikalo; koliko " +
          "natanko, je odvisno od grelca in števila črpalk v modelu. Za vsak model damo pisna " +
          "navodila, ki jih vaš elektrikar preprosto izvede.",
        "Šele četrto je model — koliko oseb, koliko šob, kakšna ležalna pozicija. Ta izbira je " +
          "prijetna in jo lahko naredite v miru; prve tri pa določijo, kaj je sploh mogoče.",
      ],
    },
    {
      kind: "prose",
      h: "Koliko stane masažni bazen: nakup in obratovanje",
      p: [
        "Nakupna cena je na straneh modelov in vključuje dostavo, priklop in zagon. Kar cena " +
          "modela ne vključuje, je priprava podlage in elektroinštalacija na vaši strani.",
        "Pri obratovanju sta glavni postavki ogrevanje in filtracija. Obe sta odvisni od stvari, " +
          "ki jih ne moremo napovedati namesto vas: kako pogosto bazen uporabljate, na kateri " +
          "temperaturi ga držite, kako dobro je pokrit in kakšna je vaša cena elektrike. Zato " +
          "nikjer ne navajamo mesečnega zneska — vsaka taka številka bi bila ugibanje.",
        "Kar zanesljivo drži: dobro pokrit bazen porabi bistveno manj kot slabo pokrit, in " +
          "termopokrov je zato prvi in ne zadnji dodatek.",
      ],
    },
    {
      kind: "prose",
      h: "Masažni bazen pozimi",
      p: [
        "Bazen pozimi dela in se uporablja — to je zanj najboljši letni čas. Voda ostane topla, " +
          "izolacija školjke in pokrov pa opravita večino dela.",
        "Praznjenje čez zimo je pogosta napaka. Prazen bazen v mrazu je bolj ogrožen kot poln in " +
          "delujoč, ker v ceveh in črpalkah ostane voda. Če bazena res ne boste uporabljali, " +
          "mora biti pripravljen za zimo pravilno — povejte nam in vam razložimo postopek za " +
          "vaš model.",
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
