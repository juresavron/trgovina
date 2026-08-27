/**
 * The sitemap, as data and as a document.
 *
 * Its own module because TWO callers build it and they must never disagree.
 * The storefront's synchronous router knows the catalogue and nothing else;
 * the blog's async router knows what has been published and has to add it. A
 * second copy of "which pages does this shop have" in the second caller is how
 * a shop ends up with a sitemap that lists eight products on one route and
 * nine on another.
 */

import type { ShopConfig } from "../tenants/types";
import type { ShopContent } from "../content/types";
import { PAGES } from "../content/pages";

/**
 * Every URL path this shop wants crawled, in the order it wants them read.
 *
 * The home page, the hub, every collection and every model — not just the
 * flagship. A catalogue whose sitemap lists one of nine is a catalogue eight
 * of whose pages are only discoverable by crawl.
 *
 * ⚠️ THE EDITORIAL PAGES ARE DERIVED FROM THE REGISTRY, NOT LISTED HERE.
 * They were absent entirely once: the sitemap named home, the hub, the
 * collections and the models, and stopped — /vodniki, /dostava-in-montaza,
 * /o-nas, the FAQ, every page written to answer a query a model page cannot,
 * all left to be found by crawl on a domain with no inbound links yet.
 * Deriving from PAGES means a page added to the registry is in the sitemap
 * the same day, and a page flagged noindex (the basket, the checkout) is
 * excluded by the same flag the robots meta reads — the two can never
 * disagree about what a crawler is invited to.
 */
export function sitemapPaths(shop: ShopConfig, content: ShopContent): string[] {
  return [
    "/",
    // The shop hub and every collection. These are the pages built to rank —
    // "masažni bazen" and "swim spa" are different queries — so leaving them
    // out would hide the two most important URLs after home.
    ...((content.collections ?? []).length > 0 ? [shop.routeSlugs["/products"]] : []),
    ...(content.collections ?? []).map((c) => c.path),
    ...(content.pdps ?? [content.pdp]).map((d) => shop.routeSlugs["/product"] + "/" + d.slug),
    // The blog index, unconditionally. The async layer replaces this sitemap
    // with one that also lists the posts — but that branch returns null when
    // the database is unreachable or before the first post exists, and the
    // index is an indexable page linked from every footer in either state.
    shop.routeSlugs["/blog"],
    ...PAGES.filter((p) => !p.noindex)
      .map((p) => shop.routeSlugs[p.key as keyof typeof shop.routeSlugs])
      .filter((slug): slug is string => typeof slug === "string" && slug !== ""),
  ];
}

/** Those paths as the XML a crawler reads. */
export function sitemapXml(shop: ShopConfig, paths: readonly string[]): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    paths.map((u) => "<url><loc>" + shop.siteUrl + u + "</loc></url>").join("") +
    "</urlset>"
  );
}
