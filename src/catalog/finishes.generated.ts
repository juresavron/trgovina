/**
 * GENERATED — do not edit by hand. `node scripts/sync-finishes.mjs` rewrites
 * this file from the `finishes` table.
 *
 * ⚠️ WHY THE COLOUR LIST IS BAKED IN RATHER THAN READ AT REQUEST TIME. The
 * configurator renders on all six product pages, which `handleRequest` serves
 * synchronously and without env — the same constraint that puts reviews in
 * content/reviews.generated.ts. A colour list read per request would make the
 * whole storefront async to save a deploy.
 *
 * ⚠️ AND WHY IT IS EMPTY UNTIL SOMEBODY UPLOADS A SWATCH. This inverts what
 * the shop used to do. catalog/pola.ts held a transcription of the supplier's
 * chart and admin/site-images.ts built one upload slot per transcribed name,
 * so a colour could only be photographed if it had already been typed into
 * the source — and a sample the shop actually holds but the transcription
 * missed had nowhere to go. Now the photograph comes first and the name comes
 * off the file.
 *
 * While this list is empty the transcription still stands in (see
 * OFFERED_SHELL_FINISHES in pola.ts), so an unreachable database or a shop
 * that has photographed nothing yet renders exactly what it rendered before.
 * The moment a swatch is uploaded, the uploaded set takes over COMPLETELY for
 * that kind — a half-generated, half-transcribed list would put colours on
 * the page that the shop cannot show beside colours it can, with nothing to
 * tell them apart.
 */

/** One colour the shop can actually show, with a photograph behind it. */
export interface GeneratedFinish {
  /** As the manufacturer writes it — the name a purchase order quotes. */
  readonly name: string;
  /** The bucket key stem: site/<kind>-<slug>.webp. */
  readonly slug: string;
}

/** Shell colours, in the order the panel puts them. */
export const GENERATED_SHELL_FINISHES: readonly GeneratedFinish[] = [];

/** Cabinet colours, in the order the panel puts them. */
export const GENERATED_CABINET_FINISHES: readonly GeneratedFinish[] = [];
