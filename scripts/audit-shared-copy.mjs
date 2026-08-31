#!/usr/bin/env node
/**
 * A RATCHET ON ONE SHOP'S VOCABULARY INSIDE SHARED RENDER CODE.
 *
 * ⚠️ THE NUMBER BELOW IS A DEBT, NOT A BUDGET. A second shop was added for
 * real and rendered, and its pages carried the first shop's words: hundreds of
 * user-visible strings live in modules every shop renders through. The sauna
 * shop's footer said "Kateri bazen?", its /izbira asked "Kaj naj bazen zna?"
 * and recommended a hot tub it does not sell, and its statutory withdrawal
 * notice explained that goods cannot be posted because a masažni bazen weighs
 * 300–410 kg.
 *
 * Moving all of it at once is weeks of work and would be speculative today,
 * with one shop live and unlaunched. What is NOT speculative is that the
 * number must never grow: every new sentence typed into a theme module is one
 * more page a second shop gets wrong, and the reason the debt accumulated is
 * that nothing counted it.
 *
 * WHEN THIS FAILS BECAUSE YOU ADDED A STRING: do not raise the number. Put the
 * sentence on ShopContent, which is where the four moved in this change went —
 * homeTitleTail, membershipBody, blogLead/blogMetaDescription, swatchMessage.
 * No user-visible sentence is too short to belong to a shop.
 *
 * WHEN IT FAILS BECAUSE YOU MOVED ONE OUT: lower the number and say by how
 * much in the commit.
 *
 * ⚠️ IT LIVES IN scripts/ AND NOT IN A .test.ts, and the reason is worth
 * keeping: tsconfig.json declares lib ["ES2022","WebWorker"] with no node
 * types, deliberately, so that Worker source cannot reach for a filesystem
 * API. A test that reads files would have forced @types/node into that
 * config and quietly widened what the Worker is allowed to import. The deploy
 * runs this as its own step instead.
 *
 *   node scripts/audit-shared-copy.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Modules every shop renders through — where this vocabulary must not live. */
const ROOTS = ["src/themes", "src/render", "src/enquiry", "src/blog"];
const EXTRA = ["src/worker.ts"];

/**
 * Generated modules are exempt, and only these. own-media.ts alone holds 103
 * matches — image alt text the media pipeline writes from the shop's own
 * photographs, regenerated per shop rather than typed. Counting it would
 * swamp the signal from the hand-written strings that are the real problem,
 * and lowering it is a job for the generator.
 */
const GENERATED = /(own-media|own-hero|\.generated)\.ts$/;

/**
 * Words that belong to THIS shop's product and to no other. A sauna shop
 * inheriting any of them is rendering a sentence about a hot tub.
 */
const VOCAB =
  /bazen|bazeni|bazenu|bazenom|bazenov|školjk|šob|ležalnik|swim spa|masažn|protitočn|vzorčnik/i;

/** ⚠️ THIS ONLY EVER GOES DOWN. See the note at the top of the file. */
const BUDGET = 69;

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".ts") && !p.endsWith(".test.ts") && !GENERATED.test(p)) out.push(p);
  }
  return out;
}

const files = [...EXTRA, ...ROOTS.flatMap((r) => walk(r, []))];
const per = [];
let total = 0;
for (const p of files) {
  const src = readFileSync(p, "utf8");
  // String literals only. A COMMENT naming the product is documentation —
  // often the note explaining why a string was moved out — and counting it
  // would punish exactly the change this gate exists to encourage.
  const literals = src.match(/"(?:[^"\\\n]|\\.)*"/g) ?? [];
  const n = literals.filter((l) => VOCAB.test(l)).length;
  if (n > 0) {
    per.push([p, n]);
    total += n;
  }
}
per.sort((a, b) => b[1] - a[1]);

if (total > BUDGET) {
  console.error(
    "One shop's product vocabulary in code every shop renders through: " +
      total + ", over the standing " + BUDGET + ".\n",
  );
  for (const [p, n] of per) console.error("  " + String(n).padStart(4) + "  " + p);
  console.error(
    "\nMove the sentence to ShopContent rather than raising the number.",
  );
  process.exit(1);
}
console.log(
  total + " of one shop's words remain in shared render code, at or under the " +
    "standing " + BUDGET + ". Top holders:",
);
for (const [p, n] of per.slice(0, 5)) console.log("  " + String(n).padStart(4) + "  " + p);
