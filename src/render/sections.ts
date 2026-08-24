import type { ShopConfig } from "../tenants/types";
import type { ShopContent, ArtKey, ProductCard, UtilCard } from "../content/types";
import type { SectionKey } from "../themes/shared/sections";

/** HTML-escape everything interpolated from content. */
export function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}

export interface RenderCtx {
  shop: ShopConfig;
  content: ShopContent;
  /** Query suffix carrying dev overrides ('' in production). */
  q: string;
  phoneHref: string;
  phoneDisplay: string;
}

/* Product art — duotone scenes; colors ride the theme CSS vars. */
const ART: Record<ArtKey, string> = {
  saunaCabin:
    '<svg viewBox="0 0 240 190" aria-hidden="true">' +
    '<defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity="0.55"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0.22"/></linearGradient></defs>' +
    '<rect x="28" y="18" width="184" height="160" rx="7" fill="url(#gw)"/>' +
    '<rect x="40" y="30" width="160" height="136" rx="4" fill="var(--bg)" opacity="0.55"/>' +
    '<rect x="96" y="42" width="72" height="124" rx="3" fill="var(--acc)" opacity="0.34"/>' +
    '<rect x="96" y="42" width="72" height="124" rx="3" fill="none" stroke="var(--ink)" stroke-opacity="0.5" stroke-width="2"/>' +
    '<circle cx="158" cy="106" r="4" fill="var(--ink)" opacity="0.75"/>' +
    '<g stroke="var(--ink)" stroke-opacity="0.32" stroke-width="2">' +
    '<line x1="52" y1="52" x2="84" y2="52"/><line x1="52" y1="76" x2="84" y2="76"/><line x1="52" y1="100" x2="84" y2="100"/>' +
    '<line x1="178" y1="52" x2="188" y2="52"/><line x1="178" y1="76" x2="188" y2="76"/></g>' +
    '<rect x="52" y="122" width="32" height="44" rx="2" fill="var(--acc)" opacity="0.5"/></svg>',
  tub:
    '<svg viewBox="0 0 240 190" aria-hidden="true">' +
    '<defs><linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity="0.6"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0.25"/></linearGradient></defs>' +
    '<rect x="176" y="52" width="42" height="108" rx="6" fill="var(--ink)" opacity="0.35"/>' +
    '<g stroke="var(--bg)" stroke-width="2" opacity="0.8"><line x1="184" y1="70" x2="210" y2="70"/><line x1="184" y1="82" x2="210" y2="82"/><line x1="184" y1="94" x2="210" y2="94"/></g>' +
    '<path d="M22 78 Q22 64 40 64 L142 64 Q160 64 160 78 L156 138 Q154 160 120 160 L62 160 Q28 160 26 138 Z" fill="url(#gt)"/>' +
    '<ellipse cx="91" cy="72" rx="62" ry="13" fill="var(--acc)" opacity="0.55"/>' +
    '<ellipse cx="91" cy="72" rx="44" ry="8.5" fill="var(--bg)" opacity="0.5"/>' +
    '<ellipse cx="91" cy="72" rx="27" ry="5" fill="var(--acc)" opacity="0.6"/>' +
    '<path d="M60 40 Q64 30 60 22 M80 44 Q84 34 80 26 M100 40 Q104 30 100 22" stroke="var(--ink)" stroke-opacity="0.35" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>',
  pool:
    '<svg viewBox="0 0 240 190" aria-hidden="true">' +
    '<defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity="0.5"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0.2"/></linearGradient></defs>' +
    '<rect x="24" y="34" width="192" height="132" rx="26" fill="url(#gp)"/>' +
    '<rect x="40" y="50" width="160" height="100" rx="18" fill="var(--acc)" opacity="0.45"/>' +
    '<rect x="40" y="50" width="160" height="100" rx="18" fill="var(--bg)" opacity="0.35"/>' +
    '<path d="M52 96 q12 -9 24 0 t24 0 t24 0 t24 0 t24 0" stroke="var(--ink)" stroke-opacity="0.4" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '<path d="M52 118 q12 -9 24 0 t24 0 t24 0 t24 0 t24 0" stroke="var(--ink)" stroke-opacity="0.25" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    '<g fill="var(--ink)" opacity="0.5"><circle cx="62" cy="70" r="4.5"/><circle cx="120" cy="66" r="4.5"/><circle cx="178" cy="70" r="4.5"/></g></svg>',
  chair:
    '<svg viewBox="0 0 240 190" aria-hidden="true">' +
    '<defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity="0.6"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0.24"/></linearGradient></defs>' +
    '<path d="M78 26 Q104 18 112 40 L118 64 Q120 74 112 78 L88 86 Q78 88 76 78 L70 44 Q68 32 78 26 Z" fill="url(#gc)"/>' +
    '<path d="M70 88 Q116 74 128 92 L134 116 Q170 112 186 128 Q198 142 186 152 L120 168 Q64 176 52 148 L48 112 Q48 94 70 88 Z" fill="url(#gc)"/>' +
    '<path d="M134 116 L186 128" stroke="var(--bg)" stroke-width="3" opacity="0.6"/>' +
    '<path d="M60 100 Q100 88 122 98" stroke="var(--bg)" stroke-width="3" fill="none" opacity="0.55"/>' +
    '<rect x="44" y="150" width="20" height="22" rx="4" fill="var(--ink)" opacity="0.4"/>' +
    '<rect x="176" y="152" width="20" height="20" rx="4" fill="var(--ink)" opacity="0.4"/></svg>',
};

function scene(art: ArtKey, cap?: string): string {
  return (
    '<div class="scene">' +
    ART[art] +
    '<span class="floor"></span>' +
    (cap ? '<span class="cap">' + esc(cap) + "</span>" : "") +
    "</div>"
  );
}

function pdpHref(ctx: RenderCtx): string {
  return ctx.shop.routeSlugs["/product"] + "/" + ctx.content.pdp.slug + ctx.q;
}

/* ---- Section renderers — one per SectionKey ---- */

function hero(ctx: RenderCtx): string {
  const c = ctx.content;
  return (
    '<section class="act hero"><div class="hero-canvas"><div class="wrap hero-grid">' +
    '<div><p class="eyebrow">' + esc(c.kicker) + "</p>" +
    '<h1 class="display" style="margin-top:20px">' + esc(c.h1) + "</h1>" +
    '<p class="sub">' + esc(c.sub) + "</p>" +
    '<div class="ctas"><a class="btn btn-fill" href="#izbor">' + esc(c.cta) + "</a>" +
    '<a class="btn btn-ghost" href="' + ctx.phoneHref + '">Pokličite ' + esc(ctx.phoneDisplay) + "</a></div></div>" +
    '<div class="hero-scene">' + scene(c.artKey, "fotografija: hero ambient") + "</div>" +
    "</div></div></section>"
  );
}

function trust(ctx: RenderCtx): string {
  return (
    '<section class="act act-trust"><div class="wrap"><div class="trust-grid">' +
    ctx.content.trust.map((t) => '<span class="trust-item">' + esc(t) + "</span>").join("") +
    "</div></div></section>"
  );
}

function stats(ctx: RenderCtx): string {
  return (
    '<section class="act act-trust"><div class="wrap"><div class="stats-grid">' +
    ctx.content.stats
      .map((s) => '<div class="stat"><div class="v">' + esc(s[0]) + '</div><div class="l">' + esc(s[1]) + "</div></div>")
      .join("") +
    "</div></div></section>"
  );
}

function products(ctx: RenderCtx): string {
  const href = pdpHref(ctx);
  return (
    '<section class="act" id="izbor"><div class="wrap">' +
    '<div class="act-head"><div><p class="eyebrow">Ponudba</p>' +
    '<h2 class="display" style="margin-top:14px">Izbrano. Ne nakopičeno.</h2></div>' +
    '<p class="lede">Vsak model smo pripeljali, sestavili in preizkusili sami, preden je prišel v ponudbo.</p></div>' +
    '<div class="prod-grid">' +
    ctx.content.products
      .map((p: ProductCard | UtilCard) => {
        if ("util" in p) {
          return (
            '<a class="card util" href="' + href + '"><h3 class="display">' + esc(p.h) + "</h3><p>" + esc(p.p) +
            '</p><span class="go">' + esc(p.cta) + "</span></a>"
          );
        }
        return (
          '<a class="card" href="' + href + '">' +
          (p.badge ? '<span class="badge">' + esc(p.badge) + "</span>" : "") +
          scene(p.art) +
          '<span class="body"><h3 class="display">' + esc(p.name) + "</h3>" +
          '<span class="desc">' + esc(p.desc) + "</span>" +
          '<span class="meta">' + esc(p.meta) + "</span>" +
          '<span class="price-row"><span class="price">' + esc(p.price) +
          '</span><span class="vat">z DDV</span><span class="go">Poglej →</span></span></span></a>'
        );
      })
      .join("") +
    "</div></div></section>"
  );
}

function moat(ctx: RenderCtx): string {
  const m = ctx.content.moat;
  return (
    '<section class="act act-moat" id="dostava"><div class="wrap">' +
    '<div class="act-head"><div><p class="eyebrow">Dostava in montaža</p>' +
    '<h2 class="display" style="margin-top:14px">' + esc(m.h2) + "</h2></div></div>" +
    '<div class="steps">' +
    m.steps.map((st) => '<div class="step"><h3>' + esc(st[0]) + "</h3><p>" + esc(st[1]) + "</p></div>").join("") +
    "</div>" +
    '<p class="moat-claim display">' + esc(m.claim[0]) + "<em>" + esc(m.claim[1]) + "</em></p>" +
    "</div></section>"
  );
}

function reviews(ctx: RenderCtx): string {
  return (
    '<section class="act"><div class="wrap">' +
    '<div class="act-head"><div><p class="eyebrow">Mnenja strank</p>' +
    '<h2 class="display" style="margin-top:14px">Preverjena. Vsako od njih.</h2></div>' +
    '<p class="lede">Objavimo samo mnenja, ki jih lahko povežemo z naročilom.</p></div>' +
    '<div class="rev-grid">' +
    ctx.content.reviews
      .map(
        (r) =>
          '<figure class="rev"><span class="stars" aria-label="5 od 5">★★★★★</span>' +
          "<blockquote>“" + esc(r.q) + "”</blockquote>" +
          '<figcaption class="who">' + esc(r.who) +
          '<span class="vrf">Preverjen nakup · ' + esc(r.model) + "</span></figcaption></figure>",
      )
      .join("") +
    "</div></div></section>"
  );
}

function guides(ctx: RenderCtx): string {
  const base = ctx.shop.routeSlugs["/guides"];
  return (
    '<section class="act" id="vodniki"><div class="wrap">' +
    '<div class="act-head"><div><p class="eyebrow">Vodniki</p>' +
    '<h2 class="display" style="margin-top:14px">Preden kupite, preberite.</h2></div></div>' +
    '<div class="guide-grid">' +
    ctx.content.guides
      .map(
        (g) =>
          '<a class="guide" href="' + base + ctx.q + '"><span class="k">' + esc(g[0]) + "</span>" +
          '<h3 class="display">' + esc(g[1]) + '</h3><span class="read">Preberite vodnik →</span></a>',
      )
      .join("") +
    "</div></div></section>"
  );
}

const SECTION_RENDERERS: Record<SectionKey, ((ctx: RenderCtx) => string) | null> = {
  hero,
  trust,
  stats,
  finder: null, // arrives with the interactive island
  products,
  moat,
  reviews,
  guides,
  financing: null,
  showroom: null,
  faq: null,
};

export function renderSection(key: SectionKey, ctx: RenderCtx): string {
  const fn = SECTION_RENDERERS[key];
  return fn ? fn(ctx) : "";
}

/* ---- PDP ---- */
export function renderPdpBody(ctx: RenderCtx): string {
  const d = ctx.content.pdp;
  return (
    '<section class="act"><div class="wrap"><div class="pdp-grid">' +
    '<div class="gallery">' + scene(ctx.content.artKey, "fotografija: galerija") +
    '<div class="thumbs">' + [0, 1, 2].map(() => scene(ctx.content.artKey)).join("") + "</div></div>" +
    '<div class="buy"><p class="eyebrow">' + esc(d.eyebrow) + "</p>" +
    '<h1 class="display" style="margin-top:14px">' + esc(d.title) + "</h1>" +
    '<p class="sub">' + esc(d.sub) + "</p>" +
    '<p class="price">' + esc(d.price) + " <small>z DDV</small></p>" +
    '<div class="cfg">' +
    d.cfg
      .map(
        (g) =>
          "<div><h3>" + esc(g[0]) + '</h3><div class="opts">' +
          g[1]
            .map((o, i) => '<span class="opt"' + (i === g[2] ? " data-on" : "") + ">" + esc(o) + "</span>")
            .join("") +
          "</div></div>",
      )
      .join("") +
    "</div>" +
    '<div class="freightbox">' +
    d.freight
      .map(
        (r) =>
          '<div class="row"><span>' + esc(r[0]) + "</span><strong" + (r[2] ? ' class="inc"' : "") + ">" +
          esc(r[1]) + "</strong></div>",
      )
      .join("") +
    '<div class="note">' + esc(d.note) + "</div></div></div></div>" +
    '<div class="spec"><h2 class="display">Tehnični podatki</h2><div class="spec-table">' +
    d.spec
      .map((row) => '<dl class="spec-row"><dt>' + esc(row[0]) + "</dt><dd>" + esc(row[1]) + "</dd></dl>")
      .join("") +
    "</div></div>" +
    '<div class="buybar"><span class="sum"><strong>' + esc(d.bar[0]) + "</strong> · " + esc(d.bar[1]) + "</span>" +
    '<span class="price">' + esc(d.bar[2]) + "</span>" +
    '<a class="btn btn-fill" href="' + ctx.shop.routeSlugs["/contact"] + ctx.q + '">' + esc(d.bar[3]) + "</a></div>" +
    "</div></section>"
  );
}

/* ---- Chrome ---- */
export function renderHeader(ctx: RenderCtx): string {
  const s = ctx.shop;
  const c = ctx.content;
  const links = [
    ["/products", c.nav[0]],
    ["/compare", c.nav[1]],
    ["/guides", c.nav[2]],
    ["/delivery", c.nav[3]],
    ["/contact", c.nav[4]],
  ] as const;
  return (
    '<header class="shophead"><div class="wrap">' +
    '<a class="wordmark display" href="/' + ctx.q + '">' + esc(s.wordmark[0]) + "<em>" + esc(s.wordmark[1]) + "</em></a>" +
    '<nav class="nav" aria-label="Glavni meni">' +
    links.map(([k, label]) => '<a href="' + s.routeSlugs[k] + ctx.q + '">' + esc(label) + "</a>").join("") +
    "</nav>" +
    '<a class="head-phone" href="' + ctx.phoneHref + '">' + esc(ctx.phoneDisplay) +
    " <small>pon–pet, 8.00–18.00</small></a>" +
    "</div></header>"
  );
}

export function renderFooter(ctx: RenderCtx): string {
  const s = ctx.shop;
  const c = ctx.content;
  const col = (title: string, items: [string, string][]) =>
    "<div><h4>" + esc(title) + "</h4><ul>" +
    items.map(([href, label]) => '<li><a href="' + href + ctx.q + '">' + esc(label) + "</a></li>").join("") +
    "</ul></div>";
  return (
    '<footer><div class="wrap"><div class="foot-grid">' +
    '<div class="foot-brand"><span class="wordmark display">' + esc(s.wordmark[0]) + "<em>" + esc(s.wordmark[1]) + "</em></span>" +
    "<p>" + esc(c.footNote) + '</p><a class="tel" href="' + ctx.phoneHref + '">' + esc(ctx.phoneDisplay) + "</a></div>" +
    col("Trgovina", [
      [s.routeSlugs["/products"], c.nav[0]],
      [s.routeSlugs["/compare"], "Primerjava modelov"],
      [s.routeSlugs["/guides"], "Vodniki"],
      [s.routeSlugs["/financing"], "Financiranje"],
    ]) +
    col("Pomoč", [
      [s.routeSlugs["/delivery"], "Dostava in montaža"],
      [s.routeSlugs["/faq"], "Pogosta vprašanja"],
      [s.routeSlugs["/showroom"], "Razstavni salon"],
      [s.routeSlugs["/contact"], "Kontakt"],
    ]) +
    col("Pravno", [
      [s.routeSlugs["/terms"], "Pogoji poslovanja"],
      [s.routeSlugs["/privacy"], "Zasebnost"],
      [s.routeSlugs["/cookies"], "Piškotki"],
      [s.routeSlugs["/withdrawal"], "Odstop od pogodbe"],
    ]) +
    '</div><div class="legalline">' +
    esc(s.company.legalName + " · ID za DDV: " + s.company.vatId + " · " +
      s.contact.address.street + ", " + s.contact.address.zip + " " + s.contact.address.city) +
    "</div></div></footer>"
  );
}
