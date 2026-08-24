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

  it("stays under the inline-CSS budget", () => {
    const kb = BASE_CSS.length / 1024;
    expect(kb, "inline CSS is " + kb.toFixed(1) + " KB").toBeLessThan(100);
  });

  it("still emits the rules that matter after minification", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/?shop=savna&theme=studio", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    const html = await res.text();
    // A minifier that eats a space inside calc() breaks the declaration
    // silently, so assert the two shapes that depend on one.
    expect(html).toContain("calc(-1 * var(--chrome-h))");
    expect(html).toMatch(/calc\(var\(--studio-container\) \+ var\(--studio-gutter\)/);
    // Combinators must survive. The minifier deliberately leaves the space
    // around ~ and > alone rather than saving two bytes per selector, so this
    // asserts the spaced form — if it ever collapses them, this catches it.
    expect(html).toContain(".st-mq-pause:checked ~ .st-mq-viewport .st-mq-track");
  });
});
