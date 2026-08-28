/**
 * The blog — an index of posts, and a post.
 *
 * WHY IT IS NOT renderStudioPage. A post is the same document as /o-nas in
 * every respect that matters typographically: one column at the reading
 * measure, the same headings, the same paragraphs, the same fact tables. It
 * differs in three things a Page has no room for — it is dated, it can carry
 * a lead photograph, and it ends by offering the next post rather than the
 * catalogue. So the head and the tail are built here and the body comes from
 * renderStudioBlocks, which is page.ts's own block renderer. There is exactly
 * one implementation of a paragraph on this site.
 *
 * ⚠️ THE INDEX HAS NO TABLE OF CONTENTS AND A POST HAS NO RAIL. The editorial
 * pages earn theirs by being reference documents somebody arrives at with one
 * question. A post is read from the top, and a three-link index above a
 * thousand words is furniture — the same judgement page.ts makes at its own
 * three-heading threshold, applied to a document that is never a reference.
 */

import { esc, type RenderCtx } from "../../render/sections";
import type { Block } from "../../content/pages";
import { renderStudioBlocks, sectionId } from "./page";
import { dateAttr, dateText, type Post, type PostCard } from "../../blog/post";

export const STUDIO_BLOG_CSS = `
  /* THE CARD LIST.
   *
   * Two columns where there is room and one below it, on the same 1000px
   * threshold the rest of the site changes shape at. Not three: a post card
   * carries a title, a date and two lines of standfirst, and at a third of
   * the container that standfirst wraps to five lines of about thirty
   * characters — which is a column of text, not a card.
   *
   * The FIRST card spans both columns and shows its photograph large. A blog
   * index whose newest post looks exactly like the one from March is an
   * archive; leading with the latest is what makes it a publication. */
  :root[data-theme="studio"] .st-blog-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: clamp(28px, 3.2vw, 48px);
  }
  @media (min-width: 1000px) {
    :root[data-theme="studio"] .st-blog-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: clamp(32px, 3vw, 56px);
    }
    :root[data-theme="studio"] .st-blog-item--lead { grid-column: 1 / -1; }
    :root[data-theme="studio"] .st-blog-item--lead .st-blog-a {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      column-gap: clamp(32px, 3vw, 56px);
      align-items: center;
    }
    :root[data-theme="studio"] .st-blog-item--lead .st-blog-h { font-size: var(--t-h3); }
  }

  /* The whole card is the link. A title-only link inside a card is a 44px
   * target inside a 400px one, and every reader tries to click the picture. */
  :root[data-theme="studio"] .st-blog-a {
    display: block;
    color: inherit;
    text-decoration: none;
  }
  :root[data-theme="studio"] .st-blog-shot {
    display: block;
    inline-size: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    background: var(--wash);
    border-radius: var(--r-card, 0);
  }
  /* A post with no photograph gets a ruled block of the shop's own ground
   * rather than a broken image or a stock picture of somebody else's tub. */
  :root[data-theme="studio"] .st-blog-shot--none {
    display: block;
    inline-size: 100%;
    aspect-ratio: 16 / 10;
    background: var(--wash);
    border: var(--bw-line) solid var(--line);
    border-radius: var(--r-card, 0);
  }
  :root[data-theme="studio"] .st-blog-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin-block: clamp(14px, 1.4vw, 20px) 0;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-blog-h {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h4);
    letter-spacing: var(--ls-h4);
    line-height: var(--lh-h4);
    color: var(--ink);
    text-wrap: balance;
    margin-block: 8px 0;
  }
  :root[data-theme="studio"] .st-blog-a:hover .st-blog-h { text-decoration: underline; text-underline-offset: 4px; }
  :root[data-theme="studio"] .st-blog-a:focus-visible { outline: 2px solid var(--ink); outline-offset: 6px; }
  :root[data-theme="studio"] .st-blog-sub {
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    margin-block: 10px 0;
    text-wrap: pretty;
  }

  /* Nothing published yet. Said plainly, because an empty page with a title
   * on it reads as a page that failed to load. */
  :root[data-theme="studio"] .st-blog-empty {
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    max-inline-size: 34rem;
  }
  :root[data-theme="studio"] .st-blog-empty a {
    color: var(--ink);
    text-underline-offset: 3px;
  }
  /* The index's standing note, above the cards. */
  :root[data-theme="studio"] .st-blog-note {
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink-body);
    max-inline-size: 34rem;
    margin: 0 0 clamp(28px, 3vw, 44px);
  }
  :root[data-theme="studio"] .st-blog-note a {
    color: var(--ink);
    text-underline-offset: 3px;
  }

  /* ---- one post ------------------------------------------------------- */

  /* The dateline sits under the standfirst, in the masthead's own rule box.
   * Above the title it competes with the eyebrow; below the rule it belongs
   * to the body. */
  :root[data-theme="studio"] .st-post-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin-block: clamp(18px, 1.8vw, 26px) 0;
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
  }
  /* The lead photograph opts out of the reading measure the way the fact
   * tables do — it is not running text, and 34rem of photograph above a
   * 46rem column reads as a mistake. */
  :root[data-theme="studio"] .st-post-cover {
    margin: 0 0 clamp(38px, 4vw, 64px);
    max-inline-size: none;
  }
  :root[data-theme="studio"] .st-post-cover img {
    display: block;
    inline-size: 100%;
    block-size: auto;
    border-radius: var(--r-card, 0);
  }

  /* WHERE TO GO NEXT, which for a post is another post. The editorial pages
   * offer the catalogue because that is what somebody reading the delivery
   * terms is deciding about; somebody who finished an article is deciding
   * whether to read another one. */
  :root[data-theme="studio"] .st-post-more {
    margin-block-start: clamp(56px, 6vw, 96px);
    padding-block-start: clamp(28px, 3vw, 44px);
    border-block-start: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-post-more-h {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
    margin: 0 0 16px;
  }
  :root[data-theme="studio"] .st-post-more ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 14px;
  }
  :root[data-theme="studio"] .st-post-more a {
    display: inline-flex;
    align-items: baseline;
    gap: 10px;
    min-block-size: 24px;
    font-family: var(--f-body);
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--ink);
    text-underline-offset: 3px;
  }
  :root[data-theme="studio"] .st-post-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-block-size: 44px;
    margin-block-start: clamp(40px, 4vw, 64px);
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    line-height: var(--lh-label-tight);
    text-transform: uppercase;
    color: var(--ink-mute);
    text-decoration: none;
  }
  :root[data-theme="studio"] .st-post-back:hover { color: var(--ink); }
`;

/** The dateline, or nothing while a post has never been published. */
function dated(iso: string | null): string {
  if (!iso) return "";
  const text = dateText(iso);
  if (!text) return "";
  return '<time datetime="' + esc(dateAttr(iso)) + '">' + esc(text) + "</time>";
}

function shot(card: PostCard): string {
  if (!card.coverUrl) return '<div class="st-blog-shot--none" aria-hidden="true"></div>';
  return (
    '<img class="st-blog-shot" src="' + esc(card.coverUrl) + '" alt="' +
    esc(card.coverAlt) + '" loading="lazy" decoding="async">'
  );
}

function card(ctx: RenderCtx, base: string, c: PostCard, lead: boolean): string {
  const meta = dated(c.publishedAt);
  return (
    '<li class="st-blog-item' + (lead ? " st-blog-item--lead" : "") + '">' +
    '<a class="st-blog-a" href="' + esc(base + "/" + c.slug + ctx.q) + '">' +
    shot(c) +
    "<div>" +
    (meta ? '<p class="st-blog-meta">' + meta + "</p>" : "") +
    '<h2 class="st-blog-h">' + esc(c.title) + "</h2>" +
    (c.excerpt ? '<p class="st-blog-sub">' + esc(c.excerpt) + "</p>" : "") +
    "</div></a></li>"
  );
}

/**
 * The index.
 *
 * @param base The shop's own blog route, so the Slovenian URL stays in
 *   tenants/bazen.ts like every other one.
 */
export function renderStudioBlogIndex(
  ctx: RenderCtx,
  base: string,
  h1: string,
  lead: string,
  posts: readonly PostCard[],
): string {
  const body =
    posts.length === 0
      ? // ⚠️ THE EMPTY STATE IS NOT ONLY THE PRE-LAUNCH STATE. The index is
        // rendered from the database, and blog/routes.ts deliberately serves
        // an empty list rather than a 500 when that database is unreachable —
        // so this is also what a reader sees during an outage. A single
        // apologetic sentence turns that minute into a dead end for both the
        // reader and the crawler, which is why the paragraph carries the
        // pages that answer the same questions and do not need a database.
        '<p class="st-blog-empty">Prvi zapis pripravljamo. Do takrat vam na vsako ' +
        "vprašanje odgovorimo po telefonu ali e-pošti — v " +
        '<a href="' + esc(ctx.shop.routeSlugs["/guides"] + ctx.q) + '">vodnikih</a> ' +
        "pa je že zdaj zapisano, kaj je treba pripraviti pred dostavo, kako " +
        "poteka priklop in koliko prostora model zares potrebuje. Če se " +
        "odločate med masažnim bazenom in swim spa bazenom, je to razloženo v " +
        '<a href="' + esc(ctx.shop.routeSlugs["/compare"] + ctx.q) + '">primerjavi</a>; ' +
        'cel katalog s cenami je v <a href="' +
        esc(ctx.shop.routeSlugs["/products"] + ctx.q) + '">trgovini</a>.</p>'
      : // A POST INDEX IS A NAVIGATION PAGE, and left as a bare list of cards
        // it is also the site's only indexable page that says nothing in its
        // own voice — the reader gets three headlines and no idea what the
        // series is for or where else the same questions are answered. This
        // paragraph is standing copy rather than per-post copy for exactly
        // that reason: it must not need editing when a post is added.
        '<p class="st-blog-note">Vsak zapis odgovarja na eno vprašanje, ki se ' +
        "pri nakupu res pojavi, in se drži številk iz specifikacij — mer, " +
        "teže, števila mest in šob — namesto vtisov. Kjer odgovora ni, to " +
        "piše; porabe elektrike na primer ne navajamo, ker je odvisna od " +
        "temperature, uporabe, pokrova in vremena." +
        ' Praktični del pred dostavo je zbran v <a href="' +
        esc(ctx.shop.routeSlugs["/guides"] + ctx.q) + '">vodnikih</a>, ' +
        'odločitev med družinama pa v <a href="' +
        esc(ctx.shop.routeSlugs["/compare"] + ctx.q) + '">primerjavi</a>.</p>' +
        '<ul class="st-blog-list">' +
        posts.map((p, i) => card(ctx, base, p, i === 0)).join("") +
        "</ul>";
  return (
    '<main><section class="st-page"><div class="st-page-in">' +
    '<div class="st-page-grid st-page-grid--solo">' +
    '<header class="st-page-head">' +
    '<p class="st-page-eyebrow">' + esc(ctx.shop.name) + "</p>" +
    '<h1 class="st-page-h">' + esc(h1) + "</h1>" +
    '<p class="st-page-lead">' + esc(lead) + "</p>" +
    "</header>" +
    '<div class="st-page-body">' + body + "</div>" +
    "</div></div></section></main>"
  );
}

/**
 * One post.
 *
 * @param blocks The parsed body — parsed by the caller so the router can also
 *   read the questions out of it for the FAQ structured data without parsing
 *   the same text twice.
 */
export function renderStudioBlogPost(
  ctx: RenderCtx,
  base: string,
  baseLabel: string,
  post: Post,
  blocks: readonly Block[],
  minutes: number,
  others: readonly PostCard[],
): string {
  const meta = [dated(post.publishedAt), esc(minutes + " min branja")].filter(Boolean);
  // "Na tej strani", exactly as the content pages build it — same threshold
  // (three headed sections; under that a list of two links is furniture),
  // same ids (renderStudioBlocks assigns them with the same sectionId), same
  // rail. A published post here runs five or six sections of buying advice;
  // a reader arriving from a search with one question was scrolling blind
  // through all of them while /dostava, thirty pixels of nav away, offered
  // an index for less text.
  const ids = blocks.map((b, i) => ("h" in b && b.h ? sectionId(b.h, i) : ""));
  const headed = blocks
    .map((b, i) => ("h" in b && b.h ? { h: b.h, id: ids[i]! } : null))
    .filter((x): x is { h: string; id: string } => x !== null);
  const index =
    // Three, matching renderStudioPage — see the note on its threshold for
    // why four was wrong (a sticky rail does not "orphan"; fullPage capture
    // simply cannot show it sticking).
    headed.length < 3
      ? ""
      : '<nav class="st-page-toc" aria-labelledby="st-post-toc-h">' +
        '<p class="st-page-toc-h" id="st-post-toc-h">V tem zapisu</p>' +
        "<ol>" +
        headed
          .map((x) => '<li><a href="#' + esc(x.id) + '">' + esc(x.h) + "</a></li>")
          .join("") +
        "</ol></nav>";
  const cover = post.coverUrl
    ? '<figure class="st-post-cover st-page-block st-page-block--wide">' +
      '<img src="' + esc(post.coverUrl) + '" alt="' + esc(post.coverAlt) +
      '" loading="eager" decoding="async"></figure>'
    : "";
  const more =
    others.length === 0
      ? ""
      : '<nav class="st-post-more" aria-labelledby="st-more-h">' +
        '<p class="st-post-more-h" id="st-more-h">Preberite še</p><ul>' +
        others
          .map(
            (o) =>
              '<li><a href="' + esc(base + "/" + o.slug + ctx.q) + '">' +
              "<span>" + esc(o.title) + "</span></a></li>",
          )
          .join("") +
        "</ul></nav>";
  return (
    '<main><section class="st-page"><div class="st-page-in">' +
    '<div class="st-page-grid' + (index ? "" : " st-page-grid--solo") + '">' +
    '<header class="st-page-head">' +
    '<p class="st-page-eyebrow">' + esc(baseLabel) + "</p>" +
    '<h1 class="st-page-h">' + esc(post.title) + "</h1>" +
    (post.excerpt ? '<p class="st-page-lead">' + esc(post.excerpt) + "</p>" : "") +
    '<p class="st-post-meta">' + meta.join("<span aria-hidden=\"true\">·</span>") + "</p>" +
    "</header>" +
    (index ? '<div class="st-page-rail">' + index + "</div>" : "") +
    '<div class="st-page-body">' +
    cover +
    renderStudioBlocks(ctx, blocks) +
    more +
    '<a class="st-post-back" href="' + esc(base + ctx.q) + '">' +
    "Vsi zapisi</a>" +
    "</div></div></div></section></main>"
  );
}
