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

import type { ThemeKey } from "../themes/catalog";
import type { SectionKey } from "../themes/shared/sections";

/** Internal (English) route paths — the canonical file-route tree. */
export type InternalRouteKey =
  | "/" // home: THE keyword landing page
  | "/products" // catalog listing
  | "/product" // product detail segment (/product/$slug)
  | "/compare" // model comparison table (a top-3 SERP feature for buying queries)
  | "/guide" // buying-guide article segment (/guide/$slug)
  | "/guides" // guide index — the topical-authority hub
  | "/finder" // guided model choice — three questions, one recommendation
  | "/blog" // the blog index; a post is /blog/$slug
  | "/delivery" // delivery & installation promise (the logistics moat, as a page)
  | "/showroom" // visit/see-it-live page — trust anchor for high AOV
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
   * True once the shop can take an order through the website.
   *
   * SEPARATE FROM `live`, because they are different facts. `live` is about
   * the domain being served at all; this is about whether pressing a button
   * can result in a purchase. A shop can be fully launched, indexed and
   * selling for months while every order still arrives by telephone — which
   * is exactly where bazen is, and its own /kosarica page says so: "Spletno
   * naročanje še ni odprto. Naročila zaenkrat sprejemamo po telefonu in
   * e-pošti."
   *
   * IT EXISTS BECAUSE THE PAGE SAID ONE THING AND THE BUTTONS SAID ANOTHER.
   * The product page's primary control — the biggest, blackest thing on it —
   * read "V košarico", the header carried a basket with a count, and both led
   * to a page explaining that ordering is not open. On a €2,400–€8,400
   * considered purchase that is the worst possible moment to break a promise:
   * the visitor has decided, pressed the button, and been told no.
   *
   * With this false, the storefront asks for an enquiry instead — which is
   * the channel the shop actually operates. Set it true and the cart controls
   * come back with no other change.
   */
  ordersOnline: boolean;

  /**
   * The shop's public Google rating, for the hero's proof line.
   *
   * ⚠️ ABSENT UNTIL A REAL PROFILE HAS REAL REVIEWS, and absent is the
   * default. Every field is required together because a score without a
   * count is not a rating and a rating without a link is not checkable: a
   * number a reader cannot verify is worth less than no number, and under
   * ZVPot-1 (Annex I 23b/23c) an unverifiable review claim is not a matter of
   * degree. Leave it unset and the hero renders exactly as it does today.
   *
   * ⚠️ AND IT NEVER BECOMES AggregateRating STRUCTURED DATA. render/page.ts
   * emits none by design; a rating COLLECTED BY GOOGLE marked up as this
   * site's own is against Google's own structured-data policy and is a
   * manual-action risk on a network whose whole strategy is search. On the
   * page it is a quotation with a source, which is what it is.
   *
   * `asOf` is the date somebody read the two numbers off the profile. It is
   * rendered, because "4,9 (37 mnenj)" with no date is a claim that silently
   * ages, and it is the operator's cue that the figure needs re-reading.
   */
  googleRating?: {
    /** The score as the profile shows it, 1–5, e.g. 4.9. */
    readonly score: number;
    /** How many reviews that score is computed from. */
    readonly count: number;
    /** The public profile URL a reader can open and check. https only. */
    readonly url: string;
    /** ISO date the score and count were read, e.g. "2026-08-30". */
    readonly asOf: string;
  };

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

  /**
   * Design: which theme from src/themes/catalog.ts this shop wears, plus its
   * accent identity. Themes own layout, composition and typography voice;
   * the shop owns hue and chroma — lightness rungs are fixed by the palette
   * factory so every shop/theme pairing passes contrast (see
   * src/themes/shared/palette.ts and docs/THEMES.md).
   */
  design: {
    theme: ThemeKey;
    /** oklch hue angle, 0–360. */
    accentHue: number;
    /** oklch chroma. Keep within 0.09–0.14. */
    accentChroma: number;
    /** Browser theme-color. */
    themeColor: string;
    /**
     * Home-page act order, overriding the theme's default preset.
     *
     * THIS IS AN ANTI-DOORWAY CONTROL, not a styling convenience. docs/THEMES.md
     * and the catalog have always described composition as shop-overridable,
     * but nothing implemented it — so every shop wearing a theme rendered that
     * theme's exact section order. One theme across the network then means six
     * shops with identical page structure, differing only in hue and copy,
     * which is the site-network footprint docs/SEO.md §6 exists to prevent.
     *
     * A shop that sets this must mean it: the order should follow how THAT
     * product is actually sold (a considered ritual purchase leads with the
     * delivery promise; a technical one leads with specs), not be shuffled for
     * the sake of looking different.
     *
     * Every theme can render every key, so any order is safe. Length is capped
     * by MAX_SECTIONS_PER_PAGE at the render site.
     */
    composition?: SectionKey[];
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
    /**
     * Matična številka (10 digits, AJPES). ZGD-1 čl. 45 requires it on a
     * company's public documents and web presence alongside the registered
     * name and seat. "0000000000" is the unset placeholder, exactly as
     * SI00000000 is for the VAT id.
     */
    regNumber: string;
    /**
     * The court register the company is entered at, as the imprint states
     * it — "Okrožno sodišče v Kopru, vl. št. …". Empty until supplied; the
     * imprint prints the unset mark rather than an invented court.
     */
    register: string;
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
