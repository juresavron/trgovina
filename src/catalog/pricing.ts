/**
 * From a supplier's FOB quote to a price a Slovenian customer may be shown.
 *
 * WHY THIS IS CODE AND NOT A SPREADSHEET CELL. An FOB figure is the goods on
 * the quay in Guangzhou. Everything between it and a shelf price — freight,
 * duty, clearance, inland haulage, the delivery-and-commissioning labour this
 * network sells as its differentiator, warranty provision, margin, DDV — is a
 * business decision, and every one of them moves. Typing the answer into
 * `price: "6.990 €"` records the output and loses the input: nobody can later
 * ask "what margin is that?" or reprice nine models when freight changes,
 * and the first time the exchange rate moves the catalogue quietly stops
 * meaning what it says.
 *
 * So the inputs live in one place, the arithmetic lives here, and the prices
 * are derived. Repricing the catalogue is then one edit to COST_INPUTS.
 *
 * ⚠️ THE DISPLAYED PRICE IS A LEGAL STATEMENT. Slovenia transposes Directive
 * 98/6/EC on price indication in ZVPot: the price shown against an identified
 * product is the price the customer pays, DDV included. That is why this
 * module refuses to produce a number until the business has supplied real
 * inputs (see COST_INPUTS), rather than defaulting to something plausible.
 */

/**
 * The business inputs. Every one of these is a fact about how this importer
 * actually operates — none can be inferred from the supplier's quote.
 */
export interface CostInputs {
  /** Euro obtained for one US dollar, at the rate the business books. */
  eurPerUsd: number;
  /** Sea freight and marine insurance allocated to one unit, EUR. */
  freightPerUnitEur: number;
  /**
   * EU import duty as a fraction of the customs value. Depends on the tariff
   * line the goods are classified under, which is a customs-broker question,
   * not a guess: whirlpool baths and their parts do not all sit on one code.
   */
  dutyRate: number;
  /** Clearance, port handling and documentation per unit, EUR. */
  clearancePerUnitEur: number;
  /** Port to warehouse, EUR per unit. */
  inlandPerUnitEur: number;
  /**
   * Delivery and commissioning at the customer, EUR per unit. On a 410 kg dry
   * shell that has to cross a terrace this is not a rounding error, and it is
   * the thing the shop's whole promise is built on — so it is priced in
   * rather than absorbed.
   */
  deliveryPerUnitEur: number;
  /** Warranty and service provision, as a fraction of landed cost. */
  warrantyRate: number;
  /**
   * Gross margin as a fraction of the NET (ex-DDV) selling price — the sense
   * a P&L uses. 0.35 means 35% of net revenue is margin, i.e. a markup of
   * about 1.54× on cost of sale. Stated because "margin" and "markup" get
   * used interchangeably and the two differ by a lot at these numbers.
   */
  marginRate: number;
  /** DDV as a fraction. Slovenia's standard rate is 0.22. */
  vatRate: number;
}

/**
 * THE INPUTS ARE NOT SET YET.
 *
 * `null` is deliberate and load-bearing: a placeholder set of plausible
 * numbers would render prices that look finished, and a price that looks
 * finished gets quoted. `catalogPricingReady()` is asserted against every
 * live shop in the launch gate, so a shop carrying derived prices cannot go
 * `live: true` while this is null.
 *
 * To set it: replace null with a CostInputs literal. Nothing else changes —
 * the catalogue reprices itself.
 */
export const COST_INPUTS: CostInputs | null = null;

/**
 * PROVISIONAL PRICING — the euro obtained for one dollar, used only until
 * COST_INPUTS exists.
 *
 * The business asked for the catalogue to carry numbers now and to settle the
 * full price later, so this converts the supplier's list price and nothing
 * else. What it produces is COST, not a selling price: no freight, no duty,
 * no delivery labour, no margin. It is therefore far too low to sell at, and
 * it exists so the product page can be designed and reviewed against real
 * figures instead of dashes.
 *
 * Two things keep that from becoming a live mistake. `catalogPricingReady()`
 * still reports false — it asks about COST_INPUTS, not about this — so the
 * launch gate still refuses to let a shop go live. And provisional numbers
 * are rounded to a plain ten rather than onto a retail point: a price ending
 * in 90 reads as a decision somebody made, and nobody has made one yet.
 * (Rounding to ten does land on a x90 ending about one time in ten — ZR801
 * comes out at 2.890 € — so this is about not aiming for one, not a promise
 * that none occurs.)
 *
 * Set to null to go back to dashes.
 */
export const PROVISIONAL_EUR_PER_USD: number | null = 0.92;

/**
 * Whether prices are DERIVED — the full landed-cost calculation, safe to
 * sell at. Provisional conversion deliberately does not count: this is what
 * the launch gate asks, and a shop may not go live on cost-basis numbers.
 */
export function catalogPricingReady(): boolean {
  return COST_INPUTS !== null;
}

/**
 * Which rounding a price gets.
 *
 * A shell and a cup holder do not round the same way: taking €14 up to the
 * next retail point would price it at €90. `unit` is the tub, `addon` is
 * everything bolted to it.
 */
export type PriceTier = "unit" | "addon";

/** Up to the next whole multiple. Never down — see retailPoint. */
function roundUpTo(cents: number, step: number): number {
  return Math.ceil(cents / step) * step;
}

/** Every step of the calculation, in integer cents, for auditing. */
export interface CostBreakdown {
  /** FOB converted at the booked rate. */
  goodsEur: number;
  /** Goods + freight and insurance — the customs value. */
  customsValueEur: number;
  dutyEur: number;
  clearanceEur: number;
  inlandEur: number;
  /** Everything to get the unit into the warehouse. */
  landedEur: number;
  warrantyEur: number;
  deliveryEur: number;
  /** Landed plus what it costs to stand behind the sale and complete it. */
  costOfSaleEur: number;
  /** Selling price excluding DDV. */
  netEur: number;
  vatEur: number;
  /** Selling price including DDV, before rounding. */
  grossEur: number;
  /** What the page shows: grossEur taken up to a retail price point. */
  displayEur: number;
}

/**
 * Take a price up to the next retail point: 90 € above a round hundred.
 *
 * Always UPWARD. Rounding a derived price down would quietly eat margin the
 * calculation above just decided on, and at these ticket sizes a €10 slip on
 * nine models is not the sort of thing anyone notices in a review.
 */
export function retailPoint(cents: number): number {
  const point = Math.ceil(cents / 10_000) * 10_000 - 1_000;
  return point < cents ? point + 10_000 : point;
}

/**
 * The full derivation for one unit, or null when the inputs are unset.
 *
 * @param fobUsd the supplier's FOB price in whole US dollars
 */
export function priceFromFob(fobUsd: number, inputs: CostInputs | null = COST_INPUTS): CostBreakdown | null {
  if (!inputs) return null;
  if (inputs.marginRate >= 1) {
    throw new RangeError("marginRate is a fraction of the selling price and must be below 1");
  }

  const eur = (n: number) => Math.round(n * 100);

  const goodsEur = eur(fobUsd * inputs.eurPerUsd);
  const freightEur = eur(inputs.freightPerUnitEur);
  const customsValueEur = goodsEur + freightEur;
  const dutyEur = Math.round(customsValueEur * inputs.dutyRate);
  const clearanceEur = eur(inputs.clearancePerUnitEur);
  const inlandEur = eur(inputs.inlandPerUnitEur);
  const landedEur = customsValueEur + dutyEur + clearanceEur + inlandEur;

  const warrantyEur = Math.round(landedEur * inputs.warrantyRate);
  const deliveryEur = eur(inputs.deliveryPerUnitEur);
  const costOfSaleEur = landedEur + warrantyEur + deliveryEur;

  const netEur = Math.round(costOfSaleEur / (1 - inputs.marginRate));
  const vatEur = Math.round(netEur * inputs.vatRate);
  const grossEur = netEur + vatEur;

  return {
    goodsEur,
    customsValueEur,
    dutyEur,
    clearanceEur,
    inlandEur,
    landedEur,
    warrantyEur,
    deliveryEur,
    costOfSaleEur,
    netEur,
    vatEur,
    grossEur,
    displayEur: retailPoint(grossEur),
  };
}

/**
 * A price as Slovenian retail writes it: "6.990 €" — full stop for thousands,
 * a non-breaking space before the sign so it never wraps onto its own line.
 *
 * Whole euro only. These are four- and five-figure goods; printing
 * "6.990,00 €" adds two digits nobody reads and makes the number harder to
 * scan down a row of cards.
 *
 * Grouped by hand rather than through Intl, deliberately. CLDR gives `sl` a
 * minimum grouping of two digits, so `Intl.NumberFormat("sl-SI").format(6990)`
 * returns "6990" — correct for prose, wrong for a price tag, and wrong against
 * every other price already written in this repo. Doing it here also makes the
 * output identical in the Workers runtime, in vitest, and on a build machine
 * with a trimmed ICU, which a locale-dependent format is not.
 */
export function formatEur(cents: number): string {
  const whole = Math.round(cents / 100);
  const digits = String(Math.abs(whole)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (whole < 0 ? "\u2212" : "") + digits + "\u00a0€";
}

/**
 * What a product slot shows while the inputs are unset.
 *
 * An em dash, not "cena na zahtevo" — price-on-request is a real commercial
 * posture some shops take, and rendering it here would state one this shop
 * has not chosen. A dash reads as unfinished, which is exactly what it is,
 * and it only ever reaches the QA host: a shop with no prices is `live:
 * false`, and a pre-live shop serves 503 on its own domain.
 */
export const PRICE_UNSET = "—";

/**
 * The price in cents that a slot shows: derived when the inputs exist,
 * the provisional conversion while they do not, and 0 when neither is
 * available.
 *
 * One function so the string and the number can never disagree — a page that
 * prints 2.420 € beside a total built from a different figure is worse than
 * a page with no total.
 */
export function displayPriceCents(fobUsd: number, tier: PriceTier = "unit"): number {
  const derived = priceFromFob(fobUsd);
  if (derived) {
    return tier === "unit" ? derived.displayEur : roundUpTo(derived.grossEur, 500);
  }
  if (PROVISIONAL_EUR_PER_USD === null) return 0;
  // Ten euro for a tub, one for an add-on: enough to look tidy, not enough to
  // look chosen.
  return roundUpTo(Math.round(fobUsd * PROVISIONAL_EUR_PER_USD * 100), tier === "unit" ? 1000 : 100);
}

/**
 * What a slot shows: the derived selling price when the inputs exist, the
 * provisional conversion while they do not, and the dash when neither is
 * available.
 */
export function displayPrice(fobUsd: number, tier: PriceTier = "unit"): string {
  const cents = displayPriceCents(fobUsd, tier);
  return cents > 0 ? formatEur(cents) : PRICE_UNSET;
}
