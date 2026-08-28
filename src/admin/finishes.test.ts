import { describe, expect, it } from "vitest";
import { nameFromFilename } from "./finishes";
import { finishImageKey, finishSlug } from "../catalog/finish-image";
import {
  CABINET_FINISHES,
  CABINET_FINISH_ENTRIES,
  finishSlugOf,
  SHELL_FINISHES,
  SHELL_FINISH_ENTRIES,
  TRANSCRIBED_CABINET_FINISHES,
  TRANSCRIBED_SHELL_FINISHES,
} from "../catalog/pola";
import { finishCount, finishListPage } from "./finishes-panel";
import { siteImageBySlug } from "./site-images";
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

/**
 * ⚠️ THE PANEL MUST LIST WHAT THE SITE IS SHOWING, NOT WHAT THE TABLE HOLDS.
 *
 * This is a regression test for a real report — "i cannot edit colors". The
 * page listed only uploaded colours, so on a shop that had uploaded none it
 * said "0 barv" and showed an empty list, while every product page was at
 * that same moment rendering ten shell colours and six cabinet ones from the
 * transcription. An operator who came to edit the colours they could see on
 * their own site found nothing. A missing feature is survivable; a panel that
 * denies the existence of what is live is not.
 */
describe("the colour page, on a shop that has uploaded nothing", () => {
  const page = finishListPage([], "ana@example.com", undefined, {
    shell: TRANSCRIBED_SHELL_FINISHES,
    cabinet: TRANSCRIBED_CABINET_FINISHES,
    shellPhotographed: false,
    cabinetPhotographed: false,
  });

  it("names every colour the product pages are rendering", () => {
    for (const n of [...TRANSCRIBED_SHELL_FINISHES, ...TRANSCRIBED_CABINET_FINISHES]) {
      expect(page, n).toContain(">" + n + "<");
    }
  });

  it("never claims the shop shows none", () => {
    // Anchored, because finishCount(10) is "10 barv" and a bare "0 barv"
    // substring matches it.
    expect(page).not.toMatch(/(^|[^0-9])0 barv/);
    const total =
      TRANSCRIBED_SHELL_FINISHES.length + TRANSCRIBED_CABINET_FINISHES.length;
    expect(page).toContain(finishCount(total) + " skupaj");
  });

  /**
   * ⚠️ THE DROP ZONE IS THE ONLY WAY IN, so its absence is not a cosmetic
   * regression — it is a page that shows a list and offers no way to change
   * it. There is deliberately no "add a colour" form: a name typed without a
   * photograph behind it is a tile the shop cannot show.
   */
  it("offers a bulk drop zone for each kind, and the script that drives it", () => {
    for (const prefix of ["bv", "ob"]) {
      expect(page, prefix).toContain('id="' + prefix + '-drop"');
      expect(page, prefix).toContain('id="' + prefix + '-f" type="file" multiple');
      expect(page, prefix).toContain('mount("' + prefix + '"');
    }
    expect(page).not.toContain('name="new-finish"');
  });

  /** The zone posts to the colour catalogue, not the site one. */
  it("sorts a dropped file against the colour scope it was dropped on", () => {
    expect(page).toContain('mount("bv", "barva")');
    expect(page).toContain('mount("ob", "obloga")');
  });

  /**
   * ⚠️ THE UPSCALE BOX IS ONLY OFFERED WHERE IT CAN RUN.
   *
   * mount() reads <prefix>-ai and skips the redraw when it is absent, so a
   * box rendered without GEMINI_API_KEY set would be a control that promises
   * a step and silently does not take it — the operator ticks it, the sample
   * uploads unchanged, and nothing anywhere says why.
   */
  it("offers the upscale only when the model is reachable", () => {
    for (const prefix of ["bv", "ob"]) {
      expect(page, prefix).not.toContain('id="' + prefix + '-ai"');
    }
    const withAi = finishListPage([], "ana@example.com", undefined, {
      shell: TRANSCRIBED_SHELL_FINISHES,
      cabinet: TRANSCRIBED_CABINET_FINISHES,
      shellPhotographed: false,
      cabinetPhotographed: false,
    }, true);
    for (const prefix of ["bv", "ob"]) {
      expect(withAi, prefix).toContain('id="' + prefix + '-ai"');
    }
    // And it says what the redraw actually does, rather than "izboljšaj".
    expect(withAi).toContain("PONOVNO NARIŠE");
    // And that the framing is NOT the model's doing, so an operator who
    // unticks the box does not think their tiles will go crooked again.
    expect(withAi).toContain("brez modela");
  });
});

/**
 * ⚠️ A RENAME MUST NOT MOVE THE PICTURE, and for one deploy it did — in the
 * only direction that leaves no trace.
 *
 * The owner pressed "Poimenuj z AI" and six swatches went blank. renameFinish
 * changes the NAME and deliberately not the slug, so the file stays where it
 * was written; but every reader — the admin card, the product page, the upload
 * registry — rebuilt the key by folding the NAME again. After a rename the
 * page asked for site/barva-rjavo-marmorirana.webp while the file sat at
 * site/barva-screenshot-2026-08-28-at-10-20-46.webp.
 *
 * Nothing errored. A swatch is painted as a CSS background, so a missing file
 * is a tile with no colour in it and no broken-image icon, and /media answers
 * an optional slot with a transparent pixel and a 200. Silent by three
 * separate mechanisms.
 */
describe("a colour's stored key survives being renamed", () => {
  it("keys off the slug the row carries, never off its current name", () => {
    // A row as it exists after a rename: the name is Slovenian, the slug is
    // still the screenshot filename it was uploaded under.
    const renamed = { kind: "barva" as const, slug: "screenshot-2026-08-28-at-10-20-46" };
    expect(finishImageKey(renamed.kind, renamed.slug)).toBe(
      "site/barva-screenshot-2026-08-28-at-10-20-46.webp",
    );
    // The name it now carries must NOT be what the key is built from.
    expect(finishImageKey(renamed.kind, finishSlug("Rjavo marmorirana"))).not.toBe(
      finishImageKey(renamed.kind, renamed.slug),
    );
  });

  /**
   * ⚠️ THE DECISIVE ONE: the card the owner was looking at.
   *
   * finishImageKey() folding a string that is already a slug is a no-op, so
   * asserting on it alone would have passed before the fix too. What actually
   * broke is that the CARD passed f.name. This renders one and looks at the
   * URL it painted.
   */
  it("paints the admin card from the row's slug, not from its new name", () => {
    const page = finishListPage(
      [
        {
          id: "1",
          kind: "barva",
          name: "Rjavo marmorirana",
          slug: "screenshot-2026-08-28-at-10-20-46",
          position: 0,
        },
      ],
      "ana@example.com",
    );
    expect(page).toContain("/media/site/barva-screenshot-2026-08-28-at-10-20-46.webp");
    expect(page).not.toContain("/media/site/barva-rjavo-marmorirana.webp");
    // The name is still what the operator reads and edits.
    expect(page).toContain('value="Rjavo marmorirana"');
  });

  /** The storefront reaches the key through the entry list, by name. */
  it("looks a live colour's slug up rather than folding its name", () => {
    for (const [kind, list] of [
      ["barva", SHELL_FINISH_ENTRIES],
      ["obloga", CABINET_FINISH_ENTRIES],
    ] as const) {
      for (const f of list) {
        expect(finishSlugOf(kind, f.name), f.name).toBe(f.slug);
      }
    }
  });

  /** A name the live list has never heard of still resolves to something. */
  it("falls back to folding the name for a colour not in the list", () => {
    expect(finishSlugOf("barva", "Nekaj Čisto Drugega")).toBe("nekaj-cisto-drugega");
  });
});
