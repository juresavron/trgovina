/**
 * The section vocabulary — the kernel's units of page composition.
 *
 * Influences, deliberately combined:
 *  - simple-site-11a8fbdb THEMES_GUIDE.md: every theme renders the same
 *    section vocabulary through its own components; visibility is gated per
 *    tenant, and a ContentSections router owns the composition.
 *  - Shopify OS 2.0: a page is a JSON composition of schema'd sections —
 *    themes differ by composition and treatment, not by bespoke pages.
 *
 * A theme MUST be able to render every section key; a shop's page is an
 * ordered list of keys (the theme's preset, overridable per shop). That is
 * the whole anti-doorway mechanism at the layout level: two shops on the
 * same theme still compose differently.
 */
export type SectionKey =
  | "hero" // THE keyword statement + primary CTA
  | "trust" // trust strip: delivery, warranty, showroom, financing
  | "marquee" // scrolling USP ticker (studio's signature; renders trust items)
  | "stats" // spec/performance tiles (lednik's hero support)
  | "finder" // guided 3-question chooser
  | "products" // product grid from catalog rows
  | "moat" // delivery & installation timeline — the logistics promise
  | "reviews" // verified reviews only
  | "guides" // buying-guide teasers (SEO long-tail → money pages)
  | "financing" // installment explainer band
  | "showroom" // visit invitation
  | "faq"; // FAQPage schema carrier

/** A page is an ordered composition of sections — max length guarded so a
 *  composition stays a page, not a scroll of everything (Shopify caps at 25;
 *  we cap far lower because considered-purchase pages are 5–8 acts). */
export const MAX_SECTIONS_PER_PAGE = 10;

export interface ThemeComposition {
  /** Homepage act order. */
  home: SectionKey[];
}
