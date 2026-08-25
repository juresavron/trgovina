import type { RenderCtx } from "../../render/sections";
import type { SectionKey } from "../shared/sections";
import { STUDIO_TOKENS } from "./tokens";
import { STUDIO_EFFECTS_CSS } from "./effects";
import { STUDIO_CHROME_CSS, renderStudioHeader, renderStudioFooter } from "./chrome";
import {
  STUDIO_HERO_CSS,
  renderStudioHero,
  renderStudioWordmarkBand,
  renderStudioMarquee,
} from "./hero";
import {
  STUDIO_COMMERCE_CSS,
  renderStudioProducts,
  renderStudioRail,
  renderStudioSwimSpas,
} from "./commerce";
import { STUDIO_STATEMENT_CSS, renderStudioStatement, renderStudioStats } from "./statement";
import {
  STUDIO_EDITORIAL_CSS,
  renderStudioImpact,
  renderStudioTestimonials,
  renderStudioGuides,
} from "./editorial";
import { STUDIO_PDP_CSS, renderStudioPdp } from "./pdp";
import { STUDIO_JS } from "./behaviour";
import { STUDIO_FONT_FACE_CSS } from "./fonts";
import {
  STUDIO_CLOSING_CSS,
  renderStudioSocial,
  renderStudioMembership,
} from "./closing";

/**
 * The studio theme's public surface — one import for the render pipeline.
 *
 * Order matters: tokens declare the variables every module consumes, so they
 * lead; effects come last so its transitions can override a module's resting
 * state without a specificity fight.
 */
export const STUDIO_CSS =
  // @font-face first: the faces must be declared before anything asks for
  // them. Self-hosted, so this replaces a render-blocking third-party
  // stylesheet rather than adding to one (scripts/vendor-fonts.mjs).
  STUDIO_FONT_FACE_CSS +
  STUDIO_TOKENS +
  STUDIO_CHROME_CSS +
  STUDIO_HERO_CSS +
  STUDIO_COMMERCE_CSS +
  STUDIO_STATEMENT_CSS +
  STUDIO_EDITORIAL_CSS +
  STUDIO_PDP_CSS +
  STUDIO_CLOSING_CSS +
  STUDIO_EFFECTS_CSS;

export { renderStudioHeader, renderStudioFooter, renderStudioPdp, STUDIO_JS };

/**
 * The two bands that always close the page, in the source's own order: the
 * social strip, then the membership banner, then the footer.
 *
 * They are appended AFTER the composition rather than keyed into it, because
 * the composition varies per shop (the anti-doorway control in ShopConfig) and
 * these two do not — every shop ends the same way. Keying them to a section
 * would have put them wherever that key happened to land, which for one shop
 * was three sections from the top.
 */
export function renderStudioClosing(ctx: RenderCtx): string {
  return renderStudioSocial(ctx) + renderStudioMembership(ctx);
}

/**
 * Studio's own section renderers, keyed by the kernel's section vocabulary.
 *
 * A key absent here falls back to the kernel renderer, so studio can adopt
 * devices incrementally without a page ever rendering a hole. `wordmark` has
 * no kernel equivalent — it is studio's alone, injected by the composition
 * below rather than added to the shared vocabulary.
 */
const STUDIO_SECTIONS: Partial<Record<SectionKey, (ctx: RenderCtx) => string>> = {
  hero: renderStudioHero,
  marquee: renderStudioMarquee,
  products: renderStudioProducts,
  moat: renderStudioStatement,
  stats: renderStudioStats,
  reviews: renderStudioTestimonials,
  guides: renderStudioGuides,
  trust: renderStudioImpact,
};

export function renderStudioSection(key: SectionKey, ctx: RenderCtx): string | null {
  const fn = STUDIO_SECTIONS[key];
  return fn ? fn(ctx) : null;
}

/**
 * Devices with no kernel section key, placed by position in the home
 * composition.
 *
 * The category rail is the source's SECOND device, immediately after the hero
 * and its ticker — not a follow-up to the product grid, which is where it used
 * to sit. Reading the source's DOM settled the running order: hero → category
 * rail → brand story → offer band → best sellers → "why us" → testimonials →
 * blogs → social → membership.
 *
 * The wordmark band is not on the source's home page at all; it belongs to the
 * secondary pages. It stays here after `moat` because our composition is
 * shorter than the source's ten devices and the band is doing real work as a
 * breath between the editorial half and the closing sections — a deliberate
 * departure rather than a transcription.
 */
export function renderStudioExtras(afterKey: SectionKey, ctx: RenderCtx): string {
  if (afterKey === "marquee") return renderStudioRail(ctx);
  // The second family sits directly under the first grid, so the category
  // rail's two cards land on two neighbouring sections rather than on one
  // page and one hole.
  if (afterKey === "products") return renderStudioSwimSpas(ctx);
  if (afterKey === "moat") return renderStudioWordmarkBand(ctx);
  return "";
}
