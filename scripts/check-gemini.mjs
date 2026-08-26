/**
 * Does the Gemini integration actually work, with this key, today?
 *
 * THE PANEL'S ONLY SIGNAL WAS A LINE OF GREY TEXT. When the key went missing
 * from the Worker the shop kept working perfectly: descriptions fell back to
 * the model name and photographs uploaded at their original size. That is the
 * correct behaviour, since the feature is optional, but it means the failure
 * is invisible unless somebody reads the small print on the upload card. This
 * script is the thing that reads it.
 *
 * It answers three separate questions that one "it doesn't work" hides:
 *
 *   1. Is the key valid at all?  - the models listing
 *   2. Can the describer's models be reached, and do they answer in words?
 *   3. Can the upscaler's models be reached, and do they return an IMAGE?
 *
 * The model list is asked of Google rather than assumed, so when a preview
 * model is renamed - which is why enhance.ts and describe.ts carry fallback
 * lists at all - this names it instead of the panel quietly going silent.
 *
 * THE KEY IS READ FROM THE ENVIRONMENT AND NEVER PRINTED:
 *
 *   GEMINI_API_KEY=... node scripts/check-gemini.mjs
 *
 * Exit code is 0 unless --strict, because a Google outage must not fail a
 * deploy over an optional feature.
 */
import sharp from "sharp";

const KEY = process.env.GEMINI_API_KEY ?? "";
const STRICT = process.argv.includes("--strict");
const API = "https://generativelanguage.googleapis.com/v1beta";

/* The same lists the Worker carries, in the same order. Literals rather than
   imports: those are .ts modules written for the Workers runtime, and a check
   that needs a build step is a check nobody runs. */
const TEXT_MODELS = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"];
const IMAGE_MODELS = [
  "gemini-3-pro-image-preview",
  "gemini-2.5-flash-image",
  "gemini-2.0-flash-preview-image-generation",
];

const ok = (s) => "  [ok]   " + s;
const no = (s) => "  [FAIL] " + s;
const meh = (s) => "  [skip] " + s;

if (!KEY) {
  console.log("GEMINI_API_KEY is not set in this environment.");
  console.log("Nothing to test - the panel writes stand-in descriptions and does not upscale.");
  process.exit(0);
}

/** One request, with the key in a header rather than the URL. */
async function post(model, body) {
  const res = await fetch(API + "/models/" + encodeURIComponent(model) + ":generateContent", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* a non-JSON error body is still a fact */ }
  return { status: res.status, json, text };
}

/** A real photograph-shaped image, because a 1x1 pixel is not a test. */
async function sample() {
  const inner = await sharp({
    create: { width: 420, height: 240, channels: 3, background: { r: 225, g: 228, b: 230 } },
  }).png().toBuffer();
  const buf = await sharp({
    create: { width: 640, height: 480, channels: 3, background: { r: 40, g: 90, b: 120 } },
  })
    .composite([{ input: inner, top: 150, left: 110 }])
    .webp({ quality: 90 })
    .toBuffer();
  return buf.toString("base64");
}

let failures = 0;

/* ---- 1. is the key valid at all? --------------------------------------- */

console.log("");
console.log("KEY");
const available = new Set();
try {
  const res = await fetch(API + "/models?pageSize=200", { headers: { "x-goog-api-key": KEY } });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 200);
    console.log(no("the models listing returned " + res.status));
    // A rejected key is a different fix from an outage, so name which it is.
    if (/API_KEY_INVALID|API key not valid/i.test(body)) {
      console.log("         the key itself is rejected - check it in Google AI Studio");
    } else if (res.status === 403) {
      console.log("         refused: the Generative Language API may not be enabled for this key");
    }
    failures++;
  } else {
    const body = await res.json();
    for (const m of body.models ?? []) available.add(String(m.name ?? "").replace(/^models\//, ""));
    console.log(ok("valid - " + available.size + " models visible to this key"));
  }
} catch (e) {
  console.log(no("could not reach Google at all: " + e.message));
  failures++;
}

/* ---- 2. the describer -------------------------------------------------- */

console.log("");
console.log("DESCRIBER  (writes the Slovenian alt text)");
const b64 = await sample();
let describerWorks = false;
for (const model of TEXT_MODELS) {
  if (available.size && !available.has(model)) {
    console.log(meh(model + " - not offered to this key"));
    continue;
  }
  const r = await post(model, {
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/webp", data: b64 } },
        { text: "Opisi to sliko v enem stavku v slovenscini." },
      ],
    }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 200 },
  });
  if (r.status !== 200) {
    console.log(no(model + " - HTTP " + r.status + " " + String(r.json?.error?.message ?? r.text).slice(0, 120)));
    continue;
  }
  const said = (r.json?.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text).filter(Boolean).join(" ").trim();
  if (!said) {
    console.log(no(model + " - answered 200 with no text in it"));
    continue;
  }
  console.log(ok(model + " - " + JSON.stringify(said.slice(0, 90))));
  describerWorks = true;
  break; // The Worker takes the first that answers, so this should too.
}
if (!describerWorks) {
  console.log(no("no describer model answered - uploads get stand-in descriptions"));
  failures++;
}

/* ---- 3. the upscaler --------------------------------------------------- */

console.log("");
console.log("UPSCALER  (redraws a photograph at 2K)");
let upscalerWorks = false;
for (const model of IMAGE_MODELS) {
  if (available.size && !available.has(model)) {
    console.log(meh(model + " - not offered to this key"));
    continue;
  }
  const r = await post(model, {
    contents: [{
      role: "user",
      parts: [
        { inlineData: { mimeType: "image/webp", data: b64 } },
        { text: "Upscale this product photograph. Do not add, remove or alter anything in it." },
      ],
    }],
    generationConfig: { imageConfig: { imageSize: "2K" } },
  });
  if (r.status !== 200) {
    console.log(no(model + " - HTTP " + r.status + " " + String(r.json?.error?.message ?? r.text).slice(0, 120)));
    continue;
  }
  const part = (r.json?.candidates?.[0]?.content?.parts ?? [])
    .find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!part) {
    // A 200 carrying only text is the failure that matters most: the model
    // accepted the request and declined to produce a picture, which the Worker
    // correctly treats as "no upscale" - silently.
    console.log(no(model + " - answered 200 but returned no image"));
    continue;
  }
  const bytes = Buffer.from(part.inlineData?.data ?? part.inline_data.data, "base64");
  const meta = await sharp(bytes).metadata();
  console.log(ok(model + " - returned " + meta.width + "x" + meta.height + " " + meta.format +
    ", " + Math.round(bytes.length / 1024) + " kB"));
  if (meta.width < 1500) {
    console.log("         warning: narrower than 2K - this model is ignoring the 2K request");
  }
  upscalerWorks = true;
  break;
}
if (!upscalerWorks) {
  console.log(no("no image model returned a picture - photographs upload at original size"));
  failures++;
}

console.log("");
console.log(failures === 0 ? "Gemini integration is working." : failures + " of 3 checks failed - see above.");
process.exit(STRICT && failures ? 1 : 0);
