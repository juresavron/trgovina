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
    // One review, one heading: the singular is the same 23b claim in the
    // singular, and it must be as absent as the plural.
    expect(html).not.toContain("Preverjeno mnenje");
    expect(html).not.toContain("Preverjena mnenja");
    expect(html).toContain("Mnenje stranke");
  });

  it("claims it only when the operator ticked verified", () => {
    const html = withReviews([R({ verified: true })]);
    expect(html).toContain("Preverjen nakup · BAZEN 230");
    expect(html).toContain("Preverjeno mnenje stranke");
  });

  it("never claims it for a placeholder, even one marked verified", () => {
    // A flag collision that should be impossible is exactly the one worth a
    // test: invented content can never be a checked purchase.
    const html = withReviews([R({ verified: true, placeholder: true })]);
    expect(html).not.toContain("Preverjen nakup");
    expect(html).not.toContain("Preverjeno mnenje");
    expect(html).not.toContain("Preverjena mnenja");
  });

  it("HEADS THE BAND AS VERIFIED ONLY WHEN EVERY QUOTE UNDER IT IS", () => {
    // The heading speaks for all of them, so one unchecked review under
    // "Preverjena mnenja strank" makes the claim false for that one.
    const html = withReviews([R({ verified: true }), R({ who: "Sandra P., Koper" })]);
    expect(html).toContain("Mnenja strank");
    expect(html).not.toContain("Preverjena mnenja strank");
  });

  /**
   * ⚠️ THE LEAD IS A CLAIM TOO, and it was the one part of this band that no
   * test and no gate covered.
   *
   * The chip, the heading and this test file all keyed on `verified`. The
   * sentence under the heading did not: reviewsLead printed unconditionally
   * and said "Zapisali so jih stranke, ki so pri nas kupile bazen" — four
   * asserted purchases, against a reviews table holding order_id NULL on all
   * four. Every chip was correctly withheld and the strongest form of the same
   * 23b claim stayed on the page as running text.
   *
   * So the purchase sentence lives in reviewsLeadVerified and answers to the
   * same test as the chip. These two cases are what that means.
   */
  it("WITHHOLDS THE PURCHASE SENTENCE WHILE ANY QUOTE IS UNVERIFIED", () => {
    const content = {
      ...base,
      reviewsLead: "Objavljena so tako, kot smo jih prejeli.",
      reviewsLeadVerified: "Zapisali so jih stranke, ki so pri nas kupile bazen.",
      reviews: [R({ verified: true }), R({ who: "Sandra P., Koper" })],
    };
    const html = renderHome(shop, content, "studio", "");
    expect(html).toContain("Objavljena so tako, kot smo jih prejeli.");
    expect(html).not.toContain("kupile bazen");
  });

  it("prints it once every quote is verified", () => {
    const content = {
      ...base,
      reviewsLead: "Objavljena so tako, kot smo jih prejeli.",
      reviewsLeadVerified: "Zapisali so jih stranke, ki so pri nas kupile bazen.",
      reviews: [R({ verified: true }), R({ verified: true, who: "Sandra P., Koper" })],
    };
    const html = renderHome(shop, content, "studio", "");
    expect(html).toContain("kupile bazen");
    expect(html).toContain("Preverjena mnenja strank");
  });

  /**
   * The shop's real content, not a fixture. reviews.generated.ts is rewritten
   * from the database on every deploy, so a flag in it is a snapshot — and it
   * had drifted to verified:true on all four while the table held false on all
   * four. This asserts the RELATION rather than the value, so it holds whatever
   * the operator ticks: the purchase sentence appears on the live page only
   * when the flags that earn it do.
   */
  it("keeps the shipped content's lead in step with its own flags", () => {
    const real = CONTENT["bazen"]!;
    const html = renderHome(shop, real, "studio", "");
    if (real.reviews.length === 0) return;
    const allVerified = real.reviews.every((r) => r.verified === true && !r.placeholder);
    if (real.reviewsLeadVerified) {
      expect(
        html.includes(real.reviewsLeadVerified),
        allVerified
          ? "every review is verified but the purchase sentence is missing"
          : "an unverified review is on the page and the purchase sentence still prints",
      ).toBe(allVerified);
    }
    expect(html.includes("Preverjena mnenja strank")).toBe(allVerified);
  });

  it("renders nothing at all when there are no reviews", () => {
    // The honest state of a shop that has not been paid yet — and much better
    // than the two invented quotes this replaced.
    const html = withReviews([]);
    expect(html).not.toContain("st-tst-q");
    expect(html).not.toContain("Mnenja strank");
    expect(html).not.toContain("Mnenje stranke");
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
