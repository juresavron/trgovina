/**
 * The admin panel's HTML.
 *
 * Deliberately NOT the studio theme. This is a back office: it should look
 * like a tool, load instantly, and never tempt anyone into treating it as a
 * page to design. One small stylesheet, system fonts, no imagery.
 *
 * It is also the only place in this project that requires JavaScript to do its
 * job, and the reason is the image conversion — see UPLOAD_JS.
 */

import { esc } from "../render/sections";

const CSS = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:#f6f6f6;color:#151515;
  font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:#151515}
.wrap{max-width:920px;margin:0 auto;padding:24px 20px 80px}
header.bar{background:#151515;color:#fff;padding:14px 20px}
header.bar .in{max-width:920px;margin:0 auto;display:flex;align-items:center;gap:16px}
header.bar a{color:#fff;text-decoration:none}
header.bar .sp{margin-left:auto}
header.bar .who{font-size:13px;color:#c9c9c9;max-width:24ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
h1{font-size:24px;margin:24px 0 4px}
h2{font-size:16px;margin:32px 0 8px;text-transform:uppercase;letter-spacing:.06em;color:#6d6d6d}
p.lede{color:#4a4a4a;margin:0 0 18px}
.card{background:#fff;border:1px solid #e2e2e2;border-radius:8px;padding:16px;margin-bottom:12px}
.row{display:flex;align-items:center;gap:14px}
.row+.row{margin-top:10px;padding-top:10px;border-top:1px solid #eee}
.grow{flex:1;min-width:0}
.muted{color:#6d6d6d;font-size:13px}
input[type=text],input[type=password],input[type=number],input[type=file]{
  font:inherit;padding:9px 10px;border:1px solid #c9c9c9;border-radius:4px;background:#fff;width:100%}
input[type=number]{width:84px}
button{font:inherit;padding:9px 16px;border:1px solid #151515;border-radius:4px;
  background:#151515;color:#fff;cursor:pointer;min-height:40px}
button.ghost{background:#fff;color:#151515}
button.danger{background:#fff;color:#a11;border-color:#d9a6a6}
label{display:block;font-size:13px;color:#4a4a4a;margin-bottom:4px}
.thumb{width:96px;height:72px;object-fit:cover;border-radius:4px;background:#eee;border:1px solid #e2e2e2}
.hint{color:#5c5c5c;font-size:13px;line-height:1.45;margin:6px 0 0}
.err{background:#fdecec;border:1px solid #f0c2c2;color:#8a1c1c;padding:12px;border-radius:4px;margin-bottom:16px}
.ok{background:#eaf6ec;border:1px solid #bfe0c6;color:#1c5c2a;padding:12px;border-radius:4px;margin-bottom:16px}
.list a{display:block;padding:11px 0;border-bottom:1px solid #eee;text-decoration:none}
.list a:hover{background:#fafafa}
form.inline{display:contents}
progress{width:100%;height:6px}
`;

/**
 * @param who The signed-in account, shown in the bar. With one shared password
 *   there was nothing to show; with accounts there is, and seeing which one you
 *   are is how you notice you are on a colleague's session before you delete
 *   their photographs. Empty string when signed out.
 */
function shell(title: string, body: string, who: string): string {
  return (
    "<!doctype html><html lang=\"sl\"><head><meta charset=\"utf-8\">" +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex, nofollow">' +
    "<title>" + esc(title) + " — nadzorna plošča</title>" +
    "<style>" + CSS + "</style></head><body>" +
    '<header class="bar"><div class="in"><a href="/admin"><strong>Nadzorna plošča</strong></a>' +
    (who
      ? '<span class="sp"></span><span class="who">' + esc(who) + "</span>" +
        '<form method="post" action="/admin/logout">' +
        '<button class="ghost" style="background:transparent;color:#fff;border-color:#555">Odjava</button></form>'
      : "") +
    "</div></header><div class=\"wrap\">" + body + "</div></body></html>"
  );
}

export function loginPage(error?: string): string {
  return shell(
    "Prijava",
    (error ? '<p class="err">' + esc(error) + "</p>" : "") +
      "<h1>Prijava</h1>" +
      '<p class="lede">Nadzorna plošča za slike izdelkov.</p>' +
      '<form method="post" action="/admin/login" class="card">' +
      '<label for="em">E-naslov</label>' +
      '<input id="em" name="email" type="email" autocomplete="username" ' +
      'autocapitalize="none" spellcheck="false" required autofocus>' +
      '<p style="margin:12px 0 0"><label for="pw">Geslo</label>' +
      '<input id="pw" name="password" type="password" autocomplete="current-password" required></p>' +
      '<p style="margin:14px 0 0"><button type="submit">Prijava</button></p>' +
      '<p class="hint">Račune ureja Supabase. Če ste geslo pozabili, ga ponastavite ' +
      "tam; nova prijava velja eno uro.</p>" +
      "</form>",
    "",
  );
}

export function notConfiguredPage(missing: string[]): string {
  // Both remaining settings are PUBLIC values that live in wrangler.jsonc and
  // ship with the code. If this page is ever seen in production, something was
  // deleted from that file — there is no secret to forget to set.
  return shell(
    "Ni nastavljeno",
    "<h1>Nadzorna plošča ni nastavljena</h1>" +
      '<p class="lede">V <code>wrangler.jsonc</code> manjka nastavitev ' +
      "pod <code>vars</code>:</p>" +
      '<div class="card"><ul>' +
      missing.map((m) => "<li><code>" + esc(m) + "</code></li>").join("") +
      "</ul></div>" +
      '<p class="muted">To sta javna podatka, ne skrivnosti — nastavita se v ' +
      "kodi in objavita z naslednjo objavo.</p>",
    "",
  );
}

export interface ModelLink {
  shop: string;
  slug: string;
  name: string;
  count: number;
}

export function indexPage(
  shopName: string,
  shopKey: string,
  models: ModelLink[],
  who = "",
): string {
  return shell(
    "Izdelki",
    "<h1>" + esc(shopName) + "</h1>" +
      '<p class="lede">Izberite model in uredite njegove fotografije.</p>' +
      '<div class="card list">' +
      models
        .map(
          (m) =>
            '<a href="/admin/' + esc(m.shop) + "/" + esc(m.slug) + '">' +
            "<strong>" + esc(m.name) + "</strong> " +
            '<span class="muted">— ' +
            (m.count === 0 ? "brez fotografij" : m.count + (m.count === 1 ? " fotografija" : " fotografij")) +
            "</span></a>",
        )
        .join("") +
      "</div>" +
      '<p class="muted">Ključ trgovine: <code>' + esc(shopKey) + "</code></p>",
    who,
  );
}

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
  return shell(
    name,
    (notice ? '<p class="' + notice.kind + '">' + esc(notice.text) + "</p>" : "") +
      '<p class="muted"><a href="/admin">← vsi modeli</a></p>' +
      "<h1>" + esc(name) + "</h1>" +
      '<p class="lede">Prva fotografija je glavna. Vrstni red določa številka.</p>' +

      "<h2>Nova fotografija</h2>" +
      '<form class="card" method="post" action="' + esc(base) + '/upload" enctype="multipart/form-data" id="up">' +
      '<label for="f">Slika (JPEG, PNG, WebP)</label>' +
      // accept is a HINT to the file picker, not a guarantee — the server
      // reads the magic bytes — but narrowing it stops an operator choosing a
      // 6 MB JPEG and only learning it is refused after the upload.
      '<input id="f" name="file" type="file" accept="image/webp,image/jpeg,image/png,image/avif" required>' +
      '<p class="hint">Slika se v brskalniku samodejno pretvori v WebP in ' +
      'pomanjša v več širin. Shranimo samo WebP.</p>' +
      '<p style="margin:12px 0 0"><label for="alt">Opis slike (obvezno)</label>' +
      '<input id="alt" name="alt" type="text" maxlength="180" required ' +
      'placeholder="Masažni bazen na terasi, pokrit s termo pokrovom"></p>' +
      '<p class="muted" style="margin:6px 0 0">Opis prebere bralnik zaslona in ga uporabi iskalnik. ' +
      "Opišite, kaj je na sliki — ne ponavljajte imena modela.</p>" +
      '<p style="margin:14px 0 0"><button type="submit" id="go">Naloži</button> ' +
      '<span class="muted" id="st"></span></p>' +
      '<progress id="pr" max="100" value="0" hidden></progress>' +
      "</form>" +

      "<h2>Fotografije</h2>" +
      (media.length === 0
        ? '<div class="card"><p class="muted" style="margin:0">Ta model še nima fotografij. ' +
          "Do takrat storitev prikaže risbo izdelka.</p></div>"
        : media
            .map(
              (m) =>
                '<div class="card"><div class="row">' +
                '<img class="thumb" src="/media/' + esc(m.url) + '" alt="" loading="lazy" width="96" height="72">' +
                '<div class="grow">' +
                '<form method="post" action="' + esc(base) + '/update" class="row">' +
                '<input type="hidden" name="id" value="' + esc(m.id) + '">' +
                '<span class="grow"><label>Opis slike</label>' +
                '<input type="text" name="alt" value="' + esc(m.alt) + '" maxlength="180" required></span>' +
                "<span><label>Vrstni red</label>" +
                '<input type="number" name="sort" value="' + String(m.sort) + '" min="0" max="99"></span>' +
                '<span style="align-self:end"><button class="ghost" type="submit">Shrani</button></span>' +
                "</form>" +
                '<p class="muted" style="margin:8px 0 0">' + esc(m.url) +
                (m.widths.length ? " · širine: " + m.widths.join(", ") : " · ena širina") +
                "</p></div>" +
                '<form method="post" action="' + esc(base) + '/delete" ' +
                'onsubmit="return confirm(\'Izbrišem to fotografijo?\')">' +
                '<input type="hidden" name="id" value="' + esc(m.id) + '">' +
                '<button class="danger" type="submit">Izbriši</button></form>' +
                "</div></div>",
            )
            .join("")) +
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
 * WITHOUT SCRIPT the form still submits, and the server stores the original
 * untouched at a single width. That is a worse image, not a broken one.
 */
const UPLOAD_JS = `
(function(){
  "use strict";
  var form = document.getElementById("up");
  if (!form || !window.createImageBitmap || !HTMLCanvasElement.prototype.toBlob) return;
  var file = document.getElementById("f"), go = document.getElementById("go"),
      st = document.getElementById("st"), pr = document.getElementById("pr");

  /* The widths the storefront's slots actually paint, doubled for 2x screens.
     Never upscale: a rung wider than the source is the same pixels in a bigger
     file, and its w descriptor would then be a lie the browser acts on. */
  var LADDER = [480, 800, 1200, 1600];

  function draw(bmp, w){
    var h = Math.round(bmp.height * (w / bmp.width));
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(bmp, 0, 0, w, h);
    return new Promise(function(res){ c.toBlob(res, "image/webp", 0.82); });
  }

  form.addEventListener("submit", function(ev){
    if (!file.files || !file.files[0]) return;
    ev.preventDefault();
    go.disabled = true; pr.hidden = false; pr.value = 0;
    st.textContent = "pretvarjam …";

    createImageBitmap(file.files[0]).then(function(bmp){
      var widths = LADDER.filter(function(w){ return w < bmp.width; });
      widths.push(bmp.width);
      return Promise.all(widths.map(function(w){ return draw(bmp, w); }))
        .then(function(blobs){ return { widths: widths, blobs: blobs }; });
    }).then(function(out){
      var fd = new FormData();
      fd.append("alt", form.querySelector("[name=alt]").value);
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
