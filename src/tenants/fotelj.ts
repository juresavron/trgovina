import type { ShopConfig } from "./types";

/**
 * Shop #4 — massage chairs. Launch product: 4D SL-track chair
 * (1.50 m³ · two_man · landed €716 — docs/CATALOG.md). Wears ZARJA with a
 * bronze accent — same theme as savna, different hue and composition:
 * the catalog's proof that themes are shared and shops stay distinct.
 *
 * ⚠️ DOMAIN IS A PLACEHOLDER until registered (10082 doctrine).
 */
export const fotelj: ShopConfig = {
  key: "fotelj",
  domain: "masazni-fotelj.si",
  siteUrl: "https://masazni-fotelj.si",
  name: "Masažni Fotelj",
  wordmark: ["Masažni", "Fotelj"],
  live: false,

  keyword: {
    primary: "masažni fotelj",
    accusative: "masažni fotelj",
    plural: "masažni fotelji",
    category: "masažni fotelji",
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
    accentHue: 30, // bronze — used as punctuation on studio's monochrome
    accentChroma: 0.11,
    themeColor: "#ffffff",
    /**
     * A massage chair is bought on how it feels, and nobody can feel it
     * through a screen — so other people's experience does the work that a
     * showroom would, directly under the models.
     *
     * Six shops now share one theme, so this order is what keeps them from
     * rendering the same page (docs/SEO.md §6).
     */
    composition: ["hero", "marquee", "products", "reviews", "moat", "stats", "guides", "trust"],
  },

  // FILL BEFORE LIVE.
  contact: {
    phone: "+386 00 000 000",
    email: "info@masazni-fotelj.si",
    address: { street: "TODO", zip: "0000", city: "TODO" },
  },
  company: {
    legalName: "TODO d.o.o.",
    vatId: "SI00000000",
  },

  stripe: { statementDescriptor: "MASAZNI-FOTELJ.SI" },

  socials: {},

  routeSlugs: {
    "/": "/",
    "/products": "/fotelji",
    "/product": "/fotelj",
    "/compare": "/primerjava",
    "/guide": "/vodnik",
    "/guides": "/vodniki",
    "/delivery": "/dostava-in-montaza",
    "/showroom": "/razstavni-salon",
    "/financing": "/financiranje",
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
