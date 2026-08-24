/**
 * STUDIO — product detail page (docs/STUDIO-BASELINE.md §3, §4.7, §4.13).
 *
 * The baseline has no PDP screenshot, so this page is assembled from the
 * devices it does measure, rather than invented:
 *
 *   §4.7  the product panel — #F2F2F2 ground, radius 12px, a framed mass on
 *         it — becomes the gallery: one large frame plus a strip of smaller
 *         detail frames beneath.
 *   §4.13 the shop's FILTER SIDEBAR is the configurator's vocabulary:
 *         "uppercase label + hairline, square 22px checkboxes with 19px
 *         labels, and availability as outlined round pills". Both option
 *         shapes are used here, chosen per group by the rule documented at
 *         PILL_MAX_CHARS.
 *   §4.1  the black 90px chrome band is the sticky buy bar's language:
 *         near-black ground, on-invert type, one sharp white CTA.
 *   §3    54px gutter, ~130px light-section rhythm, sharp buttons / round
 *         pills — the contrast the baseline calls the easiest thing to get
 *         wrong.
 *
 * Scale translation: every measured px is the clamp MAXIMUM (the spec is
 * measured at a 2000px viewport). Neighbouring values share a vw slope, so
 * the ratios — gutter 54 : title 68 : label 15 : box 22 — survive the shrink.
 *
 * NO INTERACTIVITY. This Worker ships no JS (docs/SEO.md §4, baseline §5.2),
 * so the configurator renders the selected option as state — a `data-on`
 * attribute the CSS styles as chosen — and never emits a radio, checkbox or
 * <select> that could not change anything. The one live control on the page
 * is the buy bar's CTA, which is a real link.
 *
 * Token discipline (docs/THEMES.md): colors, radii and faces are var(--…)
 * only; the values the baseline measures that tokens.ts does not carry are
 * declared below as documented --studio-* variables. Every selector is scoped
 * :root[data-theme="studio"] — zarja/lednik/salon share this sheet.
 */

import { esc, type RenderCtx } from "../../render/sections";
import type { PdpContent } from "../../content/types";

export const STUDIO_PDP_CSS = `
  /* ---- Values the baseline measures that tokens.ts does not carry ---- */
  :root[data-theme="studio"] {
    /* §3's 54px gutter. chrome.ts/hero.ts/commerce.ts already declare
     * --studio-gutter; this module consumes it with a fallback instead of
     * declaring a fourth copy, so cascade order can never make it drift and
     * the module still stands alone if the sheet is assembled without them. */
    --studio-pdp-gutter: var(--studio-gutter, clamp(20px, 2.7vw, 54px));
    /* §3: ~130px vertical rhythm on light sections. */
    --studio-pdp-rhythm: clamp(44px, 6.5vw, 130px);
    /* Gallery → buy column gap. Sized off §4.7's 48px card padding plus the
     * card gap: the two columns must read as two panels, not one spread. */
    --studio-pdp-col-gap: clamp(26px, 3.4vw, 68px);
    /* The gallery frame's ratio. §4.7's product panel is portrait 3/4, but
     * that panel is ~474px wide; the PDP frame is ~1000px wide at 2000px, and
     * 3/4 there is 1330px tall — past the fold before the price is reached.
     * §4.4's landscape 4/3 panel is the baseline's other measured product
     * ground, and it is the one that survives at this width. */
    --studio-pdp-frame-ar: 4 / 3;
    /* §4.13: the sidebar's square 22px checkbox. */
    --studio-pdp-box: clamp(16px, 1.1vw, 22px);
    /* §4.1: the 90px chrome band, reused as the buy bar's height. */
    --studio-pdp-bar-h: clamp(54px, 4.5vw, 90px);
  }

  /* Visually hidden until focused. Local copy (chrome.ts has .st-vh) so this
   * module carries its own screen-reader text with no cross-file dependency. */
  :root[data-theme="studio"] .st-pdp-vh {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }

  /* ---- the page band ------------------------------------------------- */
  /* No overflow property here on purpose: an overflow value on this section
   * would kill position:sticky on the buy bar inside it. */
  :root[data-theme="studio"] .st-pdp {
    background: var(--bg);
    padding-top: var(--studio-pdp-rhythm);
  }
  :root[data-theme="studio"] .st-pdp-in {
    /* 1560px, the baseline's text-led measure (§3) — a PDP is a decision
     * column, not a full-bleed band. The buy bar below uses the 1900px one. */
    max-width: 1560px;
    margin-inline: auto;
    padding-inline: var(--studio-pdp-gutter);
  }
  :root[data-theme="studio"] .st-pdp-grid {
    display: grid;
    /* Gallery leads: the frame is the largest object on the page. */
    grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr);
    gap: var(--studio-pdp-col-gap);
    align-items: start;
  }

  /* ---- gallery (§4.7's panel, at page scale) -------------------------- */
  :root[data-theme="studio"] .st-pdp-frame {
    position: relative;
    margin: 0;
    aspect-ratio: var(--studio-pdp-frame-ar);
    background: var(--bg-alt);
    border-radius: var(--r-media);
    overflow: hidden;
    isolation: isolate;
  }
  /* Legibility scrim under the caption. Invisible against the flat
   * placeholder, and already in place for the day a photograph fills the
   * frame — the photo drops in with zero restructuring. */
  :root[data-theme="studio"] .st-pdp-frame::after {
    content: "";
    position: absolute; inset: 0 auto auto 0; z-index: 2;
    width: 66%; height: 40%;
    background: radial-gradient(
      100% 100% at 0% 0%,
      color-mix(in srgb, var(--bg) 60%, transparent),
      transparent 70%
    );
  }
  /* Photo-ready slot: flatter and more neutral than zarja's lit scenes,
   * because studio's grounds are white/grey. Never an image request. */
  :root[data-theme="studio"] .st-pdp-shot { position: absolute; inset: 0; z-index: 1; }
  :root[data-theme="studio"] .st-pdp-shot-mass {
    position: absolute;
    inset: 15% 16% 20%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--ink) 9%, transparent),
      color-mix(in srgb, var(--ink) 3%, transparent)
    );
  }
  :root[data-theme="studio"] .st-pdp-shot-floor {
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
  /* Uppercase caption rung (15px / 500 / 0.12em). --ink-soft, not --ink-mute:
   * 8.1:1 on the #f4f4f4 panel, where mute would land at 4.2:1 and fail. */
  :root[data-theme="studio"] .st-pdp-cap {
    position: absolute; z-index: 3;
    top: clamp(12px, 1.2vw, 24px); left: clamp(12px, 1.2vw, 24px);
    font-family: var(--f-body);
    font-size: clamp(10.5px, 0.7vw, 14px);
    font-weight: 500; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  /* The detail strip: three smaller frames, same ground, same ratio. Fixed
   * fractions — never a scroller, so it cannot widen the page. */
  :root[data-theme="studio"] .st-pdp-thumbs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: clamp(8px, 1vw, 20px);
    margin-top: clamp(8px, 1vw, 20px);
  }
  :root[data-theme="studio"] .st-pdp-thumb {
    position: relative;
    display: block;
    aspect-ratio: var(--studio-pdp-frame-ar);
    background: var(--bg-alt);
    border-radius: var(--r-media);
    overflow: hidden;
  }

  /* ---- buy column ------------------------------------------------------ */
  :root[data-theme="studio"] .st-pdp-buy { min-width: 0; }
  /* 15px / 500 / 0.12em uppercase (§1). --ink-soft = 9.7:1 on white. */
  :root[data-theme="studio"] .st-pdp-eyebrow {
    font-family: var(--f-body);
    font-size: clamp(11.5px, 0.75vw, 15px);
    font-weight: 500; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  /* Page-statement rung: 62–68px / 600 / −0.022em / 1.15 (§1). One step below
   * §4.13's 90px shop-hero title, which spans a full-bleed band; this one sits
   * in a ~45% column. */
  :root[data-theme="studio"] .st-pdp-title {
    margin: clamp(10px, 1vw, 20px) 0 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-stretch: var(--stretch);
    font-size: clamp(2rem, 3.4vw, 4.25rem);
    letter-spacing: var(--track-display);
    line-height: 1.08;
    color: var(--ink);
    /* A long Slovenian model name folds; it never pushes the column open. */
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* Body copy 19–21px / 1.6–1.7 (§1). */
  :root[data-theme="studio"] .st-pdp-sub {
    margin: clamp(12px, 1.2vw, 24px) 0 0;
    font-family: var(--f-body);
    font-size: clamp(14.5px, 1.05vw, 1.3125rem);
    line-height: 1.65;
    color: var(--ink-soft);
    max-width: 46ch;
  }
  :root[data-theme="studio"] .st-pdp-price {
    display: flex; align-items: baseline; flex-wrap: wrap;
    gap: clamp(8px, 0.7vw, 14px);
    margin-top: clamp(16px, 1.6vw, 32px);
    font-family: var(--f-body);
    font-variant-numeric: tabular-nums;
  }
  /* §4.7's 26px price rung lifted one step: on a PDP it is the page's single
   * commercial number, not one of nine on a grid. */
  :root[data-theme="studio"] .st-pdp-now {
    font-size: clamp(1.375rem, 1.7vw, 2.125rem);
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--ink);
  }
  /* The struck compare-at (§4.7): 20px, muted, one hairline through it.
   * #767676 on #ffffff = 4.5:1 — it clears only because it sits on the page
   * ground, never on the --bg-alt panel. */
  :root[data-theme="studio"] .st-pdp-was {
    font-size: clamp(0.8125rem, 1vw, 1.25rem);
    color: var(--ink-mute);
    text-decoration-line: line-through;
    text-decoration-thickness: 1px;
  }
  :root[data-theme="studio"] .st-pdp-vat {
    font-size: clamp(11px, 0.7vw, 14px);
    letter-spacing: 0.04em;
    color: var(--ink-soft);
  }

  /* ---- §4.13 configurator: label + hairline, squares, round pills ------ */
  :root[data-theme="studio"] .st-pdp-cfg {
    display: flex; flex-direction: column;
    gap: clamp(20px, 2vw, 40px);
    margin-top: clamp(26px, 2.8vw, 56px);
  }
  /* The sidebar's device: uppercase label with a hairline under it. */
  :root[data-theme="studio"] .st-pdp-glabel {
    padding-bottom: clamp(8px, 0.7vw, 14px);
    border-bottom: 1px solid var(--line);
    font-family: var(--f-body);
    font-size: clamp(11.5px, 0.75vw, 15px);
    font-weight: 500; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  :root[data-theme="studio"] .st-pdp-opts {
    list-style: none; margin: clamp(12px, 1.1vw, 22px) 0 0; padding: 0;
    display: flex; flex-direction: column;
    gap: clamp(9px, 0.8vw, 16px);
  }
  /* Checkbox row: square box + 19px label (§4.13). Not a control — no cursor
   * change, no hover state: it states the configuration, it does not offer it.
   * The unselected rung is --ink-mute (4.6:1 on the white page ground, the
   * lowest rung that still clears AA); the chosen row goes to full --ink. */
  :root[data-theme="studio"] .st-pdp-opt {
    /* Containing block for the row's visually-hidden "izbrano" text. */
    position: relative;
    display: flex; align-items: flex-start;
    gap: clamp(9px, 0.8vw, 16px);
    font-family: var(--f-body);
    font-size: clamp(13.5px, 0.95vw, 1.1875rem);
    line-height: 1.4;
    color: var(--ink-mute);
  }
  /* SQUARE, and sharp (--r-ctrl): §9 keeps round for pills and arrows. */
  :root[data-theme="studio"] .st-pdp-box {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: var(--studio-pdp-box);
    block-size: var(--studio-pdp-box);
    /* Optical centering against the first line of a 1.4-leading label. */
    margin-top: 0.15em;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctrl);
    background: var(--surface);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-pdp-box svg {
    inline-size: 68%; block-size: 68%;
    opacity: 0;
  }
  /* The chosen state, driven purely by the data attribute the renderer emits. */
  :root[data-theme="studio"] .st-pdp-opt[data-on] { color: var(--ink); font-weight: 500; }
  :root[data-theme="studio"] .st-pdp-opt[data-on] .st-pdp-box {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
  }
  :root[data-theme="studio"] .st-pdp-opt[data-on] .st-pdp-box svg { opacity: 1; }

  /* Pill row — the sidebar's "availability as outlined round pills". */
  :root[data-theme="studio"] .st-pdp-pills {
    list-style: none; margin: clamp(12px, 1.1vw, 22px) 0 0; padding: 0;
    display: flex; flex-wrap: wrap;
    gap: clamp(8px, 0.7vw, 14px);
  }
  /* ROUND (§9). Sentence case, not the 0.12em uppercase rung: these labels are
   * product copy carrying prices ("Za 4 osebe — 1.990 €"), and tracked caps
   * would push them past two-per-row at 390px. */
  :root[data-theme="studio"] .st-pdp-pill {
    position: relative;
    display: inline-flex; align-items: center;
    padding: clamp(8px, 0.6vw, 12px) clamp(13px, 1.2vw, 24px);
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    background: var(--surface);
    font-family: var(--f-body);
    font-size: clamp(12.5px, 0.9vw, 1.125rem);
    line-height: 1.3;
    color: var(--ink-mute);
  }
  /* Chosen = inverted fill. In a monochrome theme the only louder state than
   * a black hairline is a black ground (§4.7 uses the same escalation). */
  :root[data-theme="studio"] .st-pdp-pill[data-on] {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
    color: var(--on-invert);
    font-weight: 500;
  }

  /* Honesty line under the configurator: says the selection is fixed and
   * gives the one channel that can change it. */
  :root[data-theme="studio"] .st-pdp-cfg-note {
    margin-top: clamp(14px, 1.2vw, 24px);
    font-family: var(--f-body);
    font-size: clamp(12px, 0.8vw, 16px);
    line-height: 1.6;
    color: var(--ink-soft);
  }
  :root[data-theme="studio"] .st-pdp-cfg-note a {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  :root[data-theme="studio"] .st-pdp-cfg-note a:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    border-radius: var(--r-ctrl);
  }

  /* ---- freight box: hairline frame, included lines in accent ---------- */
  :root[data-theme="studio"] .st-pdp-freight {
    margin-top: clamp(24px, 2.4vw, 48px);
    padding: clamp(16px, 1.6vw, 32px);
    border: 1px solid var(--line);
    border-radius: var(--r-card);
    background: var(--surface);
  }
  :root[data-theme="studio"] .st-pdp-frows {
    margin: clamp(12px, 1.1vw, 22px) 0 0;
    display: flex; flex-direction: column;
  }
  :root[data-theme="studio"] .st-pdp-frow {
    display: flex; align-items: baseline; flex-wrap: wrap;
    gap: 6px clamp(12px, 1.2vw, 24px);
    padding-block: clamp(9px, 0.8vw, 16px);
    border-top: 1px solid var(--line-soft);
  }
  :root[data-theme="studio"] .st-pdp-frow:first-child { border-top: 0; padding-top: 0; }
  :root[data-theme="studio"] .st-pdp-frow dt {
    flex: 1 1 14ch; min-width: 0;
    font-family: var(--f-body);
    font-size: clamp(13px, 0.9vw, 1.0625rem);
    line-height: 1.5;
    color: var(--ink-soft);
  }
  :root[data-theme="studio"] .st-pdp-frow dd {
    margin: 0; margin-left: auto;
    font-family: var(--f-body);
    font-size: clamp(13px, 0.9vw, 1.0625rem);
    font-weight: 600;
    line-height: 1.5;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
    white-space: nowrap;
  }
  /* The accent as punctuation (§5.4): an included line is the only colored
   * text on the page. --acc-text is the L=0.45 rung, ≥4.9:1 on #ffffff at
   * every shop hue; --acc (L=0.62) would not clear 4.5:1 and is not used here. */
  :root[data-theme="studio"] .st-pdp-frow dd.st-pdp-inc { color: var(--acc-text); }
  :root[data-theme="studio"] .st-pdp-note {
    margin-top: clamp(12px, 1.1vw, 22px);
    padding-top: clamp(12px, 1.1vw, 22px);
    border-top: 1px solid var(--line-soft);
    font-family: var(--f-body);
    font-size: clamp(11.5px, 0.78vw, 15px);
    line-height: 1.55;
    color: var(--ink-mute);
  }

  /* ---- spec: two-column hairline-ruled definition list ----------------- */
  :root[data-theme="studio"] .st-pdp-spec {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
    gap: var(--studio-pdp-col-gap);
    margin-top: var(--studio-pdp-rhythm);
  }
  /* Section heading rung: 68–72px / 600 / −0.025em / 1.05 (§1), capped one
   * step down because it shares the row with the table it labels. */
  :root[data-theme="studio"] .st-pdp-spec-h {
    margin: clamp(10px, 1vw, 20px) 0 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-stretch: var(--stretch);
    font-size: clamp(1.5rem, 2.4vw, 3rem);
    letter-spacing: -0.025em;
    line-height: 1.05;
    color: var(--ink);
    max-width: 14ch;
  }
  :root[data-theme="studio"] .st-pdp-spec-table {
    margin: 0;
    border-top: 1px solid var(--line);
  }
  :root[data-theme="studio"] .st-pdp-srow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    gap: clamp(10px, 1.2vw, 24px);
    padding-block: clamp(11px, 1vw, 20px);
    border-bottom: 1px solid var(--line);
  }
  :root[data-theme="studio"] .st-pdp-srow dt {
    font-family: var(--f-body);
    font-size: clamp(13px, 0.9vw, 1.0625rem);
    line-height: 1.5;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-pdp-srow dd {
    margin: 0;
    font-family: var(--f-body);
    font-size: clamp(13px, 0.9vw, 1.0625rem);
    line-height: 1.5;
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  /* ---- §4.1 chrome language: the sticky buy bar ------------------------ */
  :root[data-theme="studio"] .st-pdp-bar {
    position: sticky;
    bottom: 0;
    z-index: 40;
    margin-top: var(--studio-pdp-rhythm);
    background: var(--ink-invert);
    color: var(--on-invert);
    /* A band, not a card: sharp edges, one hairline, no shadow — the chrome
     * bar's exact construction, mirrored. */
    border-top: 1px solid color-mix(in srgb, var(--on-invert) 10%, transparent);
  }
  :root[data-theme="studio"] .st-pdp-bar-in {
    max-width: 1900px;
    margin-inline: auto;
    padding-inline: var(--studio-pdp-gutter);
    min-height: var(--studio-pdp-bar-h);
    display: flex; align-items: center;
    gap: clamp(10px, 1.4vw, 28px);
    padding-block: clamp(9px, 0.8vw, 16px);
  }
  :root[data-theme="studio"] .st-pdp-sum {
    display: flex; align-items: baseline; flex-wrap: wrap;
    gap: 2px clamp(6px, 0.6vw, 12px);
    min-width: 0;
    font-family: var(--f-body);
  }
  :root[data-theme="studio"] .st-pdp-sum-name {
    font-size: clamp(13px, 0.95vw, 1.1875rem);
    font-weight: 600;
    color: var(--on-invert);
    /* One row at every width: the name gives way before the row wraps. */
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* #a8a8a8 on #0d0d0d = 8.9:1. */
  :root[data-theme="studio"] .st-pdp-sum-cfg {
    font-size: clamp(12px, 0.8vw, 1rem);
    color: var(--on-invert-mute);
    white-space: nowrap;
  }
  :root[data-theme="studio"] .st-pdp-bar-price {
    margin-left: auto;
    font-family: var(--f-body);
    font-size: clamp(14px, 1.2vw, 1.5rem);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--on-invert);
  }
  /* SHARP white CTA (§3/§9) — the one live control on the page. */
  :root[data-theme="studio"] .st-pdp-cta {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    padding: clamp(11px, 1vw, 20px) clamp(16px, 2vw, 40px);
    background: var(--bg);
    border: 1px solid var(--bg);
    border-radius: var(--r-ctrl);
    text-decoration: none;
    font-family: var(--f-body);
    font-size: clamp(11.5px, 0.8vw, 1rem);
    font-weight: 600; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--ink);
    transition: background-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-pdp-cta:hover {
    background: color-mix(in srgb, var(--bg) 84%, var(--ink));
  }
  /* The page ring is --acc; on a near-black band white outlines louder. */
  :root[data-theme="studio"] .st-pdp-cta:focus-visible {
    outline: 2px solid var(--bg);
    outline-offset: 3px;
    border-radius: var(--r-ctrl);
  }

  /* ---- responsive ------------------------------------------------------ */
  @media (max-width: 1000px) {
    /* Gallery over buy column: below this width the frame and a 19px option
     * list cannot share a row without both losing. */
    :root[data-theme="studio"] .st-pdp-grid,
    :root[data-theme="studio"] .st-pdp-spec {
      grid-template-columns: minmax(0, 1fr);
    }
    :root[data-theme="studio"] .st-pdp-spec-h { max-width: none; }
  }
  @media (max-width: 560px) {
    /* 390px budget for the bar: 20px gutters leave 350px. CTA ~118px + price
     * ~58px + two 10px gaps = 196px, so the name keeps ~154px and ellipses.
     * The configuration summary is the one part that can be dropped without
     * losing a fact the page has not already stated above. */
    :root[data-theme="studio"] .st-pdp-sum-cfg { display: none; }
    :root[data-theme="studio"] .st-pdp-bar-in { gap: 10px; }
    :root[data-theme="studio"] .st-pdp-cta { padding-inline: 14px; letter-spacing: 0.08em; }
    /* A 3-up detail strip at 350px gives 110px frames — still readable as
     * frames, and it keeps the gallery one object instead of two. */
    :root[data-theme="studio"] .st-pdp-thumbs { gap: 8px; }
  }

  /* ---- motion ---------------------------------------------------------- */
  @media (prefers-reduced-motion: reduce) {
    /* Nothing here animates position, so the readable static state is the
     * resting one: no transitions, no residual transform. The buy bar keeps
     * its sticky position — that is layout, not motion. */
    :root[data-theme="studio"] .st-pdp-cta,
    :root[data-theme="studio"] .st-pdp-cfg-note a {
      transition: none;
      transform: none;
    }
  }
`;

/**
 * A pill must hold its label on ONE line and still allow two pills per row at
 * the narrowest supported width. At 390px the buy column is 350px; a pill
 * spends ~30px on padding and border, so a two-up row leaves ~145px of text
 * per pill, which is ~24 characters of DM Sans at the 12.5px floor. Groups
 * whose longest option exceeds that render as the §4.13 checkbox list
 * instead, where a label may wrap freely.
 */
const PILL_MAX_CHARS = 24;

/** Code-point length — Slovenian č/š/ž must count as one character. */
function len(s: string): number {
  return Array.from(s).length;
}

function usesPills(options: readonly string[]): boolean {
  return options.every((o) => len(o) <= PILL_MAX_CHARS);
}

/** Photo-ready slot — bordered mass + contact shadow, never an image request. */
function shot(): string {
  return (
    '<span class="st-pdp-shot" aria-hidden="true">' +
    '<span class="st-pdp-shot-mass"></span>' +
    '<span class="st-pdp-shot-floor"></span>' +
    "</span>"
  );
}

/** The check inside a chosen square. Decorative: the state is also in text. */
const CHECK =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" ' +
  'stroke="currentColor" stroke-width="2.6" stroke-linecap="round" ' +
  'stroke-linejoin="round"><path d="m5 12.5 4.7 4.7L19 6.8"/></svg>';

/**
 * The struck compare-at price of §4.7, on the PDP.
 *
 * PdpContent does not (yet) carry a compare-at field, and deriving one from
 * `price` would put a fabricated discount on a €3k product. Read structurally
 * rather than through a cast, exactly as commerce.ts does, so adding
 * `compareAt?: string` to the interface needs no change here.
 */
function compareAt(d: PdpContent): string | null {
  const v: unknown = (d as { compareAt?: unknown }).compareAt;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * The PDP body — gallery left, buy column right, spec beneath, sticky buy bar.
 *
 * Consumes exactly what renderPdpBody() consumes (ctx.content.pdp: eyebrow,
 * title, sub, price, cfg, freight, note, spec, bar), so the two renderers are
 * interchangeable per theme with no content-layer change.
 */
export function renderStudioPdp(ctx: RenderCtx): string {
  const d = ctx.content.pdp;
  const was = compareAt(d);

  const cfg = d.cfg
    .map((g, gi) => {
      const [label, options, selected] = g;
      // A group with no options would render a label and a hairline over
      // nothing; drop it rather than draw an empty control surface.
      if (options.length === 0) return "";
      const id = "st-pdp-g" + String(gi + 1);
      const chosen = (i: number): string =>
        i === selected ? '<span class="st-pdp-vh"> — izbrano</span>' : "";

      const body = usesPills(options)
        ? '<ul class="st-pdp-pills" aria-labelledby="' + id + '">' +
          options
            .map(
              (o, i) =>
                '<li class="st-pdp-pill"' + (i === selected ? " data-on" : "") + ">" +
                esc(o) + chosen(i) + "</li>",
            )
            .join("") +
          "</ul>"
        : '<ul class="st-pdp-opts" aria-labelledby="' + id + '">' +
          options
            .map(
              (o, i) =>
                '<li class="st-pdp-opt"' + (i === selected ? " data-on" : "") + ">" +
                '<span class="st-pdp-box">' + CHECK + "</span>" +
                "<span>" + esc(o) + chosen(i) + "</span></li>",
            )
            .join("") +
          "</ul>";

      return '<div><h2 class="st-pdp-glabel" id="' + id + '">' + esc(label) + "</h2>" + body + "</div>";
    })
    .join("");

  const freight = d.freight
    .map(
      (r) =>
        '<div class="st-pdp-frow"><dt>' + esc(r[0]) + "</dt>" +
        "<dd" + (r[2] ? ' class="st-pdp-inc"' : "") + ">" + esc(r[1]) + "</dd></div>",
    )
    .join("");

  const spec = d.spec
    .map(
      (row) =>
        '<div class="st-pdp-srow"><dt>' + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd></div>",
    )
    .join("");

  return (
    '<section class="st-pdp">' +
    '<div class="st-pdp-in">' +

    '<div class="st-pdp-grid">' +
    // --- gallery: one large framed placeholder + a detail strip ---
    "<div>" +
    '<figure class="st-pdp-frame">' + shot() +
    '<figcaption class="st-pdp-cap">Vizualizacija — fotografije v pripravi</figcaption>' +
    "</figure>" +
    // Decorative: three empty frames carry no information a reader needs.
    '<div class="st-pdp-thumbs" aria-hidden="true">' +
    '<span class="st-pdp-thumb">' + shot() + "</span>" +
    '<span class="st-pdp-thumb">' + shot() + "</span>" +
    '<span class="st-pdp-thumb">' + shot() + "</span>" +
    "</div></div>" +

    // --- buy column ---
    '<div class="st-pdp-buy">' +
    '<p class="st-pdp-eyebrow">' + esc(d.eyebrow) + "</p>" +
    '<h1 class="st-pdp-title">' + esc(d.title) + "</h1>" +
    '<p class="st-pdp-sub">' + esc(d.sub) + "</p>" +
    '<p class="st-pdp-price">' +
    '<span class="st-pdp-now">' + esc(d.price) + "</span>" +
    (was ? '<s class="st-pdp-was">' + esc(was) + "</s>" : "") +
    '<span class="st-pdp-vat">z DDV</span>' +
    "</p>" +
    (cfg
      ? '<div class="st-pdp-cfg">' + cfg + "</div>" +
        '<p class="st-pdp-cfg-note">Prikazana je izbrana konfiguracija. ' +
        'Za drugo kombinacijo nas, prosimo, pokličite na <a href="' + ctx.phoneHref + '">' +
        esc(ctx.phoneDisplay) + "</a>.</p>"
      : "") +
    '<section class="st-pdp-freight" aria-labelledby="st-pdp-fh">' +
    '<h2 class="st-pdp-glabel" id="st-pdp-fh">Dostava in montaža</h2>' +
    '<dl class="st-pdp-frows">' + freight + "</dl>" +
    '<p class="st-pdp-note">' + esc(d.note) + "</p>" +
    "</section>" +
    "</div></div>" +

    // --- spec: heading left, hairline-ruled definition list right ---
    '<div class="st-pdp-spec">' +
    '<div><p class="st-pdp-eyebrow">Specifikacija</p>' +
    '<h2 class="st-pdp-spec-h">Tehnični podatki</h2></div>' +
    '<dl class="st-pdp-spec-table">' + spec + "</dl>" +
    "</div>" +

    "</div>" +

    // --- §4.1 chrome band as the sticky buy bar ---
    // The CTA goes to the cart route, which is what its label says (bar[3]);
    // chrome.ts's basket button points at the same slug.
    '<div class="st-pdp-bar"><div class="st-pdp-bar-in">' +
    '<span class="st-pdp-sum">' +
    '<span class="st-pdp-sum-name">' + esc(d.bar[0]) + "</span>" +
    '<span class="st-pdp-sum-cfg">' + esc(d.bar[1]) + "</span>" +
    "</span>" +
    '<span class="st-pdp-bar-price">' + esc(d.bar[2]) + "</span>" +
    '<a class="st-pdp-cta" href="' + ctx.shop.routeSlugs["/cart"] + ctx.q + '">' +
    esc(d.bar[3]) + "</a>" +
    "</div></div>" +
    "</section>"
  );
}
