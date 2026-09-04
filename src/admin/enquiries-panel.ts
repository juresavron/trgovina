/**
 * Enquiries, in the admin panel.
 *
 * ONE PAGE, NO EDITOR, and the absence of an editor is the point. An enquiry
 * is a record of what somebody sent; a back office that can rewrite it is a
 * back office whose records prove nothing. What an operator does here is
 * READ one, act on it outside this screen, and say so — a status and a
 * private note. Everything the customer wrote is text, not a field.
 *
 * ⚠️ THE CARD IS ORDERED THE WAY THE WORK IS. The contact details come
 * first, because the first thing anyone does with an enquiry is answer it,
 * and a panel that puts the message above the telephone number makes every
 * reply start with a scroll. The configuration is next (it is what the reply
 * has to price), then the words, then the housekeeping.
 */

import { noticeHtml, shell } from "./panel";
import { esc } from "../render/sections";
import { STATUSES, type EnquiryRow } from "./enquiries";

const CSS = `<style>
.eqs{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.eq{background:var(--card);border:1px solid var(--line);border-radius:var(--r-card);padding:16px 18px}
.eq--nova{border-color:var(--ink)}
.eq-top{display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}
.eq-who{font-weight:600;font-size:17px;color:var(--ink)}
.eq-when{color:var(--mute);font-size:13px;margin-left:auto;white-space:nowrap}
.eq-reach{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.eq-reach a{display:inline-flex;align-items:center;min-height:36px;padding:0 12px;
  border:1px solid var(--line);border-radius:999px;text-decoration:none;color:var(--ink);
  font-size:14px;background:var(--card)}
.eq-reach a:hover{border-color:var(--ink)}
.eq-reach .pref{border-color:var(--ink);font-weight:600}
.eq-cfg{margin:12px 0 0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 14px;
  font-size:14px}
.eq-cfg dt{color:var(--mute)}
.eq-cfg dd{margin:0;color:var(--ink)}
.eq-model{font-weight:600}
.eq-txt{margin:12px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.55;
  color:var(--ink)}
.eq-lbl{display:block;font-size:12px;letter-spacing:.04em;text-transform:uppercase;
  color:var(--mute);margin-top:12px}
.eq-form{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:14px;
  padding-top:14px;border-top:1px solid var(--line)}
.eq-form select,.eq-form input{min-height:38px;padding:6px 10px;border:1px solid var(--line);
  border-radius:var(--r-ctrl);font:inherit;background:var(--card);color:var(--ink)}
.eq-form input{flex:1;min-width:180px}
.eq-del{margin-left:auto}
.eq-meta{margin-top:10px;font-size:12px;color:var(--mute);line-height:1.5}
.empty{color:var(--mute)}
</style>`;

/** Slovenian plural on the LAST TWO DIGITS, never n % 10. */
export function enquiryCount(n: number): string {
  const t = n % 100;
  if (t === 1) return "1 povpraševanje";
  if (t === 2) return "2 povpraševanji";
  if (t === 3 || t === 4) return n + " povpraševanja";
  return n + " povpraševanj";
}

function when(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return p(d.getDate()) + ". " + p(d.getMonth() + 1) + ". " + d.getFullYear() +
    " ob " + p(d.getHours()) + ":" + p(d.getMinutes());
}

function card(e: EnquiryRow): string {
  const cfg = Object.entries(e.configuration);
  // The channel they asked for gets the emphasised pill. Both are still
  // offered — a preference is not an instruction, and an unanswered enquiry
  // because the preferred channel bounced helps nobody.
  const reach =
    (e.phone
      ? '<a class="' + (e.prefer === "telefon" ? "pref" : "") + '" href="tel:' +
        esc(e.phone.replace(/[^\d+]/g, "")) + '">' + esc(e.phone) + "</a>"
      : "") +
    (e.email
      ? '<a class="' + (e.prefer === "e-posta" ? "pref" : "") + '" href="mailto:' +
        esc(e.email) + "?subject=" +
        encodeURIComponent("Odgovor na vaše povpraševanje" + (e.modelSlug ? " — " + e.modelSlug : "")) +
        '">' + esc(e.email) + "</a>"
      : "");

  return (
    '<li class="eq' + (e.status === "nova" ? " eq--nova" : "") + '">' +
    '<div class="eq-top">' +
    '<span class="eq-who">' + esc(e.name) + "</span>" +
    (e.postcode ? '<span class="eq-when">' + esc(e.postcode) + "</span>" : "") +
    '<span class="eq-when">' + esc(when(e.createdAt)) + "</span>" +
    "</div>" +
    '<div class="eq-reach">' + reach + "</div>" +
    (e.modelSlug || cfg.length > 0
      ? '<dl class="eq-cfg">' +
        (e.modelSlug ? "<dt>Model</dt><dd class=\"eq-model\">" + esc(e.modelSlug) + "</dd>" : "") +
        cfg.map(([k, v]) => "<dt>" + esc(k) + "</dt><dd>" + esc(v) + "</dd>").join("") +
        "</dl>"
      : "") +
    (e.accessNotes
      ? '<span class="eq-lbl">Dostop</span><p class="eq-txt">' + esc(e.accessNotes) + "</p>"
      : "") +
    (e.message
      ? '<span class="eq-lbl">Sporočilo</span><p class="eq-txt">' + esc(e.message) + "</p>"
      : "") +
    '<form class="eq-form" method="post" action="/admin/povprasevanja/' + esc(e.id) + '">' +
    '<label class="vh" for="st-' + esc(e.id) + '">Stanje</label>' +
    '<select id="st-' + esc(e.id) + '" name="status">' +
    STATUSES.map(
      (s) =>
        '<option value="' + s.id + '"' + (s.id === e.status ? " selected" : "") + ">" +
        esc(s.label) + "</option>",
    ).join("") +
    "</select>" +
    '<label class="vh" for="nt-' + esc(e.id) + '">Zaznamek</label>' +
    '<input id="nt-' + esc(e.id) + '" name="note" type="text" placeholder="Interni zaznamek" ' +
    'value="' + esc(e.note ?? "") + '">' +
    '<button class="btn" type="submit">Shrani</button>' +
    "</form>" +
    // ⚠️ THE CONSENT RECORD IS SHOWN, NOT HIDDEN. GDPR art. 7(1) makes the
    // controller prove consent, and a record nobody in the business can see
    // is not evidence anybody can produce. It is also the honest place to
    // put the deletion button: whoever is looking at what this person agreed
    // to is the person who should be able to act on a withdrawal.
    '<p class="eq-meta">Soglasje ' + esc(when(e.consentAt)) + ": „" +
    esc(e.consentText) + "“" +
    (e.sourcePath ? " · oddano na " + esc(e.sourcePath) : "") +
    "</p>" +
    '<form class="eq-form" method="post" action="/admin/povprasevanja/' + esc(e.id) + '/izbris">' +
    '<button class="btn btn--ghost eq-del" type="submit">Izbriši povpraševanje</button>' +
    "</form>" +
    "</li>"
  );
}

export function enquiryListPage(
  rows: readonly EnquiryRow[],
  who: string,
  n?: { kind: "ok" | "err"; text: string },
): string {
  const nova = rows.filter((r) => r.status === "nova").length;
  const body =
    rows.length === 0
      ? '<p class="empty">Še ni nobenega povpraševanja. Ko kdo odda obrazec na ' +
        "strani Kontakt, se pokaže tukaj.</p>"
      : '<ul class="eqs">' + rows.map(card).join("") + "</ul>";
  return shell(
    "Povpraševanja",
    CSS +
      '<div class="head">' +
      "<h1>Povpraševanja</h1>" +
      '<p class="lede">Kar so ljudje oddali prek obrazca na strani Kontakt. ' +
      "Nova so obrobljena. Podatke hranimo 24 mesecev od oddaje, nato se " +
      "izbrišejo sami — prej jih lahko izbrišete tudi ročno.</p></div>" +
      // The panel's own notice, not a second one — it already gets the
      // role="alert" / role="status" split right.
      noticeHtml(n) +
      '<div class="head-row"><h2>Vsa povpraševanja</h2>' +
      '<span class="muted">' + esc(enquiryCount(rows.length)) +
      (nova > 0 ? " · " + nova + " novih" : "") + "</span></div>" +
      body,
    who,
    "povprasevanja",
  );
}
