/**
 * STUDIO — statement/story and the inline-icon statement + stats
 * (docs/STUDIO-BASELINE.md §4.3 and §4.8).
 *
 *   §4.3 Statement + story — left-aligned 3-line statement at the page gutter,
 *        90px gap, a small tracked "NAŠA ZGODBA →" label link, then a
 *        two-column band: the standfirst copy left (max-width 600), photo right
 *        carrying a right-aligned uppercase label above it.
 *   §4.8 Inline-icon statement + stats — the theme's SIGNATURE device: a
 *        centred outlined pill, a centred pull-quote paragraph with circular
 *        OUTLINED Ø62px icon glyphs set INLINE in the text flow and vertically
 *        centred on the line, then the stat row (display numerals with the
 *        trailing +/% as a real <sup>, a label caption, max-width 280, centred).
 *
 * Type roles (docs/STUDIO-BASELINE.md §1). Every size, weight, tracking and
 * leading below comes from the transcribed ramp in tokens.ts, which already
 * resolves per breakpoint (≥1200 / 810–1199 / ≤809) — nothing here is a px or
 * a clamp. The statement is h2 (display face, the section's dominant type), the
 * story copy lead, the claim lead-xl (the ramp's prose pull-quote rung), the
 * stat values h2 numerals, and every chip, link, figure label and caption the
 * label role. The earlier pass measured this section at a 2000px viewport and
 * wrote each px as clamp(min, measured/20 vw, measured); those figures were
 * eyeballed and are gone. Only the measured max-WIDTHS keep that treatment —
 * min(100%, max(floor, k vw)) holds the 1350/600/1750/280 proportions at any
 * width above a phone, and the floor stops a 390px viewport from collapsing a
 * column to a word.
 *
 * Accent budget (§5.4): the shop hue is spent in exactly three places on the
 * whole storefront. This module owns ONE of them — the second half of the
 * stats claim (.st-claim-acc). Nothing else here is accented, focus rings
 * included; they follow chrome.ts and use --ink / --on-invert.
 *
 * Token discipline (docs/THEMES.md): colors, radii and faces are var(--…)
 * only; the four values the baseline measures that tokens.ts does not carry
 * are declared below as documented --studio-* variables. Every selector is
 * scoped :root[data-theme="studio"] — zarja/lednik/salon share this sheet.
 */

import { esc, type RenderCtx } from "../../render/sections";
import { statValue } from "./stat";

/* ---- inline glyphs (§4.8) --------------------------------------------
 * 24px grid, stroke-only, currentColor — the circle is drawn by the host
 * span's border, so the SVG carries the line-art alone and the ring stays a
 * perfect pill at every clamp step. Four wellness glyphs: cabin (savna),
 * droplet (voda/kad), thermometer (temperatura), waves (bazen). */
type GlyphKey = "cabin" | "drop" | "temp" | "waves";

const GLYPH_PATHS: Record<GlyphKey, string> = {
  cabin:
    '<path d="M3.6 10.2 12 4.4l8.4 5.8"/>' +
    '<path d="M5.8 11v8.6h12.4V11"/>' +
    '<path d="M8.4 13.8h7.2M8.4 16.6h7.2"/>',
  drop: '<path d="M12 3.8c3.4 4 5.3 6.6 5.3 9.1a5.3 5.3 0 0 1-10.6 0c0-2.5 1.9-5.1 5.3-9.1Z"/>',
  temp:
    '<path d="M10 13.7V6.3a2 2 0 0 1 4 0v7.4a4 4 0 1 1-4 0Z"/>' +
    '<path d="M12 9.2v5.6"/>',
  waves:
    '<path d="M3.6 9.4c1.7-1.9 3.4-1.9 5.1 0s3.4 1.9 5.1 0 3.4-1.9 5.1 0"/>' +
    '<path d="M3.6 15c1.7-1.9 3.4-1.9 5.1 0s3.4 1.9 5.1 0 3.4-1.9 5.1 0"/>',
};

/** One inline glyph: decorative punctuation inside a sentence, so aria-hidden. */
function glyph(k: GlyphKey): string {
  return (
    '<span class="st-claim-ico" aria-hidden="true">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" focusable="false">' +
    GLYPH_PATHS[k] +
    "</svg></span>"
  );
}

export const STUDIO_STATEMENT_CSS = `
  /* ---- Values this module owns that tokens.ts does not carry ---- */
  :root[data-theme="studio"] {
    /* Consumes the theme's gutter rather than restating it. The fallback is
     * only for the case where this module is used outside the theme sheet. */
    --studio-statement-gutter: var(--studio-gutter, 40px);
    /* §4.8: the Ø62px inline glyph. One variable because the ring, the SVG
     * inside it and the inline margins all derive from this diameter. This is
     * a drawn disc, not type — it carries no glyph of its own — so it keeps a
     * clamp rather than taking a rung off the ramp. */
    --studio-glyph: clamp(26px, 3.1vw, 62px);
    /* §4.8/§4.3: the drawn hairline of an OUTLINED control on a white ground.
     * --line disappears at 1px against the claim's lead-xl line; --line-strong
     * is the hover frame and reads as a filled edge. This is the rung between:
     * ~#b8b8b8 over white, the outline measured on the pill and the glyphs. */
    --studio-ring: color-mix(in srgb, var(--ink) 28%, transparent);
  }

  /* ================= §4.3 Statement + story ================= */
  :root[data-theme="studio"] .st-statement {
    background: var(--bg);
    padding-block: var(--studio-rhythm);
    /* Belt-and-braces against a long unbroken head term: the page must never
     * scroll sideways (§6). */
    overflow: clip;
  }
  /* 1560px is the baseline's text-led content width (§3). */
  :root[data-theme="studio"] .st-statement-in {
    max-width: 1560px;
    margin-inline: auto;
    padding-inline: var(--studio-statement-gutter);
  }

  /* The section's dominant type and a real <h2>, set in the display face, so
   * it takes the h2 rung whole (§1, §4.3). max-width ~1350 at 2000px. */
  :root[data-theme="studio"] .st-statement-h {
    margin: 0;
    max-width: min(100%, max(28rem, 67.5vw));
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--ink);
    text-wrap: balance;
    overflow-wrap: break-word;
    hyphens: none;
  }

  /* Measured 90px gap, statement → link. The link is a tracked uppercase
   * button label, so it is the label role; one line of it, hence the ramp's
   * tight label leading rather than the 1.71em reading rung. */
  :root[data-theme="studio"] .st-statement-link {
    display: inline-flex;
    align-items: center;
    gap: clamp(8px, 0.7vw, 14px);
    margin-top: clamp(28px, 4.5vw, 90px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    text-decoration: none;
    color: var(--ink);
    /* Underline lives on the text, drawn on hover/focus — the resting state in
     * the baseline is a bare tracked label. */
    border-bottom: 1px solid transparent;
    padding-bottom: 4px;
    transition: border-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-statement-link:hover { border-bottom-color: var(--ink); }
  :root[data-theme="studio"] .st-statement-link:focus-visible {
    outline: 2px solid var(--ink);
    outline-offset: 4px;
    border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-statement-arrow {
    transition: transform 0.2s ease;
  }
  :root[data-theme="studio"] .st-statement-link:hover .st-statement-arrow {
    transform: translateX(4px);
  }

  /* Two-column band: body copy left, photo right. 1.05fr : 1fr keeps the
   * 600px measure on the left at 2000px without starving the frame. */
  :root[data-theme="studio"] .st-story {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    align-items: start;
    gap: clamp(32px, 4.4vw, 88px);
    margin-top: clamp(40px, 5.5vw, 110px);
  }
  /* The band's standfirst — it carries the shop's own sub line, not running
   * body copy — so it takes the lead rung (§1, §4.3). max-width 600 at 2000px.
   * --ink-body on white is 9.0:1. */
  :root[data-theme="studio"] .st-story-copy {
    margin: 0;
    max-width: min(100%, max(20rem, 30vw));
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--ink-body);
  }

  :root[data-theme="studio"] .st-story-fig { margin: 0; }
  /* The label sits ABOVE the frame and is right-aligned — the measured detail
   * that keeps this band from reading as a plain text/image split. A figure
   * caption, so: label role, uppercase, tight leading for its single line. */
  :root[data-theme="studio"] .st-story-label {
    display: block;
    text-align: right;
    margin-bottom: clamp(12px, 1.1vw, 22px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-body);
  }
  /* Photo-ready slot at the band's measured 4:3. Flatter and more neutral than
   * zarja's lit scenes: studio's grounds are white/grey, not gradient-lit. The
   * scrim a real photo will need is already painted, so the image drops in
   * with zero restructuring (§5.1). */
  :root[data-theme="studio"] .st-story-frame {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    aspect-ratio: 4 / 3;
    border: 1px solid var(--line);
    border-radius: var(--r-media);
    background: var(--bg-alt);
  }
  :root[data-theme="studio"] .st-story-mass {
    position: absolute;
    inset: 14% 12%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--ink) 10%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--ink) 8%, transparent),
      color-mix(in srgb, var(--ink) 3%, transparent)
    );
  }
  :root[data-theme="studio"] .st-story-scrim {
    position: absolute;
    inset: auto 0 0 0;
    height: 42%;
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--ink) 18%, transparent),
      transparent
    );
  }
  /* Note sits at the TOP of the frame, on the flat ground rather than on the
   * scrim: --ink-body is 8.4:1 on --bg-alt, and unaffected once a photo lands
   * behind the scrim at the bottom. */
  :root[data-theme="studio"] .st-story-note {
    position: absolute;
    z-index: 1;
    top: clamp(12px, 1.4vw, 28px);
    left: clamp(12px, 1.4vw, 28px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-body);
  }

  /* ================= §4.8 Inline-icon statement + stats ================= */
  :root[data-theme="studio"] .st-stats {
    background: var(--bg);
    padding-block: var(--studio-rhythm);
    overflow: clip;
  }
  /* 1900px full-bleed band width (§3) — the claim's measured 1750 needs more
   * room than the 1560 text column. */
  :root[data-theme="studio"] .st-stats-in {
    max-width: 1900px;
    margin-inline: auto;
    padding-inline: var(--studio-statement-gutter);
    text-align: center;
  }
  /* Pills are ROUND (§3) — the counterpoint to the sharp CTA buttons. A chip,
   * so label role; tight leading keeps the pill's measured height. */
  :root[data-theme="studio"] .st-stats-pill {
    display: inline-block;
    border: 1px solid var(--studio-ring);
    border-radius: var(--r-pill);
    padding: clamp(8px, 0.6vw, 12px) clamp(16px, 1.4vw, 28px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink);
  }

  /* The signature paragraph: a big editorial statement, which is exactly what
   * lead-xl is for — the ramp's prose pull-quote rung (§1, §4.8). It is a <p>,
   * not a heading, and lead-xl is a Satoshi rung, so the face moves with the
   * role: the measured pass had it in the display face at a 450 weight the
   * source's display ramp does not have. max-width ~1750 at 2000px. */
  :root[data-theme="studio"] .st-claim {
    max-width: min(100%, max(20rem, 87.5vw));
    margin: clamp(28px, 3.4vw, 68px) auto 0;
    font-family: var(--f-body);
    font-weight: var(--w-body-med);
    font-size: var(--t-lead-xl);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead-xl);
    color: var(--ink);
    text-wrap: pretty;
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The accented half of the claim — one of the three places the shop hue is
   * allowed to appear (§5.4). --acc-text is the 0.45-lightness rung, which
   * clears 4.5:1 on white at every hue the palette factory permits. */
  :root[data-theme="studio"] .st-claim-acc { color: var(--acc-text); }

  /* Ø62px circular OUTLINED glyph, set INLINE in the text flow and vertically
   * centred on the line. inline-flex + vertical-align:middle is what centres
   * it on the x-height axis; line-height:0 stops the disc from inflating the
   * claim's 1.3em line box into an uneven ladder. */
  :root[data-theme="studio"] .st-claim-ico {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    inline-size: var(--studio-glyph);
    block-size: var(--studio-glyph);
    margin-inline: clamp(4px, 0.5vw, 12px);
    /* Optical: the disc's true centre sits slightly above the middle of a
     * lowercase line, so nudge it down by a hair of its own size. */
    translate: 0 -0.06em;
    border: 1px solid var(--studio-ring);
    border-radius: var(--r-circle);
    line-height: 0;
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-claim-ico svg {
    inline-size: 54%;
    block-size: 54%;
  }

  /* Stat row: 4-up desktop, 2-up mobile. */
  :root[data-theme="studio"] .st-stat-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: clamp(32px, 3.4vw, 68px) clamp(20px, 2.4vw, 48px);
    margin-top: clamp(40px, 5.5vw, 110px);
  }
  :root[data-theme="studio"] .st-stat {
    max-width: min(100%, max(11rem, 14vw));
    margin-inline: auto;
    text-align: center;
  }
  /* Stat values are display-face numerals. h1 belongs to the hero alone, so
   * the largest rung open to a repeated figure is h2 — the ramp has no rung
   * between h1 and h2, and a four-up stat row is not the page's dominant
   * statement (§1, §4.8). The measured pass's −0.02em tracking was an artifact:
   * the display ramp tracks h2 at 0em. */
  :root[data-theme="studio"] .st-stat-v {
    display: block;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--ink);
    font-variant-numeric: tabular-nums;
    /* Values are short tokens ("230 V", "≈ 0,25 €") — keep the unit with the
     * number, never break "0,25" across two lines. */
    text-wrap: balance;
  }
  /* The trailing +/% is a REAL superscript (§4.8), positioned rather than left
   * to vertical-align:super, which would stretch the h2 line box. The ramp has
   * no superscript rung, so the size stays a RATIO of the parent — 0.44em is
   * whatever h2 resolves to at the current tier, not an invented step. */
  :root[data-theme="studio"] .st-stat-v sup {
    font-size: 0.44em;
    font-weight: var(--w-display);
    line-height: 0;
    vertical-align: baseline;
    position: relative;
    top: -0.92em;
    letter-spacing: var(--ls-h2);
  }
  /* The muted stat caption — a caption, so the label role, two lines wide at
   * max-width 280 (§4.8). Set in the label face and left in sentence case: the
   * ramp's uppercase treatment is opt-in, and shouting four two-line captions
   * under the numerals would out-weigh them. Tight label leading for the same
   * reason. --ink-mute is the lightest rung that clears 4.5:1 on both grounds
   * it appears on (5.17:1 here on white) — it clears, and only just, which is
   * why the caption sits at the label rung's 14px on every tier and never
   * shrinks below it. */
  :root[data-theme="studio"] .st-stat-c {
    display: block;
    margin-top: clamp(8px, 0.8vw, 16px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-mute);
  }

  /* ---- Below 860px: one column of story, two columns of stats ---- */
  @media (max-width: 860px) {
    :root[data-theme="studio"] .st-story {
      grid-template-columns: minmax(0, 1fr);
    }
    /* The copy leads on a phone; the frame follows it. */
    :root[data-theme="studio"] .st-story-copy { max-width: 100%; }
    :root[data-theme="studio"] .st-story-label { text-align: left; }
    :root[data-theme="studio"] .st-stat-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  /* Under ~430px four glyphs inside one paragraph out-weigh the sentence they
   * punctuate; keep the first (the device still reads) and drop the rest. */
  @media (max-width: 430px) {
    :root[data-theme="studio"] .st-claim-ico ~ .st-claim-ico { display: none; }
  }

  /* ---- Motion ---- */
  @media (prefers-reduced-motion: reduce) {
    /* Reset to the resting state, never a frozen mid-transform: the arrow
     * returns to its baseline offset and the underline simply appears. */
    :root[data-theme="studio"] .st-statement-link,
    :root[data-theme="studio"] .st-statement-arrow { transition: none; }
    :root[data-theme="studio"] .st-statement-link:hover .st-statement-arrow {
      transform: none;
    }
  }
`;

/**
 * §4.3 — statement + story.
 *
 * The statement is the moat h2 (the shop's own three-line claim), so this is a
 * real <h2>: the hero owns the page's only <h1>. The link points at the About
 * route through routeSlugs, which is the shop's localized Slovenian segment.
 */
export function renderStudioStatement(ctx: RenderCtx): string {
  const c = ctx.content;
  const about = ctx.shop.routeSlugs["/about"] + ctx.q;
  return (
    '<section class="st-statement"><div class="st-statement-in">' +
    '<h2 class="st-statement-h">' + esc(c.moat.h2) + "</h2>" +
    '<a class="st-statement-link" href="' + esc(about) + '">' +
    "<span>Naša zgodba</span>" +
    '<span class="st-statement-arrow" aria-hidden="true">→</span>' +
    "</a>" +
    '<div class="st-story">' +
    '<p class="st-story-copy">' + esc(c.sub) + "</p>" +
    '<figure class="st-story-fig">' +
    // figcaption first: the baseline puts this label ABOVE the frame.
    '<figcaption class="st-story-label">' + esc(ctx.shop.keyword.category) + "</figcaption>" +
    '<div class="st-story-frame">' +
    '<span class="st-story-mass" aria-hidden="true"></span>' +
    '<span class="st-story-scrim" aria-hidden="true"></span>' +
    '<span class="st-story-note">Fotografija v pripravi</span>' +
    "</div></figure></div></div></section>"
  );
}

/**
 * Split a sentence at the word boundary nearest its middle, so a glyph can be
 * planted INSIDE the sentence rather than only at its seams — the inline
 * placement is the whole point of §4.8. Returns ["", ""]-safe halves: a
 * single-word (or empty) claim half yields no split and simply renders one
 * fewer glyph.
 */
function splitAtMiddle(s: string): [string, string] {
  const t = s.trim();
  const mid = t.length / 2;
  let cut = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] !== " ") continue;
    if (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid)) cut = i;
  }
  if (cut < 0) return [t, ""];
  return [t.slice(0, cut), t.slice(cut + 1)];
}


/**
 * §4.8 — inline-icon statement + stats. The theme's signature device.
 *
 * The claim's two content parts become one sentence: part one carries two
 * glyphs (one mid-sentence, from splitAtMiddle), part two is set in --acc-text
 * and closed by a fourth glyph. The glyphs are aria-hidden punctuation, so a
 * screen reader hears the sentence exactly as written.
 *
 * The section has no heading — the pill is a label, not a rank in the document
 * outline — so it is labelled instead.
 */
export function renderStudioStats(ctx: RenderCtx): string {
  const claim = ctx.content.moat.claim;
  const [head, tail] = splitAtMiddle(claim[0]);
  const opener =
    glyph("cabin") +
    " " +
    esc(head) +
    (tail ? " " + glyph("drop") + " " + esc(tail) : "");
  return (
    '<section class="st-stats" aria-label="Zakaj pri nas"><div class="st-stats-in">' +
    '<span class="st-stats-pill">Zakaj pri nas</span>' +
    '<p class="st-claim">' +
    opener +
    " " + glyph("temp") + " " +
    '<span class="st-claim-acc">' + esc(claim[1]) + "</span>" +
    " " + glyph("waves") +
    "</p>" +
    '<div class="st-stat-row">' +
    ctx.content.stats
      .map(
        (s) =>
          '<div class="st-stat">' +
          '<span class="st-stat-v">' + statValue(s[0]) + "</span>" +
          '<span class="st-stat-c">' + esc(s[1]) + "</span>" +
          "</div>",
      )
      .join("") +
    "</div></div></section>"
  );
}
