import { describe as suite, it, expect, afterEach, vi } from "vitest";
import { deleteObject, type Api } from "./supabase";

/**
 * Removing an object that is already gone is a success, not a failure.
 *
 * ⚠️ AND SUPABASE STORAGE DOES NOT SPELL "GONE" AS 404. It answers a key it
 * does not hold with HTTP 400, carrying {"statusCode":"404","error":"Not
 * Found"} in the body. deleteObject tolerated the STATUS and nothing else, so
 * a missing object threw, the delete handler 500ed, and the panel told the
 * operator "Napaka na strežniku" — after the database row had already gone,
 * which meant the photograph really had vanished from the shop.
 *
 * The reason a key went missing is fixed elsewhere (storedPaths, in routes).
 * This is the belt: whatever the reason, an object that is not there is the
 * state the caller wanted.
 */

const API = { env: { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "k" }, token: "t" } as Api;

function stub(res: Response) {
  vi.stubGlobal("fetch", async () => res.clone());
}
afterEach(() => vi.unstubAllGlobals());

suite("deleting a stored object", () => {
  it("is happy when the object was removed", async () => {
    stub(new Response("{}", { status: 200 }));
    await expect(deleteObject(API, "a/b.webp")).resolves.toBeUndefined();
  });

  it("is happy when the object was never there — 404 by status", async () => {
    stub(new Response("Not Found", { status: 404 }));
    await expect(deleteObject(API, "a/b.webp")).resolves.toBeUndefined();
  });

  it("is happy when the object was never there — 404 in the body of a 400", async () => {
    // Verbatim shape of what the live project answers. This is the case that
    // produced the bug report.
    stub(new Response('{"statusCode":"404","error":"Not Found","message":"Object not found"}', { status: 400 }));
    await expect(deleteObject(API, "a/b.webp")).resolves.toBeUndefined();
  });

  it("still throws on a refusal, which is a different thing entirely", async () => {
    // A 403 means the policy said no. Swallowing that would leave objects in
    // the bucket while the panel reported the photograph deleted.
    stub(new Response('{"error":"Unauthorized"}', { status: 403 }));
    await expect(deleteObject(API, "a/b.webp")).rejects.toThrow(/403/);
    stub(new Response('{"error":"Payload too large"}', { status: 400 }));
    await expect(deleteObject(API, "a/b.webp")).rejects.toThrow(/400/);
    stub(new Response("boom", { status: 500 }));
    await expect(deleteObject(API, "a/b.webp")).rejects.toThrow(/500/);
  });
});
