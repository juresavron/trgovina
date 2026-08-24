import { describe, it, expect } from "vitest";
import { handleRequest } from "../../worker";
import { SHOPS } from "../../tenants";
import { STUDIO_CSS } from ".";
import { STUDIO_TOKENS } from "./tokens";
import { STUDIO_CHROME_CSS } from "./chrome";
import { STUDIO_HERO_CSS } from "./hero";
import { STUDIO_COMMERCE_CSS } from "./commerce";
import { STUDIO_STATEMENT_CSS } from "./statement";
import { STUDIO_EDITORIAL_CSS } from "./editorial";
import { STUDIO_PDP_CSS } from "./pdp";
import { STUDIO_EFFECTS_CSS } from "./effects";

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

  it("ships verified faces from a single origin", async () => {
    const html = await render("savna").text();
    // CSS comments are part of the emitted sheet, and they discuss the faces
    // we replaced. Assert against what actually renders, not the prose.
    const sheet = html.replace(/\/\*[\s\S]*?\*\//g, "");

    expect(sheet).toContain("Chivo");
    expect(sheet).toContain("Plus Jakarta Sans");
    // One font origin, and no face whose Slovenian coverage we could not prove.
    expect(sheet).not.toContain("fontshare");
    expect(sheet).not.toContain("Clash Display");
    expect(sheet).not.toContain("Satoshi");
    // Bricolage Grotesque and Fragment Mono are declared in the source's font
    // block but used zero times in its stylesheet. Loading them would cost
    // real LCP for faces that never paint.
    expect(sheet).not.toContain("Bricolage");
    expect(sheet).not.toContain("Fragment Mono");
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

  /**
   * tokens.ts calls itself the single declaration site, and the reason is in
   * its own history: three modules each declared --studio-gutter at equal
   * specificity, so whichever landed last in the concatenated sheet silently
   * won for the whole storefront. A comment cannot enforce that. This can.
   *
   * A module may declare its own tokens (--studio-pdp-box and friends); what
   * it may not do is redeclare one tokens.ts owns.
   */
  it("no module redeclares a token that tokens.ts owns", () => {
    const owned = new Set(STUDIO_TOKENS.match(/--[a-z0-9-]+(?=\s*:)/g) ?? []);
    expect(owned.size).toBeGreaterThan(50);

    const modules: Array<[string, string]> = [
      ["chrome", STUDIO_CHROME_CSS],
      ["hero", STUDIO_HERO_CSS],
      ["commerce", STUDIO_COMMERCE_CSS],
      ["statement", STUDIO_STATEMENT_CSS],
      ["editorial", STUDIO_EDITORIAL_CSS],
      ["pdp", STUDIO_PDP_CSS],
      ["effects", STUDIO_EFFECTS_CSS],
    ];

    // Comments discuss tokens constantly ("--ink-body, not --ink-mute: 8.1:1
    // on the panel"), and that colon reads as a declaration. Strip them first.
    const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

    const collisions: string[] = [];
    for (const [name, css] of modules) {
      for (const m of strip(css).matchAll(/(--[a-z0-9-]+)\s*:\s*[^;]+;/g)) {
        const tok = m[1];
        if (tok && owned.has(tok)) collisions.push(name + " redeclares " + tok);
      }
    }
    expect(collisions, collisions.join("\n")).toEqual([]);
  });
});
