import { describe, expect, it } from "vitest";
import { SHOPS } from "./index";
import { CONTENT } from "../content";
import { handleRequest } from "../worker";

/**
 * WHAT MUST NOT BE SHARED BETWEEN TWO SHOPS.
 *
 * docs/SEO.md §6 states the doctrine and names the risk in its first line:
 * "Ten single-keyword shops from one owner is a pattern Google explicitly
 * polices (doorway/site-network). The defense is genuine differentiation."
 * Then it lists what is never shared — copy, photography, product data,
 * guides, social profiles, review pools — and forbids cross-linking.
 *
 * ⚠️ ALL OF THAT WAS PROSE. tenancy.test.ts gates that two shops do not
 * collide (same host, same descriptor, missing routes); nothing gated that two
 * shops are DIFFERENT. A second shop could ship with the first one's sentences
 * under its own domain and every existing test would pass, which is precisely
 * the doorway pattern the document opens by warning about.
 *
 * ⚠️ WHAT THIS DOES NOT PRETEND TO HIDE. Shared code, one Cloudflare account,
 * one IP and one asset filename are all discoverable and none of them is a
 * ranking signal — Google does not penalise shared hosting or a shared
 * stylesheet. What it acts on is duplicate and templated content, thin
 * doorway pages, and link schemes. So this file gates those three, and does
 * not chase footprints that cost real work and buy nothing.
 *
 * With one shop most of these are vacuous. They are written against every
 * PAIR, so they start working the day a second shop is registered — which is
 * the only day they could ever have been written cheaply.
 */

const KEYS = Object.keys(SHOPS);
const PAIRS = KEYS.flatMap((a, i) => KEYS.slice(i + 1).map((b) => [a, b] as const));

/** Sentences long enough that sharing one is authorship, not coincidence. */
function sentences(text: string): string[] {
  return text
    .split(/[.!?…]\s+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.split(" ").length >= 8);
}

/**
 * The shop's own content object, flattened — every string it would render.
 *
 * ⚠️ JOINED ON A FULL STOP, AND IT USED TO BE A SPACE. Every string in the
 * object went into one run: block `kind` values, headings, hrefs and prose
 * alike. sentences() then split that run on sentence punctuation, so it
 * manufactured sentences that span fields and that no page renders — the
 * second shop's first run reported
 * "imprint Prodajalec prose Za koga veljajo ti pogoji Za vse nakupe pri nas"
 * as shared copy, which is three block boundaries and a heading.
 *
 * It cuts both ways: a fabricated match sends somebody rewriting a page that
 * is fine, and a real shared sentence sitting at the end of one field is
 * swallowed into a frankenstein that matches nothing. Joining on a terminator
 * keeps every field its own sentence.
 *
 * Legal pages are excluded, and that is a separate rule with its own note —
 * see the assertion below.
 */
function prose(key: string, opts: { legal: boolean } = { legal: false }): string {
  const seen: string[] = [];
  const walk = (v: unknown): void => {
    if (typeof v === "string") seen.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      // A page that states rights is skipped whole — see the note on the
      // shared-sentence assertion for why the law may be identical.
      if (!opts.legal && (v as { legal?: boolean }).legal === true) return;
      Object.values(v).forEach(walk);
    }
  };
  walk(CONTENT[key]);
  return seen.join(". ");
}

/** The shared-sentence rule, as a function, so it can be tested on two shops. */
export function sharedSentences(a: string, b: string): string[] {
  const inB = new Set(sentences(b));
  return sentences(a).filter((s) => inB.has(s));
}

/**
 * ⚠️ THE PAIR TESTS BELOW ARE VACUOUS WITH ONE SHOP, so these run the same
 * predicates against a synthesised second one.
 *
 * A rule that cannot fail today is a rule nobody will notice is broken on the
 * day it matters — and the day it matters is the day somebody adds a shop by
 * copying this one's content file, which is exactly how the doorway pattern
 * gets built by accident. Twice today a test in this repository passed because
 * its assertion could not fail. Not a third time.
 */
describe("the rules bite", () => {
  const A = "Pred nakupom pridemo pogledat lokacijo in izmerimo dostop do terase. " +
    "Bazen pripeljemo, priklopimo in zaženemo.";

  it("catches a sentence carried from one shop to another", () => {
    const B = "Nekaj čisto drugega. " + A;
    expect(sharedSentences(A, B).length).toBeGreaterThan(0);
  });

  it("does not fire on two shops that merely write about the same trade", () => {
    const B = "Pred montažo si ogledamo prostor in preverimo nosilnost tal. " +
      "Savno dostavimo, sestavimo in priklopimo.";
    expect(sharedSentences(A, B)).toEqual([]);
  });

  it("ignores fragments too short to be authorship", () => {
    // "Dostava po vsej Sloveniji." is a fact two shops may both state.
    expect(sharedSentences("Dostava po vsej Sloveniji.", "Dostava po vsej Sloveniji.")).toEqual([]);
  });

  it("catches a review pool shared between two shops", () => {
    const pool = [{ q: "Odlična storitev od ogleda do zagona, priporočam vsem." }];
    const seen = new Map<string, string>();
    const clash: string[] = [];
    for (const [key, rs] of [["a", pool], ["b", pool]] as const) {
      for (const r of rs) {
        const taken = seen.get(r.q);
        if (taken) clash.push(taken + "/" + key);
        seen.set(r.q, key);
      }
    }
    expect(clash).toEqual(["a/b"]);
  });
});

describe("two shops read as two companies", () => {
  it.each(PAIRS.length > 0 ? PAIRS : [["bazen", "bazen"] as const])(
    "%s and %s share no sentence",
    (a, b) => {
      if (a === b) return; // one shop: nothing to compare
      const shared = sharedSentences(prose(a), prose(b));
      expect(shared.slice(0, 3), a + " and " + b + " ship the same sentences").toEqual([]);
    },
  );

  it("no shop links to another shop's domain", async () => {
    const domains = new Map(KEYS.map((k) => [SHOPS[k]!.domain, k]));
    for (const key of KEYS) {
      const shop = SHOPS[key]!;
      const html = await handleRequest(
        new Request("https://" + shop.domain + "/", { headers: { host: shop.domain } }),
      ).text();
      for (const m of html.matchAll(/https?:\/\/([^/"']+)/g)) {
        const other = domains.get(m[1]!.replace(/^www\./, ""));
        // ⚠️ A LINK, A CANONICAL OR A sameAs POINTING AT A SIBLING is the
        // "shared 'our brands' footer" SEO.md forbids — the thing that turns
        // separate specialists into a network somebody can see.
        expect(other === undefined || other === key,
          key + " names sibling shop " + other + " in its markup").toBe(true);
      }
    }
  });

  it("no two shops share a head term", () => {
    const seen = new Map<string, string>();
    for (const key of KEYS) {
      const term = SHOPS[key]!.keyword.plural.toLowerCase();
      const taken = seen.get(term);
      expect(taken, "shops " + taken + " and " + key + " chase the same term").toBeUndefined();
      seen.set(term, key);
    }
  });

  it("no two shops share a review", () => {
    // Review pools are named in SEO.md's never-shared list, and a quote that
    // appears under two companies is false about at least one of them.
    const seen = new Map<string, string>();
    for (const key of KEYS) {
      for (const r of CONTENT[key]?.reviews ?? []) {
        const taken = seen.get(r.q);
        expect(taken, "a review appears under both " + taken + " and " + key).toBeUndefined();
        seen.set(r.q, key);
      }
    }
  });
});
