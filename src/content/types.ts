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

/**
 * The drawings a card can ask for.
 *
 * Trimmed to what the one remaining shop sells when the network narrowed to
 * masazni-bazen.si — the sauna, plunge tub, chair, bath and billiard keys went
 * with their shops. "swimspa" is not a variant of "pool": a 5.8 m shell drawn
 * as a 2 m square is the same error as a photograph of the wrong model, and
 * the two sit side by side in the category rail where the difference is the
 * only thing the row is trying to say.
 */
export type ArtKey = "pool" | "swimspa";

/**
 * A LISTING PAGE — one product family, at its own URL.
 *
 * The shop sells two things that are not variants of each other: 1.95-2.30 m
 * hot tubs and 3.90-5.80 m swim spas. A single page cannot be the landing
 * page for both without being a worse landing page for each, and a home page
 * that simply prints every model is a catalogue dump rather than a route into
 * one.
 *
 * So each family gets a page it owns: its own H1, its own intro, its own
 * meta description, its own grid. The home page keeps the keyword and sends
 * people here; these pages do the selling. That is also the shape search
 * wants — "masažni bazen" and "swim spa" are different queries with different
 * intent, and one URL cannot rank honestly for both.
 */
export interface Collection {
  /** Route path under the shop, e.g. "/bazeni". Its own URL, not an anchor. */
  path: string;
  h1: string;
  /** One paragraph under the H1 — what this family is and who it is for. */
  intro: string;
  metaDescription: string;
  /** Short label for the nav and breadcrumbs. */
  navLabel: string;
  products: ProductCard[];
}

/**
 * A PRODUCT FAMILY, as the rail under the hero shows it.
 *
 * Not a model. The distinction is the whole reason this type exists: a card
 * that names one model must carry that model's own price (ZVPot, transposing
 * Directive 98/6/EC — the price shown against an identified product has to be
 * that product's), whereas a card that names a family may legitimately carry a
 * RANGE, because a range is what a family costs. The rail printed model cards
 * for a while and had to hide the range in the section head to stay honest;
 * with real categories the range belongs on the card again.
 */
export interface Category {
  /** The family's name, plural. */
  name: string;
  /** Count and the dimension the family is actually chosen on. */
  meta: string;
  /** "2.420 € – 2.890 €", or a single price where the family has one model. */
  price: string;
  /** Where the card goes. An in-page anchor or a route. */
  href: string;
  /** The family's lead photograph, where the shop has one. */
  photo?: PdpPhoto;
  /** The drawing to use when it has none. */
  art?: ArtKey;
}

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
  /**
   * The model's lead photograph, where it has one. A card with a real picture
   * and a card with a drawing sit side by side quite happily — each is telling
   * the truth about its own model — and a drawing shown where a photograph
   * exists is simply the worse of the two.
   */
  photo?: PdpPhoto;
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
  /** Heading this option sits under. Ungrouped options render first. */
  group?: string;
}

/** A photograph of the product, with the alt it must carry. */
export interface PdpPhoto {
  src: string;
  /**
   * Intrinsic size, WHERE IT IS KNOWN. Supabase-served photography carries
   * none — the build cannot reach the bucket to measure it, and the frames
   * that paint these set their own aspect-ratio anyway. See own-media.ts.
   */
  w?: number;
  h?: number;
  widths: readonly (readonly [string, number])[];
  alt: string;
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
   * The assurance row: four short promises with a sub-line each, in the order
   * delivery, returns, payment, help. The icons are the renderer's.
   */
  assure?: [string, string][];
  /**
   * Collapsible sections under the buy column, as [heading, body] — product
   * description, care, delivery terms. The spec table is generated separately
   * and always renders first.
   */
  panels?: [string, string][];
  /** Shell finish names offered. Names rather than swatches; see catalog/pola.ts. */
  finishes?: string[];
  /**
   * Cabinet panel finishes — the PS skirt, not the shell.
   *
   * A separate list because it is a separate decision, and because it used to
   * be reachable only as prose inside a collapsed panel. A buyer choosing a
   * colour is choosing two.
   */
  cabinetFinishes?: string[];
  /**
   * The model's own photography, in gallery order. Absent where a model has
   * none — the gallery then falls back to the shop's drawing, which is the
   * honest thing to show rather than another model's pictures.
   */
  photos?: PdpPhoto[];
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
  /**
   * The product families, for the rail under the hero. Omitted by a shop that
   * sells one family — the rail then falls back to model cards, which is what
   * it did before there were two.
   */
  categories?: Category[];

  products: (ProductCard | UtilCard)[];

  /**
   * The shop's listing pages, one per product family. Each is a real URL with
   * its own H1 and grid — see Collection. The home page links here rather
   * than printing every model itself.
   */
  collections?: Collection[];
  /**
   * The shop hub's own meta description.
   *
   * It used to fall back to `metaDescription`, which is the HOME page's — so
   * two indexable pages shipped identical descriptions, and a search engine
   * choosing between them has nothing to choose on. Every collection already
   * carries its own; the hub is the page that was missed because it has no
   * Collection record of its own.
   */
  hubMetaDescription?: string;
  /**
   * The sentence under the hub's h1.
   *
   * The hub opened with the bare word "Trgovina" and then 260px of nothing
   * before the first family band — a page whose only job is to answer "what
   * do you sell?" was not answering it above the fold. Distinct from
   * hubMetaDescription on purpose: that one is written for a search result,
   * where the reader has not arrived yet.
   */
  hubIntro?: string;
  moat: {
    h2: string;
    steps: [string, string][];
    claim: [string, string];
  };
  /**
   * Customer reviews.
   *
   * ⚠️ `placeholder` IS A LEGAL FLAG, NOT A DRAFTING NOTE. The storefront
   * renders these under the heading "Preverjena mnenja strank" with a
   * "Preverjen nakup" chip beside each one — claims that the review comes
   * from a real, verified purchase.
   *
   * Making that claim about a review nobody wrote is not a copy error. The
   * Unfair Commercial Practices Directive as amended by the Omnibus Directive
   * (EU) 2019/2161, transposed in ZVPot-1, puts two things on the Annex I
   * blacklist — practices banned outright, with no balancing test:
   *
   *   23b. stating that reviews are submitted by consumers who actually used
   *        or bought the product, without taking reasonable steps to check;
   *   23c. submitting, or having someone submit, false consumer reviews.
   *
   * So a review that is not a real one carries `placeholder: true`, the
   * renderer must not dress it as verified, and the launch gate refuses to
   * let a shop go live while any review is flagged. Delete the flag only
   * when the quote, the person and the order behind it are all real.
   */
  reviews: { q: string; who: string; model: string; placeholder?: boolean }[];
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
