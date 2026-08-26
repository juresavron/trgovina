import { describe as suite, it, expect } from "vitest";
import { describeAvailable, tidy, ALT_MAX } from "./describe";
import { isContentAddressed, slugStem, standInAlt } from "./routes";

/**
 * The describer is off unless a key is configured.
 *
 * Same rule the upscaler keeps, and for the same reason: a shop that has not
 * opted in must not be able to reach an outside API by accident, and the
 * panel must not offer a feature that would 404.
 */
suite("the describer is opt-in", () => {
  it("is off with no key", () => {
    expect(describeAvailable({})).toBe(false);
    expect(describeAvailable({ GEMINI_API_KEY: "" })).toBe(false);
  });
  it("is on with one", () => {
    expect(describeAvailable({ GEMINI_API_KEY: "k" })).toBe(true);
  });
});

/**
 * What comes back from a language model is not what goes into an attribute.
 *
 * Every case here was written from the shape of the failure rather than from
 * imagination: a model told to answer in one line without quotes will, some
 * of the time, answer in one line with quotes, or open with the word the
 * prompt forbade, or wrap the whole thing in a code fence.
 */
suite("an answer is tidied before it reaches the field", () => {
  it("strips quotes, fences and trailing stops", () => {
    expect(tidy('"Bazen na terasi ob hiši."')).toBe("Bazen na terasi ob hiši");
    expect(tidy("```\nBazen na terasi ob hiši\n```")).toBe("Bazen na terasi ob hiši");
    expect(tidy("„Bazen na terasi ob hiši“")).toBe("Bazen na terasi ob hiši");
  });

  it("drops an opening the prompt forbade", () => {
    expect(tidy("Fotografija prikazuje bazen na terasi")).toBe("bazen na terasi");
    expect(tidy("Slika: bazen na terasi")).toBe("bazen na terasi");
  });

  it("collapses whitespace", () => {
    expect(tidy("  bazen   na \n terasi ")).toBe("bazen na terasi");
  });

  it("never exceeds the field's own cap, and never cuts mid-word", () => {
    const long = "bazen ".repeat(60);
    const out = tidy(long);
    expect(out.length).toBeLessThanOrEqual(ALT_MAX);
    expect(out.endsWith("bazen")).toBe(true);
  });

  it("refuses a one-word answer", () => {
    // A single noun is not a description; it is a model that gave up, and an
    // alt of "bazen" is worse than an empty field because it looks filled in.
    expect(tidy("bazen")).toBe("");
    expect(tidy('"bazen."')).toBe("");
  });
});

/**
 * The filename carries the description, and still caches forever.
 *
 * Two properties in tension: an image URL is a ranking signal, so the stem
 * should say what the picture shows; and /media serves a file for a year only
 * when its URL changes with its bytes. The "--" seam is what buys both.
 */
suite("upload filenames", () => {
  it("transliterates Slovenian rather than dropping it", () => {
    expect(slugStem("Masažni bazen na terasi")).toBe("masazni-bazen-na-terasi");
    expect(slugStem("Šobe in črpalka")).toBe("sobe-in-crpalka");
  });

  it("produces only what /media will serve back", () => {
    const s = slugStem("Bazen 2,30 × 2,30 m — pokrit s termo pokrovom!");
    expect(s).toMatch(/^[a-z0-9][a-z0-9_-]*$/);
    expect(s.includes("--")).toBe(false);
  });

  it("caps on a word boundary", () => {
    const s = slugStem("masazni bazen na terasi pokrit s termo pokrovom ob hisi zvecer");
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith("-")).toBe(false);
  });

  it("is empty for a string with nothing to slugify", () => {
    expect(slugStem("— · —")).toBe("");
  });

  const uuid = "3f2a1b4c-5d6e-4f70-8912-a3b4c5d6e7f8";

  it("keeps the immutable year for a described upload", () => {
    expect(isContentAddressed("bazen/veliki-230/masazni-bazen-na-terasi--" + uuid + ".webp")).toBe(true);
    expect(isContentAddressed("bazen/veliki-230/masazni-bazen-na-terasi--" + uuid + "-800.webp")).toBe(true);
  });

  it("still recognises the bare UUIDs already in the bucket", () => {
    expect(isContentAddressed("bazen/veliki-230/" + uuid + ".webp")).toBe(true);
    expect(isContentAddressed("bazen/veliki-230/" + uuid + "-1200.webp")).toBe(true);
  });

  it("refuses a human-named file, which must stay revalidatable", () => {
    // A replacement lands at the same key, so a year of immutable caching
    // would mean the picture simply never updates.
    expect(isContentAddressed("site/hero.webp")).toBe(false);
    expect(isContentAddressed("bazen/veliki-230/masazni-bazen-na-terasi.webp")).toBe(false);
    // A stem that merely CONTAINS something UUID-shaped is not addressed by it.
    expect(isContentAddressed("bazen/veliki-230/" + uuid + "-terasa.webp")).toBe(false);
  });
});

/**
 * An upload is never refused for want of a sentence.
 *
 * A required alt field does not produce good alt text — it produces whatever
 * gets past it, which is how nine photographs came to share one pasted
 * string. The column is NOT NULL, so something has to go in; this is what.
 */
suite("the stand-in description", () => {
  it("names the model and the picture's position", () => {
    expect(standInAlt("SWIM 580 HIDRO", "3")).toBe("SWIM 580 HIDRO — fotografija 3");
  });

  it("is different for every picture in a set", () => {
    const set = ["1", "2", "3"].map((n) => standInAlt("BAZEN 230", n));
    expect(new Set(set).size).toBe(3);
  });

  it("falls back to the name alone when the position is missing or absurd", () => {
    expect(standInAlt("BAZEN 230", null)).toBe("BAZEN 230");
    expect(standInAlt("BAZEN 230", "")).toBe("BAZEN 230");
    expect(standInAlt("BAZEN 230", "nonsense")).toBe("BAZEN 230");
    expect(standInAlt("BAZEN 230", "0")).toBe("BAZEN 230");
    expect(standInAlt("BAZEN 230", "99999")).toBe("BAZEN 230");
  });

  it("is never empty, because the column is NOT NULL", () => {
    expect(standInAlt("", null)).not.toBe("");
    expect(standInAlt("", "2")).not.toBe("");
  });

  it("slugifies into a usable filename stem", () => {
    // The stand-in is what names the object when nobody described the
    // picture, so it has to survive slugStem into something /media will serve.
    expect(slugStem(standInAlt("SWIM 580 HIDRO", "3"))).toBe("swim-580-hidro-fotografija-3");
  });
});

suite("the stand-in fits the column", () => {
  it("never exceeds the alt length check, cutting the name rather than the position", () => {
    const long = "B".repeat(400);
    const out = standInAlt(long, "7");
    expect(out.length).toBeLessThanOrEqual(180);
    expect(out.endsWith("— fotografija 7")).toBe(true);
  });
});
