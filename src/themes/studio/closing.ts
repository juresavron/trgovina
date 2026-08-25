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
 *   MEMBER   A full-bleed band on one wide scene photograph under a dark
 *            scrim: h2 heading, one supporting line, one primary button.
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
import { OWN_PHOTOS, decorativeImg, pick } from "./media";

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
    /* The membership band's height and its scrim.
     *
     * 78% is a computed floor, not a taste call. The worst case for white text
     * over a dark scrim is a blown-out photograph: at 78% over pure white the
     * composite ground is #484848, and --on-invert lands at 9.1:1. A real
     * SCENE is far darker than that, so 4.5:1 holds AT ANY PHOTO — including
     * the shop photography that replaces these placeholders later, which is
     * the whole point of fixing the floor rather than the picture.
     *
     * What that same arithmetic rules out: --on-invert-mute on the same ground
     * is 3.67:1. So the supporting line below is white, and carries its
     * hierarchy by rung and measure instead of by ink. */
    --studio-mem-min: clamp(420px, 44vw, 620px);
    --studio-mem-scrim: color-mix(in srgb, var(--ink-invert) 78%, transparent);
  }

  /* ================= Social strip ================= */
  :root[data-theme="studio"] .st-soc {
    background: var(--bg);
    padding-block: var(--studio-rhythm);
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
  :root[data-theme="studio"] .st-soc-img {
    flex: none;
    inline-size: var(--studio-soc-tile);
    block-size: var(--studio-soc-tile);
    margin-inline-end: var(--studio-card-gap);
    object-fit: cover;
    border-radius: var(--r-media);
    /* The tile's ground until its file lands — decorativeImg ships
     * loading="lazy", and a tile that scrolls in under transform can paint a
     * frame or two late. The panel grey reads as an empty tile, not a hole. */
    background: var(--bg-alt);
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

  /* ================= Membership band ================= */
  :root[data-theme="studio"] .st-mem {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    display: grid;
    align-items: center;
    min-block-size: var(--studio-mem-min);
    padding-block: clamp(56px, 7vw, 130px);
    /* The ground under the photograph, so the band is never a white gap while
     * the file is in flight. */
    background: var(--ink-invert);
  }
  /* The photograph fills the band; layout height comes from min-block-size and
   * the padding, never from the image, so nothing shifts when it lands. */
  :root[data-theme="studio"] .st-mem-photo {
    position: absolute;
    inset: 0;
    z-index: 0;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
  }
  /* One flat scrim across the whole band rather than a gradient. A gradient
   * would let the photo breathe, and would also mean the copy's contrast
   * depends on where its column happens to land at a given viewport — the
   * arithmetic above only holds if the density under the text is fixed. The
   * cost is real (the photograph reads as texture, not as a picture) and is
   * the right cost: this imagery is atmosphere, per media.ts. */
  :root[data-theme="studio"] .st-mem-scrim {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: var(--studio-mem-scrim);
  }
  :root[data-theme="studio"] .st-mem-in {
    position: relative;
    z-index: 2;
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
  /* A band heading, so the h2 rung (60/50/38) whole. */
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
  /* The supporting line — the lead rung (20/16/18). White, not
   * --on-invert-mute: see the scrim's arithmetic above. Its hierarchy comes
   * from the rung and the narrower measure. */
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
    :root[data-theme="studio"] .st-mq-viewport.st-soc-viewport { padding-inline-end: 0; }
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
  const group = [0, 1, 2, 3, 4, 5]
    .map((i) => pick(OWN_PHOTOS, ctx.shop.key, i))
    .map((m) => decorativeImg(m, "st-soc-img", TILE_SIZES))
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
 * on every ShopConfig) and a team to ask before spending €3–15k. Nothing here
 * offers a newsletter or an account, because no such thing is built — the
 * source's band signs you up to a membership, and rendering that button would
 * be the same dead control §5.2 rules out.
 *
 * The keyword is interpolated in the ACCUSATIVE, which is the case "izbrati"
 * governs: "Pomagamo vam izbrati infrardečo savno" / "… biljardno mizo" /
 * "… masažni fotelj". No adjective in the sentence agrees with the keyword,
 * on purpose — the six shops' head terms are feminine and masculine, and a
 * "pravo/pravi" in front of the slot would be wrong for half of them.
 *
 * The button reuses .st-btn-light, the theme's on-dark primary (white fill,
 * --ink label): its own opaque surface, so 18.3:1 regardless of the photo, and
 * its edge against the scrim is 9.1:1 in the worst case — well past the 3:1
 * that WCAG 1.4.11 asks of a control boundary.
 *
 * NO PHOTOGRAPH. This was a full-bleed borrowed scene under a scrim. The
 * scrim was already carrying the contrast on its own — it is what the 9.1:1
 * above is measured against — so removing the picture leaves the band exactly
 * as legible and lets it read as what it is: a dark panel with an invitation
 * on it. The shop's own photography is studio shots on white, which is the
 * one thing that cannot go behind white type.
 */
export function renderStudioMembership(ctx: RenderCtx): string {
  return (
    '<section class="st-mem" aria-labelledby="st-mem-h">' +
    '<span class="st-mem-scrim" aria-hidden="true"></span>' +
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
