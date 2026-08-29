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
import { isSet, isSetPhone, isSetVat, isSetZip } from "../../lib/filled";
import type { Block, Page } from "../../content/pages";
import { decorativeImg, sitePhoto } from "./media";
import { contactIcon, type IconKey } from "./icons";
// ⚠️ THE CONSENT SENTENCE IS IMPORTED, NEVER RETYPED. The same string is
// written to the enquiries row, and a page that printed different words
// would make the stored record evidence of consent to something else.
import { CONSENT_TEXT } from "../../enquiry/submit";
import { formatEur } from "../../catalog/pricing";

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
    /* ⚠️ NOT THE FULL RHYTHM ON TOP. --studio-rhythm is 170px and it is the
     * gap between full-bleed bands on the home page — a distance that reads
     * as a deliberate pause between two coloured grounds. A document has no
     * band above it, only the fixed chrome, so the same 170px reads as the
     * page not starting: measured on /o-nas at 1440x1000, the eyebrow sat
     * 235px down and the title was the only thing above the fold.
     *
     * The chrome floats over this section, so the top still has to clear it —
     * hence a floor rather than nothing. The bottom keeps the full rhythm,
     * because below the last block there IS a band: the footer. */
    padding-block: clamp(48px, 6.5vw, 96px) var(--studio-rhythm);
    background: var(--bg);
  }
  /* ⚠️ THE CLASS IS REPEATED TO WIN A TIE, and the tie is worth naming.
   *
   * chrome.ts gives the site's first-child section rule (main > section,
   * first child, not the hero) the full
   * --studio-rhythm as padding-top, for sections that follow a full-bleed band
   * and would otherwise start hard against it. A subpage IS that first child,
   * so it collected 170px there regardless of what the rule above asked for —
   * measured: cutting .st-page's own padding moved the eyebrow from 235px to
   * 226px, which is the rounding, not the rule.
   *
   * Both selectors carry the same specificity (0,4,2), so source order decides
   * and neither file should have to know which stylesheet is concatenated
   * first. Repeating .st-page makes this one strictly higher and the outcome
   * independent of order. It is a blunt device and it is documented rather
   * than clever: the alternative is a rule in chrome.ts excluding .st-page,
   * which puts knowledge of the subpage renderer into the site chrome. */
  :root[data-theme="studio"] main > section.st-page.st-page:first-child {
    padding-top: clamp(48px, 6.5vw, 96px);
  }
  /* THE MEASURE MOVED OFF THE CONTAINER, and that is the whole restructure.
   *
   * Every subpage used to be ONE 31rem column centred in the viewport: the
   * title, the section index, the prose, the fact tables and the closing call
   * to action, all 496px wide, with 944px of empty page beside them at 1440.
   * Two things went wrong with that, and they pull in opposite directions:
   *
   *   - the TITLE wrapped. "Dostava in montaža" and "Primerjava modelov" both
   *     broke across two lines in a column sized for running text, which is
   *     the one line on the page that should not have to;
   *   - the TABLES were crushed. A fact row is a 12rem label beside its
   *     value, so inside 31rem the value gets about 220px: on /primerjava
   *     every single value wrapped to two or three lines, in the one block on
   *     the page whose entire job is to be scanned.
   *
   * So the container is now the studio container and the 31rem measure is
   * carried by the things that are actually running text — see
   * .st-page-block, which applies it by default, and the --wide modifier the
   * renderer puts on the data blocks that opt out. The measure itself is
   * unchanged and its calibration note above still stands: 64 median
   * characters, 73 at worst, re-measure if --t-body or the body face moves. */
  /* .st-page-in is layout.ts's container like every band. It used to say the
   * same thing a third way — min(container, 100% - 2*gutter) — which agrees
   * with the shared arithmetic at every viewport but had to be re-derived by
   * anyone checking whether the content pages line up with the home page. */
  /* Below the two-column tier this is simply the old single column: the grid
   * is inert, and the max-inline-size is the same 31rem the container used to
   * carry, so a phone and a tablet get exactly the page they had. */
  :root[data-theme="studio"] .st-page-grid {
    max-inline-size: 38rem;
    margin-inline: auto;
  }
  /* THE INDEX BECOMES A RAIL at the width where there is room for one.
   *
   * 1100px is where 15rem of rail, 80px of gutter and 40rem of column stop
   * fitting inside the container with air to spare — below it the index goes
   * back to being an interruption of the single column, which is what it was
   * built as and still reads correctly as.
   *
   * The masthead sits in the CONTENT column rather than spanning both, so the
   * h1, the standfirst and the first paragraph of the document share one left
   * edge; a title that started 15rem left of its own text would read as a
   * banner over the page rather than the head of it. Reading order is the DOM
   * order — head, index, body — which is also the order a screen reader wants
   * and the order the tab key takes. */
  /* ⚠️ 1000px, NOT 1100. The old threshold left 1024 and 1099 — every tablet
   * in landscape, and the widest the single-column tier ever gets — showing a
   * 544px column in a 1099px window: 49.5% of the screen, with 277px of empty
   * on each side of a page whose own wrapper measured 1049px. The rail had
   * room from about 1000px and was being withheld for a hundred pixels.
   *
   * The columns are minmax(0, …), so where the pair does not fit the content
   * column shrinks rather than overflowing — which is what happens between
   * 1000 and about 1130, and is a better page than half a screen of margin.
   * It also puts this tier on the same threshold as the product page's own
   * two-column rule (min-width: 1001px, pdp.ts), so the whole site changes
   * shape at one width instead of two. */
  @media (min-width: 1000px) {
    :root[data-theme="studio"] .st-page-grid {
      display: grid;
      max-inline-size: none;
      /* 56rem, not 46: this track is the WIDE measure — the width a compare
       * table, a facts list, a contact grid and a photograph band get to
       * use. Running text never sees it (.st-page-block caps itself), so
       * widening the track costs prose nothing and buys the data blocks
       * 160px. Measured at 1920: the page's right edge moves out by that
       * much, which is what closes the gap the container was leaving. */
      /* ⚠️ 1fr, NOT 56rem. The track used to cap at 56rem, and measured at
       * 2560 the widest thing on a content page ended 368px before the band
       * it sits in — 371px at 1920, 190px at 1440. That is a strip of
       * content in a wide frame, and it is what "the width is still not ok"
       * is looking at.
       *
       * The cap was protecting running text, which does not need protecting
       * here: prose carries its own measure (see .st-page-p and friends
       * below), so widening the track costs it nothing and lets the things
       * that SHOULD span — a photograph, a fact table, a compare table, a
       * row of question hairlines — reach the band's own right edge. */
      /* ⚠️ THE DOCUMENT HAS A WIDTH. It used to have the viewport's.
       *
       * The track is 1fr, so the wide blocks — a fact table, a compare
       * table, a photograph — grew with the window while the prose beside
       * them kept its 38rem measure, as prose must. Measured: the gap
       * between where a paragraph ends and where the table under it ends
       * was 438px at 1440 and 619px at 1920. It TRACKED THE VIEWPORT, so
       * the page looked more broken the bigger the screen, which is why it
       * kept being reported after each fix.
       *
       * 76rem is the cap: 16rem of rail, 80px of gutter and 54rem of body.
       * The gap between the two edges is then ~294px at every width above
       * it instead of growing without limit, and the leftover becomes page
       * margin — which is what a document with a definite width looks like.
       *
       * ⚠️ AND IT IS ON THE GRID, NOT THE TRACK. An earlier pass capped the
       * track at 56rem and was reverted because the widest thing on the page
       * then stopped 368px before the band it sat in — a strip of content in
       * a wide frame. The difference is that the band now ends where the
       * document ends: nothing is left hanging inside a wrapper that runs on
       * past it. justify-content stays start, so the h1 keeps the left edge
       * the wordmark and the footer are on. */
      max-inline-size: 76rem;
      /* ⚠️ 0, NOT auto. The single-column rule above sets margin-inline:auto
       * to centre a 38rem page on a phone, and that declaration survives into
       * this tier — where, the moment the grid gained a cap, it started
       * CENTRING the document. Measured at 1920: the body began at 685 while
       * the wordmark above it and the footer below it began at 180. The cap
       * would have reintroduced, on its first render, the exact misalignment
       * the justify-content note below was written to fix. */
      margin-inline: 0;
      grid-template-columns: minmax(0, 16rem) minmax(0, 1fr);
      column-gap: clamp(48px, 4vw, 80px);
      /* ⚠️ start, NOT center — this is the second half of the alignment the
       * container rule fixed one layer up, and it is the half a reader can
       * actually see.
       *
       * justify-content: center makes the tracks CONTENT-sized and then
       * centres the leftover, so this document floated inside its own band:
       * measured at 1920, the band starts at 180 and every one of these
       * pages started its h1 at 345.6 — and /vodniki, whose body track does
       * not reach 56rem, started at 489.6. The header wordmark, the footer
       * and every home-page heading start at 180. Fifteen routes were the
       * only things on the site not on that line.
       *
       * The tracks are minmax(0, …) so they still shrink rather than
       * overflow between 1000 and ~1130; what changes is where the leftover
       * goes. It goes to the right, which is where a left-aligned document
       * puts it. */
      justify-content: start;
    }
    /* ⚠️ THE MASTHEAD SPANS BOTH COLUMNS, and this note replaces one arguing
     * the opposite. That note said a title starting 15rem left of its own
     * text would read as a banner over the page rather than the head of it,
     * and pinned the head to the content column so the h1, the standfirst and
     * the first paragraph shared one left edge.
     *
     * It is a real typographic argument and the rendered page refuted it. The
     * head in column two left the entire top-left of the document empty, and
     * the index — three short links — sat alone in that emptiness, below the
     * title, with nothing above it. What the reader saw was not a document
     * with a tidy left edge; it was a narrow strip of text pushed to the right
     * of a mostly blank page, which is exactly what was reported.
     *
     * Spanning both puts the eyebrow, the h1 and the hairline at the
     * document's true left edge, gives the index something to sit under, and
     * makes the rule under the masthead as wide as the thing it closes. The
     * body's left edge no longer matches the title's — that is the cost, and
     * it is the smaller one. */
    :root[data-theme="studio"] .st-page-head { grid-area: 1 / 1 / 2 / -1; }
    :root[data-theme="studio"] .st-page-rail { grid-area: 2 / 1; }
    :root[data-theme="studio"] .st-page-body { grid-area: 2 / 2; }
    /* A PAGE WITH NO INDEX HAS NO RAIL, and must not reserve a track for one.
     * Fewer than three headed sections and the index is furniture, so it is
     * not rendered — but the grid still declared two columns and pinned the
     * text to the second, which parked the whole document 15rem right of
     * centre with an empty margin where the rail would have been. The legal
     * pages are exactly this shape. */
    :root[data-theme="studio"] .st-page-grid--solo {
      grid-template-columns: minmax(0, 1fr);
    }
    /* ⚠️ A PAGE WITH NOTHING WIDE ON IT SHRINKS TO ITS TEXT.
     *
     * The track carries the wide measure so tables and photographs can use
     * it — but a page that is only prose and steps (/vodniki is three guide
     * articles, /piskotki is four paragraphs) never fills it, and the unused
     * 288px sat entirely on the right: the page read as pushed left, which
     * is exactly the "does not use the full width" report. Centring cannot
     * fix that, because what is centred is the TRACK, not the text in it.
     *
     * So the track asks what is in it. :has() is already load-bearing in this
     * theme (the chrome's four-track bar, the figure's rhythm); where it is
     * unsupported the page simply keeps the wide track, which is today's
     * layout — a graceful degradation to the status quo, never to a break.
     *
     * Source order settles the solo pair, the same way it already does for
     * the rule above it. */
    :root[data-theme="studio"] .st-page-grid:not(:has(.st-page-block--wide)) {
      grid-template-columns: minmax(0, 16rem) minmax(0, 38rem);
    }
    :root[data-theme="studio"] .st-page-grid--solo:not(:has(.st-page-block--wide)) {
      grid-template-columns: minmax(0, 38rem);
    }
    :root[data-theme="studio"] .st-page-grid--solo .st-page-head { grid-area: 1 / 1; }
    :root[data-theme="studio"] .st-page-grid--solo .st-page-body { grid-area: 2 / 1; }
    /* Sticky, so a document three screens long keeps its map. align-self:
     * start is what gives the rail a box shorter than its row — a stretched
     * grid item is as tall as the body and has nothing to stick against. */
    :root[data-theme="studio"] .st-page-rail {
      position: sticky;
      align-self: start;
      top: calc(var(--chrome-h) + 32px);
    }
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
    /* The masthead spans BOTH columns, so without a cap a long title would
     * set across the full 56rem-plus-rail width as one line of display type. */
    max-inline-size: 46rem;
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
    /* The standfirst keeps a measure of its own: the head is 40rem wide so the
     * title can have it, and a 20px lead run to 40rem is 75 characters — past
     * the top of the range the body measure was calibrated against. */
    max-inline-size: 38rem;
    margin-block-start: clamp(16px, 1.6vw, 26px);
    font-family: var(--f-body);
    font-size: var(--t-lead);
    line-height: var(--lh-lead);
    color: var(--ink-body);
    text-wrap: pretty;
  }
  /* A hairline closes the masthead and opens the body.
   *
   * It hangs off the HEAD rather than the body now, because in the two-column
   * form the body is one grid cell of two: a rule on it would start 15rem in,
   * leaving the index sitting above an unruled gap. On the head it draws
   * under the title, across the content column, at every width. */
  :root[data-theme="studio"] .st-page-head {
    padding-block-end: clamp(40px, 4.4vw, 72px);
    border-block-end: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-page-body {
    margin-block-start: clamp(40px, 4.4vw, 72px);
  }
  :root[data-theme="studio"] .st-page-rail {
    margin-block-start: clamp(40px, 4.4vw, 72px);
  }
  /* THE 404 AND THE PLACEHOLDER ROUTES STILL WEAR THE KERNEL'S CARD, and its
   * one button is .btn-fill: the accent colour with the accent's own
   * foreground on it. On this shop's aqua that measures 3.51:1 — a fail of
   * WCAG 1.4.3 at a 15px label — and it is the ONLY control a lost visitor
   * has on the page. Found by scripts/audit-site.mjs the first time a route
   * in routeSlugs had no synchronous handler and fell through to the 404.
   *
   * Studio's primary control is an ink fill everywhere else — the product
   * page's buy button, the chrome's icon buttons — so the placeholder takes
   * the same one. 16:1, and the one button on the site that did not look like
   * this theme now does. */
  /* And the same VOICE, not only the same ink. The kernel's .btn is 15px
   * bold sentence case on a rounded pill; every studio control is an
   * uppercase, letter-spaced DM Sans label on the control radius. The 404's
   * one button was the last control on the site speaking the other theme's
   * typography. */
  :root[data-theme="studio"] .placeholder .btn-fill {
    background: var(--ink-invert);
    color: var(--on-invert);
    border-color: var(--ink-invert);
    border-radius: var(--r-ctrl);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
  }
  :root[data-theme="studio"] .placeholder .btn-fill:hover {
    filter: none;
    background: var(--ink);
    border-color: var(--ink);
  }

  /* THE MEASURE LIVES HERE. Every block is running text until it says it is
   * not: a paragraph, a numbered procedure, a question and its answer all
   * read at 31rem, which is the width the note at the top of this file
   * measured. A block that is DATA opts out — see --wide, which the renderer
   * puts on the fact tables, the contact block and the imprint. */
  /* THE READING MEASURE — 38rem carries ~71 median characters at --t-body,
   * inside the 45–75 band. Re-measure if --t-body or the body face moves.
   *
   * ⚠️ IT IS ON THE RUNNING TEXT, NOT ON THE BLOCK, and that distinction is
   * the whole of this pass. Capping the BLOCK capped its structure with it:
   * the question hairlines on /pogosta-vprasanja, the numbered rules on
   * /dostava-in-montaza and every disclosure chevron stopped at 608px in a
   * 1224px track, so the page read as a narrow strip with a wide empty
   * margin — which is exactly what it was.
   *
   * A hairline is not a sentence. Structure spans the track; the words
   * inside it keep their measure. That is what an editorial column does,
   * and it is why the chevron now sits at the far right of its own rule
   * where a reader's eye can find it, instead of two thirds of the way in.
   *
   * --wide survives as the marker isWide() puts on data blocks, because the
   * grid still reads it: a page carrying no wide block gets a narrower
   * track, and that rule is what keeps a two-paragraph legal page from
   * being a 1224px column of nothing. */
  :root[data-theme="studio"] .st-page-p,
  :root[data-theme="studio"] .st-page-a,
  :root[data-theme="studio"] .st-page-step-p,
  :root[data-theme="studio"] .st-page-li,
  /* ⚠️ NAMED BY CLASS, NOT BY ELEMENT. A child-ul/ol selector capped every list in the renderer by
   * element, which is only correct for the one that is a run of sentences.
   * It also caught the <ol> the ruled step rows live in and the <ul> the
   * contact tiles live in — so the hairlines and the tiles that were supposed
   * to span the track stopped where a paragraph would, and the fill sweep
   * kept reporting 60% on pages I had already "fixed" twice.
   *
   * .st-page-list is the bullets; .st-page-steps and .st-page-ch are
   * structure and carry their measure on the text inside them. */
  :root[data-theme="studio"] .st-page-list {
    max-inline-size: 38rem;
  }
  /* ⚠️ AND ON THE BLOCK AGAIN — the note above argued the opposite, and the
   * rendered page has now refuted it twice.
   *
   * The argument was sound in the abstract: a hairline is not a sentence, so
   * structure spans the track while the words inside keep their measure.
   * That is what an editorial column does — when the track is a little wider
   * than the measure. Here the track is 1fr, so at 1440 it is 1046px against
   * a 608px measure: 1.72x. A rule that runs 438px past its own last word
   * does not read as an editorial column, it reads as an unfinished one, and
   * it did that on every heading, every question row and every step on
   * fifteen routes. Measured with scripts/_edges.mjs: one spread of 438px per
   * block, on eleven of eleven content pages.
   *
   * So the block carries the measure and the DATA blocks opt out — which is
   * what --wide has always meant. The page still reaches its band's right
   * edge wherever it has something to put there (a fact table, a compare
   * table, a photograph); where it has only sentences, it ends where the
   * sentences end. Two right edges, both deliberate, instead of one right
   * edge and one ragged one. */
  :root[data-theme="studio"] .st-page-block {
    max-inline-size: 38rem;
  }
  :root[data-theme="studio"] .st-page-block--wide {
    max-inline-size: none;
  }
  /* The enquiry form is wide because its two-up rows need room — 44rem, not
   * the whole band. Capping the block to the same 44rem is what puts the
   * heading, the lead-in and the form itself on one right edge instead of
   * three (1400 / 962 / 1058, measured at 1440). */
  :root[data-theme="studio"] .st-page-block--wide:has(> .st-enq) {
    max-inline-size: 44rem;
  }
  /* ---- the photograph band (kind: "figure") ----
   * The FRAME owns the shape: aspect-ratio reserves the box before any bytes
   * arrive (CLS 0 whatever the file), cover crops from the centre, and the
   * radius is the card radius the rest of the theme uses on media. Wider than
   * tall on every tier — an editorial pause between sections, not a poster —
   * and a touch taller on phones, where 5:2 of a 92vw column is a letterbox.
   * --r-media, the radius every other photograph in the theme wears; --r-lg
   * stood here briefly and gave these four bands corners five times rounder
   * than any image on the site (it is the PANEL radius — see .st-page-cta). */
  :root[data-theme="studio"] .st-page-fig {
    margin: 0;
  }
  :root[data-theme="studio"] .st-page-fig-img {
    inline-size: 100%;
    aspect-ratio: 5 / 2;
    object-fit: cover;
    border-radius: var(--r-media);
    display: block;
  }
  @media (max-width: 809px) {
    :root[data-theme="studio"] .st-page-fig-img { aspect-ratio: 16 / 10; }
  }
  :root[data-theme="studio"] .st-page-fig-cap {
    margin-block-start: 10px;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-page-block + .st-page-block {
    margin-block-start: clamp(38px, 4vw, 64px);
  }
  /* The photograph band is a PAUSE, so it takes the section step on both
   * sides — at the block gap it read as a tail hanging off the table above
   * it rather than as its own beat. */
  :root[data-theme="studio"] .st-page-block:has(> .st-page-fig),
  :root[data-theme="studio"] .st-page-block:has(> .st-page-fig) + .st-page-block {
    margin-block-start: clamp(56px, 6vw, 92px);
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
  /* One heading-to-body offset whatever follows. Prose paid it through the
   * paragraph's own top margin; a steps list, a facts table and the compare
   * table paid nothing, so half the site's H2s sat collided with their
   * content while the other half breathed. */
  :root[data-theme="studio"] .st-page-h2 + .st-page-steps,
  :root[data-theme="studio"] .st-page-h2 + .st-page-facts,
  :root[data-theme="studio"] .st-page-h2 + .st-page-qa,
  :root[data-theme="studio"] .st-page-h2 + .st-page-cmp {
    margin-block-start: 20px;
  }
  /* ⚠️ ONE ANCHOR OFFSET, ON THE SCROLLER, FOR EVERY TARGET ON THE PAGE.
   *
   * It used to be per element: this heading carried a scroll-margin, the
   * links nav grew one later, and everything else — #izbor, the skip link's
   * target, a gallery slide — leaned on the kernel's flat 96px scroll-padding.
   * The two mechanisms STACKED: a TOC jump landed 176px under the bar on
   * desktop and 224px on a phone, honest but a third of a phone screen spent
   * on air. And any NEW id was a gamble on which mechanism it happened to
   * inherit.
   *
   * scroll-padding on the root covers every anchor uniformly, so the kernel's
   * flat figure is overridden rather than added to. Desktop: the bar plus a
   * line of air. ≤900 the bar wraps to two rows and measures 104px, never
   * --chrome-h — same three tokens as chrome.ts's own reservation, so the
   * two cannot drift. */
  :root[data-theme="studio"] {
    scroll-padding-top: calc(var(--chrome-h) + 24px);
  }
  @media (max-width: 900px) {
    :root[data-theme="studio"] {
      scroll-padding-top: calc(
        var(--chrome-pad-y) + 2 * var(--st-tap) + var(--gap-xs) + 24px
      );
    }
  }

  /* ---- The section index ------------------------------------------------
   * A quiet list, not a card: it sits between the lead and the first section
   * and its job is to be skipped by anyone who does not need it. Ruled at the
   * top and bottom so it reads as an interruption of the column rather than a
   * block floating in it. */
  /* NO RULE OF ITS OWN, at either tier.
   *
   * It used to draw one on top, which was right while the masthead's hairline
   * hung off the body BELOW it. The rule moved to the masthead (see
   * .st-page-head, which had to own it so the two-column form could draw it
   * across the content column) and this one immediately became the second of
   * two hairlines 40px apart with an empty band between them — the exact
   * "ruled box containing nothing" the note this replaces was written to
   * prevent, arrived at from the other direction.
   *
   * The spacing comes from .st-page-rail, which is the index's container at
   * both tiers and carries the same top margin the body does. */
  :root[data-theme="studio"] .st-page-toc {
    margin-block: 0;
  }
  :root[data-theme="studio"] .st-page-toc-h {
    margin: 0 0 clamp(10px, 1vw, 14px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-page-toc ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: clamp(4px, 0.5vw, 8px);
  }
  /* 44px targets on 24px text: padding grows the hit area, the negative
   * margin gives the same pixels back to the layout, so the rail's rhythm
   * does not change. The theme's own bar is --st-tap on every control; these
   * links were the three that undershot it (a11y audit, 2.5.5). */
  :root[data-theme="studio"] .st-page-toc a,
  :root[data-theme="studio"] .st-page-fv a {
    display: inline-block;
    padding-block: 10px;
    margin-block: -10px;
  }
  :root[data-theme="studio"] .st-page-toc a {
    display: inline-flex;
    align-items: center;
    /* 24px is WCAG 2.2 SC 2.5.8's floor and these are navigation, not links
     * inside a sentence, so the inline exception does not cover them. */
    min-block-size: 24px;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-label-tight);
    color: var(--ink-body);
    text-decoration: none;
    text-underline-offset: 3px;
  }
  :root[data-theme="studio"] .st-page-toc a:hover {
    color: var(--ink);
    text-decoration: underline;
  }
  :root[data-theme="studio"] .st-page-toc a:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    border-radius: var(--r-ctrl);
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

  /* A PLAIN BULLET LIST, and the UA defaults reset for the same reason the
   * numbered steps below reset theirs: ul ships 40px of padding-inline-start
   * and 1em of margin-block, which would push every list 40px inside the
   * reading column and add an off-scale gap the block rhythm is supposed to
   * own. The marker is drawn rather than inherited, so its colour and its
   * distance from the text are ours: an em dash at the reading colour, which
   * is what the rest of this theme uses to open a line.
   *
   * The marker sits OUTSIDE the text column and the text hangs — a wrapped
   * second line lines up under the first word, not under the dash. That is
   * what makes a list of sentences readable rather than a block of text with
   * dashes scattered down its left edge. */
  :root[data-theme="studio"] .st-page-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  :root[data-theme="studio"] .st-page-li {
    position: relative;
    padding-inline-start: 1.35em;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    text-wrap: pretty;
    overflow-wrap: break-word;
  }
  :root[data-theme="studio"] .st-page-li::before {
    content: "—";
    position: absolute;
    inset-inline-start: 0;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-page-li + .st-page-li {
    margin-block-start: clamp(8px, 0.9vw, 14px);
  }

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

  /* ⚠️ AT THE TWO-COLUMN TIER THE STEPS BECOME A RULED TABLE, and the reason
   * is measured rather than stylistic.
   *
   * Stacked — disc, then title over paragraph — a steps block draws nothing
   * that spans. Its <ol> takes the wide track, but the widest thing PAINTED
   * in it is a 38rem paragraph, so on /dostava-in-montaza a 640px band of
   * page reached 60% across and the rest was white. That is the page the
   * owner sent back twice.
   *
   * The fix is not a wider measure — 38rem is right and stretching prose to
   * fill a band is the worse defect. It is to give the block the device the
   * rest of this renderer already uses: a hairline per row, exactly like
   * .st-page-qa and .st-page-facts. The rule spans the track, the title sits
   * beside its paragraph instead of above it, and the reading measure is
   * untouched.
   *
   * 14rem on the title column: the longest of these is "Dostava in prva
   * kopel" at ~21 characters, which sets on two lines at 14rem and one at
   * 16 — two is correct here, because a title column wide enough for the
   * longest heading would push the paragraph past the track on /vodniki.
   *
   * Below 1000 it stays stacked: three columns in a phone's 340px is not a
   * table, it is a squeeze, and the note under this one already explains
   * what the disc costs there. */
  @media (min-width: 1000px) {
    :root[data-theme="studio"] .st-page-steps {
      border-block-start: var(--bw-line) solid var(--line);
    }
    :root[data-theme="studio"] .st-page-step {
      grid-template-columns: auto minmax(0, 14rem) minmax(0, 38rem);
      align-items: start;
      /* ⚠️ start, or the DISC column eats the slack. An auto track stretches
       * to absorb a grid's free space while justify-content is normal, and
       * these three tracks total ~940px inside a 1227px one — so the 40px
       * counter column grew by ~290px and opened a trench between the number
       * and the title it belongs to. The row's hairline is on the grid
       * container, not on a track, so packing the columns left costs the
       * spanning rule nothing. */
      justify-content: start;
      column-gap: clamp(20px, 2vw, 34px);
      padding-block: clamp(18px, 1.8vw, 26px);
      border-block-end: var(--bw-line) solid var(--line);
    }
    /* The rules carry the rhythm now; the old margin would double it. */
    :root[data-theme="studio"] .st-page-step + .st-page-step {
      margin-block-start: 0;
    }
    /* One row, not two: the title and the paragraph are side by side, so the
     * disc no longer spans a stack. */
    :root[data-theme="studio"] .st-page-step::before { grid-row: 1; }
    :root[data-theme="studio"] .st-page-step-p { margin-block-start: 0; }
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
  /* ⚠️ balance, LIKE EVERY OTHER HEADING. css.ts sets it globally on h1/h2/h3
   * and fifteen named heading classes carry it — but a <summary> is none of
   * those, and this one wears the h6 rung and is the largest text in the
   * accordion. Measured at 320: line boxes [235, 53] in a 270px box, a 53px
   * trailing widow at 20% of the measure; [303, 74] at 390. The comment below
   * already knew every real question wraps to two lines here. */
  :root[data-theme="studio"] .st-page-q {
    text-wrap: balance;
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
  /* ⚠️ THE PAGE'S ONLY INTERACTION HAD NO HOVER. Measured on
   * /pogosta-vprasanja, /kontakt and /o-nas: cursor:pointer, a focus ring for
   * the keyboard, and — under a pointer — colour, background, border and
   * decoration all identical. On a page that is nothing but disclosure rows,
   * nothing told a reader the row was a control. The chevron already exists
   * and already rotates on open; nudging it on hover reuses that vocabulary
   * instead of inventing a second one. */
  :root[data-theme="studio"] .st-page-q:hover { color: var(--acc-text); }
  :root[data-theme="studio"] .st-page-q:hover::after { transform: translateY(2px); }
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
  /* ---- the A/B table (kind: "compare") --------------------------------
   * The facts device's hairlines and rungs, arranged as three columns. The
   * label column takes the facts list's own 12rem; the two value columns
   * split the rest equally so the families stay visually comparable. Values
   * here are short editorial phrases, so the table fits 320px without a
   * scroll region — table-layout: fixed is what guarantees the equal split
   * rather than letting the longer phrase buy a wider column. */
  :root[data-theme="studio"] .st-page-cmp {
    inline-size: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  :root[data-theme="studio"] .st-page-cmp thead td { border: 0; }
  :root[data-theme="studio"] .st-page-cmp th,
  :root[data-theme="studio"] .st-page-cmp td {
    padding: clamp(12px, 1.2vw, 18px) 0;
    border-block-end: var(--bw-line) solid var(--line);
    text-align: left;
    vertical-align: top;
  }
  :root[data-theme="studio"] .st-page-cmp td + td,
  :root[data-theme="studio"] .st-page-cmp th + th {
    padding-inline-start: clamp(10px, 1.2vw, 24px);
  }
  @media (min-width: 620px) {
    :root[data-theme="studio"] .st-page-cmp col:first-child,
    :root[data-theme="studio"] .st-page-cmp th[scope="row"] { inline-size: 12rem; }
  }
  :root[data-theme="studio"] .st-page-cmp-h {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-page-cmp-k {
    /* ~180px, not the even third it was taking: the labels end by ~110px and
     * the trench they left forced both VALUE columns to wrap. */
    inline-size: 11rem;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
    padding-inline-end: clamp(10px, 1.2vw, 24px);
  }
  :root[data-theme="studio"] .st-page-cmp-v {
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    overflow-wrap: anywhere;
  }
  /* 320–619: the label goes ABOVE its pair of values instead of beside them
   * — three columns of a 270px measure would be nine characters each. The
   * row headers become full-width rungs; the value cells keep the split. */
  @media (max-width: 619px) {
    :root[data-theme="studio"] .st-page-cmp,
    :root[data-theme="studio"] .st-page-cmp tbody,
    :root[data-theme="studio"] .st-page-cmp tr { display: block; }
    :root[data-theme="studio"] .st-page-cmp thead {
      display: block;
    }
    :root[data-theme="studio"] .st-page-cmp thead tr {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: clamp(10px, 3vw, 24px);
    }
    :root[data-theme="studio"] .st-page-cmp thead td { display: none; }
    :root[data-theme="studio"] .st-page-cmp tbody tr {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 clamp(10px, 3vw, 24px);
      padding-block-end: clamp(12px, 3vw, 18px);
      border-block-end: var(--bw-line) solid var(--line);
    }
    :root[data-theme="studio"] .st-page-cmp tbody th[scope="row"] {
      grid-column: 1 / -1;
      border: 0;
      padding-block: clamp(12px, 3vw, 18px) 4px;
    }
    :root[data-theme="studio"] .st-page-cmp tbody td {
      border: 0;
      padding-block: 0;
    }
    :root[data-theme="studio"] .st-page-cmp td + td { padding-inline-start: 0; }
  }
  :root[data-theme="studio"] .st-page-frow {
    display: grid;
    /* The value is running text, so it takes the reading measure rather than
     * the whole track: at 1fr inside a 56rem column a definition ran past
     * 100 characters. Label plus value is 50rem, which still sets the row
     * wider than the old 46rem column allowed. */
    grid-template-columns: minmax(0, 12rem) minmax(0, 38rem);
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
  /* The imprint's own density. Two columns of term/value pairs above 900px,
   * so six statutory rows are three lines instead of six, and the label
   * column narrows to what these particular labels need ("Matična številka"
   * is the longest at ~9rem) rather than the 12rem a definition needs.
   *
   * Column-major (grid-auto-flow: column with an explicit row count) so the
   * pairs read DOWN each column: firma/sedež/matična on the left, DDV/
   * register/spletno mesto on the right. Row-major would put "Firma" beside
   * "Sedež", which reads as one row of two facts and is exactly the
   * confusion a two-column definition list has to avoid.
   *
   * The row count is hard-coded to 3 because the imprint is a fixed six-row
   * legal set, not a variable list — if a seventh obligation is ever added,
   * this number is the one thing that has to move with it. */
  @media (min-width: 900px) {
    :root[data-theme="studio"] .st-page-facts--tight {
      grid-auto-flow: column;
      grid-template-rows: repeat(3, auto);
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: clamp(24px, 3vw, 56px);
    }
    :root[data-theme="studio"] .st-page-facts--tight .st-page-frow {
      grid-template-columns: minmax(0, 9rem) minmax(0, 1fr);
    }
  }
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

  /* The model an enquiry is about, named above the actions. Body rung with
   * the title in the display face's weight — it is a restatement, not a
   * heading, and it must not compete with the h2 above it. */
  :root[data-theme="studio"] .st-page-about {
    margin: clamp(14px, 1.4vw, 22px) 0 0;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  /* The configuration an enquiry arrived with. Reads as a receipt: quiet
   * label, full-ink value, one row per choice, hairline between. Not the
   * .st-page-facts device — that one is page reference material at the wide
   * measure, and this is a short list about the visitor's own session. */
  :root[data-theme="studio"] .st-page-chosen {
    margin: clamp(14px, 1.4vw, 22px) 0 clamp(22px, 2.2vw, 34px);
    padding: 0;
    max-inline-size: 34rem;
  }
  :root[data-theme="studio"] .st-page-chosen-r {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    padding-block: clamp(8px, 0.8vw, 12px);
    border-block-end: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-page-chosen-r dt {
    flex: 0 0 auto;
    min-inline-size: 12rem;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-page-chosen-r dd {
    flex: 1 1 12rem;
    margin: 0;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-page-about strong {
    font-weight: var(--w-body-med);
    color: var(--ink);
  }

  /* ---- the contact page's actions --------------------------------------
   *
   * The channels as CONTROLS, sitting above the table that describes them.
   * Built from the theme's existing button language rather than a new one:
   * the lead action is the filled black control the product page uses, the
   * second is the outlined one the marquee toggle and the grid tile use. A
   * visitor arriving from "Povprašajte za ponudbo" should not have to find
   * an underlined address in the second column of a definition list. */
  :root[data-theme="studio"] .st-page-acts {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(10px, 1vw, 16px);
    margin-block: clamp(18px, 1.8vw, 28px) clamp(24px, 2.4vw, 36px);
  }
  :root[data-theme="studio"] .st-page-act {
    display: inline-flex;
    align-items: center;
    /* A worded control at the label rung, like every other in this theme, and
     * comfortably past WCAG 2.5.8's 24px by geometry alone. */
    min-block-size: 52px;
    padding: 0 clamp(20px, 2vw, 34px);
    border: var(--bw-line) solid var(--line-strong);
    border-radius: var(--r-ctrl);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    text-decoration: none;
    color: var(--ink);
    transition: background-color .2s ease, color .2s ease;
  }
  :root[data-theme="studio"] .st-page-act:hover {
    background: var(--ink); color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-page-act:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
  /* Whichever channel is FIRST is the page's primary act, and it is filled.
   * Which one that is depends on what the shop has filled in — a number when
   * there is one, the address otherwise — so the modifier is placed by the
   * renderer rather than by :first-child, which would be the same rule
   * written where it cannot be read. */
  :root[data-theme="studio"] .st-page-act--lead {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
    color: var(--on-invert);
  }

  /* ---- the contact channels ---------------------------------------------
   *
   * Three tiles where a definition list used to be. See channel() for why.
   *
   * FLEX, NOT GRID, AND THE REASON IS THE ORPHAN. The obvious device is
   * grid-template-columns: repeat(auto-fit, minmax(N, 1fr)), and it was the
   * first one here. auto-fit counts columns against the TRACK rather than
   * the viewport, and this block's track is 670px at a 1024 viewport and
   * 608px at 768 — so whatever N is, there are widths where three tiles
   * become two plus a third stranded underneath at half width with a hole
   * beside it. Chasing N only moves which width that happens at: 15rem
   * orphaned at 1024, 13rem fixed 1024 and still orphaned at 768.
   *
   * Wrapped flex items grow into their row, so the last row is always full
   * whatever the count. Three across becomes two-and-one-full-width becomes
   * one, and there is never a hole. It also stops the count mattering, which
   * is the same property auto-fit was chosen for: omitAddress drops the seat
   * to two tiles on the showroom and about pages, and this block appears on
   * eight pages in all.
   *
   * 13rem is the basis, not a minimum — the widest value these carry is
   * info@masazni-bazeni-vrelec.si, and below about 200px it takes a third
   * line, which overflow-wrap already handles. */
  :root[data-theme="studio"] .st-page-ch {
    list-style: none;
    margin: 0 0 clamp(28px, 2.8vw, 44px);
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: clamp(10px, 1vw, 16px);
  }
  /* Grow into the row, shrink no further than the basis, and stretch to the
   * tallest tile beside it — flex's default align-items, which is what keeps
   * a two-line address level with a one-line telephone. display:flex on the
   * item itself is what gives the tile inside a definite box to fill. */
  :root[data-theme="studio"] .st-page-ch > li {
    flex: 1 1 13rem;
    display: flex;
  }
  /* The tile. A quiet panel rather than an outlined card: the two controls
   * above it are the page's emphasis, and three bordered boxes under two
   * bordered buttons would be five rectangles arguing. align-content:start so
   * a tile with a note and a tile without still align at the top. */
  :root[data-theme="studio"] .st-page-ch-t {
    display: grid;
    align-content: start;
    gap: 6px;
    inline-size: 100%;
    padding: clamp(16px, 1.6vw, 22px);
    border-radius: var(--r-media);
    background: var(--bg-alt);
    text-decoration: none;
    color: inherit;
    transition: background-color .2s ease;
  }
  :root[data-theme="studio"] a.st-page-ch-t:hover { background: var(--wash); }
  :root[data-theme="studio"] a.st-page-ch-t:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
  /* The footer's disc, at the page's ink. Not --st-tap here: the TILE is the
   * target and clears 44px many times over, so the disc is free to be the
   * label-sized mark it is rather than a control-sized one. */
  :root[data-theme="studio"] .st-page-ch-ico {
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: 38px; block-size: 38px;
    margin-block-end: 4px;
    border-radius: var(--r-pill);
    border: var(--bw-line) solid var(--line);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-page-ch-ico .st-ico {
    inline-size: 18px; block-size: 18px;
  }
  :root[data-theme="studio"] .st-page-ch-k {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  /* The value at the h6 rung — the point of the whole change. An address is
   * one unbreakable token, so overflow-wrap is what keeps a longer one than
   * this shop's inside its tile rather than through the side of it. */
  :root[data-theme="studio"] .st-page-ch-v {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
    overflow-wrap: anywhere;
  }
  /* No underline on the value: the tile is the affordance and the disc, the
   * ground and the hover all say so. An underline here would read as a
   * second, smaller link inside a thing that is already one. */
  :root[data-theme="studio"] .st-page-ch-v a {
    color: inherit;
    text-decoration: none;
  }
  /* --t-label's 14px, at the BODY family and body leading. The ramp has no
   * rung between 16px body and the 14px label, and this is a sentence rather
   * than a chip: taking the label's size without its family, tracking or caps
   * is what keeps it a note instead of a second heading. (There is no
   * --t-small in tokens.ts. Inventing one as a fallback value is a thing I
   * have already done once in this theme, and it silently ships whatever the
   * literal says while looking like it came from the ramp.) */
  :root[data-theme="studio"] .st-page-ch-n {
    font-family: var(--f-body);
    font-size: var(--t-label);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-page-act--lead:hover {
    background: transparent; color: var(--ink); border-color: var(--line-strong);
  }
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-page-act { transition: none; }
  }

  /* ---- where to go next -------------------------------------------------
   *
   * A quiet row, ruled off from the document above it, at the foot of every
   * page. It is navigation rather than content — hence the nav landmark and
   * the label rung on its heading — and it is deliberately three links and
   * not a grid of everything: see onward() for what the audit measured and
   * why these three. */
  :root[data-theme="studio"] .st-page-onward {
    margin-block-start: clamp(44px, 4.6vw, 76px);
    padding-block-start: clamp(20px, 2vw, 30px);
    border-block-start: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-page-onward-h {
    margin: 0 0 clamp(10px, 1vw, 14px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-page-onward ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: clamp(6px, 0.8vw, 12px) clamp(18px, 2vw, 34px);
  }
  :root[data-theme="studio"] .st-page-onward a {
    display: inline-flex;
    align-items: center;
    /* Navigation, not a link inside a sentence, so WCAG 2.2 SC 2.5.8's
     * inline exception does not cover it and 24px is the floor. */
    min-block-size: 24px;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-label-tight);
    color: var(--ink);
    text-underline-offset: 3px;
  }
  :root[data-theme="studio"] .st-page-onward a:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    border-radius: var(--r-ctrl);
  }

  /* The closing call to action. */
  :root[data-theme="studio"] .st-page-cta {
    margin-block-start: clamp(48px, 5vw, 84px);
    padding: clamp(28px, 3vw, 48px);
    border-radius: var(--r-lg);
    background: var(--bg-alt);
  }
  :root[data-theme="studio"] .st-page-cta-h {
    /* The same 38rem the paragraph under it carries. Uncapped, the heading
     * ran the full 960px panel while the sentence beneath it stopped at 608
     * — the panel that closes every one of these pages, ragged. */
    max-inline-size: 38rem;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-page-cta-p {
    /* ⚠️ THE WORST LINE LENGTH ON THE SITE WAS HERE, ON THE CTA.
     *
     * Every other paragraph on these pages is capped at the 38rem reading
     * measure. This one was not, and .st-page-cta is a --wide block, so the
     * closing sentence — the last thing a visitor reads before deciding
     * whether to call — set across the full 960px panel at 122 CHARACTERS
     * PER LINE, measured at 1440 on six routes. Comfortable running text is
     * 45–75; at 122 the eye loses its place returning to the left edge, and
     * it loses it on the one paragraph whose whole job is to be read. */
    max-inline-size: 38rem;
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

  /* ================= THE ENQUIRY FORM =================
   *
   * ⚠️ IT REUSES THE PAGE'S OWN CONTROLS RATHER THAN GROWING A FORM
   * VOCABULARY. The submit button is .st-page-act--lead — the same filled
   * dark control every other page ends on — because a form that invents its
   * own primary button is the fifteenth button style on a site that already
   * had fourteen. What is new here is only what genuinely did not exist: an
   * input, a textarea and a consent row.
   *
   * The inputs take --line-ctrl and not --line. WCAG 1.4.11 holds the
   * boundary of an INTERACTIVE control to 3:1, and --line (#dfdfdf, 1.33:1)
   * is the decorative hairline between surfaces. A text field whose only
   * boundary is a 1.33:1 line is a field a low-vision reader cannot find —
   * and this is the one form on the site that stands between a visitor and
   * a €3–10k purchase. tokens.ts declares --line-ctrl for exactly this. */
  :root[data-theme="studio"] .st-enq-lead {
    max-inline-size: 38rem;
  }
  :root[data-theme="studio"] .st-enq {
    display: flex;
    flex-direction: column;
    gap: clamp(18px, 1.8vw, 26px);
    margin-block-start: clamp(20px, 2vw, 30px);
    /* The form is a --wide block so its two-up rows have room, but a single
     * column of fields running 56rem wide is a shape nobody fills in. */
    max-inline-size: 44rem;
  }
  /* Two-up above 620px, one column under it. The pairs are deliberate:
   * name/phone and e-mail/place, so a reader filling the left column top to
   * bottom still gets a name and a way to be reached. */
  :root[data-theme="studio"] .st-enq-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(18px, 1.8vw, 26px);
  }
  @media (max-width: 619px) {
    :root[data-theme="studio"] .st-enq-grid { grid-template-columns: minmax(0, 1fr); }
  }
  :root[data-theme="studio"] .st-enq-f {
    display: flex;
    flex-direction: column;
    gap: var(--gap-xs);
    margin: 0;
  }
  :root[data-theme="studio"] .st-enq-l,
  :root[data-theme="studio"] .st-enq-fs legend {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink);
  }
  /* The asterisk is not the only marker: every required field also carries
   * the required attribute, so a screen reader announces it whatever this
   * glyph does. It is here for the sighted scan. */
  :root[data-theme="studio"] .st-enq-req { color: var(--acc-text); }
  :root[data-theme="studio"] .st-enq-in {
    inline-size: 100%;
    /* 52px — the control height every button on these pages draws. */
    min-block-size: 52px;
    padding: 13px 16px;
    border: var(--bw-line) solid var(--line-ctrl);
    border-radius: var(--r-ctrl);
    background: var(--bg);
    color: var(--ink);
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    /* Inputs do NOT inherit the page font by default, and on Safari the
     * difference is a 13px system face inside a 16px form. */
    -webkit-appearance: none;
    appearance: none;
  }
  :root[data-theme="studio"] .st-enq-ta {
    min-block-size: 0;
    resize: vertical;
  }
  :root[data-theme="studio"] .st-enq-in:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 1px;
    border-color: var(--ink);
  }
  :root[data-theme="studio"] .st-enq-hint {
    font-family: var(--f-body);
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-enq-fs {
    margin: 0;
    padding: 0;
    border: 0;
  }
  :root[data-theme="studio"] .st-enq-radios {
    display: flex;
    flex-wrap: wrap;
    gap: var(--gap-lg);
    margin-block-start: var(--gap-sm);
  }
  :root[data-theme="studio"] .st-enq-r {
    display: inline-flex;
    align-items: center;
    gap: var(--gap-xs);
    /* The label is the target as much as the dot is, and both together must
     * clear the 44px floor this project holds itself to. */
    min-block-size: var(--st-tap);
  }
  :root[data-theme="studio"] .st-enq-r label,
  :root[data-theme="studio"] .st-enq-consent label {
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-enq-r input,
  :root[data-theme="studio"] .st-enq-consent input {
    inline-size: 20px;
    block-size: 20px;
    flex: none;
    accent-color: var(--ink);
  }
  :root[data-theme="studio"] .st-enq-consent {
    display: flex;
    align-items: flex-start;
    gap: var(--gap-sm);
    margin: 0;
    padding: clamp(14px, 1.4vw, 20px);
    border-radius: var(--r-card);
    background: var(--bg-alt);
  }
  /* The consent sentence sits a rung down from the fields — it is a
   * condition of sending, not another question — but never below the muted
   * rung that clears 4.5:1 on the panel grey (tokens.ts: --ink-mute is
   * 4.54:1 there, which is the floor, so the sentence takes --ink-body). */
  /* --t-label, not a 15px literal: 15 is on no rung at any tier. */
  :root[data-theme="studio"] .st-enq-consent label { font-size: var(--t-label); }
  :root[data-theme="studio"] .st-enq-consent input { margin-block-start: 3px; }
  :root[data-theme="studio"] .st-enq-act { margin: 0; }
  :root[data-theme="studio"] .st-enq-act .st-page-act { inline-size: auto; }

  /* WHAT THEY CONFIGURED, RESTATED. Every string in here came out of the
   * catalogue — the router matches ?model= and every option against what the
   * shop actually sells and drops the rest — so this block is a receipt, not
   * an echo of the query string. */
  :root[data-theme="studio"] .st-enq-about {
    margin-block-start: clamp(20px, 2vw, 30px);
    padding: clamp(16px, 1.6vw, 24px);
    border: var(--bw-line) solid var(--line);
    border-radius: var(--r-card);
    max-inline-size: 44rem;
  }
  :root[data-theme="studio"] .st-enq-about-h {
    margin: 0;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-enq-about-m {
    margin: var(--gap-xs) 0 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--gap-sm);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  /* The price is a fact beside the name, not part of it — body face, body
   * size, so the model reads as the heading of this card and the figure as
   * its annotation. */
  :root[data-theme="studio"] .st-enq-about-p {
    font-family: var(--f-body);
    font-weight: var(--w-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-enq-cfg {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--gap-xs) var(--gap-md);
    margin: var(--gap-md) 0 0;
  }
  :root[data-theme="studio"] .st-enq-cfg dt {
    font-family: var(--f-body);
    /* --t-label, not a 15px literal: 15 is on no rung at any tier. */
    font-size: var(--t-label);
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-enq-cfg dd {
    margin: 0;
    font-family: var(--f-body);
    /* --t-label, not a 15px literal: 15 is on no rung at any tier. */
    font-size: var(--t-label);
    font-weight: var(--w-body-med);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-enq-about-n {
    margin: var(--gap-md) 0 0;
    font-family: var(--f-body);
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--ink-mute);
  }

  /* The failure and the success. Both are ink-and-rule rather than a red or
   * green plate: the palette has no status colours, and inventing two here
   * would be two more grounds nobody has measured against the text on them.
   * The accent rule carries the alarm; role="alert" carries it to everyone
   * else. */
  /* ⚠️ IT HAS TO READ AS A FAILURE. This was body ink at body size behind a
   * 3px rule in --acc — the SAME accent as the required asterisk and the focus
   * ring — with no icon, no weight change and no prefix, so at 390 it read as
   * a pull-quote between the lead and the first field. Contrast was never the
   * problem (18:1); salience was. The rule keeps its width and takes the ink
   * colour, the text takes the medium weight, and focus is visible because the
   * paragraph is now a focus target when no field owns the problem. */
  :root[data-theme="studio"] .st-enq-err {
    margin: clamp(16px, 1.6vw, 24px) 0 0;
    padding: var(--gap-sm) var(--gap-md);
    border-inline-start: 3px solid var(--ink);
    background: var(--bg-alt);
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body-med);
    line-height: var(--lh-body);
    color: var(--ink);
    max-inline-size: 38rem;
  }
  :root[data-theme="studio"] .st-enq-err:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
  :root[data-theme="studio"] .st-enq-done {
    margin-block-start: clamp(20px, 2vw, 30px);
    padding: clamp(20px, 2vw, 32px);
    border-radius: var(--r-card);
    background: var(--bg-alt);
    max-inline-size: 44rem;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-enq-done-h {
    margin: 0 0 var(--gap-sm);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-enq-done p { margin: 0; }

  /* THE HONEYPOT. Off-screen rather than display:none, because some bots
   * skip what is display:none and fill what is merely positioned away —
   * which is the entire point of the field. aria-hidden and tabindex="-1"
   * on the markup keep it away from anyone real. */
  :root[data-theme="studio"] .st-enq-hp {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
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
 * A stable, readable anchor for a section heading.
 *
 * Slovenian diacritics are folded rather than percent-encoded: an id is
 * allowed to hold them, but the URL that reaches a chat window or an email is
 * far more likely to survive as "kaj-preveriti" than as
 * "kaj-preveriti-%C5%A1obe". The index is appended so two headings that fold
 * to the same slug cannot collide — a duplicate id would break every anchor
 * on the page at once, and it is the one failure the structural audit already
 * watches for.
 */
export function sectionId(h: string, i: number): string {
  const folded = h
    .toLowerCase()
    .replace(/[čć]/g, "c").replace(/š/g, "s").replace(/ž/g, "z").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return "s" + String(i + 1) + (folded ? "-" + folded : "");
}

/**
 * A section heading, WITH THE ANCHOR THE INDEX POINTS AT.
 *
 * ⚠️ THIS IS WHY IT IS A HELPER. The id used to be threaded into prose() and
 * nowhere else, while renderStudioPage builds an index entry for every block
 * that has a heading. So every steps, qa, facts, contact and imprint block on
 * the site had an entry in "Na tej strani" aimed at an id that did not exist:
 * 26 dead links across 10 pages, and all four entries on /pogosta-vprasanja.
 * Nothing failed — the browser simply does not move, which reads as the page
 * being broken rather than the link.
 *
 * One function, called by every block that renders an h2, so a new block kind
 * cannot be added without one.
 */
function h2(text: string | undefined, id?: string): string {
  if (!text) return "";
  return (
    '<h2 class="st-page-h2"' + (id ? ' id="' + esc(id) + '"' : "") + ">" +
    esc(text) + "</h2>"
  );
}

function prose(b: Extract<Block, { kind: "prose" }>, id?: string): string {
  return (
    h2(b.h, id) +
    b.p.map((t) => '<p class="st-page-p">' + esc(t) + "</p>").join("")
  );
}

function steps(b: Extract<Block, { kind: "steps" }>, id?: string): string {
  return (
    h2(b.h, id) +
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

function list(b: Extract<Block, { kind: "list" }>, id?: string): string {
  return (
    h2(b.h, id) +
    '<ul class="st-page-list">' +
    b.items.map((t) => '<li class="st-page-li">' + esc(t) + "</li>").join("") +
    "</ul>"
  );
}

/**
 * A list of internal links.
 *
 * Wears the same clothes as onward() at the foot of every editorial page —
 * same classes, same rule above it, same 24px targets — because it is the
 * same device: a short row of places to go next. Reusing the class rather
 * than declaring a second one keeps the two from drifting apart, and a reader
 * meets one visual idea instead of two.
 *
 * A <nav> with an accessible name, so a screen reader can skip the row in one
 * move and knows what it is skipping.
 */
function links(ctx: RenderCtx, b: Extract<Block, { kind: "links" }>, id?: string): string {
  if (b.items.length === 0) return "";
  const head = b.h ?? "Oglejte si";
  const hid = (id ?? "st-links") + "-h";
  // The nav carries the section id itself. It used to sit on nothing — the
  // heading got id+"-h" and a data-anchor no selector ever consumed — so the
  // first links block with a real heading gave the TOC a fragment that
  // resolved to nowhere. structure.test.ts now proves every rail link lands.
  return (
    '<nav class="st-page-onward"' + (id ? ' id="' + esc(id) + '"' : "") +
    ' aria-labelledby="' + esc(hid) + '">' +
    '<p class="st-page-onward-h" id="' + esc(hid) + '">' + esc(head) + "</p><ul>" +
    b.items
      .map(
        ([label, href]) =>
          // ctx.q, like cta() and onward(): the QA/theme override query
          // was dropped through every link of a links block.
          '<li><a href="' + esc(href) + esc(ctx.q) + '">' + esc(label) + "</a></li>",
      )
      .join("") +
    "</ul></nav>"
  );
}

function qa(b: Extract<Block, { kind: "qa" }>, id?: string): string {
  return (
    h2(b.h, id) +
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
/**
 * The A/B table: one label column, one column per side, on the facts device's
 * own hairline vocabulary. A real <table> — column association is the entire
 * content here, and scope attributes are what carry it to a screen reader.
 */
function compare(b: Extract<Block, { kind: "compare" }>, id?: string): string {
  return (
    h2(b.h, id) +
    '<table class="st-page-cmp">' +
    '<thead><tr><td></td>' +
    b.cols
      .map((c) => '<th scope="col" class="st-page-cmp-h">' + esc(c) + "</th>")
      .join("") +
    "</tr></thead><tbody>" +
    b.rows
      .map(
        ([label, a, x]) =>
          '<tr><th scope="row" class="st-page-cmp-k">' + esc(label) + "</th>" +
          '<td class="st-page-cmp-v">' + esc(a) + "</td>" +
          '<td class="st-page-cmp-v">' + esc(x) + "</td></tr>",
      )
      .join("") +
    "</tbody></table>"
  );
}

function facts(
  h: string | undefined,
  rows: readonly (readonly [string, string])[],
  raw = false,
  id?: string,
  cls = "",
): string {
  return (
    h2(h, id) +
    '<dl class="st-page-facts' + (cls ? " " + cls : "") + '">' +
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

/**
 * The contact page's ACTIONS, above the facts that describe them.
 *
 * WHY THIS EXISTS. A visitor arriving from a product page's "Povprašajte za
 * ponudbo" found the one thing they came to do — write to the shop — styled
 * as a table cell: a small underlined address in the second column of a
 * definition list, under a heading, below the fold on a phone. The only
 * button on the page sent them to the FAQ. The page described the channels
 * perfectly and offered none of them.
 *
 * So the channels become controls. The table stays underneath, because a
 * postal address is a fact to read rather than a thing to press, and because
 * the imprint obligations are satisfied by the facts and not by the buttons.
 *
 * Each one appears only while it goes somewhere: page.ts already refuses to
 * print an unset value as a fact, and a dead action is worse than a dead fact
 * because it invites a press. With this shop's placeholder number that means
 * one button today and two the day it is filled in.
 */
function contactActions(ctx: RenderCtx): string {
  const c = ctx.shop.contact;
  const acts: string[] = [];
  if (isSetPhone(ctx.phoneDisplay)) {
    acts.push(
      '<a class="st-page-act st-page-act--lead" href="' + esc(ctx.phoneHref) + '">' +
        "Pokličite " + esc(ctx.phoneDisplay) + "</a>",
    );
  }
  if (isSet(c.email)) {
    // A subject line, because it costs nothing and it is the difference
    // between an inbox of "(no subject)" and one that can be sorted.
    //
    // ctx.about is the model the visitor pressed "Povprašajte za ponudbo" on,
    // resolved from ?model= against the catalogue by the router — so it is a
    // real product's own title, never a string off the wire. Without it the
    // subject is the plain word, which is what a visitor who arrived from the
    // nav should get.
    const subject = ctx.about
      ? "Povpraševanje — " + ctx.about.title
      : "Povpraševanje";
    // AND THE CONFIGURATION AS THE OPENING OF THE MESSAGE.
    //
    // The subject line alone was right while the product page could not take
    // a choice. It can now, and an enquiry that names the model but not the
    // colour, the connection or the extras sends the visitor back to remember
    // them — in a mail client, where they can no longer see the page. Every
    // line here is a pair of strings from this repository (see RenderCtx.
    // chosen), so nothing a visitor typed reaches the mail body either.
    const lines = (ctx.chosen ?? []).map(([k, v]) => k + ": " + v);
    const body =
      lines.length > 0
        ? "Zanima me naslednja konfiguracija:\n\n" + lines.join("\n") + "\n\n"
        : "";
    acts.push(
      '<a class="st-page-act' + (acts.length === 0 ? " st-page-act--lead" : "") +
        '" href="mailto:' + esc(c.email) + "?subject=" +
        encodeURIComponent(subject) +
        (body ? "&body=" + encodeURIComponent(body) : "") +
        '">Pišite nam</a>',
    );
  }
  return acts.length === 0 ? "" : '<div class="st-page-acts">' + acts.join("") + "</div>";
}

function contact(
  ctx: RenderCtx,
  h?: string,
  id?: string,
  omitAddress = false,
  notes?: Extract<Block, { kind: "contact" }>["notes"],
): string {
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
  return (
    h2(h ?? "Kontakt", id) +
    // WHAT THE VISITOR CAME ABOUT, said back to them before they write.
    // Arriving from a product page and finding no trace of the product is how
    // an enquiry turns into a closed tab: the page looks like the wrong one.
    // The title comes from the catalogue, so this can only ever name a real
    // model.
    // ⚠️ THE MODEL AND THE CONFIGURATION USED TO BE RESTATED HERE, AND ARE
    // NOT ANY MORE. This block carried "Povpraševanje za BAZEN 210 · 6.990 €
    // z DDV" and a definition list of the chosen colours, and it was right to:
    // a visitor who spent five minutes picking a colour, pressed the one
    // button on the page and landed somewhere showing no trace of it has to
    // decide whether the form worked.
    //
    // The enquiry form below now says exactly that, ~600px lower on the same
    // screen, where it is not a reassurance but a RECEIPT — it is beside the
    // fields, and it describes what pressing the button will actually send.
    // Two copies of one statement on one screen is the duplication this pass
    // exists to remove, and of the two this was the one that could not be
    // acted on. The price went with it into the form's own card so nothing
    // is lost.
    contactActions(ctx) +
    // THE CHANNELS AS CARDS, NOT AS A DEFINITION LIST.
    //
    // This was facts(): Telefon / E-pošta / Naslov as three label-value rows
    // between hairlines. It is the correct device for reference data and it
    // was the wrong one here, for a reason that only shows on the page —
    // /kontakt rendered THREE of them, and the one carrying the telephone
    // number looked exactly like the one carrying the company registration.
    // The thing a visitor came for had no more weight than the imprint, and
    // sat in the second column of a list at body size.
    //
    // Cards fix the weight and the target both. Each channel gets the
    // footer's own icon disc, its value at the h6 rung, and its whole tile as
    // the hit area — a phone number on a phone should be a thing you press,
    // not an underline you aim at. auto-fit means the same markup is three
    // tiles here and two wherever omitAddress drops the seat, with no second
    // layout to keep in step.
    '<ul class="st-page-ch">' +
    channel(
      "phone",
      "Telefon",
      link(ctx.phoneHref, ctx.phoneDisplay, isSetPhone(ctx.phoneDisplay)),
      isSetPhone(ctx.phoneDisplay) ? ctx.phoneHref : null,
      notes?.phone,
    ) +
    channel(
      "mail",
      "E-pošta",
      link("mailto:" + c.email, c.email, isSet(c.email)),
      isSet(c.email) ? "mailto:" + c.email : null,
      notes?.email,
    ) +
    // The seat, unless the page says otherwise: on the showroom page this
    // row printed the company's Koper address as "Naslov" directly under a
    // headline about Ljubljana — the seat is not that page's address.
    (omitAddress ? "" : channel("pin", "Naslov", fact(place, placeSet), null, notes?.address)) +
    "</ul>"
  );
}

/**
 * One contact channel as a tile.
 *
 * ⚠️ THE WHOLE TILE IS THE LINK, AND ONLY WHERE THERE IS SOMEWHERE TO GO.
 * link() above already refuses to wrap an unset value in an anchor — the
 * placeholder telephone number must not become a control that dials nothing
 * — and this has to make the same decision one level up, or an unfilled
 * channel would still be a 15rem press target announcing "podatek še ni
 * vpisan". So the address tile, which never goes anywhere, and any unset
 * channel render as <div>, and `value` keeps its own inner anchor for the
 * cases where the tile is a div but the value is still worth marking up.
 *
 * The nested anchor that would otherwise create — an <a> tile around link()'s
 * <a> — is why `value` is stripped to its text when the tile itself links.
 * Nested anchors are invalid HTML and browsers recover from them by closing
 * the outer one early, which silently halves the target this exists to widen.
 */
function channel(
  k: IconKey,
  name: string,
  value: string,
  href: string | null,
  note?: string,
): string {
  const inner =
    '<span class="st-page-ch-ico">' + contactIcon(k) + "</span>" +
    '<span class="st-page-ch-k">' + esc(name) + "</span>" +
    // Strip link()'s anchor when the tile is itself one; keep it otherwise,
    // so the unset mark keeps its class and a non-linking tile keeps any
    // markup the value carries.
    '<span class="st-page-ch-v">' +
    (href ? value.replace(/<a [^>]*>/, "").replace(/<\/a>/, "") : value) +
    "</span>" +
    (note ? '<span class="st-page-ch-n">' + esc(note) + "</span>" : "");
  return href
    ? '<li><a class="st-page-ch-t" href="' + esc(href) + '">' + inner + "</a></li>"
    : '<li><div class="st-page-ch-t">' + inner + "</div></li>";
}

function imprint(ctx: RenderCtx, h?: string, id?: string): string {
  const co = ctx.shop.company;
  const a = ctx.shop.contact.address;
  const seat = [a.street, [a.zip, a.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  // The full ZGD-1 čl. 45 set, each row present even while unset: an imprint
  // that omits the matična številka looks complete and is not, and the unset
  // mark is what tells the owner exactly which obligation is still open.
  // "ID za DDV", not "Davčna številka" — the footer already says ID za DDV
  // for the same value, and one value may not carry two names on one site.
  return facts(
    h ?? "Podatki o podjetju",
    [
      ["Firma", fact(co.legalName, isSet(co.legalName))],
      ["Sedež", fact(seat, isSet(a.street) && isSetZip(a.zip) && isSet(a.city))],
      ["Matična številka", fact(co.regNumber, isSet(co.regNumber) && co.regNumber !== "0000000000")],
      ["ID za DDV", fact(co.vatId, isSetVat(co.vatId))],
      ["Vpis v register", fact(co.register, isSet(co.register))],
      ["Spletno mesto", esc(ctx.shop.domain)],
    ],
    true,
    id,
    // ⚠️ TIGHT, NOT SHORTER. Every ZGD-1 čl. 45 row stays and every unset
    // mark stays visible; what changes is that six rows of reference data
    // stop occupying the same full-width, body-size, one-per-line device the
    // page uses for the things it wants read. On /kontakt this block sat
    // directly under "Kaj je v ponudbi" in an identical treatment, so a
    // company registration number had the same weight as what the customer
    // is buying — and it does that on six pages, four of them legal, where
    // it is the LAST thing and was the tallest.
    "st-page-facts--tight",
  );
}

/**
 * Which blocks are DATA rather than running text.
 *
 * The three that render a fact table. They opt out of the 31rem measure
 * because a term/value row inside it leaves the value about 220px, and on
 * /primerjava that wrapped every single value to two or three lines — in the
 * one block on the page whose job is to be scanned rather than read.
 */
function isWide(b: Block): boolean {
  return (
    b.kind === "facts" || b.kind === "contact" || b.kind === "imprint" ||
    b.kind === "compare" ||
    // A row of links is navigation laid out across the column, not a sentence
    // to read at the measure — same reason onward() spans the body.
    b.kind === "links" ||
    // ⚠️ STEPS ARE A RULED TABLE AT THE DESKTOP TIER, Q&A IS NOT, and that is
    // the whole of why one of these is here and the other is not.
    //
    // Both were struck off together, on one argument: a hairline that runs
    // past its own last word reads as an unfinished column. That argument is
    // right about Q&A — a question and its answer are two paragraphs, so the
    // block ends where the sentences end and /pogosta-vprasanja reads as one
    // clean column.
    //
    // It is wrong about steps, because ABOVE 1000px A STEP IS NOT A
    // PARAGRAPH. .st-page-step becomes a three-track row — the counter disc,
    // a 14rem title column, a 38rem paragraph column — which wants ~940px.
    // Capped at the 38rem every plain block gets, those three tracks were
    // sized down to fit 608: measured on /dostava-in-montaza, the title
    // column fell to ~190 and THE PARAGRAPH TO 284px, which is 37 characters
    // a line on a 1440 desktop, inside a body track that was 902px wide and
    // had the room. The reported words were "here width is not ok" and the
    // screenshot showed a 284px column of text with half a screen of white
    // beside it.
    //
    // So a steps block takes the wide track, like the other blocks that lay
    // rows out across it, and the prose blocks around it keep their 38rem —
    // two right edges, which is what --wide has always meant here.
    b.kind === "steps" ||
    //
    // The note this replaces widened them so their rules would span the
    // track rather than stop at the reading measure — the band ran on for
    // another 600px either way, and a rule that stopped early looked like
    // the narrow strip that was being reported. True, and it fixed the wrong
    // half: it left a hairline running 438px past its own answer, and on
    // /pogosta-vprasanja, which is nothing but question rows, that is the
    // entire page.
    //
    // Marking them wide also kept the TRACK wide, since the grid narrows
    // itself on a page carrying no wide block. So a Q&A-only page now gets
    // the narrow track and reads as one clean column, rule and text ending
    // together — which is what the earlier note wanted and could not get
    // while these two were claiming to be tables.
    // A photograph is a band, not a paragraph: at the reading measure it
    // would be a small picture in a wide column, which is neither.
    b.kind === "figure" ||
    // A form is a grid of labelled controls, not a sentence. At the 31rem
    // measure the two-up rows collapse and the message box is a slot.
    b.kind === "enquiry"
  );
}

/**
 * THE ENQUIRY FORM.
 *
 * ⚠️ IT WORKS WITH NO JAVASCRIPT, and everything below follows from that.
 * A plain POST to the page's own URL, answered by the same renderer with
 * ctx.enquiry set — so there is no fetch, no JSON, no spinner and no state
 * that can be lost by a refresh. On a €3–10k enquiry the failure mode of a
 * clever form is a lead that silently never arrived.
 *
 * WHAT IT ASKS FOR, AND WHAT IT DOES NOT. Every required field on a lead form
 * is a lead that does not arrive, so exactly two things are required: a name,
 * and one way to reach them. Everything else — where, access, the message —
 * is offered because answering it gets a better reply, and skipping it still
 * sends. The three optional questions are the three the shop's own contact
 * page already says it needs (kraj, the narrowest passage, the distance to
 * the electrics); this form asks them where the visitor is already typing
 * rather than hoping they read the paragraph.
 *
 * WHAT IT ALREADY KNOWS. ctx.about and ctx.chosen are the model and the
 * configuration the product page's GET form carried here, already matched
 * against the catalogue — so the enquiry arrives saying "Srednji 210,
 * Midnight, LED paket" instead of "(no subject)". They are printed as a
 * summary and travel as hidden fields the SERVER re-resolves; nothing the
 * visitor could edit becomes an enquiry about a product this shop does not
 * sell.
 */
function enquiry(
  ctx: RenderCtx,
  b: Extract<Block, { kind: "enquiry" }>,
  id?: string,
): string {
  const head =
    (b.h ? '<h2 class="st-page-h2"' + (id ? ' id="' + esc(id) + '"' : "") + ">" + esc(b.h) + "</h2>" : "") +
    (b.p ? '<p class="st-page-p st-enq-lead">' + esc(b.p) + "</p>" : "");

  // DONE. The form is REPLACED, not merely captioned: leaving a filled form
  // under a success message invites a second submission of the same enquiry,
  // and the visitor cannot tell whether the first one counted.
  if (ctx.enquiry?.done) {
    return (
      head +
      '<div class="st-enq-done" role="status">' +
      '<p class="st-enq-done-h">Povpraševanje je oddano.</p>' +
      "<p>Odgovorimo v enem delovnem dnevu. Če se mudi, pokličite — številka je " +
      "v nogi strani.</p>" +
      "</div>"
    );
  }

  const about = ctx.about;
  const chosen = ctx.chosen ?? [];

  // ⚠️ THE FIGURE IN THIS CARD MUST BE THE ONE THE BUYER JUST SAW.
  //
  // It printed about.price — the catalogue base — while the list directly
  // underneath it named the extras they had ticked. Measured on a real
  // configuration: the product page's bar read 7.060 EUR and this card read
  // 6.690 EUR with "Termo pokrov" and "Dvigalo za termo pokrov" listed below
  // it. A 370 EUR contradiction, on the one page where the visitor commits.
  //
  // The extras arrive as one row of labels (see chosenParams, which collapses
  // them deliberately), so they are matched back to the catalogue entries
  // that produced them. Anything that does not match is not counted and not
  // charged for: the labels come off the wire and the prices do not.
  const pickedLabels = new Set(
    (chosen.find(([k]) => k === "Dodatna oprema")?.[1] ?? "")
      .split(", ")
      .map((x) => x.trim())
      .filter((x) => x !== ""),
  );
  const extraCents = (about?.addons ?? [])
    .filter((a) => pickedLabels.has(a.label))
    .reduce((n, a) => n + (a.priceCents ?? 0), 0);
  // Only a base the catalogue actually priced can be added to. Where it is
  // unset the card keeps showing about.price, which is the dash — a total
  // built on a missing base would be a number nobody set.
  const totalPrice =
    about && about.priceCents > 0 && extraCents > 0
      ? formatEur(about.priceCents + extraCents)
      : about?.price;
  // The summary is a RESTATEMENT of what the visitor chose a page ago. It is
  // shown because an enquiry form that silently carries hidden state is a
  // form nobody can check, and every one of these strings came out of the
  // catalogue rather than off the wire.
  const summary = about
    ? '<div class="st-enq-about">' +
      '<p class="st-enq-about-h">Povprašujete za</p>' +
      '<p class="st-enq-about-m">' + esc(about.title) +
      // The price rides along because the contact block above no longer
      // states it — see the note there. Qualified only beside a real figure:
      // a dash followed by "z DDV" is nonsense.
      (totalPrice
        ? '<span class="st-enq-about-p">' + esc(totalPrice) +
          (totalPrice.includes("€") ? " z DDV" : "") + "</span>"
        : "") +
      "</p>" +
      (chosen.length > 0
        ? "<dl class=\"st-enq-cfg\">" +
          chosen
            .map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>")
            .join("") +
          "</dl>"
        : "") +
      '<p class="st-enq-about-n">Podatki potujejo z obrazcem. Če želite kaj drugega, ' +
      "napišite v sporočilo.</p>" +
      "</div>"
    : "";

  // ⚠️ AN ERROR HAS TO IDENTIFY THE FIELD IT IS ABOUT — SC 3.3.1.
  //
  // This was a sentence in a role="alert" above a form with fourteen
  // controls, and nothing tied it to any of them: no id on the paragraph, no
  // aria-invalid, no aria-describedby, no focus move. A screen-reader user
  // heard "Vpišite ime" and was left to find which of the fourteen that was.
  // The form also carries novalidate, so the browser's own per-field
  // identification is suppressed too — there was no other channel.
  const badField = ctx.enquiry?.field ?? null;
  // ⚠️ WHEN NO FIELD IS AT FAULT, THIS PARAGRAPH IS THE ONLY THING TO GO TO,
  // AND NOTHING WENT TO IT.
  //
  // A field problem sets autofocus on the control below, so the browser
  // scrolls to it and a reader lands on it: measured, scrollY 744 at 1440 and
  // 1225 at 390, error in the viewport both times. A problem that is NOT a
  // field — Supabase unreachable, the rate limit, a body that would not parse
  // — sets field:null, so nothing was marked, nothing focused and nothing
  // scrolled. Measured, both viewports: scrollY 0, focus on BODY, and the
  // sentence "Povpraševanja ta trenutek ni bilo mogoče oddati" sitting 1124px
  // down at 1440 and 1731px down at 390 — 1.7 screens below the fold, under a
  // form that still looks ready to send.
  //
  // role="alert" does not rescue it: a live region that is already in the
  // document at parse time is not announced on a fresh load. So on the one
  // failure that is the shop's fault, on a page that exists because this shop
  // takes no orders online, the visitor was told nothing.
  //
  // tabindex="-1" + autofocus makes the paragraph itself the focus target
  // when no field owns the problem. Same device as the fields, no script.
  const err = ctx.enquiry?.error
    ? '<p class="st-enq-err" id="enq-err" role="alert"' +
      (badField === null ? ' tabindex="-1" autofocus' : "") +
      ">" + esc(ctx.enquiry.error) + "</p>"
    : "";

  // What the visitor typed on a refused attempt. Escaped on the way back out,
  // like every other string this renderer prints — it is their own text, but
  // it has been round-tripped through a request and is not trusted for that.
  const sent = (n: string): string => ctx.enquiry?.sent?.[n] ?? "";

  /** The message and the hint, whichever of them this field has. */
  const describedBy = (name: string, hasHint: boolean): string => {
    const ids = [
      ...(badField === name ? ["enq-err"] : []),
      ...(hasHint ? ["enq-" + name + "-hint"] : []),
    ];
    return ids.length > 0 ? ' aria-describedby="' + ids.join(" ") + '"' : "";
  };

  const field = (
    name: string,
    label: string,
    type: string,
    opts: { req?: boolean; hint?: string; auto?: string; mode?: string } = {},
  ): string =>
    '<p class="st-enq-f">' +
    '<label class="st-enq-l" for="enq-' + name + '">' + esc(label) +
    (opts.req ? ' <span class="st-enq-req">*</span>' : "") + "</label>" +
    '<input class="st-enq-in" id="enq-' + name + '" name="' + name + '" type="' + type + '"' +
    (sent(name) ? ' value="' + esc(sent(name)) + '"' : "") +
    (opts.req ? " required" : "") +
    // The field the message is about: marked invalid, pointed at the message,
    // and focused, so a refused submission lands the visitor ON the problem
    // rather than at the top of the form. autofocus rather than a script,
    // because this form works with JavaScript off and so must its recovery.
    (badField === name ? ' aria-invalid="true" autofocus' : "") +
    // ⚠️ THE HINT WAS NEVER ANNOUNCED. It carried no id and nothing referred
    // to it, so "Po njem izračunamo dostavo" — and, on the access field, the
    // three measurements the business actually needs — were visible text a
    // screen-reader user never heard at the control. SC 1.3.1.
    describedBy(name, opts.hint !== undefined) +
    (opts.auto ? ' autocomplete="' + opts.auto + '"' : "") +
    (opts.mode ? ' inputmode="' + opts.mode + '"' : "") +
    ">" +
    (opts.hint
      ? '<span class="st-enq-hint" id="enq-' + name + '-hint">' + esc(opts.hint) + "</span>"
      : "") +
    "</p>";

  return (
    head +
    err +
    summary +
    // METHOD POST, ACTION EMPTY. An empty action posts to the current URL
    // INCLUDING its query string, which is what carries ?model= and the
    // configuration through a failed submission — an action of "/kontakt"
    // would drop them and the visitor would lose their configuration by
    // mistyping their e-mail.
    '<form class="st-enq" method="post" novalidate>' +
    // The honeypot. Hidden from sight AND from assistive technology, and
    // never autofilled — a browser that helpfully fills it would lock a real
    // person out of the form, which is the one way this device can do harm.
    '<div class="st-enq-hp" aria-hidden="true">' +
    '<label for="enq-website">Ne izpolnjujte tega polja</label>' +
    '<input id="enq-website" name="website" type="text" tabindex="-1" autocomplete="off">' +
    "</div>" +
    '<input type="hidden" name="od" value="' + esc(ctx.path ?? "") + '">' +
    '<div class="st-enq-grid">' +
    field("ime", "Ime in priimek", "text", { req: true, auto: "name" }) +
    field("telefon", "Telefon", "tel", { auto: "tel", mode: "tel" }) +
    field("eposta", "E-pošta", "email", { auto: "email" }) +
    field("kraj", "Kraj ali poštna številka", "text", {
      auto: "postal-code",
      hint: "Po njem izračunamo dostavo.",
    }) +
    "</div>" +
    '<p class="st-enq-f">' +
    '<label class="st-enq-l" for="enq-dostop">Dostop do mesta postavitve</label>' +
    '<textarea class="st-enq-in st-enq-ta" id="enq-dostop" name="dostop" rows="3"' +
    (badField === "dostop" ? ' aria-invalid="true" autofocus' : "") +
    describedBy("dostop", true) + ">" +
    esc(sent("dostop")) + "</textarea>" +
    '<span class="st-enq-hint" id="enq-dostop-hint">Širina najožjega prehoda, stopnice ali škarpa na poti, ' +
    "razdalja do električne omarice. S temi tremi podatki lahko povemo, ali je model " +
    "izvedljiv, še preden pridemo na ogled.</span>" +
    "</p>" +
    '<p class="st-enq-f">' +
    '<label class="st-enq-l" for="enq-sporocilo">Vaše sporočilo</label>' +
    '<textarea class="st-enq-in st-enq-ta" id="enq-sporocilo" name="sporocilo" rows="4"' +
    (badField === "sporocilo" ? ' aria-invalid="true" autofocus' : "") +
    describedBy("sporocilo", false) + ">" +
    esc(sent("sporocilo")) + "</textarea>" +
    "</p>" +
    '<fieldset class="st-enq-fs">' +
    '<legend class="st-enq-l">Kako naj se oglasimo?</legend>' +
    '<span class="st-enq-radios">' +
    '<span class="st-enq-r"><input type="radio" id="enq-k-t" name="kanal" value="telefon"' +
    (sent("kanal") === "telefon" ? " checked" : "") + ">" +
    '<label for="enq-k-t">Po telefonu</label></span>' +
    '<span class="st-enq-r"><input type="radio" id="enq-k-e" name="kanal" value="e-posta"' +
    (sent("kanal") === "e-posta" ? " checked" : "") + ">" +
    '<label for="enq-k-e">Po e-pošti</label></span>' +
    "</span></fieldset>" +
    // ⚠️ NOT PRE-TICKED, AND THE SENTENCE IS THE ONE THAT GETS STORED.
    // A pre-ticked box is not consent (GDPR art. 4(11); Planet49 C-673/17),
    // and a page that printed different words from the ones written to the
    // row would make the stored record evidence of something else. The text
    // is imported, not retyped.
    '<p class="st-enq-consent">' +
    '<input type="checkbox" id="enq-soglasje" name="soglasje" value="1" required' +
    (badField === "soglasje" ? ' aria-invalid="true" autofocus' : "") +
    describedBy("soglasje", false) + ">" +
    // ⚠️ THE ASTERISK AND THE LINK, and both were missing.
    //
    // This control is `required` and refuses the submit, and it was the one
    // required control on the form with no marker — while the copy above the
    // form said only the name and one contact were mandatory. A visitor who
    // fixed a bad e-mail was then refused a second time, for a box nothing had
    // told them about.
    //
    // And the sentence cites "politika zasebnosti" while there was NO link to
    // /zasebnost anywhere inside <main> on this page — only in the site
    // footer. GDPR art. 7(2) asks that a consent request be in an easily
    // accessible form; the notice it depends on has to be one click away from
    // the box, not one scroll and a hunt.
    '<label for="enq-soglasje">' + esc(CONSENT_TEXT) +
    ' <span class="st-enq-req">*</span> ' +
    '<a href="' + esc(ctx.shop.routeSlugs["/privacy"]) + '">Politika zasebnosti</a>' +
    "</label>" +
    "</p>" +
    '<p class="st-enq-act"><button class="st-page-act st-page-act--lead" type="submit">' +
    "Pošljite povpraševanje</button></p>" +
    "</form>"
  );
}

/**
 * The photograph band. See the `figure` note in content/pages.ts: the slot is
 * operator-managed (admin/site-images.ts), so the image is decorative — the
 * page cannot know what the panel holds — and the frame reserves its own box
 * with aspect-ratio, so a replacement of any shape cannot shift the text
 * under a reader.
 */
function figure(b: Extract<Block, { kind: "figure" }>): string {
  return (
    '<figure class="st-page-fig">' +
    // NOTE the sizes hint is currently INERT: sitePhoto() carries no width
    // ladder, so decorativeImg emits neither srcset nor sizes and every
    // device gets the one stored file (capped at 1920 by the panel). Kept
    // for the day the slot is re-uploaded through /admin, which writes the
    // ladder and makes it live.
    decorativeImg(
      sitePhoto(b.slot),
      "st-page-fig-img",
      "(max-width: 809px) 92vw, 60vw",
    ) +
    (b.caption
      ? '<figcaption class="st-page-fig-cap">' + esc(b.caption) + "</figcaption>"
      : "") +
    "</figure>"
  );
}

function block(ctx: RenderCtx, b: Block, id?: string): string {
  const inner =
    b.kind === "prose"
      ? prose(b, id)
      : b.kind === "steps"
        ? steps(b, id)
        : b.kind === "list"
          ? list(b, id)
          : b.kind === "links"
            ? links(ctx, b, id)
            : b.kind === "compare"
              ? compare(b, id)
              : b.kind === "qa"
          ? qa(b, id)
          : b.kind === "facts"
            ? facts(b.h, b.rows, false, id)
            : b.kind === "contact"
              ? contact(ctx, b.h, id, b.omitAddress === true, b.notes)
              : b.kind === "imprint"
                ? imprint(ctx, b.h, id)
                : b.kind === "figure"
                  ? figure(b)
                  : b.kind === "enquiry"
                    ? enquiry(ctx, b, id)
                  : '<div class="st-page-cta">' +
                  '<h2 class="st-page-cta-h">' + esc(b.h) + "</h2>" +
                  '<p class="st-page-cta-p">' + esc(b.p) + "</p>" +
                  '<a class="st-page-cta-a" href="' + esc(b.href) + esc(ctx.q) + '">' +
                  esc(b.label) + "</a></div>";
  return (
    '<div class="st-page-block' + (isWide(b) ? " st-page-block--wide" : "") + '">' +
    inner +
    "</div>"
  );
}

/**
 * The whole page: masthead, hairline, index, blocks.
 *
 * THE INDEX EXISTS BECAUSE THESE PAGES ARE LONG. /vodniki is three full
 * articles in one column, /dostava and /pogoji are procedures — a reader
 * arriving with one question had to scroll past everything else to find out
 * whether it was answered at all. Three headed sections is the threshold: at
 * two, a list of two links is furniture.
 *
 * A <nav> with an accessible name rather than a bare list, so a screen reader
 * announces what the links are for and can skip them in one move.
 */
/**
 * WHERE TO GO NEXT, at the foot of every editorial and legal page.
 *
 * ⚠️ THIS IS AN INTERNAL-LINKING FIX, and the measurement is the reason it
 * exists. scripts/audit-seo.mjs walks the link graph, and eleven of these
 * pages linked to exactly ONE other page from their body: /dostava-in-montaza,
 * /primerjava, /vodniki, /o-nas, /kontakt, the FAQ and every legal page were
 * crawl dead ends. A page with one outbound link passes almost nothing on and
 * gives a crawler nowhere to go — on a site whose entire strategy is ranking
 * two category pages, that is the equity draining out the bottom of every
 * article.
 *
 * The destinations are not "related posts". They are the three pages this
 * shop exists to sell from, named by their own names so the anchor text says
 * what is at the other end — which is the half of an internal link that
 * carries the signal. At the end of a piece about delivery, "Masažni bazeni"
 * is also simply the right next step for a reader, which is the test any
 * link block has to pass before it is worth adding.
 *
 * The current page is excluded, so this can never link to itself.
 */
function onward(ctx: RenderCtx, page: Page): string {
  const s = ctx.shop;
  const here = s.routeSlugs[page.key as keyof typeof s.routeSlugs];
  const links: { path: string; label: string }[] = [
    ...(ctx.content.collections ?? []).map((c) => ({ path: c.path, label: c.h1 })),
    { path: s.routeSlugs["/products"], label: "Vsi modeli in cene" },
  ].filter((l) => l.path !== here);
  if (links.length === 0) return "";
  return (
    '<nav class="st-page-onward" aria-labelledby="st-onward-h">' +
    '<p class="st-page-onward-h" id="st-onward-h">Oglejte si</p>' +
    "<ul>" +
    links
      .map(
        (l) =>
          '<li><a href="' + esc(l.path + ctx.q) + '">' + esc(l.label) + "</a></li>",
      )
      .join("") +
    "</ul></nav>"
  );
}

/**
 * The block vocabulary, rendered without a page built around it.
 *
 * ⚠️ EXPORTED FOR THE BLOG, and for nothing else so far. A post is the same
 * blocks under a different masthead — it has a date and a cover photograph
 * and no table of contents — so themes/studio/blog.ts builds its own head and
 * asks for the body here. The alternative was a second implementation of
 * paragraphs, lists, questions and fact tables, which would have drifted from
 * this one the first time either was touched, on a site whose editorial pages
 * and whose posts are read one after the other.
 *
 * The ids are generated the same way, so an in-post anchor works the same as
 * an in-page one.
 */
export function renderStudioBlocks(ctx: RenderCtx, blocks: readonly Block[]): string {
  const ids = blocks.map((b, i) => ("h" in b && b.h ? sectionId(b.h, i) : ""));
  return blocks.map((b, i) => block(ctx, b, ids[i] || undefined)).join("");
}

export function renderStudioPage(ctx: RenderCtx, page: Page): string {
  const ids = page.blocks.map((b, i) => ("h" in b && b.h ? sectionId(b.h, i) : ""));
  const headed = page.blocks
    // A closing call to action carries a heading and is not a section of the
    // document — "Ostalo vprašanje?" listed among the guides read as a fourth
    // guide. It keeps its heading and its id; it just does not get an entry.
    .map((b, i) => (b.kind !== "cta" && "h" in b && b.h ? { h: b.h, id: ids[i]! } : null))
    .filter((x): x is { h: string; id: string } => x !== null);
  const index =
    // ⚠️ THREE. It was raised to four for one evening on a critique that a
    // three-link rail "holds a 256px column open beside 3,300px of empty
    // track" — which is what a fullPage screenshot shows, because fullPage
    // capture does not engage position:sticky. The rail is sticky: it
    // travels with the reader. Raising it stripped the index from /vodniki,
    // /dostava-in-montaza, /blagajna and /piskotki AND dropped them into the
    // solo grid, where a 46rem column floats with the page's whole slack on
    // its right — the reported "subpages do not use the full width".
    headed.length < 3
      ? ""
      : '<nav class="st-page-toc" aria-labelledby="st-toc-h">' +
        '<p class="st-page-toc-h" id="st-toc-h">Na tej strani</p>' +
        "<ol>" +
        headed
          .map((x) => '<li><a href="#' + esc(x.id) + '">' + esc(x.h) + "</a></li>")
          .join("") +
        "</ol></nav>";

  // Three parts in reading order — masthead, index, document — laid out as
  // one grid so the index can become a sticky rail beside the text where
  // there is room for one, and stay an interruption of the column where
  // there is not. See .st-page-grid.
  return (
    '<main><section class="st-page"><div class="st-page-in">' +
    '<div class="st-page-grid' + (index ? "" : " st-page-grid--solo") + '">' +
    '<header class="st-page-head">' +
    '<p class="st-page-eyebrow">' + esc(ctx.shop.name) + "</p>" +
    '<h1 class="st-page-h">' + esc(page.h1) + "</h1>" +
    '<p class="st-page-lead">' + esc(page.lead) + "</p>" +
    "</header>" +
    (index ? '<div class="st-page-rail">' + index + "</div>" : "") +
    '<div class="st-page-body">' +
    page.blocks.map((b, i) => block(ctx, b, ids[i] || undefined)).join("") +
    onward(ctx, page) +
    "</div></div></div></section></main>"
  );
}
