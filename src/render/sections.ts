import type { ShopConfig } from "../tenants/types";
import type { ShopContent, ArtKey, ProductCard, UtilCard, PdpContent } from "../content/types";
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
  /**
   * The product page being rendered, and the one the home page's cards and
   * hero point at.
   *
   * A shop used to have exactly one product page, so every renderer read
   * `content.pdp` directly. bazen now carries nine models, and nine cards all
   * linking to one page is not a catalogue — it is a page that looks broken.
   * Renderers read this instead; the router sets it from the URL, and it
   * defaults to `content.pdp` (the flagship) everywhere else.
   */
  pdp: PdpContent;
  /** Query suffix carrying dev overrides ('' in production). */
  q: string;
  phoneHref: string;
  phoneDisplay: string;
}

/* Product art — duotone scenes; colors ride the theme CSS vars. Redrawn
 * after the v1 screenshot audit: the sauna gains glass, an interior bench
 * and heater glow (and a width per model); the plunge tub loses its floating
 * steam curls for in-water ripples and gains a connected chiller; the pool
 * top-view loses the two eye-like jets that made it read as a face. */

function saunaSvg(w: number): string {
  const x0 = (240 - w) / 2;
  const doorX = 120 - 26;
  return (
    '<svg viewBox="0 0 240 190" aria-hidden="true">' +
    '<defs><linearGradient id="gw' + w + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity="0.5"/>' +
    '<stop offset="1" stop-color="var(--acc)" stop-opacity="0.18"/></linearGradient>' +
    '<linearGradient id="gd' + w + '" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--bg)" stop-opacity="0.55"/>' +
    '<stop offset="1" stop-color="var(--bg)" stop-opacity="0.25"/></linearGradient></defs>' +
    // roof cap + body
    '<rect x="' + (x0 - 8) + '" y="14" width="' + (w + 16) + '" height="11" rx="4" fill="var(--acc)" opacity="0.45"/>' +
    '<rect x="' + x0 + '" y="25" width="' + w + '" height="143" rx="5" fill="url(#gw' + w + ')"/>' +
    // side slats
    '<g stroke="var(--ink)" stroke-opacity="0.22" stroke-width="2">' +
    [46, 66, 86, 106, 126].map((y) =>
      '<line x1="' + (x0 + 10) + '" y1="' + y + '" x2="' + (doorX - 8) + '" y2="' + y + '"/>' +
      '<line x1="' + (doorX + 60) + '" y1="' + y + '" x2="' + (x0 + w - 10) + '" y2="' + y + '"/>'
    ).join('') + '</g>' +
    // glass door with interior: bench + under-bench heater glow
    '<rect x="' + doorX + '" y="40" width="52" height="126" rx="3" fill="url(#gd' + w + ')"/>' +
    '<ellipse cx="120" cy="152" rx="22" ry="12" fill="var(--acc)" opacity="0.55"/>' +
    '<rect x="' + (doorX + 8) + '" y="112" width="36" height="5" rx="2" fill="var(--ink)" opacity="0.5"/>' +
    '<rect x="' + (doorX + 12) + '" y="117" width="4" height="18" fill="var(--ink)" opacity="0.35"/>' +
    '<rect x="' + (doorX + 36) + '" y="117" width="4" height="18" fill="var(--ink)" opacity="0.35"/>' +
    '<rect x="' + doorX + '" y="40" width="52" height="126" rx="3" fill="none" stroke="var(--ink)" stroke-opacity="0.5" stroke-width="2"/>' +
    '<circle cx="' + (doorX + 45) + '" cy="104" r="3.5" fill="var(--ink)" opacity="0.8"/>' +
    // feet
    '<rect x="' + (x0 + 6) + '" y="168" width="14" height="7" rx="2" fill="var(--ink)" opacity="0.45"/>' +
    '<rect x="' + (x0 + w - 20) + '" y="168" width="14" height="7" rx="2" fill="var(--ink)" opacity="0.45"/>' +
    '</svg>'
  );
}

/**
 * The KERNEL's drawings, for a theme that has not supplied its own.
 *
 * Partial on purpose. Studio overrides the products section and draws from
 * src/themes/studio/product-art.ts, so nothing here is reached today — and
 * "swimspa" is deliberately absent rather than aliased to "pool". A 5.8 m
 * shell drawn as a 2 m square tub is the same class of error as a photograph
 * of the wrong model, and an unreachable fallback is exactly where that kind
 * of lie survives unnoticed. A missing key renders the neutral panel, which
 * is the same choice product-art.ts makes by returning null.
 */
const ART: Partial<Record<ArtKey, string>> = {
  pool:
    // Side elevation, deliberately asymmetric — the earlier top view kept
    // reading as a face (paired headrests = eyes). One headrest, one control
    // panel, panelled cabinet: a product shot silhouette, not a smiley.
    '<svg viewBox="0 0 240 190" aria-hidden="true">' +
    '<defs><linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity="0.5"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0.2"/></linearGradient></defs>' +
    // one back headrest + control panel on the rim (asymmetric)
    '<rect x="54" y="50" width="36" height="11" rx="5" fill="var(--ink)" opacity="0.45"/>' +
    '<rect x="166" y="52" width="24" height="9" rx="3" fill="var(--ink)" opacity="0.5"/>' +
    '<circle cx="186" cy="56" r="1.8" fill="var(--acc)"/>' +
    // rim lip + water surface with one ripple
    '<rect x="24" y="61" width="192" height="18" rx="9" fill="var(--acc)" opacity="0.55"/>' +
    '<ellipse cx="120" cy="70" rx="84" ry="7.5" fill="var(--bg)" opacity="0.45"/>' +
    '<path d="M60 70 q10 -5 20 0 t20 0 t20 0 t20 0 t20 0" stroke="var(--ink)" stroke-opacity="0.35" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    // panelled cabinet
    '<rect x="30" y="79" width="180" height="82" rx="10" fill="url(#gp)"/>' +
    '<g stroke="var(--ink)" stroke-opacity="0.22" stroke-width="2">' +
    '<line x1="58" y1="86" x2="58" y2="154"/><line x1="86" y1="86" x2="86" y2="154"/>' +
    '<line x1="114" y1="86" x2="114" y2="154"/><line x1="142" y1="86" x2="142" y2="154"/>' +
    '<line x1="170" y1="86" x2="170" y2="154"/></g>' +
    // LED underline + feet
    '<line x1="44" y1="158" x2="196" y2="158" stroke="var(--acc)" stroke-opacity="0.6" stroke-width="2.5" stroke-linecap="round"/>' +
    '<rect x="40" y="163" width="16" height="7" rx="2" fill="var(--ink)" opacity="0.45"/>' +
    '<rect x="184" y="163" width="16" height="7" rx="2" fill="var(--ink)" opacity="0.45"/>' +
    '</svg>',
};

function scene(art: ArtKey, cap?: string): string {
  return (
    '<div class="scene">' +
    (ART[art] ?? "") +
    '<span class="floor"></span>' +
    (cap ? '<span class="cap">' + esc(cap) + "</span>" : "") +
    "</div>"
  );
}

function pdpHref(ctx: RenderCtx, slug?: string): string {
  return ctx.shop.routeSlugs["/product"] + "/" + (slug ?? ctx.pdp.slug) + ctx.q;
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
    '<div class="hero-scene">' + scene(c.artKey, "vizualizacija — fotografije v pripravi") + "</div>" +
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
          '<a class="card" href="' + pdpHref(ctx, p.slug) + '">' +
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

/**
 * Marquee — the studio theme's signature USP ticker. Duplicated track so the
 * CSS translate loops seamlessly; aria-hidden on the clone. Pure CSS, paused
 * under prefers-reduced-motion.
 */
function marquee(ctx: RenderCtx): string {
  const items = ctx.content.trust;
  const track = (hidden: boolean) =>
    '<span class="mq-track"' + (hidden ? ' aria-hidden="true"' : "") + ">" +
    items.map((t) => '<span class="mq-item">' + esc(t) + "</span>").join("") +
    "</span>";
  return (
    '<section class="marquee"><div class="mq-viewport">' +
    track(false) + track(true) +
    "</div></section>"
  );
}

const SECTION_RENDERERS: Record<SectionKey, ((ctx: RenderCtx) => string) | null> = {
  hero,
  trust,
  marquee,
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
  const d = ctx.pdp;
  return (
    '<section class="act"><div class="wrap"><div class="pdp-grid">' +
    '<div class="gallery">' + scene(ctx.content.artKey, "vizualizacija") +
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
    // Add-ons. The legacy themes have no configurator device, so this is a
    // plain priced list rather than the studio theme's checkboxes — but the
    // information cannot simply vanish when a shop wears another theme, which
    // is what happens when a renderer quietly ignores a content field.
    ((d.addons ?? []).length
      ? '<div class="cfg"><div><h3>Dodatna oprema</h3><div class="opts">' +
        (d.addons ?? [])
          .map(
            (x) =>
              '<span class="opt">' + esc(x.label) +
              (x.qty ? " (" + esc(x.qty) + ")" : "") + " — " + esc(x.price) + "</span>",
          )
          .join("") +
        "</div></div></div>"
      : "") +
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
    // HOME · SHOP · ABOUT · BLOG · CONTACT — the five a storefront actually
    // needs. It used to be Bazeni · Primerjava · Vodniki · Dostava · Kontakt,
    // which is five pages ABOUT one product and no way to reach the other
    // family. "Trgovina" is now a real hub over both.
    ["/products", c.nav[0]],
    ["/about", c.nav[1]],
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
