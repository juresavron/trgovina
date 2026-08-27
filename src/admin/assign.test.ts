import { describe, expect, it } from "vitest";
import {
  assignSlots,
  parseClassified,
  slotOptions,
  type Classified,
} from "./assign";
import { SITE_IMAGES, stemOf } from "./site-images";

/**
 * The smart uploader's decision half. The model's answers are mocked —
 * network never enters here — because THIS half is where a wrong answer
 * costs something: a misclassified image is the model's error, two images
 * stored under one key would be ours.
 */
describe("the slot catalogue as the classifier sees it", () => {
  it("collapses the six gallery tiles into one option, and only those", () => {
    const opts = slotOptions();
    const gallery = opts.find((o) => o.id === "galerija")!;
    expect(gallery.slots.length).toBe(6);
    // Every non-gallery slot is its own option, so the option list plus the
    // bucket accounts for the whole catalogue — a slot that fell out of this
    // arithmetic would be a slot no photograph can ever reach.
    expect(opts.reduce((n, o) => n + o.slots.length, 0)).toBe(SITE_IMAGES.length);
    // Ids are stems, and stems are what the upload route resolves.
    for (const o of opts) {
      if (o.id === "galerija") continue;
      expect(o.slots.length).toBe(1);
      expect(stemOf(o.slots[0]!.key)).toBe(o.id);
    }
  });
});

const C = (
  option: string | null,
  confidence: Classified["confidence"] = "visoka",
  alternate: string | null = null,
): Classified => ({ option, alternate, confidence, reason: "r" });

describe("assigning a batch", () => {
  const opts = slotOptions();

  it("gives a confident answer its slot over an earlier hesitant one", () => {
    // Drop order says the weak claim came first; confidence outranks it.
    const out = assignSlots([C("hero", "nizka"), C("hero", "visoka")], opts);
    expect(out[1]!.slot && stemOf(out[1]!.slot.key)).toBe("hero");
    // The loser falls to nothing and SAYS so.
    expect(out[0]!.slot).toBeNull();
    expect(out[0]!.reason).toContain("zasedla");
  });

  it("falls to the alternate when the first choice is taken", () => {
    const out = assignSlots(
      [C("hero", "visoka"), C("hero", "srednja", "zgodba")],
      opts,
    );
    expect(out[0]!.slot && stemOf(out[0]!.slot.key)).toBe("hero");
    expect(out[1]!.slot && stemOf(out[1]!.slot.key)).toBe("zgodba");
  });

  it("fills the gallery bucket to capacity and no further", () => {
    const seven = Array.from({ length: 7 }, () => C("galerija"));
    const out = assignSlots(seven, opts);
    const placed = out.filter((a) => a.slot !== null);
    expect(placed.length).toBe(6);
    // Six DIFFERENT tiles — capacity is per slot behind the bucket, not a
    // counter that lets two photographs share galerija-1.
    const keys = new Set(placed.map((a) => a.slot!.key));
    expect(keys.size).toBe(6);
    expect(out.filter((a) => a.slot === null).length).toBe(1);
  });

  it("leaves an unclassifiable picture unassigned, with the reason said", () => {
    const out = assignSlots([C(null), null], opts);
    expect(out[0]!.slot).toBeNull();
    expect(out[1]!.slot).toBeNull();
    expect(out[1]!.reason).toContain("ročno");
  });
});

describe("parsing what the model returned", () => {
  const ids = ["hero", "zgodba", "galerija", "nobena"];

  it("reads a well-formed answer", () => {
    const c = parseClassified(
      '{"slot":"hero","alternate":"zgodba","confidence":"visoka","reason":"Bazen v vrtu."}',
      ids,
    )!;
    expect(c.option).toBe("hero");
    expect(c.alternate).toBe("zgodba");
  });

  it("reads 'nobena' as no slot rather than as a storage key", () => {
    const c = parseClassified('{"slot":"nobena","confidence":"visoka","reason":"Dokument."}', ids)!;
    expect(c.option).toBeNull();
  });

  it("refuses an id outside the enum — it must never become a key", () => {
    expect(parseClassified('{"slot":"../etc","confidence":"visoka","reason":"x"}', ids)).toBeNull();
  });

  it("survives a fenced answer and strips the fence", () => {
    const c = parseClassified('```json\n{"slot":"hero","confidence":"nizka","reason":"x"}\n```', ids)!;
    expect(c.option).toBe("hero");
  });
});
