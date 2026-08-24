/**
 * STUDIO — opening acts (docs/STUDIO-BASELINE.md §4.2, §4.5, §4.6).
 *
 *   §4.2 Hero triptych  — photo · black offer panel · photo with name + price
 *   §4.5 Wordmark band  — the shop name enormous in white, OCCLUDED by the product
 *   §4.6 Marquee        — dot-separated USP ticker, seamless CSS loop
 *
 * All three are full-bleed: they render OUTSIDE `.wrap`, so the page gutter
 * never applies and the panels meet the viewport edges. The gutter is
 * reintroduced inside each band as --studio-gutter.
 *
 * Scale translation: the baseline was measured at a 2000px viewport, so every
 * measured px is expressed as clamp(min, measured/20 vw, measured) — the
 * measurement is the MAXIMUM, and the RATIOS between elements (48px vs 56px
 * stack gaps, 90px vs 24px type) survive the shrink.
 *
 * Token discipline (docs/THEMES.md): colors, radii and faces are var(--…)
 * only; the handful of values the baseline measures but tokens.ts does not
 * carry are declared below as documented --studio-* variables. Every selector
 * is scoped :root[data-theme="studio"] because zarja/lednik/salon share the
 * sheet.
 */

import { esc, type RenderCtx } from "../../render/sections";

export const STUDIO_HERO_CSS = `
  /* ---- Values the baseline measures that tokens.ts does not carry ---- */
  :root[data-theme="studio"] {
    /* §3: page gutter 54px @2000px — the wordmark, headings and bands start here. */
    --studio-gutter: clamp(20px, 2.7vw, 54px);
    /* §4.2: the two hero stack rhythms — pill→statement 48px, sub→button 56px.
     * Kept as variables so the 48:56 ratio is edited in one place, never drifts. */
    --studio-gap-stack: clamp(20px, 2.4vw, 48px);
    --studio-gap-cta: clamp(24px, 2.8vw, 56px);
    /* §4.2: the grounds the two hero product photos sit on — a cool grey left,
     * a warm sand right. Sampled off the renders; no token equivalent because
     * they are photo backdrops, not UI surfaces. */
    --studio-photo-cool: #d9d9d9;
    --studio-photo-warm: #e8e0d6;
    /* §4.2: the hero sub on black is lighter than --on-invert-mute (#a8a8a8);
     * measured #d6d6d6. 13.4:1 on #0d0d0d. */
    --studio-on-invert-soft: #d6d6d6;
  }

  /* ---- §4.2 Hero triptych ---- */
  /* Three EQUAL full-bleed columns, no gaps, height = viewport − chrome. */
  :root[data-theme="studio"] .st-hero {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
    min-height: calc(100vh - var(--chrome-h));
    min-height: calc(100svh - var(--chrome-h));
    overflow: clip;
  }
  :root[data-theme="studio"] .st-hero-panel {
    position: relative;
    min-width: 0;
    isolation: isolate;
  }
  :root[data-theme="studio"] .st-hero-photo-a { background: var(--studio-photo-cool); }
  :root[data-theme="studio"] .st-hero-photo-b { background: var(--studio-photo-warm); }

  /* Faint oversized circle watermark behind the left product (§4.2). */
  :root[data-theme="studio"] .st-hero-photo-a::before {
    content: "";
    position: absolute; z-index: 0;
    left: 50%; top: 46%; transform: translate(-50%, -50%);
    width: 128%; aspect-ratio: 1;
    border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--bg) 42%, transparent);
  }

  /* Centre: black, the whole message stack, centered. */
  :root[data-theme="studio"] .st-hero-offer {
    background: var(--ink-invert);
    color: var(--on-invert);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(48px, 5.5vw, 110px) var(--studio-gutter);
  }
  /* Faint dark ellipse/circle watermarks behind the stack (§4.2). --ink-invert-2
   * is the baseline's #161616 watermark rung. */
  :root[data-theme="studio"] .st-hero-offer::before {
    content: "";
    position: absolute; inset: 0; z-index: 0;
    background:
      radial-gradient(38% 26% at 50% 22%, var(--ink-invert-2), transparent 70%),
      radial-gradient(46% 32% at 50% 82%, var(--ink-invert-2), transparent 72%);
  }
  :root[data-theme="studio"] .st-hero-stack {
    position: relative; z-index: 1;
    display: flex; flex-direction: column; align-items: center;
    text-align: center;
    /* width+max-width, not max-width alone: on a phone the stack fills the
     * panel so a stretched CTA spans it, on desktop the measure still caps. */
    width: 100%;
    max-width: 30ch;
  }
  /* Pills are ROUND (§3) — the counterpoint to the sharp button below. */
  :root[data-theme="studio"] .st-hero-pill {
    border: 1px solid color-mix(in srgb, var(--on-invert) 40%, transparent);
    border-radius: var(--r-pill);
    padding: clamp(8px, 0.6vw, 12px) clamp(16px, 1.4vw, 28px);
    font-family: var(--f-body);
    font-size: clamp(0.75rem, 0.75vw, 0.9375rem);
    font-weight: 500; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    color: var(--on-invert);
    /* measured 48px gap, pill → statement */
    margin-bottom: var(--studio-gap-stack);
  }
  /* The offer statement: 90px / 650 / −0.03em / 1.0 at 2000px. */
  :root[data-theme="studio"] .st-hero-offer h1 {
    margin: 0;
    font-family: var(--f-display);
    font-weight: 650;
    font-stretch: var(--stretch);
    font-size: clamp(2rem, 4.5vw, 5.625rem);
    letter-spacing: -0.03em;
    line-height: 1;
    text-wrap: balance;
    /* a long Slovenian head term must fold, never push the column open */
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* Sub: 24px, the lighter on-dark rung. */
  :root[data-theme="studio"] .st-hero-sub {
    margin: clamp(10px, 1.1vw, 22px) 0 0;
    font-family: var(--f-body);
    font-size: clamp(1rem, 1.2vw, 1.5rem);
    line-height: 1.5;
    color: var(--studio-on-invert-soft);
  }
  /* Buttons are SHARP (--r-ctrl, §3). White on black: --bg is the fill. */
  :root[data-theme="studio"] .st-btn-light {
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--bg); color: var(--ink);
    border: 1px solid var(--bg);
    border-radius: var(--r-ctrl);
    padding: clamp(14px, 1.1vw, 22px) clamp(26px, 3vw, 60px);
    text-decoration: none;
    font-family: var(--f-body);
    font-size: clamp(0.8125rem, 0.8vw, 1rem);
    font-weight: 600; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    transition: background-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-btn-light:hover {
    background: color-mix(in srgb, var(--bg) 84%, var(--ink));
  }
  /* The page focus ring is --acc; on an inverted band white outlines louder. */
  :root[data-theme="studio"] .st-btn-light:focus-visible {
    outline: 2px solid var(--bg);
    outline-offset: 3px;
  }
  :root[data-theme="studio"] .st-hero-cta {
    /* measured 56px gap, sub → button */
    margin-top: var(--studio-gap-cta);
  }

  /* Photo-ready slot: flat neutral mass + contact shadow on the panel ground.
   * Studio's grounds are white/grey, so the placeholder stays flatter than
   * zarja's lit scenes — a real photo drops in with zero restructuring. */
  :root[data-theme="studio"] .st-photo {
    position: absolute; inset: 0; z-index: 1;
  }
  :root[data-theme="studio"] .st-photo-mass {
    position: absolute;
    left: 17%; right: 17%; top: 28%; bottom: 17%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--ink) 10%, transparent),
      color-mix(in srgb, var(--ink) 4%, transparent)
    );
  }
  :root[data-theme="studio"] .st-photo-floor {
    position: absolute;
    left: 50%; bottom: 12%; transform: translateX(-50%);
    width: 62%; height: 7%;
    border-radius: var(--r-pill);
    background: radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--ink) 20%, transparent), transparent 72%);
  }
  /* --ink-soft, not --ink-mute: 6.3:1 on the #d9d9d9 ground (mute is 3.2:1). */
  :root[data-theme="studio"] .st-photo-cap {
    position: absolute; z-index: 2;
    top: var(--studio-gutter); left: var(--studio-gutter);
    font-family: var(--f-body);
    font-size: clamp(0.6875rem, 0.7vw, 0.8125rem);
    font-weight: 500; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  /* Right column overlay: product name + price on a legibility scrim. */
  :root[data-theme="studio"] .st-hero-scrim {
    position: absolute; inset: auto 0 0 0; z-index: 2;
    display: flex; flex-direction: column; gap: clamp(6px, 0.6vw, 12px);
    padding: clamp(56px, 7vw, 140px) var(--studio-gutter) var(--studio-gutter);
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--ink-invert) 92%, transparent) 0%,
      color-mix(in srgb, var(--ink-invert) 62%, transparent) 42%,
      transparent 100%
    );
  }
  /* 40px scale — the card/product-title rung pushed to hero size (§4.2). */
  :root[data-theme="studio"] .st-hero-name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-stretch: var(--stretch);
    font-size: clamp(1.375rem, 2vw, 2.5rem);
    letter-spacing: -0.01em; line-height: 1.15;
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-hero-price {
    font-family: var(--f-body);
    font-size: clamp(1.0625rem, 1.3vw, 1.625rem);
    font-weight: 500; font-variant-numeric: tabular-nums;
    color: var(--on-invert);
  }

  /* ---- §4.5 Wordmark band ---- */
  /* The z-layering IS the device: the brand name sits BEHIND the product,
   * which occludes its middle letters. isolation:isolate gives the band its
   * own stacking context so the order is local and cannot be reshuffled by
   * whatever the page puts above or below it. Nothing here is faded —
   * occlusion is geometry, not opacity. */
  :root[data-theme="studio"] .st-band {
    position: relative;
    isolation: isolate;
    overflow: clip;
    display: flex; flex-direction: column; justify-content: flex-end;
    min-height: clamp(440px, 64vh, 780px);
    padding: clamp(56px, 6vw, 120px) var(--studio-gutter) clamp(32px, 4vw, 72px);
    background: var(--ink-invert);
  }
  /* The full-bleed photo slot. Dark by design: the band's job is enormous
   * WHITE type, so the ground under it must be the inverted one. */
  :root[data-theme="studio"] .st-band-photo {
    position: absolute; inset: 0; z-index: 0;
    background:
      radial-gradient(70% 70% at 22% 106%, color-mix(in srgb, var(--on-invert) 12%, transparent), transparent 72%),
      radial-gradient(58% 60% at 78% 12%, color-mix(in srgb, var(--on-invert) 8%, transparent), transparent 68%),
      linear-gradient(158deg, var(--ink-invert-2), var(--ink-invert));
  }
  /* Letters ~200px tall spanning nearly the full width, at 2000px. The vw
   * term is what keeps a long shop name inside a 390px viewport; the band's
   * overflow:clip is the second belt so the PAGE can never scroll sideways. */
  :root[data-theme="studio"] .st-band-word {
    position: relative; z-index: 1;
    margin: 0 0 clamp(28px, 3.6vw, 72px);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-stretch: var(--stretch);
    font-size: clamp(2.75rem, 12vw, 15rem);
    letter-spacing: -0.03em; line-height: 0.86;
    text-transform: uppercase;
    color: var(--on-invert);
    max-width: 100%;
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The product that occludes the wordmark. Opaque on purpose. */
  :root[data-theme="studio"] .st-band-object {
    position: absolute; z-index: 2;
    left: 50%; transform: translateX(-50%);
    bottom: clamp(90px, 13vw, 220px);
    width: clamp(200px, 40vw, 760px);
    aspect-ratio: 4 / 3;
    border-radius: var(--r-media);
    background: linear-gradient(168deg, var(--studio-photo-warm), var(--bg-alt));
  }
  /* Inside the band object the mass is the product itself, not a subject on a
   * backdrop, so it sits tighter to the frame than in a hero panel. */
  :root[data-theme="studio"] .st-band-object .st-photo-mass {
    inset: 13% 11%;
  }
  /* Thin callout line + dot, running from the product out to a short label. */
  :root[data-theme="studio"] .st-band-callout {
    position: absolute; z-index: 3;
    top: clamp(48px, 15vh, 168px);
    right: var(--studio-gutter);
    display: flex; align-items: center;
    max-width: min(28vw, 300px);
  }
  :root[data-theme="studio"] .st-band-dot {
    flex: none;
    width: 9px; height: 9px;
    border-radius: var(--r-pill);
    background: var(--on-invert);
  }
  :root[data-theme="studio"] .st-band-line {
    flex: none;
    width: clamp(28px, 5vw, 100px); height: 1px;
    background: color-mix(in srgb, var(--on-invert) 72%, transparent);
  }
  :root[data-theme="studio"] .st-band-note {
    padding-left: clamp(10px, 0.9vw, 18px);
    font-family: var(--f-body);
    font-size: clamp(0.875rem, 1vw, 1.25rem);
    line-height: 1.35;
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-band-foot {
    position: relative; z-index: 3;
    display: flex; align-items: center; flex-wrap: wrap;
    gap: clamp(14px, 1.6vw, 32px);
  }
  /* Chips are ROUND; the CTA beside them stays SHARP. */
  :root[data-theme="studio"] .st-band-chip {
    border: 1px solid color-mix(in srgb, var(--on-invert) 40%, transparent);
    border-radius: var(--r-pill);
    padding: clamp(7px, 0.55vw, 11px) clamp(14px, 1.3vw, 26px);
    font-family: var(--f-body);
    font-size: clamp(0.75rem, 0.75vw, 0.9375rem);
    font-weight: 500; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-band-title {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-stretch: var(--stretch);
    font-size: clamp(1.375rem, 2.3vw, 2.875rem);
    letter-spacing: var(--track-display); line-height: 1.1;
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-band-foot .st-btn-light { margin-left: auto; }

  /* ---- §4.6 Marquee ---- */
  :root[data-theme="studio"] .st-mq {
    background: var(--bg);
    border-block: 1px solid var(--line);
    padding: clamp(14px, 1.2vw, 24px) 0;
  }
  :root[data-theme="studio"] .st-mq-viewport { overflow: hidden; }
  :root[data-theme="studio"] .st-mq-track {
    display: flex; width: max-content;
    /* The track holds the item set twice, so −50% lands on the clone's first
     * item: the loop restarts on a pixel-identical frame, no seam. */
    animation: st-marquee 42s linear infinite;
  }
  :root[data-theme="studio"] .st-mq-group { display: flex; align-items: center; }
  :root[data-theme="studio"] .st-mq-item,
  :root[data-theme="studio"] .st-mq-sep {
    font-family: var(--f-body);
    font-size: clamp(0.8125rem, 0.85vw, 1.0625rem);
    font-weight: 500; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-mq-sep {
    color: var(--ink-mute);
    padding: 0 clamp(18px, 2.2vw, 44px);
  }
  @keyframes st-marquee {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-50%, 0, 0); }
  }

  /* ---- Below 900px: the message leads, ONE photo supports it ---- */
  @media (max-width: 900px) {
    :root[data-theme="studio"] .st-hero {
      grid-template-columns: 1fr;
      min-height: 0;
    }
    /* Black panel first — the offer, not the scenery, opens the page. */
    :root[data-theme="studio"] .st-hero-offer {
      order: 1;
      padding: clamp(56px, 12vw, 96px) clamp(20px, 6vw, 44px);
    }
    /* The surviving photo is the one carrying the product name and price;
     * the other is dropped outright rather than squeezing three panels. */
    :root[data-theme="studio"] .st-hero-photo-b { order: 2; min-height: 58svh; }
    :root[data-theme="studio"] .st-hero-photo-a { display: none; }

    :root[data-theme="studio"] .st-band { min-height: clamp(380px, 72vh, 620px); }
    :root[data-theme="studio"] .st-band-callout { display: none; }
    :root[data-theme="studio"] .st-band-object { bottom: clamp(120px, 34vw, 240px); }
    :root[data-theme="studio"] .st-band-foot .st-btn-light { margin-left: 0; }
  }
  @media (max-width: 560px) {
    :root[data-theme="studio"] .st-hero-photo-b { min-height: 48svh; }
    :root[data-theme="studio"] .st-hero-cta,
    :root[data-theme="studio"] .st-band-foot .st-btn-light { width: 100%; }
  }

  /* ---- Motion ---- */
  @media (prefers-reduced-motion: reduce) {
    /* Reset the transform, never merely pause: a paused ticker freezes
     * mid-scroll with half its words cut off. The clone is removed so the
     * static state reads once, and the rail gets its own scroller. */
    :root[data-theme="studio"] .st-mq-track { animation: none; transform: none; }
    :root[data-theme="studio"] .st-mq-clone { display: none; }
    :root[data-theme="studio"] .st-mq-viewport {
      overflow-x: auto;
      padding-inline: var(--studio-gutter);
    }
    :root[data-theme="studio"] .st-btn-light { transition: none; }
  }
`;

/**
 * Photo-ready slot — bordered mass + contact shadow, no image request.
 * `cap` renders the "photography pending" note; omitted where an overlay
 * already occupies the panel.
 */
function photoSlot(cap?: string): string {
  return (
    '<div class="st-photo" aria-hidden="true">' +
    '<span class="st-photo-mass"></span>' +
    '<span class="st-photo-floor"></span>' +
    "</div>" +
    (cap ? '<span class="st-photo-cap">' + esc(cap) + "</span>" : "")
  );
}

function pdpHref(ctx: RenderCtx): string {
  return ctx.shop.routeSlugs["/product"] + "/" + ctx.content.pdp.slug + ctx.q;
}

/**
 * §4.2 — hero triptych. Carries the page's single h1; the wordmark band and
 * marquee below deliberately use non-heading elements so this stays the only
 * one on the page.
 */
export function renderStudioHero(ctx: RenderCtx): string {
  const c = ctx.content;
  return (
    '<section class="st-hero">' +
    '<div class="st-hero-panel st-hero-photo-a">' +
    photoSlot("fotografija v pripravi") +
    "</div>" +
    '<div class="st-hero-panel st-hero-offer"><div class="st-hero-stack">' +
    '<span class="st-hero-pill">' + esc(c.kicker) + "</span>" +
    "<h1>" + esc(c.h1) + "</h1>" +
    '<p class="st-hero-sub">' + esc(c.sub) + "</p>" +
    '<a class="st-btn-light st-hero-cta" href="#izbor">' + esc(c.cta) + "</a>" +
    "</div></div>" +
    '<div class="st-hero-panel st-hero-photo-b">' +
    photoSlot() +
    '<div class="st-hero-scrim">' +
    '<span class="st-hero-name">' + esc(c.pdp.title) + "</span>" +
    '<span class="st-hero-price">' + esc(c.pdp.price) + "</span>" +
    "</div></div></section>"
  );
}

/**
 * §4.5 — wordmark band. The shop name is set enormous in white and the
 * product placeholder is painted OVER it; the occlusion is the device, so the
 * name is never dimmed to fake depth. The name is a <p>, not a heading: the
 * hero owns the page's only h1.
 */
export function renderStudioWordmarkBand(ctx: RenderCtx): string {
  const d = ctx.content.pdp;
  // The callout label is content, not chrome — the shop's first trust claim.
  // noUncheckedIndexedAccess: a shop may ship an empty trust list.
  const note = ctx.content.trust[0];
  return (
    '<section class="st-band" aria-label="' + esc(ctx.shop.name) + " — " + esc(d.title) + '">' +
    '<div class="st-band-photo" aria-hidden="true"></div>' +
    '<p class="st-band-word">' + esc(ctx.shop.name) + "</p>" +
    '<div class="st-band-object" aria-hidden="true"><span class="st-photo-mass"></span></div>' +
    (note
      ? '<p class="st-band-callout">' +
        '<span class="st-band-dot" aria-hidden="true"></span>' +
        '<span class="st-band-line" aria-hidden="true"></span>' +
        '<span class="st-band-note">' + esc(note) + "</span></p>"
      : "") +
    '<div class="st-band-foot">' +
    '<span class="st-band-chip">' + esc(d.eyebrow) + "</span>" +
    '<span class="st-band-title">' + esc(d.title) + "</span>" +
    '<a class="st-btn-light" href="' + esc(pdpHref(ctx)) + '">Oglejte si model</a>' +
    "</div></section>"
  );
}

/**
 * §4.6 — USP ticker. One track holding the item set twice; the clone is
 * aria-hidden so a screen reader hears each claim once, and the −50%
 * translate loops without a visible seam.
 */
export function renderStudioMarquee(ctx: RenderCtx): string {
  const group = ctx.content.trust
    .map(
      (t) =>
        '<span class="st-mq-item">' + esc(t) + "</span>" +
        '<span class="st-mq-sep" aria-hidden="true">·</span>',
    )
    .join("");
  return (
    '<section class="st-mq" aria-label="Prednosti"><div class="st-mq-viewport">' +
    '<div class="st-mq-track">' +
    '<span class="st-mq-group">' + group + "</span>" +
    '<span class="st-mq-group st-mq-clone" aria-hidden="true">' + group + "</span>" +
    "</div></div></section>"
  );
}
