import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEV_SHOP, SHOPS, isValidRouteSlug, isValidStatementDescriptor, resolveShop } from "./index";
import { handleRequest } from "../worker";
import { CONTENT } from "../content";
import { UNIVERSAL_PAGES } from "../content/pages";
import { OPTIONAL_ROUTE_KEYS, type InternalRouteKey, type ShopConfig } from "./types";
import type { ShopContent } from "../content/types";
import { sitemapPaths } from "../render/sitemap";

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
      // ⚠️ COLLECTIONS ARE NOT THE CATALOGUE. This gate demanded
      // collections.length > 0, because the hub used to render a placeholder
      // without them — and that made the shape content/types.ts explicitly
      // allows (a single `pdp`, no `pdps`, nothing to group) unable to pass
      // the suite. The hub lists a groupless catalogue flat now (commerce.ts
      // flatHub), so what a shop must have is a model and a card to show it
      // by, not a family to file it under. And the flagship counts: `pdps`
      // may be omitted for a one-model shop, so it is read the way the router
      // reads it.
      const content = CONTENT[key]!;
      const pdps = content.pdps ?? [content.pdp];
      expect(pdps.length, key + " serves no product page").toBeGreaterThan(0);
      const cards = content.products.filter((p) => !("util" in p));
      expect(
        cards.length,
        key + " has product pages but no card to show them by — the home grid and " +
          "a groupless hub both draw content.products",
      ).toBeGreaterThan(0);
    });

    it(key + ": every product a collection lists has a page", () => {
      // A card without a resolvable slug is a link to a 404 on the one page
      // whose whole job is to send visitors to products.
      const content = CONTENT[key]!;
      // ?? [pdp]: the one-model shape carries its page as `pdp` alone, and
      // the router serves it — this gate failed that shop for a page it has.
      const slugs = new Set((content.pdps ?? [content.pdp]).map((p) => p.slug));
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

  it("every shop declares every REQUIRED route", () => {
    // ⚠️ REQUIRED, NOT "WHOLE". This used to take the first shop's key set as
    // the definition of the tree, which made every key mandatory for every
    // shop — including the five in OPTIONAL_ROUTE_KEYS that a one-model shop
    // has no page for. The required set is the type's now, and the type also
    // refuses a missing one at compile time; this names the shop when the
    // registry is edited without tsc.
    const optional = new Set<string>(OPTIONAL_ROUTE_KEYS);
    const required = (Object.keys(SHOPS[KEYS[0]!]!.routeSlugs) as InternalRouteKey[]).filter(
      (k) => !optional.has(k),
    );
    for (const key of KEYS) {
      const have = Object.keys(SHOPS[key]!.routeSlugs);
      expect(required.filter((r) => !have.includes(r)), key + " is missing route keys").toEqual(
        [],
      );
    }
  });

  for (const key of KEYS) {
    it(key + ": an optional route it declares has a page behind it", () => {
      // ⚠️ THE OTHER HALF OF OPTIONAL. Leaving a key out is how a shop says
      // "I do not have this"; declaring it and publishing nothing is the
      // placeholder-in-the-header defect with a step added. /compare,
      // /guides and /showroom are pages in content.pages; /guide is a
      // segment that needs guidePages; /finder is covered by its own gate
      // below. And the segment and the index travel together.
      const shop = SHOPS[key]!;
      const content = CONTENT[key]!;
      const pageKeys = new Set(content.pages.map((p) => p.key));
      for (const k of ["/compare", "/guides", "/showroom"] as const) {
        if (typeof shop.routeSlugs[k] === "string") {
          expect(pageKeys.has(k), key + " declares " + k + " and publishes no page for it").toBe(
            true,
          );
        }
      }
      const seg = typeof shop.routeSlugs["/guide"] === "string";
      const idx = typeof shop.routeSlugs["/guides"] === "string";
      expect(seg, key + ": /guide and /guides must be declared together").toBe(idx);
      if (seg) {
        expect(content.guidePages.length, key + " declares /guide and has no guides").toBeGreaterThan(0);
      } else {
        expect(content.guidePages.length, key + " has guides but no /guide segment").toBe(0);
      }
    });
  }
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
      // Guarded above: a shop with guides declares the segment.
      if (!base) return;
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

/**
 * THE SIX PAGES THAT TRAVEL, CHECKED FOR THINGS THAT DO NOT.
 *
 * content/pages.ts separates the pages any shop can publish unchanged — the
 * basket, the checkout and the four legal notices, all parameterised from
 * ShopConfig — from the seven that are hot-tub copy. The split is only worth
 * anything if the universal six really are portable, and when it was drawn
 * they were not: all six cross-referenced each other by this shop's Slovenian
 * slug.
 *
 *   /kosarica          -> "/pogoji-poslovanja", "/trgovina"
 *   /pogoji-poslovanja -> "/odstop-od-pogodbe"
 *   /zasebnost         -> "/piskotki"
 *   /piskotki          -> "/zasebnost"
 *   /odstop-od-pogodbe -> "/pogoji-poslovanja"
 *
 * Five dead links on any shop that spells those differently, in the pages
 * where a dead cross-reference costs most: the withdrawal notice pointing at
 * the terms and the privacy notice pointing at the cookie notice are
 * references the law expects to resolve.
 *
 * They are internal route keys now, resolved per shop by resolveHref(). This
 * is what stops the next one being written as a slug — the mistake is
 * invisible on the shop the tests run against, because there the key and the
 * slug resolve to the same page.
 */
describe("the pages every shop can publish", () => {
  /** Slugs this shop uses, as a set — what a portable page must NOT contain. */
  const slugs = new Set(Object.values(SHOPS[KEYS[0]!]!.routeSlugs));
  const keys = new Set(Object.keys(SHOPS[KEYS[0]!]!.routeSlugs));

  for (const page of UNIVERSAL_PAGES) {
    it(page.key + ": links by route key rather than by this shop's URL", () => {
      const hrefs: string[] = [];
      for (const b of page.blocks) {
        if (b.kind === "cta") hrefs.push(b.href);
        if (b.kind === "links") for (const [, href] of b.items) hrefs.push(href);
      }
      const local = hrefs.filter((h) => !keys.has(h) && slugs.has(h));
      expect(
        local,
        page.key + " hardcodes this shop's URLs: " + local.join(" ") +
          " — use the internal route key (see resolveHref)",
      ).toEqual([]);
    });
  }

  it("does not let a shop ship without the four legal pages", () => {
    // ⚠️ THE WITHDRAWAL NOTICE IS NO LONGER IN THE UNIVERSAL LIST, so nothing
    // else puts it on a shop. It is not optional: a distance seller in the EU
    // must give the withdrawal information (Directive 2011/83 Art. 6(1)(h)),
    // the privacy notice is GDPR Art. 13, and the terms and the cookie notice
    // are the other two the site publishes.
    //
    // Checked on the SHOP'S OWN LIST rather than on any registry, because that
    // is the thing the router serves — a shop is free to assemble it from
    // UNIVERSAL_PAGES, from its own modules, or from both, and this holds
    // either way.
    const required: InternalRouteKey[] = ["/terms", "/privacy", "/cookies", "/withdrawal"];
    for (const key of KEYS) {
      const have = new Set(CONTENT[key]!.pages.map((p) => p.key));
      const missing = required.filter((r) => !have.has(r));
      expect(missing, key + " publishes no " + missing.join(" ")).toEqual([]);
    }
  });

  it("carries no page that is about what this shop sells", () => {
    // ⚠️ THE OTHER HALF OF PORTABLE. A page can link correctly and still be
    // unusable: the keyword is what makes /vodniki the bazen shop's page, not
    // its hrefs. This is a coarse check on purpose — it looks for the shop's
    // own head term in the text a universal page renders, which is exactly the
    // signal that a hot-tub page has been filed under the wrong list.
    const shop = SHOPS[KEYS[0]!]!;
    const needle = shop.keyword.primary.toLowerCase();
    const offenders: string[] = [];
    for (const page of UNIVERSAL_PAGES) {
      // ⚠️ THE HEAD TOO. This scanned the body and let "Spletno naročanje
      // masažnih bazenov še ni odprto" ship as the meta and og:description of
      // every shop's basket page.
      const text = [
        page.h1,
        page.seoTitle ?? "",
        page.metaDescription ?? "",
        page.lead ?? "",
        ...page.blocks.flatMap((b) => {
          if (b.kind === "prose") return b.p;
          if (b.kind === "qa" || b.kind === "steps") return b.items.flat();
          if (b.kind === "cta") return [b.h, b.p];
          return [];
        }),
      ].join(" ").toLowerCase();
      if (text.includes(needle)) offenders.push(page.key);
    }
    expect(
      offenders,
      "universal pages naming \"" + needle + "\": " + offenders.join(" "),
    ).toEqual([]);
  });
});

/**
 * THE GUIDED CHOICE RECOMMENDS MODELS, AND THEY HAD BETTER BE THIS SHOP'S.
 *
 * ⚠️ content/finder.ts IS STILL A MODULE-LEVEL TREE, which is the same shape
 * of defect ShopContent.pages was created to fix and has not been fixed the
 * same way: the questions ("Kaj naj bazen zna?"), the branches and the
 * recommended slugs are all constants, so a second shop that declares a
 * /finder route gets this shop's questionnaire and this shop's models at the
 * end of it. Moving it is a larger job than moving a page list — the tree is
 * entangled with a recommendation FUNCTION, not just data — and it is not
 * done here.
 *
 * What is done is turning the silent version into a loud one. A shop that
 * declares the route and inherits this tree now fails, because the slugs it
 * recommends are not in that shop's catalogue. A shop that wants no finder
 * omits the route and never reaches this.
 *
 * It earns its place on the bazen shop too, and that is not incidental: the
 * recommendations are typed slugs, so renaming or retiring a model leaves the
 * quiz pointing at a 404 from its own terminal page — the one screen whose
 * entire job is to hand the visitor a product.
 */
describe("the guided choice", () => {
  for (const key of KEYS) {
    const shop = SHOPS[key]!;
    const content = CONTENT[key]!;
    if (typeof shop.routeSlugs["/finder"] !== "string") continue;

    it(key + ": only ever recommends models this shop sells", async () => {
      const { nextStep, recommend, walk } = await import("../content/finder");
      const slugs = new Set((content.pdps ?? [content.pdp]).map((p) => p.slug));

      // Every terminal path through the tree, enumerated by replaying it —
      // the same technique previousAnswers() uses, so a branch added to
      // nextStep() is covered here without anyone remembering to add it.
      const terminals: Record<string, string>[] = [];
      const visit = (answers: Record<string, string>) => {
        const step = nextStep(answers as never);
        if (!step) { terminals.push(answers); return; }
        for (const c of step.choices) visit({ ...answers, [step.param]: c.value });
      };
      visit({});
      expect(terminals.length, key + " finder tree has no terminal path").toBeGreaterThan(0);

      const dangling: string[] = [];
      for (const t of terminals) {
        const res = recommend(t as never);
        expect(res.slugs.length, key + " recommends nothing for " + JSON.stringify(t))
          .toBeGreaterThan(0);
        for (const s of res.slugs) if (!slugs.has(s)) dangling.push(JSON.stringify(t) + " -> " + s);
        // The walk must accept the whole path, or the terminal is unreachable
        // from a URL and the enumeration above is measuring a tree the router
        // cannot serve.
        expect(walk(t as never).order.length, "unreachable terminal " + JSON.stringify(t))
          .toBe(Object.keys(t).length);
      }
      expect(dangling, key + " finder recommends models it does not sell: " + dangling.join(", "))
        .toEqual([]);
    });
  }
});

/**
 * THE QA HOST HONOURS ?shop=, AND FOR A WHILE IT DID NOT.
 *
 * Every per-shop gate in this file drives the QA host with ?shop=<key>, and
 * so does every audit script. The override that made that mean something went
 * with the theme switcher; the worker's note recorded that unknown query
 * parameters are ignored, which was true, and with one registered shop the
 * page rendered was the same page either way. The day a second shop was
 * registered — a throwaway one, in a worktree, built to probe exactly this —
 * "every page it publishes actually renders" and "the chrome never points at
 * a placeholder" both PASSED for it while rendering the bazen shop's pages
 * under its slugs. A gate that cannot address the shop it names is worse
 * than no gate: it reports the wrong shop as sound.
 *
 * This is the assertion that keeps every other one in this file honest.
 */
describe("the QA host", () => {
  const qa = (path: string, key: string) =>
    handleRequest(
      new Request("https://trgovina.workers.dev" + path + "?shop=" + key, {
        headers: { host: "trgovina.workers.dev" },
      }),
    );

  for (const key of KEYS) {
    it("renders " + key + " when asked to", async () => {
      // data-shop on <html> is the render pipeline's own statement of which
      // shop it drew — the same attribute the admin and the audits read.
      const html = await qa("/", key).text();
      expect(html).toContain('data-shop="' + key + '"');
    });
  }

  it("resolves a shop that is NOT the development shop when asked for it", () => {
    // ⚠️ WITH ONE REGISTERED SHOP THE RENDER TESTS ABOVE CANNOT FAIL. Asking
    // for the development shop and being ignored produce the same page, so
    // the assertion that keeps every other gate honest would itself have been
    // decoration — measured: removing the override left all of them green.
    //
    // So a second shop is registered for the length of this test. SHOPS is
    // the object the resolver reads at call time (the Host map is built at
    // import and the override path does not consult it), which is exactly
    // what lets this be a unit test rather than a fixture: the entry exists
    // only between the two lines below, and a throw in between still removes
    // it.
    const key = "__probe_shop__";
    (SHOPS as Record<string, ShopConfig>)[key] = { ...DEV_SHOP, key };
    try {
      const url = new URL("https://trgovina.workers.dev/?shop=" + key);
      expect(resolveShop("trgovina.workers.dev", url)?.key).toBe(key);
      expect(resolveShop("localhost:8787", url)?.key).toBe(key);
      // And the production fence holds for the probe too.
      expect(resolveShop(DEV_SHOP.domain, url)?.key).toBe(DEV_SHOP.key);
    } finally {
      delete (SHOPS as Record<string, ShopConfig>)[key];
    }
  });

  it("falls back to the development shop for a key it does not know", async () => {
    // Validated against the registry, never reflected: ?shop=<garbage> is
    // exactly ?shop=<nothing>, and the value must not appear in the page.
    const res = qa("/", "no-such-shop-x9");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('data-shop="' + DEV_SHOP.key + '"');
    expect(html).not.toContain("no-such-shop-x9");
  });

  it("is the ONLY place the override applies", () => {
    // On a real domain ?shop= must do nothing — it would let anyone render
    // shop B under shop A's canonicals. Pre-live that domain answers 503;
    // live it answers its own pages; in neither case does the query pick the
    // shop. resolveShop() is the single decision point, so it is asserted
    // directly rather than through a render that live/pre-live would blur.
    for (const key of KEYS) {
      const shop = SHOPS[key]!;
      for (const other of KEYS) {
        const url = new URL("https://" + shop.domain + "/?shop=" + other);
        expect(resolveShop(shop.domain, url)?.key, shop.domain + "?shop=" + other).toBe(key);
      }
      // And an unknown production host stays unknown whatever the query says.
      const url = new URL("https://not-a-shop.example/?shop=" + key);
      expect(resolveShop("not-a-shop.example", url)).toBeNull();
    }
  });
});

/**
 * A CATALOGUE WITH NOTHING TO GROUP IT BY STILL HAS A HUB.
 *
 * content/types.ts allows a shop to omit `collections` (and `pdps`, for a
 * one-model shop). The hub used to render nothing for that shape and the
 * worker served a "Stran je v pripravi" placeholder at the URL the header's
 * first item points to. commerce.ts flatHub() lists such a catalogue from the
 * same cards the home grid draws. Rendered directly, with the registered
 * shop's own content minus its families, because the router resolves content
 * by shop key and a fixture shop cannot be injected there.
 */
describe("the hub for a shop with no collections", () => {
  it("lists the models flat instead of rendering nothing", async () => {
    const { renderShopHub } = await import("../render/page");
    const shop = SHOPS[KEYS[0]!]!;
    // Omitted, not set to undefined: exactOptionalPropertyTypes is on, and
    // that is the shape a real groupless shop has anyway.
    const { collections: _families, ...content } = CONTENT[KEYS[0]!]!;
    void _families;
    const html = renderShopHub(shop, content, "", shop.design.theme);
    expect(html).not.toContain("wrap placeholder");
    expect(html).toContain('class="st-grid"');
    // The head is the shop's own word for the page, not a literal.
    expect(html).toContain("<h1 class=\"st-sec-h\">" + content.nav[0] + "</h1>");
    // Every product card the home page shows is here too.
    for (const p of content.products) {
      if ("util" in p) continue;
      expect(html, "hub is missing " + p.name).toContain(p.name);
    }
  });
});

/**
 * A SHOP THAT SELLS ONE MODEL.
 *
 * Every gate above runs against the registered shop, which sells six models
 * in two families, so a template that assumes a catalogue passes all of them.
 * The first one-model probe found what that assumption costs: "Vsi modeli"
 * over a single card, "šest modelov" in the finder of a shop with one, a
 * rail repeating the only product under the grid that already showed it, a
 * hub whose two-column chooser had one entry, a lone card stretched to the
 * width of three. None of it was a crash. All of it was a page.
 *
 * So a one-model shop is registered for the length of this block — the
 * registered shop's own copy, its catalogue cut to the first model, no
 * families, no optional routes — and every route it declares is rendered
 * through the worker, the way a visitor would reach it. The fixture is
 * derived rather than written so that it tracks the content types: a field
 * added to ShopContent tomorrow is on this shop too.
 */
describe("a shop that sells one model", () => {
  const PROBE = "__one_model__";
  const base = CONTENT[KEYS[0]!]!;
  const baseShop = SHOPS[KEYS[0]!]!;
  const card = base.products.find((p) => !("util" in p));
  if (!card || !("slug" in card)) throw new Error("the registered shop has no model card");
  const pdp = (base.pdps ?? [base.pdp]).find((d) => d.slug === card.slug);
  if (!pdp) throw new Error("no product page for " + card.slug);

  // Required routes only. The optional five are exactly the ones a one-model
  // shop has no use for — there is nothing to compare, nothing to guide a
  // choice between — and every place that links to them has to cope.
  const routeSlugs = Object.fromEntries(
    Object.entries(baseShop.routeSlugs).filter(
      ([k]) => !(OPTIONAL_ROUTE_KEYS as readonly string[]).includes(k),
    ),
  ) as ShopConfig["routeSlugs"];
  const {
    collections: _c, pdps: _p, categories: _k, hubChoice: _hc, hubOutro: _ho, ...rest
  } = base;
  void _c; void _p; void _k; void _hc; void _ho;
  // The utility cards are the shop's own copy and point where the shop
  // chooses; the registered shop's "book a visit" card points at its showroom
  // page, which this shop does not have. A shop without the page would not
  // write the card, so the fixture keeps only the cards whose href it serves.
  const serves = new Set(Object.values(routeSlugs));
  const content: ShopContent = {
    ...rest,
    products: base.products.filter((p) =>
      "util" in p ? !p.href || p.href.startsWith("#") || serves.has(p.href) : p === card,
    ),
    pdp,
    guides: [],
    guidePages: [],
    pages: base.pages.filter((pg) => typeof routeSlugs[pg.key as InternalRouteKey] === "string"),
  };
  const shop: ShopConfig = { ...baseShop, key: PROBE, routeSlugs };

  beforeAll(() => {
    (SHOPS as Record<string, ShopConfig>)[PROBE] = shop;
    CONTENT[PROBE] = content;
  });
  afterAll(() => {
    delete (SHOPS as Record<string, ShopConfig>)[PROBE];
    delete CONTENT[PROBE];
  });

  const get = (path: string) =>
    handleRequest(
      new Request("https://trgovina.workers.dev" + path + "?shop=" + PROBE, {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
  const NOT_PAGES = new Set(["/product", "/guide", "/order-success", "/blog"]);
  const routes = () => {
    const r = new Set(["/"]);
    for (const [k, slug] of Object.entries(routeSlugs)) if (!NOT_PAGES.has(k)) r.add(slug);
    r.add(routeSlugs["/product"] + "/" + pdp.slug);
    return [...r];
  };

  it("renders every route it declares as its own page", async () => {
    for (const path of routes()) {
      const res = get(path);
      expect(res.status, path).toBe(200);
      const html = await res.text();
      expect(html, path).toContain('data-shop="' + PROBE + '"');
      expect(html, path + " is a placeholder").not.toContain("wrap placeholder");
    }
  });

  it("never promises more models than it has", async () => {
    // The literal every catalogue label used to be. On a shop with one model
    // it is a false statement on the page and a dead promise in the link.
    for (const path of routes()) {
      const html = await get(path).text();
      expect(html, path).not.toContain("Vsi modeli");
    }
  });

  it("lists its one model on the hub, under its own heading", async () => {
    const html = await get(routeSlugs["/products"]).text();
    expect(html).toContain('<h1 class="st-sec-h">' + content.nav[0] + "</h1>");
    expect(html).toContain(card.name);
    expect(html).toContain('href="' + routeSlugs["/product"] + "/" + pdp.slug + '"');
  });

  it("does not repeat the only model under the grid that shows it", async () => {
    // The home page drew the product grid AND a rail of the same cards. With
    // six models the rail is a second angle; with one it is the same card
    // twice, one above the other.
    const html = await get("/").text();
    const n = html.split('href="' + routeSlugs["/product"] + "/" + pdp.slug + '"').length - 1;
    expect(n, "links to the one model on the home page").toBeLessThanOrEqual(2);
  });

  it("links, from every route it renders, only to pages it has", async () => {
    // EVERY ROUTE, not the home page alone. The chrome is the same on all of
    // them, but the hub's cards, the product page's crumbs and the closing
    // band's control are not, and each of those was a link site that had to
    // learn what a one-model shop lacks.
    const hrefs: string[] = [];
    for (const path of routes()) {
      const html = await get(path).text();
      hrefs.push(...[...html.matchAll(/<a\b[^>]*?href="(\/[^"#?]*)"/g)].map((m) => m[1]!));
    }
    const skip = (h: string) =>
      h === "" ||
      h.startsWith("/media/") ||
      h.startsWith("/assets/") ||
      h === routeSlugs["/blog"] ||
      h.startsWith(routeSlugs["/blog"] + "/");
    const dead: string[] = [];
    for (const h of [...new Set(hrefs)]) {
      if (skip(h)) continue;
      const res = get(h);
      if (res.status !== 200) { dead.push(h + " (" + res.status + ")"); continue; }
      if ((await res.text()).includes("wrap placeholder")) dead.push(h + " (placeholder)");
    }
    expect(dead, "one-model shop links to: " + dead.join(" ")).toEqual([]);
  });

  it("puts its one model in the sitemap once and none of the routes it lacks", () => {
    // The route answers 404 on the QA host by design (a sitemap is only ever
    // served live, on the shop's own domain), so the path list is asked
    // directly — it is the one source the route and the blog layer share.
    const paths = sitemapPaths(shop, content, false);
    const url = routeSlugs["/product"] + "/" + pdp.slug;
    expect(paths.filter((p) => p === url).length, url).toBe(1);
    for (const k of OPTIONAL_ROUTE_KEYS) {
      const slug = baseShop.routeSlugs[k];
      if (slug) expect(paths, k).not.toContain(slug);
    }
  });
});
