import type { ShopPalette } from "../shared/palette";
import type { TypeMap } from "../shared/typeScale";

/**
 * SALON — bright gallery. Cream ground, Marcellus display (one weight,
 * classical proportions), soft arches, whitespace as the main material.
 */

export interface SalonColors {
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

export const getSalonColors = (p: ShopPalette): SalonColors => ({
  bg: "#faf7f2",
  bgAlt: "#f2ede4",
  surface: "#ffffff",
  line: "#e2dacd",
  ink: "#211c15",
  inkSoft: "#54493a",
  inkMute: "#6d6152",
  accent: p.accent,
  accentText: p.accentDeep,
  onAccent: "#ffffff",
  wash: p.wash,
});

export const SALON_FONT_DISPLAY = "'Marcellus', 'Times New Roman', serif";
export const SALON_FONT_BODY = "'Hanken Grotesk', system-ui, sans-serif";

export const SALON_TYPE: TypeMap = {
  heroTitle: { family: "display", weight: 400, size: "display", leading: "tight", tracking: "0.005em" },
  pageTitle: { family: "display", weight: 400, size: "section", leading: "tight" },
  sectionTitle: { family: "display", weight: 400, size: "section", leading: "tight" },
  cardTitle: { family: "display", weight: 400, size: "title", leading: "snug" },
  price: { family: "body", weight: 700, size: "title", leading: "snug" },
  quote: { family: "display", weight: 400, size: "title", leading: "snug", italic: false },
  statValue: { family: "display", weight: 400, size: "section", leading: "tight" },
  body: { family: "body", weight: 400, size: "body", leading: "normal" },
  bodySmall: { family: "body", weight: 400, size: "small", leading: "normal" },
  heroDescription: { family: "body", weight: 400, size: "title", leading: "normal" },
  label: { family: "body", weight: 600, size: "dense", leading: "snug", tracking: "0.2em", uppercase: true },
  labelSoft: { family: "mono", weight: 400, size: "dense", leading: "snug", tracking: "0.06em" },
  detail: { family: "body", weight: 400, size: "dense", leading: "snug" },
};
