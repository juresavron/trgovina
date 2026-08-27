#!/usr/bin/env node
/**
 * How much of the stylesheet each page actually uses.
 *
 * ⚠️ THE WHOLE SHEET IS INLINED INTO EVERY DOCUMENT. That is deliberate — it
 * removes a render-blocking request on a site whose visitors mostly arrive
 * from a search result and read one page — but it means /kontakt carries the
 * product configurator, the card grids and the hero, and a phone parses all of
 * it before it can paint a paragraph.
 *
 * This measures the cost rather than guessing at it, using Chromium's own CSS
 * coverage instrumentation: the browser reports which byte ranges of the sheet
 * were used to style the document it just laid out. That is the same data
 * DevTools shows under Coverage, and it is authoritative in a way that
 * grepping for class names is not — a rule can match nothing, and a class can
 * appear in a comment, a script string or an aria-label.
 *
 *   node scripts/audit-css.mjs              # every route, summary table
 *   node scripts/audit-css.mjs --modules    # also attribute unused bytes to
 *                                           # the theme module they came from
 *   AUDIT_PORT=8971 node scripts/audit-css.mjs
 *
 * WHAT IT IS FOR. Splitting the sheet per route is a real optimisation and a
 * dangerous one: a rule dropped by mistake does not throw, it renders an
 * unstyled page, and no test here would catch it. So the order of work is
 * measure, then split, then re-measure — and this is the first step and the
 * check for the third.
 *
 * ⚠️ COVERAGE IS A LOWER BOUND ON WHAT IS NEEDED. A rule that only applies on
 * hover, on focus, at another viewport, or inside a media query this run did
 * not match is reported as unused and is NOT safe to delete. Read the output
 * as "this page never needed the pdp module at all", not as "these 12 bytes
 * are dead". The module attribution below is the reading that survives that
 * caveat, which is why it exists.
 */
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright-core";

const PORT = Number(process.env.AUDIT_PORT ?? 8971);
const SHOW_MODULES = process.argv.includes("--modules");

/** Bundle a module the way the deploy does — see scripts/preview.mjs. */
async function bundle(entry, tag) {
  const out = join(tmpdir(), "css-" + tag + ".mjs");
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

const SHOP = SHOPS["bazen"];
const C = CONTENT["bazen"];
const HOST = "trgovina.workers.dev";
const NOT_PAGES = new Set(["/product", "/guide", "/order-success"]);

/** Every route, derived the way the other audits derive it. */
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

const ROUTES = routes();
const html = {};
for (const path of ROUTES) {
  // ⚠️ THE HOST HEADER IS THE TENANCY KEY. Without it every route 404s and
  // the whole run measures the same styled 404 fourteen times.
  const res = handleRequest(
    new Request("https://" + HOST + path + "?shop=bazen", { headers: { host: HOST } }),
  );
  html[path] = await res.text();
}

const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const doc = html[path];
  if (doc === undefined) {
    res.writeHead(404).end("no such route");
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(doc);
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});

/**
 * Where each theme module sits in the concatenated sheet.
 *
 * ⚠️ AN EARLIER VERSION OF THIS ASKED WHETHER ONE SIGNATURE SELECTOR PER
 * MODULE HAD BEEN USED, and it reported that /vodniki never touched the fonts
 * module — on a page that renders every word in Chivo. One selector is not a
 * module: @font-face carries no selector at all, and a module whose first rule
 * happens to be a hover state looks dead on a page that uses the rest of it.
 *
 * So the span is computed instead. index.ts concatenates the modules in a
 * fixed order and render/css.ts minifies the result, so minifying each module
 * the same way and accumulating the lengths gives each one's byte range in the
 * sheet to within the handful of bytes the collapse loses at a boundary. Then
 * a module's used bytes are the coverage ranges that fall inside its span,
 * which is a claim about the whole module rather than about one rule in it.
 */
const MINIFY = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\s+/g, " ")
  .replace(/\s*([{;,])\s*/g, "$1")
  .replace(/\s*}\s*/g, "}")
  .replace(/;}/g, "}")
  .trim();

const MODULE_FILES = [
  ["fonts", "src/themes/studio/fonts.ts", "STUDIO_FONT_FACE_CSS"],
  ["tokens", "src/themes/studio/tokens.ts", "STUDIO_TOKENS"],
  ["chrome", "src/themes/studio/chrome.ts", "STUDIO_CHROME_CSS"],
  ["hero", "src/themes/studio/hero.ts", "STUDIO_HERO_CSS"],
  ["commerce", "src/themes/studio/commerce.ts", "STUDIO_COMMERCE_CSS"],
  ["statement", "src/themes/studio/statement.ts", "STUDIO_STATEMENT_CSS"],
  ["editorial", "src/themes/studio/editorial.ts", "STUDIO_EDITORIAL_CSS"],
  ["pdp", "src/themes/studio/pdp.ts", "STUDIO_PDP_CSS"],
  ["page", "src/themes/studio/page.ts", "STUDIO_PAGE_CSS"],
  ["closing", "src/themes/studio/closing.ts", "STUDIO_CLOSING_CSS"],
  ["effects", "src/themes/studio/effects.ts", "STUDIO_EFFECTS_CSS"],
];

/** Each module's [start, end) in the sheet, and its own minified size. */
async function moduleSpans(sheetText) {
  // Everything before the theme — the kernel sheet and the shop accents —
  // is one span called "base"; its offset is found by locating the first
  // theme byte rather than assumed.
  const spans = [];
  const sizes = [];
  for (const [name, file, exp] of MODULE_FILES) {
    const M = await bundle(file, "mod-" + name);
    sizes.push([name, MINIFY(M[exp] ?? "")]);
  }
  // The theme begins where its first module's opening bytes appear.
  const first = sizes[0][1].slice(0, 60);
  const themeAt = first ? sheetText.indexOf(first) : -1;
  if (themeAt < 0) return null;
  if (themeAt > 0) spans.push({ name: "base (kernel + accents)", start: 0, end: themeAt });
  let at = themeAt;
  for (const [name, css] of sizes) {
    spans.push({ name, start: at, end: at + css.length });
    at += css.length;
  }
  // Anything after the last module is the collapse slack; fold it into the last span.
  if (spans.length > 0) spans[spans.length - 1].end = Math.max(spans[spans.length - 1].end, sheetText.length);
  return spans;
}

const rows = [];
for (const path of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.coverage.startCSSCoverage();
  await page.goto("http://127.0.0.1:" + PORT + path, { waitUntil: "domcontentloaded" });
  // Let the sheet apply before asking what it applied. domcontentloaded is
  // enough for an inline stylesheet — there is no external CSS to wait on.
  await page.waitForTimeout(120);
  const coverage = await page.coverage.stopCSSCoverage();

  let total = 0;
  let used = 0;
  const sheets = [];
  for (const entry of coverage) {
    total += entry.text.length;
    for (const r of entry.ranges) used += r.end - r.start;
    sheets.push(entry);
  }
  rows.push({ path, total, used, sheets });
  await page.close();
}

await browser.close();
server.close();

/* ------------------------------------------------------------- report */

const pad = (s, n) => String(s).padEnd(n);
const kb = (n) => (n / 1024).toFixed(1) + " kB";

console.log("");
console.log("CSS COVERAGE — one page, one viewport, at rest (see the caveat in this file)");
console.log("");
console.log(pad("route", 26) + pad("sheet", 11) + pad("used", 11) + pad("unused", 11) + "used %");
console.log("-".repeat(70));

let worst = null;
for (const r of rows.sort((a, b) => a.used / a.total - b.used / b.total)) {
  const pct = ((r.used / r.total) * 100).toFixed(1) + "%";
  console.log(pad(r.path, 26) + pad(kb(r.total), 11) + pad(kb(r.used), 11) +
    pad(kb(r.total - r.used), 11) + pct);
  if (worst === null) worst = r;
}

if (SHOW_MODULES && worst) {
  const sheet = worst.sheets[0];
  const spans = sheet ? await moduleSpans(sheet.text) : null;
  if (spans) {
    console.log("");
    console.log("PER MODULE on " + worst.path + " — the page that uses least of the sheet");
    console.log("");
    console.log(pad("module", 26) + pad("size", 11) + pad("used", 11) + "used %");
    console.log("-".repeat(60));
    for (const sp of spans) {
      let used = 0;
      for (const r of sheet.ranges) {
        const lo = Math.max(r.start, sp.start);
        const hi = Math.min(r.end, sp.end);
        if (hi > lo) used += hi - lo;
      }
      const size = sp.end - sp.start;
      const pct = size === 0 ? "—" : ((used / size) * 100).toFixed(1) + "%";
      console.log(pad(sp.name, 26) + pad(kb(size), 11) + pad(kb(used), 11) + pct);
    }
  }
}

console.log("");
console.log("Splitting the sheet per route is worth roughly the unused column — but read");
console.log("the caveat at the top of this file before deleting a single rule.");
console.log("");
