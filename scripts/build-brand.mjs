#!/usr/bin/env node
/**
 * Write the brand's icon files from the single drawing in brand.ts.
 *
 * WHY GENERATED RATHER THAN DRAWN ONCE AND COMMITTED BY HAND. A favicon that
 * has quietly drifted from the logo beside it is an error nobody reports and
 * everybody half-notices. Here there is one geometry, in one module, and
 * every file below is derived from it — so the header mark and the tab icon
 * cannot disagree.
 *
 *   node scripts/build-brand.mjs
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { faviconSvg, touchIconSvg } from "../src/themes/studio/brand.ts";

// The vector favicon: what every modern browser actually uses, and the only
// one that follows the tab strip between light and dark.
writeFileSync("public/favicon.svg", faviconSvg());

// A raster fallback for the browsers that still ignore an SVG icon. 32px is
// the size a tab strip asks for on a high-density display.
const png32 = await sharp(Buffer.from(faviconSvg())).resize(32, 32).png().toBuffer();
writeFileSync("public/favicon-32.png", png32);

// ⚠️ AND A 96, WHICH IS THE ONE GOOGLE WILL ACTUALLY USE. The favicon printed
// beside a search result has to be a square whose side is a multiple of 48px,
// and 32 is not one — it was chosen for a tab strip, which is a different job
// and still its own. Same drawing, so the SERP icon cannot drift from the tab
// icon or from the header mark either.
const png96 = await sharp(Buffer.from(faviconSvg())).resize(96, 96).png().toBuffer();
writeFileSync("public/favicon-96.png", png96);

// iOS draws this one on the home screen with no ground of its own, so the
// plate is part of the artwork rather than something the platform supplies.
const touch = await sharp(Buffer.from(touchIconSvg())).resize(180, 180).png().toBuffer();
writeFileSync("public/apple-touch-icon.png", touch);

console.log(
  "favicon.svg " + faviconSvg().length + " B · " +
  "favicon-32.png " + png32.length + " B · " +
  "favicon-96.png " + png96.length + " B · " +
  "apple-touch-icon.png " + touch.length + " B",
);
