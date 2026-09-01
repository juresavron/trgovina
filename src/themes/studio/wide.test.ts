import { describe, expect, it } from "vitest";
import { STUDIO_CSS } from "./index";
import { STUDIO_WIDE_CSS } from "./wide";
import { STUDIO_TOKENS } from "./tokens";

/**
 * THE WIDE TIER'S ONE FRAGILE PROPERTY, PINNED.
 *
 * ⚠️ A MEDIA QUERY ADDS NO SPECIFICITY, so every rule in wide.ts wins only by
 * being the LAST declaration in the sheet. This has already been shipped
 * broken once: the first version of the block lived 1600 lines into page.ts
 * and lost to `.st-enq-lead`, declared further down the same file. Prose on
 * /primerjava widened and prose on /kontakt did not, from one rule that read
 * as correct in review and in the stylesheet.
 *
 * Moving it to its own module fixed that and left the same trap one level up:
 * anything concatenated after STUDIO_WIDE_CSS in index.ts silently reverts the
 * whole tier on whatever selectors it happens to share. Nothing in the type
 * system can see it — STUDIO_CSS is a string — so it is checked here.
 */
describe("the wide tier", () => {
  it("is the last thing in the stylesheet", () => {
    expect(STUDIO_CSS.endsWith(STUDIO_WIDE_CSS)).toBe(true);
  });

  it("meets the desktop gutter exactly at its own breakpoint", () => {
    // ⚠️ THE SEAM IS ARITHMETIC, NOT A GUESS. The wide tier engages at 1640
    // and its gutter clamp floor must be the 40px the desktop tier already
    // sets, or the band STEPS at the breakpoint: below it the container is
    // capped at 1560, above it the container is 100vw minus two gutters, and
    // those two agree at 1640 only while the floor is 40 (1640 - 80 = 1560).
    // Change either number and the page visibly narrows as it widens.
    expect(STUDIO_TOKENS).toContain("--studio-gutter: 40px;");
    expect(STUDIO_TOKENS).toMatch(
      /@media \(min-width: 1640px\)[\s\S]*?--studio-gutter: clamp\(\s*40px,\s*calc\(40px \+ \(100vw - 1640px\) \/ 4\)/,
    );
    expect(STUDIO_TOKENS).toMatch(
      /--studio-container: min\(2400px, calc\(100vw - 2 \* var\(--studio-gutter\)\)\)/,
    );
  });

  it("scales the type with every measure rung", () => {
    // ⚠️ THE WHOLE POINT, AND THE THING FOUR ROUNDS MISSED. The measures are
    // in rem and --t-body was a constant 16px, so a wider column could only
    // ever mean a longer line. Every rung that declares a measure must
    // declare a size beside it; a rung that widens alone is the old bug.
    const rungs = STUDIO_WIDE_CSS.match(/--wide-measure: \d+rem/g) ?? [];
    const sizes = STUDIO_WIDE_CSS.match(/--t-body: \d+px/g) ?? [];
    expect(rungs.length).toBe(3);
    expect(sizes.length).toBe(3);
  });
});
