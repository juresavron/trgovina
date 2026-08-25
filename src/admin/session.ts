/**
 * Admin sessions: a signed cookie, and nothing else.
 *
 * WHY NOT SUPABASE AUTH. The panel has exactly one user — the person who owns
 * the shops — and the storefront ships no JavaScript framework to hang an auth
 * SDK off. A password plus a signed cookie is the whole requirement, and it is
 * small enough to read in one sitting, which is the property that actually
 * makes an auth path safe.
 *
 * WHAT MAKES IT SAFE:
 *
 *   * The cookie carries an expiry and an HMAC over it. It carries no
 *     privileges and no user data, so there is nothing in it to tamper with
 *     beyond the expiry, and the expiry is inside the signature.
 *   * The signature is verified in constant time. A byte-at-a-time compare
 *     that returns early leaks, through timing, how much of a forged tag was
 *     right — which is enough to build the rest of it a byte at a time.
 *   * The password is compared in constant time for the same reason.
 *   * Cookies are HttpOnly (script cannot read them), Secure (never sent in
 *     clear), SameSite=Strict (a form on another origin cannot post as you)
 *     and scoped to /admin, so the storefront's own requests never carry them.
 *
 * WHAT IT IS NOT: this is not multi-user, it has no roles, and it cannot be
 * revoked before expiry other than by changing ADMIN_SECRET — which does
 * revoke every session at once, immediately. For one operator that is the
 * right trade; the day there are two, this needs replacing rather than
 * extending.
 */

/** How long a session lasts. Long enough to do an afternoon's uploading. */
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

export const SESSION_COOKIE = "st_admin";

const enc = new TextEncoder();

function base64url(bytes: ArrayBuffer): string {
  let s = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i++) s += String.fromCharCode(view[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/**
 * Constant-time string comparison.
 *
 * Compares every byte regardless of where the first difference is, so the time
 * taken says nothing about how much of the input was correct. The length is
 * compared too, but only after — an early return on length is a much smaller
 * leak and unavoidable without padding.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const av = enc.encode(a);
  const bv = enc.encode(b);
  let diff = av.length ^ bv.length;
  const n = Math.max(av.length, bv.length);
  for (let i = 0; i < n; i++) diff |= (av[i] ?? 0) ^ (bv[i] ?? 0);
  return diff === 0;
}

/** A cookie value good until `now + SESSION_TTL_SECONDS`. */
export async function mintSession(secret: string, now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  return expires + "." + (await hmac(secret, String(expires)));
}

/** Whether a cookie value is a signature we produced and has not expired. */
export async function verifySession(
  value: string | null | undefined,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const expires = value.slice(0, dot);
  const tag = value.slice(dot + 1);
  if (!/^\d{1,15}$/.test(expires)) return false;
  // Signature FIRST, expiry second: checking the expiry first would answer
  // "is this a real session that has lapsed?" for an unsigned value.
  if (!timingSafeEqual(tag, await hmac(secret, expires))) return false;
  return Number(expires) * 1000 > now;
}

/** Read one cookie out of a request's Cookie header. */
export function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/** The Set-Cookie for a fresh session, and for signing out. */
export function sessionCookie(value: string, maxAge: number): string {
  return (
    SESSION_COOKIE + "=" + value +
    "; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=" + String(maxAge)
  );
}
