/**
 * STUDIO — opening acts (docs/STUDIO-BASELINE.md §4.2, §4.5, §4.6).
 *
 *   §4.2 Hero triptych  — product panel · black offer panel · photo with name + price
 *   §4.5 Wordmark band  — the shop name enormous in white, OCCLUDED by the product
 *   §4.6 Marquee        — dot-separated USP ticker, seamless CSS loop
 *
 * WHAT IS A PHOTOGRAPH HERE AND WHAT IS NOT. media.ts splits its imagery by
 * what a slot CLAIMS, and the triptych straddles that line, so the split is
 * drawn here explicitly:
 *
 *   right panel  — a real SCENE. It is atmosphere; it claims nothing about the
 *                  product, exactly as lifestyle photography does anywhere. It
 *                  carries a "simbolična fotografija" plate for the one reason
 *                  the guide cards do not need one: the scrim below it prints a
 *                  product NAME and PRICE, and a photograph under a price reads
 *                  as the photograph OF that price unless we say otherwise.
 *   left panel   — stays the drawn placeholder. The source bundle's cutouts are
 *                  sofas and dining chairs; these shops sell saunas, plunge tubs
 *                  and billiard tables, so a cutout in a product slot would not
 *                  be atmosphere, it would be the wrong product.
 *
 * All three are full-bleed: they render OUTSIDE `.wrap`, so the page gutter
 * never applies and the panels meet the viewport edges. The gutter is
 * reintroduced inside each band as var(--studio-gutter), declared in tokens.ts.
 *
 * Scale translation applies to SPACE ONLY. Padding and gaps were measured at a
 * 2000px viewport, so each is expressed as clamp(min, measured/20 vw, measured)
 * — the measurement is the MAXIMUM and the RATIOS survive the shrink (48px vs
 * 56px stack gaps). TYPE no longer works that way: the source stylesheet has
 * since been transcribed, so every size, weight, tracking and leading here is a
 * ramp token from tokens.ts, which switches per breakpoint tier rather than
 * interpolating. The one exception is the §4.5 band wordmark, a poster-scale
 * decorative outlier that sits above the ramp and keeps its clamp — flagged as
 * such where it is declared.
 *
 * Token discipline (docs/THEMES.md): colors, radii and faces are var(--…)
 * only, and tokens.ts is the ONLY declaration site — this module re-declares
 * nothing it consumes, because two declarations at equal specificity let load
 * order pick the value for the whole storefront. Likewise the marquee's
 * animation and keyframes belong to effects.ts, which also owns the ticker's
 * pause mechanism; renderStudioMarquee() below emits the markup that mechanism
 * needs. Every selector is scoped :root[data-theme="studio"] because
 * zarja/lednik/salon share the sheet.
 */

import { esc, type RenderCtx } from "../../render/sections";
import { discWatermark } from "./icons";
import { SCENES, decorativeImg, pick } from "./media";
import { productArt } from "./product-art";

export const STUDIO_HERO_CSS = `
  /* ---- §4.1 THE HERO — full-bleed photograph, wordmark, subject ----
   *
   * This is the source's actual first section, and it replaces the offer
   * triptych that stood in this slot. The triptych was a real device from the
   * source, read off correctly — it simply is not the hero; it sits mid-page
   * under the solid bar. Putting it first meant the landing page never showed
   * the thing the source leads with.
   *
   * The composition is four layers, and the ORDER is the whole idea:
   *
   *   1. a photograph, full bleed, edge to edge
   *   2. a veil, because white type over a photograph is not a contrast
   *      argument you can win by hoping
   *   3. the wordmark, set enormous
   *   4. the subject, painted OVER the wordmark
   *
   * The occlusion in (4) is the device. The name is never dimmed to fake
   * depth — the product simply stands in front of it, which is why the
   * wordmark may not be given a lower opacity to "help" the subject read.
   */
  :root[data-theme="studio"] .st-hero {
    position: relative;
    isolation: isolate;
    overflow: clip;
    /* The bar floats over this section (see chrome.ts), so the hero owns the
     * whole viewport rather than the viewport minus the bar. */
    min-height: 100vh;
    min-height: 100svh;
    display: grid;
    background: var(--tile-mid);
  }
  /* The photograph. Absolute, so it contributes no layout and CLS stays at
   * zero however slowly it arrives; the section's height comes from the
   * viewport, not from the file. */
  :root[data-theme="studio"] .st-hero-bg {
    position: absolute; inset: 0; z-index: 0;
    inline-size: 100%; block-size: 100%;
    object-fit: cover;
  }
  /* The veil — THREE bands, not one ramp, and the reason is measurement.
   *
   * A single top-to-bottom ramp cannot be both dark enough for white type and
   * light enough to leave the photograph worth showing: sampled against the
   * real render, the nav came out at 3.2:1, the annotation at 1.8:1 and the
   * h1 at 2.7:1 — all of them under the 4.5:1 floor, all of them looking
   * perfectly fine to the eye.
   *
   * The source fails the same way; its own "Luxe Sofa" is white on a pale
   * floor. We do not get to copy that: EU 2019/882 has applied to e-commerce
   * since June 2025 and the floor is a floor. So the composition is the
   * source's and the legibility is ours — the two bands sit exactly where
   * type lands and the middle stays open, which is where the room is the
   * point.
   *
   * The measurement is on the BRIGHTEST pixel under each text run, not the
   * average: a thin white stroke fails on the one bright pixel it crosses. */
  :root[data-theme="studio"] .st-hero-veil {
    position: absolute; inset: 0; z-index: 1;
    background:
      /* the bar */
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--ink) 72%, transparent) 0%,
        color-mix(in srgb, var(--ink) 46%, transparent) 9%,
        transparent 22%
      ),
      /* the foot block. It has to hold its darkness well ABOVE the words: the
       * pill sits at 58% of the viewport and the heading runs to 76%, and a
       * band that has already faded by 42% leaves both of them at ~3:1. */
      linear-gradient(
        0deg,
        color-mix(in srgb, var(--ink) 88%, transparent) 0%,
        color-mix(in srgb, var(--ink) 82%, transparent) 26%,
        color-mix(in srgb, var(--ink) 62%, transparent) 42%,
        color-mix(in srgb, var(--ink) 28%, transparent) 54%,
        transparent 64%
      ),
      /* an even wash, so the wordmark has something to be white against */
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--ink) 12%, transparent),
        color-mix(in srgb, var(--ink) 12%, transparent)
      );
  }

  /* The wordmark, fit to the container's width.
   *
   * SVG rather than a font-size in vw, because "fit the text to this box" is
   * exactly what textLength does and nothing else does it without measuring.
   * A vw-based size would fit one shop's name and clip or strand every other:
   * these run from "Ledena Kad" to "Prostostoječa Kad", and a size that suits
   * ten characters leaves nineteen hanging off the screen.
   *
   * lengthAdjust="spacing" and not "spacingAndGlyphs": spacing absorbs the
   * difference in the TRACKING, which is what a designer would do to a
   * wordmark. spacingAndGlyphs would stretch the letterforms themselves, and
   * a stretched typeface is the single most obvious way to make a brand look
   * cheap. */
  :root[data-theme="studio"] .st-hero-mark {
    position: absolute; z-index: 2;
    inset-block-start: clamp(84px, 13vh, 190px);
    inset-inline: 0;
    margin: 0;
    padding-inline: var(--studio-gutter);
    display: flex;
    justify-content: center;
    pointer-events: none;
  }
  :root[data-theme="studio"] .st-hero-mark svg {
    inline-size: 100%;
    max-inline-size: var(--studio-container);
    block-size: auto;
    display: block;
  }
  :root[data-theme="studio"] .st-hero-mark text {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    fill: var(--on-invert);
  }

  /* The subject, in front of the wordmark. */
  :root[data-theme="studio"] .st-hero-subject {
    position: absolute; z-index: 3;
    inset-block-end: 25%;
    inset-inline-start: 61%;
    transform: translateX(-50%);
    inline-size: min(41%, 580px);
    aspect-ratio: 4 / 3;
    color: var(--on-invert);
  }
  /* The subject needs a ground of its own.
   *
   * In the source this layer is a photograph: it has mass, so it occludes the
   * wordmark simply by being opaque. Ours is a LINE drawing in the same white
   * as the letters, and drawn straight over them the two dissolve into each
   * other — legible as neither. So the subject brings its own soft darkening
   * with it, which is the occlusion the composition depends on, done the only
   * way an outline can do it. */
  :root[data-theme="studio"] .st-hero-subject::before {
    content: "";
    position: absolute;
    inset: -10% -8%;
    z-index: -1;
    border-radius: var(--r-circle);
    background: radial-gradient(
      54% 54% at 50% 54%,
      color-mix(in srgb, var(--ink) 54%, transparent) 0%,
      color-mix(in srgb, var(--ink) 30%, transparent) 56%,
      transparent 76%
    );
  }
  :root[data-theme="studio"] .st-hero-subject .st-art {
    position: relative;
    inline-size: 100%; block-size: 100%;
  }

  /* The annotation and its leader line.
   *
   * The line is ONE element with two borders and a rounded corner — the same
   * construction the source uses — rather than two elements pretending to be
   * a corner. A dot at each end: one against the words, one where the line
   * arrives at the product. */
  :root[data-theme="studio"] .st-hero-note {
    position: absolute; z-index: 4;
    inset-block-end: 47%;
    inset-inline-end: 58%;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: var(--on-invert);
    pointer-events: none;
  }
  :root[data-theme="studio"] .st-hero-note::before {
    content: "";
    position: absolute;
    inset: -95% -34% -105% -26%;
    z-index: -1;
    border-radius: var(--r-circle);
    background: radial-gradient(
      52% 52% at 50% 50%,
      color-mix(in srgb, var(--ink) 84%, transparent) 0%,
      color-mix(in srgb, var(--ink) 66%, transparent) 54%,
      color-mix(in srgb, var(--ink) 24%, transparent) 76%,
      transparent 88%
    );
  }
  :root[data-theme="studio"] .st-hero-note p {
    margin: 0;
    max-inline-size: 19ch;
    text-align: right;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
  }
  :root[data-theme="studio"] .st-hero-dot {
    flex: 0 0 auto;
    inline-size: 5px; block-size: 5px;
    margin-block-start: 0.55em;
    border-radius: var(--r-circle);
    background: var(--on-invert);
  }
  :root[data-theme="studio"] .st-hero-lead {
    position: relative;
    flex: 0 0 auto;
    inline-size: clamp(52px, 7vw, 116px);
    block-size: clamp(34px, 5vh, 62px);
    margin-block-start: 0.55em;
    border-block-start: var(--bw-line) solid var(--on-invert);
    border-inline-end: var(--bw-line) solid var(--on-invert);
    border-start-end-radius: 8px;
  }
  :root[data-theme="studio"] .st-hero-lead::after {
    content: "";
    position: absolute;
    inset-block-end: -3px; inset-inline-end: -3px;
    inline-size: 6px; block-size: 6px;
    border-radius: var(--r-circle);
    background: var(--on-invert);
  }

  /* The foot block: pill, heading, one button. */
  :root[data-theme="studio"] .st-hero-foot {
    position: relative; z-index: 4;
    align-self: end;
    inline-size: 100%;
    max-inline-size: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding: 0 var(--studio-gutter) clamp(34px, 6vh, 76px);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: clamp(14px, 1.6vw, 24px);
    color: var(--on-invert);
  }
  /* The source's badge, with one measured change: its wash is 8% WHITE, and a
   * white wash under white type is the wrong direction. With the blur pulling
   * in the bright wall behind it, the label came out at 3.0:1. The hairline,
   * the radius and the blur are the source's; the wash is inverted to a dark
   * one, which is the same glass effect and the only version that clears the
   * floor. */
  :root[data-theme="studio"] .st-hero-pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 14px;
    border: var(--bw-line) solid color-mix(in srgb, var(--on-invert) 32%, transparent);
    border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--ink) 62%, transparent);
    backdrop-filter: blur(6px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-hero-foot h1 {
    margin: 0;
    max-inline-size: 16ch;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h3);
    letter-spacing: var(--ls-h3);
    line-height: var(--lh-h3);
    color: var(--on-invert);
  }
  /* The source has no paragraph here at all — pill, title, button. Ours keeps
   * one because it is the only place on the page those specifics appear, and
   * dropping page copy to match a layout is a bad trade on a site whose whole
   * strategy is the search result. It is held to a narrow measure so the block
   * stays the source's proportion rather than becoming a text column. */
  :root[data-theme="studio"] .st-hero-sub {
    margin: 0;
    max-inline-size: 38ch;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-hero-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: var(--st-tap, 44px);
    padding: 12px 30px;
    border: var(--bw-line) solid var(--on-invert);
    border-radius: var(--r-ctrl);
    background: var(--on-invert);
    color: var(--ink);
    text-decoration: none;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    transition: background-color .2s ease, color .2s ease;
  }
  :root[data-theme="studio"] .st-hero-cta:hover {
    background: transparent;
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-hero-cta:focus-visible {
    outline: 2px solid var(--on-invert);
    outline-offset: 3px;
  }

  :root[data-theme="studio"] .st-hero-cap {
    position: absolute; z-index: 4;
    inset-block-end: clamp(14px, 2vh, 24px);
    inset-inline-end: var(--studio-gutter);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: color-mix(in srgb, var(--on-invert) 72%, transparent);
  }

  /* Below 900px the annotation goes first: at 390px the leader line has
   * nowhere to travel and the words sit on top of the product. The subject
   * shrinks and drops, and the wordmark rides higher so the foot block keeps
   * its own air. */
  @media (max-width: 900px) {
    :root[data-theme="studio"] .st-hero-note { display: none; }
    /* The foot block is much taller here — the heading wraps to two lines and
     * the paragraph to four — so it reaches well above where the subject sits
     * on a wide screen. Measured at 390x844 it occupies the bottom ~45%, and
     * the drawing was landing across the pill and the heading. It goes above
     * that, and smaller, so the two share the screen instead of the picture
     * winning. */
    :root[data-theme="studio"] .st-hero-subject {
      inline-size: min(66%, 330px);
      inset-block-end: 50%;
      inset-inline-start: 52%;
      transform: translateX(-50%);
    }
    :root[data-theme="studio"] .st-hero-sub { max-inline-size: 34ch; }
    :root[data-theme="studio"] .st-hero-mark { inset-block-start: clamp(92px, 15vh, 150px); }
    :root[data-theme="studio"] .st-hero-foot h1 { font-size: var(--t-h3); letter-spacing: var(--ls-h3); line-height: var(--lh-h3); }
  }
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-hero-cta { transition: none; }
  }

  /* ---- The only values this module declares ----------------------------
   * tokens.ts is the single declaration site: --studio-gutter, --tile-mid,
   * --bg-alt and --on-invert-mute live there and are consumed here as
   * var(--…) with no fallback — a fallback would silently resurrect the
   * duplicate this file used to carry. What remains below is the one measure
   * tokens.ts does not carry: the hero stack's two internal rhythms. */
  :root[data-theme="studio"] {
    /* §4.2: pill→statement 48px, sub→button 56px. Kept as variables so the
     * 48:56 ratio is edited in one place and never drifts. */
    --studio-gap-stack: clamp(20px, 2.4vw, 48px);
    --studio-gap-cta: clamp(24px, 2.8vw, 56px);
    /* The drawn placeholder inks itself in this, so one set of markup works on
     * a light or a dark ground. The default is the light case — the hero's
     * left panel and the §4.5 band object both stand on --bg-alt. */
    --photo-ink: var(--ink);
  }
  /* Buttons are SHARP (--r-ctrl, §3). White on black: --bg is the fill. */
  :root[data-theme="studio"] .st-btn-light {
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--bg); color: var(--ink);
    border: 1px solid var(--bg);
    border-radius: var(--r-ctrl);
    padding: clamp(14px, 1.1vw, 22px) clamp(26px, 3vw, 60px);
    text-decoration: none;
    /* Button label — the label role, whole row, tight leading for the one
     * centred line inside the control's own padding. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    transition: background-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-btn-light:hover {
    background: color-mix(in srgb, var(--bg) 84%, var(--ink));
  }
  /* The page focus ring is --acc; on an inverted band white outlines louder. */
  :root[data-theme="studio"] .st-btn-light:focus-visible {
    outline: 2px solid var(--bg);
    outline-offset: 3px;
  }

  /* Photo-ready slot: flat neutral mass + contact shadow on the panel ground.
   * Studio's grounds are white/grey, so the placeholder stays flatter than
   * zarja's lit scenes — a real photo drops in with zero restructuring. */
  :root[data-theme="studio"] .st-photo {
    position: absolute; inset: 0; z-index: 1;
  }
  /* Ink strong enough to actually read. The mass this replaces was 12% and
   * vanished into the panel; the drawing sits below body ink so it still says
   * "illustration", not "photograph". */
  :root[data-theme="studio"] .st-photo-art {
    position: absolute;
    inset: 12% 10% 18%;
    display: grid;
    place-items: center;
    color: color-mix(in srgb, var(--photo-ink) 58%, transparent);
  }
  :root[data-theme="studio"] .st-photo-art .st-art {
    inline-size: 100%;
    block-size: 100%;
  }
  :root[data-theme="studio"] .st-photo-mass {
    position: absolute;
    left: 17%; right: 17%; top: 28%; bottom: 17%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--photo-ink) 12%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--photo-ink) 10%, transparent),
      color-mix(in srgb, var(--photo-ink) 4%, transparent)
    );
  }
  :root[data-theme="studio"] .st-photo-floor {
    position: absolute;
    left: 50%; bottom: 12%; transform: translateX(-50%);
    width: 62%; height: 7%;
    border-radius: var(--r-pill);
    background: radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--photo-ink) 20%, transparent), transparent 72%);
  }
  /* The disclosure plate. It used to be bare type inked by a variable, which
   * worked while it sat on a flat panel grey; it now sits on a PHOTOGRAPH
   * whose tones we do not control, and no ink clears 4.5:1 against "whatever
   * pixel is under it". So the plate is opaque --ink-invert with --on-invert
   * on it (18.3:1) and the photo never enters the calculation. The theme's
   * glass badge would have matched the source's chrome, but it is an 8% white
   * fill — a white alpha, i.e. dividers only, never a ground for text.
   *
   * ROUND, because it is a chip and not a button (§3), and capped so a wrapped
   * two-line plate stays inside its panel instead of running past the gutter. */
  :root[data-theme="studio"] .st-photo-cap {
    position: absolute; z-index: 2;
    top: var(--studio-gutter); left: var(--studio-gutter);
    max-width: calc(100% - 2 * var(--studio-gutter));
    padding: clamp(6px, 0.5vw, 10px) clamp(12px, 1.1vw, 20px);
    border-radius: var(--r-pill);
    background: var(--ink-invert);
    /* A caption — the label role, whole row, uppercase. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert);
  }

  /* ---- §4.5 Wordmark band ---- */
  /* The z-layering IS the device: the brand name sits BEHIND the product,
   * which occludes its middle letters. isolation:isolate gives the band its
   * own stacking context so the order is local and cannot be reshuffled by
   * whatever the page puts above or below it. Nothing here is faded —
   * occlusion is geometry, not opacity.
   *
   * WHAT THE PLACEHOLDER CAN AND CANNOT DO. The layering is exactly the
   * source's: the letters pass behind an opaque object. What the source has
   * and we do not is a CUTOUT — a sofa with no frame, whose silhouette is the
   * occluding edge. Ours is a rectangular photo slot, so the letters disappear
   * behind a rectangle rather than behind a shape. That is a property of the
   * art, not of the layering, and it resolves the day a shop's own cutout
   * lands in .st-band-object: no rule below changes. Substituting the source
   * bundle's furniture cutouts would fix the silhouette by putting a dining
   * chair in front of a sauna shop's name, which is the trade this theme
   * refuses everywhere else (see media.ts). */
  :root[data-theme="studio"] .st-band {
    position: relative;
    isolation: isolate;
    overflow: clip;
    display: flex; flex-direction: column; justify-content: flex-end;
    min-height: clamp(440px, 64vh, 780px);
    padding: clamp(56px, 6vw, 120px) var(--studio-gutter) clamp(32px, 4vw, 72px);
    background: var(--ink-invert);
  }
  /* The full-bleed photo slot. Dark by design: the band's job is enormous
   * WHITE type, so the ground under it must be the inverted one. */
  :root[data-theme="studio"] .st-band-photo {
    position: absolute; inset: 0; z-index: 0;
    background:
      radial-gradient(70% 70% at 22% 106%, color-mix(in srgb, var(--on-invert) 12%, transparent), transparent 72%),
      radial-gradient(58% 60% at 78% 12%, color-mix(in srgb, var(--on-invert) 8%, transparent), transparent 68%),
      linear-gradient(158deg, var(--ink-invert-2), var(--ink-invert));
  }
  /* DECORATIVE OUTLIER — the one size in this module that is not a ramp token.
   * The band's whole device is a wordmark ~200px tall spanning nearly the full
   * width at 2000px, which is more than twice the h1 rung; no role in the ramp
   * describes it, and pinning it to --t-h1 would collapse the occlusion effect.
   * So the size stays a clamp: the vw term is what keeps a long shop name
   * inside a 390px viewport, and the band's overflow:clip is the second belt so
   * the PAGE can never scroll sideways. Tracking and leading are NOT invented
   * with it — they come from the h1 row, which is the nearest role, and the
   * measured pass's −0.03em is gone: the source never tracks display negative. */
  :root[data-theme="studio"] .st-band-word {
    position: relative; z-index: 1;
    margin: 0 0 clamp(28px, 3.6vw, 72px);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: clamp(2.75rem, 12vw, 15rem);
    letter-spacing: var(--ls-h1);
    line-height: var(--lh-h1);
    text-transform: uppercase;
    color: var(--on-invert);
    max-width: 100%;
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The product that occludes the wordmark. Opaque on purpose: the device is
   * geometry, so nothing here is faded to fake depth.
   *
   * IT IS ANCHORED TO THE WORD, not to the band. That is the whole fix in this
   * rule. It used to hang a fixed distance off the band's floor and rely on
   * arithmetic — band height minus padding minus the foot minus the wordmark's
   * margin — to land across the letters. The arithmetic held on desktop and
   * broke on a phone, where the foot cluster grows to three rows (chip, a
   * wrapped product name, a full-width CTA) and its top edge climbed ABOVE the
   * object's bottom edge. The foot paints at z-index 3, so what shipped was
   * white chip type sitting on the light-grey object at about 1.1:1.
   *
   * As a child of .st-band-word the containing block IS the wordmark's box, so
   * bottom:0 puts the object's floor exactly on the word's and it cannot reach
   * into the margin below, let alone into the foot — at any breakpoint, for any
   * length of shop name or product title. The word's own z-index:1 makes it a
   * stacking context, and a positioned child at z-index 2 paints above its
   * parent's inline text: the letters pass behind the object. That is the
   * occlusion, and it is now structural rather than arithmetic. */
  :root[data-theme="studio"] .st-band-object {
    /* No display:block needed for the <span> — absolute positioning blockifies
     * it, and a dead declaration in a sheet this size is still a dead one. */
    position: absolute; z-index: 2;
    left: 50%; transform: translateX(-50%);
    bottom: 0;
    width: clamp(200px, 40vw, 760px);
    aspect-ratio: 4 / 3;
    border-radius: var(--r-media);
    background: var(--bg-alt);
  }
  /* Inside the band object the mass is the product itself, not a subject on a
   * backdrop, so it sits tighter to the frame than in a hero panel. */
  :root[data-theme="studio"] .st-band-object .st-photo-mass {
    inset: 13% 11%;
  }
  /* Thin callout line + dot, running from the product out to a short label. */
  :root[data-theme="studio"] .st-band-callout {
    position: absolute; z-index: 3;
    top: clamp(48px, 15vh, 168px);
    right: var(--studio-gutter);
    display: flex; align-items: center;
    max-width: min(28vw, 300px);
  }
  :root[data-theme="studio"] .st-band-dot {
    flex: none;
    width: 9px; height: 9px;
    border-radius: var(--r-circle);
    background: var(--on-invert);
  }
  :root[data-theme="studio"] .st-band-line {
    flex: none;
    width: clamp(28px, 5vw, 100px); height: 1px;
    background: color-mix(in srgb, var(--on-invert) 72%, transparent);
  }
  /* The callout's short annotation — a caption, so the label role, whole row.
   * Left in sentence case: the label rung is a role, not a mandate to
   * uppercase, and this one is a trust claim rather than chrome. */
  :root[data-theme="studio"] .st-band-note {
    padding-left: clamp(10px, 0.9vw, 18px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert);
  }
  /* §4.5's bottom-left cluster: chip, product name and CTA are ONE group,
   * reading left to right off the gutter. Nothing pushes the CTA to the far
   * edge — on a full-bleed band that separates it from the name it belongs to. */
  :root[data-theme="studio"] .st-band-foot {
    position: relative; z-index: 3;
    display: flex; align-items: center; flex-wrap: wrap;
    gap: clamp(14px, 1.6vw, 32px);
  }
  /* Chips are ROUND; the CTA beside them stays SHARP. */
  :root[data-theme="studio"] .st-band-chip {
    border: 1px solid color-mix(in srgb, var(--on-invert) 40%, transparent);
    border-radius: var(--r-pill);
    padding: clamp(7px, 0.55vw, 11px) clamp(14px, 1.3vw, 26px);
    /* Same eyebrow-chip role as the hero pill: the label row, uppercase. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert);
  }
  /* The band's product name — the same large-card rung as .st-hero-name (h5),
   * so the two places a model name appears stay one rung. The measured pass had
   * an h2 tracking on a non-h2 size here; size, tracking and leading now all
   * come from the h5 row. */
  :root[data-theme="studio"] .st-band-title {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--on-invert);
    /* A long model name must fold inside the cluster, never widen the band. */
    overflow-wrap: break-word;
  }

  /* ---- §4.6 Marquee ----
   * The track, its keyframes and the pause mechanism (.st-mq-pause checkbox +
   * .st-mq-toggle label) all live in effects.ts — this module only lays the
   * band out and inks its type. Re-declaring the animation here is what made
   * load order decide the ticker's duration, so nothing below touches it. */
  :root[data-theme="studio"] .st-mq {
    background: var(--bg);
    border-block: 1px solid var(--line);
    padding: clamp(14px, 1.2vw, 24px) 0;
    /* The pause control sits on the gutter, the ticker runs off the right
     * edge — a full-bleed band that still carries a reachable control. */
    display: flex; align-items: center;
    gap: clamp(12px, 1.2vw, 24px);
    padding-inline: var(--studio-gutter) 0;
    /* The pause checkbox is position:absolute (effects.ts hides it visually
     * while keeping it focusable). Without a positioned ancestor it resolves
     * against whatever ancestor happens to be positioned — the initial
     * containing block on this page — so focusing it by keyboard scrolled the
     * document to a control that is nowhere near the band it operates. */
    position: relative;
  }
  /* effects.ts owns how the pause control LOOKS; this is the band's layout
   * claim on it, and the only reason it is stated here is that a 14px label
   * with 5px of padding is a 30px target. WCAG 2.5.8 would pass that, but the
   * project's floor is 44px and every other control in the theme meets it
   * (commerce.ts pads its 36×35 arrow glyph out the same way). Scoped through
   * .st-mq so it outranks effects.ts by specificity rather than by sheet
   * order — the whole reason tokens.ts is a single declaration site. */
  :root[data-theme="studio"] .st-mq .st-mq-toggle {
    display: inline-flex;
    align-items: center;
    min-block-size: 44px;
  }
  :root[data-theme="studio"] .st-mq-viewport {
    flex: 1 1 auto; min-width: 0;
    overflow: hidden;
  }
  :root[data-theme="studio"] .st-mq-group,
  :root[data-theme="studio"] .st-mq-set { display: flex; align-items: center; }
  /* A marquee CAN be the module's decorative outlier — one run at poster scale
   * would sit above the ramp the way the band wordmark does. This one does not:
   * it is a row of uppercase USP claims at reading size, i.e. ordinary UI text
   * in the label role, and the label row fits it exactly. So it takes the token
   * rather than keeping the measured clamp. */
  :root[data-theme="studio"] .st-mq-item,
  :root[data-theme="studio"] .st-mq-sep {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-mq-sep {
    color: var(--ink-mute);
    padding: 0 clamp(18px, 2.2vw, 44px);
  }

  /* ---- Below 900px: the message leads, ONE photo supports it ---- */
  @media (max-width: 900px) {

    :root[data-theme="studio"] .st-band { min-height: clamp(380px, 72vh, 620px); }
    :root[data-theme="studio"] .st-band-callout { display: none; }
    /* No phone override for .st-band-object any more. It used to need one
     * because it hung off the band's floor and the floor moved; anchored to the
     * wordmark it tracks the wordmark, which is where it is supposed to be. */
  }
  

  /* ---- Motion ----
   * effects.ts owns the reduced-motion reset for the ticker itself: the track
   * stops, drops to width:100% and turns on flex-wrap, and the clone half is
   * hidden. Four consequences are this module's to handle.
   *
   * 1. flex-wrap on the TRACK wraps the track's own children, and the track's
   *    children are two group boxes — each of which is itself a nowrap flex
   *    row holding every claim. So the wrap had nothing to wrap: the surviving
   *    group overflowed the band and .st-mq's overflow:hidden cut the claims
   *    past the fold clean off, with no scroll and no ticker to bring them
   *    back. Reduced motion was losing content. The wrap has to run all the
   *    way down to the row that actually holds the items.
   * 2. The duplicate sets exist only to make the running loop wider than the
   *    widest viewport (see marqueeRepeats). Standing still they would print
   *    the same four claims three times over, so they go.
   * 3. Each set ends with a separator because the loop needs one between its
   *    last claim and the first of the next pass. Standing still that is a dot
   *    hanging off the end of the list.
   * 4. The pause control now toggles an animation that no longer runs — a
   *    control that does nothing, so it goes. */
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-mq-viewport { padding-inline-end: var(--studio-gutter); }
    :root[data-theme="studio"] .st-mq-group,
    :root[data-theme="studio"] .st-mq-set {
      flex-wrap: wrap;
      min-width: 0;
      row-gap: var(--gap-sm);
    }
    :root[data-theme="studio"] .st-mq-set--dup { display: none; }
    :root[data-theme="studio"] .st-mq-set .st-mq-sep:last-child { display: none; }
    :root[data-theme="studio"] .st-mq-pause,
    :root[data-theme="studio"] .st-mq-toggle { display: none; }
    :root[data-theme="studio"] .st-btn-light { transition: none; }
  }
`;

/**
 * The drawn product slot — bordered mass standing on a contact shadow, no
 * image request. This is what a PRODUCT slot gets until the shop's own
 * photography exists; see the header for why a furniture cutout is not an
 * acceptable stand-in for a sauna.
 */
function photoSlot(ctx: RenderCtx): string {
  // The shop's product drawing, for the same reason commerce.ts carries one:
  // this panel was a bordered rectangle at low opacity, which screenshotting
  // showed to be an empty grey box sitting where the product should be. A
  // shop with no drawing keeps the neutral mass rather than borrowing another
  // shop's goods.
  const art = productArt(ctx.shop.key);
  return (
    '<div class="st-photo" aria-hidden="true">' +
    (art ? '<span class="st-photo-art">' + art + "</span>" : '<span class="st-photo-mass"></span>') +
    '<span class="st-photo-floor"></span>' +
    "</div>"
  );
}

/**
 * The one image on this page that is already in the viewport when the document
 * arrives, and therefore the page's LCP candidate.
 *
 * decorativeImg marks every picture `loading="lazy"`, which is right for the
 * cards it was written for and wrong here: a lazy image is not fetched until
 * layout has run and proved it visible, so the hero photo starts late by
 * exactly that wait. media.ts is not ours to branch — one image helper, one
 * contract — so the hint is rewritten at the single call site that needs it.
 *
 * The replace is exact and non-fatal: if media.ts ever stops emitting that
 * attribute the markup passes through unchanged and we are back to the
 * default, never to a broken tag.
 */
function eager(img: string): string {
  return img.replace(' loading="lazy"', ' loading="eager" fetchpriority="high"');
}

function pdpHref(ctx: RenderCtx): string {
  return ctx.shop.routeSlugs["/product"] + "/" + ctx.pdp.slug + ctx.q;
}

/**
 * §4.14's arrow-stadium watermark, wrapped in its positioning box. Decorative
 * only, so the wrapper is aria-hidden as well as the svg: no assistive
 * technology should meet the brand motif twice.
 */
function watermark(): string {
  return '<span class="st-hero-wm" aria-hidden="true">' + discWatermark() + "</span>";
}

/**
 * The struck compare-at of §4.2's price overlay.
 *
 * PdpContent does not (yet) carry a compare-at field, and deriving one from
 * `price` would print a fabricated discount over a real product. Read
 * structurally, exactly as commerce.ts and pdp.ts do, so adding
 * `compareAt?: string` to the interface needs no change here.
 */
function compareAt(d: RenderCtx["content"]["pdp"]): string | null {
  const v: unknown = (d as { compareAt?: unknown }).compareAt;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * §4.2 — hero triptych. Carries the page's single h1; the wordmark band and
 * marquee below deliberately use non-heading elements so this stays the only
 * one on the page.
 */
/**
 * The wordmark as a self-scaling SVG. See the note at its call site for why
 * the box is measured from the string.
 */
function markSvg(mark: string): string {
  const chars = [...mark];
  const spaces = chars.filter((ch) => ch === " ").length;
  const w = Math.round((chars.length - spaces) * 0.66 * 290 + spaces * 0.26 * 290);
  return (
    '<p class="st-hero-mark" aria-hidden="true">' +
    '<svg viewBox="0 0 ' + w + ' 340" role="presentation" focusable="false">' +
    '<text x="' + Math.round(w / 2) + '" y="268" text-anchor="middle" font-size="290" ' +
    'textLength="' + w + '" lengthAdjust="spacing">' + esc(mark) + "</text>" +
    "</svg></p>"
  );
}

/**
 * §4.1 — the hero.
 *
 * Four layers: photograph, veil, wordmark, subject. What makes it the source's
 * hero rather than a picture with words on it is that the subject is painted
 * OVER the wordmark, so the name reads as something the product is standing in
 * front of.
 *
 * THREE DELIBERATE DEPARTURES, all of them things that would be wrong to copy:
 *
 * 1. The h1 is the keyword sentence, not the wordmark. In the source the
 *    wordmark IS the h1, which is right for a brand-led store. These are
 *    single-keyword shops whose entire strategy is that one page ranks for one
 *    term (docs/SEO.md), and the shop name is already in the header, the
 *    footer and the title. So the wordmark is decorative and aria-hidden, and
 *    the h1 stays the sentence a search result should show.
 *
 * 2. The subject is the shop's DRAWING, not a cutout photograph. The source
 *    puts a sofa here, from an asset bundle we have — of furniture. A cutout
 *    of a dining chair standing where a customer expects the sauna they are
 *    about to buy is not a placeholder, it is a claim about the goods
 *    (media.ts, and the launch gate that enforces it).
 *
 * 3. The photograph carries "simbolična fotografija". It is a room from the
 *    same furniture bundle: fine as atmosphere, and labelled so it cannot be
 *    read as the product.
 */
export function renderStudioHero(ctx: RenderCtx): string {
  const c = ctx.content;
  const art = productArt(ctx.shop.key);
  // Uppercase through the shop's own locale: Slovenian casing is not the
  // default one, and a wordmark is the last place to get a letter wrong.
  const mark = ctx.shop.wordmark.join(" ").toLocaleUpperCase(ctx.shop.locale.intl);

  return (
    '<section class="st-hero">' +
    // The LCP element. Eager and high priority: it is the largest thing on the
    // page and the one the score is measured against, so a lazy hint here
    // would be actively wrong.
    eager(
      decorativeImg(pick(SCENES, ctx.shop.key), "st-hero-bg", "100vw"),
    ) +
    '<span class="st-hero-veil" aria-hidden="true"></span>' +

    // Fit-to-width wordmark.
    //
    // The viewBox width is ESTIMATED from the string rather than fixed, and
    // that is the whole trick. A fixed width with textLength forced every
    // shop's name into the same box: "MASAŽNI BAZEN" is naturally about
    // 2.4× a 1000-unit box at this size, so the tracking went hugely negative
    // and the two words printed on top of each other. Estimating first means
    // textLength only has a few percent of error to absorb, which is what
    // spacing adjustment is for.
    //
    // Caps in a grotesque average ~0.66em of advance; a word space is ~0.26em.
    // The estimate does not need to be right, only close — the SVG scales to
    // its container, so only the RATIO matters.
    //
    // 340 tall against a 290 size because Š and Ž reach well above cap height
    // and a box drawn to Latin caps clips their carons.
    markSvg(mark) +

    (art ? '<div class="st-hero-subject" aria-hidden="true">' + art + "</div>" : "") +

    // The annotation points at the subject. Its words are the shop's own first
    // trust line rather than invented copy.
    '<div class="st-hero-note" aria-hidden="true">' +
    "<p>" + esc(c.trust[0] ?? "") + "</p>" +
    '<span class="st-hero-dot"></span>' +
    '<span class="st-hero-lead"></span>' +
    "</div>" +

    '<div class="st-hero-foot">' +
    '<span class="st-hero-pill">' + esc(c.kicker) + "</span>" +
    "<h1>" + esc(c.h1) + "</h1>" +
    '<p class="st-hero-sub">' + esc(c.sub) + "</p>" +
    '<a class="st-hero-cta" href="#izbor">' + esc(c.cta) + "</a>" +
    "</div>" +
    // Bottom-right, out of the reading path but on the same frame as the
    // photograph it qualifies.
    '<span class="st-hero-cap">simbolična fotografija</span>' +
    "</section>"
  );
}

/**
 * §4.5 — wordmark band. The shop name is set enormous in white and the
 * product placeholder is painted OVER it; the occlusion is the device, so the
 * name is never dimmed to fake depth. The name is a <p>, not a heading: the
 * hero owns the page's only h1.
 */
export function renderStudioWordmarkBand(ctx: RenderCtx): string {
  const d = ctx.pdp;
  // The callout label is content, not chrome — the shop's first trust claim.
  // noUncheckedIndexedAccess: a shop may ship an empty trust list.
  const note = ctx.content.trust[0];
  return (
    '<section class="st-band" aria-label="' + esc(ctx.shop.name) + " — " + esc(d.title) + '">' +
    '<div class="st-band-photo" aria-hidden="true"></div>' +
    // The object lives INSIDE the wordmark so it is positioned against the
    // letters rather than against the band's floor — see .st-band-object for
    // what that fixes. A <span>, not a <div>: a div inside a <p> does not
    // parse as a child, the parser closes the paragraph and the containing
    // block silently becomes the band again. Empty and aria-hidden, so the
    // paragraph still announces nothing but the shop name.
    '<p class="st-band-word">' + esc(ctx.shop.name) +
    '<span class="st-band-object" aria-hidden="true">' +
    '<span class="st-photo-mass"></span></span></p>' +
    (note
      ? '<p class="st-band-callout">' +
        '<span class="st-band-dot" aria-hidden="true"></span>' +
        '<span class="st-band-line" aria-hidden="true"></span>' +
        '<span class="st-band-note">' + esc(note) + "</span></p>"
      : "") +
    '<div class="st-band-foot">' +
    '<span class="st-band-chip">' + esc(d.eyebrow) + "</span>" +
    '<span class="st-band-title">' + esc(d.title) + "</span>" +
    '<a class="st-btn-light" href="' + esc(pdpHref(ctx)) + '">Oglejte si model</a>' +
    "</div></section>"
  );
}

/**
 * How wide ONE half of the ticker track has to be, in CSS pixels, before the
 * loop can be called seamless.
 *
 * The loop works by translating a doubled track exactly −50%, which lands the
 * clone where the original began. That is the seam everyone checks, and it was
 * fine. The seam nobody checks is the OTHER one: at −50% the viewport shows
 * the track from one half-width to one half-width plus the viewport. If a half
 * is narrower than the viewport, the end of the track arrives before the
 * cycle does and the band runs empty for the difference. With four claims the
 * half measured about 1.6k, so every desktop wider than roughly 1800px was
 * watching the ticker drain and jump — a seam, just not at the join.
 *
 * 2600 covers a 2560px display with its gutter, its pause control and room to
 * spare, and the estimate below is deliberately pessimistic on top of that.
 */
const MQ_HALF_MIN = 2600;

/**
 * How many times the claim set repeats inside one half of the track.
 *
 * The width is ESTIMATED, because the server cannot measure text: 7px per
 * character and 40px per separator are both floors, not averages — uppercase
 * DM Sans at 14px with 0.06em tracking runs nearer 10px a character, and the
 * separator's padding only reaches its 18px minimum at the narrowest tier. An
 * estimate that reads low over-repeats, which costs a few hundred bytes of
 * markup; an estimate that reads high under-repeats, which is the empty band
 * again. Only one of those two failures is visible.
 *
 * The cap is a stop against pathological content (a shop shipping one
 * two-word claim would otherwise ask for thirty passes), not a tuning knob.
 */
function marqueeRepeats(items: readonly string[]): number {
  const est = items.reduce((w, t) => w + t.length * 7 + 40, 0);
  if (est <= 0) return 1;
  return Math.min(12, Math.max(1, Math.ceil(MQ_HALF_MIN / est)));
}

/**
 * One pass of the claim set. Every pass after the first is scaffolding for the
 * loop's width, so it is aria-hidden and tagged --dup for the reduced-motion
 * rule that drops it — a screen reader hears each claim exactly once no matter
 * how many times the band paints it.
 */
function marqueeSet(items: readonly string[], dup: boolean): string {
  return (
    '<span class="st-mq-set' +
    (dup ? ' st-mq-set--dup" aria-hidden="true"' : '"') +
    ">" +
    items
      .map(
        (t) =>
          '<span class="st-mq-item">' + esc(t) + "</span>" +
          '<span class="st-mq-sep" aria-hidden="true">·</span>',
      )
      .join("") +
    "</span>"
  );
}

/**
 * §4.6 — USP ticker. One track holding two identical halves; translating −50%
 * lands the second where the first began, so the join is invisible, and each
 * half is padded out with repeats until it is wider than any viewport that can
 * see it, so the tail is invisible too. The clone half is aria-hidden.
 *
 * WCAG 2.2.2 (Pause, Stop, Hide, Level A): the scroll starts on its own, runs
 * far past five seconds and sits beside other content, so it needs a real stop
 * mechanism. effects.ts supplies it in CSS —
 * `.st-mq-pause:checked ~ .st-mq-viewport .st-mq-track` — and this markup is
 * the half that makes it exist: a checkbox, its label, then the viewport, all
 * siblings, in that order, because the selector is `+` then `~`. Zero
 * JavaScript, operable by keyboard and touch, unlike a :hover pause.
 *
 * NAMING THE CONTROL. The label is empty on purpose — its text is `content:`
 * in effects.ts so one control can read "Ustavi"/"Zaženi" per state — which
 * leaves nothing for a screen reader to announce. The aria-label used to sit
 * on the <label>, where naming the checkbox from it depends on the accessible
 * name computation walking out of the label's own attributes; it is on the
 * INPUT now, where it is the control's name outright and no UA has to be
 * trusted to derive it. The name still contains both visible words, so WCAG
 * 2.5.3 (Label in Name) holds in either state.
 */
export function renderStudioMarquee(ctx: RenderCtx): string {
  const items = ctx.content.trust;
  // A shop may ship an empty trust list; an empty ticker is a 1px rule across
  // the page with a pause button beside it, which is worse than no band.
  if (!items.length) return "";
  const passes = marqueeRepeats(items);
  let half = marqueeSet(items, false);
  for (let i = 1; i < passes; i++) half += marqueeSet(items, true);
  return (
    '<section class="st-mq" aria-label="Prednosti">' +
    '<input class="st-mq-pause" id="st-mq-pause" type="checkbox" ' +
    'aria-label="Ustavi ali zaženi drsenje">' +
    '<label class="st-mq-toggle" for="st-mq-pause"></label>' +
    '<div class="st-mq-viewport">' +
    '<div class="st-mq-track">' +
    '<span class="st-mq-group">' + half + "</span>" +
    '<span class="st-mq-group st-mq-clone" aria-hidden="true">' + half + "</span>" +
    "</div></div></section>"
  );
}
