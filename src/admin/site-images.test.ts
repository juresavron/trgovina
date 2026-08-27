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

  it("resolves a fallback for every slot", () => {
    // A slot with no fallback renders a broken image until somebody uploads,
    // which is worse than the picture it replaced.
    const orphans = SITE_IMAGES.filter((s) => legacyFallback(s.key) === null);
    expect(orphans.map((s) => s.key)).toEqual([]);
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
      "site/zakaj-mi-2.webp",
      "site/zakaj-mi-3.webp",
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
