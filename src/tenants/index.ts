import type { ShopConfig } from "./types";
import { savna } from "./savna";
import { kad } from "./kad";
import { bazen } from "./bazen";
import { fotelj } from "./fotelj";
import { kopalna } from "./kopalna";
import { biljard } from "./biljard";

export type { ShopConfig, InternalRouteKey } from "./types";
export { isValidStatementDescriptor, isValidRouteSlug } from "./types";

/** All shops, keyed by shop key. Adding a shop = adding one entry. */
export const SHOPS: Record<string, ShopConfig> = {
  savna,
  kad,
  bazen,
  fotelj,
  kopalna,
  biljard,
};

/**
 * The shop that development / preview hosts resolve to. Production hosts
 * must match a shop domain exactly — there is deliberately NO production
 * fallback: a misconfigured domain silently rendering another shop's
 * canonicals would be the worst available bug (cross-shop canonical leakage
 * is how a keyword network gets itself devalued as one site), so unknown
 * hosts get null and callers respond 404 at the edge, before the router runs.
 */
export const DEV_SHOP: ShopConfig = savna;

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
  byHost.set(s.domain, s);
  byHost.set(`www.${s.domain}`, s);
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
