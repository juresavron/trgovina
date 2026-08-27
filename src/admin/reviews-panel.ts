/**
 * Customer reviews, in the admin panel.
 *
 * ⚠️ THE DESIGN OF THIS PAGE IS A LEGAL CONTROL, not a preference. See
 * admin/reviews.ts for the two Annex I entries this shop has to stay on the
 * right side of. What follows from them, in the layout:
 *
 *   * "Objavljeno" and "Preverjeno" are two separate ticks, never one. The
 *     first is "show this on the site"; the second is "I checked it against a
 *     real order", and it is the only thing that puts the "Preverjen nakup"
 *     chip on the page.
 *   * The order number sits beside the verified tick, because "reasonable
 *     steps to check" is the statutory test and the order number is what
 *     checking looks like. Tick without it and the save refuses the tick.
 *   * The page says, in the operator's language, that inventing a review is
 *     illegal. Not as a disclaimer at the bottom — beside the field where
 *     somebody would type one.
 *
 * The panel has no "generate" and no suggestions. Every word here is
 * transcribed from something a customer actually sent.
 */

import { shell } from "./panel";
import { esc } from "../render/sections";
import type { Review } from "./reviews";

const CSS = `<style>
.rv-new{margin-left:auto}
.rvs{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.rv{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);
  padding:14px 16px;display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap}
.rv .grow{flex:1;min-width:200px}
.rv .q{display:block;color:var(--ink);line-height:1.5;overflow-wrap:anywhere}
.rv .by{display:block;color:var(--mute);font-size:13px;margin-top:5px}
.rv .tags{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.pill{font-size:12px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;
  padding:4px 9px;border-radius:999px;border:1px solid var(--line);
  color:var(--mute);background:#fff;white-space:nowrap}
.pill--live{color:var(--ok);border-color:var(--ok-line);background:var(--ok-wash)}
.pill--check{color:var(--ink);border-color:var(--ink)}
textarea{font:inherit;width:100%;padding:11px 12px;color:var(--ink-body);background:#fff;
  border:1px solid var(--line-ctrl);border-radius:var(--r-ctrl);line-height:1.6;resize:vertical}
textarea:hover{border-color:#6f6f6f}
textarea:focus{border-color:var(--ink);outline:none;box-shadow:0 0 0 2px rgba(21,21,21,.12)}
select{font:inherit;min-height:44px;padding:10px 12px;color:var(--ink-body);background:#fff;
  border:1px solid var(--line-ctrl);border-radius:var(--r-ctrl)}
.tick{display:flex;align-items:flex-start;gap:10px;min-height:44px;margin:16px 0 0;
  font-size:14px;font-weight:500;color:var(--ink);cursor:pointer}
.tick input{width:18px;height:18px;flex:none;margin-top:3px;cursor:pointer}
.tick span{font-weight:400;color:var(--ink-body)}
.tick b{display:block;font-weight:600;color:var(--ink);margin-bottom:2px}
/* The law note is not fine print. It sits beside the field somebody would
   type an invented quote into, at reading size, in the ink the body uses. */
.law{margin:16px 0 0;padding:12px 14px;background:var(--danger-wash);
  border-left:2px solid var(--danger);border-radius:0 var(--r-ctrl) var(--r-ctrl) 0;
  color:var(--ink-body);font-size:14px;line-height:1.6}
.law b{color:var(--danger)}
.acts{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:22px;
  padding-top:20px;border-top:1px solid var(--line)}
.acts .spacer{margin-left:auto}
.two{display:grid;gap:16px}
@media (min-width:620px){.two{grid-template-columns:1fr 1fr}}
</style>`;

function notice(n?: { kind: "ok" | "err"; text: string }): string {
  if (!n) return "";
  return (
    '<p class="note note--' + n.kind + '" role="' +
    (n.kind === "err" ? "alert" : "status") + '">' + esc(n.text) + "</p>"
  );
}

/** "3 mnenja" — the four Slovenian forms, as everywhere else in this panel. */
export function reviewCount(n: number): string {
  if (n === 0) return "ni mnenj";
  // Last two digits, matched exactly: 22 and 94 are compounds and take the
  // genitive plural — a units-digit rule would print "22 mnenji".
  const t = n % 100;
  if (t === 1) return n + " mnenje";
  if (t === 2) return n + " mnenji";
  if (t === 3 || t === 4) return n + " mnenja";
  return n + " mnenj";
}

export function reviewListPage(
  reviews: readonly Review[],
  who: string,
  n?: { kind: "ok" | "err"; text: string },
): string {
  const rows =
    reviews.length === 0
      ? '<p class="empty">Še ni nobenega mnenja. Dodajte tisto, kar so vam ' +
        "kupci dejansko napisali — prepišite njihove besede, ne svojih.</p>"
      : '<ul class="rvs">' +
        reviews
          .map(
            (r) =>
              '<li class="rv"><span class="grow">' +
              '<a class="q" href="/admin/mnenja/' + esc(r.id) + '">' +
              esc(r.body.length > 160 ? r.body.slice(0, 160) + "…" : r.body) + "</a>" +
              '<span class="by">' + esc(r.authorName) +
              (r.productSlug ? " · " + esc(r.productSlug) : "") +
              (r.orderNumber ? " · naročilo " + esc(r.orderNumber) : "") +
              "</span></span>" +
              '<span class="tags">' +
              '<span class="pill' + (r.published ? " pill--live" : "") + '">' +
              (r.published ? "Objavljeno" : "Osnutek") + "</span>" +
              (r.verified ? '<span class="pill pill--check">Preverjeno</span>' : "") +
              "</span></li>",
          )
          .join("") +
        "</ul>";
  return shell(
    "Mnenja strank",
    CSS +
      '<div class="head"><a class="back" href="/admin">Nazaj na izdelke</a>' +
      "<h1>Mnenja strank</h1>" +
      '<p class="lede">Prepisana mnenja kupcev. Objavljena se pokažejo na ' +
      "domači strani in na straneh izdelkov ob naslednji posodobitvi strani.</p></div>" +
      notice(n) +
      '<div class="head-row"><h2>Mnenja</h2>' +
      '<span class="muted">' + esc(reviewCount(reviews.length)) + "</span>" +
      '<a class="btn rv-new" href="/admin/mnenja/novo">Dodaj mnenje</a></div>' +
      rows,
    who,
  );
}

/**
 * The editor.
 *
 * @param models The shop's own catalogue, so the product a review is about is
 *   CHOSEN rather than typed. A free-text field here would put "BAZEN RELAX 5"
 *   on the site — which is exactly what the two invented reviews this replaces
 *   did name, a model that has never existed.
 */
export function reviewEditPage(
  review: Review | null,
  models: readonly { slug: string; name: string }[],
  who: string,
  n?: { kind: "ok" | "err"; text: string },
): string {
  const action = review ? "/admin/mnenja/" + esc(review.id) : "/admin/mnenja/novo";
  const v = <T>(x: T | undefined, fallback: T): T => (review ? (x as T) : fallback);

  const options = models
    .map(
      (m) =>
        '<option value="' + esc(m.slug) + '"' +
        (review?.productSlug === m.slug ? " selected" : "") + ">" + esc(m.name) + "</option>",
    )
    .join("");

  return shell(
    review ? "Uredi mnenje" : "Novo mnenje",
    CSS +
      '<div class="head"><a class="back" href="/admin/mnenja">Nazaj na mnenja</a>' +
      "<h1>" + (review ? "Uredi mnenje" : "Novo mnenje") + "</h1>" +
      '<p class="lede">Prepišite, kar vam je kupec napisal.</p></div>' +
      notice(n) +
      '<form method="post" action="' + action + '" class="card">' +

      '<div class="field"><label for="body">Mnenje</label>' +
      '<textarea id="body" name="body" rows="5" maxlength="800" required ' +
      'placeholder="Besedilo, kot ga je napisal kupec.">' +
      esc(review?.body ?? "") + "</textarea>" +
      // ⚠️ BESIDE THE FIELD, NOT IN A FOOTER.
      '<p class="law"><b>Izmišljeno mnenje je prepovedano.</b> Objava mnenja, ' +
      "ki ga ni napisal resničen kupec, je uvrščena na črno listo nepoštenih " +
      "poslovnih praks (Priloga I, točki 23b in 23c, ZVPot-1) — brez presoje " +
      "okoliščin. Sem sodi tudi trditev, da je mnenje od preverjenega kupca, " +
      "če tega niste preverili. Prepišite le tisto, kar ste res prejeli.</p>" +
      "</div>" +

      '<div class="two" style="margin-top:16px">' +
      '<div class="field"><label for="who">Podpis</label>' +
      '<input type="text" id="who" name="who" maxlength="80" required ' +
      'value="' + esc(review?.authorName ?? "") + '" ' +
      'placeholder="Npr. Družina Novak, Domžale"></div>' +
      '<div class="field"><label for="model">Model</label>' +
      '<select id="model" name="model"><option value="">— brez modela —</option>' +
      options + "</select></div>" +
      "</div>" +

      '<div class="two" style="margin-top:16px">' +
      '<div class="field"><label for="rating">Ocena</label>' +
      '<select id="rating" name="rating">' +
      [5, 4, 3, 2, 1]
        .map(
          (r) =>
            '<option value="' + r + '"' +
            (v(review?.rating, 5) === r ? " selected" : "") + ">" + r + " / 5</option>",
        )
        .join("") +
      "</select></div>" +
      '<div class="field"><label for="order">Številka naročila</label>' +
      '<input type="text" id="order" name="order" maxlength="40" ' +
      'value="' + esc(review?.orderNumber ?? "") + '" ' +
      'placeholder="Nujno, če označite »preverjeno«"></div>' +
      "</div>" +

      '<label class="tick" for="published"><input type="checkbox" id="published" ' +
      'name="published"' + (v(review?.published, false) ? " checked" : "") + ">" +
      "<span><b>Objavi na spletni strani</b>Mnenje se pokaže med mnenji strank.</span></label>" +

      '<label class="tick" for="verified"><input type="checkbox" id="verified" ' +
      'name="verified"' + (v(review?.verified, false) ? " checked" : "") + ">" +
      "<span><b>Preverjen nakup</b>Označite samo, če ste mnenje primerjali z " +
      "resničnim naročilom in ste vpisali njegovo številko. Ta kljukica doda " +
      "na stran oznako »Preverjen nakup« — to je trditev, za katero morate " +
      "imeti dokazilo.</span></label>" +

      '<div class="acts"><button class="btn" type="submit">Shrani</button>' +
      '<a class="btn btn--ghost" href="/admin/mnenja">Prekliči</a>' +
      (review
        ? '<span class="spacer"></span>' +
          '<button class="btn btn--danger btn--sm" type="submit" form="delrv">Izbriši</button>'
        : "") +
      "</div></form>" +
      (review
        ? '<form method="post" action="/admin/mnenja/' + esc(review.id) +
          '/delete" id="delrv" hidden></form>'
        : ""),
    who,
  );
}
