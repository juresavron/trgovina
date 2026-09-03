import type { ShopConfig } from "./types";

/**
 * Shop #3 — acrylic hot tubs. Launch product: 5-person acrylic tub
 * (4.40 m³ · pallet_xl · landed €737 — docs/CATALOG.md). Wears SALON
 * (bright gallery) with a warm aqua accent.
 *
 * ⚠️ DOMAIN IS A PLACEHOLDER until registered (10082 doctrine).
 */
export const bazen: ShopConfig = {
  key: "bazen",
  // BRAND AND DOMAIN, chosen together.
  //
  // masazni-bazen.si is somebody else's — it resolves to 212.44.105.63 and
  // serves a site — which is why the shop needed a name of its own rather
  // than the bare category. "Vrelec" is the spring where warm water rises
  // out of the ground, which is the thing being sold, and putting it after
  // the category keeps the exact keyword in the domain while making the
  // whole string ownable.
  //
  // Hyphenated deliberately. Search engines treat a hyphen as a word
  // separator and a run-together string as one token, so
  // masaznibazenivrelec reads as a single nonsense word to a crawler and as
  // a spam domain to a person; masazni-bazeni-vrelec reads as three.
  domain: "masazni-bazeni-vrelec.si",
  siteUrl: "https://masazni-bazeni-vrelec.si",
  // ⚠️ THE OWNER ALSO REGISTERED THE RUN-TOGETHER SPELLING, which is the one
  // the note above argues against. Both are now owned, and owning both is the
  // right end state whichever wins: the loser must never resolve to somebody
  // else's site, and it must never serve these pages either.
  //
  // So it redirects. One host serves, every other spelling answers 301 to the
  // same path on it — see aliasDomains in tenants/types.ts for why a canonical
  // link tag is not enough on its own.
  //
  // WHICH ONE IS CANONICAL IS THIS PAIR OF LINES, and the shop is not live
  // yet, so the swap is still free. Moving it after launch means asking a
  // crawler to transfer a reputation it has already attached to a host.
  aliasDomains: ["masaznibazenivrelec.si"],
  name: "Masažni bazeni Vrelec",
  // The lockup splits category from brand so the mark can weight them
  // differently — the words carry the keyword, the second half carries the
  // identity. See markHtml() in themes/studio/chrome.ts.
  wordmark: ["Masažni bazeni", "Vrelec"],
  live: false,
  // Orders arrive by telephone and e-mail, which is what /kosarica has always
  // said. Until that changes the storefront asks for an enquiry rather than
  // offering a basket it cannot fill — see ordersOnline in tenants/types.ts.
  ordersOnline: false,

  // THE GOOGLE RATING, AS THE OWNER READ IT.
  //
  // 24 five-star and 10 four-star reviews: 34 in all, summing to 160, mean
  // 4.7059 — 4,7 as one decimal, which is the figure Google displays and the
  // one printed here. The stars round to five and the exact number sits
  // beside them, so nothing rounds in the shop's favour on its own.
  //
  // ⚠️ NO PROFILE URL YET, AND THE LINE IS WEAKER FOR IT. With one the whole
  // line becomes an anchor and the rating is a quotation a visitor can check
  // in one press; without one it is the shop stating its own rating and
  // naming where it lives. Add the link the moment it is to hand — it is a
  // one-field edit and it is the difference between "we are rated 4,7" and
  // "here is where that number lives".
  //
  // asOf is the day these were read. It is rendered, so it is also the cue
  // to re-read the profile: reviews accumulate and this number will drift.
  googleRating: {
    score: 4.7,
    count: 34,
    asOf: "2026-08-30",
  },

  keyword: {
    primary: "masažni bazen",
    accusative: "masažni bazen",
    plural: "masažni bazeni",
    category: "bazeni",
  },

  locale: {
    lang: "sl",
    hreflang: "sl-SI",
    ogLocale: "sl_SI",
    intl: "sl-SI",
  },

  currency: "EUR",
  vat: { country: "SI", standardRate: 22 },
  timezone: "Europe/Ljubljana",
  addressCountry: "SI",

  design: {
    theme: "studio",
    // ⚠️ WARM, AND THE COMMENT HERE USED TO SAY "warm aqua" ABOUT A CYAN.
    // Hue 200 at chroma 0.09 is #33969b — a greyed sky-cyan, and the single
    // most predictable colour a hot-tub shop can pick: every competitor in
    // this market (Bluewater, Waterwave, the whole blue-gradient-droplet
    // trade) is already there, so the one place this brand spent colour, it
    // spent it on the category's own cliché.
    //
    // Hue 48 at 0.14 is #b4561a. The product is hot water and "vrelec" is a
    // thermal spring; the palette's only colour was cold. It is also the only
    // warm accent in the Slovenian field, which is a difference visible in a
    // result-page thumbnail, and it carries more contrast on every ground
    // (see the rungs in tokens.ts).
    //
    // Two numbers. Reverting is two numbers.
    accentHue: 48,
    accentChroma: 0.14,
    // The chrome bar is what sits under the browser UI on a phone, so this
    // matches --ink-invert rather than a cream that appears nowhere.
    themeColor: "#151515",
    /**
     * The largest ticket and the biggest installation. Models first, because
     * the buyer is still choosing a size, then delivery and the trust block
     * before anything technical.
     *
     * Six shops now share one theme, so this order is what keeps them from
     * rendering the same page (docs/SEO.md §6).
     */
    composition: ["hero", "marquee", "products", "moat", "trust", "stats", "reviews", "guides"],
  },

  // ⚠️ SUPPLIED BY THE OWNER. Every one of these is a claim this shop makes
  // about who and where it is — on the imprint, on the terms, as the GDPR
  // controller, and as machine-readable structured data to Google — so none
  // of it was ever going to be filled in from anywhere but the owner's own
  // words. See src/lib/filled.ts for the predicates that kept the site honest
  // while they were blank: a placeholder phone is not rendered as a dialable
  // link, and an unset address is printed as "podatek še ni vpisan" rather
  // than published as TODO.
  //
  // The VAT id is STILL A PLACEHOLDER and the imprint still says so. It is
  // the last unset identity field.
  contact: {
    phone: "+386 40 202 488",
    email: "info@masazni-bazeni-vrelec.si",
    // ⚠️ THE SEAT IS ŠKOFIJE, NOT KOPER, and this field said Koper until the
    // owner sent the AJPES record on 31 Aug 2026.
    //
    // It carried "Ferrarska ulica 30, 6000 Koper" — a real street, spelt
    // right after one correction, and the wrong address. The register gives
    // Zgornje Škofije 4A, 6281 Škofije as the company's seat, and the seat is
    // what ZGD-1 and ZEPT put on the web pages: it is also the address the
    // 14-day withdrawal notice sends goods back to, so an imprint address
    // that does not match the register is not a typo, it is a notice that
    // does not work.
    //
    // Nothing else in the codebase held a copy — every page reads this one
    // field — so the correction is this literal and no other.
    address: { street: "Zgornje Škofije 4A", zip: "6281", city: "Škofije" },
  },
  company: {
    // The registered entity, which is NOT the brand — normal, and exactly
    // why the imprint reads from this field rather than from shop.name. The
    // terms, the withdrawal notice and the privacy notice all identify the
    // company by it, so it is this string a customer would sue.
    legalName: "Mediašped d.o.o.",
    // FROM THE OWNER'S OWN AJPES/Bizi RECORD, supplied 31 Aug 2026. Both were
    // placeholders until then and the imprint printed "podatek še ni vpisan"
    // in their place.
    //
    // The matična številka. Ten digits, and it is the number ZGD-1 čl. 45
    // means by "številka registrskega vpisa" for a d.o.o.
    regNumber: "5327784000",
    // The registrar, confirmed by the owner. čl. 45 wants the register a
    // company is entered in as well as the number, and the number is the
    // matična številka above.
    //
    // NO "vl. št." YET. The type's own note gives the fuller form —
    // "Okrožno sodišče v Kopru, vl. št. …" — and the entry number is not on
    // the extract that was sent. The court alone satisfies the requirement
    // to name the register, and appending the entry number later is a
    // one-string change; inventing one would not be.
    register: "Okrožno sodišče v Kopru",
    // The VAT id, confirmed by the same extract: "Zavezanec za DDV: Da
    // (SI53828305)", davčna številka 53828305. This was the last identity
    // field the imprint was inventing a placeholder for.
    vatId: "SI53828305",
  },

  // What a customer sees on their card statement. It has to be recognisable
  // months later next to a EUR 8,000 line, so it is the brand rather than
  // the registered company nobody bought from.
  stripe: { statementDescriptor: "BAZENI VRELEC" },

  socials: {},

  routeSlugs: {
    "/": "/",
    "/products": "/trgovina",
    "/product": "/bazen",
    "/compare": "/primerjava",
    "/guide": "/vodnik",
    "/guides": "/vodniki",
    // "izbira" over "svetovalec" or "kviz": it names the OUTCOME (a choice
    // made), not the mechanism, and it is the word the page's own question
    // uses — "Kateri bazen je pravi za vas?"
    "/finder": "/izbira",
    // "blog" is the Slovenian word too, and it is what a reader looks for in
    // a nav. /novice would be news and /nasveti would promise advice on every
    // post; neither is what this is.
    "/blog": "/blog",
    "/delivery": "/dostava-in-montaza",
    // ⚠️ THE KEY SAYS SHOWROOM AND THE SHOP HAS NONE. The internal key is
    // the network's route vocabulary and is not worth churning across six
    // files on launch eve; what it POINTS AT is the free site visit, which
    // is what this shop actually offers. See content/pages/salon.ts for why
    // the showroom claim was removed rather than softened.
    "/showroom": "/ogled-lokacije",
    "/about": "/o-nas",
    "/contact": "/kontakt",
    "/faq": "/pogosta-vprasanja",
    "/cart": "/kosarica",
    "/checkout": "/blagajna",
    "/order-success": "/narocilo-uspesno",
    "/terms": "/pogoji-poslovanja",
    "/privacy": "/zasebnost",
    "/cookies": "/piskotki",
    "/withdrawal": "/odstop-od-pogodbe",
  },
};
