#!/usr/bin/env node
/**
 * Screenshot a page in readable, viewport-sized slices.
 *
 * WHY THIS EXISTS. preview.mjs shoots each page whole, and the homepage is
 * ~10000px tall — reduced to fit anything, that image is a thumbnail in which
 * no defect is visible. Every layout bug found in the last pass (a wordmark
 * printing through the basket button, a paragraph indented to align with
 * nothing, three thousand pixels of empty section padding) was invisible in
 * the full-page shot and obvious in a slice.
 *
 *   node scripts/preview.mjs --serve                        # in one shell
 *   node scripts/slice.mjs http://127.0.0.1:8791/index.html /tmp/s 1440 900
 *
 * Images land as s00.png, s01.png … in the output directory.
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const [url, out, wArg, hArg, maxArg] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: node scripts/slice.mjs <url> <outdir> [width] [height] [maxSlices]");
  process.exit(2);
}
const W = Number(wArg || 1440);
const H = Number(hArg || 900);
const MAX = Number(maxArg || 14);

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(url, { waitUntil: "networkidle" });

// Lazy images below the fold never load in a screenshot run, and an image that
// never loads measures 0x0 — which hides exactly the overflow bugs this is for.
await page.evaluate(() => {
  for (const img of document.querySelectorAll("img")) {
    img.loading = "eager";
    img.decoding = "sync";
  }
});
await page.waitForTimeout(400);

const total = await page.evaluate(() => document.documentElement.scrollHeight);
const n = Math.min(MAX, Math.ceil(total / H));
for (let i = 0; i < n; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * H);
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${out}/s${String(i).padStart(2, "0")}.png` });
}

// Anything sticking out sideways, named. The page-level check in
// audit-site.mjs only sees overflow that makes the PAGE scroll; a child that
// spills over its own parent while the parent clips is invisible to it.
const over = await page.evaluate(() => {
  const bad = [];
  const w = document.documentElement.clientWidth;
  for (const el of document.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > w + 1 || r.left < -1)) {
      bad.push(el.tagName.toLowerCase() + "." + (el.className || "").toString().slice(0, 30) +
        " " + Math.round(r.left) + ".." + Math.round(r.right));
    }
  }
  return bad.slice(0, 8);
});
if (over.length) console.log("OVERFLOWS:\n  " + over.join("\n  "));
console.log("height", total, "slices", n);
await browser.close();
