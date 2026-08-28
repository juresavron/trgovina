/**
 * STUDIO — chrome bar and footer (docs/STUDIO-BASELINE.md §4.1 / §4.12, and
 * the DOM transcription in docs/STUDIO-SECTIONS.md §0 / §11).
 *
 *   §0/§4.1   The header is a FIXED full-width bar at z-index 8. Inside it,
 *             one container capped at 1440px: logo left, a five-item nav with
 *             a 50px gap, two Ø36px icon discs right. The bar is
 *             PADDING-DRIVEN — 16px above and below a single 24px label line
 *             — which is where --chrome-h comes from.
 *   §11/§4.12 Dark footer: a giant wordmark at a LIGHTER weight than the
 *             bar's, a newsletter block whose input is a bare bottom rule with
 *             an arrow at its right end, a brand blurb with three circular
 *             contact rows, three link columns, a hairline, the legal line.
 *
 * Provenance: where the measured (screenshot) pass and the transcribed pass
 * disagree, the TRANSCRIPTION wins — that is the rule docs/STUDIO-BASELINE.md
 * §0 sets, and it is why the icon discs are 36px rather than the measured 46,
 * why they sit on a white alpha rather than a #2A2A2A disc, why the nav gap is
 * exactly 50px rather than a clamp, and why the footer's link columns are
 * spaced from the transcribed 24px rather than the measured ~66px. Each of
 * those is flagged where it is set. (The link columns now sit at 24 + 8 = 32px:
 * a TARGET floor is the one thing that outranks the transcription, and the
 * eight is the clear space two 44px targets need between them. See
 * .st-foot-col ul.)
 *
 * Type does not interpolate: tokens.ts sets every role per breakpoint tier
 * (≥1200 / 810–1199 / ≤809), so a size is a token lookup, never a clamp, and
 * the measured numbers land on ramp rungs instead of reproducing themselves —
 * the bar's wordmark read ~28 and is h6 (24/19/22), the nav read 15 and is
 * label (14), the footer's link columns read 19 and are label too. One display
 * outlier still clamps (see .st-foot-mark) because it runs past the ramp.
 *
 * Token discipline: colors, radii, gutters, chrome height and every type value
 * — face, size, weight, tracking, leading — are var(--…) from tokens.ts. This
 * module declares exactly ONE variable of its own, --st-tap, and it is not a
 * source value: the source ships 36px discs and bare 24px nav lines, i.e. tap
 * targets under the 44px floor this project holds itself to. --st-tap is that
 * floor, declared once because both chromes hang off it. Every selector is
 * scoped to :root[data-theme="studio"] because the sheet is shared with the
 * other three themes.
 */

import { esc, type RenderCtx } from "../../render/sections";
import { brandMark } from "./brand";
import { basketIcon, contactIcon as icon, mailIcon, type IconKey } from "./icons";
import { isSet, isSetPhone, isSetVat, isSetZip } from "../../lib/filled";


export const STUDIO_CHROME_CSS = `
  /* THE ONE LOCAL VARIABLE. --studio-gutter, --chrome-h, --chrome-line,
   * --chrome-pad-y, --chrome-nav-gap, --on-invert-* and every type value live
   * in tokens.ts; a second copy at equal specificity meant sheet order, not the
   * spec, decided the value.
   *
   * --st-tap is not one of those: it is OURS. The source's discs are 36px and
   * its nav items are the bare 24px line, so every control in both chromes
   * ships under the 44px pointer target this project holds itself to. Rather
   * than inflate the source's geometry — which would grow the bar past
   * --chrome-h and break the hero's viewport math — the visual size stays and
   * the TARGET is grown around it (see .st-chrome-btn::before and the
   * block-size/margin-block pairs below). One number, nine users, so it is
   * declared once. */
  :root[data-theme="studio"] { --st-tap: 44px; }

  /* Visually hidden, permanently — the newsletter field's label wears it.
   * (The skip link is NOT this: it hides by off-screen position so it can
   * come back on focus — see .st-skip.) clip-path over the old clip-rect
   * hack: it survives transforms and does not leave a 1px scroll artefact. */
  :root[data-theme="studio"] .st-vh {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }

  /* ---- chrome bar ----
   * The source's header is FIXED and TRANSPARENT, overlaying the page:
   * its container is position:fixed; z-index:8; top:0; left:0; width:100%
   * and the header itself carries background-color: rgba(0,0,0,0). We had
   * built a solid dark bar in normal flow, which is the single most visible
   * structural difference between the port and the source — the hero is meant
   * to run full-bleed underneath it.
   *
   * The opaque ground is ours, not the source's. A transparent bar is only
   * legible over art direction that guarantees a dark top edge; the source gets
   * that from its own photography, but these shops take customer-supplied
   * product photos and cannot. It is the difference between replicating the
   * design and shipping its fragility. */
  :root[data-theme="studio"] .st-chrome {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 8;
    background: var(--ink-invert);
    color: var(--on-invert);
  }
  /* A fixed bar occupies no space in flow, so every page reserves it.
   *
   * EXCEPT over a full-bleed hero, which is what the source does: the
   * photograph runs under the nav and the section owns the whole viewport. A
   * previous revision tried this and reverted it, correctly at the time — the
   * first section was then the offer triptych, whose left panel is light, and
   * white nav type on it measures 2.5:1. It is safe now because the section
   * that opts in is a photograph under a veil that is darkest exactly where
   * the bar sits.
   *
   * Opt-in, not automatic: <main data-bleed> says "the first thing in here
   * paints its own dark ground behind the bar". Any page without it keeps the
   * reservation. Where :has() is unsupported the bar simply stays solid and
   * the hero starts below it — the page is plainer, never broken.
   *
   * This reservation is ONLY correct while the bar is exactly --chrome-h tall,
   * which is what pdp.ts offsets its sticky bar by. The single-row bar below
   * is pinned to it; the two-row phone bar is not, and re-states this at that
   * breakpoint. */
  :root[data-theme="studio"] main { padding-top: var(--chrome-h); }
  :root[data-theme="studio"] main[data-bleed] { padding-top: 0; }
  /* A SECTION THAT OPENS A RUN PAYS THE RHYTHM ON TOP AS WELL.
   *
   * Every section on the page's own white ground pays it on the bottom only
   * (see --studio-rhythm), which is right for a neighbour that has one above
   * it and wrong for the first one on a page — that one would start flush
   * against the bar or the ticker. The source does the same thing the same
   * way: its opening band is "170px 0" while the ones after it are
   * "0 40px 170px".
   *
   * The hero is excluded because it is full-bleed by construction and the bar
   * floats over it.
   *
   * AN INVERTED BAND ENDS A RUN, so the section after one opens a new one and
   * pays the same way. There are two — the wordmark band and the testimonial
   * band — and both paint their own ground edge to edge, so the section below
   * inherits nothing from them: measured on the home page, .st-band ended at
   * 5080 and .st-imp began at 5080 with no top padding at all, leaving the
   * heading about 45px under a hard black edge on a page whose rhythm is 170.
   * A colour change is a separator, but it is not a substitute for the space
   * every other section boundary gets. */
  /* ⚠️ .st-tst IS NOT IN THIS LIST ANY MORE, and that is the fix for the
   * largest hole on the home page.
   *
   * The rule exists for sections that paint their own ground edge to edge and
   * therefore hand the next section no space at all — the marquee and the
   * dark band. .st-tst is not one of those: it pays the rhythm on BOTH sides
   * itself (editorial.ts). Matching it here added a second 170px on top of
   * the 170px it had already paid, so every .st-tst boundary opened a 340px
   * gap, and the one before the guides section measured 447px of nothing.
   *
   * Measured on the home page at 1440: eight boundaries over 200px, the four
   * worst of them all downstream of this doubling. */
  :root[data-theme="studio"] main > section:first-child:not(.st-hero),
  :root[data-theme="studio"] .st-mq + section,
  :root[data-theme="studio"] .st-band + section {
    padding-top: var(--studio-rhythm);
  }
  /* THE SCROLLED STATE. The bar is fixed, so it outlives the hero: 600px down
   * the home page a bare transparent bar floats over whatever band is there —
   * first the dark intro, where its type lands ON the section's own type, and
   * then the white panels, where white nav on a white ground is 1:1 and the
   * wordmark is the half-vanished logo of the owner's screenshot.
   *
   * So transparency is EARNED, not granted: only a browser that can hand the
   * ground back on scroll gets a transparent bar at all. The hand-back is a
   * scroll-driven animation — no script, so it holds with JS off — and it
   * animates background-color ONLY, so the bar never changes height and can
   * shift nothing (CLS 0). Where animation-timeline is unsupported the bar
   * keeps its solid ground over the hero too: plainer, never broken — the
   * same trade the :has() note above already makes for that selector.
   *
   * 120px, a bare number for the same reason the -10px pulls are: mechanics,
   * not a design value. The constraint it satisfies: the fade must COMPLETE
   * while the bar is still inside the hero scrim's own guaranteed-dark band —
   * hero.ts's top gradient runs out at 22% of a full-viewport hero, ~200px —
   * because mid-fade the contrast floor is carried by veil and scrim
   * TOGETHER. Fully solid by 120px of scroll, the bar (56px tall) never shows
   * a half-veil over anything past ~176px of photograph, so the nav's
   * measured ≥4.5:1 cannot dip even over a pale frame. Linear, because
   * progress IS scroll position: nothing moves that the reader did not move,
   * which is why this animation is exempt from the prefers-reduced-motion
   * strip at the end of the sheet — freezing it would re-open the
   * white-on-white failure it exists to close. */
  @supports (animation-timeline: scroll()) {
    :root[data-theme="studio"]:has(main[data-bleed]) .st-chrome {
      animation: st-chrome-ground linear both;
      animation-timeline: scroll();
      animation-range: 0 120px;
    }
    @keyframes st-chrome-ground {
      from { background-color: transparent; }
      to { background-color: var(--ink-invert); }
    }
  }
  /* (A comment about the QA switcher's top-strip offsets stood here; the
   * switcher itself is gone — see "NO OVERRIDES, AND NO SWITCHER" in
   * worker.ts — and the offset rules it described were removed with it.) */

  :root[data-theme="studio"] .st-chrome-bar {
    /* Cap, centring and gutter come from layout.ts's one container rule. */
    /* The source's header box, verbatim: 16px block padding around a single
     * 24px label line (8px at the small tier). The row is an EXPLICIT
     * --chrome-line track rather than an auto one, which is what holds the two
     * together: the wordmark's h6 line box is 32px and the icon disc is 36px,
     * so an auto row would be sized by them and the bar would come out at 68px
     * — which is, in fact, how tall the source's own header really renders.
     * We cannot afford that here. --chrome-h is a published number: hero.ts
     * takes it out of 100svh and main reserves it above. So the track is fixed
     * at the label line, the two oversized children are centred and bleed into
     * the padding, and the bar measures exactly --chrome-h. The cost is 10px
     * of clearance around the disc instead of 16px, which is invisible; the
     * alternative was a bar whose height no other module could predict. */
    padding-block: var(--chrome-pad-y);
    display: grid;
    /* 1fr | auto | 1fr keeps the nav optically centred on the VIEWPORT even
     * when the wordmark and the icon cluster differ in width. Both 1fr tracks
     * floor at their content, so the auto (nav) track is the one that gives
     * when a long shop name meets a long menu — see .st-chrome-nav. */
    grid-template-columns: 1fr auto 1fr;
    grid-template-rows: var(--chrome-line);
    align-items: center;
    column-gap: var(--gap-lg);
  }

  /* The logotype takes h6 (24/19/22) — the display ramp's smallest rung and the
   * nearest to the measured ~28px; h5 (32) would out-scale a 56px bar.
   *
   * It is a link, so it is also a target: --st-tap tall, pulled back by half
   * the difference ((24 − 44) ÷ 2 = −10px) so the 44px box grows symmetrically
   * around the 24px line without changing what the line contributes to layout.
   * The same pair appears on every other link in this bar. */
  /* CATEGORY SMALLER, BRAND FULL SIZE. The wordmark is two halves doing two
   * different jobs — "Masažni bazeni" is the keyword, "Vrelec" is the name —
   * and set identically the eye reads one long phrase instead of a
   * signature.
   *
   * THE HIERARCHY IS SIZE, AND THAT CHOICE WAS FORCED TWICE.
   *
   * Colour was tried first, muting the category to --on-invert-mute. It
   * measures 8.42:1 on the solid bar and the audit still failed it: at 390px
   * the bar is TRANSPARENT over the hero at rest, so that half of the
   * wordmark sits on a photograph, and only white was ever verified against
   * that ground. A mute rung with a fifth of white's headroom is not
   * something to put over an image nobody has seen.
   *
   * Weight was the next idea and is unavailable: the display face ships as
   * Chivo 500 alone, so a second weight would be synthesised by the browser
   * — a faux bold, in the wordmark, which is the last place to accept one.
   *
   * Size is independent of both. Every run stays --on-invert, so contrast is
   * exactly what it was before the brand existed, and the lockup still reads
   * name-first. */
  /* ONE NAME, ONE SIZE. The two spans are halves of a single wordmark, not a
   * title and a subtitle, so setting them at different sizes made the lockup
   * read as two things stacked rather than as one name. Hierarchy comes from
   * the break and the mark now, which costs nothing and cannot go wrong on a
   * ground nobody has measured. */

  /* THE FOOTER SIGNATURE STACKS, DELIBERATELY.
   *
   * The footer sets the wordmark at 108px, which fitted while the shop was
   * called "Masažni Bazen". "Masažni bazeni Vrelec" does not: measured at
   * 1440 it was 748x230 — two lines — and the break fell MID-PHRASE, so the
   * mark stood beside a lone "MASAŽNI" and "BAZENI VRELEC" ran underneath
   * it. An accidental break inside the category is the worst of both
   * layouts.
   *
   * So the break is chosen rather than suffered: the mark and the category
   * take the first line, the name takes the second at full size. That is
   * what a signature does anyway — says the category quietly and the name
   * loudly — and it means the lockup gets narrower as the viewport does
   * instead of finding a new place to break.
   *
   * flex-basis on the brand is what forces it: a 100% basis cannot share a
   * line, so the wrap lands between the two halves and nowhere else. */
  :root[data-theme="studio"] .st-foot-mark {
    /* display:flex is what makes any of this work. The element is a <p>, so
     * the first version of this rule set flex-wrap, align-items and a
     * flex-basis on a BLOCK container and every one of them was inert — the
     * spans went on flowing inline and the 108px name simply sat after the
     * 28px category on one line, overflowing its own box by 34px. */
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    row-gap: clamp(2px, 0.4vw, 8px);
  }
  /* Both lines at the wordmark's own size — see the header rule above. The
   * SIZE of that wordmark is what changes instead: the longest line is now
   * "MASAŽNI BAZENI" rather than "VRELEC", so the type has to be small
   * enough for the longer of the two to fit the column. Measured rather than
   * guessed; the clamp below is the largest that keeps line one intact from
   * 1440 down to 320. */
  :root[data-theme="studio"] .st-foot-mark > span:last-of-type {
    flex-basis: 100%;
  }
  /* The space between the halves has no job once they are on two lines. */
  :root[data-theme="studio"] .st-foot-mark .st-mark-gap { display: none; }
  /* The glyph pairs with the small category line, not with the 108px name. */
  :root[data-theme="studio"] .st-foot-mark .st-brand-mark {
    inline-size: 0.86em;
    block-size: 0.86em;
    margin-inline-end: 0.24em;
    transform: none;
  }
  /* ⚠️ THIS BLOCK EXISTED TWICE. An older copy sat directly below with
   * a font-size of 0.26em still on the first span, and being later it won —
   * so the footer went on setting "MASAŽNI BAZENI" at a quarter the size of
   * "VRELEC" long after that was changed, and the change looked like it had
   * simply not worked. The duplicate is deleted; if the two lines ever need
   * different sizes again, edit THIS rule rather than adding a second one. */

  /* Two type sizes on one line have to sit on ONE baseline, and baseline is a
   * property of the FLEX LINE, not of a single item: align-self on the small
   * run alone left it aligned to a line whose other items were still
   * centred, so it floated above the brand and the lockup read as two
   * separate labels. The container aligns the line; the glyph, which has no
   * text baseline of its own, is centred back. */
  :root[data-theme="studio"] .st-foot-mark {
    align-items: baseline;
  }
  :root[data-theme="studio"] .st-brand-mark { align-self: center; }
  /* The lockup: mark, optical gap, words. The mark takes its size from the
   * wordmark's own cap height rather than a fixed px, so the two stay locked
   * as the bar retiers. */
  :root[data-theme="studio"] .st-brand-mark {
    flex: none;
    inline-size: 1.16em;
    block-size: 1.16em;
    margin-inline-end: 0.46em;
    /* Optical, not geometric: a solid square sits visually high against caps. */
    transform: translateY(0.045em);
  }
  :root[data-theme="studio"] .st-chrome-mark {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    /* min-, for 200% text-only zoom — see .st-chrome-tel. */
    min-block-size: var(--st-tap);
    margin-block: -10px;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    text-transform: uppercase;
    text-decoration: none;
    /* ONE white word: studio drops the accent split the other themes use. */
    color: var(--on-invert);
    white-space: nowrap;
  }
  /* THE ONE FOCUS RING FOR TEXT LINKS ON DARK, stated once for both chromes.
   *
   * 2px --on-invert is 18.3:1 on this ground; the base sheet's --acc ring is a
   * per-shop hue that has only ever been verified against the white page, and
   * a ring nobody can see is the same as no ring.
   *
   * INSET (−2px) rather than offset, for one reason that applies to all four:
   * the bar's nav is a scroll container, and an outline drawn outside a box
   * that exactly fills its scroll port is clipped on both edges. The others
   * join it so the whole theme's text links focus identically. Each of these
   * boxes is --st-tap tall around a 20–24px line, so an inset ring still sits
   * clear of the letterforms. */
  :root[data-theme="studio"] .st-chrome-mark:focus-visible,
  :root[data-theme="studio"] .st-chrome-nav a:focus-visible,
  :root[data-theme="studio"] .st-chrome-tel:focus-visible,
  :root[data-theme="studio"] .st-foot-col a:focus-visible {
    outline: 2px solid var(--on-invert);
    outline-offset: -2px;
    border-radius: var(--r-ctrl);
  }
  /* And the one for circular icon controls: same ink, drawn OUTSIDE, because a
   * ring inset into a 36–44px disc lands on the glyph. --r-pill so the base
   * sheet's square 4px ring cannot square off a circle mid-focus. */
  :root[data-theme="studio"] .st-chrome-btn:focus-visible,
  :root[data-theme="studio"] .st-news-go:focus-visible {
    outline: 2px solid var(--on-invert);
    outline-offset: 3px;
    border-radius: var(--r-pill);
  }

  /* The halves are separate spans around a real space, so the accessible name
   * is "Masažni Fotelj" rather than the nonsense token "MasažniFotelj".
   *
   * The space is TIGHT BUT PRESENT, not zero. The source brand is a single
   * word (FURNEXA), so closing the join exactly was right there and wrong
   * here: every shop on this network has a two-word name, and set solid they
   * read as a typo ("MASAŽNIFOTELJ") rather than as a logotype.
   *
   * The gap is an inline-block of explicit width rather than a scaled space
   * glyph: at 0.25em the space rendered under 2px and the words still ran
   * together. Width is set here so the mark's spacing does not depend on how
   * wide the face happens to draw U+0020.
   *
   * The two bare numbers below are mechanics, not type: the width IS the gap,
   * and letter-spacing:0 stops the mark's own tracking being added to it.
   * Both display roles the mark uses track at 0em today, so the reset is
   * belt-and-braces — it keeps the gap fixed if either rung ever tracks. */
  :root[data-theme="studio"] .st-mark-gap {
    display: inline-block;
    /* The bar's mark is a flex container (it has to be, to hold a 44px target
     * around a line box whose height changes per tier), which makes this gap a
     * flex item and therefore shrinkable. It must not shrink: it IS the word
     * space, and a squeezed one puts the two words back together. Inert in the
     * footer, where the mark is a paragraph. */
    flex: none;
    inline-size: 0.3em;
    font-size: inherit;
    letter-spacing: 0;
    overflow: hidden;
  }

  /* Nav gap is --chrome-nav-gap, one value at every width, not a clamp.
   * (It is 24px and NOT the source's 50 — tokens.ts carries the whole
   * arithmetic for why a five-item menu's gap does not fit a seven-item
   * one.)
   *
   * It is also the bar's shock absorber. The nav is the only element here that
   * can lose width without losing meaning, so it is a scroll container at every
   * width: min-inline-size:0 lets the auto grid track shrink past max-content,
   * and the overflow is a swipeable/arrow-scrollable rail rather than a menu
   * that runs off the page. With the SEVEN-item menu and the 24px gap the
   * rail is live below ~1300 and whole from 1360 up (the 1500 tel threshold
   * is sized off the same arithmetic — see that rule). Either way the point
   * holds: the page must never scroll sideways.
   *
   * The padding/margin pair is the same device as the links: it opens 10px of
   * room inside the SCROLL PORT so the 44px link boxes are not clipped by the
   * overflow, while the nav still contributes only the 24px line to the row. */
  :root[data-theme="studio"] .st-chrome-nav {
    /* ⚠️ STRETCH, NOT CENTRE — and min-inline-size:0 does NOT substitute
     * for it, which is why the rail ran under the buttons for a whole band.
     *
     * justify-self:center sizes a grid item to fit-content, and fit-content
     * is min(max-content, max(MIN-content, available)). Every label in here
     * is white-space:nowrap, so the flex row's min-content is its whole
     * 662px — larger than the 587px track it was given at 1280 — and
     * fit-content therefore resolved to 662 and overflowed. min-width:0
     * lifts the minimum CONSTRAINT; it does not make the content narrower,
     * so it never touched this. Measured at 1280: the rail ended at 1027 and
     * the action cluster began at 1013, i.e. KONTAKT printed under the
     * enquiry button. (Before the phone joined that cluster the same overlap
     * fell on the phone disc instead, which is how it survived: a label
     * crossing a 36px circle reads as tight spacing.)
     *
     * Stretched, the item is exactly its track and the overflow becomes what
     * it was always meant to be — the fade-masked scroll rail below. The
     * centring is not lost: it was never this property's job. The template
     * is 1fr auto 1fr, so the TRACK is centred, and the item now fills it. */
    justify-self: stretch;
    display: flex;
    align-items: center;
    gap: var(--chrome-nav-gap);
    min-inline-size: 0;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scrollbar-width: none;
    padding-block: 10px;
    margin-block: -10px;
  }
  :root[data-theme="studio"] .st-chrome-nav::-webkit-scrollbar { display: none; }

  /* THE RAIL HAS TO SAY IT IS A RAIL.
   *
   * Measured at 390px: the five items plus the rail's own gutters draw 561px
   * into a 390px port, so 171px of the menu — KONTAKT entirely, and "DOSTAVA
   * IN MONTAŽA" from its second word on — sat outside it, and 3 of 5
   * destinations WERE the menu as far as a reader could tell. Nothing on the screen said otherwise: the scrollbar
   * is hidden above (a 15px grey trough across a 24px label line is not what
   * the bar is for), so the only cue was a label stopping mid-word at the
   * screen edge, which reads as a clipping bug rather than as an invitation.
   *
   * A MASK, not an overlay gradient, and the reason is st-chrome-ground: over
   * a full-bleed hero this bar is TRANSPARENT until 120px of scroll, so a
   * gradient painted in --ink-invert would smear a dark wedge across the
   * photograph at rest. A mask fades the rail's own ink to nothing over
   * whatever ground happens to be behind it, at any scroll position.
   *
   * 40px is the fade width — mechanics, not a design value: wide enough that
   * a whole glyph is visibly dissolving rather than a letter looking cropped,
   * narrow enough that it never reaches the second-to-last item.
   *
   * scroll-padding keeps a keyboard out of it: without it, tabbing to a link
   * scrolls that link flush against the port edge, i.e. under the fade. */
  :root[data-theme="studio"] .st-chrome-nav { scroll-padding-inline: 40px; }

  /* AND THE FADE RETREATS AS THE READER SPENDS IT.
   *
   * A static fade is honest at rest and wrong at the end of the rail, where
   * it dims the last item although nothing follows it. A scroll-progress
   * timeline fixes that with no script: the mask interpolates from
   * "trailing edge faded" at scroll 0 to "leading edge faded" at scroll end,
   * so mid-rail both edges are half-faded — which is exactly what is true
   * there. Four stops in both keyframes so the two edges interpolate
   * independently; two would have cross-faded the left edge into the right.
   *
   * IT IS ALSO THE OVERFLOW TEST. A scroll timeline whose scroller has no
   * inline overflow is INACTIVE, and an animation on an inactive timeline
   * applies nothing — so the nav is masked only where the nav actually
   * scrolls. That is what lets this rule stand outside the media query and
   * cover the 900–1200 band, where a long shop name can push the desktop bar
   * into its rail (measured: no mask at 1024, 1099, 1440 or 1920 with this
   * menu, mask at 390).
   *
   * Exempt from the prefers-reduced-motion strip at the end of the sheet, for
   * the same reason st-chrome-ground is: progress IS scroll position, nothing
   * moves that the reader did not move, and freezing it would put the fade
   * back over the last item permanently. */
  @supports (animation-timeline: scroll()) {
    :root[data-theme="studio"] .st-chrome-nav {
      animation: st-nav-edges linear both;
      animation-timeline: scroll(self inline);
    }
    @keyframes st-nav-edges {
      from {
        -webkit-mask-image:
          linear-gradient(to right, #000 0, #000 0, #000 calc(100% - 40px), transparent 100%);
        mask-image:
          linear-gradient(to right, #000 0, #000 0, #000 calc(100% - 40px), transparent 100%);
      }
      to {
        -webkit-mask-image:
          linear-gradient(to right, transparent 0, #000 40px, #000 100%, #000 100%);
        mask-image:
          linear-gradient(to right, transparent 0, #000 40px, #000 100%, #000 100%);
      }
    }
  }
  :root[data-theme="studio"] .st-chrome-nav a {
    position: relative;
    display: inline-flex;
    align-items: center;
    /* A target is two dimensions. The height comes from --st-tap with the line
     * pulled back out of layout; the width usually comes free from the label,
     * but the short ones (MIZE, KADI) draw ~41px, so the box floors at --st-tap
     * and centres the word in it. Floor rather than padding: padding would have
     * to be cancelled by a negative margin to keep the 50px gap true, and that
     * puts part of the target outside the scroll port, where it is not
     * clickable. */
    min-inline-size: var(--st-tap);
    /* And never SMALLER than the word. Setting a min-inline-size silently
     * replaces flex's own automatic minimum — the one that normally stops a
     * flex item shrinking past its own content — so with the 44px floor set,
     * every link became free to squash to exactly 44px. At 390px all five
     * did: "Dostava in montaža" was drawn in a 68px box and ran straight
     * through its neighbours, on every page of the site. The nav is already a
     * scroll port (overflow-x: auto); it simply had nothing to scroll,
     * because the items had shrunk to fit. */
    flex: 0 0 auto;
    justify-content: center;
    /* min-, for 200% text-only zoom — see .st-chrome-tel. */
    min-block-size: var(--st-tap);
    margin-block: -10px;
    /* Label role — 14px DM Sans, uppercase, tracked 0.06em. Its 1.71em leading
     * is exactly the 24px --chrome-line that --chrome-h is derived from, so the
     * nav is the thing that makes the bar's height come out right. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label);
    text-transform: uppercase;
    text-decoration: none;
    white-space: nowrap;
    /* Full on-invert, not the muted rung: 14px tracked caps on #151515 needs
     * every point of contrast it can get. */
    color: var(--on-invert);
  }
  /* THE UNDERLINE. The source draws it as a real child element —
   * div [Underline], position:absolute; bottom:0; left:0; height:1px; white —
   * that its runtime animates from width:0 to width:100%. It is not a
   * text-decoration, and the border-bottom that used to stand in here missed
   * the whole gesture: a border can only appear, it cannot grow.
   *
   * Reproduced as a pseudo-element on the label span, which is that child with
   * no extra DOM, and grown with scaleX rather than width. Identical for a
   * 1px bar, but width animates on the layout thread every frame while a
   * transform stays on the compositor — and the source's own resting state is
   * an inline transform:scale(0), so this is its technique, not a substitute
   * for it. transform-origin:left is what makes it grow left-to-right instead
   * of opening from the middle.
   *
   * It rides on the SPAN, not the link: the link is 44px tall for the tap
   * target, so bottom:0 there would hang the rule 10px below the word. */
  :root[data-theme="studio"] .st-chrome-nav a > span {
    position: relative;
    display: block;
  }
  :root[data-theme="studio"] .st-chrome-nav a > span::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    block-size: var(--bw-line);
    background: currentColor;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  :root[data-theme="studio"] .st-chrome-nav a:hover > span::after,
  :root[data-theme="studio"] .st-chrome-nav a:focus-visible > span::after {
    transform: scaleX(1);
  }
  /* WHERE YOU ARE: the page's own nav item rests with its underline already
   * full — the same device the hover grows, not a second vocabulary. The
   * attribute is SERVER-SET now (RenderCtx.path — each renderer states its
   * own canonical path, so the marker survives JS-off and is section-aware);
   * behaviour.ts's exact-match setter stays as a harmless fallback. */
  :root[data-theme="studio"] .st-chrome-nav a[aria-current="page"] > span::after {
    transform: scaleX(1);
  }

  :root[data-theme="studio"] .st-chrome-actions {
    justify-self: end;
    display: flex;
    align-items: center;
    /* 10px — the source's dominant micro gap, and its value here. */
    gap: var(--gap-sm);
  }
  /* Ø36px disc, 1px #ffffff1f hairline on a #ffffff14 fill — the transcribed
   * values, which retire the measured pass's Ø46px disc on solid #2A2A2A.
   * Round because it is an icon control, not a CTA: sharp corners are reserved
   * for buttons that carry a word (§3). --r-pill is the source's own 99px.
   *
   * The hairline is DECORATION, not the control's boundary: what identifies
   * this control is the white glyph at 18.3:1, so WCAG 1.4.11 is met by the
   * icon and the 1.2:1 ring is free to be as quiet as the source draws it. */
  :root[data-theme="studio"] .st-chrome-btn {
    position: relative;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: 36px;
    block-size: 36px;
    border-radius: var(--r-pill);
    border: var(--bw-line) solid var(--on-invert-24);
    background: var(--on-invert-16);
    color: var(--on-invert);
    text-decoration: none;
    transition: background-color 0.2s ease, border-color 0.2s ease;
  }
  /* The 36px disc is the source's; a 36px TARGET is not good enough. The hit
   * area is grown to --st-tap with a transparent overlay so the disc keeps its
   * drawn size — inset:-4px is (44 − 36) ÷ 2. It is a ::before, so it paints
   * beneath the count badge that follows it in the box tree, and both belong to
   * the same link either way. */
  :root[data-theme="studio"] .st-chrome-btn::before {
    content: "";
    position: absolute;
    inset: -4px;
  }
  :root[data-theme="studio"] .st-chrome-btn:hover {
    background: var(--on-invert-40);
    border-color: var(--on-invert-40);
  }
  /* The glyphs come from icons.ts and carry no chrome-local class, so the
   * sizing hangs off the element, not a class name. */
  :root[data-theme="studio"] .st-chrome-btn svg {
    inline-size: 18px;
    block-size: 18px;
  }

  /* THE PRIMARY ACT, WORDED. A filled control on the dark bar, so it reads as
   * the one thing to press rather than as a third icon; the disc's 36px
   * geometry survives underneath it, which is what lets the word be dropped
   * at ≤900 without the target changing size.
   *
   * ⚠️ IT MUST STAY BELOW .st-chrome-btn, and this is not a stylistic
   * preference. Both selectors are one attribute plus one class, so they tie
   * on specificity and SOURCE ORDER decides — declared above the disc, every
   * property they share (background, colour, border) lost, and the "filled
   * pill" was a wide translucent disc with white caps on it. The audit caught
   * it as a real WCAG failure: 14px white text over #ffffff14 on the dark bar
   * measures 4.17:1 against a 4.5 floor. Filled, it is #151515 on #ffffff and
   * ~19:1. Moving this block up again re-breaks both. Same for the :hover
   * pair, which has to outrank .st-chrome-btn:hover the same way. */
  :root[data-theme="studio"] .st-chrome-go {
    inline-size: auto;
    gap: var(--chrome-item-gap);
    padding-inline: clamp(14px, 1.1vw, 20px);
    border-color: var(--on-invert);
    background: var(--on-invert);
    color: var(--ink);
    /* .st-chrome-btn transitions background and border only — the discs never
     * change ink. This one does, so the property has to be added or the word
     * snaps while the fill fades. */
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-chrome-go span {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    white-space: nowrap;
  }
  /* The hero CTA's own hover, restated: the fill empties and the ink goes
   * white inside the ring it already had. This is the theme's one gesture for
   * a white pill on a dark ground, and the two controls now point at the same
   * place, so they should not move differently. A grey fill was tried first
   * (--on-invert-mute at 7.3:1 — legible, but a rung nothing else on the bar
   * uses, and muddy beside the white nav). Both states are white-on-#151515
   * or #151515-on-white; neither goes near the floor. */
  :root[data-theme="studio"] .st-chrome-go:hover,
  :root[data-theme="studio"] .st-chrome-go:focus-visible {
    background: transparent;
    color: var(--on-invert);
  }
  /* ≤900: back to the disc. The two-row bar has a 44px row to spend and a
   * scroll rail beside it; a worded pill there would crowd the phone. */
  @media (max-width: 900px) {
    :root[data-theme="studio"] .st-chrome-go span { display: none; }
    :root[data-theme="studio"] .st-chrome-go {
      inline-size: 34px;
      padding-inline: 0;
    }
  }

  /* Count badge: small white disc, black numeral (measured).
   *
   * Badges are the label role and the ramp has nothing below it, so the disc is
   * sized to the rung rather than the rung shrunk to the disc: 14px on
   * --lh-label-tight draws a 20px line box, so the disc is 20px and the numeral
   * sits in it exactly. Inventing a smaller size is the one thing this pass
   * exists to undo. */
  :root[data-theme="studio"] .st-chrome-badge {
    position: absolute; top: -4px; right: -4px;
    min-inline-size: 20px; block-size: 20px;
    padding-inline: 5px;
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: var(--r-pill);
    background: var(--bg);
    color: var(--ink);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    font-variant-numeric: tabular-nums;
  }
  /* An empty basket wore its badge anyway, so every page opened with a white
   * "0" riding the basket disc — the only numeral on the whole bar, reading
   * as a stray notification that never clears (it is the "superscript 0" of
   * the owner's screenshot). The honest zero STAYS in the DOM and in the
   * link's accessible name — "Košarica — 0 izdelkov" — where a count is
   * information; the disc alone waits until there is something to count.
   * data-st-cart-count is already the machine-readable count (the numeral and
   * the attribute are one value the integrator moves together), so the badge
   * shows itself the moment the count leaves zero, with no extra hook. */
  :root[data-theme="studio"] .st-chrome-badge[data-st-cart-count="0"] { display: none; }

  /* The phone number. OURS, not the source's, and it lives only on the two-row
   * phone bar: at ≥1200 the wordmark, a five-item menu and the icon cluster
   * already leave ~40px of slack inside the container, and a 150px number is
   * the thing that would push the menu into its scroll rail on every desktop.
   * Below 900px the bar has a second row to spend and a tap-to-call number is
   * worth more than a menu item. The footer states it at every width. */
  :root[data-theme="studio"] .st-chrome-tel {
    display: none;
    align-items: center;
    /* 8px — the source's icon-to-label gap inside a nav item. */
    gap: var(--chrome-item-gap);
    /* min-, so 200% text-only zoom grows the box instead of clipping the
     * line inside a fixed 44px — the footer's links state the same rule. */
    min-block-size: var(--st-tap);
    margin-block: -10px;
    /* A meta row in the bar, so the same label rung as the nav — both draw the
     * 24px line the bar is built on, and the number stays distinct from the
     * nav by weight of position, not by an off-ramp size. */
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label);
    text-decoration: none;
    color: var(--on-invert);
    white-space: nowrap;
  }
  :root[data-theme="studio"] .st-chrome-tel .st-ico { inline-size: 16px; block-size: 16px; }

  /* ≥1500: THE NUMBER JOINS THE BAR. Below 900 it earns its place because the
   * two-row bar has a row to spend; on a wide desktop the single row has slack
   * instead, and a shop selling by enquiry hides its phone number at exactly
   * the widths where showing it costs nothing.
   *
   * 1500 IS ARITHMETIC, NOT TASTE, and it has moved twice — 1360, then 1560,
   * now here — each time because one of the three things it adds up changed
   * size. What it adds up, at the tier where each is largest:
   *
   *   wordmark      338   "Masažni bazeni Vrelec" at h6, nowrap
   *   nav           662   seven labels ~518 + six 24px gaps
   *   cluster       345   number 151 + 10 + enquiry button 184
   *   column gaps    48   two, at --gap-lg
   *                -----
   *                 1393  against a container of min(1560, vw − 80)
   *
   * so the number needs 1473 of viewport and waits for 1500. The middle line
   * is the one that moved: the nav gap was 50px here until it turned out that
   * 50 is the SOURCE's gap for a FIVE-item menu and cost 156px we did not
   * have (tokens.ts). At 24 the row is 156px narrower and the number arrives
   * a whole tier earlier. Between 901 and 1499 the footer states it on every
   * page, and the PDP and contact page carry it above the fold.
   *
   * ⚠️ THE PIXEL AUDIT IS THIS BLOCK'S REGRESSION TEST. When 1560 was 1360,
   * the number sat ON "Kontakt" and the wordmark ran under "Trgovina", and
   * the gate reported the collisions as contrast failures of 1.13:1 and
   * 2.65:1 — which is what a layout bug looks like when only colour is being
   * measured. Re-run it after touching any of the four numbers above. */
  /* 1240–1499: THE NUMBER AS A DISC. The full number needs ~160px this band
   * does not have, but the shop sells by enquiry and this is the laptop band
   * — the header carrying no phone affordance at 1280px was the cost of an
   * earlier fit fix. A 36px disc in the mark's own two-disc vocabulary fits
   * from 1240 up. Icon-only, like ≤460: the aria-label and the title carry
   * the number, the tap carries the call.
   *
   * It sits INSIDE the action cluster now, beside the enquiry button, and
   * that is what stopped this band looking broken: as the bar's own child
   * the disc's 115px of collapse went to the 1fr tracks either side, so a
   * laptop saw menu, small circle, hundred-pixel hole, button. See the
   * markup. */
  /* ⚠️ NO FOURTH TRACK ANY MORE, and its removal is the fix.
   *
   * These two bands used to grow the bar's template to 1fr auto auto 1fr,
   * because the tel was the bar's own third child. That put a variable-width
   * element between the menu and the buttons, and in the disc band it varies
   * by 115px — which the two 1fr tracks then dealt out as a hole between the
   * disc and the enquiry button (measured at 1440: 1124 → 1216). The bar has
   * three groups, not four; the phone belongs to the third. See the markup.
   *
   * So the template stays 1fr / auto / 1fr at every width and all this band
   * does is SHOW the number. The :has() guard goes with the track it was
   * guarding: a bar with no phone set simply renders one fewer child in the
   * cluster, which needs no template of its own. */
  @media (min-width: 1240px) {
    :root[data-theme="studio"] .st-chrome-tel { display: inline-flex; }
  }

  /* The disc's own dress, in its band only. */
  @media (min-width: 1240px) and (max-width: 1499px) {
    :root[data-theme="studio"] .st-chrome-tel {
      inline-size: 36px;
      min-inline-size: 36px;
      border-radius: var(--r-pill);
      border: var(--bw-line) solid var(--on-invert-24);
      background: var(--on-invert-16);
    }
  }

  /* Skip link: off-screen until focused, then a white plate. Its corners are
   * --r-ctrl — 4px, the radius the transcribed source gives every control that
   * carries a word (§3), not the 0 an earlier reading had here; it is restated
   * on :focus-visible below because the base sheet's focus ring imposes its
   * own. Its ring is --acc rather than the primary ink — a black ring around a
   * white plate ON THE BLACK BAR is invisible, and the plate landing on the
   * page cannot be the only focus cue.
   *
   * 12px of padding on a 20px line is a 44px plate, so the first control on
   * every page is already at the target floor without help. */
  :root[data-theme="studio"] .st-skip {
    position: absolute; left: -9999px; top: 0; z-index: 50;
    background: var(--bg); color: var(--ink);
    /* It carries a word on a control, so it is a button label: the label rung,
     * tight leading, because the plate's height is its padding's business. */
    font-family: var(--f-label); font-size: var(--t-label);
    font-weight: var(--w-label); letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight); text-transform: uppercase;
    padding: 12px 20px; text-decoration: none;
    border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-skip:focus-visible {
    left: var(--studio-gutter); top: 8px;
    outline: 2px solid var(--acc); outline-offset: 2px;
    border-radius: var(--r-ctrl);
  }
  /* Focus target after the bar — never a visible box, never a focus ring. */
  :root[data-theme="studio"] .st-anchor { display: block; outline: none; }

  /* ---- §4.12 / §11 footer ----
   * Every text colour on this band is --on-invert (18.3:1) or --on-invert-mute
   * (#a4a4a4, 7.33:1). The white alphas below appear ONLY as rules and discs.
   * That split is the whole reason the palette has two vocabularies: a white
   * alpha reads as "quiet grey" to a designer and as 2.9:1 to a reader. */
  :root[data-theme="studio"] .st-foot {
    background: var(--ink-invert);
    color: var(--on-invert);
    overflow: clip;
    /* Source: 140px 40px 30px, retiered at 810 and at 1200. The inline halves
     * are --studio-gutter, so only the block values are stated here. */
    padding-block: 140px 30px;
  }
  /* The footer's measure is the bar's, which is every band's — layout.ts.
   * That is what starts the giant footer wordmark where the bar's starts. */

  /* Source: the footer's container is one column with an 80px gap between its
   * three blocks (top / bottom / copyright), 40px on a phone. */
  :root[data-theme="studio"] .st-foot-top {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    /* START, not end. The signature is short and the newsletter block is
     * tall, so bottom-aligning them left the row with its two halves
     * beginning 100px apart — the newsletter high on the right, the
     * signature floating near the floor on the left, and a hole between
     * them. Aligned at the top they read as one row. */
    align-items: start;
    gap: clamp(32px, 4vw, 80px);
    margin-bottom: var(--gap-3xl);
  }
  /* One column when the newsletter block is absent (a LIVE shop renders the
   * wordmark alone): a two-track grid with one child is half an empty row
   * still paying its bottom margin. */
  :root[data-theme="studio"] .st-foot-top:not(:has(.st-news)) {
    grid-template-columns: minmax(0, 1fr);
  }
  /* THE ONE SANCTIONED OUTLIER in this module. At ~150px it runs well past the
   * ramp's tallest rung (h1, 92px), so it keeps its clamp() and its 0.88
   * logotype leading: it is a poster-scale display device, not UI text, and
   * h1's 1.04em would open a wrapped shop name into two loose lines. Tracking
   * still comes from the ramp — --ls-h1, 0em. The weight is deliberately
   * LIGHTER than the bar's mark (§4.12 measures ~400 against the bar's 500),
   * which is the whole point of the device, so it takes --w-body on the
   * display face. */
  :root[data-theme="studio"] .st-foot-mark {
    font-family: var(--f-display);
    font-weight: var(--w-body);
    /* MEASURED, NOT CHOSEN. Both lines are the wordmark's own size now, so
     * the longest line is "MASAŽNI BAZENI" rather than "VRELEC" — half again
     * as many characters — and the type has to be small enough for the
     * LONGER one. Natural line-one width against the column it sits in, per
     * candidate:
     *
     *        1440      1200      1024
     *   7.5vw  1015/748  848/616  724/536   wraps at all three
     *   6vw     814/748  680/616  581/536   wraps at all three
     *   5vw     680/748  568/616  486/536   fits everywhere
     *
     * So 5vw — and the CEILING matters as much as the floor. At 1920 the
     * unclamped 5vw is 96px, which put line one back onto two lines on the
     * widest screens; 4.5rem holds it at the 72px that was measured to fit.
     * The floor came down from 2.2rem too: at 320px a 35px line one needs ~330px of a
     * 270px column, so the old minimum would have reintroduced the
     * mid-phrase break at the narrowest width — the one place nobody looks. */
    font-size: clamp(1.6rem, 5vw, 4.5rem);
    letter-spacing: var(--ls-h1);
    line-height: 0.88;
    text-transform: uppercase;
    color: var(--on-invert);
    /* A long shop name must wrap, never push the page sideways. */
    max-width: 100%; overflow-wrap: anywhere; hyphens: none;
  }

  /* The newsletter column sits at the RIGHT EDGE of the top row rather than
   * stretching across half the footer — that much is the source's, and so was
   * the 350px this rule capped it at.
   *
   * 350px is a FIELD measure, and this block holds a paragraph too. Measured
   * at every width above 900, the note under the input came out at exactly
   * 350px — 47 characters, a label's length for two sentences of prose, and
   * narrowest on the widest screens because the cap never moved. So the cap
   * that is stated is now the one that matters: 500px is 67 characters of
   * body type, inside the 45–75 band the rest of the site's running text is
   * set to. The input row takes the same width rather than keeping its own —
   * the source's device is a bare rule with an arrow at its end, and it is
   * that at 500px exactly as it is at 350.
   *
   * The cap is also what stops the note running the footer's whole width once
   * the top row stacks: 718px, 96 characters, measured at 768 before it. */
  :root[data-theme="studio"] .st-news {
    justify-self: end;
    inline-size: 100%;
    max-inline-size: 500px;
  }
  /* The footer's one block heading. h3 is the nominal rung for a sub-section
   * heading, but 48px next to a 150px wordmark reads as a second section
   * opening rather than a label over a single input row; h5 (32/26/24) is the
   * rung nearest the measured 28 and keeps it the size of what it heads. */
  :root[data-theme="studio"] .st-news-h {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--on-invert);
    margin-bottom: var(--gap-xs);
  }
  /* A bare bottom rule, no box — the source's input has no border at all until
   * focus, when it grows one on the bottom edge only.
   *
   * The rule is --on-invert-mute (7.33:1), NOT a white alpha. This line is the
   * only thing that says "there is a field here", which makes it the control's
   * boundary, which WCAG 1.4.11 holds to 3:1 — and the alphas top out at 2.9:1.
   * They stay where they belong: the hairline under the columns and the discs
   * around the contact icons, neither of which carries that job. */
  :root[data-theme="studio"] .st-news-row {
    display: flex; align-items: center; gap: 12px;
    border-bottom: var(--bw-line) solid var(--on-invert-mute);
  }
  :root[data-theme="studio"] .st-news-in {
    flex: 1 1 auto; min-width: 0;
    background: transparent; border: 0;
    /* Source: 12px 0. With the 1.625em body line that is a 50px field, so the
     * input clears the 44px floor on its own. */
    padding: 12px 0;
    /* What a reader types is prose, so body. The face and weight are stated
     * rather than inherited: a form control takes neither from the page. */
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-news-in::placeholder { color: var(--on-invert-mute); }
  /* The row is not wired yet (see renderStudioFooter), so both controls ship
   * disabled. They must still LOOK like the source's device — an underlined
   * field with an arrow chip — while reading as unavailable rather than broken.
   *
   * Contrast does not get a holiday for being disabled. WCAG exempts inactive
   * components, but a greyed-out control nobody can read is still a control
   * nobody can read, so the text and the glyph stay on --on-invert-mute
   * (7.33:1) and only the RING drops to a decorative alpha. The state is
   * carried by that ring and by the glyph stepping down from --on-invert, not
   * by an opacity that would take the copy below the floor with it — which is
   * why opacity is pinned to 1 and the fill colour set explicitly (Safari
   * greys disabled text by itself otherwise). */
  :root[data-theme="studio"] .st-news-in:disabled {
    color: var(--on-invert-mute);
    -webkit-text-fill-color: var(--on-invert-mute);
    opacity: 1;
    cursor: not-allowed;
  }
  /* Kept for the wired-up future: the input ships disabled pre-live, so this
   * cannot match today — it is the focus state the field takes the day the
   * newsletter goes live, not dead code to re-derive then. */
  :root[data-theme="studio"] .st-news-in:focus-visible {
    outline: 2px solid var(--on-invert); outline-offset: 6px; border-radius: var(--r-ctrl);
  }
  /* Round arrow — a chip, not a CTA (§3) — at the right end of the rule. 44px
   * because it is a control, which is 2px larger than the measured chip and
   * the cheapest 2px this module spends. */
  :root[data-theme="studio"] .st-news-go {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: var(--st-tap); block-size: var(--st-tap);
    border-radius: var(--r-pill);
    /* Its outline IS its boundary — no fill, no label — so 3:1 applies and the
     * muted rung is the one that clears it. */
    border: var(--bw-line) solid var(--on-invert-mute);
    background: transparent; color: var(--on-invert);
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
  }
  :root[data-theme="studio"] .st-news-go:hover:not(:disabled) {
    background: var(--on-invert); color: var(--ink);
  }
  :root[data-theme="studio"] .st-news-go:disabled {
    cursor: not-allowed;
    color: var(--on-invert-mute);
    border-color: var(--on-invert-24);
  }
  :root[data-theme="studio"] .st-news-go .st-ico { inline-size: 18px; block-size: 18px; }
  :root[data-theme="studio"] .st-news-note {
    margin-top: var(--gap-sm);
    /* Body, not the label rung the ramp gives captions: this is two sentences
     * of running prose, and 0.06em tracking on a sentence is a chip's job, not
     * a paragraph's. The muted rung, not a smaller size, is what marks it as
     * secondary to the field above it. */
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--on-invert-mute);
  }

  /* FOUR link columns, not the transcription's three.
   *
   * The transcription wins on MEASUREMENT, which is what §0's rule is about;
   * this is inventory. When those columns were drawn, all fifteen destinations
   * were one "v pripravi" stub, so twelve slots were plenty. They are real
   * pages now, and three columns of four left /o-nas out of the chrome
   * altogether and both collection pages — the two URLs that answer two
   * different queries — reachable only from the home page's own rail.
   *
   * The fourth column is free on a phone: at 2 columns the old three filled
   * three of four cells and left one blank (measured at 390px), so Podjetje
   * lands in a hole that already existed. Its cost is one grid track at
   * desktop, and that track is what the brand ratio below had to pay for.
   *
   * 2.6fr ON THE BRAND TRACK, NOT THE 1.5fr THIS SHIPPED WITH. The e-mail row
   * needs 229px and 1.5fr covered it — 318px at 1440 — but the blurb is a
   * PARAGRAPH in the same track, and 318px of body type is 42 characters
   * (47 at 1920, where the track reaches 354px). Running text is set to 45–75
   * characters everywhere else on this site. 2.6fr puts 459px under it at
   * 1440 and hits the blurb's own 42ch cap at 1920, while still leaving each
   * link column 176px — 29px more than the longest label ("Odstop od
   * pogodbe", 147px) needs.
   *
   * The ratio only works while there is width to divide: see the ≤1359 block,
   * which gives the brand its own row below the point where five tracks stop
   * fitting. */
  :root[data-theme="studio"] .st-foot-cols {
    display: grid;
    grid-template-columns: minmax(0, 2.6fr) repeat(4, minmax(0, 1fr));
    gap: clamp(32px, 3.4vw, 68px);
  }
  /* An ordinary paragraph — body, at the 42ch measure below (492px, 65
   * characters). The cap is what sets the blurb at every width from 600 up
   * now; above 1359 the brand grid track is what has to be wide enough to let
   * it, which is what the 2.6fr on .st-foot-cols is for. The 32px beneath it
   * is the source's gap between the blurb and the contact list. */
  :root[data-theme="studio"] .st-foot-blurb {
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--on-invert-mute);
    max-width: 42ch;
    margin-bottom: 32px;
  }
  /* align-items:flex-start, so each row is as wide as its own line rather than
   * as wide as the brand column. A stretched row made the e-mail link a 404px
   * target at 1440 (measured): two thirds of it was empty band that lit the
   * icon disc on hover and carried a focus ring the width of the column,
   * neither of which points at anything. Each row still clears the 44px floor
   * on its height and is ~230px wide, so nothing shrinks below a target. */
  :root[data-theme="studio"] .st-contacts {
    display: flex; flex-direction: column; align-items: flex-start;
    gap: var(--gap-md);
  }
  /* Contact rows are meta rows, so the label rung — mixed case, not uppercase:
   * an address and an e-mail are read, not scanned. Tight leading so a
   * wrapping street line stays one block against its disc. */
  :root[data-theme="studio"] .st-contact {
    display: flex; align-items: center; gap: 12px;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert);
    text-decoration: none;
  }
  /* Circular outlined disc. --st-tap, which is both §4.12's measured Ø44 and
   * the target floor — the disc is the tallest thing in the row, so sizing it
   * to the floor makes the whole row a compliant target with no overlay. The
   * ring may be a white alpha here because it is NOT this control's boundary:
   * the link is the row, and the row is a labelled line of text. */
  :root[data-theme="studio"] .st-contact-ico {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: var(--st-tap); block-size: var(--st-tap);
    border-radius: var(--r-pill);
    border: var(--bw-line) solid var(--on-invert-40);
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
  /* The label half of a contact row. An e-mail address is one unbreakable
   * token, so in the narrowest column this theme ships — the brand track at
   * 1200px — a longer address than this shop's would push the row past its
   * track. min-inline-size:0 lets it shrink and overflow-wrap lets it break;
   * without both, the overflow is silent (the band clips it) and the row
   * simply loses its end. */
  :root[data-theme="studio"] .st-contact > span:last-child {
    min-inline-size: 0; overflow-wrap: anywhere;
  }
  /* An unset company fact, marked rather than left to look like content.
   * page.ts's .st-page-todo does this job on the legal pages and cannot be
   * reused: its ink is --ink-soft, which is invisible on this band.
   *
   * The mark is QUIETER than the fact it stands in for, not louder. It began
   * as page.ts's uppercase, which works there — a lowercase-body value column
   * makes uppercase read as an annotation — and failed here: this band is
   * label-cased throughout, so five uppercase marks (two contact rows, three
   * imprint fields) shouted over every real word in the footer. The words
   * carry the meaning; --on-invert-mute (7.33:1) keeps them legible while
   * stepping the two white contact rows down to secondary. */
  :root[data-theme="studio"] .st-foot-todo {
    color: var(--on-invert-mute);
  }

  /* Column heading: an eyebrow over a list, so the label rung uppercase. The
   * ramp carries ONE label tracking (0.06em); the old 0.12em was measured, and
   * the wider setting is not somewhere the source goes. 24px under it is the
   * source's gap between a column's heading and its list. */
  :root[data-theme="studio"] .st-foot-col h2 {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label);
    text-transform: uppercase;
    color: var(--on-invert-mute);
    margin-bottom: var(--gap-lg);
  }
  /* 32px ROWS, AND THE 8px INSIDE THEM IS THE WHOLE POINT.
   *
   * The transcribed row gap is 24px (the measured pass read ~66px and this
   * module reproduced it; at 66 the columns ran a screen and a half tall and
   * the footer stopped being a footer — where the two passes disagree the
   * stylesheet wins, STUDIO-BASELINE §0). But 24px is also exactly what the
   * 44px target box below spends on its own overhang around a 20px label,
   * 12px each side, so at 24px two neighbouring targets tiled edge to edge:
   * measured 0px of clear space at 390/600/768 — and because the phone tier
   * closed the gap further, to 14px, a 10px OVERLAP there, where a tap
   * between two links necessarily hit one of them.
   *
   * 32px is 24 + 8: the overhang, plus the 8px of clear space this chrome now
   * holds every adjacent pair to. It is a rung the source uses (the frequency
   * count in tokens.ts finds 32px six times), and it costs a row 8px — the
   * labels read 52px apart instead of 50.4, which is nothing to the rhythm
   * and is the difference between two targets and one to a thumb.
   *
   * The li is a FLEX container so that arithmetic is true rather than
   * approximately true: as a list-item its height was the inherited BODY
   * strut (26.4px), not the 20px label line, so the real clearance drifted
   * with a font this rule never set — 6.4px at 1024 against −3.6px at 768,
   * from one declaration. A flex li is exactly its child's margin box. */
  :root[data-theme="studio"] .st-foot-col ul {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column;
    gap: 32px;
  }
  :root[data-theme="studio"] .st-foot-col li { display: flex; }
  /* The link columns are label too — same rung as the nav in the bar, which is
   * what makes the two chromes read as one system. Tight leading, and the same
   * 44px target device as the bar's links: a 20px line box grown to --st-tap
   * and pulled back by (20 − 44) ÷ 2 = −12px, so the label contributes its own
   * 20px to the column and the target reaches 12px past it top and bottom.
   * That overhang is what the 32px row gap above is sized around —
   * 32 − 2 × 12 = 8px of clear space between neighbouring targets, measured at
   * every width. */
  :root[data-theme="studio"] .st-foot-col a {
    display: inline-flex;
    align-items: center;
    /* MIN, not a fixed height. At 320px "Dostava in montaža" already wraps to
     * two lines (measured), which is 40px inside a 44px box — one line of
     * headroom left. A third line, from a 200% text zoom or a longer label in
     * another shop, would have overflowed a fixed box and landed on the row
     * below; a minimum grows instead and pushes its neighbours down. */
    min-block-size: var(--st-tap);
    margin-block: -12px;
    /* 6px of side padding, pulled straight back out. The shared focus ring is
     * INSET 2px (see the rule with the bar's links), and this box is exactly
     * as wide as its label — so the ring was landing on the last glyph of
     * every link. The padding gives it 6px to sit in, the negative margin
     * keeps the labels flush with the column heading above them, and the tap
     * target grows 12px wider on the way past. */
    padding-inline: 6px;
    margin-inline: -6px;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-decoration: none;
    color: var(--on-invert-mute);
    transition: color 0.2s ease;
  }
  :root[data-theme="studio"] .st-foot-col a:hover { color: var(--on-invert); }

  /* The hairline over the legal line. #ffffff1f is the source's own
   * rgba(255,255,255,.12) to the byte, and a divider is exactly what an alpha
   * this quiet is for. */
  :root[data-theme="studio"] .st-foot-rule {
    border: 0; height: var(--bw-line);
    background: var(--on-invert-24);
    margin-block: var(--gap-3xl) 30px;
  }
  /* Legal line: a meta row of company, VAT id and address, so the label rung.
   * Tight leading keeps it compact where it wraps to two lines on a phone. */
  :root[data-theme="studio"] .st-foot-legal {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert-mute);
    /* It is the longest single run of text on every page of the site, and it
     * had no measure at all — it ran the full width of the footer. The 70ch
     * that replaced that did far less than it reads: ch is the advance of
     * "0", which DM Sans draws at 0.69em, against an average of 0.47em across
     * this line's own mix of words, digits and separators. So 70ch is 676px,
     * and 676px HOLDS 92.5 characters — measured at 768 and up, where the
     * whole 87-character imprint therefore sat on one line, which is the
     * thing the measure was added to prevent.
     *
     * 56ch is 541px is 74 characters: inside the 45–75 band the rest of this
     * site's running text is set to, and it breaks the imprint into two lines
     * of about 44. Kept in ch rather than px so it follows the label rung if
     * that ever retiers — the arithmetic above is why the number is not the
     * character count. */
    max-inline-size: 56ch;
  }
  /* A segment wraps as a unit, so a separator can start a line but never end
   * one. Safe to forbid internal wrapping: the longest segment ("· Sedež: "
   * plus a street address) runs ~38ch against the line's 56ch measure. */
  :root[data-theme="studio"] .st-foot-seg { white-space: nowrap; }

  /* ---- back to top ----------------------------------------------------
   * Hidden is the RESTING state and script is what earns the reveal — a
   * visitor with no JS simply never sees a convenience, which is the right
   * direction to fail. The first draft drove this from a scroll() timeline
   * with an animation-range and measured differently on identical runs;
   * a class flipped by the behaviour script is boring and always true.
   * visibility rides along so the hidden disc is inert to tab and tap. */
  :root[data-theme="studio"] .st-top {
    position: fixed;
    inset-block-end: 18px;
    inset-inline-end: 18px;
    z-index: 40;
    display: grid;
    place-items: center;
    inline-size: var(--st-tap);
    block-size: var(--st-tap);
    border-radius: 999px;
    background: var(--ink-invert);
    color: var(--on-invert);
    border: 1px solid var(--ink-invert);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease-out, visibility 0.3s;
  }
  :root[data-theme="studio"] .st-top.is-on {
    opacity: 1;
    visibility: visible;
  }
  /* The product page owns its bottom edge with the sticky buy bar; the
   * disc steps above it rather than sitting on the price. */
  :root[data-theme="studio"] body:has(.st-pdp-bar) .st-top {
    inset-block-end: calc(18px + 64px);
  }

  /* ---- responsive ----
   * The breakpoints are the source's own tiers where the source has an answer,
   * and ours where it does not. 1200 and 810 are its tiers. 900 is hero.ts's
   * (see below). 1360, 620 and 460 are ours: 1360 is where the footer's five
   * tracks stop fitting a paragraph and four labels at once, and the other two
   * each drop exactly one thing. */

  /* ≥810–1199: the source's tablet tier. --studio-gutter and --chrome-pad-y
   * have already retiered themselves in tokens.ts, so the bar narrows and its
   * block padding halves for free; what does not scale is the 50px nav gap —
   * five items at 50px plus a wordmark and the icons stop fitting around
   * 1150px. 24px is the source's own next rung down and buys ~130px. */
  /* THE BAND THAT USED TO STEP THE GAP DOWN IS GONE — the step is now the
   * token itself (tokens.ts), because there turned out to be no width at
   * which the wide value fitted. It read: "≤1559 the nav gap steps down to
   * --gap-lg, because ≥1560 seats the full number beside 50px gaps." The
   * arithmetic behind that second half was for the number alone and never
   * added the gaps back: 338 wordmark + 818 rail + 353 cluster + 48 of
   * column gaps is 1552 against a container that stops at 1560, so the wide
   * value bought 8px of slack at its very best and, below ~1630, silently
   * bought a scroll rail. One value at every width is also one fewer band
   * for the next person to reason about. */
  @media (max-width: 1199px) {
    /* The source's small header draws its icons at 34px. inset is (44 − 34) ÷ 2
     * so the target stays at --st-tap. Note what that costs: --chrome-pad-y is
     * 8px here, so the bar is 40px and a 44px target cannot fit inside it —
     * 2px sit above the viewport and 2px reach into the top of the page, under
     * the two discs at the right edge. A 40px target would sit flush, but the
     * floor is the floor, and 2px of overlap at the top edge of a hero panel is
     * the cheaper failure. The two-row bar below 900px has no such problem: its
     * rows ARE --st-tap. */
    :root[data-theme="studio"] .st-chrome-btn { inline-size: 34px; block-size: 34px; }
    :root[data-theme="studio"] .st-chrome-btn::before { inset: -5px; }
    :root[data-theme="studio"] .st-foot { padding-block: 100px 30px; }
    /* THE TOP ROW STACKS HERE, NOT AT 900.
     *
     * Two-up, the newsletter track measured 397px at 1024 and 428px at 1099,
     * so the note under the field read 53 and 57 characters against the 67 its
     * own cap allows — a run of text at its narrowest on the LARGER screens,
     * which is the tell that a container and not the type was setting it.
     * Stacked, it gets its 500px from 600px of viewport up.
     *
     * The giant wordmark gains by the same move rather than paying for it: at
     * 1024 its first line needs 486px of what was a 536px track (see the
     * measured table on .st-foot-mark), and it now has the whole row. */
    :root[data-theme="studio"] .st-foot-top { grid-template-columns: minmax(0, 1fr); }
    :root[data-theme="studio"] .st-news { justify-self: start; }
  }

  /* ≤1359: THE BRAND BLOCK TAKES ITS OWN ROW.
   *
   * Inline, the five tracks put 146px under each link column at 1024 —
   * measured against a 147px "Odstop od pogodbe" — so every second label
   * wrapped and the 229px e-mail row ran past a 219px brand track into the
   * clip. Full width gives the brand its 42ch measure back and 210px to each
   * column, more than the longest label in any of them.
   *
   * 1359, not the 1199 tier boundary this rule used to sit on, and the blurb
   * is the reason. The five-track row cannot give the brand a paragraph's
   * measure and the link columns their longest label at the same time until
   * about 1360px: at 1200 the 2.6fr the base rule now carries would leave
   * each column 145px against a 147px label. At 1360 the same ratio puts
   * 431px under the blurb and still 166px under each column, and below it a
   * full-width brand row hands the blurb its whole 42ch instead. */
  @media (max-width: 1359px) {
    :root[data-theme="studio"] .st-foot-cols {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    :root[data-theme="studio"] .st-foot-brand { grid-column: 1 / -1; }
  }

  /* ⚠️ AND ONCE THE BRAND BLOCK IS FULL WIDTH, ITS CONTACTS MUST LIE DOWN.
   *
   * The rule above gives the brand the whole row below 1359 so the blurb gets
   * its 42ch back. What it also does is hand three stacked contact rows a
   * 974px column at 1024: the e-mail, the telephone and the address ran down
   * the left in a ~280px file with 700px of empty band beside them, for about
   * 800px of footer height. A site-wide fill sweep found that region on every
   * one of the 26 routes — it was the last one left after the content pages
   * were fixed, and the only reason it took a sweep to find is that nobody
   * screenshots a footer at 1024.
   *
   * Laid out as a row they measure ~872px of the 974. Each row keeps its own
   * width — align-items: flex-start is untouched — so the target reasoning on
   * .st-contacts still holds: a row is as wide as its own line, not as wide
   * as the column, and the e-mail link does not become a 974px target
   * pointing at nothing.
   *
   * Above 1359 the brand sits in a 2.6fr track and stacking is right; below
   * 620 there is no room for a row. Between the two, it lies down. */
  @media (min-width: 620px) and (max-width: 1359px) {
    :root[data-theme="studio"] .st-contacts {
      flex-direction: row;
      flex-wrap: wrap;
      column-gap: clamp(24px, 3vw, 56px);
    }
  }

  /* ≤900: the bar goes to TWO ROWS.
   *
   * The source does not help here — below 1200 it swaps in a burger menu that
   * its React runtime hydrates, and this Worker ships no JS for chrome (the LCP
   * budget in docs/SEO.md §4 is why these shops can outrank the incumbents).
   * A CSS-only burger is a checkbox toggling a panel; it works, but it hides
   * five destinations behind an interaction on the screen where discovery
   * matters most. So the nav becomes a full-bleed scroll rail under the
   * wordmark instead: every destination stays visible and reachable, one swipe
   * or arrow-key away, with no script.
   *
   * 900 rather than 810 because that is hero.ts's own breakpoint — below it the
   * hero stops subtracting --chrome-h from the viewport (min-height:0). That
   * matters: a two-row bar is NOT --chrome-h tall, so it is the one place where
   * the published height stops being true, and putting the switch here means
   * the only module that would notice has already stopped looking. main's
   * reservation is restated below from the same numbers the grid uses, so the
   * two cannot drift.
   *
   * Both rows are --st-tap tall, which is not decoration: it is what lets every
   * control in them be a 44px target without overlays. What it does NOT do on
   * its own is keep the two rows' targets apart — at row-gap 0 they met on the
   * pixel, which is what the gap in the grid below is for. */
  @media (max-width: 900px) {
    :root[data-theme="studio"] .st-chrome-bar {
      /* minmax(0, auto): with a long shop name the wordmark yields before the
       * row can push the page sideways. */
      grid-template-columns: minmax(0, auto) 1fr auto;
      grid-template-rows: var(--st-tap) var(--st-tap);
      padding-block: var(--chrome-pad-y) 0;
      /* THE ROWS ARE 44px OF TARGET EACH, SO THEY CANNOT TOUCH.
       *
       * row-gap was 0 and both rows are exactly --st-tap, so every target in
       * the top row ended on the pixel the rail's targets began: measured at
       * 390/600/768, the wordmark and the first nav link were 0px apart, and
       * the cart disc — 34px of ink whose ::before carries the hit area 5px
       * further in every direction — cleared the link under it by 1px. Two
       * mis-tappable pairs on every page, on the only tier where the pointer
       * is a finger.
       *
       * --gap-xs is the whole fix: 8px of dead space between the rows, which
       * is 8px between hit areas because both rows are their targets. The bar
       * grows 96px -> 104px on this tier and NOTHING derives from that (it is
       * two rows, so it was never --chrome-h); the reservation below is the
       * one consumer and is restated from the same three tokens.
       *
       * Column gap is --gap-md, not --gap-sm, for the same ::before: 10px
       * between the phone number and the cart is 5px of real clearance once
       * the disc's hit area reaches back into it. 16px leaves 11px. The extra
       * 12px comes out of the middle 1fr track while that track has slack,
       * which it does on any shop whose bar carries no number at all — and
       * where it does not, the wordmark's own clamp at ≤620 is what gives. */
      column-gap: var(--gap-md);
      row-gap: var(--gap-xs);
    }
    :root[data-theme="studio"] main {
      padding-top: calc(var(--chrome-pad-y) + 2 * var(--st-tap) + var(--gap-xs));
    }
    /* Explicit placement: the nav is second in the DOM — primary navigation
     * belongs early for a screen reader, and at every width above this one the
     * source order and the visual order agree — so without this it would take
     * the second cell of row 1 and push the utilities onto a third row. The
     * cost of keeping it there is that a keyboard reaches the rail before the
     * two utilities drawn above it; five menu items ahead of two links is the
     * cheaper of the two mismatches. */
    /* The longest shop name on the network — PROSTOSTOJEČA KAD — is ~40px too
     * wide for a 360px row once the number and the basket have taken theirs.
     * The truncation has to sit on the WORDS, not on the mark: the mark is a
     * flex container, and text-overflow does nothing on one (it applies to
     * block containers, which the word spans are once flex blockifies them).
     * Flex shrinks proportionally to base size, so the long word gives way and
     * the short one — the product noun, the half that carries the meaning —
     * survives whole: "PROSTOSTOJE… KAD". */
    /* max-inline-size is the BELT, and it is what was missing.
     *
     * justify-self:start sizes a grid item to fit-content, which should already
     * clamp it to its track — it does not here, and the result was measurable:
     * at 390px the track is 242px and the mark rendered 310px, so the last
     * word printed straight through the phone and basket buttons. White
     * letters under a white icon is also what the contrast audit reported, at
     * 1.00:1, which is how a layout bug arrives disguised as a colour one.
     *
     * 100% of a grid item resolves against the track, so this pins the mark
     * inside its cell whatever the shop is called, and the ellipsis below then
     * has something to shorten against. */
    :root[data-theme="studio"] .st-chrome-mark {
      grid-area: 1 / 1; min-width: 0; max-inline-size: 100%;
    }
    :root[data-theme="studio"] .st-chrome-mark > span {
      min-inline-size: 0; overflow: hidden; text-overflow: ellipsis;
    }
    :root[data-theme="studio"] .st-chrome-tel {
      grid-area: 1 / 2;
      display: inline-flex; justify-self: end;
    }
    :root[data-theme="studio"] .st-chrome-actions {
      grid-area: 1 / 3;
      justify-self: end;
    }
    :root[data-theme="studio"] .st-chrome-nav {
      grid-area: 2 / 1 / 3 / -1;
      justify-self: stretch;
      justify-content: flex-start;
      gap: var(--gap-lg);
      /* Full-bleed: the rail's first and last items should reach the screen
       * edges when scrolled, while resting flush with the gutter. */
      margin-inline: calc(var(--studio-gutter) * -1);
      padding-inline: var(--studio-gutter);
    }

    /* Footer: one column on top, then the brand block full width with the four
     * link columns as a 2×2 grid beneath it — the source's phone arrangement.
     * The stacking itself starts at 1199 now (see that block), so all this
     * tier still owes it is the tighter gap between the two stacked halves.
     * The newsletter block keeps its 500px cap here rather than releasing it:
     * unset, the note measured 718px and 96 characters at 768. */
    :root[data-theme="studio"] .st-foot-top { gap: 25px; }
    :root[data-theme="studio"] .st-foot-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    /* No .st-foot-brand rule: this tier is inside ≤1359, which already spans
     * the brand block across every column with the same value. */
  }

  /* THE FADE WITHOUT THE TIMELINE.
   *
   * A browser with no scroll-driven animations cannot be asked whether the
   * rail scrolls, so it gets the resting half of the rule above unconditionally
   * — and only on the two-row tier, where that is nearly free: the rail is
   * stretched to the whole bar with its items start-aligned, so a menu that
   * fits leaves the trailing 40px empty and the fade finds no ink there. (The
   * exception is the narrow band of widths where the menu ends just inside
   * that 40px; the last glyph dims and nothing is lost. Above 900 the nav
   * track shrink-wraps its items instead, so the same declaration would dim
   * the last label of every menu that fits — which is why it stops here.)
   *
   * Plainer, never broken, is the same trade the :has() and animation-timeline
   * notes at the top of this file already make. */
  /* 1060, not the 900 row switch: with SEVEN items the row needs ~1012px at
   * the ≤1199 tier (labels ~518 + six 24px gaps + mark + disc + gaps), so on
   * engines without scroll timelines the nav overflows with no scrollbar
   * (suppressed above), no cue and a hard clip through the whole 901–1060
   * band. The static fade is the cue; past ~1060 the row genuinely fits. */
  @supports not (animation-timeline: scroll()) {
    @media (max-width: 1060px) {
      :root[data-theme="studio"] .st-chrome-nav {
        -webkit-mask-image:
          linear-gradient(to right, #000 calc(100% - 40px), transparent 100%);
        mask-image:
          linear-gradient(to right, #000 calc(100% - 40px), transparent 100%);
      }
    }
  }

  /* ≤809: the source's phone tier. */
  @media (max-width: 809px) {
    :root[data-theme="studio"] .st-foot { padding-block: 70px 25px; }
    :root[data-theme="studio"] .st-foot-top { margin-bottom: var(--gap-xl); }
    /* The 14px row gap that stood here is gone: it was the tier where two
     * 44px link targets overlapped by 10px. See .st-foot-col ul. */
    :root[data-theme="studio"] .st-foot-rule { margin-block: var(--gap-xl) 25px; }
  }

  /* ≤620: the wordmark stacks. The rule that used to hide the magnifier here
   * went with the magnifier itself — it was the one action with a duplicate,
   * and the duplicate was the reason it existed to be hidden. The remaining
   * button STAYS at every width: it is the only path to the enquiry, and the
   * rail has no contact route of its own. */
  @media (max-width: 620px) {
    /* THE WHOLE MENU AT REST. Five destinations at the desktop gap measured
     * 407px against a 390px phone's rail, so KONTAKT lived beyond the fade
     * and DOSTAVA dissolved mid-word — a menu two of whose five entries need
     * a swipe to discover. A tighter gap puts all five on a 390 at rest; the
     * narrowest phones still scroll, and the edge fade still says so. */
    :root[data-theme="studio"] .st-chrome-nav {
      /* Measured against the five labels: at 5vw the fifth item's first
       * letters cross the right edge on a 390px phone, so KONTAKT peeks
       * under the fade instead of sitting wholly off-screen — a menu whose
       * fifth entry cannot be seen at all reads as a four-item menu, and
       * the fade then advertises nothing. */
      gap: clamp(16px, 5vw, var(--gap-lg));
    }
    /* THE LOCKUP GOES TO TWO LINES, because one line was arithmetic that
     * could not come out. A shrink-only rule stood here with a comment
     * claiming three words at ~16px "need 210 and fit whole"; measured in
     * the rendered chrome they need 230px at 16.4px against a 230px cell at
     * 390 — and 215px against 200 at 360, and 160 would take 11px type at
     * 320, which is no longer a wordmark. Both halves ellipsized on every
     * phone screenshot: "MASAŽNI BAZ… VREL…" in the one place the shop says
     * who it is.
     *
     * So the gap span — until now a 0.3em spacer — becomes the line break:
     * flex-basis 100% forces the halves onto their own rows, mark beside the
     * first, and the longest half now needs ~150px at the same type size the
     * shrink rule used. It fits the 160px cell of a 320px phone with room,
     * so the per-span ellipsis above still exists only as a belt for a shop
     * name this network has not met yet.
     *
     * The ceiling is 17px, not the tier's h6: the bar's fixed --st-tap block
     * holds two lines of 17px at 1.2 (40.8px) and does not hold two of 22. */
    :root[data-theme="studio"] .st-chrome-mark {
      flex-wrap: wrap;
      align-content: center;
      font-size: clamp(13px, 4.2vw, 17px);
      line-height: 1.2;
    }
    :root[data-theme="studio"] .st-chrome-mark .st-mark-gap {
      flex-basis: 100%;
      block-size: 0;
      overflow: hidden;
    }
  }

  /* ≤460: wordmark + number + basket stop fitting on one 360px row. The number
   * keeps its aria-label and gives up only its digits — which the footer states
   * in full a scroll away. It also has to keep its target, and a target is two
   * dimensions: the row already makes it --st-tap tall, so with the digits gone
   * the width has to be stated or a 16px glyph would be the whole hit area. */
  /* ICON-ONLY, IN TWO DISJOINT BANDS — the phone tier and the laptop disc
   * want the same thing, and a media query LIST is an OR, so they say it
   * once. (min-inline-size stays on the phone tier alone: the disc band sets
   * its own 36px above.) */
  @media (max-width: 460px), (min-width: 1240px) and (max-width: 1499px) {
    :root[data-theme="studio"] .st-chrome-tel span { display: none; }
    :root[data-theme="studio"] .st-chrome-tel { justify-content: center; }
  }
  @media (max-width: 460px) {
    :root[data-theme="studio"] .st-chrome-tel { min-inline-size: var(--st-tap); }
  }

  @media (prefers-reduced-motion: reduce) {
    /* Nothing here animates position, so the readable static state is simply
     * the resting one: no transitions, no residual transform. The underline
     * still appears on hover — it just appears at once instead of growing,
     * which is the end state, not the absence of the affordance. */
    :root[data-theme="studio"] .st-chrome-btn,
    :root[data-theme="studio"] .st-chrome-nav a > span::after,
    :root[data-theme="studio"] .st-news-go,
    :root[data-theme="studio"] .st-contact-ico,
    :root[data-theme="studio"] .st-foot-col a {
      transition: none;
    }
  }
`;

/**
 * The wordmark, set as ONE white word — studio drops the two-tone accent split
 * the other themes use.
 *
 * It is still TWO words, and concatenating them produced a single unreadable
 * token in the accessibility tree ("MasažniFotelj"). The halves are emitted as
 * separate spans with a real space between them; the space is an inline-block
 * of a fixed 0.3em (see .st-mark-gap), which draws the join TIGHT BUT PRESENT
 * — not closed — while leaving the word break in the text stream.
 */
function markHtml(ctx: RenderCtx, key: string): string {
  const w = ctx.shop.wordmark;
  // MARK THEN WORDS. The shop is named after the product category, so the
  // words alone read as a heading rather than as a company; the mark is what
  // makes the lockup a signature. See brand.ts for what it draws and why it
  // is built at 16px first.
  return (
    brandMark(key) +
    "<span>" + esc(w[0]) + "</span>" +
    '<span class="st-mark-gap"> </span>' +
    "<span>" + esc(w[1]) + "</span>"
  );
}

/**
 * §4.1 — chrome bar.
 *
 * Nav is mapped onto routeSlugs in the same order renderHeader() uses, so a
 * shop that renames a slug renames it in both chromes at once. Each label is
 * wrapped in a span because the source's nav item is two children — the label
 * and an [Underline] element it animates to full width — and the underline
 * needs a box of the label's width to grow across (see the CSS).
 *
 * The returned string carries the skip link's target immediately after
 * </header>, which keeps the link functional without page.ts having to put an
 * id on <main>.
 */
export function renderStudioHeader(ctx: RenderCtx): string {
  const s = ctx.shop;
  const c = ctx.content;
  // DISPLAY order, not tuple order — the tuple is append-only (types.ts).
  // The sequence is the buying journey: catalogue, the two deciding tools,
  // the reading, the logistics, the company, the act. Primerjava and the
  // guided choice were in the footer only, which is where a visitor looks
  // for them last: they are the two highest-intent destinations this site
  // has, and the header is the one nav that is on screen at every scroll
  // position. Seven items still fit the bar's ways of failing: the nav track
  // is a fade-masked scroll rail wherever it runs out of room.
  const links = [
    ["/products", c.nav[0]],
    ["/compare", c.nav[5]],
    ["/finder", c.nav[6]],
    ["/guides", c.nav[2]],
    ["/delivery", c.nav[3]],
    ["/about", c.nav[1]],
    ["/contact", c.nav[4]],
  ] as const;

  // WHERE YOU ARE, said by the server. ctx.path is the canonical path each
  // renderer states about itself, so the attribute needs no script — and it
  // can be SECTION-aware, which the client's exact-match fallback cannot: a
  // model page rests the underline under Trgovina, a guide under Vodniki,
  // because that is the drawer the visitor opened to get there.
  const current = (key: (typeof links)[number][0]): boolean => {
    const p = ctx.path;
    if (!p) return false;
    if (p === s.routeSlugs[key]) return true;
    if (key === "/products") {
      if (p.startsWith(s.routeSlugs["/product"] + "/")) return true;
      if ((c.collections ?? []).some((col) => col.path === p)) return true;
    }
    if (key === "/guides" && p.startsWith(s.routeSlugs["/guide"] + "/")) return true;
    return false;
  };

  // No cart session exists at SSR time, so the count is the honest 0 and the
  // link's label says so. The integrator swaps the NUMERAL — both places it
  // appears, the attribute and the text, which are one value — never the
  // markup. The attribute is also the badge's visibility switch: at "0" the
  // stylesheet keeps the disc off the bar (see .st-chrome-badge), so an empty
  // basket does not wear a permanent zero.
  const cartCount = 0;

  return (
    '<header class="st-chrome">' +
    '<a class="st-skip" href="#st-vsebina">Preskočite na vsebino</a>' +
    '<div class="st-chrome-bar">' +
    // aria-label as well as the split spans: the brand name as the shop states
    // it is the name a screen reader should read for the home link.
    '<a class="st-chrome-mark" href="' + esc("/" + ctx.q) + '" aria-label="' +
    esc(s.name) + ' — domov">' + markHtml(ctx, "hd") + "</a>" +
    '<nav class="st-chrome-nav" aria-label="Glavni meni">' +
    links
      .map(
        ([k, label]) =>
          '<a href="' + esc(s.routeSlugs[k] + ctx.q) + '"' +
          (current(k) ? ' aria-current="page"' : "") + "><span>" +
          esc(label) + "</span></a>",
      )
      .join("") +
    "</nav>" +
    '<div class="st-chrome-actions">' +
    // ⚠️ THE PHONE IS PART OF THE ACTION CLUSTER, and putting it anywhere else
    // is what the owner was looking at when they said the bar was not laid
    // out well.
    //
    // It used to be the bar's own third child, between the nav and the
    // buttons, which grew the template a fourth track. That reads correctly
    // only while the number is at full width. Between 1240 and 1499 the tel
    // collapses to a 36px disc, the track collapses with it, and the ~115px
    // it gave up went to the two 1fr tracks either side — so a laptop saw the
    // menu, then a small unlabelled circle, then a hundred-pixel hole, then
    // the CTA. Measured at 1440: nav ends 1064, disc 1088–1124, button starts
    // 1216. The hole was not slack the layout had spent; it was slack it had
    // nowhere to put.
    //
    // Inside the cluster the phone is what it actually is — one of the two
    // things you can DO from the header, beside the enquiry button — so the
    // bar has three groups again (name, menu, act), all of the slack falls in
    // one place, and the disc shrinks against its neighbour instead of
    // stranding itself. The ≤900 two-row bar already drew these two side by
    // side, so that tier is unchanged by the move.
    // ONLY WHILE THERE IS A NUMBER TO CALL.
    //
    // The bar rendered this unconditionally, so on a phone the header carried
    // "+386 00 000 000" as a live tel: link — a placeholder dressed as the
    // shop's number, in the most prominent place a shop has, on the device
    // where tapping it dials. page.ts already refuses to print an unset value
    // as a fact for exactly this reason (see isSetPhone, which this imports
    // rather than restating); the header is the last place that was still
    // doing it.
    (isSetPhone(ctx.phoneDisplay)
      ? // title as well as aria-label: in the disc band (1240–1499) the
        // digits are hidden, and the tooltip is how a pointer reads them
        // without committing to a call.
        '<a class="st-chrome-tel" href="' + esc(ctx.phoneHref) + '" aria-label="Pokličite ' +
        esc(ctx.phoneDisplay) + '" title="' + esc(ctx.phoneDisplay) + '">' + icon("phone") +
        "<span>" + esc(ctx.phoneDisplay) + "</span></a>"
      : "") +
    // THE MAGNIFIER IS GONE, and its own note explains why it had to be.
    //
    // It read "a real destination, not a dead control" — and that was the
    // problem. There is no search anywhere in this project; the button was a
    // magnifier that navigated to the catalogue, which is TRGOVINA, the first
    // item in the nav three inches to its left. So it was simultaneously a
    // duplicate of a link already on screen and an icon naming a feature the
    // site does not have: a visitor who wants to search presses it, lands on
    // a list, and has to work out that searching was never on offer.
    //
    // Two round buttons where one is a duplicate is also what left the header
    // with no room to say anything true. What remains is the one action that
    // is not reachable from the nav at all.

    // A BASKET ONLY WHERE THERE IS ONE TO FILL.
    //
    // The button carried a basket glyph and a count badge on every shop, and
    // on this one both were fiction: /kosarica answers "spletno naročanje še
    // ni odprto", so the count was permanently 0 and the destination was an
    // apology. An icon that names a feature the site does not have is worse
    // than no icon — it is the header telling a visitor to look for something
    // that is not there.
    //
    // While ordersOnline is false the same round button, in the same place,
    // goes to the contact page instead: the channel the shop actually takes
    // orders through. Same geometry, same target size, no layout change —
    // only the glyph, the label and the destination differ. Flip the flag and
    // the basket comes back with its badge.
    //
    // KONTAKT IS ALSO IN THE NAV, which was the objection that retired the
    // magnifier, and it does not retire this: the nav is the site's table of
    // contents and this is the act. A visitor who has just read a price
    // reaches for the top-right corner, and finding the one thing they can do
    // there is the difference between an enquiry and a closed tab. It is also
    // the only control in the bar that survives the phone tier, where the nav
    // becomes a scroll rail the last item can be off the end of.
    (s.ordersOnline
      ? '<a class="st-chrome-btn st-chrome-cart" href="' +
        esc(s.routeSlugs["/cart"] + ctx.q) +
        '" aria-label="Košarica — ' + cartCount + ' izdelkov">' + basketIcon() +
        '<span class="st-chrome-badge" data-st-cart-count="' + cartCount + '" aria-hidden="true">' +
        cartCount + "</span></a>"
      : // ⚠️ A WORDED BUTTON, NOT A BARE DISC — the one change the reference
        // site (bullfrogspas.com, set by the owner) makes that this bar was
        // missing outright. Their header's right-hand control is a filled
        // "DESIGN MY SPA"; ours was an unlabelled envelope, so the single
        // most valuable pixel on a shop that sells only by enquiry said
        // nothing about what pressing it does.
        //
        // "Povpraševanje" and not "Kontakt", which is three inches left in
        // the nav: the nav is the site's table of contents and names the
        // PAGE, this names the ACT. That distinction is the one that
        // retired the magnifier, and it is what keeps this from being the
        // duplicate that was.
        //
        // The glyph stays beside the word, so the ≤900 tier can drop the
        // word and keep exactly the disc that shipped before (see the
        // media query on .st-chrome-go).
        '<a class="st-chrome-btn st-chrome-go" href="' +
        esc(s.routeSlugs["/contact"] + ctx.q) +
        '" aria-label="Povpraševanje in kontakt">' + mailIcon() +
        "<span>Povpraševanje</span></a>") +
    "</div>" +
    "</div></header>" +
    '<span class="st-anchor" id="st-vsebina" tabindex="-1"></span>'
  );
}

/**
 * WHETHER A COMPANY FACT HAS ACTUALLY BEEN FILLED IN.
 *
 * tenants/bazen.ts still carries "TODO d.o.o.", "SI00000000" and a TODO
 * address on purpose, and the footer is the one block that prints them on
 * EVERY page. Set in an imprint, "TODO d.o.o." reads as a company name to a
 * crawler and as a typo to a reader — so an unset value is MARKED instead, in
 * the same words src/themes/studio/page.ts marks them with on the legal pages.
 * The rule is restated here rather than imported because that module owns its
 * own renderer and exports neither the test nor the mark.
 *
 * It is restated, not copied. page.ts folds a PHONE test — "digits, minus the
 * country code, minus the zeros, is empty" — into the same predicate it runs
 * over every field, and a company name has no digits at all: "Masažni Bazen
 * d.o.o." and "Ljubljana" both collapse to the empty string and would be
 * marked unset forever. Here the phone keeps its own test and text facts keep
 * theirs. (legalPagesReady() had the same fold once and returned false for
 * a fully filled-in shop; it reads the per-field predicates in lib/filled.ts
 * now and the "can actually be satisfied" test in pricing.test.ts holds it.)
 */
const FACT_UNSET = '<span class="st-foot-todo">podatek še ni vpisan</span>';

/* ⚠️ THE LITERAL LIST IS GONE. isUnsetFact used to test three exact strings
 * — "TODO", "SI00000000", "0000" — which caught the placeholders this repo
 * happens to contain and no other: "SI 0000 0000", a ten-zero registration
 * number or a five-zero postcode would have printed as registry facts. The
 * per-field predicates in lib/filled.ts are the one home of this rule (see
 * the module's own header for the third-copy incident); the footer now
 * consults them per field instead of pattern-matching today's placeholders. */

/** A text fact, escaped — or the visible mark that it is not filled in yet. */
function fact(value: string, set: (v: string) => boolean = isSet): string {
  return set(value) ? esc(value) : FACT_UNSET;
}

/**
 * §4.12 — footer.
 *
 * The newsletter row is not wired — there is no form, no action and no handler
 * behind it — so it ships DISABLED rather than merely inert. A live-looking
 * field and arrow that silently swallow an address is the worse failure: a
 * reader who types and presses the arrow learns nothing.
 *
 * Being disabled has an accessibility cost that has to be paid rather than
 * ignored: a disabled control is out of the tab order, so a screen-reader user
 * arrowing through the page can meet the field without ever hearing its
 * aria-describedby note. Both controls keep the note — it is announced in
 * browse mode and by any AT that reads descriptions on inactive controls — but
 * the reason is ALSO folded into the arrow's accessible NAME, which is
 * announced wherever the control is announced at all. The visible note says
 * the same thing in the same words, so nothing is hidden from sight either.
 */
export function renderStudioFooter(ctx: RenderCtx): string {
  const s = ctx.shop;
  const c = ctx.content;
  const a = s.contact.address;

  /* The column heading is the list's accessible name, not just a line of type
   * above it: aria-labelledby ties the two together, so a screen reader
   * arrowing into the list hears "Pravno, list, 4 items" rather than four
   * unattributed links at the bottom of every page. The id is stated here
   * rather than derived from the title because a Slovenian heading would need
   * transliterating to be a valid, stable id. */
  const col = (
    id: string,
    title: string,
    items: readonly (readonly [string, string])[],
  ): string =>
    '<div class="st-foot-col"><h2 id="' + id + '">' + esc(title) + "</h2>" +
    '<ul aria-labelledby="' + id + '">' +
    items
      .map(
        ([href, label]) =>
          '<li><a href="' + esc(href + ctx.q) + '">' + esc(label) + "</a></li>",
      )
      .join("") +
    "</ul></div>";

  /* html, not text: the value may be a fact() mark rather than a string, and
   * every caller below escapes its own value.
   *
   * The field NAME is carried in a visually-hidden span, because sighted
   * readers get it from the disc and nobody else got it at all: the icons are
   * aria-hidden, so an address on its own line announced as a bare string, and
   * an unset one announced as "podatek še ni vpisan" with no clue which datum
   * is missing. It reads "E-pošta: info@…" in the tree and stays three icon
   * rows on the screen. */
  const contact = (k: IconKey, href: string | null, name: string, html: string): string => {
    const inner =
      '<span class="st-contact-ico">' + icon(k) + "</span>" +
      '<span><span class="st-vh">' + esc(name) + ": </span>" + html + "</span>";
    return href
      ? '<a class="st-contact" href="' + esc(href) + '">' + inner + "</a>"
      : '<span class="st-contact">' + inner + "</span>";
  };

  /* The two product families as their own footer destinations, read from the
   * content rather than typed here: /masazni-bazeni and /swim-spa are the two
   * pages that answer two different queries (docs/SEO.md §6), and until now
   * the only chrome that linked them was the home page's own rail. A shop with
   * no collections contributes no rows and the column still stands. */
  const families = (c.collections ?? []).map((k) => [k.path, k.navLabel] as const);

  const addressSet = isSet(a.street) && isSetZip(a.zip) && isSet(a.city);
  const phoneSet = isSetPhone(s.contact.phone);
  const addressHtml = addressSet
    ? esc(a.street + ", " + a.zip + " " + a.city)
    : FACT_UNSET;
  const phoneHtml = phoneSet ? esc(ctx.phoneDisplay) : FACT_UNSET;

  return (
    '<footer class="st-foot"><div class="st-foot-in">' +
    '<div class="st-foot-top">' +
    '<p class="st-foot-mark">' + markHtml(ctx, "ft") + "</p>" +
    // Pre-live only. The disabled control plus its printed explanation is
    // the honest pre-launch state; on a LIVE shop the same block would say
    // "na voljo ob zagonu trgovine" about a shop that has launched — so the
    // flip that opens the shop removes the block, until a real list service
    // exists to wire the form to.
    (s.live ? "" : '<div class="st-news">' +
    '<h2 class="st-news-h">E-novice</h2>' +
    '<div class="st-news-row">' +
    '<label class="st-vh" for="st-news">Vaš e-poštni naslov</label>' +
    '<input class="st-news-in" id="st-news" type="email" autocomplete="email" ' +
    'placeholder="Vaš e-poštni naslov" disabled aria-describedby="st-news-note">' +
    '<button class="st-news-go" type="button" disabled ' +
    'aria-describedby="st-news-note" ' +
    'aria-label="Prijava na e-novice — na voljo ob zagonu trgovine">' +
    icon("arrow") + "</button>" +
    "</div>" +
    '<p class="st-news-note" id="st-news-note">Prijava na e-novice bo na voljo ob ' +
    "zagonu trgovine. Do takrat nas, prosimo, pokličite ali nam pišite.</p>" +
    "</div>") +
    "</div>" +

    '<div class="st-foot-cols">' +
    '<div class="st-foot-brand">' +
    '<p class="st-foot-blurb">' + esc(c.footNote) + "</p>" +
    '<div class="st-contacts">' +
    // Guarded like the phone row below: a TODO e-mail must not become a
    // live mailto: from every page. The row stays; the link and text go.
    contact(
      "mail",
      isSet(s.contact.email) ? "mailto:" + s.contact.email : null,
      "E-pošta",
      isSet(s.contact.email) ? esc(s.contact.email) : FACT_UNSET,
    ) +
    // A tel: link is what the rest of the site gives this number (the bar, the
    // pdp, the contact page), and it is what the footer gives it the moment
    // there is a number. While it is the placeholder, the ROW STAYS and the
    // LINK GOES: a tap on a phone opens the dialer, and a footer that offers
    // to dial +386 00 000 000 from every page is a broken affordance rather
    // than an unfinished one.
    contact("phone", phoneSet ? ctx.phoneHref : null, "Telefon", phoneHtml) +
    contact("pin", null, "Naslov", addressHtml) +
    "</div></div>" +
    col("st-foot-c1", "Ponudba", [
      ...families,
      [s.routeSlugs["/products"], c.nav[0]] as const,
      [s.routeSlugs["/compare"], "Primerjava modelov"] as const,
      // The guided choice, sitewide: it sits under Ponudba because it IS the
      // offer, approached from the other end — the visitor who knows what
      // they want reads the families, the one who does not answers three
      // questions.
      [s.routeSlugs["/finder"], "Izbira bazena"] as const,
    ]) +
    col("st-foot-c2", "Pomoč", [
      [s.routeSlugs["/delivery"], "Dostava in montaža"],
      [s.routeSlugs["/financing"], "Financiranje"],
      [s.routeSlugs["/guides"], "Vodniki"],
      [s.routeSlugs["/blog"], "Blog"],
      [s.routeSlugs["/faq"], "Pogosta vprašanja"],
    ] as const) +
    col("st-foot-c3", "Podjetje", [
      [s.routeSlugs["/about"], "O nas"],
      [s.routeSlugs["/showroom"], "Ogled lokacije"],
      [s.routeSlugs["/contact"], "Kontakt"],
    ] as const) +
    // Withdrawal sits SECOND, under the terms it belongs to: of the four, the
    // 14-day right of withdrawal is the one a buyer actually goes looking for,
    // and it was last in a column of four.
    col("st-foot-c4", "Pravno", [
      [s.routeSlugs["/terms"], "Pogoji poslovanja"],
      [s.routeSlugs["/withdrawal"], "Odstop od pogodbe"],
      [s.routeSlugs["/privacy"], "Zasebnost"],
      [s.routeSlugs["/cookies"], "Piškotki"],
    ] as const) +
    "</div>" +

    // The imprint. Each fact is NAMED — firma, ID za DDV, sedež are the terms
    // ZGD-1 and the VAT act use — so that a mark says WHICH obligation is
    // still unmet instead of leaving three anonymous blanks in a row.
    '<hr class="st-foot-rule">' +
    // Each fact is one no-break segment with its separator bound to the
    // segment's END — the site's one separator rule: a middot may end a
    // line the way a comma does, and may never start one. This chip
    // carried its dot LEADING for a while, and a wrapped footer then
    // opened lines with "· Sedež:" — a stray bullet, and the opposite of
    // how the card metas break.
    '<p class="st-foot-legal">' +
    '<span class="st-foot-seg">Firma: ' + fact(s.company.legalName) + " ·</span> " +
    '<span class="st-foot-seg">ID za DDV: ' + fact(s.company.vatId, isSetVat) + " ·</span> " +
    // Matična številka and the register: the same ZGD-1 čl. 45 reading that
    // put the first three here — an imprint without them is incomplete, and
    // the footer is the one sitewide surface that can state them. They wear
    // the visible unset mark until AJPES values land in the config, exactly
    // like their neighbours. isSetVat doubles as the all-zero test for the
    // matična: digits, minus zeros, is the same emptiness either way.
    '<span class="st-foot-seg">Matična številka: ' + fact(s.company.regNumber, isSetVat) + " ·</span> " +
    '<span class="st-foot-seg">Register: ' + fact(s.company.register) + " ·</span> " +
    '<span class="st-foot-seg">Sedež: ' + addressHtml + "</span>" +
    "</p>" +
    "</div></footer>" +
    // Back to top — a fixed disc the stylesheet keeps hidden until
    // behaviour.ts flips `.is-on` past one viewport of scroll (a scroll
    // timeline drove it once; the class flip replaced it so the control
    // works wherever the script runs and simply stays hidden where it
    // does not — a convenience lost, never content). "#top" is the fragment
    // every browser special-cases as document start, so no anchor needed.
    '<a class="st-top" href="#top" aria-label="Na vrh strani">' +
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
    'focusable="false"><path d="M12 19V5.8M5.8 12 12 5.8 18.2 12"/></svg></a>'
  );
}
