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
 * Who gets into the panel.
 *
 * Two questions, and the second is the one worth being paranoid about. ANYONE
 * CAN CREATE AN ACCOUNT on a Supabase project: sign-up is a public endpoint.
 * So a gate that only checked "is this token valid" would admit the entire
 * internet while looking exactly like a login. Being on public.admins is what
 * actually grants entry, and these tests are the record of that rather than a
 * reading of the code.
 *
 * The panel no longer holds a key of its own — it acts as the signed-in person
 * — so what these tests protect is narrower than it once was, and the database
 * refuses anyone this gate lets through by mistake. That is defence in depth,
 * not a reason to test it less.
 */

const ANON = "sb_publishable_test";
const TOKEN = "header.payload.signature";
const ENV = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: ANON,
} as Env;

const USER = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "kdo@example.test",
  token: TOKEN,
};

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
  isAdmin?: { status: number; body: unknown };
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
        : url.includes("/rest/v1/rpc/is_admin")
          ? routes.isAdmin
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
   * The publishable key, which is public by design and lives in
   * wrangler.jsonc. There is no secret in this Worker to accidentally reach
   * for, and this pins that: if a service key ever reappears here, it will be
   * because someone added one back.
   */
  it("signs in with the publishable key — the panel has no other", async () => {
    const calls = stubFetch({ token: { status: 200, body: { access_token: "t" } } });
    await signIn(ENV, "kdo@example.test", "geslo");
    expect(calls[0]!.headers["apikey"]).toBe(ANON);
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
      user: { status: 200, body: { id: USER.id, email: USER.email } },
      isAdmin: { status: 200, body: true },
    });
    expect(await currentAdmin(signedIn(TOKEN), ENV)).toEqual(USER);
  });

  /**
   * THE ONE THAT MATTERS. Sign-up is public, so a valid token proves only that
   * somebody made an account. If this ever passes, the panel is open to anyone
   * who can fill in a registration form.
   */
  it("refuses a valid account that nobody added", async () => {
    stubFetch({
      user: { status: 200, body: { id: USER.id, email: USER.email } },
      isAdmin: { status: 200, body: false },
    });
    expect(await currentAdmin(signedIn(TOKEN), ENV)).toBeNull();
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
   * The allowlist answers about the CALLER, and the caller is established by
   * the token's signature inside Postgres. Sending the user id would be worse
   * than useless: an id in a request body is a claim, and a gate that trusted
   * one would let anyone name an admin's id and be let in.
   */
  it("asks as the user, and never sends a user id to be trusted", async () => {
    const calls = stubFetch({
      user: { status: 200, body: { id: USER.id, email: USER.email } },
      isAdmin: { status: 200, body: true },
    });
    await currentAdmin(signedIn(TOKEN), ENV);
    const rpc = calls.find((c) => c.url.includes("/rest/v1/rpc/is_admin"))!;
    expect(rpc.headers["authorization"]).toBe("Bearer " + TOKEN);
    expect(rpc.headers["apikey"]).toBe(ANON);
    expect(rpc.body).not.toContain(USER.id);
  });

  /**
   * A truthy-looking answer is not a true one. PostgREST returning an object,
   * a string, or the JSON `null` on some future error must not read as yes.
   */
  it("admits only on a literal true", async () => {
    for (const body of [false, null, {}, [], "true", 1]) {
      stubFetch({
        user: { status: 200, body: { id: USER.id, email: USER.email } },
        isAdmin: { status: 200, body },
      });
      expect(await currentAdmin(signedIn(TOKEN), ENV), JSON.stringify(body)).toBeNull();
      vi.unstubAllGlobals();
    }
  });

  it("refuses when the allowlist cannot be asked at all", async () => {
    stubFetch({
      user: { status: 200, body: { id: USER.id, email: USER.email } },
      isAdmin: { status: 500, body: { message: "down" } },
    });
    expect(await currentAdmin(signedIn(TOKEN), ENV)).toBeNull();
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
