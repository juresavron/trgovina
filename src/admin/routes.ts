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

import { CATALOGUE_SHOPS, adminModelBySlug } from "./catalogue";
export { adminModelSlugs } from "./catalogue";
import { ERRORS, NOTICES } from "./surfaces/notices";
import type { AdminCtx, Surface } from "./surfaces/ctx";
import { handle as blogSurface } from "./surfaces/blog";
import { handle as enquiriesSurface } from "./surfaces/enquiries";
import { handle as finishesSurface } from "./surfaces/finishes";
import { handle as reviewsSurface } from "./surfaces/reviews";

import {
  isWebp, previewPath, slugStem, storedPaths, widthPath } from "./media";
import { } from "../catalog/swimspa";
import { SHOPS } from "../tenants";
import {
  type Api,
  type Env,
  deleteMedia,
  deleteObject,
  downloadObject,
  ensureProduct,
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
function bulkParam(form: FormData): boolean {
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
  finishesSurface,
  enquiriesSurface,
  reviewsSurface,
  blogSurface,
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

  // --- dashboard ---
  if (parts.length === 1) {
    const key = "bazen";
    const cat = CATALOGUE_SHOPS[key]!;
    // The rows were already being fetched to count them; taking the first
    // row's url out of the same result turns the dashboard from a list of
    // names into a contact sheet at no extra request.
    const shots = await Promise.all(
      cat.models.map(async (m) => {
        const id = await ensureProduct(api, key, m.slug, m.name, m.freightClass);
        return await listMedia(api, id);
      }),
    );
    return page(
      indexPage(
        SHOPS[key]!.name,
        key,
        cat.models.map((m, i) => ({
          shop: key,
          slug: m.slug,
          name: m.name,
          count: shots[i]!.length,
          cover: shots[i]![0]?.url })),
        admin.email,
        SITE_IMAGES.map(
          (x): SiteSlot => ({
            stem: stemOf(x.key),
            label: x.label,
            note: x.note,
            src: "/media/" + x.key,
            group: x.group }),
        ),
      ),
    );
  }

  // --- the upscaler ---
  //
  // Model-independent: it transforms bytes and returns bytes, so one route
  // serves a product photograph and a site banner alike. It sits behind the
  // gate like everything else, and it is the ONLY path that reaches an
  // outside API — see enhance.ts on why it is opt-in per upload and why a
  // failure returns the original rather than an error.
  if (parts[1] === "enhance" && request.method === "POST") {
    if (!enhanceAvailable(env)) return new Response("Not found", { status: 404 });
    const form = await request.formData();
    const part = form.get("file");
    if (!(part instanceof File) || part.size === 0) {
      return new Response("No file", { status: 400 });
    }
    // The bytes get base64d into a JSON payload (~2.7× in memory) and may be
    // retried against three models — an uncapped 40 MB camera file is a
    // self-DoS, and Gemini's inline limit is ~20 MB anyway.
    if (part.size > 15 * 1024 * 1024) {
      return new Response("Slika je prevelika za izboljšavo (do 15 MB).", { status: 413 });
    }
    const bytes = await part.arrayBuffer();
    // The caller says how big it wants the result. Validated against the two
    // the API takes rather than passed through — this is a value off the
    // wire, and it reaches an outside service.
    const want = String(form.get("target") ?? "") === "4K" ? "4K" : "2K";
    const done = await enhance(env, bytes, part.type || "image/jpeg", want);
    // Null means the upscaler did not produce anything usable. Answering 204
    // rather than an error is what lets the browser carry on with the file it
    // already has: an optional enhancement must never cost an upload.
    if (!done) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    return new Response(done.bytes, {
      status: 200,
      headers: {
        "content-type": done.mime,
        "cache-control": "no-store",
        // done.mime is whatever the model's API claimed — nosniff keeps the
        // browser from second-guessing it into something executable.
        "x-content-type-options": "nosniff" } });
  }

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
  if (parts[1] === "site-sort" && request.method === "POST") {
    const form = await request.formData();
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) return json({ error: "Ni slik." }, 400);

    // WHICH CATALOGUE, read first because it sets the batch ceiling. Default
    // is the whole site — the flow this endpoint was built for.
    // "barva"/"obloga" narrow it to one colour list, which is a different and
    // much easier question: sixteen near-identical slot notes inside a
    // 46-option prompt is not a catalogue a model can choose from, and the
    // owner drops the colour samples as their own batch anyway.
    const scope = form.get("scope");
    const kind: FinishKind | null =
      scope === "barva" ? "barva" : scope === "obloga" ? "obloga" : null;

    // A ceiling, said plainly: the site has seventeen slots, and a batch of
    // fifty is either a mistake or the product catalogue, which has its own
    // uploader.
    //
    // ⚠️ THE COLOUR CEILING IS HIGHER BECAUSE THE COST IS LOWER. Twenty is
    // sized for the classifier — one Gemini round trip per picture. A colour
    // drop makes no model call at all (the name is the filename), so the only
    // cost is the bytes, which the two size caps below already bound. The
    // owner's instruction was to drop ALL the colours at once, and a
    // supplier's chart is not obliged to stop at twenty.
    const cap = kind ? 60 : 20;
    if (files.length > cap) {
      return json({ error: "Največ " + cap + " slik naenkrat." }, 400);
    }
    // The shipped client sends ~200 KB probes; the server cannot rely on
    // that, and each file is base64d into a Gemini payload. Per-file and
    // whole-batch caps keep a direct caller from buffering the isolate out.
    if (files.some((f) => f.size > 4 * 1024 * 1024)) {
      return json({ error: "Posamezna slika za razvrščanje sme meriti do 4 MB." }, 413);
    }
    if (files.reduce((n, f) => n + f.size, 0) > 24 * 1024 * 1024) {
      return json({ error: "Celoten izbor sme meriti do 24 MB." }, 413);
    }

    // THE FILENAMES, sent alongside because the probes are not the originals.
    // The client downsamples each picture to a ~200 KB JPEG before posting,
    // and names those p0.jpg…pN.jpg so the server can answer by position — so
    // the one piece of evidence that settles most of a colour drop outright
    // has to travel separately. Positional, same length as `files`, and only
    // read when a colour list is in play.
    const names = form.getAll("names").map((v) => (typeof v === "string" ? v : ""));

    // ⚠️ A COLOUR DROP IS NOT A CLASSIFICATION PROBLEM ANY MORE.
    //
    // It used to be: a fixed list of transcribed names, and the job was to
    // decide which of them each photograph belonged to — filename first, then
    // a model looking at a marbled acrylic and guessing which trade name it
    // was, which is a question nobody in this repository can answer.
    //
    // The list now comes FROM the photographs, so there is nothing to guess.
    // The file is called "Oyster Opal.jpg" because the operator named it after
    // the chart, and that IS the colour's name. No network call, no
    // confidence rating, no proposal to confirm — and, importantly, no
    // invented trade name, which is the one thing catalog/pola.ts is emphatic
    // that this project must never produce.
    //
    // A file whose name folds to nothing is simply refused, with the reason
    // said plainly: rename it after the colour and drop it again.
    if (kind) {
      const api: Api = { env, token: admin.token };

      // ⚠️ THE FILENAME FIRST, THE MODEL ONLY WHERE IT CARRIES NOTHING.
      //
      // Somebody who names a file "Oyster Opal.jpg" is reading the
      // manufacturer's chart, and this code is not: their name is better than
      // any description a model can give and is kept untouched. The model is
      // asked about "Screenshot 2026-08-28 at 10.20.46" and its like — which
      // is what actually landed here, six times, and put six screenshot
      // filenames on the product pages as colour names.
      //
      // What comes back is a DESCRIPTION of the pixels, never a guess at a
      // trade name; admin/name-colour.ts says why that line is drawn where it
      // is. When the model is unreachable the filename stands, which is the
      // behaviour this replaces.
      //
      // ⚠️ WHERE EACH NAME CAME FROM IS CARRIED, NOT RE-DERIVED. The first
      // version inferred it — "the filename was junk, so the model must have
      // named it" — which reports "po odtenku na sliki" for a colour the
      // model failed on and that fell back to the junk filename anyway. That
      // is the silent no-op again, this time wearing a label that says it
      // worked. The source travels with the name.
      const proposed: { name: string; from: "file" | "model" | "failed" }[] =
        files.map((_, i) => {
          const fromFile = nameFromFilename(names[i] ?? "");
          return looksLikeColourName(fromFile)
            ? { name: fromFile, from: "file" as const }
            : { name: "", from: "failed" as const };
        });

      // ⚠️ FOUR AT A TIME, NOT SIXTY IN A ROW. The colour ceiling is 60 files
      // because a colour drop was a pure filename read and cost no round
      // trip; naming makes each unnamed file one. Sixty sequential model
      // calls is a minute of wall clock inside one request and sixty
      // subrequests before a single row is written — an isolate limit, not a
      // slow page. Four at a time keeps the whole batch to about fifteen
      // rounds and leaves subrequest headroom for the writes that follow.
      const need = proposed.map((p, i) => (p.name === "" ? i : -1)).filter((i) => i >= 0);
      for (let k = 0; k < need.length; k += 4) {
        const slice = need.slice(k, k + 4);
        const got = await Promise.all(
          slice.map(async (i) => {
            const f = files[i]!;
            try {
              return await nameColour(env, await f.arrayBuffer(), f.type || "image/jpeg", kind);
            } catch {
              return null;
            }
          }),
        );
        slice.forEach((i, j) => {
          const answer = got[j];
          // The filename is still the fallback — it is a poor name, not no
          // name — but the row says so, so a screenshot name never arrives
          // claiming the model chose it.
          proposed[i] = answer
            ? { name: answer, from: "model" }
            : { name: nameFromFilename(names[i] ?? ""), from: "failed" };
        });
      }

      // Names claimed earlier in this same drop. Two greys both described as
      // "Temno siva" fold to one slug and the second overwrites the first —
      // one colour where the operator uploaded two.
      const taken = new Set<string>();
      const items = [];
      const modelOff = !nameColourAvailable(env);
      for (let i = 0; i < files.length; i++) {
        const raw = proposed[i]?.name ?? "";
        const from = proposed[i]?.from ?? "failed";
        const name = raw === "" ? "" : uniqueColourName(raw, taken);
        if (name !== "") taken.add(name.trim().toLowerCase());
        const finish = name === "" ? null : await ensureFinish(api, "bazen", kind, name);
        items.push(
          finish
            ? {
                i,
                stem: kind + "-" + finish.slug,
                label: finish.name,
                ar: "1:1",
                max: 400,
                exact: true,
                // Which road the name came down, because an operator who sees
                // a name they did not write should be told who wrote it.
                reason:
                  from === "model"
                    ? 'Barva "' + finish.name + '" po odtenku na sliki.'
                    : from === "file"
                      ? 'Barva "' + finish.name + '" po imenu datoteke.'
                      : 'Ime "' + finish.name + '" je iz imena datoteke — ' +
                        (modelOff
                          ? "samodejno poimenovanje ni nastavljeno."
                          : "barve ni bilo mogoče prepoznati na sliki.") +
                        " Popravite ga na strani Barve." }
            : {
                i,
                stem: null,
                label: null,
                ar: null,
                max: null,
                exact: false,
                reason: "Imena barve ni bilo mogoče določiti — ne iz imena " +
                  "datoteke ne iz same slike. Datoteko poimenujte po barvi " +
                  "(npr. »Oyster Opal.jpg«) in poskusite znova." },
        );
      }
      return json({ items });
    }

    const options = slotOptions();
    const classified: (Awaited<ReturnType<typeof classify>>)[] = [];
    const deadModels = new Set<string>();
    for (let i = 0; i < files.length; i++) {
      classified.push(
        await classify(
          env,
          await files[i]!.arrayBuffer(),
          files[i]!.type || "image/jpeg",
          options,
          deadModels,
        ),
      );
    }
    const assigned = assignSlots(classified, options);
    return json({
      items: assigned.map((a, i) => ({
        i,
        stem: a.slot ? stemOf(a.slot.key) : null,
        label: a.slot ? a.slot.label : null,
        ar: a.slot?.ratio ? a.slot.ratio[0] + ":" + a.slot.ratio[1] : null,
        max: a.slot ? a.slot.maxWidth : null,
        exact: a.slot?.exact === true,
        reason: a.reason })) });
  }

  // --- the storefront's own pictures ---
  //
  // Lifted off the dashboard, which had grown to seven unrelated jobs in one
  // scroll. Everything that puts a picture on a public page is here: the
  // batch uploader, the two colour drop zones, and every managed slot.
  if (parts[1] === "slike") {
    return page(
      sitePage(
        "bazen",
        admin.email,
        SITE_IMAGES.map(
          (x): SiteSlot => ({
            stem: stemOf(x.key),
            label: x.label,
            note: x.note,
            src: "/media/" + x.key,
            group: x.group }),
        ),
      ),
    );
  }

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
  const c: AdminCtx = { request, env, url, parts, admin, api, shopKey: "bazen" };
  for (const surface of SURFACES) {
    const res = await surface(c);
    if (res) return res;
  }

  if (parts[1] === "site") {
    // ⚠️ A COLOUR'S SLOT DOES NOT EXIST UNTIL THE COLOUR DOES, and that is the
    // whole point of the inversion.
    //
    // Every other slot on this site is declared in site-images.ts, so
    // siteImageBySlug resolves it and a stem that is not there is a 404. The
    // finish swatches used to work that way too, which meant a colour could
    // only be photographed if somebody had already typed its name into
    // catalog/pola.ts. Now the photograph creates the colour, so the stem
    // arrives BEFORE any deployed code knows the name.
    //
    // It is not a hole: the shape is fixed (barva-/obloga- plus a slug), the
    // key is rebuilt from that shape rather than taken from the request, and
    // /admin is behind the admin allowlist either way. What it cannot do is
    // reach any other slot, because a stem outside those two prefixes still
    // has to resolve in the registry.
    const stem = parts[2] ?? "";
    const dyn = /^(barva|obloga)-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(stem);
    const registered = siteImageBySlug(stem);
    // ⚠️ WHICH COLOUR THIS SLOT IS, if it is one — and it has to be read here,
    // from the registry, because the slug cannot be turned back into a name.
    // "silver-white-marble" does not tell you the chart prints "Silver white
    // marble", and a purchase order quotes the chart. finishSlots() sets the
    // slot's label to the name verbatim, so the registry is the only place
    // that still knows it.
    const finishHere: { kind: FinishKind; name: string } | null =
      dyn && registered ? { kind: dyn[1] as FinishKind, name: registered.label } : null;
    const slot: SiteImage | undefined =
      registered ??
      (dyn
        ? {
            key: "site/" + stem + ".webp",
            group: dyn[1] === "barva" ? "Barve školjke" : "Barve obloge",
            label: stem,
            note: "",
            optional: true,
            ratio: [1, 1],
            maxWidth: 400,
            exact: true }
        : undefined);
    if (!slot) return page(notFoundPage("Ta slika ne obstaja.", admin.email), 404);

    if (parts[3] === "upload" && request.method === "POST") {
      const form = await request.formData();
      const part = form.get("file");
      if (!(part instanceof File) || part.size === 0) {
        return seeOther("/admin/site/" + stemOf(slot.key) + "?e=alt");
      }
      // A stored slot image is a browser-encoded WebP capped at the slot's
      // own width — 10 MB is far above any honest one.
      if (part.size > 10 * 1024 * 1024) {
        return bulkParam(form)
          ? new Response("Slika je prevelika (do 10 MB).", { status: 413 })
          : seeOther("/admin/site/" + stemOf(slot.key) + "?e=type");
      }
      const bytes = await part.arrayBuffer();
      // The smart uploader posts here too, once per assigned picture, and a
      // fetch() caller cannot read an outcome out of a redirect — the 303
      // resolves to the slot page at 200 whether the query said ?m= or ?e=.
      // So a request that declares itself bulk gets statuses instead.
      const bulk = bulkParam(form);
      // Same guarantee as every other upload: the bytes decide, not the label.
      if (!isWebp(bytes)) {
        return bulk
          ? new Response("Ni WebP.", { status: 415 })
          : seeOther("/admin/site/" + stemOf(slot.key) + "?e=type");
      }
      // FIXED KEY, overwritten in place — see site-images.ts on why it cannot
      // be content-addressed and why /media gives it a short cache instead.
      //
      // Hence upsert. "Overwritten in place" was the intent and not the
      // behaviour: Supabase's POST refuses a key it already holds, so the
      // hero could be set once and never changed, and the second attempt came
      // back as a bare 500. See uploadObject.
      // A FAILURE HERE USED TO BE A BARE 500. The panel rendered that as
      // "Napaka na strežniku", which is true and useless: it named neither the
      // picture nor the reason, and the operator had no move except to try the
      // same thing again. Storage failures are worth naming.
      try {
        await uploadObject(api, slot.key, bytes, "image/webp", true);
      } catch {
        return bulk
          ? new Response("Shramba ni sprejela slike.", { status: 502 })
          : seeOther("/admin/site/" + stemOf(slot.key) + "?e=store");
      }

      // ⚠️ STORING THE BYTES IS NOT THE SAME AS OFFERING THE COLOUR, and this
      // route used to do only the first half.
      //
      // A colour is on the storefront because there is a row in `finishes`;
      // the picture in the bucket is what that row renders as. The bulk drop
      // zone posts through /admin/site-sort, which calls ensureFinish before
      // sending the file here, so that path was always whole. This path — one
      // swatch, uploaded from its own slot page — wrote the image and nothing
      // else. The panel then showed the swatch on the slot page, the operator
      // reasonably concluded the colour was in, and the colour list never
      // heard about it. Two swatches went in that way and neither reached the
      // product pages.
      //
      // ensureFinish is idempotent, so an upload that replaces an existing
      // swatch just finds the row it already has.
      if (finishHere) {
        try {
          await ensureFinish(api, "bazen", finishHere.kind, finishHere.name);
        } catch {
          return bulk
            ? new Response("Slika je shranjena, barve pa ni bilo mogoče dodati na seznam.", { status: 502 })
            : seeOther("/admin/site/" + stemOf(slot.key) + "?e=fin");
        }
      }

      return bulk
        ? new Response(null, { status: 204 })
        : seeOther("/admin/site/" + stemOf(slot.key) + "?m=uploaded");
    }
    if (parts[3]) return page(notFoundPage("Neznano dejanje.", admin.email), 404);

    const n = url.searchParams.get("m")
      ? ({ kind: "ok", text: (Object.hasOwn(NOTICES, url.searchParams.get("m")!) ? NOTICES[url.searchParams.get("m")!] : undefined) ?? "Shranjeno." } as const)
      : url.searchParams.get("e")
        ? ({ kind: "err", text: (Object.hasOwn(ERRORS, url.searchParams.get("e")!) ? ERRORS[url.searchParams.get("e")!] : undefined) ?? "Nalaganje ni uspelo." } as const)
        : undefined;
    return page(
      siteImagePage(
        stemOf(slot.key),
        slot.label,
        slot.note,
        // Cache-bust the preview: the key never changes, so the panel would
        // otherwise show the picture it just replaced.
        "/media/" + slot.key + "?v=" + String(Date.now()),
        n,
        admin.email,
        slot.ratio,
        slot.maxWidth,
        // …and whether that width is a cap or the stored size. Only the
        // colour swatches say "the size", so the sixteen tiles stay one row
        // of identical squares whichever road an upload took.
        slot.exact === true,
        enhanceAvailable(env),
      ),
    );
  }

  // --- one model ---
  const shop = parts[1]!;
  const slug = parts[2] ?? "";
  const cat = CATALOGUE_SHOPS[shop];
  const model = cat ? adminModelBySlug(slug) : undefined;
  if (!cat || !model) return page(notFoundPage("Ta model ne obstaja.", admin.email), 404);

  const productId = await ensureProduct(api, shop, model.slug, model.name, model.freightClass);
  const action = parts[3];

  if (action === "upload" && request.method === "POST") {
    return await upload(request, api, shop, model.slug, model.name, productId);
  }

  if (action === "update" && request.method === "POST") {
    const form = await request.formData();
    const id = String(form.get("id") ?? "");
    const alt = String(form.get("alt") ?? "").trim();
    const sort = Number(form.get("sort") ?? 0);
    if (!id || !alt) return seeOther("/admin/" + shop + "/" + slug + "?e=alt");
    await updateMedia(api, id, { alt, sort: Number.isFinite(sort) ? sort : 0 });
    return seeOther("/admin/" + shop + "/" + slug + "?m=saved");
  }

  // CLEARING A MODEL, WHICH IS THE SAME WORK AS DELETE ONE AND A DIFFERENT RISK.
  //
  // Deleting nine photographs one at a time is nine confirmations and nine
  // page loads, so an operator replacing a set does it with the browser's back
  // button and a lot of patience. That is the case this exists for.
  //
  // It is also the only irreversible button in the panel that cannot be undone
  // by re-uploading one file, so the confirmation names the model and the
  // count rather than asking "are you sure?" — and the COUNT IS RE-READ HERE
  // rather than trusted from the form, so a stale tab cannot be talked into
  // clearing a set that has changed since it was rendered.
  //
  // Objects are removed per row through storedPaths, exactly as the single
  // delete does, so a row whose ladder was written before the widest rung
  // moved to the bare path is handled by the one function that knows the rule.
  // SORTING A GALLERY BY WHAT THE PICTURES ARE OF.
  //
  // Six pools, photographed the same way by the same supplier, and every
  // gallery opened on a different kind of picture. This asks the model what
  // each photograph IS — from the fixed list in shots.ts — and renumbers the
  // set so every model opens on the same establishing shot.
  //
  // ⚠️ IN BATCHES, because a Worker has a subrequest budget and this spends
  // three per photograph: read the file, ask the model, write the answer. A
  // model with thirty photographs would blow it and fail having done nothing.
  // So it classifies a few, reorders everything it knows about, and says how
  // many are left — pressing it again continues. Partial progress is kept
  // rather than rolled back, which is the whole reason it is safe to press
  // twice.
  //
  // Already-classified photographs are skipped and never re-asked: the point
  // is a stable order, and a category that changes each time it is looked at
  // is not an order at all. Changing one is a job for the panel's own select.
  if (action === "arrange" && request.method === "POST") {
    if (!describeAvailable(env)) {
      return seeOther("/admin/" + shop + "/" + slug + "?e=no-ai");
    }
    const rows = await listMedia(api, productId);
    let looked = 0;
    let left = 0;
    for (const row of rows) {
      if (row.shot) continue;
      if (looked >= ARRANGE_BATCH) { left++; continue; }
      const bytes = await downloadObject(api, previewPath(row.url, row.widths));
      if (bytes === null) { left++; continue; }
      looked++;
      const seen = await describe(api.env, bytes, "image/webp", model.name);
      if (seen?.shot) {
        await updateMedia(api, row.id, { shot: seen.shot });
        (row as { shot: string | null }).shot = seen.shot;
      } else {
        // Looked at and got nothing usable back. Counted as remaining rather
        // than silently accepted, so the operator is not told the gallery is
        // sorted when one picture was never placed.
        left++;
      }
    }
    for (const p of arrange(rows)) await updateMedia(api, p.id, { sort: p.sort });
    return seeOther(
      "/admin/" + shop + "/" + slug + (left > 0 ? "?m=arranged-partly" : "?m=arranged"),
    );
  }

  if (action === "delete-all" && request.method === "POST") {
    const form = await request.formData();
    const rows = await listMedia(api, productId);
    // The form carries what the page showed. If the set changed underneath —
    // another tab, another person, an upload finishing — do nothing and say
    // so, because "delete everything" is the wrong thing to guess at.
    const claimed = Number(form.get("count") ?? -1);
    if (rows.length === 0) return seeOther("/admin/" + shop + "/" + slug + "?m=deleted-none");
    if (claimed !== rows.length) {
      return seeOther("/admin/" + shop + "/" + slug + "?e=stale");
    }
    for (const row of rows) {
      await deleteMedia(api, row.id);
      for (const path of storedPaths(row.url, row.widths)) await deleteObject(api, path);
    }
    return seeOther("/admin/" + shop + "/" + slug + "?m=cleared");
  }

  if (action === "delete" && request.method === "POST") {
    const form = await request.formData();
    const id = String(form.get("id") ?? "");
    const rows = await listMedia(api, productId);
    const row = rows.find((r) => r.id === id);
    if (row) {
      // Rows first: an orphaned object costs storage, an orphaned row renders
      // a broken image on a product page.
      await deleteMedia(api, id);
      for (const path of storedPaths(row.url, row.widths)) await deleteObject(api, path);
    }
    return seeOther("/admin/" + shop + "/" + slug + "?m=deleted");
  }

  if (action) return page(notFoundPage("Neznano dejanje.", admin.email), 404);

  const rows = await listMedia(api, productId);
  const notice = url.searchParams.get("m")
    ? ({ kind: "ok", text: (Object.hasOwn(NOTICES, url.searchParams.get("m")!) ? NOTICES[url.searchParams.get("m")!] : undefined) ?? "Shranjeno." } as const)
    : url.searchParams.get("e")
      ? ({ kind: "err", text: (Object.hasOwn(ERRORS, url.searchParams.get("e")!) ? ERRORS[url.searchParams.get("e")!] : undefined) ?? "Nalaganje ni uspelo." } as const)
      : undefined;

  return page(
    modelPage(
      shop,
      model.slug,
      model.name,
      rows.map((r): MediaView => ({
        id: r.id, url: r.url, alt: r.alt, sort: r.sort,
        widths: r.widths ?? [], enhanced: r.enhanced === true, shot: r.shot ?? null })),
      notice,
      admin.email,
      enhanceAvailable(env),
      describeAvailable(env),
    ),
  );
}



/**
 * Which stored file to show the model when classifying an existing photograph.
 *
 * The 800px rung, when there is one. Classifying does not need detail — the
 * question is "is this the whole tub from above, or a close-up of a seat" —
 * and the widest rung on a laddered upload is a 2K file of several hundred
 * kilobytes. Reading thirty of those through a Worker to ask a yes-or-no-shaped
 * question is bandwidth, CPU and Gemini tokens spent on pixels that change no
 * answer.
 *
 * Falls back to the row's own url, which is right for every photograph that
 * predates the ladder — those are single files and there is nothing else to
 * fetch.
 */
/**
 * How many photographs one press of "Razvrsti z UI" looks at.
 *
 * Three subrequests each — read, ask, write — against a Worker's budget, plus
 * the renumbering writes afterwards. Six leaves comfortable room; the operator
 * presses again for the rest, and the notice says so.
 */
const ARRANGE_BATCH = 6;

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

async function upload(
  request: Request,
  api: Api,
  shop: string,
  slug: string,
  name: string,
  productId: string,
): Promise<Response> {
  const form = await request.formData();
  // AN EMPTY DESCRIPTION NO LONGER REFUSES THE UPLOAD.
  //
  // product_media.alt is NOT NULL with a length check, so something has to go
  // in — but "something" was being extracted from the operator one sentence
  // at a time, and a set of ten meant ten sentences before the button would
  // work at all. That is how the bucket ended up with nine photographs
  // sharing one pasted string: a required field does not produce good alt
  // text, it produces whatever gets past it.
  //
  // So the field is optional at every layer now and the stand-in is written
  // here. It is not a description and does not pretend to be one — it names
  // the model and the picture's position, which is true of the file and
  // nothing more. The describer writes a real one when it is configured, the
  // operator can correct any of them from the list below, and neither is a
  // precondition for getting the photograph into the shop.
  const declared = String(form.get("widths") ?? "")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 8000);

  // EVERY RUNG IS READ AND CHECKED BEFORE ANYTHING IS WRITTEN.
  //
  // The old shape uploaded each width as it read it, which was fine while the
  // key was known in advance. It is not any more: the key is built from the
  // description, and the description is written by looking at the picture —
  // so the picture has to be in hand first. Reading them all up front also
  // means a bad rung fails before any object is stored, instead of leaving
  // three of five in the bucket.
  //
  // Five rungs of a 2048px photograph is a couple of megabytes against a
  // Worker's 128, which is the whole reason this can be held rather than
  // streamed.
  const parts: [number, ArrayBuffer][] = [];
  if (declared.length > 0) {
    for (const w of declared) {
      const part = form.get("w" + w);
      if (!(part instanceof File)) continue;
      const bytes = await part.arrayBuffer();
      // The rung says webp and the browser wrote it, but the check is on the
      // bytes: a label is the sender's claim, and this is the one place that
      // can make "every upload is WebP" true rather than intended.
      if (!isWebp(bytes)) return seeOther("/admin/" + shop + "/" + slug + "?e=type");
      parts.push([w, bytes]);
    }
  } else {
    const part = form.get("file");
    if (!(part instanceof File) || part.size === 0) {
      return seeOther("/admin/" + shop + "/" + slug + "?e=file");
    }
    // ⚠️ THIS BRANCH USED TO STORE THE ORIGINAL, whatever it was — the EXT map
    // it consulted listed jpeg, png and avif — so the panel's own promise
    // that every upload is WebP was false the moment scripting was off or
    // createImageBitmap was missing. One JPEG in the bucket is all it takes:
    // the storefront then serves a 250 KB photograph where its neighbours are
    // 9 KB, and nothing anywhere reports it.
    //
    // So the fallback no longer converts by accepting less. It accepts a
    // WebP, or it refuses and says so. That is a real limitation of a
    // no-script upload and it is stated on the form rather than papered over.
    const bytes = await part.arrayBuffer();
    if (!isWebp(bytes)) return seeOther("/admin/" + shop + "/" + slug + "?e=type");
    parts.push([0, bytes]);
  }
  if (parts.length === 0) return seeOther("/admin/" + shop + "/" + slug + "?e=file");

  const widest = parts.reduce((a, b) => (b[0] > a[0] ? b : a));

  // THE DESCRIPTION IS WRITTEN HERE, not typed in the panel.
  //
  // This is the whole point of the panel's new shape: the operator chooses
  // files and nothing else, so the one place that can say what is in a
  // photograph is the code holding the photograph. describe() looks at the
  // widest rung — the same bytes the storefront will serve — and returns a
  // sentence or null; null means no key, a refusal, or an answer that did not
  // survive tidy(), and the stand-in takes over.
  //
  // An operator-supplied alt still wins where one arrives, which keeps the
  // no-script form and any future edit path honest.
  // ONE LOOK, TWO ANSWERS. The model is shown the photograph once and asked
  // both what is in it and what kind of shot it is — see shots.ts. The second
  // costs nothing extra and is what lets every model's gallery open on the
  // same establishing picture.
  const given = String(form.get("alt") ?? "").trim();
  const seen = given ? null : await describe(api.env, widest[1], "image/webp", name);
  const alt = given || seen?.alt || standInAlt(name, form.get("n"));
  const shot = seen?.shot ?? null;

  // THE STEM IS THE ALT TEXT, and it is here for image search: the filename
  // is one of the few signals Google has about what a picture shows, and a
  // bare UUID spends it on nothing. The UUID stays after a double hyphen so
  // the URL still changes whenever the bytes do — see isContentAddressed,
  // which is what keeps these files on the immutable year.
  //
  // If the description slugifies to nothing (no latin letters in it at all)
  // the model slug stands in, so a file always has a readable stem.
  const stem = slugStem(alt) || slugStem(slug) || "slika";
  const id = stem + "--" + crypto.randomUUID();

  const base = shop + "/" + slug + "/" + id + ".webp";
  const written: number[] = [];
  for (const [w, bytes] of parts) {
    const path = w === widest[0] ? base : widthPath(base, w);
    await uploadObject(api, path, bytes, "image/webp");
    if (w !== widest[0] && w > 0) written.push(w);
  }
  if (widest[0] > 0) written.push(widest[0]);
  written.sort((a, b) => a - b);

  // The browser is the only thing that knows whether the upscaler produced
  // anything, so its word is what gets stored. See the enhanced column.
  const enhanced = String(form.get("enhanced") ?? "") === "1";

  const rows = await listMedia(api, productId);
  await insertMedia(api, productId, base, alt, rows.length, enhanced, shot);
  if (written.length > 1) await widthsFor(api, productId, base, written);

  return seeOther("/admin/" + shop + "/" + slug + "?m=uploaded");
}

/** Record the ladder on the row the upload just created. */
async function widthsFor(api: Api, productId: string, url: string, widths: number[]): Promise<void> {
  const rows = await listMedia(api, productId);
  const row = rows.find((r) => r.url === url);
  if (row) await updateMedia(api, row.id, { widths });
}
