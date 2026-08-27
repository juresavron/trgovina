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

import { OWN_PHOTOS, pick } from "../themes/studio/media";

const MEDIA_PREFIX = "/media/";

/**
 * The seed pick() was called with on the pages these slots replaced.
 *
 * It is the shop key, and there is one shop. Written down rather than passed
 * in because a fallback that changed with the caller would resolve to a
 * different photograph depending on who asked, which is not a fallback.
 */
const FALLBACK_SEED = "bazen";

/** Said on every slot the frame CROPS, because it is the one thing that bites. */
const HOME_NOTE_TAIL =
  " Sliko obrežemo na sredino, zato naj bo bazen na sredini in ne ob robu.";

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
  /**
   * The pick() offset this slot used BEFORE it was managed, if it had one.
   *
   * Three slots on the home page were filled by pick(OWN_PHOTOS, shop, n) —
   * an offset into the shop's own photographs — so "the picture this slot used
   * to show" is not a filename anybody wrote down; it is the result of that
   * arithmetic against whatever the bucket holds today. Recording the OFFSET
   * rather than a key keeps the fallback correct as the catalogue changes, and
   * means the page renders exactly as it did until an upload replaces it.
   */
  readonly fallbackOffset?: number;
  /**
   * The shape the frame crops this picture to, as [w, h].
   *
   * ⚠️ MEASURED FROM THE RENDERED PAGE, not guessed. Every slot below carries
   * the ratio its frame actually paints at, so the panel can crop an upload to
   * exactly that before storing it — which is the difference between a
   * storefront that centre-crops whatever it was given and one that shows the
   * picture the operator saw in the panel.
   *
   * ABSENT WHERE THE FRAME DOES NOT CROP. The small story frame is
   * object-fit: contain — it shows the picture whole — so cropping an upload
   * for it would throw away the sides for nothing.
   */
  readonly ratio?: readonly [number, number];
  /**
   * The largest width worth storing, in pixels.
   *
   * Twice the CSS width the frame paints at, rounded up, so a 2× screen has
   * every pixel it can use and nothing beyond it. The hero is the exception
   * and gets 4K: it is the full viewport on a desktop, it is the largest
   * contentful paint on the page the whole SEO strategy rests on, and it is
   * the one picture where a visitor can see the difference.
   *
   * ⚠️ A CAP, NEVER A TARGET TO INFLATE TO. A smaller upload is stored at its
   * own size and the panel says so; scaling 1600 px up to 3840 in a canvas
   * adds no detail, only bytes, and makes the LCP worse to fix a number.
   */
  readonly maxWidth: number;
}

const CHROME_IMAGES: readonly SiteImage[] = [
  {
    key: "site/hero.webp",
    label: "Naslovna slika",
    // ⚠️ THE CROP IS THE THING TO SAY, not the file size. This picture fills
    // the whole screen at whatever shape the screen is: about 2:1 on a laptop
    // and about 1:2 on a phone held upright. Nothing resizes to fit — the
    // browser scales the image until it covers the box and cuts off whatever
    // hangs over the edge, from the CENTRE outward. So on a phone the visitor
    // sees a tall strip out of the middle and none of the sides.
    //
    // An operator told only "2000 px or more" uploads a wide garden shot with
    // the tub off to one side, and the phone shows the side of the garden the
    // tub is not in. Which is what happened.
    note: "Velika slika na vrhu domače strani. Najbolje 2560 × 1440 px " +
      "(razmerje 16:9), najmanj 2000 px široka. Slika se razteza čez cel " +
      "zaslon in se ob robovih obreže — na telefonu se vidi le sredinski " +
      "navpični pas — zato naj bo bazen na SREDINI slike in ne ob robu.",
    legacy: "hero.png",
    ratio: [16, 9],
    maxWidth: 3840,
  },
  {
    key: "site/kategorija-masazni-bazeni.webp",
    label: "Kategorija — masažni bazeni",
    note: "Kvadratna slika kartice za družino masažnih bazenov na domači " +
      "strani. Kvadrat, najbolje 1600 × 1600 px." + HOME_NOTE_TAIL,
    legacy: "Generated Image August 25, 2026 - 6_06PM Large.jpeg",
    ratio: [1, 1],
    maxWidth: 1600,
  },
  {
    key: "site/kategorija-swim-spa.webp",
    label: "Kategorija — swim spa",
    note: "Kvadratna slika kartice za družino swim spa bazenov na domači " +
      "strani. Kvadrat, najbolje 1600 × 1600 px." + HOME_NOTE_TAIL,
    legacy: "Generated Image August 25, 2026 - 6_26PM Large.jpeg",
    ratio: [1, 1],
    maxWidth: 1600,
  },
];

/* ---- the pictures the home page composes with --------------------------
 *
 * ⚠️ THESE THREE WERE CHOSEN BY ARITHMETIC UNTIL NOW. The story band and the
 * trust tile called pick(OWN_PHOTOS, shop, n) — a hash of the shop key plus an
 * offset — so the large atmospheric frame under the model grid held whichever
 * product photograph that landed on, and the only way to change it was to edit
 * an offset in this repository and deploy. An owner could upload sixteen
 * photographs and still not decide which one anchors their own front page.
 *
 * Naming them costs three cards in the panel and gives the owner the front
 * page back. Each keeps its old offset as a FALLBACK, so nothing changes on
 * the site until somebody uploads. */

const HOME_IMAGES: readonly SiteImage[] = [
  {
    key: "site/zgodba.webp",
    label: "Zgodba — velika slika",
    // Every note answers the two questions an operator actually has: WHERE
    // does this appear, and WHAT SHAPE should the file be. A note that says
    // "at least 2000 px" and nothing else is how the hero ended up with the
    // tub off to one side — see the note on that slot.
    note: "Velika slika v pasu »Naša zgodba« na domači strani, pod predstavitvijo " +
      "modelov. Skoraj kvadratna (826 × 850), najbolje 1400 × 1440 px." +
      HOME_NOTE_TAIL,
    fallbackOffset: 25,
    ratio: [826, 850],
    maxWidth: 1600,
  },
  {
    key: "site/zgodba-detajl.webp",
    label: "Zgodba — mala slika",
    // contain, not cover: this frame shows the picture WHOLE, so the advice
    // is the opposite of every other slot and has to say so.
    note: "Manjša slika levo od velike, v istem pasu. Pokončna (464 × 518), " +
      "najbolje 930 × 1040 px. Ta se NE obreže — vidi se cela, zato je " +
      "primerna za detajl ali izdelek na čisti podlagi.",
    fallbackOffset: 23,
    // No ratio: this frame is object-fit: contain and shows the picture whole.
    maxWidth: 1200,
  },
  {
    key: "site/zakaj-mi.webp",
    label: "Zakaj mi — slika",
    note: "Kvadratna slika v pasu s prednostmi na domači strani, ob številki. " +
      "Kvadrat, najbolje 1200 × 1200 px." + HOME_NOTE_TAIL,
    fallbackOffset: 22,
    ratio: [1, 1],
    maxWidth: 1200,
  },
];

/**
 * Every managed slot, in the order the panel lists them: the chrome first —
 * the hero and the two category cards a visitor meets before anything else —
 * then the pictures the home page composes with further down.
 */
export const SITE_IMAGES: readonly SiteImage[] = [...CHROME_IMAGES, ...HOME_IMAGES];

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
 * The key a missing site image falls back to, or null.
 *
 * Deliberately NOT a general rule: it answers only for the keys named above,
 * so it cannot be talked into proxying anything else.
 *
 * Two shapes of answer, because the slots arrived two ways. The hero and the
 * category cards name a FILE that was already in the bucket. The home-page
 * slots name an OFFSET, because what they used to show was the result of
 * pick(OWN_PHOTOS, shop, n) rather than a filename anybody chose — resolving
 * it here means the page keeps rendering exactly what it rendered before,
 * against whatever the bucket holds today, until an upload replaces it.
 *
 * "/media/<key>" is how OWN_MEDIA stores a path and the bucket key is what
 * this has to return, so the prefix comes off. A photograph served from
 * anywhere else could not be proxied and yields null rather than a guess.
 */
export function legacyFallback(key: string): string | null {
  const slot = siteImageByKey(key);
  if (!slot) return null;
  if (slot.legacy) return slot.legacy;
  if (slot.fallbackOffset === undefined || OWN_PHOTOS.length === 0) return null;
  const src = pick(OWN_PHOTOS, FALLBACK_SEED, slot.fallbackOffset).src;
  return src.startsWith(MEDIA_PREFIX) ? src.slice(MEDIA_PREFIX.length) : null;
}
