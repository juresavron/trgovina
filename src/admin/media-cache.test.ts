import { describe, it, expect } from "vitest";
import { isContentAddressed } from "./routes";
import { MEDIA_ALIASES, aliasTarget, encodeBucketKey } from "../media-aliases";
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

/**
 * Aliases exist so an awkward filename never stops a picture shipping. They
 * are also a bypass of the path pattern, which is a security boundary — so
 * what matters is that the bypass can only ever reach a key written by hand
 * in the source.
 */
describe("media aliases", () => {
  it("resolves only paths spelled out in the table", () => {
    expect(aliasTarget("kategorija-masazni-bazeni.jpeg")).toBe(
      "Generated Image August 25, 2026 - 6_06PM Large.jpeg",
    );
    for (const p of ["", "hero.png", "../../etc/passwd", "kategorija-masazni-bazeni", "KATEGORIJA-MASAZNI-BAZENI.JPEG"]) {
      expect(aliasTarget(p), p).toBeNull();
    }
  });

  it("cannot be reached through Object.prototype", () => {
    // A plain `MEDIA_ALIASES[path]` lookup would resolve "constructor" and
    // "toString" to functions, which then get concatenated into an upstream
    // URL. hasOwnProperty is why that cannot happen.
    for (const p of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(aliasTarget(p), p).toBeNull();
    }
  });

  it("encodes a key so the space and the comma survive the round trip", () => {
    expect(encodeBucketKey("Generated Image August 25, 2026 - 6_06PM Large.jpeg")).toBe(
      "Generated%20Image%20August%2025%2C%202026%20-%206_06PM%20Large.jpeg",
    );
    // Path separators must NOT be encoded, or the key stops addressing a
    // nested object and starts addressing one file with slashes in its name.
    expect(encodeBucketKey("bazen/mali-195/a b.webp")).toBe("bazen/mali-195/a%20b.webp");
  });

  it("keeps every alias target out of the immutable regime", () => {
    // An alias is human-named by definition — that is why it needs one — so
    // caching it forever would be the freeze bug wearing a clean URL.
    for (const clean of Object.keys(MEDIA_ALIASES)) {
      expect(isContentAddressed(clean), clean).toBe(false);
    }
  });
});
