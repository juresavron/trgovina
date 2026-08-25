#!/usr/bin/env node
/**
 * Optimise the theme's reference imagery into public/img.
 *
 * The source assets are full-resolution Framer exports (7.4 MB across 41
 * files, one of them a 2761x3905 JPEG). Serving those as-is would undo the
 * entire performance argument this project rests on, so they are resized to
 * the largest size any slot actually paints and re-encoded to WebP.
 *
 * Each source also gets a LADDER of widths, because a single file cannot
 * serve every slot it lands in. A room interior is painted at 437 CSS px in a
 * guide card, 420 in the social strip and 660 in the story band; shipping the
 * 1600px master to all three sent ~100 KB where 13 KB would do, on a page
 * that carries eight of them. The widths written here are the ones
 * media.ts's srcset offers, so the two must be generated together — hence
 * src/themes/studio/media-widths.ts, which this script writes.
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

/**
 * `widths` is the ladder, narrowest first; the last entry is the master and
 * keeps the bare `role-NN.webp` name so it stays the srcset fallback and any
 * existing reference to it still resolves. The rungs are chosen from the CSS
 * widths the theme's slots actually paint, doubled for 2x screens — not from
 * a generic 320/640/960 ladder, which would spend bytes on sizes nothing
 * requests.
 */
const PLAN = {
  motif: { quality: 70, widths: [600, 900] },
  // The extra 1600 rung exists because scenes are the only full-bleed role:
  // a 1440px window at 1x needs 1440, and without it the browser has to
  // climb to the 1920 master and pay 88 KB for 62 KB of pixels.
  scene: { quality: 76, widths: [640, 960, 1280, 1600, 1920] },
  room: { quality: 76, widths: [480, 800, 1200, 1600] },
  tile: { quality: 78, widths: [400, 800] },
  portrait: { quality: 78, widths: [400, 640, 900] },
  cutout: { quality: 82, alpha: true, widths: [450, 900] },
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
/** filename -> the widths actually written, for media-widths.ts. */
const ladders = {};
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
  const stem = role + "-" + String(counters[role]).padStart(2, "0");
  const name = stem + ".webp";
  const master = plan.widths[plan.widths.length - 1];

  // Never upscale: a rung wider than the source would be the same pixels in a
  // bigger file, and its `w` descriptor would be a lie the browser then acts
  // on. So the master is capped at the source width, and any rung at or above
  // that cap collapses into it.
  //
  // The master is written FIRST and unconditionally. An earlier version walked
  // the ladder in order and only used the bare name when the rung equalled the
  // plan's top width — so every source narrower than its top rung (fourteen of
  // them: the cutouts, two small room crops) never got a `role-NN.webp` at all,
  // and the file media.ts names simply stopped existing.
  const encode = async (width, file) => {
    const info = await sharp(src)
      .resize({ width, withoutEnlargement: true })
      // Alpha must survive: a cutout flattened onto white stops being a cutout.
      .webp({ quality: plan.quality, alphaQuality: alpha ? 90 : 100 })
      .toFile(path.join(OUT, file));
    after += fs.statSync(path.join(OUT, file)).size;
    return { width: info.width, file };
  };

  const cap = Math.min(master, meta.width);
  const written = [await encode(cap, name)];
  for (const want of plan.widths) {
    if (want >= cap) continue;
    written.push(await encode(want, stem + "-" + want + ".webp"));
  }

  before += fs.statSync(src).size;
  (manifest[role] = manifest[role] || []).push(name);
  ladders[name] = written.sort((a, b) => a.width - b.width);
}

const kb = (n) => (n / 1024).toFixed(0) + " KB";
console.log("roles: " + JSON.stringify(counters));
console.log(files.length + " files  " + kb(before) + "  ->  " + kb(after) +
  "  (" + Math.round((1 - after / before) * 100) + "% smaller)");
console.log("largest single file: " +
  kb(Math.max(...fs.readdirSync(OUT).map((f) => fs.statSync(path.join(OUT, f)).size))));

fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("wrote public/img/manifest.json");

const WIDTHS_TS = path.join(process.cwd(), "src", "themes", "studio", "media-widths.ts");
const entries = Object.keys(ladders)
  .sort()
  .map((name) => {
    const rungs = ladders[name].map((r) => '["' + r.file + '", ' + r.width + "]").join(", ");
    return '  "' + name + '": [' + rungs + "],";
  })
  .join("\n");

fs.writeFileSync(
  WIDTHS_TS,
  [
    "/**",
    " * GENERATED by scripts/build-media.mjs — do not edit.",
    " *",
    " * Every width actually written under public/img, keyed by the master file",
    " * media.ts names. decorativeImg turns these into a real srcset.",
    " *",
    " * It is generated rather than hand-kept because a srcset that offers a",
    " * width the build did not write is a 404 the browser picks on purpose, and",
    " * a `w` descriptor that does not match the file's real width makes every",
    " * selection after it wrong. Both are silent.",
    " */",
    "",
    "/** [file, intrinsic width] rungs, narrowest first. */",
    "export type Rung = readonly [file: string, width: number];",
    "",
    "export const MEDIA_WIDTHS: Readonly<Record<string, readonly Rung[]>> = {",
    entries,
    "};",
    "",
  ].join("\n"),
);
console.log("wrote src/themes/studio/media-widths.ts (" + Object.keys(ladders).length + " ladders)");
