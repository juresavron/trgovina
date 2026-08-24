import type { ShopConfig } from "./types";

/**
 * Pilot shop #1 — the sauna store. WARM design mode: Fraunces display,
 * charcoal surfaces, ember accent, cedar photography.
 *
 * ⚠️ DOMAIN IS A PLACEHOLDER until registered. Register FRESH — never an
 * expired/aged domain (named Google spam vector, per onlyworld DEPLOY.md) —
 * and never add it to wrangler routes before the zone reads Active in OUR
 * Cloudflare account: routing an unowned zone fails the whole network's
 * deploy with error 10082.
 */
export const savna: ShopConfig = {
  key: "savna",
  domain: "finskasavna.si",
  siteUrl: "https://finskasavna.si",
  name: "Finska Savna",
  wordmark: ["Finska", "Savna"],
  live: false,

  keyword: {
    primary: "finska savna",
    accusative: "finsko savno",
    plural: "finske savne",
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
    mode: "warm",
    accentHue: 55, // ember amber
    accentChroma: 0.12,
    themeColor: "#1c1917",
  },

  // FILL BEFORE LIVE — launch-readiness gates check these are non-placeholder.
  contact: {
    phone: "+386 00 000 000",
    email: "info@finskasavna.si",
    address: { street: "TODO", zip: "0000", city: "TODO" },
  },
  company: {
    legalName: "TODO d.o.o.",
    vatId: "SI00000000",
  },

  stripe: { statementDescriptor: "FINSKASAVNA.SI" },

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
