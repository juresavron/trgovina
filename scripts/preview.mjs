#!/usr/bin/env node
/**
 * Look at the built pages, with stand-ins where the real pictures live.
 *
 * WHY. Every image on this site is in Supabase, which this sandbox cannot
 * reach, so a screenshot taken here renders every frame empty and shows a
 * layout nobody will ever see. The bugs that matter are the opposite: they
 * only appear once a picture is IN the frame — an image overflowing its box,
 * a caption landing on top of one, a white cutout dissolving into a white
 * page.
 *
 * So the stand-ins are not grey rectangles. They are the SHAPE of what is
 * actually in the bucket: studio cutouts of a product on a white sweep,
 * square-ish for the hot tubs and long for the swim spas, because "cutout on
 * white" is the property that breaks these frames.
 *
 *   node scripts/preview.mjs            # write pages + stand-ins, shoot them
 *   node scripts/preview.mjs --serve    # leave the server up on :8791
 */
import { mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import sharp from "sharp";
import { chromium } from "playwright-core";
import { handleRequest } from "../src/worker.ts";

const OUT = process.env.PREVIEW_DIR || "/tmp/preview";
// Several polish agents run this harness at once, so the port must be theirs
// to pick and the page list theirs to extend ("file.html=/path,..." pairs).
const PORT = Number(process.env.PREVIEW_PORT || 8791);
const PAGES = process.env.PREVIEW_PAGES
  ? Object.fromEntries(process.env.PREVIEW_PAGES.split(",").map((e) => e.split("=")))
  : {
  "index.html": "/",
  "masazni-bazeni.html": "/masazni-bazeni",
  "swim-spa.html": "/swim-spa",
  "trgovina.html": "/trgovina",
  "pdp.html": "/bazen/veliki-230",
  "pdp-swim.html": "/bazen/swim-580-maxi",
  };

/* ---------------------------------------------------------------- pages */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "media"), { recursive: true });
if (existsSync("public")) cpSync("public", OUT, { recursive: true });

const html = {};
for (const [file, path] of Object.entries(PAGES)) {
  const res = handleRequest(
    new Request("https://trgovina.worldfans.workers.dev" + path + "?shop=bazen"),
  );
  html[file] = await res.text();
  writeFileSync(join(OUT, file), html[file]);
}

/* ------------------------------------------------------------ stand-ins */
/** Every /media/ URL any page asks for. */
const wanted = new Set();
for (const doc of Object.values(html))
  for (const m of doc.matchAll(/\/media\/([^"'\s)]+)/g)) wanted.add(m[1]);

/**
 * A product cutout on a white sweep: the object centred with generous white
 * around it, which is what makes these files fight the frames they go in.
 * `long` draws the swim spa proportion — the same drawing four times the
 * length — because the aspect ratio is half of what is wrong on the page.
 */
function cutout({ w, h, long, label }) {
  const cx = w / 2, cy = h / 2;
  const bw = long ? w * 0.82 : w * 0.62;
  const bh = long ? h * 0.3 : h * 0.42;
  return Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
      '<rect width="100%" height="100%" fill="#fdfdfc"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy + bh * 0.62) + '" rx="' + bw * 0.52 + '" ry="' + bh * 0.13 + '" fill="#eceae6"/>' +
      '<rect x="' + (cx - bw / 2) + '" y="' + (cy - bh / 2) + '" width="' + bw + '" height="' + bh + '" rx="' + bh * 0.08 + '" fill="#6f7671"/>' +
      '<rect x="' + (cx - bw / 2) + '" y="' + (cy - bh / 2) + '" width="' + bw + '" height="' + bh * 0.34 + '" rx="' + bh * 0.06 + '" fill="#f4f5f3"/>' +
      '<text x="' + cx + '" y="' + (cy + bh * 0.42) + '" font-family="monospace" font-size="' + Math.round(h * 0.05) + '" fill="#b9beba" text-anchor="middle">' + label + "</text>" +
      "</svg>",
  );
}

/** A real scene: edge-to-edge colour, the thing a hero or category wants. */
function scene({ w, h, label }) {
  return Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#2f3a44"/><stop offset="1" stop-color="#8a7f70"/>' +
      "</linearGradient></defs>" +
      '<rect width="100%" height="100%" fill="url(#g)"/>' +
      '<rect x="0" y="' + h * 0.62 + '" width="' + w + '" height="' + h * 0.38 + '" fill="#3b4a45" opacity=".7"/>' +
      '<text x="' + w / 2 + '" y="' + h / 2 + '" font-family="monospace" font-size="' + Math.round(h * 0.07) + '" fill="#ffffff" opacity=".5" text-anchor="middle">' + label + "</text>" +
      "</svg>",
  );
}

for (const name of wanted) {
  const long = /zr78|zr7861|swim/i.test(name);
  const isHero = /^hero\./i.test(name);
  const isCat = /^kategorija-/i.test(name);
  const svg = isHero
    ? scene({ w: 2000, h: 1100, label: "HERO" })
    : isCat
      ? scene({ w: 1400, h: 1000, label: name })
      : cutout({ w: 900, h: long ? 620 : 900, long, label: name });
  const buf = await sharp(svg).jpeg({ quality: 80 }).toBuffer();
  writeFileSync(join(OUT, "media", name), buf);
}
console.log("stand-ins:", wanted.size);

/* --------------------------------------------------------------- server */
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".woff2": "font/woff2", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/") p = "/index.html";
  // Every /media/ name is written flat, whatever extension the page asked for.
  const file = join(OUT, normalize(p).replace(/^(\.\.[/\\])+/, ""));
  try {
    let body = await readFile(file);
    // STRIP_LAZY: every image eager, so a screenshot shows the layout a
    // visitor who scrolls actually gets. Lazy images that never enter the
    // viewport measure 0x0 and hide exactly the overflow bugs we are here for.
    if (extname(file) === ".html") body = Buffer.from(String(body).replaceAll('loading="lazy"', 'loading="eager"'));
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("no");
  }
});
await new Promise((r) => server.listen(PORT, r));
console.log("serving " + OUT + " on http://127.0.0.1:" + PORT);

if (process.argv.includes("--serve")) {
  await new Promise(() => {});
}

/* ------------------------------------------------------------ shoot it */
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
for (const [vp, size] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
  for (const file of Object.keys(PAGES)) {
    await page.goto("http://127.0.0.1:" + PORT + "/" + file, { waitUntil: "networkidle" });
    // Scroll the whole page first. Almost every image below the fold is
    // loading="lazy", so a full-page screenshot taken from the top captures
    // empty frames and looks exactly like the bug it is meant to be showing.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));
    });
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: join(OUT, "shot-" + vp + "-" + file.replace(".html", "") + ".png"), fullPage: true });
  }
  await page.close();
}
await browser.close();
server.close();
console.log("shots in " + OUT);
