import { describe, it, expect } from "vitest";
import { handleRequest } from "../worker";

/**
 * Mirrors the exact assertions .github/workflows/deploy.yml makes AFTER it
 * deploys. Those are the last line of defence, which is the problem: a change
 * that breaks one is only discovered once it is already live on the QA host.
 * Running them here moves that discovery into `npm test`, where it costs
 * nothing. Keep the two in step — if the workflow's greps change, change these.
 */
describe("deploy smoke assertions hold locally", () => {
  const get = (path: string) =>
    handleRequest(new Request("https://trgovina.worldfans.workers.dev" + path, {
      headers: { host: "trgovina.worldfans.workers.dev" },
    }));

  it("home is 200 and names the bazen shop", async () => {
    const r = get("/");
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("Masažni bazen");
  });

  it("home sends x-robots-tag noindex", () => {
    expect(get("/").headers.get("x-robots-tag")).toMatch(/noindex/i);
  });

  it("an unknown ?shop override falls back rather than 500ing", async () => {
    // The switcher used to prove itself by naming a second shop. With one
    // shop there is no second name to check, so what is worth asserting is
    // the failure mode the override always had: a key that is not in SHOPS
    // must resolve to the dev shop, not throw.
    const r = get("/?shop=kad");
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("Masažni bazen");
  });

  it("robots.txt is closed", async () => {
    expect(await get("/robots.txt").text()).toContain("Disallow: /");
  });

  /**
   * These four were the drift that made this file worth writing and then went
   * missing from it.
   *
   * The workflow asserted the Google Fonts query string, and kept asserting it
   * after the faces were vendored into public/fonts — so it tested for exactly
   * what the change had removed. `npm test` stayed green through all of it,
   * because the assertions that broke were the ones this mirror never carried.
   * A mirror with holes in it is worse than no mirror: it reports that the
   * post-deploy checks pass locally when it has not run half of them.
   */
  it("serves the studio theme", async () => {
    expect(await get("/").text()).toContain('data-theme="studio"');
  });

  it("preloads the self-hosted display face and declares its @font-face", async () => {
    const html = await get("/").text();
    expect(html).toContain("/fonts/chivo-500-latin.woff2");
    expect(html).toContain("@font-face");
  });

  it("reaches no third-party font origin", async () => {
    const html = await get("/").text();
    for (const origin of ["fonts.googleapis.com", "fonts.gstatic.com", "fontshare"]) {
      expect(html, origin + " is back in the shipped page").not.toContain(origin);
    }
  });

  /** Slovenian renders as Slovenian, not as escapes or tofu. */
  it("renders Slovenian diacritics", async () => {
    expect(await get("/").text()).toContain("montaža");
  });

  /** Faces dropped because their Slovenian coverage could not be proven. */
  it("ships neither unverified face", async () => {
    const html = await get("/").text();
    expect(html).not.toContain("Clash Display");
    expect(html).not.toContain("Satoshi");
  });
});
