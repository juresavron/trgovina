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
 * The one thing a hash must be blind to, named rather than assumed.
 *
 * finishes-panel.ts cache-busts each finish image with `?v=` + Date.now(), so
 * /admin/barve renders differently every millisecond. That is correct — a
 * swatch the owner has just re-uploaded must not come back from the browser
 * cache — so the clock is not frozen and the code is not changed. The digits
 * are collapsed here instead, which keeps every other byte of that page under
 * the pin and states in one place what this harness deliberately ignores.
 */
function stable(html: string): string {
  return html.replace(/\?v=\d+/g, "?v=<t>");
}

async function hit(path: string, signedIn = true): Promise<string> {
  const headers: Record<string, string> = {};
  if (signedIn) headers.cookie = SESSION_COOKIE + "=tok";
  const r = await handleAdmin(new Request("https://x.test" + path, { headers }), ENV);
  const text = await r.text();
  return r.status + " " + (r.headers.get("location") ?? "-") + " " + h(stable(text));
}

/** Update ONLY in the commit that changes behaviour, with the diff read. */
const PINNED: Record<string, string> = {
  "/admin": "200 - 7cdc4eda94aeeb95",
  "/admin/barve": "200 - 36b4dd88749283a9",
  "/admin/slike": "200 - a2d45934942dcaff",
  "/admin/povprasevanja": "200 - 7f3e4a7fe6ad9c6c",
  "/admin/mnenja": "200 - b8f3172a58687383",
  "/admin/mnenja/novo": "200 - fd23b9c66ce0f621",
  "/admin/blog": "200 - 9475e10146395321",
  "/admin/blog/nov": "200 - 7edf6e066726b627",
  "/admin/site": "404 - 6a491e0a8a81873f",
  "/admin/bazen/veliki-230": "200 - f92b44af8b5d2f1d",
  "/admin/ni-take-strani": "404 - b503bc07fdba6077",
};

/** The two documents a signed-out request may ever receive. */
const SIGNED_OUT: Record<string, string> = {
  // The same login document either way — only the status differs, and that
  // difference is the whole point.
  front: "0727ee7653278346",
  deep: "0727ee7653278346",
};

describe("every admin surface answers exactly as it did", () => {
  for (const path of SURFACES) {
    it(path + " is unchanged", async () => {
      const got = await hit(path);
      const want = PINNED[path];
      if (want !== undefined) expect(got, path).toBe(want);
      else expect("PIN " + path + " = " + got).toBe("");
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
      const want = path === "/admin" ? "200 - " : "401 - ";
      expect(out.startsWith(want), path + " => " + out).toBe(true);
      expect(out, path + " leaked a surface").toBe(
        want + (SIGNED_OUT[path === "/admin" ? "front" : "deep"] ?? ""),
      );
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
