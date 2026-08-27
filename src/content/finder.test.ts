import { describe, expect, it } from "vitest";
import { nextStep, recommend } from "./finder";
import { CONTENT } from "./index";
import { handleRequest } from "../worker";

/**
 * The guided choice. The tree is data and the verdicts are claims, so the
 * tests hold three things: the tree terminates, every recommended slug is a
 * REAL product page, and every `why` sentence's figures match the catalogue
 * the reader will check them against.
 */
describe("the finder's tree", () => {
  it("asks purpose first, and swimming resolves in two questions", () => {
    expect(nextStep({})?.param).toBe("namen");
    expect(nextStep({ namen: "plavanje" })?.param).toBe("masaza");
    expect(nextStep({ namen: "plavanje", masaza: "najvec" })).toBeNull();
  });

  it("relaxation resolves in at most three", () => {
    expect(nextStep({ namen: "sprostitev" })?.param).toBe("osebe");
    // Six seats exist on exactly one model, so the answer decides alone.
    expect(nextStep({ namen: "sprostitev", osebe: "druzba" })).toBeNull();
    expect(nextStep({ namen: "sprostitev", osebe: "druzina" })?.param).toBe("prostor");
    expect(nextStep({ namen: "sprostitev", osebe: "druzina", prostor: "manj" })).toBeNull();
  });

  it("treats a hand-edited value as unanswered rather than throwing", () => {
    expect(nextStep({ namen: "garbage" })?.param).toBe("namen");
  });
});

describe("the finder's verdicts", () => {
  const pdps = CONTENT["bazen"]!.pdps ?? [];
  const slugs = new Set(pdps.map((d) => d.slug));

  it("recommends only products that exist, for every leaf of the tree", () => {
    const leaves = [
      { namen: "plavanje", masaza: "najvec" },
      { namen: "plavanje", masaza: "uravnotezeno" },
      { namen: "sprostitev", osebe: "druzba" },
      { namen: "sprostitev", osebe: "druzina", prostor: "manj" },
      { namen: "sprostitev", osebe: "druzina", prostor: "vec" },
    ];
    for (const a of leaves) {
      const r = recommend(a);
      expect(r.slugs.length).toBeGreaterThan(0);
      for (const s of r.slugs) {
        expect(slugs.has(s), s + " is recommended but is not a product page").toBe(true);
      }
      expect(r.why.length).toBeGreaterThan(20);
    }
  });

  it("backs each verdict's figures with the catalogue", () => {
    // The claims a reader can falsify on the model's own page.
    expect(recommend({ namen: "plavanje", masaza: "najvec" }).why).toContain("94");
    expect(recommend({ namen: "sprostitev", osebe: "druzba" }).why).toContain("šestimi");
    expect(recommend({ namen: "sprostitev", osebe: "druzina", prostor: "manj" }).why)
      .toContain("1,95");
  });
});

describe("the finder route", () => {
  const get = (path: string) =>
    handleRequest(
      new Request("https://trgovina.worldfans.workers.dev" + path, {
        headers: { host: "trgovina.worldfans.workers.dev" },
      }),
    );

  it("serves the entry question and canonicalizes every permutation to it", async () => {
    const r = get("/izbira");
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toContain("Kaj naj bazen zna?");
    const leaf = await get("/izbira?namen=plavanje&masaza=najvec").text();
    // The answered URL renders the verdict but claims the ENTRY as canonical,
    // so the permutations cannot compete with the page in an index.
    expect(leaf).toContain("SWIM 580 MAXI");
    expect(leaf).toContain('rel="canonical" href="https://masazni-bazeni-vrelec.si/izbira"');
    expect(leaf).toContain("/kontakt?model=swim-580-maxi");
  });

  it("is in the sitemap exactly once", async () => {
    const { sitemapPaths } = await import("../render/sitemap");
    const { SHOPS } = await import("../tenants");
    const paths = sitemapPaths(SHOPS["bazen"]!, CONTENT["bazen"]!);
    expect(paths.filter((p) => p === "/izbira").length).toBe(1);
  });
});

describe("stepping back", () => {
  it("removes one answer at a time, in tree order, and stops at the start", async () => {
    const { previousAnswers } = await import("./finder");
    // Relaxation branch, fully answered: back → drop prostor, then osebe,
    // then namen, then null.
    const full = { namen: "sprostitev", osebe: "druzina", prostor: "vec" };
    const one = previousAnswers(full)!;
    expect(one).toEqual({ namen: "sprostitev", osebe: "druzina" });
    const two = previousAnswers(one)!;
    expect(two).toEqual({ namen: "sprostitev" });
    expect(previousAnswers(two)).toEqual({});
    expect(previousAnswers({})).toBeNull();
  });

  it("follows the swimming branch rather than the parameter list's order", async () => {
    const { previousAnswers } = await import("./finder");
    // masaza is the swimming branch's second question; osebe/prostor are not
    // on that path at all and must not be treated as later answers.
    expect(previousAnswers({ namen: "plavanje", masaza: "najvec" })).toEqual({
      namen: "plavanje",
    });
  });

  it("ignores answers the tree never asked for", async () => {
    const { previousAnswers } = await import("./finder");
    // A hand-edited URL carrying an off-branch parameter: the walk stops at
    // the first unanswered step, so the stray value cannot become "the last
    // answer" and send the visitor somewhere they never were.
    expect(previousAnswers({ namen: "plavanje", prostor: "vec" })).toEqual({});
  });
});
