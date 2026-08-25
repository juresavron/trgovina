import { describe, it, expect } from "vitest";
import {
  SWIMSPA_MODELS,
  OFFERED_SWIMSPAS,
  ZR7860_DUAL_ZONE_CONFIRMED,
  footprint,
  metaLine,
  seating,
  swimSpaBySlug,
  swimSpaFamilyHasSwimJets,
  ZR7807_DUAL_ZONE_CONFIRMED,
} from "./swimspa";
import { OFFERED_MODELS } from "./pola";

/**
 * The catalogue is a TRANSCRIPTION of a supplier document, and the failure
 * mode that matters is not a crash — it is a page that quietly claims a
 * specification nobody stated. These assert the shape of the transcription and
 * the invariants that keep a claim honest.
 */
describe("swim spa catalogue", () => {
  it("carries all nine models the price list quotes", () => {
    expect(SWIMSPA_MODELS).toHaveLength(9);
  });

  it("gives every model a unique code and slug", () => {
    // The supplier's own list reuses ZR7809 for the turbine variant. If that
    // ever gets pasted back in verbatim, two SKUs share an identity and an
    // order cannot be matched to a unit.
    expect(new Set(SWIMSPA_MODELS.map((m) => m.code)).size).toBe(9);
    expect(new Set(SWIMSPA_MODELS.map((m) => m.slug)).size).toBe(9);
  });

  it("never collides with a hot tub slug", () => {
    // Both lines hang off a shop's /product route. A shared slug would serve
    // one product's page under the other's URL.
    const hot = new Set(OFFERED_MODELS.map((m) => m.slug));
    for (const m of SWIMSPA_MODELS) expect(hot.has(m.slug), m.slug).toBe(false);
  });

  it("states a length no shorter than 3.9 m", () => {
    // The category's floor. Anything shorter is a hot tub, and the whole
    // reason this module is separate from pola.ts is that the two are not
    // interchangeable.
    for (const m of SWIMSPA_MODELS) expect(m.mm[0], m.code).toBeGreaterThanOrEqual(3900);
  });

  it("keeps the jet breakdown discrepancy field honest", () => {
    // Unlike the Pola list, every stated breakdown here reconciles. If a
    // future edit introduces one, it must be recorded rather than resolved.
    for (const m of SWIMSPA_MODELS) {
      if (m.jetPartsSum !== undefined) expect(m.jetPartsSum, m.code).not.toBe(m.jets);
    }
  });

  it("does not invent a mass for the three models that state none", () => {
    // Filled mass is what a terrace is engineered against. A figure guessed
    // from a similar model is worse than a missing one, so the omission is
    // deliberate and asserted.
    const silent = ["ZR6802", "ZR6803", "ZR7801"];
    for (const code of silent) {
      const m = SWIMSPA_MODELS.find((x) => x.code === code)!;
      expect(m.dryKg, code).toBeUndefined();
      expect(m.filledKg, code).toBeUndefined();
    }
  });

  it("does not invent a cover price for ZR7801", () => {
    // The one model on the list with no thermal cover quoted. Charging a
    // customer a price nobody stated is the error this guards.
    const m = SWIMSPA_MODELS.find((x) => x.code === "ZR7801")!;
    expect(m.addons.some((x) => x.key === "cover")).toBe(false);
    // Every other model does quote one.
    for (const other of SWIMSPA_MODELS.filter((x) => x.code !== "ZR7801")) {
      expect(other.addons.some((x) => x.key === "cover"), other.code).toBe(true);
    }
  });

  it("offers the four the owner chose, shortest first", () => {
    expect(OFFERED_SWIMSPAS.map((m) => m.code)).toEqual(["ZR6801", "ZR7861", "ZR7807", "ZR7860"]);
    // Shortest first is the ladder a buyer walks, and length is the decision.
    const mm = OFFERED_SWIMSPAS.map((m) => m.mm[0]);
    expect([...mm].sort((x, y) => x - y)).toEqual(mm);
    expect(swimSpaBySlug("swim-390")?.code).toBe("ZR6801");
    // Not offered, so not routable: an unoffered model must 404 rather than
    // render a page for something the shop does not sell.
    expect(swimSpaBySlug("swim-580-turbo")).toBeUndefined();
    // The model ZR7861 displaced.
    expect(swimSpaBySlug("swim-500")).toBeUndefined();
  });

  it("gives every offered model a tier and no other model one", () => {
    for (const m of SWIMSPA_MODELS) {
      const offered = OFFERED_SWIMSPAS.some((o) => o.code === m.code);
      expect(Boolean(m.tier), m.code).toBe(offered);
    }
  });

  it("holds the dual-zone claim until the supplier confirms it", () => {
    // The ZR7860's price jump is sold on two temperatures at once. The sheet
    // shows two control systems, two circulation pumps and two ozonators —
    // but one "3kw" heater and no partition, and two heated volumes need two
    // heaters. Until that is confirmed the claim cannot go on a page.
    expect(ZR7860_DUAL_ZONE_CONFIRMED).toBe(false);
  });

  it("keeps the offered ladder ordered by length, then by price", () => {
    // ZR7861 replaced ZR6802 (4.50 m between the 3.90 m entry and the 5.80 m
    // top, keeping the only unit under four metres). ZR7807 joined as a
    // fourth, so there are now two 5.80 m models and length alone no longer
    // orders them — price breaks the tie, cheaper first, which is the
    // direction a buyer reads a ladder in.
    const mm = OFFERED_SWIMSPAS.map((m) => m.mm[0]);
    expect(mm).toEqual([3900, 4500, 5800, 5800]);
    expect([...mm].sort((a, b) => a - b)).toEqual(mm);
    const [a, b] = OFFERED_SWIMSPAS.slice(2);
    expect(a!.fobUsd).toBeLessThan(b!.fobUsd);
  });

  it("claims two temperatures at once on NEITHER model", () => {
    // The ZR7807 was added as a "Dual Zone Swim Spa and Hot Tub Combo"; the
    // price list gives it ONE drainage outlet and ONE topside panel where the
    // ZR7860 has two of each, and two bodies of water need two of both. The
    // sheet and the owner disagree about which unit it is, so until that is
    // settled neither page may make the claim — it is the strongest sentence
    // in the category and therefore the worst one to guess at.
    expect(ZR7860_DUAL_ZONE_CONFIRMED).toBe(false);
    expect(ZR7807_DUAL_ZONE_CONFIRMED).toBe(false);
  });

  it("does not advertise a counter-current jet the range cannot deliver", () => {
    // The whole category rests on this claim, and the ZR7861's sheet lists
    // NO swim jet — four hydrotherapy jets in total, where every other unit
    // runs 38-94 plus three swim jets. Carried exactly as written, and the
    // family-level claim derives from the range rather than being asserted,
    // so a card can never promise a jet one of its models has not got.
    const zr7861 = SWIMSPA_MODELS.find((m) => m.code === "ZR7861")!;
    expect(zr7861.swimJets).toBe(0);
    expect(zr7861.jets).toBe(4);
    expect(swimSpaFamilyHasSwimJets()).toBe(false);
  });

  it("keeps the premium model's build claims true to the sheet", () => {
    const p = SWIMSPA_MODELS.find((m) => m.code === "ZR7860")!;
    // Heaviest on the list — by 80 kg over the ZR7809 Turbine, not by 270.
    const heaviest = Math.max(...SWIMSPA_MODELS.map((m) => m.dryKg ?? 0));
    expect(p.dryKg).toBe(heaviest);
    // Best filtration: three skimmers where everything else has two.
    expect(p.skimmers).toBe(3);
    expect(Math.max(...SWIMSPA_MODELS.map((m) => m.skimmers))).toBe(3);
    // 1 HP circulation pumps — but NOT "instead of the 0.35 HP used
    // everywhere else": three other models use 1 HP too.
    expect(p.circPumps).toEqual([2, 1]);
    expect(SWIMSPA_MODELS.filter((m) => m.circPumps[1] === 1)).toHaveLength(4);
  });

  it("renders Slovenian number and grammar forms", () => {
    const m = SWIMSPA_MODELS.find((x) => x.code === "ZR7807")!;
    expect(footprint(m)).toBe("5,80 × 2,24 m");
    expect(seating(m)).toBe("7 oseb · 1 ležalnik");
    // The card leads with LENGTH, because that is what this category is
    // bought on — the hot tub's line leads with seating.
    expect(metaLine(m).startsWith("5,80 × 2,24 m")).toBe(true);
  });
});
