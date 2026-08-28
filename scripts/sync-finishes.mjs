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
 * ⚠️ THE PUBLISHABLE KEY IS ENOUGH, exactly as it is for sync-reviews. The
 * finishes_public_read policy lets an anonymous reader see the list, and it
 * holds nothing that is not printed on the public product pages anyway. The
 * alternative was the service key in CI — which bypasses every policy in the
 * database, orders and customers included — to read a list of colour names.
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
