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

/**
 * A fixed key has to be replaceable, and this is the header that does it.
 *
 * ⚠️ Supabase Storage's POST REFUSES A KEY IT ALREADY HOLDS — 400, "Duplicate".
 * The hero image, the two category images and every other site image live at a
 * fixed path by design, so "upload a new one" means "overwrite this one". It
 * did not: the first upload succeeded and every one after it came back as a
 * bare 500 saying "Napaka na strežniku", with nothing anywhere naming the real
 * reason. The project's request log has it plainly — POST site/hero.webp 200,
 * then 400 on the next attempt twenty-seven seconds later.
 */
suite("replacing an object that is already there", () => {
  const seen: Record<string, string>[] = [];
  function capture(status = 200) {
    seen.length = 0;
    vi.stubGlobal("fetch", async (_u: string, init: RequestInit) => {
      seen.push((init.headers ?? {}) as Record<string, string>);
      return new Response("{}", { status });
    });
  }
  afterEach(() => vi.unstubAllGlobals());

  it("asks for an upsert only when the caller says the key is fixed", async () => {
    const { uploadObject } = await import("./supabase");
    const body = new Uint8Array([1, 2, 3]).buffer;

    capture();
    await uploadObject(API, "site/hero.webp", body, "image/webp", true);
    expect(seen[0]!["x-upsert"]).toBe("true");

    // A product photograph is written under a fresh UUID every time, so a
    // collision would mean key generation had genuinely gone wrong. Upserting
    // everywhere would hide that.
    capture();
    await uploadObject(API, "bazen/x/a--uuid.webp", body, "image/webp");
    expect(seen[0]!["x-upsert"]).toBeUndefined();
  });

  it("still reports a real storage failure rather than swallowing it", async () => {
    const { uploadObject } = await import("./supabase");
    capture(403);
    await expect(
      uploadObject(API, "site/hero.webp", new Uint8Array([1]).buffer, "image/webp", true),
    ).rejects.toThrow(/403/);
  });
});
