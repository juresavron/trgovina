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
   * MEASURED, NOT ASSUMED. This started at 68ch on the usual "45-75 characters
   * per line" advice and rendered 92 — because ch is the width of the ZERO
   * glyph, which in this face is far wider than the average lowercase letter,
   * so a ch-based measure overshoots by about a third. On a page whose entire
   * job is prose somebody reads carefully — a delivery procedure, a
   * withdrawal right — that is the difference between comfortable and tiring.
   *
   * 48ch measures 66 characters here, the middle of the range. Kept in ch
   * rather than px so the column still tracks the font if the ramp changes;
   * the number is calibrated to this face and would need re-measuring with
   * another. The mobile term is unaffected (38 characters at 390px, where the
   * gutter calc wins). */
  :root[data-theme="studio"] .st-page {
    padding-block: var(--studio-rhythm);
    background: var(--bg);
  }
  :root[data-theme="studio"] .st-page-in {
    max-inline-size: min(48ch, calc(100% - 2 * var(--studio-gutter)));
    margin-inline: auto;
  }
  /* The masthead: eyebrow, h1, standfirst. Same three rungs as every other
   * page opening on this site, so a subpage reads as part of the shop. */
  :root[data-theme="studio"] .st-page-eyebrow {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-soft);
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
    color: var(--ink-soft);
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
  :root[data-theme="studio"] .st-page-p {
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink);
    text-wrap: pretty;
  }
  :root[data-theme="studio"] .st-page-p + .st-page-p { margin-block-start: clamp(12px, 1.2vw, 20px); }
  :root[data-theme="studio"] .st-page-p a { color: var(--ink); text-underline-offset: 3px; }

  /* Numbered steps. The counter is the content — "third of five" is what a
   * reader planning a delivery day needs — so it is a real ordered list. */
  :root[data-theme="studio"] .st-page-steps { list-style: none; counter-reset: st-step; }
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
    color: var(--ink-soft);
  }

  /* Questions and answers. A native details/summary needs no script, keeps the
   * answer in the DOM for search engines, and is keyboard-operable for free. */
  :root[data-theme="studio"] .st-page-qa { border-block-start: var(--bw-line) solid var(--line); }
  :root[data-theme="studio"] .st-page-qi { border-block-end: var(--bw-line) solid var(--line); }
  :root[data-theme="studio"] .st-page-q {
    display: flex;
    align-items: center;
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
  :root[data-theme="studio"] .st-page-q::after {
    content: "";
    flex: none;
    inline-size: 11px;
    block-size: 11px;
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
    color: var(--ink-soft);
    text-wrap: pretty;
  }

  /* Term/definition rows. Two columns where there is room, stacked where there
   * is not — a definition that wraps to one word per line is unreadable. */
  :root[data-theme="studio"] .st-page-facts { display: grid; }
  :root[data-theme="studio"] .st-page-frow {
    display: grid;
    grid-template-columns: minmax(0, 12rem) minmax(0, 1fr);
    gap: clamp(10px, 1.2vw, 24px);
    padding-block: clamp(12px, 1.2vw, 18px);
    border-block-end: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-page-fk {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  :root[data-theme="studio"] .st-page-fv {
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink);
  }
  /* An unset company fact is marked rather than left to look like content. */
  :root[data-theme="studio"] .st-page-todo {
    font-family: var(--f-label);
    font-size: var(--t-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-soft);
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
    color: var(--ink-soft);
  }
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
 * A company fact, or a visible mark that it is unset.
 *
 * The TODO values in tenants/bazen.ts are placeholders, and the worst thing a
 * legal page can do with a placeholder is render it as if it were a fact:
 * "TODO d.o.o." reads as a company name to a machine and as a typo to a
 * reader. Marking it says what is true — this has not been filled in — and
 * legalPagesReady() stops the shop going live while any of them is like this.
 */
function fact(value: string): string {
  const unset =
    value.includes("TODO") ||
    value === "SI00000000" ||
    value === "0000" ||
    value.replace(/[^0-9]/g, "").replace(/^386/, "").replace(/0+/g, "") === "";
  return unset
    ? '<span class="st-page-todo">podatek še ni vpisan</span>'
    : esc(value);
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
  const place = [a.street, [a.zip, a.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return facts(
    h ?? "Kontakt",
    [
      ["Telefon", '<a href="' + esc(ctx.phoneHref) + '">' + fact(ctx.phoneDisplay) + "</a>"],
      ["E-pošta", '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>"],
      ["Naslov", fact(place)],
    ],
    true,
  );
}

function imprint(ctx: RenderCtx, h?: string): string {
  const co = ctx.shop.company;
  return facts(
    h ?? "Podatki o podjetju",
    [
      ["Naziv", fact(co.legalName)],
      ["Davčna številka", fact(co.vatId)],
      ["Spletno mesto", ctx.shop.domain],
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
