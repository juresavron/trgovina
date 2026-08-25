/**
 * GENERATED from Supabase by scripts/sync-media.mjs — do not edit by hand.
 *
 * The shop's product photography, keyed by "<shop>/<model-slug>", in the order
 * the gallery shows it. The bytes live in the Supabase `product-media` bucket
 * and reach the page through the Worker's /media/ proxy, which puts them in
 * Cloudflare's cache at the edge nearest the visitor and keeps them
 * same-origin. This module is only the INDEX: which files, in what order,
 * described how.
 *
 * WHY AN INDEX AT ALL, rather than querying Supabase per request. handleRequest
 * is synchronous and takes no env — every test calls it directly, and the
 * whole render path depends on that. A database round trip inside it is not a
 * refactor, it is a different architecture. So the rows are read at build
 * time and the render stays a pure function of the request.
 *
 * The cost is honest and worth stating: adding a photograph through /admin
 * puts it in Supabase immediately, and it appears on the site at the next
 * deploy, not the next reload.
 *
 * ⚠️ NO INTRINSIC DIMENSIONS. Every frame that paints these sets its own
 * aspect-ratio and sizes the image to 100% — .st-pdp-frame is 1/1,
 * .st-shot is var(--studio-pdp-frame-ar), .st-soc-img is a fixed tile — so the
 * CSS reserves the box and the layout never depends on the file. Emitting
 * width/height here would mean either measuring 25 files this build cannot
 * reach, or inventing numbers; inventing them is how an <img> ends up
 * declaring an aspect ratio its pixels do not have. CLS stays at zero because
 * the frame, not the image, holds the space.
 *
 * ⚠️ NO WIDTH LADDER. The Supabase free plan has no image transformation and
 * Cloudflare Image Resizing is not available on workers.dev, so there is one
 * file per photograph and no srcset. Uploading through /admin fixes this —
 * the panel converts to WebP and writes a ladder in the browser before it
 * uploads — but these 25 went in through the Supabase dashboard, which does
 * neither. The six ZR805 files are the ones that hurt: they are JPEGs at
 * 121–252 KB where the same picture as a laddered WebP was 8–25 KB.
 */

export interface OwnPhoto {
  /** Served by the Worker's /media/ proxy out of the product-media bucket. */
  readonly src: string;
  readonly alt: string;
  /** Intrinsic size, where it is known. See the note above — usually absent. */
  readonly w?: number;
  readonly h?: number;
  /** [file, intrinsic width] rungs, narrowest first. Empty without a ladder. */
  readonly widths: readonly (readonly [string, number])[];
}

export const OWN_MEDIA: Readonly<Record<string, readonly OwnPhoto[]>> = {
  "bazen/mali-195": [
    { src: "/media/ZR805-1.jpg", alt: "Masažni bazen BAZEN 195, pogled od zgoraj na akrilno školjko s petimi sedeži", widths: [] },
    { src: "/media/ZR805-2.jpg", alt: "Masažni bazen BAZEN 195 z leseno oblogo, pogled s strani", widths: [] },
    { src: "/media/ZR805-7.jpg", alt: "Masažni bazen BAZEN 195 s temno oblogo, pogled s strani", widths: [] },
    { src: "/media/ZR805-4.jpg", alt: "Bližnji posnetek notranjosti in masažnih šob bazena BAZEN 195", widths: [] },
    { src: "/media/ZR805-5.jpg", alt: "Detajl sedeža in vzglavnika v bazenu BAZEN 195", widths: [] },
    { src: "/media/ZR805-6.jpg", alt: "Detajl masažnih šob v školjki bazena BAZEN 195", widths: [] },
  ],
  "bazen/srednji-210": [
    { src: "/media/zr804-1.webp", alt: "Masažni bazen BAZEN 210", widths: [] },
    { src: "/media/zr804-2.webp", alt: "Masažni bazen BAZEN 210", widths: [] },
    { src: "/media/zr804-3.webp", alt: "Masažni bazen BAZEN 210", widths: [] },
    { src: "/media/zr804-4.webp", alt: "Masažni bazen BAZEN 210", widths: [] },
    { src: "/media/zr804-5.webp", alt: "Masažni bazen BAZEN 210", widths: [] },
    { src: "/media/zr804-6.webp", alt: "Masažni bazen BAZEN 210", widths: [] },
    { src: "/media/zr804-7.webp", alt: "Masažni bazen BAZEN 210", widths: [] },
    { src: "/media/zr804-8.webp", alt: "Masažni bazen BAZEN 210", widths: [] },
    { src: "/media/zr804-9.webp", alt: "Masažni bazen BAZEN 210", widths: [] },
  ],
  "bazen/veliki-230": [
    { src: "/media/zr801-1.webp", alt: "Masažni bazen BAZEN 230, pogled od zgoraj na belo akrilno školjko s petimi sedeži in vzglavniki", widths: [] },
    { src: "/media/zr801-9.webp", alt: "Masažni bazen BAZEN 230 s sivo leseno oblogo in osvetljenima LED trakovoma", widths: [] },
    { src: "/media/zr801-2.webp", alt: "Masažni bazen BAZEN 230, pogled s strani na školjko in oblogo", widths: [] },
    { src: "/media/zr801-5.webp", alt: "Masažni bazen BAZEN 230 z modro-zeleno LED osvetlitvijo v mraku", widths: [] },
    { src: "/media/zr801-6.webp", alt: "Masažni bazen BAZEN 230 z zeleno LED osvetlitvijo obloge", widths: [] },
    { src: "/media/zr801-4.webp", alt: "Notranjost masažnega bazena BAZEN 230 z vijolično LED osvetlitvijo in šobami", widths: [] },
    { src: "/media/zr801-3.webp", alt: "Bližnji posnetek sedežev in masažnih šob v bazenu BAZEN 230", widths: [] },
    { src: "/media/zr801-7.webp", alt: "Detajl masažnih šob in vzglavnika v bazenu BAZEN 230", widths: [] },
    { src: "/media/zr801-8.webp", alt: "Detajl notranjosti školjke bazena BAZEN 230", widths: [] },
    { src: "/media/zr801-10.webp", alt: "Masažni bazen BAZEN 230 z osvetljeno oblogo, pogled s strani", widths: [] },
  ],
};
