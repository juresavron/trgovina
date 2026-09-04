/**
 * ONE VOCABULARY FOR THE ADMIN PANEL.
 *
 * Ported from the chassis repo's adminSystem/adminGeometry pair. Their problem
 * was Tailwind: 19 focus-ring treatments, 11 hover tints, 12 icon sizes, and
 * two rhythm tokens with zero importers repo-wide. This panel has one
 * stylesheet instead of utility classes, so it never drifted that far — but it
 * drifted the same WAY, and measured before this file was written:
 *
 *   9 x  #fff       where design.ts already declares --card
 *   2 x  #6f6f6f    a grey that is not a token at all — two points off --mute
 *                   (#6d6d6d), so nobody chose it and nobody checked it
 *
 * That second one is the whole argument. design.ts opens by explaining that
 * its greys carry computed contrast ratios, and that --ink-mute clears the
 * 4.5:1 AA floor the European Accessibility Act makes a legal requirement
 * here. A colour typed straight into a panel's <style> block has no ratio
 * because nobody computed one. Inventing a fresh grey is inventing a fresh
 * ratio, and #6f6f6f is what that looks like: not a decision, a typo that
 * rendered.
 *
 * ⚠️ THE PATTERN MATCHES THE VARIANTS, which is the lesson their file records
 * paying for: a ban on `#fff` that misses `#FFF` and `#ffffff` is a ban with a
 * hole in it, and the hole is where the next one lands.
 */
import { readFileSync, readdirSync } from "node:fs";

/** Where the vocabulary is DECLARED. The one file allowed to write values. */
const SOURCE = "src/admin/design.ts";

/** Files that EMIT admin markup, and must therefore only reference it. */
function governed() {
  const out = [];
  for (const f of readdirSync("src/admin")) {
    if (f.endsWith(".ts") && !f.endsWith(".test.ts") && f !== "design.ts") {
      out.push("src/admin/" + f);
    }
  }
  for (const f of readdirSync("src/admin/surfaces")) {
    if (f.endsWith(".ts") && !f.endsWith(".test.ts")) out.push("src/admin/surfaces/" + f);
  }
  return out;
}

/**
 * Exemptions, each with an argument. Not debt — a decision.
 */
const EXEMPT = new Map([
  [
    "src/admin/client.ts",
    "browser scripts, not markup: the colours in them are canvas pixel maths " +
      "and a WebP quality probe, not the panel's surfaces",
  ],
  [
    "src/admin/media.ts",
    "serves bytes, emits no HTML — the one hex in it is a 1x1 PNG's payload",
  ],
]);

/** Strip comments without shifting line numbers, so a hit reports its own line. */
function strip(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + m.slice(p.length).replace(/./g, " "));
}

const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

const failures = [];
for (const file of governed()) {
  if (EXEMPT.has(file)) continue;
  const lines = strip(readFileSync(file, "utf8")).split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(HEX)) {
      failures.push(file + ":" + (i + 1) + "  " + m[0]);
    }
  });
}

/** The tokens must be load-bearing, not transcribed. */
const source = readFileSync(SOURCE, "utf8");
const declared = [...source.matchAll(/^\s*(--[a-z-]+):/gm)].map((m) => m[1]);
if (declared.length === 0) {
  console.error("FAIL: " + SOURCE + " declares no custom properties — the source moved?");
  process.exit(1);
}

if (failures.length > 0) {
  console.error(
    "The admin panel writes " + failures.length + " colour(s) that design.ts " +
      "should own:\n" + failures.map((f) => "    " + f).join("\n") +
      "\n\n" + declared.length + " tokens are declared in " + SOURCE +
      " — use one, or add one there with the contrast ratio you checked.\n" +
      "If a file genuinely emits no panel markup, exempt it by name with a reason.",
  );
  process.exit(1);
}

console.log(
  "the admin speaks one vocabulary: " + declared.length + " tokens in design.ts, " +
    "no raw colours across " + governed().length + " files.",
);
