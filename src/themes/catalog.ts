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

export type ThemeKey = "zarja" | "lednik" | "salon" | "studio";

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

export const THEME_CATALOG: Record<ThemeKey, ThemeCatalogEntry> = {
  /**
   * ZARJA — ember editorial. Near-black warm ground, serif display
   * (Fraunces), hairline rules, sharp edges, numbered acts. Evening-spa
   * mood: heat products at dusk. The moat section sits high — the promise
   * is the story.
   */
  zarja: {
    key: "zarja",
    name: "Zarja",
    voice: "Temna, žareča, uredniška — izdelek kot večerni ritual.",
    surface: "dark",
    radius: { card: "0px", control: "999px" },
    displayFont: "Fraunces",
    recommendedFor: ["heat", "wellness"],
    composition: {
      home: ["hero", "trust", "products", "moat", "reviews", "guides"],
    },
  },

  /**
   * LEDNIK — glacial precision. Near-white cold ground, extra-wide grotesk
   * (Archivo Expanded), thin rules, data-forward: stat tiles directly under
   * the hero, spec-sheet energy throughout. Cold and recovery products.
   */
  lednik: {
    key: "lednik",
    name: "Lednik",
    voice: "Hladna, natančna, merljiva — tehnični list kot oblikovanje.",
    surface: "light",
    radius: { card: "4px", control: "4px" },
    displayFont: "Archivo",
    recommendedFor: ["cold"],
    composition: {
      home: ["hero", "stats", "products", "moat", "reviews", "guides"],
    },
  },

  /**
   * STUDIO — poster commerce, ported from the owner's FURNEXA Framer theme:
   * black chrome bar over a white page, oversized expanded-grotesk
   * statements, a scrolling USP marquee, near-monochrome with the shop
   * accent used only as punctuation. Photography-first by construction.
   */
  studio: {
    key: "studio",
    name: "Studio",
    voice: "Črno-bela, plakatna, fotografska — tipografija kot naslovnica.",
    surface: "light",
    radius: { card: "8px", control: "2px" },
    displayFont: "Archivo",
    recommendedFor: ["wellness", "neutral"],
    composition: {
      home: ["hero", "marquee", "products", "trust", "moat", "reviews", "guides"],
    },
  },

  /**
   * SALON — bright gallery. Warm cream ground, elegant single-weight serif
   * display (Marcellus), generous whitespace, soft arches on imagery,
   * products first — the piece speaks before the pitch. Wellness furniture.
   */
  salon: {
    key: "salon",
    name: "Salon",
    voice: "Svetla, galerijska, umirjena — izdelek kot kos pohištva.",
    surface: "light",
    radius: { card: "18px", control: "999px" },
    displayFont: "Marcellus",
    recommendedFor: ["wellness", "neutral"],
    composition: {
      home: ["hero", "products", "trust", "reviews", "moat", "guides"],
    },
  },
};
