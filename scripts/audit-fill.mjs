#!/usr/bin/env node
/**
 * FILL SWEEP — where does a page stop reaching across its own band?
 *
 * WHY THIS EXISTS. Three rounds of width work were driven by screenshots the
 * owner sent, one page at a time, and each round found a layer the previous
 * one had not: the band wrappers, then where the document sat inside them,
 * then how much of it the content used. Screenshots are a bad instrument for
 * that — they only cover the page someone happened to look at, at the width
 * their monitor happens to be.
 *
 * So this measures the thing the eye is actually reacting to. It walks each
 * page in 80px horizontal strips, finds the rightmost element that PAINTS
 * something in each strip (text, media, a ground, a rule — not an empty box
 * and not absolutely positioned decoration), and expresses that as a
 * percentage of the band's own content width. Consecutive low strips group
 * into a REGION, and a region tall enough to notice is reported with the
 * widest thing in it, which is almost always the thing to fix.
 *
 * ⚠️ A LOW NUMBER IS NOT AUTOMATICALLY A BUG. A single paragraph set at a
 * reading measure in a 1560px band is ~40% and is CORRECT — prose has a
 * measure and stretching it is worse than the white beside it. What this
 * catches is the other thing: a 400–800px band of page where the widest
 * element is 20–35% across because a STRUCTURE — a hairline, a numbered
 * rule, a row of options, a stack of contact rows — inherited a cap meant
 * for sentences. Read the "widest thing there" column before acting.
 *
 *   node scripts/audit-fill.mjs          # 1920
 *   V=2560 node scripts/audit-fill.mjs   # any width
 *
 * Prints nothing when every region clears the threshold.
 */
import { mkdirSync, writeFileSync, cpSync, existsSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { chromium } from "playwright-core";
async function bundle(e){const o=join(tmpdir(),"fl-"+e.replace(/[^a-z0-9]+/gi,"-")+".mjs");
  execFileSync("node_modules/.bin/esbuild",[e,"--bundle","--format=esm","--platform=node","--log-level=warning","--outfile="+o],{stdio:"inherit"});return await import(o);}
const { handleRequest } = await bundle("src/worker.ts");
const { SHOPS } = await bundle("src/tenants/index.ts");
const { CONTENT } = await bundle("src/content/index.ts");
const { blogIndexDoc } = await bundle("src/blog/routes.ts");
const KEY = process.env.AUDIT_SHOP || "bazen";
if (!SHOPS[KEY] || !CONTENT[KEY]) { console.error("AUDIT_SHOP=" + KEY + " is not a registered shop with content"); process.exit(2); }
const shop=SHOPS[KEY], content=CONTENT[KEY];
const NOT=new Set(["/product","/guide","/order-success"]);
const R=new Set(["/"]); for(const [k,v] of Object.entries(shop.routeSlugs)) if(!NOT.has(k)) R.add(v);
for(const c of content?.collections??[]) R.add(c.path);
const ROUTES=[...R].filter(p=>p&&p.startsWith("/"));
for(const d of (content?.pdps??[content.pdp])) ROUTES.push(shop.routeSlugs["/product"]+"/"+d.slug);
const BLOG=shop.routeSlugs["/blog"];
const OUT="/tmp/fill", PORT=8921, HOST="https://trgovina.worldfans.workers.dev";
rmSync(OUT,{recursive:true,force:true}); mkdirSync(join(OUT,"media"),{recursive:true});
if (existsSync("public")) cpSync("public",OUT,{recursive:true});
const docs={};
for(const r of ROUTES) docs[r]= r===BLOG ? blogIndexDoc(shop,content,[],true)
  : await handleRequest(new Request(HOST+r+"?shop="+KEY)).text();
const file=(p)=>(p==="/"?"index":p.replace(/[^a-z0-9]+/gi,"_"))+".html";
for(const [r,h] of Object.entries(docs)) writeFileSync(join(OUT,file(r)),h);
mkdirSync(join(OUT,"assets"),{recursive:true});
const as=new Set(); for(const h of Object.values(docs)) for(const m of h.matchAll(/\/assets\/site-[0-9a-f]{8}\.(?:css|js)/g)) as.add(m[0]);
for(const a of as) writeFileSync(join(OUT,a.replace(/^\//,"")), await handleRequest(new Request(HOST+a)).text());
const want=new Set(); for(const h of Object.values(docs)) for(const m of h.matchAll(/\/media\/([^"'\s)]+)/g)) want.add(m[1]);
for(const n of want){const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><rect width="100%" height="100%" fill="#c2c9c5"/></svg>');
  mkdirSync(dirname(join(OUT,"media",n)),{recursive:true}); writeFileSync(join(OUT,"media",n), await sharp(svg).jpeg().toBuffer());}
const T={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".woff2":"font/woff2",".jpg":"image/jpeg",".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml"};
const srv=createServer(async(q,s)=>{let p=decodeURIComponent(new URL(q.url,"http://x").pathname);
  try{let b=await readFile(join(OUT,normalize(p).replace(/^(\.\.[/\\])+/,"")));
    if(extname(p)===".html") b=Buffer.from(String(b).replaceAll('loading="lazy"','loading="eager"'));
    s.writeHead(200,{"content-type":T[extname(p)]||"application/octet-stream"});s.end(b);}catch{s.writeHead(404).end("no");}});
await new Promise(r=>srv.listen(PORT,r));
const br=await chromium.launch({executablePath:"/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args:["--no-sandbox"]});
const VW=Number(process.env.V||1920);
const rows=[];
for(const r of ROUTES){
  const pg=await br.newPage({viewport:{width:VW,height:1100},reducedMotion:"reduce"});
  await pg.goto("http://127.0.0.1:"+PORT+"/"+file(r),{waitUntil:"networkidle"});
  await pg.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,20));}window.scrollTo(0,0);});
  const out=await pg.evaluate(()=>{
    const bar=document.querySelector(".st-chrome-bar");
    const cs=getComputedStyle(bar), bb=bar.getBoundingClientRect();
    const bandL=bb.x+parseFloat(cs.paddingLeft), bandR=bb.right-parseFloat(cs.paddingRight);
    const bandW=bandR-bandL;
    const docH=document.documentElement.scrollHeight;
    // Collect every element that PAINTS something, with its page-space box.
    const items=[];
    for (const el of document.querySelectorAll("main *, footer *")) {
      const s2=getComputedStyle(el);
      if (s2.display==="none"||s2.visibility==="hidden"||Number(s2.opacity)===0) continue;
      const b=el.getBoundingClientRect();
      if (b.width<4||b.height<4) continue;
      const hasText=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      const isMedia=/^(IMG|VIDEO|SVG|CANVAS)$/i.test(el.tagName);
      const bg=s2.backgroundColor;
      // ⚠️ A GROUND ONLY COUNTS ON SOMETHING SMALLER THAN THE BAND, and this
      // is the bug that made the first version of this sweep useless. Every
      // content page's <section class="st-page"> is full-bleed and paints the
      // page white, so it "painted" in every strip at 132% of the band and
      // masked the actual content underneath. The sweep reported /dostava-in-
      // montaza and every one of its twelve siblings as clean while their
      // steps and prose reached ~60%. A card or a tile is content and its
      // ground should count; a page's own backdrop is not.
      const hasGround=(bg!=="rgba(0, 0, 0, 0)"&&bg!=="transparent")&&b.width<=bandW+1;
      const hasRule=(parseFloat(s2.borderBottomWidth)>0||parseFloat(s2.borderTopWidth)>0)&&b.width<=bandW+1;
      if(!hasText&&!isMedia&&!hasGround&&!hasRule) continue;
      items.push({t:b.top+window.scrollY, bo:b.bottom+window.scrollY, r:b.right,
        n:el.tagName+"."+String(el.className||"").split(" ")[0]});
    }
    // Walk the page in 80px strips; how far right does anything reach?
    const STRIP=80, strips=[];
    for (let y=0; y<docH; y+=STRIP) {
      let maxR=-1, who="";
      for (const it of items) {
        if (it.bo < y || it.t > y+STRIP) continue;
        if (it.r>maxR){maxR=it.r; who=it.n;}
      }
      if (maxR<0) continue;
      strips.push({y, fill: Math.round(((maxR-bandL)/bandW)*1000)/10, who});
    }
    // Group consecutive low-fill strips into regions.
    const LOW=62, regions=[]; let cur=null;
    for (const s of strips) {
      if (s.fill<LOW) { if(!cur) cur={y0:s.y,y1:s.y+STRIP,minFill:s.fill,who:s.who};
        else {cur.y1=s.y+STRIP; if(s.fill<cur.minFill){cur.minFill=s.fill;cur.who=s.who;}} }
      else if (cur) { regions.push(cur); cur=null; }
    }
    if (cur) regions.push(cur);
    return {bandW:Math.round(bandW), docH, regions: regions.filter(g=>g.y1-g.y0>=240)};
  });
  for (const g of out.regions) rows.push({route:r, ...g, docH: out.docH});
  await pg.close();
}
await br.close(); srv.close();
rows.sort((a,b)=>(b.y1-b.y0)-(a.y1-a.y0));
console.log("VIEWPORT "+VW+" — vertical regions where nothing reaches past "+62+"% of the band");
console.log("height  fill%  route                     y-range        widest thing there");
for (const x of rows) {
  console.log(String(x.y1-x.y0).padStart(6), String(x.minFill).padStart(6), " ",
    x.route.padEnd(24), (x.y0+"-"+x.y1).padEnd(14), x.who.slice(0,38),
    "  ("+Math.round((x.y1-x.y0)/x.docH*100)+"% of page)");
}
const tot={};
for (const x of rows) tot[x.route]=(tot[x.route]||0)+(x.y1-x.y0);
console.log("\nWORST ROUTES by total under-filled height:");
Object.entries(tot).sort((a,b)=>b[1]-a[1]).forEach(([r,h])=>console.log("  "+String(h).padStart(6)+"px  "+r));
