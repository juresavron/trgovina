import type { Page } from "../pages";

/**
 * VERIFIED, NOT ASSUMED. Before this page was written the codebase was
 * searched for document.cookie, localStorage, analytics tags and third-party
 * script or font hosts. There are none: the Worker sets no cookie, the one
 * script is behaviour.ts (progressive enhancement, no storage), and the fonts
 * are self-hosted under public/fonts, so the page makes no third-party
 * requests at all.
 *
 * That is why this page says the site uses no cookies instead of reciting the
 * usual four categories with a consent banner attached. If tracking is ever
 * added, this page and a consent mechanism have to land in the SAME change —
 * ZInfP requires consent before non-essential cookies are set, and a notice
 * that has drifted from the code is worse than no notice.
 */
export const COOKIES: Page = {
  key: "/cookies",
  h1: "Piškotki",
  lead: "Ta spletna stran ne uporablja piškotkov in ne uporablja spletne analitike.",
  metaDescription:
    "Politika piškotkov: ta spletna stran ne nalaga piškotkov, ne uporablja analitike in " +
    "ne pošilja podatkov tretjim ponudnikom.",
  legal: true,
  blocks: [
    {
      kind: "prose",
      h: "Kaj to pomeni",
      p: [
        "Ob obisku te strani se v vaš brskalnik ne shrani noben piškotek. Ne merimo obiska, " +
          "ne uporabljamo oglaševalskih sledilnikov in ne vgrajujemo vsebin, ki bi vas " +
          "spremljale na drugih straneh.",
        "Pisave, slog in slike se naložijo z našega naslova, ne s tujih strežnikov. Zato ob " +
          "obisku ne nastane zahtevek proti tretjemu ponudniku, ki bi lahko zabeležil vaš " +
          "naslov IP.",
        "Ker piškotkov ni, tudi soglasja ni treba dajati in ni česa preklicati. Če bomo kdaj " +
          "uvedli merjenje obiska, bomo pred tem zaprosili za privolitev in to stran ustrezno " +
          "spremenili.",
      ],
    },
    {
      kind: "prose",
      h: "Kaj se vseeno zabeleži",
      p: [
        "Kot pri vsaki spletni strani strežnik ob dostavi strani obdela tehnične podatke " +
          "zahtevka, med njimi naslov IP. To je nujno za delovanje in varnost storitve in ni " +
          "piškotek; teh zapisov ne uporabljamo za profiliranje.",
      ],
    },
    { kind: "contact", h: "Vprašanja o zasebnosti" },
  ],
};
