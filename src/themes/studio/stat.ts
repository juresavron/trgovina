import { esc } from "../../render/sections";

/**
 * Stat values, formatted once for both bands that show them.
 *
 * This existed twice — identical copies in statement.ts and editorial.ts — so
 * the superscript rule and the counting rule could drift apart between the two
 * places a reader sees the same device.
 *
 * Two jobs:
 *
 * 1. A trailing "+" or "%" is set as a superscript, so "800+" reads as a mark
 *    against the numeral rather than as part of it. Units that belong on the
 *    baseline ("230 V", "4,40 m³") are left alone.
 *
 * 2. A leading WHOLE number is wrapped for behaviour.ts to count up when it
 *    scrolls into view — the source's digit odometer. The wrapper carries the
 *    target as data, and the already-correct text as its content, so a page
 *    with no JavaScript shows the final figure and never a zero.
 */

/**
 * Count only a plain whole number. A decimal ("4,40 m³", "≈ 0,25 €") animates
 * badly and reads as a glitch rather than an effect, and a single digit is not
 * worth a second of motion.
 */
function countable(stem: string, rest: string): number | null {
  if (rest.startsWith(",")) return null; // a decimal follows — not a whole number
  const digits = stem.replace(/[.\s]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const n = parseInt(digits, 10);
  return n >= 10 ? n : null;
}

export function statValue(v: string): string {
  const trimmed = v.trim();

  // Split a trailing +/% off first: it is a mark, not part of the number.
  const m = /^(.*?)([+%]+)$/.exec(trimmed);
  const body = m ? (m[1] ?? "") : trimmed;
  const mark = m && m[1] !== "" ? (m[2] ?? "") : "";
  // A bare "+" has nothing to sit above, so keep the original whole.
  const stemSource = m && m[1] === "" ? trimmed : body;

  const numeral = /^(\d[\d.\s]*)(.*)$/s.exec(stemSource);
  let head: string;
  if (numeral) {
    const stem = numeral[1] ?? "";
    const rest = numeral[2] ?? "";
    const target = countable(stem, rest);
    // The stem pattern eats the space after the number into the stem, and the
    // count-up wrapper has to hold digits ALONE — a counter that animates
    // "410 kg" would have to parse the unit back out on every frame. Trimming
    // it there silently deleted the separator: "410 kg" rendered as "410kg",
    // which is not a typo the eye forgives on a spec figure. So the space is
    // cut off the stem and put back OUTSIDE the wrapper, where it belongs.
    const sep = stem.slice(stem.trimEnd().length);
    head = target
      ? '<span data-st-count="' + target + '">' + esc(stem.trim()) + "</span>" +
        esc(sep) + esc(rest)
      : esc(stemSource);
  } else {
    head = esc(stemSource);
  }

  return mark ? head + "<sup>" + esc(mark) + "</sup>" : head;
}
