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

/**
 * A mass as Slovenian retail writes it: "1.500 kg", dot for thousands, NBSP
 * before the unit. The spec tables printed raw integers ("1500 kg poln")
 * one screen under editorial copy that wrote "1.500 kilogramov" - two
 * spellings of one number on one page.
 */
/**
 * The water a shell holds, in litres, as the difference between its filled and
 * dry masses.
 *
 * ⚠️ IT IS ARITHMETIC THIS SITE ALREADY PUBLISHES, not a new claim. /primerjava
 * states it outright — "Razlika med prazno in napolnjeno težo je voda… od
 * 1.200 do 1.800 litrov" — and the figures check: 1.500 − 300 = 1.200 and
 * 2.210 − 410 = 1.800, the exact range that page prints. One litre of water is
 * one kilogram, so the subtraction is the conversion.
 *
 * Rounded to the nearest ten, because both inputs are supplier figures given
 * to the nearest ten and a litre count ending in 7 would claim a precision
 * neither of them has.
 */
export function litresText(dryKg: number, filledKg: number): string {
  const l = Math.round((filledKg - dryKg) / 10) * 10;
  return String(l).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "\u00a0litrov";
}

export function kgText(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "\u00a0kg";
}
