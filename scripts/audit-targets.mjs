#!/usr/bin/env node
/**
 * Can every control be pressed, and does the press land on it?
 *
 * ⚠️ THIS EXISTS BECAUSE A DOCUMENTED, DELIBERATE 44px TARGET WAS EATING ITS
 * NEIGHBOUR. The page index gave each entry 10px of padding to reach 44px and
 * handed the pixels back with margin-block:-10px so the rail's rhythm would
 * not change — and a negative margin does not shrink the BOX, only the space
 * it claims. Against a 4px gap every entry's target overlapped the next one's
 * by 13px, the later sibling won the hit test, and a click on the last pixel
 * row of an entry's own TEXT opened the entry below it. Four of five entries,
 * on every guide and FAQ page, at the two narrowest tiers.
 *
 * No test could see it: the CSS is valid, the rule is correct, the computed
 * height is 43px, and the accessible name, the href and the focus order are
 * all right. Only the USED geometry of two elements together shows it.
 *
 *   node scripts/audit-targets.mjs            # every route, three widths
 *   TG_WIDTHS=390,1440 node scripts/audit-targets.mjs
 *   TG_PORT=8971 node scripts/audit-targets.mjs
 *
 * WHAT IT CHECKS, per control:
 *
 *   COVERED   the point a visitor aims at — the centre of the control's own
 *             TEXT, not of its box — hit-tests to a different control. This
 *             is the one that found the index bug, and it is the only check
 *             here that reports a wrong destination rather than a small one.
 *   OVERLAP   two controls' boxes intersect. Reported separately from COVERED
 *             because an overlap nobody can aim into is a smell rather than a
 *             bug — a styled radio sits under its own label on purpose.
 *
 * ⚠️ A STICKY OR FIXED CONTROL OVER A FLOWING ONE IS NOT A FINDING. The buy
 * bar is pinned to the bottom of the viewport by design, so at scroll 0 it
 * covers whatever the fold falls on — on a product page at 768 that is the
 * middle of the photograph, and the first version reported the gallery's
 * zoom link as covered by the enquiry button on all six product pages. An
 * overlay covering content is what an overlay IS; the count is printed so the
 * exemption stays visible.
 *
 * ⚠️ IT DOES NOT CHECK TARGET SIZE, and that is deliberate. The first version
 * did, and every product page came back with fourteen 13x13 "failures" that
 * were the native radios under their own labels, plus every footer link,
 * whose 17px line box is exempt under SC 2.5.8's spacing rule. Size without
 * the label union and the spacing exception is noise, and noise in a gate is
 * worse than no gate. scripts/audit-site.mjs owns the tap-target pass.
 *
 * ⚠️ HIDDEN CONTROLS ARE SKIPPED, NOT PASSED. A dialog's buttons and anything
 * behind display:none have no geometry to judge; they are counted in the "not
 * visible" line so a route that reports nothing cannot be mistaken for a route
 * with nothing to check.
 *
 * ⚠️ AND A CLOSED <details> IS THE REASON THAT LINE EXISTS. Chromium hides a
 * closed disclosure's contents with content-visibility, which skips layout —
 * but getBoundingClientRect on something inside it still answers with the
 * geometry it had when it was last laid out. On a product page that produced
 * a link sitting 163px below its own panel, across the summary of the NEXT
 * panel, on all six product pages at all three widths. Every one of those
 * findings was a box that is not on the screen. A control nobody can reach
 * without opening its panel first is not a control this can judge.
 */
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright-core";

const PORT = Number(process.env.TG_PORT ?? 8973);
const WIDTHS = (process.env.TG_WIDTHS ?? "390,768,1440").split(",").map(Number);

async function bundle(entry, tag) {
  const out = join(tmpdir(), "tg-" + tag + ".mjs");
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
// ⚠️ /blog IS NOT SERVED BY handleRequest. handlePosts() is async and takes
// env, so a sync env-free harness gets the 404 page for it — this audited a
// "route not found" screen and counted it as a clean route. blogIndexDoc is
// pure, and its empty state is exactly what ships while there are no posts.
const { blogIndexDoc } = await bundle("src/blog/routes.ts", "blog");

const SHOP = SHOPS["bazen"];
const C = CONTENT["bazen"];
const HOST = "trgovina.workers.dev";
const NOT_PAGES = new Set(["/product", "/guide", "/order-success"]);

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
  if (path === SHOP.routeSlugs["/blog"]) {
    html[path] = blogIndexDoc(SHOP, C, [], true);
    continue;
  }
  // ⚠️ THE HOST HEADER IS THE TENANCY KEY — without it every route 404s.
  const res = handleRequest(
    new Request("https://" + HOST + path + "?shop=bazen", { headers: { host: HOST } }),
  );
  html[path] = await res.text();
}

/**
 * ⚠️ EVERY REQUEST GOES BACK THROUGH handleRequest, INCLUDING THE STYLESHEET.
 *
 * The first version of this served the pre-rendered HTML and 404d everything
 * else, on the belief — copied from scripts/audit-css.mjs, where it is now
 * also stale — that the sheet is inlined into the document. It is not: the
 * page links /assets/site-<hash>.css, handleRequest serves it, and 404ing it
 * renders every route UNSTYLED. That run reported the native 13x13 radios
 * that a styled page hides, and three "overlapping" product cards that were
 * three full-width block links stacked with no grid. An unstyled page will
 * always have findings and none of them are real.
 */
const server = createServer(async (req, res) => {
  const url = req.url ?? "/";
  const path = decodeURIComponent(url.split("?")[0]);
  const doc = html[path];
  if (doc !== undefined) {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(doc);
    return;
  }
  const r = handleRequest(
    new Request("https://" + HOST + url, { headers: { host: HOST } }),
  );
  const body = Buffer.from(await r.arrayBuffer());
  res.writeHead(r.status, { "content-type": r.headers.get("content-type") ?? "application/octet-stream" }).end(body);
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});

const PROBE = () => {
  const SEL = "a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex='-1'])";
  const all = [...document.querySelectorAll(SEL)];
  const label = (el) => (el.getAttribute("aria-label") || el.textContent || el.value || el.tagName)
    .replace(/\s+/g, " ").trim().slice(0, 30);
  const vis = [];
  let hidden = 0;
  for (const el of all) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width < 1 || r.height < 1 || cs.visibility === "hidden" || cs.opacity === "0") { hidden++; continue; }
    // Inside a shut disclosure: the rect is a memory, not a position.
    if (el.closest("details:not([open])")) { hidden++; continue; }
    vis.push({ el, r });
  }
  const covered = [];
  const overlap = [];
  let byOverlay = 0;
  const overlay = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === "fixed" || p === "sticky") return true;
    }
    return false;
  };
  for (const { el, r } of vis) {
    // The point a visitor aims at is the middle of the WORDS, not of the box.
    const range = document.createRange();
    range.selectNodeContents(el);
    const tr = [...range.getClientRects()].filter((x) => x.width > 0)[0];
    const aim = tr
      ? { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 }
      : { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    if (aim.y > 0 && aim.y < innerHeight && aim.x > 0 && aim.x < innerWidth) {
      const hit = document.elementFromPoint(aim.x, aim.y);
      const owner = hit && hit.closest(SEL);
      if (owner && owner !== el && !el.contains(owner) && !owner.contains(el)) {
        if (overlay(owner) && !overlay(el)) byOverlay++;
        else covered.push({ t: label(el), by: label(owner), cls: String(el.className).slice(0, 24) });
      }
    }
  }
  for (let i = 0; i < vis.length; i++) {
    for (let j = i + 1; j < vis.length; j++) {
      const a = vis[i], b = vis[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      // A styled control sits under its own label on purpose.
      const pair = (x, y) => x.el.labels && [...x.el.labels].some((l) => l === y.el || l.contains(y.el));
      if (pair(a, b) || pair(b, a)) continue;
      const dx = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const dy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (dx <= 1 || dy <= 1) continue;
      if (overlay(a.el) !== overlay(b.el)) { byOverlay++; continue; }
      if (true) overlap.push({
        a: label(a.el), b: label(b.el), by: Math.round(Math.min(dx, dy)),
        cls: String(a.el.className || a.el.tagName).slice(0, 22) + " / " +
             String(b.el.className || b.el.tagName).slice(0, 22),
      });
    }
  }
  return { n: vis.length, hidden, byOverlay, covered, overlap };
};

const rows = [];
for (const width of WIDTHS) {
  for (const path of ROUTES) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto("http://127.0.0.1:" + PORT + path, { waitUntil: "load" });
    await page.waitForTimeout(120);
    const r = await page.evaluate(PROBE);
    rows.push({ width, path, ...r });
    await page.close();
  }
}

await browser.close();
server.close();

/* ------------------------------------------------------------- report */
let bad = 0;
for (const r of rows) {
  const lines = [];
  for (const c of r.covered) lines.push('  COVERED  "' + c.t + '" is under "' + c.by + '"   ' + c.cls);
  const seen = new Set();
  for (const o of r.overlap) {
    const k = o.a + "|" + o.b;
    if (seen.has(k)) continue;
    seen.add(k);
    lines.push("  OVERLAP  " + o.by + "px  \"" + o.a + '" / "' + o.b + '"   ' + o.cls);
  }
  if (!lines.length) continue;
  bad++;
  console.log("\n" + String(r.width) + "  " + r.path + "   (" + r.n + " controls, " +
    r.hidden + " not visible, " + r.byOverlay + " under a pinned overlay)");
  for (const l of lines.slice(0, 14)) console.log(l);
  if (lines.length > 14) console.log("  … " + (lines.length - 14) + " more");
}

console.log("");
console.log(rows.length + " route/width pairs checked, " + bad + " with something to look at");
console.log("");
