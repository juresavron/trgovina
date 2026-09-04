import { describe, it, expect } from "vitest";
import { handleRequest } from "../worker";
import { SHOPS } from "../tenants";

/**
 * EVERY INTERNAL LINK LANDS ON A PAGE.
 *
 * ⚠️ TWO SHIPPED DEAD, AND EVERY EXISTING TEST PASSED. The size guide's
 * "Naprej" block pointed at /guide/koliko-stane-masazni-bazen and
 * /guide/masazni-bazen-na-terasi — the internal route KEY with a slug hung off
 * it, which is not a thing resolveHref() resolves. It resolves an href that IS
 * a key and hands back everything else as written, so both rendered verbatim
 * and both 404'd, on the page whose whole job is to send a reader to the next
 * guide.
 *
 * Nothing caught it because every link check on the site is local: the hub
 * checks it links to each guide, the rail checks its fragments land, the
 * universal pages check they do not hardcode this shop's slugs. Nobody walked
 * the site.
 *
 * This does. It starts at the home page, follows every same-origin href it
 * finds, and fails on the first status that is not a redirect or a page. It is
 * the cheapest test on the site that could have caught this, and it costs
 * about two seconds.
 */
describe("the site links to itself", () => {
  const shop = SHOPS.bazen!;

  /**
   * Paths another layer serves, which this one answers with 404 by design.
   *
   * The blog index and its posts need the database, so they live in
   * blog/routes.ts behind the async entry point; handleRequest cannot serve
   * them and never could. Media is the image proxy and the admin is not part
   * of the public site. Everything else on the site is here.
   */
  const elsewhere = [shop.routeSlugs["/blog"], "/media", "/admin"].filter(
    (p): p is string => typeof p === "string" && p !== "",
  );
  const served = (path: string): boolean =>
    !elsewhere.some((p) => path === p || path.startsWith(p + "/"));

  it("has no dead internal link on any page reachable from the home page", async () => {
    const status = new Map<string, number>();
    const source = new Map<string, string>();
    const queue = ["/"];

    while (queue.length > 0) {
      const path = queue.shift()!;
      const res = await handleRequest(
        new Request("https://trgovina.workers.dev" + path + "?shop=bazen", {
          headers: { host: "trgovina.workers.dev" },
        }),
      );
      status.set(path, res.status);
      if (res.status !== 200) continue;

      const html = await res.text();
      const body = html.slice(html.indexOf("<body"));
      for (const m of body.matchAll(/href="([^"]+)"/g)) {
        const href = m[1]!;
        // Same-origin paths only: mailto:, tel:, https:// and bare fragments
        // are somebody else's to check.
        if (!href.startsWith("/")) continue;
        // The query is dropped because routing here is by path alone, and
        // keeping it would crawl one product once per cabinet colour.
        const to = href.split("#")[0]!.split("?")[0]!;
        if (to === "" || !served(to)) continue;
        if (!status.has(to) && !queue.includes(to)) {
          queue.push(to);
          source.set(to, path);
        }
      }
    }

    const dead = [...status].filter(([, s]) => s >= 400);
    expect(
      dead.map(([p, s]) => s + " " + p + " (linked from " + (source.get(p) ?? "?") + ")"),
      "dead internal links",
    ).toEqual([]);

    // ⚠️ WITHOUT THIS THE TEST CANNOT FAIL. A crawl that finds one page and no
    // links passes trivially, which is exactly what a broken home page or a
    // changed markup shape would produce. The site had 29 reachable pages when
    // this was written; the floor is deliberately well below that, so ordinary
    // editing never trips it and a collapse does.
    expect(status.size, "pages reached from the home page").toBeGreaterThan(20);
  }, 30_000);
});
