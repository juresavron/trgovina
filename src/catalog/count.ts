/**
 * Slovenian counted forms for the two units the catalogue prints beside a
 * numeral, plus the one imperial unit it has to translate.
 *
 * ⚠️ SLOVENIAN NUMERALS HAVE FOUR FORMS — 1 šoba, 2 šobi, 3–4 šobe, 5+ šob
 * — and they attach to the LAST TWO DIGITS matched exactly, never to n % 10:
 * compounds like 22 and 94 take the genitive plural. The card meta line
 * shipped "4 šob" on SWIM 450 by skipping the forms entirely, and the first
 * draft of the fix shipped "94 šobe" by applying them to the units digit.
 */

/**
 * "4 šobe", "37 šob", "94 šob", "1 šoba" — jets, as a card meta line counts
 * them.
 *
 * ⚠️ THE LAST TWO DIGITS, MATCHED EXACTLY — not n % 10. A units-digit rule
 * looks right on small numbers and prints "94 šobe": Slovenian compound
 * numerals (štiriindevetdeset) take the genitive plural, and only a FINAL
 * ena/dve/tri/štiri — 1–4 themselves, 101, 102 — takes the special forms.
 * Same rule counted() in content/bazen.ts states and tests.
 */
export function jetsText(n: number): string {
  const t = n % 100;
  if (t === 1) return n + " šoba";
  if (t === 2) return n + " šobi";
  if (t === 3 || t === 4) return n + " šobe";
  return n + " šob";
}

/**
 * A filter area the supplier states in square feet, written for a buyer who
 * thinks in square metres: "9,3 m² (100 sf)".
 *
 * The conversion is arithmetic (1 sf = 0.092903 m²), not a new claim — and
 * the supplier's own figure stays in the parentheses so the spec can still
 * be checked against the sheet it came from.
 */
export function filterAreaText(sf: number): string {
  const m2 = (sf * 0.092903).toFixed(1).replace(".", ",");
  return m2 + " m² (" + sf + " sf)";
}
