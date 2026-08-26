import { describe, it, expect } from "vitest";
import { isContentAddressed, isWebp, adminModelSlugs } from "./routes";
import { OFFERED_MODELS } from "../catalog/pola";
import { OFFERED_SWIMSPAS } from "../catalog/swimspa";
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
    // Every entry, rather than a favourite one: the table grows a row each
    // time a picture arrives with a name a URL cannot carry, and a test that
    // checks the first row stops testing the table the moment it has two.
    for (const [clean, key] of Object.entries(MEDIA_ALIASES)) {
      expect(aliasTarget(clean), clean).toBe(key);
    }
    expect(aliasTarget("hero-banner.jpeg")).toBe(
      "Generated Image August 25, 2026 - 5_41PM Large.jpeg",
    );
    expect(aliasTarget("kategorija-masazni-bazeni.jpeg")).toBe(
      "Generated Image August 25, 2026 - 6_06PM Large.jpeg",
    );
    expect(aliasTarget("kategorija-swim-spa.jpeg")).toBe(
      "Generated Image August 25, 2026 - 6_26PM Large.jpeg",
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

/**
 * EVERY UPLOAD IS WEBP, AND THE PANEL CAN REACH EVERY PRODUCT.
 *
 * Both of these were false in ways that produced no error and no log line.
 */
describe("the media panel's two promises", () => {
  it("recognises WebP from the bytes, not from the label", () => {
    // "RIFF" ... "WEBP" — the container magic and its form type.
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50,
    ]);
    expect(isWebp(webp.buffer)).toBe(true);

    // A PNG, a JPEG and a RIFF container that is NOT WebP (a WAV) — the last
    // one is why the check reads bytes 8-11 as well as 0-3.
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0]);
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const wav = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45, 0x66, 0x6d,
    ]);
    for (const [name, bytes] of [["png", png], ["jpeg", jpeg], ["wav (RIFF, not WEBP)", wav]] as const) {
      expect(isWebp(bytes.buffer), name + " must not pass as WebP").toBe(false);
    }
    // Too short to carry the magic at all.
    expect(isWebp(new Uint8Array([0x52, 0x49, 0x46, 0x46]).buffer)).toBe(false);
  });

  it("offers every offered model, both families", () => {
    // The panel listed OFFERED_MODELS only, so the three swim spas — half the
    // catalogue, and the half with the largest tickets — had no page and no
    // way to change a photograph. Nothing errored; they were simply absent.
    const slugs = adminModelSlugs();
    for (const m of OFFERED_MODELS) {
      expect(slugs, "hot tub " + m.slug + " is not manageable").toContain(m.slug);
    }
    for (const m of OFFERED_SWIMSPAS) {
      expect(slugs, "swim spa " + m.slug + " is not manageable").toContain(m.slug);
    }
    expect(slugs.length).toBe(OFFERED_MODELS.length + OFFERED_SWIMSPAS.length);
    expect(new Set(slugs).size, "two models share a slug").toBe(slugs.length);
  });
});
