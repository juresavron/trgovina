import { describe, it, expect } from "vitest";
import { SHOPS } from ".";
import { THEME_CATALOG } from "../themes/catalog";
import { MAX_SECTIONS_PER_PAGE } from "../themes/shared/sections";

/**
 * Every shop now wears the studio theme. That is what the owner asked for, and
 * it is also the single riskiest thing this network does: six single-keyword
 * shops from one owner, on one design, is the site-network pattern Google
 * explicitly polices (docs/SEO.md §6).
 *
 * The defence is that they must not render the SAME PAGE. Accent hue and copy
 * differ already; section order is the structural half, and it is a one-line
 * config value that a future edit could quietly flatten. So it is asserted.
 */
describe("shops do not render the same page", () => {
  const order = (key: string) => {
    const s = SHOPS[key]!;
    return (s.design.composition ?? THEME_CATALOG[s.design.theme].composition.home).join(">");
  };

  it("every shop's act order is distinct", () => {
    const seen = new Map<string, string>();
    for (const key of Object.keys(SHOPS)) {
      const o = order(key);
      const clash = seen.get(o);
      expect(clash, key + " renders the same section order as " + clash).toBeUndefined();
      seen.set(o, key);
    }
  });

  it("no composition exceeds the page cap", () => {
    for (const key of Object.keys(SHOPS)) {
      const n = order(key).split(">").length;
      expect(n, key + " composes " + n + " sections").toBeLessThanOrEqual(MAX_SECTIONS_PER_PAGE);
    }
  });

  it("every shop still opens on the keyword statement", () => {
    // Order may vary; the H1-bearing hero leading the page may not. It is the
    // keyword landing page — that is the entire strategy.
    for (const key of Object.keys(SHOPS)) {
      expect(order(key).split(">")[0], key).toBe("hero");
    }
  });

  it("accent hues are far enough apart to read as different brands", () => {
    const hues = Object.values(SHOPS).map((s) => s.design.accentHue).sort((a, b) => a - b);
    for (let i = 1; i < hues.length; i++) {
      const gap = hues[i]! - hues[i - 1]!;
      expect(gap, "hues " + hues[i - 1] + " and " + hues[i] + " are " + gap + "° apart").toBeGreaterThanOrEqual(5);
    }
  });
});
