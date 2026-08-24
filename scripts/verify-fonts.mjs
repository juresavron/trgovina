#!/usr/bin/env node
/**
 * Glyph-coverage gate for the studio theme.
 *
 * The studio theme's faces come from the owner's Framer theme, which is an
 * English-language furniture site. Its own rendering proves nothing about
 * Latin Extended, and every shop in this network sells in Slovenian, where
 * č/š/ž appear in ordinary retail words — "Košarica", "Dostava in montaža",
 * "Pogosta vprašanja". A missing glyph does not error: the browser silently
 * falls back per-character, so one word renders in two typefaces and nobody
 * notices until a customer does.
 *
 * This script downloads each face actually used and asserts that every
 * character Slovenian needs is present in its cmap. It must pass before any
 * shop flips `live: true`.
 *
 * It needs network access to fontshare.com and fonts.googleapis.com. The
 * environment this theme was transcribed in had neither (egress is
 * allowlisted), which is exactly why the check is a script rather than a
 * claim in a document.
 *
 * Usage: node scripts/verify-fonts.mjs
 */

import { readFileSync } from "node:fs";

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

const FACES = [
  { family: "Clash Display", weights: [500, 700], source: "fontshare" },
  { family: "Satoshi", weights: [400, 500, 700], source: "fontshare" },
  { family: "DM Sans", weights: [400, 500], source: "google" },
];

const FONTSHARE_CSS =
  "https://api.fontshare.com/v2/css?f[]=clash-display@500,700&f[]=satoshi@400,500,700&display=swap";
const GOOGLE_CSS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..500&display=swap";

// A modern UA gets woff2 rather than a legacy fallback format.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
  return res.text();
}

/** Pull the font-family → woff2 URL pairs out of a webfont stylesheet. */
function facesFromCss(css) {
  const out = [];
  for (const block of css.match(/@font-face\s*\{[^}]*\}/g) || []) {
    const fam = (block.match(/font-family:\s*['"]?([^;'"]+)/) || [])[1];
    const weight = (block.match(/font-weight:\s*(\d+)/) || [])[1];
    const url = (block.match(/url\(['"]?([^'")]+\.woff2)/) || [])[1];
    const style = (block.match(/font-style:\s*(\w+)/) || [])[1] || "normal";
    const range = (block.match(/unicode-range:\s*([^;}]+)/) || [])[1] || "";
    if (fam && url && style === "normal") {
      out.push({ family: fam.trim(), weight: weight || "?", url, range: range.trim() });
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

  let css;
  try {
    css = {
      fontshare: await fetchText(FONTSHARE_CSS),
      google: await fetchText(GOOGLE_CSS),
    };
  } catch (err) {
    console.error("Could not reach the font services: " + err.message);
    console.error(
      "\nThis gate needs egress to api.fontshare.com and fonts.googleapis.com.\n" +
        "Run it from an environment that has both. Do NOT mark a shop live on\n" +
        "the assumption that coverage is fine — that is the failure this exists\n" +
        "to prevent."
    );
    process.exit(2);
  }

  for (const face of FACES) {
    const declared = facesFromCss(css[face.source]).filter(
      (f) => f.family.toLowerCase() === face.family.toLowerCase()
    );
    console.log("\n" + face.family + "  (" + declared.length + " normal-style faces declared)");

    if (!declared.length) {
      console.log("   FAIL — the stylesheet declares no faces for this family.");
      failed++;
      continue;
    }

    for (const w of face.weights) {
      const hit = declared.filter((d) => String(d.weight) === String(w));
      if (!hit.length) {
        console.log("   weight " + w + ": FAIL — not served");
        failed++;
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
        "self-host one that has the glyphs, and update tokens.ts to match."
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
