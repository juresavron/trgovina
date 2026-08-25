import type { ShopConfig } from "../tenants/types";
import type { Collection, PdpContent, ShopContent } from "../content/types";
import type { Page } from "../content/pages";
import { renderStudioPage } from "../themes/studio/page";
import { THEME_CATALOG, type ThemeKey } from "../themes/catalog";
import { MAX_SECTIONS_PER_PAGE } from "../themes/shared/sections";
import { SHOPS } from "../tenants";
import { BASE_CSS } from "./css";
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
  renderStudioPdp,
  renderStudioSection,
  renderStudioShopHub,
  renderStudioClosing,
  STUDIO_JS,
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

/** The two files that carry the headline, including šumniki. */
const STUDIO_PRELOAD = [
  "/fonts/chivo-500-latin.woff2",
  "/fonts/chivo-500-latin-ext.woff2",
];

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
    '<meta property="og:type" content="website">' +
    '<meta property="og:site_name" content="' + esc(s.name) + '">' +
    '<meta property="og:title" content="' + esc(o.title) + '">' +
    '<meta property="og:description" content="' + esc(o.description) + '">' +
    '<meta property="og:url" content="' + esc(canonical) + '">' +
    '<meta property="og:locale" content="' + esc(s.locale.ogLocale) + '">' +
    '<meta name="theme-color" content="' + esc(s.design.themeColor) + '">' +
    fontLinks(o.theme) +
    "<style>" + BASE_CSS + "</style>" +
    jsonLd +
    "</head><body>" +
    o.bodyHtml +
    // A module script is deferred by definition, so it neither blocks parsing
    // nor paint. Inlined rather than fetched: it is under 4 KB, and a second
    // request would cost more than the bytes. Only studio needs it — the other
    // themes have no device that requires script.
    (o.theme === "studio" ? '<script type="module">' + STUDIO_JS + "</script>" : "") +
    "</body></html>"
  );
}

export function organizationJsonLd(s: ShopConfig): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: s.name,
    url: s.siteUrl,
    telephone: s.contact.phone,
    email: s.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: s.contact.address.street,
      postalCode: s.contact.address.zip,
      addressLocality: s.contact.address.city,
      addressCountry: s.addressCountry,
    },
  };
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
    brand: { "@type": "Brand", name: s.name },
  };
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
      availability: "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
    };
  }
  return product;
}

export function buildCtx(
  shop: ShopConfig,
  content: ShopContent,
  q: string,
  /** The model being rendered. Defaults to the shop's flagship. */
  pdp: PdpContent = content.pdp,
): RenderCtx {
  return {
    shop,
    content,
    pdp,
    q,
    phoneHref: "tel:" + shop.contact.phone.replace(/\s+/g, ""),
    phoneDisplay: shop.contact.phone,
  };
}

export function renderHome(shop: ShopConfig, content: ShopContent, theme: ThemeKey, q: string): string {
  const ctx = buildCtx(shop, content, q);
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
  const ctx = buildCtx(shop, content, q, pdp);
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
  const ctx = buildCtx(shop, content, q);
  return (
    renderStudioHeader(ctx) +
    "<main>" + renderStudioCollection(ctx, collection) + "</main>" +
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
  const ctx = buildCtx(shop, content, q);
  return (
    renderStudioHeader(ctx) +
    "<main>" + renderStudioShopHub(ctx) + "</main>" +
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
): string {
  const ctx = buildCtx(shop, content, q);
  return renderStudioHeader(ctx) + renderStudioPage(ctx, page) + renderStudioFooter(ctx);
}

export function renderPlaceholder(
  shop: ShopConfig,
  content: ShopContent,
  title: string,
  q: string,
  theme: ThemeKey,
): string {
  const ctx = buildCtx(shop, content, q);
  const head = theme === "studio" ? renderStudioHeader(ctx) : renderHeader(ctx);
  const foot = theme === "studio" ? renderStudioFooter(ctx) : renderFooter(ctx);
  return (
    head +
    '<main><section class="act"><div class="wrap placeholder"><div>' +
    '<p class="eyebrow">' + esc(shop.name) + "</p>" +
    '<h1 class="display" style="margin-top:14px">' + esc(title) + "</h1>" +
    "<p>Stran je v pripravi. Medtem si oglejte ponudbo ali nas pokličite.</p>" +
    '<a class="btn btn-fill" href="/' + q + '">Na začetno stran</a>' +
    "</div></div></section></main>" +
    foot
  );
}

