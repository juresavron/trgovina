import { describe, it, expect } from "vitest";
import { SHOPS } from ".";
import { handleRequest } from "../worker";
import { isPlaceholderMedia } from "../themes/studio/media";

/**
 * THE GATE IS NOW EMPTY, AND THAT IS THE POINT.
 *
 * These pages used to carry the source theme's own asset bundle — a furniture
 * store's rooms, scenes and portraits — as scaffolding while every shop was
 * pre-live and noindexed. It was fine then and it would have stopped being
 * fine the moment a shop took money, because a photograph on a product page
 * is a representation of what is being sold, at €1,500–15,000 with EU
 * distance selling rules attached. So this gate failed the build if anyone
 * flipped `live: true` while a stranger's furniture was still on the page.
 *
 * The imagery is gone now — deleted, not disabled — so the gate guards
 * nothing today. It is kept armed anyway, for two reasons. The rule it
 * encodes did not change: the next borrowed picture someone reaches for gets
 * caught by the same check. And a gate deleted the moment it goes quiet is a
 * gate that has to be rediscovered the hard way.
 *
 * What replaced the assertion below matters: it used to prove the gate was
 * guarding something real by finding placeholders on a live page. That test
 * cannot pass now, so it is inverted — the page must carry NONE. Deleting it
 * would have been the easy move and would have removed the only thing saying
 * out loud that the site no longer ships borrowed imagery.
 */
describe("no live shop ships placeholder imagery", () => {
  const paths = ["/"];

  for (const key of Object.keys(SHOPS)) {
    const shop = SHOPS[key]!;
    it(key + (shop.live ? " (LIVE)" : " (pre-live)") + " honours the media gate", async () => {
      if (!shop.live) {
        // Nothing to assert: placeholders are expected and correct here.
        expect(shop.live).toBe(false);
        return;
      }
      for (const path of paths) {
        const html = await handleRequest(
          new Request(shop.siteUrl + path, { headers: { host: shop.domain } }),
        ).text();
        const srcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1] ?? "");
        const placeholders = srcs.filter(isPlaceholderMedia);
        expect(
          placeholders,
          key + " is live and still shows theme placeholder imagery: " + placeholders.join(", "),
        ).toEqual([]);
      }
    });
  }

  it("the gate can actually see placeholder imagery", () => {
    // A gate that never fires is indistinguishable from a gate that is broken.
    expect(isPlaceholderMedia("/img/room-01.webp")).toBe(true);
    expect(isPlaceholderMedia("/media/own-photo.webp")).toBe(false);
  });

  it("no page carries borrowed imagery any more, live or not", async () => {
    // The inverse of what this once asserted. Every picture the site paints
    // is now either the shop's own, under /img/own/, or served from Supabase
    // through /media/ — and both are things the shop has the right to
    // publish. If a borrowed file reappears, this fails before anyone has to
    // flip live:true to find out.
    const html = await handleRequest(
      new Request("https://trgovina.worldfans.workers.dev/", {
        headers: { host: "trgovina.worldfans.workers.dev" },
      }),
    ).text();
    const srcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1] ?? "");
    const borrowed = srcs.filter(isPlaceholderMedia);
    expect(borrowed, "borrowed imagery is back: " + borrowed.join(", ")).toEqual([]);
    // And the page is not simply empty of pictures — the shop's own are there.
    expect(srcs.some((x) => x.startsWith("/img/own/") || x.startsWith("/media/"))).toBe(true);
  });
});
