/**
 * Naming a colour from its own swatch.
 *
 * THE OWNER'S ASK, in their words: "When i upload a color image ai should
 * create a name" — "Automatically when i upload". Six screen captures of a
 * supplier chart went in and six colours came out called
 * "Screenshot 2026-08-28 at 10.20.46", which is what a customer then saw
 * beside the swatch and what an order would have quoted.
 *
 * ⚠️ WHAT THE MODEL MAY AND MAY NOT SAY, and the line is the whole file.
 *
 * A model LOOKING at a swatch and reporting the colour it sees is describing
 * real pixels. That is the one thing generative models are trusted with in
 * this codebase (see admin/describe.ts, which writes alt text under the same
 * rule) and it is exactly this job.
 *
 * What it must never do is guess the MANUFACTURER'S TRADE NAME. "This looks
 * like Oyster Opal" is not a description of pixels, it is a claim about a
 * catalogue the model has not seen, and it would travel from the tile to the
 * product page to a purchase order for a shell costing thousands. catalog/
 * pola.ts is emphatic that this project must never invent a trade name and
 * that has not changed: the prompt forbids it by name, and the fallback when
 * the model is unreachable is the filename, never a guess.
 *
 * So the names this produces are DESCRIPTIONS in Slovenian — "Temno siva",
 * "Peščeno bež", "Sivo marmorirana" — and the product page's copy is
 * conditional on which kind of list is live, because "imena so proizvajalčeva"
 * stops being true the moment these are the names. See pdp.ts.
 *
 * A FILENAME THAT ALREADY READS LIKE A COLOUR WINS. Somebody who names a file
 * "Oyster Opal.jpg" is reading the chart, and this code is not: their name is
 * better than any description and is kept untouched. The model is asked only
 * where the filename carries nothing — a screenshot, an IMG_1234, a date.
 * That is what makes this automatic rather than another switch: upload, and
 * the sensible thing happens either way.
 */

import type { Env } from "./supabase";

/**
 * The models that read the swatch, in the order they are tried.
 *
 * Same list and same reasoning as describe.ts: a retired or misspelled id
 * answers 404, this returns null exactly as a refusal does, and the failure
 * is invisible — every colour would quietly fall back to its filename and
 * nothing would say why. A second name costs one request on the rare path.
 */
const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

/** A colour name is a label, not a sentence. */
export const NAME_MAX = 40;

export function nameColourAvailable(env: Env): boolean {
  return typeof env.GEMINI_API_KEY === "string" && env.GEMINI_API_KEY !== "";
}

/**
 * Does this filename already carry a colour name?
 *
 * ⚠️ THE TEST IS FOR JUNK, NOT FOR COLOURS, and that direction matters. A
 * whitelist of colour words would reject every trade name the manufacturer
 * invents — Odyssey, Canyon, Gypsum are not colours in any dictionary — and
 * those are precisely the names worth keeping. So this only asks whether the
 * name looks like something a camera, a phone or a screenshot tool produced,
 * and treats everything else as deliberate.
 */
export function looksLikeColourName(name: string): boolean {
  const s = name.trim();
  if (s.length < 2 || s.length > NAME_MAX) return false;
  // A machine's name for a file: a known prefix, or mostly digits.
  if (/^(screen[\s_-]?shot|screenshot|img|dsc|dscf|dscn|p\d|image|photo|foto|slika|untitled|neimenovano|pasted|paste|whatsapp|signal|viber|scan|capture|posnetek|zaslonska)(?![a-zA-ZčšžćđČŠŽĆĐ])/i.test(s)) {
    return false;
  }
  // "2026-08-28 at 10.20.46", "20260828_102046", "1724851200".
  const letters = s.replace(/[^a-zčšžćđA-ZČŠŽĆĐ]/g, "").length;
  if (letters < 2) return false;
  if (letters < s.length / 3) return false;
  return true;
}

/**
 * Tidy what the model returned into something that can be a colour's name.
 *
 * A model told to answer in two words answers in two words most of the time.
 * The rest of the time it wraps them in quotes, adds a full stop, or prefixes
 * "Ime barve:". None of that is worth a retry.
 */
export function tidyColourName(raw: string): string {
  let s = String(raw ?? "").trim();
  s = s.replace(/^["'«»„“”\s]+|["'«»„“”\s.!:;]+$/g, "");
  s = s.replace(/^(ime\s+barve|barva|name|colou?r)\s*[:\-–—]\s*/i, "");
  s = s.replace(/\s+/g, " ").trim();
  if (s.length > NAME_MAX) s = s.slice(0, NAME_MAX).trim();
  // Sentence case: the chart prints "Silver white marble", not "Silver White
  // Marble", and a description reads the same way.
  if (s !== "") s = s[0]!.toUpperCase() + s.slice(1);
  // A model that answered with a sentence is not answering this question.
  if (s.split(" ").length > 4) return "";
  return s;
}

/**
 * Make a name unique within the set it is joining.
 *
 * Two greys in one drop both get called "Temno siva", both fold to the same
 * slug, and the second overwrites the first — one colour where the operator
 * uploaded two. A suffix is a poor name and a lost swatch is worse, and the
 * field beside the tile is right there to fix it.
 */
export function uniqueColourName(name: string, taken: ReadonlySet<string>): string {
  const key = (s: string) => s.trim().toLowerCase();
  if (!taken.has(key(name))) return name;
  for (let n = 2; n < 100; n++) {
    const candidate = name + " " + n;
    if (!taken.has(key(candidate))) return candidate;
  }
  return name;
}

function prompt(kind: "barva" | "obloga"): string {
  const what =
    kind === "barva"
      ? "vzorec akrilne školjke masažnega bazena"
      : "vzorec stranske obloge masažnega bazena";
  return (
    "Na sliki je " + what + ". Poimenuj BARVO, ki jo vidiš.\n\n" +
    "PRAVILA:\n" +
    "- Odgovori z imenom barve v slovenščini, ena do tri besede. Nič drugega.\n" +
    "- Opiši, kar VIDIŠ: odtenek, svetlost in vzorec (na primer »Temno siva«, " +
    "»Peščeno bež«, »Sivo marmorirana«, »Bela z bež žilami«).\n" +
    "- NE UGIBAJ trgovskega imena proizvajalca. Imena kot »Oyster Opal«, " +
    "»Midnight« ali »Canyon« so iz barvne karte, ki je ne vidiš; če ga " +
    "napišeš, bo napačno ime pristalo na naročilnici.\n" +
    "- Brez besed »barva«, »vzorec«, »akril«, brez pike na koncu, brez narekovajev.\n" +
    "- Prva črka velika, ostale male, razen lastnih imen."
  );
}

function base64(bytes: ArrayBuffer): string {
  const b = new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + 0x8000)));
  }
  return btoa(s);
}

/** The first text part in a generateContent response. */
function firstText(body: unknown): string | null {
  const b = body as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const parts = b?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  for (const p of parts) if (typeof p.text === "string" && p.text.trim() !== "") return p.text;
  return null;
}

async function ask(
  env: Env,
  model: string,
  payload: string,
): Promise<string | null> {
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
  const name = tidyColourName(text);
  return name === "" ? null : name;
}

/**
 * A name for this swatch, or null.
 *
 * Null is not an error state: the caller falls back to the filename, which is
 * what the panel did before this existed. Every failure — no key, no network,
 * a refusal, an answer that is a sentence — lands there.
 */
export async function nameColour(
  env: Env,
  bytes: ArrayBuffer,
  mime: string,
  kind: "barva" | "obloga",
): Promise<string | null> {
  if (!nameColourAvailable(env)) return null;
  const payload = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt(kind) },
          { inlineData: { mimeType: mime || "image/jpeg", data: base64(bytes) } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      // A colour name is a handful of tokens. A ceiling this low is also the
      // cheapest guard against an answer that turns into a paragraph.
      maxOutputTokens: 400,
    },
  });
  const models = env.GEMINI_TEXT_MODEL ? [env.GEMINI_TEXT_MODEL] : MODELS;
  for (const m of models) {
    const name = await ask(env, m, payload);
    if (name !== null) return name;
  }
  return null;
}
