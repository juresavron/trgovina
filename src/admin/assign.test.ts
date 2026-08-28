import { describe, expect, it } from "vitest";
import {
  assignSlots,
  finishOptions,
  finishPrompt,
  matchFilename,
  parseClassified,
  slotOptions,
  type Classified,
} from "./assign";
import { CABINET_FINISHES, SHELL_FINISHES } from "../catalog/pola";
import { finishSlug } from "../catalog/finish-image";
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

/* ================= THE COLOUR SORTER ================= */
describe("matching a swatch by its filename", () => {
  const shell = finishOptions("barva", SHELL_FINISHES);
  const cabinet = finishOptions("obloga", CABINET_FINISHES);

  it("offers one option per finish, each addressable by its slug", () => {
    expect(shell).toHaveLength(SHELL_FINISHES.length);
    expect(cabinet).toHaveLength(CABINET_FINISHES.length);
    for (const o of shell) {
      expect(o.slots).toHaveLength(1);
      expect(o.match?.[0]).toBe(finishSlug(o.label));
    }
  });

  it("matches the plain supplier filename, however it is written", () => {
    for (const name of SHELL_FINISHES) {
      const stem = "barva-" + finishSlug(name);
      expect(matchFilename(name + ".jpg", shell)).toBe(stem);
      expect(matchFilename(name.toUpperCase() + ".PNG", shell)).toBe(stem);
      expect(matchFilename(finishSlug(name) + ".webp", shell)).toBe(stem);
      expect(matchFilename("/Users/ana/Vzorci/" + name + " (1).jpeg", shell)).toBe(stem);
    }
  });

  /**
   * ⚠️ THE BUG A SHORTEST-FIRST MATCHER WOULD SHIP. "Opal" is contained in
   * "Oyster Opal", and "Siva" in both "Temno siva" and "Svetlo siva" — so a
   * naive substring match files three of the sixteen colours wrong, in a
   * batch the operator dropped precisely because they trusted it to sort
   * itself. Longest match wins.
   */
  it("prefers the longer name when one colour's name contains another's", () => {
    expect(matchFilename("Oyster Opal.jpg", shell)).toBe("barva-oyster-opal");
    expect(matchFilename("oyster-opal-2.webp", shell)).toBe("barva-oyster-opal");
    expect(matchFilename("Opal.jpg", shell)).toBe("barva-opal");
    expect(matchFilename("Temno siva.jpg", cabinet)).toBe("obloga-temno-siva");
    expect(matchFilename("Svetlo siva.png", cabinet)).toBe("obloga-svetlo-siva");
    expect(matchFilename("siva.png", cabinet)).toBe("obloga-siva");
  });

  it("folds the diacritics the cabinet list is written in", () => {
    expect(matchFilename("Črna.jpg", cabinet)).toBe("obloga-crna");
    expect(matchFilename("crna.jpg", cabinet)).toBe("obloga-crna");
    expect(matchFilename("Zlato rjava.jpg", cabinet)).toBe("obloga-zlato-rjava");
  });

  it("matches only whole words, so a longer word is not a colour", () => {
    // "opalescent" contains "opal" as text and names no colour on the list.
    expect(matchFilename("opalescent-sheet.jpg", shell)).toBeNull();
    expect(matchFilename("IMG_4821.jpg", shell)).toBeNull();
    expect(matchFilename("", shell)).toBeNull();
    expect(matchFilename("vzorec.png", shell)).toBeNull();
  });

  /** Two colours of equal specificity in one name is a question, not a match. */
  it("refuses a filename that names two colours equally", () => {
    expect(matchFilename("opal-canyon.jpg", shell)).toBeNull();
    expect(matchFilename("siva-rjava.jpg", cabinet)).toBeNull();
  });

  it("never proposes a slot the site does not actually store", () => {
    const keys = new Set(SITE_IMAGES.map((s) => s.key));
    for (const o of [...shell, ...cabinet]) {
      for (const slot of o.slots) expect(keys.has(slot.key)).toBe(true);
    }
  });

  /**
   * The colour prompt must not smuggle in a description of a colour nobody
   * here has seen — catalog/pola.ts is explicit that this repository does not
   * know what "Canyon" looks like, which is why it refuses to draw a swatch
   * for it. The prompt may carry the NAMES and must say it is guessing.
   */
  it("asks the model to match a name without telling it what the colour is", () => {
    const p = finishPrompt("barva", shell);
    for (const name of SHELL_FINISHES) expect(p).toContain(name);
    expect(p).toContain("nizka");
    expect(p).toMatch(/NE UGIBAJ|ne ugibaj/);
    // No invented colour vocabulary attached to a trade name.
    expect(p).not.toMatch(/Canyon (je|:)/i);
  });

  /** Capacity is one: two pictures may not both become the same colour. */
  it("gives a colour to one picture only", () => {
    const both = assignSlots(
      [
        // Both say Canyon; the confident one gets it and the other falls to
        // its own second choice rather than being dropped in silence.
        { option: "barva-canyon", alternate: null, confidence: "visoka", reason: "a" },
        { option: "barva-canyon", alternate: "barva-opal", confidence: "srednja", reason: "b" },
      ],
      shell,
    );
    expect(both[0]!.slot?.key).toBe("site/barva-canyon.webp");
    expect(both[1]!.slot?.key).toBe("site/barva-opal.webp");
    const third = assignSlots(
      [
        { option: "barva-canyon", alternate: null, confidence: "visoka", reason: "a" },
        { option: "barva-canyon", alternate: null, confidence: "nizka", reason: "b" },
      ],
      shell,
    );
    expect(third[1]!.slot).toBeNull();
    expect(third[1]!.reason).not.toBe("");
  });
});
