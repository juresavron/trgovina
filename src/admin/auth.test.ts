import { describe, it, expect, afterEach, vi } from "vitest";
import {
  SESSION_TTL_SECONDS,
  currentAdmin,
  readCookie,
  sessionCookie,
  signIn,
} from "./auth";
import type { Env } from "./supabase";

/**
 * The admin panel holds the service-role key, which bypasses every RLS policy
 * in the database. What stands between the open internet and that key is now
 * two questions rather than one — is this a real Supabase account, and is that
 * account on the allowlist — so both are written down as tests rather than
 * trusted to a reading of the code.
 *
 * The second question is the one worth being paranoid about. ANYONE CAN CREATE
 * AN ACCOUNT on a Supabase project: sign-up is a public endpoint. A gate that
 * only checked "is this token valid" would therefore admit the entire internet
 * while looking exactly like a login.
 */

const ANON = "sb_publishable_test";
const SERVICE = "sb_secret_test";
const ENV = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: ANON,
  SUPABASE_SERVICE_KEY: SERVICE,
} as Env;

const USER = { id: "11111111-1111-1111-1111-111111111111", email: "kdo@example.test" };

interface Call {
  url: string;
  headers: Record<string, string>;
  body: string;
}

/**
 * Answer each Supabase endpoint with a canned status, and record what was
 * asked. Nothing here reaches the network: the tests are about which request
 * is made and what is done with the answer.
 */
function stubFetch(routes: {
  token?: { status: number; body: unknown };
  user?: { status: number; body: unknown };
  admins?: { status: number; body: unknown };
}): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", async (input: string, init?: RequestInit) => {
    const url = String(input);
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries((init?.headers ?? {}) as Record<string, string>)) {
      headers[k.toLowerCase()] = v;
    }
    calls.push({ url, headers, body: String(init?.body ?? "") });

    const r = url.includes("/auth/v1/token")
      ? routes.token
      : url.includes("/auth/v1/user")
        ? routes.user
        : url.includes("/rest/v1/admins")
          ? routes.admins
          : undefined;
    if (!r) throw new Error("unexpected request: " + url);
    return new Response(JSON.stringify(r.body), {
      status: r.status,
      headers: { "content-type": "application/json" },
    });
  });
  return calls;
}

function signedIn(token: string): Request {
  return new Request("https://x.test/admin", { headers: { cookie: "st_admin=" + token } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("admin sign-in", () => {
  it("returns the access token Supabase issued", async () => {
    stubFetch({ token: { status: 200, body: { access_token: "tok-123" } } });
    expect(await signIn(ENV, "kdo@example.test", "geslo")).toBe("tok-123");
  });

  /**
   * Wrong password, unknown address, unconfirmed account and rate limited all
   * come back as null. The route renders one message for all of them, and this
   * is the half of that promise that lives in the code rather than the copy.
   */
  it("returns null for every failure, without saying which", async () => {
    for (const status of [400, 401, 422, 429]) {
      stubFetch({ token: { status, body: { error: "whatever it was" } } });
      expect(await signIn(ENV, "kdo@example.test", "x"), String(status)).toBeNull();
      vi.unstubAllGlobals();
    }
  });

  it("returns null when the response carries no token", async () => {
    stubFetch({ token: { status: 200, body: { user: { id: "x" } } } });
    expect(await signIn(ENV, "kdo@example.test", "geslo")).toBeNull();
  });

  /**
   * The PUBLISHABLE key, not the service key. Sending the service key here
   * would work, which is exactly why it is worth pinning: the login path must
   * stay usable with a key that is public by design, or the panel quietly
   * grows a second dependency on the one real secret.
   */
  it("signs in with the publishable key", async () => {
    const calls = stubFetch({ token: { status: 200, body: { access_token: "t" } } });
    await signIn(ENV, "kdo@example.test", "geslo");
    expect(calls[0]!.headers["apikey"]).toBe(ANON);
    expect(calls[0]!.headers["apikey"]).not.toBe(SERVICE);
    expect(calls[0]!.url).toContain("grant_type=password");
    expect(JSON.parse(calls[0]!.body)).toEqual({
      email: "kdo@example.test",
      password: "geslo",
    });
  });
});

describe("the /admin gate", () => {
  it("admits an account that is signed in and on the allowlist", async () => {
    stubFetch({
      user: { status: 200, body: USER },
      admins: { status: 200, body: [{ user_id: USER.id }] },
    });
    expect(await currentAdmin(signedIn("tok"), ENV)).toEqual(USER);
  });

  /**
   * THE ONE THAT MATTERS. Sign-up is public, so a valid token proves only that
   * somebody made an account. If this ever passes, the panel is open to anyone
   * who can fill in a registration form.
   */
  it("refuses a valid account that nobody added", async () => {
    stubFetch({
      user: { status: 200, body: USER },
      admins: { status: 200, body: [] },
    });
    expect(await currentAdmin(signedIn("tok"), ENV)).toBeNull();
  });

  it("refuses a token Supabase no longer accepts", async () => {
    stubFetch({ user: { status: 401, body: { message: "invalid" } } });
    expect(await currentAdmin(signedIn("expired"), ENV)).toBeNull();
  });

  it("refuses a request with no cookie, without asking Supabase anything", async () => {
    const calls = stubFetch({});
    expect(await currentAdmin(new Request("https://x.test/admin"), ENV)).toBeNull();
    expect(calls).toHaveLength(0);
  });

  /**
   * The allowlist must be asked about THIS user. A query that fetched the
   * table and checked it was non-empty would admit every signed-in account the
   * moment one admin existed — a bug that passes every other test here.
   */
  it("asks the allowlist about the signed-in user specifically", async () => {
    const calls = stubFetch({
      user: { status: 200, body: USER },
      admins: { status: 200, body: [{ user_id: USER.id }] },
    });
    await currentAdmin(signedIn("tok"), ENV);
    const admins = calls.find((c) => c.url.includes("/rest/v1/admins"))!;
    expect(admins.url).toContain("user_id=eq." + USER.id);
  });

  /**
   * public.admins has RLS enabled and no policies at all, so the publishable
   * key reads it as an empty table — which fails CLOSED (nobody gets in) and
   * would therefore look like a mysterious lockout rather than a hole. Pin the
   * service key anyway: the failure it prevents is the one where a policy is
   * added later and the browser-safe key starts returning rows.
   */
  it("reads the allowlist with the service key", async () => {
    const calls = stubFetch({
      user: { status: 200, body: USER },
      admins: { status: 200, body: [{ user_id: USER.id }] },
    });
    await currentAdmin(signedIn("tok"), ENV);
    const admins = calls.find((c) => c.url.includes("/rest/v1/admins"))!;
    expect(admins.headers["apikey"]).toBe(SERVICE);
    expect(admins.headers["authorization"]).toBe("Bearer " + SERVICE);
  });

  it("refuses when the allowlist cannot be read at all", async () => {
    stubFetch({
      user: { status: 200, body: USER },
      admins: { status: 500, body: { message: "down" } },
    });
    expect(await currentAdmin(signedIn("tok"), ENV)).toBeNull();
  });
});

describe("the session cookie", () => {
  /**
   * HttpOnly keeps script out of the access token, Secure keeps it off
   * plaintext, Strict is the CSRF defence that lets the write routes be plain
   * POSTs, and the /admin path keeps it off every storefront request.
   */
  it("sets every flag it depends on", () => {
    const c = sessionCookie("v", 100);
    expect(c).toContain("HttpOnly");
    expect(c).toContain("Secure");
    expect(c).toContain("SameSite=Strict");
    expect(c).toContain("Path=/admin");
    expect(c).toContain("Max-Age=100");
  });

  /** Logout has to actually clear it, not merely redirect. */
  it("expires immediately when cleared", () => {
    expect(sessionCookie("", 0)).toContain("Max-Age=0");
  });

  /**
   * Supabase access tokens last an hour. A cookie that outlived its own
   * contents would turn "please sign in again" into a page that fails with no
   * explanation, because the browser would keep sending a token nobody accepts.
   */
  it("never outlives the token it carries", () => {
    expect(SESSION_TTL_SECONDS).toBeLessThanOrEqual(3600);
  });

  it("reads one cookie out of a header carrying several", () => {
    const req = new Request("https://x.test/", {
      headers: { cookie: "a=1; st_admin=abc.def.ghi; b=2" },
    });
    expect(readCookie(req, "st_admin")).toBe("abc.def.ghi");
    expect(readCookie(req, "missing")).toBeNull();
  });
});
