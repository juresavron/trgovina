/**
 * Shared typography scale — single source of truth for sizes & leading
 * across ALL themes. Ported doctrine from simple-site-11a8fbdb
 * (shared/typeScale.ts), including its consolidation lessons:
 *
 *  - Themes expose the same typography ROLES; only weight/tracking/family
 *    vary per theme. Sizes never drift between themes.
 *  - A small canonical scale beats a large one: 6 rungs.
 *  - `small` deliberately equals `body` on phones — fewer distinct sizes on
 *    small screens is the point, not a collision.
 *
 * DTCG framing (W3C Design Tokens 2025.10): these are the PRIMITIVE tier.
 * Theme role maps (ZARJA_TYPE, …) are the SEMANTIC tier. Components consume
 * only roles — never raw sizes.
 */

/** Canonical 6-step scale. CSS clamp() values (the chassis has no Tailwind). */
export const SIZE = {
  /** Homepage hero H1. */
  display: "clamp(2.6rem, 6vw, 4.75rem)",
  /** Section heading H2. */
  section: "clamp(1.7rem, 3.2vw, 2.5rem)",
  /** Card / item title. */
  title: "clamp(1.15rem, 1.6vw, 1.35rem)",
  /** Standard body copy. */
  body: "clamp(1rem, 1.1vw, 1.06rem)",
  /** Metadata, spec rows, footer. Equals body on phones — deliberate. */
  small: "1rem",
  /** Rare: pins, eyebrows, dense chrome. Never below this. */
  dense: "0.8rem",
} as const;

export const LEADING = {
  tight: 1.05,
  snug: 1.25,
  normal: 1.6,
} as const;

/**
 * Role vocabulary every theme's *_TYPE map must cover. Components use a role
 * from the map — never a raw size. (ESLint enforcement lands with the
 * chassis, same rule the source repo scopes to its templates directory.)
 */
export type TypeRole =
  | "heroTitle"
  | "pageTitle"
  | "sectionTitle"
  | "cardTitle"
  | "price"
  | "quote"
  | "statValue"
  | "body"
  | "bodySmall"
  | "heroDescription"
  | "label"
  | "labelSoft"
  | "detail";

/** A theme's typography voice: per-role font/weight/tracking/transform. */
export interface TypeSpec {
  family: "display" | "body" | "mono";
  weight: number;
  size: keyof typeof SIZE;
  leading: keyof typeof LEADING;
  tracking?: string;
  uppercase?: boolean;
  italic?: boolean;
}

export type TypeMap = Record<TypeRole, TypeSpec>;
