/**
 * The colour list, in the admin panel.
 *
 * ⚠️ THERE IS NO "ADD A COLOUR" FORM HERE, and its absence is the feature.
 *
 * The shop used to work the other way round: catalog/pola.ts held a
 * transcription of the supplier's chart, one upload slot per transcribed
 * name, and a colour could only be photographed if somebody had already typed
 * its name into the source. A sample the shop physically holds but the
 * transcription missed had nowhere to go, and a name on the chart the shop
 * cannot show still took a tile on six product pages.
 *
 * A colour exists now because a swatch was uploaded and the name came off the
 * file. Typing a name on this page would recreate exactly the arrangement
 * that was inverted — a tile with nothing behind it — so the page offers the
 * list, a rename for a typo, and a delete, and points at the drop zone for
 * everything else.
 */

import { noticeHtml, shell } from "./panel";
import { esc } from "../render/sections";
import { finishImageUrl } from "../catalog/finish-image";
import type { Finish } from "./finishes";
import { finishSlug, type FinishKind } from "../catalog/finish-image";

const CSS = `<style>
.fin-group{margin-top:26px}
.fins{list-style:none;margin:12px 0 0;padding:0;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.fin{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);
  padding:12px;display:flex;gap:12px;align-items:flex-start}
.fin .sw{inline-size:64px;block-size:64px;flex:none;border-radius:8px;
  border:1px solid var(--line);background:var(--paper) center/cover no-repeat}
.fin .grow{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.fin form{display:flex;gap:6px;flex-wrap:wrap}
.fin input[type=text]{flex:1;min-width:0;min-height:34px;padding:5px 8px;font:inherit;
  border:1px solid var(--line-ctrl);border-radius:var(--r-ctrl);background:#fff;color:var(--ink)}
.fin .slug{font-size:12px;color:var(--mute);word-break:break-all}
.fin .btn{min-height:34px;padding:0 10px;font-size:13px}
.fin-state{color:var(--mute);font-size:14px;margin:8px 0 0;max-width:52ch}
.fin--todo{align-items:stretch}
.fin--todo .sw--none{background:repeating-linear-gradient(45deg,#fff,#fff 5px,var(--line) 5px,var(--line) 10px)}
.fin--todo .nm{font-weight:600;color:var(--ink)}
.fin--todo .btn{align-self:flex-start;margin-block-start:auto}
.fin-how{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);
  padding:16px 18px;margin-top:14px}
.fin-how p{margin:0 0 8px}
.fin-how p:last-child{margin:0}
.fin-how code{font-family:ui-monospace,Menlo,monospace;font-size:13px;
  background:var(--paper);padding:1px 5px;border-radius:4px}
</style>`;

/** Slovenian plural on the LAST TWO DIGITS, never n % 10. */
export function finishCount(n: number): string {
  const t = n % 100;
  if (t === 1) return "1 barva";
  if (t === 2) return "2 barvi";
  if (t === 3 || t === 4) return n + " barve";
  return n + " barv";
}

function card(f: Finish): string {
  const src = finishImageUrl(f.kind, f.name) + "?v=" + String(Date.now());
  return (
    '<li class="fin">' +
    // The swatch itself, so a wrong name beside a picture is obvious at a
    // glance — which is the only way a rename gets noticed as needed.
    '<span class="sw" style="background-image:url(' + esc(src) + ')"></span>' +
    '<span class="grow">' +
    '<form method="post" action="/admin/barve/' + esc(f.id) + '">' +
    '<label class="vh" for="fn-' + esc(f.id) + '">Ime barve</label>' +
    '<input id="fn-' + esc(f.id) + '" name="name" type="text" value="' + esc(f.name) + '" ' +
    'maxlength="80" required>' +
    '<button class="btn" type="submit">Shrani</button>' +
    "</form>" +
    '<span class="slug">' + esc(f.kind) + "-" + esc(f.slug) + ".webp</span>" +
    '<form method="post" action="/admin/barve/' + esc(f.id) + '/izbris">' +
    '<button class="btn btn--ghost" type="submit">Odstrani</button>' +
    "</form>" +
    "</span></li>"
  );
}

/**
 * A colour that is LIVE ON THE SITE but has no row here: one of the names
 * transcribed from the supplier's chart, which catalog/pola.ts falls back to
 * while nothing has been uploaded.
 *
 * ⚠️ THIS EXISTS BECAUSE THE PAGE LIED BY OMISSION. It listed only uploaded
 * colours, so on a shop that has uploaded none it said "0 barv" and offered
 * a sentence pointing somewhere else — while every product page was, at that
 * moment, showing ten shell colours and six cabinet ones from the fallback.
 * An operator who came here to edit the colours they could see on their own
 * site found an empty page. That is a worse failure than a missing feature:
 * it makes the panel look broken and the site look unmanaged.
 *
 * Each one links to its own upload page, which already exists — SITE_IMAGES
 * derives a slot per transcribed name — so "edit" from here is one click.
 */
function fallbackCard(kind: FinishKind, name: string): string {
  const slug = finishSlug(name);
  return (
    '<li class="fin fin--todo">' +
    '<span class="sw sw--none" aria-hidden="true"></span>' +
    '<span class="grow">' +
    '<span class="nm">' + esc(name) + "</span>" +
    '<span class="slug">iz dobaviteljeve karte · še brez vzorca</span>' +
    '<a class="btn btn--ghost" href="/admin/site/' + esc(kind) + "-" + esc(slug) +
    '">Naložite vzorec</a>' +
    "</span></li>"
  );
}

function group(
  title: string,
  note: string,
  kind: FinishKind,
  rows: readonly Finish[],
  fallback: readonly string[],
  photographed: boolean,
): string {
  // What the site is ACTUALLY showing right now, which is not the same
  // question as what is in the table. pola.ts reads a list baked in at build
  // time (finishes.generated.ts), so a swatch uploaded five minutes ago is a
  // row here and still not on the product page. Three states, three
  // sentences — an operator who uploads a colour and then looks at the shop
  // needs to be told which one they are in.
  const live = rows.length > 0;
  const state = !live
    ? "Na strani modela se zdaj prikazuje " + esc(finishCount(fallback.length)) +
      " iz dobaviteljeve barvne karte. Ko naložite prvi vzorec, seznam " +
      "prevzamejo vaše barve."
    : photographed
      ? "Na strani modela se prikazuje teh " + esc(finishCount(rows.length)) +
        " — vaši vzorci."
      : "Naloženih je " + esc(finishCount(rows.length)) + ". Na strani modela " +
        "se do naslednje posodobitve strani še prikazuje " +
        esc(finishCount(fallback.length)) + " iz dobaviteljeve barvne karte.";
  return (
    '<div class="fin-group"><h2>' + esc(title) + "</h2>" +
    '<p class="lede">' + esc(note) + "</p>" +
    '<p class="fin-state">' + state + "</p>" +
    '<ul class="fins">' +
    (live
      ? rows.map(card).join("")
      : fallback.map((n) => fallbackCard(kind, n)).join("")) +
    "</ul></div>"
  );
}

export function finishListPage(
  rows: readonly Finish[],
  who: string,
  n?: { kind: "ok" | "err"; text: string },
  fallback: {
    shell: readonly string[];
    cabinet: readonly string[];
    shellPhotographed: boolean;
    cabinetPhotographed: boolean;
  } = { shell: [], cabinet: [], shellPhotographed: false, cabinetPhotographed: false },
): string {
  const shellF = rows.filter((f) => f.kind === "barva");
  const cab = rows.filter((f) => f.kind === "obloga");
  const shown = (shellF.length > 0 ? shellF.length : fallback.shell.length) +
    (cab.length > 0 ? cab.length : fallback.cabinet.length);
  return shell(
    "Barve",
    CSS +
      '<div class="head"><h1>Barve</h1>' +
      '<p class="lede">Barve, ki jih trgovina lahko pokaže. Na strani modela se ' +
      "prikažejo prav te — " + esc(finishCount(shown)) + " skupaj. " +
      "Spremembe se pokažejo ob naslednji posodobitvi strani.</p></div>" +
      noticeHtml(n) +
      '<div class="fin-how">' +
      "<p><b>Barvo dodate tako, da naložite njen vzorec.</b> Datoteko poimenujte " +
      "po barvi, tako kot piše na proizvajalčevi barvni karti — " +
      "<code>Oyster Opal.jpg</code>, <code>Silver white marble.png</code>, " +
      "<code>Črna.jpg</code> — in jo povlecite na ustrezno polje na strani " +
      '<a href="/admin/slike">Slike strani</a>.</p>' +
      "<p>Ime barve preberemo iz imena datoteke in ga ne popravljamo: velike in " +
      "male črke ostanejo takšne, kot ste jih napisali, ker se ime navaja na " +
      "naročilnici. Ko je barva vaša, jo lahko tukaj preimenujete ali odstranite.</p>" +
      "</div>" +
      group(
        "Barve školjke",
        "Akrilne školjke. Imena so proizvajalčeva in jih ne prevajamo.",
        "barva",
        shellF,
        fallback.shell,
        fallback.shellPhotographed,
      ) +
      group(
        "Barve obloge",
        "Stranske plošče. Ta imena so slovenska.",
        "obloga",
        cab,
        fallback.cabinet,
        fallback.cabinetPhotographed,
      ),
    who,
    "barve",
  );
}
