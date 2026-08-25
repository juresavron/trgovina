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
export type ProductArtKey =
  | "savna"
  | "kad"
  | "bazen"
  | "fotelj"
  | "kopalna"
  | "biljard";

const ART: Record<ProductArtKey, string> = {
  /* Infrared sauna — front-three-quarter cabin. The glass door and the heater
   * are what separate it from "a wooden box": both are kept. */
  savna:
    // roof, overhanging slightly to the right so the cabin is not symmetric
    '<path d="M44 44h150l14 10H58z"/>' +
    // body
    '<path d="M58 54h136v96H58z"/>' +
    // glass door, right of centre
    '<path d="M120 66h60v84h-60z"/>' +
    '<path d="M120 66v84"/>' +
    // door handle
    '<path d="M128 100v16"/>' +
    // wall slats, left of the door only
    '<path d="M72 60v90M86 60v90M100 60v90"/>' +
    // bench through the glass
    '<path d="M130 122h40"/><path d="M136 122v16M164 122v16"/>' +
    // heater, bottom left inside
    '<path d="M64 118h20v32H64z"/><path d="M68 126h12M68 134h12"/>' +
    // feet
    '<path d="M64 150v8M188 150v8"/>',

  /* Cold plunge tub — a TALL, ROUND barrel with the chiller that makes it a
   * plunge tub rather than a barrel. Proportion is doing real work here: this
   * shop and `bazen` both sell a vessel of water, and the pair only reads as
   * two different products if one is narrow and upright and the other is wide
   * and low. Keep it that way.
   *
   * The insulated lid leans clear of the tub on the left rather than in front
   * of it: unfilled line art has no occlusion, so anything drawn over the tub
   * shows its lines through and reads as a mistake, not as depth. */
  kad:
    // tub body, tapering to the base
    '<path d="M52 80l8 62a10 10 0 0 0 10 10h76a10 10 0 0 0 10-10l8-62"/>' +
    // rim
    '<ellipse cx="108" cy="80" rx="56" ry="13"/>' +
    // water line inside the rim
    '<path d="M62 94c12 6 28 9 46 9s34-3 46-9"/>' +
    // insulated lid, leaning on the floor to the left, clear of the tub
    '<path d="M18 154l12-68 14 4-12 68z"/>' +
    // chiller unit, right
    '<path d="M180 106h42v46h-42z"/>' +
    '<path d="M188 116h26M188 126h26"/>' +
    // hose from tub to chiller
    '<path d="M156 118c14 0 12 12 24 12"/>',

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

  /* Massage chair — side profile, reclined, footrest out. The silhouette is
   * the product, so every part has to touch the next one: an earlier version
   * left the footrest floating a few pixels off the seat and it read as a
   * chair beside an ottoman. */
  fotelj:
    // backrest, reclined back over the base
    '<path d="M64 120L48 62q-2-14 12-16l22-3q14-2 16 12l6 65z"/>' +
    // headrest seam
    '<path d="M50 68l48-7"/>' +
    // seat, meeting the backrest
    '<path d="M62 120h78v22H62z"/>' +
    // armrest, attached to the backrest
    '<path d="M100 98h46a8 8 0 0 1 8 8v14h-54z"/>' +
    // footrest, extended forward off the seat
    '<path d="M140 120h50a8 8 0 0 1 8 8v14a8 8 0 0 1-8 8h-50z"/>' +
    // calf slot
    '<path d="M150 132h34"/>' +
    // base and feet
    '<path d="M70 142h64v10H70z"/>' +
    '<path d="M78 152v6M126 152v6"/>',

  /* Freestanding bath — the slipper silhouette, one end genuinely higher in
   * the outline rather than an extra arc laid over it (that version drew a
   * line straight across the body and read as a drawing error). The
   * floor-standing tap is what stops it reading as a plunge tub. */
  kopalna:
    '<path d="M32 100C32 70 40 54 58 54c14 0 18 10 22 18h84c22 0 32 8 32 24 0 24-16 44-40 44H74C48 140 32 122 32 100z"/>' +
    // inner rim, following the same raised head end
    '<path d="M46 100c0-24 6-34 16-34 8 0 12 8 16 16h84c16 0 24 6 24 18 0 18-12 32-30 32H76C58 132 46 118 46 100z"/>' +
    // plinth
    '<path d="M62 140h112v12H62z"/>' +
    // floor-standing tap, right
    '<path d="M206 60v92"/><path d="M206 60h-16v8"/>' +
    '<path d="M198 152h16"/>',

  /* Billiard table — three-quarter view. Plan view is banned here: it was
   * drawn that way once and the pockets read as eyes and the bed as a mouth.
   * The shear of the perspective, the rack sitting off to one end and the cue
   * leaning outside the table are between them what keep it from resolving
   * into a face again. Six pockets and a rack name the product. */
  biljard:
    // rail top face
    '<path d="M68 68h138l-34 36H34z"/>' +
    // bed, inset inside the rails
    '<path d="M80 76h112l-28 20H62z"/>' +
    // apron, front and right end
    '<path d="M34 104v18h138v-18"/>' +
    '<path d="M172 122l34-38V68"/>' +
    // pockets: four corners plus the two middles of the long rails
    '<circle cx="68" cy="68" r="5"/><circle cx="206" cy="68" r="5"/>' +
    '<circle cx="34" cy="104" r="5"/><circle cx="172" cy="104" r="5"/>' +
    '<circle cx="137" cy="68" r="5"/><circle cx="103" cy="104" r="5"/>' +
    // racked balls, up at the far end, and the cue ball down at the near end
    '<path d="M148 80h28l-14 12z"/><circle cx="96" cy="88" r="4"/>' +
    // legs
    '<path d="M44 122h18v30H44z"/><path d="M150 122h18v30h-18z"/>' +
    // cue, leaning clear of the table on the left
    '<path d="M14 158L40 48"/>',
};

/**
 * Presentations of the one drawing, indexed by the card's position in its row.
 *
 * A shop has one drawing and its Best Sellers row has three cards, so the row
 * rendered as the same picture three times — which does not read as three
 * models of a sauna, it reads as a page that failed to load two images. That
 * is worse than the blank tile this replaced, because a blank tile at least
 * looks deliberate.
 *
 * These are the honest amount of difference a placeholder is entitled to: a
 * mirror is the same unit photographed from its other side, and a smaller one
 * on the same floor line is the smaller model in the range. Neither invents a
 * feature the shop has not told us about.
 *
 * The stroke on the scaled variant is divided back out, because a `scale(.86)`
 * takes a 3px line to 2.58 and the row would show one card drawn in a lighter
 * weight than its neighbours.
 */
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
