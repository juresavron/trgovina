/**
 * The shop's colour list, in the database.
 *
 * ⚠️ THIS TABLE IS THE INVERSION. catalog/pola.ts used to hold a
 * transcription of the supplier's chart, and admin/site-images.ts built one
 * upload slot per transcribed name — so a colour could only be photographed
 * if somebody had already typed its name into the source. A sample the shop
 * physically holds but the transcription missed had nowhere to go, and a name
 * on the chart the shop cannot show still took a tile on the product page.
 *
 * Now a row exists because a swatch was uploaded, and the NAME COMES OFF THE
 * FILE. scripts/sync-finishes.mjs bakes these into
 * catalog/finishes.generated.ts at build time, for the same reason reviews
 * are baked: the configurator renders inside a synchronous, env-free
 * `handleRequest`.
 *
 * ⚠️ NOTHING HERE INVENTS A NAME. These are the acrylic manufacturer's own
 * trade names, quoted on a purchase order, and this repository does not know
 * what colour "Canyon" is — the same rule that stops it drawing an invented
 * swatch stops it captioning a photograph with a colour it guessed. The
 * operator names the file; a rename is a field they type. There is no
 * suggestion, and there must not be one.
 */

import type { Api } from "./supabase";
import { finishSlug, type FinishKind } from "../catalog/finish-image";

export interface Finish {
  readonly id: string;
  readonly kind: FinishKind;
  /** As the manufacturer writes it. */
  readonly name: string;
  /** The bucket key stem: site/<kind>-<slug>.webp. */
  readonly slug: string;
  readonly position: number;
}

const COLUMNS = "id,kind,name,slug,position";

function headers(api: Api, extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: api.env.SUPABASE_ANON_KEY ?? "",
    authorization: "Bearer " + api.token,
    ...extra,
  };
}

const rest = (api: Api, q: string): string =>
  api.env.SUPABASE_URL + "/rest/v1/finishes?" + q;

const eq = (c: string, v: string): string => c + "=eq." + encodeURIComponent(v);

async function json(res: Response, what: string): Promise<unknown> {
  if (!res.ok) {
    throw new Error(what + " failed (" + res.status + "): " + (await res.text()).slice(0, 300));
  }
  return await res.json();
}

interface Raw {
  id?: string;
  kind?: string;
  name?: string;
  slug?: string;
  position?: number;
}

function toFinish(r: Raw): Finish {
  return {
    id: String(r.id ?? ""),
    kind: r.kind === "obloga" ? "obloga" : "barva",
    name: String(r.name ?? ""),
    slug: String(r.slug ?? ""),
    position: typeof r.position === "number" ? r.position : 0,
  };
}

/** Every colour this shop has photographed, in display order. */
export async function listFinishes(api: Api, shopId: string): Promise<Finish[]> {
  const res = await fetch(
    rest(api, "select=" + COLUMNS + "&" + eq("shop_id", shopId) + "&order=kind.asc,position.asc,name.asc"),
    { headers: headers(api) },
  );
  return ((await json(res, "list finishes")) as Raw[]).map(toFinish);
}

/**
 * THE NAME A FILE CARRIES.
 *
 * "Oyster Opal.jpg" → "Oyster Opal". "silver white marble (1).png" → "silver
 * white marble". Pure, so the rules are testable without a network:
 *
 *   * the directory and the extension go;
 *   * a download folder's copy suffix goes — "(1)", " copy", "-kopija";
 *   * underscores and repeated whitespace become single spaces, because a
 *     file named "ocean_wave" means "ocean wave" and nobody types the
 *     underscore on purpose;
 *   * ⚠️ CASE IS LEFT EXACTLY AS TYPED. It is tempting to Title Case this,
 *     and it would be wrong: the chart prints "Silver white marble" and
 *     "Oyster Opal", one of each, and a purchase order quotes what the chart
 *     says. Whatever the operator named the file is what the manufacturer
 *     calls it, and we are not better informed than they are.
 */
export function nameFromFilename(filename: string): string {
  return filename
    .replace(/^.*[\\/]/, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\s*\((\d+)\)\s*$/, "")
    .replace(/[-_\s]*(?:copy|kopija)\s*$/i, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Add a colour, or return the one already there.
 *
 * Idempotent on (kind, slug) because the natural flow is a drop of ten files
 * onto a zone that has already seen eight of them: re-uploading a swatch
 * should replace the picture, not fail the batch or duplicate the tile.
 * `position` puts a new colour at the end rather than reordering what the
 * operator has already arranged.
 */
export async function ensureFinish(
  api: Api,
  shopId: string,
  kind: FinishKind,
  name: string,
): Promise<Finish | null> {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, 80);
  const slug = finishSlug(clean);
  // A file whose name folds to nothing ("###.jpg") names no colour. Refusing
  // is better than storing a row with an empty slug that no bucket key can
  // ever match.
  if (clean === "" || slug === "") return null;

  const found = await fetch(
    rest(api, "select=" + COLUMNS + "&" + eq("shop_id", shopId) + "&" + eq("kind", kind) + "&" + eq("slug", slug) + "&limit=1"),
    { headers: headers(api) },
  );
  const existing = ((await json(found, "find finish")) as Raw[])[0];
  if (existing) return toFinish(existing);

  const all = await listFinishes(api, shopId);
  const next = all.filter((f) => f.kind === kind).reduce((m, f) => Math.max(m, f.position), -1) + 1;

  const res = await fetch(api.env.SUPABASE_URL + "/rest/v1/finishes", {
    method: "POST",
    headers: headers(api, {
      "content-type": "application/json",
      prefer: "return=representation",
    }),
    body: JSON.stringify({ shop_id: shopId, kind, name: clean, slug, position: next }),
  });
  const rows = (await json(res, "create finish")) as Raw[];
  return rows[0] ? toFinish(rows[0]) : null;
}

/**
 * Rename a colour, keeping its slug.
 *
 * ⚠️ THE SLUG DOES NOT MOVE. It is half of the bucket key the swatch is
 * already stored under, and renaming it would leave the photograph behind at
 * the old key with nothing pointing at it — the tile would go blank and the
 * file would linger. So this fixes a typo in the DISPLAYED name; a genuinely
 * different colour is a different upload.
 */
export async function renameFinish(
  api: Api,
  shopId: string,
  id: string,
  name: string,
): Promise<void> {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, 80);
  if (clean === "") return;
  const res = await fetch(rest(api, eq("shop_id", shopId) + "&" + eq("id", id)), {
    method: "PATCH",
    headers: headers(api, { "content-type": "application/json", prefer: "return=minimal" }),
    body: JSON.stringify({ name: clean }),
  });
  if (!res.ok) throw new Error("rename failed (" + res.status + ")");
}

/** Drop a colour from the list. The stored swatch is left in the bucket. */
export async function deleteFinish(api: Api, shopId: string, id: string): Promise<void> {
  const res = await fetch(rest(api, eq("shop_id", shopId) + "&" + eq("id", id)), {
    method: "DELETE",
    headers: headers(api, { prefer: "return=minimal" }),
  });
  if (!res.ok) throw new Error("delete failed (" + res.status + ")");
}
