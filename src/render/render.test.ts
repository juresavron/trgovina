import { describe, expect, it } from "vitest";
import { SHOPS } from "../tenants";
import { CONTENT } from "../content";
import { THEME_CATALOG } from "../themes/catalog";
import { handleRequest } from "../worker";
import { catalogPricingReady } from "../catalog/pricing";

/**
 * The shop's production host, read from the config rather than typed here.
 *
 * These assertions used to spell out masazni-bazen.si. That is a fact about
 * ONE tenant's registration, not about the routing behaviour they exist to
 * prove, so renaming the domain failed three tests that were describing the
 * old name rather than a defect. Derived, they now assert the same thing —
 * canonicals point at the real domain, the real domain is gated pre-live —
 * whatever it is called.
 */
const PROD_HOST = SHOPS["bazen"]!.domain;

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
    // ⚠️ THE CONTRACT IS "keyword H1", NOT A PARTICULAR SENTENCE. This pinned
    // the h1 verbatim, so rewriting the hero's copy — a thing marketing does,
    // and did — failed a test about routing and indexing. What the test is
    // for is that the page a crawler sees leads its one h1 with the shop's
    // keyword; the words after it are the shop's business.
    const h1 = (body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) ?? [])[1] ?? "";
    expect(h1, "no h1 on the home page").not.toBe("");
    expect(
      h1.toLowerCase().startsWith(SHOPS["bazen"]!.keyword.primary.toLowerCase()),
      "h1 does not lead with the keyword: " + h1,
    ).toBe(true);
    expect(body).toContain('rel="canonical" href="https://' + PROD_HOST + '/"');
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
    if (catalogPricingReady()) {
      // A real Offer, and only from the same cents the page itself shows —
      // one source, so the schema and the visible price cannot disagree.
      expect(body).toContain('"@type":"Offer"');
      expect(body).toContain('"priceCurrency":"EUR"');
      expect(body).toContain('"price":"' + (CONTENT.bazen!.pdp.priceCents / 100).toFixed(2) + '"');
    } else {
      // No Offer at all while COST_INPUTS is null: a Product carrying a price
      // nobody set is a structured-data claim about money, which is the
      // category of error that earns a manual action.
      expect(body).not.toContain('"@type":"Offer"');
    }
    expect(body).not.toContain("AggregateRating");
    expect(body).not.toContain('"@type":"Review"');
  });

  it("robots.txt is closed on the QA host", async () => {
    const body = await text(get("/robots.txt"));
    expect(body).toContain("Disallow: /");
  });
});

/**
 * LIVE-AWARE, deliberately: these used to hard-code the pre-live answers,
 * which made them three tests that fail ON THE LAUNCH COMMIT — the one
 * commit nobody has time to argue with a red suite about. The launch-flip
 * rehearsal found them; they now assert the gate in whichever state the
 * config is actually in, so the flip changes what is asserted, not whether
 * the suite passes.
 */
describe("production domains (gated by live)", () => {
  const LIVE = SHOPS["bazen"]!.live;

  it(LIVE ? "serves 200, indexable, once live" : "serves 503 + noindex until live flips", async () => {
    const r = get("/", PROD_HOST);
    if (LIVE) {
      expect(r.status).toBe(200);
      expect(r.headers.get("x-robots-tag")).toBeNull();
      expect(await text(r)).not.toContain('name="robots"');
    } else {
      expect(r.status).toBe(503);
      expect(r.headers.get("x-robots-tag")).toContain("noindex");
      expect(await text(r)).toContain("Kmalu.");
    }
  });

  it(LIVE ? "sitemap serves once live" : "sitemap 404s while pre-live", () => {
    expect(get("/sitemap.xml", PROD_HOST).status).toBe(LIVE ? 200 : 404);
  });

  it("www redirects to the canonical host rather than serving a copy", () => {
    // ⚠️ IT USED TO SERVE. www answered 200 with the same body and the same
    // canonical tag as the apex, which leaves a crawler to work out for
    // itself that the two are one page. The tag makes the right answer
    // likely; a 301 makes it certain, and costs one response.
    //
    // Pre-live too: the holding page should exist at one address, so that
    // the redirect is already in place and cached on the day the shop opens
    // rather than being introduced on exactly the day it matters.
    const r = get("/", "www." + PROD_HOST);
    expect(r.status).toBe(301);
    expect(r.headers.get("location")).toBe(SHOPS["bazen"]!.siteUrl + "/");
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

/**
 * POST/REDIRECT/GET, from the GET half — which is the half handleRequest owns.
 *
 * The write and the 303 live in the async layer (worker.ts's default export)
 * because they need env; what can be asserted here is the contract that makes
 * the redirect worth anything: that the address it sends the browser to
 * renders the confirmation, drops the form, and is never indexed or cached.
 * Without that, a 303 to ?poslano would be a redirect to an empty contact
 * page and the visitor would think the enquiry vanished.
 */
describe("the enquiry confirmation is a GET", () => {
  const CONTACT = SHOPS["bazen"]!.routeSlugs["/contact"]!;

  it("renders the confirmation and removes the form", async () => {
    const html = await text(get(CONTACT + "?poslano"));
    expect(html).toContain("st-enq-done");
    expect(html).toContain("Povpraševanje je oddano.");
    // ⚠️ THE FORM MUST BE GONE. Leaving a filled form under a success message
    // invites a second submission of the same enquiry — the reason the done
    // state replaces it rather than captioning it.
    expect(html).not.toContain('<form class="st-enq"');
  });

  it("is never indexed and never cached", () => {
    const r = get(CONTACT + "?poslano");
    expect(r.headers.get("x-robots-tag")).toContain("noindex");
    expect(r.headers.get("cache-control")).toBe("no-store");
  });

  it("the contact page without the mark still carries the form", async () => {
    const html = await text(get(CONTACT));
    expect(html).toContain('<form class="st-enq"');
    expect(html).not.toContain("st-enq-done");
  });
});

/**
 * The hero's Google rating renders only where it can be checked.
 *
 * ⚠️ THE DEFAULT MATTERS MORE THAN THE FEATURE. bazen ships with no rating
 * configured, so the assertion that earns its keep is the absence: a shop
 * that has not read its profile must not grow stars, and a half-filled config
 * (a score with no link, a count of zero) must draw nothing rather than an
 * unverifiable claim — which is what ZVPot-1 Annex I 23b/23c is about.
 */
describe("the hero's rating", () => {
  it("prints the score the shop configured, and its count", async () => {
    const g = SHOPS["bazen"]!.googleRating!;
    // 24 five-star and 10 four-star: 34 reviews, sum 160, mean 4.7059.
    expect(g.count).toBe(24 + 10);
    expect(g.score).toBeCloseTo((24 * 5 + 10 * 4) / (24 + 10), 1);
    const html = await text(get("/"));
    // The decimal is a comma in Slovenian, and the count takes the genitive
    // plural at 34 — not the dual, which is what "34 mnenji" would be.
    expect(html).toContain("4,7");
    expect(html).toContain("34 mnenj");
    expect(html).not.toContain("34 mnenji");
    // The exact figure is beside the glyphs precisely because they round up.
    expect(html).toContain("Ocena na Googlu: 4,7 od 5, 34 mnenj");
  });

  it("names its source with the mark, and still says it in words", async () => {
    const html = await text(get("/"));
    // ⚠️ THE LOGO REPLACES THE WORD, NOT THE SENTENCE. The visible run drops
    // "na Googlu" because Google's own mark is beside it — but the mark is
    // aria-hidden, so a reader who cannot see it would otherwise get
    // "4,7 od 5, 34 mnenj" from an unnamed source, which is not the claim
    // this line makes.
    expect(html).toContain("st-hero-g");
    expect(html).toContain("Ocena na Googlu:");
    // Google's published brand values, unaltered — a recoloured mark is a
    // worse problem than no mark.
    for (const hex of ["#EA4335", "#4285F4", "#FBBC05", "#34A853"]) {
      expect(html, hex).toContain(hex);
    }
  });

  it("prints no date beside the score", async () => {
    // Dropped on the owner's instruction. asOf stays in the config as the
    // record of when the figures were read; it reaches no page.
    expect(SHOPS["bazen"]!.googleRating!.asOf).toBeTruthy();
    expect(await text(get("/"))).not.toContain("stanje ");
  });

  it("is a plain statement while no profile URL is set, not a dead link", async () => {
    expect(SHOPS["bazen"]!.googleRating!.url).toBeUndefined();
    const html = await text(get("/"));
    expect(html).toContain("st-hero-rating-p");
    // ⚠️ A LINK THAT GOES NOWHERE IS WORSE THAN NO LINK: it promises to show
    // the source and lands on the page it is already on. The unlinked line
    // still names the source in words, and the day the URL arrives the whole
    // line becomes an anchor with no other change.
    expect(html).not.toContain('<a href="" target="_blank"');
  });

  // ⚠️ NEVER AS STRUCTURED DATA. A rating Google collected, marked up as this
  // site's own, is against Google's structured-data policy and a manual-action
  // risk on a network whose whole strategy is search. render/page.ts emits no
  // AggregateRating anywhere and this is the test that keeps it that way.
  it("never becomes AggregateRating markup, on any route", async () => {
    for (const path of ["/", "/bazen/veliki-230", "/trgovina", "/o-nas"]) {
      const html = await text(get(path));
      expect(html, path).not.toContain("aggregateRating");
      expect(html, path).not.toContain("AggregateRating");
    }
  });
});

/**
 * The installations band, in the state the shop is actually in.
 *
 * ⚠️ THE EMPTY CASE IS THE ONE THAT SHIPS. bazen has photographed no jobs, so
 * what has to be true today is that the block on /o-nas leaves no trace: no
 * heading, no grid, and — the part that failed first — no entry in the page
 * index pointing at an id that was never emitted.
 */
describe("the installations band", () => {
  it("leaves no heading and no index entry while the list is empty", async () => {
    expect(CONTENT["bazen"]!.installations ?? []).toHaveLength(0);
    const html = await text(get("/o-nas"));
    expect(html).not.toContain("st-page-inst");
    expect(html).not.toContain("Naše montaže");
    // The index is built from the blocks, so a block that draws nothing must
    // drop out of it too — structure.test.ts enumerates every fragment on
    // every page and this is the assertion that says why one is missing.
    expect(html).not.toContain("#s5-nase-montaze");
  });
});

describe("canonicalization", () => {
  it("trailing slash and uppercase redirect with 308", () => {
    expect(get("/bazen/veliki-230/").status).toBe(308);
    expect(get("/BAZEN/veliki-230").status).toBe(308);
  });
});
