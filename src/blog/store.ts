/**
 * Posts, in and out of the database.
 *
 * ⚠️ READ AT REQUEST TIME, NOT BAKED INTO A DEPLOY. Every other piece of
 * content on this site is a TypeScript module compiled into the Worker, which
 * is the right shape for a catalogue that changes when somebody writes code.
 * It is the wrong shape for a blog: publishing a post that appears at the next
 * deploy is not publishing. So the blog is the one thing the storefront asks
 * the database for, which is why it lives behind the async layer in worker.ts
 * beside /admin and /media rather than inside the synchronous renderer.
 *
 * ⚠️ AND THE PUBLIC READ CARRIES NO AUTHORITY. The storefront reads with the
 * publishable key and nothing else — no session, no service key — so what it
 * can see is exactly what the RLS policy `posts_public_read` allows anyone in
 * the world to see: rows whose status is 'published'. A draft is invisible to
 * this code path by the database's decision, not by a WHERE clause somebody
 * has to remember to write. The clause is written anyway, because defence in
 * depth costs one string.
 *
 * The admin path is the same functions with the signed-in person's token, and
 * `posts_admin_write` is what lets those calls see drafts and write anything.
 */

import type { Api, Env } from "../admin/supabase";
import type { Post, PostCard, PostStatus } from "./post";

/** The columns a card needs; the body is the expensive one and stays out. */
const CARD_COLUMNS = "slug,title,excerpt,cover_url,cover_alt,published_at";
const FULL_COLUMNS =
  "id,slug,title,excerpt,body,cover_url,cover_alt,status,published_at,updated_at";

/**
 * A reader with no account: the publishable key, acting as an anonymous
 * visitor. Same shape as an admin's Api so every function below takes one
 * argument and cannot accidentally be given power it was not passed.
 */
export function anonApi(env: Env): Api {
  return { env, token: env.SUPABASE_ANON_KEY ?? "" };
}

function headers(api: Api, extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: api.env.SUPABASE_ANON_KEY ?? "",
    authorization: "Bearer " + api.token,
    ...extra,
  };
}

function rest(api: Api, query: string): string {
  return api.env.SUPABASE_URL + "/rest/v1/posts?" + query;
}

/** PostgREST's filter syntax needs the value percent-encoded, not quoted. */
const eq = (column: string, value: string): string =>
  column + "=eq." + encodeURIComponent(value);

interface Row {
  id?: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  body?: unknown;
  cover_url?: string | null;
  cover_alt?: string;
  status?: string;
  published_at?: string | null;
  updated_at?: string;
}

/**
 * A database row as a Post.
 *
 * EVERY FIELD IS COERCED, because a jsonb column can hold anything and the
 * renderer must never be handed a number where it expects a string. `body` in
 * particular is `{"source": "…"}` by convention and by nothing stronger — a
 * row written by hand in the Supabase dashboard could hold an array, a null
 * or a string, and the page it renders should be empty rather than a 500.
 */
function toPost(row: Row): Post {
  const body = row.body;
  const source =
    body !== null && typeof body === "object" && typeof (body as { source?: unknown }).source === "string"
      ? (body as { source: string }).source
      : "";
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    excerpt: String(row.excerpt ?? ""),
    source,
    coverUrl: typeof row.cover_url === "string" && row.cover_url !== "" ? row.cover_url : null,
    coverAlt: String(row.cover_alt ?? ""),
    status: row.status === "published" ? "published" : "draft",
    publishedAt: typeof row.published_at === "string" ? row.published_at : null,
    updatedAt: String(row.updated_at ?? ""),
  };
}

function toCard(row: Row): PostCard {
  const p = toPost(row);
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverUrl: p.coverUrl,
    coverAlt: p.coverAlt,
    publishedAt: p.publishedAt,
  };
}

async function json(res: Response, what: string): Promise<unknown> {
  if (!res.ok) {
    throw new Error(what + " failed (" + res.status + "): " + (await res.text()).slice(0, 300));
  }
  return await res.json();
}

/* ---- reads ------------------------------------------------------------- */

/**
 * The published posts, newest first.
 *
 * Ordered by published_at rather than by created_at: a post written in
 * January and published in March belongs at the top of the list in March,
 * which is the whole point of having a separate column.
 */
export async function listPublished(
  api: Api,
  shopId: string,
  limit = 50,
): Promise<PostCard[]> {
  const res = await fetch(
    rest(
      api,
      "select=" + CARD_COLUMNS +
        "&" + eq("shop_id", shopId) +
        "&" + eq("status", "published") +
        "&order=published_at.desc&limit=" + limit,
    ),
    { headers: headers(api) },
  );
  const rows = (await json(res, "list posts")) as Row[];
  return rows.map(toCard);
}

/** Every post including drafts — the admin list. */
export async function listAll(api: Api, shopId: string): Promise<Post[]> {
  const res = await fetch(
    rest(
      api,
      "select=" + FULL_COLUMNS +
        "&" + eq("shop_id", shopId) +
        // Drafts first is wrong; newest-touched first is what an editor wants,
        // because the post they are working on is the one they touched last.
        "&order=updated_at.desc&limit=200",
    ),
    { headers: headers(api) },
  );
  const rows = (await json(res, "list posts")) as Row[];
  return rows.map(toPost);
}

export async function getBySlug(
  api: Api,
  shopId: string,
  slug: string,
  publishedOnly: boolean,
): Promise<Post | null> {
  const res = await fetch(
    rest(
      api,
      "select=" + FULL_COLUMNS +
        "&" + eq("shop_id", shopId) +
        "&" + eq("slug", slug) +
        (publishedOnly ? "&" + eq("status", "published") : "") +
        "&limit=1",
    ),
    { headers: headers(api) },
  );
  const rows = (await json(res, "read post")) as Row[];
  return rows.length > 0 ? toPost(rows[0]!) : null;
}

export async function getById(api: Api, shopId: string, id: string): Promise<Post | null> {
  const res = await fetch(
    rest(api, "select=" + FULL_COLUMNS + "&" + eq("shop_id", shopId) + "&" + eq("id", id) + "&limit=1"),
    { headers: headers(api) },
  );
  const rows = (await json(res, "read post")) as Row[];
  return rows.length > 0 ? toPost(rows[0]!) : null;
}

/* ---- writes ------------------------------------------------------------ */

export interface PostDraft {
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly source: string;
  readonly coverUrl?: string | null;
  readonly coverAlt?: string;
}

function payload(d: PostDraft): Record<string, unknown> {
  return {
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt,
    body: { source: d.source },
    ...(d.coverUrl === undefined ? {} : { cover_url: d.coverUrl }),
    ...(d.coverAlt === undefined ? {} : { cover_alt: d.coverAlt }),
  };
}

/** Creates a DRAFT. Nothing this panel does publishes by accident. */
export async function createPost(api: Api, shopId: string, d: PostDraft): Promise<Post> {
  const res = await fetch(rest(api, "select=" + FULL_COLUMNS), {
    method: "POST",
    headers: headers(api, {
      "content-type": "application/json",
      prefer: "return=representation",
    }),
    body: JSON.stringify({ shop_id: shopId, status: "draft", ...payload(d) }),
  });
  const rows = (await json(res, "create post")) as Row[];
  if (rows.length === 0) throw new Error("create post returned nothing");
  return toPost(rows[0]!);
}

export async function updatePost(
  api: Api,
  shopId: string,
  id: string,
  d: PostDraft,
): Promise<void> {
  const res = await fetch(rest(api, eq("shop_id", shopId) + "&" + eq("id", id)), {
    method: "PATCH",
    headers: headers(api, { "content-type": "application/json", prefer: "return=minimal" }),
    // updated_at is set here rather than by a trigger: one fewer database
    // object to keep in step with db/schema.sql, and the value is the moment
    // the edit was accepted either way.
    body: JSON.stringify({ ...payload(d), updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error("save failed (" + res.status + "): " + (await res.text()).slice(0, 300));
}

/**
 * Publish or unpublish.
 *
 * published_at is set the FIRST time and kept afterwards, so unpublishing to
 * fix a typo and publishing again does not move the post to the top of the
 * list and does not change the date under its title. A post's date is when it
 * was published, not when it was last published.
 */
export async function setStatus(
  api: Api,
  shopId: string,
  id: string,
  status: PostStatus,
  firstPublish: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const res = await fetch(rest(api, eq("shop_id", shopId) + "&" + eq("id", id)), {
    method: "PATCH",
    headers: headers(api, { "content-type": "application/json", prefer: "return=minimal" }),
    body: JSON.stringify({
      status,
      updated_at: now,
      ...(status === "published" && firstPublish ? { published_at: now } : {}),
    }),
  });
  if (!res.ok) throw new Error("status failed (" + res.status + "): " + (await res.text()).slice(0, 300));
}

export async function deletePost(api: Api, shopId: string, id: string): Promise<void> {
  const res = await fetch(rest(api, eq("shop_id", shopId) + "&" + eq("id", id)), {
    method: "DELETE",
    headers: headers(api, { prefer: "return=minimal" }),
  });
  if (!res.ok) throw new Error("delete failed (" + res.status + "): " + (await res.text()).slice(0, 300));
}

/**
 * A slug this shop is not already using.
 *
 * The database has the unique constraint and would refuse a duplicate with a
 * 409 the operator cannot read, so the collision is resolved here instead: the
 * second "Kako izbrati bazen" becomes kako-izbrati-bazen-2. Checked rather
 * than assumed, because the alternative is an error message about a
 * constraint on a page that was supposed to save an article.
 */
export async function freeSlug(
  api: Api,
  shopId: string,
  wanted: string,
  exceptId?: string,
): Promise<string> {
  const base = wanted || "zapis";
  for (let n = 0; n < 40; n++) {
    const candidate = n === 0 ? base : base + "-" + (n + 1);
    const found = await getBySlug(api, shopId, candidate, false);
    if (!found || found.id === exceptId) return candidate;
  }
  // Forty collisions is not a slug problem any more; a timestamp ends it.
  return base + "-" + Date.now().toString(36);
}
