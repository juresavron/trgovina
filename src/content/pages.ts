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
 *
 * ⚠️ AND IT MAY NOT OUT-CLAIM THE CATALOGUE EITHER. These pages are prose and
 * the product pages are generated, so when the two disagree it is always the
 * prose that is wrong and always the prose a customer read first. The first
 * audit of this directory found three of those, and every one of them was a
 * sentence that sounded right:
 *
 *   - "poln preko dveh ton" for the hot tubs. True of the BAZEN 230 alone
 *     (2.210 kg); the 195 is 1.500 and the 210 is 1.870. A family does not
 *     inherit its largest member's figure.
 *   - "cena vključuje dostavo". The product pages say the opposite —
 *     PdpContent.freight marks the delivery "po ponudbi" — and a price
 *     composition that differs between the terms and the page carrying the
 *     number is a misleading price indication whichever one is right.
 *   - a cross-reference to an "exception for installed goods" on the
 *     withdrawal page, which states no such exception on purpose.
 *
 * So a figure written here is copied from catalog/pola.ts, catalog/swimspa.ts
 * or content/bazen.ts, and a promise written here is one the product page
 * already makes. Neither is written from memory of what the shop is like.
 */

/** One unit of page content. The theme owns how each of these looks. */
export type Block =
  /** A run of paragraphs under an optional heading. */
  | { kind: "prose"; h?: string; p: string[] }
  /** Numbered steps — delivery, ordering, returns. */
  | { kind: "steps"; h?: string; items: [string, string][] }
  /**
   * A plain bullet list.
   *
   * The one shape prose could not express. `steps` is an ordered procedure
   * whose every entry carries a heading and a sentence, which is the wrong
   * device for "what is in the box" — and a writer who wants five short
   * points had to choose between five paragraphs and five numbered stages
   * that imply an order the content does not have. The blog needs it most,
   * because a post is written rather than composed, but the editorial pages
   * are welcome to it.
   */
  | { kind: "list"; h?: string; items: string[] }
  /** Question and answer pairs; the theme may emit disclosure elements. */
  | { kind: "qa"; h?: string; items: [string, string][] }
  /** Term/definition rows — spec-like facts, legal definitions. */
  | { kind: "facts"; h?: string; rows: [string, string][] }
  /** The shop's own contact details, rendered from ShopConfig. */
  | { kind: "contact"; h?: string }
  /** The registered-company imprint, rendered from ShopConfig. */
  | { kind: "imprint"; h?: string }
  /**
   * A short list of internal links.
   *
   * ⚠️ THE ONE BLOCK THAT CAN CARRY A LINK, and it exists because a blog post
   * could not. Every other block escapes its text — deliberately, so a post
   * cannot inject markup into the storefront — which left a post unable to
   * point at a single product page. scripts/audit-seo.mjs said so in as many
   * words: "links to only 0 other pages from its body — a dead end for a
   * crawler". On a site whose whole strategy is search, an article that
   * mentions three models and links to none of them is wasted.
   *
   * Each entry is [label, path]. The PATH IS VALIDATED WHERE IT IS PARSED, to
   * an internal absolute path and nothing else — no scheme, no host, no
   * protocol-relative "//". A post may point at this shop's own pages; it may
   * not become a way to publish an outbound link from a compromised account.
   */
  | { kind: "links"; h?: string; items: [string, string][] }
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
import { isSet, isSetPhone, isSetVat, isSetZip } from "../lib/filled";

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
/**
 * WHETHER A FIELD HAS BEEN FILLED IN, JUDGED PER FIELD.
 *
 * ⚠️ THE FIRST VERSION OF THIS COULD NEVER RETURN TRUE, and the way it failed
 * is worth keeping. It ran ONE test over all six values, and that test ended
 * with a phone check: strip non-digits, drop a leading 386, drop the zeros,
 * and call it unset if nothing survives. Correct for "+386 00 000 000".
 * Catastrophic for "Masažni Bazen d.o.o." and "Ljubljana", which contain no
 * digits at all, so they folded to "" and read as unset — measured, with
 * entirely real company details in place, legalPagesReady() returned FALSE.
 *
 * A launch gate that cannot be satisfied is worse than no gate. Nobody fills
 * in six fields and then argues with a red test; they delete the test. So the
 * predicate is now per field, and each one only knows how ITS OWN kind of
 * value looks when it is missing.
 */
// The four predicates moved to src/lib/filled.ts — see that file for why
// the third copy of them was publishing "TODO" to Google as structured data.

export function legalPagesReady(
  company: { legalName: string; vatId: string },
  contact: { phone: string; address: { street: string; zip: string; city: string } },
): boolean {
  return (
    isSet(company.legalName) &&
    isSetVat(company.vatId) &&
    isSetPhone(contact.phone) &&
    isSet(contact.address.street) &&
    isSetZip(contact.address.zip) &&
    isSet(contact.address.city)
  );
}
