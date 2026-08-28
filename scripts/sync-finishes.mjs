#!/usr/bin/env node
/**
 * Rebuild src/catalog/finishes.generated.ts from Supabase.
 *
 * The colour list is BAKED IN rather than read at request time, for the same
 * reason reviews are: the configurator renders on all six product pages,
 * which `handleRequest` serves synchronously and without env. Reading a list
 * per request would make the whole storefront async to save a deploy.
 *
 *   node scripts/sync-finishes.mjs
 *
 * ⚠️ THE PUBLISHABLE KEY IS ENOUGH — ONCE THE READ PATH EXISTS. This comment
 * used to state, in the present tense, that a finishes_public_read policy let
 * an anonymous reader see the list. No such policy was ever written: the
 * table was created after db/schema.sql was applied and never got the anon
 * policy and column grant that products, product_media and reviews have. So
 * this file described a database that did not exist, and the failure it
 * caused is silent by construction — an RLS-filtered read returns 200 with an
 * empty array, so the generator wrote an empty list and the deploy went green
 * while the product pages fell back to the transcribed chart.
 *
 * db/migrations/001_finishes_public_read.sql is the missing half. Until it is
 * applied, the guard below refuses to blank the list.
 *
 * The key itself is still the right choice: the alternative was the service
 * key in CI — which bypasses every policy in the database, orders and
 * customers included — to read a list of colour names.
 *
 * ⚠️ AND IT FAILS SOFT. A missing key or an unreachable database leaves the
 * committed file alone rather than emptying it. Emptying it would not blank
 * the product pages — catalog/pola.ts falls back to the transcribed chart —
 * but it would silently swap the shop's real swatches for a list of names it
 * cannot show, which is the wrong way to lose a build.
 */

import fs from "node:fs";
import path from "node:path";
import { supabaseConfig } from "./wrangler-vars.mjs";

const OUT = path.join("src", "catalog", "finishes.generated.ts");
const SHOP = process.env.SYNC_SHOP ?? "bazen";

// ⚠️ THE ENVIRONMENT FIRST, wrangler.jsonc SECOND — and the second half is
// the whole point. This script read only the environment, and the deploy
// workflow sets neither variable, so in CI it took the branch below on every
// single run: exit 0, one line on stderr, a green build, and a generated file
// that had never once been rebuilt from the database. See
// scripts/wrangler-vars.mjs.
const { url, key } = supabaseConfig();

if (!url || !key) {
  // ⚠️ NON-ZERO, UNLIKE EVERY OTHER FAILURE IN THIS SCRIPT, because this one
  // cannot fix itself. An unreachable database is weather: the next deploy
  // may well succeed, so it exits 0 and ships the committed file. Missing
  // configuration is a broken build that will go on silently shipping stale
  // data forever, which is exactly what happened here. The deploy step keeps
  // continue-on-error so an outage still cannot block a release — but this
  // one turns the step red, which is the whole point.
  console.error(
    "sync-finishes: no SUPABASE_URL/SUPABASE_ANON_KEY in the environment or in " +
      "wrangler.jsonc — leaving " + OUT + " as it is. THIS IS A BROKEN BUILD, " +
      "not a transient failure: nothing will rebuild this file until it is fixed.",
  );
  process.exit(1);
}

const q =
  url.replace(/\/+$/, "") +
  "/rest/v1/finishes?select=kind,name,slug,position&shop_id=eq." +
  encodeURIComponent(SHOP) +
  "&order=kind.asc,position.asc,name.asc";

let rows;
try {
  const res = await fetch(q, { headers: { apikey: key, authorization: "Bearer " + key } });
  if (!res.ok) throw new Error("HTTP " + res.status + " " + (await res.text()).slice(0, 200));
  rows = await res.json();
} catch (err) {
  console.error("sync-finishes: could not read finishes — leaving " + OUT + " as it is.");
  console.error("  " + (err && err.message ? err.message : err));
  process.exit(0);
}

if (!Array.isArray(rows)) {
  console.error("sync-finishes: unexpected response — leaving " + OUT + " as it is.");
  process.exit(0);
}

// ⚠️ ZERO ROWS DOES NOT MEAN ZERO COLOURS. It usually means the reader
// could not see them.
//
// PostgREST answers a request that RLS filters to nothing with 200 and an
// EMPTY ARRAY — byte for byte what a genuinely empty table returns. This
// script used to write that straight out, so a missing read policy silently
// replaced the shop\'s real data with the built-in fallback and the deploy
// went green. That is exactly how six uploaded colour swatches sat in the
// database while every product page showed the transcribed supplier chart.
//
// An empty result therefore leaves the committed file ALONE and turns the
// step red. Emptying the list deliberately — the shop really did delete
// everything — is still possible, but it has to be said out loud:
//
//   SYNC_ALLOW_EMPTY=1 node scripts/sync-finishes.mjs
if (rows.length === 0 && process.env.SYNC_ALLOW_EMPTY !== "1") {
  console.error(
    "sync-finishes: the query succeeded and returned NOTHING, so " + OUT +
      " is left as it is.",
  );
  console.error(
    "  Either this shop genuinely has no rows, or — far more likely — the " +
      "publishable key cannot read the table. An RLS-filtered read returns " +
      "an empty array with a 200, which is indistinguishable from an empty " +
      "table, so this refuses to guess and blank the list.",
  );
  console.error("  Check the anon select policy and column grant. To empty it on purpose: SYNC_ALLOW_EMPTY=1.");
  process.exit(1);
}

/** Slovenian-safe TS string literal. */
const lit = (s) => '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';

const pick = (kind) =>
  rows
    .filter((r) => r.kind === kind && typeof r.name === "string" && typeof r.slug === "string")
    .map((r) => "  { name: " + lit(r.name) + ", slug: " + lit(r.slug) + " },")
    .join("\n");

const shell = pick("barva");
const cabinet = pick("obloga");

const head = fs.readFileSync(OUT, "utf8").split("/** Shell colours")[0];

fs.writeFileSync(
  OUT,
  head +
    "/** Shell colours, in the order the panel puts them. */\n" +
    "export const GENERATED_SHELL_FINISHES: readonly GeneratedFinish[] = [" +
    (shell ? "\n" + shell + "\n" : "") +
    "];\n\n" +
    "/** Cabinet colours, in the order the panel puts them. */\n" +
    "export const GENERATED_CABINET_FINISHES: readonly GeneratedFinish[] = [" +
    (cabinet ? "\n" + cabinet + "\n" : "") +
    "];\n",
  "utf8",
);

const n = (s) => (s ? s.split("\n").length : 0);
console.log(
  "sync-finishes: " + n(shell) + " shell, " + n(cabinet) + " cabinet colour(s) → " + OUT +
    (n(shell) + n(cabinet) === 0
      ? "  (empty — the product pages fall back to the transcribed chart)"
      : ""),
);
