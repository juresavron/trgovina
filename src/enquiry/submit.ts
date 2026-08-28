/**
 * THE ENQUIRY FORM'S SERVER HALF.
 *
 * This shop takes no orders online (`ordersOnline: false`), so an enquiry IS
 * the transaction. The product page already builds one — its buy column is a
 * GET form that resolves the model, the shell colour, the cabinet colour and
 * the options against the catalogue and carries them to /kontakt — and until
 * now /kontakt was a telephone number and three paragraphs of prose. Every
 * answer the visitor gave the configurator died at the door.
 *
 * ⚠️ TWO HALVES, KEPT APART, for the same reason admin/assign.ts splits:
 *
 *   parseEnquiry()  pure. Reads a form body, decides whether it is an
 *                   enquiry, and says in Slovenian what is wrong with it if
 *                   it is not. Every rule this feature has is here, and every
 *                   one of them is testable without a network.
 *   submitEnquiry() one RPC. Whatever the database says, the visitor gets a
 *                   page rather than a stack trace.
 *
 * ⚠️ WHY AN RPC AND NOT AN INSERT. The publishable key is public by design
 * (see admin/supabase.ts), so an RLS policy granting `anon` INSERT on a table
 * of names and telephone numbers is an open write endpoint that anyone who
 * reads the page source can find. `anon` therefore has NO grant on
 * public.enquiries at all: the only thing it may do is execute
 * public.submit_enquiry, which validates the shop, rate-limits by IP and
 * writes. It also cannot read back what it wrote — there is no SELECT policy
 * for anon — which is why the call sends `Prefer: return=minimal` and treats
 * an empty body as success.
 */

import type { Env } from "../admin/supabase";

/** Everything the form may carry, after it has been checked. */
export interface Enquiry {
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly postcode: string | null;
  readonly prefer: "telefon" | "e-posta" | null;
  readonly message: string | null;
  readonly accessNotes: string | null;
  readonly modelSlug: string | null;
  /** The configurator's own answers, already resolved against the catalogue. */
  readonly configuration: Readonly<Record<string, string>>;
  /** The sentence the visitor agreed to, verbatim. See CONSENT_TEXT. */
  readonly consentText: string;
  readonly sourcePath: string | null;
}

/** Why a submission was refused, in the words the page shows the visitor. */
export type EnquiryProblem =
  | "ime"
  | "stik"
  | "eposta"
  | "soglasje"
  | "dolzina"
  | "robot";

/** Field caps, mirroring the CHECK constraints so the page can say so first. */
const MAX = {
  name: 120,
  email: 254,
  phone: 40,
  postcode: 40,
  message: 4000,
  access: 2000,
} as const;

const str = (v: FormDataEntryValue | null): string =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";

/**
 * ⚠️ THE CONSENT SENTENCE IS STORED, NOT REFERENCED, and this is the one
 * place it is written.
 *
 * GDPR art. 7(1) puts the burden of DEMONSTRATING consent on the controller.
 * A row that points at "the current privacy wording" proves what the page
 * says today, not what this person agreed to — so the sentence travels with
 * the row. It costs a few hundred bytes and it is the only version of the
 * record that is evidence.
 *
 * It is also the thing the page must PRINT beside the checkbox. Exported so
 * the renderer cannot drift from what gets stored: one string, two consumers,
 * and a test that holds them together.
 */
export const CONSENT_TEXT =
  "Soglašam, da moje podatke uporabite za odgovor na to povpraševanje in " +
  "pripravo ponudbe. Podatke hranimo 24 mesecev, nato jih izbrišemo. " +
  "Soglasje lahko kadar koli prekličete.";

/**
 * A form body read as an enquiry, or the first thing wrong with it.
 *
 * ORDER MATTERS in one place: the honeypot is checked FIRST and reported as
 * its own problem, so the route can answer a bot with a plain page and no
 * database round trip while a human with an empty name gets a useful message.
 */
export function parseEnquiry(
  form: FormData,
  opts: {
    readonly modelSlug?: string | null;
    readonly configuration?: Record<string, string>;
  } = {},
):
  | { readonly ok: true; readonly value: Enquiry }
  | { readonly ok: false; readonly why: EnquiryProblem } {
  // THE HONEYPOT. A field no human sees and no human fills — CSS-hidden and
  // aria-hidden, with a name a naive bot finds attractive. It catches the
  // ordinary case and nothing else; it is not a substitute for the rate
  // limit in the database, it is the cheap half of the pair.
  if (str(form.get("website")) !== "") return { ok: false, why: "robot" };

  const name = str(form.get("ime"));
  if (name.length < 2) return { ok: false, why: "ime" };
  if (name.length > MAX.name) return { ok: false, why: "dolzina" };

  const email = str(form.get("eposta"));
  const phone = str(form.get("telefon"));
  if (email === "" && phone === "") return { ok: false, why: "stik" };
  // Deliberately not a regular expression that tries to know what an address
  // is. RFC 5322 addresses are not a regex anyone should ship, and a form
  // that rejects a valid address is worse than one that accepts an invalid
  // one: the second costs a bounced reply, the first costs the customer.
  if (email !== "" && !(email.length <= MAX.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return { ok: false, why: "eposta" };
  }
  if (phone.length > MAX.phone) return { ok: false, why: "dolzina" };

  const message = str(form.get("sporocilo"));
  const access = str(form.get("dostop"));
  if (message.length > MAX.message || access.length > MAX.access) {
    return { ok: false, why: "dolzina" };
  }

  // ⚠️ CONSENT IS A TICK, NOT A DEFAULT. An unchecked box submits nothing at
  // all, so this reads as absent and the enquiry is refused — which is the
  // point: a pre-ticked box is not consent (art. 4(11), and Planet49
  // C-673/17 settled it), and neither is a box the server ticks for you.
  if (str(form.get("soglasje")) === "") return { ok: false, why: "soglasje" };

  const prefRaw = str(form.get("kanal"));
  const prefer = prefRaw === "telefon" || prefRaw === "e-posta" ? prefRaw : null;
  const postcode = str(form.get("kraj")).slice(0, MAX.postcode);

  return {
    ok: true,
    value: {
      name,
      email: email === "" ? null : email,
      phone: phone === "" ? null : phone,
      postcode: postcode === "" ? null : postcode,
      prefer,
      message: message === "" ? null : message,
      accessNotes: access === "" ? null : access,
      // ⚠️ THE MODEL AND THE CONFIGURATION DO NOT COME FROM THE FORM BODY.
      // They come from the caller, which resolved them against the catalogue
      // exactly as the page did when it rendered — see worker.ts. A slug
      // taken off the wire would let anyone store an enquiry about a product
      // this shop does not sell, and the shop would answer it.
      modelSlug: opts.modelSlug ?? null,
      configuration: opts.configuration ?? {},
      consentText: CONSENT_TEXT,
      sourcePath: str(form.get("od")).slice(0, 200) || null,
    },
  };
}

/** What the visitor is told, per problem. Slovenian, and never a field name. */
export const PROBLEM_TEXT: Readonly<Record<EnquiryProblem, string>> = {
  ime: "Vpišite ime, da vas znamo nagovoriti.",
  stik: "Pustite telefon ali e-pošto — brez enega od njiju vam ne moremo odgovoriti.",
  eposta: "E-poštni naslov ni videti pravilen. Preverite ga ali pustite telefon.",
  soglasje: "Za odgovor potrebujemo vaše soglasje za obdelavo podatkov.",
  dolzina: "Eno od polj je predolgo. Skrajšajte ga in poskusite znova.",
  robot: "Obrazca ni bilo mogoče oddati.",
};

/** Rejected by the database rather than by us. */
export type SubmitResult = "ok" | "prepogosto" | "napaka";

/**
 * One RPC, and every failure collapses to something the page can say.
 *
 * The IP is passed because the database cannot see it and this Worker can.
 * Anyone holding the public key can lie about it — which is true of every
 * value in this call — and the limit still stops the ordinary flood. A
 * missing header means unlimited rather than refused: losing a real customer
 * to protect against a hypothetical one is the wrong trade.
 */
export async function submitEnquiry(
  env: Env,
  shopKey: string,
  e: Enquiry,
  ip: string | null,
): Promise<SubmitResult> {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_ANON_KEY;
  if (typeof url !== "string" || url === "" || typeof key !== "string" || key === "") {
    return "napaka";
  }
  let res: Response;
  try {
    res = await fetch(url.replace(/\/+$/, "") + "/rest/v1/rpc/submit_enquiry", {
      method: "POST",
      headers: {
        apikey: key,
        authorization: "Bearer " + key,
        "content-type": "application/json",
        // ⚠️ MINIMAL, because anon has no SELECT policy on the table. Asking
        // for a representation would make PostgREST try to read the row back
        // and fail AFTER the write — a stored enquiry reported as an error,
        // which is the worst of the three possible outcomes.
        prefer: "return=minimal",
      },
      body: JSON.stringify({
        p_shop_id: shopKey,
        p_name: e.name,
        p_email: e.email,
        p_phone: e.phone,
        p_postcode: e.postcode,
        p_prefer: e.prefer,
        p_message: e.message,
        p_access_notes: e.accessNotes,
        p_model_slug: e.modelSlug,
        p_configuration: e.configuration,
        p_consent_text: e.consentText,
        p_source_path: e.sourcePath,
        p_ip: ip,
      }),
    });
  } catch {
    return "napaka";
  }
  if (res.ok) return "ok";
  // 53400 is the rate limit raising; PostgREST maps it to a 5xx with the
  // message in the body, so the body is where the distinction lives.
  let body = "";
  try {
    body = await res.text();
  } catch {
    /* the status alone still tells us it failed */
  }
  return body.includes("too many enquiries") ? "prepogosto" : "napaka";
}
