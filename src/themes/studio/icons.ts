/**
 * STUDIO icon set — geometry lifted verbatim from the source theme's own SVG
 * assets (shipped in its `_files` bundle), not redrawn by eye.
 *
 * THE ARROW IS THE BRAND MOTIF. It is a **stadium**, not a circle: a 35×23
 * rounded rectangle (rx 11.5) on a 36×35 canvas, 1px stroke, with a thin
 * shaft-and-head arrow spanning x12→x24 through the middle. The source ships
 * it in two inks — #fff for dark bands, #4D4D4D for light — which we express
 * as `currentColor` so a single path serves both.
 *
 * The same stadium, scaled enormous and set a few percent off the background,
 * is the faint watermark behind the hero's message panel and the testimonial
 * heading. Reading that shape as an "eye" is the easy mistake; it is the arrow
 * outline, and drawing it as a circle loses the theme's signature.
 */

/** Shared canvas + stroke geometry for the stadium outline. */
const STADIUM =
  "M12 6h12c6.351 0 11.5 5.149 11.5 11.5S30.351 29 24 29H12C5.649 29 .5 23.851.5 17.5S5.649 6 12 6Z";

/** Arrow glyph paths — shaft x12→x24, head 3.18u, centred on y17.5. */
const ARROW_RIGHT =
  "M24.354 17.146a.5.5 0 0 1 0 .708l-3.182 3.181a.5.5 0 1 1-.707-.707l2.828-2.828-2.828-2.828a.5.5 0 1 1 .707-.708zM12 17.5V17h12v1H12z";
const ARROW_LEFT =
  "M11.646 17.854a.5.5 0 0 1 0-.708l3.182-3.182a.5.5 0 1 1 .708.708L12.707 17.5l2.829 2.828a.5.5 0 1 1-.708.707zM24 17.5v.5H12v-1h12z";

/**
 * The stadium-framed arrow, exactly as the source draws it.
 * `currentColor` carries the ink so one glyph serves dark and light bands.
 */
export function arrowIcon(dir: "left" | "right"): string {
  return (
    '<svg class="st-arrow-svg" viewBox="0 0 36 35" width="36" height="35" fill="none" aria-hidden="true" focusable="false">' +
    '<path stroke="currentColor" d="' + STADIUM + '"/>' +
    '<path fill="currentColor" d="' + (dir === "right" ? ARROW_RIGHT : ARROW_LEFT) + '"/>' +
    "</svg>"
  );
}

/**
 * The band watermark is NOT the stadium. The owner's reference frames settle
 * this: behind the offer panel and the testimonial heading sits a large
 * concentric ELLIPSE — a thin outer ring with a solid, slightly darker disc
 * inside it, both a step off the band's ground.
 *
 * The stadium above is the arrow's frame and belongs to buttons; using it here
 * put the wrong mark across two whole bands. Both readings have been wrong
 * once, in opposite directions, which is why each now says what it is for.
 *
 * Always aria-hidden — it carries no meaning. preserveAspectRatio="none" lets
 * it stretch to whatever band it backs.
 */
export function discWatermark(): string {
  return (
    '<svg class="st-watermark" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">' +
    '<ellipse cx="50" cy="50" rx="49.6" ry="49.6" stroke="currentColor" stroke-width="0.5"/>' +
    '<ellipse cx="50" cy="50" rx="26" ry="26" fill="currentColor" fill-opacity="0.55"/>' +
    "</svg>"
  );
}

/** Chrome-bar glyphs: magnifier and basket, matched to the arrow's 1px weight. */
export function searchIcon(): string {
  return (
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true" focusable="false">' +
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 21 21" stroke-linecap="round"/></svg>'
  );
}

export function basketIcon(): string {
  return (
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true" focusable="false">' +
    '<path d="M3 8h18l-1.6 11.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8L3 8Z" stroke-linejoin="round"/>' +
    '<path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" stroke-linecap="round"/></svg>'
  );
}

/**
 * The product page's assurance row — delivery, returns, payment, help.
 *
 * Same construction as the chrome glyphs above: a 24-unit box, 1.4 stroke, no
 * fill, currentColor. Drawn rather than pulled from an icon set because four
 * glyphs is not worth a dependency, and because a set would arrive with its
 * own grid and stroke weight and quietly stop matching the arrow.
 */
function glyph(paths: string): string {
  return (
    '<svg class="st-assure-i" viewBox="0 0 24 24" width="18" height="18" fill="none" ' +
    'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false">' + paths + "</svg>"
  );
}

/** A box on a flatbed — delivery. */
export function truckIcon(): string {
  return glyph(
    '<path d="M1.5 6.5h12v10h-12z"/><path d="M13.5 10h4l3 3v3.5h-7z"/>' +
    '<circle cx="6" cy="18.5" r="2"/><circle cx="17" cy="18.5" r="2"/>',
  );
}

/** An arrow turning back on itself — returns. */
export function returnIcon(): string {
  return glyph(
    '<path d="M3.5 9.5h11a5 5 0 0 1 0 10H8"/><path d="M7 5.5 3 9.5l4 4"/>',
  );
}

/** A shield — secure payment. */
export function shieldIcon(): string {
  return glyph(
    '<path d="M12 2.8 20 6v6c0 4.4-3.2 7.7-8 9.2-4.8-1.5-8-4.8-8-9.2V6z"/>' +
    '<path d="m8.6 12 2.3 2.3 4.5-4.6"/>',
  );
}

/** A question in a circle — support. */
export function helpIcon(): string {
  return glyph(
    '<circle cx="12" cy="12" r="9"/>' +
    '<path d="M9.4 9.3A2.7 2.7 0 0 1 12 7.4c1.5 0 2.7 1 2.7 2.4 0 2.2-2.7 2-2.7 4"/>' +
    '<path d="M12 17.2h.01"/>',
  );
}
