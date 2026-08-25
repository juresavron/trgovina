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
 * The ladder is the real cost here, and it is the LCP element: one 187 KB
 * file goes to a 390px phone and a 2560px desktop alike. Supabase's free plan
 * has no image transformation and Cloudflare Image Resizing is unavailable on
 * workers.dev, so the fix is to upload through /admin — which converts and
 * ladders in the browser before it uploads — rather than through the Supabase
 * dashboard, which does neither.
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
    src: "/media/product-banner.webp",
    widths: [],
  },
};
