/**
 * Contact sheet of the product drawings, rendered at the size a Best Sellers
 * card gives them, on the panel colour they actually sit on. The whole point
 * is to ask "does this read as the product" at the size a visitor asks it —
 * a 900px inspection of an SVG proves nothing about a 372px card.
 */
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const src = readFileSync("src/themes/studio/product-art.ts", "utf8");
const open = src.indexOf("= {", src.indexOf("const ART"));
const close = src.indexOf("\n};", open);
const ART = eval("(" + src.slice(open + 2, close + 2) + ")");

const OUT = process.argv[2] || "/tmp/shots/sheet";
mkdirSync(OUT, { recursive: true });

const keys = Object.keys(ART);
const cards = keys
  .map(
    (k) =>
      `<figure><div class="slot"><svg viewBox="0 0 240 180" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${ART[k]}</svg></div><figcaption>${k}</figcaption></figure>`,
  )
  .join("");

const html = `<!doctype html><meta charset=utf-8><style>
  body { margin: 0; padding: 40px; background: #fff; font: 14px system-ui; }
  .grid { display: flex; flex-wrap: wrap; gap: 34px; }
  figure { margin: 0; }
  /* 372px is the real rail card width; the slot is the 4:3 media box. */
  .slot { width: 372px; aspect-ratio: 4 / 3; background: #f0f0f0; border-radius: 8px;
          display: grid; place-items: center; color: rgba(21,21,21,.62); }
  .slot svg { width: 76%; height: auto; }
  figcaption { padding-top: 10px; color: #6d6d6d; }
</style><div class="grid">${cards}</div>`;

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});
const page = await browser.newPage({ viewport: { width: 1320, height: 1200 }, deviceScaleFactor: 2 });
await page.setContent(html);
await page.screenshot({ path: OUT + "/sheet.png", fullPage: true });
await browser.close();
console.log("wrote " + OUT + "/sheet.png — " + keys.length + " drawings");
