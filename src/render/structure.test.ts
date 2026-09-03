import { GUIDE_PAGES } from "../content/pages/vodnik";
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

  // ⚠️ NO UNTRANSLATED ENGLISH IN VISIBLE COPY.
  //
  // The shop is Slovenian and every word on it is written in Slovenian —
  // except two categories that are not translation failures, listed below.
  // The cabinet colours were: six plain English colour words ("Light Grey",
  // "Gold brown") rendered as a colour picker on a Slovenian product page,
  // reported by the owner and fixed in catalog/pola.ts. Nothing found them
  // before that, because English on a Slovenian page looks like content.
  //
  // The allowlist is deliberately a list of PROPER NAMES rather than a
  // language rule, so a new English word fails here and has to be argued for
  // by adding it — which is the point. Two things are on it:
  //
  //   * the acrylic manufacturer's shell-finish names, which identify a
  //     particular marbled sheet on an order and which nothing here knows the
  //     colour of (see CABINET_FINISHES for the full argument);
  //   * "swim spa", which is the Slovenian trade term for the product — it is
  //     what the category is called here, in the nav and in the collection.
  const ALLOWED = new Set([
    "midnight", "canyon", "silver", "white", "marble", "oyster", "opal",
    "gypsum", "ocean", "wave", "mediterranean", "sunset", "odyssey",
    "swim", "spa",
  ]);
  const ENGLISH =
    /\b(the|and|with|for|from|your|our|this|that|have|will|colour|color|white|black|grey|gray|brown|gold|silver|light|dark|blue|green|marble|wave|ocean|sunset|midnight|canyon|opal|oyster|gypsum|mediterranean|odyssey|delivery|price|contact|about|home|search|cart|checkout|submit|close|open|next|page|swim|spa)\b/gi;
  /**
   * ⚠️ HOMOGRAPHS, MATCHED CASE-SENSITIVELY. "red" was in the list above and
   * it is an ordinary Slovenian noun — vrstni red, "sequence" — so widening
   * this audit from two hard-coded routes to the shop's real ones immediately
   * failed it on /trgovina and /primerjava for a word that is correct
   * Slovenian on both pages.
   *
   * Dropping it entirely would give up the check that catches an untranslated
   * shell colour, which is exactly what the colour words in the list are for.
   * A swatch label is capitalised and the Slovenian noun in running text is
   * not, so the capital carries the distinction — and a sentence that happens
   * to open with "Red" is a false positive worth having over a silent one.
   */
  const HOMOGRAPHS = /\b(Red)\b/g;
  {
    const text = body
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]*>/g, " ");
    const found = new Set<string>();
    for (const m of text.matchAll(ENGLISH)) {
      const w = m[0].toLowerCase();
      if (!ALLOWED.has(w)) found.add(m[0]);
    }
    for (const m of text.matchAll(HOMOGRAPHS)) {
      if (!ALLOWED.has(m[0].toLowerCase())) found.add(m[0]);
    }
    for (const w of found) problems.push("untranslated English in visible copy: " + w);
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
  for (const key of Object.keys(SHOPS)) {
    it(key + " passes the structural audit on every route", async () => {
      const found: string[] = [];
      // ⚠️ THE LIST USED TO BE `["/", "/savne", "/kontakt"]`, HARD-CODED
      // OUTSIDE THE LOOP — and "/savne" is the DELETED sauna shop's collection
      // slug. bazen has no such route, so this audit spent its whole life
      // rendering a 404 page ("Te strani ni.") and reporting it structurally
      // sound. A test that surveys "every route" was surveying two, one of
      // which did not exist, and it would have gone on doing that for a second
      // shop too because the list could not know what that shop's routes were.
      //
      // Derived from the shop, like the product list below it already is.
      // Every product page the shop serves, not just the flagship. A shop
      // with a catalogue has most of its pages here, and they are generated
      // rather than hand-written — exactly the ones a structural slip would
      // reach nine at a time.
      const shop = SHOPS[key]!;
      const content = CONTENT[key]!;
      const routes = [
        "/",
        shop.routeSlugs["/products"],
        shop.routeSlugs["/contact"],
        // Optional routes: a shop without them contributes nothing here.
        ...[shop.routeSlugs["/finder"], shop.routeSlugs["/compare"]].filter(
          (r): r is string => typeof r === "string",
        ),
        ...(content.collections ?? []).map((c) => c.path),
      ];
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
    "/odstop-od-pogodbe", "/ogled-lokacije", "/kosarica",
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
        // anything genuinely empty is not a fragment link. "#top" is the
        // HTML-spec special case — with no matching element it scrolls to
        // the document start, which is exactly what the back-to-top disc
        // uses it for — so it resolves by definition, not by id.
        .filter((t) => t !== "" && t !== "top" && !ids.has(t));
      expect(dead, path + " has dead fragments: " + dead.join(", ")).toEqual([]);
    });
  }

  /**
   * CROSS-PAGE fragments, which the sweep above cannot see: the home page's
   * guide cards deep-link to sections ON /vodniki, and the id at the far end
   * is DERIVED from the section's heading — reword the heading and the id
   * changes out from under every card pointing at it, silently, the browser
   * simply not moving. This renders both pages and holds them together.
   */
  /**
   * ⚠️ THE CARDS POINT AT PAGES NOW, AND THIS TEST USED TO ENCODE THE OLD
   * MECHANISM. It asserted a fragment into /vodniki and walked that page's ids
   * — correct while the three guides were three sections of one page, and it
   * failed the moment they became three URLs, which is exactly what a test
   * pinned to a mechanism does.
   *
   * The contract is the same as it always was and survives the next change of
   * mechanism: every card on the home page lands somewhere that EXISTS. So it
   * follows each card's href through the router and requires a 200 with the
   * guide's own h1 on it — a 404, a redirect loop or a page that renders
   * something else all fail.
   */
  it("lands every home guide card on a guide that exists", async () => {
    const get = (path: string) =>
      handleRequest(
        new Request("https://trgovina.workers.dev" + path + "?shop=bazen", {
          headers: { host: "trgovina.workers.dev" },
        }),
      );
    const home = await get("/").text();
    const targets = [...home.matchAll(/href="(\/vodnik\/[^"?]+)/g)].map((m) => m[1]!);
    expect(targets.length, "the home page carries no guide cards").toBe(GUIDE_PAGES.length);
    for (const t of targets) {
      const res = get(t);
      expect(res.status, t + " does not resolve").toBe(200);
      const html = await res.text();
      const guide = GUIDE_PAGES.find((g) => t.endsWith("/" + g.slug));
      expect(guide, t + " matches no guide").toBeTruthy();
      expect(html, t + " does not render its own heading").toContain(guide!.h1);
    }
    // And an unknown guide is a 404, not a page that renders something else.
    expect(get("/vodnik/ni-tega-vodnika").status).toBe(404);
  });
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

  it("names the model on the form and puts it in the subject line", async () => {
    const html = await get("/kontakt?shop=bazen&model=veliki-230");
    // ⚠️ THE ASSERTION MOVED WITH THE DEVICE. This used to read the contact
    // block's "Povpraševanje za <strong>BAZEN 230</strong>", which was
    // deleted as a duplicate the moment the enquiry FORM began stating the
    // same thing 600px lower. The contract is unchanged and the new place is
    // the stronger one: the name is now on the card attached to the control
    // that submits it, not on a reassurance beside it.
    expect(html).toContain('class="st-enq-about-m"');
    expect(html).toContain("BAZEN 230");
    expect(html).toContain("subject=" + encodeURIComponent("Povpraševanje — BAZEN 230"));
  });

  it("is the ordinary page with no parameter", async () => {
    const html = await get("/kontakt?shop=bazen");
    expect(html).not.toContain('class="st-enq-about"');
    expect(html).toContain("subject=" + encodeURIComponent("Povpraševanje"));
    // The form itself is unconditional: /kontakt without a model is still
    // the page you send an enquiry from.
    expect(html).toContain('class="st-enq"');
  });

  it("ignores a slug that names nothing", async () => {
    const html = await get("/kontakt?shop=bazen&model=this-is-not-a-model");
    expect(html).not.toContain('class="st-enq-about"');
    expect(html).not.toContain("this-is-not-a-model");
  });

  it("never echoes the parameter, whatever it says", async () => {
    const html = await get("/kontakt?shop=bazen&model=" + encodeURIComponent('"><script>x</script>'));
    expect(html).not.toContain("<script>x");
    expect(html).not.toContain("&lt;script&gt;x");
    expect(html).not.toContain('class="st-enq-about"');
  });

  it("keeps one canonical URL whatever the parameter", async () => {
    const shop = SHOPS["bazen"]!;
    for (const u of ["/kontakt?shop=bazen", "/kontakt?shop=bazen&model=veliki-230"]) {
      const html = await get(u);
      expect(html).toContain('rel="canonical" href="' + shop.siteUrl + '/kontakt"');
    }
  });

  /**
   * ⚠️ THE CONTRACT IS "THE MODEL REACHES THE ENQUIRY", NOT "A LINK CARRIES
   * model= IN ITS href".
   *
   * This asserted the literal query string, which passed only because the
   * sticky bar's CTA was an anchor built by hand — and that anchor was the
   * defect: it carried the model and NOTHING ELSE, so pressing it discarded
   * both colours, both configuration groups and every extra, landing on an
   * enquiry page quoting the base price while the bar above it showed the
   * configured one. The bar is now a submit button on the same form the
   * column's CTA submits, so the model travels as the form's own hidden
   * input, together with everything else the visitor chose.
   *
   * So the test asks what actually has to be true: the enquiry form carries
   * this model, and the control that submits it exists. Written as the
   * contract, it survives the next change of mechanism — and it would have
   * caught the anchor, which satisfied the old literal while losing the order.
   */
  it("is emitted by every product page", async () => {
    for (const slug of ["veliki-230", "swim-580-maxi"]) {
      const html = await get("/bazen/" + slug + "?shop=bazen");
      expect(html, slug + " loses its model on the enquiry").toContain(
        '<input type="hidden" name="model" value="' + slug + '">',
      );
      // And the bar's control submits THAT form rather than routing past it.
      expect(html, slug + "'s sticky bar does not submit the enquiry").toContain(
        '<button type="submit" form="st-pdp-form"',
      );
      expect(html, slug + " has no enquiry form").toContain('<form id="st-pdp-form"');
    }
  });
});

/**
 * STRUCTURED DATA NEVER ASSERTS A PLACEHOLDER.
 *
 * organizationJsonLd used to emit the config verbatim, so every page on the
 * site told Google — in machine-readable form, ingested into the knowledge
 * panel — that the business telephone is +386 00 000 000 and its registered
 * address is "TODO, 0000 TODO". It is the same error as an Offer carrying a
 * price nobody set, and it is invisible on the page, which is exactly why it
 * survived: nothing a person looks at shows it.
 */
describe("structured data says only what is known", () => {
  const PATHS = ["/", "/trgovina", "/masazni-bazeni", "/bazen/veliki-230", "/kontakt", "/pogosta-vprasanja"];

  const ldOn = async (path: string) => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev" + path + "?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    const html = await res.text();
    return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1]!.replace(/\\u003c/g, "<")));
  };

  for (const path of PATHS) {
    it("carries no placeholder on " + path, async () => {
      const flat = JSON.stringify(await ldOn(path));
      for (const bad of ["TODO", "00 000 000", '"0000"']) {
        expect(flat, path + " publishes " + bad + " to a search engine").not.toContain(bad);
      }
    });
  }

  it("still says who the shop is", async () => {
    const org = (await ldOn("/")).find((n) => n["@type"] === "Organization");
    expect(org).toBeTruthy();
    expect(org.name).toBe(SHOPS["bazen"]!.name);
    expect(org.url).toBe(SHOPS["bazen"]!.siteUrl);
  });
});

/**
 * The rich results a SERP is built from.
 *
 * Breadcrumbs replace the raw URL path in the result, an ItemList is what
 * lets a category page compete as a category, and FAQPage is the accordion.
 * None of them is content — they are the same facts the page already renders,
 * said in the form a crawler can use — which is why they are cheap and why
 * their absence was worth finding.
 */
describe("rich results", () => {
  const ldOn = async (path: string) => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev" + path + "?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    const html = await res.text();
    return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1]!.replace(/\\u003c/g, "<")));
  };

  it("gives a product page a trail that ends on itself with no link", async () => {
    const bc = (await ldOn("/bazen/veliki-230")).find((n) => n["@type"] === "BreadcrumbList");
    expect(bc).toBeTruthy();
    const items = bc.itemListElement;
    // ⚠️ "Domov" LEADS, AND IT DID NOT USED TO. The hub, the finder, the
    // guides and every editorial page all start their trail at the root; the
    // product pages and the collections started at the hub, so the crumb a
    // searcher sees under the two most commercial result types was missing
    // its first step.
    expect(items.map((i: { name: string }) => i.name)).toEqual([
      "Domov", "Trgovina", "Masažni bazeni", "BAZEN 230",
    ]);
    expect(items.map((i: { position: number }) => i.position)).toEqual([1, 2, 3, 4]);
    // Google's own guidance: the current page carries no item URL.
    expect(items[items.length - 1].item).toBeUndefined();
    expect(items[0].item).toBe(SHOPS["bazen"]!.siteUrl + "/");
  });

  // ⚠️ THE ENTRIES NEST A PRODUCT NOW, and this test used to read el.url.
  //
  // A ListItem carrying only a url is the summary-page pattern, which makes a
  // category page eligible for nothing; the all-in-one pattern nests the whole
  // Product and is what lets /masazni-bazeni and /swim-spa — two of the three
  // pages this shop is built to rank — compete as categories. So the test
  // asserts the richer shape rather than the shape that happened to ship: a
  // name, an offer with a price and a currency, and a URL that names a real
  // product. Reading el.url again would pass on an empty item.
  it("lists a collection's models as products, each at a real URL", async () => {
    const list = (await ldOn("/masazni-bazeni")).find((n) => n["@type"] === "ItemList");
    expect(list).toBeTruthy();
    expect(list.numberOfItems).toBe(list.itemListElement.length);
    expect(list.numberOfItems).toBeGreaterThan(1);
    const content = CONTENT["bazen"]!;
    for (const el of list.itemListElement) {
      const item = el.item;
      expect(item, "a ListItem with no nested item asks Google for nothing").toBeTruthy();
      expect(item["@type"]).toBe("Product");
      expect(item.name).toBeTruthy();
      expect(item.offers?.price).toBeTruthy();
      expect(item.offers?.priceCurrency).toBeTruthy();
      // The nested copies carry no @context: it belongs on the document node.
      expect(item["@context"]).toBeUndefined();
      const slug = String(item.url).split("/").pop();
      expect(
        (content.pdps ?? [content.pdp]).some((p) => p.slug === slug),
        item.url + " names no product",
      ).toBe(true);
    }
  });

  it("offers the FAQ's questions, and only ones the page renders", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/pogosta-vprasanja?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    const html = await res.text();
    const faq = (await ldOn("/pogosta-vprasanja")).find((n) => n["@type"] === "FAQPage");
    expect(faq).toBeTruthy();
    expect(faq.mainEntity.length).toBeGreaterThan(1);
    for (const q of faq.mainEntity) {
      // Markup whose answer a visitor cannot read is a structured-data
      // violation, so every question and answer has to be ON the page.
      expect(html, "question not rendered: " + q.name).toContain(q.name);
      expect(html, "answer not rendered for: " + q.name).toContain(q.acceptedAnswer.text);
    }
  });
});

describe("figure blocks", () => {
  it("names only slots the panel manages, so a typo cannot become a permanent fallback", async () => {
    // A figure's slot resolves through /media/site/<slot>.webp, which serves
    // the legacy fallback for REGISTERED slots and 404s for anything else —
    // silently, because the image is decorative. The registry is the truth.
    const { PAGES } = await import("../content/pages");
    const { siteImageByKey } = await import("../admin/site-images");
    let figures = 0;
    for (const page of PAGES) {
      for (const b of page.blocks) {
        if (b.kind !== "figure") continue;
        figures++;
        expect(
          siteImageByKey("site/" + b.slot + ".webp"),
          page.key + " names unregistered figure slot: " + b.slot,
        ).toBeTruthy();
      }
    }
    // The count pins the four placements; a fifth page adding one updates it.
    expect(figures).toBe(4);
  });

  it("stays out of the page's own table of contents", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/o-nas?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    const html = await res.text();
    // Two figures render on /o-nas…
    expect((html.match(/st-page-fig-img/g) ?? []).length).toBe(2);
    // …and the TOC lists only headed sections, no figure entries.
    const toc = (html.match(/<nav class="st-page-toc"[\s\S]*?<\/nav>/) ?? [""])[0];
    expect(toc).toContain("Kaj delamo");
    expect(toc).not.toContain("figure");
  });
});
