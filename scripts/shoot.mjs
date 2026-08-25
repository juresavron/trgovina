#!/usr/bin/env node
/**
 * Screenshot the storefront so a change can be LOOKED AT.
 *
 * Most of this theme was built without anyone seeing it: the sandbox has no
 * display and the QA host is unreachable from here, so every judgement came
 * from reading markup. That is how a band ends up entirely black, or a
 * watermark ends up the wrong shape twice. This closes that loop.
 *
 * Drives the pre-installed Chromium against a running `wrangler dev`, so what
 * is captured is the real Worker with real static assets — not a re-render.
 *
 *   npx wrangler dev --port 8788 &
 *   node scripts/shoot.mjs [baseUrl] [outDir]
 */

import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "http://127.0.0.1:8788";
const OUT = process.argv[3] || "/tmp/shots";

// One shop per theme decision worth checking, plus the two page types that
// differ structurally. Shooting all six shops mostly re-photographs the same
// layout in a different hue.
const PAGES = [
  { name: "home-savna", url: "/?shop=savna" },
  { name: "home-kad", url: "/?shop=kad" },
  { name: "home-biljard", url: "/?shop=biljard" },
  { name: "pdp-savna", url: "/savna/quattro?shop=savna" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});

let shot = 0;
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    // Freeze motion so a capture is deterministic rather than catching a
    // marquee mid-translate or a counter mid-count.
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    const url = BASE + p.url;
    const res = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    if (!res || !res.ok()) {
      console.error("FAIL " + url + " -> " + (res ? res.status() : "no response"));
      continue;
    }
    // Webfonts decide the whole layout; a shot taken before they land is a
    // photograph of the fallback stack.
    await page.evaluate(() => document.fonts.ready);

    // Walk the page so every lazy image enters the viewport and decodes.
    // Without this a full-page capture photographs empty boxes where the
    // photography should be — which is exactly how a review concludes the
    // imagery "isn't showing" when it is simply below the fold.
    await page.evaluate(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));
    });
    await page.waitForLoadState("networkidle");

    // Fail loudly rather than shipping a screenshot full of broken boxes.
    const broken = await page.$$eval("img", (els) =>
      els.filter((e) => !e.complete || e.naturalWidth === 0).map((e) => e.getAttribute("src")),
    );
    if (broken.length) console.error("  BROKEN IMAGES: " + broken.join(", "));
    const file = path.join(OUT, p.name + "-" + vp.name + ".png");
    await page.screenshot({ path: file, fullPage: true });
    const kb = (fs.statSync(file).size / 1024).toFixed(0);
    console.log(vp.name.padEnd(8) + p.name.padEnd(14) + kb.padStart(5) + " KB  " + file);
    shot++;
  }
  await ctx.close();
}
await browser.close();
console.log("\n" + shot + " screenshots in " + OUT);
