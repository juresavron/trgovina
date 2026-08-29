/**
 * STUDIO — editorial acts (docs/STUDIO-BASELINE.md §4.9, §4.10, §4.11).
 *
 *   §4.9  Impact grid — centred h2 heading + a lead standfirst, then a 3-tile
 *         row (radius 14px) with the measured ASYMMETRY: left a quiet #EFEFEF
 *         tile labelled bottom-left (h5 title + a body sub), centre the hero
 *         tile on the #A8A8A8 ground — wider AND taller than its neighbours,
 *         its content cropped by the frame — right a room photo carrying a
 *         STAT overlay (h2-rung value + label caption) INSTEAD of a label.
 *   §4.10 Dark testimonial — inverted band, centred h2 white heading with the
 *         eye motif large and faint behind it, then one quote at a time as a
 *         TWO-part row centred in the container: left an opening glyph at the
 *         h2 rung over a calm lead-rung quote and its label-rung attribution,
 *         right a circular product medallion on a light panel, and the two
 *         64px circular prev/next controls centred beneath it. §4.10 measured
 *         a third part, a square portrait, and it is deliberately absent — see
 *         .st-tst-fig. It is a REAL slider — a horizontal scroll-snap
 *         container that works with no script, upgraded by behaviour.ts's
 *         generic slider to step by exactly one quote.
 *   §4.11 Blog cards — centred h2 heading, three ~1:1 cards (radius 16px),
 *         photo filling the frame under a bottom gradient scrim, a translucent
 *         pill chip (label rung) and an h5 white title overlaid.
 *
 * Type comes from the ramp in tokens.ts, never from this file. The source emits
 * three literal breakpoint tiers (≥1200 / 810–1199 / ≤809) and retunes the ramp
 * in each, so a clamp cannot reproduce it: every size, weight, tracking and
 * leading below is a bare var(--…) and the tier resolves it. An earlier pass
 * wrote the baseline's 2000px measurements as clamp MAXIMUMS and invented the
 * slope between them; that is what this file no longer does. Measured
 * max-WIDTHS still use min(100%, max(floor, k vw)) — a width belongs to no ramp.
 * The ratios that carry the look are now ramp steps rather than px pairs:
 * h2 : lead on the impact head, h1 : lead-xl : label in the quote stack,
 * h2 : h5 : label on a guide card.
 *
 * THE QUOTES ARE A SLIDER AGAIN, AND THE CONTROLS ARE REAL. An earlier pass
 * stacked the extra reviews under the lead one and deleted the arrows, on the
 * grounds that this Worker shipped no JS and a dead control is worse than no
 * control (§5.2). That premise expired: behaviour.ts ships a generic slider,
 * and the contract for using it is markup, not script — `data-st-slider` on the
 * section, `data-st-scroll` on the scroller, `data-st-item` per quote,
 * `data-st-prev`/`data-st-next` on the controls. No JavaScript is written here.
 *
 * The no-JS floor is the same one commerce.ts's rail stands on and is the part
 * that must not regress: the scroller is a real overflow-x container with
 * scroll-snap, every quote is an anchor target, and the two controls are
 * ANCHORS to the first and last quote. Before the module runs they jump; after
 * it runs they step by one and disable themselves at each end. Nothing is ever
 * hidden behind a control that cannot act.
 *
 * Content comes from ctx only. Field split is deliberate so that a home page
 * composing statement.ts AND this module never prints the same sentence twice:
 * statement.ts owns moat.h2 / content.sub / moat.claim, this module owns
 * moat.steps (tile labels), stats (the tile overlay), reviews and guides.
 *
 * WHAT IS PHOTOGRAPHY AND WHAT IS STILL DRAWN. media.ts splits its assets by
 * what a slot CLAIMS: atmosphere may use the source bundle's furniture
 * photography, a PRODUCT slot may not, because it would read as a picture of
 * the thing being sold. So the room photo lands in the impact grid's stat tile
 * and on the guide cards — all atmosphere — while the impact grid's hero tile
 * keeps its drawn placeholder. The testimonial band's circle is BUILT here
 * regardless: the frame is composition, the picture inside it is inventory.
 * Its face slot is gone rather than filled: a portrait is the strongest truth
 * claim a review can carry, and borrowing a stranger's for it is the one
 * substitution this page may never make.
 *
 * Token discipline (docs/THEMES.md): colors, radii and faces are var(--…)
 * only. tokens.ts is the SINGLE declaration site — ground rungs (--bg-alt,
 * --tile-mid, --ink-invert-2), radii and the rhythm/gutter/gap scale are
 * consumed from there with no local re-declaration and no var() fallback: a
 * second declaration at equal specificity let sheet order silently decide the
 * value storefront-wide. Only the handful of values tokens.ts does not carry
 * (the two measured tile radii, the band-local mixes) are declared below.
 * Every selector is scoped :root[data-theme="studio"] — zarja/lednik/salon
 * share this sheet.
 */

import { esc, type RenderCtx } from "../../render/sections";
import { arrowIcon } from "./icons";
import { OWN_PHOTOS, decorativeImg, sitePhoto } from "./media";

export const STUDIO_EDITORIAL_CSS = `
  /* ---- Values the baseline measures that tokens.ts does not carry ----
   * The gutter, the light and dark rhythms, the card gap, every ground rung
   * and every radius come from tokens.ts and are consumed as bare var(--…)
   * with NO fallback: a fallback here is a second source of truth, and the
   * only way it could ever be used is a sheet assembled without its own
   * token block — which is a bug to fix at the seam, not to paper over. */
  :root[data-theme="studio"] {
    /* §4.9 measured 14px tile radius / §4.11 measured 16px card radius. Both
     * sit between --r-media/--r-card (8px) and --r-lg (40px) with no token
     * rung near them, so each stays a measured local token; clamped so a
     * 390px card is not proportionally rounder than the 2000px original.
     * (An earlier revision of this note cited 12px/24px rungs tokens.ts no
     * longer carries.) */
    --studio-tile-r: clamp(10px, 0.7vw, 14px);
    --studio-guide-r: clamp(10px, 0.8vw, 16px);

    /* §4.10, the two numbers the testimonial band's composition is built from.
     *
     * The medallion's diameter is a WIDTH, so it is a clamp and belongs to no
     * type ramp: the §4.10 measurement of 300px as the ceiling, 18vw through
     * the middle, and a 160px floor because below that a product cutout inside
     * it stops being a picture of anything. 18 rather than 20 because the
     * panel inside it is white: a 288px disc at full brightness out-weighed
     * two lines of 20px prose badly enough that the row stopped being evenly
     * weighted and became a picture with a caption.
     *
     * It no longer disappears on a phone either. The band lost its portrait,
     * and a lone column of small text under a centred heading is exactly the
     * "three-part composition with a hole in it" this pass exists to fix.
     * Stacked above the quote the medallion costs no width at all.
     *
     * --studio-tst-stage is the composition's own measure, DERIVED rather than
     * picked: a reading measure, the medallion, and one --gap-2xl between
     * them. Deriving it is what lets the quote column resolve to exactly that
     * measure while the pair sits centred in the container, and what lets the
     * prev/next controls sit under the medallion without a second, hand-tuned
     * number to keep in sync.
     *
     * THE MEASURE IN IT IS THE WIDE ONE, --studio-read, NOT --studio-read-
     * narrow. Built from the narrow measure the stage came to 620 + 64 + 300 =
     * 984px, and once tokens.ts widened the container to 1560 that was an
     * ISLAND: measured at 1920, a 984px stage inside a 1640px band left 328px
     * of empty black on each side, 51.2% of the viewport for the one band
     * whose whole content is a sentence and a picture. 863 + 64 + 300 = 1227px
     * spends that back — 74.8% of the band, 328px of margin down to 206.5 —
     * and it costs nothing at the widths where the band is the smaller of the
     * two: up to a 1228px viewport min(100%, …) still hands the stage the
     * whole band, exactly as before (1148px at 1228, 1186.2px at 1440).
     *
     * What it does cost is measure: 863px at --t-lead is about 80 characters,
     * past the 45–75 that running text wants. That is the trade, made
     * deliberately and only here — a testimonial is two lines read once, not a
     * page of prose, and 863px is the theme's own wide reading measure rather
     * than a number invented for this band. Below 1080px the stage collapses
     * back to --studio-read-narrow alone (see the stacked tier), so the
     * narrow measure still governs everywhere the row is a column. */
    /* ⚠️ THE STAGE IS THE READING MEASURE NOW, and it used to be the measure
     * PLUS a gap PLUS the medallion. With the medallion gone that calc was
     * reserving 300px of nothing at the end of every quote — the band would
     * have kept its old width and hung the text off to one side of it.
     *
     * --studio-tst-disc goes with it. The only thing still asking for it was
     * .st-tst-nav-in, which sized the control pair to the medallion's column
     * so the arrows sat under it; there is no column to sit under, so the
     * pair takes its own width. */
    --studio-tst-stage: min(100%, var(--studio-read));
    /* The hairline the inverted band uses for its own frames and chips. --line
     * (#dfdfdf) is a white-ground value and glares here. */
    --studio-line-invert: color-mix(in srgb, var(--on-invert) 16%, transparent);
  }

  /* ================= §4.9 Impact grid ================= */
  :root[data-theme="studio"] .st-imp {
    background: var(--bg);
    /* BOTTOM ONLY — see --studio-rhythm. This section shares the page's white
     * ground with its neighbour, so the separation between them is paid once,
     * here, exactly as the source pays it (0 40px 170px). Paying it on both
     * sides is what made every boundary twice the source's. */
    padding-block: 0 var(--studio-rhythm);
    /* The hero tile is deliberately oversized; the page must never scroll
     * sideways because of it (§6). */
    overflow: clip;
  }
  :root[data-theme="studio"] .st-imp-head {
    text-align: center;
    margin-bottom: clamp(28px, 3.4vw, 68px);
  }
  /* A section heading, so the h2 rung (60/50/38) whole: Clash Display 500,
   * tracking --ls-h2, leading --lh-h2. The measured pass read it as 68px at
   * −0.025em — the source's display tracking is 0em and never negative. */
  :root[data-theme="studio"] .st-imp-h {
    margin: 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--ink);
    text-wrap: balance;
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The standfirst under the head — the lead rung (20/16/18, Satoshi 500,
   * tracking --ls-body, leading --lh-lead). The tier floor is the ramp's own
   * phone value, which is what keeps this line off caption sizes; --ink-mute is
   * tokens.ts's muted rung for TEXT rather than the decorative alpha.
   *
   * The line is three separate trust claims, so a break INSIDE a claim is a
   * typesetting error the reader has to repair — the 34vw measure this had
   * split "Ogled lokacije pred dostavo" across both lines at 1440. Each
   * claim is now an unbreakable-while-it-fits chip (.st-imp-claim), balance
   * picks the evenest of the splits that remain legal, and 46vw is sized so
   * the widest two-line split of today's copy fits at every three-column
   * tier. */
  :root[data-theme="studio"] .st-imp-sub {
    max-width: min(100%, max(20rem, 46vw));
    margin: clamp(12px, 1.2vw, 24px) auto 0;
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--ink-mute);
    text-wrap: balance;
  }
  :root[data-theme="studio"] .st-imp-more {
    margin: 14px 0 0;
    font-size: var(--t-body);
    line-height: var(--lh-body);
  }
  :root[data-theme="studio"] .st-imp-more a {
    color: var(--ink);
    text-underline-offset: 3px;
    /* A lone link is a target, not a word in a sentence: the padding grows
     * the hit area past the 24px floor and the negative margin hands the
     * space back to the layout. */
    display: inline-block;
    padding-block: 12px;
    margin-block: -12px;
  }
  /* One claim, one line: breaks belong at the separators only. inline-block,
   * NOT white-space: nowrap — a chip that fits its line wraps as one unit
   * either way, but when a claim alone is wider than a very narrow viewport
   * an inline-block wraps INTERNALLY where nowrap would clip past the tile
   * column. The joining dot is tied to the claim before it with a no-break
   * space in the markup, so a wrapped line never opens with a stray dot. */
  :root[data-theme="studio"] .st-imp-claim { display: inline-block; }
  /* ≤620: the three claims become three quiet lines. All of them wrap at
   * this width anyway, and wrapped chips with dots at their line ends read
   * as punctuation nobody meant — stacked, the separator has no job. */
  @media (max-width: 620px) {
    :root[data-theme="studio"] .st-imp-claim { display: block; }
    :root[data-theme="studio"] .st-imp-sep { display: none; }
  }

  /* The measured asymmetry. The centre column is 1.22fr against 1fr siblings
   * AND taller (4/5 against 1/1), so with align-items:center it bleeds past
   * its neighbours top and bottom — the hero tile, without a single negative
   * margin that could open a horizontal scrollbar. */
  /* FIVE EQUAL COLUMNS. The old template was 1fr / 1.22fr / 1fr — a centre
   * tile deliberately larger than its neighbours, which is right for a
   * three-part composition and wrong for a list where every item answers the
   * same question. It steps 5 → 3 → 2 rather than stacking to one, because
   * five full-width squares under one heading is 2.600px of scrolling. */
  :root[data-theme="studio"] .st-imp-row {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: stretch;
    gap: var(--studio-card-gap);
  }
  @media (max-width: 1100px) {
    :root[data-theme="studio"] .st-imp-row { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (max-width: 700px) {
    :root[data-theme="studio"] .st-imp-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  /* ---- Below 620px the square tile stops being a tile ------------------
   *
   * ⚠️ MEASURED, not guessed. At 390px the two-column square gave each tile
   * a 158px box, and inside it clamp(16px,1.8vw,36px) of padding on both
   * sides leaves 126px for the label — 32% of the viewport, running the
   * body copy at NINE AND A HALF CHARACTERS PER LINE over four or five
   * lines. Two columns is exactly one column too many, and the arithmetic
   * says so at any width below roughly 620: (620 − 50 gutter − 24 gap) / 2
   * − 32 padding = 241px, which is the last width at which this reads.
   *
   * Stacking to one SQUARE was already rejected above, and rightly: five
   * full-width squares under one heading is ~2.600px of scrolling. So the
   * tile turns on its side instead — picture left at a third of the width,
   * label right, vertically centred. Five of those is ~800px, which is an
   * ordinary phone section, and the label finally gets ~200px of the 340
   * available instead of 126.
   *
   * This is the same markup: only the quiet tile's grid changes from two
   * rows to two columns, and the label's bottom-alignment (which exists so
   * five labels share a baseline ACROSS a row) becomes centring, because
   * stacked there is no row to share a baseline with. */
  /* ⚠️ THE CLASS IS REPEATED THROUGHOUT THIS BLOCK, and it is the only reason
   * any of it applies. A media query adds NO specificity, and three rules
   * below this one — .st-imp-quiet, .st-imp-quiet .st-imp-photo and
   * .st-imp-label — score the same and come later, so source order silently
   * won and the phone layout never rendered.
   *
   * What shipped at 360/390/414 instead, on all five tiles: a 340x240 box with
   * an 86x65 photograph in the top-left corner and the label 138px below it,
   * leaving the 254x65 cell beside the picture and the 86x175 cell under it
   * empty — about 41,000 of 81,600 px², 39% of every tile. Five of them is
   * 1,200px of scroll for five sentences, with the shop's own installation
   * photographs reduced to postage stamps on the device most of its traffic
   * uses. Doubling the class buys the tie. */
  @media (max-width: 619px) {
    :root[data-theme="studio"] .st-imp-row.st-imp-row {
      grid-template-columns: minmax(0, 1fr);
    }
    :root[data-theme="studio"] .st-imp-quiet.st-imp-quiet {
      grid-template-columns: minmax(0, 0.34fr) minmax(0, 1fr);
      grid-template-rows: minmax(0, 1fr);
      /* 15rem was the height of a stacked SQUARE. On its side the tile is
       * as tall as its content wants, with a floor that keeps the picture
       * from collapsing to a sliver when the label is one short line. */
      min-block-size: 8.5rem;
      align-items: center;
    }
    :root[data-theme="studio"] .st-imp-quiet.st-imp-quiet .st-imp-photo {
      grid-column: 1;
      grid-row: 1;
      /* Square, not 4:3: the picture column is narrow here and a landscape
       * frame inside it letterboxes to almost nothing. */
      aspect-ratio: 1 / 1;
      padding: 12%;
    }
    :root[data-theme="studio"] .st-imp-label.st-imp-label {
      grid-column: 2;
      grid-row: 1;
      align-self: center;
      padding: clamp(14px, 3.4vw, 20px) clamp(16px, 4vw, 24px) clamp(14px, 3.4vw, 20px) 0;
    }
    /* The fallback tile (no photograph uploaded) has no in-flow picture, so
     * its grey mass and shadow are pinned to percentages of the WHOLE tile.
     * Those percentages were drawn for a square with the label below it; on
     * a landscape tile they run straight under the text. Confine them to
     * the picture column's share of the width. */
    :root[data-theme="studio"] .st-imp-quiet .st-imp-mass { inset: 14% 72% 14% 6%; }
    :root[data-theme="studio"] .st-imp-quiet .st-imp-floor {
      left: 20%; bottom: 8%; width: 22%;
    }
    /* h5 is 24px at this tier and the title is now in a ~200px column, so
     * the display rung drops one step. h6 (22px) is barely a step; the body
     * lead rung is the honest size for a card title at this width. */
    :root[data-theme="studio"] .st-imp-t { font-size: var(--t-h6); }
  }
  :root[data-theme="studio"] .st-imp-tile {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    border-radius: var(--studio-tile-r);
    background: var(--bg-alt);
  }
  /* Was a duplicate background (var(--bg-alt) — .st-imp-tile already paints
   * exactly that); the dead declaration is removed and the selector now does
   * real work: two grid rows, picture then label, so the two can NEVER
   * collide — the row boundary is the fix for the overlap measured at 1000px
   * (see .st-imp-quiet .st-imp-photo).
   *
   * ⚠️ THE PICTURE ROW IS A FIXED FRACTION, NOT THE LEFTOVER. It was
   * minmax(0, 1fr) then auto, which sounds right — a long label shrinks the
   * picture rather than overflowing — and produced a row of five tiles whose
   * pictures were five different sizes. The label row was auto, so its
   * height is its text, and the five labels do not have the same text: four
   * of the five headings wrap to two lines and "Predaja" does not. That one
   * spare line went to the picture above it, which is object-fit: contain
   * and duly grew into it, ending up half again the size of its neighbours.
   *
   * Shot at 1440 the effect was not subtle, and it was worse than uneven: the
   * labels had eaten so much of the square that the picture row was ~33px in
   * a 256px tile — a photograph rendered as a strip.
   *
   * ⚠️ AND THE SQUARE IS WHY, so the quiet tile gives it up. Splitting the
   * square 40/60 was tried first and put the label THROUGH the picture: at
   * 1440 these columns are ~256px, and a two-line heading over three lines of
   * body needs about 184px of that — 72% of the tile, not 60%. Any fixed
   * split either starves the picture or overflows the label, because the tile
   * was square for the old three-tile composition, where the image was the
   * content and the label was a caption. Here the label IS the content.
   *
   * So: row 1 is the picture at its own 4:3, row 2 is everything left, and
   * the tile's height is whatever those two need. The five columns are equal
   * (repeat(5, 1fr)) and the grid stretches every tile to the tallest, so
   * five pictures come out identical whatever the copy does — which is the
   * property the fixed split was reaching for — and none of them is a strip.
   * The label sits at the BOTTOM of what remains (§4.9's bottom-left label),
   * so the five labels share a baseline even where their titles wrap
   * differently.
   *
   * min-block-size is for the OTHER state: with no photographs uploaded,
   * tileShot emits the grey mass instead, which is absolutely positioned on
   * percentage insets and has no in-flow height at all. Without a floor the
   * fallback tile would collapse to its label. */
  :root[data-theme="studio"] .st-imp-quiet {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    aspect-ratio: auto;
    min-block-size: 15rem;
  }


  /* Photo-ready mass. Flatter and more neutral than zarja's lit scenes —
   * studio's grounds are white/grey, not gradient-lit. A real photograph drops
   * into the tile with zero restructuring (§5.1). */
  :root[data-theme="studio"] .st-imp-mass {
    position: absolute;
    inset: 16% 14% 22%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--ink) 9%, transparent),
      color-mix(in srgb, var(--ink) 3%, transparent)
    );
  }

  :root[data-theme="studio"] .st-imp-floor {
    position: absolute;
    left: 50%; bottom: 11%;
    transform: translateX(-50%);
    width: 62%; height: 8%;
    border-radius: var(--r-pill);
    background: radial-gradient(
      50% 50% at 50% 50%,
      color-mix(in srgb, var(--ink) 18%, transparent),
      transparent 72%
    );
  }
  /* The labelled tile is the one whose interior has to share the frame. Shot
   * at 1440px, the default inset ran the mass down to 78% of the tile and the
   * h5 title crossed its lower edge — a caption sitting half on a panel and
   * half off reads as a rendering fault rather than a label. The label block
   * is roughly 40% of the tile's height at both tiers (two lines of h5 plus
   * two of body, phone included), so the mass stops above it. */
  :root[data-theme="studio"] .st-imp-quiet .st-imp-mass { inset: 12% 14% 42%; }
  :root[data-theme="studio"] .st-imp-quiet .st-imp-floor { bottom: 38%; }
  /* The stat tile's real room interior (§4.9). Absolutely positioned and sized
   * by the tile, so the intrinsic width/height on the <img> reserve space
   * without ever contributing layout — CLS stays at zero either way. */
  :root[data-theme="studio"] .st-imp-photo {
    position: absolute;
    inset: 0;
    z-index: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    /* The bucket is studio cutouts on a white sweep, and the side tiles sit
     * on --bg-alt: unblended, each reads as a white card floating on grey
     * (shot at 1440 — the quiet tile's picture was a visible white rectangle
     * with edges of its own). Multiply seats the sweep INTO the ground
     * (white times ground = ground) at a cost of ~6% on the picture's own
     * tones; .st-imp-tile's isolation:isolate keeps the blend inside the
     * tile, and the stat scrim above can only get MORE opaque under it. */
    mix-blend-mode: multiply;
  }

  /* The LABELLED tile is the exception, and it has to be: full-bleed cover
   * here would print "Ogled lokacije" straight across the middle of a hot
   * tub, and the shop's photography is studio cutouts on white — cover would
   * crop a centred product against its own empty background. So: contain,
   * IN FLOW, sized by the tile's grid rows (see .st-imp-quiet).
   *
   * In flow is the load-bearing part, and this is the third mechanism this
   * frame has needed. Absolute inset with auto sizes let the REPLACED
   * element take its INTRINSIC size — measured 541px past a 407px tile,
   * because insets do not shrink a replaced element and the over-constrained
   * axis drops right/bottom. The padding rewrite that fixed the overflow
   * reserved the label's ground as a flat 30% — which the label's REAL
   * height crossed at intermediate widths (measured at 1000px: label top
   * 22.8px above the picture's bottom edge, the h3 over the photograph,
   * because label text keeps its size while the tile shrinks). A grid row
   * cannot be crossed: the picture gets exactly the space the label leaves,
   * at every width and every wrap count, and an unloaded image changes
   * nothing because fr/auto rows never consult it — CLS stays zero.
   *
   * The percentages are breathing room only now — none of them reserves
   * label space any more. Resolved against the tile's WIDTH (grid area),
   * like all percentage padding; base inline/block-size 100% carry over and
   * resolve against the picture row. */
  :root[data-theme="studio"] .st-imp-quiet .st-imp-photo {
    position: static;
    grid-row: 1;
    /* The picture's box is its OWN 4:3 of the column width, not the space the
     * label happens to leave. That is what makes five tiles carry five
     * identically sized pictures while their labels run to different lengths.
     * contain, not cover: these slots carry no ratio in the admin registry,
     * so nothing tells an operator what will be cropped — see the
     * never-crops-a-frame-that-shows-the-picture-whole test in
     * admin/site-images.test.ts. A picture that is not 4:3 letterboxes onto
     * the tile's own ground, which is the honest result. */
    inline-size: 100%;
    block-size: auto;
    aspect-ratio: 4 / 3;
    padding: 7% 12% 4%;
    object-fit: contain;
  }

  /* Label bottom-LEFT on the quiet tile (§4.9) — the second grid row rather
   * than an absolute pin, so its real height is what sizes the picture row
   * above it. The old inset becomes padding: the same 16-36px frame, the
   * same rendered metrics. grid-row: 2 is explicit because the fallback tile
   * (grey mass, no photo) has no in-flow first child — auto-placement would
   * put the label in the 1fr row and float it to the TOP of the tile.
   * position: relative only so z-index still lifts it over that absolutely
   * positioned mass. */
  :root[data-theme="studio"] .st-imp-label {
    position: relative;
    z-index: 2;
    grid-row: 2;
    /* Bottom of its row, not stretched to fill it — the row is now a fixed
     * 60% rather than the label's own height, so without this a two-line
     * title and a one-line title would start at the same y and end at
     * different ones. Bottom-aligned, the five labels share a baseline and
     * the wrapping difference falls where nobody reads. */
    align-self: end;
    padding: 0 clamp(16px, 1.8vw, 36px) clamp(16px, 1.8vw, 36px);
  }
  /* The tile's title — a card title on a large card, so the h5 rung
   * (32/26/24), which is exactly the 32px the baseline measured here. Tracking
   * is h5's +0.02em, not the measured −0.01em. */
  :root[data-theme="studio"] .st-imp-t {
    margin: 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The line under it is ordinary paragraph copy inside a card, so the body
   * rung (16px, Satoshi 400). The measured 19px sat between two ramp steps and
   * belonged to neither. The ink stays --ink-body — type-only pass — but note
   * the contrast reasoning that picked it cites a tile grey (#EFEFEF) that
   * tokens.ts no longer carries. */
  :root[data-theme="studio"] .st-imp-p {
    margin: clamp(6px, 0.6vw, 12px) 0 0;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }






  /* ================= §4.10 Dark testimonial ================= */
  :root[data-theme="studio"] .st-tst {
    position: relative;
    background: var(--ink-invert);
    padding-block: var(--studio-rhythm);
    /* The motif is deliberately taller than the band; clip it here. */
    overflow: clip;
  }
  :root[data-theme="studio"] .st-tst-in {
    position: relative;
  }
  /* ⚠️ TWO COLUMNS: what the band IS on the left, what people said on the
   * right. The heading used to be centred over a full-width carousel; a
   * centred title over a grid of cards reads as a poster, and it wasted the
   * one place on this band where a reader will accept being told something.
   *
   * 26rem on the intro because the lead sets at ~55 characters there, and
   * because below that the cards drop under two columns and the whole thing
   * is one column anyway. */
  :root[data-theme="studio"] .st-tst-grid {
    position: relative;
    display: grid;
    gap: clamp(32px, 4vw, 72px);
  }
  @media (min-width: 1000px) {
    :root[data-theme="studio"] .st-tst-grid {
      grid-template-columns: minmax(0, 26rem) minmax(0, 1fr);
      align-items: start;
      gap: clamp(48px, 5vw, 96px);
    }
    /* The intro rides down with the cards on a long band. top is the chrome
     * plus a breath; it is only sticky where there is room to be. */
    :root[data-theme="studio"] .st-tst-intro {
      position: sticky;
      top: calc(var(--chrome-h) + clamp(24px, 3vw, 56px));
    }
  }
  :root[data-theme="studio"] .st-tst-intro { position: relative; }
  :root[data-theme="studio"] .st-tst-lead {
    margin: clamp(14px, 1.4vw, 22px) 0 clamp(22px, 2.2vw, 34px);
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--on-invert-mute);
    max-inline-size: 34rem;
  }
  /* The band motif is the source's own eye raster, not a shape we draw. It is
   * a dark-ground image, so mix-blend-mode: screen drops its background into
   * the band and leaves only the light figure — which is why no cutout is
   * needed and why the band colour still governs.
   *
   * THE OPACITY IS DERIVED, NOT PICKED. Screen puts the figure's brightest
   * pixels (the raster does reach 255) at band + o × (1 − band). The band is
   * #151515 (sRGB 0.082), and the palest TEXT that can ever sit over the
   * lightened area is --on-invert-mute (#a4a4a4, relative luminance 0.371),
   * which needs its ground at or below L 0.0436 to clear 4.5:1 — i.e. sRGB
   * 0.231, i.e. o ≤ 0.162. At 0.5 the motif could lift the band to #8a8a8a and
   * take that attribution to 1.4:1. 0.16 lands the figure's core near the
   * --ink-invert-2 rung, which is where the baseline measured this watermark
   * anyway: "large and faint" was always the brief, and the arithmetic simply
   * says how faint. Decorative and out of the layout, so it can never displace
   * the heading it sits behind. */
  :root[data-theme="studio"] .st-tst-mark {
    position: absolute;
    z-index: 0;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    width: min(760px, 72%);
    pointer-events: none;
    mix-blend-mode: screen;
    opacity: 0.16;
    /* The raster's own ground is not the band's black — it sits around #242424
     * — so screen lifts the WHOLE FRAME and the file's four edges draw a
     * visible box across the band. (Shot at 1440px before this line existed:
     * the box was the most conspicuous thing in the section.) A soft radial
     * mask dissolves them. Only the ALPHA of these stops is read, which is why
     * the colour is an arbitrary opaque token rather than a meaningful one;
     * the figure occupies the middle two thirds of the frame, so the fade
     * takes nothing but ground. */
    -webkit-mask-image: radial-gradient(closest-side at 50% 50%, var(--ink) 0 58%, transparent 100%);
    mask-image: radial-gradient(closest-side at 50% 50%, var(--ink) 0 58%, transparent 100%);
  }
  :root[data-theme="studio"] .st-tst-mark img {
    display: block;
    width: 100%;
    height: auto;
  }
  @media (forced-colors: active) {
    /* A blend mode is meaningless in forced colours and the motif is
       decoration, so it simply goes. */
    :root[data-theme="studio"] .st-tst-mark { display: none; }
  }
  /* "Preverjena mnenja strank" is a section heading — the h2 rung whole,
   * centred and white, ABOVE the motif. The measured 72px/−0.025em was an
   * eyeballed step between h1 and h2; the source has no such step. */
  :root[data-theme="studio"] .st-tst-h {
    position: relative;
    z-index: 1;
    margin: 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--on-invert);
    text-wrap: balance;
    overflow-wrap: break-word;
    hyphens: none;
  }

  /* THE SLIDER. A real overflow-x container with scroll-snap, so the quotes
   * are reachable by touch, by trackpad and by the two anchors below before
   * behaviour.ts runs — and stepped one at a time once it does.
   *
   * Snap is MANDATORY here, where commerce.ts's rail deliberately uses
   * proximity. The reason the rail avoids mandatory is that it re-snaps a
   * zoomed-in reader away from a resting position between two cards; a slide
   * here is exactly 100% of the scrollport, so there is no useful position
   * between two of them to protect. */
  /* ---- the cards ------------------------------------------------------
   *
   * Two across above 620, one below. Not auto-fit: these are four to six
   * items of very uneven length, and auto-fit would strand the last one at
   * half width the way it does everywhere else. Two fixed tracks with the
   * items stretching means a short quote and a long one sit side by side at
   * equal height, which is what makes the pair read as a set. */
  :root[data-theme="studio"] .st-tst-cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: clamp(14px, 1.4vw, 24px);
  }
  @media (min-width: 620px) {
    :root[data-theme="studio"] .st-tst-cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  /* A panel on the dark band, not a bordered box: --on-invert-08 is the
   * faintest lift that still separates a card from the ground, and a border
   * would put eight hairlines across a band whose whole job is to be quiet
   * around the words. */
  :root[data-theme="studio"] .st-tst-card {
    display: flex;
    background: var(--on-invert-08, color-mix(in srgb, var(--on-invert) 7%, transparent));
    border-radius: var(--r-media);
    padding: clamp(20px, 2vw, 32px);
  }
  :root[data-theme="studio"] .st-tst-card > figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    /* The caption sits at the BOTTOM of the card whatever the quote's length,
     * so the names line up across a row and the eye can read them as a list
     * of people rather than as four unrelated blocks. */
    block-size: 100%;
    inline-size: 100%;
  }
  /* ---- the stars ----
   * --star is its own token rather than --acc: the accent is this theme's
   * interaction colour (focus rings, links) and a row of five accent glyphs
   * at the top of a card reads as five controls. A rating is a fact, and the
   * convention for it is gold. Measured on --ink-invert: 8.6:1, well past
   * the 3:1 a non-text indicator needs, and it is not carrying the value
   * anyway — the visually-hidden span does that. */
  :root[data-theme="studio"] .st-tst-stars {
    margin: 0 0 clamp(12px, 1.2vw, 18px);
    /* ⚠️ 18px, NOT 15. The owner asked for the reference site's star row
     * twice, and the second time was looking at a build that had it — the
     * device was there and simply did not READ as one. A ★ glyph carries far
     * less ink than a letter of the same em, so a rating set at the body
     * size lands somewhere under a caption in the visual order, below the
     * name it is supposed to lead. The reference draws its row at roughly
     * the lead rung and it is the first thing in the card.
     *
     * The tracking goes up with it: five glyphs at 0.14em read as one word
     * at 15px and as five stars at 0.18em, which is what a rating has to be
     * before anyone counts it. */
    font-size: 18px;
    letter-spacing: 0.18em;
    line-height: 1;
  }
  :root[data-theme="studio"] .st-tst-star-on { color: #e8b53c; }
  :root[data-theme="studio"] .st-tst-star-off {
    color: color-mix(in srgb, var(--on-invert) 22%, transparent);
  }
  /* The quote. Body rung, not the display face: at four to a band these are
   * read, not declaimed, and the old 1-up carousel set them at h4 because it
   * had a whole stage to fill. */
  :root[data-theme="studio"] .st-tst-q {
    /* pretty, like the eight other prose selectors: measured at 1440 this
     * set [358, 322, 332, 342, 40] in a 368px column — a 40px orphan. */
    text-wrap: pretty;
    margin: 0 0 clamp(18px, 1.8vw, 26px);
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    line-height: var(--lh-body);
    color: var(--on-invert);
    /* Flex child, so it takes the slack and pins the caption to the floor. */
    flex: 1 1 auto;
  }
  :root[data-theme="studio"] .st-tst-cap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  /* The name, at the label rung in caps — the one place on the card where
   * this theme's chrome voice belongs, because it is an attribution and not
   * a sentence. */
  :root[data-theme="studio"] .st-tst-who {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert);
  }
  /* The role. Sentence case and muted: it describes a person, and a second
   * line of tracked caps under the first would compete with the name it is
   * meant to qualify. --on-invert-mute is 7.33:1 on this band. */
  :root[data-theme="studio"] .st-tst-role {
    font-family: var(--f-body);
    font-size: var(--t-label);
    line-height: var(--lh-body);
    color: var(--on-invert-mute);
  }
  /* The Annex I 23b claim, and the only thing on the card that makes one. */
  :root[data-theme="studio"] .st-tst-chip {
    margin-block-start: 8px;
    padding: 4px 12px;
    border-radius: var(--r-pill);
    background: var(--on-invert-16);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert-mute);
  }
  /* A model with no verified claim behind it: the same line, no ground, so it
   * cannot be mistaken for the chip. */
  :root[data-theme="studio"] .st-tst-model {
    margin-block-start: 8px;
    font-family: var(--f-label);
    font-size: var(--t-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert-mute);
  }

  /* ================= §4.11 Blog cards ================= */
  :root[data-theme="studio"] .st-gd {
    background: var(--bg);
    /* BOTTOM ONLY — see --studio-rhythm. This section shares the page's white
     * ground with its neighbour, so the separation between them is paid once,
     * here, exactly as the source pays it (0 40px 170px). Paying it on both
     * sides is what made every boundary twice the source's. */
    padding-block: 0 var(--studio-rhythm);
    overflow: clip;
  }
  /* Centred section heading (§4.11) — the h2 rung, same as the two bands
   * above it, so the page has one heading voice and not three. */
  :root[data-theme="studio"] .st-gd-h {
    margin: 0 0 clamp(28px, 3.4vw, 68px);
    text-align: center;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--ink);
    text-wrap: balance;
    overflow-wrap: break-word;
    hyphens: none;
  }
  :root[data-theme="studio"] .st-gd-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--studio-card-gap);
  }
  /* ~1:1 card, radius 16px, the whole card is the link. */
  :root[data-theme="studio"] .st-gd-card {
    position: relative;
    isolation: isolate;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    border-radius: var(--studio-guide-r);
    background: var(--bg-alt);
    text-decoration: none;
  }
  /* The photograph fills the card; the scrim above it carries the copy. */
  :root[data-theme="studio"] .st-gd-photo {
    position: absolute;
    inset: 0;
    z-index: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1),
                filter 0.4s ease;
  }
  /* THE SCRIM IS THE CONTRAST GATE FOR THIS CARD, AND IT WAS FAILING.
   *
   * Two things were wrong. The renderer emitted the scrim span TWICE, so what
   * shipped was two stacked gradients whose combined alpha (1−(1−a)²) was
   * carrying the copy — an accident, and one that made the declared gradient
   * untrustworthy as a record of what the design does. And the single gradient
   * underneath it does not clear the floor on its own: at 390px, with a
   * three-line title, the title's top sat at ~0.44 alpha, which over the white
   * blowout in a window (every room export in the bundle peaks at 255) is
   * 2.9:1 — under even the 3:1 large-text allowance the 24px phone rung would
   * qualify for.
   *
   * So: one scrim, taller (72%), and stopped so the alpha is ≥0.63 anywhere
   * the title can start at any tier — which clears 4.5:1 over a pure-white
   * pixel, i.e. the title does not have to lean on the large-text exemption at
   * all. The top 30% still ramps to nothing, so the picture is not a plate.
   * The chip keeps its own ground on top of this (see below); the "Preberite
   * vodnik" line sits in the near-opaque foot at ~0.90 and measures 5.6:1. */
  /* The picture the scrim was built to sit on. Behind everything (z-index is
   * the scrim's job), filling the square, cover — a guide card is atmosphere
   * and a crop of a product shot is exactly right for it. */
  :root[data-theme="studio"] .st-gd-img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
  :root[data-theme="studio"] .st-gd-scrim {
    position: absolute;
    inset: auto 0 0 0;
    z-index: 1;
    height: 72%;
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--ink-invert) 94%, transparent) 0%,
      color-mix(in srgb, var(--ink-invert) 84%, transparent) 40%,
      color-mix(in srgb, var(--ink-invert) 44%, transparent) 70%,
      transparent 100%
    );
  }
  :root[data-theme="studio"] .st-gd-copy {
    position: absolute;
    z-index: 2;
    inset: auto clamp(14px, 1.6vw, 32px) clamp(14px, 1.6vw, 32px) clamp(14px, 1.6vw, 32px);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: clamp(10px, 1.1vw, 22px);
  }
  /* Pill chip, the label rung in tracked caps — ROUND, per §3. The chip is the
   * highest thing in the copy stack, so it is the piece the scrim reaches
   * last; rather than push the whole gradient darker for one 14px line, the
   * chip carries its OWN ground. --on-invert on 82% --ink-invert clears
   * wherever the chip lands, and it still reads as a chip because that ground
   * is not fully opaque. */
  :root[data-theme="studio"] .st-gd-chip {
    border: 1px solid color-mix(in srgb, var(--on-invert) 34%, transparent);
    border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--ink-invert) 82%, transparent);
    padding: clamp(6px, 0.5vw, 10px) clamp(12px, 1.1vw, 22px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert);
  }
  /* The card title over the scrim (§4.11) — a card title on a large card, so
   * the h5 rung (32/26/24) against the measured 30px, tracked +0.02em like the
   * rest of that row rather than the measured −0.01em. */
  :root[data-theme="studio"] .st-gd-t {
    margin: 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--on-invert);
    text-wrap: pretty;
    overflow-wrap: break-word;
    hyphens: none;
    /* The hover underline is drawn here rather than by the shorthand, so it
     * can sit clear of the descenders in "Preberite" and "vodnik". */
    text-decoration-thickness: 2px;
    text-underline-offset: 0.16em;
  }
  /* "Preberite vodnik" is the card's call to action — a button label, i.e. the
   * label row: DM Sans 500, --ls-label, tight leading, tracked caps. */
  :root[data-theme="studio"] .st-gd-go {
    display: inline-flex;
    align-items: center;
    gap: clamp(6px, 0.5vw, 10px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert-mute);
    transition: color 0.25s ease;
  }
  :root[data-theme="studio"] .st-gd-arrow { transition: transform 0.25s ease; }

  /* HOVER AND KEYBOARD FOCUS GET THE SAME CARD. The three effects used to be
   * hung on :hover alone, so a keyboard reader tabbing the row got an outline
   * and nothing else — the card never acknowledged which one they were on
   * beyond the ring. Every rule below fires for both.
   *
   * The photo darkens as well as growing. That is the one direction a hover
   * may move a scrim-backed card: brightness(0.94) only ever RAISES the
   * contrast of the copy over it, where lightening would spend the margin the
   * scrim above exists to protect. */
  :root[data-theme="studio"] .st-gd-card:hover .st-gd-photo,
  :root[data-theme="studio"] .st-gd-card:focus-visible .st-gd-photo {
    transform: scale(1.04);
    filter: brightness(0.94);
  }
  :root[data-theme="studio"] .st-gd-card:hover .st-gd-arrow,
  :root[data-theme="studio"] .st-gd-card:focus-visible .st-gd-arrow {
    transform: translateX(4px);
  }
  :root[data-theme="studio"] .st-gd-card:hover .st-gd-t,
  :root[data-theme="studio"] .st-gd-card:focus-visible .st-gd-t {
    text-decoration-line: underline;
  }
  /* The muted CTA rises to the full white rung on hover — a colour change that
   * only ever gains contrast, and the one cue that survives when a reader has
   * asked for no motion at all. */
  :root[data-theme="studio"] .st-gd-card:hover .st-gd-go,
  :root[data-theme="studio"] .st-gd-card:focus-visible .st-gd-go {
    color: var(--on-invert);
  }
  /* The card is a link with no visible frame at rest, so the focus ring is the
   * only thing that can announce it — draw it outside the radius. */
  :root[data-theme="studio"] .st-gd-card:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 3px;
  }

  /* ---- Below 1080px: the row becomes a column, and KEEPS the medallion ----
   *
   * It used to display:none here, on the argument that "the quote needs the
   * width more than the band needs the ornament". That was sound while the
   * medallion was one of THREE things in a row competing for horizontal
   * space. It is not sound now: stacked above the quote it takes no width from
   * anything, and without it a phone gets a lone column of small text under a
   * centred heading — the band's whole composition reduced to one part. It is
   * also lazy and far below the fold, so what it costs is bytes a phone only
   * spends if the reader scrolls to it.
   *
   * The stage collapses to the NARROW reading measure alone — 620px, not the
   * 863px the two-part row above is built from. A stacked column is running
   * prose again, so it gets the measure prose wants; the wide one is the
   * price the ROW pays for not being an island in a 1560px container, and a
   * column pays nothing for it. It also keeps the stacked block centred in
   * the container instead of stranded against the left gutter at tablet
   * widths, and keeps the medallion, the quote and the controls on one
   * shared left edge. */
  @media (max-width: 1080px) {
    :root[data-theme="studio"] {
      --studio-tst-stage: min(100%, var(--studio-read-narrow));
    }
  }

  /* ---- Below 860px: everything stacks (§4.9 "stacks on mobile") ---- */
  @media (max-width: 860px) {
    /* .st-imp-row is NOT here any more: it is a five-item list that steps
     * 5 → 3 → 2 on its own rules above. Stacking it to one column put five
     * 520px squares under a single heading. */
    :root[data-theme="studio"] .st-gd-row {
      grid-template-columns: minmax(0, 1fr);
    }
    /* Stacked, no tile has neighbours to out-scale, and full-width squares
     * are humane only until ~545px: measured at 860px they were 810px EACH —
     * 2430px of tiles under one heading. So one explicit height for every
     * stacked tile (the hero's 4/5 goes with it — this height beats
     * aspect-ratio for all three): the container's own width, a true square,
     * until that square would pass 520px — roughly a landscape phone screen
     * — where it stops growing. An explicit height, NOT max-height:
     * aspect-ratio TRANSFERS a capped block axis back through the ratio, so
     * max-height shrank the tile's WIDTH off the container edge (measured
     * 520px wide, left-aligned in a 650px column at 700px) — and the same
     * transfer rides an explicit height while ANY ratio stays declared,
     * which is why the ratios are cleared here rather than overridden. The
     * quiet tile's grid rows and the stat scrim are tile-relative and
     * follow the capped box. */
    /* The tiles keep their square aspect-ratio at every width now — the
     * explicit height existed for the one-column stack this row no longer
     * uses, and at two columns the square is already phone-sized. */
    :root[data-theme="studio"] .st-imp-sub { max-width: 100%; }
    /* No .st-imp-claim reset here: the chips are inline-block, so a claim
     * wider than a very narrow viewport wraps internally on its own, and a
     * 390px phone gets one whole claim per centred line. */
    /* Nothing left for the testimonial band to do here: the 1080px rule above
     * already stacked it into one column and pulled the medallion, the quote
     * and the controls onto a shared left edge, and that is the phone layout.
     * Two 64px circles plus the 10px gap is 138px, so the controls fit a
     * 390px viewport with room to spare and keep their measured size. */
    :root[data-theme="studio"] .st-tst-mark { width: 110%; }
  }

  /* ---- Motion ---- */
  @media (prefers-reduced-motion: reduce) {
    /* Reset to the resting state, never a frozen mid-transform: the arrow sits
     * at its baseline offset and the photo at its true scale. The hover is
     * still legible — the title underline and the CTA's colour lift carry it
     * on their own, and neither is motion. */
    :root[data-theme="studio"] .st-gd-photo,
    :root[data-theme="studio"] .st-gd-arrow,
    :root[data-theme="studio"] .st-gd-go { transition: none; }
    :root[data-theme="studio"] .st-gd-card:hover .st-gd-photo,
    :root[data-theme="studio"] .st-gd-card:focus-visible .st-gd-photo,
    :root[data-theme="studio"] .st-gd-card:hover .st-gd-arrow,
    :root[data-theme="studio"] .st-gd-card:focus-visible .st-gd-arrow {
      transform: none;
    }
  }
`;

/**
 * A photo-ready tile interior: neutral mass + contact shadow, no lit gradient.
 * Decorative throughout — a screen reader gets the tile's text, never the
 * furniture standing in for a photograph.
 */
/**
 * A tile's picture: the shop's own photograph, or the grey mass and its floor
 * shadow as a last resort.
 *
 * The mass was the ONLY thing here, and it is exactly what product-art.ts was
 * written to get rid of — "a rounded rectangle at 12% opacity with a soft
 * shadow under it, which is to say, an empty grey box". It survived in this
 * band because the band predates the photography. With the borrowed imagery
 * gone it stopped being one placeholder among many and became the largest
 * grey slab on the page, directly under a heading asking why customers choose
 * this shop.
 *
 * `offset` keeps two tiles in one band off the same picture.
 */
function tileShot(ctx: RenderCtx, slot: string, cls: string, sizes: string): string {
  if (OWN_PHOTOS.length > 0) {
    // A NAMED SLOT, not an offset — see sitePhoto. The offset each of these
    // used is kept as its fallback in admin/site-images.ts, so the band paints
    // exactly what it painted before until somebody uploads.
    return decorativeImg(sitePhoto(slot), cls, sizes);
  }
  return (
    '<span class="st-imp-mass" aria-hidden="true"></span>' +
    '<span class="st-imp-floor" aria-hidden="true"></span>'
  );
}


/**
 * §4.9 — impact grid.
 *
 * Three tiles, three different jobs: the quiet tile is labelled, the hero tile
 * is pure image, the third replaces its label with a number. Labels come from
 * `moat.steps` (the shop's own delivery promise, in its own words) and the
 * number from `stats[0]`; a shop with neither still renders a valid, silent
 * grid rather than an empty band with holes in it.
 *
 * The head interpolates the shop's keyword in the ACCUSATIVE ("Zakaj kupci
 * izberejo finsko savno") — the declension contract in tenants/types.ts exists
 * precisely so shared chrome can do this without producing broken Slovenian.
 */

export function renderStudioImpact(ctx: RenderCtx): string {
  /* ⚠️ FIVE IDENTICAL CARDS, AND THE UNIFORMITY IS THE POINT.
   *
   * This band was three tiles of three different shapes: one labelled, one
   * bare photograph ("the crop is the content"), one carrying a statistic.
   * Read together they made no argument — a caption, a picture and a number
   * — and the bare tile in the middle was the largest thing in a band whose
   * job is to say why to buy here.
   *
   * The reference the owner set (bullfrogspas.com) does the same job with a
   * row of five identical cards: small picture, title, two lines. What makes
   * that work is not the count, it is that every card answers the SAME
   * question, so the row reads as one list rather than three ideas.
   *
   * moat.steps already holds exactly that list, and it is the truest thing
   * this shop can say: the five moves of the job it does, in order — ogled,
   * priprava priklopa, dostava, priklop in zagon, predaja. No claim is
   * introduced here that /dostava-in-montaza does not already make.
   *
   * The STATISTIC IS GONE from this band on purpose. It duplicated a cell in
   * the stats row one screen below, and it is the tile whose figure and
   * caption came apart when they were edited separately.
   */
  const steps = ctx.content.moat.steps;
  // Three short proof points read as one muted line under the head; more than
  // three and the sub starts competing with the cards. Each claim is its own
  // inline-block chip so the line breaks only at the gaps BETWEEN chips, and
  // the separator dot lives INSIDE the chip before it — an atomic inline's
  // edges are wrap opportunities in their own right, so a dot placed between
  // chips can open a wrapped line no matter what no-break space sits beside
  // it (measured doing exactly that at 1000px).
  const claims = ctx.content.trust.slice(0, 3);
  const sub = claims
    .map(
      (t, i) =>
        '<span class="st-imp-claim">' +
        esc(t) +
        // The dot is an ELEMENT so the phone tier can drop it: three wrapped
        // chips each ending in " ·" read as stray punctuation at 390px, and
        // a text-node dot cannot be styled away.
        (i < claims.length - 1 ? '<span class="st-imp-sep"> ·</span>' : "") +
        "</span>",
    )
    .join(" ");

  const cards = steps
    .map((step, i) => {
      // The slot keys are frozen at "zakaj-mi*" — see the note in
      // admin/site-images.ts on why a managed key can never be renamed.
      const slot = i === 0 ? "zakaj-mi" : "zakaj-mi-" + String(i + 1);
      return (
        '<li class="st-imp-tile st-imp-quiet">' +
        tileShot(ctx, slot, "st-imp-photo", "(max-width: 700px) 46vw, (max-width: 1100px) 30vw, 18vw") +
        '<div class="st-imp-label">' +
        '<h3 class="st-imp-t">' + esc(step[0]) + "</h3>" +
        '<p class="st-imp-p">' + esc(step[1]) + "</p>" +
        "</div></li>"
      );
    })
    .join("");

  return (
    '<section class="st-imp"><div class="st-imp-in">' +
    '<div class="st-imp-head">' +
    // ⚠️ NOT "Zakaj kupci izberejo masažni bazen". That heading promises the
    // reasons somebody wants a hot tub — warmth, the evening, the back — and
    // then every word under it is about US. A band whose head asks one
    // question and whose body answers a different one reads as filler
    // however good the parts are.
    // ⚠️ WORD ORDER, AND IT WAS WRONG IN SLOVENIAN. This built "Zakaj masažni
    // bazen kupiti pri nas" — an infinitive stranded after its object, which
    // reads as a translation. The natural order puts the verb first: "Zakaj
    // kupiti masažni bazen pri nas". Same words, same keyword, and it is the
    // heading over this shop's entire argument for itself, so it is the last
    // line on the page that should sound foreign.
    '<h2 class="st-imp-h">Zakaj kupiti ' + esc(ctx.shop.keyword.accusative) +
    " pri nas</h2>" +
    (sub ? '<p class="st-imp-sub">' + sub + "</p>" : "") +
    // The band made three claims about delivery and service and offered no
    // way to read more — /dostava-in-montaza is where all three live.
    '<p class="st-imp-more"><a href="' + esc(ctx.shop.routeSlugs["/delivery"] + ctx.q) +
    '">Kako potekata dostava in zagon</a></p>' +
    "</div>" +
    '<ul class="st-imp-row">' + cards + "</ul>" +
    "</div></section>"
  );
}

/**
 * The §4.10 motif, wrapped in its positioning box. It is the source's own eye
 * raster — supplied art, so it is placed rather than redrawn; two earlier
 * passes tried to draw it (first as the arrow stadium, then as a concentric
 * ellipse) and both were approximations of a file we already had. Purely
 * decorative: the wrapper is aria-hidden and so is the image inside it.
 */
function motif(): string {
  // The eye was a raster from the source theme's bundle, painted large and
  // faint behind the testimonial band. It went with the rest of the borrowed
  // imagery. Two earlier passes tried to DRAW it and both were approximations
  // of a file we had; drawing it now would be approximating a file we no
  // longer have any right to. The band carries itself on type.
  return "";
}


/**
 * §4.10 — the inverted testimonial band.
 *
 * ⚠️ THE SLIDER IS GONE. This was a one-at-a-time carousel wired to
 * behaviour.ts's generic upgrade; the markup contract it needed
 * (data-st-slider, data-st-scroll, data-st-item, the prev/next controls) is
 * no longer emitted here, and behaviour.ts finds nothing to upgrade, which
 * is a no-op rather than an error. The other slider on the site — the social
 * strip's ticker — is untouched and still owns that machinery.
 *
 * What replaced it is a grid, because a slider hides three quarters of the
 * only thing this band contains. Several different people saying several
 * different things IS the persuasive content; one quote and two arrows is a
 * control asking to be pressed by a reader who has no reason to press it.
 *
 * A shop with no reviews renders nothing — an empty dark band would read as a
 * loading failure, and fabricating a quote is out of the question.
 */
export function renderStudioTestimonials(ctx: RenderCtx): string {
  const reviews = ctx.content.reviews;
  if (!reviews.length) return "";


  // The heading makes the same claim the chip does, so it answers to the same
  // rule — and to the stricter half of it: it may say "verified" only when
  // EVERY quote under it has been checked, because it speaks for all of them.
  const allVerified = reviews.every((r) => r.verified === true && !r.placeholder);
  const heading = allVerified ? "Preverjena mnenja strank" : "Mnenja strank";

  // ⚠️ A GRID, NOT A SLIDER, and the reason is what a testimonial band is for.
  //
  // This was a one-at-a-time carousel: four reviews, three of them behind a
  // control nobody presses. A reader deciding on a EUR 7.000 purchase wants
  // to see that several different people said several different things —
  // that is the whole persuasive content of the section, and a slider hides
  // three quarters of it by construction.
  //
  // Capped at six. Beyond that the band becomes a page of its own, and there
  // is no "all reviews" route to send anyone to; when there is, this is where
  // the link goes.
  const lead = [
    allVerified ? ctx.content.reviewsLeadVerified : undefined,
    ctx.content.reviewsLead,
  ]
    .filter((t): t is string => typeof t === "string" && t !== "")
    .join(" ");

  const cards = reviews.slice(0, 6).map(quoteCard).join("");

  return (
    '<section class="st-tst" aria-labelledby="st-tst-h">' +
    '<div class="st-tst-in">' +
    '<div class="st-tst-grid">' +
    '<div class="st-tst-intro">' +
    motif() +
    '<h2 class="st-tst-h" id="st-tst-h">' + esc(heading) + "</h2>" +
    // ⚠️ THE LEAD IS GATED THE SAME WAY THE HEADING AND THE CHIPS ARE, and it
    // was the one sentence in this band that was not.
    //
    // The heading falls back to "Mnenja strank" and every chip disappears the
    // moment one quote is unverified — but reviewsLead printed unconditionally,
    // and it carried "Zapisali so jih stranke, ki so pri nas kupile bazen". So
    // with the chips correctly gone, the strongest form of the claim they were
    // gated for stayed on the page as running text: a sentence asserting four
    // purchases, on a shop whose reviews table holds order_id NULL on all four.
    // That is the Annex I 23b claim (ZVPot-1) with nothing behind it, and no
    // amount of chip logic reaches it, because it is not a chip.
    //
    // So the purchase sentence lives in its own field and may only be printed
    // under the same test. reviewsLead keeps what is true either way — how the
    // quotes were handled — and prints always.
    (lead ? '<p class="st-tst-lead">' + esc(lead) + "</p>" : "") +
    '<a class="st-btn-light" href="' +
    esc(ctx.shop.routeSlugs["/contact"] + ctx.q) +
    '">Povprašajte za ponudbo</a>' +
    "</div>" +
    '<ul class="st-tst-cards">' + cards + "</ul>" +
    "</div></div></section>"
  );
}

/**
 * The stars.
 *
 * ⚠️ THE NUMBER IS IN THE ACCESSIBLE NAME, NOT IN THE GLYPHS. Five ★ read
 * aloud is "black star black star black star black star black star", which is
 * noise; the row is aria-hidden and the rating is announced once as words.
 *
 * Empty stars are drawn too, so a four is visibly a four rather than "one
 * fewer glyph than the card above it" — the comparison a reader makes is
 * against five, and it only works if five positions are shown.
 */
function stars(rating: number): string {
  const n = Math.max(1, Math.min(5, Math.round(rating)));
  return (
    '<p class="st-tst-stars">' +
    '<span class="st-vh">' + n + " od 5 zvezdic</span>" +
    '<span aria-hidden="true">' +
    '<span class="st-tst-star-on">' + "★".repeat(n) + "</span>" +
    (n < 5 ? '<span class="st-tst-star-off">' + "★".repeat(5 - n) + "</span>" : "") +
    "</span></p>"
  );
}

/** One review as a card: stars, quote, then who said it. */
function quoteCard(r: {
  q: string;
  who: string;
  model?: string;
  rating?: number;
  role?: string;
  placeholder?: boolean;
  verified?: boolean;
}): string {
  const verified = r.verified === true && !r.placeholder;
  return (
    '<li class="st-tst-card"><figure>' +
    (r.rating ? stars(r.rating) : "") +
    '<blockquote class="st-tst-q">' + esc(r.q) + "</blockquote>" +
    '<figcaption class="st-tst-cap">' +
    '<span class="st-tst-who">' + esc(r.who) + "</span>" +
    (r.role ? '<span class="st-tst-role">' + esc(r.role) + "</span>" : "") +
    (verified
      ? '<span class="st-tst-chip">Preverjen nakup' +
        (r.model ? " · " + esc(r.model) : "") + "</span>"
      : r.model
        ? '<span class="st-tst-model">' + esc(r.model) + "</span>"
        : "") +
    "</figcaption></figure></li>"
  );
}

/**
 * §4.11 — blog/guide cards.
 *
 * Three ~1:1 photo cards; the whole card is one link to the guides hub, so the
 * accessible name is "category, title, preberite vodnik" and there is no
 * second, competing link inside it. The hub is reached through routeSlugs, i.e.
 * the shop's own Slovenian segment, and carries ctx.q so dev overrides survive
 * the hop.
 */
export function renderStudioGuides(ctx: RenderCtx): string {
  const guides = ctx.content.guides;
  if (!guides.length) return "";
  const href = esc(ctx.shop.routeSlugs["/guides"] + ctx.q);
  return (
    '<section class="st-gd" id="vodniki"><div class="st-gd-in">' +
    '<h2 class="st-gd-h">Preden kupite ' + esc(ctx.shop.keyword.accusative) + "</h2>" +
    '<div class="st-gd-row">' +
    guides
      .map(
        (g, i) =>
          // The card is a door to THE guide — the fragment scrolls the
          // guides page to its own section, with the offset the anchor
          // system already pays for. Without it every card landed at the
          // top of the page and the reader scrolled, looking for the title
          // they had just clicked.
          '<a class="st-gd-card" href="' + href + "#" + esc(g[2]) + '">' +
          // ⚠️ THE PHOTOGRAPH IS BACK, AND THE NOTE THAT REMOVED IT WAS RIGHT
          // AT THE TIME. It said: these were borrowed room interiors argued
          // for as atmosphere, the argument was fine and the render was a
          // furniture catalogue, so the card works as a coloured panel.
          //
          // It works as a panel the way an empty frame works as a picture. The
          // scrim below is a gradient built to carry white copy over a
          // PHOTOGRAPH; with nothing behind it the card is a grey rectangle
          // fading to black with a title at the bottom, and it was reported as
          // exactly that — "images are missing".
          //
          // They are managed slots now, like every other picture on this page:
          // the owner chooses them, and each falls back to one of the shop's
          // own photographs until they do. Borrowed furniture is not what came
          // back; the shop's own product photography is.
          decorativeImg(
            sitePhoto("vodnik-" + String(i + 1)),
            "st-gd-img",
            // 860, the row's own stacking breakpoint (.st-gd-row) — 809 told
            // the browser 30vw exactly where the card is 92vw.
            "(max-width: 860px) 92vw, 30vw",
          ) +
          // ONE scrim. There were two identical spans here, which quietly
          // doubled the gradient and made the declared stops a fiction; the
          // stops in the stylesheet now carry the copy on their own.
          '<span class="st-gd-scrim" aria-hidden="true"></span>' +
          '<span class="st-gd-copy">' +
          '<span class="st-gd-chip">' + esc(g[0]) + "</span>" +
          '<span class="st-gd-t">' + esc(g[1]) + "</span>" +
          '<span class="st-gd-go">Preberite vodnik' +
          '<span class="st-gd-arrow" aria-hidden="true">→</span></span>' +
          "</span></a>",
      )
      .join("") +
    "</div></div></section>"
  );
}
