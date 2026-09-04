/**
 * /admin/barve — the finish and colour swatches.
 *
 * Lifted out of handleAdmin unchanged. What was `if (parts[1] === "barve")`
 * inside a 1,146-line function is the body of a function named for what it
 * serves; the branch's own locals were already scoped to it, and the four it
 * borrowed from the enclosing scope now arrive as AdminCtx.
 */

import { finishImageKey } from "../../catalog/finish-image";
import { CABINET_FINISHES_ARE_PHOTOGRAPHED, SHELL_FINISHES_ARE_PHOTOGRAPHED, TRANSCRIBED_CABINET_FINISHES, TRANSCRIBED_SHELL_FINISHES } from "../../catalog/pola";
import { encodeBucketKey } from "../../media-aliases";
import { ERRORS, NOTICES } from "./notices";
import { enhanceAvailable } from "../enhance";
import { deleteFinish, listFinishes, renameFinish } from "../finishes";
import { finishListPage } from "../finishes-panel";
import { nameColour, nameColourAvailable, uniqueColourName } from "../name-colour";
import { BUCKET } from "../supabase";
import type { AdminCtx } from "./ctx";
import { page, seeOther } from "./ctx";

export async function handle(c: AdminCtx): Promise<Response | null> {
  const { admin, api, env, parts, request, shopKey, url } = c;
  // ⚠️ THE SURFACE OWNS ITS OWN GUARD. In the if-chain this was the
  // condition of the branch; extracted without it, the body ran for every
  // request and the first surface in the table answered the whole panel.
  // Returning null is how a surface says "not mine" — see Surface in ctx.
  if (parts[1] !== "barve") return null;
    const id = parts[2];

    if (id && request.method === "POST") {
      if (parts[3] === "izbris") {
        await deleteFinish(api, shopKey, id);
        return seeOther("/admin/barve?m=fin-deleted");
      }
      // ⚠️ NAMING AN EXISTING COLOUR FROM ITS OWN SWATCH, so a colour that
      // came in badly named can be fixed without re-uploading the file.
      //
      // Six swatches went in called "Screenshot 2026-08-28 at 10.20.46". The
      // naming that would have caught them shipped in a deploy that finished
      // fifty seconds BEFORE they were uploaded, and there is no reason the
      // only cure for that should be delete-everything-and-drag-it-again.
      //
      // Safe to redo at any time because renameFinish changes the NAME and
      // not the slug: the swatch stays at the bucket key it was written to,
      // and a rename cannot orphan a picture.
      if (parts[3] === "ime") {
        const rows = await listFinishes(api, shopKey);
        const row = rows.find((f) => f.id === id);
        if (!row) return seeOther("/admin/barve?e=fin-none");
        if (!nameColourAvailable(env)) return seeOther("/admin/barve?e=fin-noai");
        const url2 =
          env.SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/" +
          encodeBucketKey(finishImageKey(row.kind, row.slug));
        let bytes: ArrayBuffer;
        try {
          const r = await fetch(url2);
          if (!r.ok) return seeOther("/admin/barve?e=fin-noimg");
          bytes = await r.arrayBuffer();
        } catch {
          return seeOther("/admin/barve?e=fin-noimg");
        }
        const proposal = await nameColour(env, bytes, "image/webp", row.kind);
        if (!proposal) return seeOther("/admin/barve?e=fin-noname");
        const others = new Set(
          rows.filter((f) => f.id !== id).map((f) => f.name.trim().toLowerCase()),
        );
        await renameFinish(api, shopKey, id, uniqueColourName(proposal, others));
        return seeOther("/admin/barve?m=fin-named");
      }
      const form = await request.formData();
      await renameFinish(api, shopKey, id, String(form.get("name") ?? ""));
      return seeOther("/admin/barve?m=fin-saved");
    }

    const notice = url.searchParams.get("m")
      ? ({
          kind: "ok",
          text:
            (Object.hasOwn(NOTICES, url.searchParams.get("m")!)
              ? NOTICES[url.searchParams.get("m")!]
              : undefined) ?? "Shranjeno.",
        } as const)
      : url.searchParams.get("e")
        ? ({
            kind: "err",
            text:
              (Object.hasOwn(ERRORS, url.searchParams.get("e")!)
                ? ERRORS[url.searchParams.get("e")!]
                : undefined) ?? "Ni uspelo.",
          } as const)
        : undefined;
    // The fallback lists go WITH the rows, because the page has to describe
    // what the storefront is showing, not what the table holds. On a shop
    // that has uploaded nothing those are two different answers: the table is
    // empty and every product page is rendering the transcription.
    return page(
      finishListPage(await listFinishes(api, shopKey), admin.email, notice, {
        shell: TRANSCRIBED_SHELL_FINISHES,
        cabinet: TRANSCRIBED_CABINET_FINISHES,
        shellPhotographed: SHELL_FINISHES_ARE_PHOTOGRAPHED,
        cabinetPhotographed: CABINET_FINISHES_ARE_PHOTOGRAPHED,
      }, enhanceAvailable(env)),
    );
  return null;
}
