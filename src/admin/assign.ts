/**
 * Which slot a dropped photograph belongs to — asked of the model, decided
 * here.
 *
 * The smart uploader's contract: the operator drops a handful of pictures,
 * and each one lands in the site-image slot it fits. Two halves, kept apart
 * on purpose:
 *
 *   classify()     one image, one network call — the model looks at the
 *                  picture and the slot catalogue and names its best and
 *                  second-best slot. Everything network collapses to null,
 *                  exactly as describe.ts and enhance.ts collapse.
 *   assignSlots()  the whole batch, pure arithmetic — confidence order,
 *                  capacity, second choices. Pure so it can be tested
 *                  without a network, because THIS half is where a wrong
 *                  answer costs something: a misclassified single image is
 *                  the model's error, two images in one slot would be ours.
 *
 * ⚠️ THE MODEL PROPOSES, THE CATALOGUE DISPOSES. The answer is constrained
 * to the slot stems this module handed out (responseSchema enum), and the
 * assignment enforces capacity — so whatever the model says, nothing can be
 * stored under a key that is not a declared slot, and no slot takes more
 * than it holds.
 */

import type { Env } from "./supabase";
import { SITE_IMAGES, stemOf, type SiteImage } from "./site-images";

/**
 * One choice the classifier may make. Mostly a slot, but the six gallery
 * tiles are ONE option with capacity six: they are deliberately equivalent
 * (same frame, same strip, no individual meaning), and asking a model to
 * tell "Galerija — slika 3" from "Galerija — slika 4" is asking it to
 * invent a difference the site does not have.
 */
export interface SlotOption {
  /** What the model answers with — a stem ("hero") or the bucket ("galerija"). */
  readonly id: string;
  readonly label: string;
  readonly note: string;
  /** The concrete slots behind this option, in fill order. */
  readonly slots: readonly SiteImage[];
}

/** The bucket's id — also the stem prefix the gallery slots share. */
const GALLERY_PREFIX = "galerija-";

/** The catalogue as the classifier sees it. Derived, never listed twice. */
export function slotOptions(): SlotOption[] {
  const out: SlotOption[] = [];
  const gallery: SiteImage[] = [];
  for (const s of SITE_IMAGES) {
    if (stemOf(s.key).startsWith(GALLERY_PREFIX)) {
      gallery.push(s);
      continue;
    }
    out.push({ id: stemOf(s.key), label: s.label, note: s.note, slots: [s] });
  }
  if (gallery.length > 0) {
    out.push({
      id: "galerija",
      label: "Galerija na dnu strani",
      note:
        "Trak fotografij na dnu domače strani — vzdušje, detajli, ambient. " +
        "Šest enakovrednih mest.",
      slots: gallery,
    });
  }
  return out;
}

/** What the model said about one picture. */
export interface Classified {
  /** Best option id, or null for "this belongs nowhere on this site". */
  readonly option: string | null;
  /** Second choice, used when the first is already taken. */
  readonly alternate: string | null;
  readonly confidence: "visoka" | "srednja" | "nizka";
  /** One short Slovenian sentence — shown to the operator verbatim. */
  readonly reason: string;
}

const NONE = "nobena";

function prompt(options: readonly SlotOption[]): string {
  return (
    "Si urednik slovenske spletne trgovine z masažnimi bazeni (jacuzzi) in " +
    "swim spa bazeni. Za priloženo fotografijo izberi, na katero mesto na " +
    "spletni strani spada. Možnosti:\n\n" +
    options
      .map((o) => "- " + o.id + ": " + o.label + " — " + o.note)
      .join("\n") +
    "\n- " + NONE + ": fotografija ne spada na nobeno od teh mest " +
    "(npr. dokument, oseba, izdelek, ki ga trgovina ne prodaja).\n\n" +
    "Vrni izbrano možnost (slot), drugo najboljšo (alternate), zanesljivost " +
    "in en kratek slovenski razlog. Ne ugibaj: če fotografija očitno ne " +
    "spada nikamor, vrni " + NONE + "."
  );
}

/**
 * The model's answer for one picture, or null when nothing usable came back.
 *
 * Same fallback ladder as describe.ts: every configured or known model, with
 * constrained decoding — and no schemaless retry, deliberately. A category
 * without a schema is a sentence that has to be guessed at, and a guessed
 * category is precisely the thing this feature must never act on: the wrong
 * alt text is a bad caption, the wrong slot is the wrong picture on the
 * home page.
 */
export async function classify(
  env: Env,
  bytes: ArrayBuffer,
  mime: string,
  options: readonly SlotOption[],
): Promise<Classified | null> {
  if (typeof env.GEMINI_API_KEY !== "string" || env.GEMINI_API_KEY === "") return null;

  const ids = [...options.map((o) => o.id), NONE];
  const payload = JSON.stringify({
    contents: [
      {
        parts: [
          { text: prompt(options) },
          { inline_data: { mime_type: mime, data: b64(bytes) } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          slot: { type: "STRING", enum: ids },
          alternate: { type: "STRING", enum: ids },
          confidence: { type: "STRING", enum: ["visoka", "srednja", "nizka"] },
          reason: { type: "STRING" },
        },
        required: ["slot", "confidence", "reason"],
      },
    },
  });

  const models = env.GEMINI_TEXT_MODEL
    ? [env.GEMINI_TEXT_MODEL]
    : ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];
  for (const model of models) {
    const raw = await ask(env, model, payload);
    if (raw === null) continue;
    const parsed = parseClassified(raw, ids);
    if (parsed) return parsed;
  }
  return null;
}

/** One model, one attempt — null means "ask the next one". */
async function ask(env: Env, model: string, payload: string): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(model) + ":generateContent",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          // Header, not a query parameter: a key in a URL lands in every log.
          "x-goog-api-key": env.GEMINI_API_KEY!,
        },
        body: payload,
      },
    );
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

/**
 * The JSON out of whatever came back. Checked, never assumed: constrained
 * decoding makes a well-formed object overwhelmingly likely, not certain,
 * and an id outside the enum (a truncated answer, an older model) must read
 * as "no answer" rather than become a storage key.
 */
export function parseClassified(raw: string, ids: readonly string[]): Classified | null {
  let v: unknown;
  try {
    v = JSON.parse(raw.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/, ""));
  } catch {
    return null;
  }
  const o = v as { slot?: unknown; alternate?: unknown; confidence?: unknown; reason?: unknown };
  const id = typeof o.slot === "string" && ids.includes(o.slot) ? o.slot : null;
  if (id === null) return null;
  const alt =
    typeof o.alternate === "string" && ids.includes(o.alternate) && o.alternate !== id
      ? o.alternate
      : null;
  const conf =
    o.confidence === "visoka" || o.confidence === "srednja" || o.confidence === "nizka"
      ? o.confidence
      : "nizka";
  const reason =
    typeof o.reason === "string" && o.reason.trim() !== ""
      ? o.reason.replace(/\s+/g, " ").trim().slice(0, 200)
      : "";
  return {
    option: id === NONE ? null : id,
    alternate: alt === NONE ? null : alt,
    confidence: conf,
    reason,
  };
}

/** Where one picture ends up. */
export interface Assigned {
  /** The concrete slot, or null with the reason beside it. */
  readonly slot: SiteImage | null;
  /** Shown to the operator — the model's own sentence, or ours. */
  readonly reason: string;
}

/**
 * The whole batch at once, pure.
 *
 * Confident answers pick first — a "visoka" on the hero must not lose the
 * hero to a "nizka" that happened to be earlier in the drop. Within a tier,
 * drop order decides, which is the order the operator chose. A first choice
 * already taken falls to the alternate; an alternate taken too, or absent,
 * leaves the picture unassigned WITH THE REASON SAID — silently skipping a
 * photograph the operator dropped is how they learn to distrust the tool.
 */
export function assignSlots(
  classified: readonly (Classified | null)[],
  options: readonly SlotOption[],
): Assigned[] {
  const byId = new Map(options.map((o) => [o.id, o]));
  const used = new Map<string, number>();
  const out: Assigned[] = new Array(classified.length);

  const rank = { visoka: 0, srednja: 1, nizka: 2 } as const;
  const order = classified
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const ra = a.c ? rank[a.c.confidence] : 3;
      const rb = b.c ? rank[b.c.confidence] : 3;
      return ra !== rb ? ra - rb : a.i - b.i;
    });

  const take = (id: string | null): SiteImage | null => {
    if (id === null) return null;
    const opt = byId.get(id);
    if (!opt) return null;
    const n = used.get(id) ?? 0;
    if (n >= opt.slots.length) return null;
    used.set(id, n + 1);
    return opt.slots[n]!;
  };

  for (const { c, i } of order) {
    if (c === null) {
      out[i] = { slot: null, reason: "AI razvrščanje ni odgovorilo — naložite ročno." };
      continue;
    }
    if (c.option === null) {
      out[i] = {
        slot: null,
        reason: c.reason || "Fotografija ne spada na nobeno od mest na strani.",
      };
      continue;
    }
    const first = take(c.option);
    if (first) {
      out[i] = { slot: first, reason: c.reason };
      continue;
    }
    const second = take(c.alternate);
    if (second) {
      out[i] = {
        slot: second,
        reason: (c.reason ? c.reason + " " : "") + "(Prvo mesto je zasedla druga slika.)",
      };
      continue;
    }
    out[i] = {
      slot: null,
      reason: "Najprimernejše mesto je zasedla druga slika iz tega izbora.",
    };
  }
  return out;
}

function b64(bytes: ArrayBuffer): string {
  const b = new Uint8Array(bytes);
  let s = "";
  // Chunked for the same reason enhance.ts chunks: apply() on a multi-
  // megabyte array blows the argument limit.
  for (let i = 0; i < b.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + 0x8000)));
  }
  return btoa(s);
}
