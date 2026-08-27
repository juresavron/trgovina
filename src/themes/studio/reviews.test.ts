import { describe, expect, it } from "vitest";
import { SHOPS } from "../../tenants";
import { CONTENT } from "../../content";
import { renderHome } from "../../render/page";
import type { ShopContent } from "../../content/types";

/**
 * What the testimonial band is allowed to claim.
 *
 * ⚠️ THESE ARE NOT STYLE ASSERTIONS. Annex I of the Unfair Commercial
 * Practices Directive, as amended by the Omnibus Directive and transposed in
 * ZVPot-1, blacklists two things outright — no balancing test, no defence:
 *
 *   23b. stating that reviews are submitted by consumers who actually used or
 *        bought the product, without taking reasonable steps to check;
 *   23c. submitting, or having someone submit, false consumer reviews.
 *
 * "Preverjen nakup" and "Preverjena mnenja strank" are both 23b claims. The
 * renderer got this wrong once already — the chip printed for anything that
 * was not flagged as invented, which made "nobody made this up" mean the same
 * thing as "somebody checked it against an order". These hold the two apart.
 */
const shop = SHOPS["bazen"]!;
const base = CONTENT["bazen"]!;

const withReviews = (reviews: ShopContent["reviews"]): string =>
  renderHome(shop, { ...base, reviews }, "studio", "").replace(
    /<style>[\s\S]*?<\/style>/g,
    "",
  );

const R = (over: Partial<ShopContent["reviews"][number]> = {}) => ({
  q: "Bazen so pripeljali in zagnali v enem dopoldnevu.",
  who: "Družina Novak, Domžale",
  model: "BAZEN 230",
  ...over,
});

describe("the testimonial band's claims", () => {
  it("does not claim a verified purchase for an unverified review", () => {
    const html = withReviews([R()]);
    expect(html).toContain("BAZEN 230");
    expect(html).not.toContain("Preverjen nakup");
    expect(html).not.toContain("Preverjena mnenja strank");
    expect(html).toContain("Mnenja strank");
  });

  it("claims it only when the operator ticked verified", () => {
    const html = withReviews([R({ verified: true })]);
    expect(html).toContain("Preverjen nakup · BAZEN 230");
    expect(html).toContain("Preverjena mnenja strank");
  });

  it("never claims it for a placeholder, even one marked verified", () => {
    // A flag collision that should be impossible is exactly the one worth a
    // test: invented content can never be a checked purchase.
    const html = withReviews([R({ verified: true, placeholder: true })]);
    expect(html).not.toContain("Preverjen nakup");
    expect(html).not.toContain("Preverjena mnenja strank");
  });

  it("HEADS THE BAND AS VERIFIED ONLY WHEN EVERY QUOTE UNDER IT IS", () => {
    // The heading speaks for all of them, so one unchecked review under
    // "Preverjena mnenja strank" makes the claim false for that one.
    const html = withReviews([R({ verified: true }), R({ who: "Sandra P., Koper" })]);
    expect(html).toContain("Mnenja strank");
    expect(html).not.toContain("Preverjena mnenja strank");
  });

  it("renders nothing at all when there are no reviews", () => {
    // The honest state of a shop that has not been paid yet — and much better
    // than the two invented quotes this replaced.
    const html = withReviews([]);
    expect(html).not.toContain("st-tst-q");
    expect(html).not.toContain("Mnenja strank");
  });

  it("carries no photograph", () => {
    // Asked for directly, and right on its own: a review is words and who said
    // them. The medallion held a product shot picked by an offset — decoration
    // standing where evidence belongs.
    const html = withReviews([R({ verified: true })]);
    expect(html).not.toContain("st-tst-disc");
  });

  it("ships no invented review in the shipped content", () => {
    // The two that used to live in content/bazen.ts named models that have
    // never existed. Nothing may reintroduce one.
    for (const r of base.reviews) {
      expect(r.placeholder, "shipped review is a placeholder: " + r.who).not.toBe(true);
    }
  });
});
