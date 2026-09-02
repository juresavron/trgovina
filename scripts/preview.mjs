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
 *
 * ⚠️ TWO OF THESE AT ONCE WILL MEASURE EACH OTHER'S PAGES unless you set
 * PREVIEW_DIR. The output directory defaults to /tmp/preview for everyone, so
 * a second run overwrites the first one's HTML while it is being read — an
 * audit then reports on a page it never rendered, and the finding looks real.
 * This happened: four concurrent runs during one review round, caught only
 * because the file list changed between two listings.
 *
 * PREVIEW_PORT was already per-run; PREVIEW_DIR has to be too.
 *
 *   PREVIEW_PORT=8811 PREVIEW_DIR=/tmp/preview-a11y node scripts/preview.mjs --serve
 */
import { mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { chromium } from "playwright-core";
/**
 * Load a TypeScript module the way the deploy does: bundled.
 *
 * Node can execute a .ts file directly, but it will not resolve the
 * extensionless, directory-style imports this project uses throughout
 * ("../tenants", "./sections") — resolving those is a bundler's job, and
 * wrangler does exactly this with esbuild on every deploy. So the preview
 * bundles too, rather than the source being contorted to suit a script that
 * only ever runs here.
 */
async function bundle(entry) {
  const out = join(tmpdir(), "preview-" + entry.replace(/[^a-z0-9]+/gi, "-") + ".mjs");
  // The shipped esbuild is a native binary, not a JS wrapper — running it
  // through node gets you the ELF header as a syntax error.
  execFileSync(
    "node_modules/.bin/esbuild",
    [entry, "--bundle", "--format=esm", "--platform=node",
     "--log-level=warning", "--outfile=" + out],
    { stdio: "inherit" },
  );
  return await import(out);
}

const { handleRequest } = await bundle("src/worker.ts");

const OUT = process.env.PREVIEW_DIR || "/tmp/preview";
// Several polish agents run this harness at once, so the port must be theirs
// to pick and the page list theirs to extend ("file.html=/path,..." pairs).
const PORT = Number(process.env.PREVIEW_PORT || 8791);
// The shop, from the same variable the audit-*.mjs scripts read. The default
// page list below is that shop's; PREVIEW_PAGES replaces it for another.
const KEY = process.env.AUDIT_SHOP || "bazen";
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
    new Request("https://trgovina.worldfans.workers.dev" + path + "?shop=" + KEY),
  );
  html[file] = await res.text();
  writeFileSync(join(OUT, file), html[file]);
}

/* ------------------------------------------------------------- the theme */
/**
 * ⚠️ THE STYLESHEET, WITHOUT WHICH THIS SCRIPT SHOWS A PAGE NOBODY WILL SEE.
 *
 * The theme used to be inlined into every document, so a page written to disk
 * was self-contained. It is now served from a content-addressed file (see
 * render/assets.ts) and this script was never taught to emit it: every
 * document asked for /assets/site-<hash>.css, the static server 404'd, and
 * every screenshot this script has taken since was of an UNSTYLED page —
 * block-stacked, full-bleed, nothing where the design puts it.
 *
 * audit-site.mjs hit this and carries the same fix with a longer note. The
 * paths are read out of the rendered HTML rather than imported, so they
 * cannot drift from what the documents actually request.
 */
const assetPaths = new Set();
for (const doc of Object.values(html))
  for (const m of doc.matchAll(/\/assets\/site-[0-9a-f]{8}\.(?:css|js)/g))
    assetPaths.add(m[0]);
if (assetPaths.size === 0) throw new Error("no /assets/ reference in any document — has the asset path changed?");
mkdirSync(join(OUT, "assets"), { recursive: true });
for (const a of assetPaths) {
  const res = handleRequest(new Request("https://trgovina.worldfans.workers.dev" + a));
  if (res.status !== 200) throw new Error("worker did not serve " + a + " (" + res.status + ")");
  writeFileSync(join(OUT, a.replace(/^\//, "")), await res.text());
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
  // The site's own pictures moved under "site/" when the panel took them
  // over, and these patterns were anchored at the start of the path — so a
  // hero stopped being recognised as a hero and got drawn as a product
  // cutout. Matched on the STEM now, which is what actually names the slot.
  const stem = name.slice(name.lastIndexOf("/") + 1);
  const isHero = /^hero\./i.test(stem);
  const isCat = /^kategorija-/i.test(stem);
  const svg = isHero
    ? scene({ w: 2000, h: 1100, label: "HERO" })
    : isCat
      ? scene({ w: 1400, h: 1000, label: name })
      : cutout({ w: 900, h: long ? 620 : 900, long, label: name });
  const buf = await sharp(svg).jpeg({ quality: 80 }).toBuffer();
  // A stand-in path may now be nested — the site's own images live under
  // "site/" — so the directory has to exist before the write.
  mkdirSync(dirname(join(OUT, "media", name)), { recursive: true });
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
      // BACK TO ZERO, AND STAY THERE. A single scrollTo(0,0) was not enough:
      // measured at 1241px afterwards, because the sliders anchor-scroll
      // themselves as they initialise. That is not cosmetic in a full-page
      // capture — Chromium paints a position:fixed element at scrollY + top,
      // so a header left at 1241 gets drawn ACROSS the middle of the picture,
      // on top of whatever section happens to be there. Two screenshots were
      // read as "the chrome overlaps the hero CTA" before this was found.
      for (let i = 0; i < 40 && window.scrollY !== 0; i++) {
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 25));
      }
      // Decode every picture before the shutter. networkidle says the bytes
      // arrived, not that a frame was painted with them, and an image inside
      // a scroll-snap track can still capture blank — which is exactly how a
      // testimonial medallion showed up as an empty white circle.
      await Promise.all(
        Array.from(document.images).map((i) => i.decode().catch(() => {})),
      );
    });
    await page.waitForLoadState("networkidle");
    // PARK THE OVERLAYS BEFORE THE SHUTTER.
    //
    // A full-page capture expands the viewport but does NOT re-resolve a
    // fixed or sticky element against it: Chromium keeps drawing them where
    // the ORIGINAL 900px viewport put them, so in the finished image the
    // header lands wherever the page was scrolled to and the PDP's sticky buy
    // bar is painted straight across the middle of the page — over the colour
    // chips, in the one screenshot meant to prove the chips are fine.
    //
    // Both are read as page bugs the first time you see them, so both are
    // parked: a fixed bar becomes absolute (top of the document, where it
    // actually sits when a visitor arrives) and a sticky one becomes static
    // (its natural place in the flow, which is where it ends up at the bottom
    // of the scroll anyway). Nothing is hidden — everything is still in the
    // picture, just not on top of the content it exists to sit beside.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("*")) {
        const pos = getComputedStyle(el).position;
        if (pos === "fixed") el.style.setProperty("position", "absolute", "important");
        else if (pos === "sticky") el.style.setProperty("position", "static", "important");
      }
    });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: join(OUT, "shot-" + vp + "-" + file.replace(".html", "") + ".png"), fullPage: true });
  }
  await page.close();
}
await browser.close();
server.close();
console.log("shots in " + OUT);
