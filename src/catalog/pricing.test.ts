import { describe, it, expect } from "vitest";
import {
  COST_INPUTS,
  PRICE_UNSET,
  PROVISIONAL_EUR_PER_USD,
  displayPriceCents,
  catalogPricingReady,
  formatEur,
  priceFromFob,
  retailPoint,
  type CostInputs,
} from "./pricing";
import { POLA_MODELS, modelPrice, modelPriceCents } from "./pola";
import { SHOPS } from "../tenants";
import { PAGES, legalPagesReady } from "../content/pages";
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
  it("produces no DERIVED price until the business supplies inputs", () => {
    expect(priceFromFob(3000)).toBeNull();
    expect(catalogPricingReady()).toBe(false);
  });

  /**
   * The provisional path exists so the product page can be designed against
   * real figures. These assertions are what keep it from being mistaken for a
   * decision: it must never round to a retail point, and it must never make
   * `catalogPricingReady()` true — that is what the launch gate asks.
   */
  it("shows provisional prices without ever claiming they are retail", () => {
    if (PROVISIONAL_EUR_PER_USD === null) {
      expect(modelPrice(POLA_MODELS[0]!)).toBe(PRICE_UNSET);
      return;
    }
    expect(catalogPricingReady()).toBe(false);
    for (const m of POLA_MODELS) {
      const cents = modelPriceCents(m);
      expect(cents).toBeGreaterThan(0);
      // A plain ten. Rounding to ten still lands on a x90 ending about one
      // time in ten — ZR801 does — so this cannot assert "never looks like a
      // retail point"; what it can assert is that nothing DELIBERATELY
      // rounds these onto one.
      expect(cents % 1000, m.code + " provisional price is not a plain ten").toBe(0);
      expect(modelPrice(m)).not.toBe(PRICE_UNSET);
    }
  });

  /**
   * A €14 pillow light taken up to a shell's retail point would be priced at
   * €90 — a 540% error, and one that looks perfectly plausible on a page.
   */
  it("rounds an add-on on its own tier, not the shell's", () => {
    const cheapest = Math.min(
      ...POLA_MODELS.flatMap((m) => m.addons.map((x) => x.fobUsd)),
    );
    expect(cheapest).toBeLessThan(20);
    const asAddon = displayPriceCents(cheapest, "addon");
    const asUnit = displayPriceCents(cheapest, "unit");
    expect(asAddon).toBeLessThan(asUnit);
    // Within a euro of the converted figure, rather than rounded to a shell.
    expect(asAddon).toBeLessThanOrEqual(Math.ceil(cheapest * 1.0) * 100);
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
      // THE DERIVED-PRICE CHECK, and it has to come first.
      //
      // Everything below this line looks for the unset DASH, which is what a
      // catalogue shows when it has no numbers at all. That was the whole
      // gate until PROVISIONAL_EUR_PER_USD started rendering real-looking
      // figures — and then the gate had a hole exactly where it mattered
      // most: a shop flipped live today would have shown 2.420 EUR on a card
      // and passed, because 2.420 EUR is not a dash.
      //
      // Those figures are the supplier's list price converted at 0.92 and
      // nothing else: no freight, no duty, no delivery labour, no margin.
      // They are BELOW landed cost, and ZVPot makes the displayed price the
      // price the customer pays. Publishing them is not a cosmetic mistake,
      // it is selling at a loss by arithmetic.
      //
      // pricing.ts has claimed in a comment since the provisional path landed
      // that "the launch gate still refuses to let a shop go live". This is
      // the assertion that makes that sentence true.
      expect(
        catalogPricingReady(),
        key + " is live while COST_INPUTS is null — its prices are cost basis, " +
          "not selling prices, and are below landed cost",
      ).toBe(true);
      expect(
        content.pdp.pricesProvisional,
        key + " is live with pricesProvisional set — the page is telling " +
          "visitors its own prices are not final",
      ).toBe(false);

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

/**
 * The second launch gate: a live shop must be able to say who it is.
 *
 * The terms name a seller, the withdrawal notice names who the goods go back
 * to, and the privacy notice names the controller — all three are the same
 * three fields in ShopConfig, and all three are TODO today. A privacy notice
 * whose controller cannot be identified does not satisfy GDPR Article
 * 13(1)(a); terms with no seller are not terms.
 *
 * The pages render either way, with the gaps visibly marked. What this blocks
 * is publishing them as if they were finished, exactly as the pricing gate
 * blocks publishing cost basis as if it were retail.
 */
describe("a live shop can identify itself", () => {
  for (const key of Object.keys(SHOPS)) {
    const shop = SHOPS[key]!;
    it(key + (shop.live ? " (LIVE)" : " (pre-live)") + " honours the legal-identity gate", () => {
      if (!shop.live) {
        // Pre-live: assert the gate is CLOSED and says why, so the day someone
        // flips live the failure names the six fields rather than a boolean.
        expect(legalPagesReady(shop.company, shop.contact)).toBe(false);
        return;
      }
      expect(
        legalPagesReady(shop.company, shop.contact),
        key + " is live while its registered name, VAT number, phone or address " +
          "is still a placeholder — the terms, the withdrawal notice and the " +
          "privacy notice all identify the company by these fields",
      ).toBe(true);
    });
  }

  it("serves a real page, not a stub, for every legal route", () => {
    // The stub these replaced returned 200 and read "Stran je v pripravi", so
    // a regression here would look like a working site. Length is the crude
    // but honest signal: the stub body was ~105 characters.
    for (const page of PAGES.filter((p) => p.legal)) {
      expect(page.blocks.length, page.key + " has no content").toBeGreaterThan(2);
      const words = page.blocks
        .flatMap((b) => (b.kind === "prose" ? b.p : []))
        .join(" ");
      expect(words.length, page.key + " states almost nothing").toBeGreaterThan(200);
    }
  });
});

  it("says plainly whether derived prices are available at all", () => {
    // Not an assertion about which state is correct — a readout, so the
    // reason a catalogue shows dashes is visible in the test output rather
    // than hunted for.
    expect(catalogPricingReady()).toBe(COST_INPUTS !== null);
  });
});
