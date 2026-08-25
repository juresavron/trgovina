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

import { POLA_MODELS, polaBySlug } from "../catalog/pola";
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
const CATALOGUE_SHOPS: Record<string, { models: typeof POLA_MODELS; freightClass: string }> = {
  bazen: { models: POLA_MODELS, freightClass: "pallet_xl" },
};

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
 * Immutable caching is safe because uploads are content-addressed: a new file
 * gets a new UUID, and an edited image is a new upload.
 */
export async function handleMedia(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!env.SUPABASE_URL) return new Response("Not found", { status: 404 });

  const path = new URL(request.url).pathname.slice("/media/".length);
  // No traversal, no absolute upstreams: only the bucket, only these shapes.
  if (!/^[a-z0-9][a-z0-9/_-]*\.(webp|jpg|jpeg|png|avif)$/i.test(path) || path.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const upstream = env.SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/" + path;
  const res = await fetch(upstream, { cf: { cacheEverything: true, cacheTtl: 31536000 } } as RequestInit);
  if (!res.ok) return new Response("Not found", { status: 404 });

  return new Response(res.body, {
    status: 200,
    headers: {
      "content-type": res.headers.get("content-type") ?? "image/webp",
      "cache-control": "public, max-age=31536000, immutable",
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
        const id = await ensureProduct(env, key, m.slug, m.name, cat.freightClass);
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
  const model = cat ? polaBySlug(slug) : undefined;
  if (!cat || !model) return page(loginPage("Ta model ne obstaja."), 404);

  const productId = await ensureProduct(env, shop, model.slug, model.name, cat.freightClass);
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
      ? ({ kind: "err", text: "Opis slike je obvezen." } as const)
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

const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/avif": "avif",
};

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
      const path = w === widest ? base : widthPath(base, w);
      await uploadObject(env, path, await part.arrayBuffer(), "image/webp");
      if (w !== widest) written.push(w);
    }
    written.push(widest);
    written.sort((a, b) => a - b);
  } else {
    const part = form.get("file");
    if (!(part instanceof File) || part.size === 0) {
      return seeOther("/admin/" + shop + "/" + slug + "?e=alt");
    }
    const ext = EXT[part.type] ?? "jpg";
    base = shop + "/" + slug + "/" + id + "." + ext;
    await uploadObject(env, base, await part.arrayBuffer(), part.type || "image/jpeg");
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
