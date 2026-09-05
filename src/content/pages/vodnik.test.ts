import { describe, expect, it } from "vitest";
import { GUIDE_PAGES } from "./vodnik";
import { handleRequest } from "../../worker";
import { OFFERED_MODELS } from "../../catalog/pola";
import {
  reheatHoursText,
  reheatKWhText,
  tubJetsPerPumpRangeText,
  tubLitreSpanText,
  tubMaxLitresText,
} from "../price-range";

/**
 * THE GUIDES MAKE ARITHMETIC CLAIMS ABOUT THE CATALOGUE, IN WORDS.
 *
 * Most figures on these three pages are derived — price-range.ts exists for
 * that reason and its own header says why. But some claims cannot be a
 * function call without turning a paragraph into a template: "šob je trinajst
 * več", "vode je za 300 litrov več", "črpalki sta dve namesto ene". Those are
 * sentences, and they are true of THIS catalogue.
 *
 * A guide that says the wrong thing about a model is worse than one that says
 * nothing: it is the page the shop asks Google to rank for the query, and it
 * is the page a buyer reads before spending EUR 7,000. So the typed claims are
 * checked against the same records the spec tables are built from — not to
 * make the prose generic, but so that changing the catalogue fails here rather
 * than on the page.
 *
 * If a claim below stops holding, the fix is the SENTENCE, not the test.
 */

const body = (slug: string): string => {
  const g = GUIDE_PAGES.find((x) => x.slug === slug);
  expect(g, "no guide at /vodnik/" + slug).toBeTruthy();
  return g!.blocks
    .flatMap((b) => {
      if (b.kind === "prose") return b.p;
      if (b.kind === "qa" || b.kind === "steps") return b.items.flat();
      return [];
    })
    .join(" ");
};

/** The three offered tubs, smallest shell first — the order the guides read in. */
const bySize = [...OFFERED_MODELS].sort((a, b) => a.mm[0]! - b.mm[0]!);

describe("the cost guide's claims about the three tubs", () => {
  const text = body("koliko-stane-masazni-bazen");

  it("is right that each step up adds 300 litres", () => {
    // The guide says it twice — "vode je za 300 litrov več" and "spet 300
    // litrov več" — and the second one is the load-bearing half of the
    // argument: both steps add the same water, so the water is NOT what makes
    // the second step cost more.
    const litres = bySize.map((m) => m.filledKg - m.dryKg);
    expect(litres[1]! - litres[0]!).toBe(300);
    expect(litres[2]! - litres[1]!).toBe(300);
    expect(text).toContain("300 litrov");
  });

  it("is right that the second step adds thirteen jets and the first adds two", () => {
    const jets = bySize.map((m) => m.jets);
    expect(jets[1]! - jets[0]!).toBe(2);
    expect(jets[2]! - jets[1]!).toBe(13);
    expect(text).toContain("trinajst šob več");
    expect(text).toContain("šobi sta dve več");
  });

  it("is right that only the largest tub has a second massage pump", () => {
    // jetPumps is [count, horsepower]; the guide's whole price argument is
    // that the top step buys a pump rather than centimetres.
    const counts = bySize.map((m) => m.jetPumps[0]);
    expect(counts).toEqual([1, 1, 2]);
    expect(text).toContain("črpalki sta dve namesto ene");
  });

  it("is right that the tubs share their heater, filter and shell", () => {
    // "Cena ne kupuje boljše tehnike, ampak več prostora in več šob" is only
    // true while these are identical across the range.
    expect(new Set(bySize.map((m) => m.filterSf)).size).toBe(1);
    expect(new Set(bySize.map((m) => m.topside)).size).toBeGreaterThan(0);
    expect(text).toContain("3-kilovatni grelec");
  });
});

describe("the winter guide's reheat arithmetic", () => {
  const text = body("masazni-bazen-pozimi");

  it("quotes the figures its own helper computes", () => {
    // The sentence names three numbers — litres, kilowatt-hours and hours —
    // and all three come from one calculation. Typing any of them would let
    // the trio drift apart, which is the one way this paragraph can be wrong
    // while still reading correctly.
    expect(text).toContain(tubMaxLitresText() + " litrov");
    expect(text).toContain(reheatKWhText() + " kilovatnih ur");
    expect(text).toContain("vsaj " + reheatHoursText() + " ur");
  });

  it("states a floor, because the calculation ignores losses", () => {
    // 4,186 kJ/kg/K on the water alone: a real tub loses heat while it heats,
    // so the true figure is longer and the word has to be "vsaj". Rounding
    // toward a smaller number and calling it a maximum would be the one
    // direction of error a reader could be hurt by.
    expect(text).toContain("vsaj");
    expect(text).toContain("izgube");
  });
});

describe("the maintenance guide's claims about the three tubs", () => {
  const text = body("vzdrzevanje-masaznega-bazena");

  it("is right that one filter serves every model", () => {
    // The whole page rests on this: the cartridge does not grow with the tub,
    // so neither does the work. The day one model ships a different filter,
    // four sentences on this page become false at once — including the answer
    // to "is a bigger tub more maintenance", which is the query it ranks for.
    expect(new Set(bySize.map((m) => m.filterSf)).size).toBe(1);
    expect(text).toContain("enako filtrirno površino");
    expect(text).toContain("filtrirna površina je pri vseh treh enaka");
  });

  it("quotes the water gap its own helper computes, everywhere it states it", () => {
    // ⚠️ COUNTED, NOT CONTAINED. The comment here said the figure is stated
    // three times and that typing any of them would let them drift — and then
    // asserted toContain over body(), which joins every block on the page into
    // one string. One surviving call to the helper satisfied that, so the
    // other two could be typed, and wrong, with the test still green. It
    // asserted the opposite of what it said.
    const gap = tubLitreSpanText() + " litrov";
    const stated = text.split(gap).length - 1;
    expect(stated, "the guide states the water gap " + stated + " times, not 3").toBe(3);
    const litres = bySize.map((m) => m.filledKg - m.dryKg);
    expect(litres[litres.length - 1]! - litres[0]!).toBe(600);
  });
});

describe("the jets guide's claims about the three tubs", () => {
  const text = body("sobe-in-crpalke");

  it("is right that the largest tub has the most jets and the second pump", () => {
    const jets = bySize.map((m) => m.jets);
    const pumps = bySize.map((m) => m.jetPumps[0]);
    expect(Math.max(...jets)).toBe(jets[jets.length - 1]);
    expect(pumps).toEqual([1, 1, 2]);
    expect(text).toContain("Ker ima drugo črpalko.");
  });

  it("is right that the second pump cannot be bought as an option", () => {
    // The page says so twice, and it is the sentence that turns a spec into
    // advice: a reader who wants two pumps has to buy the big shell. An
    // add-on list that ever offers a pump makes both sentences false.
    const addons = OFFERED_MODELS.flatMap((m) => m.addons.map((a) => a.label));
    expect(addons.filter((n) => /črpalk/i.test(n))).toEqual([]);
    expect(text).toContain("ni mogoče dokupiti k manjšemu");
  });

  it("is right about what CAN be chosen separately", () => {
    // The answer to "can I add jets later" ends by naming what a buyer really
    // does choose. Each of these is an option on at least one offered model.
    const addons = OFFERED_MODELS.flatMap((m) => m.addons.map((a) => a.label));
    for (const opt of [/osvetlitev/i, /zračna masaža/i, /zvočnik/i]) {
      expect(addons.some((n) => opt.test(n)), "no add-on matches " + opt.source).toBe(true);
    }
    // "pri nekaterih modelih" about the air massage: some, not all.
    const blower = OFFERED_MODELS.filter((m) =>
      m.addons.some((a) => /zračna masaža/i.test(a.label)),
    );
    expect(blower.length).toBeGreaterThan(0);
    expect(blower.length).toBeLessThan(OFFERED_MODELS.length);
    expect(text).toContain("pri nekaterih modelih");
  });

  it("quotes the jets-per-pump range its own helper computes", () => {
    expect(text).toContain(tubJetsPerPumpRangeText() + " šob na črpalko");
  });
});

describe("every guide", () => {
  for (const g of GUIDE_PAGES) {
    it(g.slug + ": asks at least two questions, or claims no FAQ", () => {
      // worker.ts emits FAQPage only on the faqPage opt-in AND two questions.
      // A guide that sets the flag and carries one question publishes nothing
      // and looks, in the source, as though it publishes something.
      const questions = g.blocks.flatMap((b) => (b.kind === "qa" ? b.items : []));
      if (g.faqPage) expect(questions.length).toBeGreaterThanOrEqual(2);
      else expect(questions.length).toBeLessThan(2);
    });

    it(g.slug + ": answers every question it asks", () => {
      for (const [q, a] of g.blocks.flatMap((b) => (b.kind === "qa" ? b.items : []))) {
        expect(q.trim().length, "empty question").toBeGreaterThan(10);
        expect(a.trim().length, "empty answer to: " + q).toBeGreaterThan(40);
      }
    });
  }
});

describe("a guide's title fits the result it has to win", () => {
  /**
   * ⚠️ 60 CHARACTERS, RENDERED — brand included, not the seoTitle alone.
   *
   * worker.ts already records 60 as where Google stops drawing a title, and
   * the three original guides land at 55, 57 and 60 without anything holding
   * them there. The fourth was written at 67 and nothing said so: a title
   * that gets cut loses its last words, which are the ones a writer put last
   * because they were the qualifier.
   *
   * The brand suffix is nine characters, so a guide's own half has 51.
   */
  const LIMIT = 60;
  for (const g of GUIDE_PAGES) {
    it(g.slug + " renders a title Google will not cut", async () => {
      const html = await handleRequest(
        new Request("https://trgovina.workers.dev/vodnik/" + g.slug + "?shop=bazen", {
          headers: { host: "trgovina.workers.dev" },
        }),
      ).text();
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
      expect(title.length, title).toBeLessThanOrEqual(LIMIT);
    });
  }
});
