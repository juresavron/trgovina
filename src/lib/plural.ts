/**
 * Plural agreement, by locale, for a shop network that is not all one language.
 *
 * ⚠️ THIS LIVED IN A THEME MODULE. `sloPlural` was a private function inside
 * src/themes/studio/hero.ts — Slovenian grammar encoded in a rendering
 * component, on a Worker whose whole architecture is one theme serving many
 * shops. A German or Croatian shop rendering through the same theme would have
 * got Slovenian's four-form rule applied to its own numerals, and there was
 * nowhere else to put the right one.
 *
 * The forms are CLDR's plural categories. Slovenian uses four of them and
 * selects on the LAST TWO DIGITS, which is the part everyone gets wrong:
 *
 *   n % 100 == 1        one    1 model, 101 modelov… no: 101 model
 *   n % 100 == 2        two    2 modela  (the dual, which most languages lack)
 *   n % 100 == 3 or 4   few    3 modeli, 4 modeli
 *   everything else     other  5 modelov, 11 modelov, 25 modelov
 *
 * A locale this module does not know falls back to the one/other split that
 * English, German and most of Europe use — correct for them, and visibly
 * wrong-but-harmless rather than silently Slovenian for anything else.
 */

/** The four CLDR categories, in the order a caller supplies them. */
export type PluralForms = readonly [one: string, two: string, few: string, other: string];

/** Which of the four forms a count takes in this locale. */
export function pluralIndex(locale: string, n: number): 0 | 1 | 2 | 3 {
  // The language subtag alone: "sl-SI" and "sl" select the same rule.
  const lang = locale.toLowerCase().split(/[-_]/)[0];
  if (lang === "sl") {
    const t = Math.abs(n) % 100;
    if (t === 1) return 0;
    if (t === 2) return 1;
    if (t === 3 || t === 4) return 2;
    return 3;
  }
  // ⚠️ NOT Intl.PluralRules, deliberately. It is available in Workers and it
  // returns a CATEGORY NAME, which still has to be mapped onto this tuple —
  // and for "sl" it returns "one"/"two"/"few"/"other" exactly as above, so it
  // would buy nothing here while adding a runtime dependency to a hot path
  // that renders on every request. When a shop arrives whose language needs a
  // rule this module does not have, add the rule here and cite CLDR.
  return Math.abs(n) === 1 ? 0 : 3;
}

/** The noun form alone, without the numeral. */
export function pluralForm(locale: string, n: number, forms: PluralForms): string {
  return forms[pluralIndex(locale, n)];
}

/** The count and its agreeing noun — "6 modelov", "2 modela", "1 model". */
export function counted(locale: string, n: number, forms: PluralForms): string {
  return n + " " + pluralForm(locale, n, forms);
}
