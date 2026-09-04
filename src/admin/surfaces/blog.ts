/**
 * /admin/blog — posts, and their cover images.
 *
 * Lifted out of handleAdmin unchanged. The largest of the four at 140 lines,
 * which is the argument for the move: it was the largest thing in a function
 * where nothing announced where it began or ended.
 */

import { excerptFrom } from "../../blog/post";
import { createPost, deletePost, freeSlug, getById, listAll, setStatus, updatePost } from "../../blog/store";
import { ERRORS, NOTICES } from "./notices";
import { SHOPS } from "../../tenants";
import { blogEditPage, blogListPage } from "../blog-panel";
import { isWebp, slugStem } from "../media";
import { notFoundPage } from "../panel";
import { uploadObject } from "../supabase";
import type { AdminCtx } from "./ctx";
import { json, page, seeOther } from "./ctx";

export async function handle(c: AdminCtx): Promise<Response | null> {
  const { admin, api, env, parts, request, shopKey, url } = c;
  // ⚠️ THE SURFACE OWNS ITS OWN GUARD. In the if-chain this was the
  // condition of the branch; extracted without it, the body ran for every
  // request and the first surface in the table answered the whole panel.
  // Returning null is how a surface says "not mine" — see Surface in ctx.
  if (parts[1] !== "blog") return null;
    const notice = url.searchParams.get("m")
      ? ({ kind: "ok", text: (Object.hasOwn(NOTICES, url.searchParams.get("m")!) ? NOTICES[url.searchParams.get("m")!] : undefined) ?? "Shranjeno." } as const)
      : url.searchParams.get("e")
        ? ({ kind: "err", text: (Object.hasOwn(ERRORS, url.searchParams.get("e")!) ? ERRORS[url.searchParams.get("e")!] : undefined) ?? "Ni uspelo." } as const)
        : undefined;
    const siteUrl = SHOPS[shopKey]?.siteUrl ?? "";

    /** Title, excerpt and body off the form, with the excerpt derived if blank. */
    const readForm = async (): Promise<{ title: string; excerpt: string; source: string } | null> => {
      const form = await request.formData();
      const title = String(form.get("title") ?? "").trim();
      if (!title) return null;
      const source = String(form.get("body") ?? "");
      // A post with no summary still needs one: it is the card's standfirst
      // and the meta description, and an empty description is a search result
      // Google writes for you out of whatever it finds.
      const excerpt = String(form.get("excerpt") ?? "").trim() || excerptFrom(source);
      return { title, excerpt, source };
    };

    // The list.
    if (parts.length === 2 && request.method === "GET") {
      return page(blogListPage(await listAll(api, shopKey), admin.email, notice));
    }

    // A new one. GET draws the empty editor; POST creates a DRAFT and lands
    // on its own page, so the operator is where the cover form and the
    // publish button are.
    if (parts[2] === "nov") {
      if (request.method === "GET") return page(blogEditPage(null, admin.email, siteUrl, notice));
      if (request.method === "POST") {
        const fields = await readForm();
        if (!fields) return seeOther("/admin/blog/nov?e=title");
        const slug = await freeSlug(api, shopKey, slugStem(fields.title));
        const made = await createPost(api, shopKey, { slug, ...fields });
        return seeOther("/admin/blog/" + made.id + "?m=post-saved");
      }
    }

    const id = parts[2] ?? "";
    if (!id) return page(notFoundPage("Ta zapis ne obstaja.", admin.email), 404);
    const post = await getById(api, shopKey, id);
    if (!post) return page(notFoundPage("Ta zapis ne obstaja.", admin.email), 404);
    const here = "/admin/blog/" + post.id;

    // The editor.
    if (parts.length === 3 && request.method === "GET") {
      return page(blogEditPage(post, admin.email, siteUrl, notice));
    }

    // Save, and optionally publish or withdraw in the same press. One button
    // rather than two pages: an operator who has just finished writing wants
    // to publish what they wrote, not what was saved a moment ago.
    if (parts.length === 3 && request.method === "POST") {
      const form = await request.formData();
      const title = String(form.get("title") ?? "").trim();
      if (!title) return seeOther(here + "?e=title");
      const source = String(form.get("body") ?? "");
      const excerpt = String(form.get("excerpt") ?? "").trim() || excerptFrom(source);
      // The slug FOLLOWS THE TITLE ONLY WHILE THE POST IS A DRAFT. Once it is
      // published the URL is out in the world — in somebody's history, in a
      // search index, in a message — and renaming it because a typo was fixed
      // breaks every one of those links silently.
      const slug =
        post.status === "draft" && slugStem(title) !== post.slug
          ? await freeSlug(api, shopKey, slugStem(title), post.id)
          : post.slug;
      try {
        await updatePost(api, shopKey, post.id, { slug, title, excerpt, source });
      } catch (err) {
        console.error(err);
        return seeOther(here + "?e=post");
      }
      const then = String(form.get("then") ?? "");
      if (then === "publish") {
        await setStatus(api, shopKey, post.id, "published", post.publishedAt === null);
        return seeOther(here + "?m=post-published");
      }
      if (then === "unpublish") {
        await setStatus(api, shopKey, post.id, "draft", false);
        return seeOther(here + "?m=post-unpublished");
      }
      return seeOther(here + "?m=post-saved");
    }

    if (parts[3] === "delete" && request.method === "POST") {
      await deletePost(api, shopKey, post.id);
      return seeOther("/admin/blog?m=post-deleted");
    }

    // The cover. Stored under a content-addressed key so a replacement is a
    // new URL and no cache anywhere serves the old picture — the reason the
    // product photographs are addressed the same way, and the reason the site
    // slots (which cannot be) get a short cache instead.
    if (parts[3] === "cover" && request.method === "POST") {
      const form = await request.formData();
      const part = form.get("file");
      const alt = String(form.get("alt") ?? "").trim();
      if (!(part instanceof File) || part.size === 0) return seeOther(here + "?e=file");
      const bytes = await part.arrayBuffer();
      if (!isWebp(bytes)) return seeOther(here + "?e=type");
      const key = "blog/" + post.slug + "--" + crypto.randomUUID() + ".webp";
      try {
        await uploadObject(api, key, bytes, "image/webp");
      } catch (err) {
        console.error(err);
        return seeOther(here + "?e=store");
      }
      await updatePost(api, shopKey, post.id, {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        source: post.source,
        coverUrl: "/media/" + key,
        coverAlt: alt || post.title,
      });
      return seeOther(here + "?m=cover-set");
    }

    if (parts[3] === "cover-clear" && request.method === "POST") {
      // The row loses the picture; the object stays. A cover that has been
      // published is in somebody's cache and in a share card, and the storage
      // cost of a stray WebP is not worth a broken image on a link that was
      // sent last week. Product photographs are deleted because they are
      // MANAGED — there is a page listing them — and a blog cover is not.
      await updatePost(api, shopKey, post.id, {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        source: post.source,
        coverUrl: null,
        coverAlt: "",
      });
      return seeOther(here + "?m=cover-cleared");
    }

    return page(notFoundPage("Neznano dejanje.", admin.email), 404);
  return null;
}
