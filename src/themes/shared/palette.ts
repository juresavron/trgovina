/**
 * Shop accent palette factory — the ONE place accent color math happens.
 *
 * Ported rule from simple-site-11a8fbdb: `getTemplatePalette()` is called
 * once, in the theme's color factory; no section ever computes color. Ours
 * takes the shop's accent tokens (ShopConfig.design) and returns a ramp the
 * theme factories compose with their surfaces.
 *
 * oklch with FIXED LIGHTNESS per rung is the contrast discipline (onlyworld
 * doctrine): hue and chroma are the shop's identity, lightness belongs to
 * the system, so every shop/theme pairing lands on the same measured-contrast
 * geometry. The source repo goes further (derivePaletteShades /
 * ensureContrastAcross measure real ratios and step shades until AA passes);
 * that port arrives with the chassis — the fixed-L rungs below are chosen so
 * the standard pairings (bright-on-dark, deep-on-light) clear AA by margin.
 */

export interface ShopPalette {
  /** Mid accent — fills, buttons. */
  accent: string;
  /** Accent as TEXT on dark surfaces (L .78). */
  accentBright: string;
  /** Accent as TEXT on light surfaces (L .42). */
  accentDeep: string;
  /** Ink on accent fills. */
  onAccent: string;
  /** Accent at low alpha for borders/washes. */
  wash: string;
}

export function getShopPalette(hue: number, chroma: number): ShopPalette {
  const c = Math.min(Math.max(chroma, 0.05), 0.14);
  return {
    accent: `oklch(0.68 ${c} ${hue})`,
    accentBright: `oklch(0.78 ${Math.min(c, 0.12)} ${hue})`,
    accentDeep: `oklch(0.42 ${c} ${hue})`,
    onAccent: `oklch(0.16 0.02 ${hue})`,
    wash: `oklch(0.68 ${c} ${hue} / 0.14)`,
  };
}
