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
 * spaced 24px rather than the measured ~66px. Each of those is flagged where
 * it is set.
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
import { searchIcon, basketIcon } from "./icons";

/* ---- inline line icons ----------------------------------------------- */
/* 24px grid, stroke-only, currentColor. The chrome's magnifier and basket are
 * NOT here: icons.ts is the icon set's one home, and a second hand-drawn pair
 * meant the bar and the rest of the theme could drift apart glyph by glyph.
 * What remains is the footer's contact/affordance set, which icons.ts does not
 * carry. */
type IconKey = "mail" | "phone" | "pin" | "arrow";

const ICON_PATHS: Record<IconKey, string> = {
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
    /* --studio-container is the CONTENT measure and box-sizing is border-box,
     * so the cap is widened by the two gutters — the content between them is
     * then exactly --studio-container. */
    max-width: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
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
  :root[data-theme="studio"] .st-chrome-mark {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    block-size: var(--st-tap);
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

  /* Nav gap is the source's 50px exactly (--chrome-nav-gap), not a clamp.
   *
   * It is also the bar's shock absorber. The nav is the only element here that
   * can lose width without losing meaning, so it is a scroll container at every
   * width: min-inline-size:0 lets the auto grid track shrink past max-content,
   * and the overflow is a swipeable/arrow-scrollable rail rather than a menu
   * that runs off the page. At ≥1200 with our longest menu it never triggers;
   * between 900 and 1200 an unusually long shop name can, and that is the
   * point — the page must never scroll sideways.
   *
   * The padding/margin pair is the same device as the links: it opens 10px of
   * room inside the SCROLL PORT so the 44px link boxes are not clipped by the
   * overflow, while the nav still contributes only the 24px line to the row. */
  :root[data-theme="studio"] .st-chrome-nav {
    justify-self: center;
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
    block-size: var(--st-tap);
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
   * attribute is set by behaviour.ts, the one place that knows the URL (the
   * renderer builds ONE nav string for every page, so it cannot); no script,
   * no marker, which loses an enhancement, never a destination. */
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
    block-size: var(--st-tap);
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
  :root[data-theme="studio"] .st-foot-in {
    /* Same content-measure arithmetic as the bar: the gutter sits OUTSIDE the
     * 1440px measure, so the giant wordmark starts where the bar's does. */
    max-width: calc(var(--studio-container) + 2 * var(--studio-gutter));
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
  }

  /* Source: the footer's container is one column with an 80px gap between its
   * three blocks (top / bottom / copyright), 40px on a phone. */
  :root[data-theme="studio"] .st-foot-top {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    align-items: end;
    gap: clamp(32px, 4vw, 80px);
    margin-bottom: var(--gap-3xl);
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
    font-size: clamp(2.2rem, 7.5vw, 9.375rem);
    letter-spacing: var(--ls-h1);
    line-height: 0.88;
    text-transform: uppercase;
    color: var(--on-invert);
    /* A long shop name must wrap, never push the page sideways. */
    max-width: 100%; overflow-wrap: anywhere; hyphens: none;
  }

  /* Source: the newsletter column is capped at 350px and sits at the right
   * edge of the top row, not stretched across half the footer. */
  :root[data-theme="studio"] .st-news {
    justify-self: end;
    inline-size: 100%;
    max-inline-size: 350px;
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
   * desktop, where the brand track still measures 318px at 1440 and 261px at
   * 1200 — wider than the 229px the e-mail row needs. */
  :root[data-theme="studio"] .st-foot-cols {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) repeat(4, minmax(0, 1fr));
    gap: clamp(32px, 3.4vw, 68px);
  }
  /* An ordinary paragraph — body, at the 42ch measure below. The 32px beneath
   * it is the source's gap between the blurb and the contact list. */
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
  /* 24px rows, 14px on a phone — transcribed. The measured pass read ~66px and
   * this module reproduced it; at 66px the three columns ran a screen and a
   * half tall and the footer stopped being a footer. Where the two passes
   * disagree the stylesheet wins (STUDIO-BASELINE §0). */
  :root[data-theme="studio"] .st-foot-col ul {
    list-style: none; margin: 0; padding: 0;
    display: flex; flex-direction: column;
    gap: var(--gap-lg);
  }
  /* The link columns are label too — same rung as the nav in the bar, which is
   * what makes the two chromes read as one system. Tight leading, and the same
   * 44px target device as the bar's links: a 20px line box grown to --st-tap
   * and pulled back by (20 − 44) ÷ 2 = −12px, so the rows still sit 24px apart
   * and two neighbouring targets stop 4px short of each other. */
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
  }

  /* ---- responsive ----
   * The breakpoints are the source's own tiers where the source has an answer,
   * and ours where it does not. 1200 and 810 are its tiers. 900 is hero.ts's
   * (see below). 620 and 460 are ours, and each drops exactly one thing. */

  /* ≥810–1199: the source's tablet tier. --studio-gutter and --chrome-pad-y
   * have already retiered themselves in tokens.ts, so the bar narrows and its
   * block padding halves for free; what does not scale is the 50px nav gap —
   * five items at 50px plus a wordmark and the icons stop fitting around
   * 1150px. 24px is the source's own next rung down and buys ~130px. */
  @media (max-width: 1199px) {
    :root[data-theme="studio"] .st-chrome-nav { gap: var(--gap-lg); }
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
    /* The brand block takes its own row and the four columns share the width.
     * Inline, the five tracks put 146px under each column at 1024 — measured
     * against a 147px "Odstop od pogodbe" — so every second label wrapped and
     * the e-mail row (229px) ran past a 219px brand track into the clip. Full
     * width gives the brand its 42ch measure back and 210px to each column,
     * which is more than the longest label in any of them. */
    :root[data-theme="studio"] .st-foot-cols {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    :root[data-theme="studio"] .st-foot-brand { grid-column: 1 / -1; }
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
   * control in them be a 44px target without overlays, and it stops the top
   * row's targets from bleeding into the rail's. */
  @media (max-width: 900px) {
    :root[data-theme="studio"] .st-chrome-bar {
      /* minmax(0, auto): with a long shop name the wordmark yields before the
       * row can push the page sideways. */
      grid-template-columns: minmax(0, auto) 1fr auto;
      grid-template-rows: var(--st-tap) var(--st-tap);
      padding-block: var(--chrome-pad-y) 0;
      column-gap: var(--gap-sm);
      row-gap: 0;
    }
    :root[data-theme="studio"] main {
      padding-top: calc(var(--chrome-pad-y) + 2 * var(--st-tap));
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
    :root[data-theme="studio"] .st-chrome-mark { grid-area: 1 / 1; min-width: 0; }
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

    /* Footer: one column on top, then the brand block full width with the three
     * link columns as a 2×2 grid beneath it — the source's phone arrangement. */
    :root[data-theme="studio"] .st-foot-top {
      grid-template-columns: minmax(0, 1fr);
      align-items: start;
      gap: 25px;
    }
    :root[data-theme="studio"] .st-news { justify-self: start; max-inline-size: none; }
    :root[data-theme="studio"] .st-foot-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    :root[data-theme="studio"] .st-foot-brand { grid-column: 1 / -1; }
  }

  /* ≤809: the source's phone tier. */
  @media (max-width: 809px) {
    :root[data-theme="studio"] .st-foot { padding-block: 70px 25px; }
    :root[data-theme="studio"] .st-foot-top { margin-bottom: var(--gap-xl); }
    :root[data-theme="studio"] .st-foot-col ul { gap: 14px; }
    :root[data-theme="studio"] .st-foot-rule { margin-block: var(--gap-xl) 25px; }
  }

  /* ≤620: the magnifier steps aside. It is the one action with a duplicate —
   * its destination, the catalogue, is also the rail's first item. THE CART
   * STAYS at every width: the rail has no cart route, so dropping the cluster
   * wholesale once left a phone with no path to the basket at all. */
  @media (max-width: 620px) {
    :root[data-theme="studio"] .st-chrome-search { display: none; }
  }

  /* ≤460: wordmark + number + basket stop fitting on one 360px row. The number
   * keeps its aria-label and gives up only its digits — which the footer states
   * in full a scroll away. It also has to keep its target, and a target is two
   * dimensions: the row already makes it --st-tap tall, so with the digits gone
   * the width has to be stated or a 16px glyph would be the whole hit area. */
  @media (max-width: 460px) {
    :root[data-theme="studio"] .st-chrome-tel span { display: none; }
    :root[data-theme="studio"] .st-chrome-tel {
      min-inline-size: var(--st-tap);
      justify-content: center;
    }
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
function markHtml(ctx: RenderCtx): string {
  const w = ctx.shop.wordmark;
  return (
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
  const links = [
    ["/products", c.nav[0]],
    // nav[1] is "O nas". It pointed at /compare, so the About link on every
    // page of the site went to the model comparison instead. It stayed
    // invisible because /o-nas was a stub until an hour ago: nothing in the
    // chrome linked the About page at all, so there was no wrong destination
    // to notice — only a right one that was missing.
    ["/about", c.nav[1]],
    ["/guides", c.nav[2]],
    ["/delivery", c.nav[3]],
    ["/contact", c.nav[4]],
  ] as const;

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
    esc(s.name) + ' — domov">' + markHtml(ctx) + "</a>" +
    '<nav class="st-chrome-nav" aria-label="Glavni meni">' +
    links
      .map(
        ([k, label]) =>
          '<a href="' + esc(s.routeSlugs[k] + ctx.q) + '"><span>' +
          esc(label) + "</span></a>",
      )
      .join("") +
    "</nav>" +
    // Before the icon cluster in the DOM because that is its order in the row
    // it appears in — the two-row bar at ≤900px, which is the only place it is
    // shown at all.
    '<a class="st-chrome-tel" href="' + esc(ctx.phoneHref) + '" aria-label="Pokličite ' +
    esc(ctx.phoneDisplay) + '">' + icon("phone") +
    "<span>" + esc(ctx.phoneDisplay) + "</span></a>" +
    '<div class="st-chrome-actions">' +
    // Magnifier goes to the catalogue: a real destination, not a dead control.
    // It is the one action that drops on a phone — the catalogue is also the
    // nav's first item — while the basket below stays at every width.
    '<a class="st-chrome-btn st-chrome-search" href="' +
    esc(s.routeSlugs["/products"] + ctx.q) +
    '" aria-label="Iščite po ponudbi">' + searchIcon() + "</a>" +
    '<a class="st-chrome-btn st-chrome-cart" href="' +
    esc(s.routeSlugs["/cart"] + ctx.q) +
    '" aria-label="Košarica — ' + cartCount + ' izdelkov">' + basketIcon() +
    '<span class="st-chrome-badge" data-st-cart-count="' + cartCount + '" aria-hidden="true">' +
    cartCount + "</span></a>" +
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
 * theirs. (The same fold is why content/pages.ts legalPagesReady() returns
 * false for a fully filled-in shop — flagged to the coordinator, not fixed
 * here: neither file is this task's to edit.)
 */
const FACT_UNSET = '<span class="st-foot-todo">podatek še ni vpisan</span>';

function isUnsetFact(value: string): boolean {
  return value.includes("TODO") || value === "SI00000000" || value === "0000";
}

/** Nothing but zeros once the country code is off is not a phone number. */
function isUnsetPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").replace(/^386/, "").replace(/0/g, "") === "";
}

/** A text fact, escaped — or the visible mark that it is not filled in yet. */
function fact(value: string): string {
  return isUnsetFact(value) ? FACT_UNSET : esc(value);
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

  const addressSet = ![a.street, a.zip, a.city].some(isUnsetFact);
  const phoneSet = !isUnsetPhone(s.contact.phone);
  const addressHtml = addressSet
    ? esc(a.street + ", " + a.zip + " " + a.city)
    : FACT_UNSET;
  const phoneHtml = phoneSet ? esc(ctx.phoneDisplay) : FACT_UNSET;

  return (
    '<footer class="st-foot"><div class="st-foot-in">' +
    '<div class="st-foot-top">' +
    '<p class="st-foot-mark">' + markHtml(ctx) + "</p>" +
    '<div class="st-news">' +
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
    "zagonu trgovine. Do takrat nas, prosimo, pokličite ali pišite.</p>" +
    "</div></div>" +

    '<div class="st-foot-cols">' +
    '<div class="st-foot-brand">' +
    '<p class="st-foot-blurb">' + esc(c.footNote) + "</p>" +
    '<div class="st-contacts">' +
    contact("mail", "mailto:" + s.contact.email, "E-pošta", esc(s.contact.email)) +
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
    ]) +
    col("st-foot-c2", "Pomoč", [
      [s.routeSlugs["/delivery"], "Dostava in montaža"],
      [s.routeSlugs["/financing"], "Financiranje"],
      [s.routeSlugs["/guides"], "Vodniki"],
      [s.routeSlugs["/faq"], "Pogosta vprašanja"],
    ] as const) +
    col("st-foot-c3", "Podjetje", [
      [s.routeSlugs["/about"], "O nas"],
      [s.routeSlugs["/showroom"], "Razstavni salon"],
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
    '<p class="st-foot-legal">' +
    "Firma: " + fact(s.company.legalName) +
    " · ID za DDV: " + fact(s.company.vatId) +
    " · Sedež: " + addressHtml +
    "</p>" +
    "</div></footer>"
  );
}
