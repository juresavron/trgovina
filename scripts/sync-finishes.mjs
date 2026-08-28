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

const OUT = path.join("src", "catalog", "finishes.generated.ts");
const SHOP = process.env.SYNC_SHOP ?? "bazen";

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error(
    "sync-finishes: SUPABASE_URL and SUPABASE_ANON_KEY are not set — leaving " +
      OUT + " as it is.",
  );
  process.exit(0);
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
