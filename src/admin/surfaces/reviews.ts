/**
 * /admin/mnenja — customer reviews.
 *
 * ⚠️ WHAT THIS PANEL MAY NOT BE USED FOR. Publishing a review no real
 * customer wrote is on the blacklist of unfair commercial practices in Annex I
 * of ZVPot-1, points 23b and 23c, with no test of the circumstances — and so
 * is claiming a review is from a verified buyer when that was not verified.
 * This screen exists to transcribe what was actually received. Nothing else.
 *
 * Lifted out of handleAdmin unchanged.
 */

import { ERRORS, NOTICES } from "./notices";
import { CATALOGUE_SHOPS } from "../catalogue";
import { notFoundPage } from "../panel";
import { createReview, deleteReview, getReview, listReviews, updateReview } from "../reviews";
import { reviewEditPage, reviewListPage } from "../reviews-panel";
import { ensureProduct } from "../supabase";
import type { AdminCtx } from "./ctx";
import { json, page, seeOther } from "./ctx";

export async function handle(c: AdminCtx): Promise<Response | null> {
  const { admin, api, env, parts, request, shopKey, url } = c;
  // ⚠️ THE SURFACE OWNS ITS OWN GUARD. In the if-chain this was the
  // condition of the branch; extracted without it, the body ran for every
  // request and the first surface in the table answered the whole panel.
  // Returning null is how a surface says "not mine" — see Surface in ctx.
  if (parts[1] !== "mnenja") return null;
    const notice = url.searchParams.get("m")
      ? ({ kind: "ok", text: (Object.hasOwn(NOTICES, url.searchParams.get("m")!) ? NOTICES[url.searchParams.get("m")!] : undefined) ?? "Shranjeno." } as const)
      : url.searchParams.get("e")
        ? ({ kind: "err", text: (Object.hasOwn(ERRORS, url.searchParams.get("e")!) ? ERRORS[url.searchParams.get("e")!] : undefined) ?? "Ni uspelo." } as const)
        : undefined;
    const cat = CATALOGUE_SHOPS[shopKey]!;
    const models = cat.models.map((m) => ({ slug: m.slug, name: m.name }));

    /**
     * The form, with the product resolved to a real row.
     *
     * The model arrives as a SLUG and is matched against this shop's own
     * catalogue before it becomes anything — a review may only ever name a
     * product the shop actually sells. The two invented reviews this replaces
     * named "BAZEN RELAX 5", a model that has never existed.
     */
    const read = async (): Promise<
      { ok: true; draft: Parameters<typeof createReview>[2] } | { ok: false; why: string }
    > => {
      const form = await request.formData();
      const body = String(form.get("body") ?? "").trim();
      const authorName = String(form.get("who") ?? "").trim();
      if (!body || !authorName) return { ok: false, why: "rv-empty" };
      const orderNumber = String(form.get("order") ?? "").trim();
      const verified = form.get("verified") !== null;
      if (verified && orderNumber === "") return { ok: false, why: "rv-unverified" };
      const slug = String(form.get("model") ?? "");
      const model = cat.models.find((m) => m.slug === slug);
      const productId = model
        ? await ensureProduct(api, shopKey, model.slug, model.name, model.freightClass)
        : null;
      const rating = Number(form.get("rating") ?? 5);
      return {
        ok: true,
        draft: {
          body,
          authorName,
          rating: Number.isFinite(rating) ? rating : 5,
          productId,
          orderNumber,
          verified,
          published: form.get("published") !== null,
        },
      };
    };

    if (parts.length === 2 && request.method === "GET") {
      return page(reviewListPage(await listReviews(api, shopKey), admin.email, notice));
    }

    if (parts[2] === "novo") {
      if (request.method === "GET") {
        return page(reviewEditPage(null, models, admin.email, notice));
      }
      if (request.method === "POST") {
        const got = await read();
        if (!got.ok) return seeOther("/admin/mnenja/novo?e=" + got.why);
        try {
          const made = await createReview(api, shopKey, got.draft);
          return seeOther("/admin/mnenja/" + made.id + "?m=rv-saved");
        } catch (err) {
          console.error(err);
          return seeOther("/admin/mnenja/novo?e=rv");
        }
      }
    }

    const rid = parts[2] ?? "";
    if (!rid) return page(notFoundPage("To mnenje ne obstaja.", admin.email), 404);
    const review = await getReview(api, shopKey, rid);
    if (!review) return page(notFoundPage("To mnenje ne obstaja.", admin.email), 404);
    const rhere = "/admin/mnenja/" + review.id;

    if (parts.length === 3 && request.method === "GET") {
      return page(reviewEditPage(review, models, admin.email, notice));
    }
    if (parts.length === 3 && request.method === "POST") {
      const got = await read();
      if (!got.ok) return seeOther(rhere + "?e=" + got.why);
      try {
        await updateReview(api, shopKey, review.id, got.draft);
      } catch (err) {
        console.error(err);
        return seeOther(rhere + "?e=rv");
      }
      return seeOther(rhere + "?m=rv-saved");
    }
    if (parts[3] === "delete" && request.method === "POST") {
      await deleteReview(api, shopKey, review.id);
      return seeOther("/admin/mnenja?m=rv-deleted");
    }
    return page(notFoundPage("Neznano dejanje.", admin.email), 404);
  return null;
}
