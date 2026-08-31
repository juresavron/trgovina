import type { ShopConfig } from "./types";
import { bazen } from "./bazen";

export type { ShopConfig, InternalRouteKey } from "./types";
export { isValidStatementDescriptor, isValidRouteSlug } from "./types";

/**
 * All shops, keyed by shop key. Adding a shop = adding one entry.
 *
 * ONE SHOP, AS OF 25 AUG 2026. The network was six single-keyword storefronts
 * — infrardeča savna, ledena kad, masažni bazen, masažni fotelj, prostostoječa
 * kad, biljardna miza — and the owner narrowed it to masazni-bazen.si to put
 * the effort behind one shop that sells rather than six that are nearly ready.
 * The other five are deleted, not disabled: a half-maintained tenant that
 * nobody renders is a place for bugs to live. They are in git history at
 * e7e8269 if the range widens again.
 *
 * The MECHANISM is deliberately unchanged. Host-header tenancy still resolves,
 * still 404s unknown hosts, and ShopConfig still carries everything per shop,
 * because none of that costs anything with one entry and all of it would have
 * to be rebuilt to add a second. What was removed is five shops, not the
 * ability to have them.
 */
export const SHOPS: Record<string, ShopConfig> = {
  bazen,
};

/**
 * The shop that development / preview hosts resolve to. Production hosts
 * must match a shop domain exactly — there is deliberately NO production
 * fallback: a misconfigured domain silently rendering another shop's
 * canonicals would be the worst available bug (cross-shop canonical leakage
 * is how a keyword network gets itself devalued as one site), so unknown
 * hosts get null and callers respond 404 at the edge, before the router runs.
 */
export const DEV_SHOP: ShopConfig = bazen;

const DEV_HOST_PATTERNS: RegExp[] = [
  /^localhost(:\d+)?$/i,
  /^127\.0\.0\.1(:\d+)?$/i,
  /\.workers\.dev$/i,
];

/** True for QA/preview hosts — they get the dev switcher and hard noindex. */
export function isDevHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = host.trim().toLowerCase().replace(/:\d+$/, "");
  return DEV_HOST_PATTERNS.some((p) => p.test(bare));
}

const byHost = new Map<string, ShopConfig>();
for (const s of Object.values(SHOPS)) {
  // ⚠️ THROW, DO NOT OVERWRITE. This map was built with plain Map.set in
  // object-key order and no duplicate check, which means the note above —
  // that cross-shop canonical leakage "is how a keyword network gets itself
  // devalued as one site" — was a warning with nothing behind it. A typo
  // repeating a sibling's domain, or one shop declaring www.x.si while
  // another declares x.si, silently overwrote an entry and one shop began
  // serving the other's pages under the other's canonicals.
  //
  // Module scope, so a bad registry fails the BUNDLE rather than a customer's
  // request. tenancy.test.ts asserts the same thing against SHOPS so the
  // failure names the shop rather than the host.
  for (const host of [s.domain, `www.${s.domain}`]) {
    const taken = byHost.get(host);
    if (taken) {
      throw new Error(
        "two shops claim the host " + host + ": " + taken.key + " and " + s.key,
      );
    }
    byHost.set(host, s);
  }
}

/**
 * Resolve the shop for a request Host header (or client hostname).
 * Returns null for unknown production hosts — the caller must 404.
 */
export function resolveShop(host: string | null | undefined): ShopConfig | null {
  if (!host) return null;
  const h = host.trim().toLowerCase();
  const bare = h.replace(/:\d+$/, "");
  const exact = byHost.get(bare);
  if (exact) return exact;
  if (DEV_HOST_PATTERNS.some((p) => p.test(bare))) return DEV_SHOP;
  return null;
}
