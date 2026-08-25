/**
 * The shop's mark.
 *
 * WHY A MARK AT ALL, AND WHY THIS ONE. The business is called "Masažni
 * Bazen" — the product category, verbatim. That is deliberate and it is
 * excellent for search, because the domain matches it exactly. It is also
 * the hardest possible name to look like a company rather than a listings
 * page, and the wordmark alone cannot fix that: set any category noun in a
 * nice face and it still reads as a heading. A mark is what turns a noun
 * into a signature, so here the mark carries the identity and the words
 * carry the keyword.
 *
 * WHAT IT DRAWS. The vessel and the water in it. Every model this shop sells
 * is a square acrylic shell — product-art.ts learned that the hard way, from
 * photographs, after drawing an oval one — so the silhouette is a rounded
 * square, and two waves are cut out of it. Not a droplet and not three loose
 * waves: both are the stock imagery of every plumber and pool cleaner in
 * Europe, and neither says "a thing you sit in".
 *
 * BUILT FOR 16px FIRST. A favicon is the smallest the identity ever gets and
 * the size at which most people meet it, so it was drawn there and checked
 * upward, not the reverse. Three consequences:
 *
 *   - The shape is FILLED, not stroked. A 2px stroke on a 24 viewBox is
 *     1.3px at 16px, which a display renders as a grey smear.
 *   - The waves are KNOCKED OUT through a mask rather than painted on top,
 *     so the mark is one colour and reads on any ground — the dark chrome
 *     bar, a white page, a browser tab in either theme.
 *   - The two waves differ in length and offset. Two equal horizontal slots
 *     in a rounded square is the universal hamburger-menu glyph; the
 *     asymmetry is what stops a tab icon reading as a menu button.
 *
 * currentColor throughout, so the host decides the ink and the mark inverts
 * for free.
 */

/**
 * The mark's geometry, shared by every rendering of it.
 *
 * Kept as one string because the header and the favicon must not drift: a
 * favicon that is a slightly different drawing from the logo is the kind of
 * error nobody reports and everybody half-notices.
 */
const MARK_BODY =
  // The shell: a rounded square, filled.
  '<rect x="2" y="2" width="20" height="20" rx="5.5"/>';

/**
 * The water, as a mask. Two waves at different lengths, the lower one
 * shifted right, each a stroked curve with round caps so the ends stay soft
 * when the renderer starts dropping pixels.
 */
const MARK_WATER =
  '<path d="M6.4 10.2c1.3-1.15 2.6-1.15 3.9 0s2.6 1.15 3.9 0 2.6-1.15 3.9 0" ' +
  'fill="none" stroke="#000" stroke-width="2.1" stroke-linecap="round"/>' +
  '<path d="M8.3 15.1c1.1-1.05 2.2-1.05 3.3 0s2.2 1.05 3.3 0" ' +
  'fill="none" stroke="#000" stroke-width="2.1" stroke-linecap="round"/>';

/**
 * The mark for use inside the page, in the current ink.
 *
 * aria-hidden: it sits inside the home link, whose accessible name already
 * says the shop's name and where it goes. Announcing the logo as well would
 * make the one link in the header read its label twice.
 */
export function brandMark(key: string, cls = "st-brand-mark"): string {
  // `key` MUST be unique per page. An SVG mask is referenced by id, and ids
  // are document-global — the mark renders twice on every page (the header
  // lockup and the footer wordmark), so a fixed id is a duplicate id. The
  // structural audit caught exactly that, which is the argument for the
  // audit: two masks sharing an id is not a rendering bug you would notice,
  // it is a validity one that only a machine reads.
  const id = "st-brand-water-" + key;
  return (
    '<svg class="' + cls + '" viewBox="0 0 24 24" fill="currentColor" ' +
    'aria-hidden="true" focusable="false">' +
    '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">' +
    '<rect width="24" height="24" fill="#fff"/>' + MARK_WATER +
    "</mask>" +
    '<g mask="url(#' + id + ')">' + MARK_BODY + "</g>" +
    "</svg>"
  );
}

/**
 * The same drawing as a standalone favicon document.
 *
 * ⚠️ THIS FILE IS SERVED, SO IT CANNOT USE currentColor. A favicon has no
 * host to inherit ink from; the browser paints it against a tab strip whose
 * colour it never tells us. So the ink is explicit, and it is the theme's own
 * near-black rather than pure black.
 *
 * The dark-scheme block is what stops it disappearing: a near-black mark on
 * a dark tab strip is a hole where an icon should be, and Chrome and Firefox
 * both honour prefers-color-scheme inside an SVG favicon. Safari does not
 * yet, which is why the shape is a solid mass — a solid dark square is still
 * FINDABLE on a dark strip, where a thin outline would not be.
 */
export function faviconSvg(): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
    "<style>" +
    ":root{--i:#151515}" +
    "@media (prefers-color-scheme:dark){:root{--i:#ffffff}}" +
    "</style>" +
    '<mask id="w" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">' +
    '<rect width="24" height="24" fill="#fff"/>' + MARK_WATER +
    "</mask>" +
    '<g mask="url(#w)" fill="var(--i)">' + MARK_BODY + "</g>" +
    "</svg>"
  );
}

/**
 * The touch icon: the same mark, but on its own plate.
 *
 * iOS draws the file it is given with no background of its own and then
 * rounds the corners itself, so a transparent icon lands as a floating shape
 * on whatever the user's wallpaper happens to be. The plate is therefore
 * part of the artwork, and the mark is inset to survive the platform's own
 * corner radius.
 */
export function touchIconSvg(): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">' +
    '<rect width="180" height="180" fill="#151515"/>' +
    '<g transform="translate(38 38) scale(4.333)">' +
    '<mask id="w" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">' +
    '<rect width="24" height="24" fill="#fff"/>' + MARK_WATER +
    "</mask>" +
    '<g mask="url(#w)" fill="#ffffff">' + MARK_BODY + "</g>" +
    "</g></svg>"
  );
}
