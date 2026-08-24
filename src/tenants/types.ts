/**
 * Multi-shop configuration. One ShopConfig per shop domain, statically
 * defined in src/tenants/*.ts and resolved per-request from the Host header.
 *
 * Lineage: this is onlyworld's SiteConfig (fans-network, 25 country domains on
 * one Worker) generalized from "one country per tenant" to "one commercial
 * keyword per tenant". Everything that renders (brand, keyword, SEO, slugs,
 * design tokens) lives here — the database `shops` table holds only
 * { id, domain, name, is_live, order_prefix } as the FK anchor for catalog
 * and orders (plus a shop_order_seq counter row).
 *
 * The keyword block replaces onlyworld's seo.country/seo.demonym: shared page
 * templates stay product-neutral and interpolate {keyword}/{product} tokens
 * into titles, H1s and descriptions, which is how ten shops each push a single
 * term without sharing a visible line of copy.
 */

/** Internal (English) route paths — the canonical file-route tree. */
export type InternalRouteKey =
  | "/" // home: THE keyword landing page
  | "/products" // catalog listing
  | "/product" // product detail segment (/product/$slug)
  | "/compare" // model comparison table (a top-3 SERP feature for buying queries)
  | "/guide" // buying-guide article segment (/guide/$slug)
  | "/guides" // guide index — the topical-authority hub
  | "/delivery" // delivery & installation promise (the logistics moat, as a page)
  | "/showroom" // visit/see-it-live page — trust anchor for high AOV
  | "/financing" // installment/leasing explainer
  | "/about"
  | "/contact"
  | "/faq"
  | "/cart"
  | "/checkout"
  | "/order-success"
  | "/terms"
  | "/privacy"
  | "/cookies"
  | "/withdrawal"; // 14-day right-of-withdrawal notice (mandatory, EU distance selling)

/**
 * The two design souls one skeleton can wear. Layout, grid, rhythm and
 * component set are identical network-wide; the mode swaps typography voice
 * and surface treatment so sibling shops read as different companies:
 *
 *  - "warm":  editorial serif display, deep charcoal surfaces, ember accents.
 *             Sauna, hot tubs, anything cedar-and-steam.
 *  - "crisp": grotesk display, near-white surfaces, glacial accents.
 *             Cryo chambers, cold plunge, recovery tech.
 */
export type DesignMode = "warm" | "crisp";

export type ShopConfig = {
  /** Stable shop key — matches shops.id in the database ('savna', 'krio', …). */
  key: string;
  /** Apex domain, no scheme ('finskasavna.si'). */
  domain: string;
  /** Canonical origin ('https://finskasavna.si'). */
  siteUrl: string;
  /** Brand name ('Finska Savna'). */
  name: string;
  /** Wordmark split for the two-tone logo: [prefix, accent]. */
  wordmark: [string, string];
  /**
   * True once the shop is launched; pre-live domains serve 503 + noindex at
   * the edge (meta AND x-robots-tag), so a domain can be attached early to
   * warm TLS without leaking an unfinished store to crawlers.
   */
  live: boolean;

  /**
   * THE keyword strategy. Every shop exists to rank #1 in Slovenia for
   * exactly one commercial-intent head term. These tokens flow into titles,
   * H1s, descriptions and internal anchor text via shared templates.
   *
   * Grammar contract (Slovenian declensions don't interpolate for free):
   *  - `primary`     nominative head term as searched ('finska savna')
   *  - `accusative`  object case for CTAs ('finsko savno' — "Kupite …")
   *  - `plural`      listing headers ('finske savne')
   *  - `category`    the broader noun for breadcrumbs/schema ('savne')
   */
  keyword: {
    primary: string;
    accusative: string;
    plural: string;
    category: string;
  };

  locale: {
    /** <html lang> ('sl'). */
    lang: string;
    /** hreflang value ('sl-SI'). */
    hreflang: string;
    /** og:locale ('sl_SI'). */
    ogLocale: string;
    /** Intl.* formatting locale ('sl-SI'). */
    intl: string;
  };

  /** ISO 4217 — prices are stored and charged in this currency ('EUR'). */
  currency: string;
  /**
   * VAT posture at launch: Slovenian DDV contained in displayed gross prices,
   * exactly the ocenagor model. Kept per-shop so a future OSS registration
   * (mandatory once cross-border B2C sales pass €10k/yr — one sauna order
   * to Austria is a fifth of that) can flip a shop to destination rates
   * without touching its siblings.
   */
  vat: { country: string; standardRate: number };
  /** IANA timezone for analytics bucketing ('Europe/Ljubljana'). */
  timezone: string;
  /** schema.org PostalAddress addressCountry ('SI'). */
  addressCountry: string;

  /** Design tokens. Lightness ramps are fixed by the theme layer (styles.css)
   *  so every shop passes contrast in both themes — same discipline as
   *  onlyworld's themeTokens, extended with the mode switch. */
  design: {
    mode: DesignMode;
    /** oklch hue angle, 0–360. */
    accentHue: number;
    /** oklch chroma. Keep within 0.09–0.14. */
    accentChroma: number;
    /** Browser theme-color. */
    themeColor: string;
  };

  /**
   * Trust block — rendered on every page footer, contact page, and in
   * Organization/LocalBusiness schema. At €3–15k AOV nobody pays a shop
   * without a phone number and a street address; these are launch gates,
   * not decoration. Values are per-shop even when the legal entity is
   * shared, because the statement descriptor and the domain must agree.
   */
  contact: {
    phone: string;
    email: string;
    address: { street: string; zip: string; city: string };
  };
  company: {
    /** Registered legal name for the imprint ('… d.o.o.'). */
    legalName: string;
    /** Slovenian tax number ('SI…') — imprint requirement. */
    vatId: string;
  };

  /**
   * Stripe per-shop settlement identity. One Stripe account serves the
   * network, but every PaymentIntent sets this statement_descriptor_suffix
   * so the card statement names the domain the customer actually bought
   * from. A €5k charge whose statement says a sibling brand is a chargeback.
   * Stripe rules: 5–22 chars, ASCII, no < > \ ' " *.
   */
  stripe: { statementDescriptor: string };

  /** Own social profiles for Organization schema sameAs — never a sibling's. */
  socials: { instagram?: string; facebook?: string; youtube?: string };

  /**
   * Localized public URL segment per internal route. Slovenian, Latin-ASCII
   * only (č→c, š→s, ž→z), immutable after launch — slugs are SEO capital and
   * changing one burns its history. The identity mapping is valid.
   */
  routeSlugs: Record<InternalRouteKey, string>;
};

/**
 * Validate a Stripe statement descriptor against Stripe's hard rules.
 * Called from launch-readiness tests — a bad descriptor fails deploy,
 * not a customer's checkout.
 */
export function isValidStatementDescriptor(s: string): boolean {
  return (
    s.length >= 5 &&
    s.length <= 22 &&
    /^[\x20-\x7E]+$/.test(s) &&
    !/[<>\\'"*]/.test(s) &&
    /[A-Za-z]/.test(s)
  );
}

/** Latin-ASCII slug check shared by launch-readiness tests. */
export function isValidRouteSlug(s: string): boolean {
  return s === "/" || /^\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(s);
}
