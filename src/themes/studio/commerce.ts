/**
 * STUDIO — commerce acts (docs/STUDIO-BASELINE.md §4.4 and §4.7).
 *
 *   §4.7 Best sellers / product grid — left-aligned heading at the gutter,
 *        three cards per row. Card = 1px frame + padding ~48px; the product
 *        sits on a #F2F2F2 panel occupying ~620 of the ~800px card height;
 *        name 30px; price row 26px with a struck compare-at 20px in muted.
 *        HOVER TURNS THE FRAME BLACK — the theme's signature card state.
 *   §4.4 Category rail — centred heading, ~470×500 cards that PEEK at both
 *        viewport edges (the peek is what separates a rail from a grid),
 *        name + meta line, price in muted.
 *
 * Scale translation: the baseline was measured at a 2000px viewport, so every
 * measured px below is the clamp MAXIMUM (clamp(min, measured/20 vw, measured)).
 * The ratios survive the shrink because neighbouring values share a vw slope.
 *
 * Content split between the two acts is deliberate, not lossy: the measured
 * §4.7 card carries name + price only, and the measured §4.4 rail card carries
 * name + a meta/price line — so `desc`/`meta` surface in the rail rather than
 * being bolted onto a grid card the baseline never gave a spec line to.
 *
 * No dead controls (§5.2): this Worker ships no JS, so the rail's measured
 * arrow buttons become real anchor links to focusable card targets, driven by
 * CSS scroll-snap. Nothing here renders a control that cannot act.
 *
 * Token discipline (docs/THEMES.md): colors, radii and faces are var(--…)
 * only; values the baseline measures that tokens.ts does not carry are
 * declared below as documented --studio-* variables. Every selector is scoped
 * :root[data-theme="studio"] — zarja/lednik/salon share this sheet.
 */

import { esc, type RenderCtx } from "../../render/sections";
import type { ProductCard, UtilCard } from "../../content/types";

export const STUDIO_COMMERCE_CSS = `
  /* ---- Values the baseline measures that tokens.ts does not carry ---- */
  :root[data-theme="studio"] {
    /* §3: the 54px page gutter. Same value as chrome.ts/hero.ts declare —
     * repeated here so this module stands alone if the sheet is assembled
     * without them; identical text means the cascade order cannot make it
     * drift. */
    --studio-gutter: clamp(18px, 2.7vw, 54px);
    /* §4.7: measured ~48px card padding — the card's whole "gallery" feel. */
    --studio-card-pad: clamp(16px, 2.4vw, 48px);
    /* Gap between cards in both the grid and the rail. Measured off the
     * 3-up row inside the 1900px band. */
    --studio-card-gap: clamp(12px, 1.6vw, 32px);
    /* §4.4: measured 470px rail card. The vw term is what produces the peek:
     * whole cards never tile the viewport exactly, so a fraction of the next
     * one is always visible past the right gutter. */
    --studio-rail-card: clamp(228px, 23.5vw, 470px);
    /* §4.7: the product panel is ~620px tall inside a ~474px-wide content box
     * → 0.765. Expressed as a ratio (not a length) so the panel keeps its
     * proportion at every column width; with name + price + padding beneath,
     * it lands at ~78% of the card's height as measured. */
    --studio-panel-ar: 3 / 4;
    /* §4.4: the rail card's image area is the top ~55% — a shorter panel than
     * the grid's, which is what makes a rail card read as 470×500, not 470×800. */
    --studio-rail-panel-ar: 4 / 3;
  }

  /* ---- shared: photo-ready slot ------------------------------------- */
  /* Flatter and more neutral than zarja's lit scenes: studio's grounds are
   * white/grey, so the placeholder is a bordered mass plus a contact shadow.
   * A real photograph drops into .st-shot with zero restructuring. */
  :root[data-theme="studio"] .st-shot {
    position: absolute; inset: 0; z-index: 1;
  }
  :root[data-theme="studio"] .st-shot-mass {
    position: absolute;
    inset: 14% 15% 20%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--ink) 9%, transparent),
      color-mix(in srgb, var(--ink) 3%, transparent)
    );
  }
  :root[data-theme="studio"] .st-shot-floor {
    position: absolute;
    left: 50%; bottom: 12%; transform: translateX(-50%);
    width: 60%; height: 8%;
    border-radius: var(--r-pill);
    background: radial-gradient(
      50% 50% at 50% 50%,
      color-mix(in srgb, var(--ink) 18%, transparent),
      transparent 72%
    );
  }

  /* ---- shared: section head ------------------------------------------ */
  :root[data-theme="studio"] .st-eyebrow {
    font-family: var(--f-body);
    font-size: clamp(11.5px, 0.75vw, 15px);
    font-weight: 500; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    /* --ink-soft, not --ink-mute: 9.7:1 on #ffffff at 15px tracked caps. */
    color: var(--ink-soft);
  }
  /* Section heading: measured 68–72px / 600 / −0.025em / 1.05. */
  :root[data-theme="studio"] .st-sec-h {
    margin: clamp(12px, 1vw, 20px) 0 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-stretch: var(--stretch);
    font-size: clamp(1.9rem, 3.4vw, 4.25rem);
    letter-spacing: -0.025em;
    line-height: 1.05;
    color: var(--ink);
    /* A long Slovenian head term folds; it never pushes the band open. */
    max-width: 20ch;
    overflow-wrap: break-word;
    hyphens: none;
  }

  /* ---- §4.7 best sellers / product grid ------------------------------ */
  :root[data-theme="studio"] .st-shop {
    background: var(--bg);
    /* §3: ~130px vertical rhythm on light sections. */
    padding-block: clamp(48px, 6.5vw, 130px);
  }
  :root[data-theme="studio"] .st-shop-in {
    max-width: 1900px;
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
  }
  /* Left-aligned AT THE GUTTER (§4.7) — the grid heading is never centred. */
  :root[data-theme="studio"] .st-shop-head {
    margin-bottom: clamp(28px, 3.4vw, 68px);
  }
  :root[data-theme="studio"] .st-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--studio-card-gap);
  }

  :root[data-theme="studio"] .st-card {
    display: flex; flex-direction: column;
    min-width: 0;
    padding: var(--studio-card-pad);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--r-card);
    text-decoration: none;
    color: var(--ink);
    /* THE signature: only the frame changes. No lift, no shadow, no scale —
     * the baseline's hover is a hairline going black and nothing else. */
    transition: border-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-card:hover { border-color: var(--line-strong); }
  /* Keyboard parity: the same frame, plus the page's accent ring. The base
   * sheet forces border-radius:4px on :focus-visible — restore the card's. */
  :root[data-theme="studio"] .st-card:focus-visible {
    border-color: var(--line-strong);
    border-radius: var(--r-card);
  }

  /* The panel the product sits on (#F2F2F2 → --bg-alt), radius 12px. */
  :root[data-theme="studio"] .st-card-panel {
    position: relative;
    display: block;
    aspect-ratio: var(--studio-panel-ar);
    border-radius: var(--r-media);
    background: var(--bg-alt);
    overflow: hidden;
    isolation: isolate;
  }
  /* Legibility scrim under the badge. Invisible on the flat placeholder, and
   * already in place for the day a photograph fills the panel. */
  :root[data-theme="studio"] .st-card-panel::after {
    content: "";
    position: absolute; inset: 0 auto auto 0; z-index: 2;
    width: 70%; height: 38%;
    background: radial-gradient(
      100% 100% at 0% 0%,
      color-mix(in srgb, var(--bg) 55%, transparent),
      transparent 70%
    );
  }
  /* Badge: SHARP chip, top-left (§9 — chips that carry a word are buttons'
   * cousins here; the round radius is reserved for the rail's arrows). */
  :root[data-theme="studio"] .st-badge {
    position: absolute; z-index: 3;
    top: clamp(10px, 1vw, 20px); left: clamp(10px, 1vw, 20px);
    padding: clamp(5px, 0.45vw, 9px) clamp(9px, 0.8vw, 16px);
    border-radius: var(--r-ctrl);
    background: var(--ink-invert);
    color: var(--on-invert);
    font-family: var(--f-body);
    font-size: clamp(10px, 0.7vw, 13px);
    font-weight: 500; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
  }

  :root[data-theme="studio"] .st-card-body {
    display: flex; flex-direction: column;
    gap: clamp(8px, 0.8vw, 16px);
    /* The panel is ~78% of the card; this is the remaining ~22%. */
    padding-top: clamp(16px, 1.8vw, 36px);
  }
  /* Card title: 26–30px / 600 / −0.01em / 1.2. */
  :root[data-theme="studio"] .st-card-name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-stretch: var(--stretch);
    font-size: clamp(1.0625rem, 1.5vw, 1.875rem);
    letter-spacing: -0.01em; line-height: 1.2;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-price-row {
    display: flex; align-items: baseline; flex-wrap: wrap;
    gap: clamp(6px, 0.6vw, 12px);
    font-family: var(--f-body);
    font-variant-numeric: tabular-nums;
  }
  /* Current price 26px. */
  :root[data-theme="studio"] .st-price {
    font-size: clamp(0.9375rem, 1.3vw, 1.625rem);
    font-weight: 600;
    color: var(--ink);
  }
  /* Struck compare-at 20px muted. #767676 on #ffffff = 4.5:1 — it passes on
   * the card's white surface, which is why the price row is NOT on the panel. */
  :root[data-theme="studio"] .st-was {
    font-size: clamp(0.8125rem, 1vw, 1.25rem);
    color: var(--ink-mute);
    text-decoration-line: line-through;
    text-decoration-thickness: 1px;
  }
  :root[data-theme="studio"] .st-vat {
    font-size: clamp(11px, 0.7vw, 14px);
    letter-spacing: 0.04em;
    color: var(--ink-soft);
  }

  /* The util card: same frame, inverted ground. Its hover twin of "frame goes
   * black" is "frame goes white" — the strongest hairline available on #0D0D0D. */
  :root[data-theme="studio"] .st-util {
    justify-content: space-between;
    gap: clamp(16px, 2vw, 40px);
    background: var(--ink-invert);
    border-color: var(--ink-invert);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-util:hover,
  :root[data-theme="studio"] .st-util:focus-visible { border-color: var(--on-invert); }
  :root[data-theme="studio"] .st-util-h {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-stretch: var(--stretch);
    font-size: clamp(1.25rem, 2.1vw, 2.625rem);
    letter-spacing: var(--track-display); line-height: 1.1;
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-util-p {
    font-family: var(--f-body);
    font-size: clamp(14px, 0.95vw, 19px);
    line-height: 1.6;
    color: var(--on-invert-mute);
    max-width: 34ch;
  }
  /* Reads as a control, so it is SHARP (§9). */
  :root[data-theme="studio"] .st-util-go {
    align-self: flex-start;
    border: 1px solid color-mix(in srgb, var(--on-invert) 40%, transparent);
    border-radius: var(--r-ctrl);
    padding: clamp(10px, 0.9vw, 18px) clamp(16px, 1.6vw, 32px);
    font-family: var(--f-body);
    font-size: clamp(11.5px, 0.75vw, 15px);
    font-weight: 600; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    color: var(--on-invert);
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-util:hover .st-util-go {
    background: var(--on-invert); color: var(--ink);
  }

  /* ---- §4.4 category rail -------------------------------------------- */
  :root[data-theme="studio"] .st-rail-sec {
    background: var(--bg);
    padding-block: clamp(48px, 6.5vw, 130px);
    /* The rail is full-bleed; the section must never widen the page. */
    overflow: clip;
  }
  /* Centred heading (§4.4) — the counterpoint to §4.7's gutter-left one. */
  :root[data-theme="studio"] .st-rail-head {
    max-width: 1560px;
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
    text-align: center;
    margin-bottom: clamp(28px, 3.4vw, 68px);
  }
  :root[data-theme="studio"] .st-rail-head .st-sec-h {
    max-width: 24ch;
    margin-inline: auto;
  }

  /* THE RAIL. Cards peek at both edges because the scroller is full-bleed and
   * only its PADDING holds the gutter: scroll to the middle and a card is cut
   * by each viewport edge. scroll-padding matches that inset so a snapped or
   * anchor-targeted card lands exactly on the gutter, never under it. */
  :root[data-theme="studio"] .st-rail {
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: var(--studio-gutter);
    padding-inline: var(--studio-gutter);
    /* Room for the card's focus ring, which would otherwise be clipped by
     * the scroll container. */
    padding-block: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  :root[data-theme="studio"] .st-rail::-webkit-scrollbar { display: none; }
  :root[data-theme="studio"] .st-rail-track {
    display: flex;
    gap: var(--studio-card-gap);
    list-style: none;
    margin: 0; padding: 0;
    width: max-content;
  }
  :root[data-theme="studio"] .st-rail-item {
    flex: 0 0 var(--studio-rail-card);
    scroll-snap-align: start;
    scroll-margin-inline: var(--studio-gutter);
  }
  /* The anchor targets take focus programmatically (tabindex="-1"); they must
   * not draw a second ring on top of the card's own. */
  :root[data-theme="studio"] .st-rail-item:focus { outline: none; }
  :root[data-theme="studio"] .st-rail-item:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 4px;
    border-radius: var(--r-card);
  }

  :root[data-theme="studio"] .st-rail-card {
    display: flex; flex-direction: column;
    height: 100%;
    padding: clamp(12px, 1.2vw, 24px);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--r-card);
    text-decoration: none;
    color: var(--ink);
    transition: border-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-rail-card:hover { border-color: var(--line-strong); }
  :root[data-theme="studio"] .st-rail-card:focus-visible {
    border-color: var(--line-strong);
    border-radius: var(--r-card);
  }
  /* Image area = the top ~55% of a 470×500 card (§4.4). */
  :root[data-theme="studio"] .st-rail-panel {
    position: relative;
    display: block;
    aspect-ratio: var(--studio-rail-panel-ar);
    border-radius: var(--r-media);
    background: var(--bg-alt);
    overflow: hidden;
  }
  :root[data-theme="studio"] .st-rail-body {
    display: flex; flex-direction: column;
    gap: clamp(4px, 0.4vw, 8px);
    padding: clamp(14px, 1.4vw, 28px) clamp(4px, 0.6vw, 12px) clamp(6px, 0.6vw, 12px);
  }
  /* Name 26px. */
  :root[data-theme="studio"] .st-rail-name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-stretch: var(--stretch);
    font-size: clamp(1rem, 1.3vw, 1.625rem);
    letter-spacing: -0.01em; line-height: 1.2;
    color: var(--ink);
  }
  /* Meta line: --ink-soft (7.8:1 on white) rather than --ink-mute, because
   * this line is dense spec text at 15–19px, not a struck secondary price. */
  :root[data-theme="studio"] .st-rail-meta {
    font-family: var(--f-body);
    font-size: clamp(12.5px, 0.9vw, 18px);
    line-height: 1.45;
    color: var(--ink-soft);
  }
  /* The measured muted price slot, 22px. */
  :root[data-theme="studio"] .st-rail-price {
    font-family: var(--f-body);
    font-size: clamp(13px, 1.1vw, 1.375rem);
    font-variant-numeric: tabular-nums;
    color: var(--ink-mute);
  }

  /* The measured arrow row, centred BELOW the rail (§4.4) — rebuilt as real
   * links to the card targets, so every control actually moves the rail with
   * no JS. Round (§9): these are arrows/chips, not word-carrying buttons. */
  :root[data-theme="studio"] .st-rail-nav {
    display: flex; justify-content: center; align-items: center; flex-wrap: wrap;
    gap: clamp(8px, 0.8vw, 14px);
    margin-top: clamp(20px, 2.4vw, 48px);
    padding-inline: var(--studio-gutter);
  }
  /* Ø46px, 1px border (measured). */
  :root[data-theme="studio"] .st-rail-go {
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: clamp(36px, 2.3vw, 46px);
    block-size: clamp(36px, 2.3vw, 46px);
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    background: var(--surface);
    color: var(--ink-soft);
    text-decoration: none;
    font-family: var(--f-body);
    font-size: clamp(12px, 0.8vw, 15px);
    font-weight: 600; line-height: 1;
    font-variant-numeric: tabular-nums;
    transition: border-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-rail-go:hover {
    border-color: var(--line-strong);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-rail-go:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    border-radius: var(--r-pill);
  }

  /* ---- responsive ---------------------------------------------------- */
  @media (max-width: 1000px) {
    /* Three 48px-padded cards stop being cards at this width. */
    :root[data-theme="studio"] .st-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    :root[data-theme="studio"] .st-grid { grid-template-columns: minmax(0, 1fr); }
    /* At 390px: gutter 18px each side leaves 354px; a 228px card plus the gap
     * guarantees the next one is cut by the right edge — the peek survives. */
    :root[data-theme="studio"] .st-card { padding: clamp(14px, 4vw, 22px); }
    :root[data-theme="studio"] .st-sec-h { max-width: none; }
  }

  /* ---- motion --------------------------------------------------------- */
  @media (prefers-reduced-motion: reduce) {
    /* Nothing here animates position, so the readable static state is the
     * resting one: no transitions, no residual transform. The rail keeps its
     * scrollability but drops snapping and smooth scrolling, which are the
     * only motion it has — an anchor still lands on its card, instantly. */
    :root[data-theme="studio"] .st-card,
    :root[data-theme="studio"] .st-rail-card,
    :root[data-theme="studio"] .st-rail-go,
    :root[data-theme="studio"] .st-util-go {
      transition: none;
      transform: none;
    }
    :root[data-theme="studio"] .st-rail {
      scroll-snap-type: none;
      scroll-behavior: auto;
    }
  }
`;

/** Photo-ready slot — bordered mass + contact shadow, never an image request. */
function shot(): string {
  return (
    '<span class="st-shot" aria-hidden="true">' +
    '<span class="st-shot-mass"></span>' +
    '<span class="st-shot-floor"></span>' +
    "</span>"
  );
}

function pdpHref(ctx: RenderCtx): string {
  return ctx.shop.routeSlugs["/product"] + "/" + ctx.content.pdp.slug + ctx.q;
}

/**
 * The struck compare-at price of §4.7.
 *
 * ProductCard does not (yet) carry a compare-at field, and inventing one from
 * `price` would put a fabricated discount on a €3k product — so the row simply
 * omits the <s> until the content layer supplies a real string. Read
 * structurally rather than via a cast to a wider ProductCard so adding
 * `compareAt?: string` to the interface needs no change here.
 */
function compareAt(p: ProductCard): string | null {
  const v: unknown = (p as { compareAt?: unknown }).compareAt;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Sentence-case a keyword for use as a heading, in the shop's own locale. */
function capFirst(s: string, locale: string): string {
  return s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);
}

/**
 * §4.7 — best sellers / product grid. This is the `products` SectionKey
 * renderer, so it keeps id="izbor": the hero CTA links to that fragment.
 *
 * The "util" discriminator is handled exactly as sections.ts products() does —
 * `"util" in p` narrows UtilCard from ProductCard — so a shop that ships a
 * comparison tile in the middle of its product list keeps it here too.
 */
export function renderStudioProducts(ctx: RenderCtx): string {
  const href = pdpHref(ctx);
  const cards = ctx.content.products
    .map((p: ProductCard | UtilCard) => {
      if ("util" in p) {
        return (
          '<a class="st-card st-util" href="' + href + '">' +
          '<h3 class="st-util-h">' + esc(p.h) + "</h3>" +
          '<p class="st-util-p">' + esc(p.p) + "</p>" +
          '<span class="st-util-go">' + esc(p.cta) + "</span>" +
          "</a>"
        );
      }
      const was = compareAt(p);
      return (
        '<a class="st-card" href="' + href + '">' +
        '<span class="st-card-panel">' +
        (p.badge ? '<span class="st-badge">' + esc(p.badge) + "</span>" : "") +
        shot() +
        "</span>" +
        '<span class="st-card-body">' +
        '<h3 class="st-card-name">' + esc(p.name) + "</h3>" +
        '<span class="st-price-row">' +
        '<span class="st-price">' + esc(p.price) + "</span>" +
        (was ? '<s class="st-was">' + esc(was) + "</s>" : "") +
        '<span class="st-vat">z DDV</span>' +
        "</span></span></a>"
      );
    })
    .join("");

  return (
    '<section class="st-shop" id="izbor"><div class="st-shop-in">' +
    '<div class="st-shop-head">' +
    '<p class="st-eyebrow">Najbolje prodajano</p>' +
    // The heading is the shop's own hand-written CTA line, not a templated
    // sentence: four shops on this baseline must not share a visible line.
    '<h2 class="st-sec-h">' + esc(ctx.content.cta) + "</h2>" +
    "</div>" +
    '<div class="st-grid">' + cards + "</div>" +
    "</div></section>"
  );
}

/**
 * §4.4 — the category rail.
 *
 * Titled from the shop's plural keyword (the one term this domain exists to
 * rank for). Util tiles are filtered out: they are not products and a rail
 * card has no room for a paragraph.
 *
 * The measured arrow buttons are replaced by a row of anchors, one per card,
 * each pointing at a `tabindex="-1"` list item. Following one scrolls the rail
 * (and moves focus into it) with no script — a control that does nothing must
 * not ship.
 */
export function renderStudioRail(ctx: RenderCtx): string {
  const items = ctx.content.products.filter(
    (p: ProductCard | UtilCard): p is ProductCard => !("util" in p),
  );
  // An empty rail would render a heading and a nav row that lead nowhere.
  if (items.length === 0) return "";

  const href = pdpHref(ctx);
  const title = capFirst(ctx.shop.keyword.plural, ctx.shop.locale.intl);

  const cards = items
    .map((p, i) => {
      const id = "st-rail-" + String(i + 1);
      return (
        '<li class="st-rail-item" id="' + id + '" tabindex="-1">' +
        '<a class="st-rail-card" href="' + href + '">' +
        '<span class="st-rail-panel">' + shot() + "</span>" +
        '<span class="st-rail-body">' +
        '<span class="st-rail-name">' + esc(p.name) + "</span>" +
        '<span class="st-rail-meta">' + esc(p.meta) + "</span>" +
        '<span class="st-rail-price">' + esc(p.price) + "</span>" +
        "</span></a></li>"
      );
    })
    .join("");

  // With a single card there is nothing to move between, so the row is not
  // rendered at all. With two or more it always acts: it scrolls the rail when
  // the track overflows, and moves focus into the named card when it does not.
  const nav = items.length < 2 ? "" : items
    .map(
      (p, i) =>
        '<a class="st-rail-go" href="#st-rail-' + String(i + 1) +
        '" aria-label="Pokažite model ' + esc(p.name) + '">' +
        String(i + 1) + "</a>",
    )
    .join("");

  return (
    '<section class="st-rail-sec" aria-labelledby="st-rail-h">' +
    '<div class="st-rail-head">' +
    '<p class="st-eyebrow">Ponudba</p>' +
    '<h2 class="st-sec-h" id="st-rail-h">' + esc(title) + "</h2>" +
    "</div>" +
    '<div class="st-rail"><ul class="st-rail-track">' + cards + "</ul></div>" +
    (nav ? '<nav class="st-rail-nav" aria-label="Pomik po ponudbi">' + nav + "</nav>" : "") +
    "</section>"
  );
}
