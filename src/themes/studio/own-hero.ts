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
 * ⚠️ THIS FILE IS 2.78 MB OF PNG, AND IT IS THE LCP ELEMENT.
 *
 * Two separate problems, both fixable in one upload:
 *
 * FORMAT. PNG is lossless and made for flat colour and sharp edges — logos,
 * screenshots, line art. A photograph has neither, so PNG stores its noise
 * faithfully and at full price. The same picture as WebP is normally a tenth
 * of this; the banner it replaced was 187 KB.
 *
 * SIZE. 2.78 MB is not a slow hero, it is a broken one. On a typical mobile
 * connection that is well over two seconds of download before the largest
 * element on the page can paint at all — and the LCP budget for the whole
 * page is 2.5 s. The site's entire competitive argument is that it loads
 * faster than the incumbents; this single file spends that argument.
 *
 * There is also still no width ladder, so those 2.78 MB go to a 390 px phone
 * exactly as they go to a 2560 px desktop.
 *
 * All three are what /admin exists to prevent: it converts to WebP and writes
 * a width ladder IN THE BROWSER before it uploads. The Supabase dashboard
 * does neither. Re-uploading this one file through the panel fixes the
 * format, the weight and the ladder together.
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
    src: "/media/hero.png",
    widths: [],
  },
};
