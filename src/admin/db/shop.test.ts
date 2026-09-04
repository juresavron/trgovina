import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resolveShopChoice, SHOP_COOKIE } from "./shop";
import type { Api } from "../supabase";

/**
 * ⚠️ THE FIRST OF THESE IS A REGRESSION TEST FOR A LIVE OUTAGE.
 *
 * The table-only resolver rendered "your account has access to no shop" on
 * every page of the owner's own panel: public.shops has RLS, its policies do
 * not grant an administrator SELECT, and the empty result was read as "no
 * access" rather than "cannot see this table". Nothing caught it because the
 * route harness stubs fetch and was given a row.
 */
const API = { env: { SUPABASE_URL: "https://db.test", SUPABASE_ANON_KEY: "k" }, token: "t" } as Api;
const ROWS = [
  { id: "bazen", name: "From the table", domain: "a.si", is_live: true },
  { id: "savna", name: "Savne", domain: "b.si", is_live: false },
];

let real: typeof globalThis.fetch;
function serve(rows: unknown) {
  globalThis.fetch = (() =>
    Promise.resolve(new Response(JSON.stringify(rows), {
      status: 200, headers: { "content-type": "application/json" },
    }))) as typeof globalThis.fetch;
}
beforeEach(() => { real = globalThis.fetch; });
afterEach(() => { globalThis.fetch = real; });

const req = (cookie?: string) =>
  new Request("https://x.test/admin", cookie ? { headers: { cookie } } : {});

describe("which shop the panel is pointed at", () => {
  it("falls back to the registry when the table returns nothing", async () => {
    serve([]);
    const c = await resolveShopChoice(req(), API, new URL("https://x.test/admin"));
    expect(c.current, "the panel went dark for the owner over exactly this").not.toBeNull();
    expect(c.all.length).toBeGreaterThan(0);
  });

  it("prefers the table when it answers", async () => {
    serve(ROWS);
    const c = await resolveShopChoice(req(), API, new URL("https://x.test/admin"));
    expect(c.current?.name).toBe("From the table");
    expect(c.all).toHaveLength(2);
  });

  it("honours ?shop= over the cookie", async () => {
    serve(ROWS);
    const c = await resolveShopChoice(
      req(SHOP_COOKIE + "=bazen"), API, new URL("https://x.test/admin?shop=savna"));
    expect(c.current?.id).toBe("savna");
  });

  it("ignores a shop the account may not see, rather than refusing", async () => {
    serve(ROWS);
    const c = await resolveShopChoice(
      req(), API, new URL("https://x.test/admin?shop=nekdo-drug"));
    // Ignored, not 404'd: a refusal would confirm that key names a real shop.
    expect(c.current?.id).toBe("bazen");
  });

  it("ignores a cookie naming a shop that is not in the permitted set", async () => {
    serve(ROWS);
    const c = await resolveShopChoice(
      req(SHOP_COOKIE + "=nekdo-drug"), API, new URL("https://x.test/admin"));
    expect(c.current?.id).toBe("bazen");
  });
});
