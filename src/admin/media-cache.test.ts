import { describe, it, expect } from "vitest";
import { isContentAddressed } from "./routes";
import { OWN_HERO } from "../themes/studio/own-hero";
import { OWN_MEDIA } from "../themes/studio/own-media";

/**
 * A picture that never updates is the quietest bug this proxy can have: no
 * error, no log line, nothing failing — just the old file, for a year,
 * because the URL promised it would never change and then it did.
 */
describe("media caching matches how the file is named", () => {
  it("caches a UUID path forever", () => {
    // What /admin writes: <shop>/<slug>/<uuid>.webp, plus its width rungs.
    expect(isContentAddressed("bazen/mali-195/3f2b1c9e-4a7d-4e21-9b8f-1c2d3e4f5a6b.webp")).toBe(true);
    expect(isContentAddressed("bazen/mali-195/3f2b1c9e-4a7d-4e21-9b8f-1c2d3e4f5a6b-800.webp")).toBe(true);
  });

  it("does NOT cache a human-named file forever", () => {
    // What a Supabase dashboard upload writes. Replace it in place and the
    // bytes change while the URL does not, so `immutable` would freeze it.
    for (const p of ["hero.png", "hero-2.jpeg", "zr7809-1.webp", "bazen/hero.webp"]) {
      expect(isContentAddressed(p), p).toBe(false);
    }
  });

  /**
   * The site's own media is all human-named today, because it was uploaded
   * through the dashboard rather than the panel. If that ever stops being
   * true this test should be updated, not deleted — the point is to know
   * which regime every live URL is under, not to assert one forever.
   */
  it("knows every URL the site actually serves is in the short-cache regime", () => {
    const live = [
      ...Object.values(OWN_HERO).map((h) => h!.src),
      ...Object.values(OWN_MEDIA).flat().map((p) => p.src),
    ].map((u) => u.replace(/^\/media\//, ""));
    expect(live.length).toBeGreaterThan(0);
    expect(live.filter(isContentAddressed)).toEqual([]);
  });
});
