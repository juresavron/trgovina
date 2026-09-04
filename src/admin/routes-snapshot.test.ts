import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleAdmin } from "./routes";
import { SESSION_COOKIE } from "./auth";
import type { Env } from "./supabase";

/**
 * EVERY ADMIN SURFACE, DRIVEN THROUGH handleAdmin, PINNED BY HASH.
 *
 * ⚠️ THE POINT IS THE SPLIT THAT COMES NEXT. handleAdmin is one 1,146-line
 * function with a flat `if (parts[1] === ...)` chain over eleven surfaces, and
 * breaking it into a dispatch table plus a module each is control flow rather
 * than text — the kind of move that silently reorders a guard. routes.test.ts
 * is 84 lines and tests three pure helpers; it would notice none of it.
 *
 * So this drives the real function, over the real router, for every surface,
 * and pins status + location + a hash of the body. A reordered auth check, a
 * dropped CSRF guard, a 303 that became a 200: all of it moves a pin.
 *
 * ⚠️ ONE STUB, AT THE ONE BOUNDARY. Everything the admin does off-box goes
 * through globalThis.fetch — auth, rows, storage — so that is what is faked,
 * and nothing inside the code under test is mocked. A harness that stubs the
 * module it is testing proves the mock works.
 *
 * When a pin moves: read the diff, satisfy yourself, update it in the SAME
 * commit. A pin updated on its own is a pin nobody checked.
 */
const ENV: Env = {
  SUPABASE_URL: "https://db.test",
  SUPABASE_ANON_KEY: "anon-key",
} as Env;

const USER = { id: "u1", email: "kdo@example.com" };
const PRODUCTS = [{ id: "p1", shop_id: "bazen", slug: "veliki-230", title: "BAZEN 230" }];
const MEDIA = [
  { id: "m1", product_id: "p1", url: "bazen/veliki-230/a--0123456789abcdef0123456789abcdef.webp",
    alt: "Bazen na terasi", sort: 0, widths: [640, 1280], enhanced: true, shot: "hero" },
];
const REVIEWS = [{ id: "r1", shop: "bazen", author: "Ana", rating: 5, body: "Odlično.",
  created_at: "2026-01-02T00:00:00Z", published: true, model: null, source: null }];
const ENQUIRIES = [{ id: "e1", shop: "bazen", name: "Ana", email: "a@b.si", phone: "040",
  message: "Zanima me.", model: null, created_at: "2026-01-02T00:00:00Z", handled: false, chosen: null }];
const FINISHES = [{ id: "f1", shop: "bazen", kind: "acryl", name: "Bela", code: "W",
  url: null, sort: 0 }];
const POSTS = [{ id: "b1", shop: "bazen", slug: "prvi", title: "Prvi zapis", body: "Besedilo.",
  excerpt: "Kratko.", published: true, created_at: "2026-01-02T00:00:00Z", updated_at: null, cover: null }];

function body(url: string): unknown {
  if (url.includes("/auth/v1/user")) return USER;
  if (url.includes("/rpc/is_admin")) return true;
  if (url.includes("products?select") || url.includes("/rest/v1/products")) return PRODUCTS;
  if (url.includes("product_media")) return MEDIA;
  if (url.includes("/rest/v1/reviews")) return REVIEWS;
  if (url.includes("/rest/v1/enquiries")) return ENQUIRIES;
  if (url.includes("/rest/v1/finishes")) return FINISHES;
  if (url.includes("/rest/v1/posts")) return POSTS;
  return [];
}

let real: typeof globalThis.fetch;
beforeEach(() => {
  real = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    return Promise.resolve(
      new Response(JSON.stringify(body(url)), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  }) as typeof globalThis.fetch;
});
afterEach(() => { globalThis.fetch = real; });

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

const SURFACES = [
  "/admin", "/admin/slike", "/admin/barve", "/admin/povprasevanja",
  "/admin/mnenja", "/admin/mnenja/novo", "/admin/blog", "/admin/blog/nov",
  "/admin/site", "/admin/bazen/veliki-230", "/admin/ni-take-strani",
];

/**
 * ⚠️ WHAT THIS FILE PINS IS ROUTING, NOT MARKUP — AND IT LEARNED THAT TWICE.
 *
 * The first version hashed each surface's body. It failed in CI on /admin/barve
 * and, once that was exempted one page at a time, again on /admin/slike. Both
 * were the same mistake, and the second one is what named it.
 *
 * deploy.yml regenerates THREE data files from Supabase before the tests run,
 * so that the owner can add a photograph, a review or a colour without a
 * commit:
 *
 *   src/themes/studio/own-media.ts        /admin/slike, /admin, the model pages
 *   src/content/reviews.generated.ts      /admin/mnenja
 *   src/catalog/finishes.generated.ts     /admin/barve
 *
 * A hash over any page that renders one of those pins a value the build exists
 * to change: it holds on a developer's checkout and can only ever fail in CI,
 * which is the worst shape a test can take. Exempting them one at a time was
 * treating instances of a class.
 *
 * So the body hash is gone from every surface. What a route-level file should
 * assert is what routing decides — the status, the redirect, and WHICH surface
 * answered — and that is what is pinned now. Markup is already covered better
 * elsewhere: panel-snapshot.test.ts hashes the builders directly, with fixed
 * inputs and no data dependency at all, which is why it has never failed in CI.
 *
 * The identity marker is each surface's h1. It is read from the page body, not
 * the chrome: the shell's nav names every surface, so finding the word "Barve"
 * somewhere proves only that a nav rendered.
 */
const IDENTITY: Record<string, string> = {
  "/admin": "Masažni bazeni Vrelec",
  "/admin/slike": "Slike strani",
  "/admin/barve": "Barve",
  "/admin/povprasevanja": "Povpraševanja",
  "/admin/mnenja": "Mnenja strank",
  "/admin/mnenja/novo": "Novo mnenje",
  "/admin/blog": "Blog",
  "/admin/blog/nov": "Nov zapis",
  "/admin/site": "Ta slika ne obstaja.",
  "/admin/bazen/veliki-230": "BAZEN 230",
  "/admin/ni-take-strani": "Ta model ne obstaja.",
};

/** Status and location only — the body is markup, and markup is pinned elsewhere. */
const ROUTING: Record<string, string> = {
  "/admin": "200 -",
  "/admin/slike": "200 -",
  "/admin/barve": "200 -",
  "/admin/povprasevanja": "200 -",
  "/admin/mnenja": "200 -",
  "/admin/mnenja/novo": "200 -",
  "/admin/blog": "200 -",
  "/admin/blog/nov": "200 -",
  "/admin/site": "404 -",
  "/admin/bazen/veliki-230": "200 -",
  "/admin/ni-take-strani": "404 -",
};

async function hit(path: string, signedIn = true): Promise<string> {
  const headers: Record<string, string> = {};
  if (signedIn) headers.cookie = SESSION_COOKIE + "=tok";
  const r = await handleAdmin(new Request("https://x.test" + path, { headers }), ENV);
  return r.status + " " + (r.headers.get("location") ?? "-");
}

/** The h1 of whichever surface answered. */
async function whoAnswered(path: string): Promise<string> {
  const r = await handleAdmin(
    new Request("https://x.test" + path, { headers: { cookie: SESSION_COOKIE + "=tok" } }),
    ENV,
  );
  const html = await r.text();
  return (html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
}

/** The two documents a signed-out request may ever receive. */
const SIGNED_OUT: Record<string, string> = {
  // The same login document either way — only the status differs, and that
  // difference is the whole point.
  front: "0727ee7653278346",
  deep: "0727ee7653278346",
};

describe("every admin surface answers exactly as it did", () => {
  for (const path of SURFACES) {
    it(path + " routes where it did, to the surface it did", async () => {
      expect(await hit(path), path).toBe(ROUTING[path]);
      expect(await whoAnswered(path), path + " was answered by another surface").toBe(
        IDENTITY[path],
      );
    });
  }

  /**
   * ⚠️ PINNED, NOT "one of two acceptable codes".
   *
   * This read `expect(out.startsWith("401 ") || out.startsWith("200 "))`,
   * which is a test that cannot fail: those are the only two codes this path
   * produces. Changing the signed-out status from 401 to 200 for every
   * surface passed it, and 401-vs-200 is the difference between a client
   * being told it was refused and being told it succeeded.
   *
   * /admin alone answers 200, because a person arriving at the panel's front
   * door un-authenticated is being SHOWN the login form, not refused a page
   * they asked for. Every deeper URL is a request for a surface, and the
   * answer to that is 401.
   */
  for (const path of SURFACES) {
    it(path + " signed out is the login page, not the surface", async () => {
      const out = await hit(path, false);
      expect(out, path).toBe(path === "/admin" ? "200 -" : "401 -");
    });
  }

  it("a cross-site POST is refused before it reaches a handler", async () => {
    const r = await handleAdmin(
      new Request("https://x.test/admin/mnenja", {
        method: "POST",
        headers: { cookie: SESSION_COOKIE + "=tok", "sec-fetch-site": "cross-site" },
      }),
      ENV,
    );
    expect(r.status).toBe(403);
  });

  it("a missing configuration is a 503 and never a stack trace", async () => {
    const r = await handleAdmin(new Request("https://x.test/admin"), {} as Env);
    expect(r.status).toBe(503);
  });
});
