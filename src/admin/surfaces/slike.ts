/**
 * /admin/slike — the site's own imagery, slot by slot.
 */

import { SiteSlot, sitePage } from "../panel";
import { SITE_IMAGES, stemOf } from "../site-images";
import type { AdminCtx } from "./ctx";
import { json, page, seeOther } from "./ctx";

export async function handle(c: AdminCtx): Promise<Response | null> {
  const { admin, api, env, parts, request, shopKey, url } = c;
  // The surface owns its own guard — see the note in blog.ts on what
  // extracting a branch without its condition did the first time.
  if (parts[1] !== "slike") return null;
    return page(
      sitePage(
        shopKey,
        admin.email,
        SITE_IMAGES.map(
          (x): SiteSlot => ({
            stem: stemOf(x.key),
            label: x.label,
            note: x.note,
            src: "/media/" + x.key,
            group: x.group }),
        ),
      ),
    );
  return null;
}
