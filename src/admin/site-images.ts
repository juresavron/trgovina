/**
 * The pictures that belong to the SITE rather than to a product.
 *
 * WHY THIS EXISTS. The panel could manage a model's photographs and nothing
 * else, so the three largest images on the storefront — the hero and the two
 * category banners — were put into the bucket through the Supabase dashboard
 * and stayed exactly as they arrived. Measured on the live bucket:
 *
 *   hero.png                                   2 715 kB   PNG
 *   Generated Image … 6_26PM Large.jpeg          457 kB   JPEG
 *   Generated Image … 5_41PM Large.jpeg          337 kB   JPEG
 *
 * The hero is the largest contentful paint on every home page view. A 2.7 MB
 * PNG in a slot a phone paints 390 px wide is the single most expensive thing
 * on this site, and the panel's whole promise — every picture converted to
 * WebP on the way in — did not reach it.
 *
 * SO THE SLOTS ARE NAMED HERE and the panel writes them like any other
 * upload: converted in the browser, magic-byte checked on the server, stored
 * as WebP.
 *
 * ⚠️ THE KEY IS FIXED, WHICH IS THE WHOLE MECHANISM. A product photograph
 * gets a UUID and is cached for a year; these cannot, because the storefront
 * names them in code and renders synchronously — it has no way to learn a new
 * filename. So a replacement has to land at the SAME key, and /media already
 * knows the difference: a human-named file gets five minutes and a
 * revalidation rather than the immutable year (see isContentAddressed), so a
 * new hero appears within minutes instead of never.
 */

/** One managed slot: what the storefront asks for, and what to call it. */
export interface SiteImage {
  /** The path under /media/ the storefront renders, and the bucket key. */
  readonly key: string;
  readonly label: string;
  /** What the picture is for, in the operator's language. */
  readonly note: string;
  /**
   * The key this slot used BEFORE it was managed here.
   *
   * Until the owner uploads a replacement, nothing exists at `key` — and a
   * hero that 404s is a worse outcome than a heavy one. /media falls back to
   * this, once, so the storefront can point at the new path today and the
   * picture keeps rendering until it is replaced. Drop the entry once the
   * slot has been uploaded.
   */
  readonly legacy?: string;
}

export const SITE_IMAGES: readonly SiteImage[] = [
  {
    key: "site/hero.webp",
    label: "Naslovna slika",
    note: "Velika slika na vrhu domače strani. Priporočena širina 2000 px ali več.",
    legacy: "hero.png",
  },
  {
    key: "site/kategorija-masazni-bazeni.webp",
    label: "Kategorija — masažni bazeni",
    note: "Slika kartice za družino masažnih bazenov na domači strani.",
    legacy: "Generated Image August 25, 2026 - 6_06PM Large.jpeg",
  },
  {
    key: "site/kategorija-swim-spa.webp",
    label: "Kategorija — swim spa",
    note: "Slika kartice za družino swim spa bazenov na domači strani.",
    legacy: "Generated Image August 25, 2026 - 6_26PM Large.jpeg",
  },
];

export function siteImageByKey(key: string): SiteImage | undefined {
  return SITE_IMAGES.find((s) => s.key === key);
}

/**
 * A slot addressed by its last path segment, which is what the URL carries.
 *
 * "site/hero.webp" is not URL-shaped as a single segment, so the panel's
 * routes use the stem — /admin/site/hero — and this resolves it back. Only a
 * name spelled out in SITE_IMAGES can ever resolve, so the route cannot be
 * used to write an arbitrary key.
 */
export function siteImageBySlug(slug: string): SiteImage | undefined {
  return SITE_IMAGES.find((s) => stemOf(s.key) === slug);
}

/** "site/hero.webp" → "hero" */
export function stemOf(key: string): string {
  const last = key.slice(key.lastIndexOf("/") + 1);
  const dot = last.lastIndexOf(".");
  return dot < 0 ? last : last.slice(0, dot);
}

/**
 * The legacy key a missing site image falls back to, or null.
 *
 * Deliberately NOT a general rule: it answers only for the three keys named
 * above, so it cannot be talked into proxying anything else.
 */
export function legacyFallback(key: string): string | null {
  return siteImageByKey(key)?.legacy ?? null;
}
