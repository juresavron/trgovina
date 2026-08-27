import { describe, it, expect } from "vitest";
import {
  COST_INPUTS,
  PRICE_UNSET,
  PROVISIONAL_EUR_PER_USD,
  displayPriceCents,
  catalogPricingReady,
  envelopeOf,
  formatEur,
  freightTonnes,
  breakdownFor,
  retailPoint,
  type CostInputs,
  type UnitEnvelope,
} from "./pricing";
import { POLA_MODELS, modelPrice, modelPriceCents } from "./pola";
import { SHOPS } from "../tenants";
import { PAGES, legalPagesReady } from "../content/pages";
import { CONTENT } from "../content";
import { handleRequest } from "../worker";

/** A shop's home page as the browser gets it. */
async function renderHome(key: string): Promise<string> {
  return await handleRequest(
    new Request("https://trgovina.worldfans.workers.dev/?shop=" + key, {
      headers: { host: "trgovina.worldfans.workers.dev" },
    }),
  ).text();
}

/**
 * A worked set, used only here. It is NOT a suggestion of what the real
 * numbers are — it exists so the arithmetic can be checked against figures
 * that make the steps easy to follow.
 */
const SAMPLE: CostInputs = {
  eurPerUsd: 0.9,
  freightPerCbmEur: 100,
  dutyRate: 0.05,
  clearancePerUnitEur: 60,
  inlandPerCbmEur: 10,
  deliveryBaseEur: 250,
  deliveryPerTonneEur: 200,
  warrantyRate: 0.04,
  marginRate: 0.35,
  vatRate: 0.22,
};

/** A worked envelope to match: 4.0 m³, 400 kg — measure governs. */
const BOX: UnitEnvelope = { m3: 4, tonnes: 0.4 };
const unit = (fobUsd: number, envelope: UnitEnvelope | null = BOX) =>
  ({ kind: "unit", fobUsd, envelope }) as const;

describe("the landed-cost calculation", () => {
  it("derives prices exactly when the business has supplied inputs", () => {
    // Both states of one contract: no inputs, no number — real inputs, a
    // real number. The gate below asks the same question.
    if (COST_INPUTS === null) {
      expect(breakdownFor(unit(3000))).toBeNull();
      expect(catalogPricingReady()).toBe(false);
    } else {
      expect(breakdownFor(unit(3000))).not.toBeNull();
      expect(catalogPricingReady()).toBe(true);
    }
    expect(breakdownFor(unit(3000), null)).toBeNull();
  });

  /**
   * The provisional path exists so the product page can be designed against
   * real figures. These assertions are what keep it from being mistaken for a
   * decision: it must never round to a retail point, and it must never make
   * `catalogPricingReady()` true — that is what the launch gate asks.
   */
  it("shows provisional prices without ever claiming they are retail", () => {
    if (COST_INPUTS !== null) {
      // Derived pricing is on; the provisional path is dormant. What must
      // still hold: every model prices on a retail point, well above its
      // cost-basis conversion — a derived price below the old provisional
      // figure would mean the calculation lost money by arithmetic.
      for (const m of POLA_MODELS) {
        const cents = modelPriceCents(m);
        expect(cents, m.code).toBeGreaterThan(0);
        expect(cents % 10_000, m.code + " derived price is on a retail point").toBe(9_000);
        expect(cents).toBeGreaterThan(m.fobUsd * COST_INPUTS.eurPerUsd * 100);
      }
      return;
    }
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
    const asAddon = displayPriceCents({ kind: "addon", fobUsd: cheapest });
    const asUnit = displayPriceCents(unit(cheapest, BOX));
    expect(asAddon).toBeLessThan(asUnit);
    // Whatever the pricing state, a sub-$20 option must stay a two-figure
    // price: goods, duty, warranty and margin — never a shell's logistics.
    expect(asAddon).toBeLessThanOrEqual(100 * 100);
  });

  it("adds up: every intermediate is the sum of its parts", () => {
    const p = breakdownFor(unit(3000), SAMPLE)!;
    expect(p.goodsEur).toBe(270_000); // $3000 × 0.9 = €2700
    // 4 m³ × €100 = €400 of freight on the customs value.
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
    const p = breakdownFor(unit(3000), SAMPLE)!;
    expect(p.netEur - p.costOfSaleEur).toBeCloseTo(p.netEur * 0.35, -1);
    expect(p.netEur / p.costOfSaleEur).toBeCloseTo(1 / 0.65, 3);
  });

  it("rejects a margin that cannot be a share of the selling price", () => {
    expect(() => breakdownFor(unit(3000), { ...SAMPLE, marginRate: 1 })).toThrow(RangeError);
  });

  /**
   * The reason freight went volumetric: a 5.8 m swim spa occupies six times
   * the container slot of a 1.95 m tub, so at the same FOB it must land
   * dearer — a flat per-unit figure cannot say that.
   */
  it("lands a bigger box dearer than a smaller one at the same FOB", () => {
    const tub = breakdownFor(unit(3000, envelopeOf([1950, 1950, 820], 300)), SAMPLE)!;
    const swim = breakdownFor(unit(3000, envelopeOf([5800, 2280, 1400], 1430)), SAMPLE)!;
    expect(swim.freightEur).toBeGreaterThan(tub.freightEur * 4);
    expect(swim.deliveryEur).toBeGreaterThan(tub.deliveryEur);
    expect(swim.displayEur).toBeGreaterThan(tub.displayEur);
  });

  /**
   * An add-on arrives inside the shell that already paid freight, clearance
   * and the crew — the old flat stack run over a $14 pillow light priced it
   * at four figures.
   */
  it("charges an add-on no second set of logistics", () => {
    const p = breakdownFor({ kind: "addon", fobUsd: 85 }, SAMPLE)!;
    expect(p.freightEur).toBe(0);
    expect(p.clearanceEur).toBe(0);
    expect(p.inlandEur).toBe(0);
    expect(p.deliveryEur).toBe(0);
  });

  it("refuses to price a shell whose mass the supplier never stated", () => {
    // ZR6802, ZR6803 and ZR7801 state no dry mass. Estimating one to fill a
    // price would sell delivery against a figure nobody stands behind.
    expect(envelopeOf([5000, 2240, 1370], undefined)).toBeNull();
    expect(breakdownFor(unit(7160, null), SAMPLE)).toBeNull();
  });

  it("bills freight by weight or measure, whichever is greater", () => {
    expect(freightTonnes({ m3: 4, tonnes: 0.4 })).toBe(4);
    expect(freightTonnes({ m3: 0.5, tonnes: 1.2 })).toBe(1.2);
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

  it("no live shop publishes an invented review as a verified purchase", () => {
    // The storefront heads this band "Preverjena mnenja strank" and puts a
    // "Preverjen nakup" chip on every quote. Making that claim about a review
    // nobody wrote is Annex I point 23b/23c of the Unfair Commercial
    // Practices Directive (Omnibus 2019/2161, transposed in ZVPot-1) — banned
    // outright, no balancing test, so this is a gate and not a preference.
    for (const key of Object.keys(SHOPS)) {
      const shop = SHOPS[key]!;
      const content = CONTENT[key];
      if (!content) continue;
      const invented = content.reviews.filter((r) => r.placeholder === true);
      if (!shop.live) {
        // Pre-live, assert the flags are still THERE. Someone deleting the
        // flag to quiet the gate, without replacing the review, is exactly
        // the failure this test exists to catch — and it would look like
        // progress in a diff.
        expect(
          invented.length,
          key + ": the reviews are known filler; the flag is what keeps them " +
            "off a live site",
        ).toBe(content.reviews.length);
        continue;
      }
      expect(
        invented.map((r) => r.who),
        key + " is live while publishing reviews nobody wrote under a " +
          "verified-purchase claim",
      ).toEqual([]);
    }
  });

  it("never RENDERS a verified-purchase claim over an invented review", async () => {
    // The test above gates the CONTENT; this one gates the PAGE. They are
    // different failures: the flag can be set correctly on every review and
    // the renderer print "Preverjen nakup" beside them anyway, which is what
    // it did — the type's own contract says "the renderer must not dress it
    // as verified" and nothing was checking that it obeyed.
    //
    // Annex I 23b/23c is banned outright, so the claim must be absent from
    // the bytes that reach a browser, not merely absent from a live site: the
    // QA host serves these pages today, and a launch gate is one config flip
    // from serving them everywhere.
    for (const key of Object.keys(SHOPS)) {
      const content = CONTENT[key];
      if (!content || !content.reviews.some((r) => r.placeholder)) continue;
      const html = await renderHome(key);
      expect(
        html.includes("Preverjen nakup"),
        key + ": a review nobody wrote is rendered with a verified-purchase chip",
      ).toBe(false);
      expect(
        html.includes("Preverjena mnenja"),
        key + ": the band claims verified reviews over quotes flagged as filler",
      ).toBe(false);
      // The quotes still render — the point is the claim, not the layout.
      expect(html.includes(content.reviews[0]!.q.slice(0, 40))).toBe(true);
    }
  });

  it("never attributes a review to a model the shop does not sell", () => {
    // "BAZEN RELAX 5" and "PAKET TERASA" were both rendered in the chip and
    // neither exists. A review naming a product that was never for sale is
    // its own admission that the review is not real.
    for (const key of Object.keys(SHOPS)) {
      const content = CONTENT[key];
      if (!content) continue;
      const sold = new Set(
        (content.pdps ?? [content.pdp]).map((d) => d.title.toUpperCase()),
      );
      for (const r of content.reviews) {
        if (!r.model) continue;
        expect(
          sold.has(r.model.toUpperCase()),
          key + ": review by " + r.who + " names " + r.model +
            ", which is not in the catalogue",
        ).toBe(true);
      }
    }
  });

  it("can actually be satisfied by filling the fields in", () => {
    // A GATE THAT CANNOT PASS IS WORSE THAN NO GATE. The first version of
    // legalPagesReady() ran one predicate over all six fields, and that
    // predicate ended in a phone test: strip non-digits, drop a leading 386,
    // drop the zeros, unset if nothing survives. Correct for the placeholder
    // phone; catastrophic for "Masažni Bazen d.o.o." and "Ljubljana", which
    // hold no digits and therefore folded to "" and read as unset.
    //
    // Measured with entirely real details in place, it returned false. Nobody
    // fills in six fields and then argues with a red test — they delete the
    // test. So this asserts the gate OPENS, not only that it closes.
    expect(
      legalPagesReady(
        { legalName: "Masažni Bazen d.o.o.", vatId: "SI12345678" },
        {
          phone: "+386 41 234 567",
          address: { street: "Dunajska cesta 100", zip: "1000", city: "Ljubljana" },
        },
      ),
      "real company details do not satisfy the gate — it can never be passed",
    ).toBe(true);

    // And it still closes on each field individually, so a single forgotten
    // value cannot slip through behind five filled-in ones.
    const real = {
      company: { legalName: "Masažni Bazen d.o.o.", vatId: "SI12345678" },
      contact: {
        phone: "+386 41 234 567",
        address: { street: "Dunajska cesta 100", zip: "1000", city: "Ljubljana" },
      },
    };
    const blanks: [string, typeof real][] = [
      ["legalName", { ...real, company: { ...real.company, legalName: "TODO d.o.o." } }],
      ["vatId", { ...real, company: { ...real.company, vatId: "SI00000000" } }],
      ["phone", { ...real, contact: { ...real.contact, phone: "+386 00 000 000" } }],
      ["street", { ...real, contact: { ...real.contact, address: { ...real.contact.address, street: "TODO" } } }],
      ["zip", { ...real, contact: { ...real.contact, address: { ...real.contact.address, zip: "0000" } } }],
      ["city", { ...real, contact: { ...real.contact, address: { ...real.contact.address, city: "TODO" } } }],
    ];
    for (const [field, cfg] of blanks) {
      expect(
        legalPagesReady(cfg.company, cfg.contact),
        "an unset " + field + " does not close the gate",
      ).toBe(false);
    }
  });

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
