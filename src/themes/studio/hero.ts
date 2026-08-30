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
import { SHOP_HERO, decorativeImg } from "./media";
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
   * Three layers:
   *
   *   1. a photograph, full bleed, edge to edge
   *   2. a veil, because white type over a photograph is not a contrast
   *      argument you can win by hoping
   *   3. the wordmark, set enormous
   *
   * The source has a fourth — a cutout product painted over the wordmark, so
   * the name reads as something the product stands in front of. That layer is
   * deliberately empty until there is a photograph to fill it; see the note
   * on renderStudioHero.
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
    /* The same veil, re-declared with PIXEL FLOORS under the foot band's
     * stops. The stops above are percentages of the hero, the hero is the
     * viewport, and the foot's stack is pixel-sized — so on a short viewport
     * the text climbs, in pixels, into a fade that shrank with the viewport.
     * Measured on a 844x390 landscape phone: the h1's top line sat 182px up,
     * which is 47% of that hero, where the band holds ~49% ink — under the
     * ~58% a white run needs over a worst-case white pixel. Portrait phones
     * and desktops never hit this; landscape phones and half-height laptop
     * windows do.
     *
     * max() keeps each stop at least far enough up in PIXELS to stay under
     * the tallest foot stack (pill 30 + h1 at the widest tier 112 + two gaps
     * + button 46 + bottom padding, ~290px, plus headroom). On any viewport
     * 615px and taller every max() resolves to the same percentage as the
     * declaration above, so the composition is untouched where it was
     * measured; below that the band only ever gets DARKER, never thinner.
     * Two declarations rather than one because a browser without max() in
     * gradient stops drops the whole value — this way it drops the floors
     * and keeps the measured veil, instead of dropping the veil.
     *
     * The bar band gets the same treatment for the same reason: the bar is
     * 56px of fixed chrome, and 9% of a half-height laptop window is 40px,
     * so the hold ended mid-bar and left the nav's lower pixels on the fade.
     * 81px is exactly 9% of the 900px viewport the band was sampled on, so
     * taller windows are untouched and shorter ones keep the sampled floor. */
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--ink) 72%, transparent) 0%,
        color-mix(in srgb, var(--ink) 46%, transparent) max(9%, 81px),
        transparent max(22%, 141px)
      ),
      linear-gradient(
        0deg,
        color-mix(in srgb, var(--ink) 88%, transparent) 0%,
        color-mix(in srgb, var(--ink) 82%, transparent) max(26%, 160px),
        color-mix(in srgb, var(--ink) 62%, transparent) max(42%, 230px),
        color-mix(in srgb, var(--ink) 28%, transparent) max(54%, 285px),
        transparent max(64%, 330px)
      ),
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--ink) 12%, transparent),
        color-mix(in srgb, var(--ink) 12%, transparent)
      );
  }

  /* The foot block: pill, heading, one button. */
  :root[data-theme="studio"] .st-hero-foot {
    position: relative; z-index: 4;
    align-self: end;
    /* Container from layout.ts; only the block padding is the hero's own. */
    padding-block: 0 clamp(34px, 6vh, 76px);
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
  /* The h1 takes the h2 rung, not h3.
   *
   * It was set at h3 because it shared the frame with a poster wordmark and
   * had to yield to it — the one thing on the page allowed to be loud was the
   * name. With the wordmark gone (see renderStudioHero) nothing is competing,
   * and the heading that says what is sold and to whom should be the largest
   * type in the fold. Still not the h1 rung: 92px over a photograph at 16ch
   * runs to four lines and turns the whole frame into text. */
  :root[data-theme="studio"] .st-hero-foot h1 {
    margin: 0;
    max-inline-size: 16ch;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--on-invert);
  }
  /* The source has no paragraph here at all — pill, title, button. Ours keeps
   * one because it is the only place on the page those specifics appear, and
   * dropping page copy to match a layout is a bad trade on a site whose whole
   * strategy is the search result. It is held to a narrow measure so the block
   * stays the source's proportion rather than becoming a text column. */
  /* The two paths, side by side, wrapping to two lines on a narrow phone. */
  :root[data-theme="studio"] .st-hero-acts {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: clamp(14px, 1.6vw, 28px);
  }
  /* The secondary path: a link, not a second button, so the filled control
   * keeps its weight. Underlined from rest — on a photograph an unadorned
   * white word is not reliably readable AS a link. */
  :root[data-theme="studio"] .st-hero-alt {
    display: inline-flex;
    align-items: center;
    min-block-size: var(--st-tap, 44px);
    color: var(--on-invert);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    text-underline-offset: 5px;
  }
  /* THE PROOF ROW — price, the free visit, what the price covers.
   *
   * Set on the label rung and muted, because it must not compete with the
   * heading it sits under: this is the line a visitor checks AFTER the
   * sentence has landed, not the thing that lands. The middot separators are
   * ::before on every item but the first, so the row can wrap to two lines
   * on a phone without a dot ever opening one — the site's separator rule. */
  /* ---- the Google rating ------------------------------------------------
   *
   * Between the buttons and the proof row, because that is where a reader
   * looks for a reason to press the button they have just been offered —
   * and because the row below it is claims the SHOP makes, while this is one
   * it does not.
   *
   * ⚠️ THE WHOLE LINE IS THE LINK, and it is a link and not a decoration
   * because the numbers are somebody else's: pressing it lands on the profile
   * they came from. --st-tap is not used here for the same reason
   * .st-page-ch-ico does not — the target already clears 44px across, and
   * padding-block on an inline-flex box gives it the height without touching
   * the hero's rhythm.
   *
   * Colour: the score and the stars take --on-invert (the hero's own ink at
   * 13.58:1), the empty stars and the date take the declared dark-on-dark
   * rungs. No new colour enters the palette, so verify-contrast has nothing
   * new to check and the band cannot drift out of compliance. */
  :root[data-theme="studio"] .st-hero-rating {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px clamp(10px, 1vw, 16px);
    margin: clamp(16px, 1.8vw, 26px) 0 0;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
  }
  :root[data-theme="studio"] .st-hero-rating a,
  :root[data-theme="studio"] .st-hero-rating-s {
    display: inline-flex;
    align-items: baseline;
    gap: clamp(8px, 0.8vw, 12px);
    padding-block: 10px;
    margin-block: -10px;
    color: var(--on-invert);
    text-decoration: none;
  }
  :root[data-theme="studio"] .st-hero-rating a:hover .st-hero-rating-t,
  :root[data-theme="studio"] .st-hero-rating a:focus-visible .st-hero-rating-t {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  /* The glyph row rides a hair above the baseline the figures sit on: ★ has
   * no descender and its optical centre is high, so baseline-aligning it
   * against a numeral leaves the stars looking dropped. */
  :root[data-theme="studio"] .st-hero-stars {
    letter-spacing: 0.06em;
    font-size: 1.05em;
    line-height: 1;
    translate: 0 1px;
  }
  :root[data-theme="studio"] .st-hero-star-off { color: var(--on-invert-40); }
  :root[data-theme="studio"] .st-hero-rating-n {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
  }
  :root[data-theme="studio"] .st-hero-rating-t { color: var(--on-invert-mute); }
  :root[data-theme="studio"] .st-hero-rating-d {
    text-transform: none;
    font-family: var(--f-body);
    font-size: var(--t-label);
    letter-spacing: 0;
    color: var(--on-invert-40);
  }
  @media (max-width: 620px) {
    /* The date drops to its own line rather than squeezing the count. */
    :root[data-theme="studio"] .st-hero-rating { display: grid; justify-items: start; }
  }
  :root[data-theme="studio"] .st-hero-trust {
    list-style: none;
    margin: clamp(18px, 2vw, 30px) 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px clamp(12px, 1.2vw, 20px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--on-invert-mute);
  }
  :root[data-theme="studio"] .st-hero-trust li {
    display: flex;
    align-items: center;
    gap: clamp(12px, 1.2vw, 20px);
  }
  :root[data-theme="studio"] .st-hero-trust li + li::before {
    content: "·";
    color: var(--on-invert-24);
  }
  @media (max-width: 620px) {
    /* One per line on a phone, and the dots go with the row they separated. */
    :root[data-theme="studio"] .st-hero-trust { display: grid; gap: 6px; }
    :root[data-theme="studio"] .st-hero-trust li + li::before { content: none; }
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

  /* .st-hero-cap is GONE. It dressed the bottom-right "simbolična
   * fotografija" plate, and that markup left with the borrowed room (see the
   * note at the end of renderStudioHero: the only photograph left is the
   * shop's own, which is not symbolic of anything). The rule outlived its
   * element and matched nothing on any page. scripts/verify-hero-contrast.mjs
   * dropped its matching entry in the same change. */

  /* This block used to re-assert the h1's size, tracking and leading here
   * too — but it re-read the very same --t-h3/--ls-h3/--lh-h3 the base rule
   * already reads, and those tokens switch per breakpoint tier on their own,
   * so the override resolved to identical values at every width it covered.
   * Removed as dead weight; the ramp tokens are the mechanism. */
  @media (max-width: 900px) {
    /* Below 900px the bar doubles to two 44px rows (chrome.ts shares this
     * exact tier), so the fixed chrome is 96px deep while 9% of a phone
     * viewport is 55–76px — the band's hold ended mid-bar and the second
     * row's links sat on the fade: measured at 375x667, ~35% ink under the
     * glyph line, which a moderately bright photo top turns into ~2.9:1.
     * The hold stretches to cover both rows with the same floor the desktop
     * bar line gets; the fade floor moves with it so the ramp keeps its
     * shape. On a 390x844 phone the fade still ends at 22% (185.7px against
     * the 178px floor) — the cost is a visibly deeper cap only on shorter
     * phones, which is the same trade the foot band already makes: the
     * legibility is ours even where the photograph pays for it. The whole
     * value is restated because gradients live in one background property —
     * the foot bands and the wash are byte-identical to the base ones (and
     * must stay that way; the base declaration is the reference). */
    :root[data-theme="studio"] .st-hero-veil {
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--ink) 72%, transparent) 0%,
          color-mix(in srgb, var(--ink) 46%, transparent) max(9%, 132px),
          transparent max(22%, 178px)
        ),
        linear-gradient(
          0deg,
          color-mix(in srgb, var(--ink) 88%, transparent) 0%,
          color-mix(in srgb, var(--ink) 82%, transparent) max(26%, 160px),
          color-mix(in srgb, var(--ink) 62%, transparent) max(42%, 230px),
          color-mix(in srgb, var(--ink) 28%, transparent) max(54%, 285px),
          transparent max(64%, 330px)
        ),
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--ink) 12%, transparent),
          color-mix(in srgb, var(--ink) 12%, transparent)
        );
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-hero-cta { transition: none; }
  }

  /* ---- The only value this module declares -----------------------------
   * tokens.ts is the single declaration site: --studio-gutter, --tile-mid,
   * --bg-alt and --on-invert-mute live there and are consumed here as
   * var(--…) with no fallback — a fallback would silently resurrect the
   * duplicate this file used to carry.
   *
   * --studio-gap-stack and --studio-gap-cta used to live here too — the
   * §4.2 triptych's 48:56 internal rhythm. The triptych left this slot when
   * the full-bleed hero landed and nothing consumes either variable any
   * more (the hero foot carries its own gap); both removed as dead. */
  :root[data-theme="studio"] {
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
    /* Sized to what is in it. The band held a wordmark three lines deep, so
     * 64vh was the room that needed; one line and a model bar leave 200px of
     * empty ground above them, and its backdrop is a gradient rather than a
     * photograph — so the space shows nothing at all. */
    min-height: clamp(380px, 46vh, 560px);
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
  /* ⚠️ THE WORDMARK AND THE FOOT ARE ON THE HOUSE CONTAINER, and the band is
   * not. The band keeps its full-bleed ground — the gradient is meant to run
   * edge to edge — while the two things inside it that are CONTENT take the
   * same measure as every other band, so the shop name starts on the same
   * left edge as the header above it and the section below it. It did not:
   * .st-band was the one band with a gutter and no cap, so above 1640 its
   * contents kept spreading while everything around them had stopped.
   *
   * The two children are capped rather than a wrapper being added, because
   * the ground is an absolutely positioned sibling (.st-band-photo) and a
   * wrapper would have to be threaded past it. */
  :root[data-theme="studio"] .st-band-word,
  :root[data-theme="studio"] .st-band-foot {
    inline-size: 100%;
    max-inline-size: var(--studio-container);
    margin-inline: auto;
  }
  :root[data-theme="studio"] .st-band-word {
    position: relative; z-index: 1;
    margin-block: 0 clamp(28px, 3.6vw, 72px);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    /* ⚠️ 7.5rem, AND THE CEILING IS SIZED TO THE CONTAINER, NOT PICKED.
     *
     * It was 9rem, and the vw term stops growing there at a ~1895px viewport
     * while the band it sat in kept widening — so on a 2560px display the
     * name filled 70% of the band and left a 777px hole down the right. That
     * is the defect this pass started from. At 1440 it fills 94% and looks
     * correct, which is why it survived: the fault only exists above ~1900px.
     *
     * Now the content is capped at --studio-container (1560px), so the
     * ceiling has to be the largest size at which the LONGEST shop name still
     * sets on one line inside 1560. Measured: this name runs 1783px at 144px,
     * so it needs 126px or less; 7.5rem (120px) gives 1486px, which is the
     * same 95% of its container that the vw term produces at 1440. A longer
     * name than this shop's wraps instead of overflowing — overflow-wrap
     * below is the belt, and the band is min-height so a second line fits. */
    font-size: clamp(2.5rem, 7.6vw, 7.5rem);
    letter-spacing: var(--ls-h1);
    line-height: var(--lh-h1);
    text-transform: uppercase;
    color: var(--on-invert);
    /* max-width: 100% WAS HERE and had to go: it is the same property as the
     * max-inline-size the container rule above sets, it is declared later, so
     * it won — the wordmark kept spreading to the band's full bleed while the
     * foot beneath it had already taken the house measure. Measured at 1920:
     * the name started at x=40 and every other element on the page, including
     * its own foot row, started at x=180. The cap upstream is 1560px, which
     * is narrower than 100% at every viewport that matters, so nothing is
     * lost by dropping it. */
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The .st-band-object rules lived here: an absolutely positioned 4/3 panel
   * centred on the wordmark, plus the mass and photo treatments inside it.
   * All three went with the object itself — see renderStudioWordmarkBand for
   * why a light rectangle cannot occlude a word on a dark band without
   * reading as a hole punched through it. */
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
    /* ⚠️ THE EDGES WERE A GUILLOTINE. This is a scrolling strip inside an
     * overflow:hidden box, so text was cut mid-letter at both ends — and the
     * left end is 2px from the "USTAVI" pill, which parked a permanent sliced
     * half-glyph against a control. The chrome's nav rail solved exactly this
     * with a mask and this did not; now they agree.
     *
     * A MASK, not a gradient overlay, for the same reason chrome.ts gives:
     * this strip sits on the page ground in one place and on the dark band in
     * another, and a painted wedge would have to know which. A mask fades the
     * strip's own ink over whatever is behind it.
     *
     * 24px rather than the rail's 40: the rail's fade has to dissolve a whole
     * glyph so a clipped label reads as scrollable, while this one only has
     * to stop a hard cut on text that is already moving. */
    -webkit-mask-image:
      linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
    mask-image:
      linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
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

    /* THE PHONE OVERRIDE IS GONE, not retuned.
     *
     * It asked for 72vh where the desktop rule asks for 46, so the band came
     * out TALLER on a phone than on a laptop: 608px at 390x844 against 414px
     * at 1440x900. That is backwards on its own terms, and it was left behind
     * by the same edit that fixed the desktop value — the note on the base
     * rule explains that the band once held a three-line wordmark and no
     * longer does, and only the desktop half of that was acted on.
     *
     * Measured at 390x844: 56px of top padding, an 83px two-line wordmark,
     * the model bar and the button — 268px of content inside a 608px band,
     * so 340px of empty black on the smallest screen the shop has. The base
     * clamp gives 388px there, which leaves about 120px of air above the
     * wordmark: enough for a display band to breathe, and min-height is a
     * floor, so a longer shop name still grows the band rather than
     * overflowing it. */
    :root[data-theme="studio"] .st-band-callout { display: none; }
    /* No phone override for the band's object: there is no object. It used to need one
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
    /* ⚠️ AND THE ITEMS THEMSELVES HAVE TO WRAP. The rule above wraps BETWEEN
     * items; each item kept white-space: nowrap inside a clipped band, so at
     * 320 all three claims were cut ("Dostava in zagon po vsej Sloveniji"
     * short by 85.2px) and at 360 all three again. The ticker is stopped, so
     * nothing brings them back — reduced motion was losing content, which is
     * the failure this whole block exists to prevent. */
    :root[data-theme="studio"] .st-mq .st-mq-item { white-space: normal; }
    :root[data-theme="studio"] .st-mq-set .st-mq-sep:last-child { display: none; }
    /* ⚠️ .st-mq PREFIXED, OR THIS LOSES THE TIE AND SHIPS A DEAD BUTTON.
     * .st-mq .st-mq-toggle above scores (0,4,0) and this scored (0,3,0), so
     * under reduced motion the label stayed: measured 80.5 x 44px reading
     * "USTAVI", while the checkbox behind it WAS hidden and therefore not
     * focusable — 40 Tab presses never reached it. Clicking flipped the word
     * to "ZAŽENI" with nothing moving. WCAG 2.1.1. closing.ts's ticker uses a
     * compound selector for exactly this and does hide. */
    :root[data-theme="studio"] .st-mq .st-mq-pause,
    :root[data-theme="studio"] .st-mq .st-mq-toggle { display: none; }
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
 * 2. There is no subject layer. The source paints a cutout sofa over its
 *    wordmark; we carried the shop's line drawing there for a while, and it
 *    read as an icon pasted onto a photograph rather than as a product
 *    standing in the room — an outline has no mass, so it cannot occlude, and
 *    it needed a halo to be legible at all, which only made it look more
 *    stuck on. The band is the photograph and the name. When real product
 *    photography exists it goes back in as a cutout, which is the only form
 *    that works in this position.
 *
 * 3. The photograph carries "simbolična fotografija". It is a room from the
 *    same furniture bundle: fine as atmosphere, and labelled so it cannot be
 *    read as the product.
 */
/**
 * "37 mnenj" — and Slovenian counts in four forms, not two.
 *
 * ⚠️ A DUAL IS NOT AN EDGE CASE HERE, it is every second small number: 1
 * mnenje, 2 mnenji, 3 mnenja, 5 mnenj. A shop with two reviews reading "2
 * mnenj" tells a Slovenian reader that nobody at this company writes their
 * own language — on the line whose entire job is to be believed. This file's
 * history already carries two dual bugs (see "gresta" in content/finder.ts).
 *
 * The rule is CLDR's for sl and it is on the last two digits, so 101 takes
 * the singular and 11 does not.
 */
function reviewWord(n: number): string {
  const t = n % 100;
  if (t === 1) return "mnenje";
  if (t === 2) return "mnenji";
  if (t === 3 || t === 4) return "mnenja";
  return "mnenj";
}

/**
 * The Google rating as a line under the hero's buttons — or nothing.
 *
 * ⚠️ IT IS A QUOTATION, SO IT CARRIES ITS SOURCE. The stars alone would read
 * as this shop rating itself. What makes the line worth anything is that the
 * reader can press it and land on the profile the numbers came from, which is
 * also what keeps it on the right side of ZVPot-1: the reviews are Google's
 * and the page says so rather than implying they were collected here.
 *
 * ⚠️ THE GLYPHS ARE ROUNDED AND THE NUMBER IS NOT. 4,7 draws five stars, so
 * the exact score is printed beside them in figures and read out in the
 * accessible name — nobody is asked to count glyphs, and nothing rounds in
 * the shop's favour without the true figure next to it.
 *
 * ⚠️ aria-label ON THE ANCHOR, and the visible text is NOT what it says. The
 * link's own content is five ★ glyphs, a numeral and a fragment — read out in
 * order that is "black star black star black star black star black star, 4,9,
 * 37 mnenj na Googlu", which is noise wrapped around a number. The label says
 * the whole thing once, in words, and warns that the link leaves the site.
 *
 * The line is deliberately NOT uppercased like the proof row under it: those
 * are claims the shop makes about itself, this is a quotation from somebody
 * else, and letting them look identical is how a quotation stops reading as
 * one.
 */
function googleRatingHtml(ctx: RenderCtx): string {
  const g = ctx.shop.googleRating;
  if (!g) return "";
  // Refused rather than rendered wrong: a score outside the scale or an empty
  // count would turn this from proof into a defect, and a hero that silently
  // drops the line is the safe failure.
  if (!(g.score >= 1 && g.score <= 5) || !(g.count >= 1)) return "";
  // A link that is not a link is worse than no link: it is a promise to show
  // the source that lands nowhere. Absent is a state; malformed is not.
  const href = g.url && g.url.startsWith("https://") ? g.url : "";

  const on = Math.max(1, Math.min(5, Math.round(g.score)));
  // Slovenian writes the decimal with a comma.
  const score = g.score.toFixed(1).replace(".", ",");
  const reviews = g.count + " " + reviewWord(g.count);
  // ⚠️ THE SOURCE IS NAMED ONCE. The first version built the visible text and
  // the accessible name from one string that already ended "na Googlu", and
  // then prefixed "Ocena na Googlu:" — so a screen reader read the shop's
  // proof line as "Ocena na Googlu: 4,9 od 5, 37 mnenj na Googlu".
  const label =
    "Ocena na Googlu: " + score + " od 5, " + reviews +
    (href ? " — odpre Google v novem zavihku" : "");
  // "30. 8. 2026", not "2026-08-30": the ISO form is for the config, where a
  // sortable date is the useful one, and Slovenian prose is what the page is
  // written in. Split rather than parsed — a Date here would apply a timezone
  // to a plain calendar day and can move it by one.
  const [y, m, d] = g.asOf.split("-");
  const asOf = y && m && d ? Number(d) + ". " + Number(m) + ". " + y : g.asOf;
  // ⚠️ THE GLYPHS AND THE FIGURES ARE HIDDEN EITHER WAY, and the words are
  // said once. Linked, the anchor's own aria-label carries them; unlinked
  // there is no element whose name a reader would hear, so the sentence goes
  // in a visually-hidden span — a <p> with an aria-label is not reliably
  // announced, which is why this does not simply move the attribute up.
  const inner =
    '<span class="st-hero-stars" aria-hidden="true">' +
    '<span class="st-hero-star-on">' + "\u2605".repeat(on) + "</span>" +
    (on < 5 ? '<span class="st-hero-star-off">' + "\u2605".repeat(5 - on) + "</span>" : "") +
    "</span>" +
    '<span class="st-hero-rating-n" aria-hidden="true">' + esc(score) + "</span>" +
    '<span class="st-hero-rating-t" aria-hidden="true">' +
    esc(reviews + " na Googlu") + "</span>";
  return (
    '<p class="st-hero-rating">' +
    (href
      ? '<a href="' + esc(href) + '" target="_blank" rel="noopener" ' +
        'aria-label="' + esc(label) + '">' + inner + "</a>"
      : '<span class="st-hero-rating-s">' +
        '<span class="st-vh">' + esc(label) + "</span>" + inner + "</span>") +
    // The date the figures were read. Small, muted, and not optional: a
    // rating with no date is a claim that ages silently.
    '<span class="st-hero-rating-d">' + esc("stanje " + asOf) + "</span>" +
    "</p>"
  );
}

export function renderStudioHero(ctx: RenderCtx): string {
  const c = ctx.content;
  // The shop's own photograph, or NOTHING. There used to be a fallback to a
  // borrowed room here, which is how this shop spent a day opening on a
  // sideboard and a vase of flowers. A hero with no picture is a hero that
  // looks unfinished; a hero with someone else's furniture on it looks
  // finished and is wrong, and the second failure is much harder to notice.
  //
  // With no photograph the veil paints on the section's own dark ground and
  // the wordmark carries the frame alone, which is a legitimate thing for
  // this theme to do — it is a typographic design first.
  const photo = SHOP_HERO[ctx.shop.key];

  // Uppercase through the shop's own locale: Slovenian casing is not the
  // default one, and a wordmark is the last place to get a letter wrong.
  const mark = ctx.shop.wordmark.join(" ").toLocaleUpperCase(ctx.shop.locale.intl);

  return (
    '<section class="st-hero">' +
    // The LCP element. Eager and high priority: it is the largest thing on the
    // page and the one the score is measured against, so a lazy hint here
    // would be actively wrong.
    (photo ? eager(decorativeImg(photo, "st-hero-bg", "100vw")) : "") +
    '<span class="st-hero-veil" aria-hidden="true"></span>' +

    // NO POSTER WORDMARK.
    //
    // A fit-to-width SVG of the shop's name used to sit across the top third
    // of the photograph, and it was the theme's signature device — read off a
    // source whose brand name is one short word.
    //
    // It does not survive this shop's name. "MASAŽNI BAZENI VRELEC" is 21
    // characters, so fit-to-width means it spans the frame, and fit-to-width
    // ALSO means the longer the name the more of the photograph it covers.
    // Forty pixels above it, in the bar, stood the same words again. So the
    // first thing anyone met was the shop's name twice, at five times the
    // size the second time, over the photograph it was hiding — and the
    // sentence that says what is sold and to whom was pushed to the bottom
    // edge of the fold.
    //
    // The name still gets ONE display-scale moment on this page: the band in
    // §4.5, where it is the device rather than an obstruction. Once.

    // NO ANNOTATION. There was a leader line here pointing at the subject,
    // captioned with the shop's first trust line. It came from the source
    // theme, where it labels a piece of furniture in a styled room and earns
    // its place. Here it pointed at a hot tub and said "Dostava in zagon po
    // vsej Sloveniji" — a delivery promise, not a description of the thing it
    // was aimed at, so the line drew the eye to the product and then said
    // something about logistics. Removed on the owner's instruction; the
    // trust line itself is unchanged and still runs in the strip below, which
    // is where a delivery promise belongs.

    '<div class="st-hero-foot">' +
    '<span class="st-hero-pill">' + esc(c.kicker) + "</span>" +
    "<h1>" + esc(c.h1) + "</h1>" +
    // NO SUB PARAGRAPH. The hero was pill, heading, four lines of prose and a
    // button; it is now pill, heading, button. Removed on the owner's
    // instruction, and the copy had gone stale under it anyway — it opened
    // "Trije modeli" while the shop had grown to three hot tubs AND five swim
    // spas, so the first sentence on the site undercounted the catalogue by
    // more than half.
    //
    // The sentence itself is untouched in content and still runs in the story
    // block further down, where it has room to be read rather than skimmed
    // past on the way to the button.
    // TWO PATHS, BECAUSE A HERO WITH ONE BUTTON ASKS EVERY VISITOR THE SAME
    // QUESTION. "Choose your pool" is the right ask for somebody ready to
    // browse; the visitor who is not sure a 2.210 kg object can stand on
    // their terrace at all has a different first move, and it is the one
    // this shop is actually differentiated on. The second is a link rather
    // than a second button so the primary action keeps its weight.
    '<div class="st-hero-acts">' +
    '<a class="st-hero-cta" href="#izbor">' + esc(c.cta) + "</a>" +
    '<a class="st-hero-alt" href="' + esc(ctx.shop.routeSlugs["/showroom"] + ctx.q) +
    '">Brezplačen ogled lokacije</a>' +
    "</div>" +
    // THE RATING, WHERE IT IS CHECKABLE OR NOT AT ALL. See googleRating in
    // tenants/types.ts: unset by default, and all four fields or nothing.
    googleRatingHtml(ctx) +
    // THE PROOF ROW. See heroTrust in content/types.ts for why this list is
    // not `trust`: every item here is confirmed and backed by another page,
    // and the price is derived from the offered models rather than typed.
    (c.heroTrust
      ? '<ul class="st-hero-trust">' +
        c.heroTrust.map((t) => "<li>" + esc(t) + "</li>").join("") +
        "</ul>"
      : "") +
    "</div>" +
    // Bottom-right, out of the reading path but on the same frame as the
    // photograph it qualifies — and absent entirely once the photograph is
    // the shop's own.
    // No caption. It existed to mark a borrowed room as symbolic; the only
    // photographs left are the shop's own, which are not symbolic of
    // anything.
    "</section>"
  );
}

/**
 * §4.5 — wordmark band: the shop name set enormous in white, and the model
 * the page leads with named under it.
 *
 * NOTHING IS PAINTED OVER THE NAME ANY MORE, and that is the change worth
 * explaining. The source's device is an object occluding the wordmark — the
 * letters pass behind it — and it was transcribed faithfully. It failed here
 * twice, for two different reasons, and the second one is the instructive
 * one:
 *
 *   1. With no photography it painted an empty grey box, 449x320 measured,
 *      across the middle of the name.
 *   2. Given a photograph it painted a pale panel across the middle of the
 *      name, which is worse: MASAŽNI BAZEN rendered as MASAŽ▯EN. That is the
 *      exact phrase this site ranks for, cut in half, on a dark band whose
 *      only content is that phrase. And because the picture came from a
 *      shared pool by hash, it showed a SWIM SPA directly above a chip
 *      reading VELIKI · BAZEN 230 — a photograph of one product beside
 *      another product's name, which is the error the category cards were
 *      already corrected for once.
 *
 * The device needs a cutout with its own silhouette on a ground that
 * contrasts with the band. What this shop owns is white-sweep studio shots,
 * which arrive as a light rectangle — so on a dark band the object reads as
 * a panel laid over the word rather than as a product standing in front of
 * it. Occlusion by a rectangle is not depth; it is a hole.
 *
 * So the band is now what it is good at: type. The name is legible end to
 * end, and the chip, model name and CTA below carry the offer. The name is a
 * <p>, not a heading — the hero owns the page's only h1.
 */
export function renderStudioWordmarkBand(ctx: RenderCtx): string {
  const d = ctx.pdp;
  return (
    '<section class="st-band" aria-label="' + esc(ctx.shop.name) + " — " + esc(d.title) + '">' +
    '<div class="st-band-photo" aria-hidden="true"></div>' +
    // The object lives INSIDE the wordmark so it is positioned against the
    // letters rather than against the band's floor — see .st-band-object for
    // what that fixes. A <span>, not a <div>: a div inside a <p> does not
    // parse as a child, the parser closes the paragraph and the containing
    // block silently becomes the band again. Empty and aria-hidden, so the
    // paragraph still announces nothing but the shop name.
    '<p class="st-band-word">' + esc(ctx.shop.name) + "</p>" +
    // NO CALLOUT. It was a dot, a leader line and the shop's first trust
    // claim — "Dostava in zagon po vsej Sloveniji" — pointing at the object.
    // The same device was removed from the hero on the owner's instruction
    // and for the same reason: it draws the eye to the product and then says
    // something about logistics. The claim is untouched and still runs in the
    // ticker and the impact band, where it is read rather than pointed at.
    "" +
    '<div class="st-band-foot">' +
    '<span class="st-band-chip">' + esc(d.eyebrow) + "</span>" +
    '<span class="st-band-title">' + esc(d.title) + "</span>" +
    // The finder, not the flagship PDP: the BAZEN 230 card two bands above
    // already links that page, so the band added no route. "Which one is
    // mine?" is the question a brand statement leaves a reader with.
    '<a class="st-btn-light" href="' + esc(ctx.shop.routeSlugs["/finder"] + ctx.q) +
    '">Kateri je pravi za vas?</a>' +
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
