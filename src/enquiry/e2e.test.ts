/**
 * AN ENQUIRY, FROM THE FORM BODY TO THE DATABASE CALL.
 *
 * submit.ts is split so that parseEnquiry() is pure and testable without a
 * network, and it is well covered. What nothing covered was the JOIN: that a
 * real form body, posted at the real route, through the real worker, actually
 * reaches submit_enquiry with the fields that function expects. On a shop that
 * takes no orders online, the enquiry IS the transaction — an enquiry that
 * does not arrive is a sale that does not happen, and it fails silently on
 * both ends: the visitor sees a confirmation, the shop sees an empty list.
 *
 * ⚠️ THE STUB RETURNS `new Response(null, ...)`, NOT `new Response("", ...)`.
 * A 204 may not carry a body and Node throws on the second form — which
 * submitEnquiry's own try/catch then correctly reports as a failure, so the
 * test failed while the code was right. Worth stating because it cost a
 * diagnosis: the first version of this file "proved" the enquiry was broken.
 *
 * The two refusals are here for the same reason as the happy path. Consent is
 * a legal gate and the honeypot is the only spam defence on a public form; a
 * regression in either is invisible until it matters.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import worker from "../worker";
import { SHOPS } from "../tenants";
import type { Env } from "../admin/supabase";
const H = SHOPS["bazen"]!.domain;
const ENV = { SUPABASE_URL: "https://db.test", SUPABASE_ANON_KEY: "anon-key" } as Env;
let real: typeof globalThis.fetch;
let calls: { url: string; body: unknown }[] = [];
beforeEach(() => {
  calls = [];
  real = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
    return Promise.resolve(new Response(null, { status: 204 }));
  }) as typeof globalThis.fetch;
});
afterEach(() => { globalThis.fetch = real; });

const post = (fields: Record<string, string>) =>
  worker.fetch(new Request("https://" + H + "/kontakt", {
    method: "POST",
    headers: { host: H, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  }), ENV);

const GOOD = {
  ime: "Janez Novak", eposta: "janez@example.si", telefon: "041 123 456",
  kraj: "Ljubljana", kanal: "telefon", sporocilo: "Zanima me BAZEN 230.",
  dostop: "Terasa v prvem nadstropju.", soglasje: "da", website: "",
};

describe("an enquiry, end to end", () => {
  it("a filled form reaches the database", async () => {
    const r = await post(GOOD);
    const rpc = calls.find((c) => c.url.includes("rpc/submit_enquiry"));
    expect(rpc, "no RPC was made").toBeTruthy();
    expect(r.status, "should be a 303, Post/Redirect/Get").toBe(303);
  });

  it("no consent is refused, and nothing is written", async () => {
    const { soglasje, ...rest } = GOOD;
    void soglasje;
    const r = await post(rest);
    expect(calls.some((c) => c.url.includes("submit_enquiry")), "wrote without consent").toBe(false);
    expect(r.status).toBe(200);
  });

  it("the honeypot is refused, and nothing is written", async () => {
    const r = await post({ ...GOOD, website: "https://spam.example" });
    expect(calls.some((c) => c.url.includes("submit_enquiry")), "wrote a bot's form").toBe(false);
    expect([200, 303]).toContain(r.status);
  });
});
