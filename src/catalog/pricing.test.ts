import { describe, it, expect } from "vitest";
import {
  COST_INPUTS,
  PRICE_UNSET,
  catalogPricingReady,
  formatEur,
  priceFromFob,
  retailPoint,
  type CostInputs,
} from "./pricing";
import { POLA_MODELS, modelPrice, modelPriceCents } from "./pola";
import { SHOPS } from "../tenants";
import { CONTENT } from "../content";

/**
 * A worked set, used only here. It is NOT a suggestion of what the real
 * numbers are — it exists so the arithmetic can be checked against figures
 * that make the steps easy to follow.
 */
const SAMPLE: CostInputs = {
  eurPerUsd: 0.9,
  freightPerUnitEur: 400,
  dutyRate: 0.05,
  clearancePerUnitEur: 60,
  inlandPerUnitEur: 90,
  deliveryPerUnitEur: 250,
  warrantyRate: 0.04,
  marginRate: 0.35,
  vatRate: 0.22,
};

describe("the landed-cost calculation", () => {
  it("refuses to produce a price until the business supplies inputs", () => {
    expect(priceFromFob(3000)).toBeNull();
    expect(modelPrice(POLA_MODELS[0]!)).toBe(PRICE_UNSET);
    expect(modelPriceCents(POLA_MODELS[0]!)).toBe(0);
  });

  it("adds up: every intermediate is the sum of its parts", () => {
    const p = priceFromFob(3000, SAMPLE)!;
    expect(p.goodsEur).toBe(270_000); // $3000 × 0.9 = €2700
    expect(p.customsValueEur).toBe(p.goodsEur + 40_000);
    expect(p.dutyEur).toBe(Math.round(p.customsValueEur * 0.05));
    expect(p.landedEur).toBe(p.customsValueEur + p.dutyEur + p.clearanceEur + p.inlandEur);
    expect(p.costOfSaleEur).toBe(p.landedEur + p.warrantyEur + p.deliveryEur);
    expect(p.grossEur).toBe(p.netEur + p.vatEur);
  });

  /**
   * Margin is a fraction of the NET selling price, not a markup on cost. The
   * two differ by a lot at these tickets — 35% margin is a 1.54× markup — and
   * conflating them is how a catalogue ends up priced a thousand euro light.
   */
  it("treats marginRate as a share of net revenue, not a markup on cost", () => {
    const p = priceFromFob(3000, SAMPLE)!;
    expect(p.netEur - p.costOfSaleEur).toBeCloseTo(p.netEur * 0.35, -1);
    expect(p.netEur / p.costOfSaleEur).toBeCloseTo(1 / 0.65, 3);
  });

  it("rejects a margin that cannot be a share of the selling price", () => {
    expect(() => priceFromFob(3000, { ...SAMPLE, marginRate: 1 })).toThrow(RangeError);
  });

  /**
   * The rounding may never go below the derived price. A €10 slip on nine
   * models is invisible in review and real in the accounts.
   */
  it("rounds to a retail point and always upward", () => {
    expect(retailPoint(423_000)).toBe(429_000);
    expect(retailPoint(429_000)).toBe(429_000);
    // The trap: a price already on a round hundred must not round DOWN to
    // the point below it.
    expect(retailPoint(420_000)).toBe(429_000);
    for (const cents of [1, 99_999, 100_000, 100_001, 543_210, 1_000_000]) {
      expect(retailPoint(cents)).toBeGreaterThanOrEqual(cents);
      expect(retailPoint(cents) % 10_000).toBe(9_000);
    }
  });

  it("writes euros the way Slovenian retail does", () => {
    // Non-breaking space before the sign: a price that wraps after the digits
    // leaves a lone € on the next line.
    expect(formatEur(699_000)).toBe("6.990\u00a0€");
    expect(formatEur(99_000)).toBe("990\u00a0€");
    // The case Intl gets wrong for `sl`: four digits still group.
    expect(formatEur(699_000)).toContain(".");
  });
});

/**
 * The launch gate. Someone will eventually flip `live: true` in a hurry, and
 * the price is the one thing on the page that is a legal statement: ZVPot,
 * transposing Directive 98/6/EC, requires the price shown against an
 * identified product to be the price the customer pays.
 *
 * So a shop cannot go live while any of its prices is the unset dash, and it
 * cannot go live emitting a Product whose Offer has no real price behind it.
 */
describe("no live shop ships an unset price", () => {
  for (const key of Object.keys(SHOPS)) {
    const shop = SHOPS[key]!;
    const content = CONTENT[key]!;
    it(key + (shop.live ? " (LIVE)" : " (pre-live)") + " honours the pricing gate", () => {
      if (!shop.live) {
        expect(shop.live).toBe(false);
        return;
      }
      const unset: string[] = [];
      for (const p of content.products) {
        if ("util" in p) continue;
        if (p.price.includes(PRICE_UNSET) || p.price.trim() === "") unset.push(p.name);
      }
      if (content.pdp.price.includes(PRICE_UNSET)) unset.push(content.pdp.title);
      expect(unset, key + " is live with no price on: " + unset.join(", ")).toEqual([]);
      expect(content.pdp.priceCents, key + " is live with no priceCents").toBeGreaterThan(0);
    });
  }

  it("says plainly whether derived prices are available at all", () => {
    // Not an assertion about which state is correct — a readout, so the
    // reason a catalogue shows dashes is visible in the test output rather
    // than hunted for.
    expect(catalogPricingReady()).toBe(COST_INPUTS !== null);
  });
});
