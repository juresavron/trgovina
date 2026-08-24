/**
 * STUDIO — chrome bar and footer (docs/STUDIO-BASELINE.md §4.1 and §4.12).
 *
 *   §4.1  Black 90px bar: wordmark left at the 54px gutter, 5-item nav
 *         centred, two Ø46px circular icon buttons on a #2A2A2A disc right.
 *   §4.12 Black footer: giant ~150px wordmark at a LIGHTER weight than the
 *         bar's, newsletter with an underlined input, brand blurb + circular
 *         contact rows, three link columns, hairline, legal line.
 *
 * Scale: every measured px is the clamp MAXIMUM (spec measured at 2000px);
 * the ratios between elements — gutter 54 : bar 90 : wordmark 28 : nav 15 —
 * survive the clamp because each shares the same vw slope as its neighbour.
 *
 * Token discipline: colors, radii and faces are var(--…) only. The three
 * values the token layer does not carry are declared here as --studio-*
 * (documented at their declaration), and every selector is scoped to
 * :root[data-theme="studio"] because the sheet is shared with the other
 * three themes.
 */

import { esc, type RenderCtx } from "../../render/sections";

/* ---- inline line icons ----------------------------------------------- */
/* 24px grid, stroke-only, currentColor: one icon serves both the white-on-
 * disc chrome buttons and the footer's contact rows without a second copy. */
type IconKey = "search" | "basket" | "mail" | "phone" | "pin" | "arrow";

const ICON_PATHS: Record<IconKey, string> = {
  search:
    '<circle cx="11" cy="11" r="6.4"/><path d="m15.9 15.9 4.6 4.6"/>',
  basket:
    '<path d="M5.6 8h12.8l1 11.4a1.6 1.6 0 0 1-1.6 1.7H6.2a1.6 1.6 0 0 1-1.6-1.7Z"/>' +
    '<path d="M9 8V6.3a3 3 0 0 1 6 0V8"/>',
  mail:
    '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.7 6.9 8.3 5.9 8.3-5.9"/>',
  phone:
    '<path d="M6.4 3.8h3l1.5 3.7-2 1.4a11.5 11.5 0 0 0 5.2 5.2l1.4-2 3.7 1.5v3a1.6 1.6 0 0 1-1.7 1.6A15.6 15.6 0 0 1 4.8 5.5a1.6 1.6 0 0 1 1.6-1.7Z"/>',
  pin:
    '<path d="M12 21s6.4-6 6.4-11a6.4 6.4 0 1 0-12.8 0C5.6 15 12 21 12 21Z"/><circle cx="12" cy="10" r="2.4"/>',
  arrow: '<path d="M4 12h14.5"/><path d="m12.8 6.2 5.8 5.8-5.8 5.8"/>',
};

function icon(k: IconKey): string {
  return (
    '<svg class="st-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false" ' +
    'fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    ICON_PATHS[k] +
    "</svg>"
  );
}

export const STUDIO_CHROME_CSS = `
  :root[data-theme="studio"] {
    /* Measured 54px page gutter (§3). Header, footer and every left-aligned
     * band start here, so it lives as one variable rather than four clamps. */
    --studio-gutter: clamp(18px, 2.7vw, 54px);
    /* Measured 90px chrome bar (§4.1). The token layer's --chrome-h is a flat
     * 88px; this is its responsive twin — see the integrator note. */
    --studio-chrome-h: clamp(58px, 4.5vw, 90px);
    /* The right inset is measured at 48px, NOT the 54px gutter — the icon
     * discs sit closer to the edge than the wordmark does. */
    --studio-inset-r: clamp(14px, 2.4vw, 48px);
    /* Measured #2A2A2A disc under the chrome icons: 12% of the on-invert ink
     * lifted off the near-black band, so it tracks the band if that moves. */
    --studio-disc: color-mix(in srgb, var(--on-invert) 12%, var(--ink-invert));
    /* The measured weight PAIR. The bar's wordmark is heavy, the footer's
     * giant one is visibly lighter (~400 vs ~600) — that difference is the
     * whole reason the 150px footer wordmark reads as a ground, not a shout. */
    --studio-w-mark: 600;
    --studio-w-mark-foot: 400;
  }

  /* Visually hidden until focused — used by the skip link and the newsletter
   * field's label. clip-path over the old clip-rect hack: it survives
   * transforms and does not leave a 1px scroll artefact. */
  :root[data-theme="studio"] .st-vh {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }

  /* ---- §4.1 chrome bar ---- */
  :root[data-theme="studio"] .st-chrome {
    background: var(--ink-invert);
    color: var(--on-invert);
    /* The wordmark band and hero sit flush under it; the hairline keeps the
     * bar legible where a dark section follows a dark bar. */
    border-bottom: 1px solid color-mix(in srgb, var(--on-invert) 10%, transparent);
  }
  :root[data-theme="studio"] .st-chrome-bar {
    max-width: 1900px;
    margin-inline: auto;
    padding-inline: var(--studio-gutter) var(--studio-inset-r);
    min-height: var(--studio-chrome-h);
    display: grid;
    /* 1fr | auto | 1fr keeps the nav optically centred on the VIEWPORT even
     * when the wordmark and the icon cluster differ in width. */
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: clamp(12px, 2vw, 32px);
  }

  :root[data-theme="studio"] .st-chrome-mark {
    justify-self: start;
    font-family: var(--f-display);
    font-weight: var(--studio-w-mark);
    font-stretch: var(--stretch);
    font-size: clamp(1rem, 1.4vw, 1.75rem);
    letter-spacing: 0.02em;
    line-height: 1;
    text-transform: uppercase;
    text-decoration: none;
    /* ONE white word: studio drops the accent split the other themes use. */
    color: var(--on-invert);
    white-space: nowrap;
  }

  :root[data-theme="studio"] .st-chrome-nav {
    justify-self: center;
    display: flex;
    align-items: center;
    gap: clamp(16px, 2.8vw, 56px);
  }
  :root[data-theme="studio"] .st-chrome-nav a {
    font-family: var(--f-body);
    font-size: clamp(11.5px, 0.75vw, 15px);
    font-weight: 500;
    letter-spacing: 0.08em;
    line-height: 1;
    text-transform: uppercase;
    text-decoration: none;
    white-space: nowrap;
    /* Full on-invert, not the muted rung: 15px tracked caps on #0D0D0D needs
     * every point of contrast it can get. */
    color: var(--on-invert);
    padding-block: 4px;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-chrome-nav a:hover { border-bottom-color: var(--on-invert); }

  :root[data-theme="studio"] .st-chrome-actions {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: clamp(8px, 0.8vw, 14px);
  }
  /* Ø46px disc. Round because it is an icon control, not a CTA — sharp
   * corners are reserved for buttons that carry a word (§3). */
  :root[data-theme="studio"] .st-chrome-btn {
    position: relative;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: clamp(36px, 2.3vw, 46px);
    block-size: clamp(36px, 2.3vw, 46px);
    border-radius: var(--r-pill);
    border: 0;
    background: var(--studio-disc);
    color: var(--on-invert);
    text-decoration: none;
    transition: background-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-chrome-btn:hover {
    background: color-mix(in srgb, var(--on-invert) 22%, var(--ink-invert));
  }
  :root[data-theme="studio"] .st-chrome-btn .st-ico {
    inline-size: clamp(17px, 1.05vw, 21px);
    block-size: clamp(17px, 1.05vw, 21px);
  }
  /* The base sheet's focus ring forces border-radius:4px, which would square
   * off a circular control mid-focus. Restore the pill here. */
  :root[data-theme="studio"] .st-chrome-btn:focus-visible {
    outline: 2px solid var(--on-invert);
    outline-offset: 3px;
    border-radius: var(--r-pill);
  }

  /* Count badge: small white disc, black numeral (measured). */
  :root[data-theme="studio"] .st-chrome-badge {
    position: absolute; top: -3px; right: -3px;
    min-inline-size: 18px; block-size: 18px;
    padding-inline: 5px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: var(--r-pill);
    background: var(--bg);
    color: var(--ink);
    font-family: var(--f-body);
    font-size: 10.5px; font-weight: 700; line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  /* Phone fallback for the icon cluster below 720px. */
  :root[data-theme="studio"] .st-chrome-tel {
    display: none;
    align-items: center; gap: 8px;
    font-family: var(--f-body);
    font-size: clamp(12px, 0.8vw, 15px);
    font-weight: 600; letter-spacing: 0.02em;
    text-decoration: none;
    color: var(--on-invert);
    white-space: nowrap;
  }
  :root[data-theme="studio"] .st-chrome-tel .st-ico { inline-size: 16px; block-size: 16px; }

  /* Skip link: off-screen until focused, then a sharp-cornered white plate. */
  :root[data-theme="studio"] .st-skip {
    position: absolute; left: -9999px; top: 0; z-index: 50;
    background: var(--bg); color: var(--ink);
    font-family: var(--f-body); font-size: 13px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 12px 20px; text-decoration: none;
    border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-skip:focus-visible {
    left: var(--studio-gutter); top: 8px;
    outline: 2px solid var(--ink); outline-offset: 2px;
    border-radius: var(--r-ctrl);
  }
  /* Focus target after the bar — never a visible box, never a focus ring. */
  :root[data-theme="studio"] .st-anchor { display: block; outline: none; }

  /* ---- §4.12 footer ---- */
  :root[data-theme="studio"] .st-foot {
    background: var(--ink-invert);
    color: var(--on-invert);
    overflow: clip;
    /* ~150px rhythm on dark bands (§3), collapsed hard on a phone. */
    padding-block: clamp(48px, 7.5vw, 150px) clamp(28px, 2.6vw, 52px);
  }
  :root[data-theme="studio"] .st-foot-in {
    max-width: 1900px; margin-inline: auto;
    padding-inline: var(--studio-gutter) var(--studio-inset-r);
  }

  :root[data-theme="studio"] .st-foot-top {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    align-items: end;
    gap: clamp(32px, 4vw, 80px);
    margin-bottom: clamp(48px, 6vw, 120px);
  }
  /* ~150px, and LIGHTER than the bar's mark — the measured difference. */
  :root[data-theme="studio"] .st-foot-mark {
    font-family: var(--f-display);
    font-weight: var(--studio-w-mark-foot);
    font-stretch: var(--stretch);
    font-size: clamp(2.2rem, 7.5vw, 9.375rem);
    letter-spacing: var(--track-display);
    line-height: 0.88;
    text-transform: uppercase;
    color: var(--on-invert);
    /* A long shop name must wrap, never push the page sideways. */
    max-width: 100%; overflow-wrap: anywhere; hyphens: none;
  }

  :root[data-theme="studio"] .st-news-h {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-stretch: var(--stretch);
    letter-spacing: var(--track-display);
    font-size: clamp(1.15rem, 1.4vw, 1.75rem);
    line-height: 1.2;
    color: var(--on-invert);
    margin-bottom: clamp(14px, 1.2vw, 24px);
  }
  :root[data-theme="studio"] .st-news-row {
    display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid color-mix(in srgb, var(--on-invert) 34%, transparent);
    padding-bottom: clamp(10px, 0.8vw, 16px);
  }
  :root[data-theme="studio"] .st-news-in {
    flex: 1 1 auto; min-width: 0;
    background: transparent; border: 0; padding: 0;
    font-family: var(--f-body);
    font-size: clamp(14px, 0.95vw, 19px);
    line-height: 1.4;
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-news-in::placeholder { color: var(--on-invert-mute); }
  :root[data-theme="studio"] .st-news-in:focus-visible {
    outline: 2px solid var(--on-invert); outline-offset: 6px; border-radius: var(--r-ctrl);
  }
  /* Round arrow — a chip, not a CTA button (§3). */
  :root[data-theme="studio"] .st-news-go {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: clamp(34px, 2.1vw, 42px); block-size: clamp(34px, 2.1vw, 42px);
    border-radius: var(--r-pill);
    border: 1px solid color-mix(in srgb, var(--on-invert) 34%, transparent);
    background: transparent; color: var(--on-invert);
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-news-go:hover { background: var(--on-invert); color: var(--ink); }
  :root[data-theme="studio"] .st-news-go:focus-visible {
    outline: 2px solid var(--on-invert); outline-offset: 3px; border-radius: var(--r-pill);
  }
  :root[data-theme="studio"] .st-news-go .st-ico { inline-size: 18px; block-size: 18px; }
  :root[data-theme="studio"] .st-news-note {
    margin-top: 10px;
    font-family: var(--f-body);
    font-size: clamp(11.5px, 0.7vw, 14px);
    line-height: 1.5;
    color: var(--on-invert-mute);
  }

  :root[data-theme="studio"] .st-foot-cols {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) repeat(3, minmax(0, 1fr));
    gap: clamp(32px, 3.4vw, 68px);
  }
  :root[data-theme="studio"] .st-foot-blurb {
    font-family: var(--f-body);
    font-size: clamp(14px, 0.95vw, 19px);
    line-height: 1.6;
    color: var(--on-invert-mute);
    max-width: 42ch;
    margin-bottom: clamp(22px, 2vw, 40px);
  }
  :root[data-theme="studio"] .st-contacts {
    display: flex; flex-direction: column; gap: clamp(14px, 1.3vw, 26px);
  }
  :root[data-theme="studio"] .st-contact {
    display: flex; align-items: center; gap: clamp(12px, 1vw, 18px);
    font-family: var(--f-body);
    font-size: clamp(13.5px, 0.9vw, 18px);
    line-height: 1.4;
    color: var(--on-invert);
    text-decoration: none;
  }
  /* Ø44px outlined disc (measured). Round: icon chip, not a button. */
  :root[data-theme="studio"] .st-contact-ico {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: clamp(34px, 2.2vw, 44px); block-size: clamp(34px, 2.2vw, 44px);
    border-radius: var(--r-pill);
    border: 1px solid color-mix(in srgb, var(--on-invert) 28%, transparent);
    color: var(--on-invert);
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] a.st-contact:hover .st-contact-ico {
    background: var(--on-invert); color: var(--ink);
  }
  :root[data-theme="studio"] a.st-contact:focus-visible {
    outline: 2px solid var(--on-invert); outline-offset: 4px; border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-contact-ico .st-ico { inline-size: 18px; block-size: 18px; }

  :root[data-theme="studio"] .st-foot-col h2 {
    font-family: var(--f-body);
    font-size: clamp(11.5px, 0.75vw, 15px);
    font-weight: 500; letter-spacing: 0.12em; line-height: 1;
    text-transform: uppercase;
    color: var(--on-invert-mute);
    margin-bottom: clamp(20px, 2vw, 40px);
  }
  :root[data-theme="studio"] .st-foot-col ul {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column;
    /* Measured ~66px row gap — the footer's airiness is the device. */
    gap: clamp(14px, 3.3vw, 66px);
  }
  :root[data-theme="studio"] .st-foot-col a {
    font-family: var(--f-body);
    font-size: clamp(14px, 0.95vw, 19px);
    line-height: 1.3;
    text-decoration: none;
    color: var(--on-invert-mute);
    transition: color 0.2s ease;
  }
  :root[data-theme="studio"] .st-foot-col a:hover { color: var(--on-invert); }
  :root[data-theme="studio"] .st-foot-col a:focus-visible {
    outline: 2px solid var(--on-invert); outline-offset: 3px; border-radius: var(--r-ctrl);
  }

  :root[data-theme="studio"] .st-foot-rule {
    border: 0; height: 1px;
    background: color-mix(in srgb, var(--on-invert) 16%, transparent);
    margin: clamp(40px, 5vw, 100px) 0 clamp(18px, 1.6vw, 32px);
  }
  :root[data-theme="studio"] .st-foot-legal {
    font-family: var(--f-body);
    font-size: clamp(12px, 0.85vw, 17px);
    line-height: 1.5;
    color: var(--on-invert-mute);
  }

  /* ---- responsive ---- */
  @media (max-width: 720px) {
    /* §4.1 mobile: the nav drops to its own scrollable row under the
     * wordmark, and the icon cluster gives way to the phone number — the one
     * action that actually converts at this AOV. */
    :root[data-theme="studio"] .st-chrome-bar {
      grid-template-columns: auto 1fr;
      row-gap: 0;
      padding-block: 12px 0;
    }
    :root[data-theme="studio"] .st-chrome-actions { display: none; }
    /* Explicit placement: the nav spanning both columns would otherwise push
     * the phone link — which follows it in source order — onto a third row. */
    :root[data-theme="studio"] .st-chrome-mark { grid-area: 1 / 1; }
    :root[data-theme="studio"] .st-chrome-tel {
      grid-area: 1 / 2;
      display: inline-flex; justify-self: end;
    }
    :root[data-theme="studio"] .st-chrome-nav {
      grid-area: 2 / 1 / 3 / -1;
      justify-self: stretch;
      justify-content: flex-start;
      gap: 22px;
      /* Its own scroll container: the page must never scroll sideways. */
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      padding: 14px 0 12px;
      margin-inline: calc(var(--studio-gutter) * -1) calc(var(--studio-inset-r) * -1);
      padding-inline: var(--studio-gutter) var(--studio-inset-r);
    }
    :root[data-theme="studio"] .st-chrome-nav::-webkit-scrollbar { display: none; }

    :root[data-theme="studio"] .st-foot-top { grid-template-columns: minmax(0, 1fr); align-items: start; }
    :root[data-theme="studio"] .st-foot-cols { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    :root[data-theme="studio"] .st-foot-brand { grid-column: 1 / -1; }
  }
  @media (max-width: 420px) {
    /* Two 19px link columns stop fitting; one column, tightened rows. */
    :root[data-theme="studio"] .st-foot-cols { grid-template-columns: minmax(0, 1fr); }
    :root[data-theme="studio"] .st-foot-col ul { gap: 14px; }
  }

  @media (prefers-reduced-motion: reduce) {
    /* Nothing here animates position, so the readable static state is simply
     * the resting one: no transitions, no residual transform. */
    :root[data-theme="studio"] .st-chrome-btn,
    :root[data-theme="studio"] .st-chrome-nav a,
    :root[data-theme="studio"] .st-news-go,
    :root[data-theme="studio"] .st-contact-ico,
    :root[data-theme="studio"] .st-foot-col a {
      transition: none;
      transform: none;
    }
  }
`;

/** Wordmark joined into ONE word — studio drops the two-tone accent split. */
function markText(ctx: RenderCtx): string {
  return ctx.shop.wordmark[0] + ctx.shop.wordmark[1];
}

/**
 * §4.1 — chrome bar.
 *
 * Nav is mapped onto routeSlugs in the same order renderHeader() uses, so a
 * shop that renames a slug renames it in both chromes at once. The returned
 * string carries the skip link's target immediately after </header>, which
 * keeps the link functional without page.ts having to put an id on <main>.
 */
export function renderStudioHeader(ctx: RenderCtx): string {
  const s = ctx.shop;
  const c = ctx.content;
  const links = [
    ["/products", c.nav[0]],
    ["/compare", c.nav[1]],
    ["/guides", c.nav[2]],
    ["/delivery", c.nav[3]],
    ["/contact", c.nav[4]],
  ] as const;

  // No cart session exists at SSR time, so the badge states the honest 0 and
  // says so in the label. The integrator swaps the numeral, not the markup.
  const cartCount = 0;

  return (
    '<header class="st-chrome">' +
    '<a class="st-skip" href="#st-vsebina">Preskočite na vsebino</a>' +
    '<div class="st-chrome-bar">' +
    '<a class="st-chrome-mark" href="/' + ctx.q + '">' + esc(markText(ctx)) + "</a>" +
    '<nav class="st-chrome-nav" aria-label="Glavni meni">' +
    links
      .map(([k, label]) => '<a href="' + s.routeSlugs[k] + ctx.q + '">' + esc(label) + "</a>")
      .join("") +
    "</nav>" +
    '<div class="st-chrome-actions">' +
    // Magnifier goes to the catalogue: a real destination, not a dead control.
    '<a class="st-chrome-btn" href="' + s.routeSlugs["/products"] + ctx.q +
    '" aria-label="Iščite po ponudbi">' + icon("search") + "</a>" +
    '<a class="st-chrome-btn" href="' + s.routeSlugs["/cart"] + ctx.q +
    '" aria-label="Košarica — ' + cartCount + ' izdelkov">' + icon("basket") +
    '<span class="st-chrome-badge" data-st-cart-count="' + cartCount + '" aria-hidden="true">' +
    cartCount + "</span></a>" +
    "</div>" +
    '<a class="st-chrome-tel" href="' + ctx.phoneHref + '">' + icon("phone") +
    "<span>" + esc(ctx.phoneDisplay) + "</span></a>" +
    "</div></header>" +
    '<span class="st-anchor" id="st-vsebina" tabindex="-1"></span>'
  );
}

/**
 * §4.12 — footer.
 *
 * The newsletter row is deliberately inert: type="button", no <form>, no
 * action, no name on the field. Rendering a live-looking subscription that
 * silently drops the address would be worse than admitting it is not wired,
 * so the note under it says when it opens.
 */
export function renderStudioFooter(ctx: RenderCtx): string {
  const s = ctx.shop;
  const c = ctx.content;
  const a = s.contact.address;

  const col = (title: string, items: readonly (readonly [string, string])[]): string =>
    '<div class="st-foot-col"><h2>' + esc(title) + "</h2><ul>" +
    items
      .map(([href, label]) => '<li><a href="' + href + ctx.q + '">' + esc(label) + "</a></li>")
      .join("") +
    "</ul></div>";

  const contact = (k: IconKey, href: string | null, label: string): string => {
    const inner =
      '<span class="st-contact-ico">' + icon(k) + "</span><span>" + esc(label) + "</span>";
    return href
      ? '<a class="st-contact" href="' + href + '">' + inner + "</a>"
      : '<span class="st-contact">' + inner + "</span>";
  };

  return (
    '<footer class="st-foot"><div class="st-foot-in">' +
    '<div class="st-foot-top">' +
    '<p class="st-foot-mark">' + esc(markText(ctx)) + "</p>" +
    "<div>" +
    '<h2 class="st-news-h">E-novice</h2>' +
    '<div class="st-news-row">' +
    '<label class="st-vh" for="st-news">Vaš e-poštni naslov</label>' +
    '<input class="st-news-in" id="st-news" type="email" autocomplete="email" ' +
    'placeholder="Vaš e-poštni naslov">' +
    '<button class="st-news-go" type="button" aria-label="Prijavite se na e-novice">' +
    icon("arrow") + "</button>" +
    "</div>" +
    '<p class="st-news-note">Prijava na e-novice bo na voljo ob zagonu trgovine. ' +
    "Do takrat nas, prosimo, pokličite ali pišite.</p>" +
    "</div></div>" +

    '<div class="st-foot-cols">' +
    '<div class="st-foot-brand">' +
    '<p class="st-foot-blurb">' + esc(c.footNote) + "</p>" +
    '<div class="st-contacts">' +
    contact("mail", "mailto:" + s.contact.email, s.contact.email) +
    contact("phone", ctx.phoneHref, ctx.phoneDisplay) +
    contact("pin", null, a.street + ", " + a.zip + " " + a.city) +
    "</div></div>" +
    col("Trgovina", [
      [s.routeSlugs["/products"], c.nav[0]],
      [s.routeSlugs["/compare"], "Primerjava modelov"],
      [s.routeSlugs["/guides"], "Vodniki"],
      [s.routeSlugs["/financing"], "Financiranje"],
    ] as const) +
    col("Pomoč", [
      [s.routeSlugs["/delivery"], "Dostava in montaža"],
      [s.routeSlugs["/faq"], "Pogosta vprašanja"],
      [s.routeSlugs["/showroom"], "Razstavni salon"],
      [s.routeSlugs["/contact"], "Kontakt"],
    ] as const) +
    col("Pravno", [
      [s.routeSlugs["/terms"], "Pogoji poslovanja"],
      [s.routeSlugs["/privacy"], "Zasebnost"],
      [s.routeSlugs["/cookies"], "Piškotki"],
      [s.routeSlugs["/withdrawal"], "Odstop od pogodbe"],
    ] as const) +
    "</div>" +

    '<hr class="st-foot-rule">' +
    '<p class="st-foot-legal">' +
    esc(
      s.company.legalName + " · ID za DDV: " + s.company.vatId + " · " +
      a.street + ", " + a.zip + " " + a.city,
    ) +
    "</p>" +
    "</div></footer>"
  );
}
