/**
 * The little bit of Supabase this Worker actually talks to.
 *
 * Hand-rolled rather than @supabase/supabase-js, for the same reason the rest
 * of this Worker has no dependencies: the SDK is ~60 KB of bundle to make four
 * HTTP calls, and it would be inlined into a Worker whose whole argument is
 * how fast it starts. What is here is four fetches and a URL builder.
 *
 * EVERY CALL IN THIS FILE ACTS AS THE SIGNED-IN PERSON, carrying their access
 * token. Nothing here holds power of its own.
 *
 * ⚠️ THIS FILE USED TO USE THE SERVICE ROLE KEY, which bypasses every RLS
 * policy in the database — orders, customers, the lot — and which therefore
 * had to be kept in a Worker secret and could never be allowed to leak. It was
 * doing so to change product photographs.
 *
 * Acting as the person instead means the DATABASE decides what may happen
 * rather than this code being trusted to only do the right thing. The policies
 * are in the `admin_acts_as_itself` migration: `public.is_admin()` reads the
 * allowlist, and products, product_media and the one storage bucket are
 * writable by an admin and by nobody else. If this Worker were compromised
 * entirely, what an attacker would gain is the ability to change a photograph
 * of a hot tub.
 *
 * It also means the panel needs NO SECRETS AT ALL. The publishable key and the
 * project URL are both public by design and both live in wrangler.jsonc.
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
   * Supabase wants it on every request as `apikey`; what the request may
   * actually DO is decided by the access token sent beside it.
   */
  SUPABASE_ANON_KEY?: string;
  /**
   * Google Gemini key, for the optional image upscaler — SECRET.
   *
   * The one secret this Worker has, and it is OPTIONAL: absent, the panel
   * simply does not offer upscaling. See admin/enhance.ts for why the feature
   * is off by default even when the key is present.
   */
  GEMINI_API_KEY?: string;
  /** Overrides the image model without a code change. Public. */
  GEMINI_IMAGE_MODEL?: string;
}

export const BUCKET = "product-media";

/**
 * Which settings are missing, so the panel can say so instead of 500ing.
 *
 * Both are public values that belong in wrangler.jsonc vars. There is no
 * third entry: the panel has no secrets.
 */
export function missingConfig(env: Env): string[] {
  const need: (keyof Env)[] = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
  return need.filter((k) => !env[k]).map(String);
}

/**
 * One signed-in person's access to Supabase: where the project is, and who is
 * asking. Every function below takes this rather than the environment, so
 * there is no way to call Supabase from here without saying on whose behalf.
 */
export interface Api {
  readonly env: Env;
  /** The Supabase access token from the session cookie. */
  readonly token: string;
}

function headers(api: Api, extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: api.env.SUPABASE_ANON_KEY!,
    authorization: "Bearer " + api.token,
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
export function publicUrl(api: Api, path: string): string {
  return api.env.SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/" + path;
}

export async function uploadObject(
  api: Api,
  path: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const res = await fetch(api.env.SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/" + path, {
    method: "POST",
    headers: headers(api, { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" }),
    body,
  });
  if (!res.ok) throw new Error("upload failed (" + res.status + "): " + (await res.text()).slice(0, 300));
}

export async function deleteObject(api: Api, path: string): Promise<void> {
  const res = await fetch(api.env.SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/" + path, {
    method: "DELETE",
    headers: headers(api),
  });
  // 404 means it is already gone, which is the state we wanted.
  if (!res.ok && res.status !== 404) {
    throw new Error("delete failed (" + res.status + "): " + (await res.text()).slice(0, 300));
  }
}

/* ---- rows -------------------------------------------------------------- */

async function rest(api: Api, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(api.env.SUPABASE_URL + "/rest/v1/" + path, {
    ...init,
    headers: headers(api, {
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
  api: Api,
  shopId: string,
  slug: string,
  title: string,
  freightClass: string,
): Promise<string> {
  const found = (await rest(
    api,
    "products?select=id&shop_id=eq." + encodeURIComponent(shopId) + "&slug=eq." + encodeURIComponent(slug),
  )) as ProductRow[];
  if (found.length > 0) return found[0]!.id;

  const made = (await rest(api, "products", {
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

export async function listMedia(api: Api, productId: string): Promise<MediaRow[]> {
  return (await rest(
    api,
    "product_media?select=id,product_id,url,alt,sort,widths&product_id=eq." +
      encodeURIComponent(productId) + "&order=sort.asc",
  )) as MediaRow[];
}

export async function insertMedia(
  api: Api,
  productId: string,
  url: string,
  alt: string,
  sort: number,
): Promise<void> {
  await rest(api, "product_media", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, url, alt, sort, kind: "image" }),
  });
}

export async function updateMedia(
  api: Api,
  id: string,
  patch: Partial<Pick<MediaRow, "alt" | "sort" | "widths">>,
): Promise<void> {
  await rest(api, "product_media?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteMedia(api: Api, id: string): Promise<void> {
  await rest(api, "product_media?id=eq." + encodeURIComponent(id), { method: "DELETE" });
}
