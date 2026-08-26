/**
 * The admin panel's routes, and the /media proxy the storefront reads.
 *
 * SECURITY SHAPE, in one place so it can be checked at a glance:
 *
 *   * Every path under /admin except the login POST requires a verified
 *     session. The check happens in `handleAdmin` BEFORE any handler that
 *     touches the service role is reached, so there is one gate, not eight.
 *   * Every response from /admin carries `x-robots-tag: noindex, nofollow`
 *     and `cache-control: no-store`, and robots.txt disallows /admin.
 *   * Writes are POST only. A GET that changed data would be triggerable by
 *     any image tag on any page in the world.
 *   * The session cookie is SameSite=Strict, so a form on another origin
 *     cannot post with it — that plus POST-only is the CSRF defence.
 *   * /media is public and read-only, and can only ever proxy the one bucket.
 */

import { OFFERED_MODELS } from "../catalog/pola";
import { OFFERED_SWIMSPAS } from "../catalog/swimspa";
import { aliasTarget, encodeBucketKey } from "../media-aliases";
import { SHOPS } from "../tenants";
import {
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
import { indexPage, loginPage, modelPage, notConfiguredPage, type MediaView } from "./panel";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  mintSession,
  readCookie,
  sessionCookie,
  timingSafeEqual,
  verifySession,
} from "./session";

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
 * True for a path whose filename is a UUID, optionally with a -<width> rung:
 * the shape crypto.randomUUID() produces in the admin upload. Those URLs
 * change when their content changes, which is the whole precondition for
 * caching something forever.
 */
export function isContentAddressed(path: string): boolean {
  return /(^|\/)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(-\d+)?\.[a-z0-9]+$/i.test(
    path,
  );
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

  const upstream =
    env.SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/" + encodeBucketKey(key);
  const res = await fetch(upstream, { cf: { cacheEverything: true, cacheTtl: ttl } } as RequestInit);
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
    const given = String(form.get("password") ?? "");
    if (!timingSafeEqual(given, env.ADMIN_PASSWORD!)) {
      // No distinction between "wrong password" and "no password": both are
      // the same failure, and saying which is free information.
      return page(loginPage("Napačno geslo."), 401);
    }
    const value = await mintSession(env.ADMIN_SECRET!);
    return seeOther("/admin", { "set-cookie": sessionCookie(value, SESSION_TTL_SECONDS) });
  }

  if (parts[1] === "logout" && request.method === "POST") {
    return seeOther("/admin", { "set-cookie": sessionCookie("", 0) });
  }

  // --- the gate ---
  const ok = await verifySession(readCookie(request, SESSION_COOKIE), env.ADMIN_SECRET!);
  if (!ok) return page(loginPage(), parts.length > 1 ? 401 : 200);

  // --- dashboard ---
  if (parts.length === 1) {
    const key = "bazen";
    const cat = CATALOGUE_SHOPS[key]!;
    const counts = await Promise.all(
      cat.models.map(async (m) => {
        const id = await ensureProduct(env, key, m.slug, m.name, m.freightClass);
        return (await listMedia(env, id)).length;
      }),
    );
    return page(
      indexPage(
        SHOPS[key]!.name,
        key,
        cat.models.map((m, i) => ({ shop: key, slug: m.slug, name: m.name, count: counts[i]! })),
      ),
    );
  }

  // --- one model ---
  const shop = parts[1]!;
  const slug = parts[2] ?? "";
  const cat = CATALOGUE_SHOPS[shop];
  const model = cat ? adminModelBySlug(slug) : undefined;
  if (!cat || !model) return page(loginPage("Ta model ne obstaja."), 404);

  const productId = await ensureProduct(env, shop, model.slug, model.name, model.freightClass);
  const action = parts[3];

  if (action === "upload" && request.method === "POST") {
    return await upload(request, env, shop, model.slug, model.name, productId);
  }

  if (action === "update" && request.method === "POST") {
    const form = await request.formData();
    const id = String(form.get("id") ?? "");
    const alt = String(form.get("alt") ?? "").trim();
    const sort = Number(form.get("sort") ?? 0);
    if (!id || !alt) return seeOther("/admin/" + shop + "/" + slug + "?e=alt");
    await updateMedia(env, id, { alt, sort: Number.isFinite(sort) ? sort : 0 });
    return seeOther("/admin/" + shop + "/" + slug + "?m=saved");
  }

  if (action === "delete" && request.method === "POST") {
    const form = await request.formData();
    const id = String(form.get("id") ?? "");
    const rows = await listMedia(env, productId);
    const row = rows.find((r) => r.id === id);
    if (row) {
      // Rows first: an orphaned object costs storage, an orphaned row renders
      // a broken image on a product page.
      await deleteMedia(env, id);
      for (const w of row.widths ?? []) await deleteObject(env, widthPath(row.url, w));
      await deleteObject(env, row.url);
    }
    return seeOther("/admin/" + shop + "/" + slug + "?m=deleted");
  }

  if (action) return page(loginPage("Neznano dejanje."), 404);

  const rows = await listMedia(env, productId);
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
  type: "Naložiti je mogoče samo slike v obliki WebP. Brskalnik pretvori sliko " +
    "samodejno; če JavaScript ni omogočen, jo pretvorite pred nalaganjem.",
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

async function upload(
  request: Request,
  env: Env,
  shop: string,
  slug: string,
  _name: string,
  productId: string,
): Promise<Response> {
  const form = await request.formData();
  const alt = String(form.get("alt") ?? "").trim();
  // product_media.alt is NOT NULL with a length check in the schema, because
  // alt text is an SEO and accessibility surface rather than an afterthought.
  // Refuse here too, so the failure is a sentence rather than a 400 from
  // PostgREST.
  if (!alt) return seeOther("/admin/" + shop + "/" + slug + "?e=alt");

  const id = crypto.randomUUID();
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
      await uploadObject(env, path, bytes, "image/webp");
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
    await uploadObject(env, base, bytes, "image/webp");
  }

  const rows = await listMedia(env, productId);
  await insertMedia(env, productId, base, alt, rows.length);
  if (written.length > 1) await widthsFor(env, productId, base, written);

  return seeOther("/admin/" + shop + "/" + slug + "?m=uploaded");
}

/** Record the ladder on the row the upload just created. */
async function widthsFor(env: Env, productId: string, url: string, widths: number[]): Promise<void> {
  const rows = await listMedia(env, productId);
  const row = rows.find((r) => r.url === url);
  if (row) await updateMedia(env, row.id, { widths });
}
