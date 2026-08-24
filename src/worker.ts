/**
 * TRGOVINA — the multi-shop storefront Worker (chassis v0).
 *
 * One Worker serves every shop; the tenant resolves per-request from the
 * Host header (onlyworld doctrine). Unknown host = hard 404 at the edge —
 * cross-shop canonical leakage is the worst available bug in a keyword
 * network. Pre-live shops serve 503 + noindex on their real domains; the
 * workers.dev host is the QA surface (always noindex) with a dev-only
 * shop/theme switcher.
 *
 * v0 renders home + flagship PDP fully, placeholders for the remaining
 * routes. Checkout, guides and the interactive islands land in later
 * stages (docs/ARCHITECTURE.md "Build order").
 */

import { SHOPS, resolveShop, isDevHost, type ShopConfig } from "./tenants";
import type { InternalRouteKey } from "./tenants/types";
import { CONTENT } from "./content";
import { THEME_CATALOG, type ThemeKey } from "./themes/catalog";
import {
  organizationJsonLd,
  productJsonLd,
  renderDevBar,
  renderDocument,
  renderHome,
  renderPdp,
  renderPlaceholder,
} from "./render/page";

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function htmlResponse(body: string, status: number, extra?: Record<string, string>): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...extra,
    },
  });
}

/** Titles for placeholder routes, per internal key. */
const PLACEHOLDER_TITLES: Partial<Record<InternalRouteKey, string>> = {
  "/products": "Ponudba",
  "/compare": "Primerjava modelov",
  "/guides": "Vodniki",
  "/delivery": "Dostava in montaža",
  "/showroom": "Razstavni salon",
  "/financing": "Financiranje",
  "/about": "O nas",
  "/contact": "Kontakt",
  "/faq": "Pogosta vprašanja",
  "/cart": "Košarica",
  "/checkout": "Blagajna",
  "/terms": "Pogoji poslovanja",
  "/privacy": "Zasebnost",
  "/cookies": "Piškotki",
  "/withdrawal": "Odstop od pogodbe",
};

export function handleRequest(request: Request): Response {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.hostname;

  let shop = resolveShop(host);
  if (!shop) {
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const dev = isDevHost(host);

  // Dev-only overrides, validated against known keys — never reflected raw.
  let theme: ThemeKey = shop.design.theme;
  let q = "";
  if (dev) {
    const qsShop = url.searchParams.get("shop");
    if (qsShop && SHOPS[qsShop]) shop = SHOPS[qsShop];
    theme = shop.design.theme;
    const qsTheme = url.searchParams.get("theme");
    if (qsTheme && (THEME_CATALOG as Record<string, unknown>)[qsTheme]) {
      theme = qsTheme as ThemeKey;
    }
    const parts: string[] = [];
    if (qsShop && SHOPS[qsShop]) parts.push("shop=" + shop.key);
    if (qsTheme && qsTheme !== shop.design.theme && (THEME_CATALOG as Record<string, unknown>)[qsTheme]) {
      parts.push("theme=" + theme);
    }
    q = parts.length ? "?" + parts.join("&") : "";
  }

  // Canonicalization: lowercase path, no trailing slash (root excepted).
  let path = url.pathname;
  const canonicalPath = (path === "/" ? "/" : path.replace(/\/+$/, "")).toLowerCase() || "/";
  if (canonicalPath !== path) {
    return Response.redirect(url.origin + canonicalPath + (q || url.search ? url.search : ""), 308);
  }

  const content = CONTENT[shop.key];
  if (!content) {
    return new Response("Shop content missing", { status: 500 });
  }

  const baseHeaders: Record<string, string> = dev
    ? { "x-robots-tag": "noindex, nofollow", "cache-control": "no-store" }
    : { "cache-control": "public, max-age=0, s-maxage=300" };

  // robots.txt — closed until a shop is live; QA host permanently closed.
  if (path === "/robots.txt") {
    const open = shop.live && !dev;
    const body = open
      ? "User-agent: *\nAllow: /\n\nSitemap: " + shop.siteUrl + "/sitemap.xml\n"
      : "User-agent: *\nDisallow: /\n";
    return new Response(body, {
      headers: { "content-type": "text/plain; charset=utf-8", ...baseHeaders },
    });
  }

  // sitemap.xml — only for live shops on their real domain.
  if (path === "/sitemap.xml") {
    if (!shop.live || dev) return new Response("Not found", { status: 404 });
    const urls = ["/", shop.routeSlugs["/product"] + "/" + content.pdp.slug];
    const body =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      urls.map((u) => "<url><loc>" + shop!.siteUrl + u + "</loc></url>").join("") +
      "</urlset>";
    return new Response(body, {
      headers: { "content-type": "application/xml; charset=utf-8", ...baseHeaders },
    });
  }

  // Live gate: a pre-live shop on its production domain serves 503 + noindex
  // (meta AND header) so domains can be attached early without leaking.
  if (!shop.live && !dev) {
    const doc = renderDocument({
      shop,
      content,
      theme,
      path: "/",
      title: shop.name + " — kmalu",
      description: content.metaDescription,
      noindex: true,
      q: "",
      bodyHtml:
        '<main><section class="act"><div class="wrap placeholder"><div>' +
        '<p class="eyebrow">' + shop.name + "</p>" +
        '<h1 class="display" style="margin-top:14px">Kmalu.</h1>' +
        "<p>Trgovina se pripravlja. Pokličite nas na " + shop.contact.phone + ".</p>" +
        "</div></div></section></main>",
    });
    return htmlResponse(doc, 503, {
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "no-store",
      "retry-after": "86400",
    });
  }

  const devBar = dev ? renderDevBar(shop.key, theme) : undefined;

  // Home — THE keyword landing page.
  if (path === "/") {
    const doc = renderDocument({
      shop,
      content,
      theme,
      path: "/",
      title: cap(shop.keyword.primary) + " — cena, dostava in montaža | " + shop.name,
      description: content.metaDescription,
      noindex: dev,
      q,
      devBar,
      bodyHtml: renderHome(shop, content, theme, q),
      jsonLd: [organizationJsonLd(shop)],
    });
    return htmlResponse(doc, 200, baseHeaders);
  }

  // Flagship PDP.
  const pdpPath = shop.routeSlugs["/product"] + "/" + content.pdp.slug;
  if (path === pdpPath) {
    const doc = renderDocument({
      shop,
      content,
      theme,
      path: pdpPath,
      title: content.pdp.title + " — " + shop.keyword.primary + " | " + shop.name,
      description: content.pdp.sub,
      noindex: dev,
      q,
      devBar,
      bodyHtml: renderPdp(shop, content, q),
      jsonLd: [organizationJsonLd(shop), productJsonLd(shop, content)],
    });
    return htmlResponse(doc, 200, baseHeaders);
  }

  // Known top-level routes render a styled placeholder (noindex until real).
  for (const [key, title] of Object.entries(PLACEHOLDER_TITLES)) {
    if (path === shop.routeSlugs[key as InternalRouteKey]) {
      const doc = renderDocument({
        shop,
        content,
        theme,
        path,
        title: title + " | " + shop.name,
        description: content.metaDescription,
        noindex: true,
        q,
        devBar,
        bodyHtml: renderPlaceholder(shop, content, title, q),
      });
      return htmlResponse(doc, 200, { ...baseHeaders, "x-robots-tag": "noindex, nofollow" });
    }
  }

  // Unknown path — styled 404.
  const doc = renderDocument({
    shop,
    content,
    theme,
    path,
    title: "Stran ne obstaja | " + shop.name,
    description: content.metaDescription,
    noindex: true,
    q,
    devBar,
    bodyHtml: renderPlaceholder(shop, content, "Te strani ni.", q),
  });
  return htmlResponse(doc, 404, { ...baseHeaders, "x-robots-tag": "noindex, nofollow" });
}

export default {
  fetch(request: Request): Response {
    try {
      return handleRequest(request);
    } catch (err) {
      console.error(err);
      return new Response("Napaka na strežniku.", {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  },
};
