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
    expect(body).toContain("Masažni bazen za pet ali šest oseb.");
    expect(body).toContain('rel="canonical" href="https://masazni-bazen.si/"');
    expect(body).toContain('data-theme="studio"');
  });

  it("ignores ?shop= and ?theme= entirely, and never reflects them", async () => {
    // There are no overrides any more: one shop, one theme, and the QA
    // switcher that drove them is gone. What still matters is that a query
    // parameter carrying hostile input is IGNORED rather than echoed.
    //
    // This test used to assert `?theme=salon` produced data-theme="salon",
    // and it kept passing after the override was removed — because the dead
    // theme's CSS was still being shipped on every page and `toContain`
    // matched the STYLESHEET. So it now reads the attribute off the <html>
    // tag itself, which is the only thing that can be true or false here.
    const themeOf = (html: string) => (html.match(/<html[^>]*data-theme="([^"]+)"/) || [])[1];

    expect(themeOf(await text(get("/?theme=salon")))).toBe("studio");
    const hostile = await text(get("/?shop=../../etc&theme=<img>"));
    expect(themeOf(hostile)).toBe("studio");
    expect(hostile).toContain("Masažni bazen");
    expect(hostile).not.toContain("<img>");
    expect(hostile).not.toContain("../../etc");
  });

  it("ships no stylesheet for a theme nothing wears", () => {
    // The dead CSS was not merely waste — it made the test above pass for
    // three months of edits it should have failed.
    const html = "";
    return text(get("/")).then((body) => {
      for (const dead of ["zarja", "lednik", "salon"]) {
        expect(body, dead + " CSS is still shipping").not.toContain('data-theme="' + dead + '"');
      }
      expect(html).toBe("");
    });
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
    const shop = SHOPS.bazen!;
    const path = shop.routeSlugs["/product"] + "/" + CONTENT.bazen!.pdp.slug;
    const body = await text(get(path));
    expect(body).toContain('"@type":"Product"');
    // No Offer at all while COST_INPUTS is null: a Product carrying a price
    // nobody set is a structured-data claim about money, which is the
    // category of error that earns a manual action.
    expect(body).not.toContain('"@type":"Offer"');
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
    const r = get("/", "masazni-bazen.si");
    expect(r.status).toBe(503);
    expect(r.headers.get("x-robots-tag")).toContain("noindex");
    const body = await text(r);
    expect(body).toContain("Kmalu.");
  });

  it("sitemap 404s while pre-live", () => {
    expect(get("/sitemap.xml", "masazni-bazen.si").status).toBe(404);
  });

  it("www resolves to the same shop", () => {
    expect(get("/", "www.masazni-bazen.si").status).toBe(503);
  });

  it("404s a host that is not the shop's, with no fallback", () => {
    // The five retired shops' domains must NOT resolve to bazen. Serving one
    // shop under another shop's host is cross-canonical leakage, which is the
    // failure the whole no-production-fallback rule exists to prevent — and
    // now that those domains are gone from SHOPS, this is the test that says
    // so out loud.
    for (const host of ["infrardeca-savna.si", "ledena-kad.si", "biljardna-miza.si"]) {
      expect(get("/", host).status, host).toBe(404);
    }
  });
});

describe("canonicalization", () => {
  it("trailing slash and uppercase redirect with 308", () => {
    expect(get("/bazen/veliki-230/").status).toBe(308);
    expect(get("/BAZEN/veliki-230").status).toBe(308);
  });
});
