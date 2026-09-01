import { describe, expect, it } from "vitest";
import { SHOPS } from "../tenants";
import { CONTENT } from "../content";
import { renderBlogIndex, renderBlogPost, articleJsonLd } from "../render/page";
import { parseSource, type Post, type PostCard } from "./post";

const shop = SHOPS["bazen"]!;
const content = CONTENT["bazen"]!;

function card(over: Partial<PostCard> = {}): PostCard {
  return {
    slug: "kako-izbrati",
    title: "Kako izbrati masažni bazen",
    excerpt: "Trije modeli in ena odločitev.",
    coverUrl: null,
    coverAlt: "",
    publishedAt: "2026-03-14T09:00:00Z",
    ...over,
  };
}

function post(over: Partial<Post> = {}): Post {
  return {
    id: "id-1",
    slug: "kako-izbrati",
    title: "Kako izbrati masažni bazen",
    excerpt: "Trije modeli in ena odločitev.",
    source: "Prvi odstavek.\n\n## Velikost\n- 195 cm\n- 230 cm",
    coverUrl: null,
    coverAlt: "",
    status: "published",
    publishedAt: "2026-03-14T09:00:00Z",
    updatedAt: "2026-03-14T09:00:00Z",
    ...over,
  };
}

/** The rendered page without the stylesheet, which mentions every class name. */
function markup(html: string): string {
  return html.replace(/<style>[\s\S]*?<\/style>/g, "");
}

describe("blog index", () => {
  it("links each card at the shop's own blog route", () => {
    const html = markup(renderBlogIndex(shop, content, "", "Blog", "Uvod.", [card()]));
    expect(html).toContain('href="/blog/kako-izbrati"');
    expect(html).toContain("Kako izbrati masažni bazen");
  });

  it("says so when nothing has been published, rather than rendering a bare title", () => {
    const html = markup(renderBlogIndex(shop, content, "", "Blog", "Uvod.", []));
    expect(html).toContain("Prvi zapis pripravljamo");
    expect(html).not.toContain("st-blog-list");
  });

  it("gives a post with no cover a placeholder rather than a broken image", () => {
    const html = markup(renderBlogIndex(shop, content, "", "Blog", "Uvod.", [card()]));
    expect(html).toContain("st-blog-shot--none");
    expect(html).not.toContain('<img class="st-blog-shot"');
  });

  it("marks up the date as machine-readable", () => {
    const html = markup(renderBlogIndex(shop, content, "", "Blog", "Uvod.", [card()]));
    expect(html).toContain('<time datetime="2026-03-14">14. marca 2026</time>');
  });
});

describe("blog post", () => {
  const p = post();
  const html = markup(renderBlogPost(shop, content, "", p, parseSource(p.source), 4, [
    card({ slug: "druga", title: "Drugi zapis" }),
  ]));

  it("renders the body through the theme's own block vocabulary", () => {
    expect(html).toContain('<p class="st-page-p">Prvi odstavek.</p>');
    expect(html).toContain('<li class="st-page-li">195 cm</li>');
    expect(html).toContain("Velikost");
  });

  it("offers the other posts and a way back", () => {
    expect(html).toContain('href="/blog/druga"');
    expect(html).toContain('href="/blog"');
  });

  it("states the reading time beside the date", () => {
    expect(html).toContain("4 min branja");
  });

  it("CANNOT EMIT MARKUP FROM A POST", () => {
    // The whole reason the body is parsed into blocks rather than stored as
    // HTML: an admin account is not a licence to serve script from the
    // storefront. Every one of these arrives escaped or not at all.
    const nasty = post({
      title: '<script>alert(1)</script>',
      excerpt: '"><img src=x onerror=alert(1)>',
      source: "## <b>krepko</b>\n\n<script>alert(2)</script>\n\n- <i>alineja</i>",
      coverUrl: '/media/x.webp" onerror="alert(3)',
      coverAlt: '"><script>alert(4)</script>',
    });
    const out = markup(
      renderBlogPost(shop, content, "", nasty, parseSource(nasty.source), 1, []),
    );
    // No tag the writer typed survives as a tag.
    expect(out).not.toContain("<script>alert");
    expect(out).not.toContain("<b>krepko</b>");
    expect(out).not.toContain("<i>alineja</i>");
    expect(out).toContain("&lt;script&gt;alert(2)&lt;/script&gt;");
    // ⚠️ ASSERT THE ATTRIBUTE STAYED ONE ATTRIBUTE. A blunter check — "the
    // output contains no onerror=" — fails on correct output, because the
    // sequence appears inside escaped TEXT in the standfirst. What matters
    // is that the quote which would have ended the attribute was escaped, so
    // the whole payload is the value of src and not a handler beside it.
    expect(out).toContain('src="/media/x.webp&quot; onerror=&quot;alert(3)"');
    // Same for alt, where the payload opens with a quote and a bracket.
    expect(out).toContain('alt="&quot;&gt;&lt;script&gt;alert(4)&lt;/script&gt;"');
  });
});

describe("articleJsonLd", () => {
  it("omits an author and a publisher rather than inventing them", () => {
    const node = articleJsonLd(shop, post(), shop.siteUrl + "/blog/kako-izbrati") as Record<
      string,
      unknown
    >;
    expect(node["@type"]).toBe("BlogPosting");
    expect(node["author"]).toBeUndefined();
    expect(node["publisher"]).toBeUndefined();
    expect(node["datePublished"]).toBe("2026-03-14T09:00:00Z");
  });

  it("carries an absolute image only when the post has a cover", () => {
    const bare = articleJsonLd(shop, post(), "u") as Record<string, unknown>;
    expect(bare["image"]).toBeUndefined();
    const withCover = articleJsonLd(
      shop,
      post({ coverUrl: "/media/blog/a--b.webp" }),
      "u",
    ) as Record<string, unknown>;
    expect(withCover["image"]).toBe(shop.siteUrl + "/media/blog/a--b.webp");
  });
});

/**
 * AN EMPTY BLOG IS NOT A PAGE TO INDEX, AND FOR A WHILE IT WAS ONE.
 *
 * Before the first post exists /blog is a real page in a real state — its
 * chrome, its measure and its standing paragraph are all exactly what a post
 * list carries — and a visitor who follows the footer link should see it. A
 * CRAWLER should not be invited to file it: the whole content is the sentence
 * saying nothing is published yet, which is the soft-404 signal, on a domain
 * whose crawl budget and authority are both new.
 *
 * Both halves of that invitation were open. The index rendered indexable at
 * zero posts, and render/sitemap.ts listed the URL unconditionally with a
 * comment saying it was "an indexable page linked from every footer in either
 * state" — so the sitemap advertised it too.
 *
 * The two must agree, which is why they are asserted together: a sitemap that
 * lists a noindex URL is the one inconsistency Search Console reports by name,
 * and fixing one of these without the other produces exactly that.
 */
describe("the blog index before anything is published", () => {
  it("tells crawlers to skip it, and stops the moment a post exists", async () => {
    const { blogIndexDoc } = await import("./routes");
    const empty = blogIndexDoc(shop, content, [], false);
    expect(empty).toMatch(/<meta name="robots" content="noindex/);
    const full = blogIndexDoc(shop, content, [card()], false);
    expect(full).not.toMatch(/<meta name="robots" content="noindex/);
  });

  it("is left out of the sitemap in the same state", async () => {
    const { sitemapPaths } = await import("../render/sitemap");
    const blog = shop.routeSlugs["/blog"];
    expect(sitemapPaths(shop, content, false)).not.toContain(blog);
    expect(sitemapPaths(shop, content, true)).toContain(blog);
  });
});
