import { describe, it, expect } from "vitest";
import { indexPage, loginPage, modelPage, notFoundPage, photoCount } from "./panel";

/**
 * Slovenian counts in four forms, and the panel got this wrong: everything
 * above one used the genitive plural, so two photographs read "2 fotografij".
 * Same class of error as modelCount() in content/bazen.ts, and the same
 * consequence — a shop that cannot count in its own language reads as machine
 * translated.
 */
describe("counting photographs", () => {
  it("uses the singular, the dual, the plural and the genitive plural", () => {
    expect(photoCount(1)).toBe("1 fotografija");
    expect(photoCount(2)).toBe("2 fotografiji");
    expect(photoCount(3)).toBe("3 fotografije");
    expect(photoCount(4)).toBe("4 fotografije");
    expect(photoCount(5)).toBe("5 fotografij");
    expect(photoCount(11)).toBe("11 fotografij");
  });

  /** The form follows the last two digits, not the first: 22 is a dual. */
  it("counts by the last two digits", () => {
    expect(photoCount(21)).toBe("21 fotografija");
    expect(photoCount(22)).toBe("22 fotografiji");
    expect(photoCount(24)).toBe("24 fotografije");
    expect(photoCount(25)).toBe("25 fotografij");
    expect(photoCount(101)).toBe("101 fotografija");
  });

  it("says none rather than zero", () => {
    expect(photoCount(0)).toBe("brez fotografij");
  });
});

describe("the panel's pages", () => {
  /**
   * The panel is a back office and every page says so in its head. A single
   * indexed admin URL is a permanent invitation to try the password box.
   */
  it("keeps every page out of the index", () => {
    for (const html of [
      loginPage(),
      notFoundPage("Ni ga.", "kdo@example.test"),
      indexPage("Trgovina", "bazen", [], "kdo@example.test"),
      modelPage("bazen", "x", "X", [], undefined, "kdo@example.test"),
    ]) {
      expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
    }
  });

  /**
   * The login screen must not carry the signed-in chrome — a sign-out button
   * on a page you cannot be signed out of, and an account name that is nobody.
   */
  it("shows no account and no sign-out before sign-in", () => {
    const html = loginPage();
    expect(html).not.toContain("/admin/logout");
    expect(html).not.toContain("Odjava");
  });

  /**
   * ⚠️ A signed-in admin who mistyped a URL used to be shown the LOGIN FORM,
   * which reads as "you have been signed out" and invites a pointless
   * re-login. It is a 404, and it should look like one.
   */
  it("answers a bad path with a way back, not a password box", () => {
    const html = notFoundPage("Ta model ne obstaja.", "kdo@example.test");
    expect(html).toContain("Ta model ne obstaja.");
    expect(html).toContain('href="/admin"');
    expect(html).not.toContain('type="password"');
  });

  /**
   * Save and delete sit in one row but belong to different forms, which only
   * works while each button names the form it submits. Lose the association
   * and Izbriši silently posts the SAVE form — the photograph stays, the
   * operator believes it is gone.
   */
  it("binds each action button to its own form", () => {
    const html = modelPage(
      "bazen", "x", "X",
      [{ id: "abc", url: "bazen/x/a.webp", alt: "opis", sort: 0, widths: [] }],
      undefined, "kdo@example.test",
    );
    expect(html).toContain('id="u-abc"');
    expect(html).toContain('id="d-abc"');
    expect(html).toContain('form="u-abc">Shrani</button>');
    expect(html).toContain('form="d-abc">Izbriši</button>');
    // The sort field lives outside the form it posts to, so it needs the
    // association too — without it the order silently never changes.
    expect(html).toContain('name="sort" form="u-abc"');
  });

  /** The badge marks the photograph the storefront actually shows. */
  it("marks only the first photograph as the cover", () => {
    const html = modelPage(
      "bazen", "x", "X",
      [
        { id: "one", url: "a.webp", alt: "a", sort: 0, widths: [] },
        { id: "two", url: "b.webp", alt: "b", sort: 1, widths: [] },
      ],
      undefined, "kdo@example.test",
    );
    expect(html.match(/class="badge"/g)).toHaveLength(1);
  });

  /**
   * Every id in one document has to be unique, and the mark's mask id is the
   * one that repeats: the dashboard draws it once per model without a cover.
   */
  it("gives every mark on the dashboard its own mask id", () => {
    const html = indexPage(
      "Trgovina", "bazen",
      [
        { shop: "bazen", slug: "a", name: "A", count: 0 },
        { shop: "bazen", slug: "b", name: "B", count: 0 },
      ],
      "kdo@example.test",
    );
    const ids = [...html.matchAll(/<mask id="([^"]+)"/g)].map((m) => m[1]!);
    expect(ids.length).toBeGreaterThan(1);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
