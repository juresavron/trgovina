/**
 * THE POUCH CATALOGUE — what the supplier's own product sheet states, and
 * nothing that was inferred from it.
 *
 * The source is Geerlun's OEM/ODM sample art for their ALPHA tin: a six-active
 * blend, fifteen pouches to a tin, nicotine- and tobacco-free, in a lime
 * flavour. Geerlun manufactures; the brand on the tin in that art is their
 * demo mark and not this shop's.
 *
 * ⚠️ THE SUPPLIER'S OWN COLLATERAL CONTRADICTS ITSELF IN FOUR PLACES, and
 * every one of them is recorded here rather than resolved by picking the
 * flattering number. This is the same discipline the hot-tub catalogue applies
 * to its two supplier weight/CBM conflicts: a figure two documents disagree
 * about is a question for the supplier, not a judgement call for a renderer.
 *
 *   1. CAFFEINE: the strength table says 50 mg per pouch; a second graphic in
 *      the same set says "40 MG CAFFEINE & VITAMINS". ACTIVES below carries
 *      50, because that is the figure on the sheet that itemises every active
 *      by dose, and the 40 appears only in a comparison graphic. It is
 *      flagged, and it must be confirmed in writing before this shop states a
 *      caffeine content to a customer — it is the one number on the tin a
 *      buyer may need for a medical reason.
 *   2. VITAMIN B6 and MAGNESIUM are claimed in a benefits graphic and appear
 *      in no ingredient list. They are NOT in ACTIVES and must not be sold on
 *      until the supplier confirms them.
 *   3. "FROSTY MINT to keep your breath fresh" is claimed on art whose tin is
 *      LIME. Mint may well be another flavour in the range; that is not the
 *      same as this tin containing it.
 *   4. A comparison graphic asserts "NO WITHDRAWALS" and "FLAVOR LASTS AN
 *      HOUR" against an unnamed competitor. Neither is a property this shop
 *      has measured, and both are the kind of comparative claim a seller
 *      answers for. They are not published.
 *
 * ⚠️ NO PRICES HERE, AND catalog/pricing.ts IS THE WRONG ENGINE FOR THEM. That
 * module derives a shelf price from a supplier's FOB cost plus freight per
 * cubic metre, calibrated in 2026-08 against the shelf prices of established
 * HOT TUB brands, with pallet and container classes behind it. A tin of
 * pouches is a parcel and a different market; running it through that pass
 * would produce a number with the authority of a calculation and the accuracy
 * of a guess. Prices arrive when the owner supplies them, and until then
 * `priceCents: 0` means render/page.ts publishes no Offer at all.
 */

/** One active, as the supplier's strength table itemises it. */
export interface PouchActive {
  /** The name as a label, in the form the supplement trade uses. */
  readonly name: string;
  /** Milligrams per pouch. */
  readonly mg: number;
  /** One line on what it is — never on what it does to a person. */
  readonly note: string;
}

/**
 * The blend, per pouch, in the order the supplier's table lists it.
 *
 * ⚠️ THE NOTES DESCRIBE THE SUBSTANCE AND NOT ITS EFFECT. "Zbranost",
 * "spomin" and "energija" are health claims, and in the EU a health claim on a
 * food may only be made from the authorised list (Reg. 1924/2006) — the
 * supplier's art makes several that are not on it. A shop may say what is in
 * the tin and how much; saying what it will do to the buyer is a different
 * statement with a different evidential burden. So these lines say what each
 * substance IS.
 */
export const ACTIVES: readonly PouchActive[] = [
  { name: "Alfa-GPC", mg: 50, note: "Holinska spojina, v prehranskih dopolnilih pogosta sestavina." },
  { name: "L-tirozin", mg: 50, note: "Aminokislina, ki jo telo uporablja pri tvorbi nekaterih prenašalcev." },
  { name: "Tavrin", mg: 20, note: "Aminosulfonska kislina, znana predvsem iz energijskih napitkov." },
  { name: "Gvarana", mg: 20, note: "Izvleček semen rastline Paullinia cupana; naravni vir kofeina." },
  { name: "Teobromin", mg: 15, note: "Alkaloid iz kakavovca, soroden kofeinu." },
  {
    name: "Kofein",
    mg: 50,
    // See conflict 1 in the module note. This figure is the itemised one.
    note: "Iz dobaviteljeve razpredelnice sestave. Podatek pred objavo potrdimo pri dobavitelju.",
  },
];

/** Total caffeine per pouch, in mg — the itemised figure, not the graphic's. */
export const CAFFEINE_MG = ACTIVES.find((a) => a.name === "Kofein")?.mg ?? 0;

/** Pouches in one tin, as the tin states. */
export const POUCHES_PER_TIN = 15;

/**
 * One flavour of the one formula.
 *
 * ⚠️ FLAVOUR IS A VARIANT, NOT A PRODUCT, because the formula does not change
 * with it — the supplier's sheet gives one strength table for the range. The
 * shape is deliberately a LIST so the day the owner confirms the rest of the
 * flavours they are three lines each and every derived surface (the grid, the
 * sitemap, the JSON-LD, the admin) picks them up without another change.
 */
export interface PouchFlavour {
  /** URL segment under the shop's "/product" route. */
  readonly slug: string;
  /** Card and page heading. */
  readonly name: string;
  /** One line on the flavour itself. */
  readonly note: string;
  /**
   * Gross cents, DDV included, as the owner sets it.
   *
   * ZERO MEANS UNSET AND IT IS RENDERED AS UNSET. Directive 98/6/EC as
   * transposed in ZVPot makes a displayed price the price the customer pays,
   * so a placeholder here would be a legal statement nobody made.
   */
  readonly priceCents: number;
}

/**
 * ⚠️ ONE ENTRY, BECAUSE ONE FLAVOUR IS CONFIRMED.
 *
 * The competitor set this shop is being built against sells three, and the
 * grid is built to show as many as exist. What it may not do is invent two:
 * a flavour on the shelf that nobody can ship is the sort of thing a customer
 * discovers at checkout.
 *
 * TO ADD ONE, the owner supplies: the flavour name, and a written confirmation
 * that the strength table above applies to it unchanged. Price optional — a
 * flavour with priceCents 0 renders as "cena na povpraševanje" rather than
 * being hidden.
 */
export const FLAVOURS: readonly PouchFlavour[] = [
  {
    slug: "limeta",
    name: "Limeta",
    note: "Edini okus, ki ga dobaviteljev vzorec potrjuje.",
    priceCents: 0,
  },
];

/** "50 mg" — one active's dose, formatted the way the spec table prints it. */
export function doseText(a: PouchActive): string {
  return a.mg + " mg";
}

/** The sum of every active in one pouch, in mg. Derived, never typed. */
export function totalActiveMg(): number {
  return ACTIVES.reduce((n, a) => n + a.mg, 0);
}

/**
 * The blend as one sentence — "šest aktivnih sestavin, skupaj 205 mg na
 * vrečko" — with the count and the total both derived.
 *
 * The count is the thing most likely to go stale: the supplier's own graphic
 * already claims two substances the table does not list, and the day one is
 * confirmed this sentence has to move with it.
 */
export function blendSummary(): string {
  const n = ACTIVES.length;
  const word = n === 1 ? "aktivna sestavina" : n === 2 ? "aktivni sestavini"
    : n === 3 || n === 4 ? "aktivne sestavine" : "aktivnih sestavin";
  return n + " " + word + ", skupaj " + totalActiveMg() + " mg na vrečko";
}
