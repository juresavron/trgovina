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
import { statValue } from "./stat";
import { arrowIcon } from "./icons";
import { OWN_PHOTOS, decorativeImg, pick, sitePhoto } from "./media";

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

    /* §4.10: the Ø300px #1C1C1C disc — mixed from tokens, never a hex, and
     * mixed HERE rather than borrowed from another module's private var. It is
     * the ground of the DRAWN medallion only; a medallion holding a real
     * photograph is a light panel instead (see .st-tst-disc--lit). */
    --studio-quote-disc: color-mix(in srgb, var(--on-invert) 12%, var(--ink-invert));
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
    --studio-tst-disc: clamp(160px, 18vw, 300px);
    --studio-tst-stage: min(100%, calc(var(--studio-read) + var(--gap-2xl) + var(--studio-tst-disc)));
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
  :root[data-theme="studio"] .st-imp-in {
    max-width: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
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
  /* One claim, one line: breaks belong at the separators only. inline-block,
   * NOT white-space: nowrap — a chip that fits its line wraps as one unit
   * either way, but when a claim alone is wider than a very narrow viewport
   * an inline-block wraps INTERNALLY where nowrap would clip past the tile
   * column. The joining dot is tied to the claim before it with a no-break
   * space in the markup, so a wrapped line never opens with a stray dot. */
  :root[data-theme="studio"] .st-imp-claim { display: inline-block; }

  /* The measured asymmetry. The centre column is 1.22fr against 1fr siblings
   * AND taller (4/5 against 1/1), so with align-items:center it bleeds past
   * its neighbours top and bottom — the hero tile, without a single negative
   * margin that could open a horizontal scrollbar. */
  :root[data-theme="studio"] .st-imp-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.22fr) minmax(0, 1fr);
    align-items: center;
    gap: var(--studio-card-gap);
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
   * (see .st-imp-quiet .st-imp-photo). minmax(0, 1fr) so a long label shrinks
   * the picture row rather than overflowing the tile. */
  :root[data-theme="studio"] .st-imp-quiet {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
  }
  /* THE MIDDLE TILE, AND WHY IT NO LONGER PAINTS ITSELF GREY.
   *
   * --tile-mid (#a4a4a4) was never visible: the picture below covered the
   * tile edge to edge, so the token was doing nothing but describing an
   * intention. The intention was a full-bleed atmospheric crop, and this
   * shop's photography cannot supply one — every file in the well is a studio
   * cutout on a white sweep. Cover-crop a 900x900 cutout into a 4/5 portrait
   * and what fills the tile is SWEEP: measured at 1440, a 500x627 tile
   * holding a product about 390px across in a field of near-white, sitting on
   * a white page with no edge of its own. Between a labelled tile and a
   * stat tile it read as a hole in the row, not as the anchor of it.
   *
   * So the middle tile takes the same ground and the same seating as the
   * labelled one — see .st-imp-quiet .st-imp-photo for the full reasoning:
   * contain, so the product survives whatever aspect the file has, and
   * multiply, so the sweep resolves into the ground instead of floating a
   * white rectangle on it. It stays the anchor by SCALE — 1.22fr wide, 4/5
   * tall against its neighbours' squares — rather than by a treatment the
   * bucket cannot pay for. It carries no label, which is still what makes it
   * the picture in a row of two panels.
   *
   * SQUARE, not 4/5, for the same reason. A portrait tile is a frame for a
   * portrait photograph; contain a square cutout in one and the tile pays for
   * the difference in empty ground — measured at 1440, a 500x627 tile with
   * the product occupying its middle third and 150px of bare grey above and
   * below. The tile is still the biggest thing in the row (1.22fr against two
   * 1fr columns, so 500px against 412px) and still breaks its neighbours'
   * baseline top and bottom, because align-items is center. The stagger is
   * paid for by WIDTH, which the grid gives away for free, instead of by a
   * ratio the photography cannot fill. */
  :root[data-theme="studio"] .st-imp-hero {
    aspect-ratio: 1 / 1;
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
  /* The hero tile's crop: the mass runs PAST the frame on three sides and is
   * clipped by it, which is what makes the tile read as an oversized product
   * photo cropped by its own edge rather than a picture placed inside a box. */
  :root[data-theme="studio"] .st-imp-hero .st-imp-mass {
    inset: -8% -12% -6%;
    border-radius: var(--r-media);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--bg) 26%, transparent),
      color-mix(in srgb, var(--ink) 12%, transparent)
    );
    border-color: color-mix(in srgb, var(--ink) 8%, transparent);
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
  /* Seated exactly like the labelled tile, and for the same reason — the note
   * on .st-imp-hero above has the measurement. The padding is smaller than
   * the quiet tile's because nothing sits under this picture: no label row to
   * clear, so the product gets the whole tile minus a frame of air. */
  :root[data-theme="studio"] .st-imp-hero .st-imp-photo {
    padding: 6% 8%;
    object-fit: contain;
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

  /* THE STAT OVERLAY'S SCRIM IS A CONTRAST GATE, NOT A MOOD.
   *
   * A real photograph now sits under it, and every room export in the bundle
   * peaks at pure white (blown-out windows; measured means 152–178 of 255). So
   * the floor has to be computed against WHITE, not against the picture that
   * happens to be there today: white text needs the composite ground at or
   * below L 0.183, which over a white pixel means the scrim must be at least
   * 0.587 alpha AT THE HEIGHT THE TEXT STARTS.
   *
   * The previous stops (92% / 60% at 44% / 0) resolved to ~0.50 where the
   * value's cap-height begins — it read fine over the drawn placeholder and
   * would have failed the day the photo landed. The 86%-at-44% revision that
   * replaced them held ≥0.73 at the desktop text block but decayed to 0.63
   * by the value's ascender line at 390px, where the panel is shorter and
   * the text sits proportionally higher in the ramp: 5.4:1 composite over
   * white — passing, but a third thinner than the floor the desktop tier
   * was tuned to. Holding 86% down to the 50% line and starting the fade at
   * 80% keeps every tier's text block at or above 0.71 alpha (7:1 over
   * white, measured at the 390px ascender line) and still leaves the top
   * fifth to fade, so the tile reads as a photograph rather than a plate. */
  :root[data-theme="studio"] .st-imp-stat {
    position: absolute;
    z-index: 2;
    inset: auto 0 0 0;
    padding: clamp(48px, 6vw, 120px) clamp(16px, 1.8vw, 36px) clamp(16px, 1.8vw, 36px);
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--ink-invert) 96%, transparent) 0%,
      color-mix(in srgb, var(--ink-invert) 86%, transparent) 50%,
      color-mix(in srgb, var(--ink-invert) 46%, transparent) 80%,
      transparent 100%
    );
  }
  /* The stat value. A number is not a heading, but it is display voice at
   * poster size and the ramp has no "stat" role, so it takes the NEAREST rung
   * whole: h2 (60/50/38) against the measured 58px. The trailing +/% is a real
   * superscript, as in §4.8. */
  :root[data-theme="studio"] .st-imp-v {
    display: block;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--on-invert);
    font-variant-numeric: tabular-nums;
    text-wrap: balance;
  }
  /* Proportional to whatever rung the value sits on, so this stays a relative
   * multiplier rather than a ramp entry — the superscript has to track its own
   * numeral, not a tier. The parent's --ls-h2 (0em) now carries, so the local
   * tracking reset that cancelled the invented −0.02em is gone. */
  :root[data-theme="studio"] .st-imp-v sup {
    font-size: 0.44em;
    font-weight: var(--w-display);
    line-height: 0;
    vertical-align: baseline;
    position: relative;
    top: -0.92em;
  }
  /* The caption under the value — a caption is the label role, so DM Sans 500
   * at 14px with --ls-label and the tight label leading. Not uppercased: the
   * source reserves tracked caps for chips and eyebrows, and this is a sentence.
   * NOT --on-invert-mute: it is the smallest text on the tile and the only one
   * held to the full 4.5:1, and the hierarchy is carried by the rungs
   * (h2 : label), not by ink. */
  :root[data-theme="studio"] .st-imp-c {
    display: block;
    margin-top: clamp(6px, 0.6vw, 12px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert);
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
    max-width: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
  }
  :root[data-theme="studio"] .st-tst-head {
    position: relative;
    text-align: center;
    margin-bottom: clamp(36px, 4.4vw, 88px);
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
  :root[data-theme="studio"] .st-tst-track {
    position: relative;
    z-index: 1;
    /* The scrollport is the STAGE, not the container: bounding it here is what
     * centres the two-part composition instead of stranding a 620px quote at
     * the far left of a 1360px row with half a screen of empty band between it
     * and the medallion. Every slide is 100% of this, so the snap geometry and
     * behaviour.ts's measured step follow it without knowing it exists. */
    max-inline-size: var(--studio-tst-stage);
    margin-inline: auto;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  :root[data-theme="studio"] .st-tst-track::-webkit-scrollbar { display: none; }
  :root[data-theme="studio"] .st-tst-list {
    display: flex;
    gap: clamp(24px, 3vw, 64px);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  :root[data-theme="studio"] .st-tst-slide {
    flex: 0 0 100%;
    scroll-snap-align: start;
    /* One quote per flick: without this a fast swipe can skate past two. */
    scroll-snap-stop: always;
  }
  /* The slides take focus programmatically (tabindex="-1") when an anchor
   * lands on them; the ring must announce that, and must not be clipped by the
   * scroll container, hence the inset offset rather than an outward one. */
  :root[data-theme="studio"] .st-tst-slide:focus { outline: none; }
  :root[data-theme="studio"] .st-tst-slide:focus-visible {
    outline: 2px solid var(--on-invert);
    outline-offset: -2px;
    border-radius: var(--r-card);
  }

  /* quote | medallion, and the row is TWO parts on purpose.
   *
   * §4.10 measured three — portrait, quote, circle — and the portrait slot is
   * gone for good: it held stock faces of strangers standing in for people who
   * had written the reviews beside them, which is the one image on this page
   * that must never be borrowed. What was left behind was worse than the hole
   * it filled. An auto-sized track holding nothing still collects a gap, so
   * the three-part template indented every quote 46px from the container edge
   * (measured at 1440) and left the band reading as a composition missing a
   * limb. Two named areas, two real columns, no ghost track.
   *
   * The columns are DERIVED from --studio-tst-stage, so 1fr resolves to
   * exactly the reading measure the stage was built from (--studio-read,
   * 863px, once the band is wide enough to pay for it) and the gap is the
   * token the stage was built from — change the stage and the row still
   * adds up.
   *
   * Named areas rather than source order, because <figcaption> must be a
   * direct child of <figure> to be its caption — it cannot live inside the
   * quote column's wrapper, so the grid puts it there instead. */
  :root[data-theme="studio"] .st-tst-fig {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--studio-tst-disc);
    grid-template-areas:
      "body disc"
      "cap  disc";
    align-items: center;
    column-gap: var(--gap-2xl);
    row-gap: clamp(16px, 1.8vw, 36px);
    margin: 0;
  }
  /* THE TWO TEXT ROWS MUST TOUCH, and centring them individually is why they
   * did not. The medallion spans both rows and is taller than the quote, so
   * grid distributes the surplus EQUALLY over the two spanned tracks (the spec
   * says equally, which is what makes the rest of this reliable): measured at
   * 1440, 288px of medallion over a 106px quote and a 31px attribution grew
   * each row by 62px, and with align-items:center both items sat in the middle
   * of their own inflated track — 88px of black between a sentence and the
   * name signing it, which read as two unrelated blocks.
   *
   * Pinning the quote to the BOTTOM of the first row and the attribution to
   * the TOP of the second leaves only the row-gap between them, and because
   * the surplus is split evenly the pair lands optically centred against the
   * medallion for free. When the quote is the taller of the two the tracks
   * never grow and the same two rules are simply inert. */
  :root[data-theme="studio"] .st-tst-body { grid-area: body; align-self: end; }
  :root[data-theme="studio"] .st-tst-cap { grid-area: cap; align-self: start; }
  :root[data-theme="studio"] .st-tst-disc { grid-area: disc; }

  :root[data-theme="studio"] .st-tst-body { min-width: 0; }
  /* The oversized opening glyph, one ramp step DOWN from where it was.
   *
   * It was h1 (92/64/44) against a lead-xl quote, a ratio of about 1.9:1. The
   * quote is now the calm lead rung (20/16/18), and 92px of punctuation over
   * 20px of prose is 4.6:1 — the mark becomes the loudest thing in the band
   * and the reader's eye never reaches the sentence. h2 (60/50/38) restores
   * roughly the 3:1 the source sets its own mark at: still unmistakably a
   * display flourish, no longer the headline.
   *
   * Its LEADING stays the one deliberate departure in this file: it is
   * decorative punctuation (aria-hidden), and at --lh-h2 its em box would open
   * a 68px hole above the quote. 0.6 is a layout device on a glyph nobody
   * reads, not an invented type step. */
  :root[data-theme="studio"] .st-tst-glyph {
    display: block;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: 0.6;
    color: color-mix(in srgb, var(--on-invert) 42%, transparent);
    user-select: none;
  }
  /* The quote drops a whole rung, from lead-xl to lead (20/16/18).
   *
   * lead-xl put it at 48px on a 1440 desktop — four lines of 48px white type
   * on a black band, which is a headline pretending to be a sentence, and the
   * source sets the same sentence at about 16px. A testimonial is not the
   * band's headline; the heading above it is, and two display-scale voices in
   * one band is why this one shouted. --t-lead is the prose ramp's own rung
   * for prose set a step above body — the calm register the source uses —
   * with --lh-lead (1.5em) as its partner leading rather than lead-xl's
   * tighter 1.3em, because leading has to open up as type gets smaller.
   *
   * THE RUNG CHANGE MOVES THE CONTRAST FLOOR. At 48px/500 this was WCAG "large
   * text" and answerable to 3:1; at 20px/500 it is ordinary text and owes the
   * full 4.5:1. The ink is unchanged and unaffected either way — pure
   * --on-invert on --ink-invert is 18.26:1 — but the muted rung a smaller
   * quote might have invited is not available to it, and that is why this
   * stays white.
   *
   * No max-width of its own any more: the grid column IS the measure. It
   * resolves to --studio-read (863px, about 80 characters at this size) by
   * construction wherever the band can pay for the whole stage, and to
   * whatever the band leaves when it cannot; the old min(100%, max(18rem,
   * 40vw)) would fight it — at 1440 that formula gave 576px inside a 620px
   * column, so the measure was set twice and neither number knew about the
   * other. Capping the text here instead would put the difference back into
   * the row as a void between the sentence and the medallion, which is the
   * hole the portrait left and the reason the stage exists. */
  :root[data-theme="studio"] .st-tst-q {
    max-width: 100%;
    margin: var(--gap-sm) 0 0;
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--on-invert);
    text-wrap: pretty;
    overflow-wrap: break-word;
  }
  :root[data-theme="studio"] .st-tst-cap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gap-sm) var(--gap-md);
    min-width: 0;
  }
  /* Both caption items are content this module does not write and cannot
   * predict the length of — a place name, a model code, whatever the reviews
   * turn out to carry. A flex item's automatic minimum size is its content, so
   * one long unbroken token would push the row past a 320px phone rather than
   * wrap inside it. These two lines are the whole guard. */
  :root[data-theme="studio"] .st-tst-who,
  :root[data-theme="studio"] .st-tst-chip {
    min-width: 0;
    max-inline-size: 100%;
    overflow-wrap: break-word;
  }
  /* The attribution name — uppercase tracked meta, i.e. the label role: DM Sans
   * 500 at 14px, --ls-label (0.06em, the source's widest tracking — the 0.12em
   * here was double it) and the tight label leading for a single line. Ink is
   * --on-invert-mute, tokens.ts's on-dark muted rung for TEXT (7.33:1); the
   * motif's opacity above is capped so that stays true wherever a slide lands. */
  :root[data-theme="studio"] .st-tst-who {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert-mute);
  }
  /* The chip beside the attribution — ROUND (§3): pills and chips are round,
   * buttons sharp. Still the label row whole, and still the same size; what
   * changes is its WEIGHT.
   *
   * It was a crisp 1px outline, 36px tall and 264px wide at 1440, sitting
   * beside a 14px name. Against a 48px quote it was merely busy; against the
   * calm 20px quote it read as a BUTTON — the only outlined rectangle on the
   * band, competing with the medallion's edge and with the two controls that
   * really are buttons. The source's attribution is one quiet line of tracked
   * caps and nothing else. So the outline goes and a low white fill takes its
   * place: --on-invert-16 is tokens.ts's quietest on-dark white, the shape
   * survives, and nothing on the band has a hard edge except the things that
   * can be pressed.
   *
   * The fill moves the ground under the text, so the ratio is recomputed
   * rather than inherited: #ffffff14 over #151515 flattens to #272727, and
   * --on-invert-mute (#a4a4a4) on that is 5.9:1 — past the 4.5:1 floor this
   * 14px text is held to. Padding drops with the border because a fill needs
   * less room to read than an outline does.
   *
   * The text inside is content's, not this module's: whatever the chip ends up
   * saying, it is one short run of tracked caps and this rule does not care. */
  :root[data-theme="studio"] .st-tst-chip {
    display: inline-block;
    border-radius: var(--r-pill);
    background: var(--on-invert-16);
    padding: clamp(5px, 0.4vw, 8px) clamp(10px, 0.9vw, 16px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert-mute);
  }
  /* The same run of tracked caps WITHOUT the pill, for a quote that is not a
   * verified purchase. The pill is what reads as a badge, and a badge is a
   * claim — see quoteBlock. Naming the model is context and stays. */
  :root[data-theme="studio"] .st-tst-model {
    min-width: 0;
    max-inline-size: 100%;
    overflow-wrap: break-word;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert-mute);
  }

  /* The circular product medallion (§4.10), clipped to --r-circle. The frame
   * is composition and is built regardless; the picture inside it is
   * inventory, and while a shop owns none the interior stays the drawn
   * placeholder (see media.ts on what a product slot claims). */
  :root[data-theme="studio"] .st-tst-disc {
    position: relative;
    overflow: hidden;
    inline-size: var(--studio-tst-disc);
    aspect-ratio: 1 / 1;
    border-radius: var(--r-circle);
    background: var(--studio-quote-disc);
    box-shadow: inset 0 0 0 var(--bw-line) var(--studio-line-invert);
  }
  /* THE CROP WAS THE DEFECT, AND object-fit:cover WAS THE CROP.
   *
   * The note this replaces argued the opposite — "a disc is a crop by
   * definition, and a contained image leaves two crescents of background that
   * read as a rendering fault". That is true of a photograph of a ROOM. It is
   * exactly wrong for the photography this shop actually owns, which is
   * white-sweep studio cutouts: the product centred, small in frame, floating
   * in a large field of near-white. Cover-crop one into a 216px circle and the
   * circle fills with sweep — a white disc with a fragment of acrylic across
   * it, which is what the owner saw and read as a broken image. The larger the
   * product sits in frame, the worse it gets, because cover clips whatever
   * does not fit the square and the thing being sold is what gets clipped.
   *
   * So the medallion becomes what the source's is: a light PANEL with the
   * product contained inside it and air all round. Three parts, and all three
   * are load-bearing:
   *
   *   1. object-fit: contain, so the whole product survives at ANY source
   *      aspect ratio — and this bucket mixes 900x900 hot tubs with 900x620
   *      swim spas, so a rule that only works on squares is not a rule.
   *   2. a --surface panel behind it. Contain leaves letterboxing wherever the
   *      picture is not square, and the crescents the old note feared are real
   *      — they just have to be the SAME white as the sweep, and then the
   *      panel and the picture are one continuous field with a product in it.
   *      A darker rung (--bg-alt, say) would draw the seam it is meant to hide.
   *   3. padding, which is the air. inset:0 on an absolutely positioned image
   *      resolves against its containing block's PADDING box, so padding here
   *      is the only thing that insets it — sizing it with inline-size alone
   *      does not, because a replaced element ignores inset-shrinking and
   *      takes its intrinsic width instead. A tenth of the diameter reads as
   *      generous at 300px and still leaves a legible product at the 160px
   *      floor — and it is written as a division of the token rather than as
   *      padding:10%, because percentage padding resolves against the
   *      CONTAINING BLOCK, not the element. Stacked on a phone the medallion
   *      is 160px inside a 340px column, so the percentage form quietly paid
   *      it 34px of padding a side: 42% of the disc, and a product shrunk to
   *      a smudge in the middle of it.
   *
   * The ring goes with it: a white disc on a near-black band needs no help
   * being a shape, and a 16%-white hairline over white is invisible anyway.
   *
   * The DRAWN fallback keeps the dark disc above, because its mass and floor
   * shadow are white-on-transparent mixes that would vanish on a light panel.
   * Hence a modifier rather than a redefinition: the two interiors are lit
   * differently because they are different things. */
  :root[data-theme="studio"] .st-tst-disc--lit {
    background: var(--surface);
    padding: calc(var(--studio-tst-disc) / 10);
    box-shadow: none;
  }
  :root[data-theme="studio"] .st-tst-disc-photo {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }
  :root[data-theme="studio"] .st-tst-disc-mass {
    position: absolute;
    inset: 26%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--on-invert) 10%, transparent);
    background: color-mix(in srgb, var(--on-invert) 7%, transparent);
  }
  :root[data-theme="studio"] .st-tst-disc-floor {
    position: absolute;
    left: 50%; bottom: 17%;
    translate: -50% 0;
    inline-size: 46%;
    block-size: 6%;
    border-radius: var(--r-pill);
    background: radial-gradient(
      50% 50% at 50% 50%,
      color-mix(in srgb, var(--on-invert) 12%, transparent),
      transparent 72%
    );
  }

  /* The two circular controls, TUCKED UNDER THE MEDALLION (§4.10). 64px square
   * with a 2px ring — --ctrl-circle-size and --bw-ctrl are tokens.ts's own
   * entries for exactly this control and had, until now, no consumer. 64px is
   * comfortably past WCAG 2.5.8's 44px target (and past 2.5.5 AAA's), so the
   * geometry is the hit area; no padding trickery is needed.
   *
   * WHERE THEY SIT IS THE POINT. Flush to the container's right edge they
   * floated in the band's bottom-right corner with nothing above or beside
   * them — 1360px wide of nav holding 138px of buttons, aligned to an edge no
   * other element on the band touched. Now the nav is the same stage as the
   * scrollport, so it ends where the medallion ends, and the inner group is
   * exactly the medallion's width with the pair centred in it: the controls
   * hang on the vertical axis of the circle they page. Two rules, both
   * expressed in the same two custom properties the row above is built from,
   * so nothing can drift out of alignment. */
  :root[data-theme="studio"] .st-tst-nav {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: flex-end;
    max-inline-size: var(--studio-tst-stage);
    margin-inline: auto;
    margin-top: clamp(24px, 3vw, 60px);
  }
  :root[data-theme="studio"] .st-tst-nav-in {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--gap-sm);
    inline-size: var(--studio-tst-disc);
  }
  /* THE RING IS THE CONTROL'S BOUNDARY, so WCAG 1.4.11's 3:1 applies to it:
   * --on-invert-mute is 7.33:1 on the band, with headroom to spare, and the
   * glyph inside is the full --on-invert rung. Hover/focus inverts the whole
   * disc — the theme's existing idiom (commerce.ts's .st-util-go does the
   * same) rather than a new one invented for this band. */
  :root[data-theme="studio"] .st-tst-go {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--ctrl-circle-size);
    block-size: var(--ctrl-circle-size);
    border: var(--bw-ctrl) solid var(--on-invert-mute);
    border-radius: var(--r-circle);
    background: transparent;
    color: var(--on-invert);
    text-decoration: none;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-tst-go:hover,
  :root[data-theme="studio"] .st-tst-go:focus-visible {
    background: var(--on-invert);
    border-color: var(--on-invert);
    color: var(--ink-invert);
  }
  :root[data-theme="studio"] .st-tst-go:focus-visible {
    outline: 2px solid var(--on-invert);
    outline-offset: 3px;
  }
  /* icons.ts draws the arrow inside its own STADIUM outline, because on the
   * rail that outline IS the button — there is no other boundary. Here the
   * 64px ring is the boundary, and painting both would be the circle-around-a-
   * stadium that commerce.ts's note warns about. So the geometry still comes
   * from icons.ts, unmodified, and the frame half of it is switched off in CSS:
   * the stadium is the only path in that glyph carrying a stroke. */
  :root[data-theme="studio"] .st-tst-go .st-arrow-svg { display: block; }
  :root[data-theme="studio"] .st-tst-go .st-arrow-svg path[stroke] { display: none; }
  /* A control that cannot do anything must not look like it can, and must not
   * take a click. aria-disabled rather than the disabled attribute because
   * these are anchors, and an anchor that stops being focusable mid-scroll
   * would move the reader's focus somewhere unrelated. */
  :root[data-theme="studio"] .st-tst-go[aria-disabled="true"] {
    opacity: 0.3;
    pointer-events: none;
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
  :root[data-theme="studio"] .st-gd-in {
    max-width: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
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
    :root[data-theme="studio"] .st-tst-fig {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "disc"
        "body"
        "cap";
      justify-items: start;
      row-gap: clamp(20px, 2.4vw, 32px);
    }
    /* The controls join that left edge rather than hanging off the right of a
     * block they are no longer under. */
    :root[data-theme="studio"] .st-tst-nav { justify-content: flex-start; }
    :root[data-theme="studio"] .st-tst-nav-in { inline-size: auto; }
  }

  /* ---- Below 860px: everything stacks (§4.9 "stacks on mobile") ---- */
  @media (max-width: 860px) {
    :root[data-theme="studio"] .st-imp-row,
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
    :root[data-theme="studio"] .st-imp-tile {
      aspect-ratio: auto;
      height: min(100vw - 2 * var(--studio-gutter), 520px);
    }
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
    :root[data-theme="studio"] .st-gd-go,
    :root[data-theme="studio"] .st-tst-go { transition: none; }
    :root[data-theme="studio"] .st-gd-card:hover .st-gd-photo,
    :root[data-theme="studio"] .st-gd-card:focus-visible .st-gd-photo,
    :root[data-theme="studio"] .st-gd-card:hover .st-gd-arrow,
    :root[data-theme="studio"] .st-gd-card:focus-visible .st-gd-arrow {
      transform: none;
    }
    /* The slider keeps its scrollability and loses only its motion: snapping
     * and smooth scrolling are the whole of it, and an anchor still lands on
     * its quote — instantly. behaviour.ts reads the same media query and steps
     * with behavior:"auto" for the same reason. */
    :root[data-theme="studio"] .st-tst-track {
      scroll-snap-type: none;
      scroll-behavior: auto;
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
  const steps = ctx.content.moat.steps;
  const label = steps[0];
  const stat = ctx.content.stats[0];
  // Three short proof points read as one muted line under the head; more than
  // three and the 21px sub starts competing with the tiles. Each claim is its
  // own inline-block chip so the line breaks only at the gaps BETWEEN chips
  // (CSS: .st-imp-claim), and the separator dot lives INSIDE the chip before
  // it — an atomic inline's edges are wrap opportunities in their own right,
  // so a dot placed between chips can open a wrapped line no matter what
  // no-break space sits beside it (measured doing exactly that at 1000px).
  // Claims are escaped individually; the joined string is emitted as markup.
  const claims = ctx.content.trust.slice(0, 3);
  const sub = claims
    .map(
      (t, i) =>
        '<span class="st-imp-claim">' +
        esc(t) +
        (i < claims.length - 1 ? " ·" : "") +
        "</span>",
    )
    .join(" ");

  const quiet =
    '<div class="st-imp-tile st-imp-quiet">' +
    tileShot(ctx, "zakaj-mi-2", "st-imp-photo", "(max-width: 860px) 92vw, 30vw") +
    (label
      ? '<div class="st-imp-label"><h3 class="st-imp-t">' + esc(label[0]) + "</h3>" +
        '<p class="st-imp-p">' + esc(label[1]) + "</p></div>"
      : "") +
    "</div>";

  // The hero tile carries no label by design — the crop is the content, so it
  // is the one tile that genuinely needs a picture rather than tolerating one.
  //
  // Offset 31, not 2: the head above this row names the hot tub ("Zakaj kupci
  // izberejo masažni bazen") and offset 2 resolved, for the bazen key, to a
  // SWIM SPA — the other product family — in landscape, so the 4/5 portrait
  // cover also threw away 45% of its width. 31 lands on the flagship tub's
  // lit-cladding side view: the named product, square, with tone of its own.
  // Collision check against every pick(OWN_PHOTOS) offset on the page — 5
  // (hero band), 13 (quiet tile), 17+i (testimonial discs), 22 (stat tile,
  // below), 23/25 (statement), 25-30 (social strip) — all distinct from 31,
  // so no photograph repeats because of it.
  const hero =
    '<div class="st-imp-tile st-imp-hero">' +
    tileShot(ctx, "zakaj-mi-3", "st-imp-photo", "(max-width: 860px) 92vw, 38vw") +
    "</div>";

  // §4.9's third tile carried a borrowed room interior with the stat over it.
  // It now carries one of the shop's own photographs, or none. The stat still
  // reads either way: it sits on its own panel, not on the picture.
  //
  // Offset 22, not 9: the stat is the HOT TUB ladder ("3 modeli / od 195 do
  // 230 cm") and offset 9 resolved to a swim spa. 22 lands on the flagship
  // tub's top-down shell view — the one angle that shows what the number
  // counts; its white sweep is exactly what the scrim below was computed
  // against, and the multiply ground seats it. Distinct from every other
  // pick offset on the page (5, 13, 17+i, 23, 25-30, 31 — the full list sits
  // at the hero tile above).
  // A NAMED SLOT, not offset 22. The comment above records why 22 was chosen
  // and it stays true of the fallback — /media resolves that same offset until
  // the owner uploads — but which picture anchors this tile is now theirs to
  // decide in the panel rather than ours to compute.
  const roomPhoto = OWN_PHOTOS.length > 0 ? sitePhoto("zakaj-mi") : undefined;
  const room =
    '<div class="st-imp-tile">' +
    (roomPhoto
      ? decorativeImg(roomPhoto, "st-imp-photo", "(max-width: 860px) 92vw, 30vw")
      : "") +
    (stat
      ? '<div class="st-imp-stat">' +
        '<span class="st-imp-v">' + statValue(stat[0]) + "</span>" +
        '<span class="st-imp-c">' + esc(stat[1]) + "</span></div>"
      : "") +
    "</div>";

  return (
    '<section class="st-imp"><div class="st-imp-in">' +
    '<div class="st-imp-head">' +
    '<h2 class="st-imp-h">Zakaj kupci izberejo ' + esc(ctx.shop.keyword.accusative) + "</h2>" +
    (sub ? '<p class="st-imp-sub">' + sub + "</p>" : "") +
    "</div>" +
    '<div class="st-imp-row">' + quiet + hero + room + "</div>" +
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
 * One quote: the body column plus the figure's caption, emitted as SIBLINGS —
 * <figcaption> is only a caption when it is a direct child of <figure>, so the
 * grid (not the source tree) is what places it under the quote.
 *
 * The oversized glyph is the low Slovenian opening quote „ — decorative
 * punctuation, so it is aria-hidden and the quote text itself is NOT wrapped
 * in a second pair of marks.
 *
 * THE CHIP IS OPTIONAL, AND THE LAYOUT DOES NOT NOTICE EITHER WAY. It names
 * the model the review is about, and a review that does not name one must not
 * render a chip trailing a separator with nothing after it. So `model` is an
 * optional field here and an empty one renders no element at all: the caption
 * is a flex row whose gap only exists between items that exist, and the
 * attribution stands alone with no hole beside it. Nothing in the stylesheet
 * is conditioned on the chip's presence or on what it says.
 */
function quoteBlock(r: { q: string; who: string; model?: string; placeholder?: boolean }): string {
  // ⚠️ A PLACEHOLDER NEVER WEARS THE CHIP.
  //
  // ShopContent.reviews states the rule — "the renderer must not dress it as
  // verified" — and this function was ignoring it: the chip printed whenever
  // a model was set, so the two known-invented quotes rendered "Preverjen
  // nakup · BAZEN 230" on every page view. Claiming a review is a checked
  // purchase when nobody wrote it is Annex I 23b/23c of the Unfair Commercial
  // Practices Directive, banned outright.
  //
  // The launch gate already refuses live: true while any review is flagged,
  // but a gate on a config flag is one flip away from publishing the claim,
  // and the QA host renders it in the meantime. The model still shows — it is
  // useful context — as a plain caption that asserts nothing.
  const chip = !r.model
    ? ""
    : r.placeholder
      ? '<span class="st-tst-model">' + esc(r.model) + "</span>"
      : '<span class="st-tst-chip">Preverjen nakup · ' + esc(r.model) + "</span>";
  return (
    '<div class="st-tst-body">' +
    '<span class="st-tst-glyph" aria-hidden="true">„</span>' +
    '<blockquote class="st-tst-q">' + esc(r.q) + "</blockquote>" +
    "</div>" +
    '<figcaption class="st-tst-cap">' +
    '<span class="st-tst-who">' + esc(r.who) + "</span>" +
    chip +
    "</figcaption>"
  );
}

/**
 * The two circular controls (§4.10), bottom right.
 *
 * They are ANCHORS to the first and last quote, which is the whole no-JS
 * story: before behaviour.ts runs they jump to an end of the scroller and move
 * focus into that quote; after it runs the module intercepts the click and
 * steps by exactly one, then keeps `aria-disabled` in sync with the scroll
 * position. Either way both controls always act.
 *
 * Icon-only by design, so there is no visible label for WCAG 2.5.3 to
 * contradict: the aria-label IS the accessible name, and it names where the
 * link actually goes rather than a scroll step an anchor cannot promise. The
 * glyph is aria-hidden inside icons.ts.
 *
 * No `data-st-dots`: pagination is a device for a rail of many cards, and
 * commerce.ts's rail has it. A band that shows one quote at a time with two
 * reviews per shop would render two dots beside two arrows saying the same
 * thing, and §4.10 has no dot row in it.
 *
 * The glyph comes from icons.ts unmodified — verbatim source geometry, one
 * declaration site. It ships its own stadium frame because on the rail that
 * frame IS the button; here the 64px ring already is, so the frame half is
 * switched off in CSS rather than by forking the path data.
 */
function sliderNav(last: string): string {
  return (
    // The inner span is the ALIGNMENT, not decoration: the <nav> spans the
    // stage so it ends where the medallion ends, and this group is the
    // medallion's own width so the two controls centre on the circle's
    // vertical axis instead of hanging off the band's right edge. Both
    // measurements come from the same custom properties the row above uses.
    '<nav class="st-tst-nav" aria-label="Pomik po mnenjih">' +
    '<span class="st-tst-nav-in">' +
    '<a class="st-tst-go st-arrow st-arrow--prev" data-st-prev href="#st-tst-1"' +
    ' aria-label="Prejšnje mnenje">' + arrowIcon("left") + "</a>" +
    '<a class="st-tst-go st-arrow" data-st-next href="' + esc(last) + '"' +
    ' aria-label="Naslednje mnenje">' + arrowIcon("right") + "</a>" +
    "</span></nav>"
  );
}

/**
 * §4.10 — the inverted testimonial band, as a real slider.
 *
 * One quote per view: glyph + quote + attribution left, the circular product
 * medallion right, the two circular controls centred beneath the medallion.
 * The markup is the behaviour contract and nothing more — `data-st-slider` on the
 * section, `data-st-scroll` on the scroller, `data-st-item` per quote,
 * `data-st-prev`/`data-st-next` on the controls — so behaviour.ts's generic
 * slider upgrades it and this module writes no JavaScript at all.
 *
 * With a single review there is nothing to move between, so the controls are
 * not rendered; the scroller still holds the one quote and reads identically.
 * A shop with no reviews renders nothing — an empty dark band would read as a
 * loading failure, and fabricating a quote is out of the question.
 */
export function renderStudioTestimonials(ctx: RenderCtx): string {
  const reviews = ctx.content.reviews;
  if (!reviews.length) return "";

  const slides = reviews
    .map((r, i) => {
      // The id is the anchor target the controls fall back to, and tabindex=-1
      // is what lets that anchor move focus into a quote that is not itself
      // interactive.
      const id = "st-tst-" + String(i + 1);
      // A photograph, not the grey disc. The rule in the stylesheet says the
      // frame is composition and the picture inside it is inventory, "until a
      // shop owns photography" — it owns 43 files now, and two empty discs
      // beside the reviews were the last of the placeholder furniture on this
      // page. Offset 17 + i keeps them off the pictures the bands above
      // already took (5, 13, 22, 23, 25-30, 31) and off each other.
      //
      // The two interiors are lit differently, so the class says which one it
      // is: --lit is the light panel a white-sweep cutout needs to sit on, and
      // the drawn mass would disappear into it. `sizes` follows the medallion,
      // which now survives below 1080px stacked above the quote — it is
      // clamp(160px, 18vw, 300px), so 200px is a safe upper bound for every
      // viewport under the breakpoint and 18vw describes the rest.
      const lit = OWN_PHOTOS.length > 0;
      const disc = lit
        ? decorativeImg(pick(OWN_PHOTOS, ctx.shop.key, 17 + i), "st-tst-disc-photo", "(max-width: 1080px) 200px, 18vw")
        : '<span class="st-tst-disc-mass"></span><span class="st-tst-disc-floor"></span>';
      return (
        '<li class="st-tst-slide" data-st-item id="' + esc(id) + '" tabindex="-1">' +
        '<figure class="st-tst-fig">' +
        quoteBlock(r) +
        '<div class="st-tst-disc' + (lit ? " st-tst-disc--lit" : "") + '" aria-hidden="true">' +
        disc +
        "</div>" +
        "</figure></li>"
      );
    })
    .join("");

  const nav = reviews.length < 2 ? "" : sliderNav("#st-tst-" + String(reviews.length));

  // The heading makes the same claim the chip does, so it answers to the same
  // rule: it may say "verified" only when every quote under it is real.
  const heading = reviews.some((r) => r.placeholder)
    ? "Mnenja strank"
    : "Preverjena mnenja strank";

  return (
    '<section class="st-tst" data-st-slider aria-labelledby="st-tst-h">' +
    '<div class="st-tst-in">' +
    '<div class="st-tst-head">' +
    motif() +
    '<h2 class="st-tst-h" id="st-tst-h">' + esc(heading) + "</h2>" +
    "</div>" +
    '<div class="st-tst-track" data-st-scroll>' +
    '<ul class="st-tst-list">' + slides + "</ul>" +
    "</div>" +
    nav +
    "</div></section>"
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
          '<a class="st-gd-card" href="' + href + '">' +
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
            "(max-width: 809px) 92vw, 30vw",
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
