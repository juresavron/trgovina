import type { ThemeComposition } from "./shared/sections";

/**
 * themeCatalog — single source of truth for theme METADATA.
 *
 * Direct port of the simple-site-11a8fbdb pattern: the registry (chassis
 * stage) will own the React components; THIS file owns the rules around
 * them — what a theme is for, which product temperaments it is recommended
 * for, its surface and edge policy, and its default composition. The admin
 * picker and the public resolver both consult the catalog so they never
 * drift.
 *
 * Themes are named in the house tradition (gostilna, konoba, lokal …):
 * Slovene words, lowercase keys, ASCII.
 */

export type ThemeKey = "studio";

/** Soft hint for the picker — a theme stays selectable for every shop. */
export type ProductTemperament = "heat" | "cold" | "wellness" | "neutral";

export interface ThemeCatalogEntry {
  key: ThemeKey;
  /** Display name (Slovene, capitalized). */
  name: string;
  /** One-line voice description shown in the picker. */
  voice: string;
  /** Ground the theme commits to. A theme is ONE world, not two modes. */
  surface: "dark" | "light";
  /** Edge policy — the source repo's "sharp edge" rule, made a token. */
  radius: { card: string; control: string };
  /** Display font stack key resolved by themeFonts (chassis stage). */
  displayFont: string;
  recommendedFor: ProductTemperament[];
  /** Default act order; a shop may override, length-capped by sections.ts. */
  composition: ThemeComposition;
}

/**
 * ONE THEME. zarja (ember editorial), lednik (clinical spec-first) and salon
 * (bright gallery) lived here alongside studio, and the QA host carried a bar
 * for switching between them.
 *
 * They existed to serve the anti-doorway rule: six single-keyword shops from
 * one owner on one design is the site-network pattern Google polices, so the
 * shops differed by theme as well as by copy. The network is one shop now, so
 * three of the four themes had no shop to wear them, and the switcher offered
 * a choice of one against a choice of one at the top of every page.
 *
 * The SHAPE stays: ThemeCatalogEntry, the per-shop `design.theme` key and the
 * renderer's theme dispatch are all untouched, so adding a second theme is
 * adding an entry rather than rebuilding the mechanism. What went is three
 * unworn designs and the furniture for choosing between them.
 */
export const THEME_CATALOG: Record<ThemeKey, ThemeCatalogEntry> = {
  studio: {
    key: "studio",
    name: "Studio",
    voice: "Plakatna in fotografska — tipografija kot naslovnica, jantar kot poudarek.",
    surface: "light",
    radius: { card: "8px", control: "4px" },
    displayFont: "Chivo",
    recommendedFor: ["wellness", "neutral"],
    composition: {
      /**
       * The source's own running order, read off its DOM (10 devices between
       * header and footer): hero → category rail → brand story → offer band →
       * best sellers → "why us" + counters → testimonials → blog cards →
       * social ticker → membership band.
       *
       * Mapped onto the kernel vocabulary, with two notes. The ticker sits at
       * the BOTTOM EDGE of the hero on desktop (absolutely positioned) and
       * reflows to a following block on smaller tiers, so `marquee` directly
       * after `hero` is the honest expression of it. The category rail has no
       * kernel key and is injected by renderStudioExtras — it belongs at
       * position 2, not after the product grid where it used to sit.
       */
      home: ["hero", "marquee", "moat", "products", "stats", "reviews", "guides", "trust"],
    },
  },

  /**
   * SALON — bright gallery. Warm cream ground, elegant single-weight serif
   * display (Marcellus), generous whitespace, soft arches on imagery,
   * products first — the piece speaks before the pitch. Wellness furniture.
   */
};
