#!/usr/bin/env node
/**
 * Regenerate src/themes/studio/own-media.ts from Supabase.
 *
 * The product photography lives in the `product-media` bucket and is indexed
 * by the `product_media` table; this pulls that index into the repo so the
 * renderer can stay synchronous.
 *
 * WHY A BUILD STEP RATHER THAN A QUERY. handleRequest is synchronous and takes
 * no env — every test calls it directly and the whole render path depends on
 * it. Putting a database round trip inside it is not a refactor, it is a
 * different architecture, and it would put Supabase's availability on the
 * critical path of a page whose entire argument is that it loads fast. So the
 * rows are read here, at build time, and the render stays a pure function of
 * the request. The cost: a photograph added through /admin is in Supabase
 * immediately and on the site at the next deploy.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/sync-media.mjs
 *
 * Output is committed, so this runs when photography changes, not per build.
 */

import fs from "node:fs";
import path from "node:path";
import { wranglerVars } from "./wrangler-vars.mjs";

/**
 * Where the project is, and which key opens it.
 *
 * ⚠️ THE PUBLISHABLE KEY IS ENOUGH NOW, and that is deliberate. These two
 * tables carry image paths and alt text — every byte of which is rendered into
 * a product page and served to visitors and to Google — so the index_build_read
 * policy lets an anonymous reader see them, and anon's grant on products is
 * narrowed to the three columns selected below. The alternative was the
 * SERVICE key in CI, which bypasses every policy in the database including
 * orders and customers, to read a list of filenames.
 *
 * Both keys are accepted because the service key still works locally and there
 * is no reason to break that. Neither is required if SUPABASE_MEDIA_JSON is
 * given instead.
 */
const VARS = wranglerVars();

/**
 * Where the project is, and which key opens it.
 *
 * ⚠️ THE PUBLISHABLE KEY IS ENOUGH NOW, and that is deliberate. These two
 * tables carry image paths and alt text — every byte of which is rendered into
 * a product page and served to visitors and to Google — so the index_build_read
 * policy lets an anonymous reader see them, and anon's grant on products is
 * narrowed to the three columns selected below. The alternative was the
 * SERVICE key in CI, which bypasses every policy in the database including
 * orders and customers, to read a list of filenames.
 *
 * The service key still works where somebody has one; neither is needed when
 * SUPABASE_MEDIA_JSON is given instead.
 */
const URL_BASE = process.env.SUPABASE_URL || VARS.SUPABASE_URL;
const KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  VARS.SUPABASE_ANON_KEY;

/**
 * A dump instead of a fetch.
 *
 * Reading these two tables needs the SERVICE key, because RLS quite correctly
 * shows an anonymous reader nothing until the shop is live and its products
 * published — which is exactly the state this index is most needed in. That
 * key is not available everywhere this script needs to run, and it is not a
 * key to scatter about, so the generator also accepts the rows as JSON:
 *
 *   SUPABASE_MEDIA_JSON=dump.json node scripts/sync-media.mjs
 *
 * where dump.json is { "products": [...], "media": [...] } with the same
 * columns the queries below select. One generator, one output format, two
 * ways to feed it.
 */
const DUMP = process.env.SUPABASE_MEDIA_JSON;

let products, media;
if (DUMP) {
  const d = JSON.parse(fs.readFileSync(DUMP, "utf8"));
  if (!Array.isArray(d.products) || !Array.isArray(d.media)) {
    console.error(DUMP + ": expected { products: [...], media: [...] }");
    process.exit(1);
  }
  ({ products, media } = d);
} else {
  if (!URL_BASE || !KEY) {
    console.error("set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_KEY), or SUPABASE_MEDIA_JSON");
    process.exit(1);
  }
  const rest = async (q) => {
    const r = await fetch(URL_BASE + "/rest/v1/" + q, {
      headers: { apikey: KEY, authorization: "Bearer " + KEY },
    });
    if (!r.ok) throw new Error(q + " -> " + r.status + " " + (await r.text()).slice(0, 200));
    return r.json();
  };
  // NOT ordered by sort. PostgREST needs SELECT on any column it orders by,
  // and anon's grant is deliberately the three columns below — ordering here
  // would 403 for the sake of nothing, since the output is grouped by
  // "<shop>/<slug>" and those keys are sorted alphabetically further down.
  products = await rest("products?select=id,shop_id,slug");
  media = await rest("product_media?select=product_id,url,alt,sort,widths,shot&order=sort");
}

const byProduct = new Map(products.map((p) => [p.id, p]));
const groups = new Map();
for (const m of media) {
  const p = byProduct.get(m.product_id);
  if (!p) continue;
  const key = p.shop_id + "/" + p.slug;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(m);
}

const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const body = [...groups.keys()]
  .sort()
  .map((key) => {
    const rows = groups
      .get(key)
      .sort((a, b) => a.sort - b.sort)
      .map((m) => {
        // The ladder is only present when the photograph went in through
        // /admin, which converts to WebP and writes one in the browser. A
        // dashboard upload has neither, and a srcset offering a width nothing
        // wrote is a 404 the browser picks on purpose.
        const w = (m.widths ?? []).filter((n) => Number.isInteger(n) && n > 0).sort((a, b) => a - b);
        const dot = m.url.lastIndexOf(".");
        const rung = (n, widest) =>
          '["/media/' +
          (n === widest ? m.url : m.url.slice(0, dot) + "-" + n + m.url.slice(dot)) +
          '", ' + n + "]";
        const widest = w.length ? Math.max(...w) : 0;
        return (
          "    { " +
          'src: "/media/' + esc(m.url) + '", ' +
          'alt: "' + esc(m.alt) + '", ' +
          "widths: [" + (w.length > 1 ? w.map((n) => rung(n, widest)).join(", ") : "") + "]" +
          // The KIND of shot travels with the picture so the renderer can
          // choose one rather than taking whatever sorted first — the hero
          // wants the atmospheric frame, not the top-down diagram.
          (m.shot ? ', shot: "' + esc(m.shot) + '"' : "") + " },"
        );
      })
      .join("\n");
    return '  "' + key + '": [\n' + rows + "\n  ],";
  })
  .join("\n");

const MODULE = path.join(process.cwd(), "src", "themes", "studio", "own-media.ts");
const prev = fs.readFileSync(MODULE, "utf8");
// Keep the hand-written header — it explains WHY there are no dimensions and
// no ladder, which is the part of this file a reader most needs.
const head = prev.slice(0, prev.indexOf("export const OWN_MEDIA"));
fs.writeFileSync(
  MODULE,
  head + "export const OWN_MEDIA: Readonly<Record<string, readonly OwnPhoto[]>> = {\n" + body + "\n};\n",
);

console.log(
  [...groups.entries()].map(([k, v]) => k + ": " + v.length).join("  ") +
    "\nwrote src/themes/studio/own-media.ts",
);
