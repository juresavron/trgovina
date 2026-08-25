import type { Page } from "../pages";

export const CONTACT: Page = {
  key: "/contact",
  h1: "Kontakt",
  lead:
    "Pokličite ali pišite. Na vprašanja o merah, dostopu in priklopu odgovorimo takoj, " +
    "za ponudbo pa potrebujemo le naslov in nekaj fotografij prostora.",
  metaDescription:
    "Kontakt za masažne bazene in swim spa bazene — telefon, e-pošta in naslov. " +
    "Svetovanje pred nakupom, ogled lokacije in dogovor za dostavo.",
  blocks: [
    { kind: "contact", h: "Kako do nas" },
    {
      kind: "prose",
      h: "Kaj nam povejte",
      p: [
        "Če že veste, kam bi bazen postavili, nam to opišite — kraj, nadstropje ali teraso, " +
          "širino najožjega prehoda in kako daleč je do električne omarice. S temi podatki lahko " +
          "povemo, ali je model izvedljiv, še preden se dogovorimo za ogled.",
        "Fotografija prostora in poti do njega pove več kot dolg opis. Pošljite jo po e-pošti.",
      ],
    },
    {
      kind: "steps",
      h: "Kaj sledi",
      items: [
        ["Odgovor", "Na klic in e-pošto odgovorimo v enem delovnem dnevu."],
        ["Ogled lokacije", "Brezplačen. Preverimo dostop, podlago in električni priklop."],
        ["Ponudba", "Model, dostava, priklop in zagon — vse v eni številki, brez naknadnih postavk."],
      ],
    },
    { kind: "imprint" },
  ],
};
