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

import { finishDropCard, noticeHtml, shell } from "./panel";
import { SMART_JS } from "./client";
import { esc } from "../render/sections";
import { finishImageUrl } from "../catalog/finish-image";
import type { Finish } from "./finishes";

const CSS = `<style>
.fin-group{margin-top:26px}
.fins{list-style:none;margin:12px 0 0;padding:0;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(268px,1fr));gap:14px}
.fin{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);
  padding:12px;display:flex;flex-direction:column;gap:8px}
/* THE SWATCH IS THE POINT OF THE CARD, so it gets the card's width. It used
   to be a 64px chip beside a 90px-wide name field: the colour was too small
   to judge and the name, which is what goes on a purchase order, was cut off
   mid-word. */
.fin .sw{inline-size:100%;block-size:104px;border-radius:6px;
  border:1px solid var(--line);background:var(--paper) center/cover no-repeat}
.fin .nm{display:flex;gap:6px}
.fin input[type=text]{flex:1;min-width:0;min-height:36px;padding:5px 9px;font:inherit;
  border:1px solid var(--line-ctrl);border-radius:var(--r-ctrl);background:#fff;color:var(--ink)}
.fin .slug{font-size:12px;color:var(--mute);word-break:break-all;margin-block-start:-2px}
.fin .btn{min-height:36px;padding:0 12px;font-size:13px}
.fin .acts{margin-block-start:auto;display:flex;gap:6px;flex-wrap:wrap}
.fin-state{color:var(--mute);font-size:14px;margin:8px 0 0;max-width:52ch}
.chips{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:8px}
.chips li{border:1px solid var(--line);border-radius:999px;padding:5px 12px;
  background:var(--card);font-size:14px;color:var(--ink)}
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
  // f.slug, not f.name: the stored key never moves when a colour is renamed.
  const src = finishImageUrl(f.kind, f.slug) + "?v=" + String(Date.now());
  return (
    '<li class="fin">' +
    // The swatch itself, so a wrong name beside a picture is obvious at a
    // glance — which is the only way a rename gets noticed as needed.
    '<span class="sw" style="background-image:url(' + esc(src) + ')"></span>' +
    '<form class="nm" method="post" action="/admin/barve/' + esc(f.id) + '">' +
    '<label class="vh" for="fn-' + esc(f.id) + '">Ime barve</label>' +
    '<input id="fn-' + esc(f.id) + '" name="name" type="text" value="' + esc(f.name) + '" ' +
    'maxlength="80" required>' +
    '<button class="btn" type="submit">Shrani</button>' +
    "</form>" +
    '<span class="slug">' + esc(f.kind) + "-" + esc(f.slug) + ".webp</span>" +
    // ⚠️ NAMING AN EXISTING COLOUR, because the alternative was
    // delete-everything-and-drag-it-again. A swatch that came in before the
    // automatic naming existed — or on a run where the model could not
    // answer — is sitting right here with its picture; asking the model to
    // look at that picture is one button, not a re-upload.
    '<div class="acts">' +
    '<form method="post" action="/admin/barve/' + esc(f.id) + '/ime">' +
    '<button class="btn btn--ghost" type="submit">Poimenuj z AI</button>' +
    "</form>" +
    '<form method="post" action="/admin/barve/' + esc(f.id) + '/izbris">' +
    '<button class="btn btn--ghost" type="submit">Odstrani</button>' +
    "</form>" +
    "</div>" +
    "</li>"
  );
}

/**
 * The colours the storefront is showing while nothing has been uploaded:
 * the transcription of the supplier's chart, which catalog/pola.ts falls
 * back to per kind.
 *
 * ⚠️ THEY ARE NAMES, NOT SLOTS, and the difference is the whole redesign.
 * They were sixteen cards with an upload button each, which read as sixteen
 * chores to work through one at a time. Dropping a folder of samples on the
 * zone above settles the lot in one gesture and REPLACES this list outright,
 * so the honest way to draw it is as a plain roll of what stands in until
 * then — legible, and clearly not the thing you are meant to click.
 *
 * It cannot simply be omitted. Before this list existed the page showed
 * nothing at all on a shop that had uploaded nothing, said "0 barv", and the
 * owner reported it as the panel being broken — while every product page was
 * at that moment rendering these very names.
 */
function fallbackChips(names: readonly string[]): string {
  return (
    '<ul class="chips">' +
    names.map((n) => "<li>" + esc(n) + "</li>").join("") +
    "</ul>"
  );
}

function group(
  title: string,
  note: string,
  prefix: "bv" | "ob",
  what: string,
  rows: readonly Finish[],
  fallback: readonly string[],
  photographed: boolean,
  ai: boolean,
): string {
  // What the site is ACTUALLY showing right now, which is not the same
  // question as what is in the table. pola.ts reads a list baked in at build
  // time (finishes.generated.ts), so a swatch uploaded five minutes ago is a
  // row here and still not on the product page. Three states, three
  // sentences — an operator who uploads a colour and then looks at the shop
  // needs to be told which one they are in.
  const live = rows.length > 0;
  const state = !live
    ? "Zdaj v ponudbi — " + esc(finishCount(fallback.length)) +
      " iz dobaviteljeve barvne karte. Ko naložite svoje vzorce, ta seznam " +
      "nadomestijo v celoti: kupec izbira med natanko tistimi barvami, " +
      "ki jih naložite."
    : photographed
      ? "V ponudbi — " + esc(finishCount(rows.length)) + ", vaši vzorci. " +
        "Kupec izbira med temi in nobeno drugo."
      : "Naloženo — " + esc(finishCount(rows.length)) + ". Trgovina jih " +
        "pokaže ob naslednji posodobitvi strani; do takrat je v ponudbi " +
        esc(finishCount(fallback.length)) + " iz dobaviteljeve barvne karte.";
  return (
    '<div class="fin-group"><h2>' + esc(title) + "</h2>" +
    '<p class="lede">' + esc(note) + "</p>" +
    finishDropCard(prefix, what, ai) +
    '<p class="fin-state">' + state + "</p>" +
    (live ? '<ul class="fins">' + rows.map(card).join("") + "</ul>"
          : fallbackChips(fallback)) +
    "</div>"
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
  // Whether GEMINI_API_KEY is set. A checkbox that cannot reach the model is
  // worse than no checkbox: it promises a step that silently does not run.
  ai = false,
): string {
  const shellF = rows.filter((f) => f.kind === "barva");
  const cab = rows.filter((f) => f.kind === "obloga");
  const shown = (shellF.length > 0 ? shellF.length : fallback.shell.length) +
    (cab.length > 0 ? cab.length : fallback.cabinet.length);
  return shell(
    "Barve",
    CSS +
      '<div class="head"><h1>Barve</h1>' +
      '<p class="lede">Ta seznam JE ponudba: kupec izbira med temi barvami in ' +
      "nobeno drugo — zdaj " + esc(finishCount(shown)) + " skupaj. " +
      "Povlecite vse svoje vzorce naenkrat; naložijo se sami, ime barve " +
      "preberemo iz imena datoteke.</p></div>" +
      noticeHtml(n) +
      '<div class="fin-how">' +
      "<p><b>Vzorce spustite v okno spodaj — ime dobijo sami.</b> " +
      "Če datoteko poimenujete po barvi, tako kot piše na proizvajalčevi " +
      "barvni karti (<code>Oyster Opal.jpg</code>, " +
      "<code>Silver white marble.png</code>, <code>Črna.jpg</code>), " +
      "obdržimo prav to ime — velikih in malih črk ne popravljamo, ker se ime " +
      "navaja na naročilnici.</p>" +
      "<p>Kadar ime datoteke ničesar ne pove — <code>Screenshot 2026-08-28 " +
      "at 10.20.46</code>, <code>IMG_4821</code> — barvo pogleda umetna " +
      "inteligenca in jo poimenuje po odtenku, ki ga vidi: " +
      "<i>Temno siva</i>, <i>Peščeno bež</i>. To je opis tega, kar je na " +
      "sliki, in ne proizvajalčeva oznaka — te ne ugibamo, ker bi napačno ime " +
      "pristalo na naročilnici. Vsako lahko spodaj popravite.</p>" +
      "</div>" +
      group(
        "Barve školjke",
        "Akrilne školjke. Imena so proizvajalčeva in jih ne prevajamo.",
        "bv",
        "barv školjke",
        shellF,
        fallback.shell,
        fallback.shellPhotographed,
        ai,
      ) +
      group(
        "Barve obloge",
        "Stranske plošče. Ta imena so slovenska.",
        "ob",
        "barv obloge",
        cab,
        fallback.cabinet,
        fallback.cabinetPhotographed,
        ai,
      ) +
      "<script>" + SMART_JS + "</script>",
    who,
    "barve",
  );
}
