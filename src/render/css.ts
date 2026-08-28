/**
 * Storefront stylesheet — the theme layer as CSS.
 *
 * Shop contributes --hue/--c (accent identity); theme blocks own surfaces,
 * ink, typography voice and edge radii — the exact split of
 * src/themes/catalog.ts. Inlined into the document head: the whole sheet is
 * ~9 KB, far below the cost of a render-blocking request. Google Fonts is a
 * prototype-stage substitute; production self-hosts subsets (docs/DESIGN.md).
 */
import { STUDIO_CSS } from "../themes/studio";
import { SHOPS } from "../tenants";

/**
 * Shop accent identities, generated from ShopConfig rather than hand-written.
 *
 * These were a hardcoded block until shops 5 and 6 shipped with no entry and
 * silently lost their accent: `oklch(L var(--c) var(--hue))` with undefined
 * custom properties is an invalid color, so every accented surface fell back.
 * Deriving them keeps the kernel's promise that adding a shop is one config
 * file — a CSS edit you can forget is not a promise.
 */
const SHOP_ACCENTS = Object.values(SHOPS)
  .map(
    (s) =>
      `  :root[data-shop="${s.key}"] { --hue: ${s.design.accentHue}; --c: ${s.design.accentChroma}; }`,
  )
  .join("\n");

const SHEET = `

  /* SEVEN TOKENS THE KERNEL'S MARKUP USES AND NO THEME NOW DECLARES.
   *
   * They were declared only inside the zarja, lednik and salon blocks, and
   * they are referenced by the kernel's own components (.shophead, .nav,
   * .act, .card, .step, .buy) — which studio replaces, so on a studio page
   * the rules that want them mostly do not match. "Mostly" is the problem:
   * the placeholder routes still render kernel markup, and a border declared
   * as var(--line-soft) with nothing behind it is not a soft line, it is no
   * line at all.
   *
   * That was ALREADY true before those blocks were deleted — a
   * :root[data-theme="zarja"] declaration never applied to a studio page.
   * The "no undeclared custom properties" test did not catch it because it
   * reads the stylesheet as one text and asks whether each name appears on
   * both sides, which it did. Deleting the blocks is what made the omission
   * visible rather than what caused it.
   *
   * Aliased to studio's palette rather than given invented values, so the
   * kernel's fallback components look like the theme the site actually
   * wears.
   */
  :root {
    --line-soft: color-mix(in srgb, var(--line) 55%, var(--bg));
    --ink-soft: var(--ink-body, #212121);
    --surface2: var(--bg-alt, #f0f0f0);
    --wash-strong: oklch(0.62 var(--c) var(--hue) / 0.28);
    --r-scene: var(--r-media, 8px);
    --stretch: 100%;
    --track-display: 0em;
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; scroll-padding-top: 96px; }
  /* ⚠️ THE BASE SIZE IS A RAMP RUNG, NOT A ROUND-ISH NUMBER.
   *
   * This said 16.5px/1.6 — half a pixel above --t-body (16px) and a whole
   * rung away from --lh-body (1.625em). Every element on the site that does
   * NOT set its own size inherits from here, so a typography sweep found
   * 16.5px rendering on all 26 routes as a size the ramp does not contain,
   * sitting beside the same face at 16px wherever a rule DID name the token.
   * Two body sizes half a pixel apart is not a design decision anyone made;
   * it is what happens when the base is typed and the roles are tokenised.
   *
   * The fallbacks are the kernel's, and they matter: --t-body is declared on
   * :root[data-theme="studio"], and the placeholder routes and the pre-live
   * 503 screen render without that attribute. An undefined var() with no
   * fallback makes the whole declaration invalid, which would leave those
   * pages at the UA's 16px/normal — close enough to hide the bug and wrong
   * enough to show it on a long paragraph. */
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font-family: var(--f-body);
    font-size: var(--t-body, 16px);
    line-height: var(--lh-body, 1.625);
    overflow-x: clip;
  }
  h1, h2, h3 { margin: 0; text-wrap: balance; }
  p { margin: 0; }
  a { color: inherit; }
  :is(a, button):focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { transition: none !important; }
  }
  /* Same-origin navigations cross-fade instead of flashing white — the
   * cross-document View Transitions opt-in, which is one rule and nothing
   * else: no library, no JS, and a browser without it simply navigates.
   * Inside the motion query so a reduced-motion reader keeps the instant
   * cut, which for them IS the better transition. */
  @media not (prefers-reduced-motion: reduce) {
    @view-transition { navigation: auto; }
  }

  .display {
    font-family: var(--f-display); font-weight: var(--w-display);
    /* Fallbacks matter: studio declares neither of these — its display face
       (Clash Display) is not variable-width and its tracking is per-role. An
       undefined var() makes the whole declaration invalid, which silently
       dropped the tracking on every kernel-rendered studio page, the 503
       pre-live screen among them. */
    font-stretch: var(--stretch, 100%); letter-spacing: var(--track-display, 0em); line-height: 1.04;
  }
  .wrap { max-width: 1280px; margin: 0 auto; padding: 0 clamp(20px, 4.5vw, 56px); }
  .eyebrow {
    font-size: 12.5px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--acc-text);
  }

  /* The QA switcher. It sits at the very top of the document, and the studio
     chrome is a FIXED bar at top:0 — so the two occupied the same 33px and the
     switcher was simply hidden underneath. That went unnoticed for as long as
     the bar was opaque; over the full-bleed hero, where the bar is
     transparent, the switcher shows through the nav and both become
     unreadable. So it takes the top strip for itself and everything else moves
     down by exactly its height. Dev-only: no production page renders it. */
  /* The offsets live in chrome.ts: the studio sheet sets these same
     properties at equal specificity and later in source order, so an
     unprefixed rule here loses to it silently. */

  .shophead { border-bottom: 1px solid var(--line-soft); background: var(--bg); }
  .shophead .wrap { display: flex; align-items: center; gap: 30px; flex-wrap: wrap; min-height: 76px; padding-top: 12px; padding-bottom: 12px; }
  .wordmark { font-size: 22px; text-decoration: none; }
  .wordmark em { font-style: normal; color: var(--acc-text); }
  .nav { display: flex; gap: 24px; font-size: 14.5px; color: var(--ink-soft); flex-wrap: wrap; }
  .nav a { text-decoration: none; }
  .nav a:hover { color: var(--ink); }
  .head-phone { margin-left: auto; font-weight: 700; font-size: 15px; text-decoration: none; display: inline-flex; flex-direction: column; align-items: flex-end; line-height: 1.25; }
  .head-phone small { font-weight: 400; color: var(--ink-mute); font-size: 11.5px; }

  .act { padding: clamp(70px, 9vw, 128px) 0; }
  .act + .act { border-top: 1px solid var(--line-soft); }
  .act-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; margin-bottom: clamp(36px, 5vw, 56px); flex-wrap: wrap; }
  .act-head h2 { font-size: clamp(1.8rem, 3.4vw, 2.6rem); max-width: 24ch; }
  .act-head .lede { color: var(--ink-soft); max-width: 50ch; font-size: 1.02rem; }

  .btn {
    display: inline-flex; align-items: center; gap: 10px;
    border-radius: var(--r-ctrl); padding: 15px 30px;
    font-weight: 700; font-size: 15px; text-decoration: none; border: 1px solid transparent;
  }
  .btn { transition: filter 0.2s ease, box-shadow 0.25s ease, border-color 0.2s ease; }
  .btn-fill { background: var(--acc); color: var(--on-acc); }
  .btn-fill:hover { filter: brightness(1.06); box-shadow: 0 8px 28px var(--wash-strong); }
  .btn-ghost { border-color: var(--line); background: transparent; color: var(--ink); }
  .btn-ghost:hover { border-color: var(--ink-mute); }

  .hero { padding: 0; }
  .hero-canvas { border-bottom: 1px solid var(--line-soft); position: relative; overflow: clip; }
  .hero-grid {
    display: grid; grid-template-columns: minmax(0, 6.2fr) minmax(0, 5fr);
    gap: clamp(32px, 5vw, 80px); align-items: center;
    padding: clamp(64px, 8vw, 108px) 0;
  }
  .hero h1 { font-size: clamp(2.7rem, 5.8vw, 4.7rem); max-width: 15ch; }
  .hero .sub { color: var(--ink-soft); font-size: clamp(1.05rem, 1.5vw, 1.22rem); max-width: 46ch; margin-top: 24px; line-height: 1.65; }
  .hero .ctas { display: flex; gap: 14px; margin-top: 38px; flex-wrap: wrap; align-items: center; }

  .scene {
    aspect-ratio: 4 / 3.3; border-radius: var(--r-scene);
    border: 1px solid var(--line); box-shadow: var(--shadow);
    position: relative; overflow: hidden;
    display: grid; place-items: end center;
  }
  .scene svg { width: 80%; height: auto; display: block; margin-bottom: 5%; }
  .scene .floor {
    position: absolute; left: 50%; bottom: 7%; transform: translateX(-50%);
    width: 62%; height: 7%; border-radius: 50%;
    background: radial-gradient(50% 50% at 50% 50%, rgba(0, 0, 0, 0.32), transparent 70%);
  }
  .scene .cap {
    position: absolute; bottom: 12px; right: 16px;
    font-family: ui-monospace, Menlo, monospace; font-size: 9.5px;
    letter-spacing: 0.08em; color: var(--ink-mute); opacity: 0.75;
  }

  .trust-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
  .trust-item { font-size: 14px; color: var(--ink-soft); display: flex; gap: 12px; align-items: baseline; }
  .trust-item::before { content: "—"; color: var(--acc-text); flex: none; }
  .act-trust { padding: clamp(36px, 4vw, 52px) 0; }

  .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
  .stat { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card); padding: 26px 24px 22px; }
  .stat .v { font-family: var(--f-display); font-stretch: var(--stretch); font-weight: 750; font-size: clamp(1.8rem, 3vw, 2.4rem); line-height: 1; color: var(--acc-text); font-variant-numeric: tabular-nums; }
  .stat .l { margin-top: 10px; font-size: 13px; color: var(--ink-mute); letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; }

  .prod-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }
  .card {
    background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card);
    overflow: hidden; display: flex; flex-direction: column; position: relative; text-decoration: none;
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.3s ease;
  }
  .card:hover { transform: translateY(-3px); border-color: var(--ink-mute); box-shadow: var(--shadow); }
  .card .scene { aspect-ratio: 4 / 3; border: 0; border-bottom: 1px solid var(--line-soft); box-shadow: none; border-radius: 0; }
  .card .scene svg { width: 66%; }
  .badge {
    position: absolute; top: 16px; left: 16px; z-index: 2;
    background: var(--acc); color: var(--on-acc);
    font-size: 11px; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase;
    padding: 6px 13px; border-radius: 999px;
  }
  .card .body { padding: 24px 24px 26px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
  .card h3 { font-size: clamp(1.15rem, 1.6vw, 1.35rem); }
  .card .desc { color: var(--ink-soft); font-size: 14.5px; }
  .card .meta { color: var(--ink-mute); font-family: ui-monospace, Menlo, monospace; font-size: 11.5px; letter-spacing: 0.03em; }
  .card .price-row { margin-top: auto; padding-top: 18px; display: flex; align-items: baseline; gap: 8px; }
  .card .price { font-size: 21px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .card .vat { color: var(--ink-mute); font-size: 12px; }
  .card .go { margin-left: auto; color: var(--acc-text); font-weight: 700; font-size: 14px; }
  .card.util { align-items: flex-start; justify-content: flex-start; padding: 26px 26px 24px; gap: 12px; background: var(--surface2); border-top: 3px solid var(--acc); }
  .card.util h3 { font-size: 1.45rem; max-width: 16ch; margin-top: 6px; }
  .card.util p { color: var(--ink-soft); font-size: 14.5px; max-width: 30ch; }
  .card.util .go { margin-top: auto; padding-top: 18px; }

  .act-moat { background: var(--bg-alt); }
  .steps { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); counter-reset: step; }
  .step { position: relative; padding: 0 24px 0 0; }
  .step + .step { border-left: 1px solid var(--line); padding-left: 24px; }
  .step::before {
    counter-increment: step; content: counter(step, decimal-leading-zero);
    display: block; margin-bottom: 16px;
    font-family: var(--f-display); font-stretch: var(--stretch);
    font-size: 1.5rem; font-weight: var(--w-display); color: var(--acc-text); line-height: 1;
  }
  .step h3 { font-size: 1.05rem; margin-bottom: 8px; font-family: var(--f-body); font-weight: 700; }
  .step p { color: var(--ink-soft); font-size: 13.5px; }
  .moat-claim { margin-top: clamp(40px, 5vw, 56px); font-size: clamp(1.25rem, 2.2vw, 1.65rem); max-width: 36ch; }
  .moat-claim em { font-style: normal; color: var(--acc-text); }

  .rev-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px; }
  .rev { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-card); padding: 30px; display: flex; flex-direction: column; gap: 16px; }
  .stars { color: var(--acc-text); letter-spacing: 4px; font-size: 13px; }
  .rev blockquote { margin: 0; font-size: 1.1rem; line-height: 1.6; font-family: var(--f-display); font-weight: 400; font-stretch: 100%; }
  .rev .who { color: var(--ink-mute); font-size: 13px; display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
  .rev .vrf {
    color: var(--acc-text); font-family: ui-monospace, Menlo, monospace; font-size: 10.5px;
    letter-spacing: 0.05em; border: 1px solid var(--wash-strong); background: var(--wash);
    padding: 3px 10px; border-radius: 999px;
  }

  .guide-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; }
  .guide { border: 1px solid var(--line); border-radius: var(--r-card); padding: 28px 26px; background: var(--surface); text-decoration: none; display: flex; flex-direction: column; gap: 12px; min-height: 168px; }
  .guide { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.3s ease; }
  .guide:hover { transform: translateY(-3px); border-color: var(--ink-mute); box-shadow: var(--shadow); }
  .guide .k { font-family: ui-monospace, Menlo, monospace; font-size: 10.5px; letter-spacing: 0.1em; color: var(--ink-mute); text-transform: uppercase; }
  .guide h3 { font-size: 1.2rem; }
  .guide .read { margin-top: auto; color: var(--acc-text); font-size: 13.5px; font-weight: 700; }

  .pdp-grid { display: grid; grid-template-columns: minmax(0, 11fr) minmax(0, 9fr); gap: clamp(32px, 4.5vw, 64px); align-items: start; }
  .gallery { display: grid; gap: 14px; }
  .gallery .thumbs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .gallery .thumbs .scene { aspect-ratio: 4 / 3; box-shadow: none; opacity: 0.85; place-items: center; }
  .gallery .thumbs .scene svg { width: 100%; margin: 0; }
  .gallery .thumbs .scene .floor, .gallery .thumbs .scene .cap { display: none; }
  .gallery .thumbs .scene:nth-child(1) svg { transform: scale(2.1); transform-origin: 32% 28%; }
  .gallery .thumbs .scene:nth-child(2) svg { transform: scale(2.3); transform-origin: 68% 50%; }
  .gallery .thumbs .scene:nth-child(3) svg { transform: scale(2.6); transform-origin: 50% 82%; }
  .buy h1 { font-size: clamp(1.9rem, 3.6vw, 2.75rem); }
  .buy .sub { color: var(--ink-soft); margin-top: 12px; max-width: 44ch; }
  .buy .price { font-size: 30px; font-weight: 800; margin-top: 22px; font-variant-numeric: tabular-nums; }
  .buy .price small { font-size: 13px; color: var(--ink-mute); font-weight: 400; }
  .cfg { margin-top: 28px; display: grid; gap: 22px; }
  .cfg h3 { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-mute); margin-bottom: 10px; font-weight: 700; }
  .opts { display: flex; gap: 8px; flex-wrap: wrap; }
  .opt { border: 1px solid var(--line); background: transparent; color: var(--ink-soft); border-radius: var(--r-ctrl); padding: 9px 17px; font-size: 14px; display: inline-block; }
  .opt[data-on] { background: var(--acc); border-color: var(--acc); color: var(--on-acc); font-weight: 700; }
  .freightbox { margin-top: 30px; border: 1px solid var(--line); border-radius: var(--r-card); background: var(--surface); padding: 22px 24px; display: grid; gap: 11px; }
  .freightbox .row { display: flex; justify-content: space-between; gap: 16px; font-size: 14.5px; color: var(--ink-soft); }
  .freightbox .row strong { color: var(--ink); font-variant-numeric: tabular-nums; flex: none; }
  .freightbox .row strong.inc { color: var(--acc-text); }
  .freightbox .note { font-size: 12.5px; color: var(--ink-mute); border-top: 1px solid var(--line-soft); padding-top: 13px; }
  .spec { margin-top: clamp(52px, 6vw, 80px); }
  .spec h2 { font-size: 1.6rem; margin-bottom: 24px; }
  .spec-table { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 48px; }
  .spec-row { display: flex; justify-content: space-between; gap: 24px; padding: 13px 2px; border-bottom: 1px solid var(--line-soft); font-size: 14.5px; }
  .spec-row dt { color: var(--ink-mute); margin: 0; }
  .spec-row dd { margin: 0; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
  .buybar {
    position: sticky; bottom: 16px; z-index: 40; margin-top: clamp(44px, 5vw, 64px);
    background: var(--surface); border: 1px solid var(--line); border-top: 3px solid var(--acc);
    border-radius: var(--r-card);
    padding: 15px 22px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
    box-shadow: 0 -6px 40px rgba(0, 0, 0, 0.35), var(--shadow);
  }
  .spec { margin-bottom: 12px; }
  .buybar .sum { font-size: 14.5px; color: var(--ink-soft); }
  .buybar .sum strong { color: var(--ink); }
  .buybar .price { margin-left: auto; font-size: 19px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .buybar .btn { padding: 12px 24px; }

  .placeholder { min-height: 40vh; display: grid; place-items: center; text-align: center; padding: clamp(70px, 10vw, 140px) 0; }
  .placeholder h1 { font-size: clamp(1.9rem, 4vw, 3rem); }
  /* The 404's quiet errand row: under the button, wrapping, each link its
   * own 44px-tall target. */
  .placeholder-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 26px; margin-top: 26px; }
  .placeholder-links a { color: inherit; text-underline-offset: 3px; padding-block: 10px; }
  .placeholder p { color: var(--ink-soft); margin-top: 16px; }
  .placeholder .btn { margin-top: 28px; }

  footer { border-top: 1px solid var(--line-soft); background: var(--bg-alt); padding: clamp(52px, 6vw, 80px) 0 44px; }
  .foot-grid { display: grid; grid-template-columns: minmax(0, 5fr) repeat(3, minmax(0, 2.4fr)); gap: 36px; }
  .foot-grid h4 { margin: 0 0 15px; font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-mute); }
  .foot-grid ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; font-size: 14px; color: var(--ink-soft); }
  .foot-grid a { text-decoration: none; }
  .foot-grid a:hover { color: var(--ink); }
  .foot-brand .wordmark { font-size: 25px; }
  .foot-brand p { color: var(--ink-mute); font-size: 13.5px; margin-top: 15px; max-width: 34ch; }
  .foot-brand .tel { display: inline-block; margin-top: 20px; font-size: 21px; font-weight: 800; text-decoration: none; }
  .legalline { margin-top: 52px; padding-top: 22px; border-top: 1px solid var(--line-soft); font-size: 12.5px; color: var(--ink-mute); }

  @media (max-width: 1020px) {
    .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30px 0; }
    .step:nth-child(3) { border-left: 0; padding-left: 0; }
    .trust-grid, .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .prod-grid, .guide-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .foot-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 720px) {
    .hero-grid, .pdp-grid { grid-template-columns: 1fr; }
    .prod-grid, .guide-grid, .rev-grid, .spec-table, .trust-grid, .stats-grid, .steps { grid-template-columns: 1fr; }
    .step + .step { border-left: 0; padding-left: 0; border-top: 1px solid var(--line); padding-top: 22px; margin-top: 22px; }
    .shophead .wrap { display: grid; grid-template-columns: 1fr auto; gap: 4px 16px; padding-top: 14px; padding-bottom: 6px; min-height: 0; }
    .head-phone { margin-left: 0; align-items: flex-end; }
    .head-phone small { display: none; }
    .nav { grid-column: 1 / -1; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; gap: 20px; padding: 8px 0 12px; white-space: nowrap; }
    .nav::-webkit-scrollbar { display: none; }
    .hero .ctas { flex-direction: column; align-items: stretch; }
    .hero .ctas .btn { justify-content: center; }
    .buybar .sum { display: none; }
    .buybar .price { margin-left: 0; }
    .buybar .btn { margin-left: auto; }
  }
`;

/**
 * Strip the sheet down to what a browser needs.
 *
 * The stylesheet is inlined into every document's <head>, so it is both
 * render-blocking and part of the HTML payload — it is charged twice against
 * the budget in docs/SEO.md §4. These modules are heavily commented on
 * purpose (the comments carry the design rationale and the provenance for
 * transcribed values), and measured on the studio theme those comments were
 * 66 KB of a 154 KB sheet: 43% of what every visitor downloaded before
 * anything could paint, to read prose written for us.
 *
 * So comments live in the source and never reach the wire. This runs once at
 * module scope, not per request.
 *
 * Deliberately conservative. It removes comments and collapses runs of
 * whitespace to a single space; it does NOT strip the space around calc()
 * operators (where a space is significant), inside selector combinators, or
 * between the parts of a shorthand. A smaller sheet is not worth a rule that
 * silently stops applying.
 */
function minify(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{;,])\s*/g, "$1")
    .replace(/\s*}\s*/g, "}")
    .replace(/;}/g, "}")
    .trim();
}

/** Studio tokens + its section modules are appended at integration. */
export const BASE_CSS = minify(SHOP_ACCENTS + "\n" + SHEET + STUDIO_CSS);
