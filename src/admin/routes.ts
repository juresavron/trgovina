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
import { SESSION_TTL_SECONDS, currentAdmin, sessionCookie, signIn } from "./auth";
import { SITE_IMAGES, legacyFallback, siteImageBySlug, stemOf } from "./site-images";
import { enhance, enhanceAvailable } from "./enhance";
import { describe, describeAvailable } from "./describe";

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

const HTML = { "content-type": "text/html; charset=utf-8" };
const PRIVATE = {
  ...HTML,
  "x-robots-tag": "noindex, nofollow",
  "cache-control": "no-store",
  // The panel has no third-party anything; say so rather than relying on it.
  "content-security-policy":
    "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
};

function page(body: string, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { ...PRIVATE, ...extra } });
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
export async function handleMedia(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!env.SUPABASE_URL) return new Response("Not found", { status: 404 });

  const path = decodeURIComponent(new URL(request.url).pathname.slice("/media/".length));

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
  if (!res.ok) return new Response("Not found", { status: 404 });

  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") ?? "image/webp",
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
    const bytes = await part.arrayBuffer();
    const done = await enhance(env, bytes, part.type || "image/jpeg");
    // Null means the upscaler did not produce anything usable. Answering 204
    // rather than an error is what lets the browser carry on with the file it
    // already has: an optional enhancement must never cost an upload.
    if (!done) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    return new Response(done.bytes, {
      status: 200,
      headers: { "content-type": done.mime, "cache-control": "no-store" },
    });
  }

  // --- the describer ---
  //
  // Sits beside the upscaler and behaves the same way: one image in, an
  // optional improvement out, 204 when there is nothing to give. It writes
  // the alt text the operator would otherwise type ten times for ten files —
  // see describe.ts on what the model is and is not allowed to say, and why
  // the answer lands in an editable field rather than in the database.
  if (parts[1] === "describe" && request.method === "POST") {
    if (!describeAvailable(env)) return new Response("Not found", { status: 404 });
    const form = await request.formData();
    const part = form.get("file");
    if (!(part instanceof File) || part.size === 0) {
      return new Response("No file", { status: 400 });
    }
    const subject = String(form.get("subject") ?? "").slice(0, 120);
    const bytes = await part.arrayBuffer();
    const text = await describe(env, bytes, part.type || "image/jpeg", subject);
    if (!text) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    return new Response(text, {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  // --- one site image ---
  //
  // Before the model lookup, because "site" is not a shop key and would
  // otherwise fall through to "this model does not exist".
  if (parts[1] === "site") {
    const slot = siteImageBySlug(parts[2] ?? "");
    if (!slot) return page(notFoundPage("Ta slika ne obstaja.", admin.email), 404);

    if (parts[3] === "upload" && request.method === "POST") {
      const form = await request.formData();
      const part = form.get("file");
      if (!(part instanceof File) || part.size === 0) {
        return seeOther("/admin/site/" + stemOf(slot.key) + "?e=alt");
      }
      const bytes = await part.arrayBuffer();
      // Same guarantee as every other upload: the bytes decide, not the label.
      if (!isWebp(bytes)) return seeOther("/admin/site/" + stemOf(slot.key) + "?e=type");
      // FIXED KEY, overwritten in place — see site-images.ts on why it cannot
      // be content-addressed and why /media gives it a short cache instead.
      await uploadObject(api, slot.key, bytes, "image/webp");
      return seeOther("/admin/site/" + stemOf(slot.key) + "?m=uploaded");
    }
    if (parts[3]) return page(notFoundPage("Neznano dejanje.", admin.email), 404);

    const n = url.searchParams.get("m")
      ? ({ kind: "ok", text: NOTICES[url.searchParams.get("m")!] ?? "Shranjeno." } as const)
      : url.searchParams.get("e")
        ? ({ kind: "err", text: ERRORS[url.searchParams.get("e")!] ?? "Nalaganje ni uspelo." } as const)
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

  if (action === "delete" && request.method === "POST") {
    const form = await request.formData();
    const id = String(form.get("id") ?? "");
    const rows = await listMedia(api, productId);
    const row = rows.find((r) => r.id === id);
    if (row) {
      // Rows first: an orphaned object costs storage, an orphaned row renders
      // a broken image on a product page.
      await deleteMedia(api, id);
      for (const w of row.widths ?? []) await deleteObject(api, widthPath(row.url, w));
      await deleteObject(api, row.url);
    }
    return seeOther("/admin/" + shop + "/" + slug + "?m=deleted");
  }

  if (action) return page(notFoundPage("Neznano dejanje.", admin.email), 404);

  const rows = await listMedia(api, productId);
  const notice = url.searchParams.get("m")
    ? ({ kind: "ok", text: NOTICES[url.searchParams.get("m")!] ?? "Shranjeno." } as const)
    : url.searchParams.get("e")
      ? ({ kind: "err", text: ERRORS[url.searchParams.get("e")!] ?? "Nalaganje ni uspelo." } as const)
      : undefined;

  return page(
    modelPage(
      shop,
      model.slug,
      model.name,
      rows.map((r): MediaView => ({ id: r.id, url: r.url, alt: r.alt, sort: r.sort, widths: r.widths ?? [] })),
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
  alt: "Opis slike je obvezen.",
  // The panel converts every upload itself, in the browser, before it sends
  // anything — so this message is about the CONVERSION not having run, not
  // about the operator's file being the wrong kind. Naming JavaScript first
  // is the useful half: with script on, no browser this panel supports
  // reaches here.
  type: "Slika ni bila pretvorjena v WebP. To se zgodi le, če je JavaScript " +
    "izklopljen — vklopite ga in poskusite znova.",
};

const NOTICES: Record<string, string> = {
  saved: "Shranjeno.",
  deleted: "Fotografija je izbrisana.",
  uploaded: "Fotografija je naložena.",
};

/** "bazen/slug/uuid.webp" + 800 → "bazen/slug/uuid-800.webp" */
export function widthPath(url: string, w: number): string {
  const dot = url.lastIndexOf(".");
  return dot < 0 ? url + "-" + w : url.slice(0, dot) + "-" + w + url.slice(dot);
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
  const alt = String(form.get("alt") ?? "").trim() || standInAlt(name, form.get("n"));

  // THE STEM IS THE ALT TEXT, and it is here for image search: the filename
  // is one of the few signals Google has about what a picture shows, and a
  // bare UUID spends it on nothing. The UUID stays after a double hyphen so
  // the URL still changes whenever the bytes do — see isContentAddressed,
  // which is what keeps these files on the immutable year.
  //
  // The alt text is the operator's own sentence about this photograph, which
  // makes it the best description of it anybody has. If it slugifies to
  // nothing (a description with no latin letters in it at all) the model slug
  // stands in, so a file always has a readable stem.
  const stem = slugStem(alt) || slugStem(slug) || "slika";
  const id = stem + "--" + crypto.randomUUID();
  const declared = String(form.get("widths") ?? "")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 8000);

  // With script: one part per width, already WebP. Without: the original file.
  const written: number[] = [];
  let base = "";

  if (declared.length > 0) {
    base = shop + "/" + slug + "/" + id + ".webp";
    const widest = Math.max(...declared);
    for (const w of declared) {
      const part = form.get("w" + w);
      if (!(part instanceof File)) continue;
      const bytes = await part.arrayBuffer();
      // The rung says webp and the browser wrote it, but the check is on the
      // bytes: a label is the sender's claim, and this is the one place that
      // can make "every upload is WebP" true rather than intended.
      if (!isWebp(bytes)) return seeOther("/admin/" + shop + "/" + slug + "?e=type");
      const path = w === widest ? base : widthPath(base, w);
      await uploadObject(api, path, bytes, "image/webp");
      if (w !== widest) written.push(w);
    }
    written.push(widest);
    written.sort((a, b) => a - b);
  } else {
    const part = form.get("file");
    if (!(part instanceof File) || part.size === 0) {
      return seeOther("/admin/" + shop + "/" + slug + "?e=alt");
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
    base = shop + "/" + slug + "/" + id + ".webp";
    await uploadObject(api, base, bytes, "image/webp");
  }

  const rows = await listMedia(api, productId);
  await insertMedia(api, productId, base, alt, rows.length);
  if (written.length > 1) await widthsFor(api, productId, base, written);

  return seeOther("/admin/" + shop + "/" + slug + "?m=uploaded");
}

/** Record the ladder on the row the upload just created. */
async function widthsFor(api: Api, productId: string, url: string, widths: number[]): Promise<void> {
  const rows = await listMedia(api, productId);
  const row = rows.find((r) => r.url === url);
  if (row) await updateMedia(api, row.id, { widths });
}
