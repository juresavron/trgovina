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
 * ⚠️ THE FILE IS 2.78 MB OF PNG, AND IT IS THE LCP ELEMENT. On a typical
 * mobile connection that is over two seconds of download before the largest
 * element on the page can paint, against a 2.5 s budget for the whole page —
 * and with no width ladder, all of it goes to a 390 px phone exactly as to a
 * 2560 px desktop. The cheapest fix that keeps this exact picture is to
 * re-upload IT through /admin, which converts to WebP and writes a ladder in
 * the browser before uploading; that would cut it to roughly a tenth at no
 * visible cost. The 346 KB 5_41PM banner remains in the bucket, aliased as
 * hero-banner.jpeg, one line away if the owner changes their mind.
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
    // hero.png, BY THE OWNER'S CHOICE. The 5_41PM banner was wired in for
    // one deploy and the owner judged the previous image better, so it is
    // back — this line is an aesthetic decision, not a technical one, and
    // the technical caveat below survives it.
    src: "/media/hero.png",
    widths: [],
  },
};
