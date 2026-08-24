/**
 * STUDIO — chrome bar and footer (docs/STUDIO-BASELINE.md §4.1 and §4.12).
 *
 *   §4.1  Black 90px bar: wordmark left at the 54px gutter, 5-item nav
 *         centred, two Ø46px circular icon buttons on a #2A2A2A disc right.
 *   §4.12 Black footer: giant ~150px wordmark at a LIGHTER weight than the
 *         bar's, newsletter with an underlined input, brand blurb + circular
 *         contact rows, three link columns, hairline, legal line.
 *
 * Scale: the px quoted from §4 above are the MEASURED pass, kept as provenance
 * only. Type does not interpolate any more — tokens.ts sets every role per
 * breakpoint tier (≥1200 / 810–1199 / ≤809), so a size is a token lookup, not
 * a clamp, and the measured numbers land on ramp rungs instead of reproducing
 * themselves: the bar's wordmark read ~28 and is h6 (24/19/22), the nav read
 * 15 and is label (14), the footer's link columns read 19 and are label too.
 * Only the non-type dimensions — discs, gutters, gaps, padding — still clamp,
 * and one display outlier does (see .st-foot-mark).
 *
 * Token discipline: colors, radii, gutters, chrome height and every type value
 * — face, size, weight, tracking, leading — are var(--…) from tokens.ts only;
 * this module declares no variable of its own. Every selector is scoped to
 * :root[data-theme="studio"] because the sheet is shared with the other three
 * themes.
 */

import { esc, type RenderCtx } from "../../render/sections";
import { searchIcon, basketIcon } from "./icons";

/* ---- inline line icons ----------------------------------------------- */
/* 24px grid, stroke-only, currentColor. The chrome's magnifier and basket are
 * NOT here: icons.ts is the icon set's one home, and a second hand-drawn pair
 * meant the bar and the rest of the theme could drift apart glyph by glyph.
 * What remains is the footer's contact/affordance set, which icons.ts does not
 * carry. */
type IconKey = "mail" | "phone" | "pin" | "arrow";

const ICON_PATHS: Record<IconKey, string> = {
  mail:
    '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.7 6.9 8.3 5.9 8.3-5.9"/>',
  phone:
    '<path d="M6.4 3.8h3l1.5 3.7-2 1.4a11.5 11.5 0 0 0 5.2 5.2l1.4-2 3.7 1.5v3a1.6 1.6 0 0 1-1.7 1.6A15.6 15.6 0 0 1 4.8 5.5a1.6 1.6 0 0 1 1.6-1.7Z"/>',
  pin:
    '<path d="M12 21s6.4-6 6.4-11a6.4 6.4 0 1 0-12.8 0C5.6 15 12 21 12 21Z"/><circle cx="12" cy="10" r="2.4"/>',
  arrow: '<path d="M4 12h14.5"/><path d="m12.8 6.2 5.8 5.8-5.8 5.8"/>',
};

function icon(k: IconKey): string {
  return (
    '<svg class="st-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" ' +
    'fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    ICON_PATHS[k] +
    "</svg>"
  );
}

export const STUDIO_CHROME_CSS = `
  /* No :root token block here. --studio-gutter, --studio-gutter, --chrome-h,
   * --on-invert-16, --w-display and --w-body all live in tokens.ts; a second copy at
   * equal specificity meant sheet order, not the spec, decided the value. */

  /* Visually hidden until focused — used by the skip link and the newsletter
   * field's label. clip-path over the old clip-rect hack: it survives
   * transforms and does not leave a 1px scroll artefact. */
  :root[data-theme="studio"] .st-vh {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }

  /* ---- §4.1 chrome bar ---- */
  :root[data-theme="studio"] .st-chrome {
    background: var(--ink-invert);
    color: var(--on-invert);
    /* The wordmark band and hero sit flush under it; the hairline keeps the
     * bar legible where a dark section follows a dark bar. */
    border-bottom: 1px solid color-mix(in srgb, var(--on-invert) 10%, transparent);
  }
  :root[data-theme="studio"] .st-chrome-bar {
    /* --studio-container (1900px) is the CONTENT measure, and box-sizing here is
     * border-box: capping the box at 1900 and then padding it inward left the
     * wordmark ~54px inboard of the measured x=54. The padding is added to the
     * cap — gutter left + inset-r right, the two the bar actually uses — so
     * the content between them is exactly 1900px. */
    max-width: calc(var(--studio-container) + var(--studio-gutter) + var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter) var(--studio-gutter);
    min-height: var(--chrome-h);
    display: grid;
    /* 1fr | auto | 1fr keeps the nav optically centred on the VIEWPORT even
     * when the wordmark and the icon cluster differ in width. */
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: clamp(12px, 2vw, 32px);
  }

  /* The logotype takes h6 (24/19/22) — the display ramp's smallest rung and the
   * nearest to the measured ~28px; h5 (32) would out-scale a 56px bar. Its
   * 1.33em leading draws a 32px line box, which --chrome-h absorbs as a
   * min-height, so taking the ramp's leading does not grow the bar. */
  :root[data-theme="studio"] .st-chrome-mark {
    justify-self: start;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    text-transform: uppercase;
    text-decoration: none;
    /* ONE white word: studio drops the accent split the other themes use. */
    color: var(--on-invert);
    white-space: nowrap;
  }

  /* The halves are separate spans around a real space, so the accessible name
   * is "Masažni Fotelj" rather than the nonsense token "MasažniFotelj".
   *
   * The space is TIGHT BUT PRESENT, not zero. The source brand is a single
   * word (FURNEXA), so closing the join exactly was right there and wrong
   * here: every shop on this network has a two-word name, and set solid they
   * read as a typo ("MASAŽNIFOTELJ") rather than as a logotype.
   *
   * The gap is an inline-block of explicit width rather than a scaled space
   * glyph: at 0.25em the space rendered under 2px and the words still ran
   * together. Width is set here so the mark's spacing does not depend on how
   * wide the face happens to draw U+0020.
   *
   * The two bare numbers below are mechanics, not type: the width IS the gap,
   * and letter-spacing:0 stops the mark's own tracking being added to it.
   * Both display roles the mark uses track at 0em today, so the reset is
   * belt-and-braces — it keeps the gap fixed if either rung ever tracks. */
  :root[data-theme="studio"] .st-mark-gap {
    display: inline-block;
    inline-size: 0.3em;
    font-size: inherit;
    letter-spacing: 0;
    overflow: hidden;
  }

  :root[data-theme="studio"] .st-chrome-nav {
    justify-self: center;
    display: flex;
    align-items: center;
    gap: clamp(16px, 2.8vw, 56px);
  }
  :root[data-theme="studio"] .st-chrome-nav a {
    /* Label role — 14px DM Sans, uppercase, tracked 0.06em. Its 1.71em leading
     * is exactly the 24px --chrome-line that --chrome-h is derived from, so the
     * nav is the thing that makes the bar's height come out right. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label);
    text-transform: uppercase;
    text-decoration: none;
    white-space: nowrap;
    /* Full on-invert, not the muted rung: 14px tracked caps on #151515 needs
     * every point of contrast it can get. */
    color: var(--on-invert);
    padding-block: 4px;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-chrome-nav a:hover { border-bottom-color: var(--on-invert); }

  :root[data-theme="studio"] .st-chrome-actions {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: clamp(8px, 0.8vw, 14px);
  }
  /* Ø46px disc. Round because it is an icon control, not a CTA — sharp
   * corners are reserved for buttons that carry a word (§3). */
  :root[data-theme="studio"] .st-chrome-btn {
    position: relative;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: clamp(36px, 2.3vw, 46px);
    block-size: clamp(36px, 2.3vw, 46px);
    border-radius: var(--r-circle);
    border: 0;
    background: var(--on-invert-16);
    color: var(--on-invert);
    text-decoration: none;
    transition: background-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-chrome-btn:hover {
    background: color-mix(in srgb, var(--on-invert) 22%, var(--ink-invert));
  }
  /* The glyphs come from icons.ts and carry no chrome-local class, so the
   * sizing hangs off the element, not a class name. */
  :root[data-theme="studio"] .st-chrome-btn svg {
    inline-size: clamp(17px, 1.05vw, 21px);
    block-size: clamp(17px, 1.05vw, 21px);
  }
  /* The base sheet's focus ring forces border-radius:4px, which would square
   * off a circular control mid-focus. Restore the pill here. */
  :root[data-theme="studio"] .st-chrome-btn:focus-visible {
    outline: 2px solid var(--on-invert);
    outline-offset: 3px;
    border-radius: var(--r-circle);
  }

  /* Count badge: small white disc, black numeral (measured). */
  :root[data-theme="studio"] .st-chrome-badge {
    position: absolute; top: -3px; right: -3px;
    min-inline-size: 18px; block-size: 18px;
    padding-inline: 5px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: var(--r-circle);
    background: var(--bg);
    color: var(--ink);
    /* Badges are the label role, and the ramp has nothing below it — 14px is
     * larger than the measured 10.5px, and the tight leading's 20px line box
     * overruns the 18px disc by a pixel top and bottom, which a single centred
     * numeral hides. Inventing a smaller size is the exact thing this pass
     * exists to undo, so the disc absorbs the rung instead. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    font-variant-numeric: tabular-nums;
  }

  /* The phone number, shown below 720px ALONGSIDE the basket — not instead of
   * the icon cluster: only the magnifier steps aside there. */
  :root[data-theme="studio"] .st-chrome-tel {
    display: none;
    align-items: center; gap: 8px;
    /* A meta row in the bar, so the same label rung as the nav — both draw the
     * 24px line the bar is built on, and the number stays distinct from the
     * nav by weight of position, not by an off-ramp size. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label);
    text-decoration: none;
    color: var(--on-invert);
    white-space: nowrap;
  }
  :root[data-theme="studio"] .st-chrome-tel .st-ico { inline-size: 16px; block-size: 16px; }

  /* Skip link: off-screen until focused, then a white plate. Its corners are
   * --r-ctrl — 4px, the radius the transcribed source gives every control that
   * carries a word (§3), not the 0 an earlier reading had here; it is restated
   * on :focus-visible below because the base sheet's focus ring imposes its
   * own. Its ring is --acc rather than the primary ink — a black ring around a
   * white plate ON THE BLACK BAR is invisible, and the plate landing on the
   * page cannot be the only focus cue. */
  :root[data-theme="studio"] .st-skip {
    position: absolute; left: -9999px; top: 0; z-index: 50;
    background: var(--bg); color: var(--ink);
    /* It carries a word on a control, so it is a button label: the label rung,
     * tight leading, because the plate's height is its padding's business. */
    font-family: var(--f-label); font-size: var(--t-label);
    font-weight: var(--w-label); letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight); text-transform: uppercase;
    padding: 12px 20px; text-decoration: none;
    border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-skip:focus-visible {
    left: var(--studio-gutter); top: 8px;
    outline: 2px solid var(--acc); outline-offset: 2px;
    border-radius: var(--r-ctrl);
  }
  /* Focus target after the bar — never a visible box, never a focus ring. */
  :root[data-theme="studio"] .st-anchor { display: block; outline: none; }

  /* ---- §4.12 footer ---- */
  :root[data-theme="studio"] .st-foot {
    background: var(--ink-invert);
    color: var(--on-invert);
    overflow: clip;
    /* ~150px rhythm on dark bands (§3), collapsed hard on a phone. */
    padding-block: clamp(48px, 7.5vw, 150px) clamp(28px, 2.6vw, 52px);
  }
  :root[data-theme="studio"] .st-foot-in {
    /* Same content-measure arithmetic as the bar: the gutter sits OUTSIDE the
     * 1900px measure, so the giant wordmark starts at the measured x=54. */
    max-width: calc(var(--studio-container) + var(--studio-gutter) + var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter) var(--studio-gutter);
  }

  :root[data-theme="studio"] .st-foot-top {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    align-items: end;
    gap: clamp(32px, 4vw, 80px);
    margin-bottom: clamp(48px, 6vw, 120px);
  }
  /* THE ONE SANCTIONED OUTLIER in this module. At ~150px it runs well past the
   * ramp's tallest rung (h1, 92px), so it keeps its clamp() and its 0.88
   * logotype leading: it is a poster-scale display device, not UI text, and
   * h1's 1.04em would open a wrapped shop name into two loose lines. Tracking
   * still comes from the ramp — --ls-h1, 0em. The weight is deliberately
   * LIGHTER than the bar's mark (§4.12 measures ~400 against the bar's 500),
   * which is the whole point of the device, so it takes --w-body on the
   * display face. */
  :root[data-theme="studio"] .st-foot-mark {
    font-family: var(--f-display);
    font-weight: var(--w-body);
    font-size: clamp(2.2rem, 7.5vw, 9.375rem);
    letter-spacing: var(--ls-h1);
    line-height: 0.88;
    text-transform: uppercase;
    color: var(--on-invert);
    /* A long shop name must wrap, never push the page sideways. */
    max-width: 100%; overflow-wrap: anywhere; hyphens: none;
  }

  /* The footer's one block heading. h3 is the nominal rung for a sub-section
   * heading, but 48px next to a 150px wordmark reads as a second section
   * opening rather than a label over a single input row; h5 (32/26/24) is the
   * rung nearest the measured 28 and keeps it the size of what it heads. */
  :root[data-theme="studio"] .st-news-h {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--on-invert);
    margin-bottom: clamp(14px, 1.2vw, 24px);
  }
  :root[data-theme="studio"] .st-news-row {
    display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid color-mix(in srgb, var(--on-invert) 34%, transparent);
    padding-bottom: clamp(10px, 0.8vw, 16px);
  }
  :root[data-theme="studio"] .st-news-in {
    flex: 1 1 auto; min-width: 0;
    background: transparent; border: 0; padding: 0;
    /* What a reader types is prose, so body. The face and weight are stated
     * rather than inherited: a form control takes neither from the page. */
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-news-in::placeholder { color: var(--on-invert-mute); }
  /* The row is not wired yet (see renderStudioFooter), so both controls ship
   * disabled. They must still LOOK like the measured device — an underlined
   * field with an arrow chip — while reading as unavailable rather than
   * broken, so the dimming is slight and the note carries the reason. */
  :root[data-theme="studio"] .st-news-in:disabled {
    color: var(--on-invert-mute);
    -webkit-text-fill-color: var(--on-invert-mute);
    opacity: 1;
    cursor: not-allowed;
  }
  :root[data-theme="studio"] .st-news-in:focus-visible {
    outline: 2px solid var(--on-invert); outline-offset: 6px; border-radius: var(--r-ctrl);
  }
  /* Round arrow — a chip, not a CTA button (§3). */
  :root[data-theme="studio"] .st-news-go {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: clamp(34px, 2.1vw, 42px); block-size: clamp(34px, 2.1vw, 42px);
    border-radius: var(--r-circle);
    border: 1px solid color-mix(in srgb, var(--on-invert) 34%, transparent);
    background: transparent; color: var(--on-invert);
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-news-go:hover:not(:disabled) {
    background: var(--on-invert); color: var(--ink);
  }
  :root[data-theme="studio"] .st-news-go:disabled {
    cursor: not-allowed;
    color: var(--on-invert-mute);
    border-color: color-mix(in srgb, var(--on-invert) 20%, transparent);
  }
  :root[data-theme="studio"] .st-news-go:focus-visible {
    outline: 2px solid var(--on-invert); outline-offset: 3px; border-radius: var(--r-circle);
  }
  :root[data-theme="studio"] .st-news-go .st-ico { inline-size: 18px; block-size: 18px; }
  :root[data-theme="studio"] .st-news-note {
    margin-top: 10px;
    /* Body, not the label rung the ramp gives captions: this is two sentences
     * of running prose, and 0.06em tracking on a sentence is a chip's job, not
     * a paragraph's. The muted rung, not a smaller size, is what marks it as
     * secondary to the field above it. */
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--on-invert-mute);
  }

  :root[data-theme="studio"] .st-foot-cols {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr));
    gap: clamp(32px, 3.4vw, 68px);
  }
  /* An ordinary paragraph — body, at the 42ch measure below. */
  :root[data-theme="studio"] .st-foot-blurb {
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--on-invert-mute);
    max-width: 42ch;
    margin-bottom: clamp(22px, 2vw, 40px);
  }
  :root[data-theme="studio"] .st-contacts {
    display: flex; flex-direction: column; gap: clamp(14px, 1.3vw, 26px);
  }
  /* Contact rows are meta rows, so the label rung — mixed case, not uppercase:
   * an address and an e-mail are read, not scanned. Tight leading so a
   * wrapping street line stays one block against its Ø44px disc. */
  :root[data-theme="studio"] .st-contact {
    display: flex; align-items: center; gap: clamp(12px, 1vw, 18px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert);
    text-decoration: none;
  }
  /* Ø44px outlined disc (measured). Round: icon chip, not a button. */
  :root[data-theme="studio"] .st-contact-ico {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: clamp(34px, 2.2vw, 44px); block-size: clamp(34px, 2.2vw, 44px);
    border-radius: var(--r-circle);
    border: 1px solid color-mix(in srgb, var(--on-invert) 28%, transparent);
    color: var(--on-invert);
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] a.st-contact:hover .st-contact-ico {
    background: var(--on-invert); color: var(--ink);
  }
  :root[data-theme="studio"] a.st-contact:focus-visible {
    outline: 2px solid var(--on-invert); outline-offset: 4px; border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-contact-ico .st-ico { inline-size: 18px; block-size: 18px; }

  /* Column heading: an eyebrow over a list, so the label rung uppercase. The
   * ramp carries ONE label tracking (0.06em); the old 0.12em was measured, and
   * the wider setting is not somewhere the source goes. */
  :root[data-theme="studio"] .st-foot-col h2 {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label);
    text-transform: uppercase;
    color: var(--on-invert-mute);
    margin-bottom: clamp(20px, 2vw, 40px);
  }
  :root[data-theme="studio"] .st-foot-col ul {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column;
    /* Measured ~66px row gap — the footer's airiness is the device. */
    gap: clamp(14px, 3.3vw, 66px);
  }
  /* The link columns are label too — same rung as the nav in the bar, which is
   * what makes the two chromes read as one system. Tight leading: the row gap
   * above supplies the air, so a link that wraps should stay one block. */
  :root[data-theme="studio"] .st-foot-col a {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-decoration: none;
    color: var(--on-invert-mute);
    transition: color 0.2s ease;
  }
  :root[data-theme="studio"] .st-foot-col a:hover { color: var(--on-invert); }
  :root[data-theme="studio"] .st-foot-col a:focus-visible {
    outline: 2px solid var(--on-invert); outline-offset: 3px; border-radius: var(--r-ctrl);
  }

  :root[data-theme="studio"] .st-foot-rule {
    border: 0; height: 1px;
    background: color-mix(in srgb, var(--on-invert) 16%, transparent);
    margin: clamp(40px, 5vw, 100px) 0 clamp(18px, 1.6vw, 32px);
  }
  /* Legal line: a meta row of company, VAT id and address, so the label rung.
   * Tight leading keeps it compact where it wraps to two lines on a phone. */
  :root[data-theme="studio"] .st-foot-legal {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert-mute);
  }

  /* ---- responsive ---- */
  @media (max-width: 720px) {
    /* §4.1 mobile: the nav drops to its own scrollable row under the
     * wordmark, and the phone number joins the top row. The CART STAYS. The
     * mobile nav has no cart route, so hiding the whole action cluster here
     * left a phone with no path to the basket at all; only the magnifier —
     * whose destination, the catalogue, is the nav's first item — gives way. */
    :root[data-theme="studio"] .st-chrome-bar {
      /* minmax(0, auto): with a long shop name the wordmark yields before the
       * row can push the page sideways. */
      grid-template-columns: minmax(0, auto) 1fr auto;
      row-gap: 0;
      padding-block: 12px 0;
    }
    :root[data-theme="studio"] .st-chrome-search { display: none; }
    /* Explicit placement: the nav spanning the row would otherwise push the
     * phone link and the basket — both after it in source order — onto a
     * third row. */
    :root[data-theme="studio"] .st-chrome-mark {
      grid-area: 1 / 1;
      min-width: 0; overflow: hidden; text-overflow: ellipsis;
    }
    :root[data-theme="studio"] .st-chrome-actions {
      grid-area: 1 / 3;
      justify-self: end;
    }
    :root[data-theme="studio"] .st-chrome-tel {
      grid-area: 1 / 2;
      display: inline-flex; justify-self: end;
    }
    :root[data-theme="studio"] .st-chrome-nav {
      grid-area: 2 / 1 / 3 / -1;
      justify-self: stretch;
      justify-content: flex-start;
      gap: 22px;
      /* Its own scroll container: the page must never scroll sideways. */
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      padding: 14px 0 12px;
      margin-inline: calc(var(--studio-gutter) * -1) calc(var(--studio-gutter) * -1);
      padding-inline: var(--studio-gutter) var(--studio-gutter);
    }
    :root[data-theme="studio"] .st-chrome-nav::-webkit-scrollbar { display: none; }

    :root[data-theme="studio"] .st-foot-top { grid-template-columns: minmax(0, 1fr); align-items: start; }
    :root[data-theme="studio"] .st-foot-cols { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    :root[data-theme="studio"] .st-foot-brand { grid-column: 1 / -1; }
  }
  @media (max-width: 420px) {
    /* Wordmark + number + basket stop fitting on one 320–360px row. The number
     * keeps its tap target and its aria-label, and gives up only its digits —
     * which the footer states in full a scroll away. */
    :root[data-theme="studio"] .st-chrome-tel span { display: none; }
    /* Two label-set link columns stop fitting; one column, tightened rows. */
    :root[data-theme="studio"] .st-foot-cols { grid-template-columns: minmax(0, 1fr); }
    :root[data-theme="studio"] .st-foot-col ul { gap: 14px; }
  }

  @media (prefers-reduced-motion: reduce) {
    /* Nothing here animates position, so the readable static state is simply
     * the resting one: no transitions, no residual transform. */
    :root[data-theme="studio"] .st-chrome-btn,
    :root[data-theme="studio"] .st-chrome-nav a,
    :root[data-theme="studio"] .st-news-go,
    :root[data-theme="studio"] .st-contact-ico,
    :root[data-theme="studio"] .st-foot-col a {
      transition: none;
      transform: none;
    }
  }
`;

/**
 * The wordmark, set as ONE white word — studio drops the two-tone accent split
 * the other themes use.
 *
 * It is still TWO words, and concatenating them produced a single unreadable
 * token in the accessibility tree ("MasažniFotelj"). The halves are emitted as
 * separate spans with a real space between them; the space is an inline-block
 * of a fixed 0.3em (see .st-mark-gap), which draws the join TIGHT BUT PRESENT
 * — not closed — while leaving the word break in the text stream.
 */
function markHtml(ctx: RenderCtx): string {
  const w = ctx.shop.wordmark;
  return (
    "<span>" + esc(w[0]) + "</span>" +
    '<span class="st-mark-gap"> </span>' +
    "<span>" + esc(w[1]) + "</span>"
  );
}

/**
 * §4.1 — chrome bar.
 *
 * Nav is mapped onto routeSlugs in the same order renderHeader() uses, so a
 * shop that renames a slug renames it in both chromes at once. The returned
 * string carries the skip link's target immediately after </header>, which
 * keeps the link functional without page.ts having to put an id on <main>.
 */
export function renderStudioHeader(ctx: RenderCtx): string {
  const s = ctx.shop;
  const c = ctx.content;
  const links = [
    ["/products", c.nav[0]],
    ["/compare", c.nav[1]],
    ["/guides", c.nav[2]],
    ["/delivery", c.nav[3]],
    ["/contact", c.nav[4]],
  ] as const;

  // No cart session exists at SSR time, so the badge states the honest 0 and
  // says so in the label. The integrator swaps the numeral, not the markup.
  const cartCount = 0;

  return (
    '<header class="st-chrome">' +
    '<a class="st-skip" href="#st-vsebina">Preskočite na vsebino</a>' +
    '<div class="st-chrome-bar">' +
    // aria-label as well as the split spans: the brand name as the shop states
    // it is the name a screen reader should read for the home link.
    '<a class="st-chrome-mark" href="' + esc("/" + ctx.q) + '" aria-label="' +
    esc(s.name) + ' — domov">' + markHtml(ctx) + "</a>" +
    '<nav class="st-chrome-nav" aria-label="Glavni meni">' +
    links
      .map(
        ([k, label]) =>
          '<a href="' + esc(s.routeSlugs[k] + ctx.q) + '">' + esc(label) + "</a>",
      )
      .join("") +
    "</nav>" +
    '<div class="st-chrome-actions">' +
    // Magnifier goes to the catalogue: a real destination, not a dead control.
    // It is the one action that drops on a phone — the catalogue is also the
    // nav's first item — while the basket below stays at every width.
    '<a class="st-chrome-btn st-chrome-search" href="' +
    esc(s.routeSlugs["/products"] + ctx.q) +
    '" aria-label="Iščite po ponudbi">' + searchIcon() + "</a>" +
    '<a class="st-chrome-btn st-chrome-cart" href="' +
    esc(s.routeSlugs["/cart"] + ctx.q) +
    '" aria-label="Košarica — ' + cartCount + ' izdelkov">' + basketIcon() +
    '<span class="st-chrome-badge" data-st-cart-count="' + cartCount + '" aria-hidden="true">' +
    cartCount + "</span></a>" +
    "</div>" +
    '<a class="st-chrome-tel" href="' + esc(ctx.phoneHref) + '" aria-label="Pokličite ' +
    esc(ctx.phoneDisplay) + '">' + icon("phone") +
    "<span>" + esc(ctx.phoneDisplay) + "</span></a>" +
    "</div></header>" +
    '<span class="st-anchor" id="st-vsebina" tabindex="-1"></span>'
  );
}

/**
 * §4.12 — footer.
 *
 * The newsletter row is not wired — there is no form, no action and no handler
 * behind it — so it ships DISABLED rather than merely inert. A live-looking
 * field and arrow that silently swallow an address is the worse failure: a
 * reader who types and presses the arrow learns nothing. Both controls are
 * disabled and both point at the note (aria-describedby), which states when
 * the subscription opens and what to do until then.
 */
export function renderStudioFooter(ctx: RenderCtx): string {
  const s = ctx.shop;
  const c = ctx.content;
  const a = s.contact.address;

  const col = (title: string, items: readonly (readonly [string, string])[]): string =>
    '<div class="st-foot-col"><h2>' + esc(title) + "</h2><ul>" +
    items
      .map(
        ([href, label]) =>
          '<li><a href="' + esc(href + ctx.q) + '">' + esc(label) + "</a></li>",
      )
      .join("") +
    "</ul></div>";

  const contact = (k: IconKey, href: string | null, label: string): string => {
    const inner =
      '<span class="st-contact-ico">' + icon(k) + "</span><span>" + esc(label) + "</span>";
    return href
      ? '<a class="st-contact" href="' + esc(href) + '">' + inner + "</a>"
      : '<span class="st-contact">' + inner + "</span>";
  };

  return (
    '<footer class="st-foot"><div class="st-foot-in">' +
    '<div class="st-foot-top">' +
    '<p class="st-foot-mark">' + markHtml(ctx) + "</p>" +
    "<div>" +
    '<h2 class="st-news-h">E-novice</h2>' +
    '<div class="st-news-row">' +
    '<label class="st-vh" for="st-news">Vaš e-poštni naslov</label>' +
    '<input class="st-news-in" id="st-news" type="email" autocomplete="email" ' +
    'placeholder="Vaš e-poštni naslov" disabled aria-describedby="st-news-note">' +
    '<button class="st-news-go" type="button" disabled ' +
    'aria-describedby="st-news-note" aria-label="Prijavite se na e-novice">' +
    icon("arrow") + "</button>" +
    "</div>" +
    '<p class="st-news-note" id="st-news-note">Prijava na e-novice bo na voljo ob ' +
    "zagonu trgovine. Do takrat nas, prosimo, pokličite ali pišite.</p>" +
    "</div></div>" +

    '<div class="st-foot-cols">' +
    '<div class="st-foot-brand">' +
    '<p class="st-foot-blurb">' + esc(c.footNote) + "</p>" +
    '<div class="st-contacts">' +
    contact("mail", "mailto:" + s.contact.email, s.contact.email) +
    contact("phone", ctx.phoneHref, ctx.phoneDisplay) +
    contact("pin", null, a.street + ", " + a.zip + " " + a.city) +
    "</div></div>" +
    col("Trgovina", [
      [s.routeSlugs["/products"], c.nav[0]],
      [s.routeSlugs["/compare"], "Primerjava modelov"],
      [s.routeSlugs["/guides"], "Vodniki"],
      [s.routeSlugs["/financing"], "Financiranje"],
    ] as const) +
    col("Pomoč", [
      [s.routeSlugs["/delivery"], "Dostava in montaža"],
      [s.routeSlugs["/faq"], "Pogosta vprašanja"],
      [s.routeSlugs["/showroom"], "Razstavni salon"],
      [s.routeSlugs["/contact"], "Kontakt"],
    ] as const) +
    col("Pravno", [
      [s.routeSlugs["/terms"], "Pogoji poslovanja"],
      [s.routeSlugs["/privacy"], "Zasebnost"],
      [s.routeSlugs["/cookies"], "Piškotki"],
      [s.routeSlugs["/withdrawal"], "Odstop od pogodbe"],
    ] as const) +
    "</div>" +

    '<hr class="st-foot-rule">' +
    '<p class="st-foot-legal">' +
    esc(
      s.company.legalName + " · ID za DDV: " + s.company.vatId + " · " +
      a.street + ", " + a.zip + " " + a.city,
    ) +
    "</p>" +
    "</div></footer>"
  );
}
