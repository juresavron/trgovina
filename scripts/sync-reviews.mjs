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

const OUT = path.join("src", "content", "reviews.generated.ts");
const SHOP = process.env.SYNC_SHOP ?? "bazen";

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error(
    "sync-reviews: SUPABASE_URL and SUPABASE_ANON_KEY are not set — leaving " +
      OUT + " as it is.",
  );
  process.exit(0);
}

/**
 * Published reviews, oldest first.
 *
 * Oldest first because the band is a slider and the order is the reading
 * order; a shop's first review should not be buried by its newest. The
 * product slug comes through the embed rather than a second request.
 */
const query =
  "select=id,author_name,body,verified,created_at,products(slug)" +
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
  reviews.push({ q, who, model, verified: r.verified === true });
}

const json = (v) => JSON.stringify(v);
const body = reviews
  .map(
    (r) =>
      "    {\n" +
      "      q: " + json(r.q) + ",\n" +
      "      who: " + json(r.who) + ",\n" +
      "      model: " + json(r.model) + ",\n" +
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
