import { describe, expect, it } from "vitest";
import { SHOPS, isValidRouteSlug, isValidStatementDescriptor } from "./index";
import { handleRequest } from "../worker";
import { CONTENT } from "../content";
import type { InternalRouteKey } from "./types";

/**
 * THE GATE A SECOND SHOP HAS TO PASS.
 *
 * ⚠️ THIS FILE EXISTS BECAUSE A SECOND SHOP WAS ADDED FOR REAL AND NOTHING
 * STOPPED IT BEING WRONG.
 *
 * The tenancy mechanism works — a registry, a Host header, a ShopConfig
 * carrying brand, keyword, slugs, theme and tokens — and it was proved once:
 * six shops shared this Worker until they were narrowed to one. What the probe
 * found is that almost every guard is a COMMENT. Two functions in types.ts
 * describe themselves as the "launch-readiness" checks and had zero callers.
 * The registry's own note calls cross-shop canonical leakage "the worst
 * available bug" and nothing asserted the domains were even distinct.
 *
 * Each `it` below corresponds to a failure the probe reproduced by rendering
 * a real second shop, and each one was a 200 with wrong content rather than an
 * error — which is why they are tests and not types. tsc cannot see any of it.
 *
 * The rule for adding to this file: if a mistake in ShopConfig or ShopContent
 * produces a page rather than a crash, it belongs here.
 */

const KEYS = Object.keys(SHOPS);

describe("every registered shop", () => {
  it("is registered in exactly one place at a time", () => {
    // ⚠️ tsc EXITS 0 WITH A SHOP IN SHOPS AND NO ENTRY IN CONTENT. The probe
    // checked: the two registries are separate Records with no type tying them
    // together, so the only thing standing between a half-registered shop and
    // production is a runtime `return new Response("...", { status: 500 })`.
    // Every route on that domain would be a 500 — discovered by a customer.
    expect(KEYS.sort()).toEqual(Object.keys(CONTENT).sort());
  });

  for (const key of KEYS) {
    const shop = SHOPS[key]!;

    it(key + ": every route slug is one the router can actually match", () => {
      // ⚠️ A NON-ASCII SLUG IS A PERMANENT 404, AND THE SITEMAP ADVERTISES IT.
      // The probe registered a shop with "/showroom": "/testna-vožnja".
      // URL.pathname percent-encodes it, worker.ts lowercases that to
      // "%c5%be", and the comparison against the raw string in routeSlugs can
      // never succeed — while sitemap.xml lists the pretty form for Google to
      // crawl. isValidRouteSlug has described itself as the "launch-readiness"
      // check since it was written and had no callers; this is the call.
      for (const [k, v] of Object.entries(shop.routeSlugs)) {
        expect(isValidRouteSlug(v), key + " " + k + " = " + JSON.stringify(v)).toBe(true);
      }
    });

    it(key + ": no two routes claim the same slug", () => {
      // ⚠️ A COLLISION SHADOWS A ROUTE AT 200, NOT AT 404. With "/showroom"
      // set to "/kontakt" beside "/contact", the probe got a 200 with the
      // contact page's h1 and form: the PAGES loop runs first and wins, and
      // /showroom simply ceases to exist. Nothing anywhere reported it.
      const vals = Object.values(shop.routeSlugs);
      expect(new Set(vals).size, key + " repeats a route slug: " + vals.join(" ")).toBe(
        vals.length,
      );
    });

    it(key + ": no route hides underneath the product segment", () => {
      // The product route is matched by PREFIX, so a sibling slug living under
      // it is unreachable by the same mechanism as a duplicate — silently, and
      // at 200, because the product branch answers first and then 404s on a
      // slug that is not a model.
      const base = shop.routeSlugs["/product"];
      const buried = Object.entries(shop.routeSlugs)
        .filter(([k, v]) => k !== "/product" && v.startsWith(base + "/"))
        .map(([k, v]) => k + " = " + v);
      expect(buried, key + " routes are buried under " + base).toEqual([]);
    });

    it(key + ": names itself the same way on a card statement", () => {
      // Stripe's own rules — 5-22 chars, printable ASCII, no < > \\ ' " * — and
      // the second function in types.ts that called itself a launch check and
      // was never called. A rejected descriptor is a failed charge.
      expect(
        isValidStatementDescriptor(shop.stripe.statementDescriptor),
        key + ": " + JSON.stringify(shop.stripe.statementDescriptor),
      ).toBe(true);
    });

    it(key + ": has a catalogue for the route its own nav points at", () => {
      // ⚠️ /trgovina IS A 200 THAT SAYS "Stran je v pripravi." FOR A SHOP WITH
      // NO COLLECTIONS — and it is the first item in the header nav on every
      // page. collections is optional on ShopContent, so tsc says nothing, and
      // the route is dropped from the sitemap while remaining the most-clicked
      // internal link on the site. A shop may legitimately have no catalogue
      // yet; it may not have one silently.
      const content = CONTENT[key]!;
      const collections = content.collections ?? [];
      const pdps = content.pdps ?? [];
      expect(
        collections.length > 0,
        key + " has no collections, so " + shop.routeSlugs["/products"] +
          " renders a coming-soon stub at 200 while the nav points at it",
      ).toBe(true);
      expect(pdps.length, key + " has collections but no product pages").toBeGreaterThan(0);
    });

    it(key + ": every product a collection lists has a page", () => {
      // A card without a resolvable slug is a link to a 404 on the one page
      // whose whole job is to send visitors to products.
      const content = CONTENT[key]!;
      const slugs = new Set((content.pdps ?? []).map((p) => p.slug));
      const dangling: string[] = [];
      for (const c of content.collections ?? []) {
        for (const p of c.products) {
          if ("slug" in p && typeof p.slug === "string" && !slugs.has(p.slug)) {
            dangling.push(c.path + " -> " + p.slug);
          }
        }
      }
      expect(dangling, key + " lists products with no page").toEqual([]);
    });
  }

  it("no two shops answer to the same host", () => {
    // ⚠️ THE REGISTRY CALLS CROSS-SHOP LEAKAGE "THE WORST AVAILABLE BUG" AND
    // NOTHING CHECKED FOR IT. byHost is built with plain Map.set in object-key
    // order: a typo repeating a sibling's domain, or one shop claiming
    // www.x.si while another claims x.si, silently overwrites an entry and one
    // shop starts serving the other's canonicals. index.ts now throws at module
    // load; this names the shop rather than the host when it does.
    const hosts: string[] = [];
    for (const key of KEYS) {
      const s = SHOPS[key]!;
      hosts.push(s.domain, "www." + s.domain);
    }
    expect(new Set(hosts).size, "duplicate host in: " + hosts.join(" ")).toBe(hosts.length);
  });

  it("no two shops share a Stripe statement descriptor", () => {
    // A EUR 8,000 charge whose statement names a sibling brand is a chargeback
    // — the reasoning is already written beside the field in types.ts, and
    // nothing enforced it.
    const d = KEYS.map((k) => SHOPS[k]!.stripe.statementDescriptor);
    expect(new Set(d).size, "duplicate descriptor in: " + d.join(" | ")).toBe(d.length);
  });

  it("every shop declares the whole internal route tree", () => {
    // The router indexes routeSlugs by InternalRouteKey without a fallback, so
    // a missing key is `undefined` compared against a path — every route below
    // it silently stops matching.
    const required = Object.keys(SHOPS[KEYS[0]!]!.routeSlugs) as InternalRouteKey[];
    for (const key of KEYS) {
      const have = Object.keys(SHOPS[key]!.routeSlugs);
      expect(required.filter((r) => !have.includes(r)), key + " is missing route keys").toEqual(
        [],
      );
    }
  });
});

/**
 * WHAT A SHOP PUBLISHES IS THE SHOP'S, AND IT USED NOT TO BE.
 *
 * ⚠️ THE DEFECT THESE EXIST FOR SHIPPED FOR MONTHS AND NOTHING COULD SEE IT.
 * worker.ts looped over a module-level PAGES array and render/sitemap.ts
 * listed the same one, so the page set was global: every domain this Worker
 * serves would have published the bazen shop's editorial pages at its own
 * URLs. A sauna shop's /vodniki would have indexed three guides about masažni
 * bazeni; its /primerjava would have compared two families it does not sell;
 * its FAQ would have opened by explaining the difference between a hot tub and
 * a jacuzzi. Every one of those a 200, in the sitemap, in the nav.
 *
 * tsc could not see it — the array was valid. The router could not — it
 * matched on route slugs the new shop had to declare anyway. No audit could —
 * they all run against `bazen`, where the pages happen to be right.
 *
 * ShopContent.pages and .guidePages are required fields now, so the compiler
 * asks the question. These check the half a type cannot: that what the shop
 * named is reachable, distinct, and actually renders.
 */
describe("every shop's own pages", () => {
  // ⚠️ THE QA HOST AND ?shop=, LIKE EVERY OTHER TEST IN THIS REPO. Driving a
  // shop's real domain returns 503 while `live` is false — which is the launch
  // gate working, not a routing failure, and asserting through it would make
  // these tests measure the flag instead of the pages.
  const get = (shopKey: string, path: string) =>
    handleRequest(
      new Request("https://trgovina.workers.dev" + path + "?shop=" + shopKey, {
        headers: { host: "trgovina.workers.dev" },
      }),
    );

  for (const key of KEYS) {
    const shop = SHOPS[key]!;
    const content = CONTENT[key]!;

    it(key + ": every page it publishes has a route on this shop", () => {
      // ⚠️ A PAGE WITH NO SLUG IS NOT AN ERROR, IT IS SILENCE. The router
      // compares the request path against shop.routeSlugs[page.key], and a key
      // the shop never declared is `undefined` — which no path ever equals. So
      // the page is simply never served, the nav item that points at it 404s,
      // and nothing anywhere says so.
      const orphans = content.pages
        .filter((p) => typeof shop.routeSlugs[p.key as InternalRouteKey] !== "string")
        .map((p) => p.key);
      expect(orphans, key + " publishes pages with no route: " + orphans.join(" ")).toEqual([]);
    });

    it(key + ": no two of its pages claim the same route", () => {
      // The loop takes the FIRST match and stops, so a duplicate key means one
      // page shadows the other at 200 — the same failure mode as a duplicate
      // route slug, one level up.
      const keys = content.pages.map((p) => p.key);
      expect(new Set(keys).size, key + " repeats a page key: " + keys.join(" ")).toBe(keys.length);
    });

    it(key + ": every page it publishes actually renders", () => {
      // The end-to-end half. Everything above is arithmetic on arrays; this
      // asks the router, on this shop's own host, and would have caught the
      // original defect from the other side — a page that renders somebody
      // else's h1 still renders, but a page the shop never wired does not.
      for (const page of content.pages) {
        const slug = shop.routeSlugs[page.key as InternalRouteKey]!;
        const res = get(key, slug);
        expect(res.status, key + " " + slug + " (" + page.key + ")").toBe(200);
      }
    });

    it(key + ": the chrome never points at a page this shop does not publish", async () => {
      // ⚠️ DROPPING A PAGE IS LEGITIMATE AND DANGLING A LINK IS NOT. A shop may
      // reasonably have no About page — but content.nav is a fixed seven-tuple
      // indexed BY POSITION onto routes, and the footer's columns are built the
      // same way, so removing a page leaves the header and the footer pointing
      // at a 404 on every page of the site. Nothing in ShopContent connects the
      // two, which is exactly why this is a test.
      //
      // The home page carries the whole chrome, so one render covers it.
      const html = await get(key, "/").text();
      // ⚠️ ANCHORS ONLY. A bare href match also catches every <link rel> in
      // the head — the favicons, the touch icon, the preloaded faces — which
      // are files served by env-backed handlers rather than routes, and which
      // this synchronous router does not answer. They are not navigation and
      // a reader cannot click them.
      const hrefs = [...html.matchAll(/<a\b[^>]*?href="(\/[^"#?]*)"/g)].map((m) => m[1]!);
      const skip = (h: string) =>
        h === "" ||
        h.startsWith("/media/") ||
        h.startsWith("/assets/") ||
        // The blog is served by the async layer because posts are rows; the
        // synchronous router this test drives hands back a 404 by design.
        h === shop.routeSlugs["/blog"] ||
        h.startsWith(shop.routeSlugs["/blog"] + "/");
      // ⚠️ 200 IS NOT ENOUGH, AND THAT IS THE WHOLE TRAP. worker.ts answers a
      // route the shop declared but has no page for with a styled "Stran je v
      // pripravi" placeholder at 200 and noindex — deliberately, so an unbuilt
      // route is a page rather than a break. It also means a shop that drops a
      // page from content.pages gets a nav item leading to a coming-soon card
      // instead of a 404, and the status code says nothing is wrong.
      //
      // Measured while writing this: removing the About page from the bazen
      // shop's list left "O NAS" in the header of every page on the site,
      // pointing at a placeholder, with all fifteen assertions still green.
      const dead: string[] = [];
      for (const h of [...new Set(hrefs)]) {
        if (skip(h)) continue;
        const res = get(key, h);
        if (res.status !== 200) { dead.push(h + " (" + res.status + ")"); continue; }
        if ((await res.text()).includes("wrap placeholder")) dead.push(h + " (placeholder)");
      }
      expect(dead, key + " chrome links to: " + dead.join(" ")).toEqual([]);
    });

    it(key + ": every buying guide it publishes resolves under its own segment", () => {
      const base = shop.routeSlugs["/guide"];
      const slugs = content.guidePages.map((g) => g.slug);
      expect(new Set(slugs).size, key + " repeats a guide slug: " + slugs.join(" ")).toBe(
        slugs.length,
      );
      for (const g of content.guidePages) {
        // The same ASCII rule every other route has to pass — a guide slug is
        // a URL segment like any other, and it is in the sitemap. Checked as
        // ONE segment: isValidRouteSlug matches a single "/x", which is what a
        // slug is; the "/vodnik" in front of it is the shop's own route and is
        // already covered by the whole-tree check above.
        expect(isValidRouteSlug("/" + g.slug), key + " guide slug " + g.slug).toBe(true);
        expect(get(key, base + "/" + g.slug).status, base + "/" + g.slug).toBe(200);
      }
    });
  }
});
