/**
 * /admin — the dashboard.
 *
 * The one surface that is not a section of the panel but a view OVER it:
 * enquiries first because an enquiry is a person waiting, then the models,
 * then the rest. It is also where the shop switcher lives, for the reason
 * given on indexPage's `shops` parameter.
 */

import { seedCatalogue } from "../catalogue";
import { listProducts } from "../db/catalogue";
import { SiteSlot, indexPage } from "../panel";
import { SITE_IMAGES, stemOf } from "../site-images";
import { listMedia } from "../supabase";
import type { AdminCtx } from "./ctx";
import { json, page, seeOther } from "./ctx";

export async function handle(c: AdminCtx): Promise<Response | null> {
  const { admin, api, parts, shopKey, shopName, shops } = c;
  // The surface owns its own guard — see the note in blog.ts on what
  // extracting a branch without its condition did the first time.
  if (parts.length !== 1) return null;
    const key = shopKey;
    // ⚠️ THE LIST COMES FROM THE TABLE NOW, not from a compiled array.
    //
    // It read CATALOGUE_SHOPS[key].models — OFFERED_MODELS and
    // OFFERED_SWIMSPAS, bundled into the Worker — and ensureProduct() then
    // wrote those rows into public.products. The database mirrored the code,
    // so adding a model to the back office meant a file edit and a deploy.
    //
    // seedCatalogue() still reconciles the code catalogue in, because an empty
    // table would render a back office with nothing in it and that must not be
    // a state this panel can reach. What changed is which one decides: the
    // seed fills gaps, listProducts() says what exists. A row somebody adds in
    // the database — a model the code has never heard of — is on the dashboard
    // at the next page load.
    await seedCatalogue(api, key);
    const models = await listProducts(api, key);
    // The rows were already being fetched to count them; taking the first
    // row's url out of the same result turns the dashboard from a list of
    // names into a contact sheet at no extra request.
    const shots = await Promise.all(models.map((m) => listMedia(api, m.id)));
    return page(
      indexPage(
        // ⚠️ THE ROW'S NAME, NOT THE BUNDLE'S. SHOPS[key] is the compiled
        // tenant registry, so a shop that exists in the database but has no
        // entry there — which is the whole point of a switcher — would have
        // crashed on the non-null assertion. public.shops.name is the name.
        shopName,
        key,
        models.map((m, i) => ({
          shop: key,
          slug: m.slug,
          name: m.title,
          count: shots[i]!.length,
          cover: shots[i]![0]?.url })),
        admin.email,
        SITE_IMAGES.map(
          (x): SiteSlot => ({
            stem: stemOf(x.key),
            label: x.label,
            note: x.note,
            src: "/media/" + x.key,
            group: x.group }),
        ),
        // Every shop this account may administer. One of them and the
        // switcher renders nothing — see the note on indexPage's `shops`.
        shops,
      ),
    );
  return null;
}
