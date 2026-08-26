#!/usr/bin/env node
/**
 * Drive the admin panel's upload path in a real browser, three ways.
 *
 * WHY. The panel converts every photograph to WebP in the browser before it
 * uploads, and the server refuses anything that is not WebP — so the whole
 * feature rests on client code no unit test can reach, in browsers this
 * sandbox does not have. Two of the three cases below were BROKEN and nothing
 * could see it:
 *
 *   1. modern browser            converts, uploads four width rungs.
 *   2. no createImageBitmap      Safari before 15. The conversion bailed out
 *                                entirely, the form did an ordinary POST, and
 *                                the server refused the JPEG with a message
 *                                telling the operator to convert it by hand.
 *                                Now it decodes through an <img> instead.
 *   3. toBlob cannot encode WebP several Safari versions. toBlob falls back to
 *                                PNG SILENTLY, so the panel labelled a PNG
 *                                "480.webp" and let the server discover the
 *                                lie. Now checked before it is sent, and the
 *                                browser's limitation is named where it
 *                                happens rather than blamed on the file.
 *
 *   node scripts/check-upload.mjs
 */
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const out = join(tmpdir(), "panel-bundle.mjs");
execFileSync("node_modules/.bin/esbuild",
  ["src/admin/panel.ts","--bundle","--format=esm","--platform=node","--log-level=warning","--outfile="+out],
  { stdio: "inherit" });
const { modelPage } = await import(out + "?v=" + Date.now());

const dir = join(tmpdir(), "upl2"); mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "m.html"), modelPage("bazen","x","TEST",[],undefined,"a@b.c"));
writeFileSync(join(dir, "e.html"), modelPage("bazen","x","TEST",[],undefined,"a@b.c",true));
// describe on: the server writes the description; the panel shows the note.
writeFileSync(join(dir, "d.html"), modelPage("bazen","x","TEST",[],undefined,"a@b.c",false,true));
for (const [n, bg] of [["photo.jpg","#8899aa"],["photo2.jpg","#aa8877"],["photo3.jpg","#77aa88"]]) {
  await sharp({ create:{width:1600,height:1200,channels:3,background:bg} }).jpeg().toFile(join(dir,n));
}
/** What a working upscaler hands back: a real, larger WebP. */
const BIG_WEBP = await sharp({ create:{width:2048,height:1536,channels:3,background:"#334455"} }).webp().toBuffer();

async function run(label, patch, files, page, opts) {
  opts = opts || {};
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  let native = false, parts = [], requests = 0, altsSent = [], enhancedSent = [];
  await p.route("**/upload", async (route) => {
    const req = route.request();
    const body = req.postData() || "";
    requests++;
    // "enhanced" and "n" are in this list because a field that is not
    // captured cannot be asserted on, and the enhanced flag is the ONLY
    // record of whether the upscaler ran — the width ladder cannot say.
    parts = [...body.matchAll(/name="(w\d+|widths|alt|file|enhanced|n)"(?:; filename="([^"]*)")?/g)].map((m) => m[1] + (m[2] ? ":" + m[2] : ""));
    const e = /name="enhanced"\r?\n\r?\n([^\r]*)/.exec(body);
    if (e) enhancedSent.push(e[1]);
    const a = /name="alt"\r?\n\r?\n([^\r]*)/.exec(body);
    if (a) altsSent.push(a[1]);
    native = !body.includes("widths");
    await route.fulfill({ status: 200, contentType: "text/html", body: "<p>ok</p>" });
  });
  if (patch) await p.addInitScript(patch);
  let enhanceCalls = 0;
  await p.route("**/admin/enhance", async (route) => {
    enhanceCalls++;
    if (opts.upscaleWorks) {
      // A real 2K answer: different bytes, non-empty. The panel has to notice
      // and say so, because "did it upscale?" is otherwise unanswerable.
      // A REAL image, not filler bytes: the panel decodes whatever comes back
      // before it draws the width ladder, so 9 kB of 0x07 fails at decode and
      // tests nothing but the error path.
      await route.fulfill({ status: 200, contentType: "image/webp", body: BIG_WEBP });
      return;
    }
    // Answer the way the Worker does when the model returns nothing usable:
    // the browser must carry on with the original rather than fail.
    await route.fulfill({ status: 204, body: "" });
  });

  await p.goto("file://" + join(dir, page || "m.html"));
  const picks = (files || ["photo.jpg"]).map((f) => join(dir, f));
  // CHOOSING THE FILES IS THE WHOLE INTERACTION. Nothing is typed and nothing
  // is clicked: setInputFiles fires the change event, and the change event is
  // the upload. A test that clicked #go would be testing the no-script
  // fallback and would miss the path every operator actually takes.
  await p.setInputFiles("#f", picks);
  // The page reloads itself when a run finishes, so anything the panel says
  // at the end is gone by the time a single read happens. Polled instead, and
  // the last non-empty reading is kept — which is the one the operator sees.
  let lastStatus = "", lastRows = [];
  for (let t = 0; t < 1200 + picks.length * 1200; t += 100) {
    await p.waitForTimeout(100);
    try {
      const st = (await p.textContent("#st")) || "";
      if (st.trim()) lastStatus = st.trim();
      const rows = await p.$$eval(".picked .rowst", (e) => e.map((x) => x.textContent));
      if (rows.some((r) => r && r !== "čaka")) lastRows = rows;
    } catch { /* mid-reload */ }
  }
  console.log("\n== " + label + " ==");
  console.log("  pageerrors:", errs.length ? errs : "none");
  console.log("  status:", (await p.textContent("#st").catch(()=>"?")).trim());
  console.log("  parts:", parts.join(", ") || "(no request)");
  console.log("  native form POST:", native);
  console.log("  requests:", requests, "alts:", JSON.stringify(altsSent), "enhance calls:", enhanceCalls);
  console.log("  enhanced flag sent:", JSON.stringify(enhancedSent));
  console.log("  row status:", JSON.stringify(lastRows));
  console.log("  last said:", JSON.stringify(lastStatus));
  console.log("  button hidden:", await p.$eval("#gowrap", (e) => e.style.display === "none").catch(() => "?"));
  await b.close();
}

await run("modern browser");
await run("three files at once", null, ["photo.jpg", "photo2.jpg", "photo3.jpg"]);
await run("upscaler on, model returns nothing", null, ["photo.jpg", "photo2.jpg"], "e.html");
// Safari <15: no createImageBitmap
await run("no createImageBitmap", () => { delete window.createImageBitmap; });
// A browser whose toBlob cannot encode WebP: it silently returns PNG.
await run("toBlob cannot encode webp", () => {
  const real = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function (cb, type, q) { return real.call(this, cb, "image/png", q); };
});
// THE UPSCALER, BOTH WAYS. It used to be silent whichever way it went: the
// panel promised 2K and then said nothing, so a missing key and a retired
// model name looked exactly like success. One upload must now answer it.
await run("upscaler works", null, ["photo.jpg", "photo2.jpg"], "e.html", { upscaleWorks: true });
await run("upscaler gives nothing", null, ["photo.jpg", "photo2.jpg"], "e.html");
// No description crosses the wire at all any more — the server writes it from
// the picture it receives. The alts list below must be empty on every run.
await run("ten files, nothing else", null,
  ["photo.jpg", "photo2.jpg", "photo3.jpg"], "d.html");
