import { describe, expect, it } from "vitest";
import { supabaseConfig, wranglerVars } from "./wrangler-vars.mjs";

/**
 * ⚠️ A REGRESSION TEST FOR A SILENT, PERMANENT NO-OP.
 *
 * The deploy runs three sync scripts before the typecheck — the image index,
 * the reviews, the colour list — and each fails soft, exiting 0 with a line
 * on stderr rather than blocking a release on a database outage. That is the
 * right call for weather. It was the wrong call for a misconfiguration.
 *
 * sync-media read SUPABASE_URL from the environment OR from wrangler.jsonc.
 * sync-reviews and sync-finishes read only the environment, and
 * .github/workflows/deploy.yml sets neither — a repository variable is not
 * injected into a step unless the workflow names it. So on every deploy for
 * the life of the project both took the "not set" branch, printed it into a
 * log nobody reads, and shipped green. The owner uploaded colour swatches and
 * the storefront went on rendering the transcribed chart, with every visible
 * signal saying the deploy had worked.
 *
 * The config lives in wrangler.jsonc, which is committed, so this resolving
 * is not a matter of environment: if it ever stops, the build is broken.
 */
describe("the sync scripts can find Supabase without being handed it", () => {
  it("reads the project URL and the publishable key out of wrangler.jsonc", () => {
    const vars = wranglerVars() as Record<string, string>;
    expect(vars.SUPABASE_URL, "wrangler.jsonc vars.SUPABASE_URL").toMatch(
      /^https:\/\/[a-z0-9]+\.supabase\.co$/,
    );
    expect(vars.SUPABASE_ANON_KEY, "wrangler.jsonc vars.SUPABASE_ANON_KEY")
      .toMatch(/^sb_publishable_/);
  });

  /**
   * The parse is hand-rolled — a JSONC comment stripper written with two
   * regexes cuts "https://…" in half at the // inside the string — so the
   * assertion above is also the test of the scanner.
   */
  it("resolves a complete config with an empty environment", () => {
    const before = {
      url: process.env.SUPABASE_URL,
      anon: process.env.SUPABASE_ANON_KEY,
      pub: process.env.SUPABASE_PUBLISHABLE_KEY,
      svc: process.env.SUPABASE_SERVICE_KEY,
    };
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    try {
      const { url, key } = supabaseConfig();
      expect(url, "no URL means sync-finishes exits before it ever fetches").toBeTruthy();
      expect(key, "no key means sync-finishes exits before it ever fetches").toBeTruthy();
    } finally {
      if (before.url !== undefined) process.env.SUPABASE_URL = before.url;
      if (before.anon !== undefined) process.env.SUPABASE_ANON_KEY = before.anon;
      if (before.pub !== undefined) process.env.SUPABASE_PUBLISHABLE_KEY = before.pub;
      if (before.svc !== undefined) process.env.SUPABASE_SERVICE_KEY = before.svc;
    }
  });

  /** The environment still wins, so a local run can point somewhere else. */
  it("prefers an explicit environment variable", () => {
    const before = process.env.SUPABASE_URL;
    process.env.SUPABASE_URL = "https://example.test";
    try {
      expect(supabaseConfig().url).toBe("https://example.test");
    } finally {
      if (before === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = before;
    }
  });
});
