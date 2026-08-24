import type { ShopConfig } from "./types";

/**
 * Shop #1 — infrared saunas. Two launch products (2p · 1.45 m³ · pallet,
 * 4p · 2.20 m³ · pallet_xl), landed costs €605/€653 — see docs/CATALOG.md.
 * Wears ZARJA (ember editorial) with an amber accent.
 *
 * ⚠️ DOMAIN IS A PLACEHOLDER until registered. Fresh registration only;
 * never route a zone that is not Active in OUR Cloudflare account (10082).
 */
export const savna: ShopConfig = {
  key: "savna",
  domain: "infrardeca-savna.si",
  siteUrl: "https://infrardeca-savna.si",
  name: "Infrardeča Savna",
  wordmark: ["Infra", "Savna"],
  live: false,

  keyword: {
    primary: "infrardeča savna",
    accusative: "infrardečo savno",
    plural: "infrardeče savne",
    category: "savne",
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
    accentHue: 55, // ember amber
    accentChroma: 0.12,
    themeColor: "#171210",
    /**
     * A sauna is a considered ritual purchase and the objection is never the
     * product, it is "who carries it up my stairs and plugs it in". The
     * delivery promise therefore runs before the models.
     *
     * Six shops now share one theme, so this order is what keeps them from
     * rendering the same page (docs/SEO.md §6).
     */
    composition: ["hero", "marquee", "moat", "products", "stats", "reviews", "guides", "trust"],
  },

  // FILL BEFORE LIVE — launch-readiness gates check these are non-placeholder.
  contact: {
    phone: "+386 00 000 000",
    email: "info@infrardeca-savna.si",
    address: { street: "TODO", zip: "0000", city: "TODO" },
  },
  company: {
    legalName: "TODO d.o.o.",
    vatId: "SI00000000",
  },

  stripe: { statementDescriptor: "INFRARDECA-SAVNA.SI" },

  socials: {},

  routeSlugs: {
    "/": "/",
    "/products": "/savne",
    "/product": "/savna",
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
