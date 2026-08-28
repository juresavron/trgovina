/**
 * wrangler.jsonc's `vars`, for the build scripts that need to reach Supabase.
 *
 * ⚠️ THIS EXISTS BECAUSE TWO OF THE THREE SYNC SCRIPTS SILENTLY DID NOTHING
 * FOR THE WHOLE LIFE OF THE PROJECT.
 *
 * The deploy runs three of them before the typecheck — the image index, the
 * reviews, the colour list — and each fails soft, exiting 0 with a line on
 * stderr rather than failing the deploy. sync-media read SUPABASE_URL from
 * the environment OR from wrangler.jsonc. The other two read only the
 * environment, and .github/workflows/deploy.yml sets neither: a repository
 * variable is not injected into a step's env unless the workflow names it.
 *
 * So every deploy took the "SUPABASE_URL and SUPABASE_ANON_KEY are not set —
 * leaving the file as it is" branch, printed it into a log nobody reads, and
 * shipped a green build. The owner uploaded colour swatches, the storefront
 * kept rendering the transcribed chart, and every visible signal said the
 * deploy had worked. Failing soft is right; failing soft on a misconfiguration
 * that can never fix itself is a silent permanent no-op.
 *
 * ⚠️ SCANNED CHARACTER BY CHARACTER, because the obvious version is wrong in
 * a way that looks right: stripping block and line comments with two regexes
 * cuts "https://..." in half at the // inside the string, and the failure is
 * a JSON parse error thirty lines from the cause. So this tracks whether it
 * is inside a string literal and only treats a comment marker as a comment
 * when it is not.
 *
 * Reading the file rather than being handed the values keeps the deploy from
 * restating configuration that already exists in one place — and both values
 * are public by design, which is why they live in vars at all.
 */
import fs from "node:fs";
import path from "node:path";

export function wranglerVars() {
  let src;
  try {
    src = fs.readFileSync(path.join(process.cwd(), "wrangler.jsonc"), "utf8");
  } catch {
    return {};
  }
  let out = "", inStr = false, esc = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      out += c;
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === "/" && src[i + 1] === "/") { while (i < src.length && src[i] !== "\n") i++; out += "\n"; continue; }
    if (c === "/" && src[i + 1] === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i++; continue; }
    out += c;
  }
  // Trailing commas are legal in JSONC and not in JSON.
  out = out.replace(/,(\s*[}\]])/g, "$1");
  try {
    return JSON.parse(out).vars ?? {};
  } catch {
    return {};
  }
}

/**
 * Where the project is and which key opens it, from the environment first and
 * wrangler.jsonc second. The publishable key is enough for every one of these
 * reads — the alternative was the service key in CI, which bypasses every
 * policy in the database, orders and customers included, to read a list of
 * colour names.
 */
export function supabaseConfig() {
  const vars = wranglerVars();
  return {
    url: process.env.SUPABASE_URL || vars.SUPABASE_URL,
    key:
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      vars.SUPABASE_ANON_KEY,
  };
}
