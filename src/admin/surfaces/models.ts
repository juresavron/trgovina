/**
 * /admin/<shop>/<slug> — a model's photographs.
 *
 * ⚠️ THE FALLTHROUGH, AND THE ONLY SURFACE WITHOUT A GUARD OF ITS OWN. Every
 * other module in this directory answers a named first segment and returns
 * null otherwise; this one answers whatever is left, which is why it is LAST
 * in the table and why moving it earlier would swallow every other surface.
 *
 * It ends by rendering a 404 rather than returning null, because by the time
 * the dispatcher reaches here there is nothing after it: an unmatched /admin
 * URL is a page that does not exist, and saying so is this surface's job.
 */

import { seedCatalogue } from "../catalogue";
import { listProducts } from "../db/catalogue";
import { describe, describeAvailable } from "../describe";
import { enhanceAvailable } from "../enhance";
import { previewPath, storedPaths } from "../media";
import { MediaView, modelPage, notFoundPage } from "../panel";
import { arrange } from "../shots";
import { deleteMedia, deleteObject, downloadObject, listMedia, updateMedia } from "../supabase";
import { ERRORS, NOTICES } from "../surfaces/notices";
import { standInAlt, widthsFor } from "../routes";
import { isWebp, slugStem, widthPath } from "../media";
import { Api, insertMedia, uploadObject } from "../supabase";
import type { AdminCtx } from "./ctx";
import { page, seeOther } from "./ctx";




/**
 * Which stored file to show the model when classifying an existing photograph.
 *
 * The 800px rung, when there is one. Classifying does not need detail — the
 * question is "is this the whole tub from above, or a close-up of a seat" —
 * and the widest rung on a laddered upload is a 2K file of several hundred
 * kilobytes. Reading thirty of those through a Worker to ask a yes-or-no-shaped
 * question is bandwidth, CPU and Gemini tokens spent on pixels that change no
 * answer.
 *
 * Falls back to the row's own url, which is right for every photograph that
 * predates the ladder — those are single files and there is nothing else to
 * fetch.
 */
/**
 * How many photographs one press of "Razvrsti z UI" looks at.
 *
 * Three subrequests each — read, ask, write — against a Worker's budget, plus
 * the renumbering writes afterwards. Six leaves comfortable room; the operator
 * presses again for the rest, and the notice says so.
 */
const ARRANGE_BATCH = 6;


async function upload(
  request: Request,
  api: Api,
  shop: string,
  slug: string,
  name: string,
  productId: string,
): Promise<Response> {
  const form = await request.formData();
  // AN EMPTY DESCRIPTION NO LONGER REFUSES THE UPLOAD.
  //
  // product_media.alt is NOT NULL with a length check, so something has to go
  // in — but "something" was being extracted from the operator one sentence
  // at a time, and a set of ten meant ten sentences before the button would
  // work at all. That is how the bucket ended up with nine photographs
  // sharing one pasted string: a required field does not produce good alt
  // text, it produces whatever gets past it.
  //
  // So the field is optional at every layer now and the stand-in is written
  // here. It is not a description and does not pretend to be one — it names
  // the model and the picture's position, which is true of the file and
  // nothing more. The describer writes a real one when it is configured, the
  // operator can correct any of them from the list below, and neither is a
  // precondition for getting the photograph into the shop.
  const declared = String(form.get("widths") ?? "")
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 8000);

  // EVERY RUNG IS READ AND CHECKED BEFORE ANYTHING IS WRITTEN.
  //
  // The old shape uploaded each width as it read it, which was fine while the
  // key was known in advance. It is not any more: the key is built from the
  // description, and the description is written by looking at the picture —
  // so the picture has to be in hand first. Reading them all up front also
  // means a bad rung fails before any object is stored, instead of leaving
  // three of five in the bucket.
  //
  // Five rungs of a 2048px photograph is a couple of megabytes against a
  // Worker's 128, which is the whole reason this can be held rather than
  // streamed.
  const parts: [number, ArrayBuffer][] = [];
  if (declared.length > 0) {
    for (const w of declared) {
      const part = form.get("w" + w);
      if (!(part instanceof File)) continue;
      const bytes = await part.arrayBuffer();
      // The rung says webp and the browser wrote it, but the check is on the
      // bytes: a label is the sender's claim, and this is the one place that
      // can make "every upload is WebP" true rather than intended.
      if (!isWebp(bytes)) return seeOther("/admin/" + shop + "/" + slug + "?e=type");
      parts.push([w, bytes]);
    }
  } else {
    const part = form.get("file");
    if (!(part instanceof File) || part.size === 0) {
      return seeOther("/admin/" + shop + "/" + slug + "?e=file");
    }
    // ⚠️ THIS BRANCH USED TO STORE THE ORIGINAL, whatever it was — the EXT map
    // it consulted listed jpeg, png and avif — so the panel's own promise
    // that every upload is WebP was false the moment scripting was off or
    // createImageBitmap was missing. One JPEG in the bucket is all it takes:
    // the storefront then serves a 250 KB photograph where its neighbours are
    // 9 KB, and nothing anywhere reports it.
    //
    // So the fallback no longer converts by accepting less. It accepts a
    // WebP, or it refuses and says so. That is a real limitation of a
    // no-script upload and it is stated on the form rather than papered over.
    const bytes = await part.arrayBuffer();
    if (!isWebp(bytes)) return seeOther("/admin/" + shop + "/" + slug + "?e=type");
    parts.push([0, bytes]);
  }
  if (parts.length === 0) return seeOther("/admin/" + shop + "/" + slug + "?e=file");

  const widest = parts.reduce((a, b) => (b[0] > a[0] ? b : a));

  // THE DESCRIPTION IS WRITTEN HERE, not typed in the panel.
  //
  // This is the whole point of the panel's new shape: the operator chooses
  // files and nothing else, so the one place that can say what is in a
  // photograph is the code holding the photograph. describe() looks at the
  // widest rung — the same bytes the storefront will serve — and returns a
  // sentence or null; null means no key, a refusal, or an answer that did not
  // survive tidy(), and the stand-in takes over.
  //
  // An operator-supplied alt still wins where one arrives, which keeps the
  // no-script form and any future edit path honest.
  // ONE LOOK, TWO ANSWERS. The model is shown the photograph once and asked
  // both what is in it and what kind of shot it is — see shots.ts. The second
  // costs nothing extra and is what lets every model's gallery open on the
  // same establishing picture.
  const given = String(form.get("alt") ?? "").trim();
  const seen = given ? null : await describe(api.env, widest[1], "image/webp", name);
  const alt = given || seen?.alt || standInAlt(name, form.get("n"));
  const shot = seen?.shot ?? null;

  // THE STEM IS THE ALT TEXT, and it is here for image search: the filename
  // is one of the few signals Google has about what a picture shows, and a
  // bare UUID spends it on nothing. The UUID stays after a double hyphen so
  // the URL still changes whenever the bytes do — see isContentAddressed,
  // which is what keeps these files on the immutable year.
  //
  // If the description slugifies to nothing (no latin letters in it at all)
  // the model slug stands in, so a file always has a readable stem.
  const stem = slugStem(alt) || slugStem(slug) || "slika";
  const id = stem + "--" + crypto.randomUUID();

  const base = shop + "/" + slug + "/" + id + ".webp";
  const written: number[] = [];
  for (const [w, bytes] of parts) {
    const path = w === widest[0] ? base : widthPath(base, w);
    await uploadObject(api, path, bytes, "image/webp");
    if (w !== widest[0] && w > 0) written.push(w);
  }
  if (widest[0] > 0) written.push(widest[0]);
  written.sort((a, b) => a - b);

  // The browser is the only thing that knows whether the upscaler produced
  // anything, so its word is what gets stored. See the enhanced column.
  const enhanced = String(form.get("enhanced") ?? "") === "1";

  const rows = await listMedia(api, productId);
  await insertMedia(api, productId, base, alt, rows.length, enhanced, shot);
  if (written.length > 1) await widthsFor(api, productId, base, written);

  return seeOther("/admin/" + shop + "/" + slug + "?m=uploaded");
}

export async function handle(c: AdminCtx): Promise<Response | null> {
  const { admin, api, env, parts, request, shopKey, url } = c;
    const shop = parts[1]!;
    const slug = parts[2] ?? "";
    // Resolved against the table, for the same reason the dashboard is: a model
    // that exists as a row but not in the bundle had no page here, so the only
    // way to photograph it was to ship a deploy first.
    //
    // The seed runs before the lookup so a first visit to a known model still
    // works on a fresh database, exactly as ensureProduct() used to guarantee.
    await seedCatalogue(api, shop);
    const model = (await listProducts(api, shop)).find((m) => m.slug === slug);
    if (!model) return page(notFoundPage("Ta model ne obstaja.", admin.email), 404);

    const productId = model.id;
    const action = parts[3];

    if (action === "upload" && request.method === "POST") {
      return await upload(request, api, shop, model.slug, model.title, productId);
    }

    if (action === "update" && request.method === "POST") {
      const form = await request.formData();
      const id = String(form.get("id") ?? "");
      const alt = String(form.get("alt") ?? "").trim();
      const sort = Number(form.get("sort") ?? 0);
      if (!id || !alt) return seeOther("/admin/" + shop + "/" + slug + "?e=alt");
      await updateMedia(api, id, { alt, sort: Number.isFinite(sort) ? sort : 0 });
      return seeOther("/admin/" + shop + "/" + slug + "?m=saved");
    }

    // CLEARING A MODEL, WHICH IS THE SAME WORK AS DELETE ONE AND A DIFFERENT RISK.
    //
    // Deleting nine photographs one at a time is nine confirmations and nine
    // page loads, so an operator replacing a set does it with the browser's back
    // button and a lot of patience. That is the case this exists for.
    //
    // It is also the only irreversible button in the panel that cannot be undone
    // by re-uploading one file, so the confirmation names the model and the
    // count rather than asking "are you sure?" — and the COUNT IS RE-READ HERE
    // rather than trusted from the form, so a stale tab cannot be talked into
    // clearing a set that has changed since it was rendered.
    //
    // Objects are removed per row through storedPaths, exactly as the single
    // delete does, so a row whose ladder was written before the widest rung
    // moved to the bare path is handled by the one function that knows the rule.
    // SORTING A GALLERY BY WHAT THE PICTURES ARE OF.
    //
    // Six pools, photographed the same way by the same supplier, and every
    // gallery opened on a different kind of picture. This asks the model what
    // each photograph IS — from the fixed list in shots.ts — and renumbers the
    // set so every model opens on the same establishing shot.
    //
    // ⚠️ IN BATCHES, because a Worker has a subrequest budget and this spends
    // three per photograph: read the file, ask the model, write the answer. A
    // model with thirty photographs would blow it and fail having done nothing.
    // So it classifies a few, reorders everything it knows about, and says how
    // many are left — pressing it again continues. Partial progress is kept
    // rather than rolled back, which is the whole reason it is safe to press
    // twice.
    //
    // Already-classified photographs are skipped and never re-asked: the point
    // is a stable order, and a category that changes each time it is looked at
    // is not an order at all. Changing one is a job for the panel's own select.
    if (action === "arrange" && request.method === "POST") {
      if (!describeAvailable(env)) {
        return seeOther("/admin/" + shop + "/" + slug + "?e=no-ai");
      }
      const rows = await listMedia(api, productId);
      let looked = 0;
      let left = 0;
      for (const row of rows) {
        if (row.shot) continue;
        if (looked >= ARRANGE_BATCH) { left++; continue; }
        const bytes = await downloadObject(api, previewPath(row.url, row.widths));
        if (bytes === null) { left++; continue; }
        looked++;
        const seen = await describe(api.env, bytes, "image/webp", model.title);
        if (seen?.shot) {
          await updateMedia(api, row.id, { shot: seen.shot });
          (row as { shot: string | null }).shot = seen.shot;
        } else {
          // Looked at and got nothing usable back. Counted as remaining rather
          // than silently accepted, so the operator is not told the gallery is
          // sorted when one picture was never placed.
          left++;
        }
      }
      for (const p of arrange(rows)) await updateMedia(api, p.id, { sort: p.sort });
      return seeOther(
        "/admin/" + shop + "/" + slug + (left > 0 ? "?m=arranged-partly" : "?m=arranged"),
      );
    }

    if (action === "delete-all" && request.method === "POST") {
      const form = await request.formData();
      const rows = await listMedia(api, productId);
      // The form carries what the page showed. If the set changed underneath —
      // another tab, another person, an upload finishing — do nothing and say
      // so, because "delete everything" is the wrong thing to guess at.
      const claimed = Number(form.get("count") ?? -1);
      if (rows.length === 0) return seeOther("/admin/" + shop + "/" + slug + "?m=deleted-none");
      if (claimed !== rows.length) {
        return seeOther("/admin/" + shop + "/" + slug + "?e=stale");
      }
      for (const row of rows) {
        await deleteMedia(api, row.id);
        for (const path of storedPaths(row.url, row.widths)) await deleteObject(api, path);
      }
      return seeOther("/admin/" + shop + "/" + slug + "?m=cleared");
    }

    if (action === "delete" && request.method === "POST") {
      const form = await request.formData();
      const id = String(form.get("id") ?? "");
      const rows = await listMedia(api, productId);
      const row = rows.find((r) => r.id === id);
      if (row) {
        // Rows first: an orphaned object costs storage, an orphaned row renders
        // a broken image on a product page.
        await deleteMedia(api, id);
        for (const path of storedPaths(row.url, row.widths)) await deleteObject(api, path);
      }
      return seeOther("/admin/" + shop + "/" + slug + "?m=deleted");
    }

    if (action) return page(notFoundPage("Neznano dejanje.", admin.email), 404);

    const rows = await listMedia(api, productId);
    const notice = url.searchParams.get("m")
      ? ({ kind: "ok", text: (Object.hasOwn(NOTICES, url.searchParams.get("m")!) ? NOTICES[url.searchParams.get("m")!] : undefined) ?? "Shranjeno." } as const)
      : url.searchParams.get("e")
        ? ({ kind: "err", text: (Object.hasOwn(ERRORS, url.searchParams.get("e")!) ? ERRORS[url.searchParams.get("e")!] : undefined) ?? "Nalaganje ni uspelo." } as const)
        : undefined;

    return page(
      modelPage(
        shop,
        model.slug,
        model.title,
        rows.map((r): MediaView => ({
          id: r.id, url: r.url, alt: r.alt, sort: r.sort,
          widths: r.widths ?? [], enhanced: r.enhanced === true, shot: r.shot ?? null })),
        notice,
        admin.email,
        enhanceAvailable(env),
        describeAvailable(env),
      ),
    );
}
