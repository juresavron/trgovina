/**
 * STUDIO — opening acts (docs/STUDIO-BASELINE.md devices 2, 5, 6).
 *
 *   2. Hero triptych  — photo · black offer panel · photo with name + price
 *   5. Wordmark band  — the shop name set enormous in white across a photo
 *   6. Marquee        — infinite USP ticker, dot-separated
 *
 * All three are full-bleed: they render OUTSIDE `.wrap`, so the page's own
 * gutter never applies and the panels meet the viewport edges. Photography
 * has not landed yet, so every photo slot renders the kernel's scene
 * placeholder idiom — a bordered box with a subtle gradient — sized exactly
 * like the future image, which keeps the layout honest without an asset.
 *
 * Token discipline: colors, radii and faces are var(--…) only, and every
 * selector is scoped to :root[data-theme="studio"] because the sheet is
 * shared with zarja/lednik/salon.
 */

import { esc, type RenderCtx } from "../../render/sections";

export type StudioCtx = RenderCtx;

/* Scrims and hairlines are derived from tokens via color-mix rather than
 * hardcoded rgba() — the band a scrim sits on must stay theme-owned. */
export const STUDIO_HERO_CSS = `
  /* ---- 2. Hero triptych ---- */
  :root[data-theme="studio"] .st-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.24fr) minmax(0, 1fr);
    min-height: calc(100vh - var(--chrome-h));
    min-height: calc(100svh - var(--chrome-h));
    border-bottom: 1px solid var(--line);
    overflow: clip;
  }
  :root[data-theme="studio"] .st-hero-panel { position: relative; min-width: 0; }

  :root[data-theme="studio"] .st-hero-offer {
    background: var(--ink-invert);
    color: var(--on-invert);
    display: flex; flex-direction: column; justify-content: center;
    gap: 22px;
    padding: clamp(40px, 5vw, 76px) clamp(24px, 3.4vw, 60px);
  }
  :root[data-theme="studio"] .st-hero-pill {
    align-self: flex-start;
    border: 1px solid color-mix(in srgb, var(--on-invert) 34%, transparent);
    border-radius: var(--r-pill);
    padding: 8px 16px;
    font-family: var(--f-body);
    font-size: 11.5px; font-weight: 600; letter-spacing: 0.16em;
    text-transform: uppercase; color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-hero-offer h1 {
    font-family: var(--f-display); font-weight: var(--w-display);
    font-stretch: var(--stretch); letter-spacing: var(--track-display);
    line-height: 0.98;
    font-size: clamp(2.3rem, 3.5vw, 4rem);
    max-width: 13ch;
  }
  :root[data-theme="studio"] .st-hero-sub {
    font-family: var(--f-body); color: var(--on-invert-mute);
    font-size: clamp(0.98rem, 1.1vw, 1.1rem); max-width: 40ch;
  }
  /* White button on near-black: --bg IS the white, --ink its text. */
  :root[data-theme="studio"] .st-btn-light {
    align-self: flex-start;
    display: inline-flex; align-items: center; gap: 10px;
    background: var(--bg); color: var(--ink);
    border: 1px solid var(--bg); border-radius: var(--r-ctrl);
    padding: 16px 30px; text-decoration: none;
    font-family: var(--f-body); font-size: 13px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-btn-light:hover {
    background: color-mix(in srgb, var(--bg) 82%, var(--ink));
  }
  /* The global focus ring is --acc; on an inverted band white outlines louder. */
  :root[data-theme="studio"] .st-btn-light:focus-visible {
    outline: 2px solid var(--bg); outline-offset: 3px;
  }

  /* Photo-ready placeholder: bordered box + subtle gradient, no asset. */
  :root[data-theme="studio"] .st-photo {
    position: absolute; inset: 0;
    border: 1px solid var(--line);
    background:
      radial-gradient(72% 52% at 50% 112%, var(--wash-strong), transparent 70%),
      radial-gradient(60% 44% at 74% -8%, var(--surface), transparent 66%),
      linear-gradient(168deg, var(--surface2), var(--bg-alt));
  }
  :root[data-theme="studio"] .st-photo-floor {
    position: absolute; left: 50%; bottom: 12%; transform: translateX(-50%);
    width: 58%; height: 8%; border-radius: var(--r-pill);
    background: radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--ink) 22%, transparent), transparent 70%);
  }
  :root[data-theme="studio"] .st-photo-mass {
    position: absolute; left: 16%; right: 16%; bottom: 18%; top: 34%;
    border-radius: var(--r-media);
    background: linear-gradient(180deg, color-mix(in srgb, var(--ink) 12%, transparent), color-mix(in srgb, var(--ink) 4%, transparent));
    border: 1px solid var(--line);
  }
  :root[data-theme="studio"] .st-photo-cap {
    position: absolute; top: 16px; left: 16px; z-index: 2;
    font-family: ui-monospace, Menlo, monospace; font-size: 9.5px;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--ink-mute);
  }

  :root[data-theme="studio"] .st-hero-scrim {
    position: absolute; inset: auto 0 0 0; z-index: 2;
    padding: clamp(22px, 2.6vw, 40px);
    display: flex; flex-direction: column; gap: 6px;
    background: linear-gradient(to top, color-mix(in srgb, var(--ink-invert) 88%, transparent), transparent);
  }
  :root[data-theme="studio"] .st-hero-name {
    font-family: var(--f-display); font-weight: var(--w-display);
    font-stretch: var(--stretch); letter-spacing: var(--track-display);
    font-size: clamp(1.15rem, 1.7vw, 1.5rem); color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-hero-price {
    font-family: var(--f-body); font-size: 14px; font-weight: 600;
    font-variant-numeric: tabular-nums; color: var(--on-invert);
  }

  /* ---- 5. Wordmark band ---- */
  /* Dark placeholder by design: the band's whole job is enormous WHITE type,
   * so the surface under it must be the inverted ground, not --bg-alt. */
  :root[data-theme="studio"] .st-band {
    position: relative; overflow: clip;
    min-height: clamp(420px, 62vh, 680px);
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: clamp(40px, 5vw, 80px) clamp(20px, 4.5vw, 56px) clamp(32px, 4vw, 60px);
    isolation: isolate;
  }
  :root[data-theme="studio"] .st-band-photo {
    position: absolute; inset: 0; z-index: -1;
    border-block: 1px solid color-mix(in srgb, var(--on-invert) 14%, transparent);
    border-inline: 0;
    background:
      radial-gradient(58% 60% at 76% 18%, var(--wash-strong), transparent 68%),
      radial-gradient(70% 70% at 22% 108%, color-mix(in srgb, var(--on-invert) 12%, transparent), transparent 72%),
      linear-gradient(158deg, var(--ink-invert-2), var(--ink-invert));
  }
  :root[data-theme="studio"] .st-band-word {
    font-family: var(--f-display); font-weight: var(--w-display);
    font-stretch: var(--stretch); letter-spacing: var(--track-display);
    line-height: 0.86; text-transform: uppercase; color: var(--on-invert);
    /* vw-clamped so a long shop name can never push the page sideways. */
    font-size: clamp(2.6rem, 13.5vw, 11rem);
    overflow-wrap: break-word; hyphens: none;
    margin-bottom: clamp(24px, 3.5vw, 52px);
  }
  :root[data-theme="studio"] .st-band-callout {
    position: absolute; right: clamp(14%, 22vw, 34%); top: clamp(18%, 22vh, 30%);
    width: clamp(80px, 11vw, 170px); height: 1px;
    background: color-mix(in srgb, var(--on-invert) 70%, transparent);
    transform: rotate(-30deg); transform-origin: left center;
  }
  :root[data-theme="studio"] .st-band-callout::after {
    content: ""; position: absolute; right: -4px; top: -3.5px;
    width: 8px; height: 8px; border-radius: var(--r-pill);
    background: var(--on-invert);
  }
  :root[data-theme="studio"] .st-band-foot {
    display: flex; align-items: center; gap: clamp(14px, 2vw, 26px);
    flex-wrap: wrap;
  }
  :root[data-theme="studio"] .st-band-chip {
    border: 1px solid color-mix(in srgb, var(--on-invert) 34%, transparent);
    border-radius: var(--r-pill); padding: 7px 15px;
    font-family: var(--f-body); font-size: 11px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase; color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-band-title {
    font-family: var(--f-display); font-weight: var(--w-display);
    font-stretch: var(--stretch); letter-spacing: var(--track-display);
    font-size: clamp(1.1rem, 1.8vw, 1.55rem); color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-band-foot .st-btn-light { margin-left: auto; }

  /* ---- 6. Marquee ---- */
  :root[data-theme="studio"] .st-mq {
    border-block: 1px solid var(--line);
    background: var(--bg);
    padding: 16px 0;
  }
  :root[data-theme="studio"] .st-mq-viewport { overflow: hidden; }
  :root[data-theme="studio"] .st-mq-track {
    display: flex; width: max-content;
    /* Track holds the item set twice, so -50% lands on the clone's first
     * item: the loop restarts on an identical frame. */
    animation: st-marquee 42s linear infinite;
    will-change: transform;
  }
  :root[data-theme="studio"] .st-mq-group { display: flex; align-items: center; }
  :root[data-theme="studio"] .st-mq-item,
  :root[data-theme="studio"] .st-mq-sep {
    font-family: var(--f-body); font-size: 12.5px; font-weight: 600;
    letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--ink); white-space: nowrap;
  }
  :root[data-theme="studio"] .st-mq-sep { color: var(--acc-text); padding: 0 clamp(18px, 2.4vw, 34px); }
  @keyframes st-marquee {
    from { transform: translate3d(0, 0, 0); }
    to { transform: translate3d(-50%, 0, 0); }
  }

  @media (max-width: 900px) {
    /* The message leads; one photo supports it. The second photo is dropped
     * outright rather than squeezing three panels into a phone. */
    :root[data-theme="studio"] .st-hero {
      grid-template-columns: 1fr;
      min-height: 0;
    }
    :root[data-theme="studio"] .st-hero-offer { order: 1; padding: clamp(56px, 12vw, 88px) clamp(20px, 6vw, 40px); }
    :root[data-theme="studio"] .st-hero-photo-b { order: 2; min-height: 56vh; min-height: 56svh; }
    :root[data-theme="studio"] .st-hero-photo-a { display: none; }
    :root[data-theme="studio"] .st-band-foot .st-btn-light { margin-left: 0; }
    :root[data-theme="studio"] .st-band-callout { display: none; }
  }
  @media (max-width: 560px) {
    :root[data-theme="studio"] .st-hero-photo-b { min-height: 48vh; min-height: 48svh; }
    :root[data-theme="studio"] .st-btn-light { align-self: stretch; justify-content: center; }
  }

  @media (prefers-reduced-motion: reduce) {
    /* Reset the transform too — a paused animation would freeze the ticker
     * mid-scroll with half its words cut off. */
    :root[data-theme="studio"] .st-mq-track { animation: none; transform: none; }
    :root[data-theme="studio"] .st-mq-viewport { overflow-x: auto; }
  }
`;

/** Photo-ready slot: bordered box, subtle gradient, no image request. */
function photoSlot(cap?: string): string {
  return (
    '<div class="st-photo" aria-hidden="true">' +
    '<span class="st-photo-mass"></span><span class="st-photo-floor"></span>' +
    "</div>" +
    (cap ? '<span class="st-photo-cap">' + esc(cap) + "</span>" : "")
  );
}

function pdpHref(ctx: StudioCtx): string {
  return ctx.shop.routeSlugs["/product"] + "/" + ctx.content.pdp.slug + ctx.q;
}

/**
 * Device 2 — hero triptych. Carries the page's single h1; the wordmark band
 * and marquee below stay non-heading so this stays the only one.
 */
export function renderStudioHero(ctx: StudioCtx): string {
  const c = ctx.content;
  return (
    '<section class="st-hero">' +
    '<div class="st-hero-panel st-hero-photo st-hero-photo-a">' +
    photoSlot("fotografija v pripravi") +
    "</div>" +
    '<div class="st-hero-panel st-hero-offer">' +
    '<span class="st-hero-pill">' + esc(c.kicker) + "</span>" +
    "<h1>" + esc(c.h1) + "</h1>" +
    '<p class="st-hero-sub">' + esc(c.sub) + "</p>" +
    '<a class="st-btn-light" href="#izbor">' + esc(c.cta) + "</a>" +
    "</div>" +
    '<div class="st-hero-panel st-hero-photo st-hero-photo-b">' +
    photoSlot() +
    '<div class="st-hero-scrim">' +
    '<span class="st-hero-name">' + esc(c.pdp.title) + "</span>" +
    '<span class="st-hero-price">' + esc(c.pdp.price) + "</span>" +
    "</div></div></section>"
  );
}

/** Device 5 — full-bleed band, shop name enormous in white over the scene. */
export function renderStudioWordmarkBand(ctx: StudioCtx): string {
  const d = ctx.content.pdp;
  return (
    '<section class="st-band" aria-label="' + esc(ctx.shop.name) + '">' +
    '<div class="st-band-photo" aria-hidden="true"></div>' +
    '<span class="st-band-callout" aria-hidden="true"></span>' +
    '<p class="st-band-word">' + esc(ctx.shop.name) + "</p>" +
    '<div class="st-band-foot">' +
    '<span class="st-band-chip">' + esc(d.eyebrow) + "</span>" +
    '<span class="st-band-title">' + esc(d.title) + "</span>" +
    '<a class="st-btn-light" href="' + pdpHref(ctx) + '">Oglejte si model</a>' +
    "</div></section>"
  );
}

/**
 * Device 6 — USP ticker. One track holding the item set twice: the clone is
 * aria-hidden so screen readers hear each claim once, and the -50% translate
 * loops without a visible seam.
 */
export function renderStudioMarquee(ctx: StudioCtx): string {
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
    '<span class="st-mq-group" aria-hidden="true">' + group + "</span>" +
    "</div></div></section>"
  );
}
