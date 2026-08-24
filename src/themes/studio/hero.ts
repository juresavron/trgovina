/**
 * STUDIO — opening acts (docs/STUDIO-BASELINE.md §4.2, §4.5, §4.6).
 *
 *   §4.2 Hero triptych  — photo · black offer panel · photo with name + price
 *   §4.5 Wordmark band  — the shop name enormous in white, OCCLUDED by the product
 *   §4.6 Marquee        — dot-separated USP ticker, seamless CSS loop
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
import { arrowWatermark } from "./icons";

export const STUDIO_HERO_CSS = `
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
    /* The photo placeholder draws itself in these, so one set of markup works
     * on a light or a dark ground. Defaults are the light case; the hero's
     * panels override them, because the hero is dark. */
    --photo-ink: var(--ink);
    --photo-cap-ink: var(--ink-body);
  }

  /* ---- §4.2 Hero triptych ----
   * Three EQUAL full-bleed columns, no gaps, FULL viewport height. The chrome
   * no longer subtracts: it is a fixed transparent bar overlaying this section
   * (see chrome.ts), so the hero owns the whole viewport as the source's does.
   * Subtracting --chrome-h now would leave a band of the next section showing
   * above the fold. */
  :root[data-theme="studio"] .st-hero {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    min-height: 100vh;
    min-height: 100svh;
    overflow: clip;
  }
  :root[data-theme="studio"] .st-hero-panel {
    position: relative;
    min-width: 0;
    isolation: isolate;
    /* The watermark is drawn wider than its panel; clip it here so it cannot
     * bleed into the neighbouring column. */
    overflow: clip;
  }
  /* All three hero panels are DARK, and that is a constraint rather than a
   * preference. The header is a fixed transparent bar whose logo and nav are
   * white — the source's logo file is literally fill="#fff" — so whatever sits
   * beneath it must be dark or the navigation is unreadable. The source gets
   * that from its hero photography; these panels stand in for the same
   * photography, so they carry its ground.
   *
   * The consequence lands on the photo brief: a hero image for this theme must
   * be dark along its top edge. docs/STUDIO-BASELINE.md §4.15 carries it as a
   * requirement. */
  :root[data-theme="studio"] .st-hero-photo-a,
  :root[data-theme="studio"] .st-hero-photo-b {
    --photo-ink: var(--on-invert);
    --photo-cap-ink: var(--on-invert-mute);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-hero-photo-a { background: var(--ink-invert-2); }
  :root[data-theme="studio"] .st-hero-photo-b { background: var(--ink-invert); }

  /* §4.14 watermark — the ARROW-STADIUM outline, scaled enormous and set a few
   * percent off the ground. Not a circle and not a gradient blob: it is the
   * brand motif, so it is the real outline from icons.ts, rendered as an
   * aria-hidden element BEHIND the panel content (z-index 0). The ink is
   * currentColor, set per band below. */
  :root[data-theme="studio"] .st-hero-wm {
    position: absolute; z-index: 0;
    left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: 128%; height: 58%;
    pointer-events: none;
  }
  :root[data-theme="studio"] .st-hero-wm .st-watermark {
    display: block; width: 100%; height: 100%;
  }
  /* Pulled back off the panel's dark ground so it reads as a watermark. */
  :root[data-theme="studio"] .st-hero-photo-a .st-hero-wm {
    color: color-mix(in srgb, var(--bg) 46%, transparent);
  }
  /* Dark band: --ink-invert-2 is the baseline's #161616 watermark rung, one
   * step off --ink-invert (§2 token table). */
  :root[data-theme="studio"] .st-hero-offer .st-hero-wm {
    color: var(--ink-invert-2);
  }

  /* Centre: black, the whole message stack, centered. */
  :root[data-theme="studio"] .st-hero-offer {
    background: var(--ink-invert);
    color: var(--on-invert);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(48px, 5.5vw, 110px) var(--studio-gutter);
  }
  :root[data-theme="studio"] .st-hero-stack {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
    /* width+max-width, not max-width alone: on a phone the stack fills the
     * panel so a stretched CTA spans it, on desktop the measure still caps. */
    width: 100%;
    max-width: 30ch;
  }
  /* Pills are ROUND (§3) — the counterpoint to the sharp button below. */
  :root[data-theme="studio"] .st-hero-pill {
    border: 1px solid color-mix(in srgb, var(--on-invert) 40%, transparent);
    border-radius: var(--r-pill);
    padding: clamp(8px, 0.6vw, 12px) clamp(16px, 1.4vw, 28px);
    /* An eyebrow chip — the label role, whole row: DM Sans 14px, +0.06em,
     * uppercase. Leading is the ramp's tight label rung because a chip is one
     * line inside its own padding. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert);
    /* measured 48px gap, pill → statement */
    margin-bottom: var(--studio-gap-stack);
  }
  /* The offer statement is the page's single h1, so it takes the ramp's h1
   * rung outright: 92/64/44 Clash Display at --w-display (500), 0em tracking,
   * 1.04em leading. The measured pass had guessed a 650 weight and −0.03em
   * tracking; the source sets display type at 500 and never tracks it negative. */
  :root[data-theme="studio"] .st-hero-offer h1 {
    margin: 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h1);
    letter-spacing: var(--ls-h1);
    line-height: var(--lh-h1);
    text-wrap: balance;
    /* a long Slovenian head term must fold, never push the column open */
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* Sub: the standfirst under the statement, so the lead rung (20/16/18
   * Satoshi at --w-body-med) in the lighter on-dark ink. */
  :root[data-theme="studio"] .st-hero-sub {
    margin: clamp(10px, 1.1vw, 22px) 0 0;
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    /* Measured #d6d6d6 — lighter than --on-invert-mute. 13.4:1 on #0d0d0d. */
    color: var(--on-invert-mute);
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
  :root[data-theme="studio"] .st-hero-cta {
    /* measured 56px gap, sub → button */
    margin-top: var(--studio-gap-cta);
  }

  /* Photo-ready slot: flat neutral mass + contact shadow on the panel ground.
   * Studio's grounds are white/grey, so the placeholder stays flatter than
   * zarja's lit scenes — a real photo drops in with zero restructuring. */
  :root[data-theme="studio"] .st-photo {
    position: absolute; inset: 0; z-index: 1;
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
  /* Draws in --photo-cap-ink so the disclosure follows its panel's ground:
   * --ink-body where the panel is light, --on-invert-mute (7.33:1) on the
   * hero's dark panels. A fixed ink would have failed on one of the two. */
  :root[data-theme="studio"] .st-photo-cap {
    position: absolute; z-index: 2;
    top: var(--studio-gutter); left: var(--studio-gutter);
    /* A caption — the label role, whole row, uppercase. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--photo-cap-ink);
  }
  /* Both photo panels carry the "photography pending" disclosure, but exactly
   * ONE is ever visible: panel A's above 900px, panel B's below it — where
   * panel A is display:none and the disclosure would otherwise vanish with it. */
  :root[data-theme="studio"] .st-hero-photo-b .st-photo-cap { display: none; }

  /* Right column overlay: product name + price on a legibility scrim. */
  :root[data-theme="studio"] .st-hero-scrim {
    position: absolute; inset: auto 0 0 0; z-index: 2;
    display: flex; flex-direction: column; gap: clamp(6px, 0.6vw, 12px);
    padding: clamp(56px, 7vw, 140px) var(--studio-gutter) var(--studio-gutter);
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--ink-invert) 92%, transparent) 0%,
      color-mix(in srgb, var(--ink-invert) 62%, transparent) 42%,
      transparent 100%
    );
  }
  /* A product title, so the ramp's large-card rung, h5 (32/26/24) — this panel
   * is the biggest "card" on the page but the element is still a product name,
   * and the ramp is picked by role, not by the 40px the screenshot showed. */
  :root[data-theme="studio"] .st-hero-name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--on-invert);
    /* A long model name must fold inside the column, never widen the panel. */
    overflow-wrap: break-word;
  }
  /* §4.2's price row: the live price white, the compare-at struck beside it. */
  :root[data-theme="studio"] .st-hero-prices {
    display: flex; align-items: baseline; flex-wrap: wrap;
    gap: clamp(8px, 0.8vw, 16px);
  }
  /* The primary price takes the h6 rung (24/19/22 Clash Display) — the ramp's
   * price role, which is a display face, not the body one the measured pass used. */
  :root[data-theme="studio"] .st-hero-price {
    font-family: var(--f-display);
    font-size: var(--t-h6);
    font-weight: var(--w-display);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    font-variant-numeric: tabular-nums;
    color: var(--on-invert);
  }
  /* The struck compare-at drops to the body rung — secondary information beside
   * the live price — in the muted on-dark ink (7.33:1 on the scrim's near-black:
   * it is secondary, never illegible). */
  :root[data-theme="studio"] .st-hero-was {
    /* Containing block for the visually-hidden "prejšnja cena" prefix. */
    position: relative;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    font-variant-numeric: tabular-nums;
    color: var(--on-invert-mute);
    text-decoration-line: line-through;
    text-decoration-thickness: 1px;
  }
  /* Local copy of chrome.ts's .st-vh: the hero must not depend on the chrome
   * module being on the page for its screen-reader prefix to stay hidden. */
  :root[data-theme="studio"] .st-hero-vh {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }

  /* ---- §4.5 Wordmark band ---- */
  /* The z-layering IS the device: the brand name sits BEHIND the product,
   * which occludes its middle letters. isolation:isolate gives the band its
   * own stacking context so the order is local and cannot be reshuffled by
   * whatever the page puts above or below it. Nothing here is faded —
   * occlusion is geometry, not opacity. */
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
  /* The product that occludes the wordmark. Opaque on purpose. */
  :root[data-theme="studio"] .st-band-object {
    position: absolute; z-index: 2;
    left: 50%; transform: translateX(-50%);
    bottom: clamp(90px, 13vw, 220px);
    width: clamp(200px, 40vw, 760px);
    aspect-ratio: 4 / 3;
    border-radius: var(--r-media);
    background: linear-gradient(168deg, var(--bg-alt), var(--bg-alt));
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
  }
  :root[data-theme="studio"] .st-mq-viewport {
    flex: 1 1 auto; min-width: 0;
    overflow: hidden;
  }
  :root[data-theme="studio"] .st-mq-group { display: flex; align-items: center; }
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
    :root[data-theme="studio"] .st-hero {
      grid-template-columns: 1fr;
      min-height: 0;
    }
    /* Black panel first — the offer, not the scenery, opens the page. */
    :root[data-theme="studio"] .st-hero-offer {
      order: 1;
      padding: clamp(56px, 12vw, 96px) clamp(20px, 6vw, 44px);
    }
    /* The surviving photo is the one carrying the product name and price;
     * the other is dropped outright rather than squeezing three panels. */
    :root[data-theme="studio"] .st-hero-photo-b { order: 2; min-height: 58svh; }
    :root[data-theme="studio"] .st-hero-photo-a { display: none; }
    /* …so the placeholder disclosure moves with it: panel B's caption is the
     * one that shows here (see .st-hero-photo-b .st-photo-cap above). */
    :root[data-theme="studio"] .st-hero-photo-b .st-photo-cap { display: block; }

    :root[data-theme="studio"] .st-band { min-height: clamp(380px, 72vh, 620px); }
    :root[data-theme="studio"] .st-band-callout { display: none; }
    :root[data-theme="studio"] .st-band-object { bottom: clamp(120px, 34vw, 240px); }
  }
  @media (max-width: 560px) {
    :root[data-theme="studio"] .st-hero-photo-b { min-height: 48svh; }
    :root[data-theme="studio"] .st-hero-cta,
    :root[data-theme="studio"] .st-band-foot .st-btn-light { width: 100%; }
  }

  /* ---- Motion ----
   * effects.ts owns the reduced-motion reset for the ticker itself (track
   * animation off, clone hidden, items wrapped). Two consequences are this
   * module's to handle: the wrapped set needs the gutter on its trailing edge,
   * and the pause control now toggles an animation that no longer runs — a
   * control that does nothing, so it goes. */
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-mq-viewport { padding-inline-end: var(--studio-gutter); }
    :root[data-theme="studio"] .st-mq-pause,
    :root[data-theme="studio"] .st-mq-toggle { display: none; }
    :root[data-theme="studio"] .st-btn-light { transition: none; }
  }
`;

/**
 * Photo-ready slot — bordered mass + contact shadow, no image request.
 * `cap` renders the "photography pending" note; omitted where an overlay
 * already occupies the panel.
 */
function photoSlot(cap?: string): string {
  return (
    '<div class="st-photo" aria-hidden="true">' +
    '<span class="st-photo-mass"></span>' +
    '<span class="st-photo-floor"></span>' +
    "</div>" +
    (cap ? '<span class="st-photo-cap">' + esc(cap) + "</span>" : "")
  );
}

function pdpHref(ctx: RenderCtx): string {
  return ctx.shop.routeSlugs["/product"] + "/" + ctx.content.pdp.slug + ctx.q;
}

/**
 * §4.14's arrow-stadium watermark, wrapped in its positioning box. Decorative
 * only, so the wrapper is aria-hidden as well as the svg: no assistive
 * technology should meet the brand motif twice.
 */
function watermark(): string {
  return '<span class="st-hero-wm" aria-hidden="true">' + arrowWatermark() + "</span>";
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
export function renderStudioHero(ctx: RenderCtx): string {
  const c = ctx.content;
  const was = compareAt(c.pdp);
  return (
    '<section class="st-hero">' +
    '<div class="st-hero-panel st-hero-photo-a">' +
    watermark() +
    photoSlot("fotografija v pripravi") +
    "</div>" +
    '<div class="st-hero-panel st-hero-offer">' +
    watermark() +
    '<div class="st-hero-stack">' +
    '<span class="st-hero-pill">' + esc(c.kicker) + "</span>" +
    "<h1>" + esc(c.h1) + "</h1>" +
    '<p class="st-hero-sub">' + esc(c.sub) + "</p>" +
    '<a class="st-btn-light st-hero-cta" href="#izbor">' + esc(c.cta) + "</a>" +
    "</div></div>" +
    // The caption rides BOTH photo panels; CSS shows exactly one, so the
    // disclosure survives panel A being dropped below 900px.
    '<div class="st-hero-panel st-hero-photo-b">' +
    photoSlot("fotografija v pripravi") +
    '<div class="st-hero-scrim">' +
    '<span class="st-hero-name">' + esc(c.pdp.title) + "</span>" +
    '<span class="st-hero-prices">' +
    '<span class="st-hero-price">' + esc(c.pdp.price) + "</span>" +
    // The <s> alone is silent in most screen readers; the hidden prefix is
    // what makes "prejšnja cena 3.499 €" the announced relationship.
    (was
      ? '<s class="st-hero-was"><span class="st-hero-vh">prejšnja cena </span>' +
        esc(was) + "</s>"
      : "") +
    "</span></div></div></section>"
  );
}

/**
 * §4.5 — wordmark band. The shop name is set enormous in white and the
 * product placeholder is painted OVER it; the occlusion is the device, so the
 * name is never dimmed to fake depth. The name is a <p>, not a heading: the
 * hero owns the page's only h1.
 */
export function renderStudioWordmarkBand(ctx: RenderCtx): string {
  const d = ctx.content.pdp;
  // The callout label is content, not chrome — the shop's first trust claim.
  // noUncheckedIndexedAccess: a shop may ship an empty trust list.
  const note = ctx.content.trust[0];
  return (
    '<section class="st-band" aria-label="' + esc(ctx.shop.name) + " — " + esc(d.title) + '">' +
    '<div class="st-band-photo" aria-hidden="true"></div>' +
    '<p class="st-band-word">' + esc(ctx.shop.name) + "</p>" +
    '<div class="st-band-object" aria-hidden="true"><span class="st-photo-mass"></span></div>' +
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
 * §4.6 — USP ticker. One track holding the item set twice; the clone is
 * aria-hidden so a screen reader hears each claim once, and the −50% translate
 * loops without a visible seam.
 *
 * WCAG 2.2.2 (Pause, Stop, Hide, Level A): the scroll starts on its own, runs
 * far past five seconds and sits beside other content, so it needs a real stop
 * mechanism. effects.ts supplies it in CSS —
 * `.st-mq-pause:checked ~ .st-mq-viewport .st-mq-track` — and this markup is
 * the half that makes it exist: a checkbox, its label, then the viewport, all
 * siblings, in that order, because the selector is `+` then `~`. Zero
 * JavaScript, operable by keyboard and touch, unlike a :hover pause.
 *
 * The label is empty on purpose: its text is `content:` in effects.ts so one
 * control can read "Ustavi"/"Zaženi" per state, which leaves nothing for a
 * screen reader to announce — hence the aria-label.
 */
export function renderStudioMarquee(ctx: RenderCtx): string {
  const group = ctx.content.trust
    .map(
      (t) =>
        '<span class="st-mq-item">' + esc(t) + "</span>" +
        '<span class="st-mq-sep" aria-hidden="true">·</span>',
    )
    .join("");
  return (
    '<section class="st-mq" aria-label="Prednosti">' +
    '<input class="st-mq-pause" id="st-mq-pause" type="checkbox">' +
    '<label class="st-mq-toggle" for="st-mq-pause" ' +
    'aria-label="Ustavi ali zaženi drsenje"></label>' +
    '<div class="st-mq-viewport">' +
    '<div class="st-mq-track">' +
    '<span class="st-mq-group">' + group + "</span>" +
    '<span class="st-mq-group st-mq-clone" aria-hidden="true">' + group + "</span>" +
    "</div></div></section>"
  );
}
