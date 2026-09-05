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
 * This does. It starts at the home page and follows every same-origin href it
 * finds.
 *
 * ⚠️ AND THE FIRST VERSION EXEMPTED EVERY REDIRECT, WHICH IS THE HOLE THIS
 * SITE IS SHAPED TO FALL INTO. It skipped anything that was not a 200 and
 * failed only on 400-and-up, so a 3xx counted as alive and its target was
 * never fetched. But worker.ts 308s on the SHAPE of a path — canonicalPathOf()
 * strips a trailing slash, collapses doubled slashes and lowercases — and it
 * does that BEFORE the router has any idea whether the destination exists. So
 * /vodnik/ni-tega-vodnika/ answers 308, and a link to a guide that does not
 * exist passed this gate as long as it carried a trailing slash, a capital
 * letter or a doubled slash. The docstring claimed it fails on "a status that
 * is not a redirect or a page" while never establishing that the redirect led
 * to a page.
 *
 * It now follows the Location header to the end and judges the TERMINAL
 * status, and it fails a chain that never terminates.
 *
 * It also reports an internal href that needs a hop at all. Nothing outside
 * this repository decides how our own links are spelled: a link that redirects
 * spends a crawl on an answer we could have given directly, and every one of
 * them is a typo we can fix at the source.
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

  /** One request, on the QA host, with the shop selected. */
  const get = (path: string): Response =>
    handleRequest(
      new Request("https://trgovina.workers.dev" + path + "?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );

  /**
   * Follow Location to the end and report where it landed.
   *
   * Five hops is far more than this site can legitimately need — the shape
   * redirect is one, the alias redirect is one, and worker.ts goes out of its
   * way (see canonicalPathOf) to make sure they never stack. Exhausting the
   * budget means a cycle, which is reported as its own failure rather than as
   * a dead link, because the fix is a different one.
   */
  const LOOP = 508;
  const MAX_HOPS = 5;
  const follow = async (
    from: string,
  ): Promise<{ status: number; at: string; hops: number; body: string }> => {
    let at = from;
    for (let hops = 0; hops <= MAX_HOPS; hops++) {
      const res = get(at);
      if (res.status < 300 || res.status >= 400) {
        return { status: res.status, at, hops, body: res.status === 200 ? await res.text() : "" };
      }
      const loc = res.headers.get("location");
      // A redirect with nowhere to go is dead, whatever its status says.
      if (loc === null) return { status: res.status, at, hops, body: "" };
      at = new URL(loc, "https://trgovina.workers.dev").pathname;
    }
    return { status: LOOP, at, hops: MAX_HOPS + 1, body: "" };
  };

  it("has no dead internal link on any page reachable from the home page", async () => {
    const status = new Map<string, number>();
    const source = new Map<string, string>();
    /** Paths that answered a redirect before landing: href -> where it ended. */
    const hopped = new Map<string, string>();
    const queue = ["/"];

    while (queue.length > 0) {
      const path = queue.shift()!;
      const landed = await follow(path);
      status.set(path, landed.status);
      if (landed.hops > 0 && landed.status !== LOOP) hopped.set(path, landed.at);
      if (landed.status !== 200) continue;

      const html = landed.body;
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

    const dead = [...status].filter(([, s]) => s >= 400 && s !== LOOP);
    expect(
      dead.map(([p, s]) => s + " " + p + " (linked from " + (source.get(p) ?? "?") + ")"),
      "dead internal links",
    ).toEqual([]);

    const looping = [...status].filter(([, s]) => s === LOOP).map(([p]) => p);
    expect(looping, "internal links whose redirects never terminate").toEqual([]);

    expect(
      [...hopped].map(([p, to]) => p + " -> " + to + " (linked from " + (source.get(p) ?? "?") + ")"),
      "internal links that redirect — link the canonical path directly",
    ).toEqual([]);

    // ⚠️ WITHOUT THIS THE TEST CANNOT FAIL. A crawl that finds one page and no
    // links passes trivially, which is exactly what a broken home page or a
    // changed markup shape would produce. The site had 29 reachable pages when
    // this was written; the floor is deliberately well below that, so ordinary
    // editing never trips it and a collapse does.
    expect(status.size, "pages reached from the home page").toBeGreaterThan(20);
  }, 30_000);
});
