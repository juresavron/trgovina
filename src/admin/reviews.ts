/**
 * Customer reviews, in and out of the database.
 *
 * ⚠️ THIS IS THE MOST LEGALLY LOADED TABLE IN THE PROJECT, and the reason is
 * not caution about tone. The Unfair Commercial Practices Directive as amended
 * by the Omnibus Directive (EU) 2019/2161, transposed in ZVPot-1, puts two
 * things on the Annex I blacklist — practices banned outright, with no
 * balancing test and no defence:
 *
 *   23b. stating that reviews are submitted by consumers who actually used or
 *        bought the product, without taking reasonable steps to check;
 *   23c. submitting, or having someone submit, false consumer reviews.
 *
 * So this module distinguishes two things the storefront must never confuse:
 *
 *   published  the operator wants it on the site
 *   verified   the operator has checked it against a real order
 *
 * A published review that is not verified renders as a quote and nothing
 * more. The "Preverjen nakup" chip and the "Preverjena mnenja strank" heading
 * are claims under 23b, and they are made ONLY from `verified`. The panel asks
 * for the order number when the operator ticks it, because "reasonable steps
 * to check" is the statutory test and an order number is what checking looks
 * like.
 *
 * ⚠️ AND THE PANEL CANNOT WRITE A REVIEW. There is no "add" that invents an
 * author: every field comes from the operator, who is transcribing something a
 * customer sent them. That is a policy this code cannot enforce — but it can
 * refuse to make it easy, and it can keep the verified claim behind a separate
 * deliberate act.
 */

import type { Api } from "./supabase";

export interface Review {
  readonly id: string;
  /** What the customer wrote. */
  readonly body: string;
  /** How they are named on the site — "Družina Novak, Domžale". */
  readonly authorName: string;
  /** 1–5. Collected because the table requires it; not rendered yet. */
  readonly rating: number;
  /** The product slug this review is about, or null. */
  readonly productSlug: string | null;
  /** The order this was checked against — the evidence behind `verified`. */
  readonly orderNumber: string;
  /** ⚠️ The Annex I 23b claim. Never set from anything but a deliberate tick. */
  readonly verified: boolean;
  readonly published: boolean;
  readonly createdAt: string;
}

const COLUMNS =
  "id,body,author_name,rating,order_number_snapshot,verified,published,created_at,products(slug)";

function headers(api: Api, extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: api.env.SUPABASE_ANON_KEY ?? "",
    authorization: "Bearer " + api.token,
    ...extra,
  };
}

const rest = (api: Api, query: string): string =>
  api.env.SUPABASE_URL + "/rest/v1/reviews?" + query;

const eq = (column: string, value: string): string =>
  column + "=eq." + encodeURIComponent(value);

interface Row {
  id?: string;
  body?: string;
  author_name?: string;
  rating?: number;
  order_number_snapshot?: string | null;
  verified?: boolean;
  published?: boolean;
  created_at?: string;
  products?: { slug?: string } | null;
}

function toReview(row: Row): Review {
  return {
    id: String(row.id ?? ""),
    body: String(row.body ?? ""),
    authorName: String(row.author_name ?? ""),
    rating: typeof row.rating === "number" ? row.rating : 5,
    productSlug: row.products?.slug ? String(row.products.slug) : null,
    orderNumber: typeof row.order_number_snapshot === "string" ? row.order_number_snapshot : "",
    verified: row.verified === true,
    published: row.published === true,
    createdAt: String(row.created_at ?? ""),
  };
}

async function json(res: Response, what: string): Promise<unknown> {
  if (!res.ok) {
    throw new Error(what + " failed (" + res.status + "): " + (await res.text()).slice(0, 300));
  }
  return await res.json();
}

/** Every review this shop has, newest first — the panel's list. */
export async function listReviews(api: Api, shopId: string): Promise<Review[]> {
  const res = await fetch(
    rest(api, "select=" + COLUMNS + "&" + eq("shop_id", shopId) + "&order=created_at.desc&limit=200"),
    { headers: headers(api) },
  );
  return ((await json(res, "list reviews")) as Row[]).map(toReview);
}

export async function getReview(api: Api, shopId: string, id: string): Promise<Review | null> {
  const res = await fetch(
    rest(api, "select=" + COLUMNS + "&" + eq("shop_id", shopId) + "&" + eq("id", id) + "&limit=1"),
    { headers: headers(api) },
  );
  const rows = (await json(res, "read review")) as Row[];
  return rows.length > 0 ? toReview(rows[0]!) : null;
}

export interface ReviewDraft {
  readonly body: string;
  readonly authorName: string;
  readonly rating: number;
  readonly productId: string | null;
  readonly orderNumber: string;
  readonly verified: boolean;
  readonly published: boolean;
}

function payload(d: ReviewDraft): Record<string, unknown> {
  return {
    body: d.body,
    author_name: d.authorName,
    // Clamped rather than trusted: it arrives off a form, and the column is a
    // plain integer with no check constraint behind it.
    rating: Math.min(5, Math.max(1, Math.round(d.rating))),
    product_id: d.productId,
    order_number_snapshot: d.orderNumber === "" ? null : d.orderNumber,
    // ⚠️ VERIFIED CANNOT SURVIVE WITHOUT ITS EVIDENCE. The chip claims the
    // operator checked the review against a real purchase; a tick with no
    // order number behind it is the claim without the check, which is exactly
    // what Annex I 23b prohibits. The panel asks for both together and this
    // refuses the half of it that would publish a claim.
    verified: d.verified && d.orderNumber !== "",
    published: d.published,
  };
}

export async function createReview(api: Api, shopId: string, d: ReviewDraft): Promise<Review> {
  const res = await fetch(rest(api, "select=" + COLUMNS), {
    method: "POST",
    headers: headers(api, {
      "content-type": "application/json",
      prefer: "return=representation",
    }),
    body: JSON.stringify({ shop_id: shopId, ...payload(d) }),
  });
  const rows = (await json(res, "create review")) as Row[];
  if (rows.length === 0) throw new Error("create review returned nothing");
  return toReview(rows[0]!);
}

export async function updateReview(
  api: Api,
  shopId: string,
  id: string,
  d: ReviewDraft,
): Promise<void> {
  const res = await fetch(rest(api, eq("shop_id", shopId) + "&" + eq("id", id)), {
    method: "PATCH",
    headers: headers(api, { "content-type": "application/json", prefer: "return=minimal" }),
    body: JSON.stringify(payload(d)),
  });
  if (!res.ok) throw new Error("save failed (" + res.status + "): " + (await res.text()).slice(0, 300));
}

export async function deleteReview(api: Api, shopId: string, id: string): Promise<void> {
  const res = await fetch(rest(api, eq("shop_id", shopId) + "&" + eq("id", id)), {
    method: "DELETE",
    headers: headers(api, { prefer: "return=minimal" }),
  });
  if (!res.ok) throw new Error("delete failed (" + res.status + "): " + (await res.text()).slice(0, 300));
}
