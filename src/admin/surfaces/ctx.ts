/**
 * WHAT EVERY ADMIN SURFACE IS HANDED, AND THE THREE WAYS IT MAY ANSWER.
 *
 * handleAdmin was one 1,146-line function: a flat `if (parts[1] === ...)`
 * chain in which eleven surfaces shared one scope. That scope is what made it
 * one function — each branch reached for `api`, `admin`, `page`, `seeOther`
 * and the rest as locals, so no branch could be moved without carrying the
 * prologue with it. Naming the scope is what lets them move.
 *
 * ⚠️ THE GATE IS NOT IN HERE, AND MUST NOT BE. Authentication, the admins
 * allowlist and the cross-site refusal all happen in routes.ts BEFORE a
 * context exists — so a surface cannot forget to check, because a surface is
 * only ever called with an AdminCtx and an AdminCtx is only ever built after
 * the gate. The type is the proof: `admin` is AdminUser, not AdminUser | null.
 */

import type { AdminUser } from "../auth";
import type { Api, Env } from "../supabase";

export interface AdminCtx {
  readonly request: Request;
  readonly env: Env;
  readonly url: URL;
  /** The path, split and emptied of blanks: ["admin", ...]. */
  readonly parts: string[];
  /** Never null — see the note above. */
  readonly admin: AdminUser;
  /** Supabase, acting as this person. There is no service key to fall back to. */
  readonly api: Api;
  /** The shop being administered. One today; read from here, never typed in. */
  readonly shopKey: string;
}

/**
 * A surface's answer, or null for "not mine".
 *
 * Returning null rather than throwing keeps the dispatcher a list: it asks
 * each surface in turn and the first non-null wins, which is exactly what the
 * if-chain did, minus the shared scope.
 */
export type Surface = (c: AdminCtx) => Promise<Response | null>;

export const HTML = { "content-type": "text/html; charset=utf-8" };

/**
 * ⚠️ no-store ON EVERY ADMIN RESPONSE. These pages carry one person's view of
 * a shop behind a session cookie; a shared cache holding one is a shared cache
 * handing it to somebody else.
 */
export const PRIVATE = {
  "cache-control": "no-store",
  "x-robots-tag": "noindex, nofollow",
};

export function page(body: string, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { ...HTML, ...PRIVATE, ...extra } });
}

export function json(v: unknown, status = 200): Response {
  return new Response(JSON.stringify(v), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...PRIVATE },
  });
}

/**
 * Post/Redirect/Get. A write answers 303 and the result is a fresh GET, so a
 * refresh re-reads rather than re-submits — the same rule the storefront's
 * enquiry form follows, for the same reason.
 */
export function seeOther(location: string, extra: Record<string, string> = {}): Response {
  return new Response(null, { status: 303, headers: { location, ...PRIVATE, ...extra } });
}
