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
 *
 * ⚠️ LOGISTICS ARE PER CUBIC METRE, NOT PER UNIT — read this before editing
 * CostInputs. Until the swim spas arrived, freight was one flat figure per
 * unit, which was defensible while the catalogue was one line of similar
 * pallets: every Pola shell is 1.95–2.30 m square and 300–410 kg dry. It is
 * badly wrong across both lines. A 5.80 × 2.28 × 1.40 m swim spa is 18.5 m³
 * against a 1.95 m tub's 3.1 m³ — six times the container slot — so a single
 * per-unit number over-prices the small tubs by whatever it under-prices the
 * swim spas, in both directions at once, and no choice of that number fixes
 * it. That is precisely what the first calibration against the competitor's
 * shelf prices showed: the tubs landed above the top of their market band
 * while the swim spas sat in the bottom third of theirs.
 *
 * So the unit's own envelope enters the calculation. See UnitEnvelope.
 */

/**
 * What a unit costs to move, from the two figures the supplier states for
 * every shell: its outside dimensions and its dry mass.
 *
 * Not a shipping quote — the *measure* a shipping quote is billed against.
 */
export interface UnitEnvelope {
  /** Shell envelope, cubic metres: width × depth × height as quoted. */
  readonly m3: number;
  /** Dry mass, tonnes. */
  readonly tonnes: number;
}

/**
 * The envelope for one shell, or null when the supplier stated no mass.
 *
 * ⚠️ NULL IS NOT A DEFAULT OF ZERO. Three swim spas on the 2026 list give no
 * dry or filled mass (ZR6802, ZR6803, ZR7801 — see the ⚠️ in
 * docs/SUPPLIER-SWIMSPA-2026.md). Defaulting them to zero would price
 * delivery on a mass nobody stated, for units that run to 8.5 tonnes filled,
 * and would do it silently. A null envelope produces no derived price at all
 * and the slot shows PRICE_UNSET — the same posture the rest of this module
 * takes toward numbers nobody has supplied.
 */
export function envelopeOf(
  mm: readonly [number, number, number],
  dryKg: number | undefined,
): UnitEnvelope | null {
  if (dryKg === undefined) return null;
  return { m3: (mm[0] / 1000) * (mm[1] / 1000) * (mm[2] / 1000), tonnes: dryKg / 1000 };
}

/**
 * The freight tonne — "weight or measure", whichever is greater.
 *
 * The actual commercial rule ocean freight is billed on, and it is written
 * out rather than assumed because the assumption happens to be safe only for
 * these goods: a spa is a large box full of air, so measure governs by a wide
 * margin on every model in the catalogue (the closest, the 1,530 kg ZR7860,
 * is still 19.2 m³ against 1.53 t). Anything denser bought later — a pallet
 * of chemicals, a crated pump — would flip it, and this gets that right
 * without anyone having to notice.
 */
export function freightTonnes(e: UnitEnvelope): number {
  return Math.max(e.m3, e.tonnes);
}

/**
 * The business inputs. Every one of these is a fact about how this importer
 * actually operates — none can be inferred from the supplier's quote.
 */
export interface CostInputs {
  /** Euro obtained for one US dollar, at the rate the business books. */
  eurPerUsd: number;
  /**
   * Sea freight and marine insurance, EUR per freight tonne (see
   * freightTonnes). The forwarder quotes a container; this is that quote
   * divided by the shell volume the business actually loads into one, so
   * crating and the air around an awkward shape are already inside the rate.
   * One shipment's invoice and packing list is enough to compute it exactly.
   */
  freightPerCbmEur: number;
  /**
   * EU import duty as a fraction of the customs value. Depends on the tariff
   * line the goods are classified under, which is a customs-broker question,
   * not a guess: whirlpool baths and their parts do not all sit on one code.
   */
  dutyRate: number;
  /**
   * Clearance, port handling and documentation per unit, EUR. Flat, and
   * correctly so — the broker's file costs the same whatever is in the box.
   */
  clearancePerUnitEur: number;
  /**
   * Port to warehouse, EUR per freight tonne. Volumetric for the same reason
   * sea freight is: a truck takes six hot tubs or one swim spa.
   */
  inlandPerCbmEur: number;
  /**
   * Delivery and commissioning at the customer: the part that costs the same
   * whoever the customer is — the crew turning up, the water test, the
   * handover. EUR per unit.
   *
   * This is the thing the shop's whole promise is built on, so it is priced
   * in rather than absorbed.
   */
  deliveryBaseEur: number;
  /**
   * The part of delivery that scales: EUR per tonne of dry mass. Four people
   * and a set of skates move a 300 kg tub across a terrace; a 1.4 tonne swim
   * spa is a crane, a permit and a morning. Splitting delivery in two is what
   * keeps the swim spas from being subsidised by the tubs.
   */
  deliveryPerTonneEur: number;
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
 * THE INPUTS ARE SET — CALIBRATED, NOT CONFIRMED. Every field below except
 * vatRate is marked ASSUMPTION in place, with the document that replaces it
 * (a forwarder invoice, the broker's tariff classification, the owner's own
 * margin decision). The catalogue now renders these as final selling prices
 * and the structured data publishes real Offers, so the owner's sign-off on
 * this block is a launch item alongside the VAT number.
 *
 * To reprice: edit the literal. Nothing else changes — the catalogue
 * reprices itself. To go back to dashes, set the export to null: the type
 * still admits it, `catalogPricingReady()` reports false again, and the
 * launch gate closes exactly as it did before 2026-08-27.
 */
export const COST_INPUTS: CostInputs | null = {
  // ── KNOWN ──────────────────────────────────────────────────────────────
  /** Slovenia's standard DDV rate. The one figure here that is law. */
  vatRate: 0.22,

  // ── CALIBRATED ─────────────────────────────────────────────────────────
  // Set 2026-08-27 against the shelf prices of the category's established
  // Slovenian competitor (trgovina-jana.si, "Spa program" and swim-spa
  // pages, supplied by the owner as the pricing guideline). With these
  // inputs the three tubs price at 6.490–7.790 € inside the competitor's
  // 4.499–8.899 € band, the three swim spas at 16.690–21.590 € inside their
  // 13.000–38.412 € band, and a $200 thermal cover at 390 € against the
  // competitor's 369 € — every family lands mid-band on a consistent ~2,4×
  // of FOB. The calibration is real; the DECOMPOSITION into the fields
  // below is assumption, and each is marked with what confirms it.

  /** ASSUMPTION — confirm against the rate the bank actually books. */
  eurPerUsd: 0.92,
  /**
   * ASSUMPTION — €60/m³ is a 40'HQ Guangzhou–Koper quote in the low
   * thousands spread over the ~60 m³ of shell one actually loads. One
   * forwarder invoice + packing list replaces it with the exact figure.
   */
  freightPerCbmEur: 60,
  /**
   * ASSUMPTION — 6,5% is the erga omnes rate for plastic baths/tubs
   * (HS 3922 10). The broker's classification on the first entry is the
   * fact; if these clear under a different line, this changes.
   */
  dutyRate: 0.065,
  /** ASSUMPTION — broker's file, port handling, documentation per unit. */
  clearancePerUnitEur: 150,
  /** ASSUMPTION — Koper quay to warehouse, spread per m³ of load. */
  inlandPerCbmEur: 10,
  /** ASSUMPTION — crew call-out, water test, handover: the flat part. */
  deliveryBaseEur: 250,
  /** ASSUMPTION — the part that grows with the shell: skates for 300 kg,
   * a crane and a permit at 1,4 t. */
  deliveryPerTonneEur: 250,
  /** ASSUMPTION — warranty and service provision on landed cost. */
  warrantyRate: 0.05,
  /** ASSUMPTION — the commercial decision proper: 35% of net revenue,
   * i.e. ~1,54× markup on cost of sale. The owner owns this number. */
  marginRate: 0.35,
};

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
 * Something with a price on the page.
 *
 * ⚠️ THE TWO CASES CARRY DIFFERENT COSTS, WHICH IS WHY THEY ARE DIFFERENT
 * SHAPES. A shell pays freight, clearance, haulage and a delivery crew. An
 * add-on is fitted at the factory and arrives inside the shell that already
 * paid all four — so charging it a second set would be an error of a
 * spectacular size, and a plausible-looking one: run the old flat per-unit
 * stack over a $14 pillow light and it prices at four figures. Making the
 * envelope part of the "unit" case and absent from the "addon" case means the
 * mistake cannot be made by forgetting a flag.
 */
export type PricedItem =
  | { readonly kind: "unit"; readonly fobUsd: number; readonly envelope: UnitEnvelope | null }
  | { readonly kind: "addon"; readonly fobUsd: number };

/** Up to the next whole multiple. Never down — see retailPoint. */
function roundUpTo(cents: number, step: number): number {
  return Math.ceil(cents / step) * step;
}

/** Every step of the calculation, in integer cents, for auditing. */
export interface CostBreakdown {
  /** FOB converted at the booked rate. */
  goodsEur: number;
  /** Sea freight and marine insurance for this unit. Zero for an add-on. */
  freightEur: number;
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

interface Logistics {
  freightEur: number;
  clearanceEur: number;
  inlandEur: number;
  deliveryEur: number;
}

/** The arithmetic, once, with the logistics already decided by the caller. */
function derive(
  fobUsd: number,
  lg: Logistics,
  inputs: CostInputs,
  round: (cents: number) => number,
): CostBreakdown {
  if (inputs.marginRate >= 1) {
    throw new RangeError("marginRate is a fraction of the selling price and must be below 1");
  }

  const goodsEur = Math.round(fobUsd * inputs.eurPerUsd * 100);
  const customsValueEur = goodsEur + lg.freightEur;
  const dutyEur = Math.round(customsValueEur * inputs.dutyRate);
  const landedEur = customsValueEur + dutyEur + lg.clearanceEur + lg.inlandEur;

  const warrantyEur = Math.round(landedEur * inputs.warrantyRate);
  const costOfSaleEur = landedEur + warrantyEur + lg.deliveryEur;

  const netEur = Math.round(costOfSaleEur / (1 - inputs.marginRate));
  const vatEur = Math.round(netEur * inputs.vatRate);
  const grossEur = netEur + vatEur;

  return {
    goodsEur,
    freightEur: lg.freightEur,
    customsValueEur,
    dutyEur,
    clearanceEur: lg.clearanceEur,
    inlandEur: lg.inlandEur,
    landedEur,
    warrantyEur,
    deliveryEur: lg.deliveryEur,
    costOfSaleEur,
    netEur,
    vatEur,
    grossEur,
    displayEur: round(grossEur),
  };
}

/**
 * The full derivation for one item, or null when it cannot be priced —
 * because the inputs are unset, or because a shell states no dry mass.
 */
export function breakdownFor(
  item: PricedItem,
  inputs: CostInputs | null = COST_INPUTS,
): CostBreakdown | null {
  if (!inputs) return null;

  if (item.kind === "addon") {
    // Goods, its share of duty, warranty and margin. No freight line, no
    // second clearance file, no second delivery crew: it travels bolted into
    // a shell that has already paid for all three.
    return derive(
      item.fobUsd,
      { freightEur: 0, clearanceEur: 0, inlandEur: 0, deliveryEur: 0 },
      inputs,
      (cents) => roundUpTo(cents, 500),
    );
  }

  if (!item.envelope) return null;
  const ft = freightTonnes(item.envelope);
  const eur = (n: number) => Math.round(n * 100);
  return derive(
    item.fobUsd,
    {
      freightEur: eur(ft * inputs.freightPerCbmEur),
      clearanceEur: eur(inputs.clearancePerUnitEur),
      inlandEur: eur(ft * inputs.inlandPerCbmEur),
      deliveryEur: eur(
        inputs.deliveryBaseEur + item.envelope.tonnes * inputs.deliveryPerTonneEur,
      ),
    },
    inputs,
    retailPoint,
  );
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
export function displayPriceCents(item: PricedItem): number {
  const derived = breakdownFor(item);
  if (derived) return derived.displayEur;
  // ⚠️ A SHELL WITH NO STATED MASS FALLS TO THE DASH, not to cost basis. Once
  // COST_INPUTS is set the shop is selling; showing a cost-basis figure for
  // the one model whose envelope is incomplete would put a number a third
  // under the others on a live page.
  if (COST_INPUTS !== null) return 0;
  if (PROVISIONAL_EUR_PER_USD === null) return 0;
  // Ten euro for a tub, one for an add-on: enough to look tidy, not enough to
  // look chosen.
  return roundUpTo(
    Math.round(item.fobUsd * PROVISIONAL_EUR_PER_USD * 100),
    item.kind === "unit" ? 1000 : 100,
  );
}

/**
 * What a slot shows: the derived selling price when the inputs exist, the
 * provisional conversion while they do not, and the dash when neither is
 * available.
 */
export function displayPrice(item: PricedItem): string {
  const cents = displayPriceCents(item);
  return cents > 0 ? formatEur(cents) : PRICE_UNSET;
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
