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
.drop{border:1px dashed var(--line-ctrl);border-radius:var(--r-card);
  padding:16px;background:#fbfbfb}
.drop.is-over{border-color:var(--ink);background:var(--paper)}
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

export function indexPage(
  shopName: string,
  shopKey: string,
  models: ModelLink[],
  who = "",
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
      '<p class="muted" style="margin-top:22px">Ključ trgovine: <code>' +
      esc(shopKey) + "</code></p>",
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
}

export function modelPage(
  shop: string,
  slug: string,
  name: string,
  media: MediaView[],
  notice?: { kind: "ok" | "err"; text: string },
  who = "",
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
      '<form class="card" method="post" action="' + esc(base) +
      '/upload" enctype="multipart/form-data" id="up">' +
      '<div class="up">' +

      '<div class="drop" id="drop">' +
      '<img id="prev" alt="" width="400" height="300">' +
      '<label for="f">Slika (JPEG, PNG, WebP)</label>' +
      // accept is a HINT to the file picker, not a guarantee — the server reads
      // the magic bytes — but narrowing it stops an operator choosing a 6 MB
      // JPEG and only learning it is refused after the upload.
      '<input id="f" name="file" type="file" ' +
      'accept="image/webp,image/jpeg,image/png,image/avif" required>' +
      '<p class="hint" id="fmeta">Sliko lahko tudi povlečete sem. V brskalniku ' +
      "se samodejno pretvori v WebP in pomanjša v več širin — shranimo samo WebP.</p>" +
      "</div>" +

      "<div>" +
      '<div class="field"><label for="alt">Opis slike (obvezno)</label>' +
      '<input id="alt" name="alt" type="text" maxlength="180" required ' +
      'placeholder="Masažni bazen na terasi, pokrit s termo pokrovom"></div>' +
      '<p class="hint">Opis prebere bralnik zaslona in ga uporabi iskalnik. ' +
      "Opišite, kaj je na sliki — ne ponavljajte imena modela.</p>" +
      '<p style="margin:18px 0 0"><button class="btn" type="submit" id="go">Naloži</button>' +
      '<span class="muted" id="st"></span></p>' +
      '<progress id="pr" max="100" value="0" hidden></progress>' +
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
  var file = document.getElementById("f"), go = document.getElementById("go"),
      st = document.getElementById("st"), pr = document.getElementById("pr"),
      drop = document.getElementById("drop"), prev = document.getElementById("prev"),
      fmeta = document.getElementById("fmeta"), hint = fmeta.textContent;

  /* Show what was chosen. Picking the wrong photograph and finding out only
     after it is uploaded is this panel's most annoying failure, and it costs
     ten lines to make it impossible. */
  function shown(){
    var f = file.files && file.files[0];
    if (prev.src) URL.revokeObjectURL(prev.src);
    if (!f) { prev.className = ""; prev.removeAttribute("src"); fmeta.textContent = hint; return; }
    prev.src = URL.createObjectURL(f);
    prev.className = "on";
    fmeta.textContent = f.name + " · " + Math.round(f.size / 1024) + " kB";
  }
  file.addEventListener("change", shown);

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
      shown();
    });
  }

  if (!HTMLCanvasElement.prototype.toBlob) return;

  /* The widths the storefront's slots actually paint, doubled for 2x screens.
     Never upscale: a rung wider than the source is the same pixels in a bigger
     file, and its w descriptor would then be a lie the browser acts on. */
  var LADDER = [480, 800, 1200, 1600];

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

  form.addEventListener("submit", function(ev){
    if (!file.files || !file.files[0]) return;
    ev.preventDefault();
    go.disabled = true; pr.hidden = false; pr.value = 0;
    st.textContent = "pretvarjam …";

    decode(file.files[0]).then(function(bmp){
      var srcW = bmp.width || bmp.naturalWidth;
      var widths = LADDER.filter(function(w){ return w < srcW; });
      widths.push(srcW);
      return Promise.all(widths.map(function(w){ return draw(bmp, w); }))
        .then(function(blobs){ return { widths: widths, blobs: blobs }; });
    }).then(function(out){
      var fd = new FormData();
      fd.append("alt", document.getElementById("alt").value);
      fd.append("widths", out.widths.join(","));
      out.blobs.forEach(function(b, i){ fd.append("w" + out.widths[i], b, out.widths[i] + ".webp"); });
      st.textContent = "nalagam …"; pr.value = 50;
      return fetch(form.action, { method: "POST", body: fd, credentials: "same-origin" });
    }).then(function(res){
      pr.value = 100;
      if (res.redirected) { location.href = res.url; return; }
      if (res.ok) { location.reload(); return; }
      return res.text().then(function(t){ throw new Error(t.slice(0, 200)); });
    }).catch(function(e){
      go.disabled = false; pr.hidden = true;
      st.textContent = "napaka: " + e.message;
    });
  });
})();
`;
