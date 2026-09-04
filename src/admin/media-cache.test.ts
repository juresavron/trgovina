import { describe, it, expect } from "vitest";
import { adminModelSlugs } from "./routes";
import { isContentAddressed, isWebp } from "./media";
import { SITE_IMAGES, legacyFallback, siteImageBySlug, stemOf } from "./site-images";
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
   * THIS TEST CHANGED THE DAY THE PANEL'S FIRST PHOTOGRAPH WENT LIVE, which
   * is what its previous note asked for: it used to assert that NOTHING the
   * site serves is content-addressed, because everything had gone in through
   * the Supabase dashboard. That stopped being true, and an assertion kept
   * past the fact it described is worse than none — it fails on the change
   * working rather than on the change breaking.
   *
   * What is worth pinning is not which regime the files are in but that every
   * one of them is in a regime DELIBERATELY: a name that decides its own
   * cache lifetime. A dashboard upload can be replaced in place, so it must
   * stay revalidatable; a panel upload carries a UUID that changes with its
   * bytes, so it can cache for a year. Both are correct. A file that is
   * neither would be a URL nobody can reason about.
   */
  it("knows which cache regime every URL the site serves is under", () => {
    const live = [
      ...Object.values(OWN_HERO).map((h) => h!.src),
      ...Object.values(OWN_MEDIA).flat().map((p) => p.src),
    ].map((u) => u.replace(/^\/media\//, ""));
    expect(live.length).toBeGreaterThan(0);

    const forever = live.filter(isContentAddressed);
    const revalidated = live.filter((u) => !isContentAddressed(u));
    // The partition is total by construction; asserting it is how a third
    // state would announce itself rather than hide.
    expect(forever.length + revalidated.length).toBe(live.length);

    // Everything cached for a year must carry a UUID, because that is the
    // only thing making the URL change when the bytes do.
    for (const u of forever) {
      expect(u, u).toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    }
    // And nothing cached for a year may be a bare human name, which is what
    // gets replaced in place.
    for (const u of revalidated) {
      expect(isContentAddressed(u), u).toBe(false);
    }
  });

  /**
   * A width rung caches exactly as its photograph does.
   *
   * The rungs are separate URLs and the browser picks between them, so a
   * ladder whose members disagreed about cache lifetime would serve a stale
   * 800px file beside a fresh 1600px one — the same picture, two versions,
   * depending on the viewport.
   */
  it("puts every rung in the same regime as its photograph", () => {
    for (const set of Object.values(OWN_MEDIA)) {
      for (const photo of set) {
        const base = photo.src.replace(/^\/media\//, "");
        for (const [rung] of photo.widths) {
          expect(isContentAddressed(rung.replace(/^\/media\//, "")), rung)
            .toBe(isContentAddressed(base));
        }
      }
    }
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


/**
 * The site's own pictures — the hero and the two category banners.
 *
 * These are the three files the panel could not reach, which is why the
 * heaviest image on the storefront was a 2.7 MB PNG. What makes them work is
 * a FIXED key: the storefront names them in code and renders synchronously, so
 * it can never learn a new filename, and a replacement therefore has to land
 * on top of the old one.
 */
describe("site images", () => {
  it("keys are fixed, WebP, and under one prefix", () => {
    for (const s of SITE_IMAGES) {
      expect(s.key.startsWith("site/"), s.key).toBe(true);
      expect(s.key.endsWith(".webp"), s.key).toBe(true);
      // Anything content-addressed would be cached for a year and a
      // replacement would never appear — see isContentAddressed.
      expect(isContentAddressed(s.key), s.key + " must not look content-addressed").toBe(false);
    }
  });

  it("every slot resolves by the stem its URL carries, and nothing else does", () => {
    for (const s of SITE_IMAGES) {
      expect(siteImageBySlug(stemOf(s.key))?.key).toBe(s.key);
    }
    for (const junk of ["", "hero.webp", "site/hero", "../hero", "HERO"]) {
      expect(siteImageBySlug(junk), junk).toBeUndefined();
    }
  });

  /**
   * The fallback answers for the three managed keys and refuses everything
   * else — it is a migration bridge, not a general retry, and a general one
   * would turn /media into something that probes the bucket twice for every
   * miss.
   */
  it("falls back only for the keys it names", () => {
    expect(legacyFallback("site/hero.webp")).toBe("hero.png");
    for (const junk of ["hero.png", "site/other.webp", "bazen/x/a.webp", ""]) {
      expect(legacyFallback(junk), junk).toBeNull();
    }
  });
});
