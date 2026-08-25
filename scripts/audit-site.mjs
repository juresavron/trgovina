#!/usr/bin/env node
/**
 * Whole-site audit: every route, checked for the things a component agent
 * cannot see.
 *
 * WHY THIS EXISTS. Each section of this site has been polished in isolation,
 * and isolation is exactly where a certain class of defect hides: a title that
 * duplicates another page's, a heading level that skips because two sections
 * each chose sensibly on their own, an id emitted twice because two components
 * both wanted "st-tst-1". None of those is visible from inside one component,
 * and all of them are cheap to check across the whole route table.
 *
 * It renders every route through the real Worker, serves the result with
 * stand-in media (the bucket is unreachable from a build sandbox), and drives
 * Chromium over the lot.
 *
 *   node scripts/audit-site.mjs            # audit, print findings
 *   node scripts/audit-site.mjs --json     # machine-readable
 *
 * Exit code is 1 when anything at ERROR level is found, so it can gate.
 */
import { mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import sharp from "sharp";
import { chromium } from "playwright-core";
import { handleRequest } from "../src/worker.ts";
import { SHOPS } from "../src/tenants/index.ts";

const OUT = process.env.AUDIT_DIR || "/tmp/site-audit";
const PORT = Number(process.env.AUDIT_PORT || 8890);
const HOST = "https://trgovina.worldfans.workers.dev";

/**
 * Route keys that are NOT pages and must not be audited as if they were.
 *
 * "/product" and "/guide" are BASE segments — the real URLs are
 * /bazen/<model> and /vodnik/<article> — so the bare slug 404s by design.
 * "/order-success" is a post-checkout destination that cannot exist before
 * checkout does. Auditing them as pages produced three ERRORs that described
 * the route table rather than a defect, which is the fastest way to teach
 * someone to ignore a report.
 */
const NOT_PAGES = new Set(["/product", "/guide", "/order-success"]);

/** Every route the site serves, derived rather than hand-listed. */
function routes() {
  const shop = SHOPS["bazen"];
  const r = new Set(["/"]);
  for (const [key, slug] of Object.entries(shop.routeSlugs)) {
    if (NOT_PAGES.has(key)) continue;
    r.add(slug);
  }
  return [...r].filter((p) => p && p.startsWith("/"));
}

const PAGES = routes();
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "media"), { recursive: true });
if (existsSync("public")) cpSync("public", OUT, { recursive: true });

const docs = {};
const statuses = {};
for (const path of PAGES) {
  const res = handleRequest(new Request(HOST + path + "?shop=bazen"));
  statuses[path] = res.status;
  docs[path] = await res.text();
}
// Product pages too — one per family is enough to catch a template fault.
for (const p of ["/bazen/veliki-230", "/bazen/swim-580-maxi"]) {
  const res = handleRequest(new Request(HOST + p + "?shop=bazen"));
  statuses[p] = res.status;
  docs[p] = await res.text();
  PAGES.push(p);
}

const file = (p) => (p === "/" ? "index" : p.replace(/[^a-z0-9]+/gi, "_")) + ".html";
for (const [p, html] of Object.entries(docs)) writeFileSync(join(OUT, file(p)), html);

/* stand-in media, shaped like the bucket's real contents */
const wanted = new Set();
for (const html of Object.values(docs))
  for (const m of html.matchAll(/\/media\/([^"'\s)]+)/g)) wanted.add(m[1]);
for (const name of wanted) {
  const long = /zr78|zr7861|swim/i.test(name);
  const scene = /^hero\.|^kategorija-/i.test(name);
  const w = scene ? 1600 : 900;
  const h = scene ? 900 : long ? 620 : 900;
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
      '<rect width="100%" height="100%" fill="' + (scene ? "#3b4a45" : "#fdfdfc") + '"/>' +
      '<rect x="' + w * 0.2 + '" y="' + h * 0.3 + '" width="' + w * 0.6 + '" height="' + h * 0.4 +
      '" fill="#6f7671"/></svg>',
  );
  writeFileSync(join(OUT, "media", name), await sharp(svg).jpeg({ quality: 70 }).toBuffer());
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".woff2": "font/woff2", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  try {
    let body = await readFile(join(OUT, normalize(p).replace(/^(\.\.[/\\])+/, "")));
    // Eager, or every below-the-fold image measures 0x0 and the audit passes
    // on pictures it never loaded.
    if (extname(p) === ".html")
      body = Buffer.from(String(body).replaceAll('loading="lazy"', 'loading="eager"'));
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404).end("no"); }
});
await new Promise((r) => server.listen(PORT, r));

const findings = [];
const add = (level, route, rule, detail) => findings.push({ level, route, rule, detail });

/* ---- document-level checks, done on the HTML string ---- */
const titles = new Map(), descs = new Map(), canons = new Map();
for (const [route, html] of Object.entries(docs)) {
  const pick = (re) => (html.match(re) || [])[1];
  const title = pick(/<title>([^<]*)<\/title>/);
  const desc = pick(/<meta name="description" content="([^"]*)"/);
  const canon = pick(/<link rel="canonical" href="([^"]*)"/);

  if (!title) add("ERROR", route, "title", "no <title>");
  else {
    if (title.length > 60) add("WARN", route, "title-length", title.length + " chars: " + title);
    if (titles.has(title)) add("ERROR", route, "title-dup", "same title as " + titles.get(title));
    else titles.set(title, route);
  }
  if (!desc) add("ERROR", route, "description", "no meta description");
  else {
    if (desc.length > 160) add("WARN", route, "desc-length", desc.length + " chars");
    if (desc.length < 50) add("WARN", route, "desc-short", desc.length + " chars");
    if (descs.has(desc)) add("ERROR", route, "desc-dup", "same description as " + descs.get(desc));
    else descs.set(desc, route);
  }
  if (!canon) add("ERROR", route, "canonical", "no canonical");
  else if (canons.has(canon)) add("ERROR", route, "canonical-dup", "same canonical as " + canons.get(canon));
  else canons.set(canon, route);

  const h1s = [...html.matchAll(/<h1[^>]*>/g)].length;
  if (h1s !== 1) add("ERROR", route, "h1-count", h1s + " h1 elements");
  if (statuses[route] >= 400) add("ERROR", route, "status", "HTTP " + statuses[route]);
}

/* ---- rendered checks in Chromium ---- */
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
for (const [label, size] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: size });
  for (const route of Object.keys(docs)) {
    await page.goto("http://127.0.0.1:" + PORT + "/" + file(route), { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 800) {
        window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    const r = await page.evaluate(() => {
      const out = { overflow: 0, noAlt: [], dupIds: [], skips: [], smallTargets: [], brokenImgs: [], emptyLinks: [] };
      out.overflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
      for (const img of document.querySelectorAll("img")) {
        if (!img.hasAttribute("alt")) out.noAlt.push(img.currentSrc.split("/").pop() || img.src);
        if (img.complete && img.naturalWidth === 0) out.brokenImgs.push(img.getAttribute("src") || "?");
      }
      const seen = new Set();
      for (const el of document.querySelectorAll("[id]")) {
        if (seen.has(el.id)) out.dupIds.push(el.id); else seen.add(el.id);
      }
      let last = 0;
      for (const h of document.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
        const lvl = Number(h.tagName[1]);
        if (last && lvl > last + 1) out.skips.push("h" + last + " -> h" + lvl + ": " + h.textContent.trim().slice(0, 40));
        last = lvl;
      }
      for (const el of document.querySelectorAll("a[href], button, summary, input, select")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (getComputedStyle(el).display === "none") continue;
        // A visually-hidden input whose <label> carries the hit area is not a
        // small target — the label is. Checking the input would report the
        // marquee pause control as 13x13 while its label measures 80x44.
        if (el.tagName === "INPUT" && el.id && document.querySelector('label[for="' + el.id + '"]')) continue;
        if (b.height < 24 || b.width < 24) out.smallTargets.push(el.tagName + "." + String(el.className).split(" ")[0] + " " + Math.round(b.width) + "x" + Math.round(b.height));
        const name = (el.textContent || "").trim() || el.getAttribute("aria-label") || el.getAttribute("title") || "";
        if (el.tagName === "A" && !name) out.emptyLinks.push(el.getAttribute("href") || "?");
      }
      return out;
    });
    if (r.overflow > 0) add("ERROR", route, "h-overflow", label + ": page scrolls " + r.overflow + "px horizontally");
    for (const s of r.noAlt) add("ERROR", route, "img-alt", label + ": <img> with no alt attribute: " + s);
    for (const s of new Set(r.brokenImgs)) add("ERROR", route, "img-broken", label + ": did not load: " + s);
    for (const s of new Set(r.dupIds)) add("ERROR", route, "dup-id", label + ": duplicate id " + s);
    for (const s of r.skips) add("WARN", route, "heading-skip", label + ": " + s);
    for (const s of new Set(r.smallTargets)) add("WARN", route, "small-target", label + ": " + s);
    for (const s of new Set(r.emptyLinks)) add("ERROR", route, "link-no-name", label + ": " + s);
  }
  await page.close();
}
await browser.close();
server.close();

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(findings, null, 2));
} else {
  const errs = findings.filter((f) => f.level === "ERROR");
  const warns = findings.filter((f) => f.level === "WARN");
  const group = (list) => {
    const by = new Map();
    for (const f of list) {
      const k = f.rule;
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(f);
    }
    for (const [rule, fs] of [...by].sort((a, b) => b[1].length - a[1].length)) {
      console.log("\n  " + rule + "  (" + fs.length + ")");
      for (const f of fs.slice(0, 12)) console.log("    " + f.route.padEnd(24) + " " + f.detail);
      if (fs.length > 12) console.log("    ... " + (fs.length - 12) + " more");
    }
  };
  console.log("ROUTES AUDITED: " + Object.keys(docs).length);
  console.log("\n=== ERRORS (" + errs.length + ") ===");
  group(errs);
  console.log("\n=== WARNINGS (" + warns.length + ") ===");
  group(warns);
}
process.exit(findings.some((f) => f.level === "ERROR") ? 1 : 0);
