/**
 * The admin panel's routes, and the /media proxy the storefront reads.
 *
 * SECURITY SHAPE, in one place so it can be checked at a glance:
 *
 *   * Every path under /admin except the login POST requires a Supabase
 *     account that is ALSO on the public.admins allowlist — signing in proves
 *     who you are, the allowlist decides whether you may be here, and anyone
 *     in the world can do the first. The check happens in `handleAdmin` BEFORE
 *     any handler that talks to Supabase is reached, so there is one gate, not
 *     eight — and the panel carries no authority of its own to leak past it:
 *     every call it makes is made as the signed-in person, so the database
 *     refuses anything this gate lets through by mistake.
 *   * Every response from /admin carries `x-robots-tag: noindex, nofollow`
 *     and `cache-control: no-store`, and robots.txt disallows /admin.
 *   * Writes are POST only. A GET that changed data would be triggerable by
 *     any image tag on any page in the world.
 *   * The session cookie carries the Supabase access token and is HttpOnly,
 *     Secure, SameSite=Strict and scoped to /admin: script cannot read it, a
 *     form on another origin cannot post with it — that plus POST-only is the
 *     CSRF defence — and no storefront request ever carries it.
 *   * /media is public and read-only, and can only ever proxy the one bucket.
 */

import { seedCatalogue } from "./catalogue";
import { listProducts } from "./db/catalogue";
import { resolveShopChoice, shopCookie } from "./db/shop";
export { adminModelSlugs } from "./catalogue";
import { ERRORS, NOTICES } from "./surfaces/notices";
import type { AdminCtx, Surface } from "./surfaces/ctx";
import { handle as blogSurface } from "./surfaces/blog";
import { handle as dashboardSurface } from "./surfaces/dashboard";
import { handle as enhanceSurface } from "./surfaces/enhance";
import { handle as siteSortSurface } from "./surfaces/sitesort";
import { handle as slikeSurface } from "./surfaces/slike";
import { handle as siteSurface } from "./surfaces/site";
import { handle as modelsSurface } from "./surfaces/models";
import { handle as enquiriesSurface } from "./surfaces/enquiries";
import { handle as finishesSurface } from "./surfaces/finishes";
import { handle as reviewsSurface } from "./surfaces/reviews";

import {
  isWebp, previewPath, slugStem, storedPaths, widthPath } from "./media";
import { } from "../catalog/swimspa";
import {
  type Api,
  type Env,
  deleteMedia,
  deleteObject,
  downloadObject,
  insertMedia,
  listMedia,
  missingConfig,
  updateMedia,
  uploadObject } from "./supabase";
import {
  indexPage,
  sitePage,
  loginPage,
  modelPage,
  notConfiguredPage,
  notFoundPage,
  siteImagePage,
  type MediaView,
  type SiteSlot } from "./panel";
import { SESSION_TTL_SECONDS, currentAdmin, sessionCookie, signIn, readCookie, SESSION_COOKIE } from "./auth";
import {
  SITE_IMAGES,
  siteImageBySlug,
  stemOf,
  type SiteImage } from "./site-images";
import {
  ensureFinish,
  nameFromFilename } from "./finishes";
import { } from "./enquiries-panel";
import { } from "./finishes-panel";
import {
  assignSlots,
  classify,
  slotOptions } from "./assign";
import { type FinishKind } from "../catalog/finish-image";
import { enhance, enhanceAvailable } from "./enhance";
import {
  looksLikeColourName,
  nameColour,
  nameColourAvailable,
  uniqueColourName } from "./name-colour";
import { describe, describeAvailable } from "./describe";
import { arrange } from "./shots";
import { } from "../blog/post";


/** Exported so a test can hold it to account; see the note on PRIVATE. */
export const CSP =
  "default-src 'none'; img-src 'self' blob:; style-src 'unsafe-inline'; " +
  "script-src 'unsafe-inline'; form-action 'self'; connect-src 'self'; " +
  "base-uri 'none'; frame-ancestors 'none'";

const HTML = { "content-type": "text/html; charset=utf-8" };
const PRIVATE = {
  ...HTML,
  "x-robots-tag": "noindex, nofollow",
  "cache-control": "no-store",
  // The panel has no third-party anything; say so rather than relying on it.
  //
  // ⚠️ blob: IS NOT COVERED BY 'self', and leaving it out broke the feature
  // this panel was rebuilt around. The upload card shows a thumbnail of every
  // picture before it sends anything, and it does that from a blob: URL its
  // own script made — the file never leaves the browser to be previewed. CSP
  // treats blob: as its own scheme rather than as same-origin, so every one of
  // those thumbnails was refused and the operator picked files blind.
  //
  // It widens nothing: a blob: URL can only be minted by script already
  // running in this document, from bytes that document already holds. There is
  // no way to point one at somebody else's server.
  //
  // Also why the two decode paths matter — see panel.ts, where Safari before
  // 15 reads a file through an <img> and an object URL because it has no
  // createImageBitmap. On that browser this directive is the difference
  // between converting a photograph and refusing it.
  "content-security-policy": CSP,
  "referrer-policy": "no-referrer" };

function page(body: string, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { ...PRIVATE, ...extra } });
}

/** Whether a site upload came from the smart uploader's fetch(). */
export function bulkParam(form: FormData): boolean {
  return form.get("bulk") === "1";
}

function json(v: unknown, status = 200): Response {
  return new Response(JSON.stringify(v), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff" } });
}

function seeOther(location: string, extra: Record<string, string> = {}): Response {
  return new Response(null, { status: 303, headers: { location, ...PRIVATE, ...extra } });
}

/* ---- /media ------------------------------------------------------------ */

/**
 * The surfaces, in the order the if-chain asked them.
 *
 * ⚠️ ORDER IS BEHAVIOUR. These match on parts[1] and the first non-null wins,
 * so a surface added above one that shares a prefix takes its requests. Add to
 * the end unless you mean otherwise, and routes-snapshot.test.ts will say so
 * if you did not.
 */
const SURFACES: readonly Surface[] = [
  dashboardSurface,
  enhanceSurface,
  siteSortSurface,
  slikeSurface,
  siteSurface,
  finishesSurface,
  enquiriesSurface,
  reviewsSurface,
  blogSurface,
  // ⚠️ LAST. It is the fallthrough and answers whatever is left; anywhere
  // earlier it swallows every surface below it.
  modelsSurface,
];

export async function handleAdmin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean); // ["admin", ...]

  const missing = missingConfig(env);
  if (missing.length > 0) return page(notConfiguredPage(missing), 503);

  // --- login / logout, the only paths reachable without a session ---
  if (parts[1] === "login" && request.method === "POST") {
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const token = email && password ? await signIn(env, email, password) : null;
    if (!token) {
      // ONE MESSAGE FOR EVERY FAILURE, on purpose. Wrong password, unknown
      // address, unconfirmed account and rate limited are told apart by
      // Supabase but must not be told apart here: "no account with that
      // address" hands anyone guessing a way to enumerate who works here.
      return page(loginPage("Napačen e-naslov ali geslo."), 401);
    }
    return seeOther("/admin", { "set-cookie": sessionCookie(token, SESSION_TTL_SECONDS) });
  }

  if (parts[1] === "logout" && request.method === "POST") {
    // Revoke upstream, not only locally: clearing the cookie leaves the
    // Supabase access token valid for the rest of its hour, and the panel's
    // own doctrine is that a signed-out account loses access at once. Fire
    // and forget — a dead auth service must not trap the operator in a
    // session they asked to leave.
    const token = readCookie(request, SESSION_COOKIE);
    if (token && env.SUPABASE_URL) {
      try {
        await fetch(env.SUPABASE_URL + "/auth/v1/logout", {
          method: "POST",
          headers: {
            apikey: env.SUPABASE_ANON_KEY ?? "",
            authorization: "Bearer " + token } });
      } catch {
        // The cookie still clears; the token dies at its own expiry.
      }
    }
    return seeOther("/admin", { "set-cookie": sessionCookie("", 0) });
  }

  // --- the gate ---
  //
  // Two questions, both asked of Supabase on every request: whose token is
  // this (so a signed-out or deleted account loses access at once rather than
  // when the hour runs out), and is that person on the admins allowlist —
  // because anyone at all can create an account on a Supabase project, so
  // signing in is not by itself permission to be here.
  const admin = await currentAdmin(request, env);
  if (!admin) return page(loginPage(), parts.length > 1 ? 401 : 200);

  // A second lock on every write, one header deep. SameSite=Strict already
  // keeps the cookie off cross-site requests, but that defence is exactly
  // one cookie attribute wide — this refuses any POST a browser labels as
  // arriving from another site, whatever the cookie did. Absent header
  // (older engines, direct tools) passes: the check adds depth, it is not
  // the gate.
  if (request.method === "POST") {
    const sfs = request.headers.get("sec-fetch-site");
    if (sfs && sfs !== "same-origin" && sfs !== "none") {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // Everything past this point talks to Supabase AS THIS PERSON. There is no
  // service key in the Worker to fall back to, so a bug that skipped the gate
  // would produce an unauthenticated request that the database refuses, rather
  // than an unauthenticated request that the database happily serves.
  const api: Api = { env, token: admin.token };

  // --- which shop -------------------------------------------------------
  //
  // ⚠️ ONCE, HERE, AND VALIDATED AGAINST THE DATABASE. Every surface below
  // takes the answer from AdminCtx, so no handler picks a shop for itself and
  // none of them can be pointed at one this account may not see: the set comes
  // from listShops(), which runs as this person and is filtered by RLS.
  const choice = await resolveShopChoice(request, api, url);
  if (!choice.current) {
    // An account on the admins allowlist whose RLS grants it no shop. A
    // permissions state, not a crash.
    return page(
      notFoundPage(
        "Vaš račun nima dostopa do nobene trgovine. Obrnite se na skrbnika.",
        admin.email,
      ),
      403,
    );
  }
  const shopKey = choice.current.id;

  // The switcher. A POST because it changes state for every later request,
  // and a 303 back so a refresh does not re-submit it.
  if (parts[1] === "trgovina" && request.method === "POST") {
    const form = await request.formData();
    const wanted = String(form.get("shop") ?? "");
    const ok = choice.all.some((sh) => sh.id === wanted);
    return seeOther(ok ? "/admin" : "/admin", ok ? { "set-cookie": shopCookie(wanted) } : {});
  }

  // --- dashboard ---

  // --- the upscaler ---
  //
  // Model-independent: it transforms bytes and returns bytes, so one route
  // serves a product photograph and a site banner alike. It sits behind the
  // gate like everything else, and it is the ONLY path that reaches an
  // outside API — see enhance.ts on why it is opt-in per upload and why a
  // failure returns the original rather than an error.

  // --- smart sorting: which slot does each dropped picture belong to ---
  //
  // The batch in one request, because the ASSIGNMENT is a property of the
  // batch: two garden shots classified separately would both claim the hero,
  // and only the round that sees both can give the second one its second
  // choice. Classification itself is per image (the model sees one picture
  // at a time); assignSlots() then resolves the batch — see admin/assign.ts.
  //
  // The response tells the browser everything it needs to FINISH each file
  // (the slot's crop ratio and width cap), so the client can reuse the same
  // crop-and-convert pipeline the single-slot page runs, and the existing
  // per-slot upload endpoint stays the only writer.

  // --- the storefront's own pictures ---
  //
  // Lifted off the dashboard, which had grown to seven unrelated jobs in one
  // scroll. Everything that puts a picture on a public page is here: the
  // batch uploader, the two colour drop zones, and every managed slot.

  // --- colours ---
  //
  // ⚠️ NO "ADD" FORM, AND THAT IS THE FEATURE. A colour exists because a
  // swatch was uploaded and the name came off the file; typing a name here
  // would put a tile on six product pages with nothing behind it, which is
  // precisely the arrangement this inverted. What the page offers is the
  // list, a rename for a typo, and a delete.

  // --- enquiries ---
  //
  // READ AND WORK, NEVER EDIT. What the customer wrote is text on this page,
  // not a field: an enquiry is a record of what somebody sent, and a back
  // office that can rewrite it is a back office whose records prove nothing.
  // The two writes are a status and a private note, plus deletion — which is
  // also how the erasure right (GDPR art. 17) is actually exercised, since
  // the scheduled two-year purge is the floor and not the only way out.
  //
  // ⚠️ THE PANEL DOES NOT WRITE ENQUIRIES EITHER. A visitor's submission
  // goes through public.submit_enquiry, the one function the anon role may
  // execute; this route reads and patches AS THE SIGNED-IN ADMIN, so the
  // database decides what an operator may see rather than this code being
  // trusted to only ask for the right rows.

  // --- customer reviews ---
  //
  // ⚠️ THE MOST LEGALLY LOADED SURFACE IN THIS PANEL. See admin/reviews.ts for
  // the two Annex I entries; what matters here is that "published" and
  // "verified" are separate decisions and the second one refuses to save
  // without the order number that justifies it.

  // --- the blog ---
  //
  // Before the model lookup for the same reason "site" is: "blog" is not a
  // shop key. Everything here is one shop's — SHOP_KEY below — because the
  // panel already only manages one; the shop id is passed to every store call
  // rather than assumed inside it, so a second shop is a parameter and not a
  // rewrite.
  //
  // ⚠️ THE WRITES GO THROUGH THE SIGNED-IN PERSON'S TOKEN like every other
  // call in this file. There is no service key here either: `posts_admin_write`
  // is what lets these succeed, and a bug that skipped the gate above would
  // produce a request the database refuses rather than one it serves.

  // --- one site image ---
  //
  // Before the model lookup, because "site" is not a shop key and would
  // otherwise fall through to "this model does not exist".
  // --- the surfaces -------------------------------------------------------
  //
  // ⚠️ EVERYTHING ABOVE THIS LINE IS THE GATE, AND IT STAYS ABOVE IT. The
  // session, the admins allowlist and the cross-site refusal all run before a
  // context exists, so a surface cannot forget to check: it is only ever
  // called with an AdminCtx, and an AdminCtx is only built here.
  //
  // First non-null answers, which is what the if-chain did — minus the shared
  // scope that made eleven surfaces one function.
  const c: AdminCtx = {
    request, env, url, parts, admin, api, shopKey,
    shopName: choice.current.name,
    shops: choice.all.map((sh) => ({ id: sh.id, name: sh.name })),
  };
  for (const surface of SURFACES) {
    const res = await surface(c);
    if (res) return res;
  }

  // ⚠️ UNREACHABLE, AND STATED ANYWAY. The last surface in the table is the
  // fallthrough and answers everything left with a 404, so nothing gets past
  // this loop. tsc cannot prove that — a Surface may return null — and the
  // honest way to satisfy it is the same 404 rather than a cast that would
  // stop being true the day somebody reorders the table.
  return page(notFoundPage("Ta stran ne obstaja.", admin.email), 404);


  // --- one model ---
}

/**
 * What goes in the alt column when nobody wrote anything.
 *
 * Truthful and nothing else: the model's own name, and where the picture sits
 * in the set. It is deliberately not a description — inventing one server-side
 * would be a claim about a photograph this code has never looked at, which is
 * the one thing describe.ts exists to avoid doing carelessly.
 *
 * The position is what stops a set of ten collapsing into ten identical
 * strings, which is the state this whole change is trying to get out of. It
 * comes from the client because only the client knows which file this is; a
 * missing or nonsense value simply leaves the name alone.
 */
export function standInAlt(name: string, n: FormDataEntryValue | null): string {
  const i = Number(String(n ?? "").trim());
  const pos = Number.isInteger(i) && i > 0 && i < 1000 ? " — fotografija " + i : "";
  // product_media.alt carries a length check, and the model name comes from
  // the catalogue rather than from anything this function controls. The
  // position is what makes the string unique, so the NAME is what gets cut.
  const room = 180 - pos.length;
  const base = (name || "Fotografija izdelka").slice(0, room).trim();
  return base + pos;
}

/** Record the ladder on the row the upload just created. */
export async function widthsFor(api: Api, productId: string, url: string, widths: number[]): Promise<void> {
  const rows = await listMedia(api, productId);
  const row = rows.find((r) => r.url === url);
  if (row) await updateMedia(api, row.id, { widths });
}
