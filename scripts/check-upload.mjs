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
for (const [n, bg] of [["photo.jpg","#8899aa"],["photo2.jpg","#aa8877"],["photo3.jpg","#77aa88"]]) {
  await sharp({ create:{width:1600,height:1200,channels:3,background:bg} }).jpeg().toFile(join(dir,n));
}

async function run(label, patch, files) {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const p = await b.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  let native = false, parts = [], requests = 0, altsSent = [];
  await p.route("**/upload", async (route) => {
    const req = route.request();
    const body = req.postData() || "";
    requests++;
    parts = [...body.matchAll(/name="(w\d+|widths|alt|file)"(?:; filename="([^"]*)")?/g)].map((m) => m[1] + (m[2] ? ":" + m[2] : ""));
    const a = /name="alt"\r?\n\r?\n([^\r]*)/.exec(body);
    if (a) altsSent.push(a[1]);
    native = !body.includes("widths");
    await route.fulfill({ status: 200, contentType: "text/html", body: "<p>ok</p>" });
  });
  if (patch) await p.addInitScript(patch);
  await p.goto("file://" + join(dir, "m.html"));
  const picks = (files || ["photo.jpg"]).map((f) => join(dir, f));
  await p.setInputFiles("#f", picks);
  const boxes = await p.$$(".alt-in");
  if (boxes.length) {
    for (let i = 0; i < boxes.length; i++) await boxes[i].fill("opis " + (i + 1));
  } else {
    await p.fill("#alt", "preizkus");
  }
  await p.click("#go");
  await p.waitForTimeout(1000 + picks.length * 1200);
  console.log("\n== " + label + " ==");
  console.log("  pageerrors:", errs.length ? errs : "none");
  console.log("  status:", (await p.textContent("#st").catch(()=>"?")).trim());
  console.log("  parts:", parts.join(", ") || "(no request)");
  console.log("  native form POST:", native);
  console.log("  requests:", requests, "alts:", JSON.stringify(altsSent));
  await b.close();
}

await run("modern browser");
await run("three files at once", null, ["photo.jpg", "photo2.jpg", "photo3.jpg"]);
// Safari <15: no createImageBitmap
await run("no createImageBitmap", () => { delete window.createImageBitmap; });
// A browser whose toBlob cannot encode WebP: it silently returns PNG.
await run("toBlob cannot encode webp", () => {
  const real = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function (cb, type, q) { return real.call(this, cb, "image/png", q); };
});
