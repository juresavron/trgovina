#!/usr/bin/env node
/**
 * A deep SEO audit of every route this shop serves.
 *
 * WHY A SECOND AUDIT. audit-site.mjs drives a browser and looks at what a
 * PERSON sees — contrast, target size, overflow. This one reads what a
 * CRAWLER sees, which is a different document: the head, the structured data,
 * the link graph and the sitemap. Every check here is one a search engine
 * actually performs, and each failure is written as the consequence rather
 * than the rule, because "title too long" is not a reason to change anything
 * and "Google cuts this title at the ellipsis" is.
 *
 *   node scripts/audit-seo.mjs           errors and warnings
 *   SEO_NOTES=1 node scripts/audit-seo.mjs   with the informational notes
 */
import { execFileSync } from "node:child_process";
import { brotliCompressSync } from "node:zlib";
import { join } from "node:path";
import { tmpdir } from "node:os";

/** Bundle a module the way the deploy does — see scripts/preview.mjs. */
async function bundle(entry, tag) {
  const out = join(tmpdir(), "seo-" + tag + ".mjs");
  execFileSync(
    "node_modules/.bin/esbuild",
    [entry, "--bundle", "--format=esm", "--platform=node",
     "--log-level=warning", "--outfile=" + out],
    { stdio: "inherit" },
  );
  return await import(out + "?v=" + Date.now());
}

const { handleRequest } = await bundle("src/worker.ts", "worker");
const { SHOPS } = await bundle("src/tenants/index.ts", "shops");
const { CONTENT } = await bundle("src/content/index.ts", "content");
// See the note in audit-site.mjs: /blog is served by the async layer because
// posts are rows, so the synchronous handler would hand this audit a 404.
const { blogIndexDoc } = await bundle("src/blog/routes.ts", "blog");

const SHOP = SHOPS["bazen"];
const C = CONTENT["bazen"];
const HOST = "https://trgovina.workers.dev";
const NOT_PAGES = new Set(["/product", "/guide", "/order-success"]);

/**
 * Every route, derived from the same three places audit-site.mjs derives it
 * from — the slug map, the collections and the catalogue. A hand-written list
 * tracks one of them and silently stops covering the others.
 */
function routes() {
  const r = new Set(["/"]);
  for (const [k, slug] of Object.entries(SHOP.routeSlugs)) {
    if (NOT_PAGES.has(k)) continue;
    r.add(slug);
  }
  for (const c of C.collections ?? []) r.add(c.path);
  for (const p of C.pdps ?? []) r.add(SHOP.routeSlugs["/product"] + "/" + p.slug);
  return [...r].filter((p) => p && p.startsWith("/"));
}

const BLOG = SHOP.routeSlugs["/blog"];
const get = async (path) => {
  if (path === BLOG) {
    const html = blogIndexDoc(SHOP, C, [], true);
    return { status: 200, headers: new Headers(), html };
  }
  const res = handleRequest(
    new Request(HOST + path + (path.includes("?") ? "&" : "?") + "shop=bazen", {
      headers: { host: "trgovina.workers.dev" },
    }),
  );
  return { status: res.status, headers: res.headers, html: await res.text() };
};

const one = (re, s) => { const m = re.exec(s); return m ? m[1] : null; };
const all = (re, s) => [...s.matchAll(re)].map((m) => m[1]);
const text = (s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const ERR = [], WARN = [], NOTE = [];
const err = (route, msg) => ERR.push([route, msg]);
const warn = (route, msg) => WARN.push([route, msg]);
const note = (route, msg) => NOTE.push([route, msg]);

const PAGES = routes();
const seenTitle = new Map(), seenDesc = new Map(), seenH1 = new Map();
const docs = {};
const kinds = {};

for (const route of PAGES) {
  const { status, html } = await get(route);
  docs[route] = html;
  if (status !== 200) {
    err(route, "serves " + status + " — a crawler sees no page here");
    continue;
  }

  // ⚠️ INTENT, NOT THE CURRENT FLAG.
  //
  // The first version read the rendered robots meta, and reported nothing at
  // all: this shop is pre-live and the audit requests through the QA host, so
  // every page carries noindex and every quality check switched itself off.
  // An audit that goes quiet exactly while a site is being built is worse
  // than no audit — the whole point is to be right BEFORE the switch is
  // thrown.
  //
  // So a page is judged as what it will be. The three that stay out of the
  // index once live are per-visitor surfaces rather than content, and they
  // are named here rather than read off a flag that is currently true for
  // everything.
  const PRIVATE = new Set([
    SHOP.routeSlugs["/cart"],
    SHOP.routeSlugs["/checkout"],
    SHOP.routeSlugs["/order-success"],
  ]);
  const indexable = !PRIVATE.has(route);

  /* --- the three strings a SERP is built from ------------------------- */
  const title = one(/<title>([^<]*)<\/title>/, html);
  if (!title) {
    err(route, "has no title — the SERP shows the URL instead");
  } else {
    // ~580px is where Google truncates a desktop title; 60 characters is the
    // usual proxy for it and the one a shop can act on.
    if (title.length > 60) {
      warn(route, "title is " + title.length + " chars, cut around 60: " + JSON.stringify(title));
    }
    if (title.length < 15) {
      warn(route, "title is only " + title.length + " chars — thin: " + JSON.stringify(title));
    }
    if (indexable) {
      const prev = seenTitle.get(title);
      if (prev) err(route, "shares its title with " + prev + " — two pages competing for one result");
      else seenTitle.set(title, route);
    }
  }

  const desc = one(/<meta name="description" content="([^"]*)"/, html);
  if (!desc) {
    err(route, "has no meta description — Google writes its own snippet");
  } else {
    if (desc.length > 160) warn(route, "description is " + desc.length + " chars, cut around 160");
    if (desc.length < 70) warn(route, "description is only " + desc.length + " chars — half a snippet");
    if (indexable) {
      const prev = seenDesc.get(desc);
      if (prev) err(route, "shares its description with " + prev);
      else seenDesc.set(desc, route);
    }
  }

  /* --- canonical ------------------------------------------------------ */
  const canons = all(/<link rel="canonical" href="([^"]*)"/g, html);
  if (canons.length === 0) err(route, "has no canonical link");
  else if (canons.length > 1) err(route, "has " + canons.length + " canonical links — a crawler picks one");
  else {
    const c = canons[0];
    if (!c.startsWith("https://")) err(route, "canonical is not absolute: " + c);
    const want = SHOP.siteUrl + (route === "/" ? "/" : route);
    if (c !== want) err(route, "canonical points at " + c + ", not " + want);
  }

  /* --- headings ------------------------------------------------------- */
  const h1s = all(/<h1[^>]*>([\s\S]*?)<\/h1>/g, html).map(text);
  if (h1s.length === 0) err(route, "has no h1");
  else if (h1s.length > 1) err(route, "has " + h1s.length + " h1 elements: " + h1s.join(" | "));
  else if (indexable) {
    const prev = seenH1.get(h1s[0]);
    if (prev) warn(route, "shares its h1 with " + prev);
    else seenH1.set(h1s[0], route);
  }

  const levels = [...html.matchAll(/<h([1-6])[^>]*>/g)].map((m) => Number(m[1]));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      warn(route, "heading jumps h" + levels[i - 1] + " to h" + levels[i] + " — the outline reads as broken");
      break;
    }
  }

  /* --- lang, social ---------------------------------------------------- */
  if (!/<html[^>]+lang="/.test(html)) err(route, "has no lang attribute");
  if (!/property="og:title"/.test(html)) warn(route, "has no og:title — link previews fall back to the URL");
  if (!/property="og:image"/.test(html)) warn(route, "has no og:image — a shared link renders as a bare card");
  if (!/name="twitter:card"/.test(html)) note(route, "has no twitter:card");

  /* --- structured data ------------------------------------------------ */
  const blobs = all(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, html);
  const types = [];
  for (const b of blobs) {
    let j;
    try {
      j = JSON.parse(b.replace(/\\u003c/g, "<"));
    } catch {
      err(route, "has JSON-LD that does not parse — Google drops the whole block");
      continue;
    }
    for (const node of Array.isArray(j) ? j : [j]) types.push(node["@type"]);
    // ⚠️ A PLACEHOLDER IN STRUCTURED DATA IS A CLAIM MADE TO GOOGLE.
    //
    // Every page used to ship "streetAddress": "TODO" and a telephone of
    // +386 00 000 000 inside Organization — ingested into the knowledge panel
    // as fact. It is the same error as an Offer with a price nobody set, and
    // it is invisible on the page, which is why it survived: nothing a person
    // looks at shows it. This check is the only thing that would have caught
    // it, so it stays.
    const flat = JSON.stringify(j);
    for (const bad of ["TODO", "\"0000\"", "00 000 000", "lorem", "example.com"]) {
      if (flat.includes(bad)) {
        err(route, "publishes " + JSON.stringify(bad) + " inside structured data — a placeholder asserted to a search engine as fact");
      }
    }
  }
  kinds[route] = types;

  /* --- images --------------------------------------------------------- */
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\salt=/.test(t));
  if (noAlt.length) err(route, noAlt.length + " img without alt");
  // Width/height attributes are NOT checked here, and the note says why.
  //
  // The first version of this audit warned about every img without them, on
  // the usual reasoning that an unsized image shifts the layout as it loads.
  // Measured in a browser, this site's CLS is 0.0009 to 0.033 against a 0.1
  // threshold: every one of these frames reserves its box with aspect-ratio,
  // so the attributes would change nothing a visitor or a crawler can see.
  // A proxy that fires where the real metric is clean is worse than no check
  // — it buries the findings that matter. Layout shift is now measured
  // directly, in the browser, by scripts/audit-site.mjs.
  const noDim = imgs.filter((t) => !/\swidth=/.test(t) || !/\sheight=/.test(t));
  if (noDim.length) note(route, noDim.length + " img without width/height (CLS measured clean — see audit-site.mjs)");

  /* --- weight, as it actually travels ---------------------------------- */
  //
  // Raw bytes are the wrong number to warn on: the edge serves brotli, and
  // this document is ~85% inlined stylesheet which compresses to a seventh of
  // itself. Reported compressed, with the raw figure beside it, so the line
  // says what a visitor downloads rather than what the string weighs.
  const kb = Math.round(Buffer.byteLength(html, "utf8") / 1024);
  const br = Math.round(brotliCompressSync(Buffer.from(html)).length / 1024);
  if (br > 40) warn(route, "document is " + br + " kB brotli (" + kb + " kB raw)");
  else note(route, "document " + br + " kB brotli (" + kb + " kB raw)");

  /* --- the body a crawler weighs --------------------------------------- */
  //
  // Thin pages are the ones that never rank, and a page's word count is the
  // cheapest signal of thinness there is. Measured on the BODY with script,
  // style and nav stripped, so the shared chrome — which is most of the words
  // on a short page — cannot make a thin page look substantial.
  const body = (one(/<main\b[^>]*>([\s\S]*)<\/main>/, html) || html)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, " ")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/g, " ");
  const words = text(body).split(/\s+/).filter(Boolean).length;
  // A legal page is not competing for anything. The terms, the privacy
  // notice, the cookie notice and the withdrawal form exist because ZVarPO-2,
  // the GDPR and the distance-selling rules require them; judging them for
  // thinness is measuring the wrong thing, and it buries the pages where the
  // number is a real finding.
  const LEGAL = new Set([
    SHOP.routeSlugs["/terms"], SHOP.routeSlugs["/privacy"],
    SHOP.routeSlugs["/cookies"], SHOP.routeSlugs["/withdrawal"],
  ]);
  if (indexable && !LEGAL.has(route) && words < 300) {
    warn(route, "has " + words + " words of body copy — thin for a page meant to rank");
  } else {
    note(route, words + " words");
  }

  /* --- internal links --------------------------------------------------- */
  //
  // Counted on <main> WITHOUT the nav stripping the word count uses. Two
  // different questions: prose length is inflated by boilerplate, so the
  // chrome comes out of it; crawl discovery is not, because a crawler follows
  // a link wherever it sits. The pattern matches paths only, so the section
  // index — which is same-page fragments — contributes nothing either way.
  const linkBody = (one(/<main\b[^>]*>([\s\S]*)<\/main>/, html) || html)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, " ");
  const outbound = new Set(all(/href="(\/[^"#?]*)"/g, linkBody));
  if (indexable && outbound.size < 3) {
    warn(route, "links to only " + outbound.size + " other pages from its body — a dead end for a crawler");
  }
}

/* --- structured data coverage, per page kind -------------------------- */
const T = (r) => kinds[r] || [];
const productPaths = (C.pdps ?? []).map((p) => SHOP.routeSlugs["/product"] + "/" + p.slug);
const collectionPaths = (C.collections ?? []).map((c) => c.path);

for (const r of productPaths) {
  if (!T(r).includes("Product")) err(r, "has no Product data — no rich result, no price in the SERP");
  if (!T(r).includes("BreadcrumbList")) warn(r, "has no BreadcrumbList — the SERP shows the raw URL path");
}
for (const r of collectionPaths) {
  if (!T(r).some((t) => t === "ItemList" || t === "CollectionPage")) {
    warn(r, "has no ItemList — the models on it are invisible to a crawler as a set");
  }
  if (!T(r).includes("BreadcrumbList")) warn(r, "has no BreadcrumbList");
}
if (!T("/").includes("Organization") && !T("/").includes("LocalBusiness")) {
  err("/", "has no Organization data");
}
const faqRoute = SHOP.routeSlugs["/faq"];
if (docs[faqRoute] && !T(faqRoute).includes("FAQPage")) {
  warn(faqRoute, "has no FAQPage data — the questions cannot win an accordion result");
}

/* --- the keyword, on the pages that exist to carry it ------------------ */
//
// This shop is built to rank for one head term. A title or an h1 on a
// money page that does not contain it is not a stylistic choice — it is the
// page declining to compete for the query it was written for. Checked with
// diacritics folded, because "masazni" and "masažni" are the same word to a
// reader and this audit should not fail on an accent.
const fold = (v) => v.toLowerCase()
  .replace(/[čć]/g, "c").replace(/š/g, "s").replace(/ž/g, "z");
const KW = fold(SHOP.keyword.primary);
const KWP = fold(SHOP.keyword.plural);
const money = ["/", SHOP.routeSlugs["/products"], ...collectionPaths, ...productPaths];
for (const r of money) {
  const html = docs[r] || "";
  const t = fold(one(/<title>([^<]*)<\/title>/, html) || "");
  const h = fold(text(all(/<h1[^>]*>([\s\S]*?)<\/h1>/g, html)[0] || ""));
  const has = (v) => v.includes(KW) || v.includes(KWP);
  if (!has(t)) warn(r, "title carries neither " + JSON.stringify(SHOP.keyword.primary) + " nor its plural");
  if (!has(h)) note(r, "h1 carries neither the keyword nor its plural");
}

/* --- the link graph --------------------------------------------------- */
const linked = new Set();
for (const r of PAGES) {
  for (const href of all(/href="(\/[^"#?]*)"/g, docs[r] || "")) {
    linked.add(href.replace(/\/$/, "") || "/");
  }
}
for (const r of PAGES) {
  const key = r.replace(/\/$/, "") || "/";
  if (linked.has(key)) continue;
  // A page nobody links is a problem only if it is meant to be found. The
  // basket and the checkout are per-visitor surfaces carrying noindex, so
  // "no inbound links" is the intended state rather than a fault.
  const html = docs[r] || "";
  const indexable = !/noindex/i.test(one(/<meta name="robots" content="([^"]*)"/, html) || "");
  if (indexable) warn(r, "is linked from no other page — reachable only through the sitemap");
  else note(r, "is linked from no other page (noindex — intended)");
}

/* --- robots.txt and sitemap.xml --------------------------------------- */
const rb = await get("/robots.txt");
if (rb.status !== 200) {
  err("/robots.txt", "serves " + rb.status);
} else {
  // A pre-live shop closes the whole site deliberately, and a closed robots
  // file has nothing to point a sitemap at. Flagging that as an error made
  // the audit fail on a correct configuration, which is how a red build
  // stops meaning anything.
  const closed = /^\s*Disallow:\s*\/\s*$/im.test(rb.html);
  if (closed) {
    note("/robots.txt", "closes the whole site — correct while shop.live is false");
    if (SHOP.live) err("/robots.txt", "closes the site on a LIVE shop — nothing can be indexed");
  } else if (!/sitemap:/i.test(rb.html)) {
    err("/robots.txt", "is open but points at no sitemap");
  }
}
const sm = await get("/sitemap.xml");
if (sm.status !== 200) {
  note("/sitemap.xml", "serves " + sm.status + " (pre-live shops have no sitemap)");
} else {
  const locs = all(/<loc>([^<]*)<\/loc>/g, sm.html);
  for (const r of PAGES) {
    const url = SHOP.siteUrl + (r === "/" ? "/" : r);
    const html = docs[r] || "";
    const indexable = !/noindex/i.test(one(/<meta name="robots" content="([^"]*)"/, html) || "");
    if (indexable && !locs.includes(url)) warn("/sitemap.xml", "omits " + r);
    if (!indexable && locs.includes(url)) err("/sitemap.xml", "lists " + r + ", which is noindex");
  }
  if (!/<lastmod>/.test(sm.html)) note("/sitemap.xml", "carries no lastmod dates");
}

const show = (label, rows) => {
  console.log("");
  console.log("=== " + label + " (" + rows.length + ") ===");
  console.log("");
  for (const [r, m] of rows) console.log("  " + r.padEnd(26) + m);
};
console.log("ROUTES AUDITED: " + PAGES.length);
show("ERRORS", ERR);
show("WARNINGS", WARN);
if (process.env.SEO_NOTES) show("NOTES", NOTE);
else console.log("\n(" + NOTE.length + " notes — SEO_NOTES=1 to show)");
if (ERR.length) process.exitCode = 1;
