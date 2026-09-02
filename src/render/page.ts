import type { ShopConfig } from "../tenants/types";
import type { Collection, PdpContent, ShopContent } from "../content/types";
import { isSet, isSetPhone, isSetVat, isSetZip } from "../lib/filled";
import type { Page } from "../content/pages";
import { SHOP_HERO } from "../themes/studio/media";
import { renderStudioPage } from "../themes/studio/page";
import { renderStudioBlogIndex, renderStudioBlogPost } from "../themes/studio/blog";
import type { Post, PostCard } from "../blog/post";
import type { Block } from "../content/pages";
import { STUDIO_PRELOAD } from "../themes/studio/fonts";
import { THEME_CATALOG, type ThemeKey } from "../themes/catalog";
import { MAX_SECTIONS_PER_PAGE } from "../themes/shared/sections";
import { SHOPS } from "../tenants";
import { CSS_PATH, JS_PATH } from "./assets";
import {
  esc,
  renderFooter,
  renderHeader,
  renderPdpBody,
  renderSection,
  type RenderCtx,
} from "./sections";

import {
  renderStudioCollection,
  renderStudioExtras,
  renderStudioFooter,
  renderStudioHeader,
  renderStudioMembership,
  renderStudioPdp,
  renderStudioSection,
  renderStudioShopHub,
  renderStudioClosing,
} from "../themes/studio";

/**
 * Fonts.
 *
 * Studio self-hosts: its faces are vendored into /fonts and declared inline as
 * part of the theme sheet, so there is no third-party origin on the critical
 * path at all — no DNS, no TLS, no round trip before the first glyph can be
 * requested. That closes the debt docs/SEO.md §4 recorded against this theme.
 *
 * Only the display face is preloaded. It paints the h1, which is the LCP
 * element on every landing page; the prose faces are discovered from the sheet
 * a few milliseconds later and swap in without moving layout. Preloading all
 * ten files would compete with the image that shares that budget.
 *
 * The other themes still use Google — they are not the flagship and have not
 * earned the vendoring work.
 */
const FONTS_BASE =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Archivo:wdth,wght@62..125,400..800&family=Hanken+Grotesk:wght@300..800&family=Marcellus&display=swap";

// The files that carry the headline, including šumniki — GENERATED, not
// listed here. This was a hardcoded pair of Chivo filenames, and the day the
// theme moved to the source's own faces it went on preloading two files that
// no longer existed. scripts/vendor-fonts.mjs emits the list from what it
// actually vendored, so the preload cannot outlive the font again.

function fontLinks(theme: ThemeKey): string {
  if (theme === "studio") {
    return STUDIO_PRELOAD.map(
      (href) =>
        '<link rel="preload" as="font" type="font/woff2" href="' + href + '" crossorigin>',
    ).join("");
  }
  return (
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="' + FONTS_BASE + '">'
  );
}

export interface PageOptions {
  shop: ShopConfig;
  content: ShopContent;
  theme: ThemeKey;
  /** Path for the canonical URL ('/', '/savna/quattro'). */
  path: string;
  title: string;
  description: string;
  /** noindex on dev hosts, placeholders and pre-live pages. */
  noindex: boolean;
  /**
   * Suppress the canonical link entirely. Null on a noindexed URL variant
   * that has no indexable self to point at.
   *
   * ⚠️ noindex PLUS A CANONICAL TO ANOTHER URL IS THE ONE COMBINATION GOOGLE
   * WARNS ABOUT. The two directives contradict each other — "do not index
   * this" and "credit this to that" — and the documented failure mode is that
   * the noindex is carried across to the canonical target. /kontakt?poslano
   * and /kontakt?vzorcnik are exactly that shape: both are noindexed because
   * they are per-visitor states, both canonicalised to /kontakt because the
   * canonical is built from the path with the query dropped, and all six
   * product pages link to ?vzorcnik with a crawlable anchor. The page the
   * whole site funnels into was one interpretation away from being dropped
   * from the index by its own product pages.
   *
   * noindex with NO canonical is the unambiguous pair, so those two variants
   * pass null. ?model= is untouched: it is not noindexed, and its canonical
   * to /kontakt is correct consolidation.
   */
  canonical?: string | null;
  /** Dev-only query suffix propagated on internal links. */
  q: string;
  /** Dev-only switcher bar. */
  bodyHtml: string;
  jsonLd?: object[];
  /**
   * The picture a shared link shows, as a path under this shop's own origin.
   *
   * Absent on pages that have nothing of their own to show, where the shop's
   * hero stands in — see renderDocument. A product page passes its lead
   * photograph, which is the difference between a link that sells and a card
   * with a wordmark on it.
   */
  image?: string;
  /**
   * What the share card's picture SHOWS, for og:image:alt.
   *
   * Optional and falling back to the title, which is what every caller used
   * to get whether it had a picture or not — see the note beside the tag.
   * Pass it wherever `image` is a real photograph with a real alt.
   */
  imageAlt?: string;
  /**
   * og:type for the share card — "product" on the six model pages, the
   * default "website" everywhere else. Meta's ingestion reads it; nothing
   * else does, which is why it is one string and not a taxonomy.
   */
  ogType?: "website" | "product";
}

export function renderDocument(o: PageOptions): string {
  const s = o.shop;
  // The page's own absolute URL, always. og:url is a share-card identity —
  // "what is this link" — not an indexing directive, so it is still correct on
  // a variant that has no canonical: a shared /kontakt?poslano should preview
  // as the contact page.
  const pageUrl = s.siteUrl + (o.path === "/" ? "/" : o.path);
  const canonical = o.canonical === null ? null : pageUrl;
  const heroSrc = SHOP_HERO[s.key]?.src;
  const ogPath = o.image ?? heroSrc;
  const ogImage = ogPath ? s.siteUrl + ogPath : "";
  const jsonLd = (o.jsonLd ?? [])
    .map(
      (obj) =>
        // JSON in a <script> block: escape the one sequence that could close it.
        '<script type="application/ld+json">' +
        JSON.stringify(obj).replace(/</g, "\\u003c") +
        "</script>",
    )
    .join("");
  return (
    "<!doctype html>" +
    '<html lang="' + esc(s.locale.lang) + '" data-shop="' + esc(s.key) + '" data-theme="' + esc(o.theme) + '">' +
    "<head>" +
    '<meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>" + esc(o.title) + "</title>" +
    '<meta name="description" content="' + esc(o.description) + '">' +
    // ⚠️ THE EMPTY BRANCH WAS A MISSED PERMISSION, on a catalogue whose whole
    // product is a photograph. A page with no robots meta gets the default
    // image-preview size, which is a thumbnail; max-image-preview:large is
    // what puts a full-width photograph in a result and in Discover. It is a
    // permission granted to Google, not a claim about the goods, so it
    // asserts nothing — and the images it applies to are the /media/ URLs
    // robots.txt already leaves crawlable on purpose. Noindex pages keep the
    // exact string they had.
    (o.noindex
      ? '<meta name="robots" content="noindex, nofollow">'
      : '<meta name="robots" content="max-image-preview:large">') +
    (canonical === null ? "" : '<link rel="canonical" href="' + esc(canonical) + '">') +
    // ⚠️ NO hreflang. A self-referencing <link rel="alternate" hreflang="sl-SI"
    // href="<this page>"> stood here, on every page, and it is a no-op: the
    // annotation exists to tie a page to its OTHER-LANGUAGE versions, and a
    // set of one names no alternative. Google's own rule is that a
    // self-reference is required only when there are alternates to
    // self-reference among. This network is one language per shop today; the
    // day a shop ships a second, the annotation has to be emitted for BOTH
    // and point at BOTH, which is a different line from this one. The lang
    // attribute on <html> already carries the language for a crawler.
    // s.locale.hreflang stays in the config for exactly that day.

    '<meta property="og:type" content="' + (o.ogType ?? "website") + '">' +
    '<meta property="og:site_name" content="' + esc(s.name) + '">' +
    '<meta property="og:title" content="' + esc(o.title) + '">' +
    '<meta property="og:description" content="' + esc(o.description) + '">' +
    '<meta property="og:url" content="' + esc(pageUrl) + '">' +
    '<meta property="og:locale" content="' + esc(s.locale.ogLocale) + '">' +
    // THE CARD HAD NO PICTURE, on any page.
    //
    // Every link to this shop — pasted into Facebook, WhatsApp, Viber, a
    // Slack channel, an e-mail preview — rendered as a bare text card. For a
    // EUR 2,400-8,400 product bought after somebody sends the page to their
    // partner, that is the single most-shared moment on the site rendering
    // as nothing. A product page shows the product; everything else shows
    // the hero, which is the shop's own picture and always exists.
    //
    // Absolute by requirement: og:image is one of the few tags where a
    // relative URL is simply ignored, and it must be on the shop's own
    // origin so the crawler that fetches it sees the same bytes a visitor
    // would.
    //
    // ⚠️ og:image:alt IS THE PICTURE'S ALT, NOT THE PAGE'S TITLE, and this
    // line claimed to carry "the same sentence a screen reader gets" while
    // emitting the title. On /bazen/mali-195 that was "BAZEN 195 — masažni
    // bazen | Masažni bazeni Vrelec": a page name with a site-name suffix and
    // a pipe, offered to anyone whose reader announces the alt of a shared
    // card. The photograph's own alt — "Masažni bazen BAZEN 195, pogled od
    // zgoraj na akrilno školjko s petimi sedeži" — describes the image, which
    // is the whole point of the property. The title stands in only where a
    // caller has no picture of its own to describe.
    // ⚠️ AND THE FALLBACK WAS A LITERAL, SO EVERY SHOP SHARED ONE PICTURE.
    // The shop contributed only the origin: "/media/site/hero.webp" is a
    // constant, and a second shop on this Worker rendered
    // https://its-own-domain/media/site/hero.webp pointing at the SAME bucket
    // object — one social preview image for the whole network, on the tag
    // whose entire job is to show what THIS shop sells. It now reads the
    // shop's own hero, and omits the tag rather than borrowing a sibling's:
    // a link with no picture is a worse card, a link with the wrong shop's
    // picture is a wrong one.
    (ogImage ? '<meta property="og:image" content="' + esc(ogImage) + '">' : "") +
    // ⚠️ ONLY WHERE THERE IS SOMETHING TRUE TO SAY. The title fallback put a
    // page name with a pipe and a brand suffix — "Vodniki | Masažni bazeni
    // Vrelec" — into an IMAGE description on the nineteen routes that share
    // the hero card, and the hero's own alt is "" because it is decorative.
    // A missing og:image:alt degrades to no announcement; a wrong one is
    // announced. So it is emitted only when a caller passed a real alt.
    (o.imageAlt ? '<meta property="og:image:alt" content="' + esc(o.imageAlt) + '">' : "") +
    '<meta name="twitter:card" content="summary_large_image">' +
    // ICONS. There were none at all, so every tab, bookmark and shared link
    // showed the browser's blank-page glyph — on a storefront asking for
    // EUR 2,400-8,400. The SVG is what modern browsers use and the only one
    // that follows the tab strip between light and dark; the 32px PNG covers
    // the engines that still ignore an SVG icon; the touch icon is the one
    // iOS puts on a home screen. All three are generated from one drawing by
    // scripts/build-brand.mjs, so the tab icon cannot drift from the logo.
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">' +
    '<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">' +
    // ⚠️ 96, BECAUSE GOOGLE WILL NOT USE THE 32. The favicon it prints beside
    // every result has to be a square whose side is a multiple of 48px, and
    // this site declared 32 (chosen for a tab strip, which is a different
    // job) and a 180 that carries no rel="icon" and is therefore not
    // considered. Same drawing, same generator, so it cannot drift.
    '<link rel="icon" href="/favicon-96.png" type="image/png" sizes="96x96">' +
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">' +
    // theme-color paints the browser UI around the page on mobile. It was
    // #faf7f2, a cream that matches nothing this theme renders — the chrome
    // bar is --ink-invert and the page is white — so the phone drew a third
    // colour above a black header. It now matches the bar it sits against.
    '<meta name="theme-color" content="' + esc(s.design.themeColor) + '">' +
    fontLinks(o.theme) +
    // A FILE, NOT AN INLINE BLOCK. The stylesheet was 72–89% of every page's
    // bytes and re-shipped on every navigation; as a content-addressed file
    // it downloads once per deploy and the second page a visitor opens is a
    // tenth the transfer. A <link> in <head> blocks render exactly as the
    // inline block did, so nothing flashes unstyled. See render/assets.ts.
    '<link rel="stylesheet" href="' + CSS_PATH + '">' +
    jsonLd +
    "</head><body>" +
    o.bodyHtml +
    // A module script is deferred by definition, so it neither blocks parsing
    // nor paint. Fetched now rather than inlined: with the stylesheet moved
    // to a file the script was the last per-page copy of shared bytes, and
    // the same immutable cache that pays for the CSS pays for it. Only studio
    // needs it — the other themes have no device that requires script.
    (o.theme === "studio" ? '<script type="module" src="' + JS_PATH + '"></script>' : "") +
    "</body></html>"
  );
}

/**
 * Who the shop is, for a search engine.
 *
 * ⚠️ NOTHING IN HERE IS ALLOWED TO BE A PLACEHOLDER. This used to emit the
 * config verbatim, so every page on the site asserted, in machine-readable
 * form, that the business telephone is +386 00 000 000 and its registered
 * address is "TODO, 0000 TODO". Structured data is a claim made TO Google
 * rather than to a reader — it is ingested into the knowledge panel, and a
 * shop that tells Google its address is TODO has spent its identity signal on
 * garbage before a single page ranks.
 *
 * The rule this file already applies to money (see productJsonLd: no Offer
 * without a price somebody set) is the same rule, and it now applies here:
 * a field that has not been filled in is OMITTED. An Organization with a name
 * and a URL is valid, honest and complete the day the rest lands — see
 * src/lib/filled.ts for the predicates and why they have one home.
 */
/** The Organization's node id — one entity, referenced from everywhere. */
export function orgId(s: ShopConfig): string {
  return s.siteUrl + "/#organization";
}

export function organizationJsonLd(s: ShopConfig): object {
  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    // ⚠️ A NODE ID, SO THE TWENTY-FIVE COPIES ARE ONE ENTITY. This block is
    // emitted on every route, and without an @id each copy is an anonymous
    // Organization that happens to share a name — nothing to attach a
    // knowledge panel to, and nothing for an Offer's seller or a WebSite's
    // publisher to point AT. A fragment on the site's own URL is the
    // conventional identifier and costs nothing.
    "@id": orgId(s),
    "@type": "Organization",
    name: s.name,
    url: s.siteUrl,
    // THE ENTITY NEEDS A PICTURE. Without a logo the Organization Google is
    // asked to build has no image to attach to a knowledge panel or to print
    // beside the brand — and the file already ships: apple-touch-icon.png is
    // 180×180, over Google's 112px floor, served from public/ at the shop's
    // own origin, and generated by scripts/build-brand.mjs from the single
    // drawing in brand.ts. So it cannot drift from the header mark, which is
    // that module's whole reason for generating these files.
    logo: s.siteUrl + "/apple-touch-icon.png",
  };
  if (isSetPhone(s.contact.phone)) org["telephone"] = s.contact.phone;
  if (isSet(s.contact.email)) org["email"] = s.contact.email;

  // The address goes in whole or not at all. A PostalAddress carrying a
  // country and nothing else is not an address; it is a claim that the shop
  // could not say where it is, which is worse than saying nothing.
  const a = s.contact.address;
  if (isSet(a.street) && isSetZip(a.zip) && isSet(a.city)) {
    org["address"] = {
      "@type": "PostalAddress",
      streetAddress: a.street,
      postalCode: a.zip,
      addressLocality: a.city,
      addressCountry: s.addressCountry,
    };
  }
  if (isSetVat(s.company.vatId)) org["vatID"] = s.company.vatId;
  if (isSet(s.company.legalName)) org["legalName"] = s.company.legalName;
  return org;
}

/**
 * The site as an entity, for the home page only.
 *
 * WHAT IT BUYS. Google reads WebSite from a site's home page to decide what
 * to print above a result instead of the bare domain — the "site name"
 * feature. Without it the SERP shows "masazni-bazeni-vrelec.si"; with it,
 * the shop's name. That is the whole of it, and it is worth one node.
 *
 * ⚠️ NO SearchAction. The obvious companion property advertises a search
 * endpoint, and this site has no search: a sitelinks search box pointing at a
 * URL that 404s is a promise the shop cannot keep, and Google has retired the
 * feature for most sites anyway.
 *
 * publisher is a REFERENCE, not a second copy of the organization. The
 * Organization node is already on this page (worker.ts emits it on every
 * route); repeating its fields here would be two entities where there is one.
 */
export function websiteJsonLd(s: ShopConfig): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": s.siteUrl + "/#website",
    name: s.name,
    url: s.siteUrl,
    inLanguage: s.locale.lang,
    publisher: { "@id": orgId(s) },
  };
}

export function productJsonLd(s: ShopConfig, c: ShopContent, pdp: PdpContent = c.pdp): object {
  // NOTE deliberately absent: Review / AggregateRating. Placeholder reviews
  // render as page copy only — fabricated review schema is a manual-action
  // magnet, and this network's strategy is SEO (docs/SEO.md §3).
  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    // Its own node id, on its own URL, so a crawler that meets this model on
    // the product page and again in a future ItemList sees one thing.
    "@id": s.siteUrl + s.routeSlugs["/product"] + "/" + pdp.slug + "#product",
    name: pdp.title,
    description: pdp.sub,
    sku: pdp.code,
    // The manufacturer where the model names one, the shop where it does not.
    // See PdpContent.brand: unconditional shop-as-brand is false the moment a
    // shop sells somebody else's goods.
    brand: { "@type": "Brand", name: pdp.brand ?? s.name },
    ...(pdp.gtin ? { gtin: pdp.gtin } : {}),
    ...(pdp.mpn ? { mpn: pdp.mpn } : {}),
  };
  // The model's own photography, absolute. Google will not show a product
  // rich result without an image, so an Offer with no image is markup doing
  // half its job — and the photos are already on the page. Only the model's
  // own: where a model has none, the gallery shows the shop's drawing, and
  // publishing THAT as product imagery would claim a picture of the product.
  if (pdp.photos && pdp.photos.length > 0) {
    product["image"] = pdp.photos.slice(0, 6).map((ph) => s.siteUrl + ph.src);
  }
  // No Offer without a price somebody actually set. Two ways that fails:
  // priceCents is 0 (no price at all), or the page's prices are a provisional
  // conversion of cost rather than a selling price (src/catalog/pricing.ts).
  // Publishing either would be a structured-data claim about money that nobody
  // made — the same class of error that keeps Review schema off these pages.
  // A Product without an Offer is valid; a Product with a false one is the
  // kind that earns a manual action.
  if (pdp.priceCents > 0 && !pdp.pricesProvisional) {
    product["offers"] = {
      "@type": "Offer",
      url: s.siteUrl + s.routeSlugs["/product"] + "/" + pdp.slug,
      priceCurrency: s.currency,
      price: (pdp.priceCents / 100).toFixed(2),
      // Derived from the live flag, because the hardcoded value it replaces
      // would have outlived its own truth: PreOrder is honest exactly while
      // the shop is pre-launch ("na voljo ob zagonu trgovine" on the page),
      // and on launch day every product would still have asserted it until
      // somebody remembered this line. The flip that opens the shop is the
      // flip that changes the claim.
      // ⚠️ ordersOnline, NOT live, AND THE NOTE ABOVE PICKED THE WRONG FLAG.
      // It is right that the claim must move with a flip rather than with
      // somebody's memory; it named the flip that makes the shop VISIBLE
      // instead of the one that makes a purchase possible. This shop is
      // ordersOnline:false and says so on the page — /kosarica reads "Spletno
      // naročanje še ni odprto" — so on launch day all six products would have
      // asserted InStock at a URL whose only control is an enquiry form. That
      // is the merchant-listing mismatch that suppresses a price snippet and
      // fails a Merchant Center review.
      //
      // ⚠️ AND THE FALSE BRANCH WAS STILL A CLAIM NOBODY MAKES. Both earlier
      // notes argued about WHICH availability to assert and neither asked
      // whether to assert one. PreOrder means the goods can be ordered now
      // for delivery later, and Google reads it that way — it wants an
      // availabilityStarts date behind it. No page here says pre-order and no
      // page names a date: the product pages say "Povprašajte za ponudbo" and
      // /kosarica says online ordering is not open. So while the shop cannot
      // be transacted with online the property is OMITTED, not guessed.
      // availability is recommended rather than required, so the price,
      // currency, condition, seller and return policy all still ship and the
      // offer stays eligible for a product snippet.
      ...(s.ordersOnline ? { availability: "https://schema.org/InStock" } : {}),
      itemCondition:
        "https://schema.org/" +
        { new: "NewCondition", used: "UsedCondition",
          refurbished: "RefurbishedCondition", damaged: "DamagedCondition" }[
          pdp.condition ?? "new"
        ],
      // The seller is the Organization node this page already carries, by
      // reference. Without it an Offer names a price and nobody selling at it.
      seller: { "@id": orgId(s) },
      // ⚠️ EVERY FIELD HERE IS COPIED OFF /odstop-od-pogodbe, NOT CHOSEN.
      // A return policy in structured data is a claim made to Google in the
      // shop's name, and Merchant Center reads it: a policy here that
      // contradicts the page is the mismatch that gets a listing suspended.
      // So — 14 days from receipt, Slovenia, and the consumer bears the
      // direct cost of returning the goods, which is what that page says in
      // its own words ("Neposredne stroške vračila blaga nosi potrošnik").
      //
      // returnMethod IS DELIBERATELY ABSENT. It has three permitted values —
      // by mail, in store, at a kiosk — and none is true of an object the
      // same page says cannot be sent by post "zaradi teže in velikosti";
      // the page says the shop collects it.
      //
      // ⚠️ AND returnFees WAS THE WRONG VALUE FOR THAT REASONING. The note
      // here used to say returnShippingFeesAmount was omitted because the
      // page does not fix a figure in advance — which is true, and which
      // makes ReturnShippingFees the one value that may not be used: Google
      // requires the amount WITH it, so the block as it stood was an
      // incomplete policy rather than a modest one.
      // ReturnFeesCustomerResponsibility says exactly what the linked page
      // says in its own words — "Neposredne stroške vračila blaga nosi
      // potrošnik, razen če se dogovorimo drugače" — and takes no amount.
      // Nothing is invented and no figure is fixed.
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: s.addressCountry,
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
        merchantReturnLink: s.siteUrl + s.routeSlugs["/withdrawal"],
      },
    };
  }
  return product;
}

/**
 * The trail a SERP result shows instead of the raw URL.
 *
 * Google replaces "masazni-bazeni-vrelec.si › bazen › veliki-230" with
 * "Trgovina › Masažni bazeni › BAZEN 230" when this is present, and the
 * second reads like a shop while the first reads like a file path. It is the
 * cheapest rich result there is: no new content, no claim about anything,
 * just the position of a page in a hierarchy the site already renders as
 * visible breadcrumbs.
 *
 * The items are given as {name, url} in order, ROOT FIRST. The last item is
 * the page itself and carries no url — Google's own guidance, because the
 * current page needs no link to itself and supplying one has been seen to
 * suppress the whole trail.
 */
export function breadcrumbJsonLd(
  s: ShopConfig,
  trail: readonly { readonly name: string; readonly path?: string }[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => {
      const item: Record<string, unknown> = {
        "@type": "ListItem",
        position: i + 1,
        name: t.name,
      };
      if (t.path) item["item"] = s.siteUrl + t.path;
      return item;
    }),
  };
}

/**
 * The models on a collection page, as a set rather than as loose links.
 *
 * /masazni-bazeni and /swim-spa are the two pages this shop is built to rank,
 * and to a crawler they were three anchors in a div. An ItemList says "this
 * page is a list of these products, in this order", which is what lets a
 * category page compete as a category rather than as an article that happens
 * to mention some products.
 *
 * ⚠️ EACH ENTRY NESTS ITS PRODUCT, and the note that stood here argued the
 * opposite: a bare URL per entry, because the product's own page carries the
 * Product node and repeating it would be two sources for one fact that then
 * drift. The instinct is right and the conclusion was wrong on both halves.
 *
 * On the standard: a ListItem carrying only a url is the SUMMARY-page pattern
 * Google documents for a listing whose items live elsewhere — it makes the
 * page eligible for nothing. The pattern for a category page that wants its
 * products to appear as products is the ALL-IN-ONE one, where each ListItem
 * nests a full Product with name, image and offers. This shop's two category
 * pages are among the pages it is built to rank; they were shipping the
 * pattern that asks for nothing.
 *
 * On the drift: the second source never existed. The node here is produced by
 * productJsonLd from the same PdpContent record the product page passes it, so
 * there is exactly one generator and one set of figures. What would drift is
 * two hand-written literals, which is what the note was really warning about.
 *
 * The @context is stripped from the nested copies — it belongs on the document
 * node, and repeating it inside every item is noise a parser has to skip.
 */
export function itemListJsonLd(
  s: ShopConfig,
  c: ShopContent,
  name: string,
  pdps: readonly PdpContent[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: pdps.length,
    itemListElement: pdps.map((pdp, i) => {
      const { "@context": _ctx, ...product } =
        productJsonLd(s, c, pdp) as Record<string, unknown>;
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          ...product,
          url: s.siteUrl + s.routeSlugs["/product"] + "/" + pdp.slug,
        },
      };
    }),
  };
}

/**
 * The questions on a page, as the accordion Google can show under a result.
 *
 * ⚠️ ONLY FROM QUESTIONS THAT ARE VISIBLE ON THE PAGE. FAQPage markup whose
 * answers a visitor cannot read is a structured-data violation and a manual
 * action, so this is built from the same qa blocks the page renders and never
 * from a separate list. The answers are plain text: the block renders them as
 * a <p> and nothing else, so there is no markup to carry across.
 */
export function faqJsonLd(
  items: readonly (readonly [string, string])[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function buildCtx(
  shop: ShopConfig,
  content: ShopContent,
  q: string,
  /** The model being rendered. Defaults to the shop's flagship. */
  pdp: PdpContent = content.pdp,
  /** Canonical path of the page — see RenderCtx.path. */
  path = "",
): RenderCtx {
  return {
    shop,
    content,
    pdp,
    q,
    path,
    phoneHref: "tel:" + shop.contact.phone.replace(/\s+/g, ""),
    phoneDisplay: shop.contact.phone,
  };
}

export function renderHome(shop: ShopConfig, content: ShopContent, theme: ThemeKey, q: string): string {
  const ctx = buildCtx(shop, content, q, content.pdp, "/");
  // A shop may override the theme's act order — the anti-doorway control
  // described in ShopConfig.design.composition. Capped here rather than at the
  // config, so an override can never turn a page into a scroll of everything.
  const composition = (shop.design.composition ?? THEME_CATALOG[theme].composition.home)
    .slice(0, MAX_SECTIONS_PER_PAGE);
  const studio = theme === "studio";
  // A studio section falls back to the kernel renderer when the theme has no
  // module for that key, so the composition can never render a hole.
  const body = composition
    .map((k) => {
      const own = studio ? renderStudioSection(k, ctx) : null;
      return (own ?? renderSection(k, ctx)) + (studio ? renderStudioExtras(k, ctx) : "");
    })
    .join("");
  return studio
    ? renderStudioHeader(ctx) +
        // data-bleed: the first section paints its own dark ground behind
        // the fixed bar, so chrome.ts lets the bar float over it.
        '<main data-bleed>' + body + renderStudioClosing(ctx) + "</main>" +
        renderStudioFooter(ctx)
    : renderHeader(ctx) + "<main>" + body + "</main>" + renderFooter(ctx);
}

export function renderPdp(
  shop: ShopConfig,
  content: ShopContent,
  q: string,
  theme: ThemeKey,
  pdp: PdpContent = content.pdp,
): string {
  const ctx = buildCtx(shop, content, q, pdp, shop.routeSlugs["/product"] + "/" + pdp.slug);
  if (theme === "studio") {
    return renderStudioHeader(ctx) + "<main>" + renderStudioPdp(ctx) + "</main>" + renderStudioFooter(ctx);
  }
  return renderHeader(ctx) + "<main>" + renderPdpBody(ctx) + "</main>" + renderFooter(ctx);
}

/**
 * A collection page — one product family at its own URL.
 *
 * Studio-only for now: the kernel has no collection component and there is
 * one theme. A theme without one falls back to the placeholder rather than
 * rendering a hole.
 */
export function renderCollection(
  shop: ShopConfig,
  content: ShopContent,
  q: string,
  theme: ThemeKey,
  collection: Collection,
): string {
  const ctx = buildCtx(shop, content, q, content.pdp, collection.path);
  return (
    renderStudioHeader(ctx) +
    // The closing band is the page's ending, and a collection page had none:
    // it stopped at the last card and went straight into the footer's link
    // columns. Same component the home page closes with, so the two pages end
    // the same way rather than one of them just running out.
    "<main>" + renderStudioCollection(ctx, collection) + renderStudioMembership(ctx) + "</main>" +
    renderStudioFooter(ctx)
  );
}

/** The shop hub — every family on one page. */
export function renderShopHub(
  shop: ShopConfig,
  content: ShopContent,
  q: string,
  theme: ThemeKey,
): string {
  const ctx = buildCtx(shop, content, q, content.pdp, shop.routeSlugs["/products"]);
  return (
    renderStudioHeader(ctx) +
    "<main>" + renderStudioShopHub(ctx) + renderStudioMembership(ctx) + "</main>" +
    renderStudioFooter(ctx)
  );
}

/**
 * An editorial or legal page.
 *
 * renderStudioPage emits its own <main>, unlike the collection and hub
 * renderers above — the page owns its whole document body because it has no
 * storefront devices to sit between.
 */
export function renderContentPage(
  shop: ShopConfig,
  content: ShopContent,
  q: string,
  theme: ThemeKey,
  page: Page,
  /**
   * The model the visitor arrived from, already resolved against the
   * catalogue by the router. A slug that matches nothing arrives as
   * undefined, so an unknown parameter simply renders the ordinary page.
   */
  about?: PdpContent,
  /** What that model was configured with, already matched — see chosenParams. */
  chosen?: readonly (readonly [string, string])[],
  /**
   * How the enquiry form's submission went, on the POST that answers one.
   *
   * Absent on every GET, which is why this renderer stays synchronous and
   * env-free: the async layer does the writing and hands the OUTCOME down as
   * a value. Rendering never learns that a database exists.
   */
  enquiry?: {
    readonly done?: boolean;
    readonly error?: string;
    readonly sent?: Readonly<Record<string, string>>;
    readonly field?: string | null;
  },
): string {
  // Spread rather than assign, because exactOptionalPropertyTypes draws a
  // distinction between "absent" and "present and undefined" — and `about`
  // being absent is the ordinary case.
  // ⚠️ A GUIDE'S PATH IS THE BASE PLUS ITS SLUG, and this said only the base.
  //
  // Every GuidePage carries key "/guide", so routeSlugs gave "/vodnik" — the
  // segment three guides live UNDER, and a URL that serves nothing. The chrome
  // decides which menu item to underline by asking whether the path starts
  // with "/vodnik/", so it missed by exactly one character and no guide page
  // marked its section at all: the reader lost the "you are here" underline
  // on three of the site's ranking pages, and aria-current with it.
  //
  // Ordinary pages have no slug and are unaffected.
  const base = (shop.routeSlugs as Record<string, string>)[page.key] ?? "";
  const slug = (page as { slug?: string }).slug;
  const ctx: RenderCtx = {
    ...buildCtx(
      shop,
      content,
      q,
      content.pdp,
      slug ? base + "/" + slug : base,
    ),
    ...(about ? { about } : {}),
    ...(chosen && chosen.length > 0 ? { chosen } : {}),
    ...(enquiry ? { enquiry } : {}),
  };
  return renderStudioHeader(ctx) + renderStudioPage(ctx, page) + renderStudioFooter(ctx);
}

/**
 * The blog index.
 *
 * Takes the posts rather than fetching them: this module renders, and the
 * only code that talks to a database is under src/blog and src/admin. The
 * router reads and this draws, which is what keeps every test in this file
 * able to call a renderer with a literal.
 */
export function renderBlogIndex(
  shop: ShopConfig,
  content: ShopContent,
  q: string,
  h1: string,
  lead: string,
  posts: readonly PostCard[],
): string {
  const ctx = buildCtx(shop, content, q, content.pdp, shop.routeSlugs["/blog"]);
  return (
    renderStudioHeader(ctx) +
    renderStudioBlogIndex(ctx, shop.routeSlugs["/blog"], h1, lead, posts) +
    renderStudioFooter(ctx)
  );
}

/** One post. */
export function renderBlogPost(
  shop: ShopConfig,
  content: ShopContent,
  q: string,
  post: Post,
  blocks: readonly Block[],
  minutes: number,
  others: readonly PostCard[],
): string {
  const ctx = buildCtx(shop, content, q, content.pdp, shop.routeSlugs["/blog"]);
  return (
    renderStudioHeader(ctx) +
    renderStudioBlogPost(ctx, shop.routeSlugs["/blog"], "Blog", post, blocks, minutes, others) +
    renderStudioFooter(ctx)
  );
}

/**
 * A post, for a search engine.
 *
 * ⚠️ NO AUTHOR AND NO PUBLISHER LOGO, on purpose. Article wants both, and
 * both would have to be invented here: nobody signs these posts, and the
 * shop's registered identity is still a placeholder (see organizationJsonLd,
 * which omits every unset field for the same reason). A BlogPosting with a
 * headline, a date and a URL is valid and true; one naming "Mediašped d.o.o."
 * as a publisher before that name is in the config would be neither.
 *
 * datePublished is omitted rather than faked when a post has somehow reached
 * the storefront without one — the storefront only ever renders published
 * posts, so that is a shape the database should not produce.
 */
export function articleJsonLd(s: ShopConfig, post: Post, url: string): object {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
  if (post.excerpt) node["description"] = post.excerpt;
  if (post.publishedAt) node["datePublished"] = post.publishedAt;
  if (post.updatedAt) node["dateModified"] = post.updatedAt;
  if (post.coverUrl) node["image"] = s.siteUrl + post.coverUrl;
  return node;
}

export function renderPlaceholder(
  shop: ShopConfig,
  content: ShopContent,
  title: string,
  q: string,
  theme: ThemeKey,
  // ⚠️ The default is for routes that genuinely are unbuilt. The 404 passes
  // its own sentence, because "Stran je v pripravi" about a mistyped URL is
  // a promise the page will exist — a claim that was false on every unknown
  // path the site answered.
  body = "Stran je v pripravi. Medtem si oglejte ponudbo ali nas pokličite.",
): string {
  const ctx = buildCtx(shop, content, q);
  const head = theme === "studio" ? renderStudioHeader(ctx) : renderHeader(ctx);
  const foot = theme === "studio" ? renderStudioFooter(ctx) : renderFooter(ctx);
  return (
    head +
    '<main><section class="act"><div class="wrap placeholder"><div>' +
    '<p class="eyebrow">' + esc(shop.name) + "</p>" +
    '<h1 class="display" style="margin-top:14px">' + esc(title) + "</h1>" +
    "<p>" + esc(body) + "</p>" +
    '<a class="btn btn-fill" href="/' + q + '">Na začetno stran</a>' +
    // A lost visitor's three real errands, not just the door back out. The
    // most common way to land here is a mistyped or moved model URL, so the
    // catalogue leads; the finder catches the visitor who never had a URL;
    // contact is the shop's whole conversion path. Quiet links under the
    // button — the page stays an apology, not a sitemap.
    '<p class="placeholder-links">' +
    '<a href="' + esc(shop.routeSlugs["/products"] + q) + '">' +
    esc((content.pdps ?? [content.pdp]).length > 1 ? "Vsi modeli" : content.nav[0]) + "</a>" +
    // ⚠️ THE SHOP'S OWN LABEL, AND ONLY WHERE THE ROUTE EXISTS. This said
    // "Kateri bazen je pravi za vas?" on every 404 of every shop on the
    // Worker; nav[6] is what the shop calls its guided choice, and the route
    // is optional (tenants/types.ts).
    (shop.routeSlugs["/finder"]
      ? '<a href="' + esc(shop.routeSlugs["/finder"] + q) + '">' + esc(content.nav[6]) + "</a>"
      : "") +
    '<a href="' + esc(shop.routeSlugs["/contact"] + q) + '">Kontakt</a>' +
    "</p>" +
    "</div></div></section></main>" +
    foot
  );
}

