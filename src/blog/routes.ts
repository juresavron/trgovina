/**
 * The routes whose answer lives in the database rather than in the bundle.
 *
 * Three of them: the blog index, a post, and the sitemap — which has to be
 * here because a sitemap that omits the posts is a blog nobody can find, and
 * the synchronous renderer cannot know what has been published.
 *
 * ⚠️ THIS RUNS BEFORE handleRequest AND MUST NOT CHANGE WHAT IT WOULD HAVE
 * DONE. Returning null means "not mine" and the storefront answers normally,
 * so every gate handleRequest applies is applied here first, in the same
 * order and for the same reasons:
 *
 *   * an unknown Host is not a shop — null, and the edge 404s;
 *   * a pre-live shop on its real domain serves the 503 handleRequest builds,
 *     so this returns null rather than publishing a blog on a domain that is
 *     supposed to be closed;
 *   * only the exact canonical path is matched, so /BLOG/ falls through to
 *     handleRequest's 308 and arrives back here as /blog.
 *
 * ⚠️ AND IT MUST NOT 500 A STOREFRONT. Supabase is a network call on the
 * request path of a page that is otherwise pure computation. Every read is
 * wrapped: a database that is down renders an empty blog index, which is a
 * page, rather than propagating to the Worker's catch-all and turning a
 * marketing site into "Napaka na strežniku."
 */

import { resolveShop, isDevHost } from "../tenants";
import { CONTENT } from "../content";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  renderBlogIndex,
  renderBlogPost,
  renderDocument,
} from "../render/page";
import { sitemapPaths, sitemapXml } from "../render/sitemap";
import type { Env } from "../admin/supabase";
import { anonApi, getBySlug, listPublished } from "./store";
import { parseSource, readMinutes, type PostCard } from "./post";

/** The index's own copy. Not in a content module: it is two strings. */
const H1 = "Blog";
const LEAD =
  "Kaj je pri masažnem bazenu res pomembno — velikost, poraba, priprava " +
  "terase in vzdrževanje. Brez prodajnih obljub, ki jih ne moremo držati.";
const META =
  "Nasveti o masažnih bazenih in swim spa bazenih: izbira velikosti, priprava " +
  "podlage in priklopa, poraba, vzdrževanje in dostava po Sloveniji.";

function html(body: string, status: number, extra: Record<string, string>): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", ...extra },
  });
}

/**
 * The whole blog surface, or null when the request is not one of ours.
 */
export async function handlePosts(request: Request, env: Env): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  const path = url.pathname;

  const host = request.headers.get("host") ?? url.hostname;
  const shop = resolveShop(host);
  if (!shop) return null;

  const base = shop.routeSlugs["/blog"];
  const isIndex = path === base;
  const isPost = path.startsWith(base + "/") && path.length > base.length + 1;
  const isSitemap = path === "/sitemap.xml";
  if (!isIndex && !isPost && !isSitemap) return null;

  const dev = isDevHost(host);
  // The live gate, exactly as handleRequest applies it.
  if (!shop.live && !dev) return null;

  const content = CONTENT[shop.key];
  if (!content) return null;

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    // Not configured is not an error for the sitemap — it simply has no posts
    // to add, so the storefront's own version is the right answer.
    if (isSitemap) return null;
    return html(
      renderBlogIndex(shop, content, "", H1, LEAD, []),
      200,
      { "x-robots-tag": "noindex, nofollow", "cache-control": "no-store" },
    );
  }

  const api = anonApi(env);
  const baseHeaders: Record<string, string> = dev
    ? { "x-robots-tag": "noindex, nofollow", "cache-control": "no-store" }
    : // Five minutes at the edge, like every other page. A post that goes out
      // and is visible within five minutes is publishing; the alternative is a
      // storefront that hits the database on every request for every visitor.
      { "cache-control": "public, max-age=0, s-maxage=300" };

  /* ---- the sitemap, with the posts in it ------------------------------ */
  if (isSitemap) {
    if (dev) return null; // handleRequest 404s it on the QA host
    let cards: PostCard[] = [];
    try {
      cards = await listPublished(api, shop.key, 500);
    } catch (err) {
      // A sitemap missing its posts is worse than a stale one and far better
      // than a 500: fall through to the storefront's own, which lists the
      // catalogue.
      console.error(err);
      return null;
    }
    if (cards.length === 0) return null;
    // The catalogue's own paths plus the blog's, from the one function that
    // knows the first set — see render/sitemap.ts on why that is not restated
    // here. The index goes in even when no post has a cover or a date; the
    // posts follow in publication order, which is the order they were listed.
    const body = sitemapXml(shop, [
      ...sitemapPaths(shop, content),
      base,
      ...cards.map((c) => base + "/" + c.slug),
    ]);
    return new Response(body, {
      headers: { "content-type": "application/xml; charset=utf-8", ...baseHeaders },
    });
  }

  /* ---- the index ------------------------------------------------------ */
  if (isIndex) {
    let cards: PostCard[] = [];
    try {
      cards = await listPublished(api, shop.key);
    } catch (err) {
      console.error(err);
    }
    const doc = renderDocument({
      shop,
      content,
      theme: shop.design.theme,
      path: base,
      title: H1 + " — " + shop.keyword.plural + " | " + shop.name,
      description: META,
      noindex: dev,
      q: "",
      bodyHtml: renderBlogIndex(shop, content, "", H1, LEAD, cards),
      jsonLd: [
        organizationJsonLd(shop),
        breadcrumbJsonLd(shop, [{ name: H1 }]),
      ],
    });
    return html(doc, 200, baseHeaders);
  }

  /* ---- one post ------------------------------------------------------- */
  const slug = path.slice(base.length + 1);
  let post = null;
  try {
    post = await getBySlug(api, shop.key, slug, true);
  } catch (err) {
    console.error(err);
  }
  // A slug that names nothing is not this module's 404 to serve: falling
  // through gives the storefront's own styled one, which carries the nav.
  if (!post) return null;

  const blocks = parseSource(post.source);
  // The same rule the editorial pages follow: markup only for questions the
  // reader can actually see, built by walking the blocks that were rendered.
  const questions = blocks.flatMap((b) => (b.kind === "qa" ? b.items : []));
  let others: PostCard[] = [];
  try {
    others = (await listPublished(api, shop.key, 4)).filter((c) => c.slug !== post!.slug).slice(0, 3);
  } catch (err) {
    console.error(err);
  }

  const canonical = shop.siteUrl + base + "/" + post.slug;
  const doc = renderDocument({
    shop,
    content,
    theme: shop.design.theme,
    path: base + "/" + post.slug,
    title: post.title + " | " + shop.name,
    description: post.excerpt || META,
    noindex: dev,
    q: "",
    ...(post.coverUrl ? { image: post.coverUrl } : {}),
    bodyHtml: renderBlogPost(shop, content, "", post, blocks, readMinutes(post.source), others),
    jsonLd: [
      organizationJsonLd(shop),
      articleJsonLd(shop, post, canonical),
      breadcrumbJsonLd(shop, [{ name: H1, path: base }, { name: post.title }]),
      ...(questions.length >= 2 ? [faqJsonLd(questions)] : []),
    ],
  });
  return html(doc, 200, baseHeaders);
}
