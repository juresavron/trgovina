import type { Page } from "../pages";

/**
 * The 14-day right of withdrawal, which is statutory: Directive 2011/83/EU as
 * transposed by ZVPot-1. Everything here that states a right, a deadline or a
 * consequence comes from the statute, not from a commercial decision — so it
 * is safe to write without the owner, unlike the terms, which need the
 * company's own choices.
 *
 * The one thing deliberately NOT claimed is an exemption. Whether an installed
 * hot tub falls under a withdrawal exception depends on facts about the
 * particular sale, and asserting an exemption that does not apply is exactly
 * the kind of statement a consumer relies on to their loss. So the page states
 * the right plainly and says the return of an installed unit is arranged with
 * us — which is true, and does not take a right away.
 *
 * FOUR STATUTORY POINTS WERE MISSING and have been added, all of them from
 * the directive rather than from a commercial decision:
 *
 *   - the twelve-month extension where the consumer was never told about the
 *     right, and the fresh 14 days from a late notice (Article 10);
 *   - the refund of the delivery charge the consumer paid, capped at the
 *     trader's ordinary delivery (Article 13(2));
 *   - WHEN the return cost has to be disclosed. Article 6(1)(i) requires it
 *     BEFORE the contract for goods that cannot go back by post, and Article
 *     6(6) says the consumer does not bear it if that was not done. The page
 *     used to promise the figure "before we collect", which is after the
 *     contract and therefore too late to bind the customer to it. It now goes
 *     in the written offer, which is where every other figure on this site
 *     lives anyway;
 *   - the goods may be inspected as they would be in a shop, which is the
 *     concrete meaning of the diminished-value rule and the sentence
 *     customers actually ask about.
 *
 * The masses in the collection step are the supplier's own (catalog/pola.ts,
 * catalog/swimspa.ts): 300–410 kg dry for the hot tubs, 1.050–1.430 kg for
 * the swim spas.
 */
export const WITHDRAWAL: Page = {
  key: "/withdrawal",
  h1: "Odstop od pogodbe",
  lead:
    "Pri nakupu na daljavo imate kot potrošnik 14 dni časa, da odstopite od pogodbe, " +
    "ne da bi vam bilo treba navesti razlog.",
  metaDescription:
    "Pravica do odstopa od pogodbe v 14 dneh pri nakupu na daljavo: rok, postopek, " +
    "vračilo plačila in obrazec za odstop.",
  legal: true,
  blocks: [
    {
      kind: "prose",
      h: "Rok",
      p: [
        "Rok za odstop je 14 dni od dneva, ko blago prevzamete vi ali tretja oseba, ki jo za " +
          "to določite in ni prevoznik. Če v enem naročilu prejmete več kosov blaga ločeno, " +
          "teče rok od prevzema zadnjega. Za pravočasnost šteje datum, ko obvestilo o odstopu " +
          "pošljete — ne datum, ko ga prejmemo.",
        "Če vas o pravici do odstopa ne bi obvestili, se rok podaljša za dvanajst mesecev. " +
          "Če vas obvestimo naknadno, teče 14-dnevni rok od dneva, ko obvestilo prejmete.",
        "Pravica velja za potrošnike, torej fizične osebe, ki blaga ne kupujejo za opravljanje " +
          "dejavnosti. Za pravne osebe se uporabljajo pogoji poslovanja.",
      ],
    },
    {
      kind: "steps",
      h: "Postopek",
      items: [
        [
          "Obvestite nas",
          "Z nedvoumno izjavo po e-pošti ali po pošti. Razloga vam ni treba navesti. " +
            "Lahko uporabite obrazec spodaj, ni pa obvezen.",
        ],
        [
          "Dogovorimo se za prevzem",
          "Blago je pretežko za pošiljanje — masažni bazen tehta od 300 do 410 kilogramov, " +
            "swim spa več kot tono — in je ob odstopu praviloma že priklopljeno. Zato ga ne " +
            "vračate sami: odvoz izvedemo mi, po dogovoru.",
        ],
        [
          "Vrnemo plačilo",
          // ⚠️ NO WITHHOLDING SENTENCE HERE, and one stood here once. Art.
          // 13(3) of Directive 2011/83 lets a trader withhold the refund
          // until the goods are back — UNLESS the trader has offered to
          // collect them, which is exactly what the step above promises.
          // Claiming both was asserting a right the offer had signed away.
          "Najkasneje v 14 dneh od prejema obvestila o odstopu, z istim plačilnim sredstvom, " +
            "kot ste plačali, in brez dodatnih stroškov za vas. Vrnemo tudi stroške dostave, " +
            "ki ste jih plačali; če ste izbrali dražjo obliko dostave od naše običajne, " +
            "razlike ne vrnemo.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Stroški in stanje blaga",
      p: [
        "Neposredne stroške vračila blaga nosi potrošnik, razen če se dogovorimo drugače. Ker " +
          "gre za blago, ki ga zaradi teže in velikosti ni mogoče vrniti po pošti, vam višino " +
          "teh stroškov navedemo v pisni ponudbi, torej preden pogodbo sklenete. Če vam višine " +
          "ne bi sporočili pred sklenitvijo pogodbe, teh stroškov ne nosite vi.",
        "Odgovarjate za zmanjšanje vrednosti blaga, če je posledica ravnanja, ki ni nujno za " +
          "ugotovitev narave, lastnosti in delovanja blaga. Bazen torej lahko pregledate in " +
          "preizkusite tako, kot bi ga v trgovini.",
        "Ta pravica ne posega v vaše pravice iz naslova neskladnosti blaga, ki veljajo ločeno " +
          "in dlje — za neskladnost, ki se pokaže v dveh letih od dobave, odgovarjamo kot " +
          "prodajalec.",
      ],
    },
    {
      kind: "facts",
      h: "Obrazec za odstop",
      rows: [
        ["Naslovnik", "Prodajalec, naveden med podatki o podjetju spodaj"],
        ["Izjava", "S tem sporočam, da odstopam od pogodbe za nakup naslednjega blaga"],
        ["Navedite", "Naročeno dne / prejeto dne · Ime in priimek potrošnika · Naslov potrošnika"],
        ["Podpis", "Podpis potrošnika (samo, če se obrazec pošlje na papirju) in datum"],
      ],
    },
    { kind: "imprint", h: "Podatki o prodajalcu" },
    { kind: "contact", h: "Kam pošljete odstop" },
    {
      kind: "cta",
      h: "Preostali pogoji",
      p: "Kako nastane pogodba, kaj cena vključuje in kako uveljavljate neskladnost blaga.",
      label: "Pogoji poslovanja",
      href: "/pogoji-poslovanja",
    },
  ],
};
