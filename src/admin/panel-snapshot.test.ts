import { describe, expect, it } from "vitest";
import {
  indexPage, loginPage, modelPage, noticeHtml, notConfiguredPage,
  notFoundPage, photoCount, shell, siteImagePage, sitePage,
  type MediaView, type ModelLink, type SiteSlot,
} from "./panel";

/**
 * THE PANEL'S OUTPUT, PINNED BY HASH.
 *
 * ⚠️ THIS EXISTS TO MAKE A REFACTOR PROVABLE, NOT TO DESCRIBE THE DESIGN.
 * panel.ts is 2,491 lines holding the admin's shell, its stylesheet, five
 * pages and a client script, and routes.ts is one 1,146-line function
 * dispatching every surface. Splitting those apart is a large mechanical
 * move, and the thing a mechanical move must prove is that it moved nothing
 * else. Per-element assertions cannot do that — they check what somebody
 * thought to check, and a refactor breaks what nobody did.
 *
 * A hash over the whole document checks every byte, including the ones no
 * assertion names: a stray space in the stylesheet, a reordered attribute, a
 * dropped hidden field. If a hash moves and the change was meant, read the
 * diff, satisfy yourself, and update the constant in the same commit that
 * caused it — never in a commit of its own, because a hash updated on its own
 * is a hash nobody checked.
 *
 * Inputs are fixed here rather than fetched: these builders are pure, and a
 * snapshot that reaches a database is a snapshot that fails on a Tuesday.
 */
const MODELS: ModelLink[] = [
  { shop: "bazen", slug: "veliki-230", name: "BAZEN 230", count: 4, cover: "/media/a.webp" },
  { shop: "bazen", slug: "swim-580-maxi", name: "SWIM 580 MAXI", count: 0 },
];
const SITE: SiteSlot[] = [
  { stem: "hero", label: "Naslovna", note: "Široka fotografija", src: "/media/hero.webp", group: "Domov" },
  { stem: "salon", label: "Salon", note: "", src: "", group: "O nas" },
];
const MEDIA: MediaView[] = [
  { id: "m1", url: "/media/a.webp", alt: "Bazen na terasi", sort: 0, widths: [640, 1280], enhanced: true, shot: "hero" },
  { id: "m2", url: "/media/b.webp", alt: "", sort: 1, widths: [], shot: null },
];

/**
 * A 64-bit FNV-1a, written out rather than imported.
 *
 * node:crypto would be one line, but tsconfig.json gives this project the
 * WebWorker lib and no @types/node — deliberately, so that Worker code cannot
 * reach for a Node API that will not exist at the edge. A test is compiled
 * under the same tsconfig, so it lives under the same rule. Two 32-bit lanes
 * because one is short enough that an accidental collision is imaginable, and
 * a snapshot that silently agrees is worse than no snapshot.
 */
function h(str: string): string {
  let a = 0x811c9dc5;
  let b = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ ((c << 5) | (c >>> 3)), 0x85ebca6b) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

const PAGES: [string, () => string][] = [
  ["shell", () => shell("Naslov", "<p>telo</p>", "kdo@example.com", "slike")],
  ["login", () => loginPage()],
  ["login+error", () => loginPage("Napačno geslo.")],
  ["notFound", () => notFoundPage("Ni tega.", "kdo@example.com")],
  ["notConfigured", () => notConfiguredPage(["SUPABASE_URL", "SUPABASE_ANON_KEY"])],
  ["index", () => indexPage("bazen", "kdo@example.com", MODELS, undefined, SITE)],
  ["site", () => sitePage("bazen", "kdo@example.com", SITE)],
  ["siteImage", () => siteImagePage("hero", "Naslovna", "Široka", "/media/hero.webp",
    { kind: "ok", text: "Shranjeno." }, "kdo@example.com", [16, 9])],
  ["model", () => modelPage("bazen", "veliki-230", "BAZEN 230", MEDIA,
    { kind: "err", text: "Ni šlo." }, "kdo@example.com")],
  ["notice-ok", () => noticeHtml({ kind: "ok", text: "Shranjeno." })],
  // Empty on purpose: no notice, no markup. Pinned so that stays true — a
  // refactor that starts emitting an empty <div> here would put a gap in
  // every page that has nothing to say.
  ["notice-none", () => noticeHtml()],
];

/** Update ONLY in the commit that changes the markup, with the diff read. */
const PINNED: Record<string, string> = {
  "shell": "118b82874b25aeed",
  "login": "83236f40447c7343",
  "login+error": "e4c7643279baaea1",
  "notFound": "4b820de180c2f15a",
  "notConfigured": "b9579ea62eab1333",
  "index": "a2aa5b68b56f5fcb",
  "site": "7356f27277c8866b",
  "siteImage": "24c3b9776f16c539",
  "model": "0d6528b0b1cb3355",
  "notice-ok": "62cdcb0ec5a9fa57",
  "notice-none": "811c9dc501000193",
};

describe("the admin panel renders exactly what it rendered", () => {
  for (const [name, build] of PAGES) {
    it(name + " is unchanged", () => {
      const html = build();
      if (name !== "notice-none") {
        expect(html.length, name + " rendered nothing").toBeGreaterThan(0);
      }
      const got = h(html);
      const want = PINNED[name];
      if (want !== undefined) expect(got, name).toBe(want);
      else expect("PIN " + name + " = " + got).toBe("");
    });
  }

  it("plural agreement survives any move", () => {
    expect([0, 1, 2, 3, 5, 101, 102].map(photoCount)).toEqual([
      "brez fotografij", "1 fotografija", "2 fotografiji", "3 fotografije",
      "5 fotografij", "101 fotografija", "102 fotografiji",
    ]);
  });
});
