/**
 * The little bit of Supabase this Worker actually talks to.
 *
 * Hand-rolled rather than @supabase/supabase-js, for the same reason the rest
 * of this Worker has no dependencies: the SDK is ~60 KB of bundle to make four
 * HTTP calls, and it would be inlined into a Worker whose whole argument is
 * how fast it starts. What is here is four fetches and a URL builder.
 *
 * EVERY CALL IN THIS FILE USES THE SERVICE ROLE, which bypasses RLS. That is
 * correct for an admin panel and catastrophic anywhere else, so nothing in
 * this module may be reachable without a verified session — see routes.ts,
 * where the session check happens before any of it is called.
 */

export interface Env {
  /** https://<ref>.supabase.co — public, so it lives in wrangler.jsonc vars. */
  SUPABASE_URL?: string;
  /**
   * Publishable key. PUBLIC by design — it is the key a browser would carry,
   * and it can do nothing this project's RLS does not allow. It lives in
   * wrangler.jsonc vars beside SUPABASE_URL, not in a secret, because
   * pretending a public value is a secret teaches people the wrong lesson
   * about the ones that are.
   *
   * Used only for the login exchange: email + password in, access token out.
   */
  SUPABASE_ANON_KEY?: string;
  /** Service role key. SECRET. Bypasses RLS; never send it to a browser. */
  SUPABASE_SERVICE_KEY?: string;
}

export const BUCKET = "product-media";

/** Which secrets are missing, so the panel can say so instead of 500ing. */
export function missingConfig(env: Env): string[] {
  const need: (keyof Env)[] = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_KEY",
  ];
  return need.filter((k) => !env[k]).map(String);
}

function headers(env: Env, extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: env.SUPABASE_SERVICE_KEY!,
    authorization: "Bearer " + env.SUPABASE_SERVICE_KEY!,
    ...extra,
  };
}

/* ---- storage ----------------------------------------------------------- */

/**
 * The public URL of a stored object.
 *
 * Not used for rendering — the storefront serves /media/<path> through the
 * Worker so the bytes are edge-cached and same-origin. This is the upstream
 * that proxy fetches, and the URL the admin panel shows for copy-paste.
 */
export function publicUrl(env: Env, path: string): string {
  return env.SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/" + path;
}

export async function uploadObject(
  env: Env,
  path: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const res = await fetch(env.SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/" + path, {
    method: "POST",
    headers: headers(env, { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" }),
    body,
  });
  if (!res.ok) throw new Error("upload failed (" + res.status + "): " + (await res.text()).slice(0, 300));
}

export async function deleteObject(env: Env, path: string): Promise<void> {
  const res = await fetch(env.SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/" + path, {
    method: "DELETE",
    headers: headers(env),
  });
  // 404 means it is already gone, which is the state we wanted.
  if (!res.ok && res.status !== 404) {
    throw new Error("delete failed (" + res.status + "): " + (await res.text()).slice(0, 300));
  }
}

/* ---- rows -------------------------------------------------------------- */

async function rest(env: Env, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(env.SUPABASE_URL + "/rest/v1/" + path, {
    ...init,
    headers: headers(env, {
      "content-type": "application/json",
      prefer: "return=representation",
      ...((init.headers as Record<string, string>) ?? {}),
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error("supabase " + res.status + ": " + text.slice(0, 300));
  return text ? JSON.parse(text) : null;
}

export interface ProductRow {
  id: string;
  shop_id: string;
  slug: string;
  title: string;
}

export interface MediaRow {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  sort: number;
  /** Widths written for this image, narrowest first. Empty = one natural size. */
  widths: number[];
}

/**
 * Make sure a product row exists for a model in the code catalogue, and return
 * its id.
 *
 * THE CATALOGUE LIVES IN CODE. src/catalog/pola.ts holds the specification;
 * this only creates the identity row that product_media's foreign key needs,
 * so a photograph can be attached to something. Specs are deliberately NOT
 * copied here — two copies of a jet count is how a spec sheet starts
 * disagreeing with itself.
 */
export async function ensureProduct(
  env: Env,
  shopId: string,
  slug: string,
  title: string,
  freightClass: string,
): Promise<string> {
  const found = (await rest(
    env,
    "products?select=id&shop_id=eq." + encodeURIComponent(shopId) + "&slug=eq." + encodeURIComponent(slug),
  )) as ProductRow[];
  if (found.length > 0) return found[0]!.id;

  const made = (await rest(env, "products", {
    method: "POST",
    body: JSON.stringify({
      shop_id: shopId,
      slug,
      title,
      status: "draft",
      freight_class: freightClass,
    }),
  })) as ProductRow[];
  return made[0]!.id;
}

export async function listMedia(env: Env, productId: string): Promise<MediaRow[]> {
  return (await rest(
    env,
    "product_media?select=id,product_id,url,alt,sort,widths&product_id=eq." +
      encodeURIComponent(productId) + "&order=sort.asc",
  )) as MediaRow[];
}

export async function insertMedia(
  env: Env,
  productId: string,
  url: string,
  alt: string,
  sort: number,
): Promise<void> {
  await rest(env, "product_media", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, url, alt, sort, kind: "image" }),
  });
}

export async function updateMedia(
  env: Env,
  id: string,
  patch: Partial<Pick<MediaRow, "alt" | "sort" | "widths">>,
): Promise<void> {
  await rest(env, "product_media?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteMedia(env: Env, id: string): Promise<void> {
  await rest(env, "product_media?id=eq." + encodeURIComponent(id), { method: "DELETE" });
}
