/**
 * Clean site URLs for bucket objects whose real names are not URL-shaped.
 *
 * WHY THIS EXISTS. Files uploaded through the Supabase dashboard keep whatever
 * name the operating system gave them — "Generated Image August 25, 2026 -
 * 6_06PM Large.jpeg" is a real one. That name cannot be a URL on this site,
 * and the answer is not to widen the /media path pattern to accept it:
 *
 *   - The pattern is a security boundary. It is what guarantees a /media
 *     request can only ever address an object in one bucket, and loosening it
 *     to admit spaces, commas and arbitrary punctuation is loosening exactly
 *     the thing that makes the proxy safe to expose.
 *   - Spaces in an image URL are their own problem regardless. They force
 *     %20 in every reference, break copy-paste and mail clients, and fragment
 *     CDN cache keys, because "a%20b" and "a+b" and "a b" are three cache
 *     entries for one file.
 *
 * So the site gets a clean name and the bucket keeps its messy one. This map
 * is the join, and being a fixed allowlist it is STRICTER than the regex it
 * sits in front of: a request either matches an entry written here by hand or
 * it does not, with nothing to construct or escape.
 *
 * The alternative — renaming in Supabase — works too and is tidier at the
 * source. This exists so an awkward filename is never a reason for a picture
 * not to ship.
 */
export const MEDIA_ALIASES: Readonly<Record<string, string>> = {
  "hero-banner.jpeg": "Generated Image August 25, 2026 - 5_41PM Large.jpeg",
  "kategorija-masazni-bazeni.jpeg": "Generated Image August 25, 2026 - 6_06PM Large.jpeg",
  "kategorija-swim-spa.jpeg": "Generated Image August 25, 2026 - 6_26PM Large.jpeg",
};

/**
 * The bucket key a /media path addresses, or null when it is not an alias.
 *
 * Callers must still run the strict pattern on anything this returns null
 * for — an alias is a bypass of that check, so it may only ever resolve to a
 * key spelled out above.
 */
export function aliasTarget(path: string): string | null {
  return Object.prototype.hasOwnProperty.call(MEDIA_ALIASES, path)
    ? (MEDIA_ALIASES[path] as string)
    : null;
}

/**
 * Percent-encode a bucket key for the upstream request, segment by segment so
 * the path separators survive. encodeURIComponent is deliberate: it escapes
 * the space AND the comma, and Supabase is happy with both encoded.
 */
export function encodeBucketKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}
