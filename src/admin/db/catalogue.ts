/**
 * THE PANEL'S CATALOGUE, READ FROM THE DATABASE.
 *
 * ⚠️ THIS USED TO BE A COMPILED CONSTANT, AND THE DATABASE FOLLOWED IT.
 * admin/catalogue.ts built the list from OFFERED_MODELS and OFFERED_SWIMSPAS —
 * TypeScript arrays inside the Worker bundle — and ensureProduct() then WROTE
 * those rows into public.products. So the shape of the panel was decided at
 * build time, the table was a mirror of it, and adding a model to the back
 * office meant editing a file and shipping a deploy.
 *
 * That is inverted here. public.products is the source; the panel lists what
 * the table holds, ordered the way the table says. A row added in the database
 * appears in the panel on the next page load, with no deploy and no commit.
 *
 * ⚠️ THE SEED STAYS, AND IT IS NOT THE SAME THING AS THE SOURCE. An empty
 * table would render a back office with nothing in it — on a live shop, on a
 * first deploy, or the day somebody archives the last row by mistake — so the
 * code catalogue is still reconciled in. The difference is the direction of
 * authority: seeding fills gaps, it no longer decides what exists. Anything in
 * the table that the code has never heard of is listed all the same, which is
 * the whole point and is exactly what a compiled list could not do.
 *
 * Ordered by `sort` then `title`, both columns the table already has, so the
 * order of the dashboard is editable in the database too.
 */

import type { Api } from "../supabase";
import { rows } from "./client";

export interface CatalogueProduct {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly status: string;
  readonly freightClass: string;
  readonly sort: number;
}

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  freight_class: string;
  sort: number;
}

/**
 * Every product this shop has a row for.
 *
 * Archived rows are excluded: 'archived' is the status a shop uses to retire a
 * model without losing its orders, and a retired model is not something to
 * upload photographs of. Draft rows ARE included — a draft is invisible to the
 * storefront and the panel is exactly where its photographs get added before
 * it is published.
 */
export async function listProducts(api: Api, shopId: string): Promise<CatalogueProduct[]> {
  const out = (await rows(
    api,
    "products?select=id,slug,title,status,freight_class,sort" +
      "&shop_id=eq." + encodeURIComponent(shopId) +
      "&status=neq.archived" +
      "&order=sort.asc,title.asc",
  )) as ProductRow[];
  return out.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    status: r.status,
    freightClass: r.freight_class,
    sort: r.sort,
  }));
}

export interface CatalogueShop {
  readonly id: string;
  readonly name: string;
  readonly domain: string;
  readonly isLive: boolean;
}

interface ShopRow {
  id: string;
  name: string;
  domain: string;
  is_live: boolean;
}

/**
 * The shops this account may administer.
 *
 * ⚠️ THE PANEL HARDCODED "bazen" IN FOUR PLACES. One shop made that invisible;
 * it is still the wrong shape, because the row that says which shops exist is
 * public.shops and has been since the schema was written. RLS decides which of
 * them this person can see, which is the correct place for that decision — not
 * a string literal in a router.
 */
export async function listShops(api: Api): Promise<CatalogueShop[]> {
  const out = (await rows(
    api,
    "shops?select=id,name,domain,is_live&order=name.asc",
  )) as ShopRow[];
  return out.map((r) => ({ id: r.id, name: r.name, domain: r.domain, isLive: r.is_live }));
}
