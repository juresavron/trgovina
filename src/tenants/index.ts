import type { ShopConfig } from "./types";
import { bazen } from "./bazen";
import { vrecke } from "./vrecke";

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
  // ⚠️ PRE-LIVE. Registered here rather than kept on a branch on purpose: a
  // shop that is not in this map is a shop no test, audit or gate in this
  // repository can see, and the cross-shop rules — no shared sentence, no
  // shared head term, no sibling domain in the markup — only mean anything
  // with a second entry to check them against. live:false keeps it off the
  // internet; being here keeps it honest.
  vrecke,
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
  // An alias resolves to the shop as well, so that a request which somehow
  // reaches the renderer without passing the redirect below still draws the
  // right pages rather than a 404. The redirect is what visitors and
  // crawlers actually get; this is the floor under it.
  for (const alias of s.aliasDomains ?? []) {
    for (const host of [alias, `www.${alias}`]) {
      const taken = byHost.get(host);
      if (taken) {
        throw new Error(
          "two shops claim the host " + host + ": " + taken.key + " and " + s.key,
        );
      }
      byHost.set(host, s);
    }
  }
}

/**
 * Hosts that must answer with a permanent redirect rather than with pages.
 *
 * ⚠️ EXACTLY ONE HOST PER SHOP SERVES CONTENT, and it is `domain`. Every
 * other spelling the shop owns — www, and both forms of every alias — is in
 * here and answers 301 to the same path on the canonical origin.
 *
 * www IS IN THIS MAP, and it did not used to be. Both www and apex answered
 * 200 with the same body and the same canonical tag, which is a duplicate a
 * crawler has to resolve for itself. The canonical tag made that likely to
 * come out right; a redirect makes it certain, and costs one response.
 */
const redirectHosts = new Map<string, ShopConfig>();
for (const s of Object.values(SHOPS)) {
  const hosts = [`www.${s.domain}`];
  for (const alias of s.aliasDomains ?? []) hosts.push(alias, `www.${alias}`);
  for (const host of hosts) redirectHosts.set(host, s);
}

/**
 * The shop a host should be redirected to, or null when the host serves.
 *
 * Dev hosts never redirect: the QA host and localhost are where the site is
 * driven from, and sending them to the production origin would make every
 * test and audit measure a domain that is not live yet.
 */
export function resolveRedirect(host: string | null | undefined): ShopConfig | null {
  if (!host) return null;
  const bare = host.trim().toLowerCase().replace(/:\d+$/, "");
  if (isDevHost(bare)) return null;
  return redirectHosts.get(bare) ?? null;
}

/**
 * Resolve the shop for a request Host header (or client hostname).
 * Returns null for unknown production hosts — the caller must 404.
 */
export function resolveShop(
  host: string | null | undefined,
  /**
   * The request URL, for the QA-host override below. Optional so a caller
   * that has no URL (none today) still resolves by host alone.
   */
  url?: URL,
): ShopConfig | null {
  if (!host) return null;
  const h = host.trim().toLowerCase();
  const bare = h.replace(/:\d+$/, "");
  const exact = byHost.get(bare);
  // ⚠️ A PRODUCTION HOST NEVER READS ?shop=. The override below is the one
  // place a request can name a shop other than the one its Host header
  // resolves to, and it is fenced to dev hosts on purpose: on a real domain
  // it would let anyone render shop B's pages under shop A's canonicals,
  // which the note on DEV_SHOP calls the worst available bug.
  if (exact) return exact;
  if (DEV_HOST_PATTERNS.some((p) => p.test(bare))) {
    // ⚠️ THIS OVERRIDE EXISTED, WAS REMOVED, AND ITS ABSENCE WAS INVISIBLE.
    // The QA switcher went when the network narrowed to one shop, and the
    // worker's note recorded that "unknown query parameters are simply
    // ignored" — true, and it meant every test and audit in this repo that
    // drives the QA host with ?shop=<key> was silently rendering DEV_SHOP
    // whatever key it passed. With one shop that is a no-op. The day a
    // second shop was registered (a throwaway one, in a worktree, to probe
    // exactly this) every per-shop gate in tenancy.test.ts PASSED for it
    // while measuring the bazen shop's pages under the new shop's slugs, and
    // the one gate that failed did so because bazen had no such guide.
    //
    // Validated against the registry and never reflected: an unknown key
    // falls through to DEV_SHOP exactly as no key does.
    const wanted = url?.searchParams.get("shop");
    if (wanted && Object.prototype.hasOwnProperty.call(SHOPS, wanted)) return SHOPS[wanted]!;
    return DEV_SHOP;
  }
  return null;
}
