/**
 * The shop's hero image.
 *
 * Now served from Supabase through the Worker's /media/ proxy, like every
 * other picture on the site. It used to be a plate composed in the repo by
 * scripts/build-hero-plate.mjs — the supplier's studio cutout keyed off its
 * white sweep and set on a dark ground, because a 600px cutout is neither a
 * full-bleed photograph nor big enough to become one. The owner has since
 * uploaded a real banner, which needs none of that: it arrives as a hero
 * rather than as a product on a background.
 *
 * The build script stays. It is the right answer whenever the only imagery
 * available is a cutout on white, and that will be true again for the swim
 * spa line, which has no photography at all.
 *
 * ⚠️ NO INTRINSIC DIMENSIONS AND NO WIDTH LADDER, for the same two reasons
 * as own-media.ts. This build cannot reach the bucket to measure the file,
 * and inventing a size for an <img> is worse than omitting one because the
 * browser lays out against what it is told. The hero does not care: .st-hero
 * is 100svh and .st-hero-bg is inset:0 with object-fit:cover, so the section
 * reserves the box and the image never moves it.
 *
 * ⚠️ THE FILE IS A 346 KB JPEG, AND IT IS THE LCP ELEMENT. That replaced a
 * 2.78 MB PNG of the same job — an 8x cut on the largest element of the page
 * — but it is still not laddered: 346 KB goes to a 390 px phone exactly as it
 * goes to a 2560 px desktop. Re-uploading through /admin fixes that too: the
 * panel converts to WebP and writes a width ladder in the browser before it
 * uploads. The Supabase dashboard does neither.
 *
 * hero.png (the 2.78 MB PNG) is still in the bucket, unreferenced. So is a
 * 9 MB "6_06PM.jpg" original. Neither costs anything where it lies; both are
 * safe to delete from the dashboard.
 */

export interface HeroPlate {
  readonly src: string;
  /** Intrinsic size, where it is known. Absent for anything under /media/. */
  readonly w?: number;
  readonly h?: number;
  /** [file, intrinsic width] rungs, narrowest first. Empty without a ladder. */
  readonly widths: readonly (readonly [string, number])[];
}

export const OWN_HERO: Readonly<Partial<Record<string, HeroPlate>>> = {
  bazen: {
    // The 5_41PM banner, via the alias table (the bucket name has spaces).
    // A NEW URL on purpose, not a re-upload over hero.png: a different path
    // cannot be served stale by any cache, edge or browser, so the switch is
    // visible on the next deploy rather than whenever caches feel like it.
    src: "/media/hero-banner.jpeg",
    widths: [],
  },
};
