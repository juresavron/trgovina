import { describe, expect, it } from "vitest";
import { nameFromFilename } from "./finishes";
import { finishSlug } from "../catalog/finish-image";
import { SHELL_FINISHES, CABINET_FINISHES } from "../catalog/pola";
import {
  GENERATED_CABINET_FINISHES,
  GENERATED_SHELL_FINISHES,
} from "../catalog/finishes.generated";

/**
 * THE COLOUR'S NAME COMES OFF THE FILE, so the rule that reads a filename is
 * the whole feature and every one of its decisions is a decision about what
 * the shop's product pages will say.
 */
describe("the name a swatch file carries", () => {
  it("is the basename, with the folder and the extension gone", () => {
    expect(nameFromFilename("Oyster Opal.jpg")).toBe("Oyster Opal");
    expect(nameFromFilename("/Users/ana/Vzorci/Canyon.PNG")).toBe("Canyon");
    expect(nameFromFilename("C:\\vzorci\\Sunset.webp")).toBe("Sunset");
  });

  /**
   * ⚠️ CASE IS LEFT EXACTLY AS TYPED, and it is tempting not to.
   *
   * Title Case looks tidier and would be wrong: the manufacturer's chart
   * prints "Silver white marble" and "Oyster Opal" — one of each — and a
   * purchase order quotes what the chart says. Whoever named the file was
   * reading the chart; this code was not.
   */
  it("does not tidy the capitalisation", () => {
    expect(nameFromFilename("Silver white marble.jpg")).toBe("Silver white marble");
    expect(nameFromFilename("OYSTER OPAL.jpg")).toBe("OYSTER OPAL");
    expect(nameFromFilename("ocean wave.jpg")).toBe("ocean wave");
  });

  it("drops what a download folder adds", () => {
    expect(nameFromFilename("Canyon (1).jpg")).toBe("Canyon");
    expect(nameFromFilename("Canyon (12).jpg")).toBe("Canyon");
    expect(nameFromFilename("Canyon copy.jpg")).toBe("Canyon");
    expect(nameFromFilename("Canyon-kopija.png")).toBe("Canyon");
  });

  it("reads an underscore as the space somebody meant", () => {
    expect(nameFromFilename("ocean_wave.jpg")).toBe("ocean wave");
    expect(nameFromFilename("silver__white___marble.jpg")).toBe("silver white marble");
    expect(nameFromFilename("  Sunset   .jpg  ".trim())).toBe("Sunset");
  });

  /**
   * A file that names no colour must produce NO colour. The route reports it
   * back and asks for a rename; storing a row whose slug is empty would put a
   * tile on six product pages that no bucket key can ever fill.
   */
  it("yields nothing for a name that folds to nothing", () => {
    for (const f of ["###.jpg", "---.png", ".webp", "   .jpg"]) {
      const n = nameFromFilename(f);
      expect(n === "" || finishSlug(n) === "", f).toBe(true);
    }
  });

  /** Every real chart name survives a round trip through the file. */
  it("recovers the manufacturer's own names from files named after them", () => {
    for (const name of ["Midnight", "Canyon", "Silver white marble", "Oyster Opal", "Ocean Wave"]) {
      expect(nameFromFilename(name + ".jpg")).toBe(name);
      expect(finishSlug(nameFromFilename(name + ".jpg"))).toBe(finishSlug(name));
    }
  });

  it("folds the diacritics a cabinet colour is written with", () => {
    expect(nameFromFilename("Črna.jpg")).toBe("Črna");
    expect(finishSlug(nameFromFilename("Črna.jpg"))).toBe("crna");
    expect(finishSlug(nameFromFilename("Zlato rjava.png"))).toBe("zlato-rjava");
  });
});

/**
 * ⚠️ ALL OR NOTHING, PER KIND. Merging the uploaded set with the transcribed
 * chart would put colours the shop can show beside colours it cannot, in one
 * row, with nothing on the page telling them apart. So a kind with any
 * uploads renders exactly those, and a kind with none renders the
 * transcription — which is what the site rendered before this existed.
 */
describe("which colour list the product pages render", () => {
  it("falls back to the transcribed chart while nothing is uploaded", () => {
    if (GENERATED_SHELL_FINISHES.length === 0) {
      expect(SHELL_FINISHES.length).toBeGreaterThan(0);
      expect(SHELL_FINISHES).toContain("Midnight");
    }
    if (GENERATED_CABINET_FINISHES.length === 0) {
      expect(CABINET_FINISHES).toContain("Črna");
    }
  });

  it("renders exactly the uploaded set once there is one", () => {
    if (GENERATED_SHELL_FINISHES.length > 0) {
      expect([...SHELL_FINISHES]).toEqual(GENERATED_SHELL_FINISHES.map((f) => f.name));
    }
    if (GENERATED_CABINET_FINISHES.length > 0) {
      expect([...CABINET_FINISHES]).toEqual(GENERATED_CABINET_FINISHES.map((f) => f.name));
    }
  });

  /** A generated entry's slug must be the slug its own name folds to, or the
   *  storefront asks for a bucket key the panel never wrote. */
  it("keeps every generated slug consistent with its name", () => {
    for (const f of [...GENERATED_SHELL_FINISHES, ...GENERATED_CABINET_FINISHES]) {
      expect(f.slug, f.name).toBe(finishSlug(f.name));
    }
  });
});
