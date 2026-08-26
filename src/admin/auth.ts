/**
 * Who may use the media panel, answered by Supabase.
 *
 * WHAT THIS REPLACED, AND WHY. The panel used to hold one shared password in
 * a Worker secret and mint its own HMAC-signed cookie. That worked, and its
 * own module comment named the day it would stop working: "this is not
 * multi-user, it has no roles, and it cannot be revoked before expiry other
 * than by changing ADMIN_SECRET — the day there are two people, this needs
 * replacing rather than extending."
 *
 * Accounts in Supabase are that replacement, and they answer three things a
 * shared password cannot:
 *
 *   WHO. An upload is attributable to a person rather than to whoever knew
 *   the password.
 *   REVOCATION. Removing one person is one row; with a shared secret the only
 *   revocation is changing it and telling everybody else the new one.
 *   RECOVERY. Supabase owns password reset and rate limiting, which are two
 *   more things this repo would otherwise have to get right.
 *
 * It also removes every secret the panel needed. All three are gone: the
 * password, the signing key, and — once the panel started acting as the
 * signed-in person rather than as the service role — the service key too.
 * What is left is the project URL and the publishable key, both public by
 * design, both in wrangler.jsonc. There is nothing to set and nothing to leak.
 *
 * AUTHENTICATION IS NOT AUTHORISATION, and conflating them here would be the
 * whole vulnerability: anyone can create an account on a Supabase project.
 * Signing in proves who you are; the public.admins allowlist decides whether
 * that person may delete 55 photographs. Both are checked, every request.
 *
 * WHY THE TOKEN IS VERIFIED WITH SUPABASE ON EVERY REQUEST rather than
 * decoded locally. Verifying a JWT signature in the Worker is faster and
 * would be fine for a busy public API. It is the wrong trade here: a locally
 * verified token stays valid until it expires, so a sacked colleague keeps
 * access for the rest of the hour, and this panel is used a few times a week
 * by a couple of people. Asking Supabase costs one request and makes
 * revocation immediate.
 */

import type { Env } from "./supabase";

/** The cookie holding the Supabase access token. */
export const SESSION_COOKIE = "st_admin";

/**
 * How long the browser keeps the cookie.
 *
 * Supabase access tokens expire in an hour by default and the cookie must not
 * outlive the token it carries — a cookie that survives its own contents just
 * turns a login screen into a mysterious failure.
 */
export const SESSION_TTL_SECONDS = 60 * 60;

export interface AdminUser {
  readonly id: string;
  readonly email: string;
  /**
   * Their access token, carried on to every Supabase call the request makes.
   * The panel has no authority of its own — see supabase.ts — so this travels
   * with the user rather than being fetched from the environment.
   */
  readonly token: string;
}

/**
 * Exchange an email and password for an access token.
 *
 * Returns null for every failure — wrong password, unknown address, unconfirmed
 * account, rate limited. The caller must not tell them apart: "no account with
 * that address" confirms which addresses exist, which is free information for
 * anyone guessing.
 */
export async function signIn(
  env: Env,
  email: string,
  password: string,
): Promise<string | null> {
  const res = await fetch(env.SUPABASE_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: env.SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { access_token?: unknown };
  return typeof body.access_token === "string" ? body.access_token : null;
}

/**
 * The signed-in user for a token, or null.
 *
 * Supabase is the authority on whether the token is still good: expired,
 * signed out elsewhere, or belonging to a deleted account all come back the
 * same way, and none of them can be seen by reading the token.
 */
async function whoAmI(env: Env, token: string): Promise<AdminUser | null> {
  const res = await fetch(env.SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: env.SUPABASE_ANON_KEY!, authorization: "Bearer " + token },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { id?: unknown; email?: unknown };
  if (typeof body.id !== "string") return null;
  return { id: body.id, email: typeof body.email === "string" ? body.email : "", token };
}

/**
 * Is the holder of this token on the allowlist?
 *
 * Asked as a QUESTION rather than a lookup. public.admins has RLS enabled and
 * no policies at all, so it is unreadable by every client — including this
 * one, and including an admin. What answers is public.is_admin(), a
 * SECURITY DEFINER function that reads the table on the caller's behalf and
 * returns nothing but a boolean about the caller themselves. The table cannot
 * be enumerated, and the answer comes from the database rather than from
 * anything this Worker could be talked into believing.
 *
 * The token proves who is asking: Postgres derives auth.uid() from its
 * signature, so a request cannot ask on somebody else's behalf. The userId
 * argument is therefore not passed to Supabase at all — it exists only so the
 * caller cannot forget which user this answer is about.
 */
async function isAllowed(env: Env, token: string): Promise<boolean> {
  const res = await fetch(env.SUPABASE_URL + "/rest/v1/rpc/is_admin", {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY!,
      authorization: "Bearer " + token,
      "content-type": "application/json",
    },
    body: "{}",
  });
  if (!res.ok) return false;
  return (await res.json()) === true;
}

/**
 * The admin behind this request, or null.
 *
 * Both questions, in order, every time: Supabase says who the token belongs
 * to, then the allowlist says whether that person may be here. A valid token
 * for an account nobody added is exactly as unwelcome as no token at all.
 */
export async function currentAdmin(
  request: Request,
  env: Env,
): Promise<AdminUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const user = await whoAmI(env, token);
  if (!user) return null;
  return (await isAllowed(env, token)) ? user : null;
}

/** Read one cookie by name, without a regex over attacker-controlled input. */
export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/**
 * The Set-Cookie value.
 *
 * HttpOnly so script cannot read the token, Secure so it never crosses in
 * clear, SameSite=Strict so a form on another origin cannot post as you, and
 * scoped to /admin so the storefront's own requests never carry it.
 */
export function sessionCookie(value: string, maxAge: number): string {
  return (
    SESSION_COOKIE + "=" + value +
    "; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=" + String(maxAge)
  );
}
