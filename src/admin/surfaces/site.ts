/**
 * /admin/site/<stem> — one site image, on its own page.
 *
 * The slot-by-slot editor behind /admin/slike: a frame, its ratio, what the
 * storefront does with it, and the single-file upload pipeline.
 */

import { FinishKind } from "../../catalog/finish-image";
import { bulkParam } from "../routes";
import { enhanceAvailable } from "../enhance";
import { ensureFinish } from "../finishes";
import { isWebp } from "../media";
import { notFoundPage, siteImagePage } from "../panel";
import { SiteImage, siteImageBySlug, stemOf } from "../site-images";
import { uploadObject } from "../supabase";
import { ERRORS, NOTICES } from "../surfaces/notices";
import type { AdminCtx } from "./ctx";
import { page, seeOther } from "./ctx";

export async function handle(c: AdminCtx): Promise<Response | null> {
  const { admin, api, env, parts, request, shopKey, url } = c;
  // The surface owns its own guard — see the note in blog.ts.
  if (parts[1] !== "site") return null;
    // ⚠️ A COLOUR'S SLOT DOES NOT EXIST UNTIL THE COLOUR DOES, and that is the
    // whole point of the inversion.
    //
    // Every other slot on this site is declared in site-images.ts, so
    // siteImageBySlug resolves it and a stem that is not there is a 404. The
    // finish swatches used to work that way too, which meant a colour could
    // only be photographed if somebody had already typed its name into
    // catalog/pola.ts. Now the photograph creates the colour, so the stem
    // arrives BEFORE any deployed code knows the name.
    //
    // It is not a hole: the shape is fixed (barva-/obloga- plus a slug), the
    // key is rebuilt from that shape rather than taken from the request, and
    // /admin is behind the admin allowlist either way. What it cannot do is
    // reach any other slot, because a stem outside those two prefixes still
    // has to resolve in the registry.
    const stem = parts[2] ?? "";
    const dyn = /^(barva|obloga)-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(stem);
    const registered = siteImageBySlug(stem);
    // ⚠️ WHICH COLOUR THIS SLOT IS, if it is one — and it has to be read here,
    // from the registry, because the slug cannot be turned back into a name.
    // "silver-white-marble" does not tell you the chart prints "Silver white
    // marble", and a purchase order quotes the chart. finishSlots() sets the
    // slot's label to the name verbatim, so the registry is the only place
    // that still knows it.
    const finishHere: { kind: FinishKind; name: string } | null =
      dyn && registered ? { kind: dyn[1] as FinishKind, name: registered.label } : null;
    const slot: SiteImage | undefined =
      registered ??
      (dyn
        ? {
            key: "site/" + stem + ".webp",
            group: dyn[1] === "barva" ? "Barve školjke" : "Barve obloge",
            label: stem,
            note: "",
            optional: true,
            ratio: [1, 1],
            maxWidth: 400,
            exact: true }
        : undefined);
    if (!slot) return page(notFoundPage("Ta slika ne obstaja.", admin.email), 404);

    if (parts[3] === "upload" && request.method === "POST") {
      const form = await request.formData();
      const part = form.get("file");
      if (!(part instanceof File) || part.size === 0) {
        return seeOther("/admin/site/" + stemOf(slot.key) + "?e=alt");
      }
      // A stored slot image is a browser-encoded WebP capped at the slot's
      // own width — 10 MB is far above any honest one.
      if (part.size > 10 * 1024 * 1024) {
        return bulkParam(form)
          ? new Response("Slika je prevelika (do 10 MB).", { status: 413 })
          : seeOther("/admin/site/" + stemOf(slot.key) + "?e=type");
      }
      const bytes = await part.arrayBuffer();
      // The smart uploader posts here too, once per assigned picture, and a
      // fetch() caller cannot read an outcome out of a redirect — the 303
      // resolves to the slot page at 200 whether the query said ?m= or ?e=.
      // So a request that declares itself bulk gets statuses instead.
      const bulk = bulkParam(form);
      // Same guarantee as every other upload: the bytes decide, not the label.
      if (!isWebp(bytes)) {
        return bulk
          ? new Response("Ni WebP.", { status: 415 })
          : seeOther("/admin/site/" + stemOf(slot.key) + "?e=type");
      }
      // FIXED KEY, overwritten in place — see site-images.ts on why it cannot
      // be content-addressed and why /media gives it a short cache instead.
      //
      // Hence upsert. "Overwritten in place" was the intent and not the
      // behaviour: Supabase's POST refuses a key it already holds, so the
      // hero could be set once and never changed, and the second attempt came
      // back as a bare 500. See uploadObject.
      // A FAILURE HERE USED TO BE A BARE 500. The panel rendered that as
      // "Napaka na strežniku", which is true and useless: it named neither the
      // picture nor the reason, and the operator had no move except to try the
      // same thing again. Storage failures are worth naming.
      try {
        await uploadObject(api, slot.key, bytes, "image/webp", true);
      } catch {
        return bulk
          ? new Response("Shramba ni sprejela slike.", { status: 502 })
          : seeOther("/admin/site/" + stemOf(slot.key) + "?e=store");
      }

      // ⚠️ STORING THE BYTES IS NOT THE SAME AS OFFERING THE COLOUR, and this
      // route used to do only the first half.
      //
      // A colour is on the storefront because there is a row in `finishes`;
      // the picture in the bucket is what that row renders as. The bulk drop
      // zone posts through /admin/site-sort, which calls ensureFinish before
      // sending the file here, so that path was always whole. This path — one
      // swatch, uploaded from its own slot page — wrote the image and nothing
      // else. The panel then showed the swatch on the slot page, the operator
      // reasonably concluded the colour was in, and the colour list never
      // heard about it. Two swatches went in that way and neither reached the
      // product pages.
      //
      // ensureFinish is idempotent, so an upload that replaces an existing
      // swatch just finds the row it already has.
      if (finishHere) {
        try {
          await ensureFinish(api, shopKey, finishHere.kind, finishHere.name);
        } catch {
          return bulk
            ? new Response("Slika je shranjena, barve pa ni bilo mogoče dodati na seznam.", { status: 502 })
            : seeOther("/admin/site/" + stemOf(slot.key) + "?e=fin");
        }
      }

      return bulk
        ? new Response(null, { status: 204 })
        : seeOther("/admin/site/" + stemOf(slot.key) + "?m=uploaded");
    }
    if (parts[3]) return page(notFoundPage("Neznano dejanje.", admin.email), 404);

    const n = url.searchParams.get("m")
      ? ({ kind: "ok", text: (Object.hasOwn(NOTICES, url.searchParams.get("m")!) ? NOTICES[url.searchParams.get("m")!] : undefined) ?? "Shranjeno." } as const)
      : url.searchParams.get("e")
        ? ({ kind: "err", text: (Object.hasOwn(ERRORS, url.searchParams.get("e")!) ? ERRORS[url.searchParams.get("e")!] : undefined) ?? "Nalaganje ni uspelo." } as const)
        : undefined;
    return page(
      siteImagePage(
        stemOf(slot.key),
        slot.label,
        slot.note,
        // Cache-bust the preview: the key never changes, so the panel would
        // otherwise show the picture it just replaced.
        "/media/" + slot.key + "?v=" + String(Date.now()),
        n,
        admin.email,
        slot.ratio,
        slot.maxWidth,
        // …and whether that width is a cap or the stored size. Only the
        // colour swatches say "the size", so the sixteen tiles stay one row
        // of identical squares whichever road an upload took.
        slot.exact === true,
        enhanceAvailable(env),
      ),
    );
  return null;
}
