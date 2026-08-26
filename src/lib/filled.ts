/**
 * Whether a shop's identity fields have actually been filled in.
 *
 * ⚠️ ONE HOME, BECAUSE THE THIRD COPY PUBLISHED A PLACEHOLDER TO GOOGLE.
 *
 * These four predicates existed twice — once in content/pages.ts behind the
 * launch gate, once restated in themes/studio/page.ts with a comment saying a
 * theme reaching for another module's private helper would be the worse
 * coupling. That was a reasonable call while there were two. There were
 * three: render/page.ts's organizationJsonLd had no predicate at all and
 * emitted whatever the config held, so every page on the site shipped
 *
 *   "telephone": "+386 00 000 000",
 *   "streetAddress": "TODO",
 *   "postalCode": "0000",
 *   "addressLocality": "TODO"
 *
 * as structured data — a machine-readable assertion, to a search engine, that
 * the business is at TODO. The same codebase already refuses to publish an
 * Offer whose price nobody set, and a Review nobody wrote, for exactly this
 * reason; identity was the one it was not applying the rule to.
 *
 * So the predicates live here, one copy, and everything that publishes a
 * company fact consults them.
 */

/** Anything still carrying the word TODO, or nothing at all, is unset. */
export const isSet = (v: string): boolean => v.trim() !== "" && !v.includes("TODO");

/** A VAT id is unset while every digit in it is a zero. */
export const isSetVat = (v: string): boolean =>
  isSet(v) && v.replace(/[^0-9]/g, "").replace(/0/g, "") !== "";

/** A postcode is unset while every digit is a zero. */
export const isSetZip = (v: string): boolean =>
  isSet(v) && v.replace(/[^0-9]/g, "").replace(/0/g, "") !== "";

/**
 * A phone number is unset while the subscriber part is all zeros. The country
 * code is stripped first so "+386 00 000 000" cannot be rescued by its 386.
 */
export const isSetPhone = (v: string): boolean =>
  isSet(v) && v.replace(/[^0-9]/g, "").replace(/^386/, "").replace(/0/g, "") !== "";
