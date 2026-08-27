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
 * The asset for a path, or null when the path is not an asset at all.
 *
 * The CURRENT hash serves immutable. A STALE hash — same family, different
 * hex — redirects to the current path with no-store, and the reason is the
 * deploy sequence: live HTML carries s-maxage=300, so for up to five
 * minutes after a deploy a shared cache can serve OLD HTML referencing the
 * OLD hash, which the new worker no longer has. "A stale hash 404s" was the
 * first rule here, and it meant every such visitor got an unstyled page
 * with dead script. The redirect self-heals them onto the current bytes —
 * and it must never serve those bytes DIRECTLY under the stale name: an
 * immutable cache would then hold wrong-name content for a year.
 */
const STALE_ASSET = /^\/assets\/site-[0-9a-f]{8}\.(css|js)$/;

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
  const stale = STALE_ASSET.exec(path);
  if (stale) {
    return new Response(null, {
      status: 302,
      headers: {
        location: stale[1] === "css" ? CSS_PATH : JS_PATH,
        "cache-control": "no-store",
      },
    });
  }
  return null;
}
