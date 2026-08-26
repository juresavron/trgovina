/**
 * Upscaling an uploaded photograph through Google's image model.
 *
 * ⚠️ READ THIS BEFORE TOUCHING ANYTHING HERE.
 *
 * Nano Banana is a GENERATIVE model, not an upscaler. It does not sharpen the
 * pixels it was given; it draws a new picture that looks like them. On a
 * product page that is a real risk and not a theoretical one: the thing being
 * sold is a specific shell with a specific number of jets, a specific trim and
 * a specific colour, and a model asked to "enhance" it may quietly produce
 * four jets where the supplier's photograph had five.
 *
 * Misleading a consumer about the main characteristics of a product is Article
 * 6 of the Unfair Commercial Practices Directive, and a photograph is a
 * statement about characteristics. So:
 *
 *   - it is OFF by default and the operator turns it on per upload;
 *   - it never runs unless GEMINI_API_KEY is set, so a shop that has not
 *     opted in cannot accidentally publish generated imagery;
 *   - a failure NEVER blocks an upload — the original goes through instead,
 *     which is the safe direction to fail in;
 *   - the panel says, in the operator's language, that the picture was
 *     redrawn rather than sharpened.
 *
 * The owner asked for this deliberately and with the risk stated. That is why
 * it exists; it is not a default anybody backed into.
 */

import type { Env } from "./supabase";

/**
 * The model that does the work.
 *
 * A var rather than a constant because model names move faster than deploys,
 * and pinning one in the source means an outage the day it is retired. The
 * default is Google's current image model; set GEMINI_IMAGE_MODEL in
 * wrangler.jsonc to move it without touching this file.
 */
const DEFAULT_MODEL = "gemini-3-pro-image-preview";

/**
 * What the model is asked to do.
 *
 * Written to constrain rather than to invent. Every clause is there to stop a
 * generative model doing what generative models do — "do not add, remove or
 * alter" is the whole point of the instruction, and the reason the prompt
 * names the subject as a product photograph rather than describing a scene.
 */
const PROMPT =
  "Upscale this product photograph to 2K resolution. Preserve the subject " +
  "exactly: do not add, remove, move or alter any part of the product, its " +
  "colour, its materials, its proportions or the number of any of its " +
  "features. Do not restyle the lighting or the background. Increase " +
  "resolution and sharpness only. Return the image at the same aspect ratio.";

export function enhanceAvailable(env: Env): boolean {
  return typeof env.GEMINI_API_KEY === "string" && env.GEMINI_API_KEY !== "";
}

function base64(bytes: ArrayBuffer): string {
  const b = new Uint8Array(bytes);
  let s = "";
  // Chunked: String.fromCharCode.apply on a multi-megabyte array blows the
  // argument limit, and a 4 MB photograph is an ordinary upload here.
  for (let i = 0; i < b.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, Array.from(b.subarray(i, i + 0x8000)));
  }
  return btoa(s);
}

function fromBase64(s: string): ArrayBuffer {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/** What came back, and what it is — the caller has to know both. */
export interface Enhanced {
  readonly bytes: ArrayBuffer;
  readonly mime: string;
}

/**
 * Redraw one image at 2K, or return null.
 *
 * Null for every failure — no key, a refusal, a timeout, a response with no
 * image in it. The caller uploads the original when this is null, which is
 * why none of these cases throws: an upload that fails because an optional
 * enhancement failed would be a worse tool than one that never had it.
 */
export async function enhance(
  env: Env,
  bytes: ArrayBuffer,
  mime: string,
): Promise<Enhanced | null> {
  if (!enhanceAvailable(env)) return null;

  const model = env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;
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
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mime, data: base64(bytes) } },
            ],
          },
        ],
        generationConfig: { imageConfig: { imageSize: "2K" } },
      }),
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
  return firstImage(body);
}

/**
 * The first image part in a generateContent response.
 *
 * Walked defensively rather than indexed: the response carries text parts and
 * safety metadata beside the image, the casing of the inline-data key has
 * differed between API versions, and a shape change should degrade to "no
 * enhancement" rather than throw inside an upload.
 */
function firstImage(body: unknown): Enhanced | null {
  const cands = (body as { candidates?: unknown }).candidates;
  if (!Array.isArray(cands)) return null;
  for (const c of cands) {
    const parts = (c as { content?: { parts?: unknown } }).content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const p of parts) {
      const inline =
        (p as { inlineData?: unknown }).inlineData ??
        (p as { inline_data?: unknown }).inline_data;
      if (!inline) continue;
      const data = (inline as { data?: unknown }).data;
      const mime =
        (inline as { mimeType?: unknown }).mimeType ??
        (inline as { mime_type?: unknown }).mime_type;
      if (typeof data !== "string" || data === "") continue;
      return {
        bytes: fromBase64(data),
        mime: typeof mime === "string" && mime !== "" ? mime : "image/png",
      };
    }
  }
  return null;
}
