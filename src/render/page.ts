import type { ShopConfig } from "../tenants/types";
import type { ShopContent } from "../content/types";
import { THEME_CATALOG, type ThemeKey } from "../themes/catalog";
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

import { STUDIO_FONTS_HREF } from "../themes/studio/tokens";
import {
  renderStudioExtras,
  renderStudioFooter,
  renderStudioHeader,
  renderStudioPdp,
  renderStudioSection,
} from "../themes/studio";

/**
 * Font payload per theme — no page should pay for faces it cannot render.
 */
const FONTS_BASE =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Archivo:wdth,wght@62..125,400..800&family=Hanken+Grotesk:wght@300..800&family=Marcellus&display=swap";

/**
 * One font origin per theme. Studio used to need a second (Fontshare, for
 * Clash Display and Satoshi); substituting those for verified Google faces
 * retired it, which also closed the render-blocking-third-party debt
 * docs/SEO.md §4 had recorded against this theme.
 */
function fontLinks(theme: ThemeKey): string {
  return (
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="' + (theme === "studio" ? STUDIO_FONTS_HREF : FONTS_BASE) + '">'
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
  devBar?: string | undefined;
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
    (o.devBar ?? "") +
    o.bodyHtml +
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

export function productJsonLd(s: ShopConfig, c: ShopContent): object {
  // NOTE deliberately absent: Review / AggregateRating. Placeholder reviews
  // render as page copy only — fabricated review schema is a manual-action
  // magnet, and this network's strategy is SEO (docs/SEO.md §3).
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: c.pdp.title,
    description: c.pdp.sub,
    brand: { "@type": "Brand", name: s.name },
    offers: {
      "@type": "Offer",
      url: s.siteUrl + s.routeSlugs["/product"] + "/" + c.pdp.slug,
      priceCurrency: s.currency,
      price: (c.pdp.priceCents / 100).toFixed(2),
      availability: "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export function buildCtx(shop: ShopConfig, content: ShopContent, q: string): RenderCtx {
  return {
    shop,
    content,
    q,
    phoneHref: "tel:" + shop.contact.phone.replace(/\s+/g, ""),
    phoneDisplay: shop.contact.phone,
  };
}

export function renderHome(shop: ShopConfig, content: ShopContent, theme: ThemeKey, q: string): string {
  const ctx = buildCtx(shop, content, q);
  const composition = THEME_CATALOG[theme].composition.home;
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
    ? renderStudioHeader(ctx) + "<main>" + body + "</main>" + renderStudioFooter(ctx)
    : renderHeader(ctx) + "<main>" + body + "</main>" + renderFooter(ctx);
}

export function renderPdp(
  shop: ShopConfig,
  content: ShopContent,
  q: string,
  theme: ThemeKey,
): string {
  const ctx = buildCtx(shop, content, q);
  if (theme === "studio") {
    return renderStudioHeader(ctx) + "<main>" + renderStudioPdp(ctx) + "</main>" + renderStudioFooter(ctx);
  }
  return renderHeader(ctx) + "<main>" + renderPdpBody(ctx) + "</main>" + renderFooter(ctx);
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

/** Dev-only switcher: links across shops and themes on the QA host. */
export function renderDevBar(currentShop: string, currentTheme: ThemeKey): string {
  const shopLinks = Object.keys(SHOPS)
    .map(
      (k) =>
        '<a href="/?shop=' + k + '"' + (k === currentShop ? ' aria-current="true"' : "") + ">" +
        k.toUpperCase() + "</a>",
    )
    .join("");
  const themeLinks = (Object.keys(THEME_CATALOG) as ThemeKey[])
    .map(
      (k) =>
        '<a href="/?shop=' + currentShop + "&theme=" + k + '"' +
        (k === currentTheme ? ' aria-current="true"' : "") + ">" + k.toUpperCase() + "</a>",
    )
    .join("");
  return (
    '<div class="devbar"><div class="wrap">' +
    "<span>TRGOVINA·KERNEL</span>" +
    '<span class="lbl">TRGOVINA</span><span>' + shopLinks + "</span>" +
    '<span class="lbl">TEMA</span><span>' + themeLinks + "</span>" +
    '<span class="lbl">QA — noindex</span>' +
    "</div></div>"
  );
}
