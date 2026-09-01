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
import type { ShopConfig } from "../tenants/types";
import type { ShopContent } from "../content/types";
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

// ⚠️ "Not in a content module: it is two strings." THAT COMMENT WAS THE BUG.
// Two of the three named hot tubs — the lead and the meta description of every
// shop's blog index — and a second shop on this Worker published them under
// its own domain. No user-visible sentence is too small to belong to a shop;
// they are ShopContent.blogLead and ShopContent.blogMetaDescription now.
//
// H1 stays here because "Blog" is the word in every language this network is
// likely to serve, and a shop that needs another can have the field then.
const H1 = "Blog";

/**
 * The blog index as a whole document.
 *
 * ⚠️ EXPORTED SO THE AUDITS CAN SEE THIS PAGE. scripts/audit-site.mjs and
 * audit-seo.mjs derive their route list from routeSlugs and drive it through
 * the SYNCHRONOUS handleRequest, which by construction cannot serve a page
 * that needs a database — so the day /blog joined routeSlugs both audits
 * started measuring the 404 instead, and reported its contrast failure as the
 * blog's. (That failure was real and is fixed; see .placeholder .btn-fill in
 * themes/studio/page.ts. Finding it this way is the argument for not simply
 * excluding the route.)
 *
 * Given an empty list this renders the page a visitor sees before anything is
 * published, which is a real state of a real page: its head, its chrome, its
 * measure and its contrast are all exactly what a post list would carry. The
 * audits pass [] and get honest coverage of everything except the cards.
 */
export function blogIndexDoc(
  shop: ShopConfig,
  content: ShopContent,
  posts: readonly PostCard[],
  noindex: boolean,
): string {
  return renderDocument({
    shop,
    content,
    theme: shop.design.theme,
    path: shop.routeSlugs["/blog"],
    title: H1 + " — " + shop.keyword.plural + " | " + shop.name,
    description: content.blogMetaDescription,
    // ⚠️ AN EMPTY INDEX IS NOINDEX, AND IT WAS NOT. Before the first post
    // exists this page is 85 words that say nothing has been published, it
    // was indexable, AND render/sitemap.ts advertised it — so a brand-new
    // domain with no authority to spend was inviting Google to crawl its one
    // page whose whole content is an absence. That is the textbook soft-404
    // signal, and it was pointed at from every footer on the site as well.
    //
    // The page itself does not change: a visitor who follows the footer link
    // still gets the real page in its real empty state, which is honest. What
    // changes is that the crawler is not asked to file it. The moment one
    // post is published the flag flips on its own — there is no switch to
    // remember, which is the point of deriving it from the list rather than
    // from a setting.
    noindex: noindex || posts.length === 0,
    q: "",
    bodyHtml: renderBlogIndex(shop, content, "", H1, content.blogLead, posts),
    jsonLd: [
      organizationJsonLd(shop),
      breadcrumbJsonLd(shop, [{ name: "Domov", path: "/" }, { name: H1 }]),
    ],
  });
}

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
    // ⚠️ A post URL in this state is a page that does not exist, and it used
    // to answer 200 with the index's BODY FRAGMENT — no doctype, no head, no
    // title, no canonical, only the x-robots-tag header standing between a
    // half-document and an index. The index itself renders as the full
    // document with an honest empty state; anything under it is a 404.
    if (isPost) {
      return html(blogIndexDoc(shop, content, [], true), 404, {
        "x-robots-tag": "noindex, nofollow",
        "cache-control": "no-store",
      });
    }
    return html(blogIndexDoc(shop, content, [], true), 200, {
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "no-store",
    });
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
    // sitemapPaths lists the index when it is told there are posts, which
    // this branch has just established (cards.length === 0 returns null
    // above) — only the posts themselves are this branch's to add.
    const body = sitemapXml(shop, [
      ...sitemapPaths(shop, content, true),
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
    return html(blogIndexDoc(shop, content, cards, dev), 200, baseHeaders);
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
    description: post.excerpt || content.blogMetaDescription,
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
