/**
 * The site's editorial and legal pages.
 *
 * WHY THIS EXISTS. Fifteen routes — every nav destination except the shop, and
 * every legal page the law requires — rendered one shared stub: an h1 and
 * "Stran je v pripravi." They returned 200 and were noindex, so nothing looked
 * broken and nothing was findable. A storefront selling EUR 2,400-8,400 goods
 * cannot answer "who are you", "how do I get it", or "how do I return it" with
 * a coming-soon card.
 *
 * A PAGE IS DATA, NOT MARKUP. The blocks below are a small vocabulary the
 * theme renders; the content modules never emit HTML. That keeps the pages out
 * of the theme, keeps escaping in one place, and means a page cannot smuggle
 * markup past the renderer.
 *
 * ⚠️ WHAT THIS FILE MAY NOT DO IS INVENT COMPANY FACTS. The registered name,
 * the address, the VAT number and the phone are all TODO in tenants/bazen.ts
 * today. They are mandatory on the imprint, on the terms, and as the GDPR
 * controller identity — and a legal page carrying an invented company is
 * materially worse than one that is honestly unfinished, because a customer
 * relies on it and a regulator reads it. So identity comes from ShopConfig at
 * render time, never from prose here, and `legalPagesReady()` reports whether
 * those values are real. The launch gate consumes it.
 */

/** One unit of page content. The theme owns how each of these looks. */
export type Block =
  /** A run of paragraphs under an optional heading. */
  | { kind: "prose"; h?: string; p: string[] }
  /** Numbered steps — delivery, ordering, returns. */
  | { kind: "steps"; h?: string; items: [string, string][] }
  /** Question and answer pairs; the theme may emit disclosure elements. */
  | { kind: "qa"; h?: string; items: [string, string][] }
  /** Term/definition rows — spec-like facts, legal definitions. */
  | { kind: "facts"; h?: string; rows: [string, string][] }
  /** The shop's own contact details, rendered from ShopConfig. */
  | { kind: "contact"; h?: string }
  /** The registered-company imprint, rendered from ShopConfig. */
  | { kind: "imprint"; h?: string }
  /** A closing call to action pointing at an internal route. */
  | { kind: "cta"; h: string; p: string; label: string; href: string };

export interface Page {
  /** InternalRouteKey this page answers, e.g. "/about". */
  readonly key: string;
  readonly h1: string;
  /** The standfirst under the h1 — one or two sentences, plain. */
  readonly lead: string;
  readonly metaDescription: string;
  readonly blocks: readonly Block[];
  /**
   * True for pages that must never be indexed regardless of launch state:
   * the basket and the checkout are per-visitor, not content.
   */
  readonly noindex?: boolean;
  /**
   * True where the page states rights or obligations. These are the pages
   * that may not ship with an unset company identity, and the ones a launch
   * gate has to check. See legalPagesReady().
   */
  readonly legal?: boolean;
}

/* ------------------------------------------------------------- registry */

import { ABOUT } from "./pages/o-nas";
import { CONTACT } from "./pages/kontakt";
import { DELIVERY } from "./pages/dostava";
import { GUIDES } from "./pages/vodniki";
import { FAQ } from "./pages/faq";
import { COMPARE } from "./pages/primerjava";
import { FINANCING } from "./pages/financiranje";
import { SHOWROOM } from "./pages/salon";
import { CART, CHECKOUT } from "./pages/kosarica";
import { TERMS } from "./pages/pogoji";
import { PRIVACY } from "./pages/zasebnost";
import { COOKIES } from "./pages/piskotki";
import { WITHDRAWAL } from "./pages/odstop";

/**
 * Every editorial and legal page, in no particular order — the router matches
 * by `key` against the shop's own route slugs, so the Slovenian URLs stay in
 * tenants/bazen.ts where the rest of the routing lives.
 */
export const PAGES: readonly Page[] = [
  ABOUT, CONTACT, DELIVERY, GUIDES, FAQ, COMPARE, FINANCING, SHOWROOM,
  CART, CHECKOUT, TERMS, PRIVACY, COOKIES, WITHDRAWAL,
];

/**
 * Whether the pages that state rights and obligations may be published.
 *
 * FALSE while the company identity is a placeholder. The imprint on the terms,
 * the seller on the withdrawal notice and the controller on the privacy notice
 * are all the same three fields in ShopConfig, and all three are legally
 * required to identify a real company: a privacy notice whose controller
 * cannot be identified does not satisfy GDPR Article 13(1)(a), and terms with
 * no seller name are not terms.
 *
 * The pages still RENDER — an unfinished imprint that says so is more useful
 * than a 404, and the shop is pre-live anyway. What this gates is the flip to
 * live: see the launch test, which refuses it exactly as the pricing gate does.
 */
export function legalPagesReady(company: { legalName: string; vatId: string }, contact: {
  phone: string;
  address: { street: string; zip: string; city: string };
}): boolean {
  const values = [
    company.legalName,
    company.vatId,
    contact.phone,
    contact.address.street,
    contact.address.zip,
    contact.address.city,
  ];
  return !values.some(
    (v) =>
      v.includes("TODO") ||
      v === "SI00000000" ||
      v === "0000" ||
      v.replace(/[^0-9]/g, "").replace(/^386/, "").replace(/0+/g, "") === "",
  );
}
