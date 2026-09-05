import type { ShopConfig } from "./types";

/**
 * Shop #2 — nicotine-free caffeine pouches, supplied OEM/ODM by Geerlun.
 *
 * ⚠️ PRE-LIVE, AND EVERY PLACEHOLDER IN HERE IS MARKED. `live: false` means
 * worker.ts answers this shop's domain with 503 + noindex and serves no
 * sitemap, exactly as it did for the hot-tub shop until launch day. Nothing
 * below reaches a customer or a crawler until that flag flips, which is the
 * point: a shop can be built, audited and reviewed in the open without
 * publishing a claim nobody has confirmed.
 *
 * WHAT IS ACTUALLY KNOWN, and it is the supplier's own product art and
 * nothing else: six actives per pouch (catalog/pouches.ts carries the doses),
 * fifteen pouches to a tin, no nicotine and no tobacco, and one confirmed
 * flavour. Everything a shop normally states and this one cannot yet — price,
 * the rest of the flavours, who imports it, the mailbox — is either absent or
 * flagged here.
 *
 * ⚠️ THREE THINGS THE OWNER MUST SETTLE BEFORE `live` FLIPS, and none of them
 * is a code change this repository can make on its own:
 *
 *   1. THE DOMAIN BELOW IS NOT KNOWN TO BE REGISTERED. The hot-tub shop
 *      shipped with an unregistered domain in exactly this field and the
 *      result was not cosmetic: `domain` is the host that SERVES, so the one
 *      domain actually in Cloudflare redirected every visitor to a host that
 *      answered NXDOMAIN. Register the name, confirm the zone is Active, then
 *      put it here.
 *   2. CAFFEINE LABELLING. This is a food supplement carrying 50 mg of
 *      caffeine per pouch. What a Slovenian seller must display, and in what
 *      words, is a question for the owner's own advice — not for a renderer.
 *      Until it is answered content/vrecke.ts states the dose and makes no
 *      claim about who may take it.
 *   3. WHETHER IT SELLS ONLINE AT ALL. `ordersOnline: false` below is
 *      inherited from the hot-tub shop, where an enquiry IS the transaction
 *      because the ticket is five figures and every sale needs a site visit.
 *      A tin of pouches is the opposite kind of purchase and an enquiry form
 *      is the wrong instrument for it — but a basket that cannot take money
 *      is worse than one that is honestly closed, and no checkout exists yet
 *      (/kosarica says so in as many words). Flipping this needs a payment
 *      integration, not a boolean.
 */
export const vrecke: ShopConfig = {
  key: "vrecke",

  // ⚠️ BRAND AND DOMAIN ARE BOTH WORKING NAMES.
  //
  // Geerlun is the OEM/ODM manufacturer and "ALPHA" is the demo art on their
  // sample tin — neither is a brand this shop owns, and shipping either would
  // be selling somebody else's mark. So the placeholder follows the shape the
  // sibling shop settled on: the CATEGORY carries the keyword and a short
  // ownable word carries the identity, run together in the domain so a
  // crawler reads one token rather than three.
  //
  // "Zagon" is the Slovenian for the push that gets something moving, which
  // is what the product is for, and it is two syllables a customer can say
  // down a telephone.
  //
  // Replace both the day a name is registered. It is this literal, the
  // wordmark below, and nothing else — every title, canonical, breadcrumb and
  // JSON-LD id on the shop is built from these two fields.
  domain: "kofeinskevreckezagon.si",
  siteUrl: "https://kofeinskevreckezagon.si",
  // Empty until a second spelling is PROVEN owned. An alias is a claim of
  // ownership with routing behind it — see the note on the sibling shop's
  // aliasDomains for what happens when one is added on the strength of
  // intending to buy it.
  aliasDomains: [],
  name: "Kofeinske vrečke Zagon",
  wordmark: ["Kofeinske vrečke", "Zagon"],

  // ⚠️ FALSE, AND IT STAYS FALSE UNTIL THE THREE ITEMS ABOVE ARE ANSWERED.
  live: false,
  // See item 3 in the module note. The storefront asks for an enquiry because
  // that is the only thing this Worker can actually complete today.
  ordersOnline: false,

  // NO googleRating. The field is optional and it must stay absent: the
  // sibling shop's 4,7 is the hot-tub shop's own Google profile, and copying
  // a rating across shops would publish a number this shop has not earned to
  // a profile that does not describe it.

  // THE HEAD TERM.
  //
  // ⚠️ "kofeinske" AND NOT "energijske", deliberately. The energy-pouch
  // phrasing is the one every importer of this category reaches for, and it
  // competes with the whole energy-drink field for a term that does not say
  // what is in the tin. "Kofeinska vrečka" names the active, which is also
  // what somebody comparing this against a nicotine pouch is actually
  // searching for. If the query data says otherwise after launch, this is the
  // field to change — it drives the h1, the titles and the plural everywhere.
  //
  // The four cases exist because Slovenian declines and a title that reads
  // "Kupite kofeinske vrečka" is a shop nobody trusts.
  keyword: {
    primary: "kofeinska vrečka",
    accusative: "kofeinsko vrečko",
    plural: "kofeinske vrečke",
    category: "vrečke",
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
    // Hue 140 is a green, and the choice is the supplier's rather than a
    // preference: the tin is lime and the product's whole positioning is the
    // absence of nicotine, which the category signals in green. It is also as
    // far from the sibling shop's warm 48 as the wheel allows without landing
    // on the cyan every wellness brand already owns — two shops on one theme
    // must not read as one site (docs/SEO.md §6).
    accentHue: 140,
    accentChroma: 0.13,
    themeColor: "#151515",
    /**
     * ⚠️ A DIFFERENT ORDER FROM THE SIBLING SHOP, AND FOR A REASON THAT IS
     * ABOUT THE PRODUCT RATHER THAN ABOUT LOOKING DIFFERENT.
     *
     * A hot tub is a considered purchase that opens with delivery and
     * installation, because the buyer's first question is whether it can be
     * got to their garden at all. A tin of pouches is decided in seconds by
     * somebody who already knows what it is: the grid comes second, the
     * actives come third, and the logistics band sits well below both.
     *
     * ⚠️ AND NO "reviews" BAND. This shop has received none. The band is not
     * absent because it is unimplemented — it is absent because publishing an
     * opinion no customer wrote is on the blacklist of unfair practices
     * (ZVPot-1, Priloga I, 23b and 23c), where no weighing of circumstances
     * applies. It goes in when a real one arrives and not before.
     */
    composition: ["hero", "products", "stats", "marquee", "moat", "guides", "trust"],
  },

  // ⚠️ THE SAME LEGAL ENTITY AS THE SIBLING SHOP, ON THE ASSUMPTION THAT THE
  // OWNER SELLS BOTH THROUGH IT. That is the ordinary arrangement and it is
  // also the one thing here that would be quietly wrong if a separate company
  // is intended: every one of these fields is published — on the imprint, in
  // the terms, as the GDPR controller and as structured data — and they are
  // what a customer would sue. Confirm before launch; it is one block to
  // replace.
  contact: {
    phone: "+386 40 202 488",
    // Empty for the same reason it is empty on the sibling shop: there is no
    // mailbox on this domain, and an address nobody reads leaves a customer
    // believing they have written. Every reader of this field drops it
    // through isSet() and offers the telephone instead.
    email: "",
    address: { street: "Zgornje Škofije 4A", zip: "6281", city: "Škofije" },
  },
  company: {
    legalName: "Mediašped d.o.o.",
    regNumber: "5327784000",
    register: "Okrožno sodišče v Kopru",
    vatId: "SI53828305",
  },

  // ⚠️ THE DESCRIPTOR A CUSTOMER SEES ON THEIR STATEMENT, and it must name
  // THIS shop rather than the company or the sibling. A charge that reads as
  // an unfamiliar name is the single most common cause of a chargeback that
  // was never a dispute. Unused while ordersOnline is false.
  stripe: { statementDescriptor: "ZAGON VRECKE" },

  // Nothing published yet. An empty object emits no sameAs, which is correct:
  // linking a profile that does not exist is a dead end for a crawler and a
  // dead end for a reader.
  socials: {},

  /**
   * ⚠️ THE SLUGS ARE THIS SHOP'S OWN WORDS, NOT THE SIBLING'S.
   *
   * The internal keys are the network's route vocabulary and are shared; what
   * they point at is per shop, and it has to be, or two shops in one language
   * publish the same URL shapes with different products behind them. Three of
   * them differ on purpose:
   *
   *   /okusi   — the sibling's /product segment is /bazen because a hot tub
   *              is chosen as an object. A pouch is chosen as a FLAVOUR, and
   *              that is the word a customer uses.
   *   /sestava — its /compare is /primerjava, a comparison between two
   *              product families. This shop has one formula, and the page
   *              that matters is what is in it.
   *   /vodic   — its guides live at /vodnik. A second shop repeating that
   *              segment would put two different articles at the same path
   *              shape in the same language, which is the network footprint
   *              docs/SEO.md exists to prevent.
   *
   * The optional routes the sibling carries and this shop does not:
   * /showroom (there is nothing to visit — the sibling's points at a free
   * site survey, which means nothing for a tin) and /finder (a chooser needs
   * something to choose between, and there is one formula).
   */
  routeSlugs: {
    "/": "/",
    "/products": "/vrecke",
    "/product": "/okusi",
    "/compare": "/sestava",
    "/guide": "/vodic",
    "/guides": "/vodici",
    "/blog": "/blog",
    "/delivery": "/dostava",
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
