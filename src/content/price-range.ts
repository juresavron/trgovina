import { OFFERED_MODELS, modelPriceCents, addonPriceCents, footprint } from "../catalog/pola";
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

/**
 * The footprint load of a full tub, as words, derived from the catalogue.
 *
 * ⚠️ THIS IS THE NUMBER /vodnik/masazni-bazen-na-terasi WAS MISSING. That
 * guide's first step tells the reader a full tub weighs 1.500-2.210 kg and
 * that "lesena terasa in balkon pogosto sta sporna, in to je stvar
 * konstrukcije, ne občutka" — correct, and unusable. Nobody can take a total
 * mass to a builder; what a builder works in is load per square metre, and
 * that is a division the reader was left to do from two numbers on two
 * different pages.
 *
 * filledKg over the footprint, per model, rounded. It is a DISTRIBUTED figure
 * and the guide says so: a tub rests on its base, not on four points, but the
 * cabinet is not a slab either, which is exactly why the sentence sends the
 * number to somebody who can judge the construction rather than settling it.
 *
 * Derived for the same reason priceRangeText is: the three models' weights and
 * dimensions live in catalog/pola.ts, and a figure typed into prose is one a
 * catalogue change leaves behind on the page most likely to be read for it.
 */
export function tubLoadRangeText(): string {
  const perM2 = OFFERED_MODELS.map((m) => {
    const [w, d] = m.mm;
    return m.filledKg / ((w! / 1000) * (d! / 1000));
  }).sort((a, b) => a - b);
  const lo = Math.round(perM2[0]!);
  const hi = Math.round(perM2[perM2.length - 1]!);
  return lo === hi ? String(lo) : "od " + lo + " do " + hi;
}

/** The footprint of each offered tub in m², smallest first — "3,80, 4,41 in 5,29". */
export function tubAreaListText(): string {
  const areas = OFFERED_MODELS.map((m) => (m.mm[0]! / 1000) * (m.mm[1]! / 1000))
    .sort((a, b) => a - b)
    .map((a) => a.toFixed(2).replace(".", ","));
  return areas.slice(0, -1).join(", ") + " in " + areas[areas.length - 1];
}

/**
 * What a single add-on costs, as a range across everything the tubs offer.
 *
 * The cost guide answers "koliko stane masažni bazen" and stopped at the
 * models: a reader who has read that far next wants to know what the options
 * do to the figure, and the honest answer is that they are individually
 * priced and add up on the model's own page. This gives the shape of that
 * without quoting a line item that a supplier price change would falsify.
 */
export function tubAddonRangeText(): string {
  const cents = OFFERED_MODELS.flatMap((m) => m.addons.map(addonPriceCents))
    .filter((c: number) => c > 0)
    .sort((a: number, b: number) => a - b);
  if (cents.length === 0) return "po povpraševanju";
  const lo = cents[0]!;
  const hi = cents[cents.length - 1]!;
  return lo === hi ? formatEur(lo) : "od " + formatEur(lo) + " do " + formatEur(hi);
}

/** Every offered tub's footprint, smallest first — "1,95 × 1,95 m, 2,10 × 2,10 m in …". */
export function tubFootprintListText(): string {
  const list = [...OFFERED_MODELS]
    .sort((a, b) => a.mm[0]! - b.mm[0]!)
    .map(footprint);
  return list.slice(0, -1).join(", ") + " in " + list[list.length - 1];
}

/** The shell height range in centimetres — "82 do 88". */
export function tubHeightRangeText(): string {
  const cm = OFFERED_MODELS.map((m) => Math.round(m.mm[2]! / 10)).sort((a, b) => a - b);
  const lo = cm[0]!;
  const hi = cm[cm.length - 1]!;
  return lo === hi ? String(lo) : lo + " do " + hi;
}

/**
 * How long a 3 kW heater needs to bring the biggest offered tub up from cold,
 * to the nearest hour, ignoring losses.
 *
 * ⚠️ THE ARITHMETIC IS THE POINT, AND IT IS STATED ON THE PAGE. Water is
 * 4,186 kJ per kilogram per kelvin; the volume is filledKg - dryKg, which is
 * the same subtraction /primerjava already publishes; the heater is the 3 kW
 * every offered model carries in its own spec table. Thirty kelvin is the
 * stated span (roughly 5 °C mains in winter to a 35 °C bath), and it is named
 * in the sentence rather than hidden here.
 *
 * IGNORING LOSSES, deliberately and out loud: a covered tub loses heat while
 * it heats, so the real figure is longer. Rounding down to a floor that the
 * physics guarantees is the honest direction to be wrong in — the sentence
 * says "vsaj", and the reader's conclusion (do not let it go cold) only gets
 * stronger with the true number.
 */
export function reheatHoursText(deltaK = 30): string {
  return String(Math.floor(reheatKWh(deltaK) / 3));
}

/** The same calculation's energy figure, rounded — "63". */
export function reheatKWhText(deltaK = 30): string {
  return String(Math.round(reheatKWh(deltaK)));
}

/**
 * Litres held, smallest to largest — "1.200 do 1.800".
 *
 * ⚠️ THE THOUSANDS SEPARATOR IS DONE BY HAND, LIKE catalog/count.ts DOES IT,
 * and not with toLocaleString("sl-SI"). The Workers runtime and the build
 * sandbox do not both carry full ICU: measured here, "sl-SI" returned "1200"
 * with no separator at all, which would have printed a figure on the page in
 * a format this site uses nowhere else — and only on whichever of the two
 * runtimes happened to be missing the data.
 */
export function tubLitreRangeText(): string {
  const l = tubLitres().sort((a, b) => a - b);
  const lo = groupThousands(l[0]!);
  const hi = groupThousands(l[l.length - 1]!);
  return lo === hi ? lo : lo + " do " + hi;
}

/** The biggest offered tub's litres — the volume the reheat figure is for. */
export function tubMaxLitresText(): string {
  const l = tubLitres().sort((a, b) => a - b);
  return groupThousands(l[l.length - 1]!);
}

/** "1800" -> "1.800", the same regex catalog/count.ts uses. */
function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** filledKg - dryKg, per model: the same subtraction /primerjava publishes. */
function tubLitres(): number[] {
  return OFFERED_MODELS.map((m) => m.filledKg - m.dryKg);
}

function reheatKWh(deltaK: number): number {
  const l = tubLitres().sort((a, b) => a - b);
  return (l[l.length - 1]! * 4.186 * deltaK) / 3600;
}
