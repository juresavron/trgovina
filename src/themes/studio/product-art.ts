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

  /* Hot tub — wide, low, panelled cabinet. Read against the plunge tub it has
   * to be obviously bigger and obviously for sitting in, so it gets the things
   * a plunge tub does not have: cabinet seams, a seat ledge, a headrest, a
   * topside control panel and a set of steps.
   *
   * The headrest and the control panel are drawn open-bottomed, so they sit ON
   * the rim instead of crossing it. The steps stand clear of the cabinet for
   * the same reason as the plunge tub's lid. */
  bazen:
    // rim
    '<ellipse cx="104" cy="86" rx="76" ry="18"/>' +
    // inner seat ledge
    '<ellipse cx="104" cy="89" rx="57" ry="12"/>' +
    // cabinet, wide and low, soft-cornered at the floor
    '<path d="M28 86v52q0 12 12 12h128q12 0 12-12V86"/>' +
    // cabinet panel seams
    '<path d="M72 96v52M138 96v52"/>' +
    // jets on the near inner wall, unevenly spaced so they never pair as eyes
    '<circle cx="78" cy="96" r="4"/><circle cx="106" cy="99" r="4"/>' +
    '<circle cx="132" cy="95" r="4"/>' +
    // headrest, resting on the far rim left of centre — long and low, because
    // a tall one reads as a carry handle
    '<path d="M56 76v-4a3 3 0 0 1 3-3h38a3 3 0 0 1 3 3v4"/>' +
    // topside control panel
    '<path d="M130 78v-5h20v5"/>' +
    // steps, one stair profile standing clear to the right: two rectangles
    // stacked here read as a second cabinet, a cut profile reads as treads
    '<path d="M186 156h46v-16h-23v-16h-23z"/>',

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
