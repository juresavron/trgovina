/**
 * TRGOVINA — the multi-shop storefront Worker (chassis v0).
 *
 * One Worker serves every shop; the tenant resolves per-request from the
 * Host header (onlyworld doctrine). Unknown host = hard 404 at the edge —
 * cross-shop canonical leakage is the worst available bug in a keyword
 * network. Pre-live shops serve 503 + noindex on their real domains; the
 * workers.dev host is the QA surface (always noindex).
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
  renderDocument,
  renderHome,
  renderPdp,
  renderPlaceholder,
} from "./render/page";
import { handleAdmin, handleMedia } from "./admin/routes";
import type { Env } from "./admin/supabase";

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

  // NO OVERRIDES, AND NO SWITCHER.
  //
  // The QA host used to carry a bar across the top listing every shop and
  // every theme, with ?shop= and ?theme= to move between them. It earned its
  // place when the network was six storefronts across four themes and the
  // only way to see a combination was to visit it. There is one shop and one
  // theme now, so the bar listed a choice of one against a choice of one,
  // above the hero, on every page a reviewer looked at.
  //
  // The query-propagation machinery went with it. `q` was appended to every
  // internal link so an override survived navigation; with nothing to
  // override it is an empty string that every href still concatenates, which
  // is cheap enough to leave and clearer than removing the parameter from
  // forty call sites.
  //
  // Unknown query parameters are simply ignored, as they always were — the
  // overrides were validated against known keys and never reflected raw, and
  // that property is now trivially true.
  const theme: ThemeKey = shop.design.theme;
  const q = "";

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
    // /admin and /media are never crawlable. /admin is behind a password and
    // noindexed at the header, but a Disallow costs nothing and keeps it out
    // of the crawl budget of a shop whose whole strategy is SEO. /media is
    // image bytes: useful to a visitor, noise in a page index.
    const body = open
      ? "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /media/\n\nSitemap: " +
        shop.siteUrl + "/sitemap.xml\n"
      : "User-agent: *\nDisallow: /\n";
    return new Response(body, {
      headers: { "content-type": "text/plain; charset=utf-8", ...baseHeaders },
    });
  }

  // sitemap.xml — only for live shops on their real domain.
  if (path === "/sitemap.xml") {
    if (!shop.live || dev) return new Response("Not found", { status: 404 });
    // Every model page, not just the flagship. A catalogue whose sitemap
    // lists one of nine is a catalogue eight of whose pages are only
    // discoverable by crawl.
    const urls = [
      "/",
      ...(content.pdps ?? [content.pdp]).map((d) => shop!.routeSlugs["/product"] + "/" + d.slug),
    ];
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
      bodyHtml: renderHome(shop, content, theme, q),
      jsonLd: [organizationJsonLd(shop)],
    });
    return htmlResponse(doc, 200, baseHeaders);
  }

  // Product pages. A shop may sell one model or a catalogue; the flagship is
  // simply the first entry, so there is one code path either way.
  const productBase = shop.routeSlugs["/product"] + "/";
  if (path.startsWith(productBase)) {
    const wanted = path.slice(productBase.length);
    const pdp = (content.pdps ?? [content.pdp]).find((d) => d.slug === wanted);
    if (pdp) {
      const pdpPath = productBase + pdp.slug;
      const doc = renderDocument({
        shop,
        content,
        theme,
        path: pdpPath,
        title: pdp.title + " — " + shop.keyword.primary + " | " + shop.name,
        description: pdp.sub,
        noindex: dev,
        q,
        bodyHtml: renderPdp(shop, content, q, theme, pdp),
        jsonLd: [organizationJsonLd(shop), productJsonLd(shop, content, pdp)],
      });
      return htmlResponse(doc, 200, baseHeaders);
    }
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
        bodyHtml: renderPlaceholder(shop, content, title, q, theme),
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
    bodyHtml: renderPlaceholder(shop, content, "Te strani ni.", q, theme),
  });
  return htmlResponse(doc, 404, { ...baseHeaders, "x-robots-tag": "noindex, nofollow" });
}

/**
 * The entry point.
 *
 * The storefront's own `handleRequest` stays SYNCHRONOUS and env-free: it is
 * pure rendering, every one of its tests calls it directly, and nothing about
 * serving a page needs to await anything. The back office does — it talks to
 * Supabase — so it sits in an async layer in front rather than turning the
 * whole renderer async to accommodate it.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const path = new URL(request.url).pathname;
      if (path === "/admin" || path.startsWith("/admin/")) return await handleAdmin(request, env);
      if (path.startsWith("/media/")) return await handleMedia(request, env);
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
