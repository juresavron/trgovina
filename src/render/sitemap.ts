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

/**
 * Every URL path this shop wants crawled, in the order it wants them read.
 *
 * The home page, the hub, every collection and every model — not just the
 * flagship. A catalogue whose sitemap lists one of nine is a catalogue eight
 * of whose pages are only discoverable by crawl.
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
