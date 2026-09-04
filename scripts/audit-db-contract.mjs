/**
 * EVERY DATABASE OBJECT THE CODE CALLS MUST BE DEFINED IN db/schema.sql.
 *
 * Ported from the chassis repo's designSettingsTriggerGuard, whose argument is
 * the one that matters here: a dependency on a database object is INVISIBLE
 * from the TypeScript. `fetch(url + "/rest/v1/rpc/is_admin")` typechecks
 * whether or not that function exists, every unit test passes because the
 * network is stubbed, and the failure only appears against a database that has
 * not got it. Their words: "the same class of gap that let a theme sit gated
 * in the catalog and ungated in the database for a month while every catalog
 * test passed."
 *
 * ⚠️ THIS REPO HAD FOUR OF THEM WHEN THIS FILE WAS WRITTEN, and they were
 * found by hand rather than by anything. src/ calls public.enquiries,
 * public.finishes, public.is_admin and public.submit_enquiry; db/schema.sql
 * defines none of the four. Production is fine — the objects exist there, put
 * in by migrations that never came back to this file — but the repository can
 * no longer rebuild its own database. A fresh Supabase project made from this
 * schema would have a back office nobody can sign in to (is_admin missing, so
 * currentAdmin() returns null for everyone) and a contact form that accepts an
 * enquiry and drops it.
 *
 * ⚠️ THE KNOWN GAP IS NOT AN EXEMPTION. The chassis repo's audits carry an
 * EXEMPT map where every entry is an argument for why a rule does not apply.
 * Nothing below is that: each one is a missing definition somebody has to go
 * and recover. They are listed so this audit can hold the line against the
 * NEXT one instead of failing forever on these — and printed on every run, so
 * the list cannot quietly become the normal state.
 *
 * TO CLOSE IT: pg_dump --schema-only the live database, or copy the four
 * definitions out of the Supabase SQL editor, and paste them in. Do not write
 * them from memory: is_admin and submit_enquiry are the authorisation boundary
 * and the public write path, and a plausible-looking guess at either is worse
 * than the gap.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SCHEMA = "db/schema.sql";

/** Objects known to be missing, each a debt to repay — see the note above. */
const KNOWN_MISSING = new Map([
  ["enquiries", "table — every enquiry the contact form takes"],
  ["finishes", "table — the colour swatches the panel manages"],
  ["is_admin", "function — THE ADMIN GATE, called by currentAdmin() on every request"],
  ["submit_enquiry", "function — the anon write path; anon has no grant on enquiries itself"],
]);

function walk(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const sources = walk("src").filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

/** What the code asks PostgREST for: /rest/v1/<table> and /rest/v1/rpc/<fn>. */
const wanted = new Map();
for (const file of sources) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/\/rest\/v1\/(rpc\/)?([a-z_]+)/g)) {
    const name = m[2];
    if (name === "rpc") continue;
    if (!wanted.has(name)) wanted.set(name, file);
  }
  // `rest(api, "products?select=...")` — the same call, spelled through a helper.
  for (const m of src.matchAll(/["'`]([a-z_]+)\?select=/g)) {
    if (!wanted.has(m[1])) wanted.set(m[1], file);
  }
}

const schema = readFileSync(SCHEMA, "utf8");
const defined = new Set([
  ...[...schema.matchAll(/^create table (?:if not exists )?public\.([a-z_]+)/gm)].map((m) => m[1]),
  ...[...schema.matchAll(/^create (?:or replace )?function public\.([a-z_]+)/gm)].map((m) => m[1]),
  ...[...schema.matchAll(/^create view public\.([a-z_]+)/gm)].map((m) => m[1]),
]);

const missing = [...wanted].filter(([name]) => !defined.has(name));
const fresh = missing.filter(([name]) => !KNOWN_MISSING.has(name));
const repaid = [...KNOWN_MISSING.keys()].filter((n) => defined.has(n));

if (repaid.length > 0) {
  console.log(
    "these are defined now — delete them from KNOWN_MISSING in this file:\n" +
      repaid.map((n) => "    " + n).join("\n"),
  );
}

if (fresh.length > 0) {
  console.error(
    "The code calls " + fresh.length + " database object(s) that " + SCHEMA +
      " does not define:\n" +
      fresh.map(([n, f]) => "    " + n + "   first seen in " + f).join("\n") +
      "\n\nA dependency on the database is invisible from the TypeScript: this\n" +
      "compiles and every stubbed test passes whether or not the object exists.\n" +
      "Add the definition to " + SCHEMA + " — copied from the live database, not\n" +
      "written from memory.",
  );
  process.exit(1);
}

if (missing.length > 0) {
  console.log(
    "⚠️ " + missing.length + " known-missing definition(s) in " + SCHEMA +
      " — this repository cannot rebuild its own database:\n" +
      missing
        .map(([n]) => "    " + n + "  " + (KNOWN_MISSING.get(n) ?? ""))
        .join("\n") +
      "\n  Recover them with pg_dump --schema-only. See the note in this file.",
  );
}

console.log(
  "db contract: " + wanted.size + " objects called, " +
    (wanted.size - missing.length) + " defined in " + SCHEMA + ".",
);
