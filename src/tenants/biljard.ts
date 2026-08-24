import type { ShopConfig } from "./types";

/**
 * Shop #6 — slate billiard tables.
 *
 * Market thesis, and the one the research itself flags as contested
 * (docs/CATALOG.md): German shops DO ship here at ~€350 flat, four-plus
 * incumbents already serve a 2.1M market, and biljardshop.eu already carries a
 * Chinese factory brand. The freight fence is low.
 *
 * So the differentiator is the sentence the research ends on: "the moat is the
 * fitter, not the freight." A three-piece slate bed has to be carried in,
 * assembled, levelled to a fraction of a millimetre and re-clothed — and that
 * is why this shop ships as **white_glove**, the freight class where
 * installation is inside the class and cannot be declined (src/lib/freight.ts).
 * Selling the table without owning the fitter is the failure mode; encoding it
 * in the freight class is how we refuse to.
 *
 * Wears ZARJA with a baize-green accent: a games room is an evening room.
 *
 * ⚠️ DOMAIN IS A PLACEHOLDER until registered (10082 doctrine, wrangler.jsonc).
 */
export const biljard: ShopConfig = {
  key: "biljard",
  domain: "biljardna-miza.si",
  siteUrl: "https://biljardna-miza.si",
  name: "Biljardna Miza",
  wordmark: ["Biljardna", "Miza"],
  live: false,

  keyword: {
    primary: "biljardna miza",
    accusative: "biljardno mizo",
    plural: "biljardne mize",
    category: "biljard",
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
    accentHue: 150, // baize green against zarja's near-black
    accentChroma: 0.1,
    themeColor: "#171210",
    /**
     * The first question is never which table — it is whether the room can
     * take one. The clearance guide has to come before the models or half
     * the traffic bounces on a spec it never found.
     *
     * Six shops now share one theme, so this order is what keeps them from
     * rendering the same page (docs/SEO.md §6).
     */
    composition: ["hero", "marquee", "guides", "products", "moat", "stats", "reviews", "trust"],
  },

  // FILL BEFORE LIVE.
  contact: {
    phone: "+386 00 000 000",
    email: "info@biljardna-miza.si",
    address: { street: "TODO", zip: "0000", city: "TODO" },
  },
  company: {
    legalName: "TODO d.o.o.",
    vatId: "SI00000000",
  },

  stripe: { statementDescriptor: "BILJARDNA-MIZA.SI" },

  socials: {},

  routeSlugs: {
    "/": "/",
    "/products": "/mize",
    "/product": "/miza",
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
