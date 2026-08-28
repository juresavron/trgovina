import { describe, it, expect } from "vitest";
import { STUDIO_CSS } from "./index";
import { STUDIO_LAYOUT_CSS } from "./layout";
import { STUDIO_TOKENS } from "./tokens";

/**
 * THE WIDTH SYSTEM HAS ONE SOURCE, AND THIS IS WHAT KEEPS IT THAT WAY.
 *
 * Before layout.ts, twenty selectors across nine modules each said "hold the
 * house measure" in their own words, and three of them said it with different
 * arithmetic — capping at --studio-container and then padding inside it, which
 * with border-box eats the gutter out of the measure. The membership band, the
 * social strip and the finder page were 80px narrower than every band above
 * them at any viewport past 1560px. Nobody decided that; it is what twenty
 * copies of one decision drift into.
 *
 * These tests are cheap string assertions on the shipped sheet, deliberately.
 * The real proof is geometric — every container sharing one left edge on every
 * route at every width — and that belongs in the browser audit, which measures
 * it. What a unit test can do is stop the DUPLICATION coming back, which is
 * the thing that caused the drift in the first place.
 */
describe("the studio width system", () => {
  /** Every rule body in the sheet, crudely but reliably split. */
  const rules = STUDIO_CSS.match(/[^{}]+\{[^{}]*\}/g) ?? [];

  it("declares the container arithmetic in exactly one place", () => {
    // The canonical form. If a module reintroduces it, this fires.
    const carriers = rules.filter((r) =>
      /max-(?:width|inline-size):\s*calc\(\s*var\(--studio-container\)\s*\+/.test(r),
    );
    expect(carriers.length, "container arithmetic appears in " + carriers.length + " rules").toBe(1);
    // …and that one place is layout.ts.
    expect(STUDIO_LAYOUT_CSS).toContain("calc(var(--studio-container) + 2 * var(--studio-gutter))");
  });

  /**
   * ⚠️ THE BUG THIS EXISTS FOR. `max-inline-size: var(--studio-container)` is
   * the WRONG cap whenever the same element also pads by the gutter: the token
   * is the CONTENT measure, so the gutter has to be added back or it is taken
   * out of the content. Three selectors did this and were silently 80px narrow.
   */
  it("never caps at the bare container token while padding by the gutter", () => {
    const bad = rules.filter(
      (r) =>
        /max-(?:width|inline-size):\s*var\(--studio-container\)/.test(r) &&
        /padding(?:-inline)?:[^;]*var\(--studio-gutter\)/.test(r),
    );
    expect(bad.map((r) => r.split("{")[0]!.trim().slice(0, 80))).toEqual([]);
  });

  it("keeps --studio-container and --studio-gutter declared only in tokens.ts", () => {
    const declaredIn = (css: string, name: string) =>
      (css.match(new RegExp("(^|[;{\\s])" + name + ":", "g")) ?? []).length;
    // Whole sheet minus the tokens module: nothing else may DECLARE them.
    const rest = STUDIO_CSS.replace(STUDIO_TOKENS, "");
    expect(declaredIn(rest, "--studio-container")).toBe(0);
    expect(declaredIn(rest, "--studio-gutter")).toBe(0);
    expect(declaredIn(STUDIO_TOKENS, "--studio-container")).toBeGreaterThan(0);
  });

  /**
   * A padding SHORTHAND on a container resets the shared padding-inline back
   * to nothing, which takes that band off the grid above the cap without
   * changing anything visible at the width most people develop at. Two rules
   * had one (.st-also and .st-fnd); both now set padding-block only.
   */
  it("no shared container overrides its inline padding with a shorthand", () => {
    const CONTAINERS = [
      "st-chrome-bar", "st-foot-in", "st-hero-foot", "st-statement-in", "st-stats-in",
      "st-shop-in", "st-cat-head", "st-cat-row", "st-rail-head", "st-imp-in",
      "st-tst-in", "st-gd-in", "st-pdp-in", "st-also", "st-pdp-bar-in",
      "st-page-in", "st-soc-label", "st-mem-in", "st-fnd",
    ];
    const offenders: string[] = [];
    for (const c of CONTAINERS) {
      for (const r of rules) {
        const sel = r.split("{")[0]!;
        // The rule targets this container as its LAST class (not a descendant).
        if (!new RegExp("\\." + c + "\\s*\\{|\\." + c + "\\s*,").test(sel + "{")) continue;
        if (!sel.includes("." + c)) continue;
        const body = r.slice(r.indexOf("{"));
        // `padding:` and `margin:` shorthands both reset the inline half.
        if (/[;{]\s*padding:/.test(body) || /[;{]\s*margin:/.test(body)) {
          offenders.push(c + " — " + sel.trim().slice(0, 60));
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("gives the bleeding rail the same left edge as the bands", () => {
    // The rail scrolls past the right edge on purpose; it may not START
    // somewhere else. max() gives the gutter below the cap and the
    // container's own inset above it.
    expect(STUDIO_LAYOUT_CSS).toMatch(
      /\.st-rail[\s\S]*?padding-inline:\s*max\(\s*var\(--studio-gutter\)/,
    );
  });
});
