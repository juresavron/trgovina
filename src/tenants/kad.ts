import type { ShopConfig } from "./types";

/**
 * Shop #2 — cold plunge tubs. Launch product: plunge with chiller
 * (1.50 m³ · two_man · landed €991 — docs/CATALOG.md). Wears LEDNIK
 * (glacial precision) with an ice-blue accent.
 *
 * ⚠️ DOMAIN IS A PLACEHOLDER until registered (10082 doctrine).
 */
export const kad: ShopConfig = {
  key: "kad",
  domain: "ledena-kad.si",
  siteUrl: "https://ledena-kad.si",
  name: "Ledena Kad",
  wordmark: ["Ledena", "Kad"],
  live: false,

  keyword: {
    primary: "ledena kad",
    accusative: "ledeno kad",
    plural: "ledene kadi",
    category: "hladna terapija",
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
    accentHue: 225, // glacial blue
    accentChroma: 0.1,
    themeColor: "#f3f6f9",
    /**
     * Cold plunge buyers arrive with numbers in mind — chiller capacity, hold
     * temperature, draw. Specs lead; the models make sense only after them.
     *
     * Six shops now share one theme, so this order is what keeps them from
     * rendering the same page (docs/SEO.md §6).
     */
    composition: ["hero", "marquee", "stats", "products", "moat", "reviews", "guides", "trust"],
  },

  // FILL BEFORE LIVE.
  contact: {
    phone: "+386 00 000 000",
    email: "info@ledena-kad.si",
    address: { street: "TODO", zip: "0000", city: "TODO" },
  },
  company: {
    legalName: "TODO d.o.o.",
    vatId: "SI00000000",
  },

  stripe: { statementDescriptor: "LEDENA-KAD.SI" },

  socials: {},

  routeSlugs: {
    "/": "/",
    "/products": "/ledene-kadi",
    "/product": "/kad",
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
