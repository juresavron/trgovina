#!/usr/bin/env node
/**
 * Find declarations the browser THROWS AWAY.
 *
 * ⚠️ WHY THIS EXISTS. The steps rows on six pages shipped broken because of
 * one declaration:
 *
 *   grid-template-columns: auto minmax(0, fit-content(14rem)) minmax(0, 38rem)
 *
 * fit-content() is not a permitted argument to minmax(), so the value is
 * invalid and the whole declaration is discarded. Nothing in this repo could
 * see it: TypeScript compiles a template literal, the minifier does not
 * validate, the sheet parses, the rule still MATCHES its element, and Chrome's
 * own devtools protocol still lists it among the matched rules. The only
 * symptom was the used value — two tracks where three were written — and the
 * only reason it was found is that somebody looked at the page and said it
 * looked terrible.
 *
 * A dropped declaration is the worst kind of CSS bug: the rule that "wins" is
 * then some earlier rule nobody was thinking about, so the page is not
 * unstyled, it is styled WRONG, and it looks deliberate.
 *
 * METHOD. Walk the built sheet's own text, and ask the engine about every
 * declaration in it with CSS.supports(property, value). Anything it rejects
 * is a declaration that will not survive being parsed.
 *
 *   node scripts/audit-css-valid.mjs
 *
 * KNOWN LIMITS, stated so nobody trusts this further than it goes:
 *   - Custom properties (--x) accept anything by spec, so they are skipped.
 *   - CSS.supports is the engine's own parser, so this is only as strict as
 *     the browser it runs in. That is the point: it is the same parser that
 *     will discard the declaration in production.
 *   - It cannot see a declaration that is valid but WRONG. Nothing can.
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

/* The sheet is a TypeScript module full of extensionless, directory-style
 * imports, which is a bundler's job to resolve — the same reason preview.mjs
 * bundles rather than importing. wrangler does exactly this on every deploy. */
const bundled = join(tmpdir(), "audit-css-assets.mjs");
execFileSync(
  "node_modules/.bin/esbuild",
  ["src/render/css.ts", "--bundle", "--format=esm", "--platform=node",
   "--log-level=warning", "--outfile=" + bundled],
  { stdio: "inherit" },
);
const { BASE_CSS } = await import(bundled);

/** Split a sheet into { selector, prop, value } without a full CSS parser.
 *  The sheet carries no comments (size.test.ts asserts it) and no braces
 *  inside strings, which is what makes this safe here. */
function declarations(css) {
  const out = [];
  let depth = 0, buf = "", head = "";
  const heads = [];
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === "{") {
      head = buf.trim(); buf = ""; heads.push(head); depth++;
      continue;
    }
    if (c === "}") {
      flush(); heads.pop(); depth--; buf = ""; continue;
    }
    if (c === ";" && depth > 0) { flush(); buf = ""; continue; }
    buf += c;
  }
  function flush() {
    const d = buf.trim();
    if (!d || depth === 0) return;
    // A nested at-rule's prelude is not a declaration.
    if (d.startsWith("@")) return;
    const i = d.indexOf(":");
    if (i < 0) return;
    const prop = d.slice(0, i).trim();
    const value = d.slice(i + 1).trim();
    if (!prop || !value) return;
    out.push({ at: heads.join(" >> "), prop, value });
  }
  return out;
}

const decls = declarations(BASE_CSS);
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
const checked = await page.evaluate((list) => {
  const out = [];
  for (const d of list) {
    // Custom properties accept anything by spec.
    if (d.prop.startsWith("--")) continue;
    // ⚠️ DESCRIPTOR CONTEXTS ARE NOT PROPERTY CONTEXTS. CSS.supports tests a
    // property/value pair, and "src", "unicode-range", "font-display" and a
    // ranged "font-weight: 200 800" are @font-face DESCRIPTORS — valid there,
    // rejected here, and reported as twelve dropped declarations on the first
    // run of this gate. The same applies to @property, @counter-style and
    // @view-transition, whose "navigation: auto" is a descriptor too.
    if (/@(font-face|property|counter-style|page|view-transition)/.test(d.at)) continue;
    // !important is not part of a value's grammar, so it has to come off
    // before the value is offered to the parser.
    const value = d.value.replace(/\s*!important\s*$/, "");
    let ok = false;
    try { ok = CSS.supports(d.prop, value); } catch { ok = false; }
    if (ok) continue;
    // A vendor-prefixed property this engine does not know is not necessarily
    // a mistake — it may be there for another one — so it is reported apart
    // from the values that are simply wrong.
    out.push({ ...d, kind: /^-(webkit|moz|ms|o)-/.test(d.prop) ? "prefix" : "invalid" });
  }
  return out;
}, decls);
const bad = checked.filter((d) => d.kind === "invalid");
const prefixed = checked.filter((d) => d.kind === "prefix");
await browser.close();

console.log("CSS VALIDITY GATE\n");
console.log(decls.length + " declarations checked against the engine's own parser\n");
if (prefixed.length) {
  console.log("vendor-prefixed, unknown to this engine — intentional or dead, a human decides:");
  for (const d of prefixed) console.log("  " + d.prop + ": " + d.value + "   (" + d.at.slice(0, 80) + ")");
  console.log("");
}
if (bad.length === 0) {
  console.log("Every declaration survives parsing.");
  process.exit(0);
}
for (const d of bad) {
  console.log("DROPPED  " + d.prop + ": " + d.value);
  console.log("  in     " + d.at + "\n");
}
console.error(bad.length + " declaration(s) the browser will discard.");
process.exit(1);
