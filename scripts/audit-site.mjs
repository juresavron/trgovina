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
    // ---- contrast ------------------------------------------------------
    // WCAG 2.1 AA is a legal floor here (EU 2019/882 has applied to
    // e-commerce since June 2025): 4.5:1 for body text, 3:1 for large text
    // (>=24px, or >=18.66px bold). So this is a gate, not a preference.
    //
    // TWO PASSES, AND THE SECOND ONE IS WHY. The cheap pass composites
    // background-color up the ancestor chain. It is fast and it is WRONG
    // wherever the ground is not an ancestor's fill — a positioned scrim
    // sibling, a gradient, a photograph. It reported the guide-card titles at
    // 1.14:1, i.e. invisible; measured in pixels they are 5.83:1, because a
    // .st-gd-scrim sibling paints between the card and the text. A gate that
    // cries wolf is a gate people learn to skip.
    //
    // So the cheap pass only TRIAGES. Anything it suspects is re-measured the
    // way scripts/verify-hero-contrast.mjs does it: make the text
    // transparent, screenshot the element, and take the brightest pixel that
    // remains — which is the actual ground, whatever painted it. The
    // brightest rather than the average, because a thin light stroke fails on
    // the one bright pixel it crosses and an average would pass a heading
    // lying across a window.
    const suspects = await page.evaluate(() => {
      const lin = (c) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
      const parse = (str) => {
        const m = /rgba?\(([^)]+)\)/.exec(str);
        if (!m) return null;
        const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
      };
      const over = (f, b) => ({
        r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a),
        b: f.b * f.a + b.b * (1 - f.a), a: 1,
      });
      const out = [];
      let n = 0;
      for (const el of document.querySelectorAll("p,h1,h2,h3,h4,h5,h6,a,li,dt,dd,span,summary,blockquote,figcaption,label,button")) {
        const own = [...el.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim());
        if (!own) continue;
        const b = el.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
        const fg = parse(cs.color);
        if (!fg || fg.a < 0.99) continue;
        const px = parseFloat(cs.fontSize);
        const large = px >= 24 || (Number(cs.fontWeight) >= 700 && px >= 18.66);
        const floor = large ? 3 : 4.5;

        // TRIAGE. Composite background-color up the ancestors. Where that is
        // the whole story the answer is exact and cheap. Where it is not — a
        // positioned sibling scrim, a gradient, a photograph — it is only a
        // reason to look properly, which is what `verify` marks.
        let ground = null, verify = false;
        for (let a = el; a; a = a.parentElement) {
          const s2 = getComputedStyle(a);
          if (s2.backgroundImage && s2.backgroundImage !== "none") { verify = true; break; }
          const c = parse(s2.backgroundColor);
          if (c && c.a > 0) { ground = ground ? over(ground, c) : c; if (ground.a >= 0.999) break; }
        }
        if (!verify) {
          // An absolutely positioned sibling or an <img> covering this box is
          // a ground the ancestor walk cannot see. This is the case that
          // reported the guide titles at 1.14:1 when they measure 5.83:1.
          for (const ov of document.querySelectorAll("img,[class*='scrim'],[class*='veil'],[class*='wash']")) {
            if (ov === el || ov.contains(el)) continue;
            const ob = ov.getBoundingClientRect();
            if (ob.left <= b.left + 1 && ob.right >= b.right - 1 && ob.top <= b.top + 1 && ob.bottom >= b.bottom - 1) { verify = true; break; }
          }
        }
        const fgLum = 0.2126 * lin(fg.r) + 0.7152 * lin(fg.g) + 0.0722 * lin(fg.b);
        if (!verify) {
          if (!ground || ground.a < 0.999) ground = { r: 255, g: 255, b: 255, a: 1 };
          const gl = 0.2126 * lin(ground.r) + 0.7152 * lin(ground.g) + 0.0722 * lin(ground.b);
          const ratio = (Math.max(fgLum, gl) + 0.05) / (Math.min(fgLum, gl) + 0.05);
          if (ratio >= floor) continue;      // clean, and provably so
          verify = true;                      // suspected — confirm in pixels
        }
        const tag = "st-audit-" + n++;
        el.setAttribute("data-audit", tag);
        out.push({ tag, label: el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : ""), fgLum, floor, px: Math.round(px) });
      }
      return out;
    });
    // Confirm every suspect the way scripts/verify-hero-contrast.mjs does:
    // make the text transparent, screenshot the element, take the brightest
    // pixel that remains (the darkest, for dark text). That reads the ACTUAL
    // ground, whatever painted it — scrim, gradient or photograph.
    if (suspects.length) {
      await page.addStyleTag({ content: "[data-audit]{color:transparent !important}" });
      const lin = (c) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
      for (const sus of suspects) {
        let shot;
        try { shot = await page.locator("[data-audit=\"" + sus.tag + "\"]").first().screenshot({ timeout: 4000 }); }
        catch { continue; }
        const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
        let hi = -1, lo = 2;
        for (let i = 0; i < data.length; i += info.channels) {
          const L = 0.2126 * lin(data[i]) + 0.7152 * lin(data[i + 1]) + 0.0722 * lin(data[i + 2]);
          if (L > hi) hi = L;
          if (L < lo) lo = L;
        }
        const against = sus.fgLum > 0.5 ? hi : lo;
        const ratio = (Math.max(sus.fgLum, against) + 0.05) / (Math.min(sus.fgLum, against) + 0.05);
        if (ratio < sus.floor)
          add("ERROR", route, "contrast", label + ": " + sus.label + " " + ratio.toFixed(2) +
            ":1 (needs " + sus.floor + ") at " + sus.px + "px");
      }
    }

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
  const infos = findings.filter((f) => f.level === "INFO");
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
  console.log("\n=== NOTES (" + infos.length + ") ===");
  group(infos);
}
process.exit(findings.some((f) => f.level === "ERROR") ? 1 : 0);
