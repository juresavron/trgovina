import { describe, expect, it } from "vitest";
import { indexPage, type ModelLink } from "./panel";
const M: ModelLink[] = [{ shop: "bazen", slug: "a", name: "A", count: 1, cover: "" }];
describe("the shop switcher", () => {
  it("is absent with one shop", () => {
    const h = indexPage("Vrelec", "bazen", M, "a@b.si", [], [{ id: "bazen", name: "Vrelec" }]);
    // ⚠️ THE FORM, NOT THE WORD. design.ts carries `.shopsw{...}` in the
    // inlined stylesheet on every page, so "shopsw" is present whether or not
    // the control is. Assert the thing that only exists when it renders.
    expect(h).not.toContain('action="/admin/trgovina"');
  });
  it("appears with two, and marks the current one", () => {
    const h = indexPage("Vrelec", "bazen", M, "a@b.si", [], [
      { id: "bazen", name: "Vrelec" },
      { id: "savna", name: "Savne Nord" },
    ]);
    expect(h).toContain('action="/admin/trgovina"');
    expect(h).toContain('<option value="bazen" selected>Vrelec</option>');
    expect(h).toContain('<option value="savna">Savne Nord</option>');
    expect(h).toContain("method=\"post\"");
  });
  it("escapes a shop name, because it is a database row", () => {
    const h = indexPage("X", "x", M, "a@b.si", [], [
      { id: "x", name: "X" }, { id: "y", name: '<script>alert(1)</script>' },
    ]);
    expect(h).not.toContain("<script>alert(1)</script>");
    expect(h).toContain("&lt;script&gt;");
  });
});
