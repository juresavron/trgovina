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
import { finishImageKey, finishSlug, type FinishKind } from "../catalog/finish-image";

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
  /**
   * Filename slugs that identify this option OUTRIGHT, no model involved.
   *
   * Only the finish catalogue sets it, and it is the reason the colour
   * sorter is trustworthy: a supplier's swatch folder is named by colour
   * ("Canyon.jpg", "silver white marble.png"), so most of a drop sorts
   * itself deterministically and the model is only asked about the leftovers.
   */
  readonly match?: readonly string[];
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

/* ================= THE COLOUR SWATCHES =================
 *
 * A SECOND CATALOGUE, not a second uploader. The owner's ask was "for barve
 * školjke I want that I upload all colors and AI sorts them correctly", and
 * the machinery to do that already exists — classify(), assignSlots(), and
 * the browser's crop-and-convert pipeline. What was missing is that asking
 * the SITE catalogue to sort colour swatches is a question it cannot answer
 * well:
 *
 *   * it offers ~46 options, of which 16 are the colours and 30 are the hero,
 *     the gallery, the guide headers — so nine tenths of the prompt is noise
 *     for this drop;
 *   * the sixteen colour notes are near-identical by construction ("Vzorec
 *     barve školjke »X«, kvadratna slika, 400 × 400 px"), so the model is
 *     choosing between sixteen sentences that differ in one word.
 *
 * Narrowing the catalogue to one kind fixes both, and adds the thing that
 * actually decides most of a real drop: the filename.
 *
 * ⚠️ WHAT WE STILL DO NOT KNOW. catalog/pola.ts is explicit that nothing in
 * this repository knows what colour "Canyon" is — the shell finishes are the
 * acrylic manufacturer's own names for marbled sheets, which is exactly why
 * this project refused to draw invented swatches for them. That rule is not
 * relaxed here and must not be. The model is never told what Canyon looks
 * like, because we do not know; it is asked to match a filename first, and
 * where the filename says nothing, to reason only from what a name means in
 * ordinary language (dark, warm, chalky) and to answer "nizka" when it is
 * guessing. Every answer is a PROPOSAL the operator sees with its reason
 * before it becomes a stored picture — which is the difference between a
 * guess a human confirms and a fact this codebase invented.
 */

/** The finish slots of one kind, as the classifier sees them. */
export function finishOptions(
  kind: FinishKind,
  names: readonly string[],
): SlotOption[] {
  const out: SlotOption[] = [];
  for (const name of names) {
    const key = finishImageKey(kind, name);
    const slot = SITE_IMAGES.find((s) => s.key === key);
    // A name with no registered slot cannot be a destination. It should be
    // impossible (site-images.ts derives the slots from these same arrays),
    // and silently offering an id nothing can store would be worse than the
    // colour simply not appearing in the list.
    if (slot) out.push({ id: stemOf(key), label: name, note: "", slots: [slot], match: [finishSlug(name)] });
  }
  return out;
}

/**
 * Which option a FILENAME names, or null when it names none or more than one.
 *
 * Pure, and the first thing the sorter asks — a drop whose files are named
 * after the colours never reaches the model at all.
 *
 * ⚠️ LONGEST MATCH WINS, and both lists contain a pair that needs it:
 * "Opal" is a substring of "Oyster Opal", and "Siva" of "Temno siva" and
 * "Svetlo siva". Matching shortest-first would file every Oyster Opal sample
 * under Opal and every grey under Siva — three colours quietly wrong out of
 * sixteen, in a batch the operator dropped precisely because they trusted it
 * to sort itself.
 *
 * Containment is checked on whole hyphen-delimited runs, so "opal" matches
 * "oyster-opal-2" but not "opalescent".
 */
export function matchFilename(
  filename: string,
  options: readonly SlotOption[],
): string | null {
  // Strip the directory, the extension, and the copy-suffixes a download
  // folder adds ("Canyon (1).jpg", "canyon-kopija.png").
  const base = filename.replace(/^.*[\\/]/, "").replace(/\.[a-z0-9]+$/i, "");
  const slug = finishSlug(base);
  if (slug === "") return null;
  const parts = slug.split("-");

  let best: string | null = null;
  let bestLen = 0;
  let tied = false;
  for (const o of options) {
    for (const m of o.match ?? []) {
      if (m === "") continue;
      const run = m.split("-");
      let hit = false;
      for (let i = 0; i + run.length <= parts.length; i++) {
        if (run.every((w, j) => parts[i + j] === w)) { hit = true; break; }
      }
      if (!hit) continue;
      if (run.length > bestLen) { best = o.id; bestLen = run.length; tied = false; }
      else if (run.length === bestLen && o.id !== best) tied = true;
    }
  }
  // Two colours of the same specificity in one filename is not a match, it is
  // a question — hand it to the model rather than pick the first.
  return tied ? null : best;
}

/** The prompt for a colour swatch. Deliberately not the site prompt. */
export function finishPrompt(kind: FinishKind, options: readonly SlotOption[]): string {
  const what = kind === "barva" ? "školjke (akrilna kad)" : "obloge (stranska plošča)";
  return (
    "Si urednik slovenske spletne trgovine z masažnimi bazeni. Priložena je " +
    "fotografija VZORCA BARVE " + what + ". Izberi, kateremu imenu barve s " +
    "seznama ustreza.\n\n" +
    "Imena so proizvajalčeva lastna imena za marmorirane akrilne plošče. " +
    "Nihče ti ni pokazal uradne barvne karte, zato NE UGIBAJ na pamet: " +
    "sklepaj samo iz tega, kaj ime pomeni v vsakdanjem jeziku (svetlost, " +
    "barvni ton, vzorec), in iz tega, kar na sliki dejansko vidiš. Če si " +
    "negotov, vrni zanesljivost »nizka« — vsak predlog urednik pred objavo " +
    "potrdi.\n\nImena:\n" +
    options.map((o) => "- " + o.id + ": " + o.label).join("\n") +
    "\n- " + NONE + ": to ni vzorec barve (npr. cel bazen, prostor, dokument).\n\n" +
    "Vrni izbrano ime (slot), drugo najboljše (alternate), zanesljivost in " +
    "en kratek slovenski razlog — povej, kaj na sliki te je prepričalo."
  );
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
  /**
   * Model names that answered 404 earlier IN THIS BATCH. A retired name
   * costs one wasted subrequest per file — twenty files against a dead
   * first fallback is twenty requests that cannot succeed, against the
   * Workers subrequest budget. The set is per request, never persisted: a
   * name that is dead this minute may be redeployed the next.
   */
  dead?: Set<string>,
  /**
   * The question to ask, when it is not "where on the site does this go?".
   * The colour sorter passes finishPrompt() — same schema, same enum, same
   * fallback ladder; a different question.
   */
  promptText?: string,
): Promise<Classified | null> {
  if (typeof env.GEMINI_API_KEY !== "string" || env.GEMINI_API_KEY === "") return null;

  const ids = [...options.map((o) => o.id), NONE];
  const payload = JSON.stringify({
    contents: [
      {
        parts: [
          { text: promptText ?? prompt(options) },
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
    if (dead?.has(model)) continue;
    const raw = await ask(env, model, payload, dead);
    if (raw === null) continue;
    const parsed = parseClassified(raw, ids);
    if (parsed) return parsed;
  }
  return null;
}

/** One model, one attempt — null means "ask the next one". A 404 marks the
 * NAME dead for the batch: that status means the model does not exist, not
 * that this picture was refused, so retrying it per file is pure waste. */
async function ask(
  env: Env,
  model: string,
  payload: string,
  dead?: Set<string>,
): Promise<string | null> {
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
  if (res.status === 404) {
    dead?.add(model);
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
