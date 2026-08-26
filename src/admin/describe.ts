/**
 * Writing the alt text for an uploaded photograph.
 *
 * WHY THIS EXISTS. Ten files land in the panel and each one needs a sentence
 * describing what is in it — legally, because alt text is an accessibility
 * surface the EU Accessibility Act makes non-optional, and commercially,
 * because it is what puts these pictures into image search. An operator
 * uploading a set of ten writes the same sentence ten times, or worse, pastes
 * it: the bucket already holds nine photographs of ZR804 sharing one alt
 * string, which is the accessible equivalent of no alt text at all.
 *
 * ⚠️ WHAT THIS IS AND IS NOT ALLOWED TO SAY.
 *
 * A model that is LOOKING at the photograph and reporting what it sees is
 * describing real pixels. That is the one thing generative models may be
 * trusted with here, and it is exactly the job. What it must not do is fill
 * in what it cannot see: how many jets a shell has, which model it is, what
 * the acrylic is, what anything costs. Those are the product's main
 * characteristics, and getting one wrong in alt text is Article 6 of the
 * Unfair Commercial Practices Directive in the same way getting it wrong in
 * the body copy would be. The prompt forbids each of them by name, and the
 * result lands in an editable field the operator sees before pressing Naloži
 * — a suggestion, not a submission.
 *
 * Every failure returns null and the field stays empty, which is the state
 * the panel had before this existed.
 */

import type { Env } from "./supabase";

/**
 * The models that read the picture, in the order they are tried.
 *
 * Not GEMINI_IMAGE_MODEL — that one is the image GENERATOR the upscaler
 * drives, and asking it for a sentence is asking the wrong tool.
 *
 * A LIST RATHER THAN ONE NAME, because the failure mode of getting it wrong
 * is invisible: a retired or misspelled model id answers 404, describe()
 * returns null exactly as it does for a refusal, and the operator sees ten
 * empty fields with nothing anywhere saying why. Model names move faster than
 * deploys and this code cannot reach the API from where it is written, so it
 * asks the next one instead of giving up on the first. Set GEMINI_TEXT_MODEL
 * in wrangler.jsonc to pin one and skip the list entirely.
 */
const MODELS = [
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

/** How long an alt string may be — the same cap the panel's input carries. */
export const ALT_MAX = 180;

/**
 * What the model is asked for.
 *
 * Written to be refused rather than filled in. Each clause exists because the
 * obvious failure is a fluent, plausible, wrong sentence:
 *
 *   - Slovenian, because the shop is;
 *   - what is VISIBLE, because that is the whole warrant for using a model
 *     here at all;
 *   - no counting, because a model asked how many jets it can see will always
 *     answer with a number;
 *   - no model name or code, because the panel's own guidance says so — the
 *     name is already in the heading, the caption and the URL, and repeating
 *     it is keyword stuffing rather than a description;
 *   - no adjectives of quality, because "luxurious" is a claim and alt text
 *     is not advertising copy;
 *   - no "photograph of", because a screen reader has already said "image".
 */
function prompt(subject: string): string {
  return (
    "Napiši kratek opis te fotografije v slovenščini, za atribut alt. " +
    (subject
      ? 'Fotografija prikazuje izdelek "' +
        subject +
        '". Imena ali oznake modela NE zapiši v opis. '
      : "") +
    "Pravila: opiši SAMO to, kar je na sliki dejansko vidno; " +
    "ne štej šob, sedežev ali drugih delov in ne navajaj števil; " +
    "ne navajaj znamk, mer, cen ali materialov; " +
    "ne uporabljaj oglaševalskih pridevnikov; " +
    "ne začni z besedami \"slika\", \"fotografija\" ali \"prikazuje\". " +
    "Od 5 do 14 besed, ena vrstica, brez narekovajev in brez končnega pika."
  );
}

export function describeAvailable(env: Env): boolean {
  return typeof env.GEMINI_API_KEY === "string" && env.GEMINI_API_KEY !== "";
}

function base64(bytes: ArrayBuffer): string {
  const b = new Uint8Array(bytes);
  let s = "";
  // Chunked for the same reason enhance.ts chunks: apply() on a multi-megabyte
  // array blows the argument limit.
  for (let i = 0; i < b.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + 0x8000)));
  }
  return btoa(s);
}

/**
 * Make a model's answer safe to put in an attribute.
 *
 * A language model told to return one line returns one line most of the time.
 * The rest of the time it returns the line inside quotation marks, or after a
 * preamble, or with a full stop the instruction said not to add. None of that
 * is worth a retry — it is worth trimming.
 */
export function tidy(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim();
  // A fenced or quoted answer: take what is inside.
  s = s.replace(/^```[a-z]*\s*/i, "").replace(/```$/, "").trim();
  s = s.replace(/^["'„“”«»]+/, "").replace(/["'„“”«»]+$/, "").trim();
  // Some answers open with the thing the prompt forbade. Cheaper to cut than
  // to re-ask.
  s = s.replace(/^(slika|fotografija|posnetek)\s*(prikazuje|:)?\s*/i, "").trim();
  s = s.replace(/[.\s]+$/, "").trim();
  if (s.length > ALT_MAX) {
    // Cut on a word so the string does not end mid-noun.
    const cut = s.slice(0, ALT_MAX);
    const sp = cut.lastIndexOf(" ");
    s = (sp > 40 ? cut.slice(0, sp) : cut).trim();
  }
  // One word is not a description; it is a label the model gave up on.
  return s.split(" ").length < 2 ? "" : s;
}

/**
 * One sentence describing this photograph, or null.
 *
 * Null for every failure — no key, a refusal, a timeout, a response with no
 * text in it, an answer that did not survive tidy(). The caller leaves the
 * field empty, which is what the panel did before.
 */
export async function describe(
  env: Env,
  bytes: ArrayBuffer,
  mime: string,
  subject: string,
): Promise<string | null> {
  if (!describeAvailable(env)) return null;

  // The image is encoded once, however many models are tried.
  const payload = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt(subject) },
          { inline_data: { mime_type: mime, data: base64(bytes) } },
        ],
      },
    ],
    // Low temperature: this is a description, and the creative end of the
    // distribution is exactly where the invented details live.
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
  });

  const models = env.GEMINI_TEXT_MODEL ? [env.GEMINI_TEXT_MODEL] : MODELS;
  for (const model of models) {
    const out = await ask(env, model, payload);
    if (out !== null) return out;
  }
  return null;
}

/**
 * One model, one attempt. Null means "ask the next one".
 *
 * Every outcome collapses to null on purpose — a network error, a 404 for a
 * name that no longer exists, a refusal, a body with no text in it. The caller
 * cannot tell them apart and does not need to: the next model gets the same
 * question, and when the list runs out the field stays empty, which is the
 * state the form had before any of this existed.
 */
async function ask(env: Env, model: string, payload: string): Promise<string | null> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(model) +
    ":generateContent";

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Header, not a query parameter: a key in a URL lands in every log,
        // proxy and referrer along the way.
        "x-goog-api-key": env.GEMINI_API_KEY!,
      },
      body: payload,
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return null;
  }
  const text = firstText(body);
  if (text === null) return null;
  const out = tidy(text);
  return out === "" ? null : out;
}

/**
 * The first text part in a generateContent response.
 *
 * Walked defensively rather than indexed, for the reason enhance.ts walks its
 * own: the response carries safety metadata beside the answer, and a shape
 * change should degrade to "no suggestion" rather than throw inside an upload.
 */
function firstText(body: unknown): string | null {
  const cands = (body as { candidates?: unknown }).candidates;
  if (!Array.isArray(cands)) return null;
  for (const c of cands) {
    const parts = (c as { content?: { parts?: unknown } }).content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const p of parts) {
      const t = (p as { text?: unknown }).text;
      if (typeof t === "string" && t.trim() !== "") return t;
    }
  }
  return null;
}
