#!/usr/bin/env node
/**
 * Compose a shop's HERO PLATE from its own product photography.
 *
 * The hero is the largest thing on the landing page and the first thing a
 * visitor reads the shop by. Until now bazen's was a room from the source
 * theme's furniture bundle — a sideboard, a vase and a houseplant, on a shop
 * that sells massage pools. Labelled "simbolična fotografija", so it was not
 * a lie, but it was still a furniture catalogue's photograph doing the job of
 * a hot tub's.
 *
 * The supplier's photography is studio cutouts on white, 600x600. Neither
 * form works full-bleed: a white ground puts a white band exactly where the
 * nav's white type lands, and 600px stretched across a 1920px hero is a 3.2x
 * enlargement my own build scripts refuse elsewhere for good reason. So the
 * plate is COMPOSED rather than cropped — which is what hero.ts has said in
 * a comment since the full-bleed hero landed: "when photography exists it
 * goes back in as a cutout, which is the only form that works in this
 * position."
 *
 *   node scripts/build-hero-plate.mjs <shop> <source-image> [tint]
 *
 * A SCENE photograph — the product photographed where it is actually
 * installed, rather than on a studio sweep — needs none of that. It is
 * already a hero: it has its own ground, its own light and its own depth, and
 * keying a garden out from behind a hot tub would be vandalism. For those:
 *
 *   node scripts/build-hero-plate.mjs <shop> <source-image> --scene
 *
 * which skips the composition entirely and only ladders the file at its own
 * aspect ratio, leaving the cropping to object-fit where it belongs.
 *
 * Output is committed, so this runs when photography changes, not per build.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [shop, src, tintArg] = process.argv.slice(2);
if (!shop || !src || !fs.existsSync(src)) {
  console.error("usage: node scripts/build-hero-plate.mjs <shop> <source-image> [tint|--scene]");
  process.exit(1);
}
/** A scene is already a hero: ladder it, do not compose over it. */
const SCENE = tintArg === "--scene";

/** Plate geometry. 2000x1100 is close to a desktop hero's 16:10, so `cover`
 *  trims the sides by ~5% rather than a third of the picture. */
const W = 2000;
const H = 1100;
/** The rungs the hero actually paints, matching the theme's own scene ladder. */
const LADDER = [640, 960, 1280, 1600, 2000];
const TINT = SCENE ? "#2fd4e8" : tintArg || "#2fd4e8";

/**
 * Key the studio white out of a product shot.
 *
 * The background is the near-white region CONNECTED TO THE FRAME EDGE, found
 * by a flood fill from the border. A plain luminance threshold is the obvious
 * approach and the wrong one: the white acrylic shell is the brightest thing
 * in the picture, so a threshold that removes the background also punches
 * holes through the product. Connectivity is what separates them.
 *
 * The mask has to be carried in the ALPHA channel, not as a greyscale image:
 * `dest-in` composites against alpha, and a greyscale PNG is fully opaque, so
 * a mask handed over that way silently keeps the entire frame.
 */
async function cutout(file) {
  const { width: w, height: h } = await sharp(file).metadata();
  const raw = await sharp(file).removeAlpha().raw().toBuffer();

  const white = (p) => {
    const r = raw[p * 3], g = raw[p * 3 + 1], b = raw[p * 3 + 2];
    const mn = Math.min(r, g, b);
    return mn > 226 && Math.max(r, g, b) - mn < 18;
  };

  const bg = new Uint8Array(w * h);
  const q = [];
  for (let x = 0; x < w; x++) q.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) q.push(y * w, y * w + w - 1);
  while (q.length) {
    const p = q.pop();
    if (bg[p] || !white(p)) continue;
    bg[p] = 1;
    const x = p % w, y = (p - x) / w;
    if (x > 0) q.push(p - 1);
    if (x < w - 1) q.push(p + 1);
    if (y > 0) q.push(p - w);
    if (y < h - 1) q.push(p + w);
  }

  let kept = 0;
  const rgba = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    if (!bg[p]) { rgba[p * 4 + 3] = 255; kept++; }
  }
  if (kept / (w * h) > 0.92) {
    console.error("nothing was keyed out — is " + file + " actually on white?");
    process.exit(1);
  }
  // A hair of blur on the mask, so the edge is not a staircase against the
  // dark ground. More than this and the LED strips start to smear.
  const mask = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .blur(0.7).png().toBuffer();

  return sharp(file).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

let PW = W;
let PH = H;
let plate;

if (SCENE) {
  // Keep the photograph's own aspect. Forcing it into the plate box would
  // crop at build time, permanently and at one ratio; object-fit crops per
  // viewport and can be steered with object-position.
  const meta = await sharp(src).metadata();
  PW = meta.width;
  PH = meta.height;
  plate = await sharp(src).png().toBuffer();
  if (PW < 2000) {
    console.error(
      "warning: " + PW + "px wide. A full-viewport hero paints ~1920 CSS px, " +
      "and 2x displays ask for more — this will ladder honestly but the top " +
      "rung is the source, so it will look soft on a large screen.",
    );
  }
} else {
  plate = await composePlate();
}

async function composePlate() {
const cut = await cutout(src);
// Trim the transparent margin, so placement is about the TUB and not about
// however much white the photographer left around it.
const subject = await sharp(cut).trim({ threshold: 1 }).toBuffer();
const sm = await sharp(subject).metadata();

/** Painted width. 1120 from a ~590px subject is a 1.9x enlargement, which a
 *  glossy low-detail object carries and a detailed one would not. */
const TW = 1120;
const TH = Math.round((sm.height / sm.width) * TW);
const LEFT = Math.round(W * 0.415);
const TOP = H - TH - 150;

const scaled = await sharp(subject).resize({ width: TW, kernel: "lanczos3" }).toBuffer();

/**
 * The ground. Two things stop the cutout reading as a paste-up: a wash of the
 * product's own LED colour behind it, and a contact shadow under it. Both are
 * cheap and both are the difference between "photographed in a dark room" and
 * "pasted on black".
 *
 * It is dark on purpose. The hero carries five runs of white type, every one
 * of them gated at 4.5:1 by scripts/verify-hero-contrast.mjs, and a dark
 * ground is how they clear it without a veil heavy enough to hide the
 * photograph.
 */
const ground = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
  "<defs>" +
  '<radialGradient id="g" cx="0.5" cy="0.42" r="0.9">' +
  '<stop offset="0" stop-color="#16242f"/><stop offset="1" stop-color="#060a0e"/></radialGradient>' +
  '<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">' +
  '<stop offset="0" stop-color="' + TINT + '" stop-opacity=".38"/>' +
  '<stop offset="1" stop-color="' + TINT + '" stop-opacity="0"/></radialGradient>' +
  '<radialGradient id="sh" cx="0.5" cy="0.5" r="0.5">' +
  '<stop offset="0" stop-color="#000" stop-opacity=".72"/>' +
  '<stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
  "</defs>" +
  '<rect width="100%" height="100%" fill="url(#g)"/>' +
  '<ellipse cx="' + (LEFT + TW / 2) + '" cy="' + (TOP + TH * 0.6) + '" rx="' + Math.round(TW * 0.74) +
  '" ry="' + Math.round(TH * 0.8) + '" fill="url(#glow)"/>' +
  '<ellipse cx="' + (LEFT + TW / 2) + '" cy="' + (TOP + TH - 4) + '" rx="' + Math.round(TW * 0.42) +
  '" ry="46" fill="url(#sh)"/>' +
  "</svg>");

return await sharp(ground)
  .composite([{ input: scaled, left: LEFT, top: TOP }])
  .png()
  .toBuffer();
}

// --- the ladder ------------------------------------------------------------
const OUT = path.join(process.cwd(), "public", "img", "own");
fs.mkdirSync(OUT, { recursive: true });
const stem = shop + "-hero";
const written = [];
let bytes = 0;

// Never upscale: a rung wider than the plate is the same pixels in a bigger
// file, and its `w` descriptor is a lie the browser acts on.
const rungs = LADDER.filter((w) => w < PW).concat(PW);
for (const w of rungs) {
  const file = w === PW ? stem + ".webp" : stem + "-" + w + ".webp";
  await sharp(plate).resize({ width: w, kernel: "lanczos3" }).webp({ quality: 82 })
    .toFile(path.join(OUT, file));
  bytes += fs.statSync(path.join(OUT, file)).size;
  written.push(["own/" + file, w]);
}

// --- the generated module --------------------------------------------------
const MODULE = path.join(process.cwd(), "src", "themes", "studio", "own-hero.ts");

let existing = {};
if (fs.existsSync(MODULE)) {
  const prev = fs.readFileSync(MODULE, "utf8");
  const a = prev.indexOf("= {");
  const b = prev.lastIndexOf("};");
  if (a > 0 && b > a) {
    try { existing = eval("(" + prev.slice(a + 2, b + 1) + ")"); } catch { existing = {}; }
  }
}

existing[shop] = {
  src: "/img/own/" + stem + ".webp",
  w: PW,
  h: PH,
  widths: written.map((r) => ["/img/" + r[0], r[1]]),
};

const body = Object.keys(existing).sort().map((k) => {
  const e = existing[k];
  return (
    "  " + k + ": {\n" +
    '    src: "' + e.src + '",\n' +
    "    w: " + e.w + ",\n" +
    "    h: " + e.h + ",\n" +
    "    widths: [" + e.widths.map((r) => '["' + r[0] + '", ' + r[1] + "]").join(", ") + "],\n" +
    "  },"
  );
}).join("\n");

fs.writeFileSync(MODULE, [
  "/**",
  " * GENERATED by scripts/build-hero-plate.mjs — do not edit.",
  " *",
  " * A shop's own hero plate: its product photography composed onto a dark",
  " * ground, at the widths the build actually wrote. Lives under /img/own/,",
  ' * which is the path isPlaceholderMedia does not flag, so the hero showing',
  ' * one drops "simbolična fotografija" and stops blocking the launch gate.',
  " */",
  "",
  "export interface HeroPlate {",
  "  readonly src: string;",
  "  readonly w: number;",
  "  readonly h: number;",
  "  /** [file, intrinsic width] rungs, narrowest first. */",
  "  readonly widths: readonly (readonly [string, number])[];",
  "}",
  "",
  "export const OWN_HERO: Readonly<Partial<Record<string, HeroPlate>>> = {",
  body,
  "};",
  "",
].join("\n"));

console.log(
  shop + (SCENE ? " hero SCENE from " : " hero plate from ") + path.basename(src) + "  " +
  PW + "x" + PH + "  " + rungs.length + " rungs  " + (bytes / 1024).toFixed(0) + " KB total",
);
