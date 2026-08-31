/**
 * The shop's mark: V.
 *
 * ⚠️ IT WAS TWO WAVES IN A ROUNDED SQUARE, AND AT 16px THAT WAS A FACE.
 *
 * The note that stood here reasoned from a premise that had stopped being
 * true. It opened "the business is called 'Masažni Bazen' — the product
 * category, verbatim … the domain matches it exactly", and neither half
 * holds: tenants/bazen.ts names the shop "Masažni bazeni Vrelec", and it
 * records why the bare category name was abandoned — masazni-bazen.si
 * belongs to somebody else and serves their site. The name has an ownable
 * proper noun in it now.
 *
 * The drawing had a worse problem than its rationale. Rasterised at a TRUE
 * 16×16 and magnified, the upper wave's crossing splits into two dark lobes
 * with a light gap and the shorter lower wave sits under them: it is a face,
 * on white and on the dark bar, and on the dark bar it is a white tile with a
 * squint. Three independent explorations rendered it and reported the same
 * thing; the fourth found the interior collapses to grey mush at 16px anyway.
 * The doctrine below was right and the drawing did not satisfy it — the
 * asymmetry defeated the hamburger glyph the note was worried about and did
 * nothing about the archetype the eye actually reaches for first.
 *
 * WHAT IT DRAWS NOW. The V of Vrelec, knocked out of a square. Three things
 * at once, which is why it beat a vessel, a spring, a bubble stream, a
 * thermal wedge and a surveyor's benchmark in the drawing rounds:
 *
 *   - It is the half of the name the shop can own. Every compression this
 *     brand undergoes drops "masažni bazeni" and keeps "Vrelec" — the card
 *     statement descriptor already says "BAZENI VRELEC" — and the chrome
 *     lockup now sets VRELEC over the category for the same reason.
 *   - It is a vessel in section: a container that holds, drawn rather than
 *     illustrated.
 *   - It is a funnel converging on one point, which is what a vrelec is —
 *     the place where the water comes up, not water as scenery.
 *
 * And it is the only shape in the category that is not blue, wavy or round.
 *
 * BUILT FOR 16px FIRST. A favicon is the smallest the identity ever gets and
 * the size at which most people meet it, so it was drawn there and checked
 * upward, not the reverse. Four consequences:
 *
 *   - The shape is FILLED, not stroked. A 2px stroke on a 24 viewBox is
 *     1.3px at 16px, which a display renders as a grey smear. The mark this
 *     replaces broke its own rule here: its waves were stroked paths.
 *   - The V is KNOCKED OUT through a mask rather than painted on top, so the
 *     mark is one colour and reads on any ground — the dark chrome bar, a
 *     white page, a browser tab in either theme.
 *   - ⚠️ EVERY EDGE SITS ON A MULTIPLE OF 1.5, which is what makes it crisp:
 *     in a 24 viewBox, 1.5 lands on an integer device pixel at 16, 24, 32,
 *     64 and 160. The old body was x=2, width=20 — off-grid at every one of
 *     those sizes, picking up a grey fringe on all four edges. rx is 1.5 for
 *     the same reason, and the squarer corner is deliberate: a squircle
 *     inside the plate reads as a generic app tile.
 *   - The V's terminals are flat and inside the frame, and its apex is
 *     sharp. That is what separates it from a download chevron (a band open
 *     to both edges) and a play button (a triangle) — both tested.
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
  // The plate: a square with just enough corner to not be a box. Every
  // number is a multiple of 1.5 — see the note above on the pixel grid.
  '<rect x="1.5" y="1.5" width="21" height="21" rx="1.5"/>';

/**
 * The V, as a mask. One filled path, no strokes: a letterform with flat
 * terminals inside the frame, symmetric about x=12 — and that last clause is
 * now CHECKED rather than asserted, because for three drawing rounds it was
 * asserted and false. See the geometry note on MARK_WATER itself.
 *
 * ⚠️ THE NAME OF THIS CONSTANT IS NOW A LIE THAT COSTS NOTHING TO KEEP.
 * It is MARK_WATER because three renderings reference it and the mask id in
 * brandMark() is "st-brand-water-<key>"; renaming it would touch the header,
 * the favicon and the touch icon for no reader's benefit. What it means is
 * "the knockout".
 */
const MARK_WATER =
  // ⚠️ SEVEN VERTICES, AND EVERY ONE OF THEM MIRRORS. The drawing this
  // replaces did not, and the note above claimed it did.
  //
  //   x=3   outer top left        mirrors x=21   outer top right
  //   x=7.5 inner top left        mirrors x=16.5 inner top right
  //   x=12  inner apex            on the axis
  //   x=10.5, 13.5                the flat terminal, centred
  //
  // What was there ran "h5" on the left arm and "h4.2" on the right, and its
  // terminal spanned x=12 to x=13.7 — a point sitting 0.85 units right of the
  // axis of a 24-unit box, which is a 3.5% lean. Three rounds of drawing
  // review looked at it and nobody saw it, because that is exactly the size
  // of error an eye corrects for and a raster does not. It is now a gate:
  // scripts/verify-mark-symmetry.mjs mirrors the rendered bitmap and counts
  // the pixels that disagree — 2578 of them before this change, against a
  // budget of 5.
  //
  // Both arms are cut 4.5 wide at the top and both run at dx/dy = 0.5, so
  // they are parallel and the stroke is one constant 4.02 units across —
  // 2.7px at 16px, over the floor a display can render. Every coordinate is a
  // multiple of 1.5, which is the pixel-grid rule the plate already follows.
  '<path d="M3 4.5h4.5L12 13.5 16.5 4.5H21l-7.5 15h-3Z" fill="#000"/>';

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
