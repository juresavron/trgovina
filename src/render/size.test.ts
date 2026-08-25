import { describe, it, expect } from "vitest";
import { BASE_CSS } from "./css";
import { handleRequest } from "../worker";

/**
 * The sheet is inlined into every document's head, so it is render-blocking
 * AND part of the HTML payload — charged twice against the budget in
 * docs/SEO.md §4. It is easy to grow it without noticing: these modules are
 * heavily commented by design, and at one point 43% of what shipped was
 * comments written for us, not for the browser.
 */
describe("the inlined stylesheet stays within budget", () => {
  it("carries no comments to the wire", () => {
    expect(BASE_CSS).not.toContain("/*");
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
  it("stays under the inline-CSS budget on the wire", async () => {
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
    expect(kb, "inline CSS is " + kb.toFixed(1) + " KB brotli").toBeLessThan(20);
  });

  /**
   * A separate, far looser guard on the raw string. It is not a performance
   * budget — it is a runaway detector, for the case where a generator starts
   * emitting duplicate rules and compression hides it because duplicates
   * compress beautifully.
   */
  it("has not grown without anyone noticing", () => {
    const kb = BASE_CSS.length / 1024;
    expect(kb, "raw inline CSS is " + kb.toFixed(1) + " KB").toBeLessThan(160);
  });

  it("still emits the rules that matter after minification", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/?shop=savna&theme=studio", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    const html = await res.text();
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
