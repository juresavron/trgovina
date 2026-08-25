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
  name: "Masažni bazeni Vrelec",
  // The lockup splits category from brand so the mark can weight them
  // differently — the words carry the keyword, the second half carries the
  // identity. See markHtml() in themes/studio/chrome.ts.
  wordmark: ["Masažni bazeni", "Vrelec"],
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

  // FILL BEFORE LIVE.
  contact: {
    phone: "+386 00 000 000",
    email: "info@masazni-bazeni-vrelec.si",
    address: { street: "TODO", zip: "0000", city: "TODO" },
  },
  company: {
    // The registered entity, which is NOT the brand — normal, and exactly
    // why the imprint reads from this field rather than from shop.name. The
    // terms, the withdrawal notice and the privacy notice all identify the
    // company by it, so it is this string a customer would sue.
    legalName: "Mediašped d.o.o.",
    // STILL MISSING, and the launch gate is still closed because of it:
    // ZGD-1 and ZEPT require the VAT number and the registered address on a
    // company's web pages, and the withdrawal notice needs an address to
    // send goods back to. legalPagesReady() reports false until both land.
    vatId: "SI00000000",
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
