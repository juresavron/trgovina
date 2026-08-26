import { describe as suite, it, expect } from "vitest";
import { CSP, storedPaths, widthPath } from "./routes";

/**
 * Deleting a photograph has to ask for the files that exist.
 *
 * These three shapes are not invented: they are the three that were actually
 * in product_media when an operator reported "Napaka na strežniku" on delete.
 * The first is what the panel writes today, the second is what it writes when
 * the source was too small to upscale, and the third is every row that
 * predates the width ladder.
 */
suite("the objects behind a row", () => {
  const base = "bazen/swim-580-hidro/swim-580-hidro-fotografija-4--699fe1de.webp";

  it("does not ask for the widest rung, which was never suffixed", () => {
    // The upscaled ladder. Five widths, five objects, four of them suffixed —
    // asking for "-2048.webp" is the bug this exists to prevent.
    expect(storedPaths(base, [480, 800, 1200, 1600, 2048])).toEqual([
      base,
      widthPath(base, 480),
      widthPath(base, 800),
      widthPath(base, 1200),
      widthPath(base, 1600),
    ]);
    expect(storedPaths(base, [480, 800, 1200, 1600, 2048])).not.toContain(widthPath(base, 2048));
  });

  it("handles a source too small to upscale", () => {
    expect(storedPaths(base, [480, 600])).toEqual([base, widthPath(base, 480)]);
  });

  it("is one object for a row with no ladder at all", () => {
    // Every image uploaded before the ladder existed, and every one whose
    // source was narrower than the smallest rung.
    expect(storedPaths("ZR805-1.jpg", [])).toEqual(["ZR805-1.jpg"]);
    expect(storedPaths("ZR805-1.jpg", null)).toEqual(["ZR805-1.jpg"]);
    expect(storedPaths("ZR805-1.jpg", undefined)).toEqual(["ZR805-1.jpg"]);
    expect(storedPaths(base, [1600])).toEqual([base]);
  });

  it("never asks for the same object twice, or for a nonsense width", () => {
    // A duplicate would delete once and then 404 on the second attempt; a zero
    // or a NaN would ask for "-0.webp", which nothing ever wrote.
    expect(storedPaths(base, [480, 480, 800])).toEqual([base, widthPath(base, 480)]);
    expect(storedPaths(base, [0, -1, Number.NaN, 480, 800])).toEqual([base, widthPath(base, 480)]);
  });

  it("removes the row's own url first, whatever the ladder", () => {
    // The bare path is the one the storefront serves and the one the product
    // page's <img src> points at, so it is the one whose absence matters most.
    for (const w of [[], [480, 600], [480, 800, 1200, 1600, 2048]]) {
      expect(storedPaths(base, w)[0]).toBe(base);
    }
  });
});

/**
 * The panel's own thumbnails must be allowed to render.
 *
 * ⚠️ blob: IS NOT COVERED BY 'self'. The upload card previews every picture
 * before it sends anything, from a blob: URL its own script made, and CSP
 * treats blob: as its own scheme — so an img-src of 'self' alone refused all
 * of them and the operator picked files blind. It also breaks the Safari-
 * before-15 decode path, which reads a file through an <img> and an object
 * URL because that browser has no createImageBitmap.
 */
suite("the admin content security policy", () => {
  it("allows the blob: URLs the upload card makes for itself", () => {
    expect(CSP).toContain("img-src 'self' blob:");
  });

  it("still lets nothing in from anywhere else", () => {
    expect(CSP).toContain("default-src 'none'");
    expect(CSP).toContain("frame-ancestors 'none'");
    expect(CSP).toContain("base-uri 'none'");
    // blob: is the ONE addition. A scheme or host list creeping into img-src
    // would mean the panel had started loading somebody else's pictures.
    const img = CSP.split(";").map((d) => d.trim()).find((d) => d.startsWith("img-src"));
    expect(img).toBe("img-src 'self' blob:");
    expect(CSP).not.toContain("http:");
    expect(CSP).not.toContain("*");
  });
});
