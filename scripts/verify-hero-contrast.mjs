#!/usr/bin/env node
/**
 * Measure the hero's white type against the PHOTOGRAPH it actually lands on.
 *
 * scripts/verify-contrast.mjs checks the palette — token against token. It
 * cannot see this, because the hero's background is not a token: it is a
 * JPEG under a three-band veil, and whether the nav clears 4.5:1 depends on
 * how bright that particular room is at that particular pixel.
 *
 * That gap is not theoretical. When the full-bleed hero landed, every white
 * run on it looked fine and measured: nav 3.2:1, badge 3.0:1, annotation
 * 1.8:1, heading 2.7:1. The source theme fails the same way — its own product
 * title is white on a pale floor. EU 2019/882 has applied to e-commerce since
 * June 2025, so this is a gate rather than a preference.
 *
 * METHOD. Screenshot the page with the text made transparent, so what remains
 * is exactly the ground each run sits on — including the scrims that are part
 * of that ground. Then take the BRIGHTEST pixel inside each run's box, not the
 * average: a thin white stroke fails on the one bright pixel it crosses, and
 * an average would happily pass a heading lying across a window.
 *
 *   npx wrangler dev --port 8788 &
 *   node scripts/verify-hero-contrast.mjs [baseUrl]
 */

import { chromium } from "playwright-core";

const BASE = process.argv[2] || "http://127.0.0.1:8788";

/** The network is one shop. Kept as a list so a second costs one entry. */
const SHOPS = ["bazen"];

/** The white runs on the hero, and the floor each has to clear. */
const RUNS = [
  [".st-chrome-nav a", 4.5],
  [".st-hero-pill", 4.5],
  [".st-hero-foot h1", 4.5],
  [".st-hero-sub", 4.5],
  [".st-hero-cap", 4.5],
];

const rel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = (r, g, b) => 0.2126 * rel(r) + 0.7152 * rel(g) + 0.0722 * rel(b);

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});

let failures = 0;
/** Reused decode page — declared here so it is initialised before the loop. */
let decoder;
for (const shop of SHOPS) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(BASE + "/?shop=" + shop, { waitUntil: "networkidle" });
  await page.waitForTimeout(250);

  // THE HERO IMAGE MUST ACTUALLY BE THERE.
  //
  // Everything below measures white type against the ground it lands on. If
  // the hero photograph failed to load, that ground is the section's own dark
  // fill — which every run clears comfortably, so the gate reports a clean
  // pass for an image it never saw. That is worse than no gate: it is a green
  // light with nothing behind it.
  //
  // It is not hypothetical. The hero moved to Supabase and is served through
  // /media/, which a sandbox without network access cannot fetch — so the
  // first run after that change would have passed against a blank hero.
  const heroOk = await page.evaluate(() => {
    const img = document.querySelector(".st-hero-bg");
    if (!img) return "none";        // no hero image declared at all
    return img.complete && img.naturalWidth > 0 ? "ok" : "broken";
  });
  if (heroOk === "broken") {
    console.error(
      "  FAIL " + shop.padEnd(9) +
      "hero image did not load — every measurement below would be against an " +
      "empty ground.\n         Run this where /media/ is reachable, or the " +
      "gate is measuring nothing.",
    );
    failures++;
    await page.close();
    continue;
  }
  if (heroOk === "none" && process.env.VERBOSE) {
    console.log("  note " + shop.padEnd(9) + "no hero image — measuring the veil alone");
  }

  const boxes = await page.evaluate((sels) => {
    const out = [];
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
        out.push({ sel, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) });
      }
    }
    return out;
  }, RUNS.map((r) => r[0]));

  // Transparent text, NOT hidden elements: hiding a run would also hide the
  // scrim that is its background, which measures a ground nobody ever sees.
  await page.addStyleTag({
    content: RUNS.map((r) => r[0]).join(",") + "{color:transparent !important}",
  });
  await page.waitForTimeout(120);
  const shot = await page.screenshot({ type: "png" });
  await page.close();

  const img = await decode(shot);
  for (const b of boxes) {
    let worst = 0;
    let px = [0, 0, 0];
    for (let y = Math.max(0, b.y); y < Math.min(img.height, b.y + b.h); y++) {
      for (let x = Math.max(0, b.x); x < Math.min(img.width, b.x + b.w); x++) {
        const i = (y * img.width + x) * 4;
        const L = lum(img.data[i], img.data[i + 1], img.data[i + 2]);
        if (L > worst) { worst = L; px = [img.data[i], img.data[i + 1], img.data[i + 2]]; }
      }
    }
    const ratio = 1.05 / (worst + 0.05);
    const floor = RUNS.find((r) => r[0] === b.sel)[1];
    const ok = ratio >= floor;
    if (!ok) failures++;
    if (!ok || process.env.VERBOSE) {
      console.log(
        (ok ? "  ok   " : "  FAIL ") + shop.padEnd(9) + b.sel.padEnd(20) +
        ratio.toFixed(2).padStart(6) + ":1  worst bg rgb(" + px.join(",") + ")",
      );
    }
  }
}
await browser.close();

if (failures) {
  console.error("\n" + failures + " hero text run(s) below the contrast floor.");
  process.exit(1);
}
console.log("Every hero text run clears its floor against the real photograph.");

/**
 * Decode a PNG without adding a dependency: the browser already open can do
 * it. One reusable page rather than one per image — decoding six screenshots
 * should not launch six browsers.
 */
async function decode(buf) {
  decoder ??= await browser.newPage();
  const data = await decoder.evaluate(async (b64) => {
    const blob = await (await fetch("data:image/png;base64," + b64)).blob();
    const bmp = await createImageBitmap(blob);
    const c = new OffscreenCanvas(bmp.width, bmp.height);
    const ctx = c.getContext("2d");
    ctx.drawImage(bmp, 0, 0);
    const d = ctx.getImageData(0, 0, bmp.width, bmp.height);
    return { width: d.width, height: d.height, data: Array.from(d.data) };
  }, buf.toString("base64"));
  return data;
}
