/**
 * The stylesheet and the behaviour script as CACHEABLE FILES, not inline
 * blocks.
 *
 * WHY. The whole studio theme — 142.7 kB of CSS, ~22–29 kB compressed — was
 * inlined into every document, so every navigation re-shipped it and 72–89%
 * of every page's bytes was the same stylesheet the visitor already had.
 * Inline CSS cannot be cached across pages; a file can, and this shop's whole
 * strategy is a visitor reading several pages (home → collection → model).
 *
 * WHY CONTENT-ADDRESSED. The filename carries a hash of the content
 * (/assets/site-1a2b3c4d.css), so the file can be served immutable for a
 * year: a deploy that changes a byte changes the URL, the old URL simply
 * stops being referenced, and no cache is ever wrong. The hash is FNV-1a —
 * not cryptographic, and it does not need to be: it distinguishes versions,
 * it does not authenticate anyone.
 *
 * WHY THIS STAYS SYNCHRONOUS. handleRequest is sync and env-free by
 * contract; these are module-scope strings hashed once at cold start, so
 * serving them is a dictionary lookup.
 */

import { BASE_CSS } from "./css";
import { STUDIO_JS } from "../themes/studio";

/** FNV-1a, 32-bit, as eight hex characters. */
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** The document references these; the router serves them. One constant each
 * so the two can never disagree about a name. */
export const CSS_PATH = "/assets/site-" + fnv1a(BASE_CSS) + ".css";
export const JS_PATH = "/assets/site-" + fnv1a(STUDIO_JS) + ".js";

/**
 * The asset for a path, or null when the path is not a current asset.
 *
 * Only the CURRENT hash resolves. A stale hash 404s rather than serving old
 * bytes under a wrong name — no page references it, so the only way to ask
 * for one is a cache that should be revalidating anyway.
 */
export function assetResponse(path: string): Response | null {
  if (path === CSS_PATH) {
    return new Response(BASE_CSS, {
      headers: {
        "content-type": "text/css; charset=utf-8",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }
  if (path === JS_PATH) {
    return new Response(STUDIO_JS, {
      headers: {
        "content-type": "text/javascript; charset=utf-8",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }
  return null;
}
