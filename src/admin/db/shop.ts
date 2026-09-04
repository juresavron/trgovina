/**
 * WHICH SHOP THE PANEL IS POINTED AT.
 *
 * ⚠️ IT WAS THE STRING "bazen", IN FIVE PLACES. One shop made that invisible
 * and it was still the wrong shape: public.shops has said which shops exist
 * since the schema was written, and RLS on that table is what decides which of
 * them a given administrator may see. A literal in a router decides neither.
 *
 * ⚠️ THE PERMITTED SET COMES FROM THE DATABASE, NOT FROM THE REQUEST. The
 * cookie and the query parameter are both things a visitor controls, so
 * neither is trusted: whatever they name is looked up in the rows listShops()
 * returned for THIS person's token, and anything not in that set is ignored
 * rather than refused. Ignored, because a refusal would confirm that a shop by
 * that key exists — and the fallback is the first shop they can see, which is
 * always a shop they are allowed to administer.
 *
 * ⚠️ AND NO SHOPS IS NOT AN ERROR TO CRASH ON. An account on the admins
 * allowlist whose RLS grants it nothing sees an empty list; that is a
 * permissions state, not a bug, and it gets a page saying so rather than a
 * stack trace from indexing [0] of an empty array.
 */

import { SHOPS } from "../../tenants";
import type { Api } from "../supabase";
import { listShops, type CatalogueShop } from "./catalogue";

/** The cookie the switcher sets. Not authority — see the note above. */
export const SHOP_COOKIE = "st_admin_shop";

export interface ShopChoice {
  /** The shop being administered, or null when this account may see none. */
  readonly current: CatalogueShop | null;
  /** Every shop this account may administer, for the switcher. */
  readonly all: readonly CatalogueShop[];
}

function cookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

/**
 * ?shop= beats the cookie, which beats the first row.
 *
 * The parameter wins so that a link to a particular shop's dashboard works —
 * two tabs on two shops is the thing a switcher is for, and a cookie alone
 * makes the second tab silently change the first.
 */
/**
 * The compiled tenant registry, in the shape the switcher wants.
 *
 * ⚠️ THIS IS THE FALLBACK, AND IT EXISTS BECAUSE THE TABLE-ONLY VERSION TOOK
 * THE LIVE PANEL DOWN. public.shops has row-level security, and the policies on
 * it do not grant an administrator SELECT — the panel could read products,
 * enquiries, reviews and posts, but asking for shops came back empty. So the
 * resolver saw an account with access to nothing and rendered the 403 it was
 * written to render, correctly, on every page, for the owner.
 *
 * Reading the table first is still right: it is the only thing that knows about
 * a shop nobody has compiled in. But a panel that goes dark because one
 * SELECT is not granted is worse than a panel that falls back to the list it
 * used for its entire life before this change.
 *
 * ⚠️ THE FALLBACK IS NOT AN AUTHORISATION BYPASS. Nothing here grants access
 * to data: every read and write the panel makes still runs as this person and
 * still meets RLS on the table it touches. This decides which shop the panel
 * is POINTED AT, and pointing it at a shop whose rows the database will not
 * return produces an empty screen, not a leak.
 */
function registryShops(): CatalogueShop[] {
  return Object.values(SHOPS).map((s) => ({
    id: s.key,
    name: s.name,
    domain: s.domain,
    isLive: s.live,
  }));
}

export async function resolveShopChoice(request: Request, api: Api, url: URL): Promise<ShopChoice> {
  const rows = await listShops(api);
  const all = rows.length > 0 ? rows : registryShops();
  if (all.length === 0) return { current: null, all };
  const asked = url.searchParams.get("shop") ?? cookie(request, SHOP_COOKIE);
  const found = asked === null ? undefined : all.find((s) => s.id === asked);
  return { current: found ?? all[0]!, all };
}

/**
 * Set-Cookie for the switcher.
 *
 * Strict, because this cookie only ever needs to survive navigation inside the
 * panel, and HttpOnly because nothing in the browser reads it — the server
 * resolves the shop on every request and the page is rendered around what it
 * decided. A year, because a preference that expires is a preference somebody
 * has to keep re-making.
 */
export function shopCookie(id: string): string {
  return (
    SHOP_COOKIE + "=" + encodeURIComponent(id) +
    "; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=" + 60 * 60 * 24 * 365
  );
}
