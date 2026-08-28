#!/usr/bin/env node
/**
 * Rebuild src/content/reviews.generated.ts from Supabase.
 *
 * Reviews are the one piece of customer-facing content that is BAKED IN rather
 * than read at request time, and reviews.generated.ts explains why at length:
 * the testimonial band renders on the home page and on all six product pages,
 * which `handleRequest` serves synchronously — and a review is a claim under
 * Annex I 23b/23c of the Unfair Commercial Practices Directive, so having the
 * launch gate and the tests see the real ones before a deploy goes out is
 * worth more than publishing them a few minutes sooner.
 *
 *   node scripts/sync-reviews.mjs
 *
 * ⚠️ THE PUBLISHABLE KEY IS ENOUGH, deliberately, exactly as it is for
 * sync-media.mjs. The reviews_prelive_read policy lets an anonymous reader see
 * PUBLISHED reviews and anon's column grant is narrowed to what the storefront
 * renders — no order id, no product id, and no order NUMBER, because the
 * evidence behind a verified tick belongs in the back office and not in a
 * build artefact. The alternative was the service key in CI, which bypasses
 * every policy in the database including orders and customers, to read a list
 * of quotes.
 *
 * ⚠️ AND IT FAILS SOFT. A missing key or an unreachable database leaves the
 * committed file alone rather than emptying it: a build that cannot reach
 * Supabase must not silently delete every testimonial on the site. The deploy
 * step runs this with continue-on-error for the same reason.
 */

import fs from "node:fs";
import path from "node:path";
import { supabaseConfig } from "./wrangler-vars.mjs";

const OUT = path.join("src", "content", "reviews.generated.ts");
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
    "sync-reviews: no SUPABASE_URL/SUPABASE_ANON_KEY in the environment or in " +
      "wrangler.jsonc — leaving " + OUT + " as it is. THIS IS A BROKEN BUILD, " +
      "not a transient failure: nothing will rebuild this file until it is fixed.",
  );
  process.exit(1);
}

/**
 * Published reviews, oldest first.
 *
 * Oldest first because the band is a slider and the order is the reading
 * order; a shop's first review should not be buried by its newest. The
 * product slug comes through the embed rather than a second request.
 */
const query =
  "select=id,author_name,author_role,rating,body,verified,created_at,products(slug)" +
  "&shop_id=eq." + encodeURIComponent(SHOP) +
  "&published=is.true" +
  "&order=created_at.asc" +
  "&limit=200";

const res = await fetch(url + "/rest/v1/reviews?" + query, {
  headers: { apikey: key, authorization: "Bearer " + key },
});

if (!res.ok) {
  console.error(
    "sync-reviews: Supabase answered " + res.status + " — leaving " + OUT +
      " as it is.\n" + (await res.text()).slice(0, 300),
  );
  process.exit(0);
}

const rows = await res.json();

// ⚠️ ZERO ROWS DOES NOT MEAN ZERO REVIEWS. It can equally mean the reader
// could not see them, and this script cannot tell the two apart.
//
// PostgREST answers a request that RLS filters to nothing with 200 and an
// EMPTY ARRAY — byte for byte what a genuinely empty table returns. Written
// straight out, that silently replaces the shop's real data with the built-in
// fallback while the deploy goes green, and every visible signal says it
// worked.
//
// // The stakes are higher here than for a colour: a review is an Annex I claim
// under ZVPot-1, and silently dropping the four the owner actually collected
// leaves the storefront making no claim where it should make one.
//
// So an empty result leaves the committed file ALONE and turns the step red.
// Emptying it on purpose still works, but has to be said out loud:
//
//   SYNC_ALLOW_EMPTY=1 node scripts/sync-reviews.mjs
if (!Array.isArray(rows) || (rows.length === 0 && process.env.SYNC_ALLOW_EMPTY !== "1")) {
  console.error(
    "sync-reviews: the query succeeded and returned NOTHING, so " + OUT +
      " is left as it is.",
  );
  console.error(
    "  Either this shop genuinely has no published reviews, or — far more " +
      "likely — the publishable key cannot read the table. An RLS-filtered " +
      "read returns an empty array with a 200, which is indistinguishable " +
      "from an empty table, so this refuses to guess and blank the list.",
  );
  console.error("  Check the anon select policy and column grant. To empty it on purpose: SYNC_ALLOW_EMPTY=1.");
  process.exit(1);
}

/**
 * The model NAME the storefront prints, from the slug the database stores.
 *
 * ⚠️ MATCHED AGAINST THE CATALOGUE, NEVER PRINTED RAW. A review may only name
 * a product this shop actually sells — the two invented reviews this whole
 * mechanism replaces named "BAZEN RELAX 5" and "PAKET TERASA", neither of
 * which has ever existed. The panel already restricts the choice to a select
 * of real models; this is the second lock, on the way out.
 *
 * Read out of the catalogue source rather than imported, because this script
 * is plain node and the catalogue is TypeScript. A slug that matches nothing
 * yields no model, and the review renders without one.
 */
function catalogueNames() {
  const names = new Map();
  for (const file of ["src/catalog/pola.ts", "src/catalog/swimspa.ts"]) {
    const src = fs.readFileSync(file, "utf8");
    const re = /slug:\s*"([a-z0-9-]+)"[\s\S]{0,200}?name:\s*"([^"]+)"/g;
    for (const m of src.matchAll(re)) names.set(m[1], m[2]);
  }
  return names;
}

const names = catalogueNames();
const reviews = [];
for (const r of rows) {
  const q = String(r.body ?? "").trim();
  const who = String(r.author_name ?? "").trim();
  if (!q || !who) continue; // a quote with no author is not a testimonial
  const slug = r.products?.slug ?? "";
  const model = names.get(slug) ?? "";
  // A rating is carried only when it is a real 1–5. A row with a null or a
  // nonsense value renders no stars rather than a default five: inventing a
  // score nobody gave is the same class of claim as inventing the quote.
  const rating = Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5
    ? r.rating
    : undefined;
  const role = String(r.author_role ?? "").trim() || undefined;
  reviews.push({ q, who, model, rating, role, verified: r.verified === true });
}

const json = (v) => JSON.stringify(v);
const body = reviews
  .map(
    (r) =>
      "    {\n" +
      "      q: " + json(r.q) + ",\n" +
      "      who: " + json(r.who) + ",\n" +
      "      model: " + json(r.model) + ",\n" +
      (r.rating ? "      rating: " + r.rating + ",\n" : "") +
      (r.role ? "      role: " + json(r.role) + ",\n" : "") +
      "      verified: " + (r.verified ? "true" : "false") + ",\n" +
      "    },",
  )
  .join("\n");

const header = fs
  .readFileSync(OUT, "utf8")
  .split("export const GENERATED_REVIEWS")[0];

fs.writeFileSync(
  OUT,
  header +
    "export const GENERATED_REVIEWS: Record<string, ShopContent[\"reviews\"]> = {\n" +
    "  " + SHOP + ": [\n" + (body ? body + "\n" : "") + "  ],\n" +
    "};\n",
);

const verified = reviews.filter((r) => r.verified).length;
console.log(
  "sync-reviews: wrote " + reviews.length + " review(s) to " + OUT +
    " (" + verified + " verified).",
);
