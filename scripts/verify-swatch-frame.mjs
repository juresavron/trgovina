#!/usr/bin/env node
/**
 * The swatch framer's gate.
 *
 * WHY THIS EXISTS. Every colour tile on the storefront is composed by
 * frameSwatch() + drawSlot() in admin/client.ts: find the sample in whatever
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

// ⚠️ src/admin/client.ts, NOT panel.ts. SMART_JS moved when the 1,832-line
// admin router was split into surfaces: panel.ts imports it from ./client and
// does not re-export it, so this script destructured undefined off the bundle
// and died on `SMART_JS.indexOf` — silently, because nothing runs it in CI.
// The gate was dead for four merges. Bundling the module that OWNS the symbol
// is also the smaller bundle and the one that cannot drift again this way.
const out = join(tmpdir(), "fr-panel.mjs");
execFileSync("node_modules/.bin/esbuild",
  ["src/admin/client.ts", "--bundle", "--format=esm", "--platform=node", "--log-level=warning", "--outfile=" + out],
  { stdio: "inherit" });
const { SMART_JS } = await import(out);
if (typeof SMART_JS !== "string") {
  throw new Error("SMART_JS is " + typeof SMART_JS + " — has it moved again?");
}

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
  /* ⚠️ THE SHAPE THAT ACTUALLY ARRIVED. A hot-tub corner is a chevron: two
     panel faces meeting at a vertical edge, photographed from slightly above.
     Its bounding box is therefore MOSTLY WHITE — the sky above the top edge
     and the floor below the skirt — which is the property that broke the
     first caption fix. */
  async function corner(w, h, panel, cx, cy, halfW, panelH, text) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, w, h);
    g.fillStyle = panel;
    // Two faces meeting at (cx, cy): a wide, shallow V of solid panel.
    g.beginPath();
    g.moveTo(cx - halfW, cy - panelH * 0.55);
    g.lineTo(cx, cy - panelH * 0.15);
    g.lineTo(cx + halfW, cy - panelH * 0.55);
    g.lineTo(cx + halfW, cy + panelH * 0.25);
    g.lineTo(cx, cy + panelH * 0.65);
    g.lineTo(cx - halfW, cy + panelH * 0.25);
    g.closePath(); g.fill();
    if (text) {
      g.fillStyle = "#1f6fd0";
      g.font = "600 52px sans-serif";
      g.textAlign = "center";
      g.fillText(text, w / 2, cy + panelH * 0.65 + 90);
    }
    return await createImageBitmap(c);
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
  /* ⚠️ THE CASE THAT SHIPPED BROKEN. A cabinet corner photographed wide
     touches the left and right edges of its frame, so a corner-pixel sample
     lands ON the panel and the four-corner agreement test failed — the
     framer gave up, returned the whole picture, and the supplier's caption
     rode along at whatever scale the source happened to be. Three tiles went
     live that way, two of them with English shade names printed across them.
     A border RING survives an object touching an edge; four corners do not. */
  for (const [k, t] of [["edge-to-edge + caption", "Grey"], ["edge-to-edge, no caption", null]]) {
    const c = document.createElement("canvas"); c.width = 900; c.height = 780;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 900, 780);
    g.fillStyle = "#4a4a4a";
    // Spans the full width: both side edges are panel, not ground.
    g.beginPath();
    g.moveTo(0, 240); g.lineTo(450, 300); g.lineTo(900, 240);
    g.lineTo(900, 470); g.lineTo(450, 530); g.lineTo(0, 470);
    g.closePath(); g.fill();
    if (t) {
      g.fillStyle = "#1f6fd0"; g.font = "600 52px sans-serif"; g.textAlign = "center";
      g.fillText(t, 450, 640);
    }
    const bmp = await createImageBitmap(c);
    const f = frameSwatch(bmp);
    out[k] = f
      ? { frame: "ok", box: f.x + "," + f.y + " " + f.w + "x" + f.h,
          ...(t ? { excludesCaption: f.y + f.h <= 560 ? "YES" : "NO — caption is in the tile" } : {}),
          ...compose(bmp, f, 400) }
      : { frame: "NULL" };
  }

  /* The real shape, with and without the caption. */
  for (const [k, t] of [["corner + caption Grey", "Grey"], ["corner + caption Black", "Black"], ["corner, no caption", null]]) {
    const bmp = await corner(900, 780, "#4a4a4a", 450, 330, 300, 300, t);
    const f = frameSwatch(bmp);
    const panelBottom = 330 + 300 * 0.65;
    out[k] = f
      ? { frame: "ok", box: f.x + "," + f.y + " " + f.w + "x" + f.h,
          ...(t ? { excludesCaption: f.y + f.h <= panelBottom + 20 ? "YES" : "NO — caption is in the tile" } : {}),
          ...compose(bmp, f, 400) }
      : { frame: "NULL" };
  }

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
    // ⚠️ THE TOLERANCE IS 2%, NOT ZERO, AND THE REASON IS PHYSICAL.
    //
    // The ground is estimated from the frame's border ring. A sample that
    // TOUCHES that border therefore contributes pixels to the estimate of the
    // thing it is being separated from, so its bounding box is uncertain by a
    // pixel or two at the 240px analysis width — which is 4-8px once mapped
    // back to a 400px tile. Measured: a square at the frame's corner lands at
    // 331 against 336, centred within 1px.
    //
    // That is 1.25% of the tile and nobody sees it. What the gate is for is
    // the failure that WAS reported — tiles at visibly different scales and
    // positions, tens of pixels apart — and 2% still catches that with room
    // to spare. A zero tolerance here would only ever fail on physics.
    if (Math.abs(v.longest - want) > want * 0.02) {
      notes.push("scale " + v.longest + ", want " + want + " +/-2%");
    }
    if (Math.abs(v.cx - TILE / 2) > 3 || Math.abs(v.cy - TILE / 2) > 3) {
      notes.push("off centre at " + v.cx + "," + v.cy);
    }
    if (Math.abs(v.padL - v.padR) > 6 || Math.abs(v.padT - v.padB) > 6) {
      notes.push("asymmetric padding " + [v.padL, v.padR, v.padT, v.padB].join("/"));
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
