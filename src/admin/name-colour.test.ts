import { describe, expect, it } from "vitest";
import {
  looksLikeColourName,
  tidyColourName,
  uniqueColourName,
  NAME_MAX,
} from "./name-colour";

/**
 * ⚠️ THE FILENAME DECIDES WHETHER A MODEL IS ASKED AT ALL, so this predicate
 * is the difference between keeping the manufacturer's own name and throwing
 * it away for a description.
 */
describe("whether a filename already carries a colour name", () => {
  /**
   * ⚠️ TESTED AS A JUNK DETECTOR, NOT A COLOUR DETECTOR. A whitelist of
   * colour words would reject exactly the names worth keeping: Odyssey,
   * Canyon and Gypsum are not colours in any dictionary, they are the
   * manufacturer's trade names, and they are what an order quotes.
   */
  it("keeps a name somebody typed, including a trade name that is not a colour", () => {
    for (const n of [
      "Oyster Opal", "Silver white marble", "Midnight", "Canyon", "Gypsum",
      "Odyssey", "Ocean Wave", "Črna", "Svetlo siva", "Zlato rjava",
    ]) {
      expect(looksLikeColourName(n), n).toBe(true);
    }
  });

  /** The six that actually landed, plus what every other device produces. */
  it("rejects what a camera, a phone or a screenshot tool produced", () => {
    for (const n of [
      "Screenshot 2026-08-28 at 10.20.46",
      "Screen Shot 2026-08-28 at 10.21.08",
      "IMG_4821", "DSC00123", "P1010023", "20260828_102046", "1724851200",
      "image", "Photo 3", "untitled", "Pasted image", "WhatsApp Image 2026",
      "Posnetek zaslona", "scan001",
    ]) {
      expect(looksLikeColourName(n), n).toBe(false);
    }
  });

  it("rejects a name too short or too long to be one", () => {
    expect(looksLikeColourName("")).toBe(false);
    expect(looksLikeColourName("a")).toBe(false);
    expect(looksLikeColourName("x".repeat(NAME_MAX + 1))).toBe(false);
  });
});

describe("tidying what the model answered", () => {
  it("strips the wrapping a model adds when told not to", () => {
    expect(tidyColourName('"Temno siva"')).toBe("Temno siva");
    expect(tidyColourName("Ime barve: peščeno bež")).toBe("Peščeno bež");
    expect(tidyColourName("  sivo marmorirana.  ")).toBe("Sivo marmorirana");
    expect(tidyColourName("„Bela“")).toBe("Bela");
  });

  /** Sentence case, because the chart prints "Silver white marble". */
  it("capitalises the first letter and nothing else", () => {
    expect(tidyColourName("temno siva")).toBe("Temno siva");
    expect(tidyColourName("bela z bež žilami")).toBe("Bela z bež žilami");
  });

  /** A model that answered with a sentence is not answering this question. */
  it("refuses an answer that is prose", () => {
    expect(tidyColourName("Na sliki je vzorec akrilne školjke v temno sivi barvi")).toBe("");
  });

  it("never returns something too long to be a name", () => {
    expect(tidyColourName("a".repeat(200)).length).toBeLessThanOrEqual(NAME_MAX);
  });
});

/**
 * ⚠️ A COLLISION LOSES A SWATCH, SILENTLY. Two greys in one drop both
 * described as "Temno siva" fold to the same slug, and the second upload
 * overwrites the first — the operator dropped six files and got five colours,
 * with nothing to say which one went missing.
 */
describe("keeping names unique inside one drop", () => {
  it("passes a name through when nothing has claimed it", () => {
    expect(uniqueColourName("Temno siva", new Set())).toBe("Temno siva");
  });

  it("numbers a repeat rather than letting it overwrite", () => {
    const taken = new Set(["temno siva"]);
    expect(uniqueColourName("Temno siva", taken)).toBe("Temno siva 2");
    taken.add("temno siva 2");
    expect(uniqueColourName("Temno siva", taken)).toBe("Temno siva 3");
  });

  /** Case is not identity here: the slug folds it away anyway. */
  it("treats a differently-cased repeat as the same name", () => {
    expect(uniqueColourName("TEMNO SIVA", new Set(["temno siva"]))).toBe("TEMNO SIVA 2");
  });
});
