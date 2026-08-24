import type { ShopConfig } from "./types";

/**
 * Shop #5 — freestanding stone-resin baths.
 *
 * Market thesis (docs/CATALOG.md): badshop.de does not serve SI/HR at all, and
 * a 170 kg cast-marble tub is exactly the delivery nobody wants to make — two
 * people, up a staircase, with a fragile surface. Every property that makes it
 * hard to ship makes it hard to compete with us. Freight class is two_man; the
 * cluster (savna / kad / bazen / kopalna) shares a buyer, a crew and a lane.
 *
 * SKU discipline is the whole margin: stone resin only. Acrylic at $192-350
 * FOB is pallet-able and commoditised — pallet-able means the Germans ship it.
 *
 * Wears SALON: a sculptural freestanding tub is a gallery object, and salon's
 * arches and cream ground are built for exactly that.
 *
 * ⚠️ DOMAIN IS A PLACEHOLDER until registered (10082 doctrine, wrangler.jsonc).
 */
export const kopalna: ShopConfig = {
  key: "kopalna",
  domain: "prostostojeca-kad.si",
  siteUrl: "https://prostostojeca-kad.si",
  name: "Prostostoječa Kad",
  wordmark: ["Prostostoječa", "Kad"],
  live: false,

  keyword: {
    primary: "prostostoječa kad",
    accusative: "prostostoječo kad",
    plural: "prostostoječe kadi",
    category: "kopalniške kadi",
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
    theme: "salon",
    accentHue: 25, // travertine / warm stone
    accentChroma: 0.08,
    themeColor: "#faf7f1",
  },

  // FILL BEFORE LIVE.
  contact: {
    phone: "+386 00 000 000",
    email: "info@prostostojeca-kad.si",
    address: { street: "TODO", zip: "0000", city: "TODO" },
  },
  company: {
    legalName: "TODO d.o.o.",
    vatId: "SI00000000",
  },

  stripe: { statementDescriptor: "PROSTOSTOJECA-KAD" },

  socials: {},

  routeSlugs: {
    "/": "/",
    "/products": "/kadi",
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
