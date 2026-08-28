/**
 * STUDIO — product detail page (docs/STUDIO-BASELINE.md §3, §4.7, §4.13).
 *
 * The baseline has no PDP screenshot, so this page is assembled from the
 * devices it does measure, rather than invented:
 *
 *   §4.7  the product panel — #F2F2F2 ground, radius 12px, a framed mass on
 *         it — becomes the gallery: one large frame plus a strip of smaller
 *         detail frames beneath.
 *   §4.13 the shop's FILTER SIDEBAR is the configurator's vocabulary:
 *         "uppercase label + hairline, square 22px checkboxes with 19px
 *         labels, and availability as outlined round pills". The SHAPES hold;
 *         the 19px does not — it is the screenshot pass, and §1's transcribed
 *         ramp wins on type (§0). The option row is the 16px body rung and the
 *         group label the 14px label rung. Both option shapes are used here,
 *         chosen per group by the rule documented at PILL_MAX_CHARS.
 *   §4.1  the black 90px chrome band is the sticky buy bar's language:
 *         near-black ground, on-invert type, one sharp white CTA.
 *   §3    54px gutter, ~130px light-section rhythm, sharp buttons / round
 *         pills — the contrast the baseline calls the easiest thing to get
 *         wrong.
 *
 * WHAT THIS FILE NO LONGER CARRIES. It used to hold §4.13's two secondary-page
 * devices as well — renderStudioShopHero() (a dark listing-page band with a
 * 92px title and a grey product mass) and renderStudioFilters() (the 380px
 * sidebar). Both were removed, with their stylesheets, after a second pass
 * found that NO ROUTE had ever called either one: /masazni-bazeni and
 * /swim-spa render commerce.ts's own collection head, and nothing else in the
 * repo referenced the exports. Neither was worth wiring up, on its own merits:
 *
 *   - The hero would have put a SECOND h1 above a page whose own h1, intro and
 *     meta description are the collection's (content/types.ts Collection), and
 *     its media slot is a grey placeholder mass on a shop that now owns forty
 *     photographs — the exact device studio.test.ts's "no placeholder masses
 *     survive the photography" describes.
 *   - The sidebar filtered nothing. This Worker has no query-parameter
 *     filtering, so the device rendered as links to /trgovina, /primerjava,
 *     /vodniki and /financiranje (a route that no longer exists) — all of
 *     them destinations the chrome nav and the
 *     footer already carry, wearing checkbox and pill costumes that promise a
 *     control they are not.
 *
 * Deleting them took ~150 lines of CSS off a sheet that is charged twice
 * against the budget (render-blocking AND in the HTML payload — size.test.ts).
 *
 * Scale translation: this page carries NO measured type. §4's px numbers are
 * the screenshot pass and §1's ramp wins wherever the two touch type (§0), so
 * the devices' geometry is still read off §4 — the 22px checkbox, and §4.7's
 * frame, which is square for the hot tubs the source's panel was measured
 * against and 5/2 for the swim spas, whose shells are 5,80 × 2,24 m (see
 * .st-pdp-frame) — while every font-size, weight, tracking and leading below
 * is a token from the transcribed ramp, taken a whole row at a time. Nothing here sets a size without the weight, tracking and leading that
 * ship with it, and nothing here tracks negatively: the source's display type
 * is set open and light (500 at 92px), which is the single thing the measured
 * pass had backwards.
 *
 * INTERACTIVITY ONLY THROUGH THE data-st-* CONTRACT. This module writes no
 * JavaScript; where a device is interactive (the photo gallery, the add-on
 * total) it emits behaviour.ts's markup contract and that one shared script
 * upgrades it. Everything still works if the script never runs: the gallery
 * is a real scroll container whose thumbs are real anchors, and the add-on
 * prices are all server-rendered. The CONFIGURATOR is a real GET form now —
 * radio groups and checkboxes whose values land on /kontakt as query
 * parameters the worker re-matches against this model's own option lists —
 * so the old rule ("never emits a radio…") no longer describes this module:
 * the controls act with no script, because the form does.
 *
 * Token discipline (docs/THEMES.md): colors, radii, faces, gutters, rhythm and
 * chrome height are var(--…) from tokens.ts — this module re-declares none of
 * them (a local --studio-rhythm at equal specificity let sheet order pick the
 * storefront's vertical rhythm). What remains below are values tokens.ts does
 * not carry, all of them local to this page. Every selector is scoped
 * :root[data-theme="studio"] — zarja/lednik/salon share this sheet.
 */

import { dotBind, esc, type RenderCtx } from "../../render/sections";
import { isSetPhone } from "../../lib/filled";
import type { ArtKey, Collection, PdpContent, PdpPhoto } from "../../content/types";
import { productArt } from "./product-art";
import { productImg } from "./media";
import { helpIcon, returnIcon, shieldIcon, truckIcon } from "./icons";
import { renderStudioTestimonials } from "./editorial";
import { ADDON_GROUP_ORDER } from "../../catalog/pola";
import { SHELL_FINISHES_ARE_PHOTOGRAPHED } from "../../catalog/pola";
import { finishImageUrl, type FinishKind } from "../../catalog/finish-image";
import { formatEur } from "../../catalog/pricing";

export const STUDIO_PDP_CSS = `
  /* ---- Values the baseline measures that tokens.ts does not carry ---- */
  :root[data-theme="studio"] {
    /* Gallery → buy column gap. Sized off §4.7's 48px card padding plus the
     * card gap: the two columns must read as two panels, not one spread. */
    --studio-pdp-col-gap: clamp(26px, 3.4vw, 68px);
    /* The gallery's own internal step: stage → thumb strip. Was written into
     * the .st-pdp-gallery rule; it is a token now because the sticky height
     * budget below has to subtract exactly this value. */
    --studio-pdp-gal-gap: clamp(10px, 1vw, 16px);
    /* Thumbnail square in the gallery's strip — the CAP, not a fixed size.
     * The strip divides its own width by the number of photographs so the
     * whole set lands on one row, and 60px is where that stops growing: a
     * picker is a control, not a second gallery. Which way the strip breaks a
     * tie between the single row and the target size depends on whether the
     * gallery is pinned — see .st-pdp-thumb and the min-height block above it.
     *
     * (It used to be clamp(56px, 4.2vw, 60px), and the comment claimed ten
     * fit one row. Measured, that was true only at ≥1440: ten 60px thumbs
     * plus nine 10px gaps need 690px, and the gallery column is 611px at
     * 1280 and 496px at 1024 — so the strip was silently two rows, 122px and
     * 120px tall, at both.) */
    /* ⚠️ 88px, UP FROM 60 — THE CEILING, NOT THE MEASURED SIZE.
     *
     * The strip divides its width by the number of photographs and clamps the
     * result, so this ceiling only binds on a SHORT set. On a hot tub with six
     * pictures under a 747px frame the old 60 gave a 400px strip: 54% of the
     * width it sits under, left-aligned, reading as something that failed to
     * finish rather than as a picker. And 60px of a white-ground hot tub is
     * too small to tell one view from another, which is the whole job.
     *
     * 88 fills that strip to 568px and makes the six distinguishable. It binds
     * nowhere else: ten photographs at 1920 still compute 76px, and the phone
     * still bottoms out at its 44px floor.
     *
     * It costs 28px of frame WIDTH on a square model, because the reserve
     * below feeds the pinned gallery's height budget. That is the trade and it
     * is the right way round: the stage went from 627 to 836 in the same pass,
     * and a picker you can read is worth more than the last 4% of it. */
    --studio-pdp-thumb: 88px;
    /* WCAG 2.5.5 (AAA) target size. 2.5.8 (AA), which the comment above this
     * token used to cite for the same number, is 24px — the figure the
     * breadcrumb rule below is costed against. It is the floor of the
     * free-standing strip, which holds the AAA size and takes a second row
     * instead; the pinned strip has no room for a second row and so has no
     * floor, landing between 53.5px and 27.5px depending on the window. */
    --studio-pdp-thumb-min: 44px;
    /* Gap in the thumb strip. A token for the same reason as the one above:
     * the thumb's own width formula has to subtract (n − 1) of them. */
    --studio-pdp-thumb-gap: clamp(8px, 0.8vw, 10px);
    /* §4.13's square 22px checkbox, kept for the configurator and the add-on
     * rows (the sidebar that shared it is gone — see the file header).
     *
     * 2vw, not the 1.1vw this carried: 1.1vw does not reach 22px until a
     * 2000px viewport, so on every screen the shop is actually read on the
     * box was the 16px floor and the 22px §4.13 measures was unreachable.
     * At 2vw it is the measured square from 1100px up (22.0px at 1280, 1440
     * and 1920) and still ducks to the floor on a phone, which is what the
     * floor was for. */
    --studio-pdp-box: clamp(16px, 2vw, 22px);

    /* ---- the sticky gallery's height budget --------------------------
     *
     * Three numbers the gallery has to know about the buy bar, written once
     * here and used by both. The bar is position:sticky at the BOTTOM of the
     * viewport for the whole page while the gallery is sticky at the top, so
     * the two are laid out against the same 100svh and nothing in normal flow
     * keeps them apart — measured at 1920×900 the pinned gallery ran to 952px
     * with the bar's top edge at 808px, which buried the entire 60px thumb
     * strip. The picker was unreachable, not merely clipped. */
    --studio-pdp-gal-top: calc(var(--chrome-h) + clamp(16px, 1.6vw, 32px));
    /* The bar's REAL height, derived rather than assumed. Its .st-pdp-bar-in
     * min-height is --chrome-h, but the white CTA inside it is taller than
     * that at every desktop width, so the CTA's box is what the band actually
     * measures: label line + its own padding + its hairline, plus the band's
     * padding. Both padding clamps are these tokens, so the reserve cannot
     * drift from the bar. Measured against the live bar: 92.1px at 1920,
     * 74.8 at 1440, 69.0 at 1280, 63.0 at 1024 — this calc lands within 1px
     * of each, and --studio-pdp-gal-clear covers the rounding. */
    --studio-pdp-bar-pad: clamp(9px, 0.8vw, 16px);
    --studio-pdp-cta-pad: clamp(11px, 1vw, 20px);
    --studio-pdp-bar-h: calc(
      2 * var(--studio-pdp-bar-pad) + 2 * var(--studio-pdp-cta-pad)
      + 2 * var(--bw-line) + 20px
    );
    /* Air between the two, so the photograph is not flush against the band. */
    --studio-pdp-gal-clear: clamp(10px, 1vw, 20px);
    /* What is left for the gallery when both bands have taken their share.
     * svh, not vh: on a phone the URL bar's collapse must not be allowed to
     * lend the gallery height it loses again on the next scroll. */
    --studio-pdp-gal-h: calc(
      100svh - var(--studio-pdp-gal-top) - var(--studio-pdp-bar-h)
      - var(--studio-pdp-gal-clear)
    );
  }
  /* The buy bar sits at the bottom of the viewport for the whole page, so an
   * in-page anchor scrolled flush to the bottom edge landed UNDERNEATH it.
   * Reserve the bar's own height at the end of every scroll.
   *
   * --studio-pdp-bar-h, not the calc(--chrome-h + clamp(18px, 1.6vw, 32px))
   * this used to carry: that reserved 86.7px at 1920 against a bar measured
   * at 92.1px, so an anchor target still landed ~5px under the band. The
   * token is the bar's construction, so the two can no longer disagree.
   *
   * Gated on the bar EXISTING. It used to sit on :root unconditionally, which
   * is a PDP module reaching every page in the theme: the home page, the
   * collections and the fourteen editorial pages all reserved ~122px at the
   * end of every anchor jump for a bar none of them render. :has() is already
   * how this sheet asks whether a frame carries a caption. */
  :root[data-theme="studio"]:has(.st-pdp-bar) {
    scroll-padding-bottom: calc(var(--studio-pdp-bar-h) + var(--studio-pdp-gal-clear));
  }

  /* Visually hidden until focused. Local copy (chrome.ts has .st-vh) so this
   * module carries its own screen-reader text with no cross-file dependency. */
  :root[data-theme="studio"] .st-pdp-vh {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }

  /* ---- the page band ------------------------------------------------- */
  /* No overflow property here on purpose: an overflow value on this section
   * would kill position:sticky on the buy bar inside it. */
  :root[data-theme="studio"] .st-pdp {
    background: var(--bg);
    padding-top: var(--studio-rhythm);
  }
  :root[data-theme="studio"] .st-pdp-in {
    /* The CONTENT measure is --studio-container, the baseline's text-led
     * measure (§3) — a PDP is a decision column, not a full-bleed band — and
     * box-sizing is border-box, so the gutter has to be added back or it
     * would be eaten out of the measure. The DECLARED cap is therefore the
     * sum, not the token: 1560 + 2 × 40 = 1640px at ≥1200, and 1560 + 2 × 25
     * = 1610px below that, where tokens.ts drops the gutter to 25px. The buy
     * bar's inner box repeats the same calc so the two bands line up.
     * (This comment used to name "--studio-container (1560px)" as the cap
     * itself, which is the one number this declaration never produces.) */
  }
  /* FLEX, not grid, and the reason is the sticky gallery's width cap below.
   *
   * A grid track sized 1.12fr stays 1.12fr whatever the item inside it does,
   * so when the gallery is capped the leftover is dead margin in the gallery
   * column — 145px of it at 1920. Flexbox hands a frozen item's unused space
   * back to its siblings, so the width the gallery gives up to clear the buy
   * bar is width the buy column gains: measured at 1920×900 the buy column
   * goes 705px → 868px, which is the same column the spec table, the four
   * promises and the add-on rows all live in. The ratio is unchanged — the
   * gallery still leads at 1.12 : 1 wherever the cap does not bind. */
  :root[data-theme="studio"] .st-pdp-grid {
    display: flex;
    flex-direction: column;
    gap: var(--studio-pdp-col-gap);
  }

  /* The gallery sticks while the buy column scrolls past it.
   *
   * The buy column is by far the taller of the two — the configurator,
   * fourteen priced add-ons, a total and the delivery box — so it pins whole
   * and keeps the product beside the decision for the entire scroll. This
   * replaces the earlier two-branch rule (sticky gallery WITHOUT photos,
   * sticky buy column WITH them): the with-photos branch pinned the taller
   * column, and a sticky element taller than its sibling has no room to
   * travel — it was a no-op, measured against the live page.
   *
   * Only while the row HAS two columns: stacked, this would pin the picture
   * over the copy. The offset clears the fixed chrome band.
   *
   * THE WIDTH CAP IS THE FIX FOR THE BUY BAR OVERLAP. The gallery is sized by
   * its width — the frame takes its height from an aspect-ratio and the strip
   * sits under it — so the only way to give it a height budget without
   * breaking the frame's ratio (and printing exactly the empty ground the
   * swim spa frames were guilty of) is to convert the budget back into a
   * width: available height × the frame's ratio. Uncapped and pinned at
   * 1920×900 the gallery ran 86.7 → 952.4 against a bar whose top edge is at
   * 807.9, hiding the whole thumb strip; capped it runs 86.7 → 783 and every
   * thumb is clickable. At 1280 and 1024 the cap is larger than the column
   * the layout already gives (670 vs 611, 701 vs 496), so it changes nothing
   * there — it binds at 1440 and 1920 only.
   *
   * Scoped to a gallery that HAS a stage: the drawing fallback is three
   * stacked frames rather than one stage plus a strip, so the budget below
   * would be describing a shape it does not have. It keeps the old
   * behaviour, which is what it had before this rule existed. */
  @media (min-width: 1001px) {
    :root[data-theme="studio"] .st-pdp-grid {
      flex-direction: row;
      align-items: flex-start;
    }
    /* ⚠️ 1.3, UP FROM 1.12. The picture is the reason somebody is on this page
     * and it was getting 658px of a 1360px grid at 1440 while the buy column
     * took 653 — an even split between a photograph of a EUR 8,000 object and
     * a column of text. 1.3 puts the gallery at ~720 and the buy column at
     * ~590, which is still 60-70 characters for the freight note and the
     * standfirst (measured; the audit's measure check covers it) and is 62px
     * more picture at every width above the single-column tier. */
    :root[data-theme="studio"] .st-pdp-gallery {
      flex: 1.3 1 0;
      min-inline-size: 0;
    }
    :root[data-theme="studio"] .st-pdp-buy { flex: 1 1 0; }
  }
  /* The pinning and its budget, gated on HEIGHT as well as width.
   *
   * 640px is where a pinned gallery stops being worth what it costs: the
   * chrome offset and the buy bar take 178px of a short window before the
   * gallery gets anything, so under it the budget buys a frame smaller than
   * the thumb strip is wide. Below this the gallery simply scrolls with the
   * page, which is the same judgement the max-height: 480px block makes about
   * the bar. Measured at the floor: 1440×640 leaves the frame 398px and the
   * thumbs 30.6px, both still working; at 1440×720 it is 478px and 38.6px.
   *
   * ONE ROW, GUARANTEED, while the budget is in force. The strip's height is
   * subtracted from that budget as a single row, so a strip that wrapped
   * would push the gallery back under the bar by exactly the row it added —
   * which is what happened at 1920×768 and 1440×720 when the thumb kept its
   * 44px floor here: the cap had squeezed the strip to where ten 44px targets
   * no longer fit, it wrapped, and 19.8px and 24.5px of it went back under
   * the band. So inside the budget the thumb drops the floor and takes
   * exactly its share: measured with the ten-photograph set, 53.5px at
   * 1920×900, 42.0 at 1024×900, 38.6 at 1440×720 and 27.5 at the gate's
   * worst corner, 1920×640 — above WCAG 2.2 SC 2.5.8's 24px everywhere the
   * gate allows, and the 44px AAA size wherever the strip is free to wrap
   * instead (the phone, and any window under the gate). */
  @media (min-width: 1001px) and (min-height: 640px) {
    :root[data-theme="studio"] .st-pdp-gallery {
      position: sticky;
      top: var(--studio-pdp-gal-top);
    }
    :root[data-theme="studio"] .st-pdp-gallery:has(.st-pdp-stage) {
      max-inline-size: calc(
        (var(--studio-pdp-gal-h) - var(--st-pdp-strip)) * var(--st-pdp-ar)
      );
    }
    :root[data-theme="studio"] .st-pdp-gallery:has(.st-pdp-stage) .st-pdp-thumb {
      inline-size: min(
        var(--studio-pdp-thumb),
        (100% - (var(--st-pdp-n) - 1) * var(--studio-pdp-thumb-gap) - 2px)
          / var(--st-pdp-n)
      );
    }
  }

  /* ---- gallery (§4.7's panel, at page scale) -------------------------- */
  :root[data-theme="studio"] .st-pdp-frame {
    position: relative;
    margin: 0;
    /* THE FRAME IS THE SHAPE OF THE PRODUCT IN IT, not one shape for the
     * catalogue. --st-pdp-ar is set on the gallery from the model's own art
     * key (content/types.ts ArtKey, "pool" | "swimspa"), which is the one
     * place the content layer already says which of the two families a model
     * belongs to.
     *
     * A square is right for a hot tub — /bazen/veliki-230 is 2,30 × 2,30 m,
     * and a product cut out on a plain ground sits in a square with no wasted
     * band above or below it. It is wrong for a swim spa: /bazen/swim-580-maxi
     * is 5,80 × 2,24 m and /bazen/swim-580-hidro 5,80 × 2,28 m, so with
     * object-fit: contain a 2.59:1 photograph in the 692 × 692 frame at 1440
     * painted 267px of picture and 425px of empty panel — 61% of the largest
     * object on the page, and 90% of a 900px viewport spent on it. The 5/2
     * this gives them is the mean of the two footprints to within 2%, so the
     * ground drops from 425px to under 12px.
     *
     * The fallback in the var() is what the drawing path takes: it has no
     * gallery-level art key of its own to read. (--studio-pdp-frame-ar, the
     * 4/3 the first pass carried, is retired — every frame this class paints
     * lives in the gallery, where the 1/1 override always won.) */
    aspect-ratio: var(--st-pdp-ar, 1);
    background: var(--bg-alt);
    border-radius: var(--r-media);
    overflow: hidden;
    isolation: isolate;
  }
  /* Legibility scrim under the caption — so ONLY where a caption exists (the
   * drawing fallback). It used to sit on every frame, which put a white haze
   * across the top-left corner of real photographs for a caption they do not
   * carry. */
  :root[data-theme="studio"] .st-pdp-frame:has(.st-pdp-cap)::after {
    content: "";
    position: absolute; inset: 0 auto auto 0; z-index: 2;
    width: 66%; height: 40%;
    background: radial-gradient(
      100% 100% at 0% 0%,
      color-mix(in srgb, var(--bg) 60%, transparent),
      transparent 70%
    );
  }
  /* Photo-ready slot: flatter and more neutral than zarja's lit scenes,
   * because studio's grounds are white/grey. Never an image request. */
  :root[data-theme="studio"] .st-pdp-shot { position: absolute; inset: 0; z-index: 1; }
  :root[data-theme="studio"] .st-pdp-shot-mass {
    position: absolute;
    inset: 15% 16% 20%;
    border-radius: var(--r-media);
    border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--ink) 9%, transparent),
      color-mix(in srgb, var(--ink) 3%, transparent)
    );
  }
  /* The shop's drawing. Inset like the mass it replaces so the two occupy the
   * same optical box, and drawn in a softened ink so it reads as an
   * illustration on a light panel rather than as flat black line art. */
  :root[data-theme="studio"] .st-pdp-shot-art {
    position: absolute;
    inset: 12% 13% 17%;
    display: block;
    color: color-mix(in srgb, var(--ink) 62%, transparent);
  }
  :root[data-theme="studio"] .st-pdp-shot-art .st-art {
    inline-size: 100%;
    block-size: 100%;
  }
  /* Same as the cards: a photograph shot on white gets a white panel, or its
   * own ground prints as a rectangle inside the frame. */
  :root[data-theme="studio"] .st-also-frame:has(.st-pdp-shot-img),
  :root[data-theme="studio"] .st-pdp-frame:has(.st-pdp-photo) {
    background: var(--surface);
  }
  :root[data-theme="studio"] .st-pdp-shot-img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }
  :root[data-theme="studio"] .st-pdp-shot-floor {
    position: absolute;
    left: 50%; bottom: 12%; transform: translateX(-50%);
    width: 60%; height: 8%;
    border-radius: var(--r-pill);
    background: radial-gradient(
      50% 50% at 50% 50%,
      color-mix(in srgb, var(--ink) 18%, transparent),
      transparent 72%
    );
  }
  /* The label rung, uppercase — a caption is label copy (§1), and the label
   * rung is DM Sans at 14px / 500 / 0.06em, not the 0.12em the measured pass
   * had. Single line, so it takes --lh-label-tight rather than the 1.71em
   * stacked-copy leading. --ink-body, not --ink-mute: 8.1:1 on the panel,
   * where mute would land at 4.2:1 and fail. */
  :root[data-theme="studio"] .st-pdp-cap {
    position: absolute; z-index: 3;
    top: clamp(12px, 1.2vw, 24px); left: clamp(12px, 1.2vw, 24px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-body);
  }
  /* The thumb strip: one link per photograph, under the stage. (The earlier
   * three-frame "detail strip" rules that lived here were dead — the strip
   * was never emitted; these are written for the strip the gallery actually
   * renders.) WRAPS rather than scrolls: a nested scroller hides pictures,
   * and the whole set fits one row wherever the gallery is pinned, so nothing
   * needs hiding. Flex, not a grid — a grid's last row would stretch its leftovers
   * into differently-sized cells.
   *
   * --st-pdp-n is the number of photographs, written on the element by the
   * renderer. The strip needs it because the thumb below divides the strip's
   * own width by it; the fallback keeps the rule honest if the attribute ever
   * goes missing. */
  :root[data-theme="studio"] .st-pdp-thumbs {
    display: flex;
    flex-wrap: wrap;
    /* Centred, because the strip is narrower than the frame whenever the
     * ceiling above binds. Left-aligned under a frame half again its width
     * reads as a row that ran out; centred under it reads as a caption. */
    justify-content: center;
    gap: var(--studio-pdp-thumb-gap);
    --st-pdp-n: 10;
  }
  /* ONE ROW, BY ARITHMETIC RATHER THAN BY HOPE. Each thumb takes the strip's
   * width less its gaps, divided by the number of photographs — so a set of
   * ten and a set of six both land on a single row — clamped between the AAA
   * target size and the 60px cap. The 2px is slack against sub-pixel
   * rounding: without it a row that computes to exactly 100% wraps its last
   * thumb on some fractional widths.
   *
   * This is the rule where the strip is free to WRAP: the phone, and any
   * desktop window too short for the pinned gallery. There the 44px floor
   * wins over the single row — measured at 390, where ten 44px targets and
   * nine 8px gaps need 512px in a 340px strip, so it takes two rows. The
   * pinned case overrides this with a floorless share, because there a
   * wrapped row goes straight back under the buy bar; see the min-height
   * block above.
   *
   * Measured, per gallery column, for the ten-photograph set: 53.5px at 1920,
   * 56.6 at 1440, 51.9 at 1280, 42.0 at 1024 — all one row, where the old
   * flat clamp(56px, 4.2vw, 60px) gave two rows, 122px tall at 1280 and 120px
   * at 1024, for a comment that claimed ten fit one row at every width.
   *
   * A CONTROL that happens to hold a picture, so it takes the control radius
   * (--r-ctrl, §9's sharp rung) rather than the media one, and its boundary
   * escalates like every control here: hairline at rest, ink on hover, ink
   * DOUBLED (border + inset ring, --bw-ctrl's 2px total) when it is the
   * photograph on show. The inset ring instead of a wider border: a border
   * width change would shift the picture a pixel. */
  :root[data-theme="studio"] .st-pdp-thumb {
    position: relative;
    display: block;
    flex: 0 0 auto;
    inline-size: clamp(
      var(--studio-pdp-thumb-min),
      (100% - (var(--st-pdp-n) - 1) * var(--studio-pdp-thumb-gap) - 2px)
        / var(--st-pdp-n),
      var(--studio-pdp-thumb)
    );
    aspect-ratio: 1 / 1;
    border: 1px solid var(--line);
    border-radius: var(--r-ctrl);
    background: var(--surface);
    overflow: hidden;
    transition: border-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-pdp-thumb:hover { border-color: var(--line-strong); }
  :root[data-theme="studio"] .st-pdp-thumb[aria-current] {
    border-color: var(--line-strong);
    box-shadow: inset 0 0 0 1px var(--line-strong);
  }
  :root[data-theme="studio"] .st-pdp-thumb:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }
  /* Static flow, 100% both ways — the frame reserves the box via its own
   * aspect-ratio, exactly as the stage's frames do. contain, same argument
   * as the big picture: cropping a cutout to fill 60px is how it stops
   * reading as the product. */
  /* Selected by CLASS, not as a descendant: the renderer already puts
   * .st-pdp-thumb-img on it (productImg takes a class argument), and a class
   * that matches no rule is markup that looks live and is not — ten of them
   * per page. */
  :root[data-theme="studio"] .st-pdp-thumb-img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }

  /* ---- buy column ------------------------------------------------------ */
  :root[data-theme="studio"] .st-pdp-buy { min-width: 0; }
  /* Breadcrumb — the route back to the family.
   *
   * The page had none. The eyebrow under it is a TIER name ("VELIKI"), which
   * is a fact about the model and not a link, so a visitor who landed on a
   * €8,000 model from search had no way back to the three it sits between —
   * and the crawler had no edge from the model to its collection, on a site
   * whose whole strategy is that /masazni-bazeni and /swim-spa are the pages
   * that rank.
   *
   * An <ol>: the order IS the hierarchy. The separator is a ::before on every
   * item after the first rather than a character in the markup, because a
   * typed "/" is read out loud on every crumb.
   *
   * Label rung, sentence case. The tier eyebrow in the column below is that
   * same rung in CAPS, and a trail set in caps too would read as a second
   * eyebrow rather than as navigation. Separation is by case and colour,
   * which is what the ramp gives this file everywhere else. */
  :root[data-theme="studio"] .st-pdp-crumbs ol {
    /* It sits above the whole grid, so the step under it is the one that
     * separates two devices rather than two lines of one. */
    list-style: none; margin: 0 0 clamp(16px, 1.6vw, 30px); padding: 0;
    display: flex; flex-wrap: wrap; align-items: center;
    gap: 2px clamp(6px, 0.6vw, 12px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    /* --ink-mute is 4.6:1 on the white page ground — the lowest rung that
     * still clears AA, and the one the unselected configurator rows take. */
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-pdp-crumbs li {
    display: flex; align-items: center;
    gap: clamp(6px, 0.6vw, 12px);
    min-width: 0;
  }
  :root[data-theme="studio"] .st-pdp-crumbs li + li::before {
    content: "/";
    color: var(--ink-mute);
  }
  /* The links are the loud half: --ink-body, 9.7:1, so the trail reads as two
   * destinations and one dimmer statement of where you are. */
  /* 24px tall, which is WCAG 2.2 SC 2.5.8's floor and not a design opinion.
   *
   * The label rung's line box is 20px, so every crumb link was a 20px target
   * — the site audit reported 36 of them across the six model pages. The
   * inline exception in 2.5.8 covers a link inside a sentence; a breadcrumb
   * trail is a row of navigation, so it does not apply.
   *
   * The height comes from padding and an inline-flex box rather than a
   * min-height on an inline element, where min-height does nothing. The
   * negative block margin keeps the trail's own spacing exactly as measured:
   * the target grows, the layout does not move. */
  :root[data-theme="studio"] .st-pdp-crumbs a {
    display: inline-flex;
    align-items: center;
    min-block-size: 24px;
    padding-block: 2px;
    margin-block: -2px;
    color: var(--ink-body);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  :root[data-theme="studio"] .st-pdp-crumbs a:hover {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  :root[data-theme="studio"] .st-pdp-crumbs a:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    border-radius: var(--r-ctrl);
  }
  /* The current page. One line at every width: a long model name would
   * otherwise wrap the trail onto a second row for a crumb that is repeated
   * in the h1 immediately below it. */
  :root[data-theme="studio"] .st-pdp-crumbs [aria-current] {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* The label rung, uppercase (§1). --ink-body = 9.7:1 on white. */
  :root[data-theme="studio"] .st-pdp-eyebrow {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-body);
  }
  /* The h2 RUNG on the page's one h1 ELEMENT — heading level and type rung are
   * independent, and this file says so about the group labels too. The title
   * is the PDP's dominant heading, but it sits in a ~45% decision column
   * beside a gallery that is the largest object on the page; it never spans a
   * band, and h1's 92/64/44 is sized for something that does. (This comment
   * used to justify the step against "the full-bleed shop hero below" — that
   * device was dead code and is gone; the argument stands on the column.) The
   * 600 / −0.022em / 1.15 this rule used to carry was the measured pass: §1's
   * display type is 500, tracked 0em, led 1.13em, and is never negative. */
  :root[data-theme="studio"] .st-pdp-title {
    margin: clamp(10px, 1vw, 20px) 0 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--ink);
    /* A long Slovenian model name folds; it never pushes the column open. */
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The lead rung (20/16/18): a standfirst under the title, not ordinary body —
   * hence Satoshi at the medium weight rather than 400. */
  :root[data-theme="studio"] .st-pdp-sub {
    margin: clamp(12px, 1.2vw, 24px) 0 0;
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--ink-body);
    max-width: 46ch;
  }
  /* Three rungs share this row and the ramp gives each its own FACE, so the
   * container's family serves only the body-rung child; the other two declare
   * their own. */
  :root[data-theme="studio"] .st-pdp-price {
    display: flex; align-items: baseline; flex-wrap: wrap;
    gap: clamp(8px, 0.7vw, 14px);
    margin-top: clamp(16px, 1.6vw, 32px);
    font-family: var(--f-body);
    font-variant-numeric: tabular-nums;
  }
  /* h6 — the ramp's price rung, and on a PDP this is the page's single
   * commercial number rather than one of nine on a grid. h6 is a display rung,
   * so the number sets in Clash Display at 500. The −0.01em it used to carry is
   * exactly the artefact §1 rules out. */
  :root[data-theme="studio"] .st-pdp-now {
    font-family: var(--f-display);
    font-size: var(--t-h6);
    font-weight: var(--w-display);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  /* The struck compare-at (§4.7): the body rung, muted, one hairline through
   * it. #767676 on #ffffff = 4.5:1 — it clears only because it sits on the page
   * ground, never on the --bg-alt panel. */
  :root[data-theme="studio"] .st-pdp-was {
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
    text-decoration-line: line-through;
    text-decoration-thickness: 1px;
  }
  /* "z DDV" is a meta note beside the number, so it takes the label rung —
   * sentence case, because uppercase is a per-element choice and not a property
   * of the rung. Tight leading: it is one line inside a baseline-aligned row. */
  :root[data-theme="studio"] .st-pdp-vat {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-body);
  }
  /* The provisional disclosure under the price. Same rung and colour as "z
   * DDV" beside the number, because it is the same kind of statement — a
   * qualification of the figure, not a footnote about it. --ink-body (9.7:1)
   * and not --ink-mute: a disclosure nobody reads is a disclosure that has
   * not been made. */
  :root[data-theme="studio"] .st-pdp-prov {
    margin-top: clamp(6px, 0.5vw, 10px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label);
    color: var(--ink-body);
  }

  /* ---- §4.13 configurator: label + hairline, squares, round pills ------ */
  :root[data-theme="studio"] .st-pdp-cfg {
    display: flex; flex-direction: column;
    gap: clamp(20px, 2vw, 40px);
    margin-top: clamp(26px, 2.8vw, 56px);
  }
  /* The sidebar's device: the uppercase label rung with a hairline under it.
   * It is an <h2> in the DOM and a label in the ramp — heading LEVEL and type
   * rung are independent, and a group label is label copy. */
  :root[data-theme="studio"] .st-pdp-glabel {
    padding-bottom: clamp(8px, 0.7vw, 14px);
    border-bottom: 1px solid var(--line);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-opts {
    list-style: none; margin: clamp(12px, 1.1vw, 22px) 0 0; padding: 0;
    display: flex; flex-direction: column;
    gap: clamp(9px, 0.8vw, 16px);
  }
  /* ⚠️ THESE ARE CONTROLS NOW, AND THE NOTE HERE USED TO SAY THEY WERE NOT.
   *
   * It said: "Not a control — no cursor change, no hover state: it states the
   * configuration, it does not offer it." That was true and it was the whole
   * problem. A page selling a EUR 2,400-8,400 object showed the buyer which
   * connection, which service level and which of ten shell colours it had
   * been configured with, and gave them no way to change any of it — the note
   * under the block told them to telephone. Every visitor who tried to press
   * one learned the page was decoration.
   *
   * So each row is a real radio, clipped to a pixel behind its label exactly
   * as .st-pdp-ao-in is: the label is the 44px target, the keyboard gets the
   * group's arrow-key behaviour for free, and the whole column is one GET form
   * whose submit is the enquiry button. Nothing is ordered — this shop takes
   * orders by telephone and e-mail — but what the buyer chose travels to
   * /kontakt with them instead of having to be remembered.
   *
   * The input is the row's PREVIOUS SIBLING rather than a child, so the
   * checked state reaches the label with a plain + selector. :has() would read
   * better and is not needed for anything here.
   *
   * Body rung at 16px rather than §4.13's 19: these labels wrap product copy.
   * Unselected is --ink-mute (4.6:1 on white, the lowest rung that clears AA);
   * the chosen row goes to full --ink. */
  :root[data-theme="studio"] .st-pdp-opts li,
  :root[data-theme="studio"] .st-pdp-pills li { position: relative; }
  :root[data-theme="studio"] .st-pdp-radio {
    position: absolute;
    inline-size: 1px; block-size: 1px;
    margin: 0; padding: 0; border: 0;
    clip-path: inset(50%);
    overflow: hidden; white-space: nowrap;
  }
  :root[data-theme="studio"] .st-pdp-opt {
    /* Containing block for the row's visually-hidden "izbrano" text. */
    position: relative;
    display: flex; align-items: flex-start;
    gap: clamp(9px, 0.8vw, 16px);
    min-block-size: 44px;
    cursor: pointer;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-pdp-opt:hover .st-pdp-box {
    border-color: var(--ink-invert);
  }
  :root[data-theme="studio"] .st-pdp-radio:checked + .st-pdp-opt {
    color: var(--ink);
    font-weight: var(--w-body-med);
  }
  :root[data-theme="studio"] .st-pdp-radio:checked + .st-pdp-opt .st-pdp-box {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
  }
  :root[data-theme="studio"] .st-pdp-radio:checked + .st-pdp-opt .st-pdp-dot {
    transform: scale(1);
  }
  :root[data-theme="studio"] .st-pdp-radio:focus-visible + .st-pdp-opt .st-pdp-box {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
  /* ⚠️ ROUND, AND A DOT — BECAUSE THESE ARE RADIOS NOW.
   *
   * It was square and sharp (--r-ctrl), with the same tick the add-on rows
   * use, on the argument that §9 keeps round for pills and arrows. That held
   * while the rows were inert: a mark that chooses nothing can look like
   * anything. They choose now, and a square box with a tick is the web's word
   * for "pick as many as you like" — printed directly above a column of
   * add-on checkboxes that mean exactly that. A buyer ticking "Moj električar"
   * and then "Naš partner" and watching the first one clear has been told the
   * form is broken.
   *
   * So the shape carries the arity: round with a dot for one-of, square with a
   * tick for any-of. That is the one convention every operating system and
   * every browser has agreed on for thirty years, and it costs a border-radius
   * and a different glyph. */
  :root[data-theme="studio"] .st-pdp-box {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: var(--studio-pdp-box);
    block-size: var(--studio-pdp-box);
    /* Optical centering against the first line of a 1.625em-leading label. */
    margin-top: 0.15em;
    border: 1px solid var(--line-strong);
    border-radius: 50%;
    background: var(--surface);
    color: var(--on-invert);
  }
  /* The dot is drawn rather than iconised: a circle inside a circle needs no
   * glyph, and scaling it from the centre is what makes the state read as
   * filling in rather than as something appearing on top. */
  :root[data-theme="studio"] .st-pdp-dot {
    inline-size: 46%;
    block-size: 46%;
    border-radius: 50%;
    background: currentColor;
    transform: scale(0);
  }

  /* Pill row — the sidebar's "availability as outlined round pills". */
  :root[data-theme="studio"] .st-pdp-pills {
    list-style: none; margin: clamp(12px, 1.1vw, 22px) 0 0; padding: 0;
    display: flex; flex-wrap: wrap;
    gap: clamp(8px, 0.7vw, 14px);
  }

  /* ---- the finish swatches -------------------------------------------
   *
   * A colour is the one option on this page that a NAME cannot carry.
   * "Canyon" and "Odyssey" are the acrylic manufacturer's own words for
   * particular marbled sheets, and the note under this group has been
   * apologising for exactly that; a photograph of the sample is the answer.
   *
   * AUTO-FIT, so the row fills whatever the buy column gives it — three
   * across on a phone, five or six beside the gallery — without a breakpoint
   * per tier. minmax(0, 1fr) rather than a fixed tile: sixteen swatches must
   * never be the thing that makes the column scroll sideways.
   *
   * ⚠️ THE PICTURE IS var(--sw), SET INLINE PER OPTION, and the tile is
   * designed to be correct WITHOUT it — see the swatch note in the group()
   * renderer. Un-uploaded, --sw resolves to nothing, the ground stays, and
   * the tile reads as the named chip it replaced. */
  :root[data-theme="studio"] .st-pdp-sws {
    list-style: none; margin: clamp(12px, 1.1vw, 22px) 0 0; padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(76px, 1fr));
    gap: clamp(10px, 0.9vw, 16px);
  }
  :root[data-theme="studio"] .st-pdp-sws > li { min-inline-size: 0; }
  :root[data-theme="studio"] .st-pdp-sw {
    display: grid;
    gap: 7px;
    min-inline-size: 0;
    cursor: pointer;
  }
  :root[data-theme="studio"] .st-pdp-sw-img {
    display: block;
    aspect-ratio: 1 / 1;
    border-radius: var(--r-media);
    /* The ground a colour nobody has photographed yet shows. Not white: a
     * white square beside a white column reads as a missing image rather
     * than as a swatch waiting for one. */
    background-color: var(--wash);
    background-image: var(--sw);
    background-size: cover;
    background-position: center;
    box-shadow: 0 0 0 var(--bw-line) var(--line);
    transition: box-shadow 0.2s ease;
  }
  :root[data-theme="studio"] .st-pdp-sw-n {
    font-family: var(--f-body);
    /* 13px is a literal because the ramp has no rung below --t-body (16):
     * this is a caption under a 76px tile, and sixteen of them at 16px would
     * set the names taller than the colours they describe. Same licence the
     * arrow glyph and the print sheet take, and stated for the same reason. */
    font-size: 13px;
    line-height: 1.3;
    color: var(--ink-mute);
    text-wrap: pretty;
    /* "Mediterranean" is one character wider than an 86px tile. */
    overflow-wrap: break-word;
  }
  /* CHOSEN: a ring the swatch wears, and the name in full ink. The tick the
   * option rows use would sit on top of the colour it is describing. */
  :root[data-theme="studio"] .st-pdp-radio:checked + .st-pdp-sw .st-pdp-sw-img {
    box-shadow: 0 0 0 2px var(--ink-invert);
  }
  :root[data-theme="studio"] .st-pdp-radio:checked + .st-pdp-sw .st-pdp-sw-n {
    color: var(--ink);
    font-weight: var(--w-body-med);
  }
  :root[data-theme="studio"] .st-pdp-sw:hover .st-pdp-sw-img {
    box-shadow: 0 0 0 var(--bw-line) var(--line-strong);
  }
  :root[data-theme="studio"] .st-pdp-radio:focus-visible + .st-pdp-sw .st-pdp-sw-img {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-pdp-sw-img { transition: none; }
  }
  /* ROUND (§9), and the LABEL rung: a pill is a chip, which is label copy.
   * Sentence case though, not uppercase — these labels are product copy
   * carrying prices ("Za 4 osebe — 1.990 €"), and caps would push them past
   * two-per-row at 390px. One line by construction (PILL_MAX_CHARS), so it
   * takes the tight label leading. */
  /* ⚠️ A BUTTON NOW, AND THE NOTE HERE ARGUED IT MUST NOT BE ONE.
   *
   * That argument was: these are finish NAMES listed as reference, nothing on
   * this page can take a colour choice, so outlined pills — this theme's
   * control language — would read as ten broken controls, a visitor would
   * press one and learn the form is unreliable.
   *
   * Every step of it was right about a page that could not take the choice.
   * The fix was never to make the colours look less pressable; it was to let
   * the page take a colour. It does now, so the pills go back to the theme's
   * control language: outlined on a white ground, like the marquee's pause
   * toggle and the grid tile's CTA, with a hover, a focus ring and a 44px
   * target.
   *
   * WHAT WE STILL DO NOT DO IS DRAW A SWATCH. The finishes are marbled
   * acrylics — "Silver white marble", "Ocean Wave" — that no hex value
   * describes, and nobody has photographed them (catalog/pola.ts says so and
   * says what to ask the supplier for). A circle of invented colour beside a
   * name is a picture of goods nobody has seen, on a page where the buyer is
   * deciding what their terrace will look like. The names are real; the note
   * under the group says where the shades can actually be seen. */
  :root[data-theme="studio"] .st-pdp-pill {
    position: relative;
    display: inline-flex; align-items: center;
    min-block-size: 44px;
    padding: clamp(8px, 0.6vw, 12px) clamp(13px, 1.2vw, 24px);
    border: 1px solid var(--line-strong);
    border-radius: var(--r-pill);
    background: var(--surface);
    cursor: pointer;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-pill:hover { border-color: var(--ink-invert); }
  /* Chosen = inverted fill. In a monochrome theme the only louder state than
   * a black hairline is a black ground (§4.7 uses the same escalation). No
   * weight change: the label rung is already 500 and the ramp's next weight up
   * is display-only, so the fill carries the state on its own. */
  :root[data-theme="studio"] .st-pdp-radio:checked + .st-pdp-pill {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-pdp-radio:focus-visible + .st-pdp-pill {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
  /* Where the shades can be seen, since no swatch is drawn.
   *
   * No margin of its own: it is an item of the configurator's flex column and
   * takes that column's gap, like every group beside it. A margin here would
   * add to the gap rather than replace it, which is how the block above it
   * ended up with two different distances between the same kind of thing. */
  /* The sample-book offer, lifted out of the caveat paragraph above it. A
   * rule rather than a panel: this sits inside the configurator, which is
   * already a stack of bordered groups, and a fifth box would read as
   * another question rather than as the answer to the four above it. */
  :root[data-theme="studio"] .st-pdp-swatch-cta {
    margin: var(--gap-md) 0 0;
    padding-block-start: var(--gap-md);
    border-block-start: var(--bw-line) solid var(--line);
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-swatch-cta a {
    font-weight: var(--w-body-med);
    color: var(--ink);
    text-decoration-thickness: var(--bw-line);
    text-underline-offset: 3px;
  }
  :root[data-theme="studio"] .st-pdp-swatch-cta a:hover { color: var(--acc-text); }
  :root[data-theme="studio"] .st-pdp-swatch-note {
    margin-block: 0;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
    max-inline-size: 46ch;
  }
  /* The buy column IS a form. No box of its own — it is a grouping, not a
   * panel — but it owns the column's flow so the fieldsets inside it inherit
   * the same rhythm they had when they were siblings. */
  :root[data-theme="studio"] .st-pdp-form {
    display: block;
    margin: 0;
    border: 0;
    padding: 0;
    min-inline-size: 0;
  }

  /* Honesty line under the configurator: says the selection is fixed and
   * gives the one channel that can change it. */
  :root[data-theme="studio"] .st-pdp-cfg-note {
    margin-top: clamp(14px, 1.2vw, 24px);
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-cfg-note a {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  :root[data-theme="studio"] .st-pdp-cfg-note a:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    border-radius: var(--r-ctrl);
  }

  /* ---- the gallery: ONE stage, a strip of thumb links ------------------
   *
   * §4.7's anatomy — one large frame plus a strip of smaller frames beneath
   * it — replacing the stack of every photograph at full size. The stack put
   * ten square frames (≈3,500px at 390) between the visitor and the price on
   * a phone, which is the wrong first answer for a decision page. The stage
   * is a real scroll-snap container upgraded by behaviour.ts's slider
   * contract (data-st-slider / -scroll / -item / -thumb); with no script it
   * still swipes, and every thumb is an anchor to a slide that exists. */
  :root[data-theme="studio"] .st-pdp-gallery {
    display: flex;
    flex-direction: column;
    gap: var(--studio-pdp-gal-gap);
    /* The frame's ratio, and what the strip under it costs — the two numbers
     * the sticky width cap above is computed from. Declared here rather than
     * on :root because both are facts about THIS gallery: the ratio comes
     * from the model's art key (the renderer writes data-art), and the strip
     * only exists when there is more than one photograph to choose between. */
    --st-pdp-ar: 1;
    --st-pdp-strip: 0px;
  }
  /* ⚠️ 4/3, NOT THE 5/2 THIS USED TO CARRY — AND THE REASON IS THAT A FRAME
   * FOLLOWS THE PHOTOGRAPHY, NOT THE PRODUCT'S FOOTPRINT.
   *
   * 5/2 was the mean of the two swim-spa footprints (5,80 × 2,24 and 5,80 ×
   * 2,28) to within 2%, and .st-pdp-frame still explains why that beat a
   * square for a SIDE ELEVATION. What it missed is that a gallery is not ten
   * side elevations: this shop's own shot vocabulary is top, side, lit,
   * cover, interior, seat and jets (admin/shots.ts), and only one of those
   * seven is 2.5:1. Everything else — a top-down, a seat, a jet cluster — is
   * roughly square, and a square photograph in a 2.5:1 frame is height-bound
   * at 263px inside a 658px panel at 1440. That is what a swim spa's page
   * looked like: a small picture floating in a wide white band, which is the
   * report this fixes.
   *
   * 4/3 at the same column width paints a square shot at 494px — 88% bigger —
   * and costs the side elevations a band of ground above and below rather
   * than any picture at all: they are width-bound in both frames and render
   * at exactly the same size either way. The trade is empty panel around the
   * one shot that was already filling its frame, in exchange for nearly
   * doubling the six that were not.
   *
   * The honest fix is a frame per PHOTOGRAPH, which needs each image's own
   * dimensions — nothing stores them today (product_media carries the width
   * ladder, not the intrinsic size). Worth doing; this is what the page can
   * be without it. */
  :root[data-theme="studio"] .st-pdp-gallery[data-art="swimspa"] { --st-pdp-ar: 4 / 3; }
  /* ONE thumb row plus the step above it — the exact height the strip has
   * while the gallery is pinned, because the pinned rule sizes each thumb to
   * its share of the row and it cannot wrap (see the min-height block above).
   * --studio-pdp-thumb is the row's ceiling rather than its measured height,
   * so this reserve is never short: the measured strip is 53.5px at 1920,
   * 56.6 at 1440, 51.9 at 1280 and 42.0 at 1024. */
  :root[data-theme="studio"] .st-pdp-gallery:has(.st-pdp-thumbs) {
    --st-pdp-strip: calc(var(--studio-pdp-gal-gap) + var(--studio-pdp-thumb));
  }
  :root[data-theme="studio"] .st-pdp-stage {
    display: flex;
    gap: var(--gap-sm);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;
    /* The no-script path: a thumb is an anchor, and this is what keeps its
     * jump from teleporting. behaviour.ts's own scrolls pick smooth/auto per
     * the motion preference; the reduce block below aligns this one. */
    scroll-behavior: smooth;
    /* The thumb strip IS the pagination; a scrollbar under a photograph
     * reads as a defect. Keyboard users get the same reach through the
     * focusable stage (arrow keys) and the thumb links. */
    scrollbar-width: none;
  }
  :root[data-theme="studio"] .st-pdp-stage::-webkit-scrollbar { display: none; }
  /* The stage is a tabindex="0" region (its slides are content, not
   * controls), so it must show a ring like every focusable thing here. */
  :root[data-theme="studio"] .st-pdp-stage:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
    border-radius: var(--r-media);
  }
  :root[data-theme="studio"] .st-pdp-stage .st-pdp-frame {
    flex: 0 0 100%;
    scroll-snap-align: start;
  }
  /* The drawing fallback keeps the old stack (its three frames are direct
   * children — no stage, nothing to page through), so the frame border must
   * cover both parents. */
  :root[data-theme="studio"] .st-pdp-gallery .st-pdp-frame {
    border: var(--bw-line) solid var(--line);
  }
  /* object-fit: contain, not cover. These are studio shots of a product on a
   * plain ground, and cropping one to fill a square is how a tub loses a
   * corner. The frame's own ground is the ground the shot was taken on. */
  :root[data-theme="studio"] .st-pdp-photo {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }

  /* ---- the full-size viewer -------------------------------------------
   *
   * The chip sits in the frame's bottom-right, over the photograph's own
   * ground. A white disc with a hairline rather than an ink one: these shots
   * are products cut out on a pale ground, so an ink chip would be the
   * loudest thing in the frame, and the control is an offer rather than an
   * instruction. 44px, because it is a real target on a phone. */
  :root[data-theme="studio"] .st-pdp-zoom {
    position: absolute;
    inset-block-end: clamp(8px, 0.8vw, 14px);
    inset-inline-end: clamp(8px, 0.8vw, 14px);
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 44px;
    block-size: 44px;
    padding: 0;
    border: var(--bw-line) solid var(--line-strong);
    border-radius: var(--r-pill);
    background: var(--surface);
    color: var(--ink);
    cursor: pointer;
  }
  :root[data-theme="studio"] .st-pdp-zoom:hover {
    border-color: var(--ink-invert);
    background: var(--ink-invert);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-pdp-zoom:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
  :root[data-theme="studio"] .st-pdp-zoom[hidden] { display: none; }
  /* The photograph itself is a second, larger target for the same action —
   * see behaviour.ts. The cursor is the only affordance it needs; the chip
   * carries the accessible name and the keyboard route. */
  :root[data-theme="studio"] .st-pdp-stage .st-pdp-photo { cursor: zoom-in; }

  /* THE DIALOG FILLS THE VIEWPORT and paints its own ground, because the
   * whole point is to take the photograph out of a 740px column and give it
   * the screen. The UA's centring and its max sizes are all overridden: a
   * dialog defaults to shrink-to-fit and would frame a 2,000px photograph in
   * a box the size of its own margin. */
  :root[data-theme="studio"] .st-pdp-lb {
    inline-size: 100vw;
    max-inline-size: 100vw;
    block-size: 100svh;
    max-block-size: 100svh;
    margin: 0;
    padding: clamp(16px, 3vw, 48px);
    border: 0;
    background: var(--surface);
    overflow: hidden;
  }
  :root[data-theme="studio"] .st-pdp-lb::backdrop { background: rgb(0 0 0 / 0.72); }
  :root[data-theme="studio"] .st-pdp-lb-img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: contain;
  }
  :root[data-theme="studio"] .st-pdp-lb-x {
    position: absolute;
    inset-block-start: clamp(10px, 1.4vw, 20px);
    inset-inline-end: clamp(10px, 1.4vw, 20px);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 48px;
    block-size: 48px;
    padding: 0;
    border: var(--bw-line) solid var(--line-strong);
    border-radius: var(--r-pill);
    background: var(--surface);
    color: var(--ink);
    cursor: pointer;
  }
  :root[data-theme="studio"] .st-pdp-lb-x:hover {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-pdp-lb-x:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }

  /* ---- finishes, quantity, the cart ----------------------------------- */
  :root[data-theme="studio"] .st-pdp-buyrow {
    display: flex;
    gap: clamp(10px, 1vw, 18px);
    margin-top: clamp(20px, 2vw, 36px);
  }
  :root[data-theme="studio"] .st-pdp-qty {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    border: var(--bw-line) solid var(--line-strong);
    border-radius: var(--r-ctrl);
    background: var(--surface);
  }
  /* The native spinner IS the stepper. Drawing plus and minus buttons would
   * mean two more controls to keep at 44px, two more focus rings, and a
   * keyboard story to rebuild — the input already has all of it, and arrow
   * keys already step it. */
  :root[data-theme="studio"] .st-pdp-qty input {
    inline-size: 76px;
    min-block-size: 52px;
    padding: 0 0 0 14px;
    border: 0;
    background: transparent;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-qty input:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: -2px;
    border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-pdp-add {
    flex: 1 1 auto;
    min-block-size: 52px;
    padding: 0 clamp(20px, 2vw, 40px);
    border: var(--bw-line) solid var(--ink-invert);
    border-radius: var(--r-ctrl);
    background: var(--ink-invert);
    color: var(--on-invert);
    cursor: pointer;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    transition: background-color .2s ease, color .2s ease;
  }
  /* The channel line under the enquiry button. It is not a disclaimer — it is
   * the answer to "and then what happens", which a visitor deserves before
   * pressing rather than on the page after it. Body rung, muted, sitting with
   * the control rather than with the copy above it. */
  :root[data-theme="studio"] .st-pdp-chan {
    margin: clamp(8px, 0.8vw, 12px) 0 0;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
  }
  /* The enquiry control is an ANCHOR where the cart control is a button, so
   * the button's own reset does not reach it: a link needs the text centred
   * on its own box and its underline off. Everything else — fill, ring,
   * radius, height, hover — is inherited from .st-pdp-add above, which is
   * what keeps the two states of this control the same object. */
  :root[data-theme="studio"] a.st-pdp-add {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    text-align: center;
  }
  :root[data-theme="studio"] .st-pdp-add:hover {
    background: transparent;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-add:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }

  /* ---- the assurance row ----------------------------------------------
   *
   * TWO BY TWO ONLY WHERE A CELL HOLDS A PROMISE. repeat(2, minmax(0, 1fr))
   * split an already narrow buy column in half again, and the promise inside
   * a cell is an icon, a gap and then the text — so the measured cell ran
   * 339.5px at 1920, 299.1 at 1440, 263.8 at 1280 and 214.3 at 1024, leaving
   * the sub-line 186 to 287px of it. Its longest ("brezplačno preverimo
   * dostop in elektriko", 40 characters) measures 287px, so two of the four
   * promises broke onto a second line at 1440 and 1280 and three of the four
   * at 1024 — and the short ones did not, so the row read as four ragged
   * blocks rather than one device.
   *
   * 22rem is the width a cell needs to hold that longest line: 287px of text
   * plus the icon and its 10px gap is 321px, and 352px carries it with the
   * label above it. auto-fit then decides per column rather than per
   * viewport, which is what the old @media (max-width: 809px) override got
   * wrong — it named a viewport for a fault that was about the COLUMN width.
   * That override is gone with it. Measured after: two by two at 1920 (cells
   * of 420.9px), one per row from 1440 down (652.7 / 545.5 / 443), and all
   * four promises on one line at every one of the four. */
  :root[data-theme="studio"] .st-pdp-assure {
    list-style: none; margin: clamp(22px, 2.2vw, 40px) 0 0; padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
    gap: clamp(14px, 1.4vw, 26px);
  }
  :root[data-theme="studio"] .st-pdp-assure-i {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-assure-i {
    flex: 0 0 auto;
    margin-top: 2px;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-assure-h {
    display: block;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-assure-s {
    display: block;
    margin-top: 3px;
    font-family: var(--f-body);
    font-size: var(--t-label);
    line-height: var(--lh-body);
    color: var(--ink-mute);
  }

  /* ---- collapsible panels ---------------------------------------------
   *
   * These sit UNDER the whole two-column row now, not inside the buy column
   * — the step above them is therefore a band-to-band step rather than a
   * device-to-device one. See renderStudioPdp for the measurement that moved
   * them. */
  :root[data-theme="studio"] .st-pdp-panels {
    margin-top: clamp(34px, 3.4vw, 64px);
    border-top: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-pdp-panel {
    border-bottom: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-pdp-panel summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-sm);
    min-block-size: 56px;
    padding-block: clamp(12px, 1.1vw, 18px);
    cursor: pointer;
    list-style: none;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-panel summary::-webkit-details-marker { display: none; }
  /* The panel's label is an <h3> inside the summary, not loose text.
   *
   * "Tehnični podatki", "Opis izdelka", "Mere in teža", "Garancija" are the
   * page's section headings by every measure except the document outline —
   * they were the only h6-scale type on the page that a screen-reader user
   * navigating by heading could not reach, and they carry the keywords a
   * product page is actually read for. h3 rather than h2: they sit under the
   * h2 group labels above them, and structure.test.ts fails a skipped level.
   *
   * It inherits everything, so summary keeps being the one place the panel's
   * type is declared and the ::after chevron keeps its flex row. */
  :root[data-theme="studio"] .st-pdp-panel-h {
    margin: 0;
    min-width: 0;
    font: inherit;
    letter-spacing: inherit;
    color: inherit;
  }
  /* The chevron is drawn, not a marker glyph: a border-only square rotated
   * 45 degrees is one element and matches the hairline weight everywhere
   * else on the page. */
  :root[data-theme="studio"] .st-pdp-panel summary::after {
    content: "";
    flex: 0 0 auto;
    inline-size: 8px; block-size: 8px;
    margin-inline-end: 4px;
    border-inline-end: var(--bw-line) solid var(--ink-body);
    border-block-end: var(--bw-line) solid var(--ink-body);
    transform: translateY(-2px) rotate(45deg);
    transition: transform .18s ease;
  }
  :root[data-theme="studio"] .st-pdp-panel[open] summary::after {
    transform: translateY(2px) rotate(-135deg);
  }
  :root[data-theme="studio"] .st-pdp-panel summary:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: -2px;
    border-radius: var(--r-ctrl);
  }
  :root[data-theme="studio"] .st-pdp-panel-b {
    padding-bottom: clamp(14px, 1.4vw, 24px);
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  /* ⚠️ THE ch UNIT IS NOT A CHARACTER, AND THIS RULE PROVED IT.
   *
   * The cap read 62ch, which looks like "62 characters per line" and is
   * not. ch is the advance width of the digit ZERO, and in Plus Jakarta
   * Sans the zero is about half again as wide as the average lowercase
   * letter — so 62ch measured 726px and rendered NINETY-FIVE characters per
   * line, on all six product pages, at the top of the page where the model
   * is described. The intent was right and the unit silently multiplied it.
   *
   * 34rem is 544px against this ramp's 16px body, which measures ~71 — the
   * same figure the page module's own 38rem measure is calibrated to and
   * documents. A rem cannot drift with the face. */
  :root[data-theme="studio"] .st-pdp-panel-b p { margin: 0; max-inline-size: 34rem; }

  /* ---- "ostali modeli" ------------------------------------------------- */
  /* Block padding only — the inline half is layout.ts's. It was a padding
   * SHORTHAND, which would have reset the shared padding-inline back to the
   * gutter and quietly taken this band off the container above the cap. */
  :root[data-theme="studio"] .st-also {
    padding-block: var(--studio-rhythm) 0;
  }
  /* The same rung as "Primerjajte modele" (.st-cmp-h): both are secondary
   * section heads over supporting material, and this one was set centred at
   * the full h2 display rung — home-page-band volume over three slim cards,
   * shouting over the h2s of the page's own content. One kind of section,
   * one rung, one alignment. */
  :root[data-theme="studio"] .st-also-h {
    margin: 0 0 var(--gap-md);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
  }
  /* The ruled row of §4.4: no gaps, a ring on each cell, overlapping edges
   * making the rules. */
  :root[data-theme="studio"] .st-also-row {
    list-style: none; margin: 0; padding: var(--bw-line);
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0;
  }
  /* Since the fill went kin-only every family page shows exactly TWO
   * alternatives; two cards in a three-track grid left a card-sized void at
   * the row's right edge. The row sizes to its census. */
  :root[data-theme="studio"] .st-also-row:has(> :last-child:nth-child(2)) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  :root[data-theme="studio"] .st-also-cell { min-width: 0; }
  :root[data-theme="studio"] .st-also-meta {
    font-size: var(--t-body);
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-also-card {
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 0.8vw, 14px);
    block-size: 100%;
    padding: clamp(16px, 1.6vw, 30px);
    box-shadow: 0 0 0 var(--bw-line) var(--st-ring, var(--line));
    text-decoration: none;
    transition: box-shadow .2s ease;
  }
  :root[data-theme="studio"] .st-also-card:hover,
  :root[data-theme="studio"] .st-also-card:focus-visible {
    --st-ring: var(--line-strong);
    position: relative;
    z-index: 1;
  }
  :root[data-theme="studio"] .st-also-frame {
    position: relative;
    display: block;
    aspect-ratio: 1 / 1;
    border-radius: var(--r-media);
    background: var(--bg-alt);
    overflow: hidden;
  }
  :root[data-theme="studio"] .st-also-frame img { transition: transform 0.6s ease-out; }
  :root[data-theme="studio"] .st-also-card:hover .st-also-frame img,
  :root[data-theme="studio"] .st-also-card:focus-visible .st-also-frame img {
    transform: scale(1.035);
  }
  :root[data-theme="studio"] .st-also-name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-also-price {
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body-med);
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  @media (max-width: 809px) {
    :root[data-theme="studio"] .st-also-row { grid-template-columns: minmax(0, 1fr); }
    /* (.st-pdp-assure's single-column override lived here. The row is
     * auto-fit now and collapses on its own measure, at every width — see
     * the rule for the 352px the pair is costed against.) */
  }

  /* ---- add-ons: the first REAL controls on this page ------------------
   *
   * The configurator above states a fixed configuration and tells you to ring
   * up for another. These are different: each one is a priced option the
   * supplier actually sells against this model, so they are real checkboxes
   * that move a real total.
   *
   * The input is visually hidden but never display:none — it stays in the tab
   * order and keeps its native semantics, and the drawn box is its :checked
   * sibling. Focus lands on the box because the input has no paint of its own.
   */
  :root[data-theme="studio"] .st-pdp-ao {
    margin-top: clamp(24px, 2.4vw, 48px);
    padding: 0;
    border: 0;
    min-inline-size: 0;
  }
  :root[data-theme="studio"] .st-pdp-ao-legend {
    padding: 0 0 clamp(8px, 0.7vw, 14px);
    inline-size: 100%;
    border-bottom: 1px solid var(--line);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-ao-list {
    list-style: none; margin: 0; padding: 0;
  }
  /* 44px minimum, per WCAG 2.5.8 — and these rows are the one place on the
   * page a mis-tap costs money. */
  :root[data-theme="studio"] .st-pdp-ao-lab {
    /* Containing block for the visually-hidden input, exactly as .st-pdp-opt
     * does for its hidden "izbrano". Without it the input's absolute box
     * resolves against <body>: it happens to land next to its label today
     * because it falls back to its static position, and it would fly to the
     * page corner the moment any ancestor gained a position. */
    position: relative;
    display: flex; align-items: flex-start;
    gap: clamp(9px, 0.8vw, 16px);
    min-block-size: 44px;
    padding-block: clamp(9px, 0.8vw, 14px);
    border-bottom: 1px solid var(--line);
    cursor: pointer;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-ao-in {
    position: absolute;
    inline-size: 1px; block-size: 1px;
    margin: 0; padding: 0; border: 0;
    clip-path: inset(50%);
    overflow: hidden; white-space: nowrap;
  }
  :root[data-theme="studio"] .st-pdp-ao-box {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    inline-size: var(--studio-pdp-box);
    block-size: var(--studio-pdp-box);
    margin-top: 0.15em;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-ctrl);
    background: var(--surface);
    color: var(--on-invert);
  }
  :root[data-theme="studio"] .st-pdp-ao-box svg {
    inline-size: 68%; block-size: 68%;
    opacity: 0;
  }
  :root[data-theme="studio"] .st-pdp-ao-in:checked + .st-pdp-ao-box {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
  }
  :root[data-theme="studio"] .st-pdp-ao-in:checked + .st-pdp-ao-box svg { opacity: 1; }
  :root[data-theme="studio"] .st-pdp-ao-in:focus-visible + .st-pdp-ao-box {
    outline: 2px solid var(--acc);
    outline-offset: 3px;
  }
  :root[data-theme="studio"] .st-pdp-ao-lab:hover .st-pdp-ao-box {
    border-color: var(--ink-invert);
  }
  :root[data-theme="studio"] .st-pdp-ao-in:checked ~ .st-pdp-ao-name {
    color: var(--ink);
    font-weight: var(--w-body-med);
  }
  :root[data-theme="studio"] .st-pdp-ao-name { min-width: 0; }
  :root[data-theme="studio"] .st-pdp-ao-qty {
    color: var(--ink-mute);
  }
  /* Tabular figures so a column of prices lines up on its digits. */
  :root[data-theme="studio"] .st-pdp-ao-price {
    margin-inline-start: auto;
    padding-inline-start: var(--gap-sm);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  /* Group heading. The label rung again, but muted and without the hairline
   * the section legend carries — it divides, it does not announce. aria-hidden
   * because it is a visual grouping of controls that already name themselves;
   * a screen reader meeting "Osvetlitev" as a list item between checkboxes
   * learns nothing it cannot get from "LED osvetlitev roba". */
  :root[data-theme="studio"] .st-pdp-ao-head {
    padding-block: clamp(16px, 1.4vw, 26px) clamp(6px, 0.5vw, 10px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-pdp-ao-head:first-child { padding-top: clamp(8px, 0.7vw, 14px); }
  :root[data-theme="studio"] .st-pdp-ao-line {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: var(--gap-sm);
    margin-top: clamp(12px, 1.1vw, 22px);
    font-family: var(--f-body);
    font-size: var(--t-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    font-variant-numeric: tabular-nums;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-pdp-ao-total {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: var(--gap-sm);
    margin-top: clamp(8px, 0.7vw, 12px);
    padding-top: clamp(8px, 0.7vw, 12px);
    border-top: 1px solid var(--line-strong);
    font-family: var(--f-body);
    font-size: var(--t-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-ao-sum {
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    line-height: var(--lh-lead);
    font-variant-numeric: tabular-nums;
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-pdp-ao-note {
    margin-top: clamp(8px, 0.7vw, 14px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--ink-mute);
  }

  /* ---- freight box: hairline frame, included lines in accent ---------- */
  :root[data-theme="studio"] .st-pdp-freight {
    margin-top: clamp(24px, 2.4vw, 48px);
    padding: clamp(16px, 1.6vw, 32px);
    border: 1px solid var(--line);
    border-radius: var(--r-card);
    background: var(--surface);
  }
  :root[data-theme="studio"] .st-pdp-frows {
    margin: clamp(12px, 1.1vw, 22px) 0 0;
    display: flex; flex-direction: column;
  }
  :root[data-theme="studio"] .st-pdp-frow {
    display: flex; align-items: baseline; flex-wrap: wrap;
    gap: 6px clamp(12px, 1.2vw, 24px);
    padding-block: clamp(9px, 0.8vw, 16px);
    border-top: 1px solid var(--line);
  }
  :root[data-theme="studio"] .st-pdp-frow:first-child { border-top: 0; padding-top: 0; }
  /* Delivery rows are prose, both halves: the body rung, with the value at the
   * ramp's second prose weight so the row still has a loud half. */
  :root[data-theme="studio"] .st-pdp-frow dt {
    flex: 1 1 14ch; min-width: 0;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
  }
  :root[data-theme="studio"] .st-pdp-frow dd {
    margin: 0; margin-left: auto;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    font-variant-numeric: tabular-nums;
    color: var(--ink);
    white-space: nowrap;
  }
  /* The accent as punctuation (§5.4): an included line is the only colored
   * text on the page. --acc-text is the L=0.45 rung, ≥4.9:1 on #ffffff at
   * every shop hue; --acc (L=0.62) would not clear 4.5:1 and is not used here. */
  :root[data-theme="studio"] .st-pdp-frow dd.st-pdp-inc { color: var(--acc-text); }
  /* Legal microcopy, and a wrapping sentence rather than a meta line, so it is
   * the body rung and not the label one — it stays quieter than the rows above
   * by colour (--ink-mute) and by the rule between them, not by being smaller.
   * The ramp has no rung under 16px for prose; inventing one is what this pass
   * exists to undo. */
  :root[data-theme="studio"] .st-pdp-note {
    margin-top: clamp(12px, 1.1vw, 22px);
    padding-top: clamp(12px, 1.1vw, 22px);
    border-top: 1px solid var(--line);
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
  }

  /* ---- spec: hairline-ruled definition list ---------------------------- */
  /* (.st-pdp-spec and .st-pdp-spec-h — the freestanding two-column spec band
   * with its own h3 — were removed as dead: the table moved into the first
   * collapsible panel and nothing emitted either class any more.) */
  /* TWO COLUMNS OF ROWS, ONLY WHERE BOTH STILL HOLD A VALUE.
   *
   * The panels are laid out across the whole band now rather than inside the
   * buy column (see renderStudioPdp for why they moved), so the table has
   * room to place rows side by side. auto-fit with a 40rem floor is the rule
   * that decides: 640px is what one row needs to keep its value on a single
   * line (16ch of term + the gap + the 45-character measure below), so the
   * table is two columns from 1440 up (2 × 640 + 40 = 1320 inside a 1360px
   * band) and one column at 1280 and 1024, where a second column could only
   * be bought by breaking the values again. */
  :root[data-theme="studio"] .st-pdp-spec-table {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 40rem), 1fr));
    column-gap: clamp(24px, 2.4vw, 40px);
    border-top: 1px solid var(--line);
  }
  /* THE VALUE GETS THE MEASURE; the term takes what a term needs.
   *
   * minmax(0, 1fr) / minmax(0, 1.15fr) split the row almost down the middle,
   * which inside the buy column left the value 25.1 characters at 1024, 30.9
   * at 1280, 35.0 at 1440 and 36.4 at 1920 — under a 45-character floor at
   * every one, against values that run to 39 ("ameriški akril, 7 barv ·
   * izolacija 2 cm"). So most of them wrapped, and a wrapped row is 75px
   * against 49 for one that does not: the table's own rhythm moved with the
   * text. The longest TERM is 15 characters ("Protitočne šobe"), so 16ch is
   * the whole of what the left column needs and the rest belongs to the
   * right. Measured after: 47.4 characters at 1440 — the two-column case and
   * the tightest of the four — and 56.4, 100.4 and 78.5 at 1920, 1280 and
   * 1024. No value wraps at any of them, so every row in a table is the
   * height of its neighbours (65.4px at 1920 down to 49 at 1024) instead of
   * alternating 49 and 75 as the text happened to fall. */
  :root[data-theme="studio"] .st-pdp-printhead { display: none; }
  :root[data-theme="studio"] .st-pdp-printrow { margin: 14px 0 0; }
  :root[data-theme="studio"] .st-pdp-print {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    background: none;
    border: var(--bw-line) solid var(--line-strong);
    border-radius: var(--r-ctrl);
    color: var(--ink);
    padding: 10px 16px;
    cursor: pointer;
  }
  :root[data-theme="studio"] .st-pdp-print:hover { border-color: var(--ink); }
  /* PAPER: the page becomes the technical sheet. Everything that is not the
   * letterhead, the title block or the spec list leaves; the letterhead
   * (screen: hidden) opens the sheet with who sells this and for how much.
   * details[open] is already the server-rendered state of the spec panel,
   * so no-JS printing works too. */
  @media print {
    :root[data-theme="studio"] .st-chrome,
    :root[data-theme="studio"] .st-foot,
    :root[data-theme="studio"] .st-top,
    :root[data-theme="studio"] .st-pdp-gallery,
    :root[data-theme="studio"] .st-pdp-buy,
    :root[data-theme="studio"] .st-pdp-bar,
    :root[data-theme="studio"] .st-pdp-crumbs,
    :root[data-theme="studio"] .st-also,
    :root[data-theme="studio"] .st-tst,
    :root[data-theme="studio"] .st-mq,
    :root[data-theme="studio"] .st-mem,
    :root[data-theme="studio"] .st-soc,
    :root[data-theme="studio"] .st-band,
    :root[data-theme="studio"] .st-gd,
    :root[data-theme="studio"] .st-pdp-panel:not([open]),
    :root[data-theme="studio"] .st-pdp-printrow,
    :root[data-theme="studio"] .st-pdp-panel[open] > summary {
      display: none !important;
    }
    :root[data-theme="studio"] .st-pdp-printhead {
      display: block;
      font-family: var(--f-body);
      font-size: 12pt;
      line-height: 1.5;
      border-bottom: 1pt solid #000;
      padding-bottom: 8pt;
      margin-bottom: 12pt;
    }
    :root[data-theme="studio"] .st-pdp-panel { border: 0; }
    :root[data-theme="studio"] .st-pdp-panel-b { padding: 0; }
  }
  :root[data-theme="studio"] .st-pdp-srow {
    display: grid;
    grid-template-columns: minmax(0, 16ch) minmax(0, 1fr);
    gap: clamp(10px, 1.2vw, 24px);
    padding-block: clamp(11px, 1vw, 20px);
    border-bottom: 1px solid var(--line);
  }
  /* Spec cells are the body rung on both sides; the term/value distinction is
   * carried by colour, which is how the ramp intends it — there is no separate
   * table rung in §1. */
  :root[data-theme="studio"] .st-pdp-srow dt {
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-pdp-srow dd {
    margin: 0;
    font-family: var(--f-body);
    font-size: var(--t-body);
    font-weight: var(--w-body);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-body);
    color: var(--ink);
    font-variant-numeric: tabular-nums;
  }

  /* ---- §4.1 chrome language: the sticky buy bar ------------------------ */
  :root[data-theme="studio"] .st-pdp-bar {
    position: sticky;
    bottom: 0;
    z-index: 40;
    margin-top: var(--studio-rhythm);
    background: var(--ink-invert);
    color: var(--on-invert);
    /* A band, not a card: sharp edges, one hairline, no shadow — the chrome
     * bar's exact construction, mirrored. */
    border-top: 1px solid color-mix(in srgb, var(--on-invert) 10%, transparent);
  }
  :root[data-theme="studio"] .st-pdp-bar-in {
    min-height: var(--chrome-h);
    display: flex; align-items: center;
    gap: clamp(10px, 1.4vw, 28px);
    /* The token, not the clamp written out: --studio-pdp-bar-h is built from
     * this and the CTA's padding, and the sticky gallery reserves that. A
     * literal here would let the two drift silently. */
    padding-block: var(--studio-pdp-bar-pad);
  }
  /* The summary is chrome, not content: both halves are meta rows on a band,
   * so both take the label rung and the band's own face. */
  :root[data-theme="studio"] .st-pdp-sum {
    display: flex; align-items: baseline; flex-wrap: wrap;
    gap: 2px clamp(6px, 0.6vw, 12px);
    min-width: 0;
    font-family: var(--f-label);
  }
  :root[data-theme="studio"] .st-pdp-sum-name {
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert);
    /* One row at every width: the name gives way before the row wraps. */
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* #a8a8a8 on #0d0d0d = 8.9:1. Same rung as the name beside it — the two are
   * separated by colour, which is the only separation a chrome band gets. */
  :root[data-theme="studio"] .st-pdp-sum-cfg {
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    color: var(--on-invert-mute);
    white-space: nowrap;
  }
  /* h6, the price rung, matching .st-pdp-now above: the bar restates the one
   * commercial number and restating it at a different rung would read as a
   * second, different price. It is a display rung, so the bar's number sets in
   * Clash Display while the summary beside it stays on the label rung. Its line
   * box (24 × 1.33em = 32px) plus this bar's padding runs a few px past
   * --chrome-h on desktop; the bar is min-height, so it grows rather than
   * clipping. */
  /* The bar's "z DDV" sits on the DARK bar, not the light buy column, so the
   * shared .st-vat ink (mid ink on white) reads 3.53:1 here — the bar's own
   * muted-on-invert rung is the 7.3:1 one. Caught by the pixel audit the
   * same hour the span was added. */
  :root[data-theme="studio"] .st-pdp-bar .st-vat {
    color: var(--on-invert-mute);
  }
  :root[data-theme="studio"] .st-pdp-bar-price {
    margin-left: auto;
    font-family: var(--f-display);
    font-size: var(--t-h6);
    font-weight: var(--w-display);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    color: var(--on-invert);
  }
  /* SHARP white CTA (§3/§9) — the one live control on the page. A button label
   * is the label rung: DM Sans 14/500, tracked 0.06em, uppercase. */
  :root[data-theme="studio"] .st-pdp-cta {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; justify-content: center;
    /* The block padding is the token the bar's height reserve is built from
     * — see --studio-pdp-bar-h. The CTA is what makes this band taller than
     * its own min-height at every desktop width, so it is the half of the
     * measurement that has to stay in step. */
    padding: var(--studio-pdp-cta-pad) clamp(16px, 2vw, 40px);
    background: var(--bg);
    border: 1px solid var(--bg);
    border-radius: var(--r-ctrl);
    text-decoration: none;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--ink);
    transition: background-color 0.2s ease;
  }
  :root[data-theme="studio"] .st-pdp-cta:hover {
    background: color-mix(in srgb, var(--bg) 84%, var(--ink));
  }
  /* The page ring is --acc; on a near-black band white outlines louder. */
  :root[data-theme="studio"] .st-pdp-cta:focus-visible {
    outline: 2px solid var(--bg);
    outline-offset: 3px;
    border-radius: var(--r-ctrl);
  }

  /* ---- responsive ------------------------------------------------------ */
  @media (max-width: 1000px) {
    /* Gallery over buy column: below this width the frame and a 16px option
     * list cannot share a row without both losing. (The .st-pdp-spec lines
     * that sat here went with the dead spec band above.) */
    :root[data-theme="studio"] .st-pdp-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 560px) {
    /* THE SPEC ROW STACKS. 16ch of term inside a 340px band leaves the value
     * 167px — 16 characters, the narrowest measure anywhere on this page —
     * so on a phone the term takes its own line and the value gets the whole
     * 340px (33 characters). Every row is then the same height whether or not
     * its value folds, which is the fault the desktop rule above is about.
     * The tighter gap is because a stacked pair is one item, not two. */
    :root[data-theme="studio"] .st-pdp-srow {
      grid-template-columns: minmax(0, 1fr);
      gap: 2px;
    }
    /* 390px budget for the bar, re-costed on the ramp: 20px gutters leave
     * 350px. The CTA is now a flat 14px label (~122px with 14px padding) and
     * the price is h6's phone value, 22px (~85px), so with two 10px gaps the
     * name keeps ~113px — about fifteen characters before it ellipses, which
     * is what the ellipsis is there for. The configuration summary is the one
     * part that can be dropped without losing a fact the page has not already
     * stated above.
     * No letter-spacing override here any more: the label rung is 0.06em at
     * every width, and the 0.08em this block used to claw back was only ever
     * undoing an invented 0.12em. */
    :root[data-theme="studio"] .st-pdp-sum-cfg { display: none; }
    :root[data-theme="studio"] .st-pdp-bar-in { gap: 10px; }
    :root[data-theme="studio"] .st-pdp-cta { padding-inline: 14px; }
    /* ⚠️ THE BUDGET ABOVE DID NOT SURVIVE CONTACT WITH THE LONGEST NAME.
     * It reserved ~113px for the name — "about fifteen characters before it
     * ellipses" — and the visual sweep measured the box at 90px against a
     * SWIM 580 HIDRO that needs 121, so the one label that is on screen at
     * every scroll position read "SWIM 58…". Fifteen characters was the right
     * budget and there were nine.
     *
     * So the row wraps instead of rationing: name and price on the first line,
     * the CTA across the whole width of the second. The name gets the full
     * 350px, the button becomes a full-width target rather than a 122px one,
     * and nothing is dropped. Two rows is what the phone had room for all
     * along. */
    :root[data-theme="studio"] .st-pdp-bar-in { flex-wrap: wrap; row-gap: 8px; }
    :root[data-theme="studio"] .st-pdp-sum { flex: 1 1 auto; }
    :root[data-theme="studio"] .st-pdp-cta { flex: 1 0 100%; }
    /* AND THE RESERVE FOLLOWS THE BAR, because that is the whole point of the
     * token. --studio-pdp-bar-h is what scroll-padding-block-end reserves so
     * an in-page anchor does not land underneath the band, and it is built
     * from a ONE-ROW bar. Two rows and it is 37px short — which is not a
     * theoretical anchor: every heading in the collapsible panels is one.
     * The second row is the CTA's own 44px target and the 8px row gap; the
     * first is the name and price line, which measures 32px at the label and
     * h6 rungs this width uses. Measured against the live bar: 99px, and this
     * calc gives 102 — over, which is the safe direction. */
    :root[data-theme="studio"] {
      --studio-pdp-bar-h: calc(
        2 * var(--studio-pdp-bar-pad) + 2 * var(--studio-pdp-cta-pad)
        + 2 * var(--bw-line) + 20px + 8px + 32px
      );
    }
    /* (No thumb override any more: the strip's own clamp already bottoms out
     * at the 8px this block used to restate.) */
  }
  @media (max-height: 480px) {
    /* A landscape phone, or a desktop window squashed to a strip: a bar that
     * pins itself to the bottom of a 420px-tall viewport is eating a fifth of
     * the reading area for a summary of what is already on screen. It goes
     * back into the flow, and the scroll reserve above goes with it. */
    :root[data-theme="studio"] .st-pdp-bar { position: static; }
    /* Same :has() gate as the declaration it undoes — without it this rule is
     * a specificity step BELOW the one above and would never win. */
    :root[data-theme="studio"]:has(.st-pdp-bar) { scroll-padding-bottom: 0; }
  }

  /* (§4.13's two secondary-page devices — the dark .st-shop-hero band and
   * the .st-filters sidebar — were removed here along with their renderers.
   * No route ever called either one; see the file header for why neither was
   * worth wiring up. 166 lines of CSS for markup nothing emitted.) */

  /* ---- motion ---------------------------------------------------------- */
  @media (prefers-reduced-motion: reduce) {
    /* Nothing here animates position, so the readable static state is the
     * resting one: no transitions, no residual transform. The buy bar keeps
     * its sticky position — that is layout, not motion. */
    :root[data-theme="studio"] .st-pdp-cta,
    :root[data-theme="studio"] .st-pdp-cfg-note a,
    :root[data-theme="studio"] .st-pdp-crumbs a,
    :root[data-theme="studio"] .st-pdp-thumb {
      transition: none;
      transform: none;
    }
    /* An anchor jump must actually jump. */
    :root[data-theme="studio"] .st-pdp-stage { scroll-behavior: auto; }
  }
`;

/**
 * A pill must hold its label on ONE line. Groups whose longest option exceeds
 * this render as the §4.13 checkbox list instead, where a label may wrap
 * freely.
 *
 * The 24 was costed against a 12.5px floor that no longer exists: the pill is
 * now the label rung, a flat 14px DM Sans, so the ~145px a two-up row leaves at
 * 390px buys ~20 characters rather than ~24. A group sitting right on the limit
 * therefore packs one pill per row on a narrow phone instead of two — it wraps,
 * it does not overflow, and every pill still holds its label on one line, which
 * is the invariant this constant actually protects.
 *
 * The number stays at 24 regardless: lowering it would move groups from the
 * pill shape to the checkbox shape, which changes the DOM this page emits, and
 * that is a layout decision rather than a type one. Flagged here so it is
 * decided deliberately and not as a side effect of the ramp.
 */
const PILL_MAX_CHARS = 24;

/** Code-point length — Slovenian č/š/ž must count as one character. */
function len(s: string): number {
  return Array.from(s).length;
}

function usesPills(options: readonly string[]): boolean {
  return options.every((o) => len(o) <= PILL_MAX_CHARS);
}

/**
 * Photo-ready slot — the shop's product drawing, or a bordered mass where
 * there is none. Never an image request.
 *
 * commerce.ts and hero.ts were given the drawings; this file was not, so the
 * page where somebody decides to spend three thousand euro showed four empty
 * grey boxes — the big frame and all three thumbnails. It is the one page on
 * the site whose entire job is to show the product.
 *
 * `variant` cycles the presentations so the thumbnail strip reads as three
 * views rather than the same picture three times. A photograph replaces this
 * at one call site.
 */
function shot(ctx: RenderCtx, variant = 0, photo?: PdpPhoto): string {
  if (photo) {
    return (
      '<span class="st-pdp-shot">' +
      // The only slot this branch paints is "ostali modeli"'s .st-also-frame
      // (the gallery's fallback takes the drawing, which is never an image
      // request), so the hint is that card's measured width: 306px at 390 —
      // one column, 78.5vw — 220.7 at 810 and 291.3 at 1024, where the row is
      // three columns inside a 25px gutter, then 358.4 at 1280, 406.6 at 1440
      // and 459.3 at 1920, where the band's own cap freezes it. The 400px it
      // carried was measured against the 1440px container and now
      // under-promises by 15% at 1920, which is how a card prints soft.
      productImg(
        photo,
        "st-pdp-shot-img",
        "(max-width: 809px) 80vw, (max-width: 1199px) 28vw, (max-width: 1639px) 30vw, 460px",
        photo.alt,
      ) +
      "</span>"
    );
  }
  const art = productArt(ctx.shop.key, variant);
  return (
    '<span class="st-pdp-shot" aria-hidden="true">' +
    (art ? '<span class="st-pdp-shot-art">' + art + "</span>" : '<span class="st-pdp-shot-mass"></span>') +
    '<span class="st-pdp-shot-floor"></span>' +
    "</span>"
  );
}

/** The check inside a chosen square. Decorative: the state is also in text. */
const CHECK =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" ' +
  'stroke="currentColor" stroke-width="2.6" stroke-linecap="round" ' +
  'stroke-linejoin="round"><path d="m5 12.5 4.7 4.7L19 6.8"/></svg>';

/**
 * The struck compare-at price of §4.7, on the PDP.
 *
 * PdpContent does not (yet) carry a compare-at field, and deriving one from
 * `price` would put a fabricated discount on a €3k product. Read structurally
 * rather than through a cast, exactly as commerce.ts does, so adding
 * `compareAt?: string` to the interface needs no change here.
 */
function compareAt(d: PdpContent): string | null {
  const v: unknown = (d as { compareAt?: unknown }).compareAt;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * The COLLECTION this model belongs to, or null.
 *
 * Read off the collection's own product list rather than guessed from the
 * slug: content/types.ts says a Collection owns its products, and a shop that
 * moves a model between families should not need this file edited. Two
 * devices need it — the breadcrumb and "Ostali modeli" — and both would
 * otherwise be answering "which family is this?" with a different rule.
 */
function family(ctx: RenderCtx): Collection | null {
  const slug = ctx.pdp.slug;
  for (const c of ctx.content.collections ?? []) {
    if (c.products.some((p) => p.slug === slug)) return c;
  }
  return null;
}

/**
 * WHICH OF THE TWO FAMILIES THIS MODEL IS, as the content layer already
 * records it: content/types.ts ArtKey, "pool" | "swimspa".
 *
 * The gallery frame's aspect ratio is the one thing on this page that cannot
 * be the same for both — a hot tub is square (2,30 × 2,30 m) and a swim spa
 * is not (5,80 × 2,24 m) — and inventing a rule from the slug or from the
 * spec text would be this file guessing at a fact the catalogue states.
 *
 * PdpContent itself does not carry the key, so it is read off the model's own
 * ProductCard: the collection that owns the model first (content/types.ts
 * says a Collection owns its products, the same source family() reads), then
 * the shop's flat card list for a shop with no collections. The direct read
 * comes first and structurally, exactly as compareAt() does above, so adding
 * `art: ArtKey` to PdpContent needs no change here.
 */
function artOf(ctx: RenderCtx): ArtKey | null {
  const own: unknown = (ctx.pdp as { art?: unknown }).art;
  if (own === "pool" || own === "swimspa") return own;
  const slug = ctx.pdp.slug;
  for (const c of ctx.content.collections ?? []) {
    const card = c.products.find((x) => x.slug === slug);
    if (card) return card.art;
  }
  for (const x of ctx.content.products) {
    if (!("util" in x) && x.slug === slug) return x.art;
  }
  return null;
}

/**
 * The breadcrumb: shop → family → this model.
 *
 * WHY IT EXISTS. The page had no route back to its family at all. The eyebrow
 * under the title is a tier name ("VELIKI"), which is a fact about the model
 * rather than a link, so somebody who landed on a €8,000 shell from search
 * could reach the cart, the phone number and fourteen add-ons — but not the
 * two other shells it sits between. The crawler had the same problem in
 * reverse: /masazni-bazeni links down to nine models and nothing linked back
 * up, on a site whose ranking pages ARE the two collection URLs.
 *
 * The last crumb is the current page, unlinked and marked aria-current="page"
 * — the shape schema.org's BreadcrumbList expects, so the structured data can
 * be added later WITHOUT the visible trail and the markup disagreeing (see
 * the note in renderStudioPdp about where that belongs).
 *
 * Nothing renders where a shop has no collections: the hub route itself only
 * exists when it has some (src/worker.ts), so a two-crumb trail to a 404 is
 * the one outcome worse than no trail.
 */
function crumbs(ctx: RenderCtx): string {
  const fam = family(ctx);
  if (!fam) return "";
  const hub = ctx.shop.routeSlugs["/products"];
  // The nav's own word for the hub, so the crumb and the chrome bar can never
  // drift apart — the same argument the configurator's labels take.
  const trail: readonly (readonly [string, string])[] = [
    [hub, ctx.content.nav[0]],
    [fam.path, fam.navLabel],
  ];
  return (
    '<nav class="st-pdp-crumbs" aria-label="Drobtinice"><ol>' +
    trail
      .map(
        ([href, label]) =>
          '<li><a href="' + esc(href + ctx.q) + '">' + esc(label) + "</a></li>",
      )
      .join("") +
    '<li><span aria-current="page">' + esc(ctx.pdp.title) + "</span></li>" +
    "</ol></nav>"
  );
}

/**
 * "Ostali modeli" — the source's "You may also like", built from the shop's
 * own range rather than a recommendation engine.
 *
 * Three cards, and THE MODEL'S OWN FAMILY FIRST. It used to walk the flat
 * catalogue order, which on /bazen/veliki-230 offered a 2.520 € hot tub and
 * two swim spas at 6.320 € and 7.850 € — the range boundary falls in the
 * middle of the neighbour window, so two of the three "alternatives" were a
 * different product at two and a half times the price. Within a family the
 * order is shell size and jet count, so the neighbours really are the closest
 * alternatives; the rest of the catalogue only fills seats the family cannot.
 *
 * A shop with no catalogue renders nothing at all instead of an empty band.
 */
function alsoLike(ctx: RenderCtx): string {
  const all = ctx.content.pdps ?? [];
  if (all.length < 2) return "";
  const fam = family(ctx);
  const kin = fam ? new Set(fam.products.map((p) => p.slug)) : null;
  const rest = all.filter((x) => x.slug !== ctx.pdp.slug);
  const near = (list: PdpContent[]): PdpContent[] => {
    const here = list.findIndex((x) => x.slug === ctx.pdp.slug);
    const start = Math.min(Math.max(0, here - 1), Math.max(0, list.length - 3));
    return list.slice(start, start + 3);
  };
  // Same family only, windowed on this model. The cross-family fill is gone:
  // each family holds exactly three models, so `own` always yields two and
  // the third card was ALWAYS the other family — every hot-tub page ended on
  // a ~16.700 € swim spa, the exact price-mismatch this function's own
  // header says it fixed. Two honest alternatives beat two-plus-a-stranger;
  // the fill returns only for a family of one, where kinship has no meaning.
  const own = kin ? near(all.filter((x) => kin.has(x.slug))).filter((x) => x.slug !== ctx.pdp.slug) : [];
  const seen = new Set(own.map((x) => x.slug));
  const picks =
    own.length >= 2
      ? own.slice(0, 3)
      : [...own, ...rest.filter((x) => !seen.has(x.slug))].slice(0, 3);
  if (picks.length === 0) return "";

  const base = ctx.shop.routeSlugs["/product"] + "/";
  return (
    '<section class="st-also" aria-labelledby="st-also-h">' +
    '<h2 class="st-also-h" id="st-also-h">Ostali modeli</h2>' +
    '<ul class="st-also-row">' +
    picks
      .map(
        (m, i) =>
          '<li class="st-also-cell"><a class="st-also-card" href="' +
          esc(base + m.slug + ctx.q) + '">' +
          '<span class="st-also-frame">' + shot(ctx, i, m.photos?.[0]) + "</span>" +
          '<span class="st-also-name">' + esc(m.title) + "</span>" +
          // The one product card on the site with no spec line was this one,
          // and it is the card asking to be compared against the page above.
          '<span class="st-also-meta">' + esc(m.bar[1]) + "</span>" +
          '<span class="st-also-price">' + esc(m.price) +
          // The same qualifier every other price on the site carries. These
          // were the last prices before the footer and the only bare ones.
          (m.price.includes("€") ? ' <span class="st-vat">z DDV</span>' : "") +
          "</span>" +
          "</a></li>",
      )
      .join("") +
    "</ul></section>"
  );
}

/**
 * The gallery: the model's own photographs where they exist, the shop's
 * drawing where they do not.
 *
 * Not a mixture. A model with two real pictures and a drawing to pad the
 * column would present the drawing as a third view of the product, which it
 * is not — and the caption that qualifies the drawing would then be sitting
 * under photographs it does not apply to.
 *
 * With photographs it is behaviour.ts's slider anatomy: a scroll-snap STAGE
 * (data-st-scroll) of full-width slides (data-st-item), under it a strip of
 * thumb ANCHORS (data-st-thumb) — each a real link to its slide's id, so a
 * visitor with no script still reaches every picture, the same contract the
 * testimonial arrows keep. The script upgrades the click to a horizontal
 * scroll and keeps aria-current on the thumb whose slide is showing; the
 * server marks the first one so the no-script state is already true.
 * tabindex="-1" on each slide is what lets the anchor move focus into a
 * figure that is not itself interactive, and tabindex="0" on the stage keeps
 * the scroller reachable for arrow-key scrolling (it is a labelled region,
 * so the stop announces itself).
 *
 * The first frame is eager and high priority: it is the largest element above
 * the fold on this page and the one LCP is measured against.
 */
/** A magnifier with a plus in it — "bigger", not "search". */
const ZOOM_ICON =
  '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" ' +
  'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
  'aria-hidden="true" focusable="false">' +
  '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 21 21"/>' +
  '<path d="M10.5 7.8v5.4M7.8 10.5h5.4"/></svg>';

const CLOSE_ICON =
  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" ' +
  'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
  'aria-hidden="true" focusable="false">' +
  '<path d="m6 6 12 12M18 6 6 18"/></svg>';

/**
 * The full-size viewer.
 *
 * A native <dialog>, so Escape closes it, focus is trapped for free, and the
 * page behind it is inert — three things a div would have to reimplement and
 * would get wrong. Closed by default in every browser that has it, and
 * invisible in any that does not, so a page with no script renders nothing
 * extra.
 *
 * ⚠️ THERE IS NO <img> HERE, AND THAT IS NOT AN OVERSIGHT. It had one, empty,
 * waiting to be filled — and render/structure.test.ts refused it for having
 * no width and height, which is the CLS guard every other picture on this
 * site passes. The guard was right to ask and the answer is not to invent a
 * size: the element has no natural one until it holds a photograph, and it
 * holds one only when somebody asks for it. So behaviour.ts creates it on the
 * first open. That also means a product page ships one fewer empty element,
 * and never downloads a second full-size copy of its own LCP image for a view
 * most visitors never open.
 */
const LIGHTBOX =
  '<dialog class="st-pdp-lb" data-st-lightbox aria-label="Fotografija izdelka">' +
  '<button class="st-pdp-lb-x" type="button" data-st-lb-close ' +
  'aria-label="Zapri">' + CLOSE_ICON + "</button>" +
  "</dialog>";

function gallery(ctx: RenderCtx): string {
  const photos = ctx.pdp.photos ?? [];
  if (photos.length > 0) {
    // WHAT THE STAGE ACTUALLY PAINTS. A hint has to describe the WIDEST case a
    // width can produce, which is the swim spa's frame — the square pool
    // stage is capped by the height budget, the swim spa's is capped by the
    // column. Re-measured after the frame went to 4/3 and the gallery column
    // to flex 1.3: 531px at 1024, 741 at 1440, 836 at 1920 — 51.9, 51.5 and
    // 43.5vw. So 52vw up to the point --studio-container caps the band
    // (1560 + 2 × 40 = 1640px of viewport), and the fixed 836px above it,
    // where the column stops growing.
    const sizes =
      "(max-width: 1000px) 100vw, (max-width: 1639px) 52vw, 836px";
    const stage =
      '<div class="st-pdp-stage" data-st-scroll role="region" ' +
      'aria-label="Fotografije izdelka" tabindex="0">' +
      photos
        .map(
          (p, i) =>
            '<figure class="st-pdp-frame" data-st-item id="st-pg-' +
            String(i + 1) + '" tabindex="-1">' +
            productImg(p, "st-pdp-photo", sizes, p.alt, i === 0) +
            // THE CONTROL IS HIDDEN UNTIL SCRIPT REMOVES THE ATTRIBUTE, which
            // is the same contract every other enhancement on this site keeps:
            // nothing that cannot work is ever offered. A magnifier that does
            // nothing is worse than no magnifier, and the picture is still
            // reachable without it — the stage swipes and every thumb is a
            // real link to a real slide.
            //
            // A CORNER CHIP RATHER THAN THE WHOLE FRAME. A button covering the
            // slide would eat the touch drag that pages the stage, so the
            // frame stays a figure and only this 44px target opens the view.
            // The script also opens on a click of the photograph itself, which
            // a tap-that-is-not-a-drag still produces.
            '<button class="st-pdp-zoom" type="button" hidden data-st-zoom' +
            ' aria-label="Povečaj fotografijo ' + String(i + 1) + '">' +
            ZOOM_ICON + "</button>" +
            "</figure>",
        )
        .join("") +
      "</div>";
    // One photograph: a strip with a single thumb is a control that cannot
    // choose anything, so it is not rendered at all. The viewer still is —
    // one photograph is exactly as worth enlarging as ten.
    if (photos.length < 2) return stage + LIGHTBOX;
    const thumbs = photos
      .map(
        (p, i) =>
          '<a class="st-pdp-thumb" href="#st-pg-' + String(i + 1) +
          '" data-st-thumb' + (i === 0 ? ' aria-current="true"' : "") +
          ' aria-label="Fotografija ' + String(i + 1) + " od " +
          String(photos.length) + '">' +
          // The link's aria-label is the accessible name; the picture inside
          // repeats the slide it points at, so its alt is deliberately empty.
          productImg(p, "st-pdp-thumb-img", "60px", "") +
          "</a>",
      )
      .join("");
    // The count travels to the stylesheet: .st-pdp-thumb divides the strip's
    // width by it to keep the whole set on one row. It is a fact about this
    // gallery, not a style choice, which is why it rides as a custom property
    // rather than as one more class.
    return (
      stage +
      '<nav class="st-pdp-thumbs" aria-label="Izbira fotografije"' +
      ' style="--st-pdp-n:' + String(photos.length) + '">' + thumbs + "</nav>" +
      LIGHTBOX
    );
  }
  return (
    '<figure class="st-pdp-frame">' + shot(ctx, 0) +
    '<figcaption class="st-pdp-cap">Vizualizacija — fotografije v pripravi</figcaption>' +
    "</figure>" +
    '<span class="st-pdp-frame" aria-hidden="true">' + shot(ctx, 1) + "</span>" +
    '<span class="st-pdp-frame" aria-hidden="true">' + shot(ctx, 2) + "</span>"
  );
}

/**
 * The PDP body — gallery left, buy column right, spec beneath, sticky buy bar.
 *
 * Consumes exactly what renderPdpBody() consumes (ctx.pdp: eyebrow,
 * title, sub, price, cfg, freight, note, spec, bar), so the two renderers are
 * interchangeable per theme with no content-layer change.
 */
export function renderStudioPdp(ctx: RenderCtx): string {
  const d = ctx.pdp;
  const was = compareAt(d);
  const provisional = d.pricesProvisional === true;
  const art = artOf(ctx);

  // ---- the configurator, as controls ------------------------------------
  //
  // ⚠️ THESE USED TO BE INERT. Every group rendered a list showing what the
  // page had been configured with, and the note beneath told the visitor to
  // telephone if they wanted anything else. See the stylesheet's own note on
  // .st-pdp-opt, which argued at length that the rows must not LOOK like
  // controls — correct, given they were not, and the wrong problem to solve.
  //
  // A group is a radio group. The whole column is one GET form whose submit is
  // the enquiry button, so the choices arrive at /kontakt as query parameters,
  // are matched back against this model's own option lists there, and are
  // printed for the visitor and put in the mail subject. NOTHING IS ORDERED:
  // shop.ordersOnline is false and the cart page says so. What changed is that
  // the buyer no longer has to remember what they picked.
  //
  // ⚠️ THE PARAMETER NAMES ARE POSITIONAL ("cfg0", "cfg1") AND THE VALUES ARE
  // MATCHED, NOT ECHOED. Same doctrine as ?model=: a string off the wire never
  // becomes page text. The contact page keeps a submitted value only if it is
  // one of the strings this model actually offers, so an invented parameter
  // renders nothing at all.
  /** One radio group, drawn as pills or as checkbox-style rows. */
  const group = (
    label: string,
    name: string,
    options: readonly string[],
    selected: number,
    idBase: string,
    /**
     * Whether the sticky bar should report this group.
     *
     * Only the colours. The bar's second line is the model's own spec —
     * "5,80 × 2,28 m · 38 šob" — and replacing it with every choice made the
     * line "Ocean Wave · Moj električar (navodila) · Osnovni": 47 characters
     * of nowrap in a row that already has a name, a price and a button. The
     * colour is the choice a buyer wants confirmed at a glance and the one
     * they cannot see anywhere else once they have scrolled past it; the
     * connection and the service level are two lines of the column they are
     * looking at. See barConfig() in behaviour.ts, which APPENDS rather than
     * replaces.
     */
    inBar = false,
    /**
     * Paint each option as a photographed SWATCH rather than a named pill.
     *
     * ⚠️ THE PICTURE IS A CSS BACKGROUND, NOT AN <img>, and that is what makes
     * this safe to ship before a single swatch has been uploaded. The
     * storefront renders synchronously and cannot ask the bucket what exists;
     * an <img> at a path with nothing behind it is a broken-image icon on the
     * page where somebody is choosing a colour. A background that 404s simply
     * does not paint, so the tile keeps its neutral ground and its NAME —
     * which is precisely the pill this replaces. The page is correct today
     * and better the day the photographs land, with no deploy in between.
     *
     * The URL is the only thing that varies per option, so it rides in as a
     * custom property and every rule that uses it stays in the stylesheet.
     */
    swatch: FinishKind | null = null,
  ): string => {
    if (options.length === 0) return "";
    const labelId = idBase + "-h";
    const pills = !swatch && usesPills(options);
    const rows = options
      .map((o, i) => {
        const id = idBase + "-" + String(i);
        const input =
          '<input class="st-pdp-radio" type="radio" id="' + id + '" name="' + esc(name) +
          '" value="' + esc(o) + '"' + (i === selected ? " checked" : "") + ">";
        if (swatch) {
          return "<li>" + input +
            '<label class="st-pdp-sw" for="' + id + '">' +
            '<span class="st-pdp-sw-img" style="--sw:url(&quot;' +
            esc(finishImageUrl(swatch, o)) + '&quot;)"></span>' +
            '<span class="st-pdp-sw-n">' + esc(o) + "</span></label></li>";
        }
        return pills
          ? "<li>" + input +
            '<label class="st-pdp-pill" for="' + id + '">' + esc(o) + "</label></li>"
          : "<li>" + input +
            '<label class="st-pdp-opt" for="' + id + '">' +
            // A DOT, NOT THE TICK the add-on rows use — see .st-pdp-box.
            '<span class="st-pdp-box"><span class="st-pdp-dot"></span></span>' +
            "<span>" + esc(o) + "</span></label></li>";
      })
      .join("");
    return (
      '<div><h2 class="st-pdp-glabel" id="' + labelId + '">' + esc(label) + "</h2>" +
      '<ul class="' + (swatch ? "st-pdp-sws" : pills ? "st-pdp-pills" : "st-pdp-opts") +
      '" role="radiogroup"' + (inBar ? " data-st-bar" : "") +
      ' aria-labelledby="' + labelId + '">' + rows + "</ul></div>"
    );
  };

  const cfg = d.cfg
    // A group with no options would render a label and a hairline over
    // nothing; drop it rather than draw an empty control surface.
    .map((g, gi) => group(g[0], "cfg" + String(gi), g[1], g[2], "st-pdp-g" + String(gi)))
    .join("");

  // Add-ons. Real controls, unlike the configurator above: each one is a
  // priced option the supplier sells against this model.
  //
  // The total is server-rendered at the base price and upgraded by
  // behaviour.ts as boxes are ticked. Without script the page is still
  // correct — the shell's price is right and every option's price is beside
  // it — which is the same contract the counters and the rail keep.
  const priced = (d.addons ?? []).filter((x) => x.priceCents > 0);
  const all = d.addons ?? [];

  // Grouped, in ADDON_GROUP_ORDER, with anything ungrouped kept first so a
  // shop that never set a group still renders every option it has.
  const order = [
    ...new Set([undefined as string | undefined, ...ADDON_GROUP_ORDER, ...all.map((x) => x.group)]),
  ];
  const rowNo = { n: 0 };
  const groups = order
    .map((g) => {
      const rows = all.filter((x) => x.group === g);
      if (rows.length === 0) return "";
      const head = g ? '<li class="st-pdp-ao-head" aria-hidden="true">' + esc(g) + "</li>" : "";
      return (
        head +
        rows
          .map((x) => {
            rowNo.n += 1;
            const id = "st-ao-" + String(rowNo.n);
            return (
              '<li><label class="st-pdp-ao-lab" for="' + id + '">' +
              // ⚠️ THE VALUE IS THE LABEL AND THE PRICE IS A DATA ATTRIBUTE,
              // which is the other way round from how this started. The box
              // is now inside the enquiry form, so what it submits has to be
              // something the shop can read in an e-mail — "Termo pokrov",
              // not "12900". behaviour.ts reads data-price for the total.
              '<input class="st-pdp-ao-in" type="checkbox" id="' + id + '"' +
              ' name="oprema" data-st-addon' +
              ' data-price="' + String(x.priceCents) + '"' +
              ' value="' + esc(x.label) + '">' +
              '<span class="st-pdp-ao-box">' + CHECK + "</span>" +
              '<span class="st-pdp-ao-name">' + esc(x.label) +
              (x.qty ? ' <span class="st-pdp-ao-qty">' + esc(x.qty) + "</span>" : "") +
              "</span>" +
              '<span class="st-pdp-ao-price">' + esc(x.price) + "</span>" +
              "</label></li>"
            );
          })
          .join("")
      );
    })
    .join("");

  // The summary. An earlier version printed one line — "Skupaj z izbrano
  // opremo" — directly under a list whose default state is nothing selected,
  // so it repeated the price at the top of the column verbatim and read as a
  // rendering fault rather than as a sum. The extras line is what makes the
  // arithmetic legible: it says 0 € until something is ticked, which explains
  // why the two figures match.
  const addons =
    all.length === 0
      ? ""
      : '<fieldset class="st-pdp-ao" data-st-addons>' +
        '<legend class="st-pdp-ao-legend">Dodatna oprema</legend>' +
        '<ul class="st-pdp-ao-list">' + groups + "</ul>" +
        (priced.length > 0 && d.priceCents > 0
          ? '<p class="st-pdp-ao-line"><span>Izbrana oprema</span>' +
            '<span data-st-extras>' + esc(formatEur(0)) + "</span></p>" +
            // One right-anchored group: sum + qualifier. As three loose
            // children of a space-between row the sum floated centred
            // between the label and "z DDV", anchored to neither edge.
            // (The wrapper, not the sum span, because behaviour.ts replaces
            // the sum's textContent on every tick — a qualifier inside it
            // would be wiped by the first add-on.)
            '<p class="st-pdp-ao-total"><span>Skupaj</span>' +
            '<span class="st-pdp-ao-r"><span class="st-pdp-ao-sum" data-st-total data-st-base="' +
            String(d.priceCents) + '">' + esc(d.price) + "</span>" +
            ' <span class="st-vat">z DDV</span></span></p>'
          : "") +
        (d.pricesProvisional
          ? '<p class="st-pdp-ao-note">Cene so informativne in še niso dokončne.</p>'
          : "") +
        "</fieldset>";

  // The assurance row: four promises, two by two, each an icon over a label
  // and a sub-line. The source runs delivery / returns / payment / help, and
  // so does this — with the shop's own promises rather than four invented
  // ones.
  const ICONS = [truckIcon(), returnIcon(), shieldIcon(), helpIcon()];
  const assure = (d.assure ?? []).length
    ? '<ul class="st-pdp-assure">' +
      (d.assure ?? [])
        .map(
          (a, i) =>
            '<li class="st-pdp-assure-i">' +
            (ICONS[i % ICONS.length] ?? "") +
            '<span><span class="st-pdp-assure-h">' + esc(a[0]) + "</span>" +
            '<span class="st-pdp-assure-s">' + esc(a[1]) + "</span></span></li>",
        )
        .join("") +
      "</ul>"
    : "";

  // Collapsible sections. <details>/<summary> rather than a scripted
  // accordion: it opens with no JavaScript, it is in the tab order for free,
  // and a screen reader already knows what an expandable section is. The
  // chevron is the summary's own marker, restyled.
  //
  // The specification is always the first panel and is BUILT from the model
  // rather than written, so it cannot drift from the spec table's source.
  const specRows = d.spec
    .map((row) => '<div class="st-pdp-srow"><dt>' + esc(row[0]) + "</dt><dd>" + esc(dotBind(row[1])) + "</dd></div>")
    .join("");
  // The printable technical sheet, without a PDF pipeline: a print-only
  // letterhead inside the spec panel, a print stylesheet that reduces the
  // page to it, and a button the behaviour script reveals ([data-st-print]
  // → window.print()). The category's better shops hand out per-model spec
  // sheets; a browser already knows how to make one from a page that
  // formats itself for paper — including "print to PDF", which every OS
  // offers, so the shop gets the artefact with no file to maintain.
  const printHead =
    '<div class="st-pdp-printhead" aria-hidden="true">' +
    "<strong>" + esc(ctx.shop.name) + "</strong> · " + esc(ctx.shop.domain) +
    (ctx.phoneDisplay ? " · " + esc(ctx.phoneDisplay) : "") +
    "<br>Tehnični list · " + esc(d.title) +
    (d.price.includes("€") ? " · " + esc(d.price) + " z DDV" : "") +
    // The handed-out artefact must not show a total-looking price
    // with no word on delivery: the freight rows live in .st-pdp-buy,
    // which the print stylesheet hides wholesale. One line restates
    // the composition — the same sentence the buy column carries.
    (d.price.includes("€")
      ? "<br>Cena vključuje zagon, umeritev in predajo; dostava se obračuna po ponudbi."
      : "") +
    "</div>";
  const panels =
    '<div class="st-pdp-panels">' +
    '<details class="st-pdp-panel" open><summary>' +
    '<h3 class="st-pdp-panel-h">Tehnični podatki</h3></summary>' +
    '<div class="st-pdp-panel-b">' + printHead +
    '<dl class="st-pdp-spec-table">' + specRows + "</dl>" +
    '<p class="st-pdp-printrow"><button type="button" class="st-pdp-print" ' +
    'data-st-print hidden>Natisnite tehnični list</button></p>' +
    "</div></details>" +
    (d.panels ?? [])
      .map(
        (x) =>
          '<details class="st-pdp-panel"><summary>' +
          '<h3 class="st-pdp-panel-h">' + esc(x[0]) + "</h3></summary>" +
          '<div class="st-pdp-panel-b"><p>' + esc(x[1]) + "</p></div></details>",
      )
      .join("") +
    "</div>";

  // ---- colour ------------------------------------------------------------
  //
  // The shell finish and the cabinet panel, both as real choices. The shell
  // list was a row of ten unselectable tags until now — the one decision a
  // buyer most wants to make about a EUR 2,400-8,400 object on their terrace,
  // rendered as reference material.
  //
  // ⚠️ NAMES, NOT SWATCHES, AND THAT PART DOES NOT CHANGE. The finishes are
  // marbled acrylics that no hex value describes and that nobody has
  // photographed (catalog/pola.ts records what to ask the supplier for). A
  // drawn circle would be a picture of goods nobody has seen. The note says
  // where the shades can be seen instead, and it says the same thing the
  // panel below has always said: only seven of the ten apply to a given
  // model, and which seven is confirmed on order.
  // ⚠️ THE SENTENCE ABOUT THE ENGLISH NAMES IS NOT FILLER. Reported as a
  // missing translation, and it was half right: the cabinet colours were six
  // plain English colour words on a Slovenian page and are now Slovenian. The
  // shell names are the acrylic manufacturer's own — they identify a
  // particular marbled sheet on an order, and nothing here knows what colour
  // "Canyon" is, so translating them would either invent a description of
  // goods nobody has seen or produce a name the supplier cannot match. Saying
  // whose names they are is what turns the remaining English from an
  // oversight into a fact about the product. See catalog/pola.ts.
  // ⚠️ THIS NOTE USED TO SAY "Odtenkov ne slikamo" — we do not photograph the
  // shades — which is the exact opposite of what the group above it now does.
  // It is written to be true in BOTH states the page can be in: before any
  // swatch is uploaded ("kjer imamo posnet vzorec" covers none of them) and
  // after. What it must never become is a promise that every colour has a
  // picture, because the slots fill one upload at a time.
  //
  // The caveat it replaces is still the honest one and stays: a marbled
  // acrylic photographed under one light, shown on an uncalibrated screen,
  // is a guide and not a binding shade. Saying so is what lets the swatch
  // exist at all — a colour is a main characteristic of the goods, and a
  // picture of it is a statement about them.
  const swatchNote =
    '<p class="st-pdp-swatch-note">' +
    // ⚠️ WHOSE NAMES THESE ARE DEPENDS ON WHICH LIST IS LIVE, and saying the
    // wrong one is not a style problem.
    //
    // While the list is the transcription of the supplier's chart, the names
    // ARE the manufacturer's and the sentence is a fact about the product.
    // Once the shop uploads its own swatches the names are written here — by
    // whoever named the file, or, where the file carried nothing, by a model
    // describing the colour it can see (admin/name-colour.ts). Telling a
    // buyer those are the manufacturer's names would be false, and it is the
    // kind of false that reaches a purchase order: somebody would quote
    // "Peščeno bež" to a supplier who has never heard of it.
    (SHELL_FINISHES_ARE_PHOTOGRAPHED
      ? "Barve školjke so posnete pri nas in poimenovane po odtenku, ki ga " +
        "vidite; proizvajalčevo oznako iz barvne karte potrdimo ob naročilu. "
      : "Imena barv školjke so proizvajalčeva — takšna so tudi na njegovi " +
        "barvni karti, zato jih ne prevajamo. ") +
    "Kjer imamo posnet vzorec, ga vidite ob imenu barve; akril je marmoriran " +
    "in vsak zaslon barvo prikaže nekoliko drugače, zato je posnetek v pomoč " +
    "pri izbiri in ne zavezujoč odtenek. " +
    // ⚠️ THE APOLOGY ONLY APPLIES TO A TRANSCRIBED LIST.
    //
    // "The chart lists ten shades, the model specification lists seven, and
    // we will confirm which seven when you order" is an honest sentence about
    // a list copied out of the SUPPLIER'S chart, which is what this page
    // showed while the colours were hardcoded in catalog/pola.ts.
    //
    // Once the list is the shop's own uploaded swatches it stops being true
    // and starts being confusing: those ARE the colours, there is a
    // photograph behind every one, and nothing is waiting to be narrowed down
    // at order time. Leaving it would tell a buyer that the ten tiles they
    // can see might turn out to be seven.
    (SHELL_FINISHES_ARE_PHOTOGRAPHED
      ? ""
      : "Proizvajalčeva barvna karta našteva deset odtenkov, specifikacija " +
        "modela pa sedem; kateri veljajo za vaš model, potrdimo ob naročilu.") +
    "</p>" +
    // ⚠️ THE SAMPLE BOOK IS AN OFFER, AND IT WAS A SUBORDINATE CLAUSE.
    //
    // "Vzorčnik pošljemo na zahtevo." sat as the fourth sentence of the
    // paragraph above, between "every screen shows the colour differently"
    // and "only seven of the ten shades apply to your model" — the two most
    // discouraging facts on the page, with the one thing that resolves them
    // buried in the middle.
    //
    // The person reading this is standing at a grid of ten marbled acrylics
    // they cannot see, on a €7.000 decision. Posting them the real samples
    // is the obvious next step, it costs them nothing to ask for, and it is
    // the only thing on this page that turns a browser into a conversation.
    // So it gets its own line and a destination.
    //
    // The link carries ?model= like every other enquiry route on the site,
    // so the form at the other end already knows which tub they were looking
    // at when they asked. No new claim: the shop confirmed it sends these,
    // and the sentence promises nothing about price or speed that nobody
    // has stated.
    '<p class="st-pdp-swatch-cta">Barve raje vidite v roki? ' +
    '<a href="' + esc(ctx.shop.routeSlugs["/contact"]) + "?model=" + esc(d.slug) +
    esc(ctx.q ? "&" + ctx.q.slice(1) : "") + '">Naročite vzorčnik barv</a>' +
    " in pošljemo vam ga po pošti.</p>";
  const finishes =
    (d.finishes ?? []).length || (d.cabinetFinishes ?? []).length
      // -1: NO shade arrives pre-checked. With selected = 0 a visitor who
      // never touched the row submitted "Midnight" and "Svetlo siva", and
      // /kontakt printed them back — and put them into the mail body — as
      // the configuration they chose. On a page whose own note says only
      // seven of the ten shades apply to your model, a default finish is a
      // choice the buyer did not make; an untouched radio group contributes
      // nothing to the enquiry, which is the honest reading of untouched.
      ? group("Barva školjke", "barva", d.finishes ?? [], -1, "st-pdp-fin", true, "barva") +
        group("Barva obloge", "obloga", d.cabinetFinishes ?? [], -1, "st-pdp-cab", true, "obloga") +
        swatchNote
      : "";

  // Quantity and the cart. The stepper is a real number input inside a real
  // form that GETs the cart route with what was chosen — there is no cart yet,
  // so it lands on the cart page rather than pretending to add anything. A
  // stepper wired to nothing would be a control that lies.
  // THE PRIMARY CONTROL, AND WHAT IT IS ALLOWED TO PROMISE.
  //
  // It used to be a quantity stepper and a "V košarico" button on every shop,
  // unconditionally. On this one that was a lie told at the worst possible
  // moment: /kosarica answers "Spletno naročanje še ni odprto — naročila
  // zaenkrat sprejemamo po telefonu in e-pošti", so the biggest, blackest
  // thing on a €2,890 page took a visitor who had just decided and told them
  // no. The stepper was the same lie in miniature, counting units of
  // something that cannot be ordered — and nobody buys two hot tubs.
  //
  // So while shop.ordersOnline is false the page asks for the thing the shop
  // can actually do. The destination is /kontakt, which lists the e-mail and
  // the telephone; the line under the button says which channels those are,
  // in the words the cart page uses, so the click is not a surprise either.
  // Flip ordersOnline and the cart controls return with no other change.
  const buy = ctx.shop.ordersOnline
    ? // The quantity and the add button. NOT its own <form> any more — the
      // whole column is one, so a nested form would be invalid HTML and the
      // configuration above it would never reach the cart.
      '<div class="st-pdp-buyrow">' +
      '<span class="st-pdp-qty">' +
      '<label class="st-pdp-vh" for="st-pdp-q">Količina</label>' +
      '<input id="st-pdp-q" name="qty" type="number" value="1" min="1" max="9" step="1" inputmode="numeric">' +
      "</span>" +
      '<button class="st-pdp-add" type="submit">' + esc(d.bar[3]) + "</button>" +
      "</div>"
    : '<div class="st-pdp-buyrow">' +
      // THE MODEL AND THE CONFIGURATION TRAVEL WITH THE ENQUIRY.
      //
      // Without it the visitor arrives at /kontakt having just spent five
      // minutes choosing between three shells, and has to name the one they
      // picked from memory — while the shop receives "(no subject)". The slug
      // is carried in the query, resolved back to a real PdpContent on the
      // contact page (never echoed as text), and becomes the subject line of
      // the message. The canonical link is built from the path alone, so a
      // parameter here creates no second indexable URL.
      //
      // ⚠️ IT IS A SUBMIT BUTTON NOW, NOT A LINK. It used to be an anchor
      // carrying one hand-built query parameter, which was all there was to
      // carry: everything else on the page was inert. The column is a GET form
      // now, so the browser assembles the query out of the controls the
      // visitor actually touched — the connection, the service level, both
      // colours and every ticked extra — and the button's whole job is to
      // submit it. Same destination, same method, more of what was chosen.
      '<button class="st-pdp-add" type="submit">Povprašajte za ponudbo</button>' +
      "</div>" +
      '<p class="st-pdp-chan">Naročila sprejemamo po telefonu in e-pošti. ' +
      "Vašo izbiro pripnemo k povpraševanju.</p>";

  const freight = d.freight
    .map(
      (r) =>
        '<div class="st-pdp-frow"><dt>' + esc(r[0]) + "</dt>" +
        "<dd" + (r[2] ? ' class="st-pdp-inc"' : "") + ">" + esc(r[1]) + "</dd></div>",
    )
    .join("");

  return (
    '<section class="st-pdp">' +
    '<div class="st-pdp-in">' +

    // Above the grid, not inside the buy column. The grid puts the gallery
    // first in the DOM so it can be column one on desktop, so a breadcrumb in
    // the buy column lands ~600px down a phone — below the stage and both
    // rows of thumbs — which is nowhere for a navigation aid. Here it is the
    // first thing in <main> at every width, which is where a <nav> landmark
    // is looked for and where every other storefront puts this trail.
    crumbs(ctx) +

    '<div class="st-pdp-grid">' +
    // --- gallery: one stage plus a thumb strip (see gallery()). data-st-slider
    // arms behaviour.ts only when there is more than one photograph — with one
    // (or with the drawing fallback) there is nothing to page through, and the
    // script's own guard would bail anyway.
    // data-art is the frame's aspect ratio, read off the model's own card —
    // a swim spa is a 2.5:1 object and a hot tub a square one, and the frame
    // is the biggest thing on the page to get that wrong in.
    '<div class="st-pdp-gallery"' +
    (art ? ' data-art="' + art + '"' : "") +
    ((ctx.pdp.photos ?? []).length > 1 ? " data-st-slider" : "") + ">" +
    gallery(ctx) + "</div>" +

    // --- buy column ---
    '<div class="st-pdp-buy">' +
    '<p class="st-pdp-eyebrow">' + esc(d.eyebrow) + "</p>" +
    '<h1 class="st-pdp-title">' + esc(d.title) + "</h1>" +
    // Price directly under the title, as the source has it. It used to sit
    // below the paragraph, which buried the one number the page is about.
    '<p class="st-pdp-price"' +
    (provisional ? ' aria-describedby="st-pdp-prov"' : "") + ">" +
    // The struck price's only cue is the line through it, and most screen
    // readers announce neither <s> nor text-decoration — so the row would read
    // as two unqualified prices, the higher one last. A hidden word inside
    // each carries the distinction into the accessibility tree (commerce.ts
    // does the same on the card).
    '<span class="st-pdp-now"><span class="st-pdp-vh">cena </span>' +
    esc(d.price) + "</span>" +
    (was
      ? '<s class="st-pdp-was"><span class="st-pdp-vh">prejšnja cena </span>' +
        esc(was) + "</s>"
      : "") +
    // "z DDV" only where there IS a price. With the dash (PRICE_UNSET, shown
    // when catalog/pricing.ts can derive nothing) the row read "— z DDV",
    // which states a tax treatment for a figure that does not exist.
    (d.priceCents > 0 ? '<span class="st-pdp-vat">z DDV</span>' : "") +
    "</p>" +
    // The provisional disclosure, AT the price. The same sentence already
    // renders under the add-on total, ~2,000px further down and behind
    // fourteen checkboxes — which is a note about the total, not about the
    // number a visitor reads first. ZVPot (Directive 98/6/EC) is about the
    // price shown against an identified product being clear at the point it
    // is shown; a €8,000 figure that reads as final for two thousand pixels
    // is not. Verbatim, not rewritten: the claim is the content layer's.
    (provisional
      ? '<p class="st-pdp-prov" id="st-pdp-prov">Cene so informativne in še niso dokončne.</p>'
      : "") +
    '<p class="st-pdp-sub">' + esc(d.sub) + "</p>" +
    // Standfirst, then the CONTROL, then the four promises that sit under a
    // control everywhere on the web — and only then the reference material.
    //
    // The shell colours used to sit between the standfirst and the buy row:
    // ten unselectable pills, 185px at 1440 and 217px at 390, in front of the
    // one control in this column. Measured at 1440x900 that put the button's
    // bottom edge at 837px with the sticky bar's top edge at 825 — the page's
    // primary CTA was twelve pixels under the bar at first paint. It is also
    // the wrong order on its own terms: the panel below says only SEVEN of
    // those ten are actually available per model, which makes the row
    // reference rather than a step in the decision. Moved below the promises,
    // the button lands at 598-652 and is clear of the bar at every height.
    // ⚠️ THE COLUMN IS ONE FORM, FROM THE BUTTON DOWN TO THE LAST EXTRA.
    //
    // The button is ABOVE the controls it submits, which is deliberate and
    // costs nothing: a form's controls are collected wherever they sit, and
    // the visual QA measured the CTA landing twelve pixels under the sticky
    // bar when the colour row was above it. So the order stays price →
    // standfirst → button → promises → colour → configuration → extras, and
    // pressing the button at the top submits everything below it.
    //
    // GET, not POST: the destination is a page that shows the enquiry back to
    // the visitor, so it must be reloadable, linkable and back-button safe.
    // Nothing here changes state.
    '<form class="st-pdp-form" method="get" action="' +
    esc(
      ctx.shop.ordersOnline
        ? ctx.shop.routeSlugs["/cart"]
        : ctx.shop.routeSlugs["/contact"],
    ) + '">' +
    '<input type="hidden" name="model" value="' + esc(d.slug) + '">' +
    buy +
    assure +
    // ⚠️ THE COLOURS AND THE CONFIGURATION ARE ONE BLOCK, and they were two.
    //
    // .st-pdp-finish was a plain div with a margin on top holding two groups
    // and a note, none of which had any rhythm between them — so "BARVA
    // OBLOGE" sat directly on the last row of shell-colour pills, close enough
    // to read as part of it. Reported as bad spacing, and it was: the pills
    // wrap to three rows on a hot tub, and the heading of the next question
    // landed in the gap the third row left.
    //
    // .st-pdp-cfg was already a flex column with the gap these need. They are
    // the same kind of thing — questions with answers — so they go in the same
    // container and take one rhythm for the whole configurator instead of one
    // rule per group.
    (finishes || cfg
      ? '<div class="st-pdp-cfg">' + finishes + cfg + "</div>" +
        // THE NUMBER, ONLY WHILE THERE IS ONE. This sentence carried a live
        // tel: link to "+386 00 000 000" — the placeholder, underlined and
        // dialable, in the middle of the configuration block on a €2,890
        // page. It is the same fault the header had, in the one place a
        // visitor is most likely to act on it: they have just read that the
        // combination they want needs a call. Without a number the sentence
        // says to write instead, which is the channel that actually works.
        // ⚠️ THIS SENTENCE USED TO SAY THE OPPOSITE. It read "Prikazana je
        // izbrana konfiguracija" and then told the visitor to telephone for
        // any other combination, because the rows above it could not be
        // pressed. They can now, so it says what the choice is FOR — this
        // shop takes orders by telephone and e-mail, and the honest promise
        // is that the selection reaches the enquiry rather than a basket.
        '<p class="st-pdp-cfg-note">Izbrano pripnemo k povpraševanju, ' +
        "da vam pripravimo ponudbo prav za to kombinacijo. " +
        (isSetPhone(ctx.phoneDisplay)
          ? 'Lahko nas tudi pokličete na <a href="' +
            esc(ctx.phoneHref) + '">' + esc(ctx.phoneDisplay) + "</a>."
          : 'Lahko nam tudi <a href="' +
            esc(ctx.shop.routeSlugs["/contact"] + ctx.q) + '">pišete</a>.') +
        "</p>"
      : "") +
    addons +
    "</form>" +
    '<section class="st-pdp-freight" aria-labelledby="st-pdp-fh">' +
    '<h2 class="st-pdp-glabel" id="st-pdp-fh">Dostava in montaža</h2>' +
    '<dl class="st-pdp-frows">' + freight + "</dl>" +
    '<p class="st-pdp-note">' + esc(d.note) + "</p>" +
    "</section>" +
    "</div></div>" +

    // THE REFERENCE MATERIAL SITS UNDER THE ROW, NOT IN THE DECISION COLUMN.
    //
    // The panels were the last thing in .st-pdp-buy, so the spec table
    // inherited the buy column's width — while the gallery column beside it,
    // by then scrolled past, was holding nothing but a photograph. Measured,
    // that gave the value cell 25.1 characters at 1024, 30.9 at 1280, 35.0 at
    // 1440 and 36.4 at 1920, against values of up to 39; most rows wrapped,
    // and a wrapped row is 75px where an unwrapped one is 49. No split of a
    // 443px column can hold 45 characters beside a term, so the column was
    // the wrong container rather than the split being the wrong ratio.
    //
    // Below the row it has the whole band: 974px at 1024 through 1560 at
    // 1920, laid out as one or two columns of rows by the measure rule in
    // .st-pdp-spec-table. The panels are reference — the specification, the
    // description, the care notes — read after the decision rather than
    // during it, so this is also where they belong in reading order. The
    // heading level is unchanged (h3 under the h2s above it).
    panels +

    "</div>" +
    // --- the rest of the range, as the source's "you may also like" ---
    renderStudioTestimonials(ctx) +
    alsoLike(ctx) +

    // --- §4.1 chrome band as the sticky buy bar ---
    // The bar's CTA follows the column's, for the same reason: it is the same
    // promise, made a second time in the one control that is on screen at
    // every scroll position. bar[3] is the content layer's cart label and is
    // used only where a cart exists.
    '<div class="st-pdp-bar"><div class="st-pdp-bar-in">' +
    '<span class="st-pdp-sum">' +
    '<span class="st-pdp-sum-name">' + esc(d.bar[0]) + "</span>" +
    '<span class="st-pdp-sum-cfg">' + esc(d.bar[1]) + "</span>" +
    "</span>" +
    // Same figure, same hook: a bar that keeps showing the base price while
    // the total above it has moved is worse than a bar with no price.
    '<span class="st-pdp-bar-price"' +
    (priced.length > 0 && d.priceCents > 0
      ? ' data-st-total data-st-base="' + String(d.priceCents) + '"'
      : "") +
    ">" + esc(d.bar[2]) + "</span>" +
    // The one price on screen at every scroll position was the one
    // without "z DDV" — only where a figure exists, though: the bar
    // must not qualify "cena po povpraševanju".
    (d.bar[2].includes("€") ? ' <span class="st-vat">z DDV</span>' : "") +
    '<a class="st-pdp-cta" href="' +
    esc(
      ctx.shop.ordersOnline
        ? ctx.shop.routeSlugs["/cart"] + ctx.q
        : ctx.shop.routeSlugs["/contact"] + ctx.q,
    ) +
    (ctx.shop.ordersOnline ? "" : (ctx.q ? "&" : "?") + "model=" + encodeURIComponent(d.slug)) +
    '">' +
    esc(ctx.shop.ordersOnline ? d.bar[3] : "Povpraševanje") + "</a>" +
    "</div></div>" +
    "</section>"
  );
}

/* ==== REMOVED: §4.13's two secondary-page devices ======================= *
 *
 * renderStudioShopHero(), renderStudioFilters() and their upperFirst() helper
 * stood here for months and NO ROUTE ever called any of them — not
 * renderCollection() in src/render/page.ts, not renderShopHub(), not
 * src/themes/studio/index.ts, which never re-exported them. They were dead on
 * arrival, and the file header records the merits argument for leaving them
 * dead rather than wiring them up. Their stylesheets went with them.
 */
