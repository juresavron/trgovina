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
 *         eye motif large and faint behind it, then one quote at a time:
 *         square portrait photograph left, an oversized opening glyph at the
 *         h1 rung over the quote and its label-rung attribution centre, a
 *         Ø300px circular product frame right, and the two 64px circular
 *         prev/next controls bottom right. It is a REAL slider — a horizontal
 *         scroll-snap container that works with no script, upgraded by
 *         behaviour.ts's generic slider to step by exactly one quote.
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
 * and on the guide cards, the portrait lands in the testimonial's face slot —
 * all atmosphere — while the impact grid's hero tile and the circle on the
 * testimonial band keep their drawn placeholder. The circle is BUILT here
 * regardless: the frame is composition, the picture inside it is inventory.
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
import { MOTIF_EYE, PORTRAITS, ROOMS, decorativeImg, pick } from "./media";

export const STUDIO_EDITORIAL_CSS = `
  /* ---- Values the baseline measures that tokens.ts does not carry ----
   * The gutter, the light and dark rhythms, the card gap, every ground rung
   * and every radius come from tokens.ts and are consumed as bare var(--…)
   * with NO fallback: a fallback here is a second source of truth, and the
   * only way it could ever be used is a sheet assembled without its own
   * token block — which is a bug to fix at the seam, not to paper over. */
  :root[data-theme="studio"] {
    /* §4.9 measured 14px tile radius / §4.11 measured 16px card radius. Both
     * sit above --r-media (12px) and below --r-card (24px), so neither is a
     * token rung; clamped so a 390px card is not proportionally rounder than
     * the 2000px original. */
    --studio-tile-r: clamp(10px, 0.7vw, 14px);
    --studio-guide-r: clamp(10px, 0.8vw, 16px);

    /* §4.10: the ground BEHIND the portrait photograph — a lifted black, so
     * the square reads as a photo slot rather than a hole in the band while
     * the lazy image is still in flight. */
    --studio-portrait: color-mix(in srgb, var(--on-invert) 10%, var(--ink-invert));
    /* §4.10: the Ø300px #1C1C1C disc — mixed from tokens, never a hex, and
     * mixed HERE rather than borrowed from another module's private var. */
    --studio-quote-disc: color-mix(in srgb, var(--on-invert) 12%, var(--ink-invert));
    /* The hairline the inverted band uses for its own frames and chips. --line
     * (#dfdfdf) is a white-ground value and glares here. */
    --studio-line-invert: color-mix(in srgb, var(--on-invert) 16%, transparent);
  }

  /* ================= §4.9 Impact grid ================= */
  :root[data-theme="studio"] .st-imp {
    background: var(--bg);
    padding-block: var(--studio-rhythm);
    /* The hero tile is deliberately oversized; the page must never scroll
     * sideways because of it (§6). */
    overflow: clip;
  }
  :root[data-theme="studio"] .st-imp-in {
    max-width: var(--studio-container);
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
   * tokens.ts's muted rung for TEXT rather than the decorative alpha. */
  :root[data-theme="studio"] .st-imp-sub {
    max-width: min(100%, max(20rem, 34vw));
    margin: clamp(12px, 1.2vw, 24px) auto 0;
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--ink-mute);
    text-wrap: pretty;
  }

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
  :root[data-theme="studio"] .st-imp-quiet { background: var(--bg-alt); }
  :root[data-theme="studio"] .st-imp-hero {
    aspect-ratio: 4 / 5;
    background: var(--tile-mid);
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
  }

  /* Label bottom-LEFT on the quiet tile (§4.9). */
  :root[data-theme="studio"] .st-imp-label {
    position: absolute;
    z-index: 2;
    inset: auto clamp(16px, 1.8vw, 36px) clamp(16px, 1.8vw, 36px) clamp(16px, 1.8vw, 36px);
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
   * would have failed the day the photo landed. These stops hold ≥0.73 across
   * the whole text block at every tier and still spend their top quarter
   * fading out, so the tile still reads as a photograph rather than a plate. */
  :root[data-theme="studio"] .st-imp-stat {
    position: absolute;
    z-index: 2;
    inset: auto 0 0 0;
    padding: clamp(48px, 6vw, 120px) clamp(16px, 1.8vw, 36px) clamp(16px, 1.8vw, 36px);
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--ink-invert) 96%, transparent) 0%,
      color-mix(in srgb, var(--ink-invert) 86%, transparent) 44%,
      color-mix(in srgb, var(--ink-invert) 46%, transparent) 74%,
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
    max-width: var(--studio-container);
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

  /* portrait | quote | circle, the measured three-part row. Named areas rather
   * than source order, because <figcaption> must be a direct child of <figure>
   * to be its caption — it cannot live inside the quote column's wrapper, so
   * the grid puts it there instead. */
  :root[data-theme="studio"] .st-tst-fig {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas:
      "por body disc"
      "por cap  disc";
    align-items: center;
    column-gap: clamp(20px, 3.2vw, 64px);
    row-gap: clamp(16px, 1.8vw, 36px);
    margin: 0;
  }
  :root[data-theme="studio"] .st-tst-portrait { grid-area: por; }
  :root[data-theme="studio"] .st-tst-body { grid-area: body; }
  :root[data-theme="studio"] .st-tst-cap { grid-area: cap; }
  :root[data-theme="studio"] .st-tst-disc { grid-area: disc; }
  /* Square portrait, ~420px, SHARP corners (§4.10) — --r-ctrl is the theme's
   * sharp rung, the same edge its buttons use. This is the one slot on the
   * band that is a square and not a circle, which is what makes the circle on
   * the far side read as a deliberate shape rather than a house style. */
  :root[data-theme="studio"] .st-tst-portrait {
    position: relative;
    overflow: hidden;
    inline-size: clamp(120px, 21vw, 420px);
    aspect-ratio: 1 / 1;
    border-radius: var(--r-ctrl);
    background: var(--studio-portrait);
  }
  /* B&W per §4.10. The crops are tall (900×1414) and the slot is square, so
   * the frame takes the upper third where a subject's head sits rather than
   * centring on the midriff. */
  :root[data-theme="studio"] .st-tst-photo {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    object-position: 50% 28%;
    filter: grayscale(1);
  }

  :root[data-theme="studio"] .st-tst-body { min-width: 0; }
  /* The oversized opening glyph. Its SIZE is a ramp step — h1 (92/64/44) is
   * within two px of the measured 90 — but its LEADING is the one deliberate
   * departure in this file: it is decorative punctuation (aria-hidden), and at
   * --lh-h1 its em box would open a 96px hole above the quote. 0.6 is a layout
   * device on a glyph nobody reads, not an invented type step. */
  :root[data-theme="studio"] .st-tst-glyph {
    display: block;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h1);
    letter-spacing: var(--ls-h1);
    line-height: 0.6;
    color: color-mix(in srgb, var(--on-invert) 42%, transparent);
    user-select: none;
  }
  /* Every quote is now the band's editorial statement — there is no longer a
   * lead one and a demoted stack — so they all take lead-xl (48/44/24, Satoshi
   * 500, --ls-body, --lh-lead-xl): prose set large, not a heading. The measured
   * 26px was a step the source's prose ramp does not have. max-width still
   * tracks the measured 800-at-2000px measure. */
  :root[data-theme="studio"] .st-tst-q {
    max-width: min(100%, max(18rem, 40vw));
    margin: clamp(12px, 1.4vw, 28px) 0 0;
    font-family: var(--f-body);
    font-size: var(--t-lead-xl);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead-xl);
    color: var(--on-invert);
    text-wrap: pretty;
    overflow-wrap: break-word;
  }
  :root[data-theme="studio"] .st-tst-cap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: clamp(10px, 1.1vw, 22px);
    min-width: 0;
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
  /* Verification chip — ROUND (§3): pills and chips are round, buttons sharp.
   * Only verified purchases render on this network, so the chip is a statement
   * of fact about the record, not decoration. Type is the label row whole. */
  :root[data-theme="studio"] .st-tst-chip {
    display: inline-block;
    border: 1px solid var(--studio-line-invert);
    border-radius: var(--r-pill);
    padding: clamp(6px, 0.5vw, 10px) clamp(12px, 1.1vw, 22px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert-mute);
  }

  /* Ø300px circular product frame (§4.10), clipped to --r-circle with a
   * hairline ring so it reads as a frame and not as a smudge on the band. The
   * frame is composition and is built now; the picture inside it is inventory,
   * and until a shop owns photography of a €1,500–15,000 sauna the interior
   * stays the drawn placeholder (see media.ts on what a product slot claims).
   * It carries no text, so it simply drops below 1080px where the quote needs
   * the width more than the band needs the ornament. */
  :root[data-theme="studio"] .st-tst-disc {
    position: relative;
    overflow: hidden;
    inline-size: clamp(180px, 15vw, 300px);
    aspect-ratio: 1 / 1;
    border-radius: var(--r-circle);
    background: var(--studio-quote-disc);
    box-shadow: inset 0 0 0 var(--bw-line) var(--studio-line-invert);
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

  /* The two circular controls, BOTTOM RIGHT of the band (§4.10). 64px square
   * with a 2px ring — --ctrl-circle-size and --bw-ctrl are tokens.ts's own
   * entries for exactly this control and had, until now, no consumer. 64px is
   * comfortably past WCAG 2.5.8's 44px target, so the geometry is the hit
   * area; no padding trickery is needed. */
  :root[data-theme="studio"] .st-tst-nav {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--gap-sm);
    margin-top: clamp(24px, 3vw, 60px);
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
    padding-block: var(--studio-rhythm);
    overflow: clip;
  }
  :root[data-theme="studio"] .st-gd-in {
    max-width: var(--studio-container);
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

  /* ---- Below 1080px: the ornament goes before the words do ---- */
  @media (max-width: 1080px) {
    :root[data-theme="studio"] .st-tst-disc { display: none; }
    :root[data-theme="studio"] .st-tst-fig {
      grid-template-columns: auto minmax(0, 1fr);
      grid-template-areas:
        "por body"
        "por cap";
    }
  }

  /* ---- Below 860px: everything stacks (§4.9 "stacks on mobile") ---- */
  @media (max-width: 860px) {
    :root[data-theme="studio"] .st-imp-row,
    :root[data-theme="studio"] .st-gd-row {
      grid-template-columns: minmax(0, 1fr);
    }
    /* Stacked, the hero tile no longer has neighbours to out-scale, and a 4/5
     * box on a phone is a wall — bring it back to the row's square. */
    :root[data-theme="studio"] .st-imp-hero { aspect-ratio: 1 / 1; }
    :root[data-theme="studio"] .st-imp-sub { max-width: 100%; }
    /* Portrait above the quote: a 120px square beside the lead-xl quote leaves
     * it about eleven characters per line at 390px. */
    :root[data-theme="studio"] .st-tst-fig {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "por"
        "body"
        "cap";
      justify-items: start;
    }
    :root[data-theme="studio"] .st-tst-q { max-width: 100%; }
    :root[data-theme="studio"] .st-tst-mark { width: 110%; }
    /* Two 64px circles plus the 10px gap is 138px — it fits a 390px viewport
     * with room to spare, so the controls keep their measured size and simply
     * stay where they are. */
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
function tileShot(): string {
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
  // three and the 21px sub starts competing with the tiles.
  const sub = ctx.content.trust.slice(0, 3).join(" · ");

  const quiet =
    '<div class="st-imp-tile st-imp-quiet">' +
    tileShot() +
    (label
      ? '<div class="st-imp-label"><h3 class="st-imp-t">' + esc(label[0]) + "</h3>" +
        '<p class="st-imp-p">' + esc(label[1]) + "</p></div>"
      : "") +
    "</div>";

  // The hero tile carries no label by design — the crop is the content. It is
  // also a PRODUCT slot, so it keeps the drawn placeholder while its
  // neighbour takes a real photograph: see the media note in the header.
  const hero = '<div class="st-imp-tile st-imp-hero">' + tileShot() + "</div>";

  // §4.9's third tile is a room interior with the stat over it. Atmosphere,
  // not the product, so the bundle's photography is legitimate here. Offset 3
  // is the one ROOMS entry the three guide cards below (offsets 0–2) cannot
  // take, so the same picture never appears twice on one page.
  const room =
    '<div class="st-imp-tile">' +
    decorativeImg(
      pick(ROOMS, ctx.shop.key, 3),
      "st-imp-photo",
      "(max-width: 860px) 92vw, 30vw",
    ) +
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
    (sub ? '<p class="st-imp-sub">' + esc(sub) + "</p>" : "") +
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
  return (
    '<span class="st-tst-mark" aria-hidden="true">' +
    decorativeImg(MOTIF_EYE, "st-tst-eye", "(max-width: 809px) 110vw, 760px") +
    "</span>"
  );
}

/**
 * The square portrait slot (§4.10).
 *
 * Seeded by shop AND index: the brief names `pick(PORTRAITS, ctx.shop.key)`,
 * and the offset is the one thing added to it, because two quotes signed by
 * two different people must not show the same face. That is what the offset
 * argument in media.ts exists for.
 *
 * Decorative — aria-hidden with an empty alt, and the launch gate in
 * media.ts still blocks `live: true` while it is on the page: these are the
 * source bundle's crops, not the shop's own customers.
 *
 * ONE THING TO FIX UPSTREAM, NOT HERE. media.ts describes PORTRAITS as
 * "testimonial photography", but only portrait-08 is a person: portrait-03 is
 * the eye motif again and portrait-05 is a dining chair. So this slot can
 * currently show a chair next to "Marjan K., Kranj". Re-curating that list is
 * a one-line change in media.ts and belongs there — filtering it from this
 * module would put the curation in two places and quietly disagree with the
 * launch gate that reads the same list.
 */
function portrait(ctx: RenderCtx, i: number): string {
  return (
    '<div class="st-tst-portrait" aria-hidden="true">' +
    decorativeImg(
      pick(PORTRAITS, ctx.shop.key, i),
      "st-tst-photo",
      // The frame is clamp(120px, 21vw, 420px) and nothing overrides it, so
      // these are that clamp restated: 21vw clears the 120px floor above
      // 571px and meets the 420px cap at 2000px. The old value declared a
      // flat 420px, which at 1440px asked for a rung 39% wider than the
      // 302px the frame actually paints.
      "(max-width: 571px) 120px, (max-width: 2000px) 21vw, 420px",
    ) +
    "</div>"
  );
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
 * "Preverjen nakup · MODEL" is a factual chip: this network publishes only
 * reviews it can tie to an order (content/types.ts), so every rendered quote
 * has earned it. CSS uppercases it — §1 sets every chip in tracked caps.
 */
function quoteBlock(r: { q: string; who: string; model: string }): string {
  return (
    '<div class="st-tst-body">' +
    '<span class="st-tst-glyph" aria-hidden="true">„</span>' +
    '<blockquote class="st-tst-q">' + esc(r.q) + "</blockquote>" +
    "</div>" +
    '<figcaption class="st-tst-cap">' +
    '<span class="st-tst-who">' + esc(r.who) + "</span>" +
    '<span class="st-tst-chip">Preverjen nakup · ' + esc(r.model) + "</span>" +
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
    '<nav class="st-tst-nav" aria-label="Pomik po mnenjih">' +
    '<a class="st-tst-go st-arrow st-arrow--prev" data-st-prev href="#st-tst-1"' +
    ' aria-label="Prejšnje mnenje">' + arrowIcon("left") + "</a>" +
    '<a class="st-tst-go st-arrow" data-st-next href="' + esc(last) + '"' +
    ' aria-label="Naslednje mnenje">' + arrowIcon("right") + "</a>" +
    "</nav>"
  );
}

/**
 * §4.10 — the inverted testimonial band, as a real slider.
 *
 * One quote per view: portrait left, glyph + quote + attribution centre, the
 * circular product frame right, the two circular controls bottom right. The
 * markup is the behaviour contract and nothing more — `data-st-slider` on the
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
      return (
        '<li class="st-tst-slide" data-st-item id="' + esc(id) + '" tabindex="-1">' +
        '<figure class="st-tst-fig">' +
        portrait(ctx, i) +
        quoteBlock(r) +
        '<div class="st-tst-disc" aria-hidden="true">' +
        '<span class="st-tst-disc-mass"></span>' +
        '<span class="st-tst-disc-floor"></span>' +
        "</div>" +
        "</figure></li>"
      );
    })
    .join("");

  const nav = reviews.length < 2 ? "" : sliderNav("#st-tst-" + String(reviews.length));

  return (
    '<section class="st-tst" data-st-slider aria-labelledby="st-tst-h">' +
    '<div class="st-tst-in">' +
    '<div class="st-tst-head">' +
    motif() +
    '<h2 class="st-tst-h" id="st-tst-h">Preverjena mnenja strank</h2>' +
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
          // Atmosphere, not the product: a room interior beside a buying guide
          // claims nothing about what is for sale. Seeded by shop AND index so
          // three cards differ and two shops do not land on the same set.
          decorativeImg(
            pick(ROOMS, ctx.shop.key, i),
            "st-gd-photo",
            "(max-width: 809px) 92vw, (max-width: 1199px) 46vw, 30vw",
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
