/**
 * /admin/enhance — the upscaler, POST only.
 *
 * Model-independent: it takes bytes and returns bytes, so one route serves a
 * product photograph and a site banner alike. It is the ONLY path in the panel
 * that reaches an outside API — see enhance.ts on why it is opt-in per upload
 * and why a failure returns the original rather than an error.
 */

import { enhance, enhanceAvailable } from "../enhance";
import type { AdminCtx } from "./ctx";
import { json, page, seeOther } from "./ctx";

export async function handle(c: AdminCtx): Promise<Response | null> {
  const { admin, api, env, parts, request, shopKey, url } = c;
  // The surface owns its own guard — see the note in blog.ts on what
  // extracting a branch without its condition did the first time.
  if (parts[1] !== "enhance" || request.method !== "POST") return null;
    if (!enhanceAvailable(env)) return new Response("Not found", { status: 404 });
    const form = await request.formData();
    const part = form.get("file");
    if (!(part instanceof File) || part.size === 0) {
      return new Response("No file", { status: 400 });
    }
    // The bytes get base64d into a JSON payload (~2.7× in memory) and may be
    // retried against three models — an uncapped 40 MB camera file is a
    // self-DoS, and Gemini's inline limit is ~20 MB anyway.
    if (part.size > 15 * 1024 * 1024) {
      return new Response("Slika je prevelika za izboljšavo (do 15 MB).", { status: 413 });
    }
    const bytes = await part.arrayBuffer();
    // The caller says how big it wants the result. Validated against the two
    // the API takes rather than passed through — this is a value off the
    // wire, and it reaches an outside service.
    const want = String(form.get("target") ?? "") === "4K" ? "4K" : "2K";
    const done = await enhance(env, bytes, part.type || "image/jpeg", want);
    // Null means the upscaler did not produce anything usable. Answering 204
    // rather than an error is what lets the browser carry on with the file it
    // already has: an optional enhancement must never cost an upload.
    if (!done) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    return new Response(done.bytes, {
      status: 200,
      headers: {
        "content-type": done.mime,
        "cache-control": "no-store",
        // done.mime is whatever the model's API claimed — nosniff keeps the
        // browser from second-guessing it into something executable.
        "x-content-type-options": "nosniff" } });
  return null;
}
