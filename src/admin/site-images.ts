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
  /** The heading this slot sits under in the panel. See SiteSlot.group. */
  readonly group: string;
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

const CHROME = "Slike strani";
const PAGES = "Vsebinske strani";
const HOME = "Domača stran";
const GALLERY = "Galerija na dnu strani";
const GUIDES = "Kartice vodnikov";

const CHROME_IMAGES: readonly SiteImage[] = [
  {
    key: "site/hero.webp",
    group: CHROME,
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
    group: CHROME,
    label: "Kategorija — masažni bazeni",
    note: "Kvadratna slika kartice za družino masažnih bazenov na domači " +
      "strani. Kvadrat, najbolje 1600 × 1600 px." + HOME_NOTE_TAIL,
    legacy: "Generated Image August 25, 2026 - 6_06PM Large.jpeg",
    ratio: [1, 1],
    maxWidth: 1600,
  },
  {
    key: "site/kategorija-swim-spa.webp",
    group: CHROME,
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
    group: HOME,
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
    group: HOME,
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
    group: HOME,
    label: "Zakaj mi — slika",
    note: "Kvadratna slika v pasu s prednostmi na domači strani, ob številki. " +
      "Kvadrat, najbolje 1200 × 1200 px." + HOME_NOTE_TAIL,
    fallbackOffset: 22,
    ratio: [1, 1],
    maxWidth: 1200,
  },
  // ⚠️ THE OTHER TWO TILES IN THIS BAND ARE object-fit: contain AND THE FIRST
  // ONE IS NOT. Measured off the rendered page: the room tile is 407 × 407
  // cover, the second is 407 × 283 contain and the third is 497 × 497 contain.
  // Same class on all three, different fit — .st-imp-quiet is the modifier.
  // So these two get NO ratio: cropping a frame that shows the picture whole
  // throws away content for nothing, and telling the operator to centre their
  // subject would be advice about a crop that never happens.
  {
    key: "site/zakaj-mi-2.webp",
    group: HOME,
    label: "Zakaj mi — druga slika",
    note: "Druga slika v pasu s prednostmi. Ta se NE obreže — vidi se cela, " +
      "v okvirju 3 : 2 ležeče. Najbolje 900 × 600 px.",
    fallbackOffset: 13,
    maxWidth: 900,
  },
  {
    key: "site/zakaj-mi-3.webp",
    group: HOME,
    label: "Zakaj mi — tretja slika",
    note: "Tretja, največja slika v pasu s prednostmi. Ta se NE obreže — vidi " +
      "se cela, v kvadratnem okvirju. Najbolje 1000 × 1000 px.",
    fallbackOffset: 31,
    maxWidth: 1000,
  },
];

/* ---- the gallery band ---------------------------------------------------
 *
 * The six-tile strip that scrolls near the foot of the home page. It is the
 * shop's own gallery, and it was six consecutive offsets into the product
 * photographs — consecutive on purpose, because six consecutive integers stay
 * distinct however the pool grows, so no tile ever repeated its neighbour.
 * That argument still decides what each tile FALLS BACK to; it no longer
 * decides what the band shows.
 *
 * Six separate cards rather than one multi-file upload, because each tile is
 * a fixed key the storefront names in code — the same reason every slot here
 * is fixed. An operator filling all six does six uploads; an operator who
 * wants to change one changes one.
 *
 * ⚠️ 6–11, NOT THE 25–30 THE STRIP USED TO CARRY, BECAUSE 25 WAS ALREADY
 * TAKEN. closing.ts chose 25–30 to clear every other offset on the page and
 * wrote down which ones those were: "2 and 13 (editorial tiles), 5 (hero), 7
 * and 11 (statement), 9 (editorial room)". The statement band holds 23 and 25
 * today. The list went stale, nothing checked it, and offset 25 was resolving
 * for both the story band's large frame and this strip's first tile — the same
 * photograph twice on one page, which is the exact fault that comment exists
 * to prevent.
 *
 * A prose list of taken numbers cannot hold. site-images.test.ts asserts the
 * resolved photographs are all distinct instead, so the next edit that
 * collides fails a test rather than shipping a duplicate.
 */
/* ---- the buying-guide cards --------------------------------------------
 *
 * Three square cards under "Preden kupite masažni bazen". They had no picture
 * at all: the scrim over them is a gradient built to carry white copy over a
 * PHOTOGRAPH, and with nothing behind it the card rendered as a grey rectangle
 * fading to black. Reported as "images are missing", which is what it looked
 * like.
 */
const GUIDE_IMAGES: readonly SiteImage[] = [12, 14, 15].map(
  (offset, i): SiteImage => ({
    key: "site/vodnik-" + String(i + 1) + ".webp",
    group: GUIDES,
    label: "Vodnik — slika " + String(i + 1),
    note: "Slika " + String(i + 1) + " od treh na karticah pod naslovom " +
      "»Preden kupite masažni bazen«. Kvadrat, najbolje 1200 × 1200 px. " +
      "Čez spodnjo tretjino gre temen preliv z naslovom, zato naj bo bazen " +
      "v zgornjih dveh tretjinah." + HOME_NOTE_TAIL,
    fallbackOffset: offset,
    ratio: [1, 1],
    maxWidth: 1200,
  }),
);

const GALLERY_IMAGES: readonly SiteImage[] = [6, 7, 8, 9, 10, 11].map(
  (offset, i): SiteImage => ({
    key: "site/galerija-" + String(i + 1) + ".webp",
    group: GALLERY,
    label: "Galerija — slika " + String(i + 1),
    // No ratio: the tiles are object-fit: contain, so each picture is shown
    // whole inside a square. Measured, like every other shape here.
    note: "Slika " + String(i + 1) + " od šestih v traku na dnu domače strani. " +
      "Ta se NE obreže — vidi se cela, v kvadratnem okvirju. Najbolje " +
      "900 × 900 px.",
    fallbackOffset: offset,
    maxWidth: 900,
  }),
);

/**
 * Every managed slot, in the order the panel lists them: the chrome first —
 * the hero and the two category cards a visitor meets before anything else —
 * then the pictures the home page composes with further down.
 */
/* ---- the content pages' photograph bands --------------------------------
 *
 * The `figure` blocks on /o-nas, /ogled-lokacije and /dostava-in-montaza
 * (see content/pages.ts). Same mechanism as everything above: a fixed stem
 * the storefront names in code, a fallback into the shop's own photography
 * until the owner uploads something better — a picture of the team, the van,
 * a finished installation. The pages read correctly either way; these slots
 * exist so that the day such a photograph exists it can go live without a
 * deploy.
 *
 * ⚠️ OFFSETS MUST RESOLVE DISTINCT — site-images.test.ts holds the whole
 * registry to that, because a prose list of taken numbers already went stale
 * once (see the gallery note above). */
const PAGE_IMAGES: readonly SiteImage[] = [
  {
    key: "site/o-nas-1.webp",
    group: PAGES,
    label: "O nas — prva slika",
    note: "Slika med odstavki na strani »O nas«, pod »Kaj delamo«. Široka " +
      "(razmerje 5 : 2), najbolje 1800 × 720 px." + HOME_NOTE_TAIL,
    fallbackOffset: 17,
    ratio: [5, 2],
    maxWidth: 1920,
  },
  {
    key: "site/o-nas-2.webp",
    group: PAGES,
    label: "O nas — druga slika",
    note: "Slika na strani »O nas«, pod tabelo »Kaj pogledamo ob ogledu lokacije«. Široka " +
      "(razmerje 5 : 2), najbolje 1800 × 720 px." + HOME_NOTE_TAIL,
    fallbackOffset: 27,
    ratio: [5, 2],
    maxWidth: 1920,
  },
  {
    key: "site/ogled-lokacije.webp",
    group: PAGES,
    label: "Ogled lokacije — slika",
    note: "Slika na strani »Ogled lokacije«, pod »Kaj pripravite za ogled«. Široka (razmerje " +
      "5 : 2), najbolje 1800 × 720 px." + HOME_NOTE_TAIL,
    fallbackOffset: 29,
    ratio: [5, 2],
    maxWidth: 1920,
  },
  {
    key: "site/dostava.webp",
    group: PAGES,
    label: "Dostava — slika",
    note: "Slika na strani »Dostava in montaža«. Široka (razmerje 5 : 2), " +
      "najbolje 1800 × 720 px." + HOME_NOTE_TAIL,
    fallbackOffset: 33,
    ratio: [5, 2],
    maxWidth: 1920,
  },
];

export const SITE_IMAGES: readonly SiteImage[] = [
  ...CHROME_IMAGES,
  ...HOME_IMAGES,
  ...GUIDE_IMAGES,
  ...GALLERY_IMAGES,
  ...PAGE_IMAGES,
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
