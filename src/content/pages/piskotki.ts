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
 * ZEKom-2 requires consent before non-essential cookies are set, and a notice
 * that has drifted from the code is worse than no notice.
 *
 * RE-VERIFIED at audit, and here is what was actually run, so the next person
 * can repeat it rather than trust it:
 *
 *   - document.cookie / localStorage / sessionStorage / indexedDB / Set-Cookie
 *     across src/ and public/ — the only hits are src/admin/session.ts, which
 *     is the operator's own login and never reached by a shop visitor, and
 *     this file's own comment.
 *   - gtag / Google Analytics / GTM / Plausible / Matomo / Fathom / Hotjar /
 *     Meta pixel / Clarity / Segment — none.
 *   - every http(s) origin in the shipped source. fonts.googleapis.com and
 *     fonts.gstatic.com appear only in render/page.ts's fontLinks(), on the
 *     branch for themes OTHER than studio; this shop is studio, which serves
 *     its ten faces from /fonts (themes/studio/fonts.ts). deploy-smoke.test.ts
 *     asserts the shipped page reaches no third-party font origin.
 *   - the photographs. They look like Supabase but are served same-origin
 *     through the Worker's /media proxy (themes/studio/own-media.ts), so the
 *     "no request to a third party" sentence below holds for images too.
 *
 * ⚠️ THE SELF-HOSTED-FONT CLAIM IS THEME-DEPENDENT. It is true because this
 * shop wears studio. A shop on any other theme in THEME_CATALOG would load
 * Google Fonts and this page would be wrong about it on that shop's domain.
 */
export const COOKIES: Page = {
  key: "/cookies",
  h1: "Piškotki",
  lead: "Ta spletna stran ne uporablja piškotkov in ne meri obiska.",
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
        "Pisave, slog in slike se naložijo z našega strežnika, ne s tujih. Zato vaš " +
          "brskalnik ob obisku ne pošlje nobene zahteve tretjemu ponudniku, ki bi lahko " +
          "zabeležil vaš naslov IP. Vaš naslov IP obdela le ponudnik gostovanja te " +
          "strani, kot piše v izjavi o zasebnosti.",
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
          "zahteve, med njimi naslov IP. To je nujno za delovanje in varnost storitve in ni " +
          "piškotek; teh zapisov ne uporabljamo za profiliranje in jih ne povezujemo z vašim " +
          "povpraševanjem.",
      ],
    },
    { kind: "contact", h: "Vprašanja o zasebnosti" },
    {
      kind: "cta",
      h: "Kaj pa osebni podatki?",
      p: "Kdo je upravljavec, kaj obdelujemo, na kateri podlagi in kakšne pravice imate.",
      label: "Zasebnost",
      href: "/zasebnost",
    },
  ],
};
