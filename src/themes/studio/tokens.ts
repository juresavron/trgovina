/**
 * STUDIO — the FURNEXA baseline, ported from the owner's Framer theme.
 *
 * This is the network's flagship theme: black chrome over a white page,
 * Bricolage Grotesque statements at poster scale, DM Sans for everything
 * else, near-monochrome with the shop accent used only as punctuation.
 * Both faces are variable and ship latin-ext, so č/š/ž render correctly.
 *
 * THIS FILE IS THE SINGLE DECLARATION SITE. Section modules consume
 * var(--…) and never re-declare: three modules each declaring their own
 * --studio-gutter at equal specificity meant whichever landed last in the
 * concatenated sheet silently won for the whole storefront. Values here are
 * measured (docs/STUDIO-BASELINE.md) at a 2000px viewport and expressed as
 * clamps whose maximum is the measurement.
 */

export const STUDIO_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=DM+Sans:opsz,wght@9..40,100..1000&display=swap";

export const STUDIO_TOKENS = `
  :root[data-theme="studio"] {
    /* ---- Ground (§2, sampled) ------------------------------------------- */
    --bg: #ffffff;
    /** Product image panel — the panel a cutout sits on inside a card. */
    --bg-alt: #f2f2f2;
    /** Impact-grid quiet tile: a distinct rung, used beside --bg-alt. */
    --bg-quiet: #efefef;
    /** Impact-grid hero tile — the mid grey a cropped product bleeds over. */
    --tile-mid: #a8a8a8;
    --surface: #ffffff;
    --surface2: #fafafa;
    --ink-invert: #0d0d0d;
    /** Dark-band watermark ink. The arrow-stadium's faintness depends on
     *  this exact rung sitting one step off --ink-invert. */
    --ink-invert-2: #161616;
    --line: #e4e4e4;
    /** The frame a card draws on hover — the source's card signature. */
    --line-strong: #111111;
    --line-soft: #ededed;
    --ink: #0a0a0a;
    --ink-soft: #4a4a4a;
    --ink-mute: #767676;
    --on-invert: #f7f7f7;
    --on-invert-mute: #a8a8a8;
    /** Hero sub on black: --on-invert-mute is too dark for this rung. */
    --on-invert-soft: #d6d6d6;
    /** Hero triptych photo grounds (§4.2). */
    --photo-cool: #d9d9d9;
    --photo-warm: #e8e0d6;

    /* ---- Accent = punctuation only. Never a surface, never body text. --- */
    --acc: oklch(0.62 var(--c) var(--hue));
    --acc-text: oklch(0.45 var(--c) var(--hue));
    --on-acc: #ffffff;
    --wash: oklch(0.62 var(--c) var(--hue) / 0.1);
    --wash-strong: oklch(0.62 var(--c) var(--hue) / 0.2);

    /* ---- Edges (§3) -----------------------------------------------------
     * Buttons are SHARP and pills are ROUND. That contrast is the theme's
     * signature and the single easiest thing to get wrong — --r-ctrl is 0,
     * not "nearly 0". */
    --r-card: 12px;
    --r-ctrl: 0px;
    --r-media: 12px;
    --r-scene: 12px;
    /** The one 24px radius: §4.13's black philosophy card. */
    --r-feature: 24px;
    --r-pill: 999px;

    /* ---- Rhythm (§3) ----------------------------------------------------- */
    --studio-gutter: clamp(18px, 2.7vw, 54px);
    /** §4.1 measures the chrome's icon cluster at x=-48, not the gutter. */
    --studio-inset-r: clamp(14px, 2.4vw, 48px);
    --studio-rhythm: clamp(56px, 6.5vw, 130px);
    --studio-rhythm-dark: clamp(64px, 7.5vw, 150px);
    --studio-card-gap: clamp(16px, 1.8vw, 36px);
    /** Band content measure; the gutter sits OUTSIDE it (see §3). */
    --studio-band: 1900px;
    --studio-measure: 1560px;
    --studio-read: 930px;

    /* ---- Type ------------------------------------------------------------ */
    --f-display: "Bricolage Grotesque", "Archivo", "Helvetica Neue", sans-serif;
    --f-body: "DM Sans", system-ui, sans-serif;
    --stretch: 100%;
    --w-display: 600;
    --track-display: -0.022em;
    /** §4.12: the footer wordmark is measurably lighter than the bar's. */
    --w-mark: 600;
    --w-mark-foot: 400;

    --shadow: 0 24px 60px rgba(10, 10, 10, 0.12);
    /** Chrome height, responsive — the hero's viewport math subtracts this,
     *  so a flat value left a gap at every width below ~1955px. */
    --chrome-h: clamp(58px, 4.5vw, 90px);
  }
`;
