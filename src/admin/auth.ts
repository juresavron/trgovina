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
 * It also removes two of the three secrets the panel needed. Only
 * SUPABASE_SERVICE_KEY is left, because writing to storage genuinely requires
 * it; the login path uses the PUBLISHABLE key, which is public by design.
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
  return { id: body.id, email: typeof body.email === "string" ? body.email : "" };
}

/**
 * Is this user on the allowlist?
 *
 * Read with the SERVICE key on purpose. public.admins has RLS enabled and no
 * policies at all, so the table is unreadable by any browser client even with
 * the publishable key in hand — the only way to ask this question is from the
 * server, which is the only place the answer should be trusted.
 */
async function isAllowed(env: Env, userId: string): Promise<boolean> {
  const url =
    env.SUPABASE_URL + "/rest/v1/admins?select=user_id&user_id=eq." + encodeURIComponent(userId);
  const res = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY!,
      authorization: "Bearer " + env.SUPABASE_SERVICE_KEY!,
    },
  });
  if (!res.ok) return false;
  const rows = (await res.json()) as unknown;
  return Array.isArray(rows) && rows.length > 0;
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
  return (await isAllowed(env, user.id)) ? user : null;
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
