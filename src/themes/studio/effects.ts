/**
 * STUDIO motion layer — the source theme's effects, rebuilt in CSS.
 *
 * The original is a Framer site: its motion runs on a React animation runtime
 * that ships hundreds of kilobytes and blocks first paint. We reproduce the
 * *behaviour* with CSS only, because the storefront's LCP budget (docs/SEO.md
 * §4) is the reason it outranks the incumbents in the first place. Everything
 * here costs zero JavaScript.
 *
 * Effects reproduced:
 *  1. scroll-reveal on section entry            → animation-timeline: view()
 *  2. marquee ticker, seamless loop             → keyframe translate on a doubled track
 *  3. counter-scrolling wordmark band           → same, opposite direction
 *  4. product lift + shadow bloom on hover      → transform/box-shadow transition
 *  5. media zoom inside a fixed frame           → scale on an overflow-clipped child
 *  6. card frame darkening to black on hover    → border-color transition
 *  7. arrow nudge on hover                      → translate on the glyph
 *  8. underline wipe on text links              → background-size transition
 *  9. sticky chrome shrink past the hero        → animation-timeline: scroll()
 * 10. hero panel stagger on load                → delayed entry animation
 *
 * Scroll-driven animation (`animation-timeline`) is progressively enhanced:
 * where it is unsupported the element simply renders in its final state,
 * because every reveal is written as "animate FROM hidden" with the resting
 * style being visible. A browser that ignores the timeline shows the content —
 * never a blank page. That ordering is deliberate and must not be inverted.
 *
 * Under `prefers-reduced-motion: reduce` every effect resolves to its end
 * state: the marquee stops mid-band rather than freezing mid-translate (the
 * text stays readable), and reveals are simply absent.
 */
export const STUDIO_EFFECTS_CSS = `
  /* ---- 1. Scroll reveal --------------------------------------------------
     Resting state is VISIBLE; the animation runs backwards from hidden as the
     element enters the viewport. Unsupported browsers get the resting state. */
  @supports (animation-timeline: view()) {
    :root[data-theme="studio"] .st-reveal {
      animation: st-rise linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 55%;
    }
    :root[data-theme="studio"] .st-reveal-slow {
      animation: st-rise linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 80%;
    }
  }
  @keyframes st-rise {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: none; }
  }

  /* ---- 2/3. Marquee ------------------------------------------------------
     The track is rendered twice; translating exactly -50% lands the clone
     where the original began, so the loop has no seam. */
  :root[data-theme="studio"] .st-mq { overflow: hidden; }
  :root[data-theme="studio"] .st-mq-track {
    display: flex;
    width: max-content;
    animation: st-marquee 38s linear infinite;
  }
  :root[data-theme="studio"] .st-mq-track--reverse { animation-direction: reverse; }
  :root[data-theme="studio"] .st-mq:hover .st-mq-track { animation-play-state: paused; }
  @keyframes st-marquee {
    from { transform: translate3d(0, 0, 0); }
    to   { transform: translate3d(-50%, 0, 0); }
  }

  /* ---- 4. Product lift --------------------------------------------------- */
  :root[data-theme="studio"] .st-lift {
    transition: transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
                box-shadow 0.45s cubic-bezier(0.22, 0.61, 0.36, 1),
                border-color 0.3s ease;
  }
  :root[data-theme="studio"] .st-lift:hover { transform: translateY(-6px); box-shadow: var(--shadow); }

  /* ---- 5. Media zoom ----------------------------------------------------- */
  :root[data-theme="studio"] .st-zoom { overflow: hidden; }
  :root[data-theme="studio"] .st-zoom > * {
    transition: transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1);
    will-change: transform;
  }
  :root[data-theme="studio"] .st-zoom:hover > * { transform: scale(1.045); }

  /* ---- 6. Frame darkens to black — the source's card signature ----------- */
  :root[data-theme="studio"] .st-frame { transition: border-color 0.3s ease; }
  :root[data-theme="studio"] .st-frame:hover,
  :root[data-theme="studio"] .st-frame:focus-within { border-color: var(--line-strong); }

  /* ---- 7. Arrow nudge ---------------------------------------------------- */
  :root[data-theme="studio"] .st-arrow-svg { transition: transform 0.3s ease; }
  :root[data-theme="studio"] .st-arrow:hover .st-arrow-svg,
  :root[data-theme="studio"] .st-arrow:focus-visible .st-arrow-svg { transform: translateX(3px); }
  :root[data-theme="studio"] .st-arrow--prev:hover .st-arrow-svg,
  :root[data-theme="studio"] .st-arrow--prev:focus-visible .st-arrow-svg { transform: translateX(-3px); }

  /* ---- 8. Underline wipe ------------------------------------------------- */
  :root[data-theme="studio"] .st-wipe {
    background-image: linear-gradient(currentColor, currentColor);
    background-repeat: no-repeat;
    background-position: 0 100%;
    background-size: 0% 1px;
    transition: background-size 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
    padding-bottom: 2px;
  }
  :root[data-theme="studio"] .st-wipe:hover,
  :root[data-theme="studio"] .st-wipe:focus-visible { background-size: 100% 1px; }

  /* ---- 9. Chrome shrink past the hero ------------------------------------ */
  @supports (animation-timeline: scroll()) {
    :root[data-theme="studio"] .st-chrome {
      animation: st-shrink linear both;
      animation-timeline: scroll();
      animation-range: 0 220px;
    }
  }
  @keyframes st-shrink {
    from { height: var(--chrome-h); }
    to   { height: calc(var(--chrome-h) * 0.72); }
  }

  /* ---- 10. Hero stagger on load ------------------------------------------ */
  :root[data-theme="studio"] .st-enter > * {
    animation: st-rise 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) both;
  }
  :root[data-theme="studio"] .st-enter > *:nth-child(1) { animation-delay: 0.05s; }
  :root[data-theme="studio"] .st-enter > *:nth-child(2) { animation-delay: 0.13s; }
  :root[data-theme="studio"] .st-enter > *:nth-child(3) { animation-delay: 0.21s; }
  :root[data-theme="studio"] .st-enter > *:nth-child(4) { animation-delay: 0.29s; }

  /* ---- Reduced motion: every effect resolves to its END state ------------- */
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-reveal,
    :root[data-theme="studio"] .st-reveal-slow,
    :root[data-theme="studio"] .st-enter > *,
    :root[data-theme="studio"] .st-chrome {
      animation: none;
      opacity: 1;
      transform: none;
    }
    /* Stop the ticker where it stands and let it sit flush, rather than
       freezing it mid-translate with half a word cut off. */
    :root[data-theme="studio"] .st-mq-track {
      animation: none;
      transform: none;
      width: 100%;
      flex-wrap: wrap;
    }
    :root[data-theme="studio"] .st-mq-track--clone { display: none; }
    :root[data-theme="studio"] .st-lift,
    :root[data-theme="studio"] .st-zoom > *,
    :root[data-theme="studio"] .st-arrow-svg,
    :root[data-theme="studio"] .st-wipe { transition: none; }
  }
`;
