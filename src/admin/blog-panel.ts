/**
 * The blog, inside the admin panel.
 *
 * ⚠️ IT WEARS panel.ts's CHROME AND CARRIES ITS OWN STYLESHEET. The bar, the
 * account label and the sign-out come from `shell` — two admin pages whose
 * chrome disagrees is how an operator stops trusting which session they are
 * in. The handful of rules an editor needs and a photograph manager does not
 * (a textarea, a status pill, a row of posts) are declared here instead of
 * being appended to a stylesheet every page in the panel already carries. The
 * admin CSP allows 'unsafe-inline' for style, so this costs nothing.
 *
 * ⚠️ AND THE EDITOR IS A TEXTAREA, NOT A RICH-TEXT FIELD. Every rich editor
 * eventually stores HTML, and HTML written in a browser and rendered on a
 * storefront is how a shop serves somebody else's script the day an admin
 * account is taken. What the operator types is parsed into the same block
 * vocabulary the editorial pages use (src/blog/post.ts), and the theme escapes
 * every string it renders — so the worst a post can do to the site is read
 * badly. The four markers are printed beside the field rather than documented
 * somewhere nobody will look.
 */

import { shell } from "./panel";
import { dateText, type Post } from "../blog/post";
import { esc } from "../render/sections";

const CSS = `<style>
.blog-new{margin-left:auto}
.posts{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.post{background:var(--card);border:1px solid var(--line);
  border-radius:var(--r-card);padding:14px 16px;display:flex;gap:14px;
  align-items:center;flex-wrap:wrap}
.post .grow{flex:1;min-width:180px}
.post .t{display:block;font-weight:600;color:var(--ink);line-height:1.35;
  text-decoration:none}
.post .t:hover{text-decoration:underline}
.post .sub{display:block;color:var(--mute);font-size:13px;margin-top:3px}
.post .thumb-s{width:76px;height:52px;object-fit:cover;flex:none;
  border-radius:var(--r-ctrl);border:1px solid var(--line)}
/* The status is a WORD, not a colour. A green dot means nothing to somebody
   who has not been told what it means, and this is the one fact on the row
   that decides whether the public can read the post. */
.pill{font-size:12px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;
  padding:4px 9px;border-radius:999px;border:1px solid var(--line);
  color:var(--mute);background:#fff;white-space:nowrap}
.pill--live{color:var(--ok);border-color:var(--ok-line);background:var(--ok-wash)}
textarea{font:inherit;width:100%;padding:11px 12px;color:var(--ink-body);
  background:#fff;border:1px solid var(--line-ctrl);border-radius:var(--r-ctrl);
  line-height:1.6;resize:vertical}
textarea:hover{border-color:#6f6f6f}
textarea:focus{border-color:var(--ink);outline:none;
  box-shadow:0 0 0 2px rgba(21,21,21,.12)}
/* The body field is the page. 22 rows is about a screen on a laptop, which is
   the least that lets somebody see the shape of what they are writing. */
#body{min-height:44vh}
.syntax{margin:9px 0 0;padding:11px 13px;background:var(--paper);
  border-left:2px solid var(--ink);border-radius:0 var(--r-ctrl) var(--r-ctrl) 0;
  color:var(--ink-body);font-size:13px;line-height:1.7}
.syntax code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;
  font-size:12px;background:#fff;border:1px solid var(--line);
  border-radius:4px;padding:1px 5px}
.acts{display:flex;gap:10px;flex-wrap:wrap;align-items:center;
  margin-top:22px;padding-top:20px;border-top:1px solid var(--line)}
.acts .spacer{margin-left:auto}
.live-link{display:block;margin:0 0 20px;font-size:14px}
.cover-now{display:block;max-width:340px;width:100%;border-radius:var(--r-ctrl);
  border:1px solid var(--line);margin:0 0 12px}
</style>`;

function notice(n?: { kind: "ok" | "err"; text: string }): string {
  if (!n) return "";
  return (
    '<p class="note note--' + n.kind + '" role="' +
    (n.kind === "err" ? "alert" : "status") + '">' + esc(n.text) + "</p>"
  );
}

/** "3 zapisi" — the same four Slovenian forms photoCount() spells out. */
export function postCount(n: number): string {
  if (n === 0) return "ni zapisov";
  const teen = n % 100;
  if (teen >= 11 && teen <= 14) return n + " zapisov";
  const unit = n % 10;
  if (unit === 1) return n + " zapis";
  if (unit === 2) return n + " zapisa";
  if (unit === 3 || unit === 4) return n + " zapisi";
  return n + " zapisov";
}

/**
 * When a post was last touched, in a form somebody can read at a glance.
 *
 * The published date where there is one, because that is the date the post
 * carries on the site; otherwise the last edit, because a draft has no other
 * date worth showing.
 */
function when(p: Post): string {
  if (p.status === "published" && p.publishedAt) {
    const t = dateText(p.publishedAt);
    return t ? "objavljeno " + t : "objavljeno";
  }
  const t = p.updatedAt ? dateText(p.updatedAt) : "";
  return t ? "urejeno " + t : "osnutek";
}

export function blogListPage(
  posts: readonly Post[],
  who: string,
  n?: { kind: "ok" | "err"; text: string },
): string {
  const rows =
    posts.length === 0
      ? '<p class="empty">Še ni nobenega zapisa. Prvi bo tudi prva stran, ' +
        "ki jo bo Google našel pod vprašanjem, na katerega odgovarja.</p>"
      : '<ul class="posts">' +
        posts
          .map(
            (p) =>
              '<li class="post">' +
              (p.coverUrl
                ? '<img class="thumb-s" src="' + esc(p.coverUrl) +
                  '" alt="" loading="lazy" width="76" height="52">'
                : "") +
              '<span class="grow">' +
              '<a class="t" href="/admin/blog/' + esc(p.id) + '">' + esc(p.title) + "</a>" +
              '<span class="sub">' + esc(when(p)) + " · /blog/" + esc(p.slug) + "</span>" +
              "</span>" +
              '<span class="pill' + (p.status === "published" ? " pill--live" : "") + '">' +
              (p.status === "published" ? "Objavljeno" : "Osnutek") +
              "</span></li>",
          )
          .join("") +
        "</ul>";
  return shell(
    "Blog",
    CSS +
      '<div class="head"><a class="back" href="/admin">Nazaj na izdelke</a>' +
      "<h1>Blog</h1>" +
      '<p class="lede">Zapisi so na spletni strani takoj po objavi — ' +
      "za to ni potrebna nobena posodobitev trgovine.</p></div>" +
      notice(n) +
      '<div class="head-row"><h2>Zapisi</h2>' +
      '<span class="muted">' + esc(postCount(posts.length)) + "</span>" +
      '<a class="btn blog-new" href="/admin/blog/nov">Nov zapis</a></div>' +
      rows,
    who,
  );
}

/** The field-by-field explanation of what the body field understands. */
const SYNTAX =
  '<p class="syntax">' +
  "<b>Kako pišete:</b> prazna vrstica začne nov odstavek. " +
  "<code>## Naslov</code> naredi naslov razdelka. " +
  "<code>- besedilo</code> naredi alinejo. " +
  "<code>V: vprašanje</code> in v naslednji vrstici <code>O: odgovor</code> " +
  "naredita vprašanje in odgovor — ta se Googlu pokaže kot razširjen rezultat. " +
  "Vse drugo je navaden odstavek.</p>";

/**
 * The editor.
 *
 * @param post The post being edited, or null for a new one. A new post has no
 *   id, so it has no cover form and no publish button: there is nothing to
 *   attach a picture to and nothing to publish until it has been saved once.
 */
export function blogEditPage(
  post: Post | null,
  who: string,
  siteUrl: string,
  n?: { kind: "ok" | "err"; text: string },
): string {
  const action = post ? "/admin/blog/" + esc(post.id) : "/admin/blog/nov";
  const live = post?.status === "published";
  const url = post ? siteUrl + "/blog/" + post.slug : "";

  const cover = !post
    ? ""
    : '<div class="card"><h2>Naslovna slika</h2>' +
      '<p class="hint">Neobvezna. Pokaže se na seznamu zapisov, na vrhu zapisa ' +
      "in na povezavi, ko jo kdo deli. Sliko pretvorimo v WebP v vašem " +
      "brskalniku — naložite, kar imate.</p>" +
      (post.coverUrl
        ? '<img class="cover-now" src="' + esc(post.coverUrl) + '" alt="" width="340">'
        : "") +
      '<form method="post" action="/admin/blog/' + esc(post.id) +
      '/cover" enctype="multipart/form-data" id="coverf">' +
      '<div class="field"><label for="cf">Slika</label>' +
      '<input type="file" id="cf" name="file" accept="image/*" required></div>' +
      '<div class="field"><label for="ca">Opis slike</label>' +
      '<input type="text" id="ca" name="alt" maxlength="180" value="' +
      esc(post.coverAlt) + '" placeholder="Kaj je na sliki — za bralce zaslona in za Google"></div>' +
      '<p class="stline" id="cst" role="status"></p>' +
      '<p style="margin:14px 0 0"><button class="btn btn--ghost" type="submit">Naloži sliko</button>' +
      (post.coverUrl
        ? ' <button class="btn btn--ghost" type="submit" form="coverdel">Odstrani sliko</button>'
        : "") +
      "</p></form>" +
      (post.coverUrl
        ? '<form method="post" action="/admin/blog/' + esc(post.id) +
          '/cover-clear" id="coverdel" hidden></form>'
        : "") +
      "</div>";

  const acts = !post
    ? '<div class="acts"><button class="btn" type="submit">Shrani osnutek</button>' +
      '<a class="btn btn--ghost" href="/admin/blog">Prekliči</a></div>'
    : '<div class="acts"><button class="btn" type="submit">Shrani</button>' +
      '<button class="btn btn--ghost" type="submit" name="then" value="' +
      (live ? "unpublish" : "publish") + '">' +
      (live ? "Shrani in umakni" : "Shrani in objavi") + "</button>" +
      '<span class="spacer"></span>' +
      '<button class="btn btn--danger btn--sm" type="submit" form="delf">Izbriši zapis</button>' +
      "</div>";

  return shell(
    post ? "Uredi zapis" : "Nov zapis",
    CSS +
      '<div class="head"><a class="back" href="/admin/blog">Nazaj na blog</a>' +
      "<h1>" + (post ? esc(post.title) || "Zapis" : "Nov zapis") + "</h1>" +
      (post
        ? '<p class="lede">' +
          (live ? "Objavljeno in vidno vsem." : "Osnutek — vidite ga samo vi.") +
          "</p>"
        : '<p class="lede">Napišite naslov in besedilo. Objavite lahko takoj ' +
          "ali pustite kot osnutek.</p>") +
      "</div>" +
      notice(n) +
      (live
        ? '<p class="live-link"><a href="' + esc(url) + '" target="_blank" rel="noopener">' +
          esc(url) + "</a></p>"
        : "") +
      '<form method="post" action="' + action + '" class="card">' +
      '<div class="field"><label for="title">Naslov</label>' +
      '<input type="text" id="title" name="title" maxlength="140" required ' +
      'value="' + esc(post?.title ?? "") + '" ' +
      'placeholder="Npr. Koliko elektrike porabi masažni bazen"></div>' +
      '<div class="field" style="margin-top:16px"><label for="excerpt">Povzetek</label>' +
      '<textarea id="excerpt" name="excerpt" rows="2" maxlength="300" ' +
      'placeholder="Dva stavka. Če pustite prazno, vzamemo prvi odstavek.">' +
      esc(post?.excerpt ?? "") + "</textarea>" +
      '<p class="hint">To je tudi opis, ki ga Google pokaže pod naslovom. ' +
      "Do 155 znakov se izpiše v celoti.</p></div>" +
      '<div class="field" style="margin-top:16px"><label for="body">Besedilo</label>' +
      '<textarea id="body" name="body" rows="22">' + esc(post?.source ?? "") + "</textarea>" +
      SYNTAX + "</div>" +
      acts +
      "</form>" +
      (post
        ? '<form method="post" action="/admin/blog/' + esc(post.id) +
          '/delete" id="delf" hidden></form>'
        : "") +
      cover +
      (post ? "<script>" + COVER_JS + "</script>" : ""),
    who,
  );
}

/**
 * The cover upload, converted in the browser.
 *
 * ⚠️ A NARROWER COPY OF panel.ts's CONVERTER, and deliberately not an import
 * of it. That one is a whole pipeline: many files, per-row progress, the
 * optional 2K upscaler, a width ladder. A cover is one picture at one size,
 * and wiring this form into that machinery would have meant either
 * generalising it — on a page an operator uses once per post — or exporting
 * half of it. What is shared is the part that matters: the same WebP check on
 * the same bytes, because toBlob silently hands back a PNG on browsers that
 * cannot encode WebP, and the server refuses the lie either way.
 *
 * 1600px wide is the cover's largest useful size: it is displayed at most at
 * the 46rem content column on a 2× screen, and anything above that is bytes
 * nobody sees.
 */
const COVER_JS = `
(function(){
  var form = document.getElementById("coverf");
  if (!form) return;
  var input = document.getElementById("cf");
  var out = document.getElementById("cst");
  var btn = form.querySelector("button[type=submit]");
  if (!form.requestSubmit || !window.FormData || !HTMLCanvasElement.prototype.toBlob) return;

  function say(t, bad){ out.textContent = t; out.className = "stline" + (bad ? " is-bad" : ""); }

  function decode(f){
    if (window.createImageBitmap) return createImageBitmap(f);
    return new Promise(function(res, rej){
      var img = new Image(), url = URL.createObjectURL(f);
      img.onload = function(){ URL.revokeObjectURL(url); res(img); };
      img.onerror = function(){ URL.revokeObjectURL(url); rej(new Error("slike ni bilo mogoce prebrati")); };
      img.src = url;
    });
  }

  function isWebp(buf){
    var b = new Uint8Array(buf);
    return b.length > 12 && b[0] === 82 && b[1] === 73 && b[2] === 70 && b[3] === 70 &&
      b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80;
  }

  function toWebp(f){
    return decode(f).then(function(bmp){
      var sw = bmp.width || bmp.naturalWidth, sh = bmp.height || bmp.naturalHeight;
      var w = Math.min(1600, sw), h = Math.round(sh * (w / sw));
      var c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(bmp, 0, 0, w, h);
      return new Promise(function(res, rej){
        c.toBlob(function(blob){
          if (!blob) { rej(new Error("pretvorba ni uspela")); return; }
          blob.arrayBuffer().then(function(buf){
            if (!isWebp(buf)) {
              rej(new Error("ta brskalnik ne zna shraniti v WebP — poskusite v Chromu"));
              return;
            }
            res(blob);
          }, function(){ rej(new Error("pretvorba ni uspela")); });
        }, "image/webp", 0.82);
      });
    });
  }

  form.addEventListener("submit", function(ev){
    var f = input.files && input.files[0];
    if (!f) return;
    if (form.dataset.ready === "1") return;
    ev.preventDefault();
    btn.disabled = true;
    say("pripravljam sliko…");
    toWebp(f).then(function(blob){
      var dt = new DataTransfer();
      dt.items.add(new File([blob], "cover.webp", { type: "image/webp" }));
      input.files = dt.files;
      form.dataset.ready = "1";
      say("nalagam…");
      form.requestSubmit();
    }, function(err){
      btn.disabled = false;
      say(err.message || "pretvorba ni uspela", true);
    });
  });
})();
`;
