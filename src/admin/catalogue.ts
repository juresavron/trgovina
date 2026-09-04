/**
 * THE SEED, NOT THE SOURCE.
 *
 * ⚠️ THIS FILE USED TO DECIDE WHAT THE PANEL CONTAINED, and it should not
 * have. The list below was the dashboard: OFFERED_MODELS and OFFERED_SWIMSPAS,
 * compiled into the Worker, with ensureProduct() writing them into
 * public.products afterwards. The database mirrored the bundle, so a model
 * only existed in the back office once somebody edited a file and deployed.
 *
 * db/catalogue.ts reads public.products now, and that is the source. What is
 * left here is a SEED: it guarantees the known catalogue has rows, because an
 * empty table would render a back office with nothing in it and that must not
 * be a reachable state on a live shop.
 *
 * The direction of authority is the whole change. The seed fills gaps; it no
 * longer says what exists. A row added straight to the database is on the
 * dashboard at the next page load, with no deploy — which is what a compiled
 * list could never do.
 */

import { ensureProduct, type Api } from "./supabase";
import { OFFERED_MODELS } from "../catalog/pola";
import { OFFERED_SWIMSPAS } from "../catalog/swimspa";

/** Shops whose catalogue this panel can manage. */
/**
 * Every product the panel can manage, as the panel needs it.
 *
 * ⚠️ THIS USED TO BE THE HOT TUBS ONLY. The list was OFFERED_MODELS and the
 * lookup was polaBySlug, so the three swim spas — half the catalogue, and the
 * half with the largest tickets — had no page in the panel and no way to
 * change a photograph. Nothing errored; they were simply not on the
 * dashboard, which is the quietest way for a tool to be incomplete.
 *
 * The two model types are separate on purpose (a Pola shell and a 5.8 m swim
 * spa share almost no specification) but they agree on the three fields this
 * panel needs, so the panel takes that intersection rather than either type.
 */
export interface AdminModel {
  readonly slug: string;
  readonly name: string;
  /** Out-of-gauge freight is not the same problem as a pallet. */
  readonly freightClass: string;
}

const ADMIN_MODELS: readonly AdminModel[] = [
  ...OFFERED_MODELS.map((m) => ({ slug: m.slug, name: m.name, freightClass: "pallet_xl" })),
  // The enum has no out-of-gauge class; white_glove is the honest closest fit
  // for a 4.5-5.8 m shell delivered by a team, and is flagged as such where
  // the products row is written.
  ...OFFERED_SWIMSPAS.map((m) => ({ slug: m.slug, name: m.name, freightClass: "white_glove" })),
];

export const CATALOGUE_SHOPS: Record<string, { models: readonly AdminModel[] }> = {
  bazen: { models: ADMIN_MODELS },
};

/** Every slug the panel can manage — the dashboard's coverage, as data. */
export function adminModelSlugs(): string[] {
  return ADMIN_MODELS.map((m) => m.slug);
}

export function adminModelBySlug(slug: string): AdminModel | undefined {
  return ADMIN_MODELS.find((m) => m.slug === slug);
}

/**
 * Make sure every model the code knows about has a row, then get out of the
 * way.
 *
 * ensureProduct() is a no-op when the row is already there — it selects by
 * (shop_id, slug), which the table has a unique index on — so this costs one
 * round trip per known model and inserts nothing on a warm database. It is
 * deliberately not a sync: it never updates a title, never archives a row the
 * code has dropped, and never removes anything. Reconciling downward would
 * make the bundle authoritative again through the back door.
 */
export async function seedCatalogue(api: Api, shopId: string): Promise<void> {
  await Promise.all(
    ADMIN_MODELS.map((m) => ensureProduct(api, shopId, m.slug, m.name, m.freightClass)),
  );
}
