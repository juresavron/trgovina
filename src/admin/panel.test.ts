import { describe, it, expect } from "vitest";
import { indexPage, loginPage, modelPage, notFoundPage, photoCount, siteImagePage } from "./panel";

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

  /**
   * Compounds take the GENITIVE PLURAL. This test used to assert
   * "21 fotografija" and "22 fotografiji" — enaindvajset and dvaindvajset
   * end in -dvajset, so they count like every other 5+ numeral; nobody has
   * ever said "enaindvajset fotografija". The special forms return only when
   * the numeral ends in the WORD ena/dve/tri/štiri: sto ena fotografija,
   * sto dve fotografiji.
   */
  it("counts compound numerals in the genitive plural", () => {
    expect(photoCount(21)).toBe("21 fotografij");
    expect(photoCount(22)).toBe("22 fotografij");
    expect(photoCount(24)).toBe("24 fotografij");
    expect(photoCount(25)).toBe("25 fotografij");
    expect(photoCount(101)).toBe("101 fotografija");
    expect(photoCount(102)).toBe("102 fotografiji");
    expect(photoCount(103)).toBe("103 fotografije");
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

/**
 * Whether a photograph was redrawn is shown, not remembered.
 *
 * An upscaled image contains pixels that were never photographed. The person
 * editing this catalogue should be able to see which ones those are months
 * later, without having to recall the day it was uploaded — and the width
 * ladder cannot tell them, because [480,800,1200,1600,2048] is what a 2048px
 * photograph and a 2K upscale both produce.
 */
describe("an enhanced photograph says so", () => {
  const row = (enhanced: boolean) => ({
    id: "a1", url: "bazen/x/a.webp", alt: "opis", sort: 0,
    widths: [480, 800, 1200, 1600, 2048], enhanced,
  });

  it("marks one the upscaler redrew", () => {
    const html = modelPage("bazen", "x", "BAZEN", [row(true)], undefined, "a@b.c", true, true);
    expect(html).toContain("2K (obdelano z UI)");
  });

  it("says nothing about one it did not", () => {
    // Identical widths. The ONLY difference is the recorded flag, which is the
    // whole reason the column exists.
    const html = modelPage("bazen", "x", "BAZEN", [row(false)], undefined, "a@b.c", true, true);
    expect(html).not.toContain("2K (obdelano z UI)");
    expect(html).toContain("širine: 480, 800, 1200, 1600, 2048");
  });
});

/**
 * Clearing a model is one click, and one click is exactly the risk.
 *
 * Replacing a set of photographs meant deleting them one at a time — nine
 * confirmations and nine page loads deep — so this exists. It is also the only
 * control in the panel that destroys work no re-upload of a single file can
 * restore, which is why every assertion here is about the guards rather than
 * about the button.
 */
describe("clearing a model's photographs", () => {
  const rows = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: "i" + i, url: "bazen/x/a" + i + ".webp", alt: "opis", sort: i,
      widths: [], enhanced: false,
    }));
  const page = (n: number, name = "SWIM 580 HIDRO") =>
    modelPage("bazen", "swim-580-hidro", name, rows(n), undefined, "a@b.c", true, true);
  const form = (html: string) => /<form class="clear-all"[\s\S]*?<\/form>/.exec(html)?.[0] ?? "";

  it("is not offered when there is nothing to delete", () => {
    // A destructive control on an empty list is a control whose only possible
    // outcome is an accident.
    expect(page(0)).not.toContain("Izbriši vse");
    expect(form(page(0))).toBe("");
  });

  it("is offered as soon as there is", () => {
    expect(page(1)).toContain("Izbriši vse");
    expect(form(page(1))).toContain('action="/admin/bazen/swim-580-hidro/delete-all"');
    expect(form(page(1))).toContain("method=\"post\"");
  });

  it("carries the count, so the server can refuse a stale tab", () => {
    // The handler re-reads the set and does nothing if it has changed. Without
    // this field it would have nothing to compare against.
    expect(form(page(7))).toContain('name="count" value="7"');
  });

  it("names the model and the number rather than asking 'are you sure?'", () => {
    // The muscle memory that dismisses a generic dialog is the memory this
    // has to interrupt, so the text has to say what will be lost.
    const f = form(page(3));
    expect(f).toContain("SWIM 580 HIDRO");
    expect(f).toContain("3 fotografije");
    expect(f).toContain("ni mogoče razveljaviti");
  });

  it("counts in Slovenian, teens included", () => {
    expect(form(page(1))).toContain("1 fotografija");
    expect(form(page(2))).toContain("2 fotografiji");
    expect(form(page(4))).toContain("4 fotografije");
    expect(form(page(5))).toContain("5 fotografij");
    // The case a naive last-digit rule gets wrong.
    expect(form(page(12))).toContain("12 fotografij");
    expect(form(page(21))).toContain("21 fotografij");
  });

  it("survives a model name that would break the confirmation", () => {
    // esc() does not escape the apostrophe, so a hand-built single-quoted JS
    // literal ends early on any name containing one; a backslash would open an
    // escape sequence. JSON.stringify handles both, and esc() then makes the
    // result safe as an attribute value.
    const f = form(page(1, "Bazen d'Or"));
    expect(f).toContain("Bazen d'Or");
    // The attribute is double-quoted, so an unescaped quote inside it would
    // end the attribute and put script-ish text into the tag.
    expect(f).toContain('onsubmit="return confirm(');
    const back = form(page(1, 'A\\B "X"'));
    expect(back).toContain("A\\\\B");
    // The real property: the attribute is delimited by double quotes, so its
    // VALUE must contain none. A raw one would end the attribute early and
    // spill the rest of the message into the tag as attributes.
    const attr = /onsubmit="([^"]*)"/.exec(back)?.[1] ?? "";
    expect(attr).toContain("confirm(&quot;");
    expect(attr).toContain("&quot;)");
    expect(attr.includes('"')).toBe(false);
    // And the whole attribute was captured, not truncated at a stray quote.
    expect(attr).toContain("razveljaviti");
  });

  it("leaves the per-photograph delete alone", () => {
    // Clearing everything is an addition, not a replacement: removing one
    // photograph is still the common case.
    const html = page(3);
    expect(html).toContain("/delete\"");
    expect(html).toContain("Izbriši</button>");
  });
});

/**
 * The gallery's order has a rule, so the panel says what it is.
 *
 * An order the operator cannot see the logic of reads as an arbitrary one, and
 * the first thing they do with an arbitrary order is start renumbering by hand
 * — which is precisely the work this was meant to remove.
 */
describe("sorting a gallery by what the pictures show", () => {
  const rows = (shot: string | null) => [
    { id: "a", url: "bazen/x/a.webp", alt: "opis", sort: 0, widths: [], enhanced: false, shot },
  ];
  const page = (shot: string | null, ai = true) =>
    modelPage("bazen", "swim-580-hidro", "SWIM 580 HIDRO", rows(shot), undefined, "a@b.c", true, ai);

  it("offers the control beside the photographs", () => {
    expect(page("top")).toContain("Razvrsti z UI");
    expect(page("top")).toContain('action="/admin/bazen/swim-580-hidro/arrange"');
  });

  it("names the kind of shot on each photograph", () => {
    expect(page("top")).toContain("· Od zgoraj");
    expect(page("jets")).toContain("· Šobe");
  });

  it("says nothing at all about one nobody has classified", () => {
    // Different from "other", which is an answer. This is the absence of one,
    // and inventing a label for it would be inventing the answer.
    const html = page(null);
    expect(html).toContain("ena širina");
    expect(html).not.toContain("· Od zgoraj");
    expect(html).not.toContain("· Drugo");
  });

  it("is disabled when there is no describer to do the sorting", () => {
    // The whole feature is one Gemini call per photograph. Without a key the
    // button could only ever fail, so it says so before it is pressed.
    expect(page("top", false)).toContain("disabled>Razvrsti z UI");
    expect(page("top", true)).toContain('type="submit">Razvrsti z UI');
  });

  it("is not offered on a model with no photographs", () => {
    const empty = modelPage("bazen", "x", "B", [], undefined, "a@b.c", true, true);
    expect(empty).not.toContain("Razvrsti z UI");
  });
});

/**
 * A photograph of a real garden is never redrawn.
 *
 * ⚠️ THE HERO CAME BACK AS A DIFFERENT SCENE. The upscaler REDRAWS a picture
 * rather than sharpening it, which costs little on a product cut out against a
 * plain sweep — the subject is isolated and there is not much to invent — and
 * costs everything on a scene. The operator uploaded a wide shot of a tub in a
 * garden and the shop showed a corner of a tub in a garden that was not the
 * same garden.
 *
 * The second reason outranks the first: a shop's hero is a claim about what
 * this looks like in a real garden, and a generated reconstruction is a
 * picture of an installation nobody built, shown as one.
 */
describe("the site images are not put through the upscaler", () => {
  const page = () =>
    siteImagePage("hero", "Naslovna slika", "Velika slika.", "/media/site/hero.webp?v=1", undefined, "a@b.c");

  it("does not switch the upscaler on for the form", () => {
    // The browser reads this attribute and nothing else decides it, so the
    // attribute IS the contract.
    const form = /<form class="card"[^>]*>/.exec(page())?.[0] ?? "";
    expect(form).toContain('data-mode="site"');
    expect(form).not.toContain("data-enhance");
  });

  it("says the picture is uploaded as chosen", () => {
    // ⚠️ ASSERTED ON THE CARD, NOT THE DOCUMENT. The uploader's own source is
    // inlined into every admin page, and it carries a comment quoting the old
    // promise verbatim — so a whole-document search finds the sentence in a
    // code comment and calls a corrected page uncorrected. Same trap as
    // searching a page for a class name that also appears in its stylesheet.
    const card = /<form class="card"[\s\S]*?<\/form>/.exec(page())?.[0] ?? "";
    expect(card).toContain("se ne obdeluje z umetno inteligenco");
    // And no longer claims the opposite.
    expect(card).not.toContain("samodejno izboljšajo na 2K");
    expect(card).not.toContain("na novo nariše");
  });

  it("still redraws a PRODUCT photograph, where the operator asked for it", () => {
    // The product form keeps it — the subject there is a cut-out, and the
    // panel discloses what is happening on that page.
    const rows = [{ id: "a", url: "a.webp", alt: "o", sort: 0, widths: [], enhanced: false, shot: null }];
    const product = modelPage("bazen", "x", "B", rows, undefined, "a@b.c", true, true);
    expect(product).toContain('data-enhance="on"');
  });
});
