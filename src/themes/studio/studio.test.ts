import { describe, it, expect } from "vitest";
import { handleRequest } from "../../worker";
import { SHOPS } from "../../tenants";
import { STUDIO_CSS } from ".";

/**
 * The studio theme was transcribed from a source stylesheet, and the token
 * vocabulary was renamed wholesale in the process. The failure that costs the
 * most is silent: a var() pointing at a token that no longer exists resolves
 * to nothing, so the declaration is dropped and the element renders unstyled
 * rather than erroring. Typecheck cannot see it — the CSS is a string.
 *
 * So this asserts the sheet is self-consistent on a real rendered page.
 */
describe("studio renders a self-consistent sheet", () => {
  const render = (key: string) => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/?shop=" + key + "&theme=studio", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    return res;
  };

  for (const key of Object.keys(SHOPS)) {
    it("renders " + key + " with no undeclared custom properties", async () => {
      const res = render(key);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('data-theme="studio"');

      const used = new Set([...html.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
      const declared = new Set([...html.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
      const missing = [...used].filter((v) => !declared.has(v));
      expect(missing, "undeclared: " + missing.join(", ")).toEqual([]);
    });
  }

  it("ships the transcribed faces, not the measured ones", async () => {
    const html = await render("savna").text();
    expect(html).toContain("Clash Display");
    expect(html).toContain("Satoshi");
    expect(html).toContain("api.fontshare.com");
    // Bricolage Grotesque and Fragment Mono are declared in the source's font
    // block but used zero times in its stylesheet. Loading them would cost
    // real LCP for faces that never paint.
    expect(html).not.toContain("Bricolage");
    expect(html).not.toContain("Fragment Mono");
  });

  // Scoped to studio's own sheet, not the rendered page: --stretch and
  // --track-display are the shared kernel's, and zarja/lednik/salon still need
  // them for Archivo and Fraunces. Asserting against the whole document would
  // fail on those themes' legitimate declarations.
  it("studio's sheet carries no retired token name", () => {
    for (const dead of ["--track-display", "--stretch", "--studio-band", "--photo-warm", "--on-invert-soft"]) {
      expect(STUDIO_CSS, dead + " survived the migration").not.toContain(dead);
    }
  });
});
