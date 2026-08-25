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
        "Rok za odstop je 14 dni od dneva, ko blago prevzamete vi ali oseba, ki jo za to " +
          "določite. Za pravočasnost šteje datum, ko obvestilo o odstopu pošljete — ne datum, " +
          "ko ga prejmemo.",
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
          "Bazen tehta več sto kilogramov in je praviloma priklopljen, zato vračila ne " +
            "pošiljate sami — odvoz izvedemo mi, po dogovoru.",
        ],
        [
          "Vrnemo plačilo",
          "Najkasneje v 14 dneh od prejema obvestila o odstopu, z istim plačilnim sredstvom, " +
            "kot ste plačali. Vračilo lahko zadržimo do prevzema blaga.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Stroški in stanje blaga",
      p: [
        "Neposredne stroške vračila blaga nosi potrošnik, razen če se dogovorimo drugače. " +
          "Ker gre za blago, ki ga zaradi teže ni mogoče vrniti po pošti, vam višino teh " +
          "stroškov sporočimo, preden odvoz izvedemo.",
        "Odgovarjate za zmanjšanje vrednosti blaga, če je posledica ravnanja, ki ni nujno za " +
          "ugotovitev narave, lastnosti in delovanja blaga.",
        "Ta pravica ne posega v vaše pravice iz naslova neskladnosti blaga, ki veljajo ločeno " +
          "in dlje.",
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
  ],
};
