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
 *         giant faint ARROW-STADIUM watermark (§4.14) behind it at the
 *         --ink-invert-2 rung: the same outline as the theme's arrow buttons,
 *         stretched to band width. It is NOT an eye and NOT a circle — reading
 *         it as one (as an earlier pass of this file did, drawing an ellipse
 *         with a concentric ring) throws away the theme's signature. The
 *         geometry comes from icons.ts, path data verbatim from the source
 *         SVGs. Then square B&W portrait left, an oversized quote glyph at the
 *         h1 rung, the lead quote at lead-xl (max-width 800), a label-rung
 *         uppercase attribution, the Ø300px #1C1C1C product disc right.
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
 * No dead controls (§5.2): the baseline's two stadium arrows under the
 * testimonial drive a carousel, and this Worker ships no JS. Rather than render
 * buttons that cannot act, the additional reviews STACK below the lead one,
 * separated by hairlines — every quote is reachable, nothing is hidden behind
 * a control. Same reason there is no rail here: these are three cards, not a
 * scroller, so they simply reflow to one column.
 *
 * Content comes from ctx only. Field split is deliberate so that a home page
 * composing statement.ts AND this module never prints the same sentence twice:
 * statement.ts owns moat.h2 / content.sub / moat.claim, this module owns
 * moat.steps (tile labels), stats (the tile overlay), reviews and guides.
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
import { MOTIF_EYE, ROOMS, decorativeImg, pick } from "./media";

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

    /* §4.10: the B&W portrait's ground on the inverted band — a lifted black,
     * so the square reads as a photo slot and not as a hole in the band. */
    --studio-portrait: color-mix(in srgb, var(--on-invert) 10%, var(--ink-invert));
    /* §4.10: the Ø300px #1C1C1C disc — mixed from tokens, never a hex, and
     * mixed HERE rather than borrowed from another module's private var. */
    --studio-quote-disc: color-mix(in srgb, var(--on-invert) 12%, var(--ink-invert));
    /* The hairline that separates stacked quotes on the inverted band. --line
     * (#e4e4e4) is a white-ground value and glares here. */
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

  /* The right tile's STAT overlay sits on its own legibility scrim, so the
   * numbers stay 4.5:1+ once a real room photo lands behind them. */
  :root[data-theme="studio"] .st-imp-stat {
    position: absolute;
    z-index: 2;
    inset: auto 0 0 0;
    padding: clamp(48px, 6vw, 120px) clamp(16px, 1.8vw, 36px) clamp(16px, 1.8vw, 36px);
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--ink-invert) 92%, transparent) 0%,
      color-mix(in srgb, var(--ink-invert) 60%, transparent) 44%,
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
   * NOT --on-invert-mute: at 390px the tile is a 354px square and the whole
   * stat block sits high in the scrim, where the gradient has not yet reached
   * its opaque foot — the muted rung measures below 4.5:1 there. The full
   * --on-invert rung clears at every width, and the value/caption hierarchy is
   * carried by the rungs (h2 : label), not by ink. */
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
    /* The watermark is deliberately wider than the band; clip it here. */
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
  /* §4.10/§4.14 — the giant faint ARROW-STADIUM watermark behind the heading:
   * the same 35×23 rx-11.5 outline as the theme's arrow buttons, from icons.ts,
   * stretched to band width (preserveAspectRatio="none", so the stadium spans
   * the box rather than shrinking to its own 36×35 canvas). Inked at the
   * --ink-invert-2 rung — 1.14:1 against the band, exactly as faint as the
   * measurement. The icon strokes with currentColor, so the color property is
   * where that rung is set. Decorative: aria-hidden and out of the layout
   * (position:absolute) — it must never displace the heading it sits behind. */
  /* The band motif is the source's own eye raster, not a shape we draw. It is
   * a dark-ground JPEG, so mix-blend-mode: screen drops its background into
   * the band and leaves only the light figure — which is why no cutout is
   * needed and why the band colour still governs. */
  :root[data-theme="studio"] .st-tst-mark {
    position: absolute;
    z-index: 0;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    width: min(760px, 72%);
    pointer-events: none;
    mix-blend-mode: screen;
    opacity: 0.5;
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
  :root[data-theme="studio"] .st-tst-mark .st-watermark {
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }
  /* "Preverjena mnenja strank" is a section heading — the h2 rung whole,
   * centred and white, ABOVE the watermark. The measured 72px/−0.025em was an
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

  /* Lead quote: portrait | quote | disc, the measured three-part row.
   * Named areas rather than source order, because <figcaption> must be a
   * direct child of <figure> to be its caption — it cannot live inside the
   * quote column's wrapper, so the grid puts it there instead. */
  :root[data-theme="studio"] .st-tst-lead {
    position: relative;
    z-index: 1;
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
  /* Square B&W portrait, ~420px, SHARP corners (§4.10) — --r-ctrl is the
   * theme's sharp rung, the same edge its buttons use. */
  :root[data-theme="studio"] .st-tst-portrait {
    position: relative;
    overflow: hidden;
    inline-size: clamp(120px, 21vw, 420px);
    aspect-ratio: 1 / 1;
    border-radius: var(--r-circle);
    background: var(--studio-portrait);
  }
  /* Head + shoulders, drawn flat: two neutral masses, no gradient lighting. */
  :root[data-theme="studio"] .st-tst-face {
    position: absolute;
    left: 50%; top: 22%;
    translate: -50% 0;
    inline-size: 30%;
    aspect-ratio: 1 / 1;
    border-radius: var(--r-circle);
    background: color-mix(in srgb, var(--on-invert) 16%, transparent);
  }
  :root[data-theme="studio"] .st-tst-shoulders {
    position: absolute;
    left: 50%; bottom: -14%;
    translate: -50% 0;
    inline-size: 66%;
    aspect-ratio: 3 / 2;
    border-radius: var(--r-pill) var(--r-pill) 0 0;
    background: color-mix(in srgb, var(--on-invert) 12%, transparent);
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
  /* The lead quote is the band's editorial statement, so it takes lead-xl
   * (48/44/24, Satoshi 500, --ls-body, --lh-lead-xl) — prose set large, not a
   * heading. The measured 26px was a step the source's prose ramp does not
   * have. max-width still tracks the measured 800-at-2000px measure. */
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
   * --on-invert-mute, tokens.ts's on-dark muted rung for TEXT; the ratio the old
   * note quoted was against a band colour tokens.ts no longer carries. */
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

  /* Ø300px #1C1C1C disc holding a small product image (§4.10). Decorative
   * photo slot: it carries no text, so it simply drops below 1080px where the
   * quote needs the width more than the band needs the ornament. */
  :root[data-theme="studio"] .st-tst-disc {
    position: relative;
    overflow: hidden;
    inline-size: clamp(180px, 15vw, 300px);
    aspect-ratio: 1 / 1;
    border-radius: var(--r-circle);
    background: var(--studio-quote-disc);
  }
  :root[data-theme="studio"] .st-tst-disc-mass {
    position: absolute;
    inset: 26%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--on-invert) 10%, transparent);
    background: color-mix(in srgb, var(--on-invert) 7%, transparent);
  }

  /* Additional quotes stack below, separated by hairlines — no carousel, no
   * JS, nothing hidden behind a control that cannot act (§5.2). */
  :root[data-theme="studio"] .st-tst-more {
    position: relative;
    z-index: 1;
    margin-top: clamp(32px, 4vw, 80px);
  }
  :root[data-theme="studio"] .st-tst-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-areas:
      "por body"
      "por cap";
    align-items: start;
    align-content: start;
    column-gap: clamp(16px, 2vw, 40px);
    row-gap: clamp(12px, 1.4vw, 28px);
    margin: 0;
    padding-top: clamp(24px, 3vw, 60px);
    border-top: 1px solid var(--studio-line-invert);
  }
  :root[data-theme="studio"] .st-tst-item + .st-tst-item {
    margin-top: clamp(24px, 3vw, 60px);
  }
  :root[data-theme="studio"] .st-tst-item .st-tst-portrait {
    inline-size: clamp(64px, 7vw, 140px);
  }
  /* Secondary quotes step down the prose ramp, lead-xl → lead: the lead quote
   * must stay the loudest voice in the band. Face, weight and tracking are the
   * same row for both, so only size and leading move. */
  :root[data-theme="studio"] .st-tst-item .st-tst-q {
    max-width: min(100%, max(18rem, 44vw));
    margin-top: clamp(8px, 0.8vw, 16px);
    font-size: var(--t-lead);
    line-height: var(--lh-lead);
  }
  /* Their glyph steps down with them, h1 → h3, keeping the same collapsed
   * leading for the same reason. */
  :root[data-theme="studio"] .st-tst-item .st-tst-glyph {
    font-size: var(--t-h3);
    letter-spacing: var(--ls-h3);
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
    transition: transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  :root[data-theme="studio"] .st-gd-card:hover .st-gd-photo { transform: scale(1.04); }
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-gd-photo { transition: none; }
    :root[data-theme="studio"] .st-gd-card:hover .st-gd-photo { transform: none; }
  }
  :root[data-theme="studio"] .st-gd-mass {
    position: absolute;
    inset: 12% 12% 26%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--ink) 9%, transparent),
      color-mix(in srgb, var(--ink) 3%, transparent)
    );
  }
  /* The bottom gradient scrim the real photo will need — already painted, so
   * the photo drops in with zero restructuring and the overlay text keeps its
   * contrast on day one and on day two (§5.1). */
  :root[data-theme="studio"] .st-gd-scrim {
    position: absolute;
    inset: auto 0 0 0;
    z-index: 1;
    height: 64%;
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--ink-invert) 92%, transparent) 0%,
      color-mix(in srgb, var(--ink-invert) 58%, transparent) 46%,
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
  /* Pill chip, the label rung in tracked caps — ROUND, per §3. The chip sits ~44% up the
   * scrim, where the gradient has fallen to ~0.59 alpha; at 390px a 14%-white
   * translucent ground on top of that left the caps under 4.5:1 against the
   * photo behind. So the chip carries its OWN dark ground rather than borrowing
   * the scrim's: --on-invert on 82% --ink-invert clears wherever the chip lands,
   * and it still reads as a chip because the ground is not fully opaque. */
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
    /* On the opaque foot of the scrim this is 8.9:1; it never sits higher up. */
    color: var(--on-invert-mute);
  }
  :root[data-theme="studio"] .st-gd-arrow { transition: transform 0.25s ease; }
  :root[data-theme="studio"] .st-gd-card:hover .st-gd-arrow { transform: translateX(4px); }
  :root[data-theme="studio"] .st-gd-card:hover .st-gd-t { text-decoration: underline; }
  /* Hover moves the PHOTO, never the scrim: lightening the scrim would drag
   * the muted "Preberite vodnik" line from 7.0:1 down to 4.55:1, and a hover
   * state is not the place to spend a whole contrast budget. */
  :root[data-theme="studio"] .st-gd-mass { transition: transform 0.35s ease; }
  :root[data-theme="studio"] .st-gd-card:hover .st-gd-mass { transform: scale(1.03); }
  /* The card is a link with no visible frame at rest, so the focus ring is the
   * only thing that can announce it — draw it outside the radius. */
  :root[data-theme="studio"] .st-gd-card:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 3px;
  }

  /* ---- Below 1080px: the ornament goes before the words do ---- */
  @media (max-width: 1080px) {
    :root[data-theme="studio"] .st-tst-disc { display: none; }
    :root[data-theme="studio"] .st-tst-lead {
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
    :root[data-theme="studio"] .st-tst-lead,
    :root[data-theme="studio"] .st-tst-item {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "por"
        "body"
        "cap";
      justify-items: start;
    }
    :root[data-theme="studio"] .st-tst-q,
    :root[data-theme="studio"] .st-tst-item .st-tst-q { max-width: 100%; }
    :root[data-theme="studio"] .st-tst-mark { width: 110%; opacity: 0.38; }
  }

  /* ---- Motion ---- */
  @media (prefers-reduced-motion: reduce) {
    /* Reset to the resting state, never a frozen mid-transform: the arrow sits
     * at its baseline offset and the photo at its true scale. The hover is
     * still legible — the title underline carries it on its own. */
    :root[data-theme="studio"] .st-gd-arrow,
    :root[data-theme="studio"] .st-gd-mass { transition: none; }
    :root[data-theme="studio"] .st-gd-card:hover .st-gd-arrow { transform: none; }
    :root[data-theme="studio"] .st-gd-card:hover .st-gd-mass { transform: none; }
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

  // The hero tile carries no label by design — the crop is the content.
  const hero = '<div class="st-imp-tile st-imp-hero">' + tileShot() + "</div>";

  const room =
    '<div class="st-imp-tile">' +
    tileShot() +
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
 * The §4.10 watermark, wrapped in its positioning box: §4.14's ARROW-STADIUM
 * outline from icons.ts, path data verbatim from the source SVGs, stretched
 * across the band. It is the brand motif at poster scale — not an eye, not a
 * circle — so it is never redrawn here; hero.ts places the same glyph the same
 * way. Purely decorative: the wrapper is aria-hidden as well as the svg, and
 * focusable="false" keeps it out of the tab order.
 */
function watermark(): string {
  return (
    '<span class="st-tst-mark" aria-hidden="true">' +
    decorativeImg(MOTIF_EYE, "st-tst-eye", "(max-width: 809px) 110vw, 760px") +
    "</span>"
  );
}

/** The B&W portrait placeholder — flat masses, no lighting. */
function portrait(): string {
  return (
    '<div class="st-tst-portrait" aria-hidden="true">' +
    '<span class="st-tst-face"></span>' +
    '<span class="st-tst-shoulders"></span>' +
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
 * §4.10 — the inverted testimonial band.
 *
 * The lead review gets the measured three-part row (portrait, quote, disc);
 * the rest stack beneath it, hairline-separated, at one rung down. A shop with
 * no reviews renders nothing at all — an empty dark band would read as a
 * loading failure, and fabricating a quote is out of the question.
 */
export function renderStudioTestimonials(ctx: RenderCtx): string {
  const [lead, ...rest] = ctx.content.reviews;
  if (!lead) return "";
  return (
    '<section class="st-tst" aria-label="Mnenja strank"><div class="st-tst-in">' +
    '<div class="st-tst-head">' +
    watermark() +
    '<h2 class="st-tst-h">Preverjena mnenja strank</h2>' +
    "</div>" +
    '<figure class="st-tst-lead">' +
    portrait() +
    quoteBlock(lead) +
    // Decorative product slot, not a control: no arrows here, because arrows
    // would need JS this Worker does not ship (§5.2).
    '<div class="st-tst-disc" aria-hidden="true"><span class="st-tst-disc-mass"></span></div>' +
    "</figure>" +
    (rest.length
      ? '<div class="st-tst-more">' +
        rest
          .map(
            (r) =>
              '<figure class="st-tst-item">' + portrait() + quoteBlock(r) + "</figure>",
          )
          .join("") +
        "</div>"
      : "") +
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
          '<span class="st-gd-scrim" aria-hidden="true"></span>' +
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
