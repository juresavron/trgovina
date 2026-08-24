import { describe, it, expect } from "vitest";
import { SHOPS } from ".";
import { handleRequest } from "../worker";
import { isPlaceholderMedia } from "../themes/studio/media";

/**
 * The imagery currently on these pages is the source theme's own asset bundle
 * — a furniture store. The shops sell saunas, cold plunge tubs, hot tubs,
 * massage chairs, stone-resin baths and billiard tables.
 *
 * That is fine right now: every shop is pre-live and noindexed, and the
 * pictures are scaffolding that makes the layout legible. It stops being fine
 * the moment a shop takes money, because a photograph on a product page is a
 * representation of what is being sold — at €1,500–15,000, with EU distance
 * selling rules attached.
 *
 * So this is a gate, not a preference: flipping `live: true` while a stranger's
 * furniture is still on the page fails the build. Someone will eventually flip
 * that flag in a hurry, and this is what catches it.
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

  it("pre-live pages really are carrying the placeholders", async () => {
    // Proves the gate is guarding something that exists, not a hypothetical.
    const html = await handleRequest(
      new Request("https://trgovina.worldfans.workers.dev/?shop=savna", {
        headers: { host: "trgovina.worldfans.workers.dev" },
      }),
    ).text();
    const srcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1] ?? "");
    expect(srcs.filter(isPlaceholderMedia).length).toBeGreaterThan(0);
  });
});
