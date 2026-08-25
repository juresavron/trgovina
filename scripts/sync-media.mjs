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

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
if (!URL_BASE || !KEY) {
  console.error("set SUPABASE_URL and SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const rest = async (q) => {
  const r = await fetch(URL_BASE + "/rest/v1/" + q, {
    headers: { apikey: KEY, authorization: "Bearer " + KEY },
  });
  if (!r.ok) throw new Error(q + " -> " + r.status + " " + (await r.text()).slice(0, 200));
  return r.json();
};

const products = await rest("products?select=id,shop_id,slug&order=sort");
const media = await rest("product_media?select=product_id,url,alt,sort,widths&order=sort");

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
          "widths: [" + (w.length > 1 ? w.map((n) => rung(n, widest)).join(", ") : "") + "] },"
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
