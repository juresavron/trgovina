/**
 * STUDIO — the FURNEXA baseline, transcribed from the owner's Framer export.
 *
 * THIS FILE IS THE SINGLE DECLARATION SITE. Section modules consume var(--…)
 * and never re-declare: three modules each declaring their own --studio-gutter
 * at equal specificity meant whichever landed last in the concatenated sheet
 * silently won for the whole storefront.
 *
 * PROVENANCE. Every value below is transcribed from the source page's own
 * stylesheet (the saved Framer export, 231 KB of CSS, 758 rules), not measured
 * off a screenshot. The earlier measured pass got six things materially wrong,
 * so the rule now is: if a value is not in this file's provenance table, it was
 * not in the source and is ours to justify. See docs/STUDIO-BASELINE.md §0.
 *
 * The source's three breakpoints are reproduced exactly rather than smoothed
 * into clamps: ≥1200px, 810–1199px, ≤809px. Framer emits hard tiers and the
 * type ramp is tuned per tier (h6 is 24/19/22 — the phone value is LARGER than
 * the tablet one), so a clamp cannot reproduce it. Tiers are literal.
 */

/**
 * THE FACES ARE SUBSTITUTED, DELIBERATELY. The source sets its display type in
 * Clash Display and its prose in Satoshi — both Fontshare (Indian Type
 * Foundry) faces, neither on Google Fonts. We do not use them, for one reason
 * that is not negotiable: every shop here sells in Slovenian, so č/š/ž appear
 * in ordinary retail words ("Košarica", "Dostava in montaža"), and nothing
 * available proves those faces carry them. The source is an English furniture
 * site, so its own rendering is no evidence. A missing glyph does not error —
 * the browser falls back per character, so one word renders in two typefaces.
 * Shipping that on a storefront's headline is worse than shipping a face that
 * is 95% as close and certainly correct.
 *
 * The replacements were chosen on measurement, not resemblance. The source
 * page carries Framer metric-override fallbacks that describe each real face
 * relative to Arial, so its true proportions are recoverable: metric/em =
 * override x size-adjust. That arithmetic reproduces DM Sans's real metrics to
 * four decimals, which is what makes the other two trustworthy:
 *
 *   Clash Display   ascent 0.890  descent 0.250  line-gap 0.090
 *   Satoshi         ascent 1.010  descent 0.240  line-gap 0.100
 *
 * Chivo (0.940 / 0.250) and Plus Jakarta Sans (1.038 / 0.222) are the closest
 * verified faces on those numbers. This matters beyond taste: the ramp below
 * is calibrated to the source (92px at 1.04 leading), so a face with a
 * different ascent puts a different amount of ink in the same line box.
 *
 * The specimen the owner picked from, with the full ranking and the method:
 * https://claude.ai/code/artifact/1640ac21-c764-4632-9298-89b0749c6006
 *
 * The faces are SELF-HOSTED. scripts/vendor-fonts.mjs downloads the latin and
 * latin-ext subsets into public/fonts and generates ./fonts.ts, so there is no
 * third-party origin on the critical path at all. Switching faces means
 * re-running that script and editing the --f-* stacks below;
 * scripts/verify-fonts.mjs re-checks glyph coverage and must pass first.
 */
export const STUDIO_TOKENS = `
  :root[data-theme="studio"] {
    /* ---- Ground -----------------------------------------------------------
     * The source's palette is 11 design tokens plus one hardcoded body ink.
     * Sampling a screenshot had produced #f2f2f2 AND #efefef as two separate
     * greys; the source has exactly one panel grey, #f0f0f0. */
    --bg: #ffffff;
    --surface: #ffffff;
    /** The one panel grey. Product panels, quiet tiles, inset blocks. */
    --bg-alt: #f0f0f0;
    /** Mid grey — the rung a cropped product bleeds over. */
    --tile-mid: #a4a4a4;

    /** Primary ink and the dark band's ground are the SAME token in the
     *  source (#151515). Measurement had split them into #0a0a0a and #0d0d0d. */
    --ink: #151515;
    /** Body copy is a hair lighter than headings, and is the one colour the
     *  source hardcodes rather than tokenising. */
    --ink-body: #212121;
    --ink-invert: #151515;
    /** Second dark rung — dark-on-dark separation. */
    --ink-invert-2: #2e2e2e;
    --black: #000000;

    /* ---- Where we deviate from the source, and why -----------------------
     * The source is an English furniture site and its muted rungs do not meet
     * WCAG 2.1 AA as TEXT: #15151552 is 2.08:1 on white and #ffffff52 is
     * 2.91:1 on the dark band, against a 4.5:1 floor. These shops sell to
     * Slovenian consumers, so the European Accessibility Act (2019/882,
     * in force for e-commerce since 28 June 2025) makes AA a legal floor,
     * not a preference.
     *
     * So the palette splits by JOB rather than by name. Decorative rungs keep
     * the source value exactly; anything carrying text gets a compliant rung
     * chosen from the source's own token set where one exists — the on-dark
     * muted ink is #a4a4a4, which IS a source token (7.33:1), not an invention.
     * Ratios below are computed, not estimated; scripts/verify-contrast.mjs
     * re-checks them and fails the build on regression. */

    /** Muted ink for TEXT. The lightest rung that clears 4.5:1 on BOTH grounds
     *  it appears on — 5.17:1 on white, 4.54:1 on the panel grey — so it keeps
     *  the source's quiet feel without failing on the darker of the two. */
    --ink-mute: #6d6d6d;
    /** The source's muted alpha. DECORATION ONLY — never text. */
    --ink-mute-decor: #15151552;

    --on-invert: #ffffff;
    /** Muted ink on the dark band, for TEXT. #a4a4a4 = 7.33:1 on #151515. */
    --on-invert-mute: #a4a4a4;
    /** White alphas: the source's on-dark border and divider vocabulary.
     *  These are 1.2–2.9:1 — dividers and decorative hairlines only, never
     *  text and never the sole boundary of a control. */
    --on-invert-64: #ffffff52;
    --on-invert-40: #ffffff3d;
    --on-invert-24: #ffffff1f;
    --on-invert-16: #ffffff14;

    /** Hairline between surfaces. 1.33:1 — decorative, per WCAG 1.4.11 which
     *  exempts pure decoration. */
    --line: #dfdfdf;
    /** The boundary of an INTERACTIVE control, which 1.4.11 holds to 3:1.
     *  The source outlines buttons with 2px #151515 (18.3:1) and that is what
     *  --line-strong is for; --line-ctrl is the quieter rung for inputs, where
     *  the source's #dfdfdf would fail. */
    --line-ctrl: #949494;
    --line-strong: #151515;

    /* ---- Accent ---------------------------------------------------------
     * The source's accent is amber #f0aa13 with a cream #ffdfc4 companion and
     * a coral #ff8787. Our network needs each shop to differentiate, so --acc
     * stays driven by the per-shop hue set in css.ts; the source literals are
     * kept because the theme uses them as fixed punctuation (badges, the sale
     * flag) where a per-shop hue would read as a bug rather than a brand. */
    --acc: oklch(0.62 var(--c) var(--hue));
    --acc-text: oklch(0.45 var(--c) var(--hue));
    --on-acc: #ffffff;
    --wash: oklch(0.62 var(--c) var(--hue) / 0.1);
    --amber: #f0aa13;
    --cream: #ffdfc4;
    --coral: #ff8787;

    /* ---- Edges -----------------------------------------------------------
     * Read from the DOM's inline styles, not the stylesheet: Framer emits most
     * radii as style attributes, so a sheet-only reading finds almost none and
     * concludes the theme is square. It is not. Counted across the page:
     * 8px ×33 (images and cards), 4px ×40 (buttons), 99/999/100px ×48 (pills
     * and circles), 40px ×6 (large feature blocks).
     *
     * Radius is therefore SMALL AND ROLE-SPECIFIC — the tightest curve on the
     * page belongs to the button, and the card is only slightly softer. Both
     * earlier readings were wrong in opposite directions: 12px cards with 0px
     * "sharp" buttons first, then 0px cards with 99px pill buttons. */
    --r-card: 8px;
    --r-media: 8px;
    --r-ctrl: 4px;
    --r-tag: 50px;
    --r-pill: 99px;
    --r-lg: 40px;
    --r-circle: 100%;
    /** The 64px circular arrow button carries a 2px dark ring; the pill tags
     *  and panel hairlines are 1px. */
    --bw-ctrl: 2px;
    --bw-line: 1px;
    /** The circular carousel/nav button — 64px square, 2px ring, no fill. */
    --ctrl-circle-size: 64px;
    /** Primary button padding, and the compact variant beside it. */
    --ctrl-pad: 15px 39px;
    --ctrl-pad-sm: 10px 25px;
    /** Glass badge over photography: the source's one backdrop-filter, used
     *  11 times — 8% white fill, 32% white hairline, 6px blur, 100px radius. */
    --glass-bg: #ffffff14;
    --glass-line: #ffffff52;
    --glass-blur: 6px;

    /* ---- Rhythm (desktop tier, ≥1200px) ---------------------------------- */
    --studio-gutter: 40px;
    --studio-rhythm: 170px;
    /** Chrome is padding-driven in the source: 16px above and below a single
     *  24px label line, giving 56px. --chrome-h is derived from those two so
     *  the hero's viewport math cannot drift away from the bar's real height.
     *  (The 24px/40px bar is a different device — the band pinned to the
     *  bottom of the hero — not the header.) */
    --chrome-pad-y: 16px;
    --chrome-line: 24px;
    --chrome-h: calc(var(--chrome-line) + 2 * var(--chrome-pad-y));
    /** Nav: 50px between top-level items, 8px between an item's icon and
     *  its label. */
    --chrome-nav-gap: 50px;
    --chrome-item-gap: 8px;
    --studio-container: 1440px;
    /** Text measures the source uses inside that container. */
    --studio-read: 863px;
    --studio-read-narrow: 620px;
    --studio-card-gap: 24px;
    --studio-col-gap: 40px;

    /* Spacing scale, taken from the source's own frequency distribution rather
     * than invented as a geometric ramp. Counting every desktop gap and
     * padding in the sheet: 10px dominates by a wide margin (53 uses — it is
     * the theme's default "things are related" gap), then 24 (14), 40 (11),
     * 8 (7), 16 (6), 12 (6), 32 (6), 20 (5), 64 (3), with 80/100/170 for
     * band-scale separation.
     *
     * Note 10px, not 8px, as the micro rung. A generic 8-point scale would be
     * wrong here in the one place it shows most — the small gaps inside cards,
     * nav items and price rows, which is nearly every component. */
    --gap-xs: 8px;
    --gap-sm: 10px;
    --gap-md: 16px;
    --gap-lg: 24px;
    --gap-xl: 40px;
    --gap-2xl: 64px;
    --gap-3xl: 80px;

    /* ---- Type ------------------------------------------------------------ */
    /* Chivo stands in for Clash Display, Plus Jakarta Sans for Satoshi — see
     * the header. Fallbacks are latin-ext-capable too, so a failed webfont
     * still renders šumniki rather than tofu. */
    --f-display: "Chivo", "Archivo", "Helvetica Neue", sans-serif;
    --f-body: "Plus Jakarta Sans", "DM Sans", system-ui, sans-serif;
    --f-label: "DM Sans", system-ui, sans-serif;
    --w-display: 500;
    --w-body: 400;
    --w-body-med: 500;
    --w-label: 500;

    /* Display ramp — Clash Display, weight 500. */
    --t-h1: 92px;   --lh-h1: 1.04em;    --ls-h1: 0em;
    --t-h2: 60px;   --lh-h2: 1.13em;    --ls-h2: 0em;
    --t-h3: 48px;   --lh-h3: 1.16em;    --ls-h3: 0em;
    --t-h4: 42px;   --lh-h4: 1.19em;    --ls-h4: 0.02em;
    --t-h5: 32px;   --lh-h5: 1.1875em;  --ls-h5: 0.02em;
    --t-h6: 24px;   --lh-h6: 1.33em;    --ls-h6: 0em;

    /* Prose ramp — Satoshi. --t-lead-xl is the big pull-quote rung. */
    --t-lead-xl: 48px;  --lh-lead-xl: 1.3em;
    --t-lead: 20px;     --lh-lead: 1.5em;
    --t-body: 16px;     --lh-body: 1.625em;
    --ls-body: 0.02em;

    /* Label — DM Sans, uppercase, the widest tracking on the page. */
    --t-label: 14px;
    --lh-label: 1.71em;
    --lh-label-tight: 1.428em;
    --ls-label: 0.06em;

    --shadow: 0 24px 60px rgba(21, 21, 21, 0.12);
  }

  /* ---- Tablet tier: 810–1199px ------------------------------------------ */
  @media (max-width: 1199px) {
    :root[data-theme="studio"] {
      --studio-gutter: 25px;
      --studio-rhythm: 100px;
      --chrome-pad-y: 8px;
      --t-h1: 64px;
      --t-h2: 50px;  --lh-h2: 1.1em;
      --t-h3: 38px;
      --t-h4: 42px;
      --t-h5: 26px;
      --t-h6: 19px;
      --t-lead-xl: 44px;
      --t-lead: 16px;
    }
  }

  /* ---- Phone tier: ≤809px ------------------------------------------------
   * Two ramp entries go UP from the tablet tier rather than down (h6 19→22,
   * lead 16→18). That is in the source, not a transcription slip: the phone
   * layout drops to one column, so those roles carry more weight there. */
  @media (max-width: 809px) {
    :root[data-theme="studio"] {
      --studio-gutter: 25px;
      --studio-rhythm: 70px;
      --t-h1: 44px;
      --t-h2: 38px;  --lh-h2: 1.13em;
      --t-h3: 32px;
      --t-h4: 28px;
      --t-h5: 24px;
      --t-h6: 22px;
      --t-lead-xl: 24px;
      --t-lead: 18px;
    }
  }
`;
