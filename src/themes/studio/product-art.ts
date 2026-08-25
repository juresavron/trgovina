/**
 * Per-shop product illustrations.
 *
 * WHY THIS EXISTS. Every product slot on the storefront was a rounded
 * rectangle at 12% opacity with a soft shadow under it — which is to say, an
 * empty grey box. Screenshotting the built pages made that impossible to miss:
 * the hero's left panel, all three Best Sellers cards, the category rail and
 * the impact grid were the same blank tile repeated eight times down the page.
 * No amount of type or spacing polish fixes a page whose subject is missing.
 *
 * The honest options were a photograph or a drawing. A photograph we do not
 * have — the source theme's bundle is furniture, and a dining chair standing in
 * for a sauna is not a placeholder, it is a false claim about the goods (see
 * media.ts). So: a drawing, per shop, of the thing that shop actually sells.
 *
 * A line drawing is the right register for this. It reads instantly as an
 * illustration rather than as a photograph, so it cannot be mistaken for the
 * product shot it is standing in for, and it still tells a visitor what is on
 * the page. When real photography arrives it replaces this at one call site.
 *
 * DRAWING RULES, learned the hard way. An earlier attempt at this drew a pool
 * table from above; the jets read as eyes and the felt as a mouth, and it
 * looked like a cartoon face until someone actually looked at a render. So:
 *
 *   - side or three-quarter elevation, never plan view;
 *   - asymmetric composition — symmetry plus two round shapes is a face;
 *   - one recognisable silhouette per shop, carried by the outline alone;
 *   - detail only where it names the product (a sauna's heater, a plunge
 *     tub's chiller, a table's pockets), never texture for its own sake.
 *
 * Geometry is a 240×180 viewBox with the object sitting on an implied floor at
 * y≈150, so every shop's art has the same optical weight and baseline in the
 * panel. Stroke is currentColor so the host controls ink; the panel sets it.
 */

/** Shop keys that have their own drawing. */
export type ProductArtKey = "bazen" | "swimspa";

const ART: Record<ProductArtKey, string> = {
  /* Hot tub — a SQUARE acrylic spa in three-quarter view.
   *
   * It was an oval rim on a rectangular cabinet, and the photography that
   * arrived shows why that was wrong: all three models are square shells with
   * a square rim and lit cabinet panels. On the Best Sellers row the drawing
   * stood between two photographs of square tubs, describing a round one.
   * A placeholder may be a drawing; it may not be a drawing of a different
   * shape of product.
   *
   * Read against the plunge tub it still has to be obviously bigger and
   * obviously for sitting in — but the proportion already does that work
   * (kad is tall and round, this is wide and low), so the rim does not have
   * to. What separates them now is what the photographs actually show: a
   * square plan, LED strips banding the cabinet, headrests on the far rim.
   *
   * The headrests and the control panel are drawn open-bottomed so they sit ON
   * the rim rather than crossing it — unfilled line art has no occlusion, and
   * anything drawn over the shell shows through and reads as a mistake. */
  bazen:
    // top rim, a square plan in three-quarter view. Deliberately NOT a
    // symmetric diamond: the back corner sits right of the front one, so the
    // two visible faces are different widths and the shape reads as an object
    // rather than as a motif.
    '<path d="M96 116L20 86l92-30 76 30z"/>' +
    // inner seat ledge, the same plan inset
    '<path d="M96 104L36 84l76-22 60 22z"/>' +
    // cabinet, dropping from the three near corners to the floor
    '<path d="M20 86v42l76 22 92-24V86"/>' +
    // the near vertical corner, where the two lit faces meet
    '<path d="M96 116v34"/>' +
    // LED strips banding both faces, the detail that names these models
    '<path d="M27 99l64 19M27 111l64 19"/>' +
    '<path d="M101 118l80-21M101 130l80-21"/>' +
    // jets on the inner shell, unevenly spaced so no two ever pair as eyes
    '<circle cx="70" cy="88" r="3"/><circle cx="99" cy="82" r="3"/>' +
    '<circle cx="127" cy="88" r="3"/><circle cx="146" cy="79" r="2.5"/>' +
    // ONE headrest, lying ALONG the far-left rim rather than standing off it,
    // and inside the shell line: drawn a few units out it poked past the rim
    // and read as a handle welded to the outside of the tub. A second one on
    // the far-right rim collided with the control panel and the pair printed
    // as a single dark blob at card size — at 372px wide there is room for
    // one of them, not both.
    '<path d="M64 80l22-6 2 7-22 6z"/>' +
    // topside control panel, in the band between the outer rim and the ledge
    '<path d="M140 68l16 6-3 4-16-6z"/>',

  /* Swim spa — the SAME three-quarter view as the hot tub above, on a shell
   * four times as long. That contrast is the drawing's whole job: these two
   * sit side by side in the categories row, and if a visitor cannot tell at a
   * glance which one they are looking at, the row has failed at the one thing
   * it exists to do.
   *
   * So the proportion is the content. A hot tub is 1.95-2.30 m square; these
   * run 3.90-5.80 m long and about 2.28 m wide, and the plan here is drawn to
   * roughly that ratio rather than to whatever filled the box nicely.
   *
   * The counter-current jet is the other half of the identity — it is what
   * makes this a swim spa rather than a long hot tub — so it gets a nozzle
   * and three flow lines running down the length. Drawn as flow rather than
   * as three more round jets on purpose: a cluster of circles at one end is
   * how the earlier billiard drawing turned into a face.
   */
  swimspa:
    // top rim, a long plan. A true parallelogram — both pairs of edges are
    // exactly parallel — so it reads as an object in perspective rather than
    // as a wonky quadrilateral.
    //
    // The DEPTH is what took two passes. Drawn shallower, the rim closed to a
    // sliver, the interior vanished and the whole thing printed as a plank
    // with a stripe on it. A swim spa is 2.28 m across, which is wider than
    // the hot tub above, not narrower — the length is what differs, and the
    // width has to stay honest for the length to read at all.
    '<path d="M26 126L72 90l144-16-46 36z"/>' +
    // inner seat ledge, inset along both edge directions
    '<path d="M49 117L76 96l117-13-27 21z"/>' +
    // cabinet: the near long face, dropping to the floor
    '<path d="M26 126v26l144-16v-26"/>' +
    // the left end face, which is what gives the shell its depth
    '<path d="M72 90v26l-46 36"/>' +
    // LED strips banding the near face, parallel to its top edge
    '<path d="M32 136l132-15M32 145l132-15"/>' +
    // The counter-current nozzle and the current it makes. This is the whole
    // identity of the category — a unit without it is a long hot tub — and it
    // is drawn as FLOW rather than as three more round jets on purpose: a
    // cluster of circles at one end is how the billiard table turned into a
    // face two passes ago.
    '<circle cx="92" cy="104" r="3.5"/>' +
    '<path d="M104 102l40-4M104 109l52-5"/>' +
    // headrests on the far rim, lying along it
    '<path d="M108 87l22-2 2 5-22 2z"/>' +
    '<path d="M152 84l20-2 2 5-20 2z"/>' +
    // topside control panel, on the rim past the ledge
    '<path d="M188 80l14-2 4 3-14 2z"/>',
};

const VARIANTS: readonly string[] = [
  "",
  ' transform="translate(240 0) scale(-1 1)"',
  ' transform="translate(120 150) scale(.86) translate(-120 -150)" stroke-width="3.49"',
];

/**
 * The illustration for a shop, or null when that shop has none.
 *
 * Returning null rather than a generic box is deliberate: a shop with no
 * drawing should fall back to the neutral panel, not to a picture of something
 * it does not sell.
 *
 * `variant` cycles through the presentations above; pass a card's index and
 * neighbouring cards will differ.
 */
export function productArt(shopKey: string, variant = 0): string | null {
  const art = ART[shopKey as ProductArtKey];
  if (!art) return null;
  const g = VARIANTS[((variant % VARIANTS.length) + VARIANTS.length) % VARIANTS.length];
  return (
    '<svg class="st-art" viewBox="0 0 240 180" fill="none" ' +
    'stroke="currentColor" stroke-width="3" stroke-linejoin="round" ' +
    'stroke-linecap="round" aria-hidden="true" focusable="false">' +
    "<g" + g + ">" + art + "</g>" +
    "</svg>"
  );
}
