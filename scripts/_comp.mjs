#!/usr/bin/env node
/**
 * TEMPORARY component-consistency probe. Harness copied from audit-site.mjs.
 * Renders every route at 1920 and 390 and records the rendered geometry/style
 * of five component families. Emits raw JSON for offline grouping.
 */
import { mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { chromium } from "playwright-core";

const ROOT = "/home/user/trgovina";
async function bundle(entry) {
  const out = join(tmpdir(), "comp-" + entry.replace(/[^a-z0-9]+/gi, "-") + ".mjs");
  execFileSync(
    ROOT + "/node_modules/.bin/esbuild",
    [ROOT + "/" + entry, "--bundle", "--format=esm", "--platform=node",
      "--log-level=warning", "--outfile=" + out],
    { stdio: "inherit", cwd: ROOT },
  );
  return await import(out);
}

const { handleRequest } = await bundle("src/worker.ts");
const { SHOPS } = await bundle("src/tenants/index.ts");
const { CONTENT } = await bundle("src/content/index.ts");
const { blogIndexDoc } = await bundle("src/blog/routes.ts");

const OUT = process.env.AUDIT_DIR || "/tmp/comp-audit";
const PORT = 8953;
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
if (existsSync(ROOT + "/public")) cpSync(ROOT + "/public", OUT, { recursive: true });

const docs = {};
const BLOG = SHOPS["bazen"].routeSlugs["/blog"];
for (const path of PAGES) {
  if (path === BLOG) {
    docs[path] = blogIndexDoc(SHOPS["bazen"], CONTENT["bazen"], [], true);
    continue;
  }
  const res = handleRequest(new Request(HOST + path + "?shop=bazen"));
  docs[path] = await res.text();
}
const shopCfg = SHOPS["bazen"];
const content0 = CONTENT["bazen"];
const productPaths = (content0?.pdps ?? (content0 ? [content0.pdp] : [])).map(
  (d) => shopCfg.routeSlugs["/product"] + "/" + d.slug,
);
for (const p of productPaths) {
  const res = handleRequest(new Request(HOST + p + "?shop=bazen"));
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
  const svg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
      '<rect width="100%" height="100%" fill="' + (scene ? "#3b4a45" : "#fdfdfc") + '"/>' +
      '<rect x="' + w * 0.2 + '" y="' + h * 0.3 + '" width="' + w * 0.6 + '" height="' + h * 0.4 +
      '" fill="#6f7671"/></svg>',
  );
  mkdirSync(dirname(join(OUT, "media", name)), { recursive: true });
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
    if (extname(p) === ".html")
      body = Buffer.from(String(body).replaceAll('loading="lazy"', 'loading="eager"'));
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404).end("no"); }
});
await new Promise((r) => server.listen(PORT, r));

const COLLECT = () => {
  const R = (n) => Math.round(n * 10) / 10;
  const cls = (el) => {
    const c = String(el.className || "").trim();
    return c ? c.split(/\s+/).join(".") : "";
  };
  const num = (v) => parseFloat(v) || 0;
  const pad = (s) => [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft]
    .map((v) => R(num(v))).join("/");
  const rad = (s) => [s.borderTopLeftRadius, s.borderTopRightRadius,
    s.borderBottomRightRadius, s.borderBottomLeftRadius].map((v) => v.trim()).join(" ");
  const bw = (s) => [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth]
    .map((v) => R(num(v))).join("/");
  const bcol = (s) => {
    const c = [s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor];
    return c.every((x) => x === c[0]) ? c[0] : c.join(" ");
  };
  const bstyle = (s) => {
    const c = [s.borderTopStyle, s.borderRightStyle, s.borderBottomStyle, s.borderLeftStyle];
    return c.every((x) => x === c[0]) ? c[0] : c.join(" ");
  };
  const alpha = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || "");
    if (!m) return 0;
    const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
    return p.length > 3 ? p[3] : 1;
  };
  const bgOf = (s) => {
    const img = s.backgroundImage && s.backgroundImage !== "none";
    const col = alpha(s.backgroundColor) > 0 ? s.backgroundColor : "";
    if (img && col) return col + " + img";
    if (img) return "img:" + s.backgroundImage.slice(0, 40);
    return col || "none";
  };
  const hasBg = (s) => alpha(s.backgroundColor) > 0 || (s.backgroundImage && s.backgroundImage !== "none");
  const hasBorder = (s) => ["borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"]
    .some((k) => num(s[k]) > 0 && s[k.replace("Width", "Style")] !== "none");
  const visible = (el, s) => {
    if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false;
    if (s.clipPath && s.clipPath !== "none") return false;
    const b = el.getBoundingClientRect();
    return b.width >= 4 && b.height >= 4;
  };
  const txt = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();

  const out = { buttons: [], cards: [], rules: [], chips: [], discs: [] };
  const all = [...document.querySelectorAll("body *")];

  /* ---- BUTTONS / LINKS-AS-BUTTONS ---- */
  for (const el of document.querySelectorAll("a, button")) {
    const s = getComputedStyle(el);
    if (!visible(el, s)) continue;
    const padded = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"].some((k) => num(s[k]) > 0);
    if (!padded) continue;
    if (!hasBg(s) && !hasBorder(s)) continue;
    const b = el.getBoundingClientRect();
    if (b.height > 200) continue;              // a padded card-link, not a control
    out.buttons.push({
      tag: el.tagName, cls: cls(el), w: R(b.width), h: R(b.height),
      pad: pad(s), radius: rad(s), bw: bw(s), bstyle: bstyle(s), bcol: bcol(s),
      bg: bgOf(s), color: s.color, fs: R(num(s.fontSize)), fw: s.fontWeight,
      tt: s.textTransform, ls: s.letterSpacing, label: txt(el).slice(0, 28),
    });
  }

  /* ---- CARDS / TILES: innermost bg-or-border box that holds a heading ---- */
  const cardCands = [];
  for (const el of all) {
    const s = getComputedStyle(el);
    if (!visible(el, s)) continue;
    if (!hasBg(s) && !hasBorder(s)) continue;
    if (!el.querySelector("h1,h2,h3,h4,h5,h6")) continue;
    cardCands.push(el);
  }
  for (const el of cardCands) {
    // innermost: no other candidate strictly inside it that also holds a heading
    if (cardCands.some((o) => o !== el && el.contains(o))) continue;
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    if (b.width > window.innerWidth * 0.96 && b.height > window.innerHeight * 1.2) continue;
    const head = el.querySelector("h1,h2,h3,h4,h5,h6");
    out.cards.push({
      tag: el.tagName, cls: cls(el), w: R(b.width), h: R(b.height),
      pad: pad(s), radius: rad(s), bw: bw(s), bstyle: bstyle(s), bcol: bcol(s),
      bg: bgOf(s), gap: s.gap || "normal", display: s.display,
      shadow: (s.boxShadow || "none").slice(0, 46),
      head: head ? head.tagName : "?", label: txt(head || el).slice(0, 26),
    });
  }

  /* ---- HAIRLINE-RULED LISTS: border on one horizontal edge only ---- */
  for (const el of all) {
    const s = getComputedStyle(el);
    if (!visible(el, s)) continue;
    const t = num(s.borderTopWidth) && s.borderTopStyle !== "none" ? num(s.borderTopWidth) : 0;
    const bo = num(s.borderBottomWidth) && s.borderBottomStyle !== "none" ? num(s.borderBottomWidth) : 0;
    const l = num(s.borderLeftWidth) && s.borderLeftStyle !== "none" ? num(s.borderLeftWidth) : 0;
    const r2 = num(s.borderRightWidth) && s.borderRightStyle !== "none" ? num(s.borderRightWidth) : 0;
    if (l || r2) continue;
    if (!t && !bo) continue;
    if (t && bo && !el.parentElement) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 40) continue;
    out.rules.push({
      tag: el.tagName, cls: cls(el),
      edge: t && bo ? "top+bottom" : t ? "top" : "bottom",
      w: R(t || bo), col: t ? s.borderTopColor : s.borderBottomColor,
      style: t ? s.borderTopStyle : s.borderBottomStyle,
      pad: pad(s), boxW: R(b.width), boxH: R(b.height),
      parent: el.parentElement ? cls(el.parentElement) || el.parentElement.tagName : "",
      sibs: el.parentElement ? el.parentElement.children.length : 0,
    });
  }

  /* ---- CHIPS / BADGES / PILLS ---- */
  for (const el of all) {
    if (el.querySelector("*") && !["SPAN", "EM", "STRONG", "SMALL", "B", "I"].includes(el.children[0]?.tagName)) continue;
    const s = getComputedStyle(el);
    if (!visible(el, s)) continue;
    if (!hasBg(s) && !hasBorder(s)) continue;
    const b = el.getBoundingClientRect();
    const t = txt(el);
    if (!t || t.length > 40) continue;
    if (b.height < 12 || b.height > 52 || b.width > 340) continue;
    const r = Math.max(...[s.borderTopLeftRadius, s.borderTopRightRadius,
      s.borderBottomLeftRadius, s.borderBottomRightRadius].map((v) => parseFloat(v) || 0));
    const pct = /%/.test(s.borderTopLeftRadius);
    if (r < 3 && !pct) continue;
    if (el.tagName === "IMG" || el.tagName === "svg") continue;
    out.chips.push({
      tag: el.tagName, cls: cls(el), w: R(b.width), h: R(b.height),
      pad: pad(s), radius: rad(s), bw: bw(s), bcol: bcol(s), bg: bgOf(s),
      color: s.color, fs: R(parseFloat(s.fontSize)), fw: s.fontWeight,
      tt: s.textTransform, ls: s.letterSpacing, label: t.slice(0, 24),
    });
  }

  /* ---- ICON CIRCLES / DISCS ---- */
  for (const el of all) {
    if (el.tagName === "svg" || el.closest("svg")) continue;
    const svg = el.querySelector("svg");
    if (!svg) continue;
    const s = getComputedStyle(el);
    if (!visible(el, s)) continue;
    const b = el.getBoundingClientRect();
    if (Math.abs(b.width - b.height) > 3) continue;
    if (b.width > 140) continue;
    const rTL = s.borderTopLeftRadius;
    const rPx = parseFloat(rTL) || 0;
    const round = /%/.test(rTL) ? parseFloat(rTL) >= 40 : rPx >= b.width / 2 - 1.5;
    if (!round) continue;
    if (!hasBg(s) && !hasBorder(s)) continue;
    const sb = svg.getBoundingClientRect();
    out.discs.push({
      tag: el.tagName, cls: cls(el), size: R(b.width) + "x" + R(b.height),
      radius: rad(s), bw: bw(s), bcol: bcol(s), bg: bgOf(s), color: s.color,
      icon: R(sb.width) + "x" + R(sb.height),
      stroke: getComputedStyle(svg).strokeWidth || "",
      pad: pad(s),
    });
  }
  return out;
};

const rows = [];
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
for (const [label, size] of [
  ["w1920", { width: 1920, height: 1000 }],
  ["w390", { width: 390, height: 844 }],
]) {
  const page = await browser.newPage({ viewport: size, reducedMotion: "reduce" });
  for (const route of Object.keys(docs)) {
    await page.goto("http://127.0.0.1:" + PORT + "/" + file(route), { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 800) {
        window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 20));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    const got = await page.evaluate(COLLECT);
    for (const [fam, list] of Object.entries(got))
      for (const item of list) rows.push({ vp: label, route, fam, ...item });
  }
  await page.close();
}
await browser.close();
server.close();

const dest = process.env.COMP_OUT || "/tmp/comp-rows.json";
writeFileSync(dest, JSON.stringify(rows));
console.log("routes " + Object.keys(docs).length + "  rows " + rows.length + " -> " + dest);
