/**
 * THE PAGE'S WIDTH SYSTEM — one container, one arithmetic, one place.
 *
 * ⚠️ WHY THIS FILE EXISTS. Every band on this site is supposed to hold the
 * same content measure, and until now each module said so in its own words.
 * An audit of the theme found the same intent expressed three different ways:
 *
 *   A. max-width: calc(var(--studio-container) + 2 * var(--studio-gutter))
 *      with padding-inline: var(--studio-gutter)         — 16 selectors
 *   B. max-inline-size: var(--studio-container)
 *      with padding-inline: var(--studio-gutter)         — 3 selectors
 *   C. max-inline-size: min(var(--studio-container),
 *                           calc(100% - 2 * var(--studio-gutter)))  — 1
 *
 * A and C agree at every viewport. B does NOT: box-sizing is border-box, so
 * capping at --studio-container and then padding inside it eats the gutter
 * out of the measure. Above a 1560px viewport, B's bands are 80px narrower
 * than their neighbours — the membership band, the social strip and the
 * finder page each sat 40px inboard of every band above them, on a page that
 * had already decided what its edges were. Nobody wrote that rule; it is what
 * happens when one decision is typed out twenty times.
 *
 * So the twenty declarations become this one, and the modules keep only what
 * is genuinely theirs (block padding, grounds, grid tracks). --studio-container
 * stays the token; this is the arithmetic that consumes it.
 *
 * ⚠️ ORDER: this must be concatenated straight after STUDIO_TOKENS and before
 * every section module, so a module can still override a container
 * deliberately and be seen to do it. See STUDIO_CSS in index.ts.
 *
 * ⚠️ NOT A NEW CLASS. Adding .st-wrap and re-marking twenty renderers would
 * be the same refactor with a markup migration bolted on, and every renderer
 * that got missed would fail silently by rendering full-bleed. Listing the
 * selectors that already exist changes no HTML and cannot half-apply.
 */

/**
 * Every band that holds the house measure.
 *
 * Grouped by the module that owns the markup, so a new band is added next to
 * its neighbours rather than at the end of a list nobody can read.
 */
const CONTAINERS = [
  /* chrome.ts — the fixed bar and the footer */
  ".st-chrome-bar",
  ".st-foot-in",
  /* hero.ts */
  ".st-hero-foot",
  /* statement.ts */
  ".st-statement-in",
  ".st-stats-in",
  /* commerce.ts */
  ".st-shop-in",
  ".st-cat-head",
  ".st-cat-row",
  ".st-rail-head",
  /* editorial.ts */
  ".st-imp-in",
  ".st-tst-in",
  ".st-gd-in",
  /* pdp.ts */
  ".st-pdp-in",
  ".st-also",
  ".st-pdp-bar-in",
  /* page.ts — every content page, the blog index and every post */
  ".st-page-in",
  /* closing.ts — these three were pattern B, and were 80px narrow */
  ".st-soc-label",
  ".st-mem-in",
  /* finder.ts */
  ".st-fnd",
];

/** ".st-a, .st-b" → ':root[data-theme="studio"] .st-a, …' */
const at = (sel: readonly string[]): string =>
  sel.map((s) => ':root[data-theme="studio"] ' + s).join(",\n  ");

export const STUDIO_LAYOUT_CSS = `
  /* ---- the house container -------------------------------------------
   *
   * --studio-container is the CONTENT measure, and box-sizing is border-box,
   * so the gutter has to be added back into the cap for the content inside to
   * measure exactly --studio-container. That single line of arithmetic is the
   * whole reason this file exists — see the header.
   *
   * inline-size: 100% so a container that is also a flex or grid ITEM does not
   * shrink to its content and drift off the shared left edge. Three of these
   * are (.st-chrome-bar, .st-hero-foot, .st-pdp-bar-in). */
  ${at(CONTAINERS)} {
    inline-size: 100%;
    max-inline-size: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
  }

  /* ---- bands that bleed, but start on the same line -------------------
   *
   * A horizontal scrollport is allowed to run off the right edge — that
   * overhang is what says "there is more, push it". What it may NOT do is
   * start somewhere else: at 1920 the rail's first card began 40px from the
   * viewport edge while its own heading began 180px in, so the section's two
   * halves had two left edges.
   *
   * max() gives the gutter below the cap and the container's own inset above
   * it, which is the same left edge as every band on the page, with no
   * wrapper and no cap on the scroll length. The right side keeps the plain
   * gutter so the last card still clears the edge when the rail is short
   * enough not to scroll. */
  :root[data-theme="studio"] .st-rail,
  :root[data-theme="studio"] .st-rail-nav {
    padding-inline: max(
      var(--studio-gutter),
      calc((100% - var(--studio-container)) / 2)
    ) var(--studio-gutter);
  }
`;
