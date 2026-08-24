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
  domain: "masazni-bazen.si",
  siteUrl: "https://masazni-bazen.si",
  name: "Masažni Bazen",
  wordmark: ["Masažni", "Bazen"],
  live: false,

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
    accentHue: 200, // warm aqua
    accentChroma: 0.09,
    themeColor: "#faf7f2",
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

  // FILL BEFORE LIVE.
  contact: {
    phone: "+386 00 000 000",
    email: "info@masazni-bazen.si",
    address: { street: "TODO", zip: "0000", city: "TODO" },
  },
  company: {
    legalName: "TODO d.o.o.",
    vatId: "SI00000000",
  },

  stripe: { statementDescriptor: "MASAZNI-BAZEN.SI" },

  socials: {},

  routeSlugs: {
    "/": "/",
    "/products": "/bazeni",
    "/product": "/bazen",
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
