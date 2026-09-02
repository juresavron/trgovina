/**
 * STUDIO — commerce acts (docs/STUDIO-BASELINE.md §4.4 and §4.7).
 *
 *   §4.7 Best sellers / product grid — left-aligned heading at the gutter,
 *        three cards per row, built as a HAIRLINE-RULED TABLE. The source's
 *        grid is `gap:0` with `padding:1px`, and every card carries
 *        `box-shadow:0 0 0 1px #dfdfdf`. Two neighbours' rings land on the
 *        same seam, so the "grid lines" are not drawn by anything — they ARE
 *        the overlap. Card padding 32px; an --bg-alt panel holds the product —
 *        a MAT round a plate, so every cell presents the same size of picture
 *        whatever shape the file inside it is; name, then a price row
 *        (price · struck compare-at · VAT) beneath. HOVER TURNS THE FRAME
 *        BLACK — the signature card state.
 *   §4.4 Category rail — centred heading, 372×500 cards that PEEK past the
 *        viewport edges (the peek is what separates a rail from a grid),
 *        name (h6, the compact-card rung) + meta line (label), price in
 *        muted, and two 64px circular controls centred below.
 *
 * WHY THE GRID IS FLEX AND NOT GRID. The source ships exactly six products, so
 * `repeat(3, minmax(0,1fr))` always fills two whole rows and the ruled table is
 * always a rectangle. Our shops ship three cells (two products plus one
 * comparison tile) and that count is CONTENT, not layout — any count that is
 * not a multiple of three leaves the table with a notch cut out of its last
 * row, which reads as a rendering fault rather than as a short catalogue. A
 * wrapping flex row with `flex: 1 1 33.3%` seals it for free: the trailing
 * line's cards grow to share the full width, at every count and every
 * breakpoint, with no per-count arithmetic in the renderer and no inline style
 * carrying a number the stylesheet cannot see. What it costs: a short trailing
 * row is made of cards wider than the ones above them. That is the trade, and
 * it is the right way round — an oversized cell still reads as a table, a
 * missing cell reads as a bug.
 *
 * Cell count, at the ≥810px tiers (the source keeps three columns at tablet):
 *   1 → one full-width cell.
 *   2 → two half-width cells with one rule between them.
 *   3 → the source's row exactly: three equal cells. THIS IS TODAY'S SHOPS —
 *       two products and the comparison tile make a complete 3-up row, which
 *       is why the grid needs no special case for the catalogue we ship.
 *   4 → 2×2, via a `:has()` quantity query. It is the one count where the
 *       plain flex result (three, then a lone full-width fourth) looks worse
 *       than a smaller complete rectangle. Without `:has()` the fallback is
 *       that 3 + 1 — still sealed, just less pleasant.
 *   5 → 3 + 2, the pair sharing the second row at half width each.
 *   6 → the source's own 3×2.
 *   7, 8, 9, … → three per row; the trailing 1 or 2 share that row.
 * At ≤809px every count is a single column, which is the source's own phone
 * layout (its grid becomes `display:flex; flex-flow:column` there).
 *
 * ONE EXCEPTION, AND IT IS THE SHAPE THIS SHOP ACTUALLY SHIPS: a grid whose
 * LAST cell is the util tile freezes every product cell at exactly one column
 * and lets the tile alone grow to seal the line. Growing a product cell grows
 * its panel, and growing its panel makes the product inside it larger than the
 * identical product one row above — the home grid's five cells had the swim
 * spa rendering at 2.5x its own sibling's area for no reason but arithmetic.
 * The tile is type and does not care how wide it is. See the responsive block.
 *
 * TYPE COMES FROM THE RAMP IN tokens.ts, NEVER FROM A CLAMP. An earlier pass
 * eyeballed sizes off a 2000px screenshot and expressed each as a clamp whose
 * maximum was the measured px. The source's real ramp is three hard tiers
 * (≥1200 / 810–1199 / ≤809) that no clamp can reproduce — h6 is 24/19/22, so
 * the phone value is LARGER than the tablet one. Every font-size, weight,
 * tracking and leading below is therefore a var(--t-…/--w-…/--ls-…/--lh-…) and
 * the tier switch happens once, in tokens.ts. The clamps that survive here are
 * LENGTHS — card padding, rail-card width, internal spacing — not type.
 *
 * Content split between the two acts is deliberate, not lossy: the measured
 * §4.7 card carries name + price only, and the measured §4.4 rail card carries
 * name + a meta/price line — so `desc`/`meta` surface in the rail rather than
 * being bolted onto a grid card the baseline never gave a spec line to.
 *
 * No dead controls (§5.2): the rail's two controls are real anchors to
 * focusable card targets — prev to the first card, next to the last — so they
 * still act with the behaviour layer switched off, and behaviour.ts upgrades
 * them to step by one card. The source ships exactly two of them, not one per
 * card, and they sit centred BELOW the rail.
 *
 * THE CONTROL IS A 64px CIRCLE, and the baseline contradicts itself about it:
 * §4.4 calls the pair "stadium arrows (not circles)" from a screenshot, while
 * the Controls catalogue transcribes the real thing — "circular nav / carousel
 * button: 64px square, 99px radius, 2px #151515 ring, no fill", which is what
 * --ctrl-circle-size and --bw-ctrl exist for. The catalogue wins: it is read
 * off the source's own declarations, and a control this size is also the only
 * reading that clears WCAG 2.5.8 without padding a 36px glyph out to a hit area
 * larger than the thing you can see. What it costs is one line of CSS below:
 * icons.ts draws the arrow INSIDE its stadium, and a stadium nested in a ring
 * is two boundaries for one control, so the ring-framed variant hides the
 * glyph's own outline and keeps only the arrow.
 *
 * Token discipline (docs/THEMES.md): colors, radii, faces, gutter and rhythm
 * are var(--…) from tokens.ts, which is the single declaration site. Only the
 * four ratios/lengths this act measures and tokens.ts does not carry are
 * declared below. Every selector is scoped :root[data-theme="studio"] —
 * zarja/lednik/salon share this sheet.
 */

import { dotBind, esc, type RenderCtx } from "../../render/sections";
import { counted } from "../../lib/plural";
import { productArt } from "./product-art";
import { productImg } from "./media";
import { arrowIcon } from "./icons";
import type {
  ArtKey,
  Category,
  Collection,
  PdpContent,
  PdpPhoto,
  ProductCard,
  UtilCard,
} from "../../content/types";

export const STUDIO_COMMERCE_CSS = `
  /* ---- Values the baseline measures that tokens.ts does not carry ----
   * --studio-gutter, --studio-card-gap and the section rhythm are NOT among
   * them: tokens.ts declares those, and a second declaration here at equal
   * specificity would let sheet order decide the storefront's gutter. */
  :root[data-theme="studio"] {
    /* §4.7 card padding. The "~48px" in the baseline is a screenshot reading;
     * the source's own DOM sets --ddm5pd:32px on the card and 25px on its
     * tablet variant. Both sit on this curve at their own tier width (2.2vw is
     * 32px at 1455 and 25px at 1136), so one clamp reproduces the pair. */
    --studio-card-pad: clamp(20px, 2.2vw, 32px);
    /* §4.4 rail card. 372px, not the baseline's "~470": 470 is a screenshot
     * measure, and the source's DOM gives .framer-19gsl8j-container and the
     * card anchor inside it both a literal 372px. The correction is what makes
     * the peek work at all — at 470 a four-card rail still fits inside a
     * desktop scrollport and nothing is ever cut. The vw term keeps the pitch
     * proportional so the cut lands mid-card rather than on a seam. */
    --studio-rail-card: clamp(240px, 26vw, 372px);
    /* §4.4: the rail's track gap is 34px in the source, not the 24px card gap
     * tokens.ts carries — and the grid, now ruled, has no gap at all, so this
     * is the only gap left in the act. 372 + 34 = the source's 406px pitch,
     * which is what puts ~4.5 cards across its 1920px rail. */
    --studio-rail-gap: 34px;
    /* §4.7's product panel is a MAT AND A PLATE, and these two values are what
     * make every cell in the table read as the same size of object.
     *
     * The source's panel is 3/4 portrait — transcribed from a ~474x620 content
     * box — and that is the right frame for what it sells: a dining chair and
     * a floor lamp are tall. This shop sells 1.95 m hot tubs and 5.8 m swim
     * spas, and the bucket holds them as studio cutouts on a white sweep at
     * roughly 900x900 and 900x620: squat and long. Dropping those into a
     * portrait frame under object-fit: contain is precisely why the grid read
     * as unfinished. Measured at 1440 before this pass, the square cutout
     * painted 389x389 and the long one 389x268 in identical cells — one
     * product carrying 45% more ink than its neighbour, the swim spa hovering
     * half-size in the middle of an empty panel.
     *
     * Under contain a source narrower than its frame is height-limited and one
     * wider is width-limited, so the two painted areas are a1*H^2 and W^2/a2.
     * They are equal exactly when the frame's own ratio is the geometric mean
     * of the two sources: sqrt(1 x 900/620) = 1.205. 6/5 is that number to
     * within half a percent. Measured after, at 1440: 272x272 against 326x225,
     * an area ratio of 1.008 where it had been 1.452.
     *
     * The ratio belongs to the PLATE — the ground the picture sits on — rather
     * than to the panel, so it cannot drift as the mat around it changes with
     * the tier. The panel's height is the plate plus twice the mat and follows
     * from it, which is also what keeps the mat even on all four sides. */
    --studio-plate-ar: 6 / 5;
    /* The mat: the grey the panel shows around its plate, and the "generous
     * even padding" the whole cell reads on. It follows --studio-card-pad's
     * own 2.2vw curve, so at desktop the panel is inset from the card by the
     * same ~32px that the plate is inset from the panel and the cell reads as
     * two nested frames rather than as a picture with a border. The floor is
     * --gap-md rather than that clamp's 20px: at 390px the phone's single
     * column gives the panel 298px to work with, and 16px keeps a mat that is
     * plainly visible without taking another 8px off the product. */
    --studio-panel-pad: clamp(var(--gap-md), 2.2vw, var(--gap-xl));
    /* §4.4: the rail card's image area is the top ~55% — a shorter panel than
     * the grid's, which is what makes a rail card read as 372×500, not 372×800.
     * 3/2, not 4/3: inside a ~324px content box a 4/3 panel eats ~64% of the
     * card, while 3/2 lands at ≈ the measured 55%. */
    --studio-rail-panel-ar: 3 / 2;
  }

  /* Visually hidden. Local copy (chrome.ts has .st-vh, pdp.ts .st-pdp-vh) so
   * this module carries its own screen-reader text with no cross-file
   * dependency on sheet assembly order. */
  :root[data-theme="studio"] .st-shop-vh {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }

  /* ---- shared: photo-ready slot ------------------------------------- */
  /* Flatter and more neutral than zarja's lit scenes: studio's grounds are
   * white/grey, so the placeholder is a bordered mass plus a contact shadow.
   * A real photograph drops into .st-shot with zero restructuring. */
  :root[data-theme="studio"] .st-shot {
    position: absolute; inset: 0; z-index: 1;
  }
  /* The drawing sits in the panel with the same optical margin the mass had,
   * so a shop with art and a shop without still compose identically. Ink is
   * deliberately strong — the previous 12% is what made this slot invisible —
   * but stays below body ink so it reads as illustration, not as content. */
  :root[data-theme="studio"] .st-shot-art {
    position: absolute;
    inset: 10% 12% 16%;
    display: grid;
    place-items: center;
    color: color-mix(in srgb, var(--ink) 62%, transparent);
  }
  :root[data-theme="studio"] .st-shot-art .st-art {
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }
  :root[data-theme="studio"] .st-shot-mass {
    position: absolute;
    inset: 14% 15% 20%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--ink) 9%, transparent),
      color-mix(in srgb, var(--ink) 3%, transparent)
    );
  }
  /* contain, not cover: these are studio shots on a plain ground and cropping
   * one to fill the panel is how a tub loses a corner. */
  /* THE RAIL's panel holding a photograph goes WHITE, whole.
   *
   * The drawing needs the grey ground to read against; a studio shot taken on
   * white does not, and on grey its own background prints as a white rectangle
   * inside the panel — which looks like a broken crop rather than a product.
   * Matching the panel to the photograph's ground is what makes it read as one
   * object, and it is what the source does with its own cutouts.
   *
   * THE GRID's panel used to be in this selector and no longer is, because
   * whitening the whole panel solves the rectangle by deleting the panel: the
   * card behind it is white too, so a grid of white-sweep cutouts had no cell
   * boundary at all and its products appeared to float on the page at
   * unrelated sizes. It keeps the grey and moves the white to a PLATE inside
   * it — see .st-card-panel below. The rail is left as it is deliberately: its
   * cards are half the size, they sit on a scrolling track rather than inside
   * a ruled table, and nothing there was reading as broken. */
  :root[data-theme="studio"] .st-rail-panel:has(.st-shot-img) {
    background: var(--surface);
  }
  :root[data-theme="studio"] .st-shot-img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }
  /* The photograph leans in, the card does not move. Scale on the image
   * inside its clipped frame is the one hover a flat monochrome theme can
   * afford: no shadow, no lift, no layout, and the reduced-motion strip in
   * the kernel removes the transition wholesale. */
  :root[data-theme="studio"] .st-card .st-shot-img,
  :root[data-theme="studio"] .st-cat-img {
    transition: transform 0.6s ease-out;
  }
  :root[data-theme="studio"] .st-card:hover .st-shot-img,
  :root[data-theme="studio"] .st-card:focus-visible .st-shot-img,
  :root[data-theme="studio"] .st-cat-card:hover .st-cat-img,
  :root[data-theme="studio"] .st-cat-card:focus-visible .st-cat-img {
    transform: scale(1.035);
  }
  :root[data-theme="studio"] .st-shot-floor {
    position: absolute;
    left: 50%; bottom: 12%; transform: translateX(-50%);
    width: 60%; height: 8%;
    border-radius: var(--r-pill);
    background: radial-gradient(
      50% 50% at 50% 50%,
      color-mix(in srgb, var(--ink) 18%, transparent),
      transparent 72%
    );
  }

  /* ---- shared: section head ------------------------------------------ */
  /* Eyebrow → the label role, in the label FACE (DM Sans): the ramp gives
   * eyebrows, chips, badges and button words one rung, and it is not --f-body.
   * Leading is the tight label rung — a one-line eyebrow, and the ramp carries
   * no unitless 1 to fall back on. */
  :root[data-theme="studio"] .st-eyebrow {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    /* --ink-body, not --ink-mute: 16.1:1 on #ffffff at 14px tracked caps. */
    color: var(--ink-body);
  }
  /* Section heading → h2, the ramp's section rung (60/50/38). The measured
   * pass had it at 68–72px / 600 / −0.025em; the source tracks h2 at 0em and
   * sets it in the display weight — display type here is never negative-
   * tracked. */
  :root[data-theme="studio"] .st-sec-h {
    margin: clamp(12px, 1vw, 20px) 0 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--ink);
    /* A long Slovenian head term folds; it never pushes the band open. */
    max-width: 20ch;
    overflow-wrap: break-word;
    hyphens: none;
  }

  /* ---- §4.7 best sellers / product grid ------------------------------ */
  :root[data-theme="studio"] .st-shop {
    background: var(--bg);
    /* §3: ~130px vertical rhythm on light sections — tokens.ts owns the clamp
     * so every light band in the theme breathes on one number. */
    /* BOTTOM ONLY — see --studio-rhythm. This section shares the page's white
     * ground with its neighbour, so the separation between them is paid once,
     * here, exactly as the source pays it (0 40px 170px). Paying it on both
     * sides is what made every boundary twice the source's. */
    padding-block: 0 var(--studio-rhythm);
  }
  /* Left-aligned AT THE GUTTER (§4.7) — the grid heading is never centred.
   *
   * The space beneath it is now on the token scale at both ends — --gap-lg to
   * --gap-xl, 24px to 40px — where it used to run 28px to 68px. 68 was a
   * band-scale gap doing a component-scale job: at 1440 it measured 49px of
   * air between a 60px heading and the table it names, which is what made the
   * head read as a separate announcement rather than as the table's own
   * label. 40px is two thirds of the heading's own size, and it is the rung
   * tokens.ts already carries for exactly this distance. */
  /* The hub's title block is not a section of its own — it is the page's
   * title, and the band under it is its content. Two full sections of rhythm
   * between them put a screen of white between a heading and the thing it
   * heads. */
  :root[data-theme="studio"] .st-shop--title { padding-bottom: 0; }
  :root[data-theme="studio"] .st-fnd-link {
    color: var(--ink);
    text-underline-offset: 4px;
    display: inline-block;
    padding-block: 10px;
    margin-block: -10px;
  }
  :root[data-theme="studio"] .st-shop-head {
    margin-bottom: clamp(var(--gap-lg), 2.8vw, var(--gap-xl));
  }
  /* A HEADER THAT CARRIES AN INTRO IS TWO COLUMNS, NOT ONE STACK.
   *
   * The measures under it are both correct and were both being blamed for
   * something neither of them did. .st-sec-h caps at 20ch because a heading
   * set to the full band is a heading nobody can read the end of; .st-shop-
   * intro caps at 62ch because that is the measure. Stacked and left-aligned
   * inside a band that tokens.ts has just widened to 1560, though, the two
   * correct measures composed into one wrong object: measured on
   * /masazni-bazeni at 1920, an h1 667.4px wide over an intro 788.9px wide
   * inside a 1560px band — the header covered 50.6% of the page it heads and
   * the grid under it covered all of it. Stretching either measure to fill the
   * band would fix the picture by breaking the typography.
   *
   * So the composition changes instead and the measures do not: the title
   * block takes the left half, the intro takes the right, and the pair spans
   * the band: 741.6 + 76.8 + 741.6 = 1560px at 1920, 651.2 + 58.4 + 651.2 =
   * 1360 at 1440. Neither measure moved — the h1 still caps at its own 20ch
   * (667.4px) inside the left half and simply stops there.
   *
   * ⚠️ flex-start, AND IT WAS flex-end ONCE. Bottom-aligning the pair read
   * well while every intro was three or four lines — the intro's last line
   * sat on the heading's baseline. Then the hub's intro grew to nine lines
   * and the composition inverted: a two-line title bottom-pinned against a
   * nine-line column leaves the entire top-left of the page empty, and the
   * screenshot that reported it showed exactly that — a blank quarter-screen
   * above "Trgovina". Top-aligning holds for both shapes: a title reads as a
   * title at the top of its column whatever stands beside it.
   *
   * The eyebrow and the heading are wrapped as ONE object in the markup for
   * the same reason the util tile wraps its heading and paragraph (see
   * productCards): three loose children can only be a stack or a row, and this
   * head has to be a stack INSIDE a row. Doing it with row spans instead —
   * grid, intro spanning both rows — misaligns the bottoms whenever the intro
   * is the taller of the two, because grid splits that surplus evenly over
   * every spanned track (the same mechanism editorial.ts's .st-tst-fig
   * documents), and the hub's band heads carry no eyebrow at all.
   *
   * ≥1200 only: below that the band is not wide enough for two real measures
   * side by side, and the stack is the right composition again. */
  @media (min-width: 1200px) {
    :root[data-theme="studio"] .st-shop-head:has(> .st-shop-intro) {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      column-gap: clamp(40px, 4vw, 96px);
    }
    :root[data-theme="studio"] .st-shop-head:has(> .st-shop-intro) > .st-shop-title,
    :root[data-theme="studio"] .st-shop-head:has(> .st-shop-intro) > .st-shop-intro {
      /* Equal halves, and from a zero basis so the split is the band's
       * arithmetic rather than a race between two blocks' content widths. */
      flex: 1 1 0;
      min-width: 0;
    }
    :root[data-theme="studio"] .st-shop-head:has(> .st-shop-intro) > .st-shop-intro {
      /* Its top margin is the gap under a heading it no longer sits under. */
      margin-block-start: 0;
    }
  }
  /* THE RULED TABLE. gap: 0 and padding: 1px on the container, a 1px ring
   * on every card: two neighbours' rings land on the same seam, the later one
   * paints over the earlier, and what survives is a single 1px rule. Nothing
   * draws the lines between cells — the lines ARE the overlap, which is why
   * the block reads as one ruled table and not as six separated cards. The
   * ordinary gap this used to have is three characters of CSS and loses
   * exactly that — separated cards are a different design, not a looser one.
   *
   * The container's 1px padding is the other half of it: without it the
   * outermost ring paints 1px OUTSIDE the container, so the table's outer edge
   * would sit a pixel past the section gutter on all four sides.
   *
   * Flex rather than grid — the header carries the count-by-count reasoning.
   *
   * THE BASIS IS A PERCENTAGE AND THE COLUMN COUNT IS A PROPERTY OF THE CARD
   * COUNT, NOT OF THE WIDTH, and that is deliberate rather than left over.
   * A width-driven basis is the obvious answer to "the table is three across
   * at 1280 and still three across at 1920" and it is the wrong one, because
   * this table has to SEAL: every line full, every cell the same width. Three
   * columns seal 3, 6 and 9 cards; four seal 4 and 8. With a basis like
   * min(380px, 33.3%) the count follows the band and the seal breaks wherever
   * the two disagree — measured at 1920 with a synthetic five-card grid, four
   * cards came out 389.5px and the fifth 1558px, one product four times its
   * neighbour, which is the exact defect the util-tile rule below exists to
   * prevent. So the count changes only where a count change still seals: see
   * the 4n quantity query in the responsive block.
   *
   * What the widened container did give this table is width, and the cards
   * take it: 399.3px at 1280, 452.7 at 1440 and 519.3 at 1920, where the old
   * 1440 container stopped them at 452.7 on every screen above 1440.
   *
   * 33.3%, not 33.3333%: three of them are 99.9% of the line, so no sub-pixel
   * rounding can ever push the third card onto a second line, and flex-grow
   * hands the leftover 0.1% straight back. Wrapped lines stretch their items
   * to equal height by default, which is what the source buys with
   * grid-auto-rows: minmax(0,1fr) — the rules have to line up across a row. */
  :root[data-theme="studio"] .st-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0;
    padding: var(--bw-line);
  }

  :root[data-theme="studio"] .st-card {
    display: flex; flex-direction: column;
    flex: 1 1 33.3%;
    min-width: 0;
    /* Positioned so the hover state below can raise the whole card. */
    position: relative;
    padding: var(--studio-card-pad);
    background: var(--surface);
    /* A RING, not a border. A border sits inside the box, so two cards meeting
     * would draw 1px each and the seam would be 2px; a ring sits outside, so
     * neighbours share one. This is the source's own box-shadow:0 0 0 1px.
     *
     * The colour goes through a local --st-ring rather than being restated in
     * every state, so each rule that changes this frame — hover/focus, and the
     * dark util tile with its own hover — changes ONE value instead of
     * repeating the whole shadow. A shorthand written out four times is how a
     * ring and its hover twin drift apart. Custom properties do not transition,
     * but box-shadow does, and box-shadow is what is animating. */
    --st-ring: var(--line);
    box-shadow: 0 0 0 var(--bw-line) var(--st-ring);
    /* Square, and not as a preference: an 8px radius rounds off every cell
     * corner and the continuous rules break into dashes at each junction.
     * --r-card survives on the panel INSIDE the card, which is where the
     * source keeps its 8px. It also means no :focus-visible override is
     * needed: the base sheet's border-radius:4px for focus rings loses to this
     * on specificity, so the focus outline is square like the cell. */
    border-radius: 0;
    text-decoration: none;
    color: var(--ink);
    /* THE signature: only the frame changes. No lift, no shadow, no scale —
     * the baseline's hover is a hairline going black and nothing else. */
    transition: box-shadow 0.2s ease;
  }
  /* Keyboard parity is not a separate design: focus takes the same blackened
   * frame as hover, and the page's accent outline comes from the base sheet.
   *
   * z-index is load-bearing here, not polish. Rings overlap and the later
   * sibling paints last, so without it a hovered card's right and bottom edges
   * stay light grey underneath its neighbours' rings — the "frame goes black"
   * state would draw two and a half sides. Raising the hovered card lifts its
   * whole box, ring included, over every sibling. */
  :root[data-theme="studio"] .st-card:hover,
  :root[data-theme="studio"] .st-card:focus-visible {
    --st-ring: var(--line-strong);
    z-index: 1;
  }

  /* The panel the product sits on — the theme's one panel grey, --bg-alt, at
   * --r-media. This is the 8px the source keeps and the card gives up: inside
   * a square cell a rounded panel is a shape, not a broken rule.
   *
   * It no longer declares a ratio of its own. It is a MAT: even padding all
   * round, and its height is whatever the plate inside it comes to. That
   * inverts the old arrangement, where the panel fixed a 3/4 box and the
   * picture floated somewhere inside it at whatever size its own proportions
   * happened to give — which is the single thing that made this grid read as
   * unfinished beside the source. */
  /* ---- Windows High Contrast --------------------------------------------
   *
   * ⚠️ A CARD DRAWN WITH box-shadow HAS NO EDGE IN FORCED COLOURS. The mode
   * drops box-shadow by design, and .st-card, .st-also-card and .st-util draw
   * their only boundary with it — measured under forced-colors: active, all
   * three come back "box-shadow: none, border: 0px none", so the product grid
   * renders as unbounded runs of text with no card edge. The sibling
   * components that use a real border (.st-cat-card, .st-btn-line, .st-badge)
   * are fine, which is the tell: one design intent, three techniques, one of
   * which vanishes.
   *
   * A border only inside the media query, so nothing shifts for anyone else. */
  @media (forced-colors: active) {
    :root[data-theme="studio"] .st-card,
    :root[data-theme="studio"] .st-util {
      border: 1px solid CanvasText;
    }
  }
  :root[data-theme="studio"] .st-card-panel {
    position: relative;
    display: block;
    padding: var(--studio-panel-pad);
    border-radius: var(--r-media);
    background: var(--bg-alt);
    overflow: hidden;
    isolation: isolate;
  }
  /* THE PLATE. Everywhere else in the theme .st-shot is absolute at inset:0 —
   * the rail, the PDP — and here it comes into flow so the panel can take its
   * height from it. It carries --studio-plate-ar, and because it is now the
   * positioned ancestor, everything inside it (the photograph, the drawing,
   * the drawing's contact shadow) is laid out against the plate rather than
   * against the panel, so all three sit inside the mat rather than bleeding
   * across it. */
  :root[data-theme="studio"] .st-card-panel > .st-shot {
    position: relative;
    display: block;
    aspect-ratio: var(--studio-plate-ar);
  }
  /* WHY THE PLATE GOES WHITE UNDER A PHOTOGRAPH, and why that is not the
   * mistake the rail's rule above describes.
   *
   * These files are cutouts on a WHITE SWEEP, not transparent PNGs, so a
   * contained photograph paints an opaque white rectangle wherever its pixels
   * land — and the size of that rectangle is a property of the FILE, not of
   * the cell: 272 tall under a square source, 225 under a long one, at the
   * same 1440. On bare grey that is a different white box in every cell, which
   * is the broken crop. Painting the plate itself white makes the letterboxing
   * disappear instead: the white the photograph brings and the white the plate
   * paints are the same white, so what is left is one plate of identical size
   * in every cell, the product centred on it, inside a grey mat of identical
   * width. Uniform cells, which is the whole point of the exercise.
   *
   * The colour goes on the IMG rather than on the plate on purpose: a cell
   * with no photograph then keeps the panel grey behind its drawing, which is
   * what a 62%-ink line drawing needs to read against, and the two kinds of
   * cell still agree on their outer geometry. */
  :root[data-theme="studio"] .st-card-panel .st-shot-img {
    background: var(--surface);
    border-radius: var(--r-media);
  }
  /* THE LEGIBILITY SCRIM IS GONE. It was a white radial wash over the panel's
   * top-right corner, there so a solid chip would still have something to sit
   * on once a photograph filled the panel. Two things retired it. The chip is
   * opaque now (below), so it carries its own ground and needs nothing under
   * it; and the panel is grey now, so a white wash over its corner is a
   * visible light patch on the mat — a scrim that was invisible on a white
   * panel became an artefact on a grey one. */
  /* BADGE PLACEMENT is the source's: position:absolute; top:0; right:0 on the
   * card — top RIGHT, which is where a buyer's eye lands after the price, not
   * top left where it competes with the product's own silhouette. Two
   * deliberate differences from the source:
   *
   *   1. It is inset INTO the panel rather than hung off the card's outer
   *      corner. The source's chip is a Frameship stock pill that only exists
   *      during hover, so it can float over the card's white padding; ours is
   *      on the page at rest, and a chip sitting on the padding at rest reads
   *      as a sticker nobody removed.
   *   2. It stays visible. The source ships it at opacity:0 and reveals it on
   *      hover, which puts the one word a buyer scans for behind a pointer —
   *      and behind nothing at all on a touch screen. A merchandising flag that
   *      only appears on hover is a flag that does not exist on a phone.
   *
   * SOLID INK IS GONE, AND THIS IS THE ONE CHANGE HERE THAT IS PURELY ABOUT
   * WEIGHT. Four cells each wearing a black pill put four hard black marks
   * across a band whose whole argument is that it is quiet; the source's own
   * Best Sellers table carries no chip at all, so anything we add is already a
   * deviation and the only honest question is how loud it may be. It stays,
   * because MALI / VELIKI / VSTOPNI / NAJVEČ ŠOB is real merchandising
   * information a buyer scans for, and deleting it would be a content decision
   * dressed as a design one. It goes to an OUTLINE: --surface ground, a
   * --line-ctrl hairline (#949494 — 3.0:1 on white and 2.6:1 on the mat, the
   * quietest rung that still draws an edge on both grounds this chip can land
   * on), and --ink-body text at 16.1:1, well clear of the 4.5:1 floor. The
   * chip is opaque, which is what let the scrim above go.
   *
   * The offset changed with it. --gap-sm from the panel's own corner was right
   * while the panel was one flat surface; now that surface is a mat plus a
   * plate, and 10px would leave a 34px chip straddling the boundary between
   * them. It sits one --gap-sm INSIDE the plate instead, so it reads as a tag
   * on the picture rather than as something caught on the frame. --r-tag
   * (50px) and the 6px/20px padding are the baseline's own tag geometry and
   * are unchanged. */
  :root[data-theme="studio"] .st-badge {
    position: absolute; z-index: 3;
    top: calc(var(--studio-panel-pad) + var(--gap-sm));
    right: calc(var(--studio-panel-pad) + var(--gap-sm));
    padding: 6px 20px;
    border-radius: var(--r-tag);
    background: var(--surface);
    border: var(--bw-line) solid var(--line-ctrl);
    color: var(--ink-body);
    /* A badge is a chip: the label role, tight leading, in the label face. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
  }

  /* flex-grow so the body fills whatever height the row's tallest card sets,
   * which is what lets the price row pin itself to the bottom edge — the same
   * device .st-cat-body/.st-cat-price already use in the category row. The
   * names here are one line today and the prices happen to align; the moment
   * one model name folds to two lines they stop aligning, in a table whose
   * whole readability rests on things lining up across a row. */
  :root[data-theme="studio"] .st-card-body {
    display: flex; flex-direction: column;
    gap: clamp(8px, 0.8vw, 16px);
    flex-grow: 1;
    padding-top: clamp(16px, 1.8vw, 36px);
  }
  /* Card title → h6 (24/19/22), DOWN a rung from h5.
   *
   * h5 is the ramp's rung for a large card's title and this is not a small
   * card, so the rung was defensible; what it did not survive is the content.
   * These names are genuine product codes — BAZEN 195, SWIM 580 MAXI — and
   * they are uppercase in the CATALOGUE, not by text-transform, so they cannot
   * be softened into sentence case the way the source's furniture names are.
   * That would be rewriting content to suit a stylesheet. All-caps at 32px in
   * the display face is then the loudest thing on the card by a wide margin:
   * it outweighs the 20px price it is meant to introduce, and it is what made
   * this grid read as shouty beside the source's calm one. A rung down puts
   * the name at 24px against the price's 20px — still leading, no longer
   * competing — and it is the same rung the rail's cards already use, so the
   * two acts now agree about what a product name weighs.
   *
   * Tracking follows the rung: h6 is 0em in the source where h5 is +0.02em.
   * Nothing in this theme tracks negative. */
  :root[data-theme="studio"] .st-card-name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
    /* A long unbroken Slovenian model name (or an SKU) must fold inside the
     * card rather than push the grid column open. */
    overflow-wrap: break-word;
  }
  /* The spec line. Body ink at the small prose rung rather than the label
   * rung's tracked caps: it is three facts to read, not a badge, and caps
   * would make it compete with the name directly above it. --ink-mute is
   * 5.17:1 on white. */
  :root[data-theme="studio"] .st-card-meta {
    margin-top: calc(-1 * clamp(4px, 0.4vw, 9px));
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    /* --lh-body, not a 1.45 literal: the rung is 1.625 and 1.45 is on no
     * scale. The note above this rule argues size and case, never leading. */
    line-height: var(--lh-body);
    color: var(--ink-mute);
    overflow-wrap: break-word;
  }
  :root[data-theme="studio"] .st-price-row {
    display: flex; align-items: baseline; flex-wrap: wrap;
    /* The source's price row is gap:10px — the theme's dominant micro gap,
     * which tokens.ts carries as --gap-sm. A clamp here was inventing a value
     * the source states outright. */
    gap: var(--gap-sm);
    /* Pinned to the bottom of the body, so every price in a row shares one
     * baseline however many lines the names above them take. */
    margin-top: auto;
    font-family: var(--f-body);
    font-variant-numeric: tabular-nums;
  }
  /* PRICE TYPOGRAPHY, corrected against the source's own DOM. An earlier pass
   * set the price in the DISPLAY face at h6 (24px Chivo) on the reasoning that
   * it is the card's loudest number. The source does the opposite: its price is
   * Satoshi 20 w500 #151515 — the PROSE face at the lead rung. That is not a
   * detail, it is why the source's card reads as a spec line rather than a
   * price tag: the only display type anywhere on the card is its NAME, and the
   * price defers to it. --f-body / --t-lead / --w-body-med / --ink. */
  :root[data-theme="studio"] .st-price {
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--ink);
  }
  /* Struck compare-at → the LABEL face at the label rung, again straight from
   * the DOM (DM Sans 14 w500 #2e2e2e, text-decoration:line-through), not the
   * body face this used to use. The source's literal #2e2e2e has no on-light
   * token in this theme — --ink-invert-2 holds exactly that value but is named
   * for dark grounds and would read here as a mistake — so it takes --ink-body
   * #212121: one rung darker, 16.1:1 on the card's white surface against
   * 13.6:1 for the source's own, so the substitution can only help.
   *
   * A struck price is DARK in this theme, not muted. That is deliberate in the
   * source and worth keeping: the saving is the argument, and greying it out is
   * how most storefronts quietly hide the number that makes the case. */
  :root[data-theme="studio"] .st-was {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-body);
    text-decoration-line: line-through;
    text-decoration-thickness: 1px;
  }
  /* "z DDV" is OURS, not the source's — Slovenian retail quotes gross prices
   * and the qualifier belongs on the card. Same label rung as the struck price,
   * but the muted ink (--ink-mute, 5.17:1 on white), which is what keeps the
   * row three distinct voices instead of two identical small ones beside a
   * large one. Not uppercased: the abbreviation is already capitalised.
   *
   * WEIGHT, not rung: --w-body rather than the label role's --w-label. This is
   * the one place in the act where the label weight was doing harm. "z DDV" is
   * a qualifier on the number beside it, and at 14px in the label face at
   * label tracking, w500 gives it the same typographic authority as the price
   * — two things at 500 on one line, one of which is only there to say which
   * tax basis the other is quoted on. Dropping to 400 keeps the rung, the face
   * and the tracking, so it still belongs to the label family, and takes only
   * the insistence out of it. Colour is unchanged: --ink-mute is 5.17:1 and
   * the AA floor is not a weight decision. */
  :root[data-theme="studio"] .st-vat {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-mute);
  }

  /* THE UTIL TILE WAS THE WORST CELL IN THE TABLE, and it failed on two counts
   * at once: it was solid ink, and it was empty.
   *
   * MEASURED, at 1440 before this pass: the tile's own content came to 251px
   * of heading, paragraph and button inside a cell 990px tall — 25% ink, 75%
   * void — because a flex column with justify-content: space-between takes
   * three children and pushes them as far apart as the cell allows. In a row
   * whose other cell was a product card it therefore rendered as a heading
   * pinned to the top, a paragraph adrift near the middle and a button pinned
   * to the floor, with two black chasms between them. Nothing about that reads
   * as a design; it reads as a page that failed to load.
   *
   * IT LAYS OUT ACROSS THE CELL NOW, not down its left edge. The column
   * becomes a wrapping ROW of two objects — the text block and the CTA — so
   * space-between stops being a device for prising three fragments apart and
   * becomes what it is for: putting one object at each end of a line. Both are
   * centred in whatever height the row sets, so the leftover vertical space is
   * symmetric margin, which is what every other cell in this table does with
   * its slack. Measured after, at 1440: 227px of content in a 498px cell, 46%
   * against the 25% it was, and the cell is 905px wide with the CTA at its far
   * edge rather than 400px of it standing empty.
   *
   * Stretching to the row's height is not the fault and is not negotiable: the
   * cells of a ruled table must be the same height or the rules do not meet,
   * and a tile that sized itself to its own content would cut a notch out of
   * the row. What was wrong was never that the cell was tall — it is that the
   * content was arranged to make the height as conspicuous as possible.
   *
   * THE GROUND GOES QUIET. The source's Best Sellers table contains no black
   * slab at all, and this one was the heaviest object in a band whose entire
   * argument is restraint — one 990x679 rectangle of #151515 against five
   * white cells. A dark cell can be worth that weight when it is full; this
   * one, at 25% content, was spending the loudest ground on the emptiest cell.
   * It takes --bg-alt instead: the same panel grey the product photographs sit
   * on two cells away, so the tile now reads as a member of the table rather
   * than as a hole punched in it, while still being visibly not-a-product. Ink
   * on #f0f0f0 is 15.8:1, body ink 14.5:1.
   *
   * With the ground light, the ring and the hover state stop being special:
   * --st-ring falls back to --line like every other cell, so the table's rule
   * is one continuous hairline, and "frame goes black" on hover is inherited
   * from .st-card rather than inverted here. Two rules deleted, one behaviour. */
  :root[data-theme="studio"] .st-util {
    flex-flow: row wrap;
    align-items: center;
    align-content: center;
    justify-content: space-between;
    gap: clamp(16px, 2vw, 40px);
    background: var(--bg-alt);
    color: var(--ink);
  }
  /* The text block, so the tile composes as TWO objects on one line instead of
   * three stacked down its left edge. space-between puts the CTA at the far
   * edge, which is what spans the cell. When the cell is too narrow for both —
   * the phone's single column, or a table that ever gives the tile one column
   * — the CTA simply wraps beneath, which is the layout it had before, reached
   * without a second set of rules to maintain.
   *
   * THE BASIS IS 60%, WHICH IS HOW THE COPY FOLLOWS THE TILE. It used to be
   * flex: 0 1 auto, so the block took exactly the width its own paragraph's
   * 34ch measure allowed and stopped: 432.6px of copy in a 905px tile at 1440
   * and in a 1038.7px tile at 1920 — 47.8% and 41.6% of the cell, with the
   * rest of it white space between a sentence and a button. Now the block
   * grows: the control measures 190–219px at every width from 810 up, i.e.
   * 22–32% of the tile's content box, so a 60% basis always leaves it room on
   * the line, and flex-grow hands the copy every pixel the control does not
   * take — 392.3px at 1024, 609.7px at 1440, 717.4px at 1920, which is 69% of
   * the tile against the 41.6% it was. The basis governs the WRAP decision
   * only; the grow governs the width, which is why the phone still stacks:
   * 60% of a 298px tile plus the control does not fit one line, so the control
   * drops beneath exactly as before. */
  :root[data-theme="studio"] .st-util-txt {
    display: flex; flex-direction: column;
    gap: clamp(8px, 0.8vw, 16px);
    flex: 1 1 60%;
    min-width: 0;
  }
  /* The tile's heading takes the same rung as a product name — h6 — for the
   * same reason the product names came down to it: this cell sits in a run of
   * product cells and a title a rung louder than theirs is the tile claiming a
   * seniority it does not have. It was already carrying more emphasis than any
   * product through its ground; now that the ground is quiet, matching the
   * rung is what makes the row scan as one line of equals. */
  :root[data-theme="studio"] .st-util-h {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
    overflow-wrap: break-word;
  }
  /* The tile's one line of prose, standing between its heading and its CTA →
   * lead, the standfirst rung (20/16/18), not body: it introduces the tile
   * rather than being ordinary running copy. Lead is set in --w-body-med.
   * --ink-body on the panel grey is 14.5:1; the old --on-invert-mute was for
   * the dark ground and would now be 2.5:1.
   *
   * 62ch, not the 34ch it carried. 34ch was doing two jobs and only one of
   * them was typography: it capped the paragraph AND, because the text block
   * sized itself to its content, it decided how much of the tile the copy
   * covered — 432.6px inside a 905px cell at 1440, 47.8% of the box it is the
   * only content of. The block's own basis owns the second job now (see
   * .st-util-txt), so this is a measure again and nothing else, and it is the
   * measure .st-shop-intro already uses for prose at this rung — same face,
   * same size, so the two paragraphs on the page cap at the same 788.9px.
   * In practice the tile is narrower than that and the cell governs; the cap
   * is the ceiling that stops a very wide tile from setting 90 characters. */
  :root[data-theme="studio"] .st-util-p {
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--ink-body);
    max-inline-size: 40rem;
  }
  /* Reads as a control, so it is SHARP (§9). Outlined at rest and filled on
   * hover, exactly as before — only the grounds are the other way up, so the
   * ring is --line-strong (15.8:1 on the panel grey, and the source's own
   * button colour) instead of a white alpha. */
  :root[data-theme="studio"] .st-util-go {
    /* centre, not flex-start: the tile is a row now, so the cross axis is
     * vertical and the CTA sits on the text block's optical centre line. On a
     * wrapped line it is alone, so centre and start describe the same box. */
    align-self: center;
    flex: 0 0 auto;
    border: var(--bw-line) solid var(--line-strong);
    border-radius: var(--r-ctrl);
    padding: clamp(10px, 0.9vw, 18px) clamp(16px, 1.6vw, 32px);
    /* A button word is the label role, in the label face — same rung as the
     * eyebrow and the badge, so every worded control in the act matches. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink);
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-util:hover .st-util-go {
    background: var(--ink); color: var(--on-invert);
  }

  /* ---- §4.4 category rail -------------------------------------------- */
  /* ---- Category rail (§4.4 as the source uses it: FAMILIES, not models) ----
   *
   * A grid rather than a scroller. The model rail below is full-bleed and
   * scrolls because a catalogue grows; this row has one card per product
   * family and that count is small and stable, so the cards get real width
   * and the page gets no controls it cannot honour.
   *
   * The panel is deliberately tall-ish and pale: one card holds a photograph
   * of a hot tub and the other a drawing of a swim spa, and they have to read
   * as the same KIND of object at a glance for the size difference between
   * them to be the thing that stands out. */
  /* Collection and hub pages: the intro under the H1, and the hand-off link
   * at the foot of each band on the hub. */
  /* Left, under the heading it belongs to. The auto side margins centred it.
   *
   * The header above it is left-aligned (eyebrow, then h1), so a centred
   * paragraph started at neither the gutter nor the page's centre: on a
   * collection page it began 227px in from a heading that began at 40, which
   * reads as an indent nobody chose. */
  :root[data-theme="studio"] .st-shop-intro {
    margin: clamp(12px, 1.2vw, 20px) 0 0;
    max-inline-size: 40rem;
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--ink-body);
  }
  /* ---- the hub's two-family decision ---------------------------------
   *
   * Two equal cards on the ruled-hairline vocabulary the rest of the shop
   * already speaks — 1px line, flat ground, no shadow. The card is one link;
   * the border is its hover affordance, so the whole surface answers the
   * pointer the way .st-card's title does.
   *
   * Margin-top pairs it with the intro above (same rung as the intro's own
   * top margin); the section's own bottom rhythm separates it from the first
   * band, so nothing here pays that boundary twice. */
  :root[data-theme="studio"] .st-hub-choice {
    list-style: none;
    /* The bottom rung exists because the title section pays no section
     * rhythm of its own (padding-bottom: 0, see .st-shop--title): without
     * it the first band's h2 stood 66px under the cards where the bands
     * keep ~170px between themselves. Half a band's rhythm — the cards and
     * the first band are one conversation, the bands are two. */
    margin: clamp(24px, 2.4vw, 40px) 0 clamp(44px, 4.4vw, 80px);
    padding: 0;
    display: grid;
    gap: clamp(12px, 1.2vw, 20px);
  }
  @media (min-width: 720px) {
    :root[data-theme="studio"] .st-hub-choice {
      grid-template-columns: 1fr 1fr;
    }
  }
  :root[data-theme="studio"] .st-hub-card-a {
    display: flex;
    flex-direction: column;
    block-size: 100%;
    padding: clamp(20px, 2vw, 32px);
    border: var(--bw-line) solid var(--line-strong);
    border-radius: var(--r-card);
    text-decoration: none;
    color: var(--ink);
  }
  @media (hover: hover) {
    :root[data-theme="studio"] .st-hub-card-a { transition: border-color 0.2s ease; }
    :root[data-theme="studio"] .st-hub-card-a:hover { border-color: var(--ink); }
  }
  :root[data-theme="studio"] .st-hub-card-a:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
  }
  :root[data-theme="studio"] .st-hub-card-h {
    margin: 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
  }
  :root[data-theme="studio"] .st-hub-card-p {
    margin: clamp(8px, 0.8vw, 12px) 0 0;
    max-width: 46ch;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  /* The fact rows: label left, value right, a hairline between rows — the
   * same reading the PDP's spec list and the page template's facts block
   * teach, so the card needs no legend. */
  :root[data-theme="studio"] .st-hub-card-facts {
    margin: clamp(16px, 1.6vw, 24px) 0 0;
  }
  :root[data-theme="studio"] .st-hub-card-facts > div {
    display: flex;
    justify-content: space-between;
    gap: var(--gap-sm);
    padding-block: clamp(8px, 0.8vw, 11px);
    border-block-start: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-hub-card-facts dt {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-hub-card-facts dd {
    margin: 0;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-variant-numeric: tabular-nums;
    color: var(--ink);
    text-align: right;
  }
  /* The way down. Margin-top:auto is what makes the two cards' last lines
   * level when one paragraph runs a line longer than the other. */
  :root[data-theme="studio"] .st-hub-card-go {
    margin-block-start: auto;
    padding-block-start: clamp(14px, 1.4vw, 20px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
  }
  :root[data-theme="studio"] .st-shop-more {
    margin: clamp(20px, 2vw, 36px) 0 0;
    text-align: center;
  }
  /* The head's own escape to the full catalogue: above the grid, quiet,
   * left-aligned with the heading it belongs to. */
  :root[data-theme="studio"] .st-shop-more--head {
    margin: 0 0 clamp(18px, 2vw, 28px);
    text-align: left;
  }

  /* The hub's closing prose. Set on the reading measure and separated from
   * the last grid by a hairline, so it reads as the page's own voice rather
   * than as a third product band. */
  :root[data-theme="studio"] .st-hub-outro {
    /* LEFT-ALIGNED on the page's own grid, at a true reading measure. The
     * centred 40rem column floated between the gutters with ~360px of dead
     * space either side and ran ~90 characters — a block from another
     * document appended to the hub. 62ch is the ~65-character measure the
     * site reads at; the hairline stays, the drift goes.
     *
     * ⚠️ THE MEASURE MOVED OFF THE BLOCK AND ONTO THE TEXT, for the reason it
     * moved everywhere else in this theme: the block carries a hairline, and
     * capping the block capped the hairline with it. A 960px stretch of the
     * hub — the tallest under-filled region left on any route — reached 48%
     * across because a rule that should close the section stopped where a
     * paragraph ends. The rule spans the band now; the words still read at
     * the measure below. */
    padding-block-start: clamp(32px, 4vw, 56px);
    border-block-start: var(--bw-line) solid var(--line);
  }
  /* ⚠️ THE MEASURE WAS NEVER THE PROBLEM. THE COLUMN COUNT WAS.
   *
   * This rule has been rewritten three times and the first two both changed
   * the same number. It was a centred 40rem column floating between the
   * gutters; then a left-aligned 62ch one; then 40rem again, because the ch
   * unit is the width of the digit zero and in Plus Jakarta Sans it renders
   * about half again as wide as the average letter, so "62 characters"
   * measured ninety-five.
   *
   * Every one of those was a SINGLE COLUMN in a 1520px band. Measured at
   * 1600 the content reached 640px — forty-two per cent of the band — and
   * the remaining thousand pixels were empty from the hairline to the
   * footer. Widening the column is not the fix either: at full width the
   * same paragraphs run past 190 characters a line.
   *
   * So the band gets the columns it always had room for. Two sections side
   * by side, each at the reading measure, is ~1320 of 1520 used and both
   * still read at ~65 characters.
   *
   * The breakpoint is arithmetic: two 34rem columns plus a 64px gutter need
   * 1152px of band, so the grid engages at 1200 of viewport and everything
   * below stacks into the single column this always was. */
  :root[data-theme="studio"] .st-hub-outro {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(28px, 3vw, 44px) var(--gap-2xl);
    align-items: start;
  }
  @media (min-width: 1200px) {
    :root[data-theme="studio"] .st-hub-outro {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  /* The measure stays on the TEXT, not on the column: a column is 1fr of the
   * band and would otherwise set ~90 characters at 1920. 34rem is the same
   * measure pdp.ts settled on, in rem so it cannot drift with the face. */
  :root[data-theme="studio"] .st-hub-outro-sec > * { max-inline-size: 34rem; }
  :root[data-theme="studio"] .st-hub-outro-sec h2 {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
    margin: clamp(28px, 3vw, 44px) 0 12px;
    text-wrap: balance;
  }
  :root[data-theme="studio"] .st-hub-outro-sec h2 { margin-block-start: 0; }
  :root[data-theme="studio"] .st-hub-outro-sec p {
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    margin: 0 0 14px;
  }
  :root[data-theme="studio"] .st-hub-outro-sec p:last-child { margin-block-end: 0; }
  :root[data-theme="studio"] .st-btn-line {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--st-tap);
    padding-inline: clamp(20px, 2vw, 32px);
    border: var(--bw-line) solid var(--ink);
    border-radius: var(--r-ctrl);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    text-decoration: none;
    color: var(--ink);
  }
  @media (hover: hover) {
    :root[data-theme="studio"] .st-btn-line { transition: background 0.2s ease, color 0.2s ease; }
    :root[data-theme="studio"] .st-btn-line:hover { background: var(--ink); color: var(--on-invert); }
  }
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-btn-line { transition: none; }
  }

  :root[data-theme="studio"] .st-cat-sec {
    background: var(--bg);
    /* BOTTOM ONLY — see --studio-rhythm. This section shares the page's white
     * ground with its neighbour, so the separation between them is paid once,
     * here, exactly as the source pays it (0 40px 170px). Paying it on both
     * sides is what made every boundary twice the source's. */
    padding-block: 0 var(--studio-rhythm);
  }
  /* LEFT, like the grid section below it — not centred.
   *
   * The page's headers had no rule: this one was centred and the product grid
   * immediately under it was left, so two adjacent sections that do the same
   * job (here is what we sell, choose one) disagreed about where a heading
   * starts. The rule now is the one the page can actually be read by —
   * things you BUY are left-aligned, things you READ (the statement, the
   * guides, the testimonials) stay centred. */
  :root[data-theme="studio"] .st-cat-help {
    margin: clamp(10px, 1.2vw, 16px) 0 0;
    font-size: var(--t-body);
  }
  :root[data-theme="studio"] .st-cat-help a {
    color: var(--ink);
    text-underline-offset: 4px;
    display: inline-block;
    padding-block: 10px;
    margin-block: -10px;
  }
  :root[data-theme="studio"] .st-cat-head {
    margin-bottom: clamp(28px, 3.4vw, 68px);
  }
  :root[data-theme="studio"] .st-cat-head .st-sec-h {
    max-width: 24ch;
    margin-inline: 0;
  }
  /* FLEX, NOT auto-fit GRID, AND THE DIFFERENCE IS TRACKS THAT DO NOT EXIST.
   *
   * repeat(auto-fit, minmax(min(100%, 340px), 1fr)) lays as many 340px tracks
   * as the band will hold and collapses the ones no card lands in. Collapsed
   * is not deleted: with two families in a 1560px band the row computed
   * grid-template-columns: 764.6px 764.6px 0px 0px — two real columns and two
   * phantoms, up from one phantom at 1440 and none at 1024, because the wider
   * the container gets the more of them auto-fit invents. They cost no width
   * (their gutters collapse too), so this was always cosmetic; what it cost
   * was legibility of the computed style, and it will only get louder if the
   * container widens again.
   *
   * A wrapping flex line reaches the identical geometry with nothing to
   * collapse: a basis of 340px wraps at the same width the tracks did, and
   * flex-grow divides the line between the cards that actually exist — 764.6px
   * each at 1920, 668.5px at 1440, one per line below a ~746px viewport, all
   * unchanged. The item is a grid of one so the card inside it still stretches
   * to the full cell in both axes, which is what the li got for free as a grid
   * item and what .st-cat-card's height: 100% is written against. */
  :root[data-theme="studio"] .st-cat-row {
    list-style: none;
    margin-block: 0;
    display: flex;
    flex-wrap: wrap;
    gap: clamp(16px, 1.6vw, 32px);
  }
  :root[data-theme="studio"] .st-cat-item {
    display: grid;
    flex: 1 1 min(100%, 340px);
    min-width: 0;
  }
  :root[data-theme="studio"] .st-cat-card {
    display: flex; flex-direction: column;
    height: 100%;
    padding: clamp(12px, 1.2vw, 24px);
    background: var(--surface);
    border: var(--bw-line) solid var(--line);
    border-radius: var(--r-card);
    text-decoration: none;
    transition: border-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-cat-panel {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
    border-radius: var(--r-media);
    background: var(--bg-alt);
    overflow: hidden;
  }
  /* Both panels keep the SAME pale ground. Giving the photo card a white one
   * looked right in isolation and wrong in the row: the surface behind it is
   * white too, so that card lost its panel entirely while its neighbour kept
   * one, and two cards meant to be read as a pair stopped matching. The model
   * cards have carried studio cutouts on --bg-alt all along. */
  /* COVER, not contain — decided by what each fit does to the frame. Contain
   * is the cutout discipline: a product on white must never be cropped, and
   * every model panel keeps it. But these two slots hold the owner's SCENE
   * photographs, shot edge to edge, and for a scene any mismatch between its
   * aspect and the 4:3 frame letterboxes: with contain the representative
   * stand-in (7:5) painted ~11px bands of panel grey above and below the
   * picture at 1440, reading as a broken image rather than a mat. Cover fills
   * the frame from any source aspect and centre-crops the spill, so the pale
   * ground now shows only before paint and behind the drawn fallback. */
  :root[data-theme="studio"] .st-cat-img {
    inline-size: 100%; block-size: 100%;
    object-fit: cover;
  }
  :root[data-theme="studio"] .st-cat-art {
    display: block;
    inline-size: 76%;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-cat-art svg { display: block; inline-size: 100%; height: auto; }
  :root[data-theme="studio"] .st-cat-body {
    display: flex; flex-direction: column;
    gap: clamp(4px, 0.4vw, 8px);
    margin-block-start: clamp(12px, 1.2vw, 22px);
    /* Fill the card's remaining height so the price row below can pin itself
     * to the bottom edge — see the note on .st-cat-price. */
    flex-grow: 1;
  }
  :root[data-theme="studio"] .st-cat-name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-cat-meta {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-body);
  }
  /* The family's price SPAN. Legal on a category card in a way it is not on a
   * model card — see the note on renderCategoryRail.
   *
   * Pinned to the card's bottom edge, because the two metas wrap differently:
   * at the 810px tier "za plavanje in sprostitev" folds onto a second line
   * while the hot-tub meta stays on one, which left the two prices 20px out
   * of line inside two equal-height frames — the loudest number in the row,
   * visibly staggered. The auto margin bottom-aligns the pair at every width
   * where the cards sit side by side and costs nothing on the stacked phone
   * layout, where there is no slack to absorb. The old margin rung survives
   * as padding: an auto margin swallows a length margin, not a padding, so
   * the tuned minimum distance to the meta line is unchanged. */
  :root[data-theme="studio"] .st-cat-price {
    margin-block-start: auto;
    padding-block-start: clamp(2px, 0.3vw, 6px);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    /* Tabular figures, as on the theme's other two price slots (.st-price-row,
     * .st-rail-price): a range is two numbers asked to be compared. */
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  /* Hover lost its 2px lift. The theme states its interaction rule twice in
   * its own comments — on .st-card ("no lift, no shadow, no scale") and on
   * .st-rail-go ("state is a change of frame and never a lift") — and this
   * card was the one surface still moving on hover. The frame going dark IS
   * the affordance, exactly as on .st-rail-card, this card's twin construction
   * one section down; it also takes the same token, --line-strong, which
   * tokens.ts declares for the boundary of an interactive control (--ink held
   * the identical value, but named the wrong job). With the transform gone,
   * the prefers-reduced-motion block that existed only to cancel it went too:
   * a 0.2s border-colour cross-fade is not motion, and .st-rail-card ships
   * the same transition with no such override. */
  @media (hover: hover) {
    :root[data-theme="studio"] .st-cat-card:hover { border-color: var(--line-strong); }
  }
  /* Keyboard parity, and not only the base sheet's accent outline: the frame
   * darkens for focus exactly as for hover, and the rule sits OUTSIDE the
   * hover media query because a keyboard can drive a device that has no
   * hover at all. The accent ring itself follows the card's 8px corner — the
   * card's own border-radius outranks the base sheet's 4px focus-ring radius
   * on specificity, the same mechanism the rail card documents. */
  :root[data-theme="studio"] .st-cat-card:focus-visible { border-color: var(--line-strong); }

  :root[data-theme="studio"] .st-rail-sec {
    background: var(--bg);
    /* BOTTOM ONLY — see --studio-rhythm. This section shares the page's white
     * ground with its neighbour, so the separation between them is paid once,
     * here, exactly as the source pays it (0 40px 170px). Paying it on both
     * sides is what made every boundary twice the source's. */
    padding-block: 0 var(--studio-rhythm);
    /* The rail is full-bleed; the section must never widen the page. */
    overflow: clip;
  }
  /* Centred heading (§4.4) — the counterpoint to §4.7's gutter-left one. */
  :root[data-theme="studio"] .st-rail-head {
    text-align: center;
    margin-bottom: clamp(28px, 3.4vw, 68px);
  }
  :root[data-theme="studio"] .st-rail-head .st-sec-h {
    max-width: 24ch;
    margin-inline: auto;
  }
  /* The offer's price span, under the heading it describes. Body rung and the
   * muted ink: it is orientation before the cards, not one of their prices. */
  :root[data-theme="studio"] .st-rail-range {
    margin-top: 12px;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
  }

  /* THE RAIL, and what the source's "peek at both edges" actually is.
   *
   * It is not a scroll position — it is a LOOP. The source's six category
   * cards are cloned four times into 24 <li>s on a 1920px track that is
   * centred inside an overflow:hidden section, so whichever cards happen to
   * lie under the two edges are cut, permanently, at rest. WE DO NOT CLONE.
   * Four copies of every product put four copies of every product name and
   * price into the document, which is the one kind of duplication a network of
   * single-keyword shops cannot afford (docs/SEO.md) — and a loop has no first
   * card, so the rail would have no reachable start for a keyboard.
   *
   * So this is a single-pass scroller and the peek comes from the PITCH
   * instead: 372 + 34 = 406px, the source's own, which no viewport width
   * divides evenly. At rest the leading card sits at the gutter and the track
   * is cut by the trailing edge; from the first step onwards centre snapping
   * cuts it at both. The cost is the resting frame — one edge peeks there,
   * not two — and that is the whole price of not duplicating the catalogue.
   *
   * "proximity", not "mandatory": mandatory re-snaps on every settle, which
   * fights a zoomed-in or large-text reader trying to rest between cards
   * (a genuine hazard, not a nicety) — proximity keeps the alignment while
   * leaving free positions reachable. */
  :root[data-theme="studio"] .st-rail {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x proximity;
    padding-inline: var(--studio-gutter);
    /* Room for the card's focus ring, which would otherwise be clipped by
     * the scroll container. */
    padding-block: 4px;
    /* ⚠️ NO -webkit-overflow-scrolling: touch. It stood here as the momentum
     * hint iOS once needed, and it is dead in both directions: Chrome has
     * never implemented it (audit-css-valid.mjs reports it as unknown to the
     * engine), and Safari has scrolled overflow containers with momentum by
     * default since iOS 13, which deprecated the property. A declaration no
     * engine reads is bytes in a sheet at 98.8% of its budget. */
    scrollbar-width: none;
  }
  :root[data-theme="studio"] .st-rail::-webkit-scrollbar { display: none; }
  /* WHEN THERE IS NOTHING TO PEEK AT. Today's shops carry two products, and
   * two 372px cards do not come close to filling a desktop scrollport — there
   * is no overflow, so there is no peek and nothing to scroll. The honest
   * degradation is to stop pretending to be a rail: width: max-content plus
   * auto inline margins centres a short track under the centred heading, and
   * the moment the track outgrows the scrollport those auto margins resolve to
   * 0 and it scrolls from the gutter exactly as before. (At the phone tier two
   * cards already overflow, so the peek is live there today.)
   *
   * justify-content: center would have centred it too — and would have made
   * the START of an overflowing track unreachable, which is the classic
   * centred-scroller bug. Auto margins do not have it. */
  :root[data-theme="studio"] .st-rail-track {
    display: flex;
    gap: var(--studio-rail-gap);
    list-style: none;
    padding: 0;
    width: max-content;
    margin: 0 auto;
  }
  :root[data-theme="studio"] .st-rail-item {
    flex: 0 0 var(--studio-rail-card);
    /* centre, not start — see the peek note on .st-rail above. */
    scroll-snap-align: center;
    /* Only the two end cards need this: it keeps an anchor-targeted first or
     * last card off the viewport edge. Equal on both sides, so it cannot bias
     * the centring. */
    scroll-margin-inline: var(--studio-gutter);
  }
  /* The anchor targets take focus programmatically (tabindex="-1"); they must
   * not draw a second ring on top of the card's own. */
  :root[data-theme="studio"] .st-rail-item:focus { outline: none; }
  :root[data-theme="studio"] .st-rail-item:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 4px;
    border-radius: var(--r-card);
  }

  :root[data-theme="studio"] .st-rail-card {
    display: flex; flex-direction: column;
    height: 100%;
    padding: clamp(12px, 1.2vw, 24px);
    background: var(--surface);
    /* A real border here, not the grid's ring: the rail card is a SEPARATED
     * card with 8px corners (the source draws it with border:1px solid #dfdfdf
     * and border-radius:8px), and nothing of it has to tile against a
     * neighbour. The two constructions are meant to differ — that contrast is
     * how a rail reads as a rail beside a ruled table. */
    border: var(--bw-line) solid var(--line);
    border-radius: var(--r-card);
    text-decoration: none;
    color: var(--ink);
    transition: border-color 0.2s ease;
  }
  /* One rule for both states, and no border-radius restatement: .st-rail-card
   * already sets --r-card at a higher specificity than the base sheet's
   * focus-ring radius, so the ring follows the card's own corner. */
  :root[data-theme="studio"] .st-rail-card:hover,
  :root[data-theme="studio"] .st-rail-card:focus-visible { border-color: var(--line-strong); }
  /* Image area = the top ~55% of a 372×500 card (§4.4). */
  :root[data-theme="studio"] .st-rail-panel {
    position: relative;
    display: block;
    aspect-ratio: var(--studio-rail-panel-ar);
    border-radius: var(--r-media);
    background: var(--bg-alt);
    overflow: hidden;
  }
  :root[data-theme="studio"] .st-rail-body {
    display: flex; flex-direction: column;
    gap: clamp(4px, 0.4vw, 8px);
    padding: clamp(14px, 1.4vw, 28px) clamp(4px, 0.6vw, 12px) clamp(6px, 0.6vw, 12px);
  }
  /* Name → h6, the ramp's rung for a COMPACT card / rail item — one below the
   * grid card's h5, which is exactly the relationship the two cards had when
   * they were measured at 30 and 26px. Tracking is h6's 0em, never negative. */
  :root[data-theme="studio"] .st-rail-name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
    /* The rail card is the narrowest name slot in the theme. */
    overflow-wrap: break-word;
  }
  /* Meta row → label, the ramp's rung for meta lines, in the label face. Tight
   * leading because the rail card is the theme's shortest body box. Colour is
   * --ink-body (16.1:1 on white) rather than --ink-mute, because this line is
   * dense spec text, not a struck secondary price. */
  :root[data-theme="studio"] .st-rail-meta {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-body);
  }
  /* The rail card's own price slot → h6, the price rung, same as the grid
   * card's: --ink-mute is what keeps it under the name, not a smaller size.
   * It carries a RANGE (§4.4), so it is allowed to fold onto a second line in
   * a narrow card rather than overflow. */
  :root[data-theme="studio"] .st-rail-price {
    font-family: var(--f-display);
    font-size: var(--t-h6);
    font-weight: var(--w-display);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    font-variant-numeric: tabular-nums;
    color: var(--ink-mute);
    overflow-wrap: break-word;
  }

  /* The measured arrow row: exactly TWO controls, centred BELOW the rail
   * (§4.4) — rebuilt as real links to the first and last card, so both
   * actually move the rail with no JS. */
  :root[data-theme="studio"] .st-rail-nav {
    display: flex; justify-content: center; align-items: center;
    /* The source's default "these belong together" gap. */
    gap: var(--gap-sm);
    margin-top: clamp(20px, 2.4vw, 48px);
    padding-inline: var(--studio-gutter);
  }
  /* THE 64px CIRCLE. --ctrl-circle-size and --bw-ctrl are declared in tokens.ts
   * for exactly this control — "64px square, 99px radius, 2px #151515 ring, no
   * fill" — and until now nothing consumed them, which is how this act ended up
   * shipping a 36px glyph in a bare 44px hit box a third of the intended size.
   *
   * The ring IS the control's boundary, so WCAG 1.4.11's 3:1 applies to it:
   * --line-strong is 18.3:1 on white, far past the floor, and it is the
   * source's own ink for this ring. Hover fills the circle rather than moving
   * it — the same discipline as the cards, where state is a change of frame and
   * never a lift.
   *
   * 64px is its own ≥44px target (WCAG 2.5.8); no padding is doing that job. */
  :root[data-theme="studio"] .st-rail-go {
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: var(--ctrl-circle-size);
    block-size: var(--ctrl-circle-size);
    /* currentColor, so the ring and the arrow are ONE value. At rest that is
     * --ink: a #151515 ring around a #151515 arrow on the page ground, which
     * is the source's "2px ring, no fill" exactly. On hover the ground fills
     * and the same one value flips to white, giving the ring-inside-a-dark-
     * shape that the theme already uses as its inset hairline. Two
     * declarations instead of five, and they cannot disagree. */
    border: var(--bw-ctrl) solid currentColor;
    border-radius: var(--r-circle);
    color: var(--ink);
    text-decoration: none;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-rail-go:hover {
    background: var(--ink-invert);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-rail-go:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    /* Round (§9): arrows are circles, never sharp like the word-carrying CTAs.
     * The base sheet's 4px would draw a rounded square around a circle. */
    border-radius: var(--r-circle);
  }
  /* The glyph fills the ring rather than sitting at its shipped 36px, which
   * inside a 64px control would leave a 12px arrow adrift in a lot of white.
   * 100% of the 60px content box scales the arrow itself to ~21px — the usual
   * glyph-to-button ratio for an icon control this size — and the viewBox
   * keeps it centred on both axes without any nudging. */
  :root[data-theme="studio"] .st-rail-go .st-arrow-svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }
  /* icons.ts draws §4.14's arrow inside its stadium outline, which is correct
   * wherever the glyph is the whole control. Inside this ring it would be a
   * second boundary for one control — a rounded rectangle floating in a circle.
   * The stadium is the SVG's only STROKED path and the arrow its only filled
   * one, so hiding path[stroke] keeps icons.ts the single home of the
   * geometry instead of copying a bare arrow into this file. */
  :root[data-theme="studio"] .st-rail-go .st-arrow-svg path[stroke] { display: none; }

  /* A control that cannot do anything must not look like it can, and must not
   * take a click. aria-disabled rather than the disabled attribute because
   * these are anchors, and an anchor that stops being focusable mid-scroll
   * would move the user's focus somewhere unrelated. A disabled control is
   * exempt from 1.4.11, which is why the 0.3 opacity on the ring is allowed to
   * fall under 3:1 — and it is the only place in this act that does. */
  :root[data-theme="studio"] .st-rail-go[aria-disabled="true"] {
    opacity: 0.3;
    pointer-events: none;
  }

  /* Pagination. Appended by behaviour.ts, so the slot is empty and collapses
   * to nothing without script — the arrows alone still work as anchors. */
  :root[data-theme="studio"] .st-dots {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding-inline: clamp(4px, 0.8vw, 12px);
  }
  /* A dot is an interactive control, so its resting fill is its own boundary
   * and 1.4.11's 3:1 applies: --line is 1.33:1 on white and was failing it.
   * --line-ctrl (#949494) is the token that exists for precisely this — the
   * quiet control rung at 3.03:1 — and it keeps the pagination reading as
   * quieter than the arrows beside it. */
  :root[data-theme="studio"] .st-dot {
    appearance: none;
    border: 0;
    padding: 0;
    /* 8px dot in a 24px hit area — the source's dot size, WCAG 2.5.8's target.
     * The visible dot is drawn by the background, not the box. */
    inline-size: 24px;
    block-size: 24px;
    background: radial-gradient(circle at 50% 50%,
      var(--line-ctrl) 0 4px, transparent 4px);
    border-radius: var(--r-circle);
    cursor: pointer;
    transition: background 0.25s ease;
  }
  :root[data-theme="studio"] .st-dot:hover {
    background: radial-gradient(circle at 50% 50%,
      var(--ink-mute) 0 4px, transparent 4px);
  }
  :root[data-theme="studio"] .st-dot[aria-current="true"] {
    background: radial-gradient(circle at 50% 50%,
      var(--ink) 0 4px, transparent 4px);
  }
  :root[data-theme="studio"] .st-dot:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-dot { transition: none; }
  }

  /* ---- the family comparison table (see compareTable) ------------------
   *
   * Built in the PDP spec table's language — hairline rules, body rung on both
   * sides, the term/value distinction carried by COLOUR rather than by size,
   * because the ramp has no separate table rung. What differs is the axis: the
   * PDP's is a two-column list of one model, this is one row per property
   * across three.
   *
   * The scroller exists for the phone, where four columns cannot fit 390px and
   * squashing them would wrap "1 x 3 KM + obtočna 0,35 KM" to four lines in a
   * 90px cell. min-inline-size is what makes it scroll rather than squash, and
   * it is stated in ch so it tracks the type rather than a guess about the
   * viewport: a label column plus three value columns of about 22 characters.
   * Above the tablet tier the table is narrower than its container and the
   * scroller never engages. */
  :root[data-theme="studio"] .st-cmp {
    margin-top: var(--gap-xl);
  }
  :root[data-theme="studio"] .st-cmp-h {
    margin: 0 0 var(--gap-md);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
  }
  /* Hidden where it would not be true — see the note beside the markup. */
  /* ⚠️ 939, NOT 809, AND FOR 130px THE TABLE WAS SHEARED WITH NO HINT. Its own
   * min-inline-size is 74ch, which measures 867px intrinsic, so it does not
   * fit until about 940. Measured overflow of .st-cmp-scroll on both hub
   * pages: 107px at 810, 83 at 834, 57 at 860, 17 at 900, 0 at 940 — while the
   * hint was hidden from 810 up. At 834 the third column, the most expensive
   * model on the page, was cut mid-glyph: "2 × 3 KM + obtočna", "ameriški
   * akril · izola", "410 kg prazen · 2.2". The note below justifies hiding it
   * because the table fits above the tablet tier; it does not. */
  :root[data-theme="studio"] .st-cmp-hint { display: none; }
  @media (max-width: 939px) {
    :root[data-theme="studio"] .st-cmp-hint {
      display: block;
      margin: calc(-1 * var(--gap-sm)) 0 var(--gap-md);
      font-family: var(--f-body);
      font-size: var(--t-body);
      font-weight: var(--w-body);
      letter-spacing: var(--ls-body);
      line-height: var(--lh-body);
      color: var(--ink-mute);
    }
  }
  :root[data-theme="studio"] .st-cmp-scroll {
    overflow-x: auto;
    overscroll-behavior-inline: contain;
  }
  /* A focusable scroll region draws a ring when it is tabbed to, and that ring
   * is the only thing telling a keyboard user the arrows will now move the
   * table. :focus-visible so a pointer click does not light it up. */
  /* THE SCROLL EDGE, SAID VISUALLY. The mobile hint text says the table
   * scrolls; the sheared last column said it too, by accident and mid-glyph.
   * Same device as the chrome nav: a scroll-driven mask that fades whichever
   * edge still has content past it, and is INACTIVE — no mask at all — the
   * moment the table fits its port, which is why it needs no media query. */
  @supports (animation-timeline: scroll()) {
    :root[data-theme="studio"] .st-cmp-scroll {
      animation: st-cmp-edges linear both;
      animation-timeline: scroll(self inline);
    }
    @keyframes st-cmp-edges {
      from {
        -webkit-mask-image:
          linear-gradient(to right, #000 0, #000 0, #000 calc(100% - 36px), transparent 100%);
        mask-image:
          linear-gradient(to right, #000 0, #000 0, #000 calc(100% - 36px), transparent 100%);
      }
      /* ⚠️ NO LEFT FADE AT THE END OF THE SCROLL — that stop used to read
       * "transparent 0, #000 36px", and it now lands on the STICKY LABEL
       * COLUMN. The two devices were saying opposite things: the fade says
       * "there is more behind this edge", and the sticky column's whole job
       * is that there is not — it is the row's legend, pinned. Scrolled
       * right, every label was dimmed to half ink.
       *
       * The right-hand fade is the one that carries the affordance, and it is
       * still here in the "from" stop; at the end of the scroll there is
       * nothing to the right to promise, so this stop fades neither edge. */
      to {
        -webkit-mask-image:
          linear-gradient(to right, #000 0, #000 0, #000 100%, #000 100%);
        mask-image:
          linear-gradient(to right, #000 0, #000 0, #000 100%, #000 100%);
      }
    }
  }
  :root[data-theme="studio"] .st-cmp-scroll:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
  :root[data-theme="studio"] .st-cmp-table {
    inline-size: 100%;
    min-inline-size: 74ch;
    border-collapse: collapse;
    text-align: left;
  }
  :root[data-theme="studio"] .st-cmp-table tr {
    border-bottom: 1px solid var(--line);
  }
  :root[data-theme="studio"] .st-cmp-table thead tr {
    border-bottom: 1px solid var(--line-strong);
  }
  :root[data-theme="studio"] .st-cmp-table th,
  :root[data-theme="studio"] .st-cmp-table td {
    padding: clamp(11px, 1vw, 20px) clamp(10px, 1.2vw, 24px);
    vertical-align: top;
  }
  /* ⚠️ THE LABEL COLUMN STICKS, because without it the table loses its own
   * legend the moment it is used. It scrolls sideways inside .st-cmp-scroll —
   * correctly, and the page never moves — but the labels were static, so
   * scrolled fully right at 390 the reader saw "5 oseb · 2 ležalnika / 50 /
   * 9,3 m² (100 sf) / 3 leta / ZR801" with nothing on screen saying which
   * figure was which. A comparison table whose rows are unlabelled is a grid
   * of numbers.
   *
   * The background is opaque and not transparent: the sticky column is
   * painted OVER the cells sliding under it, and --bg is the ground this
   * table sits on. z-index above the row hover wash, below nothing else.
   *
   * ⚠️ THE EDGE IS PAINTED BY THE CELL'S OWN BACKGROUND, and it took three
   * tries to get a line to appear at all. border-inline-end is out because
   * the table is border-collapse:collapse and in that model the cell borders
   * belong to the TABLE, not the cell — they stay where the table put them
   * while the sticky cell slides away from them. box-shadow is out for a
   * blunter reason: Chromium does not paint a box-shadow on a table cell in
   * the collapsed border model AT ALL. It computes — the probe read back
   * "rgb(223,223,223) 1px 0px 0px 0px" — and it renders nothing, so a whole
   * scan line either side of the edge came back 255,255,255 for four
   * different shadows including a 14px one at 0.28 alpha.
   *
   * A background gradient is painted, and it travels with the sticky cell.
   * The line therefore sits one pixel INSIDE the cell rather than one pixel
   * outside it, which is a difference nobody can see.
   *
   * It is a permanent rule rather than a scrolled-only one: where the table
   * fits, a hairline between the row labels and the data is the legend rule a
   * comparison table wants anyway.
   *
   * The wider inline-end padding is what keeps the sliced column readable as
   * something passing BENEATH the labels. At 10px, the half-glyphs of the
   * cell sliding under the edge sat two characters from the label's last
   * letter and read as part of it: "Črpalke  a 0,35 KM", "Krmilnik  + ·". */
  :root[data-theme="studio"] .st-cmp-table th:first-child,
  :root[data-theme="studio"] .st-cmp-table td:first-child {
    padding-inline-start: 0;
    padding-inline-end: clamp(18px, 1.2vw, 24px);
    position: sticky;
    inset-inline-start: 0;
    z-index: 1;
    background:
      linear-gradient(to right, var(--bg) calc(100% - 1px), var(--line) calc(100% - 1px));
  }
  /* The model names are the one display-face run in the table, at the product
   * name's own rung — these are the same objects the cards above name, and a
   * heading a rung louder here would claim they are something else. */
  :root[data-theme="studio"] .st-cmp-model {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    white-space: nowrap;
  }
  :root[data-theme="studio"] .st-cmp-model a {
    color: var(--ink);
    text-decoration: none;
    /* 44px target on one line of table header: padding grows the hit area,
     * the negative margin hands the pixels back to the row height. */
    display: inline-block;
    padding-block: 10px;
    margin-block: -10px;
  }
  /* ⚠️ UNDERLINED AT REST, because :hover is the one affordance a touch device
   * never gets. These six model names are links into the product pages and on
   * every phone and tablet they read as ordinary bold column headers. */
  :root[data-theme="studio"] .st-cmp-model a {
    text-decoration: underline;
    text-underline-offset: 0.22em;
    text-decoration-thickness: 1px;
    text-decoration-color: var(--line-strong);
  }
  :root[data-theme="studio"] .st-cmp-model a:hover,
  :root[data-theme="studio"] .st-cmp-model a:focus-visible {
    text-decoration-color: currentColor;
  }
  :root[data-theme="studio"] .st-cmp-label {
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
    white-space: nowrap;
  }
  /* The row under the pointer, said quietly. Thirteen data rows across six
   * columns is exactly where an eye loses its line; the wash is the panel
   * token so it reads as paper, not selection. */
  :root[data-theme="studio"] .st-cmp tbody tr:hover > th,
  :root[data-theme="studio"] .st-cmp tbody tr:hover > td,
  :root[data-theme="studio"] .st-page-cmp tbody tr:hover > th,
  :root[data-theme="studio"] .st-page-cmp tbody tr:hover > td {
    background: var(--bg-alt);
  }
  :root[data-theme="studio"] .st-cmp-v {
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  /* ---- responsive ----------------------------------------------------
   * The tiers are the theme's own 1199/809, not the 1000/640 this module used
   * to invent — a module inventing its own breakpoints is how a storefront ends
   * up changing shape twice on the way down.
   *
   * The source keeps THREE columns at the tablet tier (its DOM transcription is
   * explicit: "no override — still 3 columns") and drops to a single column at
   * the phone tier. So the intermediate 2-up this had is gone. What pays for it
   * is the card padding: 2.2vw puts ~20px inside an ~253px tablet cell, which
   * is the source's own compensation (its tablet card variant is 25px), and it
   * leaves ~210px of content — tight, and the shape the source ships. */
  /* ⚠️ 619, NOT 809. Between 620 and 809 the grid dropped to ONE column, so at
   * 768 a single card was 718px wide around a 642x535 photograph and
   * /trgovina ran 6,773px tall against 3,748 at 1440 — 81% longer. Two columns
   * at 768 give 359px cells, WIDER than the 308px cells this theme already
   * ships at 1024, so the measure was never the constraint. The same 768
   * screen already renders .st-imp-row three across, so one page was showing
   * two densities. */
  /* 620-809: TWO across. The base is three (flex: 1 1 33.3%), which at 620
   * gives 189px cards — denser than anything this theme ships. Two gives 296px
   * at 620 and 359px at 768, both above the 308px cells it already uses at
   * 1024, so the tier is comfortable at both ends. */
  @media (min-width: 620px) and (max-width: 809px) {
    /* ⚠️ flex-grow: 0, AND WITHOUT IT THIS TIER SHIPPED A CARD FIVE TIMES THE
     * AREA OF ITS NEIGHBOURS. The base rule's growing trailing row is a
     * deliberate trade (see the note at the top of this file: "an oversized
     * cell still reads as a table, a missing cell reads as a bug"), and it
     * holds at three columns, where a trailing card is at most half again as
     * wide. At TWO columns with three cards it does not: the third card takes
     * the whole row. Measured on /masazni-bazeni at 768 — 358x421, 358x421,
     * then 716x719, with its picture frame at 642x535 against the siblings'
     * 284x237. That is 2.3x the linear size and 5x the area, and it reads as
     * a different component rather than as a wider cell.
     *
     * Held at 50% the orphan is a half-width card with the other half empty,
     * which is what every grid on the web does with an odd count. */
    :root[data-theme="studio"] .st-card { flex: 0 1 50%; }
  }
  @media (max-width: 619px) {
    :root[data-theme="studio"] .st-card { flex-basis: 100%; }
    :root[data-theme="studio"] .st-sec-h { max-width: none; }
  }
  /* Four cells is the one count where the plain flex result (three, then a lone
   * full-width fourth) looks worse than a smaller complete rectangle, so a
   * quantity query turns it into 2×2. Scoped to ≥810 so it can never fight the
   * phone tier's single column, and a browser without :has() simply keeps the
   * 3 + 1 — which is still a sealed table, just a less pleasant one.
   *
   * AND IT STOPS AT 1599, because above that the rule below does the same job
   * without the compromise. Its premise is that three columns are all the band
   * can hold, so the fourth card has nowhere to go but a line of its own; that
   * stops being true at a 1600px viewport, and 2×2 there means two 779px cards
   * per row — a product cell nearly two columns wide, which is what every
   * other rule in this file forbids.
   *
   * It also stands down when the last cell is a util tile, because the rule
   * further down settles that case better: 2×2 would make a PRODUCT cell half
   * the table wide, for the same reason. */
  @media (min-width: 810px) and (max-width: 1599px) {
    :root[data-theme="studio"] .st-grid:has(> .st-card:nth-child(4):last-child):not(:has(> .st-util:last-child)) > .st-card {
      flex-basis: 50%;
    }
  }
  /* FOUR COLUMNS, ON THE SCREENS THAT HAVE THEM AND THE COUNTS THAT SEAL.
   *
   * This is the answer to "the grid is frozen at three columns and the cards
   * stopped growing at 1440". Half of that was the container and tokens.ts has
   * fixed it — the cards now grow to 519.3px at 1920 instead of stopping at
   * 452.7. The other half is the count, and the count cannot simply follow the
   * width: a table that wraps four across when it holds five cards leaves the
   * fifth alone on a line, and flex-grow blows it up to the full 1558px band
   * beside four 389.5px siblings. So the trigger is BOTH conditions — a band
   * wide enough, and a card count that a fourth column divides.
   *
   * 4n:last-child is the count test (4 cards, 8 cards, …) and it reads the
   * grid rather than the page, so a family that grows a fourth model gets four
   * across here instead of the 2×2 above, with no other rule to remember.
   * 1600px is the width test, and it is where a quarter of the band (379.5px)
   * first exceeds the narrowest cell the three-column table itself produces
   * (372.7px, at a 1200px viewport) — so four across never yields a cell this
   * theme has not already shipped, and every pixel above 1600 goes straight
   * into them: 389.5px at 1920. Below 1600 the 2×2 rule owns the four-card
   * case.
   *
   * 25%, not a length: four of them are the line exactly at any band width, so
   * the seal is arithmetic rather than a threshold that has to be re-derived
   * every time the container moves. The trailing-tile grid is excluded here as
   * everywhere — see the next rule for why five cells only ever seal at 3. */
  @media (min-width: 1600px) {
    :root[data-theme="studio"] .st-grid:has(> .st-card:nth-child(4n):last-child):not(:has(> .st-util:last-child)) > .st-card {
      flex-basis: 25%;
    }
  }
  @media (min-width: 810px) {
    /* A PRODUCT CELL IS NEVER WIDER THAN A COLUMN. The trailing util tile
     * absorbs whatever the last line has left over.
     *
     * This is the other half of the uniformity problem, and it was doing more
     * visible damage than the panel. The home grid ships five cells — four
     * products and the load-bearing tile — so the products filled one line and
     * the fourth shared the next with the tile at flex: 1 1 33.3%, which grew
     * them both to half the table. Measured at 1440: the SWIM 580 MAXI cell
     * came out 679px wide against its own siblings' 453px, its panel 616px
     * against 389px, and the cutout inside it painted 616x424 where the
     * identical file one row above painted 389x268. One product rendered at
     * 2.5 times another's area for no reason a visitor could name. No panel
     * geometry can fix that, because the cells were not the same size.
     *
     * So a product cell is frozen at exactly one column and the util tile
     * keeps its flex-grow. The tile carries no picture, so width costs it
     * nothing — it is type, and type is happy at any measure. Whatever the
     * product count leaves over, the tile takes: three products and it fills
     * the line alone, four and it takes two thirds, five and it takes one
     * column like everyone else. The table stays sealed at every count and no
     * product is ever bigger than its neighbour.
     *
     * calc(100% / 3) rather than the 33.3% the basis uses elsewhere: with
     * flex-grow off, 33.3% would leave 0.1% of the line unpainted and the
     * table's right-hand rule would sit a pixel and a half inside the gutter.
     *
     * THIS GRID STAYS AT THREE COLUMNS WHEREVER ANOTHER ONE GOES TO FOUR, and
     * the reason is arithmetic rather than taste. The home grid is four
     * products plus a tile two columns wide — six column-units. Six into three
     * columns is two full rows (3, then 1 + tile); into four columns it is one
     * row of four products and the tile alone on the next, which is the one
     * arrangement this band must not have: the tile is a question asked BESIDE
     * the goods, and a full-width strip under the table is a different device.
     * Five cells into five columns is the only other seal, and at 1920 that is
     * a 312px product cell — narrower than the same card at 1280, so a wider
     * screen would be showing smaller products. The cards take the width the
     * widened container gives them instead: 452.7px at 1440, 519.3px at 1920,
     * with the tile at 1038.7px. */
    :root[data-theme="studio"] .st-grid:has(> .st-util:last-child) > .st-card {
      flex: 0 0 calc(100% / 3);
    }
    :root[data-theme="studio"] .st-grid:has(> .st-util:last-child) > .st-util:last-child {
      flex: 1 1 calc(100% / 3);
    }
  }

  /* ---- motion --------------------------------------------------------- */
  @media (prefers-reduced-motion: reduce) {
    /* Nothing here animates position, so the readable static state is the
     * resting one: no transitions, no residual transform. The rail keeps its
     * scrollability but drops snapping and smooth scrolling, which are the
     * only motion it has — an anchor still lands on its card, instantly. */
    :root[data-theme="studio"] .st-card,
    :root[data-theme="studio"] .st-rail-card,
    :root[data-theme="studio"] .st-rail-go,
    :root[data-theme="studio"] .st-util-go {
      transition: none;
      transform: none;
    }
    :root[data-theme="studio"] .st-rail {
      scroll-snap-type: none;
      scroll-behavior: auto;
    }
  }
`;

/**
 * Photo-ready slot. Carries the shop's product DRAWING, not an image request.
 *
 * It used to be a bordered rectangle at 12% ink with a soft shadow — which
 * screenshotting revealed for what it was: an empty grey box, repeated eight
 * times down the page wherever the product should be. A drawing of the actual
 * goods reads as an illustration (so it cannot be mistaken for the photograph
 * it stands in for) while still telling a visitor what is on the page.
 *
 * A shop with no drawing keeps the neutral mass rather than borrowing another
 * shop's product. A real photograph drops into .st-shot with no restructuring.
 */
/**
 * @param eager  Load this one immediately, for a card that is above the fold.
 *
 * ⚠️ THE FIRST CARD OF A COLLECTION IS THE LCP AND WAS LAZY. Measured in
 * Chromium with the preview's eager-rewrite disabled: on /masazni-bazeni the
 * first card's photograph is inside the initial viewport at BOTH 390x844
 * (266x222px) and 1440x900 (326x272px), and it carried loading="lazy" with no
 * fetchpriority — so on the two pages built to rank, the picture a buyer sees
 * first queued behind 166 kB of fonts and a 170 kB stylesheet. Same on
 * /swim-spa for all three cards at desktop widths.
 *
 * Only the FIRST is promoted. Making the row eager would trade one late image
 * for three competing ones, which is the fault this fixes in the other
 * direction; everything below the fold stays lazy.
 */
function shot(
  ctx: RenderCtx,
  variant = 0,
  photo?: PdpPhoto,
  artKey?: ArtKey,
  eager = false,
): string {
  // A real photograph beats the drawing every time. The drawing exists because
  // most models have no photography yet, not because it is preferred.
  if (photo) {
    return (
      '<span class="st-shot">' +
      // TWO SLOTS, ONE HINT, so the term is the wider of them. This helper
      // fills the grid card's plate AND the rail card's panel, and the plate
      // is the larger: 375.3px at 1920 (a 519.3px card less its padding and
      // the panel's mat) against the rail's 323.9px, which is capped by
      // --studio-rail-card. 376px covers both with nothing to spare.
      //
      // The old 372px was the rail card's own width and happened to sit close
      // enough while --studio-container was 1440 and the plate topped out at
      // 326px. At 1560 it does not: the plate now paints 3.3px wider than the
      // hint promised, and a hint that is short is the one direction that
      // costs sharpness. Below 810 the grid is one column and the plate takes
      // 84.2vw at its widest (a 809px viewport), so 92vw still covers it.
      productImg(photo, "st-shot-img", "(max-width: 809px) 92vw, 376px", photo.alt, eager) +
      "</span>"
    );
  }
  // The CARD's drawing, not the shop's.
  //
  // This keyed off ctx.shop.key, which was correct while a shop sold one kind
  // of thing: every card wanted the same silhouette. It stopped being correct
  // the day the shop added swim spas — three 5.8 m pools rendered as the
  // square 2 m hot tub, under their own heading, next to their own lengths.
  // A drawing of the wrong shape of product is the same error as a photograph
  // of the wrong model, and it is harder to spot because a drawing already
  // looks approximate.
  const art = productArt(artKey === "swimspa" ? "swimspa" : ctx.shop.key, variant);
  return (
    '<span class="st-shot" aria-hidden="true">' +
    (art ? '<span class="st-shot-art">' + art + "</span>" : '<span class="st-shot-mass"></span>') +
    '<span class="st-shot-floor"></span>' +
    "</span>"
  );
}

function pdpHref(ctx: RenderCtx, slug?: string): string {
  return ctx.shop.routeSlugs["/product"] + "/" + (slug ?? ctx.pdp.slug) + ctx.q;
}

/**
 * The struck compare-at price of §4.7.
 *
 * ProductCard does not (yet) carry a compare-at field, and inventing one from
 * `price` would put a fabricated discount on a €3k product — so the row simply
 * omits the <s> until the content layer supplies a real string. Read
 * structurally rather than via a cast to a wider ProductCard so adding
 * `compareAt?: string` to the interface needs no change here.
 */
function compareAt(p: ProductCard): string | null {
  const v: unknown = (p as { compareAt?: unknown }).compareAt;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * The numeric value behind a display price, for ordering only.
 *
 * Prices reach this module already formatted in the shop's locale ("1.790 €",
 * and "1.790,50 €" if a shop ever prices to the cent), so the grouping dot is
 * dropped and the decimal comma becomes a point. Anything unparseable returns
 * null and is simply left out of the comparison rather than sorting as 0.
 */
function priceValue(s: string): number | null {
  const m = /[0-9][0-9.,]*/.exec(s);
  if (m === null) return null;
  const n = Number.parseFloat(m[0].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * §4.4's measured price RANGE ("$1,099 - $3,099" in the source; "1.290 € –
 * 1.790 €" here).
 *
 * The endpoints are printed from the shop's OWN strings — the range is
 * assembled, never re-formatted — so separators, currency position and spacing
 * stay exactly as the content layer wrote them. Returns null when the range
 * would be degenerate (one product, or every price equal, or nothing
 * parseable); the caller then prints the single price, as the baseline's
 * one-product case does.
 */
function priceRange(items: ProductCard[]): string | null {
  let lo: { v: number; s: string } | null = null;
  let hi: { v: number; s: string } | null = null;
  for (const p of items) {
    const v = priceValue(p.price);
    if (v === null) continue;
    if (lo === null || v < lo.v) lo = { v, s: p.price };
    if (hi === null || v > hi.v) hi = { v, s: p.price };
  }
  if (lo === null || hi === null || lo.v === hi.v) return null;
  // U+2013 EN DASH between the endpoints, per Slovenian typographic practice.
  return lo.s + " – " + hi.s;
}

/** Sentence-case a keyword for use as a heading, in the shop's own locale. */
function capFirst(s: string, locale: string): string {
  return s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
}

/**
 * §4.7 — best sellers / product grid. This is the `products` SectionKey
 * renderer, so it keeps id="izbor": the hero CTA links to that fragment.
 *
 * The "util" discriminator is handled exactly as sections.ts products() does —
 * `"util" in p` narrows UtilCard from ProductCard — so a shop that ships a
 * comparison tile in the middle of its product list keeps it here too.
 */
/**
 * The grid's cards, for a given set.
 *
 * Extracted because the shop now sells two families and each gets its own
 * grid — the category rail above sends a visitor to one or the other, and a
 * single grid mixing 2 m tubs with 5.8 m swim spas would undo that. Both
 * grids are the same construction on purpose: they are the same kind of
 * choice, made twice.
 */
/**
 * `level` is the heading rank the card names take, and it has to be told
 * rather than fixed.
 *
 * On the home page the grid sits under an h2 section heading, so a card name
 * is an h3 and the outline reads h1 -> h2 -> h3. A COLLECTION page has no
 * section heading — its h1 IS "Masažni bazeni" — so the same h3 produced
 * h1 -> h3 on /masazni-bazeni and /swim-spa: a skipped level on the two
 * pages the site is built to rank, invisible for as long as the audit's
 * route table was derived from routeSlugs, which does not contain them.
 */
function productCards(
  ctx: RenderCtx,
  items: readonly (ProductCard | UtilCard)[],
  level: "h2" | "h3" = "h3",
): string {
  const href = pdpHref(ctx);
  return items
    .map((p: ProductCard | UtilCard, i: number) => {
      if ("util" in p) {
        const go = p.href ? p.href + ctx.q : href;
        return (
          // The heading and its paragraph are ONE object and the CTA is
          // another, so they are wrapped as two rather than left as three
          // loose children. The tile is the widest cell in the table — 905px
          // at 1440 against a product cell's 453 — and three loose children in
          // a flex column could only ever stack down its left edge, leaving
          // the right half of the widest cell in the grid empty. Wrapped, the
          // two objects sit on one line with the CTA at the far edge and wrap
          // to two lines on a phone with no media query and no second layout
          // to keep in step. A div rather than a span because <h3> and <p> are
          // flow content: an <a> in the grid inherits a flow context and may
          // carry them, a <span> may not.
          '<a class="st-card st-util" href="' + esc(go) + '">' +
          '<div class="st-util-txt">' +
          "<" + level + ' class="st-util-h">' + esc(p.h) + "</" + level + ">" +
          '<p class="st-util-p">' + esc(p.p) + "</p>" +
          "</div>" +
          // The arrow is an ELEMENT, not text: a screen reader announcing
          // "Naročite ogled desna puščica" was the cost of the glyph in copy.
          '<span class="st-util-go">' + esc(p.cta) +
          ' <span aria-hidden="true">→</span></span>' +
          "</a>"
        );
      }
      const was = compareAt(p);
      return (
        '<a class="st-card" href="' + esc(pdpHref(ctx, p.slug)) + '">' +
        '<span class="st-card-panel">' +
        (p.badge ? '<span class="st-badge">' + esc(p.badge) + "</span>" : "") +
        shot(ctx, i, p.photo, p.art, i === 0) +
        "</span>" +
        '<span class="st-card-body">' +
        "<" + level + ' class="st-card-name">' + esc(p.name) + "</" + level + ">" +
        // THE CARD KNEW THIS AND WAS NOT SAYING IT. ProductCard.meta has
        // carried "5 oseb · 50 šob · 2,30 × 2,30 m" since the catalogue was
        // written, and the grid printed a name and a price and nothing else —
        // so six models differing in exactly these three numbers looked, at a
        // glance, like six prices. It is the line a buyer compares on, it is
        // already derived from the supplier's own figures, and it costs one
        // row of the card.
        (p.meta ? '<span class="st-card-meta">' + esc(dotBind(p.meta)) + "</span>" : "") +
        '<span class="st-price-row">' +
        // The struck price's only cue is the line through it, and most screen
        // readers announce neither <s> nor text-decoration — so the row would
        // read as two unqualified prices, the higher one last. A hidden word
        // inside each carries the distinction into the accessibility tree.
        '<span class="st-price"><span class="st-shop-vh">cena </span>' +
        esc(p.price) + "</span>" +
        (was
          ? '<s class="st-was"><span class="st-shop-vh">prejšnja cena </span>' +
            esc(was) + "</s>"
          : "") +
        '<span class="st-vat">z DDV</span>' +
        "</span></span></a>"
      );
    })
    .join("");
}

export function renderStudioProducts(ctx: RenderCtx): string {
  const cards = productCards(ctx, ctx.content.products);

  return (
    '<section class="st-shop" id="izbor"><div class="st-shop-in">' +
    '<div class="st-shop-head"><div class="st-shop-title">' +
    // "Izbrani modeli", NOT "Najbolje prodajano": a best-seller claim is a
    // statement about sales data, and this shop has none yet — asserting one
    // is a misleading practice under UCPD Art. 6 / ZVPot-1, the same doctrine
    // that keeps invented reviews off the page.
    '<p class="st-eyebrow">Izbrani modeli</p>' +
    // The heading is the shop's own hand-written CTA line, not a templated
    // sentence: four shops on this baseline must not share a visible line.
    '<h2 class="st-sec-h">' + esc(ctx.content.cta) + "</h2>" +
    "</div>" +
    // The way to the OTHER two. This band shows four of six models and ended
    // on the util tile: a visitor whose model was not among the four had no
    // route to the rest from the band that asked them to choose.
    '<p class="st-shop-more st-shop-more--head"><a class="st-btn-line" href="' +
    esc(ctx.shop.routeSlugs["/products"] + ctx.q) + '">Vsi modeli</a></p>' +
    "</div>" +
    // The grid element is what carries the ruled table's 1px padding, so an
    // EMPTY one is not an empty box — it is a 2px grey hairline sitting under
    // the heading with nothing in it. The section itself still renders: the
    // hero's CTA links to #izbor and that anchor must not disappear because a
    // shop's catalogue is momentarily empty.
    (cards === "" ? "" : '<div class="st-grid">' + cards + "</div>") +
    "</div></section>"
  );
}

/**
 * §4.4 — the category rail.
 *
 * Titled from the shop's plural keyword (the one term this domain exists to
 * rank for). Util tiles are filtered out: they are not products and a rail
 * card has no room for a paragraph.
 *
 * The measured pair of stadium arrows is rebuilt as TWO anchors — prev to the
 * first card, next to the last — each pointing at a `tabindex="-1"` list item.
 * Following one scrolls the rail (and moves focus into it) with no script, so
 * both controls act; the numbered one-per-card row this used to emit was
 * neither the measured device nor the measured shape.
 */
export function renderStudioRail(ctx: RenderCtx): string {
  // CATEGORIES FIRST, where the shop has them.
  //
  // This device is the page's second act, straight under the hero, and its
  // job is to answer "which KIND of thing?" before the grid further down
  // answers "which of these?". While the shop sold one family that question
  // had no content and the rail printed model cards instead. It sells two
  // now — 1.95-2.30 m tubs and 3.90-5.80 m swim spas — and a buyer with a
  // terrace and a buyer with a garden are not choosing between neighbouring
  // options, so the models are the wrong first question by a wide margin.
  const cats = ctx.content.categories ?? [];
  if (cats.length > 0) return renderCategoryRail(ctx, cats);

  const items = ctx.content.products.filter(
    (p: ProductCard | UtilCard): p is ProductCard => !("util" in p),
  );
  // An empty rail would render a heading and a nav row that lead nowhere.
  if (items.length === 0) return "";

  const href = pdpHref(ctx);
  const title = capFirst(ctx.shop.keyword.plural, ctx.shop.locale.intl);

  // §4.4 prints a range in this slot, and for the source theme's rail — whose
  // cards are CATEGORIES — that is correct: "Seating, 1.490 € – 1.990 €"
  // describes a group. These cards are not categories. Each one names a
  // specific model and lists its own wattage, capacity and volume, so a span
  // across the whole offer printed under SAVNA DUO states a price that model
  // does not have. Slovenia transposes Directive 98/6/EC on price indication
  // in ZVPot: the selling price shown for an identified product has to be that
  // product's. So the card carries its own price, and the range moves to the
  // section head, where it does describe what it is next to.
  const range = priceRange(items);

  const cards = items
    .map((p, i) => {
      const id = "st-rail-" + String(i + 1);
      return (
        '<li class="st-rail-item" data-st-item id="' + esc(id) + '" tabindex="-1">' +
        '<a class="st-rail-card" href="' + esc(pdpHref(ctx, p.slug)) + '">' +
        '<span class="st-rail-panel">' + shot(ctx, i, p.photo, p.art, i === 0) + "</span>" +
        '<span class="st-rail-body">' +
        '<span class="st-rail-name">' + esc(p.name) + "</span>" +
        '<span class="st-rail-meta">' + esc(p.meta) + "</span>" +
        '<span class="st-rail-price">' + esc(p.price) + "</span>" +
        "</span></a></li>"
      );
    })
    .join("");

  // §4.4's two stadium arrows. With a single card there is nothing to move
  // between, so the row is not rendered at all. With two or more both controls
  // always act: they scroll the rail when the track overflows, and move focus
  // into the end card when it does not.
  //
  // Icon-only by design, so there is no visible text for WCAG 2.5.3 to
  // contradict — the aria-label IS the whole accessible name, and it names
  // where the link actually goes (the ends of the rail), not a scroll step it
  // cannot promise. The glyph is aria-hidden inside icons.ts.
  const last = "#st-rail-" + String(items.length);
  const nav =
    items.length < 2
      ? ""
      : '<a class="st-rail-go st-arrow st-arrow--prev" data-st-prev href="' +
        esc("#st-rail-1") +
        '" aria-label="Prejšnji model">' + arrowIcon("left") + "</a>" +
        '<span class="st-dots" data-st-dots></span>' +
        '<a class="st-rail-go st-arrow" data-st-next href="' + esc(last) +
        '" aria-label="Naslednji model">' + arrowIcon("right") + "</a>";

  return (
    '<section class="st-rail-sec" data-st-slider aria-labelledby="st-rail-h">' +
    '<div class="st-rail-head">' +
    '<p class="st-eyebrow">Ponudba</p>' +
    '<h2 class="st-sec-h" id="st-rail-h">' + esc(title) + "</h2>" +
    (range ? '<p class="st-rail-range">' + esc(range) + "</p>" : "") +
    "</div>" +
    '<div class="st-rail" data-st-scroll><ul class="st-rail-track">' + cards + "</ul></div>" +
    (nav ? '<nav class="st-rail-nav" aria-label="Pomik po ponudbi">' + nav + "</nav>" : "") +
    "</section>"
  );
}


/**
 * The category rail: one card per product family.
 *
 * Two differences from the model rail above, and both are the point.
 *
 * The card carries a PRICE RANGE. A model card may not — ZVPot, transposing
 * Directive 98/6/EC, requires the price shown against an identified product to
 * be that product's, which is why the model rail pushes its range up into the
 * section head. A range against a family is not a claim about any one unit; it
 * is what the family costs, and it is the number that tells a visitor within a
 * second whether to keep reading.
 *
 * And there is no scroller. Two cards do not need arrows, dots or a scroll
 * container: with a fixed, small number of families the row is a grid, and a
 * carousel control that cannot move anything is a promise the page does not
 * keep. The model rail keeps its arrows because a catalogue grows.
 */
function renderCategoryRail(ctx: RenderCtx, cats: readonly Category[]): string {
  // Both figures come from what this band and this catalogue actually hold —
  // families from the row being rendered, models from the shop's own list.
  const families = cats.length;
  const models = (ctx.content.pdps ?? []).length;
  const cards = cats
    .map((c, i) => {
      // A photograph where the family has one, its drawing where it does not.
      // Never the other family's picture: the whole row exists to show that
      // these two are different sizes of thing.
      const art = c.art ? productArt(c.art === "swimspa" ? "swimspa" : ctx.shop.key, i) : null;
      const visual = c.photo
        ? productImg(
            c.photo,
            "st-cat-img",
            // Measured against the layout, not guessed, and EVERY term covers
            // the whole of its own media range rather than one reference
            // width. The fixed term is the widest the frame ever paints:
            // 716.6px, at 1920 and above, where the band has stopped growing
            // at --studio-container. It read 632px until now, which was the
            // frame at 1440 and was right while the container was 1440 too —
            // tokens.ts widened it to 1560 and the same frame went to 716.6,
            // so the hint under-promised by 13% and would have picked a rung
            // one size too soft on every large screen once these photos get a
            // srcset ladder through /admin. (632px still describes 1440
            // exactly; a term that only describes its narrowest case is the
            // bug being fixed.) The 46vw term covers the tablet range's
            // widest, 44.6vw at 1199, and the 92vw phone term is sized for the
            // WIDEST single-column case — 89.8vw at a ~745px viewport, not the
            // 80.5vw of a 390px phone.
            "(max-width: 809px) 92vw, (max-width: 1199px) 46vw, 717px",
            c.photo.alt,
          )
        : art
          ? '<span class="st-cat-art" aria-hidden="true">' + art + "</span>"
          : "";
      return (
        '<li class="st-cat-item">' +
        '<a class="st-cat-card" href="' + esc(c.href) + '">' +
        '<span class="st-cat-panel">' +
        visual +
        "</span>" +
        '<span class="st-cat-body">' +
        '<span class="st-cat-name">' + esc(c.name) + "</span>" +
        '<span class="st-cat-meta">' + esc(dotBind(c.meta)) + "</span>" +
        '<span class="st-cat-price">' + esc(c.price) +
        (c.price.includes("€") ? ' <span class="st-vat">z DDV</span>' : "") +
        "</span>" +
        "</span></a></li>"
      );
    })
    .join("");

  return (
    '<section class="st-cat-sec" aria-labelledby="st-cat-h">' +
    '<div class="st-cat-head">' +
    '<p class="st-eyebrow">Ponudba</p>' +
    // "Dve družini" over the old "Izberite vrsto bazena": one screen below,
    // the model grid is headed by the shop's own CTA line ("Izberite svoj
    // bazen"), and two consecutive bands both opening with an imperative
    // "Izberite …" read as the same band rendered twice. This one names the
    // fact, the next one makes the ask.
    // ⚠️ IT SAID "Dve družini, šest modelov" — TYPED, on a page that derives
    // the same two figures correctly one band away (hero.ts's wordmark chip
    // renders "6 modelov" from ctx.content.pdps.length). A shop that gains a
    // seventh model, or a second shop with three, got a heading stating a
    // number the catalogue under it contradicts — and the spelled-out
    // numerals carry Slovenian's dual, so "Dve družini" is ungrammatical for
    // any shop with one family or with five.
    '<h2 class="st-sec-h" id="st-cat-h">' +
    esc(
      counted(ctx.shop.locale.intl, families, ["družina", "družini", "družine", "družin"]) +
      ", " +
      counted(ctx.shop.locale.intl, models, ["model", "modela", "modeli", "modelov"]),
    ) +
    "</h2>" +
    // The guided choice offered AT the moment of choosing. This band asks the
    // visitor to pick a family; the finder exists for the visitor who cannot,
    // and until now it was reachable only from the hub and the comparison —
    // two pages further in than where the question is actually asked.
    // Only where there is a choice to guide: the route is optional, and a
    // catalogue of one has nothing for three questions to choose between.
    (ctx.shop.routeSlugs["/finder"] && models > 1
      ? '<p class="st-cat-help"><a href="' +
        esc(ctx.shop.routeSlugs["/finder"] + ctx.q) +
        '">Ne veste, kateri? Odgovorite na dve do tri vprašanja →</a></p>'
      : "") +
    "</div>" +
    '<ul class="st-cat-row">' + cards + "</ul>" +
    "</section>"
  );
}


/**
 * A collection page: one product family, its own H1, its own grid.
 *
 * This replaced a swim-spa-shaped section on the HOME page. Printing every
 * model of every family on the landing page made it a catalogue dump — and
 * it made the page try to be the landing page for two different queries at
 * once, which is a worse landing page for each. The home page keeps the
 * keyword and routes; these pages do the selling.
 */
/**
 * The models in one family, side by side.
 *
 * WHY A COLLECTION PAGE NEEDED THIS. /masazni-bazeni is one of the two pages
 * this shop is built to rank, and it carried a heading, one paragraph, three
 * cards and a link — 2550px at 1440, half of it the closing band and the
 * footer. A visitor who has got that far has already chosen the family and is
 * choosing BETWEEN THREE MODELS, and the only thing on the page to choose on
 * was the cards' one-line meta.
 *
 * EVERY FIGURE HERE IS ALREADY WRITTEN. The rows come from each model's own
 * PdpContent.spec — the same pairs the product page prints in its first
 * panel — copied verbatim and never reordered, so nothing on this table is a
 * claim that is not already made, in the same words, one click away. The
 * shop's spec order is the shop's; a table that sorts the interesting rows to
 * the top would be the renderer editing the owner's document.
 *
 * NO PRICES. The cards directly above carry each model's price with its "z
 * DDV" qualifier, and a price under a model name in a table would be the same
 * claim stripped of the qualifier — and, while pricesProvisional is set, of
 * the sentence that says the figure is not final. Article 4 of Directive
 * 98/6/EC wants the selling price shown unambiguously; the cards do that and
 * this table does not need to repeat it.
 *
 * IT RENDERS OR IT DOES NOT. Two models at least, every one of them with a
 * product page, and every one carrying the SAME spec labels in the SAME
 * order. Anything else — a model with no page, a family whose specs were
 * written to different templates — and the function returns nothing rather
 * than a table with holes in it or, worse, one that lines a "Filter" value up
 * under a "Filtracija" heading.
 */
function compareTable(ctx: RenderCtx, c: Collection): string {
  const pdps = ctx.content.pdps ?? [];
  const rows: PdpContent[] = [];
  for (const p of c.products) {
    if (!p.slug) return "";
    const d = pdps.find((x) => x.slug === p.slug);
    if (!d || d.spec.length === 0) return "";
    rows.push(d);
  }
  if (rows.length < 2) return "";

  const labels = rows[0]!.spec.map((r) => r[0]);
  for (const d of rows) {
    if (d.spec.length !== labels.length) return "";
    if (d.spec.some((r, i) => r[0] !== labels[i])) return "";
  }

  const base = ctx.shop.routeSlugs["/product"] + "/";
  const head =
    "<tr><td></td>" +
    rows
      .map(
        (d) =>
          '<th scope="col" class="st-cmp-model">' +
          '<a href="' + esc(base + d.slug + ctx.q) + '">' + esc(d.title) + "</a>" +
          "</th>",
      )
      .join("") +
    "</tr>";

  const body = labels
    .map(
      (label, i) =>
        "<tr>" +
        '<th scope="row" class="st-cmp-label">' + esc(label) + "</th>" +
        rows
          .map((d) => '<td class="st-cmp-v">' + esc(dotBind(d.spec[i]![1])) + "</td>")
          .join("") +
        "</tr>",
    )
    .join("");

  // The scroller is a labelled, focusable region because on a phone this table
  // is wider than the screen: a scroll container that only a pointer can move
  // fails WCAG 2.1.1, and the PDP's gallery stage already carries exactly this
  // treatment for exactly this reason.
  return (
    '<div class="st-cmp">' +
    '<h2 class="st-cmp-h" id="st-cmp-h">Primerjajte modele</h2>' +
    // The hint is CSS-hidden above the tablet tier, where the table fits and
    // the sentence would be a lie. Below it the table is always wider than the
    // screen — min-inline-size is 74ch against a 390px viewport — so it is
    // always true where it shows. A cut-off column is a hint of a kind, but it
    // is the kind a visitor reads as "this page only compares one model".
    '<p class="st-cmp-hint">Tabelo povlecite v stran za ostale modele.</p>' +
    '<div class="st-cmp-scroll" role="region" tabindex="0" aria-labelledby="st-cmp-h">' +
    '<table class="st-cmp-table">' +
    "<thead>" + head + "</thead>" +
    "<tbody>" + body + "</tbody>" +
    "</table></div></div>"
  );
}

export function renderStudioCollection(ctx: RenderCtx, c: Collection): string {
  // h2: this page's h1 is the collection name, and nothing sits between it
  // and the grid.
  const cards = productCards(ctx, c.products, "h2");
  // The SIBLING FAMILY, linked from the foot of the grid.
  //
  // A collection page used to stop dead after its last card: no next step, no
  // way across to the other half of the catalogue, and nothing telling a
  // visitor who has just decided a 2,30 m shell is too small that 4,50 m
  // exists. It is also the internal link between the two pages this shop
  // needs to rank, which a crawler only has if the markup carries it.
  const other = (ctx.content.collections ?? []).find((x) => x.path !== c.path);
  return (
    '<section class="st-shop" id="izbor"><div class="st-shop-in">' +
    '<div class="st-shop-head"><div class="st-shop-title">' +
    '<p class="st-eyebrow">' + esc(ctx.shop.name) + "</p>" +
    '<h1 class="st-sec-h">' + esc(c.h1) + "</h1>" +
    "</div>" +
    '<p class="st-shop-intro">' + esc(c.intro) + "</p>" +
    "</div>" +
    (cards === "" ? "" : '<div class="st-grid">' + cards + "</div>") +
    // Between the cards and the way out: somebody still on this page after the
    // grid is comparing, not browsing.
    compareTable(ctx, c) +
    (other
      ? '<p class="st-shop-more"><a class="st-btn-line" href="' +
        esc(other.path + ctx.q) + '">Poglejte tudi — ' + esc(other.navLabel) + "</a></p>"
      : "") +
    "</div></section>"
  );
}

/**
 * The shop hub: every family on one page, each as its own band with a link
 * into its full page.
 *
 * The nav needs a single "Trgovina" that answers "what do you sell?", and
 * with two families that answer is a page rather than a redirect to one of
 * them. Each band shows the family's grid and then hands off, so the hub is
 * useful on its own and never a dead end.
 */
/**
 * The hub's opening decision as two cards — see hubChoice in content/types.ts
 * for why this is structure and not the paragraph it replaced.
 *
 * A <ul> of links-with-facts, not headings: the families' h2s live on the
 * bands below, and a second pair up here would give the document two "Masažni
 * bazeni" headings four hundred pixels apart. The whole card is one anchor —
 * the decision it presents ends in going to the band that answers it.
 */
function hubChoice(ctx: RenderCtx): string {
  const cards = ctx.content.hubChoice ?? [];
  if (cards.length === 0) return "";
  return (
    '<ul class="st-hub-choice">' +
    cards
      .map(
        (c) =>
          '<li class="st-hub-card">' +
          '<a class="st-hub-card-a" href="' + esc(c.anchor) + '">' +
          '<p class="st-hub-card-h">' + esc(c.label) + "</p>" +
          '<p class="st-hub-card-p">' + esc(c.text) + "</p>" +
          '<dl class="st-hub-card-facts">' +
          c.facts
            .map(
              (f) =>
                "<div><dt>" + esc(f[0]) + "</dt><dd>" + esc(f[1]) + "</dd></div>",
            )
            .join("") +
          "</dl>" +
          '<span class="st-hub-card-go">' + esc(c.anchorLabel) + " ↓</span>" +
          "</a></li>",
      )
      .join("") +
    "</ul>"
  );
}

export function renderStudioShopHub(ctx: RenderCtx): string {
  const cols = ctx.content.collections ?? [];
  if (cols.length === 0) return "";
  return (
    '<section class="st-shop st-shop--title"><div class="st-shop-in">' +
    '<div class="st-shop-head"><div class="st-shop-title">' +
    '<p class="st-eyebrow">' + esc(ctx.shop.name) + "</p>" +
    '<h1 class="st-sec-h">Trgovina</h1>' +
    "</div>" +
    // The hub's own sentence, not its meta description: a page that answers
    // "what do you sell?" has to answer it on the page, and this one opened
    // with the bare word and then a screen of white before the first band.
    (ctx.content.hubIntro
      ? '<p class="st-shop-intro">' + esc(ctx.content.hubIntro) + "</p>"
      : "") +
    // The guided choice, offered exactly where indecision lives: a visitor
    // reading a hub of two families and six models is the visitor the three
    // questions were built for.
    (ctx.shop.routeSlugs["/finder"] && (ctx.content.pdps ?? [ctx.content.pdp]).length > 1
      ? '<p class="st-shop-intro"><a class="st-fnd-link" href="' +
        esc(ctx.shop.routeSlugs["/finder"] + ctx.q) +
        '">Ne veste, kateri? Odgovorite na dve do tri vprašanja <span aria-hidden="true">→</span> predlagamo model.</a></p>'
      : "") +
    "</div>" +
    hubChoice(ctx) +
    "</div></section>" +
    cols
      .map(
        (c) =>
          '<section class="st-shop" id="' + esc(c.path.replace(/^\//, "")) + '">' +
          '<div class="st-shop-in">' +
          // No c.intro here — the hub used to print each collection's full
          // nine-line intro beside its band heading, and the SAME paragraph
          // again one click later as the collection page's own opening. The
          // hubChoice cards above already say what holds the families apart;
          // the model-by-model walk belongs to the page that owns the family.
          '<div class="st-shop-head">' +
          '<div class="st-shop-title">' +
          '<h2 class="st-sec-h">' + esc(c.h1) + "</h2>" +
          "</div>" +
          "</div>" +
          '<div class="st-grid">' + productCards(ctx, c.products) + "</div>" +
          '<p class="st-shop-more"><a class="st-btn-line" href="' +
          esc(c.path + ctx.q) + '">Vsi modeli — ' + esc(c.navLabel) + "</a></p>" +
          "</div></section>",
      )
      .join("") +
    hubOutro(ctx)
  );
}

/**
 * The hub's closing prose — see hubOutro in content/types.ts for why a page
 * made of grids needs one. Set in the measure the rest of the site reads at
 * rather than the grid's full width: this is the only running text on the
 * page and it should look like text, not like another band.
 */
function hubOutro(ctx: RenderCtx): string {
  const secs = ctx.content.hubOutro ?? [];
  if (secs.length === 0) return "";
  return (
    '<section class="st-shop st-shop--outro"><div class="st-shop-in">' +
    '<div class="st-hub-outro">' +
    // Each section is its own block, so the band can put them in columns.
    // Flat h2/p siblings can only ever be one column, which is what stranded
    // 58% of this band — see the CSS.
    secs
      .map(
        (sec) =>
          '<div class="st-hub-outro-sec">' +
          "<h2>" + esc(sec.h) + "</h2>" +
          sec.p.map((t) => "<p>" + esc(t) + "</p>").join("") +
          "</div>",
      )
      .join("") +
    "</div></div></section>"
  );
}
