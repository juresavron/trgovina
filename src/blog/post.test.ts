import { describe, expect, it } from "vitest";
import { dateText, excerptFrom, isInternalPath, parseSource, readMinutes } from "./post";

describe("parseSource", () => {
  it("turns blank-line-separated text into one prose block", () => {
    const blocks = parseSource("Prvi odstavek.\n\nDrugi odstavek.");
    expect(blocks).toEqual([{ kind: "prose", p: ["Prvi odstavek.", "Drugi odstavek."] }]);
  });

  it("joins wrapped lines into one paragraph", () => {
    // A writer who hits return at the edge of the textarea has not started a
    // new paragraph, and rendering one <p> per visual line is how a post ends
    // up as a column of orphans.
    const blocks = parseSource("Ena vrstica\nse nadaljuje.\n\nDruga.");
    expect(blocks).toEqual([{ kind: "prose", p: ["Ena vrstica se nadaljuje.", "Druga."] }]);
  });

  it("attaches a heading to the block that follows it", () => {
    const blocks = parseSource("## Naslov\n\nBesedilo.");
    expect(blocks).toEqual([{ kind: "prose", h: "Naslov", p: ["Besedilo."] }]);
  });

  it("keeps the heading when the next block is a list, not prose", () => {
    // The mode switch flushes an empty prose block on its way to the list, and
    // an earlier draft let the heading go with it.
    const blocks = parseSource("## Kaj potrebujete\n- Podlaga\n- Priklop");
    expect(blocks).toEqual([
      { kind: "list", h: "Kaj potrebujete", items: ["Podlaga", "Priklop"] },
    ]);
  });

  it("keeps a heading that has nothing under it", () => {
    const blocks = parseSource("## Sam\n\n## Drugi\n\nBesedilo.");
    expect(blocks).toEqual([
      { kind: "prose", h: "Sam", p: [] },
      { kind: "prose", h: "Drugi", p: ["Besedilo."] },
    ]);
  });

  it("groups consecutive question and answer pairs into one block", () => {
    const blocks = parseSource("V: Koliko porabi?\nO: Odvisno od pokrova.\nV: In pozimi?\nO: Vec.");
    expect(blocks).toEqual([
      {
        kind: "qa",
        items: [
          ["Koliko porabi?", "Odvisno od pokrova."],
          ["In pozimi?", "Vec."],
        ],
      },
    ]);
  });

  it("drops a question nobody answered", () => {
    // An empty answer would go into the FAQ structured data, which is a
    // violation rather than an ugly page.
    expect(parseSource("V: Brez odgovora")).toEqual([]);
  });

  it("does not read a sentence starting with V as a question", () => {
    const blocks = parseSource("V soboto dostavimo bazen.");
    expect(blocks).toEqual([{ kind: "prose", p: ["V soboto dostavimo bazen."] }]);
  });

  it("switches between all three shapes in one document", () => {
    const blocks = parseSource(
      "Uvod.\n\n## Koraki\n- Prvi\n- Drugi\n\n## Vprasanja\nV: Kdaj?\nO: Takoj.",
    );
    expect(blocks.map((b) => b.kind)).toEqual(["prose", "list", "qa"]);
  });

  it("groups consecutive link lines into one row", () => {
    const blocks = parseSource("-> /masazni-bazeni Masažni bazeni\n-> /swim-spa Swim spa");
    expect(blocks).toEqual([
      {
        kind: "links",
        items: [
          ["Masažni bazeni", "/masazni-bazeni"],
          ["Swim spa", "/swim-spa"],
        ],
      },
    ]);
  });

  it("puts a heading on the link row", () => {
    const blocks = parseSource("## Oglejte si\n-> /trgovina Vsi modeli");
    expect(blocks).toEqual([
      { kind: "links", h: "Oglejte si", items: [["Vsi modeli", "/trgovina"]] },
    ]);
  });

  it("REFUSES ANY TARGET THAT IS NOT AN INTERNAL PATH", () => {
    // This is the only place a post reaches the href of an anchor, so it is
    // the only place a taken admin account could publish an outbound link
    // from the shop's domain — or a javascript: URL into a page a customer
    // trusts. A refused line stays visible as the prose it looks like, so the
    // writer sees their own text rather than losing it silently.
    for (const bad of [
      "-> https://evil.example Klik",
      "-> //evil.example Klik",
      "-> javascript:alert(1) Klik",
      "-> /../etc/passwd Klik",
      "-> mailto:a@b.si Klik",
    ]) {
      const blocks = parseSource(bad);
      expect(blocks.every((b) => b.kind !== "links")).toBe(true);
      expect(blocks[0]!.kind).toBe("prose");
    }
  });

  it("does not read a bullet as a link", () => {
    expect(parseSource("- navadna alineja")).toEqual([
      { kind: "list", items: ["navadna alineja"] },
    ]);
  });

  it("returns nothing for an empty body", () => {
    expect(parseSource("")).toEqual([]);
    expect(parseSource("   \n\n  ")).toEqual([]);
  });
});

describe("isInternalPath", () => {
  it("accepts this shop's own paths", () => {
    for (const ok of ["/", "/trgovina", "/bazen/veliki-230", "/masazni-bazeni"]) {
      expect(isInternalPath(ok)).toBe(true);
    }
  });

  it("refuses a scheme, a host, and a traversal", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example",
      "javascript:alert(1)",
      "/../secret",
      "trgovina",
      "/Trgovina",
    ]) {
      expect(isInternalPath(bad)).toBe(false);
    }
  });
});

describe("excerptFrom", () => {
  it("takes the first paragraph whole when it fits", () => {
    expect(excerptFrom("Kratek uvod.\n\nVec besedila.")).toBe("Kratek uvod.");
  });

  it("skips a leading heading rather than describing the post as '## …'", () => {
    expect(excerptFrom("## Naslov\n\nPravi uvod.")).toBe("Pravi uvod.");
  });

  it("cuts on a word boundary and marks the cut", () => {
    const long = "beseda ".repeat(60);
    const out = excerptFrom(long);
    expect(out.length).toBeLessThanOrEqual(156);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/bese…$/);
  });

  it("is empty when there is no prose to take", () => {
    expect(excerptFrom("- samo alineja")).toBe("");
  });
});

describe("readMinutes", () => {
  it("never reports zero", () => {
    expect(readMinutes("dve besedi")).toBe(1);
  });

  it("counts at 200 words a minute", () => {
    expect(readMinutes("beseda ".repeat(600))).toBe(3);
  });
});

describe("dateText", () => {
  it("uses the genitive month a Slovenian date takes in a sentence", () => {
    expect(dateText("2026-03-14T09:00:00Z")).toBe("14. marca 2026");
    expect(dateText("2026-08-01T00:00:00Z")).toBe("1. avgusta 2026");
  });

  it("returns nothing rather than 'Invalid Date'", () => {
    expect(dateText("ni datum")).toBe("");
  });
});
