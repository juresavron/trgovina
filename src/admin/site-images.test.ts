import { describe, expect, it } from "vitest";
import { SITE_IMAGES, legacyFallback, siteImageBySlug, stemOf } from "./site-images";

/**
 * The slots the panel manages, and the one property prose could not hold.
 *
 * ⚠️ THE COLLISION TEST IS THE POINT OF THIS FILE. Every decorative picture on
 * the home page used to be chosen by pick(OWN_PHOTOS, shop, n), and the
 * modules that did the choosing kept their collision lists in COMMENTS —
 * closing.ts named the taken offsets in a sentence and picked a run that
 * cleared them. Then the story band moved from 7 and 11 to 23 and 25, nobody
 * updated the sentence, and the gallery strip's first tile started resolving
 * the same photograph as the story band's large frame. The same picture twice
 * on one page, shipped, for exactly as long as it took somebody to notice.
 *
 * A list of numbers in a comment cannot survive an edit to the numbers. This
 * can.
 */
describe("site image slots", () => {
  it("gives every slot a distinct fallback photograph", () => {
    // What a slot falls back to is what the page ACTUALLY paints until an
    // upload replaces it, so two slots sharing one is two identical pictures
    // on the live site — not a theoretical clash of offsets.
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const slot of SITE_IMAGES) {
      const target = legacyFallback(slot.key);
      if (!target) continue;
      const first = seen.get(target);
      if (first) clashes.push(first + " and " + slot.key + " both resolve " + target);
      else seen.set(target, slot.key);
    }
    expect(clashes).toEqual([]);
  });

  it("resolves a fallback for every slot that paints an image", () => {
    // A slot with no fallback renders a broken image until somebody uploads,
    // which is worse than the picture it replaced.
    //
    // `optional` is the declared exception and it is narrow: the finish
    // swatches paint as CSS backgrounds behind a named tile, so an empty one
    // shows the name on a neutral ground rather than a broken picture. There
    // is also nothing honest to fall back TO — no stock photograph of the
    // shade "Odyssey" exists, and pointing at an unrelated product shot
    // would misstate the colour a buyer is choosing.
    const orphans = SITE_IMAGES.filter(
      (s) => !s.optional && legacyFallback(s.key) === null,
    );
    expect(orphans.map((s) => s.key)).toEqual([]);
  });

  it("gives every offered finish an upload slot, under both stems", async () => {
    // The configurator asks for /media/site/<kind>-<slug>.webp; if the
    // registry does not carry that exact key the panel offers no way to fill
    // it and the swatch can never appear. Both sides derive the key from
    // catalog/finish-image.ts, and this proves they meet.
    const { SHELL_FINISHES, CABINET_FINISHES } = await import("../catalog/pola");
    const { finishImageKey } = await import("../catalog/finish-image");
    const keys = new Set(SITE_IMAGES.map((s) => s.key));
    const missing: string[] = [];
    for (const n of SHELL_FINISHES) {
      if (!keys.has(finishImageKey("barva", n))) missing.push("barva:" + n);
    }
    for (const n of CABINET_FINISHES) {
      if (!keys.has(finishImageKey("obloga", n))) missing.push("obloga:" + n);
    }
    expect(missing).toEqual([]);
  });

  it("folds a diacritic into the stored key rather than into the URL", async () => {
    // "Črna" must not become a key with a non-ASCII character in it: the
    // bucket, the panel route and the storefront URL all carry this string.
    const { finishImageKey, finishSlug } = await import("../catalog/finish-image");
    expect(finishSlug("Črna")).toBe("crna");
    expect(finishSlug("Silver white marble")).toBe("silver-white-marble");
    expect(finishImageKey("obloga", "Zlato rjava")).toBe("site/obloga-zlato-rjava.webp");
    for (const s of SITE_IMAGES) {
      expect(s.key, s.key + " is not URL-safe").toMatch(/^site\/[a-z0-9][a-z0-9/_-]*\.webp$/);
    }
  });

  it("addresses every slot by a unique URL stem", () => {
    // The panel routes on the stem — /admin/site/hero — so two slots sharing
    // one would make the second unreachable and let an upload land on the
    // wrong picture.
    const stems = SITE_IMAGES.map((s) => stemOf(s.key));
    expect(new Set(stems).size).toBe(stems.length);
    for (const stem of stems) expect(siteImageBySlug(stem)).toBeDefined();
  });

  it("never crops a frame that shows the picture whole", () => {
    // A ratio means "cut this to shape". The frames that are object-fit:
    // contain must not carry one — cropping for them throws away content the
    // page would have displayed. Measured off the rendered page; these are the
    // ones that came back contain.
    const contain = [
      "site/zgodba-detajl.webp",
      // All FIVE benefit cards, since the row was made uniform: the tile
      // paints object-fit: contain because this shop's photography is studio
      // cutouts on a white sweep, and cover would crop a centred product
      // against its own empty background.
      "site/zakaj-mi.webp",
      ...Array.from({ length: 4 }, (_, i) => "site/zakaj-mi-" + String(i + 2) + ".webp"),
      ...Array.from({ length: 6 }, (_, i) => "site/galerija-" + String(i + 1) + ".webp"),
    ];
    for (const key of contain) {
      const slot = SITE_IMAGES.find((s) => s.key === key);
      expect(slot, key + " should exist").toBeDefined();
      expect(slot!.ratio, key + " must not crop").toBeUndefined();
    }
  });

  it("gives every slot a group, a label and a size cap", () => {
    for (const slot of SITE_IMAGES) {
      expect(slot.group, slot.key).toBeTruthy();
      expect(slot.label, slot.key).toBeTruthy();
      expect(slot.note.length, slot.key).toBeGreaterThan(20);
      expect(slot.maxWidth, slot.key).toBeGreaterThan(0);
    }
  });
});

/**
 * ⚠️ `exact` WITHOUT `ratio` IS A HALF-DECLARED CONTRACT. It fixes the
 * stored WIDTH at maxWidth; the height then comes from the frame's shape,
 * and with no shape declared there is nothing to compute it from — the
 * panel would fall back to the source's own proportions and store sixteen
 * squares of sixteen different heights, which is the exact defect the flag
 * exists to prevent.
 */
describe("slots that declare an exact stored size", () => {
  const exact = SITE_IMAGES.filter((s) => s.exact);

  it("always declare the shape that gives them their second dimension", () => {
    for (const s of exact) expect(s.ratio, s.key).toBeDefined();
  });

  it("covers every finish swatch and nothing else", () => {
    // The swatches are the only slots painted as a ROW of identical tiles.
    // If another slot ever wants this, it is a deliberate decision that
    // should show up here as a failing test first.
    expect(exact.map((s) => s.key).every((k) => /^site\/(barva|obloga)-/.test(k))).toBe(true);
    const swatches = SITE_IMAGES.filter((s) => /^site\/(barva|obloga)-/.test(s.key));
    expect(exact).toHaveLength(swatches.length);
  });

  it("stores a square small enough that sixteen of them are not a page weight", () => {
    for (const s of exact) {
      expect(s.ratio, s.key).toEqual([1, 1]);
      expect(s.maxWidth, s.key).toBeLessThanOrEqual(600);
    }
  });
});

/**
 * ⚠️ AN UNFILLED OPTIONAL SLOT MUST NOT 404, AND THIS IS WHY.
 *
 * The sixteen finish swatches are painted as CSS backgrounds, so a colour
 * nobody has photographed shows the tile's own ground and its name — quiet
 * on screen, and for a while extremely loud everywhere else. Every product
 * page requests all sixteen; each answered 404; and the 404 carried
 * `no-store`, so the absence was never cached and all sixteen repeated on
 * every view for every visitor. It surfaced as sixteen red lines in the
 * console on a page nobody had touched.
 *
 * The contract now: an optional slot with nothing behind it answers 200 with
 * a transparent pixel the browser can cache. These assertions hold the two
 * halves of that together — the flag on the registry, and the fact that
 * nothing else acquires it by accident.
 */
describe("slots that may legitimately be empty", () => {
  const optional = SITE_IMAGES.filter((s) => s.optional);

  it("are exactly the finish swatches", () => {
    // If another slot ever wants this, it is a deliberate decision that
    // should show up here as a failing test first: everything else renders
    // an <img>, where an empty slot is a broken picture on a live page and
    // a 404 is the right, visible answer.
    expect(optional.every((s) => /^site\/(barva|obloga)-/.test(s.key))).toBe(true);
    const swatches = SITE_IMAGES.filter((s) => /^site\/(barva|obloga)-/.test(s.key));
    expect(optional).toHaveLength(swatches.length);
    expect(optional.length).toBeGreaterThan(0);
  });

  it("declare no legacy fallback, because there is nothing to fall back to", () => {
    // No stock photograph of "Odyssey" exists, and pointing one of these at
    // an unrelated product shot would be a false statement about the colour
    // a buyer is choosing.
    for (const s of optional) {
      expect(s.legacy, s.key).toBeUndefined();
      expect(s.fallbackOffset, s.key).toBeUndefined();
    }
  });
});
