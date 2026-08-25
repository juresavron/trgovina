import { describe, it, expect } from "vitest";
import { SWIMSPA_MODELS, OFFERED_SWIMSPAS, footprint, metaLine, seating, swimSpaBySlug } from "./swimspa";
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

  it("offers nothing until the range is chosen", () => {
    // Publishing all nine by default would be a decision made by omission.
    expect(OFFERED_SWIMSPAS).toHaveLength(0);
    expect(swimSpaBySlug("swim-390")).toBeUndefined();
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
