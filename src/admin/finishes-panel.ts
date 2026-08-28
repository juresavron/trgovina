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

const CSS = `<style>
.fin-group{margin-top:26px}
.fins{list-style:none;margin:12px 0 0;padding:0;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.fin{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);
  padding:12px;display:flex;gap:12px;align-items:flex-start}
.fin .sw{inline-size:64px;block-size:64px;flex:none;border-radius:8px;
  border:1px solid var(--line);background:var(--bg2) center/cover no-repeat}
.fin .grow{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.fin form{display:flex;gap:6px;flex-wrap:wrap}
.fin input[type=text]{flex:1;min-width:0;min-height:34px;padding:5px 8px;font:inherit;
  border:1px solid var(--line);border-radius:var(--r-ctrl);background:#fff;color:var(--ink)}
.fin .slug{font-size:12px;color:var(--mute);word-break:break-all}
.fin .btn{min-height:34px;padding:0 10px;font-size:13px}
.fin-empty{color:var(--mute);margin:12px 0 0}
.fin-how{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);
  padding:16px 18px;margin-top:14px}
.fin-how p{margin:0 0 8px}
.fin-how p:last-child{margin:0}
.fin-how code{font-family:ui-monospace,Menlo,monospace;font-size:13px;
  background:var(--bg2);padding:1px 5px;border-radius:4px}
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

function group(title: string, note: string, rows: readonly Finish[]): string {
  return (
    '<div class="fin-group"><h2>' + esc(title) + "</h2>" +
    '<p class="lede">' + esc(note) + "</p>" +
    (rows.length === 0
      ? '<p class="fin-empty">Nobene barve še ni. Naložite vzorce na strani ' +
        "»Slike strani« — vsaka datoteka postane barva s svojim imenom.</p>"
      : '<ul class="fins">' + rows.map(card).join("") + "</ul>") +
    "</div>"
  );
}

export function finishListPage(
  rows: readonly Finish[],
  who: string,
  n?: { kind: "ok" | "err"; text: string },
): string {
  const shellF = rows.filter((f) => f.kind === "barva");
  const cab = rows.filter((f) => f.kind === "obloga");
  return shell(
    "Barve",
    CSS +
      '<div class="head"><a class="back" href="/admin">Nazaj na izdelke</a>' +
      "<h1>Barve</h1>" +
      '<p class="lede">Barve, ki jih trgovina lahko pokaže. Na strani modela se ' +
      "prikažejo prav te — " + esc(finishCount(rows.length)) + " skupaj. " +
      "Spremembe se pokažejo ob naslednji posodobitvi strani.</p></div>" +
      noticeHtml(n) +
      '<div class="fin-how">' +
      "<p><b>Barvo dodate tako, da naložite njen vzorec.</b> Datoteko poimenujte " +
      "po barvi, tako kot piše na proizvajalčevi barvni karti — " +
      "<code>Oyster Opal.jpg</code>, <code>Silver white marble.png</code>, " +
      "<code>Črna.jpg</code> — in jo povlecite na ustrezno polje na strani " +
      "»Slike strani«.</p>" +
      "<p>Ime barve preberemo iz imena datoteke in ga ne popravljamo: velike in " +
      "male črke ostanejo takšne, kot ste jih napisali, ker se ime navaja na " +
      "naročilnici. Spodaj ga lahko popravite, če se je zatipkalo.</p>" +
      "<p>Dokler ni naložena nobena barva, stran pokaže prepisano barvno karto " +
      "dobavitelja. Ko naložite prvo, prevzame seznam tisto, kar ste naložili.</p>" +
      "</div>" +
      group(
        "Barve školjke",
        "Akrilne školjke. Imena so proizvajalčeva in jih ne prevajamo.",
        shellF,
      ) +
      group("Barve obloge", "Stranske plošče. Ta imena so slovenska.", cab),
    who,
  );
}
