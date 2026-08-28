#!/usr/bin/env node
/** TEMPORARY typography + vertical-rhythm audit. Delete when done. */
import { mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { chromium } from "playwright-core";

async function bundle(entry) {
  const out = join(tmpdir(), "typo-" + entry.replace(/[^a-z0-9]+/gi, "-") + ".mjs");
  execFileSync("node_modules/.bin/esbuild",
    [entry, "--bundle", "--format=esm", "--platform=node", "--log-level=warning", "--outfile=" + out],
    { stdio: "inherit" });
  return await import(out);
}

const { handleRequest } = await bundle("src/worker.ts");
const { SHOPS } = await bundle("src/tenants/index.ts");
const { CONTENT } = await bundle("src/content/index.ts");
const { blogIndexDoc } = await bundle("src/blog/routes.ts");

const OUT = "/tmp/typo-audit";
const PORT = 8951;
const HOST = "https://trgovina.worldfans.workers.dev";
const NOT_PAGES = new Set(["/product", "/guide", "/order-success"]);

function routes() {
  const shop = SHOPS["bazen"];
  const r = new Set(["/"]);
  for (const [key, slug] of Object.entries(shop.routeSlugs)) {
    if (NOT_PAGES.has(key)) continue;
    r.add(slug);
  }
  for (const c of CONTENT["bazen"]?.collections ?? []) r.add(c.path);
  return [...r].filter((p) => p && p.startsWith("/"));
}

const PAGES = routes();
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "media"), { recursive: true });
if (existsSync("public")) cpSync("public", OUT, { recursive: true });

const docs = {};
const statuses = {};
const BLOG = SHOPS["bazen"].routeSlugs["/blog"];
for (const path of PAGES) {
  if (path === BLOG) {
    statuses[path] = 200;
    docs[path] = blogIndexDoc(SHOPS["bazen"], CONTENT["bazen"], [], true);
    continue;
  }
  const res = handleRequest(new Request(HOST + path + "?shop=bazen"));
  statuses[path] = res.status;
  docs[path] = await res.text();
}
const shopCfg = SHOPS["bazen"];
const content0 = CONTENT["bazen"];
const productPaths = (content0?.pdps ?? (content0 ? [content0.pdp] : [])).map(
  (d) => shopCfg.routeSlugs["/product"] + "/" + d.slug);
for (const p of productPaths) {
  const res = handleRequest(new Request(HOST + p + "?shop=bazen"));
  statuses[p] = res.status;
  docs[p] = await res.text();
  PAGES.push(p);
}

const file = (p) => (p === "/" ? "index" : p.replace(/[^a-z0-9]+/gi, "_")) + ".html";
for (const [p, html] of Object.entries(docs)) writeFileSync(join(OUT, file(p)), html);

const assetPaths = new Set();
for (const html of Object.values(docs))
  for (const m of html.matchAll(/\/assets\/site-[0-9a-f]{8}\.(?:css|js)/g)) assetPaths.add(m[0]);
if (assetPaths.size === 0) throw new Error("no /assets/ reference in any document");
mkdirSync(join(OUT, "assets"), { recursive: true });
for (const a of assetPaths) {
  const res = handleRequest(new Request(HOST + a));
  if (res.status !== 200) throw new Error("worker did not serve " + a);
  writeFileSync(join(OUT, a.replace(/^\//, "")), await res.text());
}

const wanted = new Set();
for (const html of Object.values(docs))
  for (const m of html.matchAll(/\/media\/([^"'\s)]+)/g)) wanted.add(m[1]);
for (const name of wanted) {
  const long = /zr78|zr7861|swim/i.test(name);
  const scene = /^hero\.|^kategorija-/i.test(name);
  const w = scene ? 1600 : 900;
  const h = scene ? 900 : long ? 620 : 900;
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
    '<rect width="100%" height="100%" fill="' + (scene ? "#3b4a45" : "#fdfdfc") + '"/>' +
    '<rect x="' + w * 0.2 + '" y="' + h * 0.3 + '" width="' + w * 0.6 + '" height="' + h * 0.4 + '" fill="#6f7671"/></svg>');
  mkdirSync(dirname(join(OUT, "media", name)), { recursive: true });
  writeFileSync(join(OUT, "media", name), await sharp(svg).jpeg({ quality: 70 }).toBuffer());
}

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".woff2": "font/woff2", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  try {
    let body = await readFile(join(OUT, normalize(p).replace(/^(\.\.[/\\])+/, "")));
    if (extname(p) === ".html")
      body = Buffer.from(String(body).replaceAll('loading="lazy"', 'loading="eager"'));
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404).end("no"); }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});

const RESULT = {};

const PROBE = () => {
  const vis = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) return false;
    const b = el.getBoundingClientRect();
    return b.width > 0 && b.height > 0;
  };
  const sel = (el) => {
    const c = String(el.className || "").trim().split(/\s+/).filter(Boolean)[0];
    return el.tagName.toLowerCase() + (c ? "." + c : "");
  };
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;
  const fam = (v) => String(v).split(",")[0].replace(/["']/g, "").trim();

  // A "leaf text block": has non-whitespace direct text, and no child that
  // lays out as its own block. That is the unit a reader sees as one run of type.
  const isBlockish = (el) => {
    const d = getComputedStyle(el).display;
    return d === "block" || d === "flex" || d === "grid" || d === "list-item" ||
           d === "table" || d.startsWith("inline-b") || d.startsWith("inline-f") || d.startsWith("inline-g");
  };
  const leaves = [];
  for (const el of document.querySelectorAll("body *")) {
    if (/^(SCRIPT|STYLE|NOSCRIPT|SVG|PATH|BR|IMG|SOURCE|PICTURE|INPUT|SELECT|OPTION)$/.test(el.tagName)) continue;
    if (el.closest("svg")) continue;
    const direct = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
    if (!direct) continue;
    if ([...el.children].some((c) => isBlockish(c) && vis(c))) continue;
    if (!vis(el)) continue;
    leaves.push(el);
  }

  // ---- 1. type scale ---------------------------------------------------
  const combos = {};
  for (const el of leaves) {
    const cs = getComputedStyle(el);
    const lh = cs.lineHeight === "normal" ? "normal" : px(cs.lineHeight);
    const ls = cs.letterSpacing === "normal" ? 0 : px(cs.letterSpacing);
    const k = [px(cs.fontSize), cs.fontWeight, lh, ls, fam(cs.fontFamily), cs.textTransform].join("|");
    if (!combos[k]) combos[k] = { n: 0, ex: [] };
    combos[k].n++;
    if (combos[k].ex.length < 4 && !combos[k].ex.includes(sel(el))) combos[k].ex.push(sel(el));
  }

  // ---- word/line geometry ---------------------------------------------
  const lineWords = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const words = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.parentElement && getComputedStyle(n.parentElement).display === "none") continue;
      const t = n.nodeValue; const re = /\S+/g; let m;
      while ((m = re.exec(t))) words.push({ node: n, s: m.index, e: m.index + m[0].length, t: m[0] });
    }
    const lines = [];
    const r = document.createRange();
    for (const w of words) {
      try { r.setStart(w.node, w.s); r.setEnd(w.node, w.e); } catch { continue; }
      const rects = r.getClientRects();
      if (!rects.length) continue;
      const top = Math.round(rects[0].top);
      let L = lines.find((x) => Math.abs(x.top - top) < 5);
      if (!L) { L = { top, words: [], w: 0 }; lines.push(L); }
      L.words.push(w.t);
      L.w += rects[0].width;
    }
    lines.sort((a, b) => a.top - b.top);
    return lines;
  };

  // ---- 2. headings -----------------------------------------------------
  const headings = [];
  for (const h of document.querySelectorAll("h1,h2,h3,h4,h5,h6")) {
    if (!vis(h)) continue;
    const cs = getComputedStyle(h);
    const L = lineWords(h);
    headings.push({
      lvl: +h.tagName[1], sel: sel(h), size: px(cs.fontSize), weight: cs.fontWeight,
      lh: cs.lineHeight === "normal" ? "normal" : px(cs.lineHeight),
      ls: cs.letterSpacing === "normal" ? 0 : px(cs.letterSpacing),
      fam: fam(cs.fontFamily), tt: cs.textTransform,
      text: h.textContent.trim().replace(/\s+/g, " ").slice(0, 70),
      lines: L.length, lastLine: L.length ? L[L.length - 1].words : [],
      wrap: cs.textWrap || "",
    });
  }

  // ---- 3. line length --------------------------------------------------
  const measures = [];
  for (const el of leaves) {
    if (/^H[1-6]$/.test(el.tagName)) continue;
    const txt = el.textContent.trim().replace(/\s+/g, " ");
    if (txt.length < 25) continue;
    const cs = getComputedStyle(el);
    const L = lineWords(el);
    if (!L.length) continue;
    measures.push({
      sel: sel(el), chars: txt.length, lines: L.length,
      cpl: Math.round((txt.length / L.length) * 10) / 10,
      size: px(cs.fontSize), lh: cs.lineHeight === "normal" ? "normal" : px(cs.lineHeight),
      w: Math.round(el.getBoundingClientRect().width),
      lastLine: L.length > 1 ? L[L.length - 1].words : [],
      snippet: txt.slice(0, 42),
    });
  }

  // ---- 4. vertical rhythm ---------------------------------------------
  const main = document.querySelector("main") || document.body;
  const kids = [...main.children].filter((c) => vis(c) && !/^(SCRIPT|STYLE|NOSCRIPT)$/.test(c.tagName));
  const blocks = kids.map((c) => {
    const b = c.getBoundingClientRect();
    const cs = getComputedStyle(c);
    return { sel: sel(c), top: Math.round(b.top + window.scrollY), bottom: Math.round(b.bottom + window.scrollY),
      h: Math.round(b.height), pt: px(cs.paddingTop), pb: px(cs.paddingBottom),
      mt: px(cs.marginTop), mb: px(cs.marginBottom) };
  }).sort((a, b) => a.top - b.top);
  const gaps = [];
  for (let i = 1; i < blocks.length; i++)
    gaps.push({ after: blocks[i - 1].sel, before: blocks[i].sel, gap: blocks[i].top - blocks[i - 1].bottom });

  // inner rhythm: gaps between siblings inside each section's content wrapper
  const innerGaps = [];
  for (const k of kids) {
    const inner = [...k.children].filter(vis);
    const pool = inner.length === 1 ? [...inner[0].children].filter(vis) : inner;
    let prev = null;
    for (const c of pool) {
      if (/^(SCRIPT|STYLE)$/.test(c.tagName)) continue;
      const b = c.getBoundingClientRect();
      if (prev) {
        const g = Math.round(b.top + window.scrollY) - prev.bottom;
        if (Number.isFinite(g)) innerGaps.push({ parent: sel(k), after: prev.sel, before: sel(c), gap: g });
      }
      prev = { sel: sel(c), bottom: Math.round(b.bottom + window.scrollY) };
    }
  }

  return { combos, headings, measures, blocks, gaps, innerGaps,
    container: main.tagName.toLowerCase() + (main.className ? "." + String(main.className).split(" ")[0] : "") };
};

for (const [label, size] of [["w1920", { width: 1920, height: 1000 }], ["w390", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: size, reducedMotion: "reduce" });
  for (const route of Object.keys(docs)) {
    await page.goto("http://127.0.0.1:" + PORT + "/" + file(route), { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 800) {
        window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 25));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    const r = await page.evaluate(PROBE);
    (RESULT[label] = RESULT[label] || {})[route] = r;
  }
  await page.close();
}
await browser.close();
server.close();

writeFileSync(process.env.TYPO_OUT || "/tmp/typo.json", JSON.stringify({ statuses, RESULT }, null, 1));
console.log("routes:", Object.keys(docs).length, "->", process.env.TYPO_OUT || "/tmp/typo.json");
process.exit(0);
