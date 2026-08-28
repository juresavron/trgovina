#!/usr/bin/env node
/**
 * The swatch framer's gate.
 *
 * WHY THIS EXISTS. Every colour tile on the storefront is composed by
 * frameSwatch() + drawSlot() in admin/panel.ts: find the sample in whatever
 * the operator uploaded, then paint it at a fixed size in the middle of a
 * 400x400 tile. It is pixel code that runs only in a browser, so nothing in
 * the vitest suite can reach it — and it has been reported wrong three times
 * running, each time in a way a screenshot showed and no assertion did:
 *
 *   "not like one a bit higher one a bit lower"  — a centre crop kept
 *     whatever happened to be in the middle.
 *   "one image cannot be different as here"      — the crop was clamped when
 *     the sample sat near an edge, so tiles came out at different scales.
 *   "ai should not include words and stuf"       — the box was drawn around
 *     every non-background pixel, so a supplier caption printed under the
 *     sample was framed along with it.
 *
 * So this drives the real function in real Chromium over the shapes that
 * broke it, and checks the property that matters: EVERY tile puts the sample
 * at the same size in the same place, whatever it arrived as.
 *
 *   node scripts/verify-swatch-frame.mjs
 *
 * Exit code is 1 on any failure, so it can gate.
 */
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright-core";

const out = join(tmpdir(), "fr-panel.mjs");
execFileSync("node_modules/.bin/esbuild",
  ["src/admin/panel.ts", "--bundle", "--format=esm", "--platform=node", "--log-level=warning", "--outfile=" + out],
  { stdio: "inherit" });
const { SMART_JS } = await import(out);

// Pull the self-contained function out of the mounted script.
const i = SMART_JS.indexOf("function frameSwatch(bmp){");
if (i < 0) throw new Error("frameSwatch not found in SMART_JS");
let depth = 0, j = SMART_JS.indexOf("{", i);
for (let k = j; k < SMART_JS.length; k++) {
  if (SMART_JS[k] === "{") depth++;
  else if (SMART_JS[k] === "}") { depth--; if (depth === 0) { j = k + 1; break; } }
}
const src = SMART_JS.slice(i, j);

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 800, height: 600 } });
await p.goto("about:blank");
const res = await p.evaluate(async ({ src }) => {
  eval(src);
  const SWATCH_FILL = 0.84;
  async function make(w, h, bg, col, x, y, cw, ch, noisyCorner) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = col; g.fillRect(x, y, cw, ch);
    if (noisyCorner) { g.fillStyle = "#c0392b"; g.fillRect(0, 0, 20, 20); }
    return await createImageBitmap(c);
  }
  /* Compose exactly as drawSlot does, then measure where the object landed. */
  function compose(bmp, frame, maxW) {
    const c = document.createElement("canvas"); c.width = maxW; c.height = maxW;
    const g = c.getContext("2d");
    g.fillStyle = frame.bg; g.fillRect(0, 0, maxW, maxW);
    const k = (maxW * SWATCH_FILL) / Math.max(frame.w, frame.h);
    const dw = Math.max(1, Math.round(frame.w * k)), dh = Math.max(1, Math.round(frame.h * k));
    const dx = Math.round((maxW - dw) / 2), dy = Math.round((maxW - dh) / 2);
    g.drawImage(bmp, frame.x, frame.y, frame.w, frame.h, dx, dy, dw, dh);
    // Where is the object in the OUTPUT? Scan for non-background.
    const d = g.getImageData(0, 0, maxW, maxW).data;
    const bgpx = [d[0], d[1], d[2]];
    let x0 = maxW, y0 = maxW, x1 = -1, y1 = -1;
    for (let y = 0; y < maxW; y++) for (let x = 0; x < maxW; x++) {
      const i = (y * maxW + x) * 4;
      const dr = d[i] - bgpx[0], dg = d[i+1] - bgpx[1], db = d[i+2] - bgpx[2];
      if (Math.sqrt(dr*dr + dg*dg + db*db) <= 24) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    if (x1 < 0) return null;
    return {
      longest: Math.max(x1 - x0 + 1, y1 - y0 + 1),
      cx: Math.round((x0 + x1 + 1) / 2), cy: Math.round((y0 + y1 + 1) / 2),
      padL: x0, padR: maxW - 1 - x1, padT: y0, padB: maxW - 1 - y1,
    };
  }
  /* The reported case: a supplier screen capture with the shade name printed
     under the sample. */
  async function withCaption(w, h, panel, x, y, cw, ch, text) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
    g.fillStyle = panel; g.fillRect(x, y, cw, ch);
    g.fillStyle = "#1f6fd0";
    g.font = "600 46px sans-serif";
    g.textAlign = "center";
    g.fillText(text, w / 2, y + ch + 70);
    return await createImageBitmap(c);
  }
  const cases = {
    "square, centred":            [600, 400, "#ffffff", "#2b2b2b", 230, 130, 140, 140, false],
    "square, top-left corner":    [600, 400, "#ffffff", "#2b2b2b",   6,   6, 140, 140, false],
    "square, bottom-right":       [600, 400, "#ffffff", "#2b2b2b", 454, 254, 140, 140, false],
    "landscape, wider than tall": [600, 400, "#ffffff", "#2b2b2b",  40, 150, 520,  90, false],
    "portrait, taller than wide": [600, 400, "#ffffff", "#2b2b2b", 270,   8,  60, 384, false],
    "tiny sample":                [900, 600, "#ffffff", "#8a6f4e", 560, 330, 120, 120, false],
    "fills the whole frame":      [400, 400, "#ffffff", "#2b2b2b",   0,   0, 400, 400, false],
    "near-white on white":        [600, 400, "#ffffff", "#fafafa", 200, 120, 160, 160, false],
    "busy corner":                [600, 400, "#ffffff", "#2b2b2b", 200, 120, 160, 160, true],
  };
  const out = {};
  for (const [k, a] of Object.entries(cases)) {
    const bmp = await make(...a);
    const f = frameSwatch(bmp);
    out[k] = { frame: f ? "ok" : "NULL", ...(f ? compose(bmp, f, 400) : {}) };
  }
  /* Does the frame stop above the caption? The panel ends at y+ch; the
     caption sits below it. A frame whose bottom is past the panel has
     swallowed the words. */
  for (const [k, t] of [["caption Black", "Black"], ["caption Pure White", "Pure White"], ["caption Grey", "Grey"]]) {
    const bmp = await withCaption(600, 480, "#4a4a4a", 120, 60, 360, 220, t);
    const f = frameSwatch(bmp);
    const panelBottom = 60 + 220;
    out[k] = f
      ? { frame: "ok", box: f.x + "," + f.y + " " + f.w + "x" + f.h,
          excludesCaption: f.y + f.h <= panelBottom + 12 ? "YES" : "NO — caption is in the tile",
          ...compose(bmp, f, 400) }
      : { frame: "NULL" };
  }
  return out;
}, { src });
const FILL = 0.84, TILE = 400;
const want = Math.round(TILE * FILL);
let bad = 0;
console.log("case".padEnd(28) + "longest  centre      padding L/R/T/B");
for (const [k, v] of Object.entries(res)) {
  if (v.frame !== "ok") { console.log("  FAIL " + k.padEnd(24) + "framer returned nothing"); bad++; continue; }
  const line = k.padEnd(28) + String(v.longest ?? "-").padStart(4) + "    " +
    ((v.cx ?? "-") + "," + (v.cy ?? "-")).padEnd(10) + "  " +
    [v.padL, v.padR, v.padT, v.padB].join("/") +
    (v.excludesCaption ? "   caption excluded: " + v.excludesCaption : "");
  const notes = [];
  // A solid tile measures as nothing, and that is a correct outcome: the
  // sample filled its frame, so the whole tile is the colour.
  if (v.longest !== undefined) {
    if (Math.abs(v.longest - want) > 4) notes.push("scale " + v.longest + ", want " + want);
    if (Math.abs(v.cx - TILE / 2) > 2 || Math.abs(v.cy - TILE / 2) > 2) {
      notes.push("off centre at " + v.cx + "," + v.cy);
    }
    if (Math.abs(v.padL - v.padR) > 2 || Math.abs(v.padT - v.padB) > 2) {
      notes.push("asymmetric padding");
    }
  }
  if (v.excludesCaption && v.excludesCaption !== "YES") notes.push("caption is in the tile");
  console.log((notes.length ? "  FAIL " + line.slice(6) : line) + (notes.length ? "\n        " + notes.join("; ") : ""));
  if (notes.length) bad++;
}
await b.close();
if (bad > 0) {
  console.error("\n" + bad + " swatch framing failure(s).");
  process.exit(1);
}
console.log("\nEvery sample lands at " + want + "px, centred, with symmetric padding.");
