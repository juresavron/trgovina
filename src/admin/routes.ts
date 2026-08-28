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

import { OFFERED_MODELS } from "../catalog/pola";
import { OFFERED_SWIMSPAS } from "../catalog/swimspa";
import { aliasTarget, encodeBucketKey } from "../media-aliases";
import { SHOPS } from "../tenants";
import {
  type Api,
  type Env,
  BUCKET,
  deleteMedia,
  deleteObject,
  downloadObject,
  ensureProduct,
  insertMedia,
  listMedia,
  missingConfig,
  updateMedia,
  uploadObject,
} from "./supabase";
import {
  indexPage,
  loginPage,
  modelPage,
  notConfiguredPage,
  notFoundPage,
  siteImagePage,
  type MediaView,
  type SiteSlot,
} from "./panel";
import { SESSION_TTL_SECONDS, currentAdmin, sessionCookie, signIn, readCookie, SESSION_COOKIE } from "./auth";
import {
  SITE_IMAGES,
  legacyFallback,
  siteImageByKey,
  siteImageBySlug,
  stemOf,
  type SiteImage,
} from "./site-images";
import { deleteEnquiry, isStatus, listEnquiries, updateEnquiry } from "./enquiries";
import {
  deleteFinish,
  ensureFinish,
  listFinishes,
  nameFromFilename,
  renameFinish,
} from "./finishes";
import { enquiryListPage } from "./enquiries-panel";
import { finishListPage } from "./finishes-panel";
import {
  assignSlots,
  classify,
  slotOptions,
} from "./assign";
import type { FinishKind } from "../catalog/finish-image";
import { enhance, enhanceAvailable } from "./enhance";
import { describe, describeAvailable } from "./describe";
import { arrange } from "./shots";
import { blogEditPage, blogListPage } from "./blog-panel";
import { reviewEditPage, reviewListPage } from "./reviews-panel";
import {
  createReview,
  deleteReview,
  getReview,
  listReviews,
  updateReview,
} from "./reviews";
import {
  createPost,
  deletePost,
  freeSlug,
  getById,
  listAll,
  setStatus,
  updatePost,
} from "../blog/store";
import { excerptFrom } from "../blog/post";

/** Shops whose catalogue this panel can manage. */
/**
 * Every product the panel can manage, as the panel needs it.
 *
 * ⚠️ THIS USED TO BE THE HOT TUBS ONLY. The list was OFFERED_MODELS and the
 * lookup was polaBySlug, so the three swim spas — half the catalogue, and the
 * half with the largest tickets — had no page in the panel and no way to
 * change a photograph. Nothing errored; they were simply not on the
 * dashboard, which is the quietest way for a tool to be incomplete.
 *
 * The two model types are separate on purpose (a Pola shell and a 5.8 m swim
 * spa share almost no specification) but they agree on the three fields this
 * panel needs, so the panel takes that intersection rather than either type.
 */
interface AdminModel {
  readonly slug: string;
  readonly name: string;
  /** Out-of-gauge freight is not the same problem as a pallet. */
  readonly freightClass: string;
}

const ADMIN_MODELS: readonly AdminModel[] = [
  ...OFFERED_MODELS.map((m) => ({ slug: m.slug, name: m.name, freightClass: "pallet_xl" })),
  // The enum has no out-of-gauge class; white_glove is the honest closest fit
  // for a 4.5-5.8 m shell delivered by a team, and is flagged as such where
  // the products row is written.
  ...OFFERED_SWIMSPAS.map((m) => ({ slug: m.slug, name: m.name, freightClass: "white_glove" })),
];

const CATALOGUE_SHOPS: Record<string, { models: readonly AdminModel[] }> = {
  bazen: { models: ADMIN_MODELS },
};

/** Every slug the panel can manage — the dashboard's coverage, as data. */
export function adminModelSlugs(): string[] {
  return ADMIN_MODELS.map((m) => m.slug);
}

function adminModelBySlug(slug: string): AdminModel | undefined {
  return ADMIN_MODELS.find((m) => m.slug === slug);
}

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
  "referrer-policy": "no-referrer",
};

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
      "x-content-type-options": "nosniff",
    },
  });
}

function seeOther(location: string, extra: Record<string, string> = {}): Response {
  return new Response(null, { status: 303, headers: { location, ...PRIVATE, ...extra } });
}

/* ---- /media ------------------------------------------------------------ */

/**
 * Serve an uploaded image through the Worker.
 *
 * WHY PROXY RATHER THAN LINK STRAIGHT AT SUPABASE. The storage bucket lives in
 * one region (Frankfurt) and on a different origin. Linking to it directly
 * would put a DNS lookup, a TLS handshake and a single-region round trip on
 * the critical path of every product page — on a site whose entire competitive
 * argument is that it loads faster than the incumbents. Proxied, the bytes are
 * same-origin and sit in Cloudflare's cache at the edge nearest the visitor,
 * and the second request never leaves the country.
 *
 * CACHING IS SPLIT BY WHETHER THE PATH IS CONTENT-ADDRESSED, and getting this
 * wrong is how an image appears to be frozen.
 *
 * Everything here used to be served `immutable` for a year, on the stated
 * grounds that "uploads are content-addressed: a new file gets a new UUID".
 * That is true of /admin uploads, which are <shop>/<slug>/<uuid>.webp — a
 * replacement is a different URL, so the old one can be cached forever.
 *
 * It is FALSE for anything uploaded through the Supabase dashboard, where a
 * human picks the name. Replace hero.png in place and the bytes at that URL
 * change while the URL does not — so Cloudflare keeps serving the old file
 * for a year, and every browser that already fetched it keeps its own copy
 * for a year too. The picture simply never updates, with nothing in the logs
 * and nothing failing.
 *
 * So: a UUID stem gets the immutable year. A human-named file gets five
 * minutes and a revalidation, which still serves the overwhelming majority of
 * requests from the edge while letting a replacement actually land.
 */

/**
 * True for a path whose filename ENDS in a UUID, optionally with a -<width>
 * rung: the shape crypto.randomUUID() produces in the admin upload. Those
 * URLs change when their content changes, which is the whole precondition for
 * caching something forever.
 *
 * A DESCRIPTIVE PREFIX IS ALLOWED, and that is the point of the "--".
 * Uploads used to be a bare UUID, which is content-addressed and cacheable
 * and says nothing: an image URL is a ranking signal in image search, and
 * "3f2a…-…-….webp" spends it on nothing. The stem is now slugified alt text
 * — masazni-bazen-na-terasi--3f2a…webp — so the filename describes the
 * picture while the UUID after the double hyphen still guarantees the URL
 * changes whenever the bytes do.
 *
 * Two hyphens, not one, because a slug contains single hyphens and this has
 * to be an unambiguous seam. Bare UUIDs still match: every file already in
 * the bucket keeps its immutable year.
 */
export function isContentAddressed(path: string): boolean {
  return /(^|\/)([a-z0-9][a-z0-9_-]*--)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-\d+)?\.[a-z0-9]+$/i.test(
    path,
  );
}

/**
 * A filename stem from a sentence of Slovenian.
 *
 * Transliterated rather than stripped: č/š/ž are most of the consonants in
 * this shop's vocabulary, and dropping them turns "masažni" into "masani".
 * The output has to satisfy handleMedia's own path pattern — lowercase
 * letters, digits, hyphen, underscore — or the URL this function names would
 * 404 on the way back out.
 *
 * Capped at 60 characters on a WORD boundary. Long is not better here: the
 * signal is in the first few words, and a 180-character filename is what
 * makes a URL unreadable in the one place people actually see it.
 */
export function slugStem(s: string, max = 60): string {
  const map: Record<string, string> = {
    č: "c", ć: "c", š: "s", ž: "z", đ: "d",
    à: "a", á: "a", ä: "a", â: "a", è: "e", é: "e", ë: "e", ê: "e",
    ì: "i", í: "i", ï: "i", î: "i", ò: "o", ó: "o", ö: "o", ô: "o",
    ù: "u", ú: "u", ü: "u", û: "u",
  };
  let out = "";
  for (const ch of s.toLowerCase()) out += map[ch] ?? ch;
  out = out
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (out.length <= max) return out;
  const cut = out.slice(0, max);
  const dash = cut.lastIndexOf("-");
  return (dash > 20 ? cut.slice(0, dash) : cut).replace(/^-+|-+$/g, "");
}
/**
 * A 1×1 fully transparent WebP, 34 bytes.
 *
 * Generated with sharp at lossless quality and decoded back to confirm it is
 * one pixel of rgba(0,0,0,0) — not pasted from memory, because a literal that
 * is subtly wrong here would ship a visible artefact onto every colour tile
 * on every product page and would look exactly like a design decision.
 *
 * Rebuilt per call rather than held as a module-level Uint8Array: a Response
 * body consumes the buffer it is given, so a shared one would serve the first
 * request and empty bodies after it.
 */
const BLANK_PIXEL = (): ArrayBuffer =>
  Uint8Array.from(atob("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="), (c) =>
    c.charCodeAt(0),
  ).buffer as ArrayBuffer;

export async function handleMedia(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    // Same shape as the storefront's 405 (worker.ts): allow, a type, nosniff.
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        allow: "GET, HEAD",
        "content-type": "text/plain; charset=utf-8",
        "x-content-type-options": "nosniff",
      },
    });
  }
  if (!env.SUPABASE_URL) return new Response("Not found", { status: 404 });

  // ⚠️ decodeURIComponent THROWS on an invalid percent-sequence — the WHATWG
  // URL parser leaves "/media/%" in pathname untouched, so the throw happened
  // BEFORE the pattern gate below could 404 it and surfaced as the catch-all
  // 500 (no cache-control, no robots tag) on any host. A malformed name is
  // exactly what the gate exists to refuse; refuse it the same way.
  let path: string;
  try {
    path = decodeURIComponent(new URL(request.url).pathname.slice("/media/".length));
  } catch {
    return new Response("Not found", { status: 404 });
  }

  // An ALIAS resolves a clean site path to a bucket key that could never be a
  // URL — see src/media-aliases.ts. It is a fixed allowlist, so it is a
  // stricter gate than the pattern below rather than a hole in it: the key
  // comes from a table in the source, never from the request.
  const alias = aliasTarget(path);

  // No traversal, no absolute upstreams: only the bucket, only these shapes.
  // Skipped for an alias, whose target is not request-derived at all.
  if (
    !alias &&
    (!/^[a-z0-9][a-z0-9/_-]*\.(webp|jpg|jpeg|png|avif)$/i.test(path) || path.includes(".."))
  ) {
    return new Response("Not found", { status: 404 });
  }

  const key = alias ?? path;
  // Aliased files are human-named by definition, so they never get the
  // immutable year — replacing one in the bucket has to be able to land.
  const forever = !alias && isContentAddressed(path);
  const ttl = forever ? 31536000 : 300;

  const upstream = (k: string) =>
    env.SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/" + encodeBucketKey(k);
  let res = await fetch(upstream(key), { cf: { cacheEverything: true, cacheTtl: ttl } } as RequestInit);

  // A MANAGED SITE IMAGE THAT HAS NOT BEEN REPLACED YET falls back to the file
  // it is taking over from, once. The storefront names these in code and
  // renders synchronously, so it cannot learn a new filename — which means the
  // new key has to be referenced before anything exists at it, and a hero that
  // 404s is worse than a heavy one. The fallback answers only for the three
  // keys in SITE_IMAGES; it is not a general retry.
  if (!res.ok) {
    const legacy = legacyFallback(key);
    if (legacy) {
      res = await fetch(upstream(legacy), { cf: { cacheEverything: true, cacheTtl: 300 } } as RequestInit);
    }
  }
  if (!res.ok) {
    // ⚠️ AN OPTIONAL SLOT NOBODY HAS UPLOADED YET ANSWERS WITH NOTHING, NOT
    // WITH A 404 — and the difference is sixteen failing requests per page.
    //
    // site-images.ts marks the sixteen finish swatches `optional` because
    // they are painted as CSS BACKGROUNDS: a colour nobody has photographed
    // paints the tile's own ground and its name, with no broken-image icon.
    // That degrades quietly on screen and was extremely loud everywhere else.
    // Every product page asks for all sixteen, each one 404s, and the 404
    // carries `no-store` — so the absence is never cached and all sixteen
    // requests repeat on every single view, for every visitor, until the day
    // the shop uploads swatches. The owner found it as sixteen red lines in
    // the console.
    //
    // A 1×1 fully transparent WebP is 34 bytes and gives the same picture
    // (nothing, over the tile's ground) with a 200 the browser will cache.
    // After the first view the requests stop; on the day a real swatch lands
    // the 300-second TTL below picks it up, exactly like every other managed
    // image.
    //
    // ONLY for slots the registry itself marks optional. Everything else —
    // the hero, the gallery, a product photograph — keeps its 404, because
    // there a missing file is a fault to see rather than a state to absorb.
    const slot = siteImageByKey(key);
    if (slot?.optional) {
      return new Response(BLANK_PIXEL(), {
        status: 200,
        headers: {
          "content-type": "image/webp",
          "x-content-type-options": "nosniff",
          "cache-control": "public, max-age=300, must-revalidate",
        },
      });
    }
    return new Response("Not found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") ?? "image/webp",
      // nosniff on bytes proxied from storage: whatever the bucket claims,
      // the browser must not second-guess it into something executable.
      "x-content-type-options": "nosniff",
      "cache-control": forever
        ? "public, max-age=31536000, immutable"
        : "public, max-age=300, must-revalidate",
    },
  });
}

/* ---- /admin ------------------------------------------------------------ */

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
            authorization: "Bearer " + token,
          },
        });
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
          cover: shots[i]![0]?.url,
        })),
        admin.email,
        SITE_IMAGES.map(
          (x): SiteSlot => ({
            stem: stemOf(x.key),
            label: x.label,
            note: x.note,
            src: "/media/" + x.key,
            group: x.group,
          }),
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
        "x-content-type-options": "nosniff",
      },
    });
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
    // A ceiling, said plainly: the site has seventeen slots, and a batch of
    // fifty is either a mistake or the product catalogue, which has its own
    // uploader.
    if (files.length > 20) return json({ error: "Največ 20 slik naenkrat." }, 400);
    // The shipped client sends ~200 KB probes; the server cannot rely on
    // that, and each file is base64d into a Gemini payload. Per-file and
    // whole-batch caps keep a direct caller from buffering the isolate out.
    if (files.some((f) => f.size > 4 * 1024 * 1024)) {
      return json({ error: "Posamezna slika za razvrščanje sme meriti do 4 MB." }, 413);
    }
    if (files.reduce((n, f) => n + f.size, 0) > 24 * 1024 * 1024) {
      return json({ error: "Celoten izbor sme meriti do 24 MB." }, 413);
    }

    // WHICH CATALOGUE. Default is the whole site — the flow this endpoint was
    // built for. "barva"/"obloga" narrow it to one colour list, which is a
    // different and much easier question: sixteen near-identical slot notes
    // inside a 46-option prompt is not a catalogue a model can choose from,
    // and the owner drops the colour samples as their own batch anyway.
    const scope = form.get("scope");
    const kind: FinishKind | null =
      scope === "barva" ? "barva" : scope === "obloga" ? "obloga" : null;

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
      const items = [];
      for (let i = 0; i < files.length; i++) {
        const name = nameFromFilename(names[i] ?? "");
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
                reason: 'Barva "' + finish.name + '" po imenu datoteke.',
              }
            : {
                i,
                stem: null,
                label: null,
                ar: null,
                max: null,
                exact: false,
                reason: "Iz imena datoteke ni bilo mogoče razbrati imena barve — " +
                  "preimenujte jo po barvi (npr. »Oyster Opal.jpg«) in poskusite znova.",
              },
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
        reason: a.reason,
      })),
    });
  }

  // --- colours ---
  //
  // ⚠️ NO "ADD" FORM, AND THAT IS THE FEATURE. A colour exists because a
  // swatch was uploaded and the name came off the file; typing a name here
  // would put a tile on six product pages with nothing behind it, which is
  // precisely the arrangement this inverted. What the page offers is the
  // list, a rename for a typo, and a delete.
  if (parts[1] === "barve") {
    const shopKey = "bazen";
    const id = parts[2];

    if (id && request.method === "POST") {
      if (parts[3] === "izbris") {
        await deleteFinish(api, shopKey, id);
        return seeOther("/admin/barve?m=fin-deleted");
      }
      const form = await request.formData();
      await renameFinish(api, shopKey, id, String(form.get("name") ?? ""));
      return seeOther("/admin/barve?m=fin-saved");
    }

    const notice = url.searchParams.get("m")
      ? ({
          kind: "ok",
          text:
            (Object.hasOwn(NOTICES, url.searchParams.get("m")!)
              ? NOTICES[url.searchParams.get("m")!]
              : undefined) ?? "Shranjeno.",
        } as const)
      : undefined;
    return page(finishListPage(await listFinishes(api, shopKey), admin.email, notice));
  }

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
  if (parts[1] === "povprasevanja") {
    const shopKey = "bazen";
    const id = parts[2];

    if (id && request.method === "POST") {
      if (parts[3] === "izbris") {
        await deleteEnquiry(api, shopKey, id);
        return seeOther("/admin/povprasevanja?m=enq-deleted");
      }
      const form = await request.formData();
      const statusRaw = String(form.get("status") ?? "");
      await updateEnquiry(api, shopKey, id, {
        // An unknown status is DROPPED rather than defaulted: a select whose
        // value did not survive the round trip should leave the row alone,
        // not quietly move it to "nova".
        ...(isStatus(statusRaw) ? { status: statusRaw } : {}),
        note: String(form.get("note") ?? ""),
      });
      return seeOther("/admin/povprasevanja?m=enq-saved");
    }

    const notice = url.searchParams.get("m")
      ? ({
          kind: "ok",
          text:
            (Object.hasOwn(NOTICES, url.searchParams.get("m")!)
              ? NOTICES[url.searchParams.get("m")!]
              : undefined) ?? "Shranjeno.",
        } as const)
      : undefined;
    return page(enquiryListPage(await listEnquiries(api, shopKey), admin.email, notice));
  }

  // --- customer reviews ---
  //
  // ⚠️ THE MOST LEGALLY LOADED SURFACE IN THIS PANEL. See admin/reviews.ts for
  // the two Annex I entries; what matters here is that "published" and
  // "verified" are separate decisions and the second one refuses to save
  // without the order number that justifies it.
  if (parts[1] === "mnenja") {
    const shopKey = "bazen";
    const notice = url.searchParams.get("m")
      ? ({ kind: "ok", text: (Object.hasOwn(NOTICES, url.searchParams.get("m")!) ? NOTICES[url.searchParams.get("m")!] : undefined) ?? "Shranjeno." } as const)
      : url.searchParams.get("e")
        ? ({ kind: "err", text: (Object.hasOwn(ERRORS, url.searchParams.get("e")!) ? ERRORS[url.searchParams.get("e")!] : undefined) ?? "Ni uspelo." } as const)
        : undefined;
    const cat = CATALOGUE_SHOPS[shopKey]!;
    const models = cat.models.map((m) => ({ slug: m.slug, name: m.name }));

    /**
     * The form, with the product resolved to a real row.
     *
     * The model arrives as a SLUG and is matched against this shop's own
     * catalogue before it becomes anything — a review may only ever name a
     * product the shop actually sells. The two invented reviews this replaces
     * named "BAZEN RELAX 5", a model that has never existed.
     */
    const read = async (): Promise<
      { ok: true; draft: Parameters<typeof createReview>[2] } | { ok: false; why: string }
    > => {
      const form = await request.formData();
      const body = String(form.get("body") ?? "").trim();
      const authorName = String(form.get("who") ?? "").trim();
      if (!body || !authorName) return { ok: false, why: "rv-empty" };
      const orderNumber = String(form.get("order") ?? "").trim();
      const verified = form.get("verified") !== null;
      if (verified && orderNumber === "") return { ok: false, why: "rv-unverified" };
      const slug = String(form.get("model") ?? "");
      const model = cat.models.find((m) => m.slug === slug);
      const productId = model
        ? await ensureProduct(api, shopKey, model.slug, model.name, model.freightClass)
        : null;
      const rating = Number(form.get("rating") ?? 5);
      return {
        ok: true,
        draft: {
          body,
          authorName,
          rating: Number.isFinite(rating) ? rating : 5,
          productId,
          orderNumber,
          verified,
          published: form.get("published") !== null,
        },
      };
    };

    if (parts.length === 2 && request.method === "GET") {
      return page(reviewListPage(await listReviews(api, shopKey), admin.email, notice));
    }

    if (parts[2] === "novo") {
      if (request.method === "GET") {
        return page(reviewEditPage(null, models, admin.email, notice));
      }
      if (request.method === "POST") {
        const got = await read();
        if (!got.ok) return seeOther("/admin/mnenja/novo?e=" + got.why);
        try {
          const made = await createReview(api, shopKey, got.draft);
          return seeOther("/admin/mnenja/" + made.id + "?m=rv-saved");
        } catch (err) {
          console.error(err);
          return seeOther("/admin/mnenja/novo?e=rv");
        }
      }
    }

    const rid = parts[2] ?? "";
    if (!rid) return page(notFoundPage("To mnenje ne obstaja.", admin.email), 404);
    const review = await getReview(api, shopKey, rid);
    if (!review) return page(notFoundPage("To mnenje ne obstaja.", admin.email), 404);
    const rhere = "/admin/mnenja/" + review.id;

    if (parts.length === 3 && request.method === "GET") {
      return page(reviewEditPage(review, models, admin.email, notice));
    }
    if (parts.length === 3 && request.method === "POST") {
      const got = await read();
      if (!got.ok) return seeOther(rhere + "?e=" + got.why);
      try {
        await updateReview(api, shopKey, review.id, got.draft);
      } catch (err) {
        console.error(err);
        return seeOther(rhere + "?e=rv");
      }
      return seeOther(rhere + "?m=rv-saved");
    }
    if (parts[3] === "delete" && request.method === "POST") {
      await deleteReview(api, shopKey, review.id);
      return seeOther("/admin/mnenja?m=rv-deleted");
    }
    return page(notFoundPage("Neznano dejanje.", admin.email), 404);
  }

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
  if (parts[1] === "blog") {
    const shopKey = "bazen";
    const notice = url.searchParams.get("m")
      ? ({ kind: "ok", text: (Object.hasOwn(NOTICES, url.searchParams.get("m")!) ? NOTICES[url.searchParams.get("m")!] : undefined) ?? "Shranjeno." } as const)
      : url.searchParams.get("e")
        ? ({ kind: "err", text: (Object.hasOwn(ERRORS, url.searchParams.get("e")!) ? ERRORS[url.searchParams.get("e")!] : undefined) ?? "Ni uspelo." } as const)
        : undefined;
    const siteUrl = SHOPS[shopKey]?.siteUrl ?? "";

    /** Title, excerpt and body off the form, with the excerpt derived if blank. */
    const readForm = async (): Promise<{ title: string; excerpt: string; source: string } | null> => {
      const form = await request.formData();
      const title = String(form.get("title") ?? "").trim();
      if (!title) return null;
      const source = String(form.get("body") ?? "");
      // A post with no summary still needs one: it is the card's standfirst
      // and the meta description, and an empty description is a search result
      // Google writes for you out of whatever it finds.
      const excerpt = String(form.get("excerpt") ?? "").trim() || excerptFrom(source);
      return { title, excerpt, source };
    };

    // The list.
    if (parts.length === 2 && request.method === "GET") {
      return page(blogListPage(await listAll(api, shopKey), admin.email, notice));
    }

    // A new one. GET draws the empty editor; POST creates a DRAFT and lands
    // on its own page, so the operator is where the cover form and the
    // publish button are.
    if (parts[2] === "nov") {
      if (request.method === "GET") return page(blogEditPage(null, admin.email, siteUrl, notice));
      if (request.method === "POST") {
        const fields = await readForm();
        if (!fields) return seeOther("/admin/blog/nov?e=title");
        const slug = await freeSlug(api, shopKey, slugStem(fields.title));
        const made = await createPost(api, shopKey, { slug, ...fields });
        return seeOther("/admin/blog/" + made.id + "?m=post-saved");
      }
    }

    const id = parts[2] ?? "";
    if (!id) return page(notFoundPage("Ta zapis ne obstaja.", admin.email), 404);
    const post = await getById(api, shopKey, id);
    if (!post) return page(notFoundPage("Ta zapis ne obstaja.", admin.email), 404);
    const here = "/admin/blog/" + post.id;

    // The editor.
    if (parts.length === 3 && request.method === "GET") {
      return page(blogEditPage(post, admin.email, siteUrl, notice));
    }

    // Save, and optionally publish or withdraw in the same press. One button
    // rather than two pages: an operator who has just finished writing wants
    // to publish what they wrote, not what was saved a moment ago.
    if (parts.length === 3 && request.method === "POST") {
      const form = await request.formData();
      const title = String(form.get("title") ?? "").trim();
      if (!title) return seeOther(here + "?e=title");
      const source = String(form.get("body") ?? "");
      const excerpt = String(form.get("excerpt") ?? "").trim() || excerptFrom(source);
      // The slug FOLLOWS THE TITLE ONLY WHILE THE POST IS A DRAFT. Once it is
      // published the URL is out in the world — in somebody's history, in a
      // search index, in a message — and renaming it because a typo was fixed
      // breaks every one of those links silently.
      const slug =
        post.status === "draft" && slugStem(title) !== post.slug
          ? await freeSlug(api, shopKey, slugStem(title), post.id)
          : post.slug;
      try {
        await updatePost(api, shopKey, post.id, { slug, title, excerpt, source });
      } catch (err) {
        console.error(err);
        return seeOther(here + "?e=post");
      }
      const then = String(form.get("then") ?? "");
      if (then === "publish") {
        await setStatus(api, shopKey, post.id, "published", post.publishedAt === null);
        return seeOther(here + "?m=post-published");
      }
      if (then === "unpublish") {
        await setStatus(api, shopKey, post.id, "draft", false);
        return seeOther(here + "?m=post-unpublished");
      }
      return seeOther(here + "?m=post-saved");
    }

    if (parts[3] === "delete" && request.method === "POST") {
      await deletePost(api, shopKey, post.id);
      return seeOther("/admin/blog?m=post-deleted");
    }

    // The cover. Stored under a content-addressed key so a replacement is a
    // new URL and no cache anywhere serves the old picture — the reason the
    // product photographs are addressed the same way, and the reason the site
    // slots (which cannot be) get a short cache instead.
    if (parts[3] === "cover" && request.method === "POST") {
      const form = await request.formData();
      const part = form.get("file");
      const alt = String(form.get("alt") ?? "").trim();
      if (!(part instanceof File) || part.size === 0) return seeOther(here + "?e=file");
      const bytes = await part.arrayBuffer();
      if (!isWebp(bytes)) return seeOther(here + "?e=type");
      const key = "blog/" + post.slug + "--" + crypto.randomUUID() + ".webp";
      try {
        await uploadObject(api, key, bytes, "image/webp");
      } catch (err) {
        console.error(err);
        return seeOther(here + "?e=store");
      }
      await updatePost(api, shopKey, post.id, {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        source: post.source,
        coverUrl: "/media/" + key,
        coverAlt: alt || post.title,
      });
      return seeOther(here + "?m=cover-set");
    }

    if (parts[3] === "cover-clear" && request.method === "POST") {
      // The row loses the picture; the object stays. A cover that has been
      // published is in somebody's cache and in a share card, and the storage
      // cost of a stray WebP is not worth a broken image on a link that was
      // sent last week. Product photographs are deleted because they are
      // MANAGED — there is a page listing them — and a blog cover is not.
      await updatePost(api, shopKey, post.id, {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        source: post.source,
        coverUrl: null,
        coverAlt: "",
      });
      return seeOther(here + "?m=cover-cleared");
    }

    return page(notFoundPage("Neznano dejanje.", admin.email), 404);
  }

  // --- one site image ---
  //
  // Before the model lookup, because "site" is not a shop key and would
  // otherwise fall through to "this model does not exist".
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
    const slot: SiteImage | undefined =
      siteImageBySlug(stem) ??
      (dyn
        ? {
            key: "site/" + stem + ".webp",
            group: dyn[1] === "barva" ? "Barve školjke" : "Barve obloge",
            label: stem,
            note: "",
            optional: true,
            ratio: [1, 1],
            maxWidth: 400,
            exact: true,
          }
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
        widths: r.widths ?? [], enhanced: r.enhanced === true, shot: r.shot ?? null,
      })),
      notice,
      admin.email,
      enhanceAvailable(env),
      describeAvailable(env),
    ),
  );
}

/**
 * Why an upload was refused, in the operator's language.
 *
 * One message for every `e` used to render regardless of cause — it always
 * said the alt text was missing — so the day a second failure existed the
 * panel would have confidently reported the wrong one.
 */
const ERRORS: Record<string, string> = {
  // Kept for links that may still carry it; nothing emits it any more — an
  // upload is no longer refused for want of a description.
  alt: "Opis slike je obvezen.",
  file: "Nobena slika ni bila izbrana.",
  // The panel converts every upload itself, in the browser, before it sends
  // anything — so this message is about the CONVERSION not having run, not
  // about the operator's file being the wrong kind. Naming JavaScript first
  // is the useful half: with script on, no browser this panel supports
  // reaches here.
  type: "Slika ni bila pretvorjena v WebP. To se zgodi le, če je JavaScript " +
    "izklopljen — vklopite ga in poskusite znova.",
  // The page said one thing and the database said another, so nothing was
  // deleted. The operator gets to look before deciding again.
  stale: "Seznam fotografij se je med tem spremenil, zato ni bilo nič " +
    "izbrisano. Osvežite stran in poskusite znova.",
  "no-ai": "Razvrščanje potrebuje GEMINI_API_KEY, ki ni nastavljen.",
  store: "Slike ni bilo mogoče shraniti. Poskusite znova; če se ponovi, " +
    "je težava pri shrambi in ne pri vaši sliki.",
  title: "Zapis potrebuje naslov.",
  post: "Zapisa ni bilo mogoče shraniti. Poskusite znova.",
  rv: "Mnenja ni bilo mogoče shraniti. Poskusite znova.",
  "rv-empty": "Mnenje potrebuje besedilo in podpis.",
  // The tick was offered, the evidence was not. See reviews.ts: the chip is a
  // claim under Annex I 23b and the order number is the check behind it.
  "rv-unverified": "Za oznako »preverjen nakup« vpišite številko naročila.",
};

const NOTICES: Record<string, string> = {
  saved: "Shranjeno.",
  deleted: "Fotografija je izbrisana.",
  uploaded: "Fotografija je naložena.",
  cleared: "Vse fotografije tega modela so izbrisane.",
  arranged: "Fotografije so razvrščene po vrsti posnetka.",
  // Honest rather than tidy: some were placed, some were not, and pressing
  // the button again continues where this left off.
  "arranged-partly": "Del fotografij je razvrščen. Pritisnite »Razvrsti z UI« " +
    "še enkrat, da se razvrstijo tudi ostale.",
  // Not an error: the operator asked for an empty set and the set is empty.
  "deleted-none": "Ta model ni imel fotografij.",
  "post-saved": "Zapis je shranjen.",
  "enq-saved": "Povpraševanje je posodobljeno.",
  "enq-deleted": "Povpraševanje je izbrisano.",
  "fin-saved": "Ime barve je shranjeno.",
  "fin-deleted": "Barva je odstranjena s seznama.",
  "post-published": "Zapis je objavljen in je na spletni strani.",
  "post-unpublished": "Zapis je umaknjen s spletne strani.",
  "post-deleted": "Zapis je izbrisan.",
  "cover-set": "Naslovna slika je naložena.",
  "cover-cleared": "Naslovna slika je odstranjena.",
  "rv-saved": "Mnenje je shranjeno. Na strani se pokaže ob naslednji posodobitvi.",
  "rv-deleted": "Mnenje je izbrisano.",
};

/** "bazen/slug/uuid.webp" + 800 → "bazen/slug/uuid-800.webp" */
export function widthPath(url: string, w: number): string {
  const dot = url.lastIndexOf(".");
  return dot < 0 ? url + "-" + w : url.slice(0, dot) + "-" + w + url.slice(dot);
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

export function previewPath(url: string, widths: readonly number[] | null | undefined): string {
  const ladder = (widths ?? []).filter((w) => Number.isFinite(w) && w > 0);
  const widest = ladder.length > 0 ? Math.max(...ladder) : 0;
  // The widest rung lives at the bare path, so asking for a suffixed version
  // of it would be asking for a file that was never written — the same trap
  // that broke delete. Only a NARROWER rung has a suffix.
  return ladder.includes(800) && widest !== 800 ? widthPath(url, 800) : url;
}

/**
 * Every object an image row actually put in the bucket.
 *
 * ⚠️ THE WIDEST RUNG HAS NO SUFFIX, and forgetting that is what made deleting
 * a photograph fail. upload() stores the largest width at the bare path — that
 * is the URL the row carries and the storefront serves — and only the narrower
 * ones at "<stem>-<w>.webp". But it records EVERY width in the widths column,
 * the widest included. So a row reading [480, 800, 1200, 1600, 2048] has five
 * objects behind it and exactly four of them are suffixed: there is no
 * "-2048.webp", and there never was.
 *
 * Delete used to ask for one anyway. Supabase Storage answers a key that was
 * never written with 400, not 404 (deleteObject now reads the body, which is
 * the other half of this fix), so the request threw and the panel said "Napaka
 * na strežniku" — after deleteMedia had already removed the row. The operator
 * watched the photograph disappear from the shop while being told the server
 * had failed, and the four objects that DID exist stayed in the bucket.
 *
 * Deriving the set from the row instead of guessing at it is what keeps those
 * two facts — what was written, what gets removed — from drifting apart again.
 *
 * An empty widths column is the one-size case, old dashboard uploads included:
 * one object, at the row's own url.
 */
export function storedPaths(url: string, widths: readonly number[] | null | undefined): string[] {
  const ladder = (widths ?? []).filter((w) => Number.isFinite(w) && w > 0);
  const widest = ladder.length > 0 ? Math.max(...ladder) : 0;
  const narrower = [...new Set(ladder)].filter((w) => w !== widest).sort((a, b) => a - b);
  return [url, ...narrower.map((w) => widthPath(url, w))];
}

/**
 * Is this actually a WebP file?
 *
 * READ FROM THE BYTES, NOT FROM THE CLIENT. A multipart part carries whatever
 * content-type the sender put on it, and the browser path here sets
 * "image/webp" itself — so trusting the label means the server's guarantee is
 * really the client's promise. A file is WebP when it opens with the RIFF
 * container magic and names WEBP as its form type, and nothing else is.
 *
 *   bytes 0-3   "RIFF"
 *   bytes 4-7   little-endian length, ignored here
 *   bytes 8-11  "WEBP"
 */
export function isWebp(bytes: ArrayBuffer): boolean {
  if (bytes.byteLength < 12) return false;
  const b = new Uint8Array(bytes, 0, 12);
  return (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  );
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
