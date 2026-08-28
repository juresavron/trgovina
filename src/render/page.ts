import type { ShopConfig } from "../tenants/types";
import type { Collection, PdpContent, ShopContent } from "../content/types";
import { isSet, isSetPhone, isSetVat, isSetZip } from "../lib/filled";
import type { Page } from "../content/pages";
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
   * og:type for the share card — "product" on the six model pages, the
   * default "website" everywhere else. Meta's ingestion reads it; nothing
   * else does, which is why it is one string and not a taxonomy.
   */
  ogType?: "website" | "product";
}

export function renderDocument(o: PageOptions): string {
  const s = o.shop;
  const canonical = s.siteUrl + (o.path === "/" ? "/" : o.path);
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
    (o.noindex ? '<meta name="robots" content="noindex, nofollow">' : "") +
    '<link rel="canonical" href="' + esc(canonical) + '">' +
    '<link rel="alternate" hreflang="' + esc(s.locale.hreflang) + '" href="' + esc(canonical) + '">' +
    '<meta property="og:type" content="' + (o.ogType ?? "website") + '">' +
    '<meta property="og:site_name" content="' + esc(s.name) + '">' +
    '<meta property="og:title" content="' + esc(o.title) + '">' +
    '<meta property="og:description" content="' + esc(o.description) + '">' +
    '<meta property="og:url" content="' + esc(canonical) + '">' +
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
    // would. og:image:alt carries the same sentence a screen reader gets.
    '<meta property="og:image" content="' +
      esc(s.siteUrl + (o.image ?? "/media/site/hero.webp")) + '">' +
    '<meta property="og:image:alt" content="' + esc(o.title) + '">' +
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
export function organizationJsonLd(s: ShopConfig): object {
  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: s.name,
    url: s.siteUrl,
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

export function productJsonLd(s: ShopConfig, c: ShopContent, pdp: PdpContent = c.pdp): object {
  // NOTE deliberately absent: Review / AggregateRating. Placeholder reviews
  // render as page copy only — fabricated review schema is a manual-action
  // magnet, and this network's strategy is SEO (docs/SEO.md §3).
  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pdp.title,
    description: pdp.sub,
    sku: pdp.code,
    brand: { "@type": "Brand", name: s.name },
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
      availability: s.live ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
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
 * Each entry is a URL rather than an inlined Product: the product's own page
 * carries its Product node with the price and the offer, and repeating that
 * here would be two sources for one fact, which is how they drift.
 */
export function itemListJsonLd(
  s: ShopConfig,
  name: string,
  slugs: readonly string[],
): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: slugs.length,
    itemListElement: slugs.map((slug, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: s.siteUrl + s.routeSlugs["/product"] + "/" + slug,
    })),
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
  },
): string {
  // Spread rather than assign, because exactOptionalPropertyTypes draws a
  // distinction between "absent" and "present and undefined" — and `about`
  // being absent is the ordinary case.
  const ctx: RenderCtx = {
    ...buildCtx(
      shop,
      content,
      q,
      content.pdp,
      (shop.routeSlugs as Record<string, string>)[page.key] ?? "",
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
    '<a href="' + esc(shop.routeSlugs["/products"] + q) + '">Vsi modeli</a>' +
    '<a href="' + esc(shop.routeSlugs["/finder"] + q) + '">Kateri bazen je pravi za vas?</a>' +
    '<a href="' + esc(shop.routeSlugs["/contact"] + q) + '">Kontakt</a>' +
    "</p>" +
    "</div></div></section></main>" +
    foot
  );
}

