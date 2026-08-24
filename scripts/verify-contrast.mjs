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

/* ---- The per-shop accent -----------------------------------------------
 * --acc and --acc-text are oklch() with the hue and chroma supplied per shop,
 * so a fixed table cannot check them: each shop resolves to a different colour
 * and a yellow hue behaves very differently from a blue one at the same
 * lightness. We convert oklch to sRGB here and check every shop's real values.
 * This is the part of the palette most likely to fail quietly, because adding
 * a shop is a one-line config change that no one thinks of as a design edit. */

function oklchToRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;

  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const enc = (v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, c)) * 255);
  };
  const hex = (n) => n.toString(16).padStart(2, "0");
  return "#" + hex(enc(lr)) + hex(enc(lg)) + hex(enc(lb));
}

/** Read every shop's accent straight from its tenant config. */
function shopAccents() {
  const dir = path.join(ROOT, "src/tenants");
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".ts") || f === "types.ts" || f === "index.ts") continue;
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    const hue = src.match(/accentHue:\s*([\d.]+)/);
    const chroma = src.match(/accentChroma:\s*([\d.]+)/);
    if (hue && chroma) {
      out.push({ shop: f.replace(/\.ts$/, ""), hue: Number(hue[1]), chroma: Number(chroma[1]) });
    }
  }
  return out;
}

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

// --acc-text carries copy, so 4.5:1. --acc is only ever a focus ring in this
// theme, which 1.4.11 holds to 3:1 — but it must clear that on BOTH grounds a
// ring can land on, the page and the panel.
console.log("\nper-shop accent (oklch resolved to sRGB)");
console.log("-".repeat(60));
console.log("shop".padEnd(10) + "acc-text/page".padStart(14) + "acc/page".padStart(11) + "acc/panel".padStart(11) + "   result");
const page = token("--bg");
const panel = token("--bg-alt");
for (const { shop, hue, chroma } of shopAccents()) {
  const accText = oklchToRgb(0.45, chroma, hue);
  const acc = oklchToRgb(0.62, chroma, hue);
  const rText = ratio(accText, page);
  const rRingPage = ratio(acc, page);
  const rRingPanel = ratio(acc, panel);
  const ok = rText >= 4.5 && rRingPage >= 3 && rRingPanel >= 3;
  if (!ok) failed++;
  console.log(
    shop.padEnd(10) +
      rText.toFixed(2).padStart(14) +
      rRingPage.toFixed(2).padStart(11) +
      rRingPanel.toFixed(2).padStart(11) +
      "   " + (ok ? "pass" : "FAIL")
  );
}

if (failed) {
  console.error("\n" + failed + " pair(s) below floor — studio palette is not shippable.");
  process.exit(1);
}
console.log("\nAll " + CHECKS.length + " fixed pairs and every shop accent clear their floor.");
