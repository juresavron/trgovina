/**
 * STUDIO — the guided choice (/izbira).
 *
 * A question is a set of large option LINKS, each carrying the answers so
 * far plus its own — the whole quiz is GET navigation, and the browser's
 * back button IS the "previous question" control (a link restates it
 * anyway, for the visitor who does not think of it). The terminal view is
 * one or two real model cards and an enquiry link that lands on /kontakt
 * with the model attached, exactly like arriving from the product page.
 *
 * Rendered on the page module's vocabulary — masthead, measure, hairlines —
 * so the tool reads as a page of the site, not a widget dropped on one.
 */

import type { ShopConfig } from "../../tenants/types";
import type { ShopContent, PdpContent } from "../../content/types";
import {
  nextStep,
  previousAnswers,
  recommend,
  walk,
  type FinderAnswers,
  type FinderStep,
} from "../../content/finder";
import { esc } from "../../render/sections";
import type { RenderCtx } from "../../render/sections";
import { renderStudioHeader, renderStudioFooter } from "./chrome";

export const STUDIO_FINDER_CSS = `
  /* ================= §4.x Guided choice ================= */
  /* Same 80px narrowing as closing.ts's two bands, and the same fix: the
   * container is layout.ts's, and only the block padding is the page's own.
   * A padding SHORTHAND here would reset the shared inline padding. */
  :root[data-theme="studio"] .st-fnd {
    padding-block: clamp(40px, 6vw, 96px) clamp(64px, 8vw, 128px);
  }
  /* ⚠️ LEFT, NOT CENTRED, and the note that stood here argued the opposite:
   * that a left-pinned column left ~700px of dead white at 1440 and was "the
   * one page drawn off the site's grid". It had the diagnosis backwards. The
   * dead white is real and it is what a capped measure costs on every page
   * here; centring did not remove it, it split it in two and moved the h1
   * off the line the header, the footer and every other h1 sit on. Measured
   * at 1920: this page's heading started at 608 while the band it sits in
   * starts at 180.
   *
   * The reason it read as the odd one out is that /blog was centred too, and
   * /blog was centred because it had silently fallen into the 38rem reading
   * track (see the --wide note in blog.ts). Both are on the grid now. */
  /* ⚠️ NO CAP ON THE CONTAINER — the measure is on the WORDS, exactly as it
   * is on the content pages (see .st-page-p in page.ts).
   *
   * This was 44rem, and left-aligning it without lifting the cap just moved
   * the empty half from both sides to one: on a wide screen the questionnaire
   * occupied the left half of the band and the right half was blank. The cap
   * was doing two jobs at once — keeping sentences readable, which is right,
   * and holding the OPTION ROWS to the same width, which is not. Those rows
   * are a rule, a title and an arrow: structure, and structure spans, with
   * the arrow landing at the far right where the eye looks for it.
   *
   * Every running-text element below carries its own max-inline-size, so
   * nothing gets a 1200px line. */
  :root[data-theme="studio"] .st-fnd-in { max-inline-size: none; }
  /* The reading measure for this page's prose, in one place. 38rem is the
   * same rung page.ts uses; the lead keeps its slightly tighter 36rem. */
  :root[data-theme="studio"] .st-fnd h1 {
    max-inline-size: 38rem;
  }
  :root[data-theme="studio"] .st-fnd-eyebrow {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-mute);
    margin: 0 0 10px;
  }
  :root[data-theme="studio"] .st-fnd h1 {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h3);
    letter-spacing: var(--ls-h3);
    line-height: var(--lh-h3);
    color: var(--ink);
    margin: 0 0 10px;
    text-wrap: balance;
  }
  :root[data-theme="studio"] .st-fnd-lead {
    font-size: var(--t-lead);
    line-height: var(--lh-lead);
    color: var(--ink-body);
    margin: 0 0 clamp(26px, 3vw, 44px);
    max-inline-size: 36rem;
  }
  /* THE ANSWERS ARE CARDS, TWO ACROSS, AND THEY WERE RULED ROWS.
   *
   * ⚠️ TWO GOES AT THIS, AND THE FIRST ONE WAS THE WRONG FIX. As rows they
   * ran the whole band — 1360px at 1440 against an h1 of 608 — so each
   * answer's arrow sat about 1036px right of its own last word, reading as
   * page furniture rather than as that row's affordance, with the hairline
   * under it running the same 1360 while everything above stopped at 608. The
   * fix was to cap the list at the h1's 38rem, and it traded one fault for
   * another: the page became a narrow column against 830px of empty screen,
   * which is the "use the full width" the pdp panels were rebuilt for.
   *
   * A cap was the wrong instrument because a MEASURE governs running text,
   * and these are not running text — they are the two things the page exists
   * to offer. Every step in content/finder.ts has exactly two choices, so two
   * cards fill the band with no orphan at any width and no arithmetic about
   * how many.
   *
   * What that buys, beyond the width: the answers stop looking like the skip
   * list below them. Those are still hairline rows, deliberately quieter —
   * with rows above them the page offered the visitor two identical devices
   * and let the type size carry the difference. And the card is the shape of
   * what it leads to, .st-fnd-hit, so the choice looks like the answer.
   *
   * A BORDER, NOT A RING. commerce.ts has the note: forced-colours mode drops
   * box-shadow, so a card drawn with one has no edge there at all. */
  /* The skip list stays a narrow, quiet column — it is the escape hatch, and
   * the cards above it are the offer. The RESULT cards do not: see
   * .st-fnd-hit, where the band is used by the card's own layout. */
  :root[data-theme="studio"] .st-fnd-list {
    max-inline-size: 38rem;
  }
  :root[data-theme="studio"] .st-fnd-opts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(14px, 1.4vw, 22px);
  }
  @media (max-width: 620px) {
    :root[data-theme="studio"] .st-fnd-opts { grid-template-columns: minmax(0, 1fr); }
  }
  /* ⚠️ ONLY WHERE THE LEAD IS NOT. The lead carries the step between the
   * question and its answers, and it is printed on the FIRST question only —
   * so on questions two and three the cards sat 9px under the h1's
   * descenders. Adjacent-sibling, not a margin on the list itself, because
   * that would stack with the lead's own bottom margin on the entry page. */
  :root[data-theme="studio"] .st-fnd h1 + .st-fnd-opts {
    margin-block-start: clamp(26px, 3vw, 44px);
  }
  /* The li stretches to the row's height and the card fills it, so both
   * arrows sit on one line however long the two hints are. */
  :root[data-theme="studio"] .st-fnd-opts li { display: flex; }
  :root[data-theme="studio"] .st-fnd-opt {
    display: flex;
    flex-direction: column;
    inline-size: 100%;
    padding: clamp(20px, 2.2vw, 32px);
    border: var(--bw-line) solid var(--line);
    border-radius: var(--r-card);
    text-decoration: none;
    transition: border-color .2s ease, background-color .2s ease;
  }
  /* No outline rule here: render/css.ts rings every <a> on :focus-visible,
   * and the card is one. This is the surface change the pointer gets, given
   * to the keyboard as well. */
  :root[data-theme="studio"] .st-fnd-opt:hover,
  :root[data-theme="studio"] .st-fnd-opt:focus-visible {
    border-color: var(--line-strong);
    background: var(--bg-alt);
  }
  /* The label and its hint, as one block: the markup wraps them in a span so
   * the arrow can be a sibling the auto margin can push down. */
  :root[data-theme="studio"] .st-fnd-opt > span:first-child {
    display: grid;
    gap: 6px;
    min-inline-size: 0;
  }
  :root[data-theme="studio"] .st-fnd-opt b {
    display: block;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
    text-wrap: balance;
  }
  :root[data-theme="studio"] .st-fnd-opt b + span {
    display: block;
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
    /* The hints are one sentence; 30rem keeps the longer of the two off a
     * 660px line inside a card that is itself the measure's container. */
    max-inline-size: 30rem;
  }
  /* ⚠️ margin-block-start:auto IN A FLEX COLUMN, which is the version of this
   * that works — page.ts spent a round on the grid one, where align-content
   * leaves the free space outside the tracks and an auto margin has nothing
   * to take. Here it pushes the arrow to the floor of the card. */
  :root[data-theme="studio"] .st-fnd-opt .st-fnd-go {
    margin-block-start: auto;
    padding-block-start: clamp(16px, 1.6vw, 26px);
    /* --t-h6: 22px is the PHONE h6 and was frozen at all three tiers, so it
     * was off-ramp from 834 up. */
    font-size: var(--t-h6);
    line-height: 1;
    color: var(--ink-mute);
    transition: transform 0.3s ease-out, color 0.3s ease-out;
  }
  :root[data-theme="studio"] .st-fnd-opt:hover .st-fnd-go,
  :root[data-theme="studio"] .st-fnd-opt:focus-visible .st-fnd-go {
    transform: translateX(6px);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-fnd-visit {
    margin: clamp(22px, 3vw, 34px) 0 0;
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    max-inline-size: 34rem;
  }
  :root[data-theme="studio"] .st-fnd-visit a { color: var(--ink); text-underline-offset: 3px; }
  /* ⚠️ THE STEP ABOVE THIS LINK WAS BEING CANCELLED BY THE LINE UNDER IT.
   * margin-top: clamp(22px, 3vw, 36px) was declared first and margin-block:
   * -10px second, in the same rule, so the shorthand overwrote it: the link
   * sat 10px ABOVE where it should, and on the result page "← Začnite znova"
   * hugged the sentence before it as though it were part of that paragraph.
   *
   * The -10px is the other half of a 44px target built from 10px of padding,
   * so it has to stay; the step it was eating is folded into it. */
  :root[data-theme="studio"] .st-fnd-back {
    display: inline-block;
    font-size: var(--t-body);
    color: var(--ink-mute);
    text-underline-offset: 3px;
    padding-block: 10px;
    margin-block: calc(clamp(22px, 3vw, 36px) - 10px) -10px;
  }
  /* The verdict: the recommended model as a ruled card row. */
  :root[data-theme="studio"] .st-fnd-why {
    font-size: var(--t-lead);
    line-height: var(--lh-lead);
    color: var(--ink-body);
    margin: 0 0 clamp(26px, 3vw, 40px);
    /* The lead's own 36rem. This is the sentence that says why the quiz
     * chose this model, at the same rung as the lead on the entry page, and
     * it was the one piece of running text on the page with no measure. */
    max-inline-size: 36rem;
  }
  :root[data-theme="studio"] .st-fnd-hits {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 14px;
  }
  :root[data-theme="studio"] .st-fnd-hit {
    border: var(--bw-line) solid var(--line);
    border-radius: var(--r-card);
    padding: clamp(18px, 2.4vw, 28px);
    display: grid;
    gap: 6px;
  }
  :root[data-theme="studio"] .st-fnd-hit .name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-fnd-hit .meta { color: var(--ink-mute); font-size: var(--t-body); }
  :root[data-theme="studio"] .st-fnd-hit .price {
    color: var(--ink);
    font-weight: var(--w-body-med);
    font-variant-numeric: tabular-nums;
  }
  :root[data-theme="studio"] .st-fnd-hit .acts {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  /* ⚠️ THE PAYOFF OF THE WHOLE QUIZ WAS A SMALL BOX IN THE CORNER. Capped at
   * 38rem it sat 608px wide in a 1360px band with the rest of the screen
   * empty, under a question whose two answers had just spanned the band.
   *
   * Above 900 the card takes the band and lays itself out instead: the model,
   * what is in it and the price on the left, the two controls on the right,
   * aligned to the centre of the row. Two recommendations stack as two of
   * these — the tree returns one or two slugs, never a grid of them. */
  @media (min-width: 900px) {
    :root[data-theme="studio"] .st-fnd-hit {
      grid-template-columns: minmax(0, 1fr) auto;
      column-gap: clamp(24px, 3vw, 48px);
      padding: clamp(24px, 2.6vw, 36px);
    }
    /* ⚠️ EVERY CELL PLACED, because auto-placement around a spanning item put
     * the PRICE in the right-hand column under the buttons — the one figure
     * that has to sit with the model it belongs to. Three rows of text in
     * column one, the controls centred beside them in column two. */
    :root[data-theme="studio"] .st-fnd-hit .name,
    :root[data-theme="studio"] .st-fnd-hit .meta,
    :root[data-theme="studio"] .st-fnd-hit .price { grid-column: 1; }
    :root[data-theme="studio"] .st-fnd-hit .acts {
      grid-column: 2;
      grid-row: 1 / span 3;
      align-self: center;
      margin-top: 0;
      flex-wrap: nowrap;
    }
  }
  :root[data-theme="studio"] .st-fnd-hit .acts a {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    text-decoration: none;
    padding: 12px 18px;
    border-radius: var(--r-ctrl);
    border: var(--bw-line) solid var(--ink);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-fnd-hit .acts a.fill {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
    color: var(--on-invert);
  }

  /* The way past the quiz. Deliberately QUIETER than the questions above it:
   * the same hairline rows, but smaller type and muted until hover, so the
   * page still reads as one primary path with an exit rather than two
   * competing offers. */
  :root[data-theme="studio"] .st-fnd-skip {
    margin-block-start: clamp(48px, 6vw, 80px);
    /* No border-top: the option list's own last hairline already closes the
     * group, and two rules sandwiching 78px of nothing read as a row that
     * failed to render. The white gap IS the separator. */
    padding-block-start: 0;
  }
  :root[data-theme="studio"] .st-fnd-skip h2 {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-mute);
    margin: 0 0 10px;
  }
  :root[data-theme="studio"] .st-fnd-skip > p {
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    margin: 0 0 20px;
    max-inline-size: 34rem;
  }
  :root[data-theme="studio"] .st-fnd-list {
    list-style: none;
    margin: 0 0 20px;
    padding: 0;
    border-block-start: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-fnd-list li {
    border-block-end: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-fnd-list a {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 16px;
    /* Tighter than the question's options on purpose: this list is the
     * escape hatch, not the answer, and it must not weigh what it serves. */
    padding: 10px 2px;
    text-decoration: none;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-fnd-list a > span:first-child {
    display: grid;
    gap: 2px;
    min-inline-size: 0;
  }
  :root[data-theme="studio"] .st-fnd-list b {
    font-weight: var(--w-body-med);
    font-size: var(--t-body);
  }
  :root[data-theme="studio"] .st-fnd-list b + span {
    color: var(--ink-mute);
    font-size: var(--t-body);
  }
  :root[data-theme="studio"] .st-fnd-list a:hover b,
  :root[data-theme="studio"] .st-fnd-list a:focus-visible b {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  :root[data-theme="studio"] .st-fnd-list .st-fnd-go {
    color: var(--ink-mute);
    transition: transform 0.3s ease-out, color 0.3s ease-out;
  }
  :root[data-theme="studio"] .st-fnd-list a:hover .st-fnd-go,
  :root[data-theme="studio"] .st-fnd-list a:focus-visible .st-fnd-go {
    transform: translateX(3px);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-fnd-more {
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
    margin: 0;
    max-inline-size: 34rem;
  }
  :root[data-theme="studio"] .st-fnd-more a { color: var(--ink); }
  :root[data-theme="studio"] .st-fnd-note-h {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-mute);
    margin: clamp(28px, 3vw, 40px) 0 10px;
  }
  :root[data-theme="studio"] .st-fnd-note {
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    margin: 0 0 12px;
    max-inline-size: 34rem;
  }
  :root[data-theme="studio"] .st-fnd-note:last-child { margin-block-end: 0; }
  /* ⚠️ THREE COLUMNS, AND THE REASON IS MEASURED. These three paragraphs are
   * the small print under the questionnaire — what it matches on, what it
   * does not store, why it never asks a budget. Stacked at a reading measure
   * they were a 400px-tall band of page whose content reached 35% of the way
   * across, which a site-wide fill sweep flagged as the only such region left
   * on any route.
   *
   * Columns rather than a wider measure: at 1560 a single column would run
   * ~195 characters a line. Three tracks give ~477px each, about 60
   * characters, which is inside the same 45–75 band every other measure on
   * this site is set to. The label spans them so it still reads as one note
   * rather than three.
   *
   * A GRID, not CSS columns: a columns:3 flow would break one paragraph across a
   * break, and these three are separate statements that must not be read as
   * continuous prose. One paragraph per cell, and auto-fit collapses to one
   * column on a phone with no second rule. */
  :root[data-theme="studio"] .st-fnd-notes {
    display: flex;
    flex-wrap: wrap;
    align-items: start;
    column-gap: clamp(32px, 3vw, 64px);
    row-gap: clamp(18px, 2vw, 28px);
  }
  :root[data-theme="studio"] .st-fnd-notes .st-fnd-note-h { flex: 0 0 100%; }
  /* FLEX, for the reason the contact tiles are flex: a wrapped grid strands
   * its last row. Three notes in a track that fits two leaves the third at
   * half width with a hole beside it — the same orphan auto-fit produces
   * everywhere, and the fill sweep caught it at 1024 sitting at 48%.
   *
   * Grown, but capped: without max-inline-size a lone note on the last row
   * would stretch to the whole 974px band and set at ~122 characters, which
   * trades one defect for a worse one. 38rem is the site's reading measure,
   * so the widest a note can ever be is the width a paragraph is set at
   * everywhere else. */
  :root[data-theme="studio"] .st-fnd-notes .st-fnd-note {
    flex: 1 1 20rem;
    max-inline-size: 38rem;
    margin-block-end: 0;
  }
  :root[data-theme="studio"] .st-fnd-note a {
    color: var(--ink);
    text-underline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-fnd-list .st-fnd-go,
    :root[data-theme="studio"] .st-fnd-opt,
    :root[data-theme="studio"] .st-fnd-opt .st-fnd-go { transition: none; }
    :root[data-theme="studio"] .st-fnd-list a:hover .st-fnd-go,
    :root[data-theme="studio"] .st-fnd-list a:focus-visible .st-fnd-go,
    :root[data-theme="studio"] .st-fnd-opt:hover .st-fnd-go,
    :root[data-theme="studio"] .st-fnd-opt:focus-visible .st-fnd-go {
      transform: none;
    }
  }
`;

/** An answer set as a URL, with no trailing "?" on the empty one. */
function href(base: string, a: FinderAnswers): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(a)) if (v) p.set(k, v);
  const q = p.toString();
  return q ? base + "?" + q : base;
}

/**
 * "Vprašanje 2" / "Zadnje vprašanje" — a count, never a total.
 *
 * The old label said "od 3" everywhere and delivered three questions on one
 * path of three: swimming resolves in two, and six-people ends the
 * relaxation branch at two. A total that depends on answers not yet given
 * is not a fact, so the label states the number — and says "last" exactly
 * where that is provable, which is when every choice of the current step
 * terminates the tree.
 */
function progress(answered: number, seen: FinderAnswers, step: FinderStep): string {
  const last = step.choices.every(
    (c) => nextStep({ ...seen, [step.param]: c.value }) === null,
  );
  return last && answered > 0 ? "Zadnje vprašanje" : "Vprašanje " + (answered + 1);
}

function stepHtml(
  shop: ShopConfig,
  content: ShopContent,
  a: FinderAnswers,
  step: FinderStep,
): string {
  const base = shop.routeSlugs["/finder"];
  // ⚠️ ONLY ANSWERS THE TREE ACCEPTED — walk() replays the branch and drops
  // everything else. Counting raw query entries did two wrong things at
  // once: a stray ?osebe=nonsense made `answered` non-zero, which hid the
  // lead, the catalogue and the trust notes from the entry page (the only
  // page carrying the outbound product links), and every option href copied
  // the nonsense forward — one click away from the replay loop the module
  // note in content/finder.ts describes.
  const accepted = walk(a).seen;
  const params = new URLSearchParams();
  let answered = 0;
  for (const [k, v] of Object.entries(accepted)) {
    if (v) {
      params.set(k, v);
      answered++;
    }
  }
  const back = previousAnswers(accepted);
  return (
    '<p class="st-fnd-eyebrow">' + esc(progress(answered, accepted, step)) + "</p>" +
    "<h1>" + esc(step.question) + "</h1>" +
    // The lead only on the FIRST question: it says what this is and what it
    // costs the visitor. Repeating it above questions two and three would be
    // explaining a thing already in progress.
    (answered === 0
      ? '<p class="st-fnd-lead">Dve do tri vprašanja, pol minute — potem predlagamo ' +
        "model iz naše ponudbe in povemo, zakaj prav tega. Ničesar ni treba " +
        "vpisati.</p>"
      : "") +
    '<ul class="st-fnd-opts">' +
    step.choices
      .map((c) => {
        const p = new URLSearchParams(params);
        p.set(step.param, c.value);
        return (
          '<li><a class="st-fnd-opt" href="' + esc(base + "?" + p.toString()) + '">' +
          "<span><b>" + esc(c.label) + "</b><span>" + esc(c.hint) + "</span></span>" +
          '<span class="st-fnd-go" aria-hidden="true">→</span></a></li>'
        );
      })
      .join("") +
    "</ul>" +
    // ONE QUESTION BACK, not to the beginning. The browser's back button
    // does this too, but a visitor who has answered two questions and wants
    // to change the second should not have to trust that — or redo both.
    (back
      ? '<a class="st-fnd-back" href="' + esc(href(base, back)) +
        '">← Prejšnje vprašanje</a>'
      : "") +
    // THE WAY PAST THE QUIZ, on the first question only. Two visitors arrive
    // here and only one of them wants to be asked anything: the other already
    // knows the models and is looking for the list. Question two and three are
    // mid-flow and this would be an interruption, so it is shown once.
    //
    // It also settles what the SEO audit called a dead end. Every other route
    // on this site hands a crawler somewhere to go next; the entry question
    // handed it two links back to itself, so the finder sat outside the link
    // graph despite being in the sitemap. These are real product links, and
    // the figures beside them are the catalogue's own.
    (answered === 0 ? skipHtml(shop, content) : "")
  );
}

/**
 * The catalogue, restated as links for whoever does not want three questions.
 *
 * ⚠️ FIGURES COME FROM THE PDP'S OWN BAR — the same line printed on the
 * model's page — so this block cannot drift from the specification a visitor
 * checks it against.
 */
function skipHtml(shop: ShopConfig, content: ShopContent): string {
  const pdps = content.pdps ?? [content.pdp];
  const productBase = shop.routeSlugs["/product"] + "/";
  return (
    '<div class="st-fnd-skip">' +
    "<h2>Ali pa kar preskočite vprašanja</h2>" +
    "<p>Vseh " + pdps.length + " modelov v ponudbi, z merami in ceno na strani " +
    "vsakega. Vprašanja zgoraj so bližnjica, ne pogoj — če veste, kaj iščete, " +
    "pojdite naravnost na model.</p>" +
    '<ul class="st-fnd-list">' +
    pdps
      .map(
        (d) =>
          '<li><a href="' + esc(productBase + d.slug) + '">' +
          "<span><b>" + esc(d.title) + "</b><span>" + esc(d.bar[1]) + "</span></span>" +
          '<span class="st-fnd-go" aria-hidden="true">→</span></a></li>',
      )
      .join("") +
    "</ul>" +
    '<p class="st-fnd-more">Za odločitev med masažnim bazenom in swim spa ' +
    'bazenom je <a href="' + esc(shop.routeSlugs["/compare"]) + '">primerjava</a> ' +
    'krajša pot kot ta vprašalnik; cel katalog s cenami je v <a href="' +
    esc(shop.routeSlugs["/products"]) + '">trgovini</a>, ' +
    'kaj je pred dostavo treba pripraviti pa piše v <a href="' +
    esc(shop.routeSlugs["/guides"]) + '">vodnikih</a>.</p>' +
    // WHAT THE TOOL IS AND IS NOT, said before it is used rather than after.
    // A recommender that does not explain itself is asking to be read as a
    // sales funnel — and this one has an honest answer, because it maps a
    // six-model catalogue exactly rather than scoring it: every verdict is
    // derived from figures already published on the model's own page, which
    // is why a visitor can check one against the other.
    // The label and the three notes are ONE block so they can lay out as a
    // row. See .st-fnd-notes: three paragraphs of small print stacked at a
    // reading measure left a 400px band of the page reaching only 35% across
    // — the one region the site-wide fill audit still flagged.
    '<div class="st-fnd-notes">' +
    '<h2 class="st-fnd-note-h">Na čem temelji predlog</h2>' +
    '<p class="st-fnd-note">Vprašanja zožijo izbiro na podlagi tega, kar o modelih ' +
    "piše v specifikaciji: mere školjke, število mest in ležalnikov, število šob in " +
    "črpalk. Ponudba šteje šest modelov, zato preslikave ni treba ocenjevati — " +
    "vsak odgovor vodi do modela, ki tem merilom ustreza, in ob predlogu piše, " +
    "zakaj prav ta. Vsako številko lahko preverite na strani modela.</p>" +
    '<p class="st-fnd-note">Ničesar ne vpišete in ničesar ne shranimo: odgovori ' +
    "potujejo v naslovni vrstici, zato lahko povezavo do predloga tudi shranite ali " +
    "pošljete naprej. Predlog tudi ni ponudba — ali model pri vas gre skozi in ali " +
    "podlaga zdrži, se pokaže šele na " +
    '<a href="' + esc(shop.routeSlugs["/showroom"]) + '">ogledu lokacije</a>, ' +
    "ki je brezplačen in ga opravimo pred ponudbo.</p>" +
    // NO BUDGET QUESTION, and the omission is deliberate enough to say out
    // loud: a quiz that asks what you can spend and then recommends up to it
    // is doing something other than matching a catalogue. The price is on
    // every model's page either way, so the question would buy nothing.
    '<p class="st-fnd-note">Vprašanja o proračunu namenoma ni. Cena vsakega ' +
    "modela je napisana na njegovi strani in je za vse obiskovalce enaka; " +
    "zavezujoča cena za vašo konfiguracijo pride v pisni ponudbi.</p>" +
    "</div>" +
    "</div>"
  );
}

function resultHtml(
  shop: ShopConfig,
  content: ShopContent,
  a: FinderAnswers,
): string {
  const r = recommend(a);
  const pdps = content.pdps ?? [content.pdp];
  const hits = r.slugs
    .map((slug) => pdps.find((d) => d.slug === slug))
    .filter((d): d is PdpContent => d !== undefined);
  const productBase = shop.routeSlugs["/product"] + "/";
  const contact = shop.routeSlugs["/contact"];
  return (
    '<p class="st-fnd-eyebrow">Naš predlog</p>' +
    "<h1>" + esc(hits[0]?.title ?? "Predlog") + "</h1>" +
    '<p class="st-fnd-why">' + esc(r.why) + "</p>" +
    '<ul class="st-fnd-hits">' +
    hits
      .map(
        (d) =>
          '<li class="st-fnd-hit">' +
          '<span class="name">' + esc(d.title) + "</span>" +
          '<span class="meta">' + esc(d.bar[1]) + "</span>" +
          '<span class="price">' + esc(d.price) +
          (d.price.includes("€") ? " z DDV" : "") + "</span>" +
          '<div class="acts">' +
          '<a class="fill" href="' + esc(contact + "?model=" + d.slug) + '">Povprašajte za ponudbo</a>' +
          '<a href="' + esc(productBase + d.slug) + '">Ogled modela</a>' +
          "</div></li>",
      )
      .join("") +
    "</ul>" +
    // THE VISIT, OFFERED HERE. A visitor who has just been handed a model is
    // exactly the one whose next question is "but does it fit at my place?"
    // — and the free site check is the shop's real differentiator, so the
    // recommendation ends by naming it rather than by trailing off.
    '<p class="st-fnd-visit">Niste prepričani, ali model pri vas gre skozi in ' +
    'ali podlaga zdrži? <a href="' + esc(shop.routeSlugs["/showroom"]) +
    '">Ogled lokacije je brezplačen</a> in vas k ničemur ne zavezuje.</p>' +
    '<a class="st-fnd-back" href="' + esc(shop.routeSlugs["/finder"]) +
    '">← Začnite znova</a>'
  );
}

/** The whole page body: chrome, one card, chrome. */
export function renderStudioFinder(
  // ⚠️ ctx ARRIVES BUILT, and the reason is a module cycle: buildCtx lives
  // in render/page.ts, which imports the asset paths, whose module hashes
  // the stylesheet, which is assembled from the studio index — importing
  // page.ts from a studio module closes that ring and BASE_CSS is
  // undefined at init on some entry orders. The worker builds the ctx; a
  // theme module only renders with it.
  ctx: RenderCtx,
  a: FinderAnswers,
): string {
  const shop = ctx.shop;
  const content = ctx.content;
  // Sanitize ONCE at the door: everything below sees only accepted answers.
  const clean = walk(a).seen;
  const step = nextStep(clean);
  const inner = step ? stepHtml(shop, content, clean, step) : resultHtml(shop, content, clean);
  return (
    renderStudioHeader(ctx) +
    '<main><section class="st-fnd"><div class="st-fnd-in">' +
    inner +
    "</div></section></main>" +
    renderStudioFooter(ctx)
  );
}
