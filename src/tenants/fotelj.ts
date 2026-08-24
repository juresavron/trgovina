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
    theme: "zarja",
    accentHue: 30, // bronze / oxblood
    accentChroma: 0.11,
    themeColor: "#171210",
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
