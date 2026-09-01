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
import type { PdpContent, ShopContent } from "./content/types";
import { CONTENT } from "./content";
import { PAGES, type Page } from "./content/pages";
import { GUIDE_PAGES } from "./content/pages/vodnik";
import { THEME_CATALOG, type ThemeKey } from "./themes/catalog";
import {
  buildCtx,
  organizationJsonLd,
  websiteJsonLd,
  productJsonLd,
  renderDocument,
  renderHome,
  renderPdp,
  renderCollection,
  renderContentPage,
  renderPlaceholder,
  renderShopHub,
  breadcrumbJsonLd,
  itemListJsonLd,
  faqJsonLd,
} from "./render/page";
import { sitemapPaths, sitemapXml } from "./render/sitemap";
import { assetResponse } from "./render/assets";
import { renderStudioFinder } from "./themes/studio/finder";
import { handleAdmin, handleMedia } from "./admin/routes";
import { handlePosts } from "./blog/routes";
import type { Env } from "./admin/supabase";
import { PROBLEM_FIELD, PROBLEM_TEXT, parseEnquiry, submitEnquiry } from "./enquiry/submit";

/**
 * The product a ?model= parameter names, or nothing.
 *
 * Matched against the shop's own pdps by exact slug — there is no fuzzy
 * lookup and no fallback to the flagship, because guessing which product a
 * visitor meant is worse than not knowing. Everything downstream then works
 * with catalogue data rather than with a string off the wire.
 */
/**
 * The FAQPage node for a page that asks questions, or nothing.
 *
 * Every qa block on the page contributes, in order, so /pogosta-vprasanja
 * offers all four of its groups and a page that happens to carry one
 * question set offers that. Fewer than two questions is not an FAQ and Google
 * will not show an accordion for it, so it is left off rather than published
 * to be ignored.
 */
function faqFor(page: Page): object[] {
  // Opt-in, not "has two questions" — see Page.faqPage for why that spread it
  // to an about page and a contact page.
  if (!page.faqPage) return [];
  const items = page.blocks.flatMap((b) => (b.kind === "qa" ? b.items : []));
  return items.length >= 2 ? [faqJsonLd(items)] : [];
}

function modelParam(url: URL, content: ShopContent): PdpContent | undefined {
  const slug = url.searchParams.get("model");
  if (!slug) return undefined;
  return (content.pdps ?? []).find((p) => p.slug === slug);
}

/**
 * What the visitor configured on the product page, resolved against that
 * model's own options.
 *
 * The buy column is a GET form (themes/studio/pdp.ts), so a press of
 * "Povprašajte za ponudbo" arrives here as ?model=…&cfg0=…&barva=…&oprema=…
 *
 * ⚠️ EVERY VALUE IS MATCHED AGAINST THE CATALOGUE AND DROPPED IF IT DOES NOT
 * MATCH. This is the same rule ?model= has always followed and it matters more
 * here, because there are now six or seven parameters instead of one: a string
 * off the wire must never become page text, and an enquiry printed back to a
 * visitor is exactly the shape of page where reflected content would land.
 * What survives is a pair of strings this repository wrote.
 *
 * The parameter names are positional (cfg0, cfg1) because the groups are —
 * they are content, and a shop that renames a group should not break a link
 * somebody bookmarked. A missing group simply contributes nothing.
 */
function chosenParams(
  url: URL,
  pdp: PdpContent | undefined,
): readonly (readonly [string, string])[] {
  if (!pdp) return [];
  const out: [string, string][] = [];
  pdp.cfg.forEach((g, gi) => {
    const v = url.searchParams.get("cfg" + String(gi));
    if (v && g[1].includes(v)) out.push([g[0], v]);
  });
  const shell = url.searchParams.get("barva");
  if (shell && (pdp.finishes ?? []).includes(shell)) out.push(["Barva školjke", shell]);
  const cabinet = url.searchParams.get("obloga");
  if (cabinet && (pdp.cabinetFinishes ?? []).includes(cabinet)) {
    out.push(["Barva obloge", cabinet]);
  }
  // The extras are one parameter repeated, so they collapse to one row —
  // "Dodatna oprema: Termo pokrov, Stopnice" reads as a list, where five rows
  // saying "Dodatna oprema" read as a rendering fault.
  const offered = new Set((pdp.addons ?? []).map((a) => a.label));
  const extras = url.searchParams.getAll("oprema").filter((v) => offered.has(v));
  if (extras.length > 0) out.push(["Dodatna oprema", extras.join(", ")]);
  return out;
}

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

// Security headers on everything public. nosniff stops a browser
// reinterpreting a response against its declared type; the referrer policy
// keeps full URLs (with ?model= choices in them) off third-party request
// logs; the permissions policy declares the powerful APIs this site simply
// does not use. Module scope because the FIRST responses out of the handler
// — the unknown-host 404, the 405, the canonicalizing 308 — need them before
// any per-request state exists. No CSP here yet: the admin has a strict one,
// and a public one is worth doing deliberately once, not as a header dropped
// in a list.
/**
 * The mark on the address that says an enquiry was filed.
 *
 * Slovenian, like every other parameter this site reads (?model=, ?barva=),
 * and valueless: it is a flag, and "?poslano=1" would invite somebody to
 * wonder what 2 means.
 */
const SENT_PARAM = "poslano";

/**
 * The mark the sample-book link carries, and the sentence it puts in the box.
 *
 * ⚠️ THE LINK PROMISED SOMETHING THE PAGE AT THE OTHER END DID NOT KNOW ABOUT.
 * "Naročite vzorčnik barv" on every product page went to /kontakt?model=…,
 * which renders a general enquiry form headed "Povprašujete za BAZEN 230" and
 * says nothing about swatches anywhere. The visitor asked for one thing and
 * was handed a different form; the shop received an enquiry with no way to
 * tell it apart from any other.
 *
 * A FLAG, AND THE WORDS COME FROM HERE. The parameter carries no value — its
 * presence is the whole message — because this file's rule is that a string
 * off the wire never becomes page text, and a prefilled textarea is page
 * text. What lands in the box is this constant, which the visitor can edit or
 * delete like anything else they typed.
 */
const SWATCH_PARAM = "vzorcnik";
// ⚠️ THE MESSAGE MOVED TO THE SHOP; THE FLAG DID NOT. Carrying a flag in the
// URL rather than the sentence is still right — a message a visitor could
// type into the address bar and see rendered back is the bug that design
// avoids. What was wrong is that the sentence itself was a module constant
// describing a hot tub's shell, prefilled into the form as something the
// visitor had written. See ShopContent.swatchMessage.

const SECURITY = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
} as const;

/** Titles for placeholder routes, per internal key. */
const PLACEHOLDER_TITLES: Partial<Record<InternalRouteKey, string>> = {
  "/products": "Ponudba",
  "/compare": "Primerjava modelov",
  "/guides": "Vodniki",
  "/delivery": "Dostava in montaža",
  "/showroom": "Ogled lokacije",
  "/about": "O nas",
  "/contact": "Kontakt",
  "/faq": "Pogosta vprašanja",
  "/cart": "Košarica",
  "/checkout": "Blagajna",
  // Routed even though nothing links to it yet: the slug exists in
  // routeSlugs, and a configured route that 404s is a landmine for the day
  // checkout wires up and redirects here.
  //
  // ⚠️ "Naročilo", NOT "Naročilo uspešno", AND IT SAID THE SECOND. This is the
  // one route left that still falls through to the placeholder, so the page
  // rendered an h1 reading "Naročilo uspešno" above a paragraph reading
  // "Stran je v pripravi" — a page announcing that an order succeeded and
  // that it does not exist yet, in that order. bazen sets ordersOnline:false
  // and takes enquiries, so no order can have succeeded: nothing on the site
  // can produce this page, and anyone who reaches it by URL is being told
  // something that did not happen. A heading may not assert an outcome the
  // shop cannot have produced. The enquiry confirmation is a different page
  // and has its own address — see SENT_PARAM.
  "/order-success": "Naročilo",
  "/terms": "Pogoji poslovanja",
  "/privacy": "Zasebnost",
  "/cookies": "Piškotki",
  "/withdrawal": "Odstop od pogodbe",
};

export function handleRequest(
  request: Request,
  /**
   * How an enquiry submission went, when this call is answering one.
   *
   * ⚠️ AN OUTCOME, NEVER A CONNECTION. The write happens in the async layer
   * (see the default export), which awaits Supabase and then calls this with
   * the result as a plain value. handleRequest therefore stays synchronous
   * and env-free — the property every one of its tests depends on — while
   * the page a visitor gets after pressing the button is rendered by exactly
   * the same code that rendered the page they pressed it on.
   */
  enquiry?: {
    readonly done?: boolean;
    readonly error?: string;
    /** What was typed, when the submission was refused. See sections.ts. */
    readonly sent?: Readonly<Record<string, string>>;
    readonly field?: string | null;
  },
): Response {
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.hostname;

  let shop = resolveShop(host);
  if (!shop) {
    // Bare text, full headers: an unknown host earns nothing, but the
    // response it does get should still refuse sniffing and caching.
    return new Response("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
        ...SECURITY,
      },
    });
  }

  const dev = isDevHost(host);

  /**
   * ⚠️ THE CONFIRMATION IS A GET NOW — POST/REDIRECT/GET.
   *
   * The success page used to be the 200 answering the POST itself, and the
   * comment in the async layer defended it: "the page a visitor sees after
   * pressing the button is the page they pressed it on, re-rendered, with no
   * redirect and no second template". Everything in that sentence is still
   * true of the FAILURE path, where it earns its keep — the typed values are
   * still in the body and re-rendering keeps them.
   *
   * It does not hold for success. A POST result left in the history entry is
   * a page that re-submits when the visitor pulls to refresh or presses back
   * and forward: the browser asks "Confirm form resubmission", and whoever
   * says yes files the same enquiry twice — into a table this shop reads by
   * hand. So a written enquiry answers 303 to ?poslano and the confirmation
   * is rendered by an ordinary GET, which is safe to refresh, bookmark,
   * share and go back to.
   *
   * There is no second template: the done state is the same block the POST
   * used to render, reached through the same outcome value. Nothing here can
   * fake a submission that matters — a visitor who types ?poslano gets a
   * sentence saying we will be in touch and no row is written.
   */
  const onContact =
    request.method === "GET" && url.pathname === shop.routeSlugs["/contact"];
  const confirmed = onContact && url.searchParams.has(SENT_PARAM);
  const swatches = onContact && url.searchParams.has(SWATCH_PARAM);
  /**
   * ⚠️ TWO GETs NOW REACH THE ENQUIRY BLOCK, and neither is a submission. The
   * outcome value was built for the POST alone; it is the only channel the
   * renderer has for "draw the form differently", and both of these want
   * exactly that — one replaces the form with the confirmation, the other
   * arrives with a sentence already in the message box. Neither writes a row.
   */
  // ⚠️ BUILT LOWER DOWN NOW, because the swatch sentence belongs to the shop
  // and the shop's content is not resolved yet at this point in the request.
  // See below the CONTENT lookup.

  // The storefront speaks GET and HEAD, and POST on exactly one path.
  //
  // The product page's configurator is still a GET — it carries a selection
  // to /kontakt and changes nothing — but the enquiry form on that page is a
  // real write, so /kontakt answers POST. Nothing else does: a POST anywhere
  // else is a mistake or a probe, and answering it with a rendered 200 let
  // OPTIONS read as CORS consent. The admin, the media proxy and the blog
  // take their methods before this runs.
  //
  // ⚠️ THE CHECK IS ON `enquiry`, NOT ON THE PATH ALONE. This function is
  // reached with a POST only through the async layer, which has already
  // written the row and is passing the outcome down; a POST that arrives any
  // other way has done nothing and is refused exactly as before. So the
  // method gate cannot become a way to render /kontakt without a submission
  // ever having happened.
  const isEnquiryPost =
    request.method === "POST" &&
    enquiry !== undefined &&
    url.pathname === shop.routeSlugs["/contact"];
  if (!isEnquiryPost && request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        allow: "GET, HEAD",
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        ...SECURITY,
      },
    });
  }

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

  // Canonicalization: lowercase path, collapsed slashes, no trailing slash
  // (root excepted). Interior runs too — "//trgovina" 404'd where one 308
  // was the honest answer, and a doubled slash is the classic pasted-URL
  // artefact.
  let path = url.pathname;
  const canonicalPath =
    (path === "/" ? "/" : path.replace(/\/{2,}/g, "/").replace(/\/+$/, "")).toLowerCase() || "/";
  if (canonicalPath !== path) {
    // Response.redirect() cannot carry headers, and a 308 is heuristically
    // cacheable by shared caches — so the redirect states its own policy
    // (and, on the QA host, its own noindex) like every other response.
    return new Response(null, {
      status: 308,
      headers: {
        location: url.origin + canonicalPath + url.search,
        ...(dev
          ? { "x-robots-tag": "noindex, nofollow", "cache-control": "no-store" }
          : { "cache-control": "public, max-age=0, s-maxage=300" }),
        ...SECURITY,
      },
    });
  }

  const content = CONTENT[shop.key];
  if (!content) {
    return new Response("Shop content missing", { status: 500 });
  }

  const outcome =
    enquiry ??
    (confirmed
      ? { done: true }
      : swatches
        ? { sent: { sporocilo: content.swatchMessage } }
        : undefined);

  // Security headers on everything public. nosniff stops a browser
  // reinterpreting a response against its declared type; the referrer policy
  // keeps full URLs (with ?model= choices in them) off third-party request
  // logs; the permissions policy declares the powerful APIs this site simply
  // does not use. No CSP here yet — the admin has a strict one, and a public
  // one is worth doing deliberately once, not as a header dropped in a list.
  const baseHeaders: Record<string, string> = dev
    ? { "x-robots-tag": "noindex, nofollow", "cache-control": "no-store", ...SECURITY }
    : { "cache-control": "public, max-age=0, s-maxage=300", ...SECURITY };
  // ⚠️ AN ENQUIRY REPLY IS NEVER CACHED, and the default here would have
  // cached it. RFC 9111 makes a response to POST cacheable precisely when it
  // carries explicit freshness, which "public, s-maxage=300" is — so without
  // this line a shared cache could hold one visitor's "Povpraševanje je
  // oddano" and hand it to the next person who asked for /kontakt. The reply
  // is also personal: it re-renders the page around what THEY configured.
  if (isEnquiryPost || confirmed) baseHeaders["cache-control"] = "no-store";

  // The stylesheet and the behaviour script, content-addressed and immutable
  // — see render/assets.ts. Before the live gate on purpose: a pre-live
  // shop's own 503 page still links them.
  const asset = assetResponse(path);
  if (asset) {
    for (const [k, v] of Object.entries(SECURITY)) asset.headers.set(k, v);
    return asset;
  }

  // robots.txt — closed until a shop is live; QA host permanently closed.
  if (path === "/robots.txt") {
    const open = shop.live && !dev;
    // /admin is never crawlable: it is behind a password and noindexed at the
    // header, but a Disallow costs nothing and keeps it out of the crawl
    // budget of a shop whose whole strategy is SEO.
    //
    // ⚠️ /media IS CRAWLABLE, AND THE RULE THAT BLOCKED IT WOULD HAVE COST THE
    // PRICE SNIPPET ON EVERY PRODUCT PAGE.
    //
    // The old rule read "Disallow: /media/" and justified it as "image bytes:
    // useful to a visitor, noise in a page index". That reasoning does not
    // hold: an image referenced from an indexed page goes to IMAGE search, not
    // into the page index, so blocking it buys nothing — and it costs a great
    // deal. Every Product.image and every og:image on this site is a /media/
    // URL, and Google requires the image of a Product rich result to be
    // CRAWLABLE. A blocked one disqualifies the rich result, which is the
    // price snippet, on all six product pages — on a shop where the goods run
    // from 6.690 to 21.690 EUR and "cena" is attached to almost every query.
    // It also empties every social share card and forfeits Image search in a
    // category people shop by eye.
    //
    // If the images should stay out of WEB results, the tool for that is an
    // X-Robots-Tag: noindex on the /media response, which still permits the
    // crawl the rich result needs. A Disallow forbids the crawl itself.
    const body = open
      ? "User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: " +
        shop.siteUrl + "/sitemap.xml\n"
      : "User-agent: *\nDisallow: /\n";
    return new Response(body, {
      headers: { "content-type": "text/plain; charset=utf-8", ...baseHeaders },
    });
  }

  // sitemap.xml — only for live shops on their real domain.
  if (path === "/sitemap.xml") {
    if (!shop.live || dev) {
      return new Response("Not found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8", ...baseHeaders },
      });
    }
    // ⚠️ THE PATHS AND THE XML LIVE IN render/sitemap.ts, because the blog
    // builds this document too — it has to add the posts, and it cannot ask a
    // synchronous renderer what has been published. Two implementations of
    // "which pages does this shop have" is how one of them ends up stale.
    // ⚠️ false, AND IT IS NOT A GUESS — see the parameter's own note. This
    // fallback runs exactly when the blog layer could not confirm a single
    // published post, and an empty blog index is noindex.
    const body = sitemapXml(shop, sitemapPaths(shop, content, false));
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
      // Launch eve is exactly when crawlers hammer this host — the holding
      // page gets the same security posture as every other response.
      ...SECURITY,
    });
  }


  // Home — THE keyword landing page.
  if (path === "/") {
    const doc = renderDocument({
      shop,
      content,
      theme,
      path: "/",
      // 60 characters is where Google stops drawing a title, and the shop's
      // name grew: "Masažni bazeni Vrelec" is 21 of them, which took this
      // line to 64 and cut "Vrelec" off the end of the one result that
      // matters most. The head keeps the keyword and the two words a buyer
      // searches with; "montaža" is in the nav, in the trust strip and on its
      // own page, so losing it here costs nothing and buys the brand back.
      // ⚠️ HALF THIS LINE USED TO KNOW WHICH SHOP IT WAS ON. The keyword was
      // interpolated and "cena in dostava" was typed, on the single
      // highest-value string the site emits. The tail is now the shop's own —
      // see ShopContent.homeTitleTail.
      title:
        cap(shop.keyword.primary) + " — " + content.homeTitleTail + " | " + shop.name,
      description: content.metaDescription,
      noindex: dev,
      q,
      bodyHtml: renderHome(shop, content, theme, q),
      // The WebSite node is a home-page thing: it is where Google reads the
      // name to print above a result instead of the bare domain, and putting
      // it on all twenty-five routes would say the same thing twenty-five
      // times. The Organization it names as publisher is right beside it.
      jsonLd: [organizationJsonLd(shop), websiteJsonLd(shop)],
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
        // The FAMILY keyword, not the shop's primary: "SWIM 450 — swim spa",
        // "BAZEN 230 — masažni bazen". The collection pages hold these two
        // apart as different queries; the titles must not merge them back.
        title: pdp.title + " — " + (pdp.titleSpec ?? pdp.family) + " | " + shop.wordmark[1],
        // ⚠️ THE PRICE, AND ONLY IN THE HEAD TAG. pdp.sub is three strings at
        // once — the sentence under the h1, the JSON-LD Product description and
        // this meta description — and it stopped one clause short of the number
        // that decides the click. On a product result the price is what
        // pre-qualifies a visitor and suppresses the bounce from somebody
        // expecting 3.000 €; swim-450's whole snippet was 83 characters for a
        // 16.790 € object, with roughly 70 unused.
        //
        // Appended HERE rather than in pdp.sub so the on-page sentence and the
        // structured description are untouched — the page renders the price in
        // its own bar and the Offer states it as a number, and repeating it in
        // both would be saying it three times.
        description: pdp.sub + " Cena " + pdp.price + " z DDV.",
        noindex: dev,
        ogType: "product",
        q,
        // The model's own lead photograph on the share card. A product link
        // sent to somebody's partner should show the product, not the shop's
        // hero — and where a model has no photography yet the hero is still
        // the right stand-in, which is renderDocument's default.
        // The alt travels with the picture: og:image:alt described the PAGE
        // until now, on the six pages that actually have a photograph to
        // describe. See PageOptions.imageAlt.
        ...(pdp.photos && pdp.photos[0]
          ? {
              image: pdp.photos[0].src,
              ...(pdp.photos[0].alt ? { imageAlt: pdp.photos[0].alt } : {}),
            }
          : {}),
        bodyHtml: renderPdp(shop, content, q, theme, pdp),
        jsonLd: [
          organizationJsonLd(shop),
          productJsonLd(shop, content, pdp),
          // The same trail the page already draws above the gallery, said in
          // the form a SERP can use — so the result reads
          // "Trgovina › Masažni bazeni › BAZEN 230" instead of the URL path.
          // The family is looked up rather than assumed: a model that belongs
          // to no collection gets the two-step trail, which is still true.
          breadcrumbJsonLd(shop, [
            { name: "Trgovina", path: shop.routeSlugs["/products"] },
            ...((content.collections ?? [])
              .filter((c) => c.products.some((p) => "slug" in p && p.slug === pdp.slug))
              .slice(0, 1)
              .map((c) => ({ name: c.navLabel, path: c.path }))),
            { name: pdp.title },
          ]),
        ],
      });
      return htmlResponse(doc, 200, baseHeaders);
    }
  }

  // The guided choice — three questions, one recommendation, all GET links.
  // Indexable: the entry page is stable content answering "kateri bazen je
  // pravi zame", and the terminal views link real model pages; the answer
  // permutations canonicalize to the entry so six leaf URLs cannot compete
  // with it in an index.
  if (path === shop.routeSlugs["/finder"]) {
    const p = url.searchParams;
    const answers = {
      ...(p.get("namen") ? { namen: p.get("namen")! } : {}),
      ...(p.get("osebe") ? { osebe: p.get("osebe")! } : {}),
      ...(p.get("prostor") ? { prostor: p.get("prostor")! } : {}),
      ...(p.get("masaza") ? { masaza: p.get("masaza")! } : {}),
    };
    const doc = renderDocument({
      shop,
      content,
      theme,
      path,
      title: "Kateri bazen je pravi za vas? | " + shop.name,
      description:
        "Tri vprašanja — namen, število oseb in prostor — in predlagamo " +
        "model iz naše ponudbe, z razlogi, ki jih lahko preverite v " +
        "specifikacijah.",
      noindex: dev,
      q,
      bodyHtml: renderStudioFinder(buildCtx(shop, content, q, content.pdp, path), answers),
      jsonLd: [
        organizationJsonLd(shop),
        breadcrumbJsonLd(shop, [{ name: "Domov", path: "/" }, { name: "Izbira bazena" }]),
      ],
    });
    return htmlResponse(doc, 200, baseHeaders);
  }

  // The shop hub — every family on one page. A real page, indexable, so
  // "Trgovina" in the nav answers "what do you sell?" rather than redirecting
  // to whichever family happens to be first.
  if (path === shop.routeSlugs["/products"] && (content.collections ?? []).length > 0) {
    const doc = renderDocument({
      shop,
      content,
      theme,
      path,
      // ⚠️ NOT THE HEAD TERM. This read "Trgovina — masažni bazen", and so did
      // the home page ("Masažni bazen — cena in dostava") and the hot-tub
      // collection ("Masažni bazeni"): three URLs on one site, all titled for
      // the same query, none of them saying which one a searcher wants. The
      // head term belongs to the home page, which leads with it; this is the
      // page that lists EVERY model with its price, and that is what it says.
      // The term is not lost either way — shop.name is "Masažni bazeni
      // Vrelec", so every title on this site carries it in the suffix.
      title: "Vsi modeli in cene | " + shop.name,
      // NOT content.metaDescription: that is the home page's, and two
      // indexable pages sharing one description give a search engine nothing
      // to tell them apart. Falls back only if a shop has not written one.
      description: content.hubMetaDescription ?? content.metaDescription,
      noindex: dev,
      q,
      bodyHtml: renderShopHub(shop, content, q, theme),
      jsonLd: [
        organizationJsonLd(shop),
        // Two items with a linked root, because a one-item trail is inert:
        // Google renders nothing for it, so the hub's SERP line stayed a URL.
        breadcrumbJsonLd(shop, [{ name: "Domov", path: "/" }, { name: "Trgovina" }]),
        // ⚠️ THE HUB CARRIES EVERY MODEL AND EMITTED NO LIST. Both collection
        // pages got an ItemList when that gap was found; the page that holds
        // the WHOLE catalogue was missed, so to a crawler the shop's index was
        // six anchors in a div.
        //
        // It now passes the RECORDS rather than the slugs — see
        // itemListJsonLd for why a list of bare URLs was the pattern that
        // asks a search engine for nothing.
        itemListJsonLd(
          shop,
          content,
          "Vsi modeli",
          // Derived from the collections rather than listed here, so the hub's
          // list cannot drift from the two category lists that are built from
          // the same arrays. Deduped by slug: a model in two families would
          // otherwise appear twice in one ItemList.
          (() => {
            const seen = new Set<string>();
            const out = [];
            for (const c of content.collections ?? []) {
              for (const p of c.products) {
                if (!("slug" in p) || typeof p.slug !== "string") continue;
                if (seen.has(p.slug)) continue;
                const d = (content.pdps ?? []).find((x) => x.slug === p.slug);
                if (!d) continue;
                seen.add(p.slug);
                out.push(d);
              }
            }
            return out;
          })(),
        ),
      ],
    });
    return htmlResponse(doc, 200, baseHeaders);
  }

  // Collection pages — one product family each, at its own URL. These are the
  // pages that rank: "masažni bazen" and "swim spa" are different queries with
  // different intent, and one URL cannot honestly serve both.
  for (const collection of content.collections ?? []) {
    if (path !== collection.path) continue;
    const doc = renderDocument({
      shop,
      content,
      theme,
      path,
      title: (collection.seoTitle ?? collection.h1) + " | " + shop.name,
      description: collection.metaDescription,
      noindex: dev,
      q,
      bodyHtml: renderCollection(shop, content, q, theme, collection),
      jsonLd: [
        organizationJsonLd(shop),
        breadcrumbJsonLd(shop, [
          { name: "Trgovina", path: shop.routeSlugs["/products"] },
          { name: collection.navLabel },
        ]),
        // These two pages are what the shop is built to rank, and to a
        // crawler they were three anchors in a div. Only the models that
        // actually have a product page are listed — a card without a slug is
        // not a URL, and a ListItem pointing at nothing is worse than a
        // shorter list.
        itemListJsonLd(
          shop,
          content,
          collection.h1,
          collection.products
            .map((p) => ("slug" in p ? p.slug : undefined))
            .filter((x): x is string => typeof x === "string")
            .map((slug) => (content.pdps ?? []).find((d) => d.slug === slug))
            .filter((d): d is NonNullable<typeof d> => d !== undefined),
        ),
      ],
    });
    return htmlResponse(doc, 200, baseHeaders);
  }

  // Editorial and legal pages. Real content, matched by the shop's own route
  // slugs, so the Slovenian URLs stay in tenants/bazen.ts.
  //
  // These used to be part of the placeholder loop below: fifteen routes, every
  // nav destination bar the shop and every page the law requires, all serving
  // one "Stran je v pripravi" card at 200 and noindex. Nothing was broken and
  // nothing was findable.
  // ---- the buying guides, one URL each -----------------------------------
  //
  // ⚠️ THE "/guide" SEGMENT WAS CONFIGURED AND ROUTED NOWHERE. Every tenant
  // has carried routeSlugs["/guide"] since the start and both /vodnik and
  // /vodnik/<anything> answered 404, while the three articles it was meant to
  // serve sat as sections of one 375-word page — so the three queries
  // docs/SEO.md names as the topical-authority mechanism had no page to rank.
  //
  // Modelled on the product route above: a segment, a slug, and a hard 404 for
  // one that does not resolve. An unknown guide must never fall through to a
  // page that renders something else.
  const guideBase = shop.routeSlugs["/guide"] + "/";
  if (path.startsWith(guideBase)) {
    const guide = GUIDE_PAGES.find((g) => g.slug === path.slice(guideBase.length));
    if (guide) {
      const noindex = dev || !shop.live;
      const doc = renderDocument({
        shop,
        content,
        theme,
        path,
        // ⚠️ THE SHORT BRAND, ON THESE PAGES ONLY. A guide's title already
        // states the category in its own first two words — "Masažni bazen na
        // terasi", "Koliko stane masažni bazen" — so " | Masažni bazeni
        // Vrelec" spends 24 characters restating it, and all three titles ran
        // 76-79 and were cut mid-brand: the reader saw "| Masažni bazeni
        // Vre…". wordmark[1] is the half that identifies the shop, and the
        // head-term check in scripts/audit-seo.mjs still passes because the
        // term is in the title proper rather than in the suffix.
        //
        // Product pages keep the full name: their titles lead with a model
        // code, so the suffix is where the category comes from.
        title: (guide.seoTitle ?? guide.h1) + " | " + shop.wordmark[1],
        description: guide.metaDescription,
        noindex,
        q,
        bodyHtml: renderContentPage(
          shop, content, q, theme, guide, undefined, [], undefined,
        ),
        jsonLd: [
          organizationJsonLd(shop),
          breadcrumbJsonLd(shop, [
            { name: "Domov", path: "/" },
            { name: "Vodniki", path: shop.routeSlugs["/guides"] },
            { name: guide.h1 },
          ]),
          // ⚠️ THE GUIDES WERE THE ONE PAGE TYPE THAT ASKED QUESTIONS AND DID
          // NOT SAY SO. faqFor() has always been called for the editorial
          // pages and never here — so /pogosta-vprasanja was eligible for an
          // FAQ rich result and the three pages built to rank for the actual
          // long-tail queries were not, on the same markup, from the same
          // renderer. Same opt-in flag, same two-question floor: a guide that
          // carries no qa block still emits nothing.
          ...faqFor(guide),
        ],
      });
      return htmlResponse(
        doc,
        200,
        noindex ? { ...baseHeaders, "x-robots-tag": "noindex, nofollow" } : baseHeaders,
      );
    }
  }

  for (const page of PAGES) {
    if (path !== shop.routeSlugs[page.key as InternalRouteKey]) continue;
    // Pre-live the whole site is noindex anyway; once live, the basket and
    // the checkout stay out of the index because they are per-visitor
    // surfaces rather than content.
    // ⚠️ AND THE CONFIRMATION IS NEVER INDEXED. It is a real URL now, so it
    // can be linked, pasted and crawled; a search result reading
    // "Povpraševanje je oddano" for a shop's contact page would be the worst
    // possible listing for the page the whole site funnels into.
    const noindex =
      dev || !shop.live || page.noindex === true || confirmed || swatches;
    const doc = renderDocument({
      shop,
      content,
      theme,
      path,
      // ⚠️ NO CANONICAL ON THE TWO PER-VISITOR VARIANTS. Both are noindexed
      // and both would otherwise canonicalise to /kontakt, because the
      // canonical is built from the path and the query string is dropped —
      // and every product page carries a crawlable anchor to ?vzorcnik. See
      // PageOptions.canonical for why that pair is the dangerous one. The
      // other reasons for noindex here (dev host, pre-live, page.noindex) are
      // whole URLs that ARE their own canonical, so they keep it.
      ...(confirmed || swatches ? { canonical: null } : {}),
      title: (page.seoTitle ?? page.h1) + " | " + shop.name,
      description: page.metaDescription,
      noindex,
      q,
      // ?model=<slug> is RESOLVED HERE, against this shop's own catalogue,
      // before anything downstream can see it. A renderer therefore receives a
      // real PdpContent or nothing at all, and a parameter a visitor typed can
      // never become page text. It is what lets an enquiry that started on a
      // product page arrive with a subject line.
      bodyHtml: (() => {
        const about = modelParam(url, content);
        return renderContentPage(
          shop, content, q, theme, page, about, chosenParams(url, about), outcome,
        );
      })(),
      jsonLd: [
        organizationJsonLd(shop),
        breadcrumbJsonLd(shop, [{ name: "Domov", path: "/" }, { name: page.h1 }]),
        // FAQPage FROM THE QUESTIONS THE PAGE ACTUALLY RENDERS, and only
        // those. Markup whose answers a visitor cannot read is a
        // structured-data violation and a manual action, so this is built by
        // walking the page's own qa blocks rather than from a second list
        // that could drift out of step with them. A page with no questions
        // emits nothing.
        ...faqFor(page),
      ],
    });
    return htmlResponse(
      doc,
      200,
      noindex ? { ...baseHeaders, "x-robots-tag": "noindex, nofollow" } : baseHeaders,
    );
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
    // A 404 describing the shop's offer was how three unrouted slugs ended up
    // sharing the home page's description. It is noindex either way, but a
    // page that says what it is costs nothing.
    description: "Zahtevana stran ne obstaja. Oglejte si ponudbo ali nas pokličite.",
    noindex: true,
    q,
    bodyHtml: renderPlaceholder(
      shop,
      content,
      "Te strani ni.",
      q,
      theme,
      "Naslov je morda napačno vpisan ali pa je bila stran umaknjena. " +
        "Ponudba in kontakt sta na začetni strani.",
    ),
  });
  return htmlResponse(doc, 404, { ...baseHeaders, "x-robots-tag": "noindex, nofollow" });
}

/**
 * The enquiry POST, or nothing at all.
 *
 * ⚠️ RETURNS AN OUTCOME, NOT A RESPONSE, and that is the whole design. The
 * caller hands the outcome to handleRequest, which renders /kontakt exactly
 * as it always does with one extra fact available to the form. Nothing here
 * builds a page, decides a status code or knows what the form looks like.
 *
 * `null` means "this was not an enquiry submission" — every GET, every other
 * path, every host that is not a live shop — and the caller then does what it
 * did before this function existed.
 */
/**
 * What is echoed back into a refused form.
 *
 * A whitelist, not the whole body: `website` is the honeypot and must never
 * be re-rendered, and `soglasje` is consent, which has to be given again
 * rather than restored. Everything else is the visitor's own typing and
 * losing it is the difference between a corrected enquiry and an abandoned
 * one. Values are capped because a refused submission still echoes into a
 * page, and the cap is generous next to what parseEnquiry accepts.
 */
const ECHOED_FIELDS = ["ime", "telefon", "eposta", "kraj", "dostop", "sporocilo", "kanal"] as const;

function typedBack(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of ECHOED_FIELDS) {
    const v = form.get(k);
    if (typeof v === "string" && v !== "") out[k] = v.slice(0, 4000);
  }
  return out;
}

async function handleEnquiry(
  request: Request,
  env: Env,
): Promise<{
  done?: boolean;
  error?: string;
  sent?: Record<string, string>;
  field?: string | null;
} | null> {
  if (request.method !== "POST") return null;
  const url = new URL(request.url);
  const shop = resolveShop(request.headers.get("host") ?? url.hostname);
  if (!shop) return null;
  if (url.pathname !== shop.routeSlugs["/contact"]) return null;
  const content = CONTENT[shop.key];
  if (!content) return null;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    // The whole body failed to parse — too large, or malformed. That is not
    // "one field is too long", which is what this used to borrow; it belongs
    // to no field, so the page shows it and marks nothing invalid.
    return { error: "Obrazca ni bilo mogoče prebrati. Poskusite znova." };
  }

  // ⚠️ THE MODEL AND THE CONFIGURATION ARE RE-RESOLVED FROM THE URL, not read
  // from the body. They arrive in the query string because the form posts to
  // its own address, and they go through the same two functions that decided
  // what the page displayed — so an enquiry can only ever name a product this
  // shop sells and a colour it offers, whatever was typed into the address
  // bar. It is the same rule ?model= has followed since it existed.
  const about = modelParam(url, content);
  const chosen = chosenParams(url, about);
  const parsed = parseEnquiry(form, {
    modelSlug: about?.slug ?? null,
    configuration: Object.fromEntries(chosen.map(([k, v]) => [k, v])),
    // Where the enquiry was filed from, read from the request rather than
    // from a field the page had to carry — see sourcePath in submit.ts.
    sourcePath: url.pathname + url.search,
  });

  if (!parsed.ok) {
    // THE HONEYPOT ANSWERS LIKE A SUCCESS. Telling a bot which field gave it
    // away is how the next version of that bot stops filling it; and no human
    // can reach this branch, because the field is off-screen, aria-hidden and
    // never autofilled.
    if (parsed.why === "robot") return { done: true };
    return {
      error: PROBLEM_TEXT[parsed.why],
      field: PROBLEM_FIELD[parsed.why],
      sent: typedBack(form),
    };
  }

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const result = await submitEnquiry(env, shop.key, parsed.value, ip);
  if (result === "ok") return { done: true };
  return {
    sent: typedBack(form),
    error:
      result === "prepogosto"
        ? "Preveč poskusov v kratkem času. Poskusite čez nekaj minut ali pokličite."
        : "Povpraševanja ta trenutek ni bilo mogoče oddati. Poskusite znova ali " +
          "nam pišite oziroma pokličite — številka je v nogi strani.",
  };
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
      // THE BLOG IS THE ONE PART OF THE STOREFRONT THAT IS NOT IN THE BUNDLE.
      //
      // Posts are rows, read on the request, because publishing a post that
      // appears at the next deploy is not publishing. handlePosts answers null
      // for every path that is not its own — and for a request the storefront
      // would have answered differently, a pre-live domain above all — so the
      // line below cannot change any page that existed before it.
      const post = await handlePosts(request, env);
      if (post) return post;
      // THE ENQUIRY FORM'S ONE WRITE.
      //
      // It sits here, in the async layer, for the same reason the blog does:
      // handleRequest is synchronous and env-free and must stay that way.
      // What comes back from this is not a Response — it is an OUTCOME, and
      // the ordinary renderer draws the page around it. So the page a
      // visitor sees after pressing the button is the page they pressed it
      // on, re-rendered, with no redirect and no second template.
      const enquiry = await handleEnquiry(request, env);
      if (enquiry?.done) {
        // POST/REDIRECT/GET — see the note beside SENT_PARAM in
        // handleRequest. 303 and not 302: 303 is the status that MEANS "the
        // answer to your POST is at this other address, fetch it with GET",
        // and it is the one every browser follows with a GET.
        const url = new URL(request.url);
        return new Response(null, {
          status: 303,
          headers: {
            location: url.pathname + "?" + SENT_PARAM,
            "cache-control": "no-store",
            "x-robots-tag": "noindex, nofollow",
            ...SECURITY,
          },
        });
      }
      if (enquiry) return handleRequest(request, enquiry);
      return handleRequest(request);
    } catch (err) {
      console.error(err);
      // The one response built outside handleRequest still states the same
      // policy as every response inside it: never cached, never indexed,
      // never re-interpreted. A 500 with no cache-control is a 500 a shared
      // cache may keep.
      return new Response("Napaka na strežniku.", {
        status: 500,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "x-robots-tag": "noindex",
          "x-content-type-options": "nosniff",
        },
      });
    }
  },
};
