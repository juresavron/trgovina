/**
 * STUDIO — the FURNEXA baseline, ported from the owner's Framer theme.
 *
 * This is the network's flagship theme: black chrome over a white page,
 * Bricolage Grotesque statements at poster scale, DM Sans for everything
 * else, near-monochrome with the shop accent used only as punctuation.
 * Both faces are variable and ship latin-ext, so č/š/ž render correctly.
 *
 * Token discipline (docs/THEMES.md): every color, radius and rhythm value
 * lives here; section modules consume var(--…) only and never hardcode a
 * hex. The shop still contributes --hue/--c, so four shops wear the same
 * baseline without looking like one company.
 */

export const STUDIO_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=DM+Sans:opsz,wght@9..40,100..1000&display=swap";

export const STUDIO_TOKENS = `
  :root[data-theme="studio"] {
    /* Ground: pure white page, near-black chrome and inverted bands. */
    --bg: #ffffff;
    --bg-alt: #f4f4f4;          /* product image panels, quiet bands */
    --surface: #ffffff;
    --surface2: #fafafa;
    --ink-invert: #0d0d0d;      /* chrome bar, dark sections, footer */
    --ink-invert-2: #171717;
    --line: #e4e4e4;
    --line-strong: #111111;     /* the hairline that frames a card */
    --line-soft: #ededed;
    --ink: #0a0a0a;
    --ink-soft: #4a4a4a;
    --ink-mute: #767676;
    --on-invert: #f7f7f7;
    --on-invert-mute: #a8a8a8;

    /* Accent = punctuation only. Never a surface, never body text. */
    --acc: oklch(0.62 var(--c) var(--hue));
    --acc-text: oklch(0.45 var(--c) var(--hue));
    --on-acc: #ffffff;
    --wash: oklch(0.62 var(--c) var(--hue) / 0.1);
    --wash-strong: oklch(0.62 var(--c) var(--hue) / 0.2);

    /* Edges: soft on media, sharp on the frames that read as drawn. */
    --r-card: 8px;
    --r-ctrl: 2px;
    --r-scene: 8px;
    --r-pill: 999px;
    --r-media: 12px;

    /* Type */
    --f-display: "Bricolage Grotesque", "Archivo", "Helvetica Neue", sans-serif;
    --f-body: "DM Sans", system-ui, sans-serif;
    --stretch: 100%;
    --w-display: 600;
    --track-display: -0.022em;

    --shadow: 0 24px 60px rgba(10, 10, 10, 0.12);
    --chrome-h: 88px;
  }
`;
