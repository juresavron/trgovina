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

const ART: Record<ArtKey, string> = {
  saunaDuo: saunaSvg(136),
  saunaQuattro: saunaSvg(190),
  tub:
    '<svg viewBox="0 0 240 190" aria-hidden="true">' +
    '<defs><linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity="0.6"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0.25"/></linearGradient></defs>' +
    // chiller unit: accent status light, grill, hose into the tub
    '<rect x="178" y="56" width="42" height="110" rx="7" fill="var(--ink)" opacity="0.35"/>' +
    '<g stroke="var(--bg)" stroke-width="2.5" opacity="0.8"><line x1="186" y1="76" x2="212" y2="76"/><line x1="186" y1="88" x2="212" y2="88"/><line x1="186" y1="100" x2="212" y2="100"/></g>' +
    '<circle cx="212" cy="64" r="3" fill="var(--acc)"/>' +
    '<path d="M160 118 C 172 118 172 132 182 138" stroke="var(--ink)" stroke-opacity="0.45" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    // tub with in-water ripples (no floating steam)
    '<path d="M20 76 Q20 62 38 62 L142 62 Q160 62 160 76 L156 138 Q154 162 118 162 L60 162 Q26 162 24 138 Z" fill="url(#gt)"/>' +
    '<ellipse cx="90" cy="70" rx="62" ry="13" fill="var(--acc)" opacity="0.55"/>' +
    '<ellipse cx="90" cy="70" rx="46" ry="9" fill="var(--bg)" opacity="0.45"/>' +
    '<ellipse cx="90" cy="70" rx="32" ry="6" fill="none" stroke="var(--ink)" stroke-opacity="0.35" stroke-width="1.5"/>' +
    '<ellipse cx="90" cy="70" rx="18" ry="3.5" fill="none" stroke="var(--ink)" stroke-opacity="0.45" stroke-width="1.5"/>' +
    '<g stroke="var(--ink)" stroke-opacity="0.2" stroke-width="2"><line x1="34" y1="92" x2="34" y2="130"/><line x1="146" y1="92" x2="146" y2="130"/></g>' +
    '</svg>',
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
  bathtub:
    // Side elevation of a freestanding slipper tub: the silhouette IS the
    // product here (it is bought as an object, not a fixture), so the rim
    // curve and the floor-standing tap carry the whole read.
    '<svg viewBox="0 0 240 190" aria-hidden="true">' +
    '<defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity="0.5"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0.2"/></linearGradient></defs>' +
    // floor-standing tap and riser
    '<path d="M196 150 V72 q0 -12 -12 -12 h-14" stroke="var(--ink)" stroke-opacity="0.45" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '<rect x="188" y="150" width="16" height="6" rx="2" fill="var(--ink)" opacity="0.4"/>' +
    // tub body: high back, low front, soft slipper curve
    '<path d="M34 78 q0 -14 18 -14 q60 0 108 0 q16 0 16 12 l-6 56 q-3 24 -34 24 H72 q-31 0 -34 -24 Z" fill="url(#gb)"/>' +
    // rim + inner shadow
    '<path d="M34 78 q0 -14 18 -14 q60 0 108 0 q16 0 16 12" stroke="var(--acc)" stroke-opacity="0.75" stroke-width="6" fill="none" stroke-linecap="round"/>' +
    '<path d="M50 82 q54 -6 122 0 l-5 46 q-2 18 -26 18 H79 q-24 0 -26 -18 Z" fill="var(--bg)" opacity="0.4"/>' +
    // waterline
    '<path d="M60 104 q12 -5 24 0 t24 0 t24 0 t24 0" stroke="var(--ink)" stroke-opacity="0.28" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    // plinth
    '<rect x="62" y="156" width="96" height="8" rx="3" fill="var(--ink)" opacity="0.35"/>' +
    '</svg>',
  billiard:
    // Three-quarter view: rails, six pockets and the rack. Drawn from above at
    // a slight angle because that is how a table is actually judged — a flat
    // side elevation reads as a bench.
    '<svg viewBox="0 0 240 190" aria-hidden="true">' +
    '<defs><linearGradient id="gbl" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity="0.62"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0.3"/></linearGradient></defs>' +
    // legs
    '<rect x="40" y="132" width="14" height="34" rx="3" fill="var(--ink)" opacity="0.42"/>' +
    '<rect x="186" y="132" width="14" height="34" rx="3" fill="var(--ink)" opacity="0.42"/>' +
    // outer rail frame
    '<path d="M26 58 L214 58 L200 140 L40 140 Z" fill="var(--ink)" opacity="0.4"/>' +
    // baize bed
    '<path d="M40 68 L200 68 L189 130 L51 130 Z" fill="url(#gbl)"/>' +
    // six pockets
    '<g fill="var(--ink)" opacity="0.62">' +
    '<ellipse cx="42" cy="68" rx="7" ry="4.5"/><ellipse cx="120" cy="66" rx="7" ry="4.5"/><ellipse cx="198" cy="68" rx="7" ry="4.5"/>' +
    '<ellipse cx="52" cy="130" rx="7.5" ry="5"/><ellipse cx="120" cy="132" rx="7.5" ry="5"/><ellipse cx="188" cy="130" rx="7.5" ry="5"/>' +
    "</g>" +
    // racked balls + cue ball
    '<g fill="var(--bg)" opacity="0.85">' +
    '<circle cx="150" cy="92" r="4"/><circle cx="158" cy="97" r="4"/><circle cx="142" cy="97" r="4"/>' +
    '<circle cx="166" cy="102" r="4"/><circle cx="150" cy="102" r="4"/><circle cx="134" cy="102" r="4"/>' +
    "</g>" +
    '<circle cx="76" cy="104" r="4.5" fill="var(--ink)" opacity="0.75"/>' +
    // cue resting across the rail
    '<path d="M30 150 L206 96" stroke="var(--ink)" stroke-opacity="0.4" stroke-width="3" stroke-linecap="round"/>' +
    "</svg>",
  chair:
    '<svg viewBox="0 0 240 190" aria-hidden="true">' +
    '<defs><linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="var(--acc)" stop-opacity="0.6"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0.24"/></linearGradient></defs>' +
    // headrest pillow + back
    '<path d="M78 26 Q104 18 112 40 L118 64 Q120 74 112 78 L88 86 Q78 88 76 78 L70 44 Q68 32 78 26 Z" fill="url(#gc)"/>' +
    '<ellipse cx="93" cy="44" rx="16" ry="9" fill="var(--bg)" opacity="0.3" transform="rotate(-14 93 44)"/>' +
    // seat + ottoman
    '<path d="M70 88 Q116 74 128 92 L134 116 Q170 112 186 128 Q198 142 186 152 L120 168 Q64 176 52 148 L48 112 Q48 94 70 88 Z" fill="url(#gc)"/>' +
    '<path d="M134 116 L186 128" stroke="var(--bg)" stroke-width="3" opacity="0.6"/>' +
    '<path d="M60 100 Q100 88 122 98" stroke="var(--bg)" stroke-width="3" fill="none" opacity="0.55"/>' +
    '<path d="M64 116 Q100 104 124 112" stroke="var(--bg)" stroke-width="2" fill="none" opacity="0.35"/>' +
    // integrated feet
    '<path d="M52 148 q-8 16 6 24 l14 -6 q-12 -6 -14 -20 Z" fill="var(--ink)" opacity="0.45"/>' +
    '<path d="M186 152 q6 12 -4 18 l-12 -4 q10 -6 10 -16 Z" fill="var(--ink)" opacity="0.45"/>' +
    '</svg>',
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
  const d = ctx.content.pdp;
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
