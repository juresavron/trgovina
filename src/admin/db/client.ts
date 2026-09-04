/**
 * ONE WAY IN AND OUT OF THE DATABASE, for the repositories in this directory.
 *
 * supabase.ts already had `rest()`, but it was private to that module, so
 * every new read either re-implemented the fetch and its headers or was added
 * to a file that is otherwise about storage objects and product media. This is
 * that function, exported, so a repository is a query and a mapping and
 * nothing else.
 *
 * ⚠️ AS THIS PERSON, ALWAYS. There is no service key in the Worker to fall
 * back to — the admin_acts_as_itself migration removed it — so every request
 * carries the signed-in administrator's own access token and the database
 * decides what may happen. A repository that took a different token would be
 * a repository that bypassed row-level security.
 */

import type { Api } from "../supabase";

export async function rows(api: Api, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(api.env.SUPABASE_URL + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: api.env.SUPABASE_ANON_KEY!,
      authorization: "Bearer " + api.token,
      "content-type": "application/json",
      prefer: "return=representation",
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error("supabase " + res.status + ": " + text.slice(0, 300));
  return text ? JSON.parse(text) : null;
}
