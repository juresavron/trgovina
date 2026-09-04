/**
 * The admin panel's HTML.
 *
 * Deliberately NOT the studio theme — this is a back office, and a tool that
 * dresses up as its own shopfront invites people to treat it as a page to
 * design. One stylesheet, system fonts, no imagery but the photographs
 * themselves, and it renders in a single pass with no framework.
 *
 * It does share the shop's VOCABULARY, and only that: the mark from
 * themes/studio/brand.ts, the same near-black ink, the same two radii. The
 * greys are the studio theme's own tokens rather than new ones, which matters
 * for a reason beyond taste — those values carry computed contrast ratios
 * (--ink-mute is 5.17:1 on white and 4.54:1 on the panel grey, both above the
 * 4.5:1 AA floor the European Accessibility Act makes a legal requirement
 * here). Inventing a fresh grey means inventing a fresh ratio nobody checked.
 *
 * Controls are 44px tall and never smaller than 24x24 (WCAG 2.2 SC 2.5.8),
 * every focusable thing has a visible focus ring, and every hover transition
 * is dropped under prefers-reduced-motion.
 *
 * ⚠️ THIS FILE IS THE PAGES, AND ONLY THE PAGES. The stylesheet, the document
 * wrapper and the nav are in design.ts; the two browser scripts are in
 * client.ts. It held all three and ran to 2,491 lines, of which the pages —
 * the part anybody opens this file to change — were under a thousand.
 */

import { esc } from "../render/sections";
import { brandMark } from "../themes/studio/brand";
import { shotLabel } from "./shots";
import { SMART_JS, UPLOAD_JS } from "./client";
import { doc, NAV_GROUPS } from "./design";

export function shell(title: string, body: string, who: string, current = ""): string {
  const nav = NAV_GROUPS.map(
    (g) =>
      '<div class="sidegrp"><h2>' + esc(g.title) + "</h2>" +
      g.items
        .map(
          ([k, href, label, d]) =>
            '<a href="' + href + '"' +
            (k === current ? ' aria-current="page"' : "") + ">" +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
            'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ' +
            'aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>' +
            "<span>" + esc(label) + "</span></a>",
        )
        .join("") +
      "</div>",
  ).join("");

  return doc(
    title,
    // ⚠️ THE SWITCH IS A SIBLING OF .shell, not a child, because the drawer is
    // opened by `.navsw:checked ~ .shell .side` and CSS has no parent
    // selector. Move it inside and the menu stops opening, silently, with
    // scripting on or off.
    (who
      ? '<input class="navsw" type="checkbox" id="navsw" ' +
        'aria-label="Odprite ali zaprite meni">'
      : "") +
    '<div class="shell">' +
      '<header class="top">' +
      (who
        ? '<label class="burger" for="navsw">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
          'stroke-width="1.8" stroke-linecap="round" aria-hidden="true" ' +
          'focusable="false"><path d="M4 7h16M4 12h16M4 17h16"/></svg></label>'
        : "") +
      // The word is in a span of its own so a narrow bar can drop it without
      // dropping the link's accessible name with it.
      '<a class="home" href="/admin">' + brandMark("panel", "mark") +
      "<span>Nadzorna plošča</span></a>" +
      '<div class="acct">' +
      (who ? '<span class="who">' + esc(who) + "</span>" : "") +
      '<form method="post" action="/admin/logout">' +
      '<button class="out" type="submit">Odjava</button></form>' +
      "</div>" +
      "</header>" +
      (who
        ? '<label class="scrim" for="navsw" aria-hidden="true"></label>' +
          '<nav class="side" aria-label="Razdelki">' + nav + "</nav>"
        : "") +
      '<main class="main"><div class="wrap">' + body + "</div></main>" +
    "</div>",
  );
}

/**
 * A COLOUR KIND'S DROP ZONE — the whole way a colour gets into this shop.
 *
 * ⚠️ IT IS THE ONLY WAY IN, AND THAT IS THE POINT. Nothing here types a
 * colour's name: the name is the filename, so a tile cannot exist without a
 * photograph behind it. Drop the set the shop can actually show and the set
 * the shop actually shows is what customers see — no list to keep in step
 * with a folder of samples, because they are the same act.
 *
 * ⚠️ THE AI UPSCALE IS HERE ON THE OWNER'S INSTRUCTION, against the advice
 * given when they asked. See the note at the checkbox: the enhancer redraws
 * rather than sharpens, and on marbled acrylic a redraw is a new pattern in
 * approximately that colour. It stays guarded — only a sample narrower than
 * the 400px slot is ever sent, so on a normal photograph or screen capture
 * the box does nothing at all.
 *
 * Mounted by SMART_JS via mount(prefix, scope) — the same probe, crop, WebP
 * and upload pipeline the site uploader runs, pointed at the colour
 * catalogue. The prefix is what binds the markup to the script.
 */
export function finishDropCard(
  prefix: "bv" | "ob",
  what: string,
  ai: boolean,
): string {
  return (
    '<div class="card">' +
    '<div class="drop" id="' + prefix + '-drop">' +
    '<label for="' + prefix + '-f">Izberite ali povlecite vse vzorce ' +
    esc(what) + " naenkrat</label>" +
    '<input id="' + prefix + '-f" type="file" multiple ' +
    'accept="image/webp,image/jpeg,image/png,image/avif">' +
    '<p class="fmeta">Ena datoteka = ena barva. Ime vzamemo iz imena ' +
    "datoteke; če to ničesar ne pove, barvo poimenuje umetna inteligenca po " +
    "odtenku, ki ga vidi. Vzorec sami poiščemo na sliki, ga postavimo na " +
    "sredino in shranimo 400 × 400 px.</p>" +
    "</div>" +
    // ⚠️ ON THE OWNER'S EXPLICIT INSTRUCTION, AGAINST THE ADVICE ABOVE IT.
    //
    // This zone shipped without an upscale on purpose, and the argument has
    // not changed: the enhancer REDRAWS a picture larger, so on a marbled
    // acrylic sample what comes back is a new pattern in roughly that
    // colour. A swatch is the one slot on this site where "not necessarily
    // the same photograph any more" is a wrong answer rather than a
    // trade-off, because somebody orders a 7,000 EUR shell from it. That was
    // put to the owner, who asked for it anyway; it is their shop and their
    // call, so the control is here — labelled with what it actually does,
    // not with a euphemism.
    //
    // It stays GUARDED, exactly as it is everywhere else: maybeEnhance()
    // fires only when the source is narrower than the slot's 400px. A
    // photograph or a screen capture of a colour chart is almost always
    // wider than that, so for most files this box is a no-op — which is the
    // honest outcome, since there is nothing to add to a sample that already
    // has more pixels than the square it is stored in.
    (ai
      ? '<label class="ai-opt" for="' + prefix + '-ai">' +
        '<input type="checkbox" id="' + prefix + '-ai" checked>' +
        "<span>Vzorce prenovi z umetno inteligenco</span></label>" +
        '<p class="note-ai">Model vsak vzorec PONOVNO NARIŠE — tudi tistega, ' +
        "ki je že dovolj velik. Pri marmoriranem akrilu to ni ostrejša " +
        "fotografija iste barve, ampak nov vzorec v približno tej barvi. " +
        "Vsakega po nalaganju poglejte in ga primerjajte z vzorcem v roki: " +
        "ime in odtenek gresta na naročilnico. Če model ne vrne boljše slike, " +
        "obdržimo vašo. Poravnavo in enako velikost naredimo brez modela — " +
        "vzorec sami poiščemo na sliki, ga postavimo na sredino in shranimo " +
        "400 × 400 px, zato so ploščice enake ne glede na to kljukico.</p>"
      : "") +
    '<p class="stline" id="' + prefix + '-stwrap" role="status">' +
    '<span id="' + prefix + '-st"></span></p>' +
    '<ul class="picked" id="' + prefix + '-list"></ul>' +
    "</div>"
  );
}

/**
 * THE PICTURES THE STOREFRONT RENDERS, on their own page.
 *
 * ⚠️ THIS USED TO BE THE BOTTOM OF THE DASHBOARD, and it is why the dashboard
 * needed splitting. Six model tiles, a blog card, colours, enquiries, reviews,
 * a smart uploader, two colour drop zones and every managed slot on the
 * storefront — one scroll, no headings a reader could jump between, and the
 * thing with a customer waiting at the end of it (an enquiry) below a card
 * about blog posts.
 *
 * What belongs together is here: everything that puts a picture on the public
 * site, in the order the work happens — drop a batch and let it sort itself,
 * or open one slot and replace it by hand.
 */
export function sitePage(shopKey: string, who: string, site: SiteSlot[]): string {
  return shell(
    "Slike strani",
    '<div class="head"><h1>Slike strani</h1>' +
      '<p class="lede">Fotografije, ki jih trgovina pokaže na svojih straneh. ' +
      "Naložite jih po več hkrati ali odprite posamezno mesto in jo zamenjajte." +
      "</p></div>" +
      // THE SMART UPLOADER — the owner's flow, in the owner's words: "I drop
      // 10 pictures and AI upscales and checks what on the image and assign
      // to correct section." The model CLASSIFIES (admin/assign.ts) and the
      // browser then runs the exact per-slot pipeline the single pages run —
      // crop to the slot's own frame, WebP, the guarded upscale — so this
      // card adds a router in front of the machinery, not a second copy of
      // it. The per-slot pages below remain the manual override.
      "<h2>Slike strani — pametno nalaganje</h2>" +
      '<div class="card">' +
      '<div class="drop" id="sm-drop">' +
      '<label for="sm-f">Izberite ali povlecite več slik naenkrat</label>' +
      '<input id="sm-f" type="file" multiple ' +
      'accept="image/webp,image/jpeg,image/png,image/avif">' +
      '<p class="fmeta" id="sm-meta">AI vsako fotografijo pogleda, jo razporedi ' +
      "na pravo mesto spodaj — naslovna, kategoriji, zgodba, vodniki, galerija — " +
      "jo obreže na pravo razmerje in naloži. Spodaj piše, kaj je šlo kam.</p>" +
      "</div>" +
      '<label class="ai-opt" for="sm-ai"><input type="checkbox" id="sm-ai" checked>' +
      "<span>Premajhne slike povečaj z umetno inteligenco</span></label>" +
      '<p class="note-ai">Velja za slike, ožje od okvirja, v katerega gredo. ' +
      "Model sliko PONOVNO NARIŠE večjo: rezultat je oster, ni pa nujno več " +
      "ista fotografija — razporejene slike po nalaganju preglejte. Če model " +
      "ne vrne večje slike, obdržimo vašo.</p>" +
      '<p class="stline" id="sm-stwrap" role="status"><span id="sm-st"></span></p>' +
      '<ul class="picked" id="sm-list"></ul>' +
      "</div>" +

      // ⚠️ THE COLOUR DROP ZONES USED TO BE HERE, and being here is what made
      // them unfindable. Somebody who wants to put their colours in goes to
      // the page called Barve; this page is called Slike strani and is about
      // the storefront's photographs. So the zones moved to /admin/barve,
      // directly above the list they change, and this line is the signpost
      // left behind for anyone who lands here first.
      "<h2>Barve školjke in obloge</h2>" +
      '<div class="card row-card">' +
      "<p>Vzorce barv naložite na svoji strani — vse naenkrat, ime barve " +
      "preberemo iz imena datoteke.</p>" +
      '<a class="btn btn--ghost" href="/admin/barve">Naložite barve</a>' +
      "</div>" +

            // THE SITE'S OWN PICTURES, which had no way in here at all — so the
      // heaviest image on the storefront (a 2.7 MB PNG hero) was the one
      // picture the panel's convert-to-WebP promise never reached.
      // GROUPED, IN THE ORDER THE SLOTS APPEAR ON THE PAGE. The groups are
      // derived from the slots rather than listed here, so a new slot lands in
      // its section without this file knowing about it — and a new SECTION
      // appears by naming it once, in site-images.ts, where the slot is
      // declared. Set preserves first-seen order, which is already the order
      // SITE_IMAGES is written in.
      [...new Set(site.map((x) => x.group))]
        .map(
          (g) =>
            "<h2>" + esc(g) + "</h2>" +
            '<ul class="models">' +
            site
              .filter((x) => x.group === g)
              .map(
                (x) =>
                  '<li class="model"><a href="/admin/site/' + esc(x.stem) + '">' +
                  '<img class="cover" src="' + esc(x.src) + '" alt="" loading="lazy" ' +
                  'width="232" height="174">' +
                  '<span class="meta"><span class="name">' + esc(x.label) + "</span>" +
                  '<span class="count">' + esc(x.note) + "</span></span>" +
                  "</a></li>",
              )
              .join("") +
            "</ul>",
        )
        .join("") +
      '<p class="key">Ključ trgovine: <code>' + esc(shopKey) + "</code></p>" +
      // ⚠️ THE ZONE AND ITS SCRIPT SHIP TOGETHER, ALWAYS.
      //
      // They did not, and the uploader on this page was dead. The smart
      // uploader began life at the bottom of the dashboard; when it moved
      // here the markup came and the script tag stayed behind, so this page
      // rendered a drop zone that no code was listening to. The input is not
      // inside a form — the script IS the submit — so picking files did
      // exactly nothing, silently, with the page looking entirely normal.
      // See the invariant test in panel.test.ts.
      "<script>" + SMART_JS + "</script>",
    who,
    "slike",
  );
}

/**
 * The banner that says what just happened.
 *
 * ⚠️ BOTH VARIANTS ANNOUNCE, and only one of them used to.
 *
 * Every notice in this panel arrives the same way: the handler redirects, the
 * browser loads a fresh page, and the banner is sitting at the top of it. The
 * failure carried role="alert" for exactly the reason given on loginPage — a
 * screen-reader user is returned to a page that looks identical to the one
 * they left and told nothing. The success case is the same page and the same
 * silence. Somebody deletes a photograph, the list comes back one row shorter,
 * and the only confirmation that the delete happened at all is a green bar
 * they were never told about.
 *
 * So the failure keeps role="alert" (assertive: it interrupts) and the success
 * gets role="status" (polite: it waits its turn). Both are announced.
 */
export function noticeHtml(notice?: { kind: "ok" | "err"; text: string }): string {
  if (!notice) return "";
  return (
    '<p class="note note--' + notice.kind + '" role="' +
    (notice.kind === "err" ? "alert" : "status") + '">' + esc(notice.text) + "</p>"
  );
}

/**
 * The login screen.
 *
 * No chrome bar: a header whose only links are the page you are already on and
 * a sign-out you cannot use is furniture, and it would be the first thing a
 * screen reader read out.
 *
 * role="alert" on the failure, because the message replaces the page after a
 * submit — without it a screen-reader user is returned to a form that looks
 * identical to the one they just sent and told nothing.
 */
export function loginPage(error?: string): string {
  return doc(
    "Prijava",
    '<main class="login"><div class="login-in">' +
      '<p class="brand">' + brandMark("login", "mark") +
      "<b>Masažni bazeni Vrelec</b></p>" +
      (error ? '<p class="note note--err" role="alert">' + esc(error) + "</p>" : "") +
      '<form method="post" action="/admin/login" class="card">' +
      "<h1>Prijava</h1>" +
      '<p class="lede">Urejanje fotografij izdelkov.</p>' +
      '<div class="field"><label for="em">E-naslov</label>' +
      '<input id="em" name="email" type="email" autocomplete="username" ' +
      'autocapitalize="none" spellcheck="false" required autofocus></div>' +
      '<div class="field"><label for="pw">Geslo</label>' +
      '<input id="pw" name="password" type="password" ' +
      'autocomplete="current-password" required></div>' +
      '<button class="btn" type="submit">Prijava</button>' +
      '<p class="hint">Račune ureja Supabase. Pozabljeno geslo ponastavite tam. ' +
      "Prijava velja eno uro.</p>" +
      "</form></div></main>",
  );
}

/**
 * A path that does not exist, for somebody who is already signed in.
 *
 * ⚠️ THIS USED TO RENDER THE LOGIN FORM. A signed-in admin who mistyped a URL
 * was shown a password box, which reads as "you have been signed out" — so the
 * honest response to it is to sign in again, and the honest conclusion after
 * that works is that the panel is unreliable.
 */
export function notFoundPage(message: string, who: string): string {
  return shell(
    "Ni najdeno",
    '<div class="head"><h1>' + esc(message) + "</h1>" +
      '<p class="lede">Naslov ne obstaja ali pa se je model preimenoval.</p></div>' +
      '<p><a class="btn btn--ghost" href="/admin">Nazaj na modele</a></p>',
    who,
  );
}

export function notConfiguredPage(missing: string[]): string {
  // Both remaining settings are PUBLIC values that live in wrangler.jsonc and
  // ship with the code. If this page is ever seen in production, something was
  // deleted from that file — there is no secret to forget to set.
  return doc(
    "Ni nastavljeno",
    '<main class="login"><div class="login-in">' +
      '<p class="brand">' + brandMark("cfg", "mark") +
      "<b>Masažni bazeni Vrelec</b></p>" +
      '<div class="card">' +
      "<h1>Nadzorna plošča ni nastavljena</h1>" +
      '<p class="lede">V <code>wrangler.jsonc</code> pod <code>vars</code> manjka:</p>' +
      "<ul>" + missing.map((m) => "<li><code>" + esc(m) + "</code></li>").join("") + "</ul>" +
      '<p class="hint">To sta javna podatka, ne skrivnosti — nastavita se v kodi ' +
      "in objavita z naslednjo objavo.</p>" +
      "</div></div></main>",
  );
}

/* ---- dashboard ------------------------------------------------------- */

export interface ModelLink {
  shop: string;
  slug: string;
  name: string;
  count: number;
  /** The first photograph, shown as the card's cover. Absent until there is one. */
  cover?: string | undefined;
}

/**
 * "1 fotografija", but "2 fotografiji" and "5 fotografij".
 *
 * Slovenian counts in four forms and this line used the genitive plural for
 * everything above one, so a model with two photographs read "2 fotografij".
 * Same class of error as modelCount() in content/bazen.ts and the same
 * consequence: getting your own numerals wrong reads as machine translation.
 *
 *   1        fotografija   (singular)
 *   2        fotografiji   (dual)
 *   3, 4     fotografije   (plural)
 *   5 and up fotografij    (genitive plural)
 */
export function photoCount(n: number): string {
  if (n === 0) return "brez fotografij";
  // The teens are the exception that has to be tested FIRST: 11 to 14 all take
  // the genitive plural even though they end in 1, 2, 3 and 4. Everything else
  // follows the last digit, so 21 is a singular and 22 a dual.
  // Last two digits, matched exactly: 22 and 94 are compounds and take the
  // genitive plural — a units-digit rule would print "22 fotografiji".
  const t = n % 100;
  if (t === 1) return n + " fotografija";
  if (t === 2) return n + " fotografiji";
  if (t === 3 || t === 4) return n + " fotografije";
  return n + " fotografij";
}

export interface SiteSlot {
  stem: string;
  label: string;
  note: string;
  /** The /media path to preview, whether it has been replaced yet or not. */
  src: string;
  /**
   * Which part of the site this belongs to.
   *
   * ⚠️ THE LIST OUTGREW A FLAT WALL. It was three slots and is fourteen, and
   * fourteen identical cards under one heading is a wall to scan rather than a
   * structure to navigate — an operator looking for the gallery strip should
   * not have to read six labels called "Galerija — slika n" to find out
   * whether they are in the right place. The heading answers it before they
   * start reading.
   */
  group: string;
}

export function indexPage(
  shopName: string,
  shopKey: string,
  models: ModelLink[],
  who = "",
  site: SiteSlot[] = [],
): string {
  // ⚠️ `site` IS ACCEPTED AND NOT RENDERED. The site pictures, the smart
  // uploader and the two colour drop zones used to sit at the bottom of this
  // page, which made the dashboard a scroll of seven unrelated jobs — a
  // product list, a blog card, colours, enquiries, reviews, an uploader and
  // every managed slot on the storefront. They live on /admin/slike now
  // (sitePage below). The parameter stays so the route does not have to
  // change shape twice; siteSlots() is cheap and the next caller may want it.
  void site;
  return shell(
    "Nadzorna plošča",
    '<div class="head"><h1>' + esc(shopName) + "</h1>" +
      '<p class="lede">Kar je treba urediti, po vrsti: najprej ljudje, ki čakajo ' +
      "odgovor, potem vsebina.</p></div>" +
      // ⚠️ ENQUIRIES FIRST, ABOVE THE MODELS. Everything else on this page is
      // work the operator chooses to do; an enquiry is a person who wrote in
      // and is waiting. It sat fourth, under the blog, because the sections
      // were added in the order they were built rather than in the order they
      // matter. The nav in shell() is ordered the same way for the same
      // reason.
      "<h2>Povpraševanja</h2>" +
      '<div class="card row-card">' +
      "<p>Kar so ljudje oddali prek obrazca na strani Kontakt.</p>" +
      '<a class="btn btn--ghost" href="/admin/povprasevanja">Odpri povpraševanja</a>' +
      "</div>" +

      // The site slots below had a heading and the models above them did not,
      // so the page's outline claimed everything before "Slike strani"
      // belonged to the h1. Two lists, two headings, and a screen reader can
      // jump between them.
      "<h2>Modeli</h2>" +
      '<ul class="models">' +
      models
        .map(
          (m) =>
            '<li class="model"><a href="/admin/' + esc(m.shop) + "/" + esc(m.slug) + '">' +
            (m.cover
              ? '<img class="cover" src="/media/' + esc(m.cover) +
                '" alt="" loading="lazy" width="232" height="174">'
              : '<span class="cover--none">' + brandMark("m-" + m.slug, "mark") +
                "</span>") +
            '<span class="meta"><span class="name">' + esc(m.name) + "</span>" +
            '<span class="count">' + photoCount(m.count) + "</span></span>" +
            "</a></li>",
        )
        .join("") +
      "</ul>" +

      // THE POSTS, which had no way in from here at all. The editor was
      // reachable only by typing /admin/blog, which means it was reachable
      // only by the person who wrote it.
      //
      // It sits between the models and the site pictures because that is how
      // often each is touched: photographs most days, a post now and then, a
      // site slot almost never. And it is a peer of both, not a subordinate —
      // the panel manages three things now, and the dashboard should say three.
      //
      // ⚠️ THE SENTENCE IS THERE BECAUSE THE RULE IS DIFFERENT HERE. Every
      // other change this panel makes waits for the next deploy, and the model
      // page says so at length. A post does not. An operator who has learned
      // "nothing I do here shows up today" will publish one and then go
      // looking for the deploy button.
      "<h2>Blog</h2>" +
      '<div class="card row-card">' +
      "<p>Zapisi so na spletni strani takoj po objavi.</p>" +
      '<a class="btn btn--ghost" href="/admin/blog">Uredi zapise</a>' +
      "</div>" +

      // MNENJA, and the sentence says the OPPOSITE of the blog's above it —
      // deliberately, and for a reason worth the two lines. A post publishes
      // itself; a review waits for the next update of the site, because it is
      // baked into the build so the launch gate sees it before a customer does
      // (src/content/reviews.generated.ts). An operator who has just learned
      // that posts are instant will assume everything here is.
      // POVPRAŠEVANJA FIRST, and above the reviews, because of how often each
      // is touched: an enquiry is a customer waiting for an answer, a review
      // is an editorial job. The dashboard should open on the thing with
      // somebody on the other end of it.
      "<h2>Barve</h2>" +
      '<div class="card row-card">' +
      "<p>Barve školjke in obloge, ki jih trgovina lahko pokaže. Dodate jih tako, "
        + "da naložite njihove vzorce.</p>" +
      '<a class="btn btn--ghost" href="/admin/barve">Uredi barve</a>' +
      "</div>" +


      "<h2>Mnenja strank</h2>" +
      '<div class="card row-card">' +
      "<p>Prepisana mnenja kupcev. Na strani se pokažejo ob naslednji " +
      "posodobitvi.</p>" +
      '<a class="btn btn--ghost" href="/admin/mnenja">Uredi mnenja</a>' +
      "</div>" +

      '<p class="key">Ključ trgovine: <code>' + esc(shopKey) + "</code></p>",
    who,
  );
}

/**
 * One site image: what is there now, and a form to replace it.
 *
 * Deliberately the same upload component as a model's page — same conversion,
 * same width check, same WebP guarantee — with the ladder suppressed. These
 * keys are FIXED so the storefront can name them in code, which means there
 * is exactly one file per slot and no srcset to describe.
 */
export function siteImagePage(
  stem: string,
  label: string,
  note: string,
  src: string,
  notice?: { kind: "ok" | "err"; text: string },
  who = "",
  /** The frame's own shape, or undefined where it does not crop. */
  ratio?: readonly [number, number],
  /** The largest width worth storing — a cap, never a target to inflate to. */
  maxWidth = 2048,
  /**
   * …EXCEPT on a slot that declares itself exact, where maxWidth stops being
   * a cap and becomes the stored size. Only the colour swatches do, so that
   * one replaced by hand on this page comes out the same 400 × 400 as the
   * fifteen the batch sorter stored. See `exact` on SiteImage.
   */
  exact = false,
  /** Whether GEMINI_API_KEY is set, so the upscale can even be offered. */
  canEnhance = false,
  // No enhance parameter. It used to take one and pass it to the form; a site
  // photograph is never redrawn now, so a caller handing this page the
  // upscaler's availability would be describing something that does not
  // happen. See the note on the form below.
): string {
  return shell(
    label,
    noticeHtml(notice) +
      '<a class="back" href="/admin">← Vsi modeli</a>' +
      '<div class="head"><h1>' + esc(label) + "</h1>" +
      '<p class="lede">' + esc(note) + "</p></div>" +

      "<h2>Trenutna slika</h2>" +
      // The card is the width of the picture it holds — see .now. The inline
      // style this used to carry was the only one in the panel, and it said
      // in an attribute what the one stylesheet says everywhere else.
      '<div class="card now"><img src="' + esc(src) + '" alt="">' +
      '<p class="hint">Nova slika zamenja to na istem naslovu. Na spletni ' +
      "strani se pokaže v nekaj minutah.</p></div>" +

      "<h2>Zamenjaj</h2>" +
      '<form class="card" method="post" action="/admin/site/' + esc(stem) +
      // ⚠️ NO data-enhance HERE, AND THAT IS THE POINT.
      //
      // The upscaler REDRAWS a picture, it does not sharpen one, and the
      // difference does not matter much on a product cut out against a plain
      // sweep — the subject is isolated and the model has little to invent.
      // It matters entirely on a SCENE. The hero is a photograph of a real
      // installation, chosen for how it is framed, and the model handed back
      // a different scene: same tub, moved, cropped to a corner, from a
      // garden that is no longer the same garden.
      //
      // There is a second reason, and it outranks the first. A shop's hero is
      // a claim about what this looks like in a real garden. A generated
      // reconstruction of that photograph is a picture of an installation
      // nobody built, presented as one. UCPD Article 6 is about exactly this
      // kind of assertion, and no amount of upscaling is worth it.
      '/upload" enctype="multipart/form-data" id="up" data-mode="site"' +
      // THE SLOT'S OWN SHAPE, so the browser can crop to it before storing.
      // Measured off the rendered page rather than guessed — see SiteImage.
      // Absent on a frame that shows the picture whole (object-fit: contain),
      // where a crop would throw away the sides for nothing.
      (ratio ? ' data-ar="' + ratio[0] + ":" + ratio[1] + '"' : "") +
      ' data-max="' + String(maxWidth) + '"' +
      (exact ? ' data-exact="1"' : "") + ">" +
      '<div class="up">' +
      '<div class="drop" id="drop">' +
      '<img id="prev" alt="" width="400" height="300">' +
      '<label for="f">Slika (JPEG, PNG, WebP)</label>' +
      '<input id="f" name="file" type="file" ' +
      'accept="image/webp,image/jpeg,image/png,image/avif" required>' +
      '<p class="fmeta" id="fmeta">Sliko lahko tudi povlečete sem. V brskalniku ' +
      "se samodejno pretvori v WebP.</p>" +
      "</div>" +
      '<div class="side">' +
      // No description field, and no hidden one either: this picture is
      // decorative on the storefront and is rendered with an empty alt there,
      // so a sentence collected here would never reach a page. The field that
      // used to sit here disabled — the whole showOneAlt mechanism — went with
      // the per-file description fields it existed to hide.
      // THE RUN'S OWN STATE FIRST. It is the only thing on this column that
      // changes while work is happening, and it used to sit under two
      // paragraphs of standing disclosure.
      '<div class="runst"><progress id="pr" max="100" value="0" hidden ' +
      'aria-label="Napredek nalaganja"></progress>' +
      '<p class="stline" id="stwrap" role="status"><span id="st"></span></p></div>' +
      '<ul class="picked" id="picked"></ul>' +
      '<p class="hint">Slika je okrasna — bralnik zaslona je ne prebere, zato ' +
      "opis ni potreben. Nalaganje se začne samo.</p>" +
      // THE UPSCALER RUNS ON EVERY UPLOAD when a key is configured — the
      // owner's instruction, given twice and with the caveat stated: they
      // upload, it upscales, there is nothing to tick.
      //
      // The line stays because it is not a control, it is a disclosure: the
      // picture is REDRAWN at 2K rather than sharpened, and an operator who
      // does not know that cannot judge whether the result still shows the
      // product they are selling.
      // ⚠️ AN OPT-IN, AND OFF BY DEFAULT, AND HERE AT ALL BECAUSE THE OWNER
      // ASKED TWICE FOR IT ON THIS SLOT.
      //
      // The refusal above it is the same one this file has carried since the
      // hero came back as a different garden, and it is still why nothing
      // happens unless somebody ticks the box. What changed is that "no" was
      // not an answer to "my hero is not sharp enough": the panel caps and
      // never inflates, so a small upload stays small, and the only thing that
      // can genuinely add pixels is a model that draws them.
      //
      // So the choice is put where the decision is made, with the cost stated
      // in the same breath — not in a manual, and not switched on quietly.
      // The size guard in the script refuses a result that is not actually
      // larger, so ticking this can cost time and never quality.
      (canEnhance
        ? '<label class="ai-opt" for="ai"><input type="checkbox" id="ai">' +
          "<span>Povečaj z umetno inteligenco na 4K</span></label>" +
          '<p class="note-ai">Brez kljukice sliko naložimo tako, kot ste jo ' +
          "izbrali — samo obrezano na pravo razmerje in pretvorjeno v WebP. " +
          "S kljukico jo model PONOVNO NARIŠE večjo: rezultat je oster, ni " +
          "pa nujno več ista fotografija. Pri naslovni sliki to pomeni, da " +
          "je lahko bazen v drugačnem vrtu, zato jo po nalaganju poglejte. " +
          "Če model ne vrne večje slike, obdržimo vašo.</p>"
        : '<p class="note-ai">Ta slika se ne obdeluje z umetno inteligenco — ' +
          "naložimo jo tako, kot ste jo izbrali, samo obrezano na pravo " +
          "razmerje in pretvorjeno v WebP.</p>") +
      '<p id="gowrap"><button class="btn" type="submit" id="go">Naloži</button></p>' +
      "</div></div></form>" +
      "<script>" + UPLOAD_JS + "</script>",
    who,
  );
}

/* ---- one model ------------------------------------------------------- */

export interface MediaView {
  id: string;
  url: string;
  alt: string;
  sort: number;
  widths: number[];
  /** True when the 2K upscaler redrew this image. Never inferred. */
  enhanced?: boolean;
  /** Which kind of shot this is — see admin/shots.ts. "" = not classified. */
  shot?: string | null;
}

/**
 * One photograph, as a row of a working list.
 *
 * ⚠️ THIS WAS A CARD IN A THREE-COLUMN GRID, and the grid was the fault. The
 * description field — the only control on this page anybody uses more than
 * once — measured 283px wide at every viewport from 390 to 1920, while the ten
 * descriptions in this catalogue want between 363 and 817. So the operator
 * edited a third of a sentence at a time and scrolled the field sideways to
 * check the rest of it. As a row the field takes the column: 844px at 1440.
 *
 * The four attributes at the foot are still one line, because all four belong
 * to this photograph and nowhere else, but they are no longer one string with
 * word-break:break-all through it. See .file in the stylesheet.
 */
function shotRow(base: string, m: MediaView, lead: boolean): string {
  const id = esc(m.id);
  const cut = m.url.lastIndexOf("/");
  const dir = cut < 0 ? "" : m.url.slice(0, cut + 1);
  const fileName = m.url.slice(cut + 1);
  const kind = shotLabel(m.shot);
  return (
    '<li class="shot">' +
    // The thumbnail opens the photograph itself. This page tells the operator
    // to LOOK at what the upscaler did to a picture and then gave them 288px
    // of it to judge by; a new tab so a half-typed description survives.
    '<a class="thumb" href="/media/' + esc(m.url) + '" target="_blank" ' +
    'rel="noopener" aria-label="Odpri sliko ' + esc(fileName) + ' v novem zavihku">' +
    '<img src="/media/' + esc(m.url) + '" alt="" loading="lazy" ' +
    'width="132" height="99"></a>' +
    // The reference line: which file, which rungs, whether it was redrawn, and
    // what the gallery sorts it as. The folder is the same on all ten rows, so
    // the FILENAME is the part that carries this row's identity and the part
    // that is not grey.
    '<p class="file"><span class="path"><span class="dir">' + esc(dir) +
    '</span><span class="fn">' + esc(fileName) + "</span></span> " +
    (m.widths.length
      ? '<span class="w">· širine: ' + m.widths.join(", ") + "</span>"
      : '<span class="w">· ena širina</span>') +
    // An enhanced picture is a REDRAWN one, and the person editing this
    // catalogue is entitled to know which those are without having to remember
    // the day it was uploaded. It is a disclosure, so it is not grey filler.
    (m.enhanced ? ' <span class="ai">· 2K (obdelano z UI)</span>' : "") +
    // The kind of shot, because the gallery is sorted by it and an order whose
    // rule is invisible reads as an arbitrary one.
    (kind ? ' <span class="kind">· ' + esc(kind) + "</span>" : "") +
    "</p>" +
    // Two forms, one row of buttons. A button carries the id of the form it
    // submits, which is what lets Shrani and Izbriši sit side by side without
    // nesting forms (illegal) or putting a destructive action inside the form
    // that saves.
    '<form class="fields" id="u-' + id + '" method="post" action="' +
    esc(base) + '/update">' +
    '<input type="hidden" name="id" value="' + id + '">' +
    '<div class="fhead"><label for="a-' + id + '">Opis slike</label>' +
    // The badge marks the row the storefront actually shows. It used to sit on
    // the picture; on a 132px thumbnail the word would not fit, and beside the
    // field label it is on the line the eye is already reading.
    (lead ? '<span class="badge">Glavna</span>' : "") +
    "</div>" +
    '<input id="a-' + id + '" type="text" name="alt" ' +
    'value="' + esc(m.alt) + '" maxlength="180" required>' +
    "</form>" +
    '<form class="gone" id="d-' + id + '" method="post" action="' +
    esc(base) + '/delete" ' +
    // ⚠️ THE CONFIRMATION NAMES THE PHOTOGRAPH. Ten rows carry ten buttons
    // reading "Izbriši" and this dialog used to read "Izbrišem to
    // fotografijo?" — which is true of all ten of them and identifies none.
    // Same reasoning, and the same JSON.stringify quoting, as Izbriši vse.
    "onsubmit=\"return confirm(" +
    esc(JSON.stringify(
      "Izbrišem to fotografijo?\n\n" + fileName + "\n" + m.alt +
      "\n\nTega ni mogoče razveljaviti.",
    )) + ")\">" +
    '<input type="hidden" name="id" value="' + id + '">' +
    "</form>" +
    '<div class="acts">' +
    // "Vrstni red" beside its box rather than above it: stacked, the label cost
    // every one of these rows 18px of height for one word.
    '<span class="num"><label for="s-' + id + '">Vrstni red</label>' +
    '<input id="s-' + id + '" type="number" name="sort" form="u-' +
    id + '" value="' + String(m.sort) + '" min="0" max="99"></span>' +
    // ⚠️ THE ACCESSIBLE NAME SAYS WHICH ROW, and the aria-label goes BEFORE
    // form= because panel.test pins that attribute against the button text.
    // Ten buttons all announced as "Shrani" leave a screen-reader user with no
    // way to tell which photograph they are about to delete.
    '<button class="btn btn--ghost btn--sm" type="submit" ' +
    'aria-label="Shrani — ' + esc(fileName) + '" form="u-' +
    id + '">Shrani</button>' +
    '<button class="btn btn--danger btn--sm" type="submit" ' +
    'aria-label="Izbriši — ' + esc(fileName) + '" form="d-' +
    id + '">Izbriši</button>' +
    "</div></li>"
  );
}

/** "Brez fotografij." / "1 fotografija." / "10 fotografij. Vrstni red …" */
function ledeCount(n: number): string {
  const c = photoCount(n);
  return (
    c.charAt(0).toUpperCase() + c.slice(1) +
    (n > 1 ? ". Vrstni red določa številka; najmanjša je glavna." : ".")
  );
}

export function modelPage(
  shop: string,
  slug: string,
  name: string,
  media: MediaView[],
  notice?: { kind: "ok" | "err"; text: string },
  who = "",
  enhance = false,
  describe = false,
): string {
  const base = "/admin/" + shop + "/" + slug;
  // The badge marks whichever row sorts first, because that is the one the
  // storefront actually shows — not simply the one uploaded first.
  const leadId = media.length > 0 ? media[0]!.id : "";

  return shell(
    name,
    noticeHtml(notice) +
      '<a class="back" href="/admin">← Vsi modeli</a>' +
      '<div class="head"><h1>' + esc(name) + "</h1>" +
      // ⚠️ A SENTENCE THAT STARTS WITH A COUNT STILL STARTS A SENTENCE. This
      // read "brez fotografij. Vrstni red določa številka…" on every model
      // with nothing in it — lower case, mid-thought, and then advice about
      // ordering a set that does not exist. The count is capitalised, and the
      // rule about ordering is only stated when there is more than one thing
      // to order.
      '<p class="lede">' + ledeCount(media.length) + "</p></div>" +

      "<h2>Nova fotografija</h2>" +
      // THE WHOLE CARD IS A FILE PICKER AND A PROGRESS BAR.
      //
      // It used to be a picker plus one description field per chosen file, and
      // that was the wrong shape for what this panel is for. Ten photographs
      // meant ten sentences before the button would work; the field was
      // required, so the browser refused the upload before any script ran; and
      // the descriptions collected that way were the same sentence pasted ten
      // times, which is worth nothing to a screen reader and nothing to image
      // search.
      //
      // So nothing is asked for here. Choose the files and they go: converted
      // to WebP in the browser, upscaled if a key is set, described by the
      // server from the picture it just received, and named after that
      // description. Every one of those is a thing the machine can do without
      // being told. What the operator DOES get is the list below, where every
      // photograph's description is an ordinary editable field — review after
      // the fact, which is the only place review was ever going to happen.
      '<form class="card" method="post" action="' + esc(base) +
      '/upload" enctype="multipart/form-data" id="up"' +
      // The upscaler is the one thing the BROWSER still has to know about:
      // it runs before the width ladder is drawn, so the client has to make
      // that call. The describer moved to the server and needs no flag here.
      (enhance ? ' data-enhance="on"' : "") + ">" +
      '<div class="up up--solo">' +

      '<div class="drop" id="drop">' +
      '<img id="prev" alt="" width="400" height="300">' +
      '<label for="f">Slike (JPEG, PNG, WebP)</label>' +
      // accept is a HINT to the file picker, not a guarantee — the server reads
      // the magic bytes — but narrowing it stops an operator choosing a 6 MB
      // JPEG and only learning it is refused after the upload.
      '<input id="f" name="file" type="file" multiple ' +
      'accept="image/jpeg,image/png,image/webp">' +
      '<p class="fmeta" id="fmeta">Slike lahko tudi povlečete sem — ' +
      "izberete jih lahko več hkrati. Nalaganje se začne samo.</p>" +
      "</div>" +

      '<div class="side">' +
      // ⚠️ THE RUN'S STATE SITS ABOVE THE LIST IT SUMMARISES.
      //
      // It used to sit below. Ten files make the list six hundred pixels tall,
      // so the bar that says how far through the set we are, and the line that
      // says which picture failed, were both off the bottom of the card while
      // the operator watched the rows. The one thing that answers "how long is
      // this going to take" was the one thing they could not see.
      //
      // role="status" because it is a live region now: the text changes
      // without a page load, and a screen-reader user was told none of it.
      '<div class="runst"><progress id="pr" max="100" value="0" hidden ' +
      'aria-label="Napredek nalaganja"></progress>' +
      '<p class="stline" id="stwrap" role="status"><span id="st"></span></p></div>' +
      // The chosen files, as thumbnails with a line of status each. No fields:
      // there is nothing here to fill in.
      '<ul class="picked" id="picked"></ul>' +
      // Without script nothing starts by itself, so the button is the whole
      // upload; with script it is a fallback nobody needs to press.
      '<p id="gowrap"><button class="btn" type="submit" id="go">Naloži</button></p>' +
      // The two disclosures. Neither is a control — they are what an operator
      // has to know to judge what came out the other end.
      (enhance
        ? '<p class="note-ai">Slike se samodejno izboljšajo na 2K. ' +
          "Sliko na novo nariše umetna inteligenca — po nalaganju jo poglejte, " +
          "podrobnosti izdelka se lahko spremenijo.</p>"
        : "") +
      (describe
        ? '<p class="note-ai">Opis in ime datoteke napiše umetna inteligenca ' +
          "iz same slike. Oboje lahko popravite spodaj.</p>"
        : '<p class="note-ai">Samodejnih opisov ni: nastavljen ni ' +
          "GEMINI_API_KEY. Zapišemo ime modela; opis popravite spodaj.</p>") +
      "</div>" +

      "</div></form>" +

      '<div class="head-row"><h2>Fotografije</h2>' +
      // ONE CLICK TO CLEAR A MODEL, and a confirmation that says what it will
      // cost rather than "are you sure?".
      //
      // Replacing a set meant deleting nine photographs one at a time, nine
      // confirmations and nine page loads deep. This is that, once.
      //
      // ⚠️ IT ONLY EXISTS WHEN THERE IS SOMETHING TO DELETE. A destructive
      // control on an empty list is a control whose only possible outcome is
      // an accident.
      //
      // The count travels with the form so the server can refuse a stale tab:
      // see the delete-all handler, which re-reads the set and does nothing if
      // it has changed. And the confirmation names the model and the number,
      // because the muscle memory that clears a dialog reading "Are you sure?"
      // is exactly the memory this needs to interrupt.
      (media.length === 0
        ? ""
        : '<div class="head-acts">' +
          '<form class="arrange" method="post" action="' + esc(base) + '/arrange">' +
          '<button class="btn btn--ghost btn--sm" type="submit"' +
          (describe ? "" : " disabled") + ">Razvrsti z UI</button>" +
          "</form>" +
          '<form class="clear-all" method="post" action="' + esc(base) + '/delete-all" ' +
          // ⚠️ JSON.stringify, NOT hand-rolled quoting. The message is a JS
          // string literal inside an HTML attribute, so it has to survive two
          // parsers. esc() escapes < > & and the double quote — but NOT the
          // apostrophe, so a single-quoted literal built by hand ends early on
          // any name containing one, and a backslash would start an escape
          // sequence nobody intended. JSON.stringify produces a correct
          // double-quoted literal for all of it, including the line breaks,
          // and esc() then makes it safe as an attribute value.
          "onsubmit=\"return confirm(" +
          esc(JSON.stringify(
            "Izbrišem VSE fotografije modela " + name + " (" + photoCount(media.length) + ")?" +
            "\n\nTega ni mogoče razveljaviti.",
          )) + ")\">" +
          '<input type="hidden" name="count" value="' + String(media.length) + '">' +
          '<button class="btn btn--danger btn--sm" type="submit">Izbriši vse</button>' +
          "</form></div>") +
      "</div>" +
      // ⚠️ SAY WHEN THIS REACHES THE SHOP, because it is not now.
      //
      // The storefront renders a generated index rather than querying the
      // database: handleRequest is synchronous and takes no env, so a round
      // trip inside it is a different architecture, not a refactor. The index
      // is rebuilt at deploy time. That is a defensible trade and it was
      // written down — in a source comment, where the person deleting a
      // photograph will never see it. They deleted one, watched the shop keep
      // showing it, and reasonably concluded the panel was broken.
      //
      // A tool that does something other than what it appears to do owes the
      // person using it a sentence.
      '<p class="note-ai">Spremembe se v trgovini pokažejo po naslednji ' +
      "objavi strani, ne takoj. Fotografije so tu shranjene takoj — trgovina " +
      "pa svoj seznam slik zgradi ob objavi.</p>" +
      (media.length === 0
        ? '<div class="card"><p class="empty">Ta model še nima fotografij. ' +
          "Do takrat trgovina prikaže risbo izdelka.</p></div>"
        : '<ul class="shots">' +
          media
            .map((m) => shotRow(base, m, m.id === leadId))
            .join("") +
          "</ul>") +
      "<script>" + UPLOAD_JS + "</script>",
    who,
  );
}

/**
 * Convert to WebP in the browser, at several widths, before uploading.
 *
 * WHY HERE AND NOT ON THE SERVER. Supabase's server-side image transformation
 * is a paid feature and this project is on the free plan; Cloudflare's image
 * resizing is not available on a workers.dev host either. A Worker has no
 * image encoder of its own — there is no runtime API to re-encode a JPEG — so
 * the only place a conversion can happen without adding a paid service is the
 * browser that already has the file decoded.
 *
 * It is also the better place. The bytes that cross the network are already
 * WebP and already the right size, so a 6 MB phone photograph never travels at
 * all, and the same width ladder the bundled imagery uses gets built for free
 * — which is what lets the storefront emit a real srcset for uploads.
 *
 * WITHOUT SCRIPT the form still submits, and the server refuses anything that
 * is not already WebP. That is a stated limitation on the form rather than a
 * silent one, and it is why the preview and the drag-and-drop below are
 * additions to a working form rather than the way it works.
 */
