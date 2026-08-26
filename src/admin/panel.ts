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
 * It is also the only place in this project that requires JavaScript to do its
 * job, and the reason is the image conversion — see UPLOAD_JS.
 */

import { esc } from "../render/sections";
import { brandMark } from "../themes/studio/brand";

const CSS = `
*,*::before,*::after{box-sizing:border-box}

:root{
  /* The studio theme's ink and greys, verbatim — see the module comment. */
  --ink:#151515;
  --ink-body:#212121;
  --mute:#6d6d6d;
  --line:#dfdfdf;
  /* WCAG 1.4.11 holds the boundary of an interactive control to 3:1, which
     the hairline grey does not meet. Inputs get this one. */
  --line-ctrl:#949494;
  --paper:#f0f0f0;
  --card:#fff;
  --on-dark-mute:#a4a4a4;
  --danger:#8a1c1c;
  --danger-line:#e0bcbc;
  --danger-wash:#fdf3f3;
  --ok:#1c5c2a;
  --ok-line:#bfe0c6;
  --ok-wash:#eef7f0;
  --r-card:8px;
  --r-ctrl:4px;
  --lift:0 1px 2px rgba(21,21,21,.05),0 10px 28px rgba(21,21,21,.06);
}

html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink-body);
  font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,
    "Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased}
code{font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}

/* One ring, everywhere, and only for keyboard users. A panel that hides focus
   is a panel that cannot be operated without a mouse. */
:where(a,button,input,summary,[tabindex]):focus-visible{
  outline:2px solid var(--ink);outline-offset:2px;border-radius:var(--r-ctrl)}
.bar :where(a,button):focus-visible{outline-color:#fff}

/* ---- chrome ---------------------------------------------------------- */

.bar{position:sticky;top:0;z-index:9;background:var(--ink);color:#fff}
.bar .in{max-width:1060px;margin:0 auto;padding:9px 20px;min-height:58px;
  display:flex;align-items:center;gap:14px}
.home{display:inline-flex;align-items:center;gap:10px;color:#fff;
  text-decoration:none;font-weight:600;letter-spacing:.005em}
.mark{width:22px;height:22px;display:block;flex:none}
.sp{margin-left:auto}
.who{color:var(--on-dark-mute);font-size:13px;max-width:22ch;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.out{font:inherit;font-size:14px;min-height:36px;padding:7px 13px;cursor:pointer;
  background:transparent;color:#fff;border:1px solid var(--on-dark-mute);
  border-radius:var(--r-ctrl)}
.out:hover{background:#2e2e2e}

.wrap{max-width:1060px;margin:0 auto;padding:26px 20px 96px}

/* ---- headings -------------------------------------------------------- */

h1{font-size:clamp(21px,2.2vw,27px);line-height:1.22;letter-spacing:-.012em;
  color:var(--ink);margin:0}
h2{font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;
  color:var(--mute);margin:38px 0 12px}
.lede{color:var(--mute);margin:7px 0 0;max-width:60ch}
.head{margin:0 0 24px}
.back{display:inline-flex;align-items:center;gap:7px;min-height:24px;
  padding:4px 0;margin:0 0 14px;color:var(--mute);text-decoration:none;font-size:14px}
.back:hover{color:var(--ink)}

/* ---- surfaces -------------------------------------------------------- */

.card{background:var(--card);border:1px solid var(--line);
  border-radius:var(--r-card);padding:18px}
.muted{color:var(--mute);font-size:13px}
.hint{color:var(--mute);font-size:13px;line-height:1.45;margin:7px 0 0}

.note{display:block;padding:12px 14px;margin:0 0 20px;font-size:14px;
  border:1px solid;border-radius:var(--r-ctrl)}
.note--ok{background:var(--ok-wash);border-color:var(--ok-line);color:var(--ok)}
.note--err{background:var(--danger-wash);border-color:var(--danger-line);color:var(--danger)}

/* ---- controls -------------------------------------------------------- */

label{display:block;font-size:13px;font-weight:500;color:var(--ink);margin:0 0 5px}
input[type=text],input[type=email],input[type=password],input[type=number],
input[type=file]{font:inherit;width:100%;min-height:44px;padding:10px 12px;
  color:var(--ink-body);background:#fff;border:1px solid var(--line-ctrl);
  border-radius:var(--r-ctrl)}
input:hover{border-color:#6f6f6f}
input:focus{border-color:var(--ink);outline:none;box-shadow:0 0 0 2px rgba(21,21,21,.12)}
input[type=number]{width:86px;text-align:center}
input::placeholder{color:#8a8a8a}
input[type=file]{padding:8px 12px;cursor:pointer}
input[type=file]::file-selector-button{font:inherit;font-weight:500;cursor:pointer;
  margin-right:12px;padding:6px 13px;color:var(--ink);background:#fff;
  border:1px solid var(--ink);border-radius:var(--r-ctrl)}
input[type=file]::file-selector-button:hover{background:var(--paper)}

.btn{font:inherit;font-weight:500;display:inline-flex;align-items:center;
  justify-content:center;gap:8px;min-height:44px;padding:10px 18px;cursor:pointer;
  color:#fff;background:var(--ink);border:1px solid var(--ink);
  border-radius:var(--r-ctrl);text-decoration:none}
.btn:hover{background:#000;border-color:#000}
.btn--ghost{background:#fff;color:var(--ink)}
.btn--ghost:hover{background:var(--paper);border-color:var(--ink)}
.btn--danger{background:#fff;color:var(--danger);border-color:var(--danger-line)}
.btn--danger:hover{background:var(--danger-wash);border-color:var(--danger)}
.btn--sm{min-height:38px;padding:8px 14px;font-size:14px}
.btn:disabled{opacity:.5;cursor:not-allowed}

/* ---- login ----------------------------------------------------------- */

.login{min-height:100vh;min-height:100dvh;display:grid;place-items:center;
  padding:32px 20px}
.login-in{width:100%;max-width:398px}
.brand{display:flex;align-items:center;justify-content:center;gap:10px;
  color:var(--ink);margin:0 0 20px}
.brand .mark{width:30px;height:30px}
.brand b{font-size:15px;font-weight:600;letter-spacing:.01em}
.login .card{padding:24px;box-shadow:var(--lift)}
.login h1{font-size:20px}
.login .lede{margin:6px 0 20px;font-size:14px}
.login ul{margin:10px 0 0;padding-left:20px}
.field+.field{margin-top:14px}
.login .btn{width:100%;margin-top:20px}
.login .hint{margin-top:16px;padding-top:14px;border-top:1px solid var(--line)}

/* ---- dashboard ------------------------------------------------------- */

.models{display:grid;gap:16px;margin:0;padding:0;list-style:none;
  grid-template-columns:repeat(auto-fill,minmax(232px,1fr))}
.model{background:var(--card);border:1px solid var(--line);
  border-radius:var(--r-card);overflow:hidden;transition:box-shadow .16s,transform .16s}
.model:hover{box-shadow:var(--lift);transform:translateY(-2px)}
.model:has(a:focus-visible){box-shadow:var(--lift)}
.model a{display:flex;flex-direction:column;height:100%;color:inherit;text-decoration:none}
.cover{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;
  background:var(--paper);border-bottom:1px solid var(--line)}
.cover--none{display:grid;place-items:center;aspect-ratio:4/3;
  background:var(--paper);border-bottom:1px solid var(--line);color:#c2c2c2}
.cover--none .mark{width:34px;height:34px}
.model .meta{display:block;flex:1;padding:13px 15px 15px}
.model .name{display:block;font-weight:600;color:var(--ink);line-height:1.35}
.model .count{display:block;color:var(--mute);font-size:13px;margin-top:3px}

/* ---- upload ---------------------------------------------------------- */

.up{display:grid;gap:18px}
@media (min-width:760px){.up{grid-template-columns:minmax(0,1fr) minmax(0,1fr);
  align-items:start}}
/* The picker used to share the row with a column of description fields, so
   half the card was a form. There is no form left — the right-hand column is
   a progress report — so the picker takes the space it needs and the status
   sits beside it rather than opposite it. */
@media (min-width:760px){.up--solo{grid-template-columns:minmax(0,320px) minmax(0,1fr)}}
.drop{border:1px dashed var(--line-ctrl);border-radius:var(--r-card);
  padding:16px;background:#fbfbfb}
.drop.is-over{border-color:var(--ink);background:var(--paper)}
.note-ai{margin:16px 0 0;padding:11px 13px;border-left:2px solid var(--ink);
  background:#fbfbfb;font-size:13px;line-height:1.45;color:var(--mute)}
.picked{list-style:none;margin:0;padding:0;display:none;flex-direction:column;gap:12px}
.picked.on{display:flex}
.picked li{display:flex;gap:12px;align-items:flex-start}
.picked img{width:64px;height:48px;object-fit:cover;border-radius:var(--r-ctrl);
  background:var(--paper);flex:none;border:1px solid var(--line)}
.picked .grow{flex:1;min-width:0}
.picked .nm{display:block;font-size:12px;color:var(--mute);margin:0 0 2px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* One line of state per file. The list is now the only progress report the
   operator gets per picture, so it has to say where each one is. */
.picked .rowst{display:block;font-size:13px;color:var(--ink)}
.picked .rowst.ok{color:var(--ok,#1a7f37)}
.picked .rowst.bad{color:var(--danger,#b42318)}
.picked li{align-items:center}
.stline{margin:10px 0 0;min-height:20px}
#prev{display:none;width:100%;aspect-ratio:4/3;object-fit:contain;
  background:var(--paper);border-radius:var(--r-ctrl);margin-bottom:12px}
#prev.on{display:block}
progress{width:100%;height:6px;margin-top:12px}
#st{display:inline-block;margin-left:10px}

/* ---- photographs ----------------------------------------------------- */

.shots{display:grid;gap:16px;margin:0;padding:0;list-style:none;
  grid-template-columns:repeat(auto-fill,minmax(288px,1fr))}
.shot{background:var(--card);border:1px solid var(--line);
  border-radius:var(--r-card);overflow:hidden;display:flex;flex-direction:column}
.shot figure{position:relative;margin:0}
.shot img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;
  background:var(--paper)}
.badge{position:absolute;top:10px;left:10px;background:var(--ink);color:#fff;
  font-size:11px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;
  padding:5px 9px;border-radius:99px}
.shot .body{padding:14px 15px 15px;display:flex;flex-direction:column;gap:12px;flex:1}
.shot .acts{display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap}
.shot .acts .btn{flex:1}
.shot .gone{display:none}
.shot .file{font-size:12px;color:var(--mute);word-break:break-all;margin:auto 0 0}
.empty{color:var(--mute);margin:0}

@media (prefers-reduced-motion:reduce){
  *{transition:none !important;animation:none !important}
  .model:hover{transform:none}
}
`;

/* ---- document -------------------------------------------------------- */

function doc(title: string, body: string): string {
  return (
    '<!doctype html><html lang="sl"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex, nofollow">' +
    '<meta name="color-scheme" content="light">' +
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">' +
    '<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">' +
    "<title>" + esc(title) + " — nadzorna plošča</title>" +
    "<style>" + CSS + "</style></head><body>" + body + "</body></html>"
  );
}

/**
 * The signed-in chrome.
 *
 * @param who The account, shown in the bar. With one shared password there was
 *   nothing to show; with accounts there is, and seeing which one you are is
 *   how you notice you are on a colleague's session before you delete their
 *   photographs.
 */
function shell(title: string, body: string, who: string): string {
  return doc(
    title,
    '<header class="bar"><div class="in">' +
      '<a class="home" href="/admin">' + brandMark("panel", "mark") +
      "<span>Nadzorna plošča</span></a>" +
      '<span class="sp"></span>' +
      (who ? '<span class="who">' + esc(who) + "</span>" : "") +
      '<form method="post" action="/admin/logout">' +
      '<button class="out" type="submit">Odjava</button></form>' +
      '</div></header><main class="wrap">' + body + "</main>",
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
  const teen = n % 100;
  if (teen >= 11 && teen <= 14) return n + " fotografij";
  const unit = n % 10;
  if (unit === 1) return n + " fotografija";
  if (unit === 2) return n + " fotografiji";
  if (unit === 3 || unit === 4) return n + " fotografije";
  return n + " fotografij";
}

export interface SiteSlot {
  stem: string;
  label: string;
  note: string;
  /** The /media path to preview, whether it has been replaced yet or not. */
  src: string;
}

export function indexPage(
  shopName: string,
  shopKey: string,
  models: ModelLink[],
  who = "",
  site: SiteSlot[] = [],
): string {
  return shell(
    "Izdelki",
    '<div class="head"><h1>' + esc(shopName) + "</h1>" +
      '<p class="lede">Izberite model in uredite njegove fotografije. ' +
      "Prva je tista, ki jo trgovina pokaže povsod.</p></div>" +
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

      // THE SITE'S OWN PICTURES, which had no way in here at all — so the
      // heaviest image on the storefront (a 2.7 MB PNG hero) was the one
      // picture the panel's convert-to-WebP promise never reached.
      (site.length === 0
        ? ""
        : "<h2>Slike strani</h2>" +
          '<ul class="models">' +
          site
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
          "</ul>") +

      '<p class="muted" style="margin-top:22px">Ključ trgovine: <code>' +
      esc(shopKey) + "</code></p>",
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
  enhance = false,
): string {
  return shell(
    label,
    (notice
      ? '<p class="note note--' + notice.kind + '"' +
        (notice.kind === "err" ? ' role="alert"' : "") + ">" + esc(notice.text) + "</p>"
      : "") +
      '<a class="back" href="/admin">← Vsi modeli</a>' +
      '<div class="head"><h1>' + esc(label) + "</h1>" +
      '<p class="lede">' + esc(note) + "</p></div>" +

      "<h2>Trenutna slika</h2>" +
      '<div class="card"><img src="' + esc(src) + '" alt="" ' +
      'style="display:block;width:100%;max-width:720px;border-radius:4px">' +
      '<p class="hint">Nova slika zamenja to na istem naslovu. Na spletni ' +
      "strani se pokaže v nekaj minutah.</p></div>" +

      "<h2>Zamenjaj</h2>" +
      '<form class="card" method="post" action="/admin/site/' + esc(stem) +
      '/upload" enctype="multipart/form-data" id="up" data-mode="site"' +
      (enhance ? ' data-enhance="on"' : "") + ">" +
      '<div class="up">' +
      '<div class="drop" id="drop">' +
      '<img id="prev" alt="" width="400" height="300">' +
      '<label for="f">Slika (JPEG, PNG, WebP)</label>' +
      '<input id="f" name="file" type="file" ' +
      'accept="image/webp,image/jpeg,image/png,image/avif" required>' +
      '<p class="hint" id="fmeta">Sliko lahko tudi povlečete sem. V brskalniku ' +
      "se samodejno pretvori v WebP.</p>" +
      "</div>" +
      '<div class="side">' +
      // No description field, and no hidden one either: this picture is
      // decorative on the storefront and is rendered with an empty alt there,
      // so a sentence collected here would never reach a page. The field that
      // used to sit here disabled — the whole showOneAlt mechanism — went with
      // the per-file description fields it existed to hide.
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
      (enhance
        ? '<p class="note-ai">Slike se samodejno izboljšajo na 2K. ' +
          "Sliko na novo nariše umetna inteligenca — po nalaganju jo poglejte, " +
          "podrobnosti izdelka se lahko spremenijo.</p>"
        : "") +
      '<progress id="pr" max="100" value="0" hidden></progress>' +
      '<p class="stline"><span class="muted" id="st"></span></p>' +
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
    (notice
      ? '<p class="note note--' + notice.kind + '"' +
        (notice.kind === "err" ? ' role="alert"' : "") + ">" + esc(notice.text) + "</p>"
      : "") +
      '<a class="back" href="/admin">← Vsi modeli</a>' +
      '<div class="head"><h1>' + esc(name) + "</h1>" +
      '<p class="lede">' + photoCount(media.length) +
      ". Vrstni red določa številka; najmanjša je glavna.</p></div>" +

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
      // The chosen files, as thumbnails with a line of status each. No fields:
      // there is nothing here to fill in.
      '<ul class="picked" id="picked"></ul>' +
      '<progress id="pr" max="100" value="0" hidden></progress>' +
      '<p class="stline"><span class="muted" id="st"></span></p>' +
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

      "<h2>Fotografije</h2>" +
      (media.length === 0
        ? '<div class="card"><p class="empty">Ta model še nima fotografij. ' +
          "Do takrat trgovina prikaže risbo izdelka.</p></div>"
        : '<ul class="shots">' +
          media
            .map(
              (m) =>
                '<li class="shot"><figure>' +
                '<img src="/media/' + esc(m.url) + '" alt="" loading="lazy" ' +
                'width="288" height="216">' +
                (m.id === leadId ? '<span class="badge">Glavna</span>' : "") +
                "</figure>" +
                '<div class="body">' +
                // Two forms, one row of buttons. A button carries the id of the
                // form it submits, which is what lets Shrani and Izbriši sit
                // side by side without nesting forms (illegal) or putting a
                // destructive action inside the form that saves.
                '<form id="u-' + esc(m.id) + '" method="post" action="' +
                esc(base) + '/update">' +
                '<input type="hidden" name="id" value="' + esc(m.id) + '">' +
                '<label for="a-' + esc(m.id) + '">Opis slike</label>' +
                '<input id="a-' + esc(m.id) + '" type="text" name="alt" ' +
                'value="' + esc(m.alt) + '" maxlength="180" required>' +
                "</form>" +
                '<form class="gone" id="d-' + esc(m.id) + '" method="post" action="' +
                esc(base) + '/delete" ' +
                "onsubmit=\"return confirm('Izbrišem to fotografijo?')\">" +
                '<input type="hidden" name="id" value="' + esc(m.id) + '">' +
                "</form>" +
                '<div class="acts">' +
                '<span><label for="s-' + esc(m.id) + '">Vrstni red</label>' +
                '<input id="s-' + esc(m.id) + '" type="number" name="sort" form="u-' +
                esc(m.id) + '" value="' + String(m.sort) + '" min="0" max="99"></span>' +
                '<button class="btn btn--ghost btn--sm" type="submit" form="u-' +
                esc(m.id) + '">Shrani</button>' +
                '<button class="btn btn--danger btn--sm" type="submit" form="d-' +
                esc(m.id) + '">Izbriši</button>' +
                "</div>" +
                '<p class="file">' + esc(m.url) +
                (m.widths.length ? " · širine: " + m.widths.join(", ") : " · ena širina") +
                // An enhanced picture is a REDRAWN one, and the person editing
                // this catalogue is entitled to know which those are without
                // having to remember the day it was uploaded.
                (m.enhanced ? " · 2K (obdelano z UI)" : "") +
                "</p>" +
                "</div></li>",
            )
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
const UPLOAD_JS = `
(function(){
  "use strict";
  var form = document.getElementById("up");
  if (!form) return;
  /* SITE MODE: one picture, one fixed key, no width ladder. A site image is
     rendered decoratively by the storefront, so it has no description to
     collect and no srcset to describe. */
  var siteMode = form.getAttribute("data-mode") === "site";
  var file = document.getElementById("f"), go = document.getElementById("go"),
      st = document.getElementById("st"), pr = document.getElementById("pr"),
      drop = document.getElementById("drop"), prev = document.getElementById("prev"),
      fmeta = document.getElementById("fmeta"), hint = fmeta.textContent,
      picked = document.getElementById("picked"),
      gowrap = document.getElementById("gowrap");

  /* The button is the no-script path's whole upload. Script is running, so it
     is a fallback nobody needs: the files go the moment they are chosen. */
  if (gowrap) gowrap.style.display = "none";

  var urls = [];
  var rows = [];
  var busy = false;

  function slike(n){
    if (n === 0) return "brez fotografij";
    var teen = n % 100;
    if (teen >= 11 && teen <= 14) return n + " fotografij";
    var u = n % 10;
    if (u === 1) return n + " fotografija";
    if (u === 2) return n + " fotografiji";
    if (u === 3 || u === 4) return n + " fotografije";
    return n + " fotografij";
  }

  /* Show what was chosen. Thumbnails and a status line each — picking the
     wrong photograph and finding out only after it is uploaded is this
     panel's most annoying failure, and it is the ONLY thing this list is
     for now. There is nothing here to fill in. */
  function shown(){
    urls.forEach(URL.revokeObjectURL); urls = [];
    rows = [];
    picked.innerHTML = "";
    prev.className = ""; prev.removeAttribute("src");
    var fs = file.files ? Array.prototype.slice.call(file.files) : [];
    if (!fs.length) { fmeta.textContent = hint; picked.className = "picked"; return; }

    var kb = 0;
    fs.forEach(function(f){ kb += f.size; });
    fmeta.textContent = (fs.length === 1
      ? fs[0].name
      : slike(fs.length)) + " · " + Math.round(kb / 1024) + " kB";

    if (fs.length === 1) {
      var u = URL.createObjectURL(fs[0]);
      urls.push(u); prev.src = u; prev.className = "on";
    }
    if (siteMode) { picked.className = "picked"; return; }

    picked.className = "picked on";
    fs.forEach(function(f){
      var u = URL.createObjectURL(f); urls.push(u);
      var li = document.createElement("li");
      var img = document.createElement("img");
      img.src = u; img.alt = "";
      var box = document.createElement("div"); box.className = "grow";
      var nm = document.createElement("span"); nm.className = "nm"; nm.textContent = f.name;
      var stat = document.createElement("span"); stat.className = "rowst";
      stat.textContent = "čaka";
      box.appendChild(nm); box.appendChild(stat);
      li.appendChild(img); li.appendChild(box);
      picked.appendChild(li);
      rows.push(stat);
    });
    return fs;
  }

  function mark(i, text, cls){
    if (!rows[i]) return;
    rows[i].textContent = text;
    rows[i].className = "rowst" + (cls ? " " + cls : "");
  }

  /* Per file, so a set of ten shows which of them the upscaler took and which
     it did not — one upload answers "is this working" for good. */
  function markDone(i, wasUpscaled){
    mark(i, wasUpscaled ? "naloženo · 2K" : "naloženo", "ok");
  }

  /* ---- conversion ---------------------------------------------------- */

  /* The widths the storefront's slots actually paint, doubled for 2x screens.
     Never upscale: a rung wider than the source is the same pixels in a bigger
     file, and its w descriptor would then be a lie the browser acts on. */
  var LADDER = [480, 800, 1200, 1600];
  /* Nothing is ever painted wider than this, and a picture larger than it is
     bytes nobody sees. It is also the ceiling the enhancer works to. */
  var MAX_W = 2048;

  /* DECODE. createImageBitmap is the direct route and Safari only got it in
     15 — before that this whole block bailed out, the form did an ordinary
     POST, and the server refused the JPEG with a message telling the operator
     to convert it themselves. An <img> and an object URL decode anywhere. */
  function decode(f){
    if (window.createImageBitmap) return createImageBitmap(f);
    return new Promise(function(res, rej){
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function(){ URL.revokeObjectURL(url); res(img); };
      img.onerror = function(){ URL.revokeObjectURL(url); rej(new Error("slike ni bilo mogoče prebrati")); };
      img.src = url;
    });
  }

  /* Is this really WebP? RIFF at 0 and WEBP at 8 — the same check the server
     makes on the bytes it receives.

     ⚠️ toBlob SILENTLY FALLS BACK TO PNG when the browser cannot encode the
     type you asked for, and several Safari versions cannot encode WebP. The
     old code trusted it, labelled the PNG "480.webp", and let the server
     discover the lie — so a working upload path produced an error message
     about the operator's own file. Verified here, the browser's limitation is
     named where it happens. */
  function isWebp(buf){
    var b = new Uint8Array(buf);
    return b.length > 12 &&
      b[0] === 82 && b[1] === 73 && b[2] === 70 && b[3] === 70 &&
      b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80;
  }

  function draw(bmp, w){
    var srcW = bmp.width || bmp.naturalWidth, srcH = bmp.height || bmp.naturalHeight;
    var h = Math.round(srcH * (w / srcW));
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(bmp, 0, 0, w, h);
    return new Promise(function(res, rej){
      c.toBlob(function(blob){
        if (!blob) { rej(new Error("pretvorba ni uspela")); return; }
        blob.arrayBuffer().then(function(buf){
          if (!isWebp(buf)) {
            rej(new Error("ta brskalnik ne zna shraniti v WebP — poskusite v " +
              "Chromu ali posodobite Safari"));
            return;
          }
          res(blob);
        }, function(){ rej(new Error("pretvorba ni uspela")); });
      }, "image/webp", 0.82);
    });
  }

  var doEnhance = form.getAttribute("data-enhance") === "on";

  /* Ask the Worker to redraw the picture at 2K, or hand back what we had.
     A 204 means the upscaler produced nothing usable and the ORIGINAL should
     go through — an enhancement must never cost an upload, so every failure
     here resolves rather than rejects. */
  /* HOW MANY PICTURES THE UPSCALER ACTUALLY TOUCHED.
     The panel used to promise "Slike se samodejno izboljšajo na 2K" and then
     say nothing either way. If the key is missing, or the model name has
     been retired, every call answers 204, the original uploads, and the
     operator has no way of finding out — which is exactly the state this
     shop was in. Counted here and reported when the run finishes. */
  var upscaled = 0;
  var hit = [];

  function enhanced(f, i){
    if (!doEnhance) return Promise.resolve(f);
    mark(i, "izboljšujem …");
    var fd = new FormData();
    fd.append("file", f, f.name);
    return fetch("/admin/enhance", { method: "POST", body: fd, credentials: "same-origin" })
      .then(function(res){
        if (res.status === 204 || !res.ok) return f;
        return res.blob().then(function(b){
          if (!(b.size > 0)) return f;
          upscaled++; hit[i] = true;
          return b;
        });
      })
      .catch(function(){ return f; });
  }

  /* One file, one request. The server handler takes exactly one photograph
     and its width rungs, so a set is a loop here rather than a new shape
     there — and a failure on the fourth of five leaves the first three
     uploaded and says which one stopped, instead of losing the lot.

     NO DESCRIPTION IS SENT. The server writes it, from the picture it has
     just been handed: see describe.ts, and standInAlt for what happens when
     there is no key or the model gives nothing back. */
  function upload(f0, i, total){
    return enhanced(f0, i).then(function(f){
      mark(i, "pretvarjam …");
      return decode(f);
    }).then(function(bmp){
      var srcW = bmp.width || bmp.naturalWidth;
      if (siteMode) {
        var w = Math.min(srcW, MAX_W);
        return draw(bmp, w).then(function(b){ return { widths: [w], blobs: [b], one: true }; });
      }
      var widths = LADDER.filter(function(w){ return w < srcW; });
      widths.push(srcW);
      return Promise.all(widths.map(function(w){ return draw(bmp, w); }))
        .then(function(blobs){ return { widths: widths, blobs: blobs }; });
    }).then(function(out){
      var fd = new FormData();
      if (out.one) {
        fd.append("file", out.blobs[0], "site.webp");
        st.textContent = "nalagam …";
        return fetch(form.action, { method: "POST", body: fd, credentials: "same-origin" });
      }
      // The picture's position in this set, so a description the server has to
      // stand in for still differs from its neighbours' — see standInAlt.
      fd.append("n", String(i + 1));
      fd.append("widths", out.widths.join(","));
      /* WHETHER THE UPSCALER RAN, SENT RATHER THAN GUESSED AT LATER. Only
         this side knows: the server sees a set of WebP blobs and cannot tell
         a 2048px photograph from a small one Gemini redrew at 2K. The width
         ladder cannot answer it either — it is the same either way. */
      if (hit[i] === true) fd.append("enhanced", "1");
      out.blobs.forEach(function(b, k){ fd.append("w" + out.widths[k], b, out.widths[k] + ".webp"); });
      mark(i, "nalagam …");
      st.textContent = "nalagam " + (i + 1) + " od " + total + " …";
      return fetch(form.action, { method: "POST", body: fd, credentials: "same-origin" });
    }).then(function(res){
      /* A redirect here is the server's own error path (?e=…): it answers a
         successful upload the same way, so the only safe reading is to follow
         it and let the page say what happened. */
      if (!res.ok && !res.redirected) {
        return res.text().then(function(t){ throw new Error(t.slice(0, 200)); });
      }
      markDone(i, hit[i] === true);
      return res;
    });
  }

  /* ---- the run ------------------------------------------------------- */

  function start(){
    var fs = file.files ? Array.prototype.slice.call(file.files) : [];
    if (!fs.length || busy) return;
    if (!HTMLCanvasElement.prototype.toBlob) {
      st.textContent = "ta brskalnik ne zna shraniti v WebP — poskusite v Chromu";
      if (gowrap) gowrap.style.display = "";
      return;
    }
    busy = true;
    if (go) go.disabled = true;
    pr.hidden = false; pr.value = 0;

    var done = 0;
    (function next(){
      if (done >= fs.length) {
        /* Say what happened before the page reloads under them. Reaching the
           list below with nothing said would leave "did it upscale?" as
           unanswerable as it was before. */
        if (doEnhance && upscaled === 0) {
          st.textContent = "naloženo — nobene slike ni bilo mogoče izboljšati";
          setTimeout(function(){ location.reload(); }, 2500);
          return;
        }
        location.reload();
        return;
      }
      upload(fs[done], done, fs.length)
        .then(function(){
          done++;
          pr.value = Math.round((done / fs.length) * 100);
          next();
        })
        .catch(function(e){
          busy = false;
          if (go) go.disabled = false;
          if (gowrap) gowrap.style.display = "";
          mark(done, "napaka", "bad");
          st.textContent = "napaka pri sliki " + (done + 1) + ": " + e.message +
            (done > 0 ? " (prvih " + done + " je naloženih)" : "");
        });
    })();
  }

  /* CHOOSING THE FILES IS THE WHOLE INTERACTION. No description to write, no
     button to find: the change event is the upload. */
  file.addEventListener("change", function(){ shown(); start(); });
  form.addEventListener("submit", function(ev){ ev.preventDefault(); start(); });

  /* Drag and drop. The file input still works exactly as before; this only
     gives the browser a second way to hand the same file over. */
  if (window.DataTransfer && "files" in DataTransfer.prototype) {
    ["dragenter","dragover"].forEach(function(e){
      drop.addEventListener(e, function(ev){ ev.preventDefault(); drop.classList.add("is-over"); });
    });
    ["dragleave","drop"].forEach(function(e){
      drop.addEventListener(e, function(){ drop.classList.remove("is-over"); });
    });
    drop.addEventListener("drop", function(ev){
      ev.preventDefault();
      if (!ev.dataTransfer || !ev.dataTransfer.files.length) return;
      file.files = ev.dataTransfer.files;
      shown(); start();
    });
  }
})();
`;
