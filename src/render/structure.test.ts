import { describe, it, expect } from "vitest";
import { handleRequest } from "../worker";
import { SHOPS } from "../tenants";
import { MEDIA_WIDTHS } from "../themes/studio/media-widths";
import { OWN_MEDIA } from "../themes/studio/own-media";
import { OWN_HERO } from "../themes/studio/own-hero";
import { CONTENT } from "../content";

/**
 * Structural audit of every rendered page.
 *
 * These are the defects that survive a visual review because they are
 * invisible until someone navigates by keyboard, by screen reader, or on a
 * slow connection — a skipped heading level, a duplicate id that silently
 * breaks a label, an icon button with no name, an image that shoves the page
 * down as it loads. They are also exactly what a polish pass reintroduces,
 * since polish means rewriting markup.
 *
 * Cheap to run, and it fails loudly the moment a device regresses.
 */

function audit(html: string): string[] {
  const problems: string[] = [];
  const body = html.slice(html.indexOf("<body"));

  // ⚠️ NO INTERNAL IDENTIFIER MAY REACH A CUSTOMER.
  //
  // A product page printed "Cenik logistike: razred pallet_xl · cona SI" —
  // the freight engine's own enum, in the delivery panel, in a sentence
  // otherwise written in Slovenian. It reads as a bug to anyone who notices
  // and as nothing at all to anyone who does not, and it is the kind of leak
  // that arrives whenever a value is passed to copy without being translated.
  //
  // These are matched as whole words so ordinary prose cannot trip them.
  for (const token of ["pallet_xl", "white_glove", "pallet_std", "parcel", "freightClass"]) {
    const re = new RegExp("(^|[^a-z_])" + token + "([^a-z_]|$)", "i");
    // Strip attribute values: a class name or data attribute is markup, not
    // copy, and only what a reader SEES is the failure here.
    const text = body.replace(/<[^>]*>/g, " ");
    if (re.test(text)) problems.push("internal identifier in visible copy: " + token);
  }

  // Exactly one h1, and no skipped level. Heading structure IS the document
  // outline a screen-reader user navigates by.
  const levels = [...body.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  const h1s = levels.filter((l) => l === 1).length;
  if (h1s !== 1) problems.push("h1 count = " + h1s + " (want exactly 1)");
  for (let i = 1; i < levels.length; i++) {
    if (levels[i]! > levels[i - 1]! + 1) {
      problems.push("heading jumps h" + levels[i - 1] + " -> h" + levels[i]);
    }
  }

  // A duplicate id breaks every id-based affordance at once: label/for,
  // aria-labelledby, aria-describedby, and in-page anchors.
  const ids = [...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
  const dupes = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
  if (dupes.length) problems.push("duplicate id: " + dupes.join(", "));

  // Anything focusable needs an accessible name. An icon-only control with
  // neither text nor aria-label is announced as "link" and nothing else.
  for (const m of body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = m[1]!;
    const text = m[2]!.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").trim();
    if (!/aria-label(ledby)?=/.test(attrs) && !text) {
      problems.push("link with no accessible name: " + attrs.slice(0, 70));
    }
  }
  for (const m of body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    const attrs = m[1]!;
    const text = m[2]!.replace(/<[^>]+>/g, "").trim();
    if (!/aria-label(ledby)?=/.test(attrs) && !text) {
      problems.push("button with no accessible name: " + attrs.slice(0, 70));
    }
  }

  // A positive tabindex reorders the tab sequence away from reading order,
  // which is worse than no tab order at all.
  for (const m of body.matchAll(/tabindex="(\d+)"/g)) {
    if (Number(m[1]) > 0) problems.push("positive tabindex=" + m[1]);
  }

  // Every image reserves its box, or it moves the layout as it decodes —
  // the CLS budget in docs/SEO.md §4 is a gate.
  //
  // ONE NARROW EXEMPTION: photographs served from Supabase through /media/.
  // The build cannot reach that bucket to measure them, and the alternative
  // to omitting the attributes is inventing them — an <img> declaring an
  // aspect ratio its pixels do not have is worse than one declaring none,
  // because the browser BELIEVES it and lays out against the wrong box.
  //
  // What actually keeps CLS at zero for these is that every frame painting
  // one sets its own aspect-ratio and sizes the image to 100%
  // (.st-pdp-frame 1/1, .st-shot var(--studio-pdp-frame-ar), .st-soc-img a
  // fixed tile, .st-imp-tile its own ratio). The exemption is therefore a
  // statement about those frames, and it expires the moment a /media/ image
  // is dropped into a slot without one.
  //
  // It also expires on its own the moment the photographs go through /admin
  // instead of the Supabase dashboard: that path converts to WebP, writes a
  // width ladder and records the dimensions, so the attributes come back and
  // this branch stops being reached.
  const unmeasured = /\bsrc="\/media\//;
  for (const m of body.matchAll(/<img\b([^>]*)>/g)) {
    const a = m[1]!;
    // Only the DIMENSION check is exempt. `continue` here would also excuse
    // these from the alt check below, which is the opposite of what is wanted:
    // these are the photographs of the goods, so they are the images whose alt
    // text matters most.
    if (!unmeasured.test(a) && (!/\bwidth=/.test(a) || !/\bheight=/.test(a))) {
      problems.push("img without width/height: " + a.slice(0, 70));
    }
    if (!/\balt=/.test(a)) problems.push("img without alt: " + a.slice(0, 70));

    // `sizes` without `srcset` is inert — the browser ignores it entirely and
    // downloads the single `src` at whatever size that file happens to be.
    // Every decorative image in the theme carried one for weeks and looked
    // like responsive imagery while shipping 1600px masters into 437px cards.
    // It reads as done, which is why it needs a gate rather than a comment.
    if (/\bsizes=/.test(a) && !/\bsrcset=/.test(a)) {
      problems.push("img with sizes but no srcset: " + a.slice(0, 70));
    }

    // Every candidate must be a file the build actually wrote, at the width
    // its descriptor claims. A `w` that does not match the file makes every
    // selection the browser computes after it wrong, and nothing warns.
    for (const c of ((a.match(/srcset="([^"]*)"/) || [])[1] || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)) {
      const [url, desc] = c.split(/\s+/);
      // THREE builds write images, and the gate has to know about all of them
      // or it reports the shop's own photography as a missing file: the theme
      // bundle (scripts/build-media.mjs -> MEDIA_WIDTHS, paths relative to
      // /img/), the shop's model photography (scripts/build-own-media.mjs ->
      // OWN_MEDIA) and its hero plate (scripts/build-hero-plate.mjs ->
      // OWN_HERO), both of those absolute under /img/own/.
      const themeRung = Object.values(MEDIA_WIDTHS)
        .flat()
        .find((r) => "/img/" + r[0] === url);
      const ownRung = Object.values(OWN_MEDIA)
        .flatMap((photos) => photos.flatMap((ph) => ph.widths))
        .find((r) => r[0] === url);
      const heroRung = Object.values(OWN_HERO)
        .flatMap((plate) => (plate ? [...plate.widths] : []))
        .find((r) => r[0] === url);
      const rung = themeRung ?? ownRung ?? heroRung;
      if (!rung) problems.push("srcset names a file the build did not write: " + url);
      else if (desc !== rung[1] + "w") {
        problems.push("srcset width " + desc + " but " + url + " is " + rung[1] + "px");
      }
    }
  }

  if (!/<main\b/.test(body)) problems.push("no <main> landmark");
  if (!/<header\b/.test(body)) problems.push("no <header> landmark");
  if (!/<footer\b/.test(body)) problems.push("no <footer> landmark");

  // A control with no label is unusable by voice and unclear by screen reader.
  for (const m of body.matchAll(/<input\b([^>]*)>/g)) {
    const a = m[1]!;
    if (/type="(hidden|checkbox|radio)"/.test(a)) continue;
    const id = (a.match(/id="([^"]+)"/) || [])[1];
    const labelled = /aria-label/.test(a) || (!!id && body.includes('for="' + id + '"'));
    if (!labelled) problems.push("input without label: " + a.slice(0, 70));
  }

  return problems;
}

describe("every rendered page is structurally sound", () => {
  const routes = ["/", "/savne", "/kontakt"];
  for (const key of Object.keys(SHOPS)) {
    it(key + " passes the structural audit on every route", async () => {
      const found: string[] = [];
      // Every product page the shop serves, not just the flagship. A shop
      // with a catalogue has most of its pages here, and they are generated
      // rather than hand-written — exactly the ones a structural slip would
      // reach nine at a time.
      const shop = SHOPS[key]!;
      const content = CONTENT[key]!;
      const pdps = (content.pdps ?? [content.pdp]).map(
        (d) => shop.routeSlugs["/product"] + "/" + d.slug,
      );
      for (const path of [...routes, ...pdps]) {
        const html = await handleRequest(
          new Request("https://trgovina.worldfans.workers.dev" + path + "?shop=" + key, {
            headers: { host: "trgovina.worldfans.workers.dev" },
          }),
        ).text();
        for (const p of audit(html)) found.push(path + " :: " + p);
      }
      expect([...new Set(found)], key + "\n" + found.join("\n")).toEqual([]);
    });
  }
});


/**
 * EVERY IN-PAGE LINK LANDS ON SOMETHING.
 *
 * The subpages carry a "Na tej strani" index built from every block that has
 * a heading, and the id it points at used to be threaded into ONE block kind.
 * So steps, questions, fact tables, the contact block and the imprint all had
 * an index entry aimed at an id that did not exist: 26 dead links across 10
 * pages, and all four entries on /pogosta-vprasanja. Nothing failed — the
 * browser simply does not move, which a visitor reads as the page being
 * broken rather than the link.
 *
 * This is a whole-site sweep rather than a page test because the failure is
 * structural: a new block kind that forgets its anchor breaks silently, and
 * silently is how this one survived.
 */
describe("no in-page link points at nothing", () => {
  const PATHS = [
    "/", "/trgovina", "/masazni-bazeni", "/swim-spa", "/bazen/veliki-230",
    "/kontakt", "/dostava-in-montaza", "/primerjava", "/o-nas", "/vodniki",
    "/pogoji-poslovanja", "/pogosta-vprasanja", "/piskotki", "/zasebnost",
    "/odstop-od-pogodbe", "/razstavni-salon", "/financiranje", "/kosarica",
  ];

  for (const path of PATHS) {
    it("resolves every fragment on " + path, async () => {
      const res = handleRequest(
        new Request("https://trgovina.workers.dev" + path + "?shop=bazen", {
          headers: { host: "trgovina.workers.dev" },
        }),
      );
      expect(res.status).toBe(200);
      const html = await res.text();
      const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!));
      const dead = [...html.matchAll(/href="#([^"]+)"/g)]
        .map((m) => m[1]!)
        // "#" alone and "#main" style skip targets are covered by ids too;
        // anything genuinely empty is not a fragment link.
        .filter((t) => t !== "" && !ids.has(t));
      expect(dead, path + " has dead fragments: " + dead.join(", ")).toEqual([]);
    });
  }
});

/**
 * AN ENQUIRY REMEMBERS WHAT IT IS ABOUT — and cannot be told a lie.
 *
 * The product page's "Povprašajte za ponudbo" carries ?model=<slug>, so a
 * visitor who spent five minutes choosing between three shells does not have
 * to name the one they picked from memory, and the shop stops receiving
 * "(no subject)". The slug is resolved against the catalogue in the router,
 * which is the whole safety story: what reaches a renderer is a real
 * PdpContent or nothing, so a parameter somebody typed can never become page
 * text. These four cases are the contract.
 */
describe("the enquiry carries its model", () => {
  const get = async (u: string) => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev" + u, {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    expect(res.status).toBe(200);
    return await res.text();
  };

  it("names the model and puts it in the subject line", async () => {
    const html = await get("/kontakt?shop=bazen&model=veliki-230");
    expect(html).toContain("Povpraševanje za <strong>BAZEN 230</strong>");
    expect(html).toContain("subject=" + encodeURIComponent("Povpraševanje — BAZEN 230"));
  });

  it("is the ordinary page with no parameter", async () => {
    const html = await get("/kontakt?shop=bazen");
    expect(html).not.toContain('class="st-page-about"');
    expect(html).toContain("subject=" + encodeURIComponent("Povpraševanje"));
  });

  it("ignores a slug that names nothing", async () => {
    const html = await get("/kontakt?shop=bazen&model=this-is-not-a-model");
    expect(html).not.toContain('class="st-page-about"');
    expect(html).not.toContain("this-is-not-a-model");
  });

  it("never echoes the parameter, whatever it says", async () => {
    const html = await get("/kontakt?shop=bazen&model=" + encodeURIComponent('"><script>x</script>'));
    expect(html).not.toContain("<script>x");
    expect(html).not.toContain("&lt;script&gt;x");
    expect(html).not.toContain('class="st-page-about"');
  });

  it("keeps one canonical URL whatever the parameter", async () => {
    const shop = SHOPS["bazen"]!;
    for (const u of ["/kontakt?shop=bazen", "/kontakt?shop=bazen&model=veliki-230"]) {
      const html = await get(u);
      expect(html).toContain('rel="canonical" href="' + shop.siteUrl + '/kontakt"');
    }
  });

  it("is emitted by every product page", async () => {
    for (const slug of ["veliki-230", "swim-580-maxi"]) {
      const html = await get("/bazen/" + slug + "?shop=bazen");
      expect(html, slug + " loses its model on the enquiry").toContain("model=" + slug);
    }
  });
});
