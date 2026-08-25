/**
 * Editorial and legal pages, rendered from the Block vocabulary.
 *
 * WHY A SEPARATE RENDERER. These pages have no product, no gallery and no
 * price; what they have is prose that must be READ — a delivery procedure
 * somebody follows with a crane booked, a withdrawal right somebody exercises
 * against a EUR 8,000 purchase. So the measure is narrow, the rhythm is
 * generous, and nothing competes with the words. The storefront's devices
 * (bleeding media, full-bleed bands, marquees) are deliberately absent.
 *
 * THE CONTENT MODULES EMIT NO MARKUP. They hand over data; this file is the
 * only place that writes tags, which keeps escaping in one place and means a
 * page cannot smuggle HTML past the renderer. Every string below goes through
 * esc().
 *
 * COMPANY IDENTITY IS READ FROM ShopConfig, NEVER FROM PROSE. The imprint and
 * contact blocks render tenants/bazen.ts's values, which are TODO today. That
 * is deliberate: a legal page must not carry an invented registered name or
 * VAT number, and rendering the real field makes the gap visible on the page
 * instead of hiding it inside plausible-looking sentences.
 */

import { esc, type RenderCtx } from "../../render/sections";
import type { Block, Page } from "../../content/pages";

/* ------------------------------------------------------------------ CSS */

export const STUDIO_PAGE_CSS = `
  /* The reading column.
   *
   * MEASURED, NOT ASSUMED — AND THE FIRST MEASUREMENT WAS STILL WRONG. This
   * started at 68ch on the usual "45-75 characters per line" advice and
   * rendered 92, because ch is the width of the ZERO glyph and in this face
   * that is far wider than the average lowercase letter. It was then cut to
   * 48ch and recorded as 66 characters. Re-counted per rendered line (a Range
   * rect per character, so it is what the browser actually laid out, not an
   * average-advance estimate) across all fourteen pages, 48ch is 579.7px and
   * carries a MEDIAN of 77 characters and a maximum of 85 — still over the
   * ceiling, worst on the legal pages whose paragraphs are longest
   * (/zasebnost 76/85, /piskotki 80/83).
   *
   * The unit is the deeper fault, and it costs more than the count. ch is a
   * glyph metric, so it resolves differently before and after the webfont
   * arrives, and the faces here are font-display:swap. Measured at 1440 the
   * column went 503.9px -> 579.7px at swap — a 15% jump that re-wraps every
   * paragraph on the page and scored 0.0085-0.037 CLS on its own, on pages
   * that have no images to blame. rem is a font-size, not a glyph, so it is
   * the same length in both states and the swap costs only the re-wrap.
   *
   * 31rem = 496px, which counts 64 median and 73 maximum on the same pass —
   * the middle of the range, with the worst line on the longest legal page
   * (/piskotki 64/71, /pogoji-poslovanja 64/69) still inside it. The mobile
   * term is untouched: at 390px and 320px the gutter calc wins and the count
   * is 43 and 34. Re-measure if --t-body or the body face moves. */
  :root[data-theme="studio"] .st-page {
    padding-block: var(--studio-rhythm);
    background: var(--bg);
  }
  :root[data-theme="studio"] .st-page-in {
    max-inline-size: min(31rem, calc(100% - 2 * var(--studio-gutter)));
    margin-inline: auto;
  }
  /* THE INK RUNGS, AND WHY THEY ARE NOT --ink-soft ANY MORE.
   *
   * Every quiet run on this page used to ask for --ink-soft. That name is not
   * a studio token: it is a kernel alias declared in render/css.ts as
   * var(--ink-body, #212121) for the components studio replaces. So a page
   * that meant "muted" got #212121 — 16.10:1 on white, against body ink's
   * 18.26:1. Sampled side by side those two are the same colour; the file's
   * comments described a hierarchy that did not reach the screen, and on
   * /o-nas the standfirst, the body, the dt labels and the "not filled in"
   * mark all printed at one weight of grey.
   *
   * Three rungs now, taken from tokens.ts by the job each does:
   *   --ink       #151515  18.26:1  headings, the question, the counter
   *   --ink-body  #212121  16.10:1  anything somebody reads a sentence of
   *   --ink-mute  #6d6d6d   5.17:1 on white, 4.54:1 on the panel — LABELS
   *
   * --ink-mute is the lightest rung tokens.ts certifies for text, and it is
   * used only where the run is a label or a mark, never for a sentence: at
   * 5.17:1 it clears the 4.5:1 floor the European Accessibility Act makes a
   * legal requirement here, with room, but a paragraph read at that rung is
   * still harder work than one read at 16:1. The CTA's sub-line stays at
   * --ink-body for exactly that reason — it sits on the panel grey, where
   * --ink-mute would be 4.54:1, four hundredths above the floor. */

  /* The masthead: eyebrow, h1, standfirst. Same three rungs as every other
   * page opening on this site, so a subpage reads as part of the shop. */
  :root[data-theme="studio"] .st-page-eyebrow {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-page-h {
    margin-block-start: clamp(12px, 1.2vw, 20px);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--ink);
    text-wrap: balance;
  }
  :root[data-theme="studio"] .st-page-lead {
    margin-block-start: clamp(16px, 1.6vw, 26px);
    font-family: var(--f-body);
    font-size: var(--t-lead);
    line-height: var(--lh-lead);
    color: var(--ink-body);
    text-wrap: pretty;
  }
  /* A hairline closes the masthead and opens the body. */
  :root[data-theme="studio"] .st-page-body {
    margin-block-start: clamp(40px, 4.4vw, 72px);
    border-block-start: var(--bw-line) solid var(--line);
    padding-block-start: clamp(40px, 4.4vw, 72px);
  }
  :root[data-theme="studio"] .st-page-block + .st-page-block {
    margin-block-start: clamp(38px, 4vw, 64px);
  }
  :root[data-theme="studio"] .st-page-h2 {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h4);
    letter-spacing: var(--ls-h4);
    line-height: var(--lh-h4);
    color: var(--ink);
    text-wrap: balance;
  }
  :root[data-theme="studio"] .st-page-h2 + * { margin-block-start: clamp(14px, 1.4vw, 22px); }
  /* Prose takes --ink-body, which is what tokens.ts calls body copy: a hair
   * lighter than a heading, so a run of paragraphs under an h2 reads as one
   * level below it rather than as more heading.
   *
   * overflow-wrap is insurance, not decoration. These pages carry regulator
   * URLs and e-mail addresses inside sentences, and an unbreakable 35-
   * character token does not fit the 270px column a 320px phone gets — it
   * runs off the side of the screen instead of wrapping. break-word only
   * acts when a word cannot fit at all, so it costs nothing the rest of the
   * time. Reproduced before adding it; see .st-page-fv, where the same thing
   * happened with a real value rather than a hypothetical one. */
  :root[data-theme="studio"] .st-page-p {
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    text-wrap: pretty;
    overflow-wrap: break-word;
  }
  :root[data-theme="studio"] .st-page-p + .st-page-p { margin-block-start: clamp(12px, 1.2vw, 20px); }
  :root[data-theme="studio"] .st-page-p a { color: var(--ink); text-underline-offset: 3px; }

  /* Numbered steps. The counter is the content — "third of five" is what a
   * reader planning a delivery day needs — so it is a real ordered list.
   *
   * THE UA DEFAULTS WERE NEVER RESET, AND THEY WERE EATING THE MEASURE.
   * list-style:none hides the marker but leaves ol's padding-inline-start of
   * 40px and its margin-block of 1em standing. Measured: at 1440 every step
   * sat 40px inside the reading column the rest of the page uses, and at
   * 320px the step body was 172px of the column's 270 — 20 characters a
   * line, against 34 for an ordinary paragraph on the same screen. The
   * 16.5px bottom margin was separately adding an off-scale gap under every
   * steps block, which the clamp rhythm below is supposed to own. */
  :root[data-theme="studio"] .st-page-steps {
    list-style: none;
    counter-reset: st-step;
    margin-block: 0;
    padding-inline-start: 0;
  }
  :root[data-theme="studio"] .st-page-step {
    counter-increment: st-step;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: clamp(16px, 1.6vw, 26px);
  }
  :root[data-theme="studio"] .st-page-step + .st-page-step { margin-block-start: clamp(20px, 2vw, 32px); }
  :root[data-theme="studio"] .st-page-step::before {
    content: counter(st-step);
    grid-row: 1 / span 2;
    inline-size: 40px;
    block-size: 40px;
    display: grid;
    place-items: center;
    border: var(--bw-line) solid var(--line-strong);
    border-radius: var(--r-circle);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-page-step-h {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-page-step-p {
    margin-block-start: 6px;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    overflow-wrap: break-word;
  }

  /* The counter column is sized for a desktop measure, and on a phone it is
   * charged against a column that has none to spare. At 320px a 40px circle
   * and a 16px gutter are 56 of 270 available pixels — a fifth of the screen
   * spent on an ordinal — and the body underneath drops to 25 characters a
   * line even with the UA indent gone. Below the tablet tier the circle goes
   * to 32px and the gutter to the theme's own small gap, which returns 14px
   * to the text: 37 characters at 390px and 27 at 320px, against 43 and 34
   * for an unindented paragraph. The circle is decoration, not a control, so
   * nothing here is bound by a target size. */
  @media (max-width: 809px) {
    :root[data-theme="studio"] .st-page-step { column-gap: var(--gap-sm); }
    :root[data-theme="studio"] .st-page-step::before { inline-size: 32px; block-size: 32px; }
  }

  /* Questions and answers. A native details/summary needs no script, keeps the
   * answer in the DOM for search engines, and is keyboard-operable for free.
   *
   * VERIFIED RATHER THAN ASSUMED, because the styling here does two things
   * that are known to cost a control its semantics. Driven in Chromium: the
   * summary still exposes role DisclosureTriangle with the question as its
   * accessible name, focusable, carrying an expanded state that flips; Enter
   * toggles it; the answer stays a real <p> inside <details>. Neither
   * list-style:none nor display:flex took the role away. */
  :root[data-theme="studio"] .st-page-qa { border-block-start: var(--bw-line) solid var(--line); }
  :root[data-theme="studio"] .st-page-qi { border-block-end: var(--bw-line) solid var(--line); }
  :root[data-theme="studio"] .st-page-q {
    display: flex;
    /* The chevron aligns to the FIRST line, not to the middle of the block.
     * At 390px every real question in /pogosta-vprasanja wraps to two lines
     * and a stress-test question ran to six; centred, the chevron drifted
     * into the middle of the paragraph and stopped reading as the control
     * for the line it belongs to. The offset is em-based so it stays right
     * at all three type tiers (h6 is 24/19/22px). */
    align-items: start;
    justify-content: space-between;
    gap: 16px;
    /* 44px minimum target with the padding, and the cursor states it is a
     * control. list-style:none removes the UA triangle in both engines. */
    padding-block: clamp(16px, 1.6vw, 22px);
    cursor: pointer;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
    list-style: none;
  }
  :root[data-theme="studio"] .st-page-q::-webkit-details-marker { display: none; }
  /* The site's own focus ring, which this control was not getting. The
   * kernel declares it as :is(a, button):focus-visible — a summary is
   * neither, so the one keyboard-operable element on the FAQ page fell back
   * to the UA ring: a different colour from every other focusable thing on
   * the site, drawn at offset 0, and close enough to the border box that the
   * rotated chevron poked through it. Same 2px --acc at 3px offset as
   * everything else; measured 3.51:1 against the page white, above the 3:1
   * that WCAG 1.4.11 asks of a state indicator. */
  :root[data-theme="studio"] .st-page-q:focus-visible {
    outline: var(--bw-ctrl) solid var(--acc);
    outline-offset: 3px;
  }
  :root[data-theme="studio"] .st-page-q::after {
    content: "";
    flex: none;
    inline-size: 11px;
    block-size: 11px;
    margin-block-start: calc((var(--lh-h6) - 11px) / 2);
    border-inline-end: var(--bw-line) solid var(--ink);
    border-block-end: var(--bw-line) solid var(--ink);
    transform: rotate(45deg) translate(-3px, -3px);
  }
  :root[data-theme="studio"] .st-page-qi[open] .st-page-q::after {
    transform: rotate(225deg) translate(-3px, -3px);
  }
  :root[data-theme="studio"] .st-page-a {
    padding-block-end: clamp(18px, 1.8vw, 26px);
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    text-wrap: pretty;
    overflow-wrap: break-word;
  }

  /* Term/definition rows. Two columns where there is room, stacked where there
   * is not — a definition that wraps to one word per line is unreadable.
   *
   * THE MARKUP IS THE ONE SCREEN READERS EXPECT. dl > div > (dt, dd) is
   * valid HTML and is the form the spec added the div wrapper for: the div
   * groups one name with one value so a row can be styled, and it is
   * transparent to the accessibility tree, which still reads term then
   * definition. Each row is its OWN grid rather than the dl being one grid
   * with the rows as display:contents, because display:contents would take
   * the box the hairline is drawn on with it.
   *
   * AND THE UA DEFAULTS WERE AGAIN LEFT STANDING. dd ships with
   * margin-inline-start:40px and dl with margin-block:1em. Measured at 1440
   * the 40px came straight off the value column — every value was set 40px
   * narrower than the track reserved for it — and under 700px, where the row
   * stacks to one column, it printed as a ragged indent under each label,
   * visible on /kontakt, /odstop-od-pogodbe and /zasebnost. The dl's 16.5px
   * bottom margin was the same off-scale gap the steps list had.
   *
   * A hairline now closes the top as well as the bottom. .st-page-qa, the
   * other hairline-ruled list in this column, is closed at both ends; the
   * facts list was open at the top and shut at the bottom, so on
   * /odstop-od-pogodbe its last rule read as a rule under nothing. */
  :root[data-theme="studio"] .st-page-facts {
    display: grid;
    margin-block: 0;
    border-block-start: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-page-frow {
    display: grid;
    grid-template-columns: minmax(0, 12rem) minmax(0, 1fr);
    gap: clamp(10px, 1.2vw, 24px);
    padding-block: clamp(12px, 1.2vw, 18px);
    border-block-end: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-page-fk,
  :root[data-theme="studio"] .st-page-fv { margin: 0; }
  :root[data-theme="studio"] .st-page-fk {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  /* overflow-wrap here is not defensive, it is a reproduced bug. The values
   * in this block come from ShopConfig and from the legal copy, so they are
   * the machine-shaped strings a page carries: an e-mail address, a VAT id,
   * a domain, a regulator's contact. Given the Information Commissioner's
   * address as a value, the row ran off the right edge of the screen at
   * 320px — minmax(0, 1fr) lets the TRACK be narrow but does nothing about a
   * word that will not break. anywhere rather than break-word because it is
   * also honoured when the track computes its own minimum. */
  :root[data-theme="studio"] .st-page-fv {
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    overflow-wrap: anywhere;
  }
  /* A value that is a link is a TARGET, and an inline anchor's box is only
   * as tall as its line — 19px here, under the 24px WCAG 2.2 SC 2.5.8 asks
   * for. It is the phone and the e-mail on every page that carries a contact
   * or imprint block, which is nine of the fourteen, so it is the most-used
   * control these pages have. Padding on an INLINE box enlarges the hit area
   * without entering line layout: the row keeps its height to the pixel
   * (61.5px at 1440, 75.0px at 320, both unchanged), the hairline grid does
   * not loosen, and the anchor can still wrap mid-value, which an
   * inline-block could not. 19px -> 27px. */
  :root[data-theme="studio"] .st-page-fv a { padding-block: 4px; text-underline-offset: 3px; }
  /* An unset company fact is marked rather than left to look like content.
   * --ink-mute is what makes that mark visible AS a mark: at --ink-soft it
   * printed at 16.10:1, the same ink as the values around it, so five rows
   * of "podatek še ni vpisan" read as five facts. 5.17:1 on white is quiet
   * enough to read as an absence and still clears the 4.5:1 floor — the one
   * line on the site that admits a gap is not the line to fail on. */
  :root[data-theme="studio"] .st-page-todo {
    font-family: var(--f-label);
    font-size: var(--t-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-mute);
  }

  /* The closing call to action. */
  :root[data-theme="studio"] .st-page-cta {
    margin-block-start: clamp(48px, 5vw, 84px);
    padding: clamp(28px, 3vw, 48px);
    border-radius: var(--r-lg);
    background: var(--bg-alt);
  }
  :root[data-theme="studio"] .st-page-cta-h {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-page-cta-p {
    margin-block-start: 10px;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  /* The button. 44px tall and 127px wide at 1440, 109px at 390 — over the
   * 24px SC 2.5.8 floor and over the 44px AAA one on both axes; white on
   * --ink is 18.26:1; the kernel's focus ring reaches it because it is an
   * anchor, and 3.51:1 against the panel grey it sits on clears 1.4.11.
   *
   * text-decoration is the one thing that was missing. The kernel resets it
   * on .btn, which this is not, so the label inside a solid black button was
   * underlined — the one place on these pages where an underline means
   * "button" instead of "link", and the only element carrying two conflicting
   * affordances at once. */
  :root[data-theme="studio"] .st-page-cta-a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: 44px;
    margin-block-start: clamp(18px, 1.8vw, 26px);
    padding-inline: clamp(20px, 2vw, 34px);
    border-radius: var(--r-ctrl);
    background: var(--ink);
    color: var(--on-invert);
    text-decoration: none;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
  }

  @media (max-width: 700px) {
    :root[data-theme="studio"] .st-page-frow { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  }
`;

/* -------------------------------------------------------------- render */

/**
 * WHETHER A COMPANY VALUE HAS BEEN FILLED IN, JUDGED PER FIELD.
 *
 * The TODO values in tenants/bazen.ts are placeholders, and the worst thing a
 * legal page can do with a placeholder is render it as if it were a fact:
 * "TODO d.o.o." reads as a company name to a machine and as a typo to a
 * reader. Marking it says what is true — this has not been filled in — and
 * legalPagesReady() stops the shop going live while any of them is like this.
 *
 * ⚠️ THE OLD TEST WOULD HAVE MARKED THE REAL COMPANY AS UNSET. One predicate
 * ran over every value and ended with a phone check — strip non-digits, drop
 * a leading 386, drop the zeros, call it unset if nothing survives. Exactly
 * right for "+386 00 000 000". Catastrophic for "Masažni Bazen d.o.o." and
 * "Ljubljana", which carry no digits at all: they fold to "" and read as
 * unset. So the day the owner filled the details in, /pogoji-poslovanja,
 * /zasebnost and /odstop-od-pogodbe would have printed "podatek še ni
 * vpisan" over a real registered name and a real city — on the three pages
 * whose entire job is to identify the seller.
 *
 * Per field now, each predicate knowing only how ITS OWN kind of value looks
 * when it is missing. Deliberately the same four predicates as
 * content/pages.ts, whose legalPagesReady() had the identical bug and was
 * fixed the same way: the gate that refuses to take the shop live and the
 * mark that appears on the page have to agree, or the page claims a gap the
 * launch check cannot see, or the other way round. They are restated here
 * rather than imported because that file exports neither, and a theme
 * reaching for another module's private helpers is a worse coupling than
 * four lines of duplication that a comment ties together.
 */
const isSet = (v: string): boolean => v.trim() !== "" && !v.includes("TODO");

/** A VAT id is unset while every digit in it is a zero. */
const isSetVat = (v: string): boolean =>
  isSet(v) && v.replace(/[^0-9]/g, "").replace(/0/g, "") !== "";

/** A postcode is unset while every digit is a zero. */
const isSetZip = (v: string): boolean =>
  isSet(v) && v.replace(/[^0-9]/g, "").replace(/0/g, "") !== "";

/**
 * A phone number is unset while the subscriber part is all zeros. The country
 * code is stripped first so "+386 00 000 000" cannot be rescued by its 386.
 */
const isSetPhone = (v: string): boolean =>
  isSet(v) && v.replace(/[^0-9]/g, "").replace(/^386/, "").replace(/0/g, "") !== "";

/** The mark that stands in for a value nobody has filled in yet. */
const UNSET = '<span class="st-page-todo">podatek še ni vpisan</span>';

/** A company fact, or a visible mark that it is unset. */
function fact(value: string, set: boolean): string {
  return set ? esc(value) : UNSET;
}

/**
 * A contact value as a LINK, and only while there is somewhere to go.
 *
 * The phone row used to be an anchor unconditionally, so with the placeholder
 * number in tenants/bazen.ts the imprint offered tel:+38600000000 — a control
 * whose accessible name was "podatek še ni vpisan" and whose whole behaviour
 * was to dial nothing. On a shop that takes most of its EUR 2,400-8,400
 * orders by telephone that is worse than showing no link: a customer who taps
 * it learns the number is wrong from their own dialler. The row stays; only
 * the href goes, which is what the footer does with the same value.
 */
function link(href: string, value: string, set: boolean): string {
  return set ? '<a href="' + esc(href) + '">' + esc(value) + "</a>" : UNSET;
}

/**
 * A contact value as a LINK, and only while there is somewhere to go.
 *
 * The phone row used to be an anchor unconditionally, so with the placeholder
 * number in tenants/bazen.ts the imprint offered tel:+38600000000 — a control
 * whose accessible name was "podatek še ni vpisan" and whose whole behaviour
 * was to dial nothing. On a shop that takes most of its EUR 2,400-8,400
 * orders by telephone that is worse than showing no link: a customer who taps
 * it learns the number is wrong from their own dialler.
 */
function link(href: string, value: string): string {
  return isUnset(value)
    ? fact(value)
    : '<a href="' + esc(href) + '">' + esc(value) + "</a>";
}

function prose(b: Extract<Block, { kind: "prose" }>): string {
  return (
    (b.h ? '<h2 class="st-page-h2">' + esc(b.h) + "</h2>" : "") +
    b.p.map((t) => '<p class="st-page-p">' + esc(t) + "</p>").join("")
  );
}

function steps(b: Extract<Block, { kind: "steps" }>): string {
  return (
    (b.h ? '<h2 class="st-page-h2">' + esc(b.h) + "</h2>" : "") +
    '<ol class="st-page-steps">' +
    b.items
      .map(
        ([h, p]) =>
          '<li class="st-page-step">' +
          '<h3 class="st-page-step-h">' + esc(h) + "</h3>" +
          '<p class="st-page-step-p">' + esc(p) + "</p></li>",
      )
      .join("") +
    "</ol>"
  );
}

function qa(b: Extract<Block, { kind: "qa" }>): string {
  return (
    (b.h ? '<h2 class="st-page-h2">' + esc(b.h) + "</h2>" : "") +
    '<div class="st-page-qa">' +
    b.items
      .map(
        ([q, a]) =>
          '<details class="st-page-qi">' +
          '<summary class="st-page-q">' + esc(q) + "</summary>" +
          '<p class="st-page-a">' + esc(a) + "</p></details>",
      )
      .join("") +
    "</div>"
  );
}

/**
 * Term/definition rows.
 *
 * The raw flag makes ESCAPING THE CALLER'S JOB, so it is only passed by the two
 * callers below, which build their own anchors and their own unset marks. A
 * row that comes from a content module never takes that path. The one value
 * that was reaching the page unescaped — the shop's own domain, which went in
 * as raw HTML because it travelled in the same array as the anchors — now
 * goes through esc() at its call site like every other string in this file.
 */
function facts(h: string | undefined, rows: readonly (readonly [string, string])[], raw = false): string {
  return (
    (h ? '<h2 class="st-page-h2">' + esc(h) + "</h2>" : "") +
    '<dl class="st-page-facts">' +
    rows
      .map(
        ([k, v]) =>
          '<div class="st-page-frow">' +
          '<dt class="st-page-fk">' + esc(k) + "</dt>" +
          '<dd class="st-page-fv">' + (raw ? v : esc(v)) + "</dd></div>",
      )
      .join("") +
    "</dl>"
  );
}

function contact(ctx: RenderCtx, h?: string): string {
  const c = ctx.shop.contact;
  const a = c.address;
  // The postal address is three fields, so it is three questions: a street
  // with no house number is still a street, but a 0000 postcode is not a
  // postcode. Judged before the parts are joined, because the joined string
  // ("Glavni trg bb, 1000 Ljubljana") cannot be taken apart again.
  const placeSet = isSet(a.street) && isSetZip(a.zip) && isSet(a.city);
  const place = [a.street, [a.zip, a.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return facts(
    h ?? "Kontakt",
    [
      ["Telefon", link(ctx.phoneHref, ctx.phoneDisplay, isSetPhone(ctx.phoneDisplay))],
      ["E-pošta", link("mailto:" + c.email, c.email, isSet(c.email))],
      ["Naslov", fact(place, placeSet)],
    ],
    true,
  );
}

function imprint(ctx: RenderCtx, h?: string): string {
  const co = ctx.shop.company;
  return facts(
    h ?? "Podatki o podjetju",
    [
      ["Naziv", fact(co.legalName, isSet(co.legalName))],
      ["Davčna številka", fact(co.vatId, isSetVat(co.vatId))],
      ["Spletno mesto", esc(ctx.shop.domain)],
    ],
    true,
  );
}

function block(ctx: RenderCtx, b: Block): string {
  const inner =
    b.kind === "prose"
      ? prose(b)
      : b.kind === "steps"
        ? steps(b)
        : b.kind === "qa"
          ? qa(b)
          : b.kind === "facts"
            ? facts(b.h, b.rows)
            : b.kind === "contact"
              ? contact(ctx, b.h)
              : b.kind === "imprint"
                ? imprint(ctx, b.h)
                : '<div class="st-page-cta">' +
                  '<h2 class="st-page-cta-h">' + esc(b.h) + "</h2>" +
                  '<p class="st-page-cta-p">' + esc(b.p) + "</p>" +
                  '<a class="st-page-cta-a" href="' + esc(b.href) + esc(ctx.q) + '">' +
                  esc(b.label) + "</a></div>";
  return '<div class="st-page-block">' + inner + "</div>";
}

/** The whole page: masthead, hairline, blocks. */
export function renderStudioPage(ctx: RenderCtx, page: Page): string {
  return (
    '<main><section class="st-page"><div class="st-page-in">' +
    '<p class="st-page-eyebrow">' + esc(ctx.shop.name) + "</p>" +
    '<h1 class="st-page-h">' + esc(page.h1) + "</h1>" +
    '<p class="st-page-lead">' + esc(page.lead) + "</p>" +
    '<div class="st-page-body">' +
    page.blocks.map((b) => block(ctx, b)).join("") +
    "</div></div></section></main>"
  );
}
