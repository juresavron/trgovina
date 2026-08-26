import { describe, it, expect, afterEach, vi } from "vitest";
import { enhance, enhanceAvailable } from "./enhance";
import type { Env } from "./supabase";

/**
 * The upscaler is the one path in this Worker that leaves the building, and
 * it runs on every upload. So the property that matters is not that it works
 * — it is that it never costs an upload when it does not.
 *
 * Every failure below must come back as null, because null is what makes the
 * caller send the ORIGINAL photograph instead. A throw here would turn a
 * Google outage into an admin panel that cannot accept pictures.
 */

const ENV = { GEMINI_API_KEY: "k", GEMINI_IMAGE_MODEL: "m" } as Env;
const PNG = new Uint8Array([1, 2, 3, 4]).buffer;

function stub(handler: (init: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", async (_u: string, init?: RequestInit) =>
    handler(init ?? {}),
  );
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

/** One base64 pixel, so a success case has something real to decode. */
const B64 = "iVBORw0KGgo=";

afterEach(() => vi.unstubAllGlobals());

describe("the upscaler", () => {
  it("is off entirely without a key", async () => {
    expect(enhanceAvailable({} as Env)).toBe(false);
    expect(enhanceAvailable({ GEMINI_API_KEY: "" } as Env)).toBe(false);
    expect(enhanceAvailable(ENV)).toBe(true);
    // And it does not even reach the network.
    const calls: number[] = [];
    stub(() => { calls.push(1); return json({}); });
    expect(await enhance({} as Env, PNG, "image/png")).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("returns the image the model produced", async () => {
    stub(() => json({ candidates: [{ content: { parts: [
      { text: "here you go" },
      { inlineData: { mimeType: "image/png", data: B64 } },
    ] } }] }));
    const out = await enhance(ENV, PNG, "image/jpeg");
    expect(out?.mime).toBe("image/png");
    expect(out!.bytes.byteLength).toBeGreaterThan(0);
  });

  /** The key goes in a header. In a URL it lands in every log along the way. */
  it("never puts the key in the URL", async () => {
    let seen = "";
    vi.stubGlobal("fetch", async (u: string, init?: RequestInit) => {
      seen = String(u);
      const h = (init?.headers ?? {}) as Record<string, string>;
      expect(h["x-goog-api-key"]).toBe("k");
      return json({ candidates: [] });
    });
    await enhance(ENV, PNG, "image/png");
    expect(seen).not.toContain("k=");
    expect(seen).toContain("/models/m:generateContent");
  });

  /**
   * The response shape is the part I am least sure of — the casing of the
   * inline-data key has differed between API versions — so both spellings are
   * accepted and anything unrecognised degrades to "no enhancement".
   */
  it("accepts either spelling of the inline data", async () => {
    stub(() => json({ candidates: [{ content: { parts: [
      { inline_data: { mime_type: "image/webp", data: B64 } },
    ] } }] }));
    expect((await enhance(ENV, PNG, "image/png"))?.mime).toBe("image/webp");
  });

  it("returns null for every failure rather than throwing", async () => {
    const cases: [string, () => Response | Promise<Response>][] = [
      ["HTTP 500", () => json({ error: "boom" }, 500)],
      ["HTTP 429", () => json({ error: "slow down" }, 429)],
      ["no candidates", () => json({})],
      ["empty candidates", () => json({ candidates: [] })],
      ["text only", () => json({ candidates: [{ content: { parts: [{ text: "no" }] } }] })],
      ["empty data", () => json({ candidates: [{ content: { parts: [{ inlineData: { data: "" } }] } }] })],
      ["not json", () => new Response("<html>", { status: 200 })],
      ["network down", () => { throw new Error("ECONNRESET"); }],
    ];
    for (const [label, handler] of cases) {
      stub(handler);
      await expect(enhance(ENV, PNG, "image/png"), label).resolves.toBeNull();
      vi.unstubAllGlobals();
    }
  });
});
