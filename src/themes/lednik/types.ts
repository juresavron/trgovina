import type { ShopPalette } from "../shared/palette";
import type { TypeMap } from "../shared/typeScale";

/**
 * LEDNIK — glacial precision light. Data-forward: stat tiles, spec-sheet
 * energy, extra-wide grotesk display set tight and often uppercase.
 */

export interface LednikColors {
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

export const getLednikColors = (p: ShopPalette): LednikColors => ({
  bg: "#f3f6f9",
  bgAlt: "#e9eef4",
  surface: "#ffffff",
  line: "#d3dce5",
  ink: "#0f1922",
  inkSoft: "#3c4f5e",
  inkMute: "#57697a",
  accent: p.accent,
  accentText: p.accentDeep, // light ground → deep accent ink
  onAccent: "#ffffff",
  wash: p.wash,
});

export const LEDNIK_FONT_DISPLAY = "'Archivo', 'Helvetica Neue', sans-serif";
export const LEDNIK_FONT_BODY = "'Hanken Grotesk', system-ui, sans-serif";
/** Display face runs expanded — the width IS the voice. */
export const LEDNIK_DISPLAY_STRETCH = "120%";

export const LEDNIK_TYPE: TypeMap = {
  heroTitle: { family: "display", weight: 740, size: "display", leading: "tight", tracking: "-0.01em" },
  pageTitle: { family: "display", weight: 700, size: "section", leading: "tight" },
  sectionTitle: { family: "display", weight: 700, size: "section", leading: "tight", tracking: "-0.005em" },
  cardTitle: { family: "display", weight: 650, size: "title", leading: "snug" },
  price: { family: "display", weight: 750, size: "title", leading: "snug" },
  quote: { family: "body", weight: 500, size: "title", leading: "snug" },
  statValue: { family: "display", weight: 780, size: "section", leading: "tight" },
  body: { family: "body", weight: 400, size: "body", leading: "normal" },
  bodySmall: { family: "body", weight: 400, size: "small", leading: "normal" },
  heroDescription: { family: "body", weight: 400, size: "title", leading: "normal" },
  label: { family: "display", weight: 700, size: "dense", leading: "snug", tracking: "0.16em", uppercase: true },
  labelSoft: { family: "mono", weight: 400, size: "dense", leading: "snug", tracking: "0.06em" },
  detail: { family: "body", weight: 400, size: "dense", leading: "snug" },
};
