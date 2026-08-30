import { OFFERED_MODELS, modelPriceCents } from "../catalog/pola";
import { OFFERED_SWIMSPAS, modelPriceCents as swimPriceCents } from "../catalog/swimspa";
import { formatEur } from "../catalog/pricing";

/**
 * The price range of a family, as words, derived from the price list.
 *
 * ⚠️ DERIVED, BECAUSE A TYPED RANGE GOES STALE SILENTLY. The buying guide at
 * /vodnik/koliko-stane-masazni-bazen exists to answer that query, so it has to
 * state the figure — and a figure typed into prose is one a price change
 * leaves behind, on the page most likely to be read for it.
 *
 * A model with no price is skipped rather than printed as zero; if a whole
 * family has none, the caller gets "po povpraševanju" and the sentence still
 * reads.
 */
export function priceRangeText(family: "tub" | "swim"): string {
  const cents =
    family === "tub"
      ? OFFERED_MODELS.map(modelPriceCents)
      : OFFERED_SWIMSPAS.map(swimPriceCents);
  const priced = cents.filter((c: number) => c > 0).sort((a: number, b: number) => a - b);
  if (priced.length === 0) return "po povpraševanju";
  const lo = priced[0]!;
  const hi = priced[priced.length - 1]!;
  return lo === hi ? formatEur(lo) : "od " + formatEur(lo) + " do " + formatEur(hi);
}
