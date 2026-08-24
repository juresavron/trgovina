/**
 * Shop storefront content — everything the SSR renderer needs beyond
 * ShopConfig. Per shop, hand-written Slovenian; NEVER templated across
 * shops (the anti-doorway rule: shared code, zero shared copy).
 *
 * ⚠️ Reviews are PLACEHOLDER copy until real verified orders exist. They
 * render on the page as design content, but the renderer deliberately emits
 * NO Review/AggregateRating structured data — fabricated review schema is a
 * manual-action magnet and this network's whole strategy is SEO.
 */

export type ArtKey =
  | "saunaDuo"
  | "saunaQuattro"
  | "tub"
  | "pool"
  | "chair"
  | "bathtub"
  | "billiard";

export interface ProductCard {
  name: string;
  desc: string;
  meta: string;
  price: string;
  art: ArtKey;
  badge?: string;
}

export interface UtilCard {
  util: true;
  h: string;
  p: string;
  cta: string;
}

export interface PdpContent {
  /** URL segment under routeSlugs["/product"] ('quattro' → /savna/quattro). */
  slug: string;
  eyebrow: string;
  title: string;
  sub: string;
  price: string;
  /** Gross cents for schema.org Offer — never parsed from display strings. */
  priceCents: number;
  cfg: [string, string[], number][];
  freight: [string, string, boolean][];
  note: string;
  spec: [string, string][];
  bar: [string, string, string, string];
}

export interface ShopContent {
  nav: [string, string, string, string, string];
  artKey: ArtKey;
  kicker: string;
  h1: string;
  sub: string;
  cta: string;
  metaDescription: string;
  trust: string[];
  stats: [string, string][];
  products: (ProductCard | UtilCard)[];
  moat: {
    h2: string;
    steps: [string, string][];
    claim: [string, string];
  };
  reviews: { q: string; who: string; model: string }[];
  guides: [string, string][];
  pdp: PdpContent;
  footNote: string;
}
