import type { ShopConfig } from "./types";

/**
 * Pilot shop #2 — the cryotherapy chamber store. CRISP design mode: grotesk
 * display, glacial near-white surfaces, cold cyan accent, fog photography.
 *
 * Cryo chambers are the network's heaviest fulfilment case: white-glove
 * freight is MANDATORY (a chamber needs siting, power verification and
 * commissioning — nobody kerbside-drops one), which is why the freight
 * engine lets a product class force installation into every quote.
 *
 * ⚠️ DOMAIN IS A PLACEHOLDER until registered — same 10082 doctrine as savna.
 */
export const krio: ShopConfig = {
  key: "krio",
  domain: "kriokomora.si",
  siteUrl: "https://kriokomora.si",
  name: "Kriokomora",
  wordmark: ["Krio", "komora"],
  live: false,

  keyword: {
    primary: "kriokomora",
    accusative: "kriokomoro",
    plural: "kriokomore",
    category: "krioterapija",
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
    mode: "crisp",
    accentHue: 225, // glacial cyan-blue
    accentChroma: 0.1,
    themeColor: "#f8fafc",
  },

  // FILL BEFORE LIVE — launch-readiness gates check these are non-placeholder.
  contact: {
    phone: "+386 00 000 000",
    email: "info@kriokomora.si",
    address: { street: "TODO", zip: "0000", city: "TODO" },
  },
  company: {
    legalName: "TODO d.o.o.",
    vatId: "SI00000000",
  },

  stripe: { statementDescriptor: "KRIOKOMORA.SI" },

  socials: {},

  routeSlugs: {
    "/": "/",
    "/products": "/kriokomore",
    "/product": "/kriokomora",
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
