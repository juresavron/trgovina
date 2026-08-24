#!/usr/bin/env node
/**
 * Contrast gate for the studio theme.
 *
 * The studio palette is transcribed from a source theme that was never audited
 * for accessibility: several of its rungs fail WCAG 2.1 AA as text (the muted
 * inks are 2.1:1 and 2.9:1 against a 4.5:1 floor). We keep those values for
 * decoration and substitute compliant rungs wherever text sits on them. That
 * split is easy to undo by accident — someone "restores the source value" for
 * --ink-mute and every secondary line on the storefront quietly fails.
 *
 * This script is the guard. It reads the real token values out of tokens.ts,
 * so it cannot drift from what ships, and asserts a floor per role. The EU
 * Accessibility Act (2019/882) has applied to e-commerce since 28 June 2025,
 * which makes this a legal floor for these shops rather than a preference.
 *
 * Usage: node scripts/verify-contrast.mjs
 * Exit 0 = every pair clears its floor. Exit 1 = at least one regressed.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = fs.readFileSync(path.join(ROOT, "src/themes/studio/tokens.ts"), "utf8");

/** Pull a token's value out of the theme's single declaration site. */
function token(name) {
  const m = SRC.match(new RegExp("(?:^|\\s)" + name + ":\\s*(#[0-9a-fA-F]{3,8})\\s*;"));
  if (!m) {
    console.error("FATAL: token " + name + " not found in tokens.ts");
    process.exit(1);
  }
  return m[1];
}

function parse(hex) {
  const h = hex.replace("#", "");
  const f = (s) => parseInt(s.length === 1 ? s + s : s, 16);
  if (h.length === 3 || h.length === 4) {
    return [f(h[0]), f(h[1]), f(h[2]), h.length === 4 ? f(h[3]) / 255 : 1];
  }
  return [
    f(h.slice(0, 2)),
    f(h.slice(2, 4)),
    f(h.slice(4, 6)),
    h.length === 8 ? f(h.slice(6, 8)) / 255 : 1,
  ];
}

const chan = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (rgb) => 0.2126 * chan(rgb[0]) + 0.7152 * chan(rgb[1]) + 0.0722 * chan(rgb[2]);

/** Composite fg over bg first, so alpha rungs are judged as they render. */
function ratio(fgHex, bgHex) {
  const fg = parse(fgHex);
  const bg = parse(bgHex);
  const flat = [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  const a = lum(flat) + 0.05;
  const b = lum(bg.slice(0, 3)) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

// floor 4.5 = body text (WCAG 1.4.3) · 3.0 = large text and UI boundaries
// (1.4.11) · 0 = decoration, asserted only to document the intent.
const CHECKS = [
  ["ink on page", "--ink", "--bg", 4.5],
  ["ink-body on page", "--ink-body", "--bg", 4.5],
  ["ink-body on panel", "--ink-body", "--bg-alt", 4.5],
  ["ink-mute on page", "--ink-mute", "--bg", 4.5],
  ["ink-mute on panel", "--ink-mute", "--bg-alt", 4.5],
  ["ink on tile-mid", "--ink", "--tile-mid", 4.5],
  ["on-invert on dark", "--on-invert", "--ink-invert", 4.5],
  ["on-invert-mute on dark", "--on-invert-mute", "--ink-invert", 4.5],
  ["on-invert-mute on dark-2", "--on-invert-mute", "--ink-invert-2", 4.5],
  ["on-invert on dark-2", "--on-invert", "--ink-invert-2", 4.5],
  ["control border on page", "--line-ctrl", "--bg", 3.0],
  ["strong border on page", "--line-strong", "--bg", 3.0],
  ["amber on dark", "--amber", "--ink-invert", 4.5],
  ["cream on dark", "--cream", "--ink-invert", 4.5],
];

// Rungs that are decorative BY DESIGN. Listed so that anyone who reaches for
// one as a text colour sees, here, why it is not available for that.
const DECORATIVE = [
  ["--ink-mute-decor", "--bg", "source muted alpha — decoration only"],
  ["--line", "--bg", "hairline between surfaces"],
  ["--on-invert-64", "--ink-invert", "on-dark divider"],
  ["--on-invert-40", "--ink-invert", "on-dark divider"],
  ["--on-invert-24", "--ink-invert", "on-dark hairline"],
  ["--on-invert-16", "--ink-invert", "on-dark hairline"],
];

let failed = 0;
console.log("STUDIO CONTRAST GATE\n");
console.log("pair".padEnd(28) + "ratio".padStart(7) + "  floor   result");
console.log("-".repeat(60));

for (const [label, fgTok, bgTok, floor] of CHECKS) {
  const fg = token(fgTok);
  const bg = token(bgTok);
  const r = ratio(fg, bg);
  const ok = r >= floor;
  if (!ok) failed++;
  console.log(
    label.padEnd(28) +
      r.toFixed(2).padStart(7) +
      "  " +
      floor.toFixed(1).padStart(5) +
      "   " +
      (ok ? "pass" : "FAIL  (" + fg + " on " + bg + ")")
  );
}

console.log("\ndecorative rungs — not for text, ratios shown for the record");
console.log("-".repeat(60));
for (const [fgTok, bgTok, why] of DECORATIVE) {
  const r = ratio(token(fgTok), token(bgTok));
  console.log(fgTok.padEnd(28) + r.toFixed(2).padStart(7) + "   " + why);
}

if (failed) {
  console.error("\n" + failed + " pair(s) below floor — studio palette is not shippable.");
  process.exit(1);
}
console.log("\nAll " + CHECKS.length + " text/UI pairs clear their floor.");
