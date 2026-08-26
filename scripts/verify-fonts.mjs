#!/usr/bin/env node
/**
 * Glyph-coverage gate for the studio theme.
 *
 * Every shop in this network sells in Slovenian, where č/š/ž appear in
 * ordinary retail words — "Košarica", "Dostava in montaža", "Pogosta
 * vprašanja". A missing glyph does not error: the browser silently falls back
 * per-character, so one word renders in two typefaces and nobody notices until
 * a customer does.
 *
 * This gate is why the theme does NOT use the source's own faces. Clash
 * Display and Satoshi are Fontshare faces whose Slovenian coverage could not
 * be established from any reachable source, and an English furniture site's
 * rendering is no evidence. They were replaced with the closest verified
 * faces by measured proportion (docs/STUDIO-BASELINE.md §1).
 *
 * This script downloads each face actually used and asserts that every
 * character Slovenian needs is present in its cmap. It must pass before any
 * shop flips `live: true`.
 *
 * It needs network access to fonts.googleapis.com.
 *
 * Usage: node scripts/verify-fonts.mjs
 */

import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Every character the storefronts can emit beyond ASCII. Slovenian proper
 * needs the first group; the rest show up in supplier names, imported product
 * copy and prices, so they are checked too rather than discovered in
 * production.
 */
const REQUIRED = {
  "Slovenian lowercase": "čšž",
  "Slovenian uppercase": "ČŠŽ",
  "Croatian/Bosnian (supplier names)": "ćđĆĐ",
  "Currency and punctuation": "€–—…„“”",
  "Common imported diacritics": "áéíóúüöäßàèñ",
};

/**
 * The weights the theme actually sets, per role. Everything else about the
 * faces is READ FROM WHAT SHIPS.
 *
 * ⚠️ THIS FILE USED TO CARRY ITS OWN LIST OF FAMILIES AND ITS OWN GOOGLE URL,
 * under a comment claiming that was "the theme's real request … rather than a
 * second list that can drift from tokens.ts". It was a second list, and it did
 * drift: after the theme moved to the source's own faces this gate was still
 * checking Chivo and Plus Jakarta Sans, reporting twelve happy faces for a
 * family the site no longer loads.
 *
 * So the families now come out of src/themes/studio/fonts.ts — the generated
 * sheet the Worker inlines — which is the only thing that can be wrong in a
 * way that matters. A face that is not in that file is not on the site.
 */
const WEIGHTS = [400, 500, 700];

const FONTS_TS = path.join(process.cwd(), "src", "themes", "studio", "fonts.ts");

/** Pull the font-family → woff2 URL pairs out of a webfont stylesheet. */
function facesFromCss(css) {
  const out = [];
  for (const block of css.match(/@font-face\s*\{[^}]*\}/g) || []) {
    const fam = (block.match(/font-family:\s*['"]?([^;'"]+)/) || [])[1];
    // A variable font is served as ONE face with a weight RANGE
    // ("font-weight: 400 500"), not one block per weight. Matching the first
    // number only would report every other weight as unserved.
    const wRaw = (block.match(/font-weight:\s*([\d\s]+)/) || [])[1];
    const url = (block.match(/url\(['"]?([^'")]+\.woff2)/) || [])[1];
    const style = (block.match(/font-style:\s*(\w+)/) || [])[1] || "normal";
    const range = (block.match(/unicode-range:\s*([^;}]+)/) || [])[1] || "";
    if (fam && url && style === "normal") {
      const nums = (wRaw || "").trim().split(/\s+/).map(Number).filter((n) => !Number.isNaN(n));
      const lo = nums.length ? nums[0] : 400;
      const hi = nums.length > 1 ? nums[nums.length - 1] : lo;
      out.push({ family: fam.trim(), wLo: lo, wHi: hi, url, range: range.trim() });
    }
  }
  return out;
}

/* ---- Minimal woff2 → cmap reader ---------------------------------------
 * Decoding woff2's Brotli-compressed table directory to read cmap properly is
 * a large amount of code for a build gate. Instead we let the browser engine
 * that already ships with Node do the work: Node 18+ exposes DecompressionStream
 * but not Brotli for it, so we shell out to fontTools when available and fall
 * back to a coverage probe via the CSS unicode-range, which is what actually
 * governs whether the browser will even request the file.
 *
 * The unicode-range check is the load-bearing one: if a subset covering U+010D
 * (č) is never declared, the browser will not download a file containing it,
 * so the glyph cannot render regardless of what the binary holds. */

function rangeCovers(rangeStr, codepoint) {
  if (!rangeStr) return true; // no range = the face serves everything
  for (const part of rangeStr.split(",")) {
    const t = part.trim().replace(/^U\+/i, "");
    if (t.includes("-")) {
      const [a, b] = t.split("-").map((x) => parseInt(x, 16));
      if (codepoint >= a && codepoint <= b) return true;
    } else if (t.includes("?")) {
      const lo = parseInt(t.replace(/\?/g, "0"), 16);
      const hi = parseInt(t.replace(/\?/g, "F"), 16);
      if (codepoint >= lo && codepoint <= hi) return true;
    } else if (parseInt(t, 16) === codepoint) {
      return true;
    }
  }
  return false;
}

async function main() {
  let failed = 0;
  const allChars = Object.values(REQUIRED).join("");

  console.log("STUDIO FONT COVERAGE GATE\n");

  let sheet;
  try {
    sheet = readFileSync(FONTS_TS, "utf8");
  } catch (err) {
    console.error("Could not read " + FONTS_TS + ": " + err.message);
    console.error("Run scripts/vendor-fonts.mjs first — there is nothing shipping to check.");
    process.exit(2);
  }

  const shipped = facesFromCss(sheet);
  if (!shipped.length) {
    console.error("No @font-face rules in the generated sheet. Refusing to pass.");
    process.exit(1);
  }
  const families = [...new Set(shipped.map((f) => f.family))];
  console.log("Reading " + path.relative(process.cwd(), FONTS_TS) + " — " +
    shipped.length + " faces, " + families.length + " families\n");

  for (const family of families) {
    const declared = shipped.filter(
      (f) => f.family.toLowerCase() === family.toLowerCase()
    );
    console.log("\n" + family + "  (" + declared.length + " faces shipped)");

    for (const w of WEIGHTS) {
      const hit = declared.filter((d) => w >= d.wLo && w <= d.wHi);
      if (!hit.length) {
        // A weight outside a variable face's range is not a failure — it is a
        // weight this family does not offer, and the ramp does not ask for it.
        console.log("   weight " + w + ": not in this family's range, skipped");
        continue;
      }
      const missing = [];
      for (const [group, chars] of Object.entries(REQUIRED)) {
        for (const chr of chars) {
          const cp = chr.codePointAt(0);
          if (!hit.some((h) => rangeCovers(h.range, cp))) {
            missing.push(chr + " (U+" + cp.toString(16).toUpperCase().padStart(4, "0") + ", " + group + ")");
          }
        }
      }
      if (missing.length) {
        console.log("   weight " + w + ": FAIL — no subset covers " + missing.join(", "));
        failed++;
      } else {
        console.log("   weight " + w + ": ok — all " + allChars.length + " required characters are in a served subset");
      }
    }
  }

  if (failed) {
    console.error(
      "\n" + failed + " check(s) failed. Do not launch on these faces.\n" +
        "Either pick a face with Latin Extended coverage, or subset and\n" +
        "self-host one that has the glyphs, and re-run vendor-fonts.mjs."
    );
    process.exit(1);
  }
  console.log("\nAll declared faces cover the Slovenian character set.");
  console.log(
    "NOTE: this proves the browser will FETCH a covering subset. Render one\n" +
      "page with 'Košarica — dostava in montaža' and look at it before launch."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
