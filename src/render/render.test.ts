import { describe, expect, it } from "vitest";
import { SHOPS } from "../tenants";
import { CONTENT } from "../content";
import { THEME_CATALOG } from "../themes/catalog";
import { handleRequest } from "../worker";

function get(path: string, host = "trgovina.worldfans.workers.dev"): Response {
  return handleRequest(new Request("https://" + host + path, { headers: { host } }));
}

async function text(r: Response): Promise<string> {
  return await r.text();
}

describe("kernel invariants", () => {
  it("every shop has content and a valid theme", () => {
    for (const key of Object.keys(SHOPS)) {
      expect(CONTENT[key], key + " content").toBeTruthy();
      expect(THEME_CATALOG[SHOPS[key]!.design.theme], key + " theme").toBeTruthy();
    }
  });

  it("unknown production host is a hard 404 — never another shop's page", () => {
    const r = get("/", "neobstaja.example.com");
    expect(r.status).toBe(404);
  });
});

describe("QA host (workers.dev)", () => {
  it("serves the dev shop home with noindex, keyword H1 and prod canonical", async () => {
    const r = get("/");
    expect(r.status).toBe(200);
    expect(r.headers.get("x-robots-tag")).toContain("noindex");
    const body = await text(r);
    expect(body).toContain("Infrardeča savna za vaš dom.");
    expect(body).toContain('rel="canonical" href="https://infrardeca-savna.si/"');
    expect(body).toContain('data-theme="zarja"');
  });

  it("dev overrides swap shop and theme, validated against known keys", async () => {
    const body = await text(get("/?shop=kad&theme=salon"));
    expect(body).toContain("Ledena kad s pravim hlajenjem.");
    expect(body).toContain('data-theme="salon"');
    const hostile = await text(get("/?shop=../../etc&theme=<img>"));
    expect(hostile).toContain("Infrardeča savna");
    expect(hostile).not.toContain("<img>");
  });

  it("every shop × theme combination renders", () => {
    for (const shop of Object.keys(SHOPS)) {
      for (const theme of Object.keys(THEME_CATALOG)) {
        const r = get("/?shop=" + shop + "&theme=" + theme);
        expect(r.status, shop + "×" + theme).toBe(200);
      }
    }
  });

  it("PDP renders Product JSON-LD with the cents-derived price and no review schema", async () => {
    const shop = SHOPS.savna!;
    const path = shop.routeSlugs["/product"] + "/" + CONTENT.savna!.pdp.slug;
    const body = await text(get(path));
    expect(body).toContain('"@type":"Product"');
    expect(body).toContain('"price":"1990.00"');
    expect(body).not.toContain("AggregateRating");
    expect(body).not.toContain('"@type":"Review"');
  });

  it("robots.txt is closed on the QA host", async () => {
    const body = await text(get("/robots.txt"));
    expect(body).toContain("Disallow: /");
  });
});

describe("production domains (pre-live)", () => {
  it("serves 503 + noindex until live flips", async () => {
    const r = get("/", "infrardeca-savna.si");
    expect(r.status).toBe(503);
    expect(r.headers.get("x-robots-tag")).toContain("noindex");
    const body = await text(r);
    expect(body).toContain("Kmalu.");
  });

  it("sitemap 404s while pre-live", () => {
    expect(get("/sitemap.xml", "infrardeca-savna.si").status).toBe(404);
  });

  it("www resolves to the same shop", () => {
    expect(get("/", "www.ledena-kad.si").status).toBe(503);
  });
});

describe("canonicalization", () => {
  it("trailing slash and uppercase redirect with 308", () => {
    expect(get("/savna/quattro/").status).toBe(308);
    expect(get("/SAVNA/quattro").status).toBe(308);
  });
});
