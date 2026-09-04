/**
 * THE PUBLIC /media/ ROUTE, and the asset-path rules it shares with the panel.
 *
 * ⚠️ THIS IS NOT AN ADMIN ROUTE, AND IT LIVED IN THE ADMIN'S ROUTER. Every
 * photograph on every product page is served through handleMedia — it is one
 * of the two request paths an ordinary visitor takes, alongside the storefront
 * itself — and it sat in routes.ts between the login handler and the upload
 * handler, behind a file named for the back office. A reader looking for how
 * the shop serves its images had no reason to open it, and a reader changing
 * the panel had every reason to touch it.
 *
 * The path helpers come with it because they are the same rules from both
 * ends: the panel WRITES objects at these paths and this route READS them, so
 * a change to how a width is spelled has to be one change. That is why they
 * are here rather than split across two files — shared, but shared as one
 * concern, not as a leftover.
 *
 * Moved from routes.ts unchanged.
 */

import { aliasTarget, encodeBucketKey } from "../media-aliases";
import { legacyFallback, siteImageByKey } from "./site-images";
import { BUCKET, type Env } from "./supabase";

/**
 * Serve an uploaded image through the Worker.
 *
 * WHY PROXY RATHER THAN LINK STRAIGHT AT SUPABASE. The storage bucket lives in
 * one region (Frankfurt) and on a different origin. Linking to it directly
 * would put a DNS lookup, a TLS handshake and a single-region round trip on
 * the critical path of every product page — on a site whose entire competitive
 * argument is that it loads faster than the incumbents. Proxied, the bytes are
 * same-origin and sit in Cloudflare's cache at the edge nearest the visitor,
 * and the second request never leaves the country.
 *
 * CACHING IS SPLIT BY WHETHER THE PATH IS CONTENT-ADDRESSED, and getting this
 * wrong is how an image appears to be frozen.
 *
 * Everything here used to be served `immutable` for a year, on the stated
 * grounds that "uploads are content-addressed: a new file gets a new UUID".
 * That is true of /admin uploads, which are <shop>/<slug>/<uuid>.webp — a
 * replacement is a different URL, so the old one can be cached forever.
 *
 * It is FALSE for anything uploaded through the Supabase dashboard, where a
 * human picks the name. Replace hero.png in place and the bytes at that URL
 * change while the URL does not — so Cloudflare keeps serving the old file
 * for a year, and every browser that already fetched it keeps its own copy
 * for a year too. The picture simply never updates, with nothing in the logs
 * and nothing failing.
 *
 * So: a UUID stem gets the immutable year. A human-named file gets five
 * minutes and a revalidation, which still serves the overwhelming majority of
 * requests from the edge while letting a replacement actually land.
 */

/**
 * True for a path whose filename ENDS in a UUID, optionally with a -<width>
 * rung: the shape crypto.randomUUID() produces in the admin upload. Those
 * URLs change when their content changes, which is the whole precondition for
 * caching something forever.
 *
 * A DESCRIPTIVE PREFIX IS ALLOWED, and that is the point of the "--".
 * Uploads used to be a bare UUID, which is content-addressed and cacheable
 * and says nothing: an image URL is a ranking signal in image search, and
 * "3f2a…-…-….webp" spends it on nothing. The stem is now slugified alt text
 * — masazni-bazen-na-terasi--3f2a…webp — so the filename describes the
 * picture while the UUID after the double hyphen still guarantees the URL
 * changes whenever the bytes do.
 *
 * Two hyphens, not one, because a slug contains single hyphens and this has
 * to be an unambiguous seam. Bare UUIDs still match: every file already in
 * the bucket keeps its immutable year.
 */
export function isContentAddressed(path: string): boolean {
  return /(^|\/)([a-z0-9][a-z0-9_-]*--)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-\d+)?\.[a-z0-9]+$/i.test(
    path,
  );
}

/**
 * A filename stem from a sentence of Slovenian.
 *
 * Transliterated rather than stripped: č/š/ž are most of the consonants in
 * this shop's vocabulary, and dropping them turns "masažni" into "masani".
 * The output has to satisfy handleMedia's own path pattern — lowercase
 * letters, digits, hyphen, underscore — or the URL this function names would
 * 404 on the way back out.
 *
 * Capped at 60 characters on a WORD boundary. Long is not better here: the
 * signal is in the first few words, and a 180-character filename is what
 * makes a URL unreadable in the one place people actually see it.
 */
export function slugStem(s: string, max = 60): string {
  const map: Record<string, string> = {
    č: "c", ć: "c", š: "s", ž: "z", đ: "d",
    à: "a", á: "a", ä: "a", â: "a", è: "e", é: "e", ë: "e", ê: "e",
    ì: "i", í: "i", ï: "i", î: "i", ò: "o", ó: "o", ö: "o", ô: "o",
    ù: "u", ú: "u", ü: "u", û: "u",
  };
  let out = "";
  for (const ch of s.toLowerCase()) out += map[ch] ?? ch;
  out = out
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (out.length <= max) return out;
  const cut = out.slice(0, max);
  const dash = cut.lastIndexOf("-");
  return (dash > 20 ? cut.slice(0, dash) : cut).replace(/^-+|-+$/g, "");
}
/**
 * A 1×1 fully transparent WebP, 34 bytes.
 *
 * Generated with sharp at lossless quality and decoded back to confirm it is
 * one pixel of rgba(0,0,0,0) — not pasted from memory, because a literal that
 * is subtly wrong here would ship a visible artefact onto every colour tile
 * on every product page and would look exactly like a design decision.
 *
 * Rebuilt per call rather than held as a module-level Uint8Array: a Response
 * body consumes the buffer it is given, so a shared one would serve the first
 * request and empty bodies after it.
 */
const BLANK_PIXEL = (): ArrayBuffer =>
  Uint8Array.from(atob("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="), (c) =>
    c.charCodeAt(0),
  ).buffer as ArrayBuffer;

export async function handleMedia(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    // Same shape as the storefront's 405 (worker.ts): allow, a type, nosniff.
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        allow: "GET, HEAD",
        "content-type": "text/plain; charset=utf-8",
        "x-content-type-options": "nosniff",
      },
    });
  }
  if (!env.SUPABASE_URL) return new Response("Not found", { status: 404 });

  // ⚠️ decodeURIComponent THROWS on an invalid percent-sequence — the WHATWG
  // URL parser leaves "/media/%" in pathname untouched, so the throw happened
  // BEFORE the pattern gate below could 404 it and surfaced as the catch-all
  // 500 (no cache-control, no robots tag) on any host. A malformed name is
  // exactly what the gate exists to refuse; refuse it the same way.
  let path: string;
  try {
    path = decodeURIComponent(new URL(request.url).pathname.slice("/media/".length));
  } catch {
    return new Response("Not found", { status: 404 });
  }

  // An ALIAS resolves a clean site path to a bucket key that could never be a
  // URL — see src/media-aliases.ts. It is a fixed allowlist, so it is a
  // stricter gate than the pattern below rather than a hole in it: the key
  // comes from a table in the source, never from the request.
  const alias = aliasTarget(path);

  // No traversal, no absolute upstreams: only the bucket, only these shapes.
  // Skipped for an alias, whose target is not request-derived at all.
  if (
    !alias &&
    (!/^[a-z0-9][a-z0-9/_-]*\.(webp|jpg|jpeg|png|avif)$/i.test(path) || path.includes(".."))
  ) {
    return new Response("Not found", { status: 404 });
  }

  const key = alias ?? path;
  // Aliased files are human-named by definition, so they never get the
  // immutable year — replacing one in the bucket has to be able to land.
  const forever = !alias && isContentAddressed(path);
  const ttl = forever ? 31536000 : 300;

  const upstream = (k: string) =>
    env.SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/" + encodeBucketKey(k);
  let res = await fetch(upstream(key), { cf: { cacheEverything: true, cacheTtl: ttl } } as RequestInit);

  // A MANAGED SITE IMAGE THAT HAS NOT BEEN REPLACED YET falls back to the file
  // it is taking over from, once. The storefront names these in code and
  // renders synchronously, so it cannot learn a new filename — which means the
  // new key has to be referenced before anything exists at it, and a hero that
  // 404s is worse than a heavy one. The fallback answers only for the three
  // keys in SITE_IMAGES; it is not a general retry.
  if (!res.ok) {
    const legacy = legacyFallback(key);
    if (legacy) {
      res = await fetch(upstream(legacy), { cf: { cacheEverything: true, cacheTtl: 300 } } as RequestInit);
    }
  }
  if (!res.ok) {
    // ⚠️ AN OPTIONAL SLOT NOBODY HAS UPLOADED YET ANSWERS WITH NOTHING, NOT
    // WITH A 404 — and the difference is sixteen failing requests per page.
    //
    // site-images.ts marks the sixteen finish swatches `optional` because
    // they are painted as CSS BACKGROUNDS: a colour nobody has photographed
    // paints the tile's own ground and its name, with no broken-image icon.
    // That degrades quietly on screen and was extremely loud everywhere else.
    // Every product page asks for all sixteen, each one 404s, and the 404
    // carries `no-store` — so the absence is never cached and all sixteen
    // requests repeat on every single view, for every visitor, until the day
    // the shop uploads swatches. The owner found it as sixteen red lines in
    // the console.
    //
    // A 1×1 fully transparent WebP is 34 bytes and gives the same picture
    // (nothing, over the tile's ground) with a 200 the browser will cache.
    // After the first view the requests stop; on the day a real swatch lands
    // the 300-second TTL below picks it up, exactly like every other managed
    // image.
    //
    // ONLY for slots the registry itself marks optional. Everything else —
    // the hero, the gallery, a product photograph — keeps its 404, because
    // there a missing file is a fault to see rather than a state to absorb.
    const slot = siteImageByKey(key);
    if (slot?.optional) {
      return new Response(BLANK_PIXEL(), {
        status: 200,
        headers: {
          "content-type": "image/webp",
          "x-content-type-options": "nosniff",
          "cache-control": "public, max-age=300, must-revalidate",
        },
      });
    }
    return new Response("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") ?? "image/webp",
      // nosniff on bytes proxied from storage: whatever the bucket claims,
      // the browser must not second-guess it into something executable.
      "x-content-type-options": "nosniff",
      "cache-control": forever
        ? "public, max-age=31536000, immutable"
        : "public, max-age=300, must-revalidate",
    },
  });
}

/* ---- /admin ------------------------------------------------------------ */

/** "bazen/slug/uuid.webp" + 800 → "bazen/slug/uuid-800.webp" */
export function widthPath(url: string, w: number): string {
  const dot = url.lastIndexOf(".");
  return dot < 0 ? url + "-" + w : url.slice(0, dot) + "-" + w + url.slice(dot);
}

export function previewPath(url: string, widths: readonly number[] | null | undefined): string {
  const ladder = (widths ?? []).filter((w) => Number.isFinite(w) && w > 0);
  const widest = ladder.length > 0 ? Math.max(...ladder) : 0;
  // The widest rung lives at the bare path, so asking for a suffixed version
  // of it would be asking for a file that was never written — the same trap
  // that broke delete. Only a NARROWER rung has a suffix.
  return ladder.includes(800) && widest !== 800 ? widthPath(url, 800) : url;
}

/**
 * Every object an image row actually put in the bucket.
 *
 * ⚠️ THE WIDEST RUNG HAS NO SUFFIX, and forgetting that is what made deleting
 * a photograph fail. upload() stores the largest width at the bare path — that
 * is the URL the row carries and the storefront serves — and only the narrower
 * ones at "<stem>-<w>.webp". But it records EVERY width in the widths column,
 * the widest included. So a row reading [480, 800, 1200, 1600, 2048] has five
 * objects behind it and exactly four of them are suffixed: there is no
 * "-2048.webp", and there never was.
 *
 * Delete used to ask for one anyway. Supabase Storage answers a key that was
 * never written with 400, not 404 (deleteObject now reads the body, which is
 * the other half of this fix), so the request threw and the panel said "Napaka
 * na strežniku" — after deleteMedia had already removed the row. The operator
 * watched the photograph disappear from the shop while being told the server
 * had failed, and the four objects that DID exist stayed in the bucket.
 *
 * Deriving the set from the row instead of guessing at it is what keeps those
 * two facts — what was written, what gets removed — from drifting apart again.
 *
 * An empty widths column is the one-size case, old dashboard uploads included:
 * one object, at the row's own url.
 */
export function storedPaths(url: string, widths: readonly number[] | null | undefined): string[] {
  const ladder = (widths ?? []).filter((w) => Number.isFinite(w) && w > 0);
  const widest = ladder.length > 0 ? Math.max(...ladder) : 0;
  const narrower = [...new Set(ladder)].filter((w) => w !== widest).sort((a, b) => a - b);
  return [url, ...narrower.map((w) => widthPath(url, w))];
}

/**
 * Is this actually a WebP file?
 *
 * READ FROM THE BYTES, NOT FROM THE CLIENT. A multipart part carries whatever
 * content-type the sender put on it, and the browser path here sets
 * "image/webp" itself — so trusting the label means the server's guarantee is
 * really the client's promise. A file is WebP when it opens with the RIFF
 * container magic and names WEBP as its form type, and nothing else is.
 *
 *   bytes 0-3   "RIFF"
 *   bytes 4-7   little-endian length, ignored here
 *   bytes 8-11  "WEBP"
 */
export function isWebp(bytes: ArrayBuffer): boolean {
  if (bytes.byteLength < 12) return false;
  const b = new Uint8Array(bytes, 0, 12);
  return (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  );
}
