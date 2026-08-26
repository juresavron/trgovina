import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: Number(process.argv[4]||1440), height: Number(process.argv[5]||900) } });
await p.goto(process.argv[2], { waitUntil: "networkidle" });
await p.evaluate(() => { for (const i of document.querySelectorAll("img")) i.loading="eager"; });
await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await p.waitForTimeout(400);
await p.screenshot({ path: process.argv[3] });
await b.close();
