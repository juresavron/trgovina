import { describe, it, expect } from "vitest";
import { handleRequest } from "../../worker";
import { SHOPS } from "../../tenants";
import { dotBind } from "../../render/sections";
import { CONTENT } from "../../content";
import type { PdpContent } from "../../content/types";
import { STUDIO_CSS } from ".";
import { STUDIO_TOKENS } from "./tokens";
import { STUDIO_CHROME_CSS } from "./chrome";
import { STUDIO_HERO_CSS } from "./hero";
import { STUDIO_COMMERCE_CSS } from "./commerce";
import { STUDIO_STATEMENT_CSS } from "./statement";
import { STUDIO_EDITORIAL_CSS } from "./editorial";
import { STUDIO_PDP_CSS } from "./pdp";
import { STUDIO_EFFECTS_CSS } from "./effects";
import { STUDIO_JS } from "./behaviour";
import { OWN_PHOTOS } from "./media";

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
  const render = (key: string, path = "/") => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev" + path + (path.includes("?") ? "&" : "?") + "shop=" + key + "&theme=studio", {
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

  /** The stylesheet is a linked, content-addressed asset (render/assets.ts)
   * — resolve it off the page the way a browser would. */
  const sheetOf = async (html: string): Promise<string> => {
    const m = html.match(/href="(\/assets\/site-[0-9a-f]+\.css)"/);
    expect(m, "page links no stylesheet asset").toBeTruthy();
    // ⚠️ "bazen", NOT "savna". This passed "savna" — a shop deleted a year
    // ago — and passed, because the QA host ignored ?shop= entirely and
    // rendered the development shop whatever key it was handed. The override
    // is honoured again (see resolveShop), so a stale key would now render a
    // 404 for a shop that does not exist.
    return await render("bazen", m![1]!).text();
  };

  it("ships verified faces from a single origin", async () => {
    const html = await render("bazen").text();
    // CSS comments never reach the wire (minify strips them), so the sheet is
    // exactly what renders.
    const sheet = await sheetOf(html);

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

  /**
   * The behaviour layer is progressive enhancement, and the whole contract is
   * that the page works before it runs. So the hooks must be in the SSR HTML
   * (not added by script), the script must be a module (deferred by
   * definition, so it never blocks paint), and each counter must already show
   * its final value — a counter that ships a zero and fills it in later is a
   * broken page for anyone whose JS never arrives.
   */
  it("ships behaviour hooks in the server-rendered HTML", async () => {
    // ⚠️ THE PDP, NOT THE HOME PAGE — and this assertion has a confession to
    // make. It used to check the home page and pass, because the behaviour
    // script was INLINED and its own source mentions every hook name: the
    // test was reading selectors out of the script it was supposed to be
    // proving the markup satisfies. Externalizing the script exposed it —
    // the home page has no slider (a shop with categories renders the static
    // rail). The gallery hooks genuinely live on the product page.
    // Same stale key, and the path is derived from the shop rather than typed
    // so this cannot drift into asserting gallery hooks on a 404.
    const html = await render(
      "bazen",
      SHOPS["bazen"]!.routeSlugs["/product"] + "/" + CONTENT["bazen"]!.pdp.slug,
    ).text();
    expect(html).toContain("data-st-slider");
    expect(html).toContain("data-st-scroll");
    expect(html).toContain("data-st-addons");
    expect(html).toMatch(/<script type="module" src="\/assets\/site-[0-9a-f]+\.js">/);
    // Never a blocking classic script.
    expect(html).not.toMatch(/<script(?![^>]*type="(module|application\/ld\+json)")/);
  });

  it("counters carry their final value as text, not just as data", async () => {
    const html = await render("bazen").text();
    const m = [...html.matchAll(/data-st-count="(\d+)"[^>]*>([^<]+)</g)];
    expect(m.length).toBeGreaterThan(0);
    for (const [, target, shown] of m) {
      const digits = (shown ?? "").replace(/[^\d]/g, "");
      expect(digits, "counter shows " + shown + " but targets " + target).toBe(target);
    }
  });

  /**
   * The shipped script is comment-stripped by a deliberately naive regex. That
   * is safe only while this file has no regex literal and no string containing
   * "//", and nothing about the source enforces that — so the result is parsed
   * here. A stripper that mangles the script would otherwise ship a page whose
   * every interaction is dead, with no other test noticing.
   */
  it("the shipped script parses and carries no block comments", () => {
    expect(STUDIO_JS).not.toContain("/*");
    expect(() => new Function(STUDIO_JS)).not.toThrow();
    // The strip must not have eaten the code itself.
    expect(STUDIO_JS).toContain("data-st-slider");
    expect(STUDIO_JS).toContain("IntersectionObserver");
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

/**
 * No empty placeholder boxes on a page of a shop that owns photography.
 *
 * The placeholders are real elements with a background and a shadow, drawn
 * where a picture belongs: .st-photo-mass, .st-imp-mass, .st-tst-disc-mass.
 * Every one of them was written before the shop had photographs, each behind
 * its own "until the photography exists" fallback, and each of those
 * fallbacks was left wired up after the photography arrived. Nothing failed —
 * the page rendered a grey box and looked finished. One of them, 449x320,
 * sat across the middle of the wordmark and turned MASAŽNI BAZEN into
 * MASAŽ▯EN.
 *
 * A grey box is the hardest kind of missing picture to notice, so this is a
 * test rather than a code review: while OWN_PHOTOS has anything in it, no
 * rendered page may contain one.
 */
describe("no placeholder masses survive the photography", () => {
  const MASSES = ["st-photo-mass", "st-imp-mass", "st-imp-floor", "st-tst-disc-mass", "st-tst-disc-floor"];
  const PAGES = ["/", "/masazni-bazeni", "/swim-spa", "/trgovina", "/bazen/veliki-230", "/bazen/swim-580-maxi"];

  for (const path of PAGES) {
    it("renders " + path + " with no empty picture box", async () => {
      const res = handleRequest(
        new Request("https://trgovina.workers.dev" + path + "?shop=bazen", {
          headers: { host: "trgovina.workers.dev" },
        }),
      );
      expect(res.status).toBe(200);
      const html = await res.text();
      // Guard the guard: the rule only holds while there ARE photographs, and
      // a test that passes because the page rendered nothing is worse than no
      // test. Every one of these pages must be showing real pictures.
      expect(OWN_PHOTOS.length, "no photography — the rule below is vacuous").toBeGreaterThan(0);
      expect(html, path + " serves no photograph").toContain('src="/media/');
      for (const mass of MASSES) {
        expect(html.includes('class="' + mass), path + " still paints " + mass).toBe(false);
      }
    });
  }
});

/**
 * The family comparison table says only what the product pages already say.
 *
 * Two properties, and both are load-bearing rather than cosmetic:
 *
 *  1. EVERY VALUE IS A PDP'S OWN. The table is built from PdpContent.spec, so
 *     a figure that appears here but not on the model's page would mean the
 *     renderer had started editing the shop's document — the exact failure a
 *     specification table makes invisible, because a plausible wrong number
 *     looks like a right one.
 *  2. NO PRICES. A price under a model name in a table is the same claim the
 *     card above makes, minus the "z DDV" qualifier and, while prices are
 *     provisional, minus the sentence that says the figure is not final.
 *     Directive 98/6/EC wants the selling price shown unambiguously; the
 *     cards do that and this table must not restate it worse.
 */
describe("the collection comparison table", () => {
  const get = async (path: string) => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev" + path + "?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    expect(res.status).toBe(200);
    return await res.text();
  };

  for (const path of ["/masazni-bazeni", "/swim-spa"]) {
    it("renders on " + path + " with every value taken from a product page", async () => {
      const html = await get(path);
      const table = html.slice(html.indexOf('class="st-cmp"'));
      expect(table, path + " renders no comparison table").toContain("st-cmp-table");

      const content = CONTENT["bazen"]!;
      const col = (content.collections ?? []).find((c) => c.path === path)!;
      const specs = col.products.map(
        (p) => (content.pdps ?? [content.pdp]).find((d) => d.slug === p.slug)!,
      );
      // Every label and every value on the page, in the shop's own words.
      for (const d of specs) {
        expect(table, "the table omits " + d.title).toContain(d.title);
        for (const [label, value] of d.spec) {
          expect(table, d.title + " is missing " + label).toContain(label);
          // The emit binds each middot to its preceding token (dotBind), so
          // the table carries the value with NBSP-bound separators — same
          // words, one wrap rule.
          expect(table, d.title + " is missing the value for " + label).toContain(dotBind(value));
        }
      }
      // And nothing else: no price in any cell.
      const cells = [...table.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((m) => m[1]!);
      expect(cells.length).toBeGreaterThan(0);
      for (const cell of cells) {
        expect(cell, "a comparison cell carries a price: " + cell).not.toMatch(/€/);
      }
    });
  }

  /**
   * The guard, not the happy path: a family whose models were written to
   * different spec templates must render NOTHING rather than a table that
   * lines one model's "Filter" up under another's "Filtracija".
   *
   * Driven through the renderer directly — the router has no seam for a
   * doctored catalogue, and the point of the test is the catalogue.
   */
  it("renders nothing when the models' spec labels disagree", async () => {
    const { renderStudioCollection } = await import("./commerce");
    const content = CONTENT["bazen"]!;
    const col = (content.collections ?? [])[0]!;
    const shop = SHOPS["bazen"]!;
    const ctx = (pdps: PdpContent[]) => ({
      shop,
      content: { ...content, pdps },
      pdp: content.pdp,
      q: "",
      phoneHref: "tel:+38600000000",
      phoneDisplay: "+386 00 000 000",
    });

    // Sanity: the real catalogue does produce a table, or the negative below
    // would pass for the wrong reason.
    expect(renderStudioCollection(ctx(content.pdps ?? [content.pdp]), col)).toContain("st-cmp-table");

    // One model's first spec label renamed — nothing else touched.
    const skewed = (content.pdps ?? [content.pdp]).map((d) =>
      d.slug === col.products[1]?.slug
        ? {
            ...d,
            spec: d.spec.map(
              ([k, v], i) => [i === 0 ? k + " (drugace)" : k, v] as [string, string],
            ),
          }
        : d,
    );
    expect(renderStudioCollection(ctx(skewed), col)).not.toContain("st-cmp-table");

    // And a model with no product page of its own.
    const missing = (content.pdps ?? [content.pdp]).filter((d) => d.slug !== col.products[0]?.slug);
    expect(renderStudioCollection(ctx(missing), col)).not.toContain("st-cmp-table");
  });
});

/**
 * A shop that cannot take an order never offers a basket.
 *
 * This is a promise test, not a styling one. The storefront's primary control
 * used to read "V košarico" and the header carried a basket with a count,
 * while /kosarica answered "spletno naročanje še ni odprto" — so the biggest
 * control on a €2,890 page took a visitor who had just decided and told them
 * no. Nothing in the rendered HTML may make that offer while ordersOnline is
 * false, and the enquiry that replaces it must actually go somewhere.
 */
describe("no basket where there is nothing to fill", () => {
  const PAGES = ["/", "/trgovina", "/masazni-bazeni", "/bazen/veliki-230", "/bazen/swim-580-maxi"];
  const shop = SHOPS["bazen"]!;

  for (const path of PAGES) {
    it("offers no cart control on " + path, async () => {
      // The rule is only meaningful while this shop takes orders off-site.
      expect(shop.ordersOnline, "ordersOnline is true — this test is vacuous").toBe(false);
      const res = handleRequest(
        new Request("https://trgovina.workers.dev" + path + "?shop=bazen", {
          headers: { host: "trgovina.workers.dev" },
        }),
      );
      expect(res.status).toBe(200);
      const html = await res.text();
      // No link into the cart, and no quantity control for a purchase that
      // cannot happen.
      expect(html, path + " still links to the cart").not.toContain('href="/kosarica');
      expect(html, path + " still counts units").not.toContain('name="qty"');
      expect(html, path + " still says V košarico").not.toContain("V košarico");
    });
  }

  it("puts a reachable enquiry in the product page's place", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/bazen/veliki-230?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    const html = await res.text();
    expect(html).toContain("Povprašajte za ponudbo");
    // And it says what happens next, before the click rather than after it.
    expect(html).toContain("Naročila sprejemamo po telefonu in e-pošti.");
    expect(html).toContain('href="' + shop.routeSlugs["/contact"]);
  });
});

/**
 * A STEPS BLOCK IS A RULED TABLE ON DESKTOP, SO IT MUST HAVE THE WIDE TRACK.
 *
 * This has now been reported three times and fixed twice at the wrong layer,
 * because the two halves of it live in different files and neither one looks
 * wrong on its own. page.ts sizes .st-page-step as three tracks — a counter
 * disc, a 14rem title column and a 38rem paragraph column, ~940px in all —
 * above 1000px. isWide() decides whether the block those tracks live in gets
 * the wide track or the 38rem every prose block is capped to.
 *
 * With steps NOT wide, the block is 608px and the three tracks are sized down
 * to fit it: measured in Chromium on /dostava-in-montaza, the paragraph came
 * out 284px at 1440 and 294px at 1200 — under forty characters a line, on a
 * desktop, inside a body track that was 902px wide and had the room. It does
 * not get better on a bigger screen, which is why it kept being sent back.
 *
 * tsc cannot see that relation and neither can a screenshot taken of the
 * closed page. This can: if somebody strikes steps off isWide again — the
 * note there argues Q&A's case, which is a good argument about a different
 * block — this fails and says why.
 */
describe("a steps block claims the wide track", () => {
  it("marks every steps block --wide", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/dostava-in-montaza?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    // The page under test really does carry one, or this asserts nothing.
    expect(html, "no steps rendered — this test is vacuous").toContain("st-page-steps");
    for (const m of html.matchAll(/<div class="(st-page-block[^"]*)">(?:(?!<\/div>).)*?st-page-steps/gs)) {
      expect(m[1], "a steps block rendered without the wide track").toContain(
        "st-page-block--wide",
      );
    }
  });
});

/**
 * THE PANEL BODIES RUN THE BAND'S FULL WIDTH, WHICH IS ONLY RIGHT WHILE THEY
 * ARE SHORT.
 *
 * .st-pdp-panel-b p carries no max-inline-size: at 1440 that is a 1360px line
 * and at 1920 a 1560px one, roughly 167 and 191 rendered characters. That is
 * far past the 75-character ceiling for running text — and it is the right
 * call here only because the longest body on the site is 267 characters, so
 * the block is TWO lines and the reader makes one return sweep. The measured
 * set when this was decided: 183 / 131 / 165 / 50 on the swim spas and
 * 267 / 133 / 215 / 50 on the hot tubs.
 *
 * A 900-character body would be six lines at that width and genuinely hard to
 * read, and the CSS cannot tell the difference. This can. 320 leaves room to
 * write — about 20% above today's longest — and fails before anything reaches
 * a length the layout cannot carry. If a panel really needs more than that,
 * the measure has to come back with it.
 */
describe("the product page's panels stay short enough to run full width", () => {
  const SLUGS = ["mali-195", "srednji-210", "veliki-230", "swim-450", "swim-580-hidro", "swim-580-maxi"];
  const LIMIT = 320;

  for (const slug of SLUGS) {
    it("keeps every panel body under " + LIMIT + " characters on " + slug, async () => {
      const res = handleRequest(
        new Request("https://trgovina.workers.dev/bazen/" + slug + "?shop=bazen", {
          headers: { host: "trgovina.workers.dev" },
        }),
      );
      expect(res.status).toBe(200);
      const html = await res.text();
      const bodies = [
        ...html.matchAll(
          /<h3 class="st-pdp-panel-h">([^<]*)<\/h3><\/summary><div class="st-pdp-panel-b"><p>(.*?)<\/p>/gs,
        ),
      ];
      // If the markup shape changes this must be updated, not silently pass.
      expect(bodies.length, slug + ": no prose panels matched — the selector is stale").toBeGreaterThan(0);
      for (const m of bodies) {
        const text = m[2]!.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ");
        expect(
          text.length,
          slug + ' — panel "' + m[1] + '" is ' + text.length +
            " characters; at the band's full width that is more than two lines. " +
            "Either shorten it or give .st-pdp-panel-b p its measure back.",
        ).toBeLessThanOrEqual(LIMIT);
      }
    });
  }
});
