/**
 * WHICH MODELS THE PANEL CAN BE POINTED AT.
 *
 * ⚠️ NOT THE STOREFRONT'S CATALOGUE. This is the list of slugs /admin will
 * open an upload screen for, and it is deliberately its own list: the shop's
 * catalogue is content, and a panel that derived its routes from content
 * would grow a new writable URL every time somebody added a product. Adding a
 * model here is a decision; adding one to the shop is not.
 *
 * Moved out of routes.ts so the surfaces can read it without importing the
 * router that calls them — a cycle that works and reads like a mistake.
 */

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
