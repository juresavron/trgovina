import { describe, it, expect } from "vitest";
import { BASE_CSS } from "./css";
import { handleRequest } from "../worker";

/**
 * ⚠️ THE SHEET IS LINKED, NOT INLINED, AND THIS COMMENT SAID OTHERWISE. It
 * ships as /assets/site-<hash>.css (render/assets.ts), immutable and cached
 * for the whole visit — no document carries a <style> block; checked on /,
 * /kontakt, /bazen/veliki-230 and /blog. The old note here described the
 * inline sheet the site started with and claimed the bytes were "charged
 * twice", against the HTML payload as well as the wire. They are not.
 *
 * The budget stands anyway, for the half that is still true: this file is
 * render-blocking on the FIRST page of a visit, and a phone parses all of it
 * before it paints anything. What changed is the shape of the cost — once per
 * visit rather than once per page — not whether it is worth holding down. It
 * is easy to grow without noticing: these modules are heavily commented by
 * design, and at one point 43% of what shipped was comments written for us,
 * not for the browser.
 */
describe("the stylesheet stays within budget", () => {
  it("carries no comments to the wire", () => {
    expect(BASE_CSS).not.toContain("/*");
  });

  /**
   * ⚠️ THE SHEET IS A TEMPLATE LITERAL, SO tsc CANNOT SEE A MISSING BRACE.
   *
   * This is not hypothetical. Rewriting the ≤620 wordmark tier dropped the
   * ONE closing brace that ended its @media block, and every check the repo
   * had went on passing: tsc compiled it, 437 tests passed, the CSS file was
   * written and served, and the missing brace was still there in the built
   * bytes because the minifier does not balance either. What actually
   * happened is that Chrome's parser hit the error and DISCARDED THE REST OF
   * THE SHEET — 1008 rules parsed before, 251 after — so .st-hero lost its
   * position:relative, its absolutely-positioned background image fell back
   * to static at its intrinsic 2000px, and the whole site scrolled sideways
   * on every page. It was found by measuring document.scrollWidth in a
   * browser, which is a long way to travel for a typo.
   *
   * Counting braces is crude and it is enough: a sheet with a missing or
   * extra one is broken from that point on, whatever else is true of it.
   * Strings and comments cannot hide a brace here — comments are asserted
   * away above, and this stylesheet contains no braces inside quotes.
   */
  it("has balanced braces, which is what a missing one costs", () => {
    const open = (BASE_CSS.match(/\{/g) ?? []).length;
    const close = (BASE_CSS.match(/\}/g) ?? []).length;
    expect(close, open + " { against " + close + " }").toBe(open);
  });

  /**
   * The budget is on the COMPRESSED size, because that is the number a visitor
   * actually downloads. An earlier version gated the raw string at 100 KB and
   * duly failed at 104.9 KB — while the same sheet compressed to 12.9 KB, a
   * cost nobody would think twice about. Gating raw bytes on a text format the
   * edge always compresses measures the wrong thing and forces the wrong
   * trade-off: it would have had us delete real design to satisfy an
   * arithmetic that has no user on the other end of it.
   *
   * Brotli at quality 11 is what Cloudflare serves for text by default.
   */
  it("stays under the stylesheet budget on the wire", async () => {
    // Dynamic, and typed loosely on purpose: tsconfig targets the Workers
    // runtime and deliberately does not pull in Node's types. This is the one
    // place a test needs a Node built-in, so it borrows it here rather than
    // widening the whole project's type surface.
    // The specifier is built at runtime so TypeScript does not try to resolve
    // it: tsconfig targets the Workers runtime and has no Node types, and a
    // literal "node:zlib" fails typecheck even behind a cast.
    const specifier = "node:" + "zlib";
    const zlib = (await import(/* @vite-ignore */ specifier)) as unknown as {
      brotliCompressSync: (b: Uint8Array, o?: unknown) => { length: number };
      constants: Record<string, number>;
    };
    const bytes = new TextEncoder().encode(BASE_CSS);
    const br = zlib.brotliCompressSync(bytes, {
      params: { [zlib.constants["BROTLI_PARAM_QUALITY"]!]: 11 },
    }).length;
    const kb = br / 1024;
    expect(kb, "the sheet is " + kb.toFixed(1) + " KB brotli").toBeLessThan(20);
  });

  /**
   * THE RUNAWAY, CHECKED DIRECTLY.
   *
   * The raw-byte ceiling below was a PROXY for this: "a generator starts
   * emitting duplicate rules and compression hides it because duplicates
   * compress beautifully". A byte count is a poor proxy — it cannot tell a
   * duplicated rule from a new feature, so it fires on honest growth and
   * stays silent while a small duplication creeps in under the same budget.
   * It fired twice in one evening, once correctly (two rules copied between
   * media queries) and once not (a swatch feature that added real CSS).
   *
   * So the thing it was worried about is now asserted directly, and the
   * ceiling below relaxes into the coarse backstop it always really was.
   */
  it("emits no rule twice", () => {
    const rules = BASE_CSS.match(/[^{}]+\{[^{}]*\}/g) ?? [];
    const seen = new Map<string, number>();
    for (const r of rules) seen.set(r, (seen.get(r) ?? 0) + 1);
    const dupes = [...seen.entries()]
      .filter(([, n]) => n > 1)
      .map(([r, n]) => "x" + n + " " + r.slice(0, 70));
    expect(dupes).toEqual([]);
  });

  /**
   * A coarse backstop on the raw string, now that duplication has its own
   * test above. It is NOT a performance budget — the budget is the brotli
   * figure. This number exists so that a tenfold jump gets a human's
   * attention; move it deliberately when a feature earns it, and never to
   * silence a failure.
   *
   * ⚠️ AND THE COMMENT ABOVE USED TO SAY "17.8 of 20 KB, real room left".
   * It is 18.6 now — 93% of the wire budget — so that reassurance was doing
   * the opposite of its job. The number is not repeated here any more,
   * because a figure in prose goes stale silently while the assertion above
   * it stays true; the brotli test is the one that knows.
   *
   * What earned the last two raises, so the next person can judge whether
   * the trend is features or sprawl: the enquiry form (inputs, textareas,
   * the consent row and two result states — a component the site genuinely
   * did not have) and the sample-book call to action on the product page.
   *
   * WHERE THE HEADROOM IS, when it runs out: ~5 KB raw of .st-rail-*
   * styles a device this shop never renders. It is not dead — the rail is
   * what a shop with no categories shows instead of the category cards, and
   * bazen has categories — so it is a dormant capability of the kernel
   * rather than waste, and removing it is a decision about the network, not
   * a cleanup.
   */
  it("has not grown without anyone noticing", () => {
    const kb = BASE_CSS.length / 1024;
    expect(kb, "the raw sheet is " + kb.toFixed(1) + " KB").toBeLessThan(172);
  });

  it("still emits the rules that matter after minification", async () => {
    // BASE_CSS IS the wire artifact now — the page links it as a file
    // (render/assets.ts) — so the assertions read it directly, and the
    // request below only proves the page actually references it.
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/?shop=savna&theme=studio", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    expect(await res.text()).toMatch(/href="\/assets\/site-[0-9a-f]+\.css"/);
    const html = BASE_CSS;
    // A minifier that eats a space inside calc() breaks the declaration
    // silently, so assert both operator shapes that depend on one: a
    // subtraction and an addition.
    //
    // This used to assert the hero's `calc(100svh - var(--chrome-h))`. The
    // hero is now full-bleed with the bar floating over it, so it no longer
    // subtracts anything and the assertion was testing for a string the
    // design had deliberately removed. Re-pointed at a subtraction that is
    // still there rather than dropped — the operator shape is the point, not
    // which rule happens to carry it.
    expect(html).toContain("calc(100% - 2 * var(--studio-gutter))");
    expect(html).toMatch(/calc\(var\(--studio-container\) \+ 2 \* var\(--studio-gutter\)\)/);
    // Combinators must survive. The minifier deliberately leaves the space
    // around ~ and > alone rather than saving two bytes per selector, so this
    // asserts the spaced form — if it ever collapses them, this catches it.
    expect(html).toContain(".st-mq-pause:checked ~ .st-mq-viewport .st-mq-track");
  });
});
