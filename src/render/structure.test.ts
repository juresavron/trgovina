import { describe, it, expect } from "vitest";
import { handleRequest } from "../worker";
import { SHOPS } from "../tenants";

/**
 * Structural audit of every rendered page.
 *
 * These are the defects that survive a visual review because they are
 * invisible until someone navigates by keyboard, by screen reader, or on a
 * slow connection — a skipped heading level, a duplicate id that silently
 * breaks a label, an icon button with no name, an image that shoves the page
 * down as it loads. They are also exactly what a polish pass reintroduces,
 * since polish means rewriting markup.
 *
 * Cheap to run, and it fails loudly the moment a device regresses.
 */

function audit(html: string): string[] {
  const problems: string[] = [];
  const body = html.slice(html.indexOf("<body"));

  // Exactly one h1, and no skipped level. Heading structure IS the document
  // outline a screen-reader user navigates by.
  const levels = [...body.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  const h1s = levels.filter((l) => l === 1).length;
  if (h1s !== 1) problems.push("h1 count = " + h1s + " (want exactly 1)");
  for (let i = 1; i < levels.length; i++) {
    if (levels[i]! > levels[i - 1]! + 1) {
      problems.push("heading jumps h" + levels[i - 1] + " -> h" + levels[i]);
    }
  }

  // A duplicate id breaks every id-based affordance at once: label/for,
  // aria-labelledby, aria-describedby, and in-page anchors.
  const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
  const dupes = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
  if (dupes.length) problems.push("duplicate id: " + dupes.join(", "));

  // Anything focusable needs an accessible name. An icon-only control with
  // neither text nor aria-label is announced as "link" and nothing else.
  for (const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = m[1]!;
    const text = m[2]!.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").trim();
    if (!/aria-label(ledby)?=/.test(attrs) && !text) {
      problems.push("link with no accessible name: " + attrs.slice(0, 70));
    }
  }
  for (const m of body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const attrs = m[1]!;
    const text = m[2]!.replace(/<[^>]+>/g, "").trim();
    if (!/aria-label(ledby)?=/.test(attrs) && !text) {
      problems.push("button with no accessible name: " + attrs.slice(0, 70));
    }
  }

  // A positive tabindex reorders the tab sequence away from reading order,
  // which is worse than no tab order at all.
  for (const m of body.matchAll(/tabindex="(\d+)"/g)) {
    if (Number(m[1]) > 0) problems.push("positive tabindex=" + m[1]);
  }

  // Every image reserves its box, or it moves the layout as it decodes —
  // the CLS budget in docs/SEO.md §4 is a gate.
  for (const m of body.matchAll(/<img\b([^>]*)>/g)) {
    const a = m[1]!;
    if (!/\bwidth=/.test(a) || !/\bheight=/.test(a)) {
      problems.push("img without width/height: " + a.slice(0, 70));
    }
    if (!/\balt=/.test(a)) problems.push("img without alt: " + a.slice(0, 70));
  }

  if (!/<main\b/.test(body)) problems.push("no <main> landmark");
  if (!/<header\b/.test(body)) problems.push("no <header> landmark");
  if (!/<footer\b/.test(body)) problems.push("no <footer> landmark");

  // A control with no label is unusable by voice and unclear by screen reader.
  for (const m of body.matchAll(/<input\b([^>]*)>/g)) {
    const a = m[1]!;
    if (/type="(hidden|checkbox|radio)"/.test(a)) continue;
    const id = (a.match(/id="([^"]+)"/) || [])[1];
    const labelled = /aria-label/.test(a) || (!!id && body.includes('for="' + id + '"'));
    if (!labelled) problems.push("input without label: " + a.slice(0, 70));
  }

  return problems;
}

describe("every rendered page is structurally sound", () => {
  const routes = ["/", "/savne", "/kontakt"];
  for (const key of Object.keys(SHOPS)) {
    it(key + " passes the structural audit on every route", async () => {
      const found: string[] = [];
      for (const path of routes) {
        const html = await handleRequest(
          new Request("https://trgovina.worldfans.workers.dev" + path + "?shop=" + key, {
            headers: { host: "trgovina.worldfans.workers.dev" },
          }),
        ).text();
        for (const p of audit(html)) found.push(path + " :: " + p);
      }
      expect([...new Set(found)], key + "\n" + found.join("\n")).toEqual([]);
    });
  }
});
