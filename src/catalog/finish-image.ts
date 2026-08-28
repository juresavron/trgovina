/**
 * Where a finish's swatch photograph lives.
 *
 * ⚠️ ONE SOURCE OF TRUTH, AND THAT IS THE WHOLE REASON THIS MODULE EXISTS.
 * Two places need the same path from the same colour name: admin/site-images.ts
 * builds a managed upload slot for it, and themes/studio/pdp.ts paints it on
 * the configurator. If either derived the path itself they would drift on the
 * first colour with a diacritic in it, and the failure is silent — the panel
 * would store "site/barva-crna.webp" while the page asked for
 * "site/barva-črna.webp", and the swatch would simply never appear.
 *
 * It sits in catalog/ rather than in either caller because the finish NAMES
 * live here (pola.ts), and because the storefront must not import the admin
 * panel to draw a product page.
 *
 * ⚠️ THE SLUG IS PART OF THE STORED KEY, so changing this function renames
 * every swatch in the bucket and silently unpublishes the lot. It folds the
 * Slovenian diacritics the cabinet list uses (č/š/ž) and the Croatian pair
 * (ć/đ) that a supplier sheet can carry, lowercases, and reduces everything
 * else to single hyphens — the same folding sectionId() does for anchors,
 * restated rather than imported because that one is a theme concern and this
 * is a storage key.
 */

/** Which list a finish came from — the two are stored under separate stems. */
export type FinishKind = "barva" | "obloga";

/** "Silver white marble" → "silver-white-marble"; "Črna" → "crna". */
export function finishSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The bucket key: "site/barva-midnight.webp".
 *
 * ⚠️ IT TAKES A SLUG, NOT A NAME, and it used to take a name. A colour's slug
 * is fixed when its swatch is first stored; its name is free to change after
 * that — the panel renames, and the automatic naming rewrites outright. So
 * folding the name again produced a key for a file that does not exist the
 * moment anybody renamed anything, and the swatch is a CSS background, so the
 * tile simply went blank with nothing logged anywhere. See FinishEntry in
 * catalog/pola.ts.
 */
export function finishImageKey(kind: FinishKind, slug: string): string {
  return "site/" + kind + "-" + slug + ".webp";
}

/**
 * The URL the storefront paints: "/media/site/barva-midnight.webp".
 *
 * Rendered whether or not anything has been uploaded yet — exactly like the
 * hero and the other managed slots. What differs is HOW the absence shows:
 * the swatch is painted as a CSS background, so a slot nobody has filled
 * paints nothing at all and the tile keeps its neutral ground and its name.
 * There is no broken-image icon and no fallback photograph to arrange, which
 * is why these slots are the ones marked `optional` in the registry.
 */
export function finishImageUrl(kind: FinishKind, slug: string): string {
  return "/media/" + finishImageKey(kind, slug);
}
