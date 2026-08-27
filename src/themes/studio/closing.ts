/**
 * STUDIO — the two closing acts, the last bands before the footer.
 *
 *   SOCIAL   A centred label rung ("Sledite nam" + the shop's own handle),
 *            then a FULL-BLEED strip of square photographs that tickers past
 *            continuously, with a separately layered dark card floating dead
 *            centre over it carrying a short heading and one primary button.
 *            In the source the card is NOT one of the ticker tiles — it is a
 *            sibling layer, which is why it stays put while the strip moves.
 *            On phone the source shifts it to top:0 / left:22.5% / width:55%.
 *   MEMBER   A full-bleed dark panel, one flat opaque token deep: h2 heading,
 *            one supporting line, one primary button. It was a wide scene
 *            photograph under a scrim; both are gone, and the band states its
 *            own colour rather than compositing one.
 *
 * REUSE, NOT A SECOND TICKER. The marquee technique — the doubled track, the
 * st-marquee keyframes, the hover/focus pause and, crucially, the focusable
 * checkbox that satisfies WCAG 2.2.2 — already exists in effects.ts. This
 * module marks up .st-mq / .st-mq-pause / .st-mq-toggle / .st-mq-viewport /
 * .st-mq-track / .st-mq-group / .st-mq-clone verbatim and adds only .st-soc-*
 * classes for what is genuinely different here: tiles are images rather than
 * words, the strip runs edge to edge instead of sitting in a bordered band,
 * and a card is layered on top. A second ticker implementation would mean a
 * second pause mechanism to keep compliant, and effects.ts already says the
 * marquee is one device.
 *
 * Two consequences of that reuse are load-bearing, so they are stated once
 * here rather than rediscovered:
 *
 *  1. hero.ts styles .st-mq as the USP band it renders there — white ground,
 *     hairline top and bottom, gutter padding, flex row. None of that belongs
 *     to a full-bleed photo strip, so every override below is written as the
 *     COMPOUND selector `.st-mq.st-soc-mq` (0,4,0). That beats hero's (0,3,0)
 *     no matter which order the render pipeline concatenates the two sheets
 *     in — this module must not care where it is wired.
 *  2. The checkbox id must differ from hero's `st-mq-pause`. Two elements with
 *     the same id on one page means one <label for> silently drives the wrong
 *     control, and both devices can appear on the same home page. Hence
 *     `st-soc-pause`.
 *
 * IMAGERY. ROOMS and SCENES only — atmosphere, per media.ts's split. The
 * cutout/tile product imagery is deliberately NOT used: this strip sits
 * directly under the shop's own handle, so a stranger's dining chair here
 * reads as "this is what we sell", which is the exact claim media.ts refuses
 * to let placeholder furniture make. Every tile is aria-hidden with an empty
 * alt (decorativeImg) — the strip is decoration, and a screen reader listing
 * six room interiors between two real calls to action is noise.
 *
 * Type comes from the ramp in tokens.ts, colour from its tokens; nothing here
 * declares a size, a tracking, a leading or a hex. The only new custom
 * properties are the two geometries the source measures that no token carries
 * (--studio-soc-*, --studio-mem-*), declared once, here.
 *
 * Every selector is scoped :root[data-theme="studio"] — zarja/lednik/salon
 * share this sheet.
 */

import { esc, type RenderCtx } from "../../render/sections";
import { OWN_PHOTOS, decorativeImg, sitePhoto } from "./media";

export const STUDIO_CLOSING_CSS = `
  /* ---- Geometry the source measures that tokens.ts does not carry ---- */
  :root[data-theme="studio"] {
    /* The strip's square tile. Its edge IS the strip's height, so it is set
     * once and consumed for both dimensions and for the card's vertical
     * placement — the band can never disagree with itself about how tall it
     * is, which is what keeps CLS at zero before the images arrive. The floor
     * is high (240px) on purpose: it is the phone tier, where the card sits
     * over the strip and needs room to clear the tiles. */
    --studio-soc-tile: clamp(240px, 30vw, 420px);
    /** The source's floating card: 366px wide. */
    --studio-soc-card: 366px;
    /* The membership band's height floor.
     *
     * --studio-mem-scrim is GONE, and the arithmetic that used to stand here
     * with it. It computed the worst case for white text over a 78% veil on a
     * blown-out photograph (#484848, 9.1:1) — a number that stopped meaning
     * anything the day the photograph was deleted. Measured on the page as it
     * actually renders, the veil was 78% of #151515 over a band already
     * filled with #151515: it darkened the ground by one 8-bit step, from
     * rgb(21,21,21) to rgb(20,20,20). Its only real effect was to put the
     * band on a colour that no token names.
     *
     * The old floor, clamp(420px, 44vw, 620px), was sized to hold that
     * photograph — a full-bleed scene needs height to read as a picture. With
     * no picture it framed 295px of copy inside a 620px band at 1440: 325px
     * of empty dark, more than the copy it was framing. The band's height is
     * now its content plus one band's worth of air (padding-block on .st-mem),
     * and this is a floor in the literal sense — the number that stops a shop
     * with a short keyword and a one-line paragraph from ending its page on a
     * stripe.
     *
     * Measured against the rendered band, content+padding is 492px at 1440,
     * 360px at 1024, 383px at 390 and 410px at 320, and the floor resolves to
     * 490 / 380 / 380 / 380. So it binds at exactly one tier — the tablet, the
     * one where the supporting line collapses to a single 539px row and the
     * band would otherwise be its shortest — and loses everywhere else. A
     * floor that binds at every tier is not a floor, it is the height, which
     * is what the 620px was. */
    --studio-mem-min: clamp(380px, 34vw, 500px);
  }

  /* ================= Social strip ================= */
  :root[data-theme="studio"] .st-soc {
    background: var(--bg);
    /* BOTTOM ONLY — see --studio-rhythm. This section shares the page's white
     * ground with its neighbour, so the separation between them is paid once,
     * here, exactly as the source pays it (0 40px 170px). Paying it on both
     * sides is what made every boundary twice the source's. */
    padding-block: 0 var(--studio-rhythm);
    /* The strip is wider than the viewport by design; the page must never
     * scroll sideways because of it. */
    overflow: clip;
  }

  /* The label rung above the strip: "Sledite nam" + the handle, centred in the
   * container while the strip below it runs edge to edge. --ink-mute is the
   * AA-safe muted rung (5.17:1 on white); the handle itself steps up to --ink
   * because it is the name being claimed. */
  :root[data-theme="studio"] .st-soc-label {
    max-inline-size: var(--studio-container);
    margin: 0 auto clamp(18px, 2vw, 36px);
    padding-inline: var(--studio-gutter);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--gap-sm);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-soc-handle {
    color: var(--ink);
    /* A long brand name is the fallback handle, and it must fold rather than
     * push the centred row off-centre. */
    overflow-wrap: anywhere;
  }

  /* The ticker shell. hero.ts's .st-mq is that module's own band — ground,
   * hairlines, gutter, flex row — so all of it is unwound here and only
   * effects.ts's behaviour is kept. overflow is opened back up (the VIEWPORT
   * still clips the track, below) so the floating card can bleed past the
   * strip's edge on a narrow screen instead of being sliced, and so its focus
   * ring is never clipped. */
  :root[data-theme="studio"] .st-mq.st-soc-mq {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--gap-md);
    padding: 0;
    background: none;
    border-block: 0;
    overflow: visible;
  }
  /* The pause control sits ABOVE the strip on the white ground, on the gutter,
   * never over the photographs: its ink (--ink-mute) and its boundary
   * (--line-ctrl, the 3:1 rung) are both white-ground values, and floating
   * them over an arbitrary photo would void both.
   *
   * min-block-size raises the target to 44px. effects.ts's own chip is 32px —
   * WCAG 2.5.8 asks 24px so it passes, but this project's floor is 44px, and
   * that file is not mine to edit in this pass. */
  :root[data-theme="studio"] .st-mq-toggle.st-soc-toggle {
    display: inline-flex;
    align-items: center;
    justify-self: end;
    margin-inline-end: var(--studio-gutter);
    min-block-size: 44px;
  }
  /* The strip proper. An explicit block-size reserves the band before a single
   * byte of image arrives, and it is the same variable the tiles are sized
   * from, so the two cannot drift. */
  :root[data-theme="studio"] .st-mq-viewport.st-soc-viewport {
    position: relative;
    block-size: var(--studio-soc-tile);
    padding: 0;
  }
  :root[data-theme="studio"] .st-mq-track.st-soc-track { align-items: center; }
  /* Square tiles.
   *
   * The gap between them is a trailing MARGIN on every tile, not a flex gap on
   * the track. That is the seam: effects.ts loops by translating the doubled
   * track exactly -50%, which lands the clone on the original only if the two
   * groups are the same width AND the space between them equals the space
   * inside them. A flex gap on the track adds one extra gap that -50% then
   * halves, and the ticker drifts by half a gap every lap. A trailing margin
   * puts that space inside the group, where the doubling accounts for it. */
  /* THE TILE IS A BOX NOW, AND THE PICTURE SITS IN IT.
   *
   * A hairline was the previous answer to "cutouts on a white sweep dissolve
   * into a white page", and it did not hold: with object-fit COVER the file
   * paints the whole tile, so the panel grey underneath was never visible and
   * all that separated a photograph from the page was one pixel of #dfdfdf.
   * Shot at 1440 the strip read as four faint outlines with products floating
   * loose inside them — the exact failure the hairline was added to prevent.
   *
   * The impact grid solved the same problem for the same files (see
   * .st-imp-hero in editorial.ts): give the picture a real ground and let
   * multiply resolve the sweep into it. Multiply needs a BACKDROP to blend
   * with, and an element cannot blend with its own background, so the ground
   * moves to a wrapper — which also gives the tile a stable box for the
   * marquee's seam maths. Everything the seam depends on now lives here:
   * width, the trailing margin, and nothing that can learn about a border.
   *
   * Contain rather than cover, for the reason the tiles that already use it
   * do: this well mixes 900x900 hot tubs with 900x620 swim spas, and cover
   * throws away a third of the wider file's width — the part with the product
   * in it. */
  :root[data-theme="studio"] .st-soc-tile {
    flex: none;
    position: relative;
    isolation: isolate;
    overflow: hidden;
    inline-size: var(--studio-soc-tile);
    block-size: var(--studio-soc-tile);
    margin-inline-end: var(--studio-card-gap);
    border-radius: var(--r-media);
    background: var(--bg-alt);
  }
  :root[data-theme="studio"] .st-soc-img {
    inline-size: 100%;
    block-size: 100%;
    padding: 7%;
    object-fit: contain;
    /* White times ground is ground: the sweep disappears into the tile and
     * what is left standing on it is the product. */
    mix-blend-mode: multiply;
  }
  /* One perceived speed across tiers, and slow enough to look at a picture.
   *
   * effects.ts runs every marquee at 38s per half-track, and a half-track
   * here is 6 x (tile + 24px gap): 2664px at the 420px desktop tile but only
   * 1584px on the phone floor — same duration, so the desktop strip ran
   * 70 px/s against the phone's 42 px/s (measured), which is words-ticker
   * pace, not photograph pace. 64s brings the desktop half-track to
   * 2664 / 64 = 41.6 px/s — the phone's own measured speed — so the band
   * moves at one pace everywhere and each tile gets ~10s in view instead of
   * ~6. Scoped to the strip (0,5,0 beats effects' 0,3,0) above the same
   * 809px line the card move below uses, so the tiers never overlap; the
   * phone tier keeps effects.ts's 38s, which at its 1584px half-track is
   * already 41.7 px/s. Duration only — keyframes, hover/checked pause and
   * the reduced-motion stop all stay effects.ts's. */
  @media (min-width: 810px) {
    :root[data-theme="studio"] .st-mq.st-soc-mq .st-mq-track { animation-duration: 64s; }
  }

  /* The floating card. Not a tile: a sibling layer, absolutely placed over the
   * strip, so the ticker moves underneath it and it stays legible.
   *
   * Vertical placement is measured from the BOTTOM of the shell rather than
   * from its middle — the shell also holds the pause row, so a plain top:50%
   * would centre the card on shell+control and sit visibly low on the strip.
   * calc(100% - tile/2) is the strip's own centre, exactly, at every tier.
   *
   * The ground is OPAQUE --ink-invert. A translucent card would make the
   * heading's contrast depend on whichever photograph happens to be behind it
   * at that moment of the loop — a 4.5:1 guarantee that is only true some of
   * the time is not a guarantee. Opaque, it is 18.3:1 always. */
  :root[data-theme="studio"] .st-soc-card {
    position: absolute;
    z-index: 2;
    top: calc(100% - var(--studio-soc-tile) / 2);
    left: 50%;
    transform: translate(-50%, -50%);
    inline-size: min(86%, var(--studio-soc-card));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(14px, 1.4vw, 26px);
    padding: clamp(20px, 2.2vw, 36px) clamp(18px, 2vw, 32px);
    border-radius: var(--r-card);
    background: var(--ink-invert);
    text-align: center;
  }
  /* A card title, so the h5 rung (32/26/24) whole — the same rung the guide
   * cards use for the same job. The h2 ELEMENT is the document outline; the
   * rung is the size, and inside a 366px card the h2 rung would not fit two
   * words. */
  :root[data-theme="studio"] .st-soc-h {
    margin: 0;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--on-invert);
    text-wrap: balance;
    overflow-wrap: break-word;
    hyphens: none;
  }

  /* ---- Phone tier: the source moves the card to the top of the strip ----
   * Transcribed: top:0 / left:22.5% / width:55%. Left+width there is simply
   * "centred at 55%", so only the vertical move is a real change, and it is
   * kept — translate(-50%, 0) against the strip's top edge.
   *
   * The 55% width is NOT kept, and that is the one deliberate deviation in
   * this file: 55% of a 390px phone is 214px, and at the phone ramp that is a
   * card whose heading breaks mid-word and whose button label wraps inside
   * --ctrl-pad. The source is an English furniture site with a two-word
   * heading; Slovenian retail copy is longer. min(86%, 366px) keeps the card's
   * measured maximum and lets it use the phone's width, which costs some of
   * the strip's visible tile and buys a card that can actually be read. */
  @media (max-width: 809px) {
    :root[data-theme="studio"] .st-soc-card {
      top: calc(100% - var(--studio-soc-tile));
      transform: translate(-50%, 0);
    }
  }

  /* ================= Membership band =================
   *
   * THE GROUND IS --ink-invert-2, NOT --ink-invert, AND THAT IS THE WHOLE
   * REASON THIS BAND STILL READS AS A BAND. chrome.ts fills the footer with
   * --ink-invert, and this section is the last thing above it, so on that
   * same token the page ends in one continuous 1,300px dark mass (492px of
   * band and 819px of footer, measured at 1440) with the closing statement
   * the same colour as the colophon.
   *
   * It is worth being exact about what separated them before, because the
   * answer is an accident and accidents are what this audit is for: sampled
   * off the rendered page there is a one-pixel rule of rgb(237,237,237)
   * between the two, and it is not studio's. It comes from the kernel's
   * element-level footer rule in render/css.ts, which sets border-top
   * --line-soft for a footer standing on --bg-alt; .st-foot overrides that
   * background and leaves the border. So the page's closing statement was
   * being held apart from its colophon by a near-white hairline drawn for a
   * light footer that studio does not render. That is not a boundary to
   * depend on.
   *
   * --ink-invert-2 is the palette's declared dark-on-dark separation rung
   * (#2e2e2e, tokens.ts), and the step it makes against the footer measures
   * 1.34:1 — the same perceptual weight --line carries on white (1.33:1),
   * which is this theme's own answer to "two surfaces, no rule between them".
   * The band is now a surface in its own right whether or not the borrowed
   * hairline survives someone else's pass over the footer.
   *
   * That the band could afford to move at all is measured, not assumed. Every
   * run on it is --on-invert, and white on #2e2e2e is 13.58:1 against a 4.5:1
   * floor — see .st-mem-h below. The white button keeps its own opaque fill,
   * so its label is unchanged at 18.26:1 and its edge against the band is
   * 13.58:1, four times what WCAG 1.4.11 asks of a control boundary.
   *
   * THREE RULES USED TO LIVE HERE AND ARE GONE, all of them scaffolding for a
   * photograph that no longer exists:
   *
   *  - .st-mem-photo — the full-bleed <img>. The markup stopped emitting it
   *    when the borrowed scene was deleted; the CSS stayed, styling nothing.
   *  - .st-mem-scrim — a 78%-opaque veil of --ink-invert over a band already
   *    painted --ink-invert. Measured on the rendered page it moved the ground
   *    by one 8-bit step (rgb(21,21,21) to rgb(20,20,20)) and put the band on
   *    a colour no token names. A semi-transparent black is a fragile way to
   *    draw a dark panel: the composite is whatever happens to be behind it.
   *    An opaque token cannot be wrong about its own colour.
   *  - position/isolation/overflow here and position/z-index on .st-mem-in —
   *    the stacking context that ordered photo, scrim and copy. With one
   *    child left in flow there is nothing to stack, and overflow:hidden on a
   *    section that no longer bleeds anything past its edge is a clip waiting
   *    to eat a focus ring. (body carries overflow-x:clip globally, so the
   *    page's sideways scroll was never this rule's job.) */
  :root[data-theme="studio"] .st-mem {
    display: grid;
    align-items: center;
    min-block-size: var(--studio-mem-min);
    padding-block: clamp(56px, 6.5vw, 120px);
    background: var(--ink-invert-2);
  }
  :root[data-theme="studio"] .st-mem-in {
    inline-size: 100%;
    max-inline-size: var(--studio-container);
    margin-inline: auto;
    padding-inline: var(--studio-gutter);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(14px, 1.6vw, 30px);
    text-align: center;
  }
  /* A band heading, so the h2 rung (60/50/38) whole. It is an h2 ELEMENT too:
   * the hero owns the page's only h1, and this section names itself through
   * aria-labelledby, so the outline gets one band-level heading and no
   * invented level.
   *
   * --on-invert on --ink-invert-2 is 13.58:1, sampled off the rendered
   * composite with the brightest-pixel method (scripts/verify-hero-contrast)
   * rather than computed from the token — the point of that method is that a
   * token cannot tell you what is actually under a glyph. The measurement is
   * the same at 1440, 1024, 390 and 320, because the ground is now one flat
   * opaque fill at every tier instead of a veil over something. */
  :root[data-theme="studio"] .st-mem-h {
    margin: 0;
    max-inline-size: var(--studio-read);
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h2);
    letter-spacing: var(--ls-h2);
    line-height: var(--lh-h2);
    color: var(--on-invert);
    text-wrap: balance;
    overflow-wrap: break-word;
    hyphens: none;
  }
  /* The supporting line — the lead rung (20/16/18), also 13.58:1.
   *
   * It stays WHITE, and the reason is no longer the one that used to be
   * written here. Under the old veil --on-invert-mute measured 3.67:1 and was
   * simply illegal; on --ink-invert-2 it is 5.45:1 and would pass. It is
   * still not used: 5.45:1 is 21% of headroom over a legal floor for the one
   * sentence on the page that has to survive a phone in sunlight, and the
   * hierarchy this line needs is already carried by the rung (20px against
   * the heading's 60px) and by the measure (--studio-read-narrow, 620px,
   * against the heading's 863px). Buying a little greyness with most of the
   * contrast margin is a bad trade at the bottom of a page. */
  :root[data-theme="studio"] .st-mem-p {
    margin: 0;
    max-inline-size: var(--studio-read-narrow);
    font-family: var(--f-body);
    font-size: var(--t-lead);
    font-weight: var(--w-body-med);
    letter-spacing: var(--ls-body);
    line-height: var(--lh-lead);
    color: var(--on-invert);
    text-wrap: pretty;
  }
  /* One extra step of remove before the control, and it is the only geometry
   * this band adds to .st-btn-light.
   *
   * The stack was heading / 23px / line / 23px / button at 1440 (measured),
   * which spaces the page's last call to action exactly like a third line of
   * copy — it read as part of the sentence rather than as the thing to press.
   * --gap-sm is the theme's own micro rung (10px, the most-used gap in the
   * source), so the button sits at 33px where the paragraph sits at 23px:
   * enough to separate the act from the argument, not enough to detach it.
   * Nothing else about the control is touched — fill, ink, padding, radius,
   * hover and focus ring all stay hero.ts's, which is what keeps this button
   * the same object as the one in the hero and in the social card. */
  :root[data-theme="studio"] .st-mem-in .st-btn-light {
    margin-block-start: var(--gap-sm);
  }

  /* ---- Motion ----
   * effects.ts already resolves the ticker to its end state under reduced
   * motion (animation off, clone hidden, track wrapped). Three consequences
   * are this module's:
   *
   *  - Wrapping is right for a row of words and wrong for fixed 420px tiles:
   *    they would stack into a ragged grid and blow the band's reserved
   *    height. Restored to one row, clipped by the viewport. The tiles are
   *    decorative and aria-hidden, so clipping the overflow loses nothing —
   *    and a static strip means no scroll container to make keyboard-operable.
   *  - hero.ts pads the viewport's trailing edge to the gutter there, which is
   *    right for its wrapped word set and wrong for a full-bleed strip.
   *  - hero.ts hides .st-mq-toggle there, because the control would toggle an
   *    animation that no longer runs. Correct — but the compound selectors
   *    above outrank it (a media query adds no specificity), so this module
   *    has to hide its own toggle explicitly or it would resurrect a dead
   *    control for exactly the users who asked for less motion. */
  @media (prefers-reduced-motion: reduce) {
    :root[data-theme="studio"] .st-mq-track.st-soc-track {
      width: max-content;
      flex-wrap: nowrap;
    }
    /* No padding-inline-end reset here any more: hero.ts's reduced-motion
     * gutter pad on .st-mq-viewport is (0,3,0), and this module's base
     * padding: 0 on the compound (0,4,0) already outranks it — the reset
     * was re-winning a fight the base rule had already won. */
    :root[data-theme="studio"] .st-mq-toggle.st-soc-toggle { display: none; }
  }
`;

/** The strip's rendered tile edge, mirroring --studio-soc-tile for `sizes`. */
const TILE_SIZES = "(max-width: 809px) 240px, (max-width: 1400px) 30vw, 420px";

/**
 * The shop's own social identity, or nothing invented in its place.
 *
 * ShopConfig.socials holds profile URLs for schema.org sameAs, and every shop
 * on the network currently ships `socials: {}` — so the branch that matters in
 * production today is the empty one. The handle is DERIVED from a URL that
 * exists (its last path segment, with youtube's leading "@" normalised away)
 * and otherwise falls back to the shop's own name, unprefixed: "@finskasavna"
 * when no such account exists is a fabricated identity on a page whose entire
 * job is trust.
 *
 * The same emptiness decides the card's button, because §5.2 forbids a dead
 * control: with a profile it opens the profile, without one it goes to the
 * shop's contact page — a real destination, and one no other band on this
 * page claims (the membership band closes on the showroom).
 */
function socialIdentity(ctx: RenderCtx): { handle: string; href: string; cta: string } {
  const s = ctx.shop.socials;
  const url = s.instagram ?? s.facebook ?? s.youtube ?? "";
  const path = (url.split(/[?#]/)[0] ?? "").replace(/\/+$/, "");
  const seg = path.slice(path.lastIndexOf("/") + 1).replace(/^@/, "");
  if (url && seg) {
    return { handle: "@" + seg, href: url, cta: "Obiščite naš profil" };
  }
  return {
    handle: ctx.shop.name,
    href: ctx.shop.routeSlugs["/contact"] + ctx.q,
    cta: "Pišite nam",
  };
}

/**
 * Social strip — label, full-bleed image ticker, floating dark card.
 *
 * The markup order is not cosmetic: effects.ts's pause selectors are
 * `.st-mq-pause:focus-visible + .st-mq-toggle` and
 * `.st-mq-pause:checked ~ .st-mq-viewport .st-mq-track`, so the checkbox, its
 * label and the viewport must be siblings in that order. The card comes after
 * the viewport, which puts it last in the tab order too — the strip's control
 * first, then the card's link, matching the visual order down the band.
 *
 * Six tiles of the shop's OWN product photography, seeded per index so the
 * set is stable across renders — a strip that reshuffles on reload looks
 * broken. It used to be three borrowed rooms and three borrowed scenes, which
 * made the band a furniture mood board under a hot tub shop's handle. Its own
 * product is both more honest and more interesting.
 *
 * Renders nothing at all when the shop has no photography: six empty frames
 * scrolling past is worse than an absent band.
 *
 * The group is emitted twice; the clone is aria-hidden, so a screen reader
 * that ignores the empty alts still never meets the set twice.
 */
export function renderStudioSocial(ctx: RenderCtx): string {
  const id = socialIdentity(ctx);
  if (OWN_PHOTOS.length === 0) return "";
  // A CONSECUTIVE run of offsets, because consecutive is what keeps the six
  // tiles six DIFFERENT pictures at any pool size: pick() indexes mod
  // OWN_PHOTOS.length, and six consecutive integers stay distinct mod any
  // n >= 6 — so no tile ever repeats, and in particular the seam pair (last
  // tile against the clone's first) can never be the same photograph however
  // the pool grows or shrinks. A hand-picked scatter of offsets would lose
  // that guarantee the day the pool count changes.
  //
  // ⚠️ THE RUN AND ITS COLLISION LIST NOW LIVE IN admin/site-images.ts, WHERE
  // THEY ARE CHECKED. This comment used to name the taken offsets in prose —
  // "2 and 13 (editorial tiles), 5 (hero), 7 and 11 (statement)" — and the
  // statement band moved to 23 and 25 without anybody updating it. The strip's
  // first tile and the story band's large frame then both resolved offset 25:
  // the same photograph twice on one page, which is the precise fault the
  // list was written to prevent. A prose list of numbers cannot hold across
  // edits; a test can, and site-images.test.ts is it.
  // ⚠️ SIX NAMED SLOTS NOW. The run of consecutive offsets below stays as each
  // slot's FALLBACK (admin/site-images.ts), and the note above is why the run
  // is consecutive rather than scattered — that argument still governs what a
  // slot falls back to when nobody has uploaded to it. What it no longer
  // governs is what the strip SHOWS: this is the shop's own gallery band, and
  // which six pictures are in it is the owner's call.
  const group = ["galerija-1", "galerija-2", "galerija-3", "galerija-4", "galerija-5", "galerija-6"]
    .map((slot) => sitePhoto(slot))
    .map(
      (m) =>
        // The wrapper is the tile — ground, radius and the trailing margin the
        // marquee's -50% seam is measured from. See .st-soc-tile.
        '<span class="st-soc-tile">' +
        decorativeImg(m, "st-soc-img", TILE_SIZES) +
        "</span>",
    )
    .join("");

  return (
    '<section class="st-soc" aria-labelledby="st-soc-h">' +
    '<p class="st-soc-label"><span>Sledite nam</span>' +
    '<span class="st-soc-handle">' + esc(id.handle) + "</span></p>" +
    '<div class="st-mq st-soc-mq">' +
    // Own id: hero.ts's ticker already owns "st-mq-pause" and both devices can
    // land on the same home page.
    '<input class="st-mq-pause" id="st-soc-pause" type="checkbox">' +
    '<label class="st-mq-toggle st-soc-toggle" for="st-soc-pause" ' +
    'aria-label="Ustavi ali zaženi drsenje slik"></label>' +
    '<div class="st-mq-viewport st-soc-viewport">' +
    '<div class="st-mq-track st-soc-track">' +
    '<div class="st-mq-group">' + group + "</div>" +
    '<div class="st-mq-group st-mq-clone" aria-hidden="true">' + group + "</div>" +
    "</div></div>" +
    '<div class="st-soc-card">' +
    '<h2 class="st-soc-h" id="st-soc-h">Ostanimo v stiku</h2>' +
    '<a class="st-btn-light" href="' + esc(id.href) + '">' + esc(id.cta) + "</a>" +
    "</div></div></section>"
  );
}

/**
 * Membership band — the last thing above the footer.
 *
 * The copy is network-wide, so it promises only what every shop on this
 * network actually has: a showroom route (routeSlugs["/showroom"] is required
 * on every ShopConfig) and a team to ask before spending €2,400–8,400, which
 * is what this shop's catalogue actually spans (the €3–15k that used to stand
 * here was a range from before the hot tubs and swim spas were priced).
 * Nothing here offers a newsletter or an account, because no such thing is
 * built — the source's band signs you up to a membership, and rendering that
 * button would be the same dead control §5.2 rules out.
 *
 * The two sentences it renders are typed HERE rather than read from
 * src/content, which is a deviation from the rule that copy is content and
 * worth stating plainly: it is the one band on the home page whose words no
 * shop can vary. That was deliberate while the network had six storefronts
 * and this was the sentence they were allowed to share; with one shop left it
 * is simply copy in the wrong file. Moving it is a ShopContent type change
 * and so belongs to a content pass, not to this one.
 *
 * The keyword is interpolated in the ACCUSATIVE, which is the case "izbrati"
 * governs: "Pomagamo vam izbrati infrardečo savno" / "… biljardno mizo" /
 * "… masažni fotelj". No adjective in the sentence agrees with the keyword,
 * on purpose — the six shops' head terms are feminine and masculine, and a
 * "pravo/pravi" in front of the slot would be wrong for half of them.
 *
 * ONE CONTROL, AND IT IS THE SHOWROOM ON PURPOSE. The obvious challenge to
 * that is that the shop converts on a phone call or an enquiry, not on a
 * visit — true, and it is already answered two hundred pixels higher up.
 * socialIdentity() above sends the social card to routeSlugs["/contact"]
 * whenever a shop has no profile to link (every shop on the network today
 * ships socials: {}), so the closing pair as rendered is enquiry, then
 * showroom: two destinations, no repetition, in that order. Pointing this
 * button at /contact as well would put the same href in two consecutive
 * bands, and the second one would be the louder — the page would end by
 * saying the same thing twice.
 *
 * The showroom is also worth the click on its own terms now. /razstavni-salon
 * is a written page, not the stub it was when this band was built: it states
 * that visits are arranged by phone, tells a visitor to bring room dimensions
 * and a photograph of the access route, and carries the address block. For
 * goods at €2,400–8,400 that is the trust anchor, which is exactly what
 * ShopConfig's route table calls it.
 *
 * What this band cannot fix by itself is the conditional: the moment a shop
 * fills in socials, the card above becomes a link to Instagram and the
 * enquiry leaves the closing region entirely, with this button the only thing
 * left. That is a decision spanning both renderers, and the social strip is
 * not this pass's to change — flagged rather than half-done.
 *
 * The button reuses .st-btn-light, the theme's on-dark primary (white fill,
 * --ink label). Every figure below is sampled off the rendered pixels, not
 * computed from the tokens: the resting label is 18.26:1 on the button's own
 * opaque white; the button's edge against --ink-invert-2 is 13.58:1, where
 * WCAG 1.4.11 asks 3:1 of a control boundary; hovered, the fill lands on
 * rgb(218,218,218) and holds the label at 13.06:1 with the edge still at
 * 9.71:1; and the focus ring is 2px of white at a 3px offset, so it sits on
 * the band rather than on the button it is ringing — 13.58:1 against the
 * ground, with the band showing through the offset as a dark gap that reads
 * the ring as a ring rather than as a fatter button. The target measures
 * 293x54 at 1440 and 259x50 at 390 and 320, past the 44px floor at every
 * tier; at 320 it is 259px inside a 270px content box, which is the width
 * that decides whether the label can stay on one line.
 *
 * NOTHING HERE ANIMATES, so there is no reduced-motion branch to write. The
 * one transition in play is .st-btn-light's background-color, which hero.ts
 * already stops under prefers-reduced-motion and which the kernel's global
 * transition kill in css.ts stops a second time.
 *
 * NO PHOTOGRAPH, AND NOW NO SCRIM EITHER. This was a full-bleed borrowed
 * scene under a 78% veil. The scene was deleted first and the veil was left
 * behind, at which point it was 78% of --ink-invert over a band already
 * painted --ink-invert: measured on the page, a one-step shift from
 * rgb(21,21,21) to rgb(20,20,20), a transparency whose composite depended on
 * whatever happened to sit underneath it, and a ground that matched no token.
 * It is gone, and the band states its colour outright. The shop's own
 * photography is studio cutouts on white, which is the one thing that cannot
 * go behind white type, so nothing replaces the picture.
 */
export function renderStudioMembership(ctx: RenderCtx): string {
  return (
    // No scrim span: the band's ground is a token, so there is nothing to
    // veil and nothing to veil it with. See the header.
    '<section class="st-mem" aria-labelledby="st-mem-h">' +
    '<div class="st-mem-in">' +
    '<h2 class="st-mem-h" id="st-mem-h">Pomagamo vam izbrati ' +
    esc(ctx.shop.keyword.accusative) + "</h2>" +
    '<p class="st-mem-p">Oglejte si modele v živo in se pred nakupom ' +
    "posvetujte z našo ekipo.</p>" +
    '<a class="st-btn-light" href="' +
    esc(ctx.shop.routeSlugs["/showroom"] + ctx.q) +
    '">Obiščite razstavni salon</a>' +
    "</div></section>"
  );
}
