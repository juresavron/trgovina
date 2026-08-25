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
  /**
   * The card's own product page, under the shop's "/product" route. Absent on
   * shops that sell a single model, where every card is the flagship.
   */
  slug?: string;
}

export interface UtilCard {
  util: true;
  h: string;
  p: string;
  cta: string;
}

/**
 * An option offered alongside the product, priced separately.
 *
 * Kept as display strings rather than numbers because the content layer is
 * what the renderer reads, and the renderer must never do arithmetic on money
 * — the price a page shows and the price a customer is charged come from two
 * different trust levels (db/schema.sql's display/charge split). `priceCents`
 * rides along for the total the buy bar shows and for the cart, once there
 * is one.
 */
export interface PdpAddon {
  /** Stable identity: the form field name, and later the variant SKU. */
  key: string;
  label: string;
  /** Display string, already formatted and rounded. */
  price: string;
  /** Gross cents, or 0 when no price is available. */
  priceCents: number;
  /** Quantity, where the supplier states one ("16 kosov"). */
  qty?: string;
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
  /** Options priced separately from the product. Absent where there are none. */
  addons?: PdpAddon[];
  /**
   * True while the prices on this page are a provisional conversion of cost
   * rather than a selling price the business has set.
   *
   * The page may show them — it is pre-live and noindexed, and a designer
   * needs real figures to look at. Structured data may not: a Product whose
   * Offer carries a number nobody decided is a claim about money made to a
   * search engine, and it is the category of error that earns a manual
   * action. productJsonLd omits the Offer entirely when this is set.
   */
  pricesProvisional?: boolean;
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
  /** The flagship: the model the home page leads with. */
  pdp: PdpContent;
  /**
   * Every product page this shop serves, the flagship included. A shop with
   * one model may omit it; the router then serves `pdp` alone.
   */
  pdps?: PdpContent[];
  footNote: string;
}
