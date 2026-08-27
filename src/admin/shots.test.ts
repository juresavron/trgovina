import { describe as suite, it, expect } from "vitest";
import { SHOTS, SHOT_KEYS, arrange, shotLabel, shotRank, shotMenu } from "./shots";
import { previewPath } from "./routes";
import { parse } from "./describe";

/**
 * Six pools photographed the same way, and six galleries that opened on six
 * different kinds of picture. These tests are about the ORDER holding — a
 * gallery sorted by a rule that changes when you look at it twice is not
 * sorted at all.
 */
suite("the shot vocabulary", () => {
  it("has unique keys and every key is in the set", () => {
    expect(new Set(SHOTS.map((s) => s.key)).size).toBe(SHOTS.length);
    for (const s of SHOTS) expect(SHOT_KEYS.has(s.key)).toBe(true);
  });

  it("opens on the whole object, not on a detail", () => {
    // The editorial claim the order exists to make: somebody comparing two
    // models needs to see the thing before they see its jets.
    expect(SHOTS[0]!.key).toBe("top");
    expect(shotRank("top")).toBeLessThan(shotRank("interior"));
    expect(shotRank("side")).toBeLessThan(shotRank("jets"));
    expect(shotRank("interior")).toBeLessThan(shotRank("seat"));
  });

  it("sorts the unclassified and the unrecognised last, together", () => {
    // Not knowing what a photograph is must never promote it.
    const last = SHOTS.length;
    expect(shotRank(null)).toBe(last);
    expect(shotRank(undefined)).toBe(last);
    expect(shotRank("")).toBe(last);
    expect(shotRank("nonsense")).toBe(last);
    expect(shotRank("other")).toBeLessThanOrEqual(last);
  });

  it("names every category for the operator, and nothing else", () => {
    expect(shotLabel("top")).toBe("Od zgoraj");
    expect(shotLabel(null)).toBe("");
    expect(shotLabel("nonsense")).toBe("");
  });

  it("gives the model the keys it is allowed to answer with", () => {
    const menu = shotMenu();
    for (const s of SHOTS) expect(menu).toContain(s.key + ": ");
  });
});

suite("renumbering a gallery", () => {
  const row = (id: string, shot: string | null, sort: number) => ({ id, shot, sort });

  /**
   * The ids in gallery order after the moves are applied.
   *
   * arrange() returns only the rows that actually MOVE — an already-sorted
   * gallery costs no writes — so reading the returned list as if it described
   * every row would call a correctly-untouched photograph a missing one. What
   * matters is the order that results, so that is what these assert on.
   */
  const applied = (rows: { id: string; shot: string | null; sort: number }[]) => {
    const moved = new Map(arrange(rows).map((m) => [m.id, m.sort]));
    return [...rows]
      .map((r) => ({ id: r.id, at: moved.get(r.id) ?? r.sort }))
      .sort((a, b) => a.at - b.at)
      .map((r) => r.id);
  };

  it("puts the establishing shot first whatever order they were uploaded in", () => {
    const rows = [
      row("a", "jets", 0),
      row("b", "top", 1),
      row("c", "interior", 2),
      row("d", "side", 3),
    ];
    expect(applied(rows)).toEqual(["b", "d", "c", "a"]);
  });

  it("is idempotent — pressing it twice changes nothing the second time", () => {
    // The property that makes the button safe to press. Without it, two
    // photographs of the same kind would swap on every press.
    const rows = [row("a", "top", 0), row("b", "side", 1), row("c", "side", 2)];
    expect(arrange(rows)).toEqual([]);
  });

  it("keeps the operator's own order within one category", () => {
    const rows = [row("a", "side", 5), row("b", "side", 1), row("c", "top", 9)];
    // b was numbered before a, and stays before it.
    expect(applied(rows)).toEqual(["c", "b", "a"]);
  });

  it("does not disturb photographs nobody has classified", () => {
    // They go to the end, in the order they had — not shuffled among
    // themselves for want of an answer.
    const rows = [row("a", null, 0), row("b", "top", 1), row("c", null, 2)];
    expect(applied(rows)).toEqual(["b", "a", "c"]);
  });

  it("writes only the rows that actually move", () => {
    // An already-sorted gallery costs no database writes at all.
    const rows = [row("a", "top", 0), row("b", "side", 1)];
    expect(arrange(rows)).toEqual([]);
    expect(arrange([row("a", "side", 0), row("b", "top", 1)]).length).toBe(2);
  });
});

/**
 * Classifying reads the small rung, not the 2K one.
 *
 * "Is this the whole tub or a close-up of a seat" is not a question detail
 * answers. Reading thirty 2K files through a Worker to ask it would be
 * bandwidth, CPU and tokens spent on pixels that change no answer.
 */
suite("which file the classifier looks at", () => {
  const url = "bazen/x/a--uuid.webp";

  it("takes the 800px rung when the ladder has one", () => {
    expect(previewPath(url, [480, 800, 1200, 1600, 2048])).toBe("bazen/x/a--uuid-800.webp");
  });

  it("falls back to the file itself when there is no ladder", () => {
    expect(previewPath(url, [])).toBe(url);
    expect(previewPath(url, null)).toBe(url);
    expect(previewPath("ZR805-1.jpg", [])).toBe("ZR805-1.jpg");
  });

  it("never asks for a suffixed copy of the widest rung", () => {
    // The widest is stored at the bare path — the same trap that broke delete.
    expect(previewPath(url, [480, 800])).toBe(url);
    expect(previewPath(url, [800])).toBe(url);
  });
});

/**
 * What comes back from the model is two answers now, and the second one must
 * never cost the first.
 */
suite("reading the model's answer", () => {
  it("takes both fields from a well-formed answer", () => {
    expect(parse('{"alt":"Bazen na terasi ob hiši","shot":"side"}'))
      .toEqual({ alt: "Bazen na terasi ob hiši", shot: "side" });
  });

  it("keeps the description when the category is unusable", () => {
    // Losing the sorting is a much smaller failure than losing the alt text.
    expect(parse('{"alt":"Bazen na terasi","shot":"vrh"}'))
      .toEqual({ alt: "Bazen na terasi", shot: null });
    expect(parse('{"alt":"Bazen na terasi"}'))
      .toEqual({ alt: "Bazen na terasi", shot: null });
  });

  it("still reads a plain sentence, which is what older models return", () => {
    expect(parse("Bazen na terasi ob hiši")).toEqual({ alt: "Bazen na terasi ob hiši", shot: null });
  });

  it("digs the object out of a fenced or prefaced answer", () => {
    expect(parse('```json\n{"alt":"Bazen na terasi","shot":"top"}\n```'))
      .toEqual({ alt: "Bazen na terasi", shot: "top" });
  });

  it("is null when there is no description in it at all", () => {
    expect(parse('{"alt":"","shot":"top"}')).toBeNull();
    expect(parse("")).toBeNull();
    // One word is not a description — the rule tidy() already enforced.
    expect(parse('{"alt":"bazen","shot":"top"}')).toBeNull();
  });

  it("lower-cases and trims a category the model padded", () => {
    expect(parse('{"alt":"Bazen na terasi","shot":" TOP "}')?.shot).toBe("top");
  });
});
