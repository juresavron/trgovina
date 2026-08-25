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
 *         labels, and availability as outlined round pills". The SHAPES hold;
 *         the 19px does not — it is the screenshot pass, and §1's transcribed
 *         ramp wins on type (§0). The option row is the 16px body rung and the
 *         group label the 14px label rung. Both option shapes are used here,
 *         chosen per group by the rule documented at PILL_MAX_CHARS.
 *   §4.1  the black 90px chrome band is the sticky buy bar's language:
 *         near-black ground, on-invert type, one sharp white CTA.
 *   §3    54px gutter, ~130px light-section rhythm, sharp buttons / round
 *         pills — the contrast the baseline calls the easiest thing to get
 *         wrong.
 *
 * It also carries §4.13's two SECONDARY-PAGE devices, which no other module
 * built: renderStudioShopHero() (the dark listing-page band) and
 * renderStudioFilters() (the 380px sidebar). They sit here because the sidebar
 * is the configurator's own label/hairline/square/pill vocabulary, reused
 * class for class — and because, with no JS and no filtered URLs, it renders
 * as links rather than as controls that could not filter.
 *
 * Scale translation: this page carries NO measured type. §4's px numbers are
 * the screenshot pass and §1's ramp wins wherever the two touch type (§0), so
 * the devices' geometry is still read off §4 — the 380px sidebar, the 22px
 * checkbox, the 4/3 frame — while every font-size, weight, tracking and
 * leading below is a token from the transcribed ramp, taken a whole row at a
 * time. Nothing here sets a size without the weight, tracking and leading that
 * ship with it, and nothing here tracks negatively: the source's display type
 * is set open and light (500 at 92px), which is the single thing the measured
 * pass had backwards.
 *
 * NO INTERACTIVITY. This Worker ships no JS (docs/SEO.md §4, baseline §5.2),
 * so the configurator renders the selected option as state — a `data-on`
 * attribute the CSS styles as chosen — and never emits a radio, checkbox or
 * <select> that could not change anything. The one live control on the page
 * is the buy bar's CTA, which is a real link.
 *
 * Token discipline (docs/THEMES.md): colors, radii, faces, gutters, rhythm and
 * chrome height are var(--…) from tokens.ts — this module re-declares none of
 * them (a local --studio-rhythm at equal specificity let sheet order pick the
 * storefront's vertical rhythm). What remains below are values tokens.ts does
 * not carry, all of them local to this page. Every selector is scoped
 * :root[data-theme="studio"] — zarja/lednik/salon share this sheet.
 */

import { esc, type RenderCtx } from "../../render/sections";
import type { PdpContent, PdpPhoto } from "../../content/types";
import { productArt } from "./product-art";
import { productImg } from "./media";
import { helpIcon, returnIcon, shieldIcon, truckIcon } from "./icons";
import { renderStudioTestimonials } from "./editorial";
import { ADDON_GROUP_ORDER } from "../../catalog/pola";
import { formatEur } from "../../catalog/pricing";

export const STUDIO_PDP_CSS = `
  /* ---- Values the baseline measures that tokens.ts does not carry ---- */
  :root[data-theme="studio"] {
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
    /* The buy bar sits at the bottom of the viewport for the whole page, so an
     * in-page anchor scrolled flush to the bottom edge landed UNDERNEATH it.
     * The bar is the chrome band's height (--chrome-h), plus its own block
     * padding — reserve that much at the end of every scroll. */
    scroll-padding-bottom: calc(var(--chrome-h) + clamp(18px, 1.6vw, 32px));
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
    padding-top: var(--studio-rhythm);
  }
  :root[data-theme="studio"] .st-pdp-in {
    /* --studio-container (1560px), the baseline's text-led measure (§3) — a PDP
     * is a decision column, not a full-bleed band. The buy bar below uses
     * --studio-container. Both are CONTENT measures and box-sizing is border-box,
     * so the gutter is ADDED to the cap rather than eaten out of it. */
    max-width: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
  }
  :root[data-theme="studio"] .st-pdp-grid {
    display: grid;
    /* Gallery leads: the frame is the largest object on the page. */
    grid-template-columns: minmax(0, 1.12fr) minmax(0, 1fr);
    gap: var(--studio-pdp-col-gap);
    align-items: start;
  }

  /* The gallery sticks while the buy column scrolls past it.
   *
   * The buy column is now much the taller of the two — nine models' worth of
   * configurator, fourteen priced add-ons, a total and the delivery box —
   * so the gallery ran out around a fifth of the way down and left roughly
   * 1300px of empty page beside the decision the visitor is actually making.
   * Sticky keeps the product in view for that whole scroll, which is the one
   * thing a product page owes the person reading it.
   *
   * Only while the grid HAS two columns: stacked, this would pin the picture
   * over the copy. The offset clears the fixed chrome band. */
  @media (min-width: 1001px) {
    /* Sticky only while the gallery is the SHORT column. With the drawing
     * fallback it is three frames against a buy column several times its
     * height, and pinning it keeps the product in view for that whole scroll.
     * With real photography it is ten frames and by far the taller of the two
     * — sticky then pins a column that is already longer than the viewport,
     * which does nothing except stop the page scrolling as expected. */
    :root[data-theme="studio"] .st-pdp-gallery:not([data-photos]) {
      position: sticky;
      top: calc(var(--chrome-h) + clamp(16px, 1.6vw, 32px));
    }
    /* When the gallery is the long column, the buy column is the one worth
     * keeping in view — it holds the price and the cart. */
    :root[data-theme="studio"] .st-pdp-gallery[data-photos] + .st-pdp-buy {
      position: sticky;
      top: calc(var(--chrome-h) + clamp(16px, 1.6vw, 32px));
    }
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
  /* The shop's drawing. Inset like the mass it replaces so the two occupy the
   * same optical box, and drawn in a softened ink so it reads as an
   * illustration on a light panel rather than as flat black line art. */
  :root[data-theme="studio"] .st-pdp-shot-art {
    position: absolute;
    inset: 12% 13% 17%;
    display: block;
    color: color-mix(in srgb, var(--ink) 62%, transparent);
  }
  :root[data-theme="studio"] .st-pdp-shot-art .st-art {
    inline-size: 100%;
    block-size: 100%;
  }
  /* Same as the cards: a photograph shot on white gets a white panel, or its
   * own ground prints as a rectangle inside the frame. */
  :root[data-theme="studio"] .st-also-frame:has(.st-pdp-shot-img),
  :root[data-theme="studio"] .st-pdp-frame:has(.st-pdp-photo) {
    background: var(--surface);
  }
  :root[data-theme="studio"] .st-pdp-shot-img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
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
  /* The label rung, uppercase — a caption is label copy (§1), and the label
   * rung is DM Sans at 14px / 500 / 0.06em, not the 0.12em the measured pass
   * had. Single line, so it takes --lh-label-tight rather than the 1.71em
   * stacked-copy leading. --ink-body, not --ink-mute: 8.1:1 on the panel,
   * where mute would land at 4.2:1 and fail. */
  :root[data-theme="studio"] .st-pdp-cap {
    position: absolute; z-index: 3;
    top: clamp(12px, 1.2vw, 24px); left: clamp(12px, 1.2vw, 24px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-body);
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
  /* The label rung, uppercase (§1). --ink-body = 9.7:1 on white. */
  :root[data-theme="studio"] .st-pdp-eyebrow {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-body);
  }
  /* h2, not h1 — and the choice is about how this page is composed. The title
   * is the PDP's dominant heading, but it sits in a ~45% decision column beside
   * a gallery that is the largest object on the page; it never spans a band.
   * h1 (92/64/44) is the rung the full-bleed shop hero below takes, and keeping
   * the two apart preserves the step this file always described. The
   * 600 / −0.022em / 1.15 this rule used to carry was the measured pass: §1's
   * display type is 500, tracked 0em, led 1.13em, and is never negative. */
  :root[data-theme="studio"] .st-pdp-title {
    margin: clamp(10px, 1vw, 20px) 0 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--ink);
    /* A long Slovenian model name folds; it never pushes the column open. */
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The lead rung (20/16/18): a standfirst under the title, not ordinary body —
   * hence Satoshi at the medium weight rather than 400. */
  :root[data-theme="studio"] .st-pdp-sub {
    margin: clamp(12px, 1.2vw, 24px) 0 0;
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--ink-body);
    max-width: 46ch;
  }
  /* Three rungs share this row and the ramp gives each its own FACE, so the
   * container's family serves only the body-rung child; the other two declare
   * their own. */
  :root[data-theme="studio"] .st-pdp-price {
    display: flex; align-items: baseline; flex-wrap: wrap;
    gap: clamp(8px, 0.7vw, 14px);
    margin-top: clamp(16px, 1.6vw, 32px);
    font-family: var(--f-body);
    font-variant-numeric: tabular-nums;
  }
  /* h6 — the ramp's price rung, and on a PDP this is the page's single
   * commercial number rather than one of nine on a grid. h6 is a display rung,
   * so the number sets in Clash Display at 500. The −0.01em it used to carry is
   * exactly the artefact §1 rules out. */
  :root[data-theme="studio"] .st-pdp-now {
    font-family: var(--f-display);
    font-size: var(--t-h6);
    font-weight: var(--w-display);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  /* The struck compare-at (§4.7): the body rung, muted, one hairline through
   * it. #767676 on #ffffff = 4.5:1 — it clears only because it sits on the page
   * ground, never on the --bg-alt panel. */
  :root[data-theme="studio"] .st-pdp-was {
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
    text-decoration-line: line-through;
    text-decoration-thickness: 1px;
  }
  /* "z DDV" is a meta note beside the number, so it takes the label rung —
   * sentence case, because uppercase is a per-element choice and not a property
   * of the rung. Tight leading: it is one line inside a baseline-aligned row. */
  :root[data-theme="studio"] .st-pdp-vat {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-body);
  }

  /* ---- §4.13 configurator: label + hairline, squares, round pills ------ */
  :root[data-theme="studio"] .st-pdp-cfg {
    display: flex; flex-direction: column;
    gap: clamp(20px, 2vw, 40px);
    margin-top: clamp(26px, 2.8vw, 56px);
  }
  /* The sidebar's device: the uppercase label rung with a hairline under it.
   * It is an <h2> in the DOM and a label in the ramp — heading LEVEL and type
   * rung are independent, and a group label is label copy. */
  :root[data-theme="studio"] .st-pdp-glabel {
    padding-bottom: clamp(8px, 0.7vw, 14px);
    border-bottom: 1px solid var(--line);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-opts {
    list-style: none; margin: clamp(12px, 1.1vw, 22px) 0 0; padding: 0;
    display: flex; flex-direction: column;
    gap: clamp(9px, 0.8vw, 16px);
  }
  /* Checkbox row: square box + the BODY rung (§4.13 says 19px, but that is the
   * screenshot pass — these labels are wrapping product copy, so body at 16px
   * is the rung that fits what they are). Not a control — no cursor change, no
   * hover state: it states the configuration, it does not offer it.
   * The unselected rung is --ink-mute (4.6:1 on the white page ground, the
   * lowest rung that still clears AA); the chosen row goes to full --ink. */
  :root[data-theme="studio"] .st-pdp-opt {
    /* Containing block for the row's visually-hidden "izbrano" text. */
    position: relative;
    display: flex; align-items: flex-start;
    gap: clamp(9px, 0.8vw, 16px);
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
  }
  /* SQUARE, and sharp (--r-ctrl): §9 keeps round for pills and arrows. */
  :root[data-theme="studio"] .st-pdp-box {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: var(--studio-pdp-box);
    block-size: var(--studio-pdp-box);
    /* Optical centering against the first line of a 1.625em-leading label. */
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
  /* The chosen state, driven purely by the data attribute the renderer emits.
   * The body rung is 400, so the escalation is to --w-body-med — the ramp's own
   * second prose weight, not a heavier one invented for the state. */
  :root[data-theme="studio"] .st-pdp-opt[data-on] {
    color: var(--ink);
    font-weight: var(--w-body-med);
  }
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
  /* ROUND (§9), and the LABEL rung: a pill is a chip, which is label copy.
   * Sentence case though, not uppercase — these labels are product copy
   * carrying prices ("Za 4 osebe — 1.990 €"), and caps would push them past
   * two-per-row at 390px. One line by construction (PILL_MAX_CHARS), so it
   * takes the tight label leading. */
  :root[data-theme="studio"] .st-pdp-pill {
    position: relative;
    display: inline-flex; align-items: center;
    padding: clamp(8px, 0.6vw, 12px) clamp(13px, 1.2vw, 24px);
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    background: var(--surface);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-mute);
  }
  /* Chosen = inverted fill. In a monochrome theme the only louder state than
   * a black hairline is a black ground (§4.7 uses the same escalation). No
   * weight change: the label rung is already 500 and the ramp's next weight up
   * is display-only, so the fill carries the state on its own. */
  :root[data-theme="studio"] .st-pdp-pill[data-on] {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
    color: var(--on-invert);
  }

  /* Honesty line under the configurator: says the selection is fixed and
   * gives the one channel that can change it. */
  :root[data-theme="studio"] .st-pdp-cfg-note {
    margin-top: clamp(14px, 1.2vw, 24px);
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
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

  /* ---- the gallery is a STACK ----------------------------------------- */
  :root[data-theme="studio"] .st-pdp-gallery {
    display: flex;
    flex-direction: column;
    gap: clamp(12px, 1.2vw, 24px);
  }
  /* Square, like the source's, rather than the 4/3 a single frame wanted:
   * stacked frames read as one column of equal tiles, and a square is the
   * shape a product cut out on a plain ground sits in without a wasted band
   * above and below it. */
  :root[data-theme="studio"] .st-pdp-gallery .st-pdp-frame {
    aspect-ratio: 1 / 1;
    border: var(--bw-line) solid var(--line);
  }
  /* object-fit: contain, not cover. These are studio shots of a product on a
   * plain ground, and cropping one to fill a square is how a tub loses a
   * corner. The frame's own grey is the ground the shot was taken on. */
  :root[data-theme="studio"] .st-pdp-photo {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }

  /* ---- finishes, quantity, the cart ----------------------------------- */
  :root[data-theme="studio"] .st-pdp-finish { margin-top: clamp(24px, 2.4vw, 44px); }
  :root[data-theme="studio"] .st-pdp-buyrow {
    display: flex;
    gap: clamp(10px, 1vw, 18px);
    margin-top: clamp(20px, 2vw, 36px);
  }
  :root[data-theme="studio"] .st-pdp-qty {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    border: var(--bw-line) solid var(--line-strong);
    border-radius: var(--r-ctrl);
    background: var(--surface);
  }
  /* The native spinner IS the stepper. Drawing plus and minus buttons would
   * mean two more controls to keep at 44px, two more focus rings, and a
   * keyboard story to rebuild — the input already has all of it, and arrow
   * keys already step it. */
  :root[data-theme="studio"] .st-pdp-qty input {
    inline-size: 76px;
    min-block-size: 52px;
    padding: 0 0 0 14px;
    border: 0;
    background: transparent;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-qty input:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: -2px;
    border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-pdp-add {
    flex: 1 1 auto;
    min-block-size: 52px;
    padding: 0 clamp(20px, 2vw, 40px);
    border: var(--bw-line) solid var(--ink-invert);
    border-radius: var(--r-ctrl);
    background: var(--ink-invert);
    color: var(--on-invert);
    cursor: pointer;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    transition: background-color .2s ease, color .2s ease;
  }
  :root[data-theme="studio"] .st-pdp-add:hover {
    background: transparent;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-add:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }

  /* ---- the assurance row: two by two ---------------------------------- */
  :root[data-theme="studio"] .st-pdp-assure {
    list-style: none; margin: clamp(22px, 2.2vw, 40px) 0 0; padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(14px, 1.4vw, 26px);
  }
  :root[data-theme="studio"] .st-pdp-assure-i {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-assure-i {
    flex: 0 0 auto;
    margin-top: 2px;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-assure-h {
    display: block;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-assure-s {
    display: block;
    margin-top: 3px;
    font-family: var(--f-body);
    font-size: var(--t-label);
    line-height: var(--lh-body);
    color: var(--ink-mute);
  }

  /* ---- collapsible panels --------------------------------------------- */
  :root[data-theme="studio"] .st-pdp-panels {
    margin-top: clamp(26px, 2.6vw, 48px);
    border-top: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-pdp-panel {
    border-bottom: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-pdp-panel summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-sm);
    min-block-size: 56px;
    padding-block: clamp(12px, 1.1vw, 18px);
    cursor: pointer;
    list-style: none;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-panel summary::-webkit-details-marker { display: none; }
  /* The chevron is drawn, not a marker glyph: a border-only square rotated
   * 45 degrees is one element and matches the hairline weight everywhere
   * else on the page. */
  :root[data-theme="studio"] .st-pdp-panel summary::after {
    content: "";
    flex: 0 0 auto;
    inline-size: 8px; block-size: 8px;
    margin-inline-end: 4px;
    border-inline-end: var(--bw-line) solid var(--ink-body);
    border-block-end: var(--bw-line) solid var(--ink-body);
    transform: translateY(-2px) rotate(45deg);
    transition: transform .18s ease;
  }
  :root[data-theme="studio"] .st-pdp-panel[open] summary::after {
    transform: translateY(2px) rotate(-135deg);
  }
  :root[data-theme="studio"] .st-pdp-panel summary:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: -2px;
    border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-pdp-panel-b {
    padding-bottom: clamp(14px, 1.4vw, 24px);
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-panel-b p { margin: 0; max-inline-size: 62ch; }

  /* ---- "ostali modeli" ------------------------------------------------- */
  :root[data-theme="studio"] .st-also {
    max-width: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding: var(--studio-rhythm) var(--studio-gutter) 0;
  }
  :root[data-theme="studio"] .st-also-h {
    margin: 0 0 clamp(26px, 2.6vw, 52px);
    text-align: center;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--ink);
  }
  /* The ruled row of §4.4: no gaps, a ring on each cell, overlapping edges
   * making the rules. */
  :root[data-theme="studio"] .st-also-row {
    list-style: none; margin: 0; padding: var(--bw-line);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
  }
  :root[data-theme="studio"] .st-also-cell { min-width: 0; }
  :root[data-theme="studio"] .st-also-card {
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 0.8vw, 14px);
    block-size: 100%;
    padding: clamp(16px, 1.6vw, 30px);
    box-shadow: 0 0 0 var(--bw-line) var(--st-ring, var(--line));
    text-decoration: none;
    transition: box-shadow .2s ease;
  }
  :root[data-theme="studio"] .st-also-card:hover,
  :root[data-theme="studio"] .st-also-card:focus-visible {
    --st-ring: var(--line-strong);
    position: relative;
    z-index: 1;
  }
  :root[data-theme="studio"] .st-also-frame {
    position: relative;
    display: block;
    aspect-ratio: 1 / 1;
    border-radius: var(--r-media);
    background: var(--bg-alt);
    overflow: hidden;
  }
  :root[data-theme="studio"] .st-also-name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-also-price {
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body-med);
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  @media (max-width: 809px) {
    :root[data-theme="studio"] .st-also-row { grid-template-columns: minmax(0, 1fr); }
    :root[data-theme="studio"] .st-pdp-assure { grid-template-columns: minmax(0, 1fr); }
  }

  /* ---- add-ons: the first REAL controls on this page ------------------
   *
   * The configurator above states a fixed configuration and tells you to ring
   * up for another. These are different: each one is a priced option the
   * supplier actually sells against this model, so they are real checkboxes
   * that move a real total.
   *
   * The input is visually hidden but never display:none — it stays in the tab
   * order and keeps its native semantics, and the drawn box is its :checked
   * sibling. Focus lands on the box because the input has no paint of its own.
   */
  :root[data-theme="studio"] .st-pdp-ao {
    margin-top: clamp(24px, 2.4vw, 48px);
    padding: 0;
    border: 0;
    min-inline-size: 0;
  }
  :root[data-theme="studio"] .st-pdp-ao-legend {
    padding: 0 0 clamp(8px, 0.7vw, 14px);
    inline-size: 100%;
    border-bottom: 1px solid var(--line);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-ao-list {
    list-style: none; margin: 0; padding: 0;
  }
  /* 44px minimum, per WCAG 2.5.8 — and these rows are the one place on the
   * page a mis-tap costs money. */
  :root[data-theme="studio"] .st-pdp-ao-lab {
    /* Containing block for the visually-hidden input, exactly as .st-pdp-opt
     * does for its hidden "izbrano". Without it the input's absolute box
     * resolves against <body>: it happens to land next to its label today
     * because it falls back to its static position, and it would fly to the
     * page corner the moment any ancestor gained a position. */
    position: relative;
    display: flex; align-items: flex-start;
    gap: clamp(9px, 0.8vw, 16px);
    min-block-size: 44px;
    padding-block: clamp(9px, 0.8vw, 14px);
    border-bottom: 1px solid var(--line);
    cursor: pointer;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-ao-in {
    position: absolute;
    inline-size: 1px; block-size: 1px;
    margin: 0; padding: 0; border: 0;
    clip-path: inset(50%);
    overflow: hidden; white-space: nowrap;
  }
  :root[data-theme="studio"] .st-pdp-ao-box {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: var(--studio-pdp-box);
    block-size: var(--studio-pdp-box);
    margin-top: 0.15em;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctrl);
    background: var(--surface);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-pdp-ao-box svg {
    inline-size: 68%; block-size: 68%;
    opacity: 0;
  }
  :root[data-theme="studio"] .st-pdp-ao-in:checked + .st-pdp-ao-box {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
  }
  :root[data-theme="studio"] .st-pdp-ao-in:checked + .st-pdp-ao-box svg { opacity: 1; }
  :root[data-theme="studio"] .st-pdp-ao-in:focus-visible + .st-pdp-ao-box {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
  :root[data-theme="studio"] .st-pdp-ao-lab:hover .st-pdp-ao-box {
    border-color: var(--ink-invert);
  }
  :root[data-theme="studio"] .st-pdp-ao-in:checked ~ .st-pdp-ao-name {
    color: var(--ink);
    font-weight: var(--w-body-med);
  }
  :root[data-theme="studio"] .st-pdp-ao-name { min-width: 0; }
  :root[data-theme="studio"] .st-pdp-ao-qty {
    color: var(--ink-mute);
  }
  /* Tabular figures so a column of prices lines up on its digits. */
  :root[data-theme="studio"] .st-pdp-ao-price {
    margin-inline-start: auto;
    padding-inline-start: var(--gap-sm);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  /* Group heading. The label rung again, but muted and without the hairline
   * the section legend carries — it divides, it does not announce. aria-hidden
   * because it is a visual grouping of controls that already name themselves;
   * a screen reader meeting "Osvetlitev" as a list item between checkboxes
   * learns nothing it cannot get from "LED osvetlitev roba". */
  :root[data-theme="studio"] .st-pdp-ao-head {
    padding-block: clamp(16px, 1.4vw, 26px) clamp(6px, 0.5vw, 10px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-pdp-ao-head:first-child { padding-top: clamp(8px, 0.7vw, 14px); }
  :root[data-theme="studio"] .st-pdp-ao-line {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: var(--gap-sm);
    margin-top: clamp(12px, 1.1vw, 22px);
    font-family: var(--f-body);
    font-size: var(--t-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    font-variant-numeric: tabular-nums;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-pdp-ao-total {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: var(--gap-sm);
    margin-top: clamp(8px, 0.7vw, 12px);
    padding-top: clamp(8px, 0.7vw, 12px);
    border-top: 1px solid var(--line-strong);
    font-family: var(--f-body);
    font-size: var(--t-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-ao-sum {
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    line-height: var(--lh-lead);
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-ao-note {
    margin-top: clamp(8px, 0.7vw, 14px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-mute);
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
    border-top: 1px solid var(--line);
  }
  :root[data-theme="studio"] .st-pdp-frow:first-child { border-top: 0; padding-top: 0; }
  /* Delivery rows are prose, both halves: the body rung, with the value at the
   * ramp's second prose weight so the row still has a loud half. */
  :root[data-theme="studio"] .st-pdp-frow dt {
    flex: 1 1 14ch; min-width: 0;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-frow dd {
    margin: 0; margin-left: auto;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    font-variant-numeric: tabular-nums;
    color: var(--ink);
    white-space: nowrap;
  }
  /* The accent as punctuation (§5.4): an included line is the only colored
   * text on the page. --acc-text is the L=0.45 rung, ≥4.9:1 on #ffffff at
   * every shop hue; --acc (L=0.62) would not clear 4.5:1 and is not used here. */
  :root[data-theme="studio"] .st-pdp-frow dd.st-pdp-inc { color: var(--acc-text); }
  /* Legal microcopy, and a wrapping sentence rather than a meta line, so it is
   * the body rung and not the label one — it stays quieter than the rows above
   * by colour (--ink-mute) and by the rule between them, not by being smaller.
   * The ramp has no rung under 16px for prose; inventing one is what this pass
   * exists to undo. */
  :root[data-theme="studio"] .st-pdp-note {
    margin-top: clamp(12px, 1.1vw, 22px);
    padding-top: clamp(12px, 1.1vw, 22px);
    border-top: 1px solid var(--line);
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
  }

  /* ---- spec: two-column hairline-ruled definition list ----------------- */
  :root[data-theme="studio"] .st-pdp-spec {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
    gap: var(--studio-pdp-col-gap);
    margin-top: var(--studio-rhythm);
  }
  /* h3 — a sub-section heading, one rung under the page's h2 title, and it
   * shares its row with the table it labels. The 68–72px / 600 / −0.025em this
   * rule carried was the measured pass; §1 has no negative tracking anywhere,
   * and h3's leading is 1.16em rather than the 1.05 that was eyeballed. */
  :root[data-theme="studio"] .st-pdp-spec-h {
    margin: clamp(10px, 1vw, 20px) 0 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h3);
    letter-spacing: var(--ls-h3);
    line-height: var(--lh-h3);
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
  /* Spec cells are the body rung on both sides; the term/value distinction is
   * carried by colour, which is how the ramp intends it — there is no separate
   * table rung in §1. */
  :root[data-theme="studio"] .st-pdp-srow dt {
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-pdp-srow dd {
    margin: 0;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  /* ---- §4.1 chrome language: the sticky buy bar ------------------------ */
  :root[data-theme="studio"] .st-pdp-bar {
    position: sticky;
    bottom: 0;
    z-index: 40;
    margin-top: var(--studio-rhythm);
    background: var(--ink-invert);
    color: var(--on-invert);
    /* A band, not a card: sharp edges, one hairline, no shadow — the chrome
     * bar's exact construction, mirrored. */
    border-top: 1px solid color-mix(in srgb, var(--on-invert) 10%, transparent);
  }
  :root[data-theme="studio"] .st-pdp-bar-in {
    max-width: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
    min-height: var(--chrome-h);
    display: flex; align-items: center;
    gap: clamp(10px, 1.4vw, 28px);
    padding-block: clamp(9px, 0.8vw, 16px);
  }
  /* The summary is chrome, not content: both halves are meta rows on a band,
   * so both take the label rung and the band's own face. */
  :root[data-theme="studio"] .st-pdp-sum {
    display: flex; align-items: baseline; flex-wrap: wrap;
    gap: 2px clamp(6px, 0.6vw, 12px);
    min-width: 0;
    font-family: var(--f-label);
  }
  :root[data-theme="studio"] .st-pdp-sum-name {
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert);
    /* One row at every width: the name gives way before the row wraps. */
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* #a8a8a8 on #0d0d0d = 8.9:1. Same rung as the name beside it — the two are
   * separated by colour, which is the only separation a chrome band gets. */
  :root[data-theme="studio"] .st-pdp-sum-cfg {
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert-mute);
    white-space: nowrap;
  }
  /* h6, the price rung, matching .st-pdp-now above: the bar restates the one
   * commercial number and restating it at a different rung would read as a
   * second, different price. It is a display rung, so the bar's number sets in
   * Clash Display while the summary beside it stays on the label rung. Its line
   * box (24 × 1.33em = 32px) plus this bar's padding runs a few px past
   * --chrome-h on desktop; the bar is min-height, so it grows rather than
   * clipping. */
  :root[data-theme="studio"] .st-pdp-bar-price {
    margin-left: auto;
    font-family: var(--f-display);
    font-size: var(--t-h6);
    font-weight: var(--w-display);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--on-invert);
  }
  /* SHARP white CTA (§3/§9) — the one live control on the page. A button label
   * is the label rung: DM Sans 14/500, tracked 0.06em, uppercase. */
  :root[data-theme="studio"] .st-pdp-cta {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    padding: clamp(11px, 1vw, 20px) clamp(16px, 2vw, 40px);
    background: var(--bg);
    border: 1px solid var(--bg);
    border-radius: var(--r-ctrl);
    text-decoration: none;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
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
    /* Gallery over buy column: below this width the frame and a 16px option
     * list cannot share a row without both losing. */
    :root[data-theme="studio"] .st-pdp-grid,
    :root[data-theme="studio"] .st-pdp-spec {
      grid-template-columns: minmax(0, 1fr);
    }
    :root[data-theme="studio"] .st-pdp-spec-h { max-width: none; }
  }
  @media (max-width: 560px) {
    /* 390px budget for the bar, re-costed on the ramp: 20px gutters leave
     * 350px. The CTA is now a flat 14px label (~122px with 14px padding) and
     * the price is h6's phone value, 22px (~85px), so with two 10px gaps the
     * name keeps ~113px — about fifteen characters before it ellipses, which
     * is what the ellipsis is there for. The configuration summary is the one
     * part that can be dropped without losing a fact the page has not already
     * stated above.
     * No letter-spacing override here any more: the label rung is 0.06em at
     * every width, and the 0.08em this block used to claw back was only ever
     * undoing an invented 0.12em. */
    :root[data-theme="studio"] .st-pdp-sum-cfg { display: none; }
    :root[data-theme="studio"] .st-pdp-bar-in { gap: 10px; }
    :root[data-theme="studio"] .st-pdp-cta { padding-inline: 14px; }
    /* A 3-up detail strip at 350px gives 110px frames — still readable as
     * frames, and it keeps the gallery one object instead of two. */
    :root[data-theme="studio"] .st-pdp-thumbs { gap: 8px; }
  }
  @media (max-height: 480px) {
    /* A landscape phone, or a desktop window squashed to a strip: a bar that
     * pins itself to the bottom of a 420px-tall viewport is eating a fifth of
     * the reading area for a summary of what is already on screen. It goes
     * back into the flow, and the scroll reserve above goes with it. */
    :root[data-theme="studio"] .st-pdp-bar { position: static; }
    :root[data-theme="studio"] { scroll-padding-bottom: 0; }
  }

  /* ==== §4.13 secondary-page devices ==================================== */
  /* The baseline measures two devices for the shop/listing page that no
   * module had yet built: the dark shop hero and the 380px filter sidebar.
   * They live here because they share this file's vocabulary — the sidebar IS
   * the configurator's label/hairline/square/pill set, reused class for class
   * rather than restyled. */

  /* ---- shop hero: dark band, 90px title left, product right ----------- */
  :root[data-theme="studio"] .st-shop-hero {
    /* Positioned so the media that bleeds past the band's bottom edge paints
     * OVER the section that follows instead of under it. */
    position: relative;
    z-index: 1;
    background: var(--ink-invert);
    color: var(--on-invert);
    padding-block: var(--studio-rhythm);
  }
  :root[data-theme="studio"] .st-shop-hero-in {
    max-width: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
    gap: clamp(28px, 4vw, 90px);
    align-items: end;
  }
  :root[data-theme="studio"] .st-shop-hero-eyebrow {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert-mute);
  }
  /* h1 — the listing page's one dominant statement, spanning a full-bleed dark
   * band, and the only h1-scale device in this file. §4.13 measured it at 90px,
   * which is within a hair of the ramp's 92; the ramp value is the real one.
   * The PDP title takes h2 for the reason given there. */
  :root[data-theme="studio"] .st-shop-hero-h {
    margin: clamp(14px, 1.4vw, 28px) 0 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h1);
    letter-spacing: var(--ls-h1);
    line-height: var(--lh-h1);
    color: var(--on-invert);
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The lead rung — a standfirst under the page title (§4.13's 21px is the
   * screenshot pass). --on-invert-mute is the rung tokens.ts carries for
   * exactly this: quiet against the band without dropping under AA. */
  :root[data-theme="studio"] .st-shop-hero-sub {
    margin: clamp(12px, 1.2vw, 24px) 0 0;
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--on-invert-mute);
    max-width: 46ch;
  }
  :root[data-theme="studio"] .st-shop-hero-media {
    position: relative;
    aspect-ratio: 4 / 3;
    /* THE BLEED: the product hangs below the band's bottom edge. */
    margin-bottom: calc(-1 * clamp(20px, 3.4vw, 76px));
  }
  /* Thin concentric outlines behind the product. They are drawn in the band's
   * white ink, so the rings simply stop existing where the media crosses onto
   * the page below — which is exactly how the source reads. */
  :root[data-theme="studio"] .st-shop-hero-ring {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    aspect-ratio: 1;
    border: 1px solid color-mix(in srgb, var(--on-invert) 18%, transparent);
    border-radius: var(--r-circle);
  }
  :root[data-theme="studio"] .st-shop-hero-ring:nth-child(1) { inline-size: 98%; }
  :root[data-theme="studio"] .st-shop-hero-ring:nth-child(2) { inline-size: 76%; }
  :root[data-theme="studio"] .st-shop-hero-ring:nth-child(3) { inline-size: 54%; }
  /* Photo-ready slot. Opaque mid grey, not a translucent wash: half of it
   * hangs over the white page below, and a wash would vanish there. */
  :root[data-theme="studio"] .st-shop-hero-mass {
    position: relative;
    z-index: 1;
    display: block;
    margin-inline: auto;
    inline-size: 62%;
    block-size: 100%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--on-invert) 22%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--tile-mid) 82%, var(--ink-invert)),
      color-mix(in srgb, var(--tile-mid) 48%, var(--ink-invert))
    );
  }
  :root[data-theme="studio"] .st-shop-hero-cap {
    position: absolute; z-index: 2;
    top: 0; left: 0;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--on-invert-mute);
  }

  /* ---- filter sidebar: 380px column ----------------------------------- */
  /* Presentation only, and honest about it: every row is a LINK to a page
   * that exists. Nothing here filters, so nothing here is a checkbox — the
   * squares and pills are the measured vocabulary, marked aria-hidden, and
   * the labels are the link text. */
  :root[data-theme="studio"] .st-filters {
    inline-size: 100%;
    max-inline-size: 380px;
    display: flex; flex-direction: column;
    gap: clamp(20px, 2vw, 40px);
  }
  :root[data-theme="studio"] .st-filters a.st-pdp-opt,
  :root[data-theme="studio"] .st-filters a.st-pdp-pill {
    text-decoration: none;
    transition: color 0.2s ease, border-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-filters a.st-pdp-opt:hover { color: var(--ink); }
  :root[data-theme="studio"] .st-filters a.st-pdp-opt:hover .st-pdp-box {
    border-color: var(--ink);
  }
  :root[data-theme="studio"] .st-filters a.st-pdp-pill:hover {
    border-color: var(--line-strong);
    color: var(--ink);
  }
  /* Sharp ring on the row (it carries a word), round on the pill (§3/§9). */
  :root[data-theme="studio"] .st-filters a.st-pdp-opt:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-filters a.st-pdp-pill:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    border-radius: var(--r-pill);
  }

  @media (max-width: 900px) {
    /* Title over product, and the bleed goes away with the two-column layout:
     * a stacked media that hangs into the next section reads as a mistake. */
    :root[data-theme="studio"] .st-shop-hero-in { grid-template-columns: minmax(0, 1fr); }
    :root[data-theme="studio"] .st-shop-hero-media { margin-bottom: 0; }
    :root[data-theme="studio"] .st-filters { max-inline-size: none; }
  }

  /* ---- motion ---------------------------------------------------------- */
  @media (prefers-reduced-motion: reduce) {
    /* Nothing here animates position, so the readable static state is the
     * resting one: no transitions, no residual transform. The buy bar keeps
     * its sticky position — that is layout, not motion. */
    :root[data-theme="studio"] .st-pdp-cta,
    :root[data-theme="studio"] .st-pdp-cfg-note a,
    :root[data-theme="studio"] .st-filters a.st-pdp-opt,
    :root[data-theme="studio"] .st-filters a.st-pdp-pill {
      transition: none;
      transform: none;
    }
  }
`;

/**
 * A pill must hold its label on ONE line. Groups whose longest option exceeds
 * this render as the §4.13 checkbox list instead, where a label may wrap
 * freely.
 *
 * The 24 was costed against a 12.5px floor that no longer exists: the pill is
 * now the label rung, a flat 14px DM Sans, so the ~145px a two-up row leaves at
 * 390px buys ~20 characters rather than ~24. A group sitting right on the limit
 * therefore packs one pill per row on a narrow phone instead of two — it wraps,
 * it does not overflow, and every pill still holds its label on one line, which
 * is the invariant this constant actually protects.
 *
 * The number stays at 24 regardless: lowering it would move groups from the
 * pill shape to the checkbox shape, which changes the DOM this page emits, and
 * that is a layout decision rather than a type one. Flagged here so it is
 * decided deliberately and not as a side effect of the ramp.
 */
const PILL_MAX_CHARS = 24;

/** Code-point length — Slovenian č/š/ž must count as one character. */
function len(s: string): number {
  return Array.from(s).length;
}

function usesPills(options: readonly string[]): boolean {
  return options.every((o) => len(o) <= PILL_MAX_CHARS);
}

/**
 * Photo-ready slot — the shop's product drawing, or a bordered mass where
 * there is none. Never an image request.
 *
 * commerce.ts and hero.ts were given the drawings; this file was not, so the
 * page where somebody decides to spend three thousand euro showed four empty
 * grey boxes — the big frame and all three thumbnails. It is the one page on
 * the site whose entire job is to show the product.
 *
 * `variant` cycles the presentations so the thumbnail strip reads as three
 * views rather than the same picture three times. A photograph replaces this
 * at one call site.
 */
function shot(ctx: RenderCtx, variant = 0, photo?: PdpPhoto): string {
  if (photo) {
    return (
      '<span class="st-pdp-shot">' +
      productImg(photo, "st-pdp-shot-img", "(max-width: 809px) 92vw, 400px", photo.alt) +
      "</span>"
    );
  }
  const art = productArt(ctx.shop.key, variant);
  return (
    '<span class="st-pdp-shot" aria-hidden="true">' +
    (art ? '<span class="st-pdp-shot-art">' + art + "</span>" : '<span class="st-pdp-shot-mass"></span>') +
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
 * "Ostali modeli" — the source's "You may also like", built from the shop's
 * own range rather than a recommendation engine.
 *
 * Three cards, the models nearest this one in the catalogue order, which is
 * ordered by shell size and jet count — so the neighbours really are the
 * closest alternatives rather than three arbitrary rows. A shop with no
 * catalogue renders nothing at all instead of an empty band.
 */
function alsoLike(ctx: RenderCtx): string {
  const all = ctx.content.pdps ?? [];
  if (all.length < 2) return "";
  const here = all.findIndex((x) => x.slug === ctx.pdp.slug);
  const rest = all.filter((_, i) => i !== here);
  const start = Math.min(Math.max(0, here - 1), Math.max(0, rest.length - 3));
  const picks = rest.slice(start, start + 3);
  if (picks.length === 0) return "";

  const base = ctx.shop.routeSlugs["/product"] + "/";
  return (
    '<section class="st-also" aria-labelledby="st-also-h">' +
    '<h2 class="st-also-h" id="st-also-h">Ostali modeli</h2>' +
    '<ul class="st-also-row">' +
    picks
      .map(
        (m, i) =>
          '<li class="st-also-cell"><a class="st-also-card" href="' +
          esc(base + m.slug + ctx.q) + '">' +
          '<span class="st-also-frame">' + shot(ctx, i, m.photos?.[0]) + "</span>" +
          '<span class="st-also-name">' + esc(m.title) + "</span>" +
          '<span class="st-also-price">' + esc(m.price) + "</span>" +
          "</a></li>",
      )
      .join("") +
    "</ul></section>"
  );
}

/**
 * The gallery: the model's own photographs where they exist, the shop's
 * drawing where they do not.
 *
 * Not a mixture. A model with two real pictures and a drawing to pad the
 * column would present the drawing as a third view of the product, which it
 * is not — and the caption that qualifies the drawing would then be sitting
 * under photographs it does not apply to.
 *
 * The first frame is eager and high priority: it is the largest element above
 * the fold on this page and the one LCP is measured against.
 */
function gallery(ctx: RenderCtx): string {
  const photos = ctx.pdp.photos ?? [];
  if (photos.length > 0) {
    // The gallery column is ~700px at 1440 and full width once it stacks.
    const sizes = "(max-width: 1000px) 100vw, 46vw";
    return photos
      .map(
        (p, i) =>
          '<figure class="st-pdp-frame">' +
          productImg(p, "st-pdp-photo", sizes, p.alt, i === 0) +
          "</figure>",
      )
      .join("");
  }
  return (
    '<figure class="st-pdp-frame">' + shot(ctx, 0) +
    '<figcaption class="st-pdp-cap">Vizualizacija — fotografije v pripravi</figcaption>' +
    "</figure>" +
    '<span class="st-pdp-frame" aria-hidden="true">' + shot(ctx, 1) + "</span>" +
    '<span class="st-pdp-frame" aria-hidden="true">' + shot(ctx, 2) + "</span>"
  );
}

/**
 * The PDP body — gallery left, buy column right, spec beneath, sticky buy bar.
 *
 * Consumes exactly what renderPdpBody() consumes (ctx.pdp: eyebrow,
 * title, sub, price, cfg, freight, note, spec, bar), so the two renderers are
 * interchangeable per theme with no content-layer change.
 */
export function renderStudioPdp(ctx: RenderCtx): string {
  const d = ctx.pdp;
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

  // Add-ons. Real controls, unlike the configurator above: each one is a
  // priced option the supplier sells against this model.
  //
  // The total is server-rendered at the base price and upgraded by
  // behaviour.ts as boxes are ticked. Without script the page is still
  // correct — the shell's price is right and every option's price is beside
  // it — which is the same contract the counters and the rail keep.
  const priced = (d.addons ?? []).filter((x) => x.priceCents > 0);
  const all = d.addons ?? [];

  // Grouped, in ADDON_GROUP_ORDER, with anything ungrouped kept first so a
  // shop that never set a group still renders every option it has.
  const order = [
    ...new Set([undefined as string | undefined, ...ADDON_GROUP_ORDER, ...all.map((x) => x.group)]),
  ];
  const rowNo = { n: 0 };
  const groups = order
    .map((g) => {
      const rows = all.filter((x) => x.group === g);
      if (rows.length === 0) return "";
      const head = g ? '<li class="st-pdp-ao-head" aria-hidden="true">' + esc(g) + "</li>" : "";
      return (
        head +
        rows
          .map((x) => {
            rowNo.n += 1;
            const id = "st-ao-" + String(rowNo.n);
            return (
              '<li><label class="st-pdp-ao-lab" for="' + id + '">' +
              '<input class="st-pdp-ao-in" type="checkbox" id="' + id + '"' +
              ' name="' + esc(x.key) + '" data-st-addon' +
              ' value="' + String(x.priceCents) + '">' +
              '<span class="st-pdp-ao-box">' + CHECK + "</span>" +
              '<span class="st-pdp-ao-name">' + esc(x.label) +
              (x.qty ? ' <span class="st-pdp-ao-qty">' + esc(x.qty) + "</span>" : "") +
              "</span>" +
              '<span class="st-pdp-ao-price">' + esc(x.price) + "</span>" +
              "</label></li>"
            );
          })
          .join("")
      );
    })
    .join("");

  // The summary. An earlier version printed one line — "Skupaj z izbrano
  // opremo" — directly under a list whose default state is nothing selected,
  // so it repeated the price at the top of the column verbatim and read as a
  // rendering fault rather than as a sum. The extras line is what makes the
  // arithmetic legible: it says 0 € until something is ticked, which explains
  // why the two figures match.
  const addons =
    all.length === 0
      ? ""
      : '<fieldset class="st-pdp-ao" data-st-addons>' +
        '<legend class="st-pdp-ao-legend">Dodatna oprema</legend>' +
        '<ul class="st-pdp-ao-list">' + groups + "</ul>" +
        (priced.length > 0 && d.priceCents > 0
          ? '<p class="st-pdp-ao-line"><span>Izbrana oprema</span>' +
            '<span data-st-extras>' + esc(formatEur(0)) + "</span></p>" +
            '<p class="st-pdp-ao-total"><span>Skupaj</span>' +
            '<span class="st-pdp-ao-sum" data-st-total data-st-base="' +
            String(d.priceCents) + '">' + esc(d.price) + "</span></p>"
          : "") +
        (d.pricesProvisional
          ? '<p class="st-pdp-ao-note">Cene so informativne in še niso dokončne.</p>'
          : "") +
        "</fieldset>";

  // The assurance row: four promises, two by two, each an icon over a label
  // and a sub-line. The source runs delivery / returns / payment / help, and
  // so does this — with the shop's own promises rather than four invented
  // ones.
  const ICONS = [truckIcon(), returnIcon(), shieldIcon(), helpIcon()];
  const assure = (d.assure ?? []).length
    ? '<ul class="st-pdp-assure">' +
      (d.assure ?? [])
        .map(
          (a, i) =>
            '<li class="st-pdp-assure-i">' +
            (ICONS[i % ICONS.length] ?? "") +
            '<span><span class="st-pdp-assure-h">' + esc(a[0]) + "</span>" +
            '<span class="st-pdp-assure-s">' + esc(a[1]) + "</span></span></li>",
        )
        .join("") +
      "</ul>"
    : "";

  // Collapsible sections. <details>/<summary> rather than a scripted
  // accordion: it opens with no JavaScript, it is in the tab order for free,
  // and a screen reader already knows what an expandable section is. The
  // chevron is the summary's own marker, restyled.
  //
  // The specification is always the first panel and is BUILT from the model
  // rather than written, so it cannot drift from the spec table's source.
  const specRows = d.spec
    .map((row) => '<div class="st-pdp-srow"><dt>' + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd></div>")
    .join("");
  const panels =
    '<div class="st-pdp-panels">' +
    '<details class="st-pdp-panel" open><summary>Tehnični podatki</summary>' +
    '<div class="st-pdp-panel-b"><dl class="st-pdp-spec-table">' + specRows + "</dl></div></details>" +
    (d.panels ?? [])
      .map(
        (x) =>
          '<details class="st-pdp-panel"><summary>' + esc(x[0]) + "</summary>" +
          '<div class="st-pdp-panel-b"><p>' + esc(x[1]) + "</p></div></details>",
      )
      .join("") +
    "</div>";

  // Finish names, not swatches — see catalog/pola.ts for why inventing a hex
  // for "Ocean Wave" would be a picture of the goods nobody has seen.
  const finishes = (d.finishes ?? []).length
    ? '<div class="st-pdp-finish"><h2 class="st-pdp-glabel" id="st-pdp-fin">Barve školjke</h2>' +
      '<ul class="st-pdp-pills" aria-labelledby="st-pdp-fin">' +
      (d.finishes ?? [])
        .map((f) => '<li class="st-pdp-pill">' + esc(f) + "</li>")
        .join("") +
      "</ul></div>"
    : "";

  // Quantity and the cart. The stepper is a real number input inside a real
  // form that GETs the cart route with what was chosen — there is no cart yet,
  // so it lands on the cart page rather than pretending to add anything. A
  // stepper wired to nothing would be a control that lies.
  const buy =
    '<form class="st-pdp-buyrow" method="get" action="' +
    esc(ctx.shop.routeSlugs["/cart"]) + '">' +
    '<input type="hidden" name="model" value="' + esc(d.slug) + '">' +
    '<span class="st-pdp-qty">' +
    '<label class="st-pdp-vh" for="st-pdp-q">Količina</label>' +
    '<input id="st-pdp-q" name="qty" type="number" value="1" min="1" max="9" step="1" inputmode="numeric">' +
    "</span>" +
    '<button class="st-pdp-add" type="submit">' + esc(d.bar[3]) + "</button>" +
    "</form>";

  const freight = d.freight
    .map(
      (r) =>
        '<div class="st-pdp-frow"><dt>' + esc(r[0]) + "</dt>" +
        "<dd" + (r[2] ? ' class="st-pdp-inc"' : "") + ">" + esc(r[1]) + "</dd></div>",
    )
    .join("");

  return (
    '<section class="st-pdp">' +
    '<div class="st-pdp-in">' +

    '<div class="st-pdp-grid">' +
    // --- gallery: a STACK of large frames, which is what the source does.
    // A big frame over a strip of three small ones puts the product at
    // thumbnail size three times; a stack shows it three times at a size
    // worth looking at, and the buy column scrolls alongside.
    '<div class="st-pdp-gallery"' +
    ((ctx.pdp.photos ?? []).length ? " data-photos" : "") + ">" +
    gallery(ctx) + "</div>" +

    // --- buy column ---
    '<div class="st-pdp-buy">' +
    '<p class="st-pdp-eyebrow">' + esc(d.eyebrow) + "</p>" +
    '<h1 class="st-pdp-title">' + esc(d.title) + "</h1>" +
    // Price directly under the title, as the source has it. It used to sit
    // below the paragraph, which buried the one number the page is about.
    '<p class="st-pdp-price">' +
    // The struck price's only cue is the line through it, and most screen
    // readers announce neither <s> nor text-decoration — so the row would read
    // as two unqualified prices, the higher one last. A hidden word inside
    // each carries the distinction into the accessibility tree (commerce.ts
    // does the same on the card).
    '<span class="st-pdp-now"><span class="st-pdp-vh">cena </span>' +
    esc(d.price) + "</span>" +
    (was
      ? '<s class="st-pdp-was"><span class="st-pdp-vh">prejšnja cena </span>' +
        esc(was) + "</s>"
      : "") +
    '<span class="st-pdp-vat">z DDV</span>' +
    "</p>" +
    '<p class="st-pdp-sub">' + esc(d.sub) + "</p>" +
    finishes +
    buy +
    assure +
    (cfg
      ? '<div class="st-pdp-cfg">' + cfg + "</div>" +
        '<p class="st-pdp-cfg-note">Prikazana je izbrana konfiguracija. ' +
        'Za drugo kombinacijo nas, prosimo, pokličite na <a href="' +
        esc(ctx.phoneHref) + '">' +
        esc(ctx.phoneDisplay) + "</a>.</p>"
      : "") +
    addons +
    panels +
    '<section class="st-pdp-freight" aria-labelledby="st-pdp-fh">' +
    '<h2 class="st-pdp-glabel" id="st-pdp-fh">Dostava in montaža</h2>' +
    '<dl class="st-pdp-frows">' + freight + "</dl>" +
    '<p class="st-pdp-note">' + esc(d.note) + "</p>" +
    "</section>" +
    "</div></div>" +

    "</div>" +
    // --- the rest of the range, as the source's "you may also like" ---
    renderStudioTestimonials(ctx) +
    alsoLike(ctx) +

    // --- §4.1 chrome band as the sticky buy bar ---
    // The CTA goes to the cart route, which is what its label says (bar[3]);
    // chrome.ts's basket button points at the same slug.
    '<div class="st-pdp-bar"><div class="st-pdp-bar-in">' +
    '<span class="st-pdp-sum">' +
    '<span class="st-pdp-sum-name">' + esc(d.bar[0]) + "</span>" +
    '<span class="st-pdp-sum-cfg">' + esc(d.bar[1]) + "</span>" +
    "</span>" +
    // Same figure, same hook: a bar that keeps showing the base price while
    // the total above it has moved is worse than a bar with no price.
    '<span class="st-pdp-bar-price"' +
    (priced.length > 0 && d.priceCents > 0
      ? ' data-st-total data-st-base="' + String(d.priceCents) + '"'
      : "") +
    ">" + esc(d.bar[2]) + "</span>" +
    '<a class="st-pdp-cta" href="' + esc(ctx.shop.routeSlugs["/cart"] + ctx.q) + '">' +
    esc(d.bar[3]) + "</a>" +
    "</div></div>" +
    "</section>"
  );
}

/* ==== §4.13 secondary-page devices ====================================== */

/** Slovenian sentence case: only the first letter, and via the shop's locale. */
function upperFirst(s: string, locale: string): string {
  const first = Array.from(s)[0];
  return first ? first.toLocaleUpperCase(locale) + s.slice(first.length) : s;
}

/**
 * §4.13 — the shop hero.
 *
 * "Dark band, page title 90px left with 21px sub; product photo right with
 * thin white circle outlines behind it, bleeding below the band." The px are
 * §4's screenshot pass; the band takes §1's h1 and lead rungs, which is the
 * same reading of the device at the transcribed sizes.
 *
 * Copy comes from what the shop already states about itself — the keyword's
 * plural is the listing page's title in every one of these stores, and the
 * kicker/sub are the shop's own hand-written lines — so nothing here is
 * templated prose and no caller has to invent a heading. Both are overridable
 * for the pages that carry their own.
 */
export function renderStudioShopHero(ctx: RenderCtx, title?: string, sub?: string): string {
  const s = ctx.shop;
  const h = title ?? upperFirst(s.keyword.plural, s.locale.intl);
  const p = sub ?? ctx.content.sub;

  return (
    '<section class="st-shop-hero"><div class="st-shop-hero-in">' +
    "<div>" +
    '<p class="st-shop-hero-eyebrow">' + esc(ctx.content.kicker) + "</p>" +
    '<h1 class="st-shop-hero-h">' + esc(h) + "</h1>" +
    '<p class="st-shop-hero-sub">' + esc(p) + "</p>" +
    "</div>" +
    // Decorative throughout: the rings and the mass carry no fact, and the
    // caption states what the reader is actually looking at.
    '<div class="st-shop-hero-media">' +
    '<span class="st-shop-hero-cap">Vizualizacija — fotografije v pripravi</span>' +
    '<span class="st-shop-hero-ring" aria-hidden="true"></span>' +
    '<span class="st-shop-hero-ring" aria-hidden="true"></span>' +
    '<span class="st-shop-hero-ring" aria-hidden="true"></span>' +
    '<span class="st-shop-hero-mass" aria-hidden="true"></span>' +
    "</div>" +
    "</div></section>"
  );
}

/**
 * §4.13 — the 380px filter sidebar.
 *
 * "Uppercase label + hairline, square 22px checkboxes with 19px labels, and
 * availability as outlined round pills." The 22px box is geometry and stands;
 * the 19px is §4's screenshot pass, and the rows take §1's body rung — they
 * reuse the configurator's classes, so they take its type with them.
 *
 * This Worker ships no JS and the catalogue has no query-parameter filtering,
 * so a checkbox here could not filter anything — and a control that cannot act
 * is worse than no control. The device is therefore rendered as what it can
 * honestly be: a column of LINKS to pages that exist, wearing the measured
 * vocabulary. The square markers and the pill outlines are the decoration;
 * the link text is the content. It reuses the configurator's classes rather
 * than restyling them, because it is literally the same device.
 *
 * When real filtering lands, the rows become <a> elements pointing at filtered
 * URLs — the markup shape does not change.
 */
export function renderStudioFilters(ctx: RenderCtx): string {
  const s = ctx.shop;
  const c = ctx.content;

  /** Escaped, dev-query-carrying href for one internal route. */
  const href = (k: keyof typeof s.routeSlugs): string => esc(s.routeSlugs[k] + ctx.q);

  // Square-marker rows: the shop's own sections, in the order the chrome nav
  // states them, so the sidebar and the bar never disagree.
  const rows: readonly (readonly [string, string])[] = [
    [href("/products"), c.nav[0]],
    [href("/compare"), c.nav[1]],
    [href("/guides"), c.nav[2]],
    [href("/financing"), "Financiranje"],
  ] as const;

  // Round pills: availability, as the baseline has it — each one a service the
  // shop actually offers, linking to the page that spells it out.
  const pills: readonly (readonly [string, string])[] = [
    [href("/delivery"), "Dostava in montaža"],
    [href("/showroom"), "Ogled v salonu"],
    [href("/faq"), "Pogosta vprašanja"],
  ] as const;

  const box = '<span class="st-pdp-box" aria-hidden="true">' + CHECK + "</span>";

  return (
    '<aside class="st-filters" aria-label="Razdelki trgovine">' +
    "<div>" +
    '<h2 class="st-pdp-glabel" id="st-filters-a">Ponudba</h2>' +
    '<ul class="st-pdp-opts" aria-labelledby="st-filters-a">' +
    rows
      .map(
        ([h, label]) =>
          '<li><a class="st-pdp-opt" href="' + h + '">' + box +
          "<span>" + esc(label) + "</span></a></li>",
      )
      .join("") +
    "</ul></div>" +
    "<div>" +
    '<h2 class="st-pdp-glabel" id="st-filters-b">Razpoložljivost</h2>' +
    '<ul class="st-pdp-pills" aria-labelledby="st-filters-b">' +
    pills
      .map(
        ([h, label]) =>
          '<li><a class="st-pdp-pill" href="' + h + '">' + esc(label) + "</a></li>",
      )
      .join("") +
    "</ul></div>" +
    "</aside>"
  );
}
