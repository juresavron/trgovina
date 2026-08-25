/**
 * STUDIO — statement/story and the inline-icon statement + stats
 * (docs/STUDIO-BASELINE.md §4.3 and §4.8).
 *
 *   §4.3 Statement + story — left-aligned statement at the page gutter, then a
 *        small tracked "NAŠA ZGODBA →" label link, then a two-column band:
 *        the standfirst copy left, photograph right carrying an uppercase
 *        label above it.
 *   §4.8 Inline-icon statement + stats — the theme's SIGNATURE device: a
 *        centred outlined pill, a centred statement paragraph with circular
 *        OUTLINED icon glyphs set INLINE in the text flow and vertically
 *        centred on the line, then the stat row (display numerals with the
 *        trailing +/% as a real <sup>, a caption under each).
 *
 * PROVENANCE. §4 of the baseline is the screenshot-derived catalogue and is
 * being reconciled device by device against the source's saved page (the
 * method is baseline §0). These two devices are now reconciled, and the
 * numbers below are read off the source's own section CSS rather than off a
 * picture. What that changed, and what it cost:
 *
 *   content width   1560 / 1900 → --studio-container. The source's Story
 *                   container is 1440 and every other studio band already
 *                   uses the token; this section was the one that sat wider
 *                   than its neighbours, so its "left-aligned at the gutter"
 *                   statement did not line up with the hero or the grid above
 *                   and below it. That misalignment was the whole cost.
 *   statement cap   ~1350 → 1015 (the source's [Title Content] max-width).
 *   gaps            the eyeballed clamps → the source's 48 / 64 / 32 / 100 /
 *                   24 / 12, with the source's own phone overrides. The
 *                   biggest error was pill→statement: 68px measured, 32 real.
 *   glyph ring      a 1px ~#b8b8b8 hairline at clamp(26,3.1vw,62) → the
 *                   source's Ø64px ring, 2px solid #151515. The ring is now
 *                   an em ratio off the statement (64/48), so it tracks the
 *                   ramp instead of a viewport clamp, and the invented
 *                   --studio-ring colour rung is gone.
 *   glyph placement four glyphs, none leading, one trailing — the source's
 *                   run/ring/run/ring shape. The paragraph no longer opens on
 *                   a disc.
 *   pill            the invented ring colour → the source's 1px --line at
 *                   --r-tag, i.e. baseline §3's "pill tag" exactly.
 *   story pictures  the drawn placeholder → two real ROOMS interiors,
 *                   including the source's second, smaller figure at the foot
 *                   of the left column.
 *
 * Type roles (docs/STUDIO-BASELINE.md §1). Every size, weight, tracking and
 * leading comes from the transcribed ramp in tokens.ts, which already resolves
 * per breakpoint (≥1200 / 810–1199 / ≤809) — nothing here is a px or a clamp.
 * The statement is h2, the story copy lead, the claim lead-xl (the ramp's
 * prose pull-quote rung), the stat values h2 numerals, and every chip, link,
 * figure label and caption the label role.
 *
 * Accent budget (§5.4): the shop hue is spent in exactly three places on the
 * whole storefront. This module used to own one of them — the second half of
 * the stats claim (.st-claim-acc) — and no longer owns any. The source sets
 * that sentence in one ink throughout, and side by side the two-tone split was
 * the loudest reason our band read less refined than its; the slot is given up
 * rather than moved. Nothing here is accented now, focus rings included; they
 * follow chrome.ts and use --ink / --on-invert.
 *
 * Token discipline (docs/THEMES.md): colors, radii and faces are var(--…)
 * only. Every selector is scoped :root[data-theme="studio"] — zarja/lednik/
 * salon share this sheet.
 */

import { esc, type RenderCtx } from "../../render/sections";
import { OWN_PHOTOS, decorativeImg, pick } from "./media";
import { statValue } from "./stat";

/* ---- inline glyphs (§4.8) --------------------------------------------
 * 24px grid, stroke-only, currentColor — the circle is drawn by the host
 * span's border, so the SVG carries the line-art alone and the ring stays a
 * perfect circle at every tier. stroke-width 1.5 on a 24 grid rendered at 50%
 * of the ring lands the art on the ring's own 2px weight, which is what makes
 * the glyph read as one drawn object rather than as art inside a frame.
 * Four wellness glyphs: cabin (savna), droplet (voda/kad), thermometer
 * (temperatura), waves (bazen). */
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
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
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
  }

  /* ================= §4.3 Statement + story ================= */
  :root[data-theme="studio"] .st-statement {
    background: var(--bg);
    padding-block: var(--studio-rhythm);
    /* Belt-and-braces against a long unbroken head term: the page must never
     * scroll sideways (§6). */
    overflow: clip;
  }
  /* --studio-container is the house content measure and every other studio
   * band caps on it; box-sizing is border-box, so the gutter lives inside the
   * cap exactly as it does in commerce.ts and editorial.ts. Same number, same
   * pattern ⇒ this section's gutter-left statement lines up with the section
   * above and below it. */
  :root[data-theme="studio"] .st-statement-in {
    max-width: var(--studio-container);
    margin-inline: auto;
    padding-inline: var(--studio-statement-gutter);
  }

  /* The section's dominant type and a real <h2>, set in the display face, so
   * it takes the h2 rung whole (§1, §4.3). 1015px is the source's own
   * [Title Content] cap — at the h2 rung it is what breaks the statement into
   * three lines instead of two long ones. */
  :root[data-theme="studio"] .st-statement-h {
    margin: 0;
    max-width: 1015px;
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

  /* Statement → link is the source's 48px (25px on phone; see the ≤809 block).
   * The link is a tracked uppercase button label, so it is the label role; one
   * line of it, hence the ramp's tight label leading rather than the 1.71em
   * reading rung.
   *
   * min-block-size is OURS, not the source's: the source ships a 20px-tall
   * text link and the EAA floor for a touch target is 44px. Centring the label
   * in a 44px box would drop the hover underline 12px below the words, so the
   * rule moved onto the inner span — the box grows, the underline does not. */
  :root[data-theme="studio"] .st-statement-link {
    display: inline-flex;
    align-items: center;
    gap: var(--gap-xs);
    min-block-size: 44px;
    margin-top: 48px;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    text-decoration: none;
    color: var(--ink);
  }
  /* Underline lives on the text, drawn on hover/focus — the resting state in
   * the source is a bare tracked label. */
  :root[data-theme="studio"] .st-statement-txt {
    border-bottom: 1px solid transparent;
    padding-bottom: 4px;
    transition: border-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-statement-link:hover .st-statement-txt {
    border-bottom-color: var(--ink);
  }
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

  /* Two-column band: copy + small picture left, tall photo right. The source
   * runs two EQUAL columns and lets the copy's own 464px cap open the gutter
   * between them, which is why the copy sits well left of the photo rather
   * than filling its half. --studio-col-gap replaces the source's literal 0
   * for one reason: the source's left column is 720px wide and ours is not,
   * so at the narrow end of the tablet tier a 0 gap puts the copy's last word
   * against the frame. 64px above is the source's container gap.
   *
   * The columns STRETCH rather than starting at the top: the left column's
   * job is to run the length of the right photo, with the standfirst at its
   * head and the small picture at its foot. That is the source's own
   * arrangement (its left column is bottom-aligned under a 215px gap) and it
   * is what stops a ~680px photograph from leaving half a column of white. */
  :root[data-theme="studio"] .st-story {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--studio-col-gap);
    margin-top: var(--gap-2xl);
  }
  :root[data-theme="studio"] .st-story-lead {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--gap-2xl);
  }
  /* The band's standfirst — it carries the shop's own sub line, not running
   * body copy — so it takes the lead rung (§1, §4.3). 464px is the source's
   * copy cap. --ink-body on white is 9.0:1. (The source sets this paragraph
   * in #2e2e2e; that token is --ink-invert-2, whose job is dark-on-dark
   * separation, and the two are indistinguishable on white — so this keeps
   * the light-ground body ink instead of borrowing a dark-band rung.) */
  :root[data-theme="studio"] .st-story-copy {
    margin: 0;
    max-width: 464px;
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--ink-body);
  }

  :root[data-theme="studio"] .st-story-fig { margin: 0; }
  /* The label sits ABOVE the frame — the detail that keeps this band from
   * reading as a plain text/image split — at the source's 24px remove. A
   * figure caption, so: label role, uppercase, tight leading for its one line,
   * --ink (the source's #151515), not the muted rung.
   *
   * DEVIATION: the source CENTRES this label over the image ([Inner Content]
   * is align-items:center over a 91%-wide frame). It is right-aligned here
   * because our band is copy|photo rather than the source's two equal picture
   * columns, and a right-aligned label pins the band's far edge against the
   * gutter-left statement above it. Cost: one axis of the source's symmetry.
   * Reverting is one declaration. */
  :root[data-theme="studio"] .st-story-label {
    display: block;
    text-align: right;
    margin-bottom: var(--gap-lg);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink);
  }
  /* 826/850 is the source figure's own ratio — very slightly taller than
   * square, and the reason the band has weight on the right instead of the
   * flat 4:3 the measured pass drew. The frame reserves its own height, so a
   * photo that has not decoded yet still costs zero CLS. No border: the
   * source's images carry none, and a hairline around a photograph reads as a
   * frame the theme does not have.
   *
   * background is --bg, NOT --bg-alt, and that is load-bearing: the ::after
   * ground below multiplies whatever is in the frame by the panel grey, so a
   * white background, a not-yet-decoded frame and the photograph's own white
   * sweep all resolve to the SAME --bg-alt tone — no seam, no flash at
   * decode. A --bg-alt background under the multiply would print a step
   * darker than the image's sweep and draw a visible box-in-a-box.
   * isolation confines the blend to this frame's own stacking context. */
  :root[data-theme="studio"] .st-story-frame {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    aspect-ratio: 826 / 850;
    border-radius: var(--r-media);
    background: var(--bg);
  }
  /* The band's second, smaller picture, at the foot of the left column.
   * 464/518 is the source figure's ratio and 66% is its share of the column
   * (the source gives it flex:2 of a 2:1 row). The percentage, not the raw
   * 464px, is what keeps the two columns the same height at every width above
   * a phone: a fixed cap makes the left column OVERSHOOT the photo once the
   * container drops near 1200. */
  :root[data-theme="studio"] .st-story-fig2 {
    margin: 0;
    inline-size: min(464px, 66%);
  }
  /* Same --bg-under-multiply ground as the big frame, same reason. */
  :root[data-theme="studio"] .st-story-frame2 {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    aspect-ratio: 464 / 518;
    border-radius: var(--r-media);
    background: var(--bg);
  }
  /* Replaced elements ignore inset-shrinking, so the image is sized with
   * explicit 100% axes rather than inset alone (the recently-fixed bug
   * class). cover is the LARGE frame's fit: its picture is the band's
   * atmosphere anchor and cover crops the studio sweep away to fill the
   * 826/850 block edge to edge. */
  :root[data-theme="studio"] .st-story-photo {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
  /* The SMALL frame fits the other way. Its job is an inset product detail,
   * not a second atmosphere block, and its sources are landscape-ish studio
   * cutouts: cover in a 464/518 portrait frame kept only the middle ~60% of
   * the tub and filled the rest with sweep — the "empty white box" this
   * section was screenshotted failing as. contain shows the whole cutout,
   * and the multiply ground below turns its sweep into the panel it sits on,
   * so the figure reads as the theme's own product plate (the commerce
   * cards' cutout-on-panel language) at whatever aspect the file has. */
  :root[data-theme="studio"] .st-story-frame2 .st-story-photo {
    object-fit: contain;
  }
  /* THE GROUND. These photographs are supplier studio shots — cutouts on a
   * white sweep — and a borderless white photograph on the white page is
   * exactly how this section read as two empty boxes. The overlay multiplies
   * the frame's contents by the theme's one panel grey: a white pixel lands
   * on --bg-alt exactly, a dark pixel keeps ~94% of its value (imperceptible
   * on the atmospheric shots), so every frame owns a quiet panel whatever
   * file pick() lands on. A tint, not a border: commerce.ts already
   * established that matching the ground to the photograph is what makes a
   * cutout read as one object, and a hairline is a frame this theme does not
   * draw. pointer-events: none so the overlay never eats a future link. */
  :root[data-theme="studio"] .st-story-frame::after,
  :root[data-theme="studio"] .st-story-frame2::after {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--bg-alt);
    mix-blend-mode: multiply;
    pointer-events: none;
  }

  /* ================= §4.8 Inline-icon statement + stats ================= */
  :root[data-theme="studio"] .st-stats {
    background: var(--bg);
    padding-block: var(--studio-rhythm);
    overflow: clip;
  }
  :root[data-theme="studio"] .st-stats-in {
    max-width: var(--studio-container);
    margin-inline: auto;
    padding-inline: var(--studio-statement-gutter);
    text-align: center;
  }
  /* Baseline §3's "pill tag", exactly: 50px radius, 1px --line, 6px 20px.
   * --line is a decorative hairline (1.33:1) and that is what it is doing —
   * this chip is not interactive and carries no state, so the 3:1 boundary
   * floor does not apply to it; the word inside is --ink at 15.9:1. The
   * measured pass drew a darker invented ring here, which made a quiet
   * eyebrow read as a control. */
  :root[data-theme="studio"] .st-stats-pill {
    display: inline-block;
    border: var(--bw-line) solid var(--line);
    border-radius: var(--r-tag);
    padding: 6px 20px;
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
   * not a heading, and lead-xl is a prose rung, so the face follows the role.
   * 32px is the source's badge → statement gap (the measured pass had 68).
   *
   * THE MEASURE, and why it is no longer the section container. This was
   * 1296px — the source's own container for this band — and handing that
   * number to a PARAGRAPH was the mistake. The source fills four full lines
   * at 1296 because its sentence runs to about thirty words; ours is nine
   * words and four rings, so the same cap bought one 1292px line and a 217px
   * stub under it (measured in Chromium at 1440: "ga mi." and the closing
   * ring, alone). A full line with a scrap hanging off it is what made this
   * band read cheap beside the source, and no amount of ring polish fixes a
   * rag that bad. 1015px is the measure the source gives a STATEMENT rather
   * than a band — its [Title Content] cap, already spent on .st-statement-h
   * above — so the page's two statements now sit on one measure, and this
   * one settles into two full lines (909 / 626 at 1440, 834 / 574 at 1024).
   * Nothing narrower earns its keep: at 860 the paragraph goes to three
   * lines whose middle is a single word between two rings.
   *
   * text-wrap: balance is the other half, and it does engage — every number
   * here was read off line boxes with it on and with it off. Blink balances
   * any block of six lines or fewer, which is every tier this paragraph has.
   * At 1440 it trades 987/548 for 909/626; at 390 it trades 307/179/274 for
   * 269/218/274; at 320 it pulls "ga" down so the last line is 111px instead
   * of 75. It is an ENHANCEMENT and not the fix, which is the order these two
   * declarations have to work in: where balance is not implemented the cap
   * alone still gives two full lines at the desktop tier, never the old line
   * and a scrap. pretty, which this was, only guards the last line — it
   * cannot even out the first, and at 1296 it did not. */
  :root[data-theme="studio"] .st-claim {
    /* The Ø64px ring, expressed as the source's own ratio against the 48px
     * statement it punctuates (64/48). An em, not a clamp: the ring then
     * tracks the ramp through all three tiers instead of tracking the
     * viewport, and it is declared HERE — on the element whose font-size it
     * is relative to — so the unit resolves against lead-xl and not against
     * the root's 16px. */
    --studio-glyph: 1.333em;
    max-width: 1015px;
    margin: 32px auto 0;
    font-family: var(--f-body);
    font-weight: var(--w-body-med);
    font-size: var(--t-lead-xl);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead-xl);
    color: var(--ink);
    text-wrap: balance;
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The second clause of the claim, and it is NOT accented any more.
   *
   * It used to be --acc-text, spending one of the three shop-hue slots the
   * accent budget allows (§5.4), and that colour was the single biggest
   * reason the band read less refined than the source: the source sets this
   * whole sentence in ONE ink, black from the first word to the closing
   * ring, and the two-tone split turned an editorial statement into a
   * highlighted phrase. The owner overrode the budget here on the strength
   * of the side-by-side. The hue is not moved elsewhere — it is simply not
   * spent, and this module now owns none of the three.
   *
   * The span STAYS, and it stays in the markup rather than being deleted,
   * for two reasons: it is what marks where the second clause begins, which
   * is the seam the closing ring is bound to (see renderStudioStats), and it
   * is the hook any future distinction would attach to. It carries no weight
   * change either — the source's block is one ink AND one weight, and a
   * bolded second clause is the same two-tone mistake in another dimension.
   * The rule is written out, rather than the selector deleted, so the next
   * reader sees a deliberate monochrome instead of a forgotten style. */
  :root[data-theme="studio"] .st-claim-acc { color: inherit; }

  /* The circular OUTLINED glyph, set INLINE in the text flow and vertically
   * centred on the line. 2px --ink is the source's ring — the same weight and
   * ink as the theme's Ø64px circular nav button (§3), which is why the two
   * read as one family.
   *
   * LINE RHYTHM, the thing this device gets wrong most easily. An inline-flex
   * box is atomic, so line-height does not touch it: what it contributes to
   * the line box is its MARGIN box, positioned by vertical-align. Centred on
   * the x-height axis, a 1.333em ring hangs ~0.41em below the baseline while
   * the strut only reaches 0.24em, so every line carrying a ring would grow
   * ~0.16em taller than every line that does not — a visibly uneven ladder,
   * worst on a phone where lead-xl is 24px and one ring lands per line. The
   * negative block margin pulls the margin box back inside the strut, so the
   * ladder stays even at all three tiers (the correction is in em, so it
   * scales with the ramp) and the ring's drawn size is untouched. It then
   * overhangs the next line by ~0.14em, which clears that line's cap height
   * and its caron accents — č/š/ž reach ~0.75em and the ring stops at 0.4em.
   *
   * INLINE AIR. The word space either side of a ring is 0.193em in this face
   * — 9.3px at the 48px rung, measured, not the 0.26em an earlier pass
   * assumed — and against a Ø64px ring that is 14% of its own diameter: the
   * rings sat clamped between the words, which is exactly where ours read
   * tight and the source's read planted. 0.09em of margin on each side takes
   * the gap to 0.283em (13.6px at 48px, 6.8px at 24px), i.e. 21% of the ring
   * at EVERY tier, because both the ring and the margin are ems off the same
   * ramp. It is deliberately not more: the space has to stay smaller than the
   * ring's own diameter or the sentence stops being a sentence and becomes a
   * row of medallions. The margin is on the ring rather than on the word
   * spaces (word-spacing) so it applies to the four ring gaps and leaves the
   * sentence's own eight word gaps at the face's spacing.
   *
   * The one cost is that a ring ending a line carries its trailing margin
   * with it — an inline margin is not trimmed at a line break the way a space
   * is — so such a line is centred 2.2px left of true at 1440 and 1.1px at
   * 390. Both are under a twentieth of an em and neither is visible; the
   * alternative (trimming it with a :last-child rule) would only move the
   * inconsistency to whichever ring lands last on a line, which changes per
   * tier and per shop.
   *
   * The spaces stay real spaces, so a ring keeps a break opportunity on both
   * sides and can start or end a line rather than welding itself to a word.
   * The ONE exception is the closing ring — see .st-claim-end below. */
  :root[data-theme="studio"] .st-claim-ico {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    inline-size: var(--studio-glyph);
    block-size: var(--studio-glyph);
    margin-block: -0.17em;
    margin-inline: 0.09em;
    /* Optical: the ring's true centre sits slightly above the middle of a
     * lowercase line, so nudge it up by a hair of its own size. A transform,
     * so it moves the paint and not the line box. */
    translate: 0 -0.06em;
    border: var(--bw-ctrl) solid var(--ink);
    border-radius: var(--r-circle);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-claim-ico svg {
    inline-size: 50%;
    block-size: 50%;
  }

  /* The claim's last word and the ring that closes the sentence, bound into
   * one unbreakable run.
   *
   * That ring is the only one that can end up alone. Every other ring has
   * words behind it, but this one ends the paragraph, so the single break
   * opportunity in front of it puts it on a line of its own at the foot of
   * the block — a stray circle under the sentence, which is the exact kind of
   * cheapness this band is being polished out of. It is not hypothetical:
   * measured at 320px with the balancer turned off, the last line was 32px
   * wide and held nothing but the ring.
   *
   * A non-breaking space in front of it does NOT prevent that, which is worth
   * writing down because it is the obvious fix and it fails. Blink treats an
   * atomic inline box as a break opportunity in its own right and breaks
   * before the ring whatever the space in front of it is — measured, with the
   * entity in place. Only a wrapper that forbids breaking holds it. The
   * wrapper takes the LAST WORD and the ring and nothing else, so the clause
   * still wraps freely everywhere else: at the 320px floor the bound run is
   * 75px against a 270px measure, so binding it cannot overflow, and it stays
   * the widest unbreakable thing in the paragraph at every tier. */
  :root[data-theme="studio"] .st-claim-end { white-space: nowrap; }

  /* Stat row. The source shows three columns spread across the band; ours
   * shows four because every shop's content ships four figures and dropping
   * one to match a screenshot would drop a fact the shop is making. 100px is
   * the source's statement → counters gap. Four columns only on the desktop
   * tier — see the ≤1199 block for why. */
  :root[data-theme="studio"] .st-stat-row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--gap-2xl) var(--gap-lg);
    margin-top: 100px;
  }
  :root[data-theme="studio"] .st-stat { text-align: center; }
  /* Stat values are display-face numerals at the h2 rung — the source sets its
   * counters in h2 (its digit roller is 68px tall, which is h2's 60px at
   * 1.13em) and h1 belongs to the hero alone. The measured pass's −0.02em
   * tracking was an artifact: the display ramp tracks h2 at 0em. */
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
   * to vertical-align:super, which would stretch the h2 line box. (The source
   * gets the same picture a different way: its suffix is a sibling paragraph
   * in a flex row aligned to the top of the counter. A <sup> is the semantic
   * form of that and survives with no JS.) The ramp has no superscript rung,
   * so the size stays a RATIO of the parent — 0.44em is whatever h2 resolves
   * to at the current tier, not an invented step, and the offset is in the
   * same em so the two stay locked together across all three tiers. */
  :root[data-theme="studio"] .st-stat-v sup {
    font-size: 0.44em;
    font-weight: var(--w-display);
    line-height: 0;
    vertical-align: baseline;
    position: relative;
    top: -0.92em;
    letter-spacing: var(--ls-h2);
  }
  /* The muted stat caption, at the source's 12px remove — a caption, so the
   * label role. Set in the label face and left in sentence case: the ramp's
   * uppercase treatment is opt-in, and shouting four two-line captions under
   * the numerals would out-weigh them. Tight label leading for the same
   * reason. --ink-mute is the lightest rung that clears 4.5:1 on both grounds
   * it appears on (5.17:1 here on white) — it clears, and only just, which is
   * why the caption sits at the label rung's 14px on every tier and never
   * shrinks below it. (The source sets this caption at the body rung; the
   * label rung keeps it a caption rather than a second paragraph, and 14 vs
   * 16px is the whole difference.)
   *
   * 225px is the source's counter-column cap, and it is applied HERE rather
   * than to the whole column: its job is to hold the caption to two lines.
   * Our values are not the source's three short counters — "≈ 0,25 €" and
   * "1700 mm" are 4.4em wide at the h2 rung, which is wider than 225px — so
   * capping the column would break a value across two lines and orphan its
   * unit. The numeral gets the whole column; the caption gets the measure. */
  :root[data-theme="studio"] .st-stat-c {
    display: block;
    max-width: 225px;
    margin-inline: auto;
    margin-top: 12px;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-mute);
  }

  /* ---- Tablet tier and down (≤1199px) -----------------------------------
   * The stat row halves. Four columns of an 810px viewport are ~160px wide
   * and the h2 numerals only drop 60→50 there, so a value with a unit
   * ("≈ 0,25 €") no longer fits on one line. Two columns is the widest the
   * row can be below the desktop tier without breaking a figure in half. */
  @media (max-width: 1199px) {
    :root[data-theme="studio"] .st-stat-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  /* ---- Phone tier (≤809px) ----------------------------------------------
   * The ramp's own bottom breakpoint, so the layout turns on exactly the tier
   * where lead-xl drops 44→24 and h2 drops 50→38 — the module's breakpoints
   * are the ramp's, never a third one invented nearby. The gaps below are the
   * source's own phone overrides. */
  @media (max-width: 809px) {
    :root[data-theme="studio"] .st-statement-link { margin-top: 25px; }
    :root[data-theme="studio"] .st-story {
      grid-template-columns: minmax(0, 1fr);
    }
    /* The copy leads on a phone; the frame follows it. (The source inverts
     * this — its picture column is ordered first below 810px. On a shop the
     * sentence that explains the offer outranks the atmosphere shot.) */
    :root[data-theme="studio"] .st-story-copy { max-width: 100%; }
    :root[data-theme="studio"] .st-story-label { text-align: left; }
    /* The second picture stays on a phone, and NOT because it is needed here
     * — with one column there is no second column to balance. It stays
     * because display:none does not save the download. A lazy <img> with no
     * layout box never intersects anything, and every engine resolves that by
     * loading it immediately: hiding this figure fetched its 90 KB eagerly,
     * before first paint, on the one tier that can least afford it. Visible
     * and below the fold, the same file is genuinely deferred until the
     * reader scrolls to it. So it keeps its 66% width — small enough to read
     * as an inset detail rather than a second hero. */
    :root[data-theme="studio"] .st-story-lead { gap: var(--gap-xl); }
    :root[data-theme="studio"] .st-claim { margin-top: 20px; }
    /* The ring halves with the ramp (1.333em of 24px ≈ 32px), so a 2px edge
     * would read twice as heavy as the 64px ring does on a desktop. Dropping
     * to the hairline weight holds the ring's ~32:1 proportion. */
    :root[data-theme="studio"] .st-claim-ico { border-width: var(--bw-line); }
    /* The 2-up grid's own row gap comes down from 64px to the 40px that
     * separates the whole block from the claim. At 64 the two rows of figures
     * stood further apart than the block stood from the paragraph above it —
     * a group whose internal rhythm out-measures the rhythm separating it from
     * its neighbour, which is backwards, and on a 390px screen it read as two
     * pairs of figures rather than one row folded in half. (64px is the
     * desktop tier's value, where it is inert: one row, and 100px of air above
     * it.) Nothing tighter survives a look — at --gap-lg the second row's
     * numerals crowd the caption above them, which sits only 12px under its
     * own figure and would start to look like a label for the wrong number. */
    :root[data-theme="studio"] .st-stat-row {
      margin-top: var(--gap-xl);
      row-gap: var(--gap-xl);
    }
  }

  /* ---- Motion ---- */
  @media (prefers-reduced-motion: reduce) {
    /* Reset to the resting state, never a frozen mid-transform: the arrow
     * returns to its baseline offset and the underline simply appears. */
    :root[data-theme="studio"] .st-statement-txt,
    :root[data-theme="studio"] .st-statement-arrow { transition: none; }
    :root[data-theme="studio"] .st-statement-link:hover .st-statement-arrow {
      transform: none;
    }
  }
`;

/**
 * §4.3 — statement + story.
 *
 * The statement is the moat h2 (the shop's own claim), so this is a real
 * <h2>: the hero owns the page's only <h1>. The link points at the About
 * route through routeSlugs, which is the shop's localized Slovenian segment.
 *
 * Both pictures are decorative beside a brand story — they come from
 * OWN_PHOTOS (the shop's own supplier photography), aria-hidden with empty
 * alts, and the frames are simply omitted when a shop owns nothing: an empty
 * frame is a hole, not a composition.
 *
 * WHICH pictures is not left to chance. Offsets 23 and 25 were chosen off
 * the files' own alt records for the bazen key: 23 lands on the BAZEN 230
 * side view with the grey wooden cladding and lit LED strips, 25 on the
 * BAZEN 230 at dusk under blue-green LED light — the two shots in the well
 * that carry their own tone. That matters because the rest of the well is
 * white-sweep cutouts and white acrylic close-ups, and offsets 7/11 had put
 * a white jets close-up in the LARGE frame: a white photograph on the white
 * page, which is exactly the "two empty boxes" the section was screenshotted
 * failing as. The CSS multiply ground (see .st-story-frame::after) insures
 * against a white file, but the first defence is not to pick one.
 *
 * Collision avoidance: the other pick(OWN_PHOTOS, …) offsets on this page
 * are 0–5 (social strip), 5 (hero), 9 (editorial room), 13 (editorial
 * tiles) and 17–18 (testimonial discs). 23 and 25 collide with none of
 * them, and with each other guarantee this band's two pictures differ.
 *
 * The small picture is the source's own second figure, and it is here because
 * without it the left column runs out of content halfway down a ~680px
 * photograph. Its caption pair is NOT reproduced: there is no content field
 * for those two lines, and inventing shop copy to fill a layout is the one
 * thing a theme must not do. So it is a bare figure — the composition, not
 * the words.
 */
export function renderStudioStatement(ctx: RenderCtx): string {
  const c = ctx.content;
  const about = ctx.shop.routeSlugs["/about"] + ctx.q;
  return (
    '<section class="st-statement"><div class="st-statement-in">' +
    '<h2 class="st-statement-h">' + esc(c.moat.h2) + "</h2>" +
    '<a class="st-statement-link" href="' + esc(about) + '">' +
    '<span class="st-statement-txt">Naša zgodba</span>' +
    '<span class="st-statement-arrow" aria-hidden="true">→</span>' +
    "</a>" +
    '<div class="st-story">' +
    '<div class="st-story-lead">' +
    '<p class="st-story-copy">' + esc(c.sub) + "</p>" +
    // Small frame, offset 23: the clad side view — a product detail with its
    // own tone, shown WHOLE via the frame's object-fit: contain plate. The
    // offset choice and the page-wide collision list live in the doc comment
    // above this function.
    (OWN_PHOTOS.length > 0
      ? '<figure class="st-story-fig2"><div class="st-story-frame2">' +
        decorativeImg(
          pick(OWN_PHOTOS, ctx.shop.key, 23),
          "st-story-photo",
          "(max-width: 809px) 57vw, (max-width: 1439px) 31vw, 440px",
        ) +
        "</div></figure>"
      : "") +
    "</div>" +
    '<figure class="st-story-fig">' +
    // figcaption first: the source puts this label ABOVE the frame.
    '<figcaption class="st-story-label">' + esc(ctx.shop.keyword.category) + "</figcaption>" +
    '<div class="st-story-frame">' +
    // Large frame, offset 25: the dusk LED shot — the one genuinely
    // atmospheric picture in the well, and the band's anchor. cover, so it
    // fills the 826/850 block edge to edge.
    (OWN_PHOTOS.length > 0
      ? decorativeImg(
          pick(OWN_PHOTOS, ctx.shop.key, 25),
          "st-story-photo",
          "(max-width: 809px) 92vw, (max-width: 1439px) 47vw, 660px",
        )
      : "") +
    "</div></figure></div></div></section>"
  );
}

/**
 * Split a sentence into up to `n` balanced runs of whole words, so the glyphs
 * can be planted INSIDE the sentence rather than only at its seams — the
 * inline placement is the whole point of §4.8. A sentence with fewer words
 * than `n` simply yields fewer runs, and therefore fewer glyphs.
 */
function splitRuns(s: string, n: number): string[] {
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const runs = Math.min(n, words.length);
  const out: string[] = [];
  for (let i = 0; i < runs; i++) {
    const from = Math.round((i * words.length) / runs);
    const to = Math.round(((i + 1) * words.length) / runs);
    out.push(words.slice(from, to).join(" "));
  }
  return out;
}

/** The three rings that punctuate the claim's first part; the fourth closes it. */
const CLAIM_RINGS: readonly GlyphKey[] = ["cabin", "drop", "temp"];

/**
 * §4.8 — inline-icon statement + stats. The theme's signature device.
 *
 * The claim's two content parts become one sentence in the source's own shape:
 * FOUR text runs alternating with FOUR rings, no ring leading the paragraph
 * and one closing it. Part one is cut into three balanced runs so two rings
 * land mid-sentence; part two is marked by .st-claim-acc (monochrome now, see
 * the CSS) and the fourth ring closes the line. The rings are aria-hidden
 * punctuation, so a screen reader hears the sentence exactly as written — read
 * it without them and it is still the shop's sentence, unbroken.
 *
 * THE CLOSING RING IS TIED TO THE LAST WORD. Every other ring is joined to the
 * sentence with an ordinary space and may start or end a line as the wrap
 * falls; the last one may not, because the one place it can land alone is the
 * bottom of the paragraph, where a lone circle on its own line stops reading
 * as punctuation and starts reading as a stray asset. So the sentence's last
 * word is lifted out of the clause and re-set inside .st-claim-end together
 * with the ring — the CSS explains why a non-breaking space, the shorter fix,
 * does not hold. Only the last word moves: the clause span still wraps the
 * whole clause, the reader still gets one uninterrupted sentence, and the
 * bound run is 75px at the 320px floor against a 270px measure, so it cannot
 * overflow. Checked at 320 — document scrollWidth still 320.
 *
 * The section has no heading — the pill is a label, not a rank in the document
 * outline — so it is labelled instead.
 */
export function renderStudioStats(ctx: RenderCtx): string {
  const claim = ctx.content.moat.claim;
  const parts: string[] = [];
  const runs = splitRuns(claim[0], CLAIM_RINGS.length);
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    if (run) parts.push(esc(run));
    const ring = CLAIM_RINGS[i];
    if (ring) parts.push(glyph(ring));
  }
  // The closing ring rides along INSIDE the second clause rather than joining
  // the sentence as its own part, bound to the clause's last word so the two
  // cannot be split across a line break (see .st-claim-end). A one-word clause
  // simply binds that word; an empty one binds nothing and still closes.
  const tail = claim[1].trim();
  const cut = tail.lastIndexOf(" ");
  const lead = cut < 0 ? "" : tail.slice(0, cut + 1);
  const last = cut < 0 ? tail : tail.slice(cut + 1);
  parts.push(
    '<span class="st-claim-acc">' + esc(lead) +
      '<span class="st-claim-end">' + esc(last) + " " + glyph("waves") + "</span>" +
      "</span>",
  );
  return (
    '<section class="st-stats" aria-label="Zakaj pri nas"><div class="st-stats-in">' +
    '<span class="st-stats-pill">Zakaj pri nas</span>' +
    '<p class="st-claim">' + parts.join(" ") + "</p>" +
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
