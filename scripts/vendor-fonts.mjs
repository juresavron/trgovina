#!/usr/bin/env node
/**
 * Vendor the theme's webfonts into public/fonts and generate the @font-face
 * rules that serve them from our own origin.
 *
 * Two reasons, one of which only became visible once the pages could be
 * screenshotted:
 *
 * 1. PERFORMANCE. A third-party stylesheet on the critical path costs a DNS
 *    lookup, a TLS handshake and a round trip before the first glyph can even
 *    be requested — and it is render-blocking. docs/SEO.md §4 recorded this as
 *    debt against the studio theme. Self-hosting removes the origin entirely.
 *
 * 2. TRUTHFULNESS. Any environment that cannot reach fonts.googleapis.com
 *    renders the fallback stack. That includes this sandbox's browser, which
 *    means every screenshot review was of the wrong typeface.
 *
 * Only the latin and latin-ext subsets are kept. latin-ext is the one that
 * carries č/š/ž, so it is not optional here; every other subset (cyrillic,
 * greek, vietnamese) is weight these shops never need.
 *
 *   node scripts/vendor-fonts.mjs
 */

import fs from "node:fs";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/**
 * The faces the theme ships, and why they are NOT the source's own.
 *
 * The source sets its display type in Clash Display and its prose in Satoshi,
 * both from Fontshare. Chivo and Plus Jakarta Sans stand in for them, and the
 * substitution is deliberate: Slovenian needs č/š/ž, and a face whose Latin
 * Extended coverage cannot be PROVEN from here is a face that renders tofu on
 * the one word a customer types into search.
 *
 * ⚠️ A LATER PASS NEARLY REPLACED THESE WITH Bricolage Grotesque AND DM Sans,
 * on the strength of the source's Google Fonts request — which asks for
 * exactly those two and nothing else. That request is only HALF the story:
 * Clash Display and Satoshi come from Fontshare through framerusercontent, and
 * counted across the source's own stylesheet they carry 30 and 21 font-family
 * declarations against Bricolage Grotesque's zero. Bricolage appears in six
 * inline styles. It is a minor face there, not the theme's voice.
 *
 * If these are ever swapped for the real pair, prove the coverage first:
 * scripts/verify-fonts.mjs reads whatever ships and will say.
 */
const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Chivo:wght@500" +
  "&family=DM+Sans:wght@400..500" +
  // ⚠️ THE AXIS, NOT THREE STATIC WEIGHTS. Asking for wght@400;500;700 made
  // Google return THREE @font-face blocks per subset pointing at three URLs —
  // and the three files are byte-identical, because Plus Jakarta Sans is a
  // variable font and each block simply instances it. Verified by md5:
  //   52d0444…  plus-jakarta-sans-{400,500,700}-latin.woff2      (27,272 B each)
  //   5ffe46e…  plus-jakarta-sans-{400,500,700}-latin-ext.woff2  (21,688 B each)
  // Rendering was correct — the browser instanced each one properly — but it
  // downloaded the same bytes up to three times under three names, and
  // separate URLs defeat the HTTP cache. Measured per page load: 48,960 wasted
  // bytes on the home page and the two collection pages (22.4% of their font
  // payload) and 76,232 on every product page (31.0%).
  //
  // The range asks for the axis, so one face per subset covers 200–800 — which
  // is exactly what the DM Sans line above already does.
  "&family=Plus+Jakarta+Sans:wght@200..800&display=swap";

const KEEP = new Set(["latin", "latin-ext"]);
const OUT_DIR = path.join(process.cwd(), "public", "fonts");
const CSS_OUT = path.join(process.cwd(), "src", "themes", "studio", "fonts.ts");

const res = await fetch(CSS_URL, { headers: { "user-agent": UA } });
if (!res.ok) {
  console.error("Could not fetch the font stylesheet: HTTP " + res.status);
  process.exit(1);
}
const css = await res.text();

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const f of fs.readdirSync(OUT_DIR)) fs.unlinkSync(path.join(OUT_DIR, f));

// Google emits `/* subset */` immediately before each @font-face it labels.
const blocks = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
const faces = [];
let bytes = 0;

for (const [, subset, block] of blocks) {
  if (!KEEP.has(subset)) continue;
  const family = (block.match(/font-family:\s*'([^']+)'/) || [])[1];
  const weight = (block.match(/font-weight:\s*([^;]+)/) || [])[1].trim();
  const style = (block.match(/font-style:\s*(\w+)/) || [])[1] || "normal";
  const url = (block.match(/url\(([^)]+)\)/) || [])[1];
  const range = (block.match(/unicode-range:\s*([^;}]+)/) || [])[1].trim();
  if (!family || !url) continue;

  const slug =
    family.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" +
    weight.replace(/\s+/g, "-") + "-" + subset + ".woff2";

  const bin = await fetch(url, { headers: { "user-agent": UA } });
  if (!bin.ok) {
    console.error("FAIL " + slug + " HTTP " + bin.status);
    process.exit(1);
  }
  const buf = Buffer.from(await bin.arrayBuffer());
  fs.writeFileSync(path.join(OUT_DIR, slug), buf);
  bytes += buf.length;
  faces.push({ family, weight, style, slug, range, subset });
  console.log("  " + slug.padEnd(42) + (buf.length / 1024).toFixed(1).padStart(6) + " KB");
}

if (!faces.length) {
  console.error("No faces matched the kept subsets — refusing to write an empty sheet.");
  process.exit(1);
}

const rules = faces
  .map(
    (f) =>
      "@font-face{font-family:'" + f.family + "';font-style:" + f.style +
      ";font-weight:" + f.weight +
      // swap, not optional: these shops are text-first, and a headline that
      // never arrives is worse than one that reflows once.
      ";font-display:swap;src:url('/fonts/" + f.slug + "') format('woff2')" +
      ";unicode-range:" + f.range + "}",
  )
  .join("\n");

/**
 * The DISPLAY face's files, for <link rel="preload">.
 *
 * ⚠️ page.ts USED TO HARDCODE THIS as ["/fonts/chivo-500-latin.woff2", …].
 * The day the theme moved to the source's own faces, the page went on
 * preloading two files that no longer existed — a wasted request each, and a
 * headline that arrived later than before the "optimisation".
 *
 * The display face is the FIRST family in CSS_URL, by convention, and that
 * convention is asserted rather than trusted: if the first family changes,
 * the preload follows it.
 */
const displayFamily = faces[0].family;
if (!CSS_URL.includes(displayFamily.replace(/ /g, "+"))) {
  console.error("The first vendored family is not the first in CSS_URL — refusing to guess the display face.");
  process.exit(1);
}
const preload = faces
  .filter((f) => f.family === displayFamily)
  .map((f) => "/fonts/" + f.slug);

const header = `/**
 * GENERATED by scripts/vendor-fonts.mjs — do not edit by hand.
 *
 * Self-hosted @font-face rules for the studio theme. Serving these from our own
 * origin removes the render-blocking third-party stylesheet that docs/SEO.md §4
 * recorded as debt, and it is also the only way any environment without access
 * to fonts.googleapis.com renders the real typefaces rather than the fallback
 * stack.
 *
 * latin + latin-ext only. latin-ext carries č/š/ž and is therefore mandatory
 * for these shops; the subsets we drop are weight nobody here would download.
 *
 * ${faces.length} faces, ${(bytes / 1024).toFixed(0)} KB total.
 */
export const STUDIO_FONT_FACE_CSS = \`
${rules}
\`;

/**
 * The display face's files, preloaded by render/page.ts.
 *
 * Only the display face: it sets the h1, which is the LCP text element on
 * every landing page. The prose faces are discovered from the sheet a few
 * milliseconds later and swap in without moving layout, and preloading every
 * file would compete with the image that shares that budget.
 */
export const STUDIO_PRELOAD: readonly string[] = ${JSON.stringify(preload)};
`;

fs.writeFileSync(CSS_OUT, header);
console.log("\n" + faces.length + " faces, " + (bytes / 1024).toFixed(0) + " KB -> public/fonts");
console.log("wrote " + path.relative(process.cwd(), CSS_OUT));
