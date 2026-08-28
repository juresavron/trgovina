/**
 * Enquiries, read and worked in the back office.
 *
 * ⚠️ THE WRITE SIDE IS NOT HERE, and that is the design. A visitor's
 * submission goes through public.submit_enquiry — one SECURITY DEFINER
 * function the anon role may execute and nothing else (see
 * src/enquiry/submit.ts for why an INSERT policy on a table of names and
 * telephone numbers would be an open write endpoint). This module is the
 * other end: it reads as the signed-in admin, exactly like reviews.ts, so the
 * DATABASE decides what an operator may see rather than this code being
 * trusted to only ask for the right rows.
 *
 * WHAT AN OPERATOR CAN DO: read, move through a status, leave a private note,
 * and delete. There is no edit of what the customer wrote — an enquiry is a
 * record of what somebody sent, and a back office that can rewrite it is a
 * back office whose records prove nothing.
 */

import type { Api } from "./supabase";

export type EnquiryStatus = "nova" | "v-obdelavi" | "zakljucena" | "neresna";

export interface EnquiryRow {
  readonly id: string;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly postcode: string | null;
  readonly prefer: string | null;
  readonly message: string | null;
  readonly accessNotes: string | null;
  readonly modelSlug: string | null;
  readonly configuration: Readonly<Record<string, string>>;
  readonly status: EnquiryStatus;
  readonly note: string | null;
  readonly sourcePath: string | null;
  readonly createdAt: string;
  /** The art. 7(1) record: what they agreed to, and when. */
  readonly consentText: string;
  readonly consentAt: string;
}

const COLUMNS =
  "id,name,email,phone,postcode,prefer,message,access_notes,model_slug," +
  "configuration,status,note,source_path,created_at,consent_text,consent_at";

/** The statuses, in the order an enquiry moves through them. */
export const STATUSES: readonly { readonly id: EnquiryStatus; readonly label: string }[] = [
  { id: "nova", label: "Nova" },
  { id: "v-obdelavi", label: "V obdelavi" },
  { id: "zakljucena", label: "Zaključena" },
  { id: "neresna", label: "Neresna" },
];

export function isStatus(v: string): v is EnquiryStatus {
  return STATUSES.some((s) => s.id === v);
}

function headers(api: Api, extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: api.env.SUPABASE_ANON_KEY ?? "",
    authorization: "Bearer " + api.token,
    ...extra,
  };
}

const rest = (api: Api, query: string): string =>
  api.env.SUPABASE_URL + "/rest/v1/enquiries?" + query;

const eq = (column: string, value: string): string =>
  column + "=eq." + encodeURIComponent(value);

interface Raw {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  postcode?: string | null;
  prefer?: string | null;
  message?: string | null;
  access_notes?: string | null;
  model_slug?: string | null;
  configuration?: unknown;
  status?: string;
  note?: string | null;
  source_path?: string | null;
  created_at?: string;
  consent_text?: string;
  consent_at?: string;
}

const text = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v : null;

/**
 * The jsonb column read defensively.
 *
 * It is written by submit_enquiry from values the router already matched
 * against the catalogue, so in practice it is a flat string map — but it is
 * jsonb, which means the shape is the database's promise and not the type
 * system's. A panel that renders [object Object] into a row is a panel
 * nobody trusts; anything that is not a string pair is dropped.
 */
function config(v: unknown): Record<string, string> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return {};
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string") out[k] = val;
  }
  return out;
}

function toRow(r: Raw): EnquiryRow {
  const status = typeof r.status === "string" && isStatus(r.status) ? r.status : "nova";
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    email: text(r.email),
    phone: text(r.phone),
    postcode: text(r.postcode),
    prefer: text(r.prefer),
    message: text(r.message),
    accessNotes: text(r.access_notes),
    modelSlug: text(r.model_slug),
    configuration: config(r.configuration),
    status,
    note: text(r.note),
    sourcePath: text(r.source_path),
    createdAt: String(r.created_at ?? ""),
    consentText: String(r.consent_text ?? ""),
    consentAt: String(r.consent_at ?? ""),
  };
}

async function json(res: Response, what: string): Promise<unknown> {
  if (!res.ok) {
    throw new Error(what + " failed (" + res.status + "): " + (await res.text()).slice(0, 300));
  }
  return await res.json();
}

/** This shop's enquiries, newest first. */
export async function listEnquiries(api: Api, shopId: string): Promise<EnquiryRow[]> {
  const res = await fetch(
    rest(
      api,
      "select=" + COLUMNS + "&" + eq("shop_id", shopId) + "&order=created_at.desc&limit=200",
    ),
    { headers: headers(api) },
  );
  return ((await json(res, "list enquiries")) as Raw[]).map(toRow);
}

/**
 * Move an enquiry through the workflow, and optionally leave a note.
 *
 * `handled_at` is stamped by the FIRST move off "nova" and never cleared, so
 * "when did we get to this one" survives an operator changing their mind
 * about the status afterwards.
 */
export async function updateEnquiry(
  api: Api,
  shopId: string,
  id: string,
  patch: { readonly status?: EnquiryStatus; readonly note?: string },
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (patch.status) {
    body["status"] = patch.status;
    if (patch.status !== "nova") body["handled_at"] = new Date().toISOString();
  }
  if (patch.note !== undefined) body["note"] = patch.note.trim() === "" ? null : patch.note.trim();
  if (Object.keys(body).length === 0) return;
  const res = await fetch(rest(api, eq("shop_id", shopId) + "&" + eq("id", id)), {
    method: "PATCH",
    headers: headers(api, { "content-type": "application/json", prefer: "return=minimal" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error("save failed (" + res.status + "): " + (await res.text()).slice(0, 300));
  }
}

/**
 * Delete one enquiry.
 *
 * This is also the erasure right (GDPR art. 17) as it is actually exercised:
 * somebody writes and asks, and an operator presses this. The scheduled
 * two-year purge is the floor, not the only way out.
 */
export async function deleteEnquiry(api: Api, shopId: string, id: string): Promise<void> {
  const res = await fetch(rest(api, eq("shop_id", shopId) + "&" + eq("id", id)), {
    method: "DELETE",
    headers: headers(api, { prefer: "return=minimal" }),
  });
  if (!res.ok) {
    throw new Error("delete failed (" + res.status + "): " + (await res.text()).slice(0, 300));
  }
}
