/**
 * STUDIO — commerce acts (docs/STUDIO-BASELINE.md §4.4 and §4.7).
 *
 *   §4.7 Best sellers / product grid — left-aligned heading at the gutter,
 *        three cards per row, built as a HAIRLINE-RULED TABLE. The source's
 *        grid is `gap:0` with `padding:1px`, and every card carries
 *        `box-shadow:0 0 0 1px #dfdfdf`. Two neighbours' rings land on the
 *        same seam, so the "grid lines" are not drawn by anything — they ARE
 *        the overlap. Card padding 32px; a tall --bg-alt panel holds the
 *        product; name, then a price row (price · struck compare-at · VAT)
 *        beneath. HOVER TURNS THE FRAME BLACK — the signature card state.
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

import { esc, type RenderCtx } from "../../render/sections";
import { productArt } from "./product-art";
import { productImg } from "./media";
import { arrowIcon } from "./icons";
import type {
  ArtKey,
  Category,
  Collection,
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
    /* §4.7: the product panel is ~620px tall inside a ~474px-wide content box
     * → 0.765. Expressed as a ratio (not a length) so the panel keeps its
     * proportion at every column width; with name + price + padding beneath,
     * it lands at ~78% of the card's height as measured. */
    --studio-panel-ar: 3 / 4;
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
  /* A panel holding a photograph goes WHITE.
   *
   * The drawing needs the grey ground to read against; a studio shot taken on
   * white does not, and on grey its own background prints as a white rectangle
   * inside the panel — which looks like a broken crop rather than a product.
   * Matching the panel to the photograph's ground is what makes it read as one
   * object, and it is what the source does with its own cutouts. */
  :root[data-theme="studio"] .st-card-panel:has(.st-shot-img),
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
    padding-block: var(--studio-rhythm);
  }
  :root[data-theme="studio"] .st-shop-in {
    max-width: var(--studio-container);
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
  }
  /* Left-aligned AT THE GUTTER (§4.7) — the grid heading is never centred. */
  :root[data-theme="studio"] .st-shop-head {
    margin-bottom: clamp(28px, 3.4vw, 68px);
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
   * a square cell a rounded panel is a shape, not a broken rule. */
  :root[data-theme="studio"] .st-card-panel {
    position: relative;
    display: block;
    aspect-ratio: var(--studio-panel-ar);
    border-radius: var(--r-media);
    background: var(--bg-alt);
    overflow: hidden;
    isolation: isolate;
  }
  /* Legibility scrim under the badge. Invisible on the flat placeholder, and
   * already in place for the day a photograph fills the panel. It follows the
   * badge to the top-RIGHT corner. */
  :root[data-theme="studio"] .st-card-panel::after {
    content: "";
    position: absolute; inset: 0 0 auto auto; z-index: 2;
    width: 70%; height: 38%;
    background: radial-gradient(
      100% 100% at 100% 0%,
      color-mix(in srgb, var(--bg) 55%, transparent),
      transparent 70%
    );
  }
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
   * Solid ink ground rather than the source's 1px #dfdfdf light pill, because
   * this chip sits ON the panel grey where that hairline is 1.17:1 and the chip
   * would have no edge at all; #ffffff on #151515 is 18.3:1. --r-tag (50px) and
   * the 6px/20px padding are the baseline's own tag geometry. */
  :root[data-theme="studio"] .st-badge {
    position: absolute; z-index: 3;
    top: var(--gap-sm); right: var(--gap-sm);
    padding: 6px 20px;
    border-radius: var(--r-tag);
    background: var(--ink-invert);
    color: var(--on-invert);
    /* A badge is a chip: the label role, tight leading, in the label face. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
  }

  :root[data-theme="studio"] .st-card-body {
    display: flex; flex-direction: column;
    gap: clamp(8px, 0.8vw, 16px);
    /* The panel is ~78% of the card; this is the remaining ~22%. */
    padding-top: clamp(16px, 1.8vw, 36px);
  }
  /* Card title → h5 (32/26/24), the ramp's rung for a LARGE card's title; the
   * rail's compact cards take h6 below. The measured −0.01em is gone: h5 tracks
   * at +0.02em in the source, and nothing in this theme tracks negative. */
  :root[data-theme="studio"] .st-card-name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
    /* A long unbroken Slovenian model name (or an SKU) must fold inside the
     * card rather than push the grid column open. */
    overflow-wrap: break-word;
  }
  :root[data-theme="studio"] .st-price-row {
    display: flex; align-items: baseline; flex-wrap: wrap;
    /* The source's price row is gap:10px — the theme's dominant micro gap,
     * which tokens.ts carries as --gap-sm. A clamp here was inventing a value
     * the source states outright. */
    gap: var(--gap-sm);
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
   * large one. Not uppercased: the abbreviation is already capitalised. */
  :root[data-theme="studio"] .st-vat {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-mute);
  }

  /* The util tile: same ring, inverted ground. Its ring is --ink-invert rather
   * than --line so the table's rule meets the dark cell flush instead of
   * outlining it in grey, and its hover twin of "frame goes black" is "frame
   * goes white" — the strongest hairline available on #151515. It needs the
   * same z-index lift as the product card, and for the same reason. */
  :root[data-theme="studio"] .st-util {
    justify-content: space-between;
    gap: clamp(16px, 2vw, 40px);
    background: var(--ink-invert);
    --st-ring: var(--ink-invert);
    color: var(--on-invert);
  }
  /* The z-index lift comes from .st-card:hover above — this tile carries both
   * classes — so only the ink changes here. It has to come after that rule in
   * the sheet, which it does. */
  :root[data-theme="studio"] .st-util:hover,
  :root[data-theme="studio"] .st-util:focus-visible { --st-ring: var(--on-invert); }
  /* The util tile fills one grid slot, so its heading is a LARGE card's title
   * → h5, the same rung as .st-card-name. The measured pass had it a rung
   * louder (42px) than the product name; the tile keeps that emphasis through
   * the inversion — black ground, white ink — which outshouts 10px of size. */
  :root[data-theme="studio"] .st-util-h {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--on-invert);
    overflow-wrap: break-word;
  }
  /* The tile's one line of prose, standing between its heading and its CTA →
   * lead, the standfirst rung (20/16/18), not body: it introduces the tile
   * rather than being ordinary running copy. Lead is set in --w-body-med. */
  :root[data-theme="studio"] .st-util-p {
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--on-invert-mute);
    max-width: 34ch;
  }
  /* Reads as a control, so it is SHARP (§9). */
  :root[data-theme="studio"] .st-util-go {
    align-self: flex-start;
    border: 1px solid color-mix(in srgb, var(--on-invert) 40%, transparent);
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
    color: var(--on-invert);
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-util:hover .st-util-go {
    background: var(--on-invert); color: var(--ink);
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
  :root[data-theme="studio"] .st-shop-intro {
    margin: clamp(12px, 1.2vw, 20px) auto 0;
    max-width: 62ch;
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-shop-more {
    margin: clamp(20px, 2vw, 36px) 0 0;
    text-align: center;
  }
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
    padding-block: var(--studio-rhythm);
  }
  :root[data-theme="studio"] .st-cat-head {
    max-width: var(--studio-container);
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
    text-align: center;
    margin-bottom: clamp(28px, 3.4vw, 68px);
  }
  :root[data-theme="studio"] .st-cat-head .st-sec-h {
    max-width: 24ch;
    margin-inline: auto;
  }
  :root[data-theme="studio"] .st-cat-row {
    list-style: none;
    margin: 0 auto;
    padding-inline: var(--studio-gutter);
    max-width: var(--studio-container);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
    gap: clamp(16px, 1.6vw, 32px);
  }
  :root[data-theme="studio"] .st-cat-card {
    display: flex; flex-direction: column;
    height: 100%;
    padding: clamp(12px, 1.2vw, 24px);
    background: var(--surface);
    border: var(--bw-line) solid var(--line);
    border-radius: var(--r-card);
    text-decoration: none;
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
  :root[data-theme="studio"] .st-cat-img {
    inline-size: 100%; block-size: 100%;
    object-fit: contain;
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
   * model card — see the note on renderCategoryRail. */
  :root[data-theme="studio"] .st-cat-price {
    margin-block-start: clamp(2px, 0.3vw, 6px);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  @media (hover: hover) {
    :root[data-theme="studio"] .st-cat-card { transition: border-color 0.2s ease, transform 0.2s ease; }
    :root[data-theme="studio"] .st-cat-card:hover {
      border-color: var(--ink);
      transform: translateY(-2px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-cat-card { transition: none; }
    :root[data-theme="studio"] .st-cat-card:hover { transform: none; }
  }

  :root[data-theme="studio"] .st-rail-sec {
    background: var(--bg);
    padding-block: var(--studio-rhythm);
    /* The rail is full-bleed; the section must never widen the page. */
    overflow: clip;
  }
  /* Centred heading (§4.4) — the counterpoint to §4.7's gutter-left one. */
  :root[data-theme="studio"] .st-rail-head {
    max-width: var(--studio-container);
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
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
    -webkit-overflow-scrolling: touch;
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
  @media (max-width: 809px) {
    :root[data-theme="studio"] .st-card { flex-basis: 100%; }
    :root[data-theme="studio"] .st-sec-h { max-width: none; }
  }
  /* Four cells is the one count where the plain flex result (three, then a lone
   * full-width fourth) looks worse than a smaller complete rectangle, so a
   * quantity query turns it into 2×2. Scoped to ≥810 so it can never fight the
   * phone tier's single column, and a browser without :has() simply keeps the
   * 3 + 1 — which is still a sealed table, just a less pleasant one. */
  @media (min-width: 810px) {
    :root[data-theme="studio"] .st-grid:has(> .st-card:nth-child(4):last-child) > .st-card {
      flex-basis: 50%;
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
function shot(ctx: RenderCtx, variant = 0, photo?: PdpPhoto, artKey?: ArtKey): string {
  // A real photograph beats the drawing every time. The drawing exists because
  // most models have no photography yet, not because it is preferred.
  if (photo) {
    return (
      '<span class="st-shot">' +
      productImg(photo, "st-shot-img", "(max-width: 809px) 92vw, 372px", photo.alt) +
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
function productCards(ctx: RenderCtx, items: readonly (ProductCard | UtilCard)[]): string {
  const href = pdpHref(ctx);
  return items
    .map((p: ProductCard | UtilCard, i: number) => {
      if ("util" in p) {
        return (
          '<a class="st-card st-util" href="' + esc(href) + '">' +
          '<h3 class="st-util-h">' + esc(p.h) + "</h3>" +
          '<p class="st-util-p">' + esc(p.p) + "</p>" +
          '<span class="st-util-go">' + esc(p.cta) + "</span>" +
          "</a>"
        );
      }
      const was = compareAt(p);
      return (
        '<a class="st-card" href="' + esc(pdpHref(ctx, p.slug)) + '">' +
        '<span class="st-card-panel">' +
        (p.badge ? '<span class="st-badge">' + esc(p.badge) + "</span>" : "") +
        shot(ctx, i, p.photo, p.art) +
        "</span>" +
        '<span class="st-card-body">' +
        '<h3 class="st-card-name">' + esc(p.name) + "</h3>" +
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
    '<div class="st-shop-head">' +
    '<p class="st-eyebrow">Najbolje prodajano</p>' +
    // The heading is the shop's own hand-written CTA line, not a templated
    // sentence: four shops on this baseline must not share a visible line.
    '<h2 class="st-sec-h">' + esc(ctx.content.cta) + "</h2>" +
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
        '<span class="st-rail-panel">' + shot(ctx, i, p.photo, p.art) + "</span>" +
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
            "(max-width: 809px) 92vw, (max-width: 1199px) 46vw, 560px",
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
        '<span class="st-cat-meta">' + esc(c.meta) + "</span>" +
        '<span class="st-cat-price">' + esc(c.price) + "</span>" +
        "</span></a></li>"
      );
    })
    .join("");

  return (
    '<section class="st-cat-sec" aria-labelledby="st-cat-h">' +
    '<div class="st-cat-head">' +
    '<p class="st-eyebrow">Ponudba</p>' +
    '<h2 class="st-sec-h" id="st-cat-h">Izberite vrsto bazena</h2>' +
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
export function renderStudioCollection(ctx: RenderCtx, c: Collection): string {
  const cards = productCards(ctx, c.products);
  return (
    '<section class="st-shop" id="izbor"><div class="st-shop-in">' +
    '<div class="st-shop-head">' +
    '<p class="st-eyebrow">' + esc(ctx.shop.name) + "</p>" +
    '<h1 class="st-sec-h">' + esc(c.h1) + "</h1>" +
    '<p class="st-shop-intro">' + esc(c.intro) + "</p>" +
    "</div>" +
    (cards === "" ? "" : '<div class="st-grid">' + cards + "</div>") +
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
export function renderStudioShopHub(ctx: RenderCtx): string {
  const cols = ctx.content.collections ?? [];
  if (cols.length === 0) return "";
  return (
    '<section class="st-shop"><div class="st-shop-in">' +
    '<div class="st-shop-head">' +
    '<p class="st-eyebrow">' + esc(ctx.shop.name) + "</p>" +
    '<h1 class="st-sec-h">Trgovina</h1>' +
    "</div></div></section>" +
    cols
      .map(
        (c) =>
          '<section class="st-shop" id="' + esc(c.path.replace(/^\//, "")) + '">' +
          '<div class="st-shop-in">' +
          '<div class="st-shop-head">' +
          '<h2 class="st-sec-h">' + esc(c.h1) + "</h2>" +
          '<p class="st-shop-intro">' + esc(c.intro) + "</p>" +
          "</div>" +
          '<div class="st-grid">' + productCards(ctx, c.products) + "</div>" +
          '<p class="st-shop-more"><a class="st-btn-line" href="' +
          esc(c.path + ctx.q) + '">Vsi modeli — ' + esc(c.navLabel) + "</a></p>" +
          "</div></section>",
      )
      .join("")
  );
}
