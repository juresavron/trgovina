import type { ShopPalette } from "../shared/palette";
import type { TypeMap } from "../shared/typeScale";

/**
 * ZARJA — ember editorial dark. Contract per docs/THEMES.md:
 * getZarjaColors() is called ONCE, in the template entry; no section
 * computes color. Surfaces are the theme's signature; accents come from the
 * shop palette so every shop wears Zarja in its own hue.
 */

export interface ZarjaColors {
  bg: string;
  bgAlt: string;
  surface: string;
  line: string;
  ink: string;
  inkSoft: string;
  inkMute: string;
  accent: string;
  accentText: string;
  onAccent: string;
  wash: string;
}

export const getZarjaColors = (p: ShopPalette): ZarjaColors => ({
  bg: "#171210",
  bgAlt: "#1e1815",
  surface: "#241d18",
  line: "#372c24",
  ink: "#f0e7dc",
  inkSoft: "#cdbda9",
  inkMute: "#9d8b76",
  accent: p.accent,
  accentText: p.accentBright, // dark ground → bright accent ink
  onAccent: p.onAccent,
  wash: p.wash,
});

export const ZARJA_FONT_DISPLAY = "'Fraunces', Georgia, serif";
export const ZARJA_FONT_BODY = "'Hanken Grotesk', system-ui, sans-serif";

export const ZARJA_TYPE: TypeMap = {
  heroTitle: { family: "display", weight: 440, size: "display", leading: "tight", tracking: "-0.015em" },
  pageTitle: { family: "display", weight: 440, size: "section", leading: "tight", tracking: "-0.01em" },
  sectionTitle: { family: "display", weight: 460, size: "section", leading: "tight", tracking: "-0.01em" },
  cardTitle: { family: "display", weight: 500, size: "title", leading: "snug" },
  price: { family: "body", weight: 800, size: "title", leading: "snug" },
  quote: { family: "display", weight: 400, size: "title", leading: "snug", italic: true },
  statValue: { family: "display", weight: 480, size: "section", leading: "tight" },
  body: { family: "body", weight: 400, size: "body", leading: "normal" },
  bodySmall: { family: "body", weight: 400, size: "small", leading: "normal" },
  heroDescription: { family: "body", weight: 400, size: "title", leading: "normal" },
  label: { family: "body", weight: 700, size: "dense", leading: "snug", tracking: "0.14em", uppercase: true },
  labelSoft: { family: "mono", weight: 400, size: "dense", leading: "snug", tracking: "0.06em" },
  detail: { family: "body", weight: 400, size: "dense", leading: "snug" },
};
