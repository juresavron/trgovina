#!/usr/bin/env node
/**
 * Optimise the theme's reference imagery into public/img.
 *
 * The source assets are full-resolution Framer exports (7.4 MB across 41
 * files, one of them a 2761x3905 JPEG). Serving those as-is would undo the
 * entire performance argument this project rests on, so they are resized to
 * the largest size any slot actually paints and re-encoded to WebP.
 *
 * Run: node scripts/build-media.mjs <source-dir>
 * Output is committed, so this runs when the imagery changes, not per build.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
const OUT = path.join(process.cwd(), "public", "img");

if (!SRC || !fs.existsSync(SRC)) {
  console.error("usage: node scripts/build-media.mjs <source-dir>");
  process.exit(1);
}

/**
 * Roles, by the shape the source file happens to be. The theme's slots differ
 * in what they need, and an image cropped for the wrong one looks worse than
 * no image: a 1.92 banner squeezed into a portrait card loses its subject.
 *
 *   motif    the eye graphic — the band watermark, one file
 *   scene    2.88k x 1.5k wide banners
 *   room     ~4:3 interiors
 *   tile     2000² squares — the social strip
 *   portrait tall crops — testimonial photography
 *   cutout   alpha PNGs — products on transparency
 */
const MOTIF = "FRFs7mINsPmgtFpVlOfsdVhU2g";

const PLAN = {
  motif: { width: 900, quality: 70 },
  scene: { width: 1920, quality: 76 },
  room: { width: 1600, quality: 76 },
  tile: { width: 800, quality: 78 },
  portrait: { width: 900, quality: 78 },
  cutout: { width: 900, quality: 82, alpha: true },
};

function roleOf(name, w, h, alpha) {
  if (name.startsWith(MOTIF)) return "motif";
  if (alpha) return "cutout";
  const ar = w / h;
  if (ar > 1.7) return "scene";
  if (ar > 1.15) return "room";
  if (ar > 0.95) return "tile";
  return "portrait";
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));

const counters = {};
const manifest = {};
let before = 0;
let after = 0;

const files = fs.readdirSync(SRC).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();

for (const f of files) {
  const src = path.join(SRC, f);
  const meta = await sharp(src).metadata();
  const alpha = !!meta.hasAlpha;
  const role = roleOf(f, meta.width, meta.height, alpha);
  const plan = PLAN[role];

  counters[role] = (counters[role] || 0) + 1;
  const name = role + "-" + String(counters[role]).padStart(2, "0") + ".webp";

  const img = sharp(src).resize({
    width: Math.min(plan.width, meta.width),
    withoutEnlargement: true,
  });
  // Alpha must survive: a cutout flattened onto white stops being a cutout.
  await img.webp({ quality: plan.quality, alphaQuality: alpha ? 90 : 100 }).toFile(path.join(OUT, name));

  before += fs.statSync(src).size;
  after += fs.statSync(path.join(OUT, name)).size;
  (manifest[role] = manifest[role] || []).push(name);
}

const kb = (n) => (n / 1024).toFixed(0) + " KB";
console.log("roles: " + JSON.stringify(counters));
console.log(files.length + " files  " + kb(before) + "  ->  " + kb(after) +
  "  (" + Math.round((1 - after / before) * 100) + "% smaller)");
console.log("largest single file: " +
  kb(Math.max(...fs.readdirSync(OUT).map((f) => fs.statSync(path.join(OUT, f)).size))));

fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("wrote public/img/manifest.json");
