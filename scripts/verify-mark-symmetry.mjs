#!/usr/bin/env node
/**
 * The mark is symmetric about its own vertical axis, or this fails.
 *
 * WHY A GATE AND NOT A GLANCE. brand.ts's note claims the V is "symmetric
 * about x=12" and the drawing it described was not: the left arm was cut 5
 * units wide at the top and the right arm 4.2, and the flat bottom terminal
 * ran from x=12 to x=13.7 — a point sitting 0.85 units right of the axis in a
 * 24-unit box. Nobody reported it in three rounds of drawing reviews, because
 * a 3.5% lean on a 16px glyph is exactly the kind of thing the eye corrects
 * for and the render does not.
 *
 * METHOD. Rasterise the mark large, mirror the bitmap about its own vertical
 * centre, and compare pixel for pixel. A symmetric drawing differs from its
 * own reflection only by antialiasing noise on the diagonals; an asymmetric
 * one differs structurally and the count runs into the thousands.
 *
 *   node scripts/verify-mark-symmetry.mjs
 */
import { chromium } from "playwright-core";
import { brandMark } from "../src/themes/studio/brand.ts";

/** Rendered edge, in px. Large enough that a half-unit lean cannot hide in
 *  the antialiasing: one unit of the 24 viewBox is 10px here. */
const SIZE = 240;
/** A pixel counts as different when a channel moves by more than this. Pure
 *  antialiasing on a mirrored diagonal lands a few levels apart; a structural
 *  difference is full black against full white. */
const CHANNEL = 24;
/** Antialiasing alone leaves a thin seam. Anything past this is a real lean. */
const BUDGET = Math.round(SIZE * 0.02);

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: SIZE, height: SIZE },
  deviceScaleFactor: 1,
});
await page.setContent(
  '<!doctype html><meta charset="utf-8">' +
  '<style>html,body{margin:0;background:#fff;color:#000}' +
  "svg{display:block;width:" + SIZE + "px;height:" + SIZE + "px}</style>" +
  brandMark("sym", ""),
);
const shot = await page.screenshot({ type: "png" });

// Decode in the page rather than pulling in a codec: a canvas already lives
// here, and this is the same trick verify-hero-contrast.mjs uses.
const diff = await page.evaluate(async ({ b64, size, channel }) => {
  const img = new Image();
  img.src = "data:image/png;base64," + b64;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, size, size).data;
  let bad = 0;
  let worstRow = -1, worstCount = 0;
  for (let y = 0; y < size; y++) {
    let row = 0;
    for (let x = 0; x < size >> 1; x++) {
      const a = (y * size + x) * 4;
      const b = (y * size + (size - 1 - x)) * 4;
      if (Math.abs(d[a] - d[b]) > channel) { bad++; row++; }
    }
    if (row > worstCount) { worstCount = row; worstRow = y; }
  }
  return { bad, worstRow, worstCount };
}, { b64: shot.toString("base64"), size: SIZE, channel: CHANNEL });

await browser.close();

if (diff.bad > BUDGET) {
  console.error(
    "The mark is NOT symmetric: " + diff.bad + " mirrored pixels differ " +
    "(budget " + BUDGET + "). Worst row y=" + diff.worstRow +
    " with " + diff.worstCount + " of " + (SIZE >> 1) + ".",
  );
  process.exit(1);
}
console.log(
  "The mark mirrors onto itself — " + diff.bad + " differing pixels of " +
  (SIZE * (SIZE >> 1)) + " compared, budget " + BUDGET + ".",
);
