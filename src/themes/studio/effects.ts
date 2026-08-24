/**
 * STUDIO motion layer — the source theme's effects, rebuilt in CSS.
 *
 * WHAT THE SOURCE ACTUALLY DOES. Transcribing its stylesheet settles a
 * question worth recording: the source has essentially no CSS motion. Its
 * 231 KB sheet holds two @keyframes (both Framer internals — an input caret
 * blink and an unused "pulse") and exactly one transition, `color .15s`.
 * Every visible effect is JavaScript: Framer emits `.hover` variant classes
 * and its React runtime animates between them, with `will-change: transform`
 * hints as the tell.
 *
 * So this module is a REIMPLEMENTATION, not a transcription, and deliberately
 * so — that runtime is hundreds of kilobytes that block first paint, and the
 * storefront's LCP budget (docs/SEO.md §4) is the reason these shops can
 * outrank the incumbents at all. We copy the behaviour and pay none of the
 * cost. Everything here is zero JavaScript.
 *
 * The seven hover variants the source does declare are the ground truth for
 * which effects are real: a nav underline growing to width:100%, the primary
 * button's label stack sliding to flex-end, and an arrow shifting inside its
 * frame. Those are reproduced below (8, 9, 7). The rest are ours, and are
 * marked as such.
 *
 * Effects:
 *  1. scroll-reveal on section entry            → animation-timeline: view()   [ours]
 *  2. marquee ticker, seamless loop             → translate on a doubled track [source]
 *  3. counter-scrolling wordmark band           → same, opposite direction     [source]
 *  4. product lift + shadow bloom on hover      → transform/box-shadow         [ours]
 *  5. media zoom inside a fixed frame           → scale on a clipped child     [ours]
 *  6. card frame darkening on hover             → border-color transition      [ours]
 *  7. arrow nudge on hover                      → translate on the glyph       [source]
 *  8. underline wipe on text links              → background-size transition   [source]
 *  9. button label roll on hover                → translate on a doubled stack [source]
 * 10. hero panel stagger on load                → delayed entry animation      [ours]
 *
 * A previous revision had a scroll-driven chrome shrink here. It was removed:
 * the source's header is `position: relative`, ours is not sticky either, so
 * it animated the height of a bar already scrolling out of view — and
 * animating `height` triggers layout on every frame, which risks CLS on the
 * one metric this project is built around.
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
  :root[data-theme="studio"] .st-mq:hover .st-mq-track,
  :root[data-theme="studio"] .st-mq:focus-within .st-mq-track { animation-play-state: paused; }

  /* WCAG 2.2.2 (Pause, Stop, Hide, Level A): motion that starts automatically,
     runs over 5s and sits alongside other content needs a real mechanism to
     stop it. Hover is not one — it excludes keyboard and touch. This is a
     checkbox: an actual focusable control, operable by keyboard, costing no
     JavaScript. The label swaps its text via ::after so one control reads
     correctly in both states. */
  :root[data-theme="studio"] .st-mq-pause { position: absolute; opacity: 0; pointer-events: none; }
  :root[data-theme="studio"] .st-mq-toggle {
    flex: none;
    /* The label rung, like every other chip in the theme. It was running at
       10–11px with 0.12em — double the source's widest tracking, and below
       the ramp's floor. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
    /* --line-ctrl, not --ink-mute: this border IS the control's boundary, so
       WCAG 1.4.11 wants 3:1 and --line-ctrl is the rung chosen for exactly
       that. --ink-mute clears it too, but says "text" rather than "edge". */
    border: 1px solid var(--line-ctrl);
    border-radius: var(--r-pill);
    padding: 5px 14px;
    cursor: pointer;
    white-space: nowrap;
    transition: color 0.2s ease, border-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-mq-toggle:hover { color: var(--ink); border-color: var(--ink); }
  :root[data-theme="studio"] .st-mq-pause:focus-visible + .st-mq-toggle {
    outline: 2px solid var(--ink);
    outline-offset: 3px;
  }
  :root[data-theme="studio"] .st-mq-toggle::after { content: "Ustavi"; }
  :root[data-theme="studio"] .st-mq-pause:checked + .st-mq-toggle::after { content: "Zaženi"; }
  :root[data-theme="studio"] .st-mq-pause:checked ~ .st-mq-viewport .st-mq-track {
    animation-play-state: paused;
  }
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

  /* ---- 9. Button label roll ----------------------------------------------
     The source's primary button holds two identical label rows in a clipped
     box; on hover the stack slides up so the second row replaces the first.
     In the source this is a Framer variant (.hover moves the stack from
     top to flex-end) driven by JS. Here it is a transform on a doubled
     stack, which needs no script and stays on the compositor.

     The button must set overflow:hidden and the stack must hold exactly two
     rows of equal height for -50% to land the second row where the first
     began. */
  :root[data-theme="studio"] .st-roll { overflow: hidden; position: relative; }
  :root[data-theme="studio"] .st-roll-stack {
    display: grid;
    transition: transform 0.42s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  :root[data-theme="studio"] .st-roll:hover .st-roll-stack,
  :root[data-theme="studio"] .st-roll:focus-visible .st-roll-stack {
    transform: translateY(-50%);
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
    :root[data-theme="studio"] .st-enter > * {
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
    :root[data-theme="studio"] .st-mq-clone { display: none; }
    :root[data-theme="studio"] .st-lift,
    :root[data-theme="studio"] .st-zoom > *,
    :root[data-theme="studio"] .st-arrow-svg,
    :root[data-theme="studio"] .st-roll-stack,
    :root[data-theme="studio"] .st-wipe { transition: none; }
    /* The roll's second row must never be the one left showing. */
    :root[data-theme="studio"] .st-roll:hover .st-roll-stack,
    :root[data-theme="studio"] .st-roll:focus-visible .st-roll-stack { transform: none; }
  }
`;
