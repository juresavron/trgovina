import { describe, expect, it } from "vitest";
import { brandMark, faviconSvg, touchIconSvg } from "./brand";

/**
 * THE MARK IS SYMMETRIC, AND IT IS CHECKED HERE RATHER THAN LOOKED AT.
 *
 * For three rounds of drawing review the V was asserted in a comment to be
 * "symmetric about x=12" and was not: its left arm was cut 5 units wide at the
 * top and its right arm 4.2, and the flat terminal ran x=12 to x=13.7 — the
 * point of the letter sitting 0.85 units right of the axis of a 24-unit box.
 * Nobody saw it, because a 3.5% lean on a 16px glyph is exactly the size of
 * error an eye corrects for.
 *
 * scripts/verify-mark-symmetry.mjs proves it the honest way — rasterise,
 * mirror the bitmap, count the pixels that disagree — but that needs a browser
 * and the deploy runs `npm test`. So the invariant lives here too, on the
 * geometry rather than the pixels, where CI can enforce it.
 */

/** Every point a path command lands on. Supports the subset the mark uses. */
function points(d: string): readonly (readonly [number, number])[] {
  const out: [number, number][] = [];
  let x = 0;
  let y = 0;
  // Split into commands: a letter followed by its numbers.
  const cmds = d.match(/[A-Za-z][^A-Za-z]*/g) ?? [];
  for (const cmd of cmds) {
    const op = cmd[0]!;
    const n = (cmd.slice(1).match(/-?\d*\.?\d+/g) ?? []).map(Number);
    switch (op) {
      case "M":
      case "L":
        // ⚠️ A LONE M OR L TAKES AS MANY PAIRS AS ARE WRITTEN. The mark's own
        // path relies on this: "L12 13.5 16.5 4.5" is two line-tos, and a
        // parser that read only the first pair would silently drop the apex
        // — and then happily report the shape symmetric.
        for (let i = 0; i + 1 < n.length; i += 2) {
          x = n[i]!;
          y = n[i + 1]!;
          out.push([x, y]);
        }
        break;
      case "l":
        for (let i = 0; i + 1 < n.length; i += 2) {
          x += n[i]!;
          y += n[i + 1]!;
          out.push([x, y]);
        }
        break;
      case "H":
        for (const v of n) { x = v; out.push([x, y]); }
        break;
      case "h":
        for (const v of n) { x += v; out.push([x, y]); }
        break;
      case "V":
        for (const v of n) { y = v; out.push([x, y]); }
        break;
      case "v":
        for (const v of n) { y += v; out.push([x, y]); }
        break;
      case "Z":
      case "z":
        break;
      default:
        throw new Error("brand.test cannot read the path command " + op);
    }
  }
  return out;
}

/** The one path inside the mask — the knockout the mark is cut with. */
function knockout(svg: string): string {
  const m = svg.match(/<mask[\s\S]*?<path d="([^"]+)"/);
  expect(m, "the mark should carry one masked path").toBeTruthy();
  return m![1]!;
}

const AXIS = 12; // half of the 24-unit viewBox every rendering shares

describe("the brand mark", () => {
  for (const [name, svg] of [
    ["in the page", brandMark("test")],
    ["as the favicon", faviconSvg()],
    ["as the touch icon", touchIconSvg()],
  ] as const) {
    it("mirrors onto itself " + name, () => {
      const pts = points(knockout(svg));
      expect(pts.length).toBeGreaterThan(3);
      const key = (p: readonly [number, number]) => p[0].toFixed(3) + "," + p[1].toFixed(3);
      const have = new Set(pts.map(key));
      const missing = pts
        .map((p) => [2 * AXIS - p[0], p[1]] as const)
        .filter((p) => !have.has(key(p)));
      expect(missing, "points with no mirror across x=" + AXIS).toEqual([]);
    });
  }

  it("keeps every edge on the 1.5 grid, which is what stays crisp at 16px", () => {
    // A 24 viewBox at 16, 24, 32, 64 and 160px puts 1.5 on a whole device
    // pixel every time; anything off it picks up a grey fringe on that edge.
    for (const [x, y] of points(knockout(brandMark("grid")))) {
      expect((x * 2) % 3, "x=" + x + " is off the 1.5 grid").toBe(0);
      expect((y * 2) % 3, "y=" + y + " is off the 1.5 grid").toBe(0);
    }
  });

  it("is one filled shape — no strokes, which smear below 2px", () => {
    for (const svg of [brandMark("s"), faviconSvg(), touchIconSvg()]) {
      expect(svg).not.toMatch(/stroke=/);
    }
  });
});
