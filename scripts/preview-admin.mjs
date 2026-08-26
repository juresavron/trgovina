#!/usr/bin/env node
/** Render the admin panel's pages with stand-in photographs and shoot them. */
import { mkdirSync, writeFileSync, rmSync, cpSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { chromium } from "playwright-core";
/**
 * Load a TypeScript module the way the deploy does: bundled.
 *
 * Node can execute a .ts file directly, but it will not resolve the
 * extensionless, directory-style imports this project uses throughout
 * ("../tenants", "./sections") — resolving those is a bundler's job, and
 * wrangler does exactly this with esbuild on every deploy. So the preview
 * bundles too, rather than the source being contorted to suit a script that
 * only ever runs here.
 */
async function bundle(entry) {
  const out = join(tmpdir(), "preview-" + entry.replace(/[^a-z0-9]+/gi, "-") + ".mjs");
  // The shipped esbuild is a native binary, not a JS wrapper — running it
  // through node gets you the ELF header as a syntax error.
  execFileSync(
    "node_modules/.bin/esbuild",
    [entry, "--bundle", "--format=esm", "--platform=node",
     "--log-level=warning", "--outfile=" + out],
    { stdio: "inherit" },
  );
  return await import(out);
}

const { loginPage, indexPage, modelPage, notFoundPage, notConfiguredPage } =
  await bundle("src/admin/panel.ts");

const OUT = "/tmp/panel-preview";
const PORT = 8799;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "media/bazen/veliki-230"), { recursive: true });
if (existsSync("public")) cpSync("/home/user/trgovina/public", OUT, { recursive: true });

/* Stand-in photographs: a product-ish shape on a white sweep. */
async function shot(file, w, h, hue) {
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="${w}" height="${h}" fill="#f4f2ef"/>
      <rect x="${w * 0.12}" y="${h * 0.28}" width="${w * 0.76}" height="${h * 0.46}"
        rx="${w * 0.05}" fill="hsl(${hue},18%,62%)"/>
      <rect x="${w * 0.2}" y="${h * 0.36}" width="${w * 0.6}" height="${h * 0.3}"
        rx="${w * 0.03}" fill="hsl(${hue},34%,74%)"/>
    </svg>`,
  );
  await sharp(svg).webp().toFile(join(OUT, file));
}
const NAMES = ["a", "b", "c", "d", "e"];
for (let i = 0; i < NAMES.length; i++) {
  await shot(`media/bazen/veliki-230/${NAMES[i]}.webp`, 800, 600, 190 + i * 22);
}
mkdirSync(join(OUT, "media/bazen/mali-180"), { recursive: true });
await shot("media/bazen/mali-180/a.webp", 800, 600, 30);

const MODELS = [
  { shop: "bazen", slug: "veliki-230", name: "Masažni bazen ZR6801", count: 5, cover: "bazen/veliki-230/a.webp" },
  { shop: "bazen", slug: "mali-180", name: "Masažni bazen ZR6802", count: 1, cover: "bazen/mali-180/a.webp" },
  { shop: "bazen", slug: "srednji-200", name: "Masažni bazen ZR7860", count: 2, cover: "bazen/veliki-230/b.webp" },
  { shop: "bazen", slug: "swim-450", name: "Swim spa ZR7807 Dual Zone", count: 4 },
  { shop: "bazen", slug: "swim-580", name: "Swim spa ZR7809 Hydrotherapy", count: 0 },
  { shop: "bazen", slug: "swim-500", name: "Swim spa ZR7810 Combo", count: 12, cover: "bazen/veliki-230/c.webp" },
];
const MEDIA = NAMES.map((n, i) => ({
  id: "id-" + n,
  url: `bazen/veliki-230/${n}.webp`,
  alt: i === 0 ? "Masažni bazen na leseni terasi ob večernem soncu" : "Notranjost školjke z ležalnikom in šobami",
  sort: i,
  widths: i % 2 ? [480, 800, 1200] : [],
}));

const pages = {
  "login.html": loginPage(),
  "login-error.html": loginPage("Napačen e-naslov ali geslo."),
  "index.html": indexPage("Masažni bazeni Vrelec", "bazen", MODELS, "savronsavron@gmail.com"),
  // enhance + describe on: the shot has to show the two AI disclosures, which
  // are the lines an operator reads before trusting either.
  "model.html": modelPage("bazen", "veliki-230", "Masažni bazen ZR6801", MEDIA, undefined, "savronsavron@gmail.com", true, true),
  "model-notice.html": modelPage("bazen", "veliki-230", "Masažni bazen ZR6801", MEDIA, { kind: "ok", text: "Fotografija je naložena." }, "savronsavron@gmail.com"),
  // describe OFF, so the shot shows the line that says WHY nothing is being
  // written — the state an operator with no GEMINI_API_KEY actually sees.
  "model-empty.html": modelPage("bazen", "swim-580", "Swim spa ZR7809 Hydrotherapy", [], { kind: "err", text: "Naložiti je mogoče samo slike v obliki WebP." }, "savronsavron@gmail.com", false, false),
  "notfound.html": notFoundPage("Ta model ne obstaja.", "savronsavron@gmail.com"),
  "notconfigured.html": notConfiguredPage(["SUPABASE_ANON_KEY"]),
};
for (const [f, h] of Object.entries(pages)) writeFileSync(join(OUT, f), h);

const TYPES = { ".html": "text/html; charset=utf-8", ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };
const server = createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  try {
    const body = await readFile(join(OUT, p === "/" ? "index.html" : p));
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end("no"); }
});
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [file] of Object.entries(pages)) {
  for (const [label, vp] of [["desk", { width: 1440, height: 1000 }], ["phone", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${PORT}/${file}`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      for (const img of document.querySelectorAll("img")) img.loading = "eager";
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(OUT, file.replace(".html", "") + "-" + label + ".png"), fullPage: true });
    // Horizontal overflow check
    const over = await page.evaluate(() => {
      const bad = [];
      const w = document.documentElement.clientWidth;
      for (const el of document.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > w + 1 || r.left < -1)) bad.push(el.tagName + "." + el.className + " " + Math.round(r.right));
      }
      return bad.slice(0, 5);
    });
    if (over.length) console.log("OVERFLOW", file, label, over);
    await page.close();
  }
}
await browser.close();
server.close();
console.log("shot", Object.keys(pages).length, "pages into", OUT);
