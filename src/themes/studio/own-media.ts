/**
 * GENERATED from Supabase by scripts/sync-media.mjs — do not edit by hand.
 *
 * ⚠️ AND THE CHECKED-IN COPY IS A SNAPSHOT, NOT THE TRUTH. The deploy runs the
 * generator BEFORE it builds (see .github/workflows/deploy.yml, which prints a
 * diffstat when the committed copy was stale), so what SHIPS is whatever the
 * product_media table says at that moment. This file is only what the table
 * said the last time somebody ran the script and committed the result.
 *
 * That difference has now misread the live site twice in one review round. Two
 * audits reported that SWIM 580 HIDRO's photographs describe a swim spa as a
 * "masažni bazen" and never name the model — true of THIS FILE, and false of
 * the database, which carries ten photographs whose alts all say "plavalni
 * masažni bazen" and read correctly. reviews.generated.ts had drifted the same
 * way, in the opposite direction and with legal consequences.
 *
 * So: if an alt, an order or a photo count matters, read the table, not this.
 *   select p.slug, m.sort, m.alt from product_media m
 *     join products p on p.id = m.product_id order by p.slug, m.sort;
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
 * uploads — but these went in through the Supabase dashboard, which does
 * neither. The six ZR805 files are the ones that hurt: they are JPEGs at
 * 121–252 KB where the same picture as a laddered WebP was 8–25 KB. The
 * ZR7861 set shows what good looks like by comparison — eight WebPs at
 * 7–12 KB each, 79 KB for the lot.
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
  /**
   * Which KIND of photograph this is — see admin/shots.ts for the vocabulary.
   *
   * Here so a slot can ASK for the frame it needs instead of taking whatever
   * sorted first. The hero wants the one atmospheric picture in a set; a
   * comparison table wants the top-down diagram; they are not the same
   * photograph and "photo[0]" cannot tell them apart.
   */
  readonly shot?: string;
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
  "bazen/swim-450": [
    { src: "/media/zr7861-1.webp", alt: "Swim spa SWIM 450, pogled od zgoraj na akrilno školjko", widths: [] },
    { src: "/media/zr7861-2.webp", alt: "Swim spa SWIM 450, pogled s strani na školjko in oblogo", widths: [] },
    { src: "/media/zr7861-3.webp", alt: "Swim spa SWIM 450 z osvetljeno oblogo", widths: [] },
    { src: "/media/zr7861-4.webp", alt: "Notranjost swim spa bazena SWIM 450 s sedeži in šobami", widths: [] },
    { src: "/media/zr7861-5.webp", alt: "Swim spa SWIM 450, pogled na dolžino školjke", widths: [] },
    { src: "/media/zr7861-6.webp", alt: "Detajl sedežnega dela swim spa bazena SWIM 450", widths: [] },
    { src: "/media/zr7861-7.webp", alt: "Detajl masažnih šob v swim spa bazenu SWIM 450", widths: [] },
    { src: "/media/zr7861-8.webp", alt: "Swim spa SWIM 450, pogled na rob in vzglavnike", widths: [] },
  ],
  "bazen/swim-580-hidro": [
    { src: "/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-stopnicami-sedezi--176b4e3f-e5b4-4e2d-ae17-d4d001e92bee.webp", alt: "Notranjost belega masažnega bazena s stopnicami, sedeži, vzglavniki in vodnimi šobami", widths: [["/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-stopnicami-sedezi--176b4e3f-e5b4-4e2d-ae17-d4d001e92bee-480.webp", 480], ["/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-stopnicami-sedezi--176b4e3f-e5b4-4e2d-ae17-d4d001e92bee-800.webp", 800], ["/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-stopnicami-sedezi--176b4e3f-e5b4-4e2d-ae17-d4d001e92bee-1200.webp", 1200], ["/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-stopnicami-sedezi--176b4e3f-e5b4-4e2d-ae17-d4d001e92bee-1600.webp", 1600], ["/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-stopnicami-sedezi--176b4e3f-e5b4-4e2d-ae17-d4d001e92bee.webp", 2048]] },
    { src: "/media/bazen/swim-580-hidro/notranjost-masaznega-bazena-s-sedezi-nasloni-za-glavo-in--812c74a6-f300-4798-b82d-8fd14ff4ec99.webp", alt: "Notranjost masažnega bazena s sedeži, nasloni za glavo in masažnimi šobami", widths: [["/media/bazen/swim-580-hidro/notranjost-masaznega-bazena-s-sedezi-nasloni-za-glavo-in--812c74a6-f300-4798-b82d-8fd14ff4ec99-480.webp", 480], ["/media/bazen/swim-580-hidro/notranjost-masaznega-bazena-s-sedezi-nasloni-za-glavo-in--812c74a6-f300-4798-b82d-8fd14ff4ec99-800.webp", 800], ["/media/bazen/swim-580-hidro/notranjost-masaznega-bazena-s-sedezi-nasloni-za-glavo-in--812c74a6-f300-4798-b82d-8fd14ff4ec99-1200.webp", 1200], ["/media/bazen/swim-580-hidro/notranjost-masaznega-bazena-s-sedezi-nasloni-za-glavo-in--812c74a6-f300-4798-b82d-8fd14ff4ec99-1600.webp", 1600], ["/media/bazen/swim-580-hidro/notranjost-masaznega-bazena-s-sedezi-nasloni-za-glavo-in--812c74a6-f300-4798-b82d-8fd14ff4ec99.webp", 2048]] },
    { src: "/media/bazen/swim-580-hidro/zaprt-plavalni-masazni-bazen-s-sivo-oblogo-in-svetlim--e1e29046-3134-41c6-b2d2-c62b107a614c.webp", alt: "Zaprt plavalni masažni bazen s sivo oblogo in svetlim pokrovom", widths: [["/media/bazen/swim-580-hidro/zaprt-plavalni-masazni-bazen-s-sivo-oblogo-in-svetlim--e1e29046-3134-41c6-b2d2-c62b107a614c-480.webp", 480], ["/media/bazen/swim-580-hidro/zaprt-plavalni-masazni-bazen-s-sivo-oblogo-in-svetlim--e1e29046-3134-41c6-b2d2-c62b107a614c-800.webp", 800], ["/media/bazen/swim-580-hidro/zaprt-plavalni-masazni-bazen-s-sivo-oblogo-in-svetlim--e1e29046-3134-41c6-b2d2-c62b107a614c-1200.webp", 1200], ["/media/bazen/swim-580-hidro/zaprt-plavalni-masazni-bazen-s-sivo-oblogo-in-svetlim--e1e29046-3134-41c6-b2d2-c62b107a614c-1600.webp", 1600], ["/media/bazen/swim-580-hidro/zaprt-plavalni-masazni-bazen-s-sivo-oblogo-in-svetlim--e1e29046-3134-41c6-b2d2-c62b107a614c.webp", 2048]] },
    { src: "/media/bazen/swim-580-hidro/notranjost-belega-plavalnega-masaznega-bazena-s-sedisci-in--d912b258-09c9-43fe-856a-efaabcf2c1b5.webp", alt: "Notranjost belega plavalnega masažnega bazena s sedišči in protitočnim sistemom", widths: [["/media/bazen/swim-580-hidro/notranjost-belega-plavalnega-masaznega-bazena-s-sedisci-in--d912b258-09c9-43fe-856a-efaabcf2c1b5-480.webp", 480], ["/media/bazen/swim-580-hidro/notranjost-belega-plavalnega-masaznega-bazena-s-sedisci-in--d912b258-09c9-43fe-856a-efaabcf2c1b5-800.webp", 800], ["/media/bazen/swim-580-hidro/notranjost-belega-plavalnega-masaznega-bazena-s-sedisci-in--d912b258-09c9-43fe-856a-efaabcf2c1b5-1200.webp", 1200], ["/media/bazen/swim-580-hidro/notranjost-belega-plavalnega-masaznega-bazena-s-sedisci-in--d912b258-09c9-43fe-856a-efaabcf2c1b5-1600.webp", 1600], ["/media/bazen/swim-580-hidro/notranjost-belega-plavalnega-masaznega-bazena-s-sedisci-in--d912b258-09c9-43fe-856a-efaabcf2c1b5.webp", 2048]] },
    { src: "/media/bazen/swim-580-hidro/masazni-sedez-z-vzglavnikom-in-sobami-v-belem-masaznem--6380a5d7-5ac0-4123-8906-1b553d8ae0d8.webp", alt: "Masažni sedež z vzglavnikom in šobami v belem masažnem bazenu", widths: [["/media/bazen/swim-580-hidro/masazni-sedez-z-vzglavnikom-in-sobami-v-belem-masaznem--6380a5d7-5ac0-4123-8906-1b553d8ae0d8-480.webp", 480], ["/media/bazen/swim-580-hidro/masazni-sedez-z-vzglavnikom-in-sobami-v-belem-masaznem--6380a5d7-5ac0-4123-8906-1b553d8ae0d8-800.webp", 800], ["/media/bazen/swim-580-hidro/masazni-sedez-z-vzglavnikom-in-sobami-v-belem-masaznem--6380a5d7-5ac0-4123-8906-1b553d8ae0d8-1200.webp", 1200], ["/media/bazen/swim-580-hidro/masazni-sedez-z-vzglavnikom-in-sobami-v-belem-masaznem--6380a5d7-5ac0-4123-8906-1b553d8ae0d8-1600.webp", 1600], ["/media/bazen/swim-580-hidro/masazni-sedez-z-vzglavnikom-in-sobami-v-belem-masaznem--6380a5d7-5ac0-4123-8906-1b553d8ae0d8.webp", 2048]] },
    { src: "/media/bazen/swim-580-hidro/prazen-plavalni-masazni-bazen-z-nasloni-za-glavo-in--15a87d35-6bfc-4d6b-aa85-f1bc38311069.webp", alt: "Prazen plavalni masažni bazen z nasloni za glavo in masažnimi šobami", widths: [["/media/bazen/swim-580-hidro/prazen-plavalni-masazni-bazen-z-nasloni-za-glavo-in--15a87d35-6bfc-4d6b-aa85-f1bc38311069-480.webp", 480], ["/media/bazen/swim-580-hidro/prazen-plavalni-masazni-bazen-z-nasloni-za-glavo-in--15a87d35-6bfc-4d6b-aa85-f1bc38311069-800.webp", 800], ["/media/bazen/swim-580-hidro/prazen-plavalni-masazni-bazen-z-nasloni-za-glavo-in--15a87d35-6bfc-4d6b-aa85-f1bc38311069-1200.webp", 1200], ["/media/bazen/swim-580-hidro/prazen-plavalni-masazni-bazen-z-nasloni-za-glavo-in--15a87d35-6bfc-4d6b-aa85-f1bc38311069-1600.webp", 1600], ["/media/bazen/swim-580-hidro/prazen-plavalni-masazni-bazen-z-nasloni-za-glavo-in--15a87d35-6bfc-4d6b-aa85-f1bc38311069.webp", 2048]] },
    { src: "/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-sedezi-vzglavniki-in--fa512e51-e948-4e36-b7c3-99e3d1e952d1.webp", alt: "Notranjost belega masažnega bazena s sedeži, vzglavniki in masažnimi šobami", widths: [["/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-sedezi-vzglavniki-in--fa512e51-e948-4e36-b7c3-99e3d1e952d1-480.webp", 480], ["/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-sedezi-vzglavniki-in--fa512e51-e948-4e36-b7c3-99e3d1e952d1-800.webp", 800], ["/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-sedezi-vzglavniki-in--fa512e51-e948-4e36-b7c3-99e3d1e952d1-1200.webp", 1200], ["/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-sedezi-vzglavniki-in--fa512e51-e948-4e36-b7c3-99e3d1e952d1-1600.webp", 1600], ["/media/bazen/swim-580-hidro/notranjost-belega-masaznega-bazena-s-sedezi-vzglavniki-in--fa512e51-e948-4e36-b7c3-99e3d1e952d1.webp", 2048]] },
    { src: "/media/bazen/swim-580-hidro/podolgovat-masazni-bazen-s-temno-zunanjo-oblogo-in-svetlim--0caa0564-3a3e-42f0-9c0b-12cd2ac93d53.webp", alt: "Podolgovat masažni bazen s temno zunanjo oblogo in svetlim robom", widths: [["/media/bazen/swim-580-hidro/podolgovat-masazni-bazen-s-temno-zunanjo-oblogo-in-svetlim--0caa0564-3a3e-42f0-9c0b-12cd2ac93d53-480.webp", 480], ["/media/bazen/swim-580-hidro/podolgovat-masazni-bazen-s-temno-zunanjo-oblogo-in-svetlim--0caa0564-3a3e-42f0-9c0b-12cd2ac93d53-800.webp", 800], ["/media/bazen/swim-580-hidro/podolgovat-masazni-bazen-s-temno-zunanjo-oblogo-in-svetlim--0caa0564-3a3e-42f0-9c0b-12cd2ac93d53-1200.webp", 1200], ["/media/bazen/swim-580-hidro/podolgovat-masazni-bazen-s-temno-zunanjo-oblogo-in-svetlim--0caa0564-3a3e-42f0-9c0b-12cd2ac93d53-1600.webp", 1600], ["/media/bazen/swim-580-hidro/podolgovat-masazni-bazen-s-temno-zunanjo-oblogo-in-svetlim--0caa0564-3a3e-42f0-9c0b-12cd2ac93d53.webp", 2048]] },
  ],
  "bazen/swim-580-maxi": [
    { src: "/media/ZR7807-1.jpg", alt: "Swim spa SWIM 580 MAXI, pogled od zgoraj na akrilno školjko", widths: [] },
    { src: "/media/ZR7807-2.jpg", alt: "Swim spa SWIM 580 MAXI, pogled s strani na školjko in oblogo", widths: [] },
    { src: "/media/ZR7807-3.jpg", alt: "Swim spa SWIM 580 MAXI, pogled na dolžino školjke", widths: [] },
    { src: "/media/ZR7807-4.jpg", alt: "Notranjost swim spa bazena SWIM 580 MAXI s sedeži in ležalnikom", widths: [] },
    { src: "/media/ZR7807-5.jpg", alt: "Sedežni del swim spa bazena SWIM 580 MAXI z masažnimi šobami", widths: [] },
    { src: "/media/ZR7807-7.jpg", alt: "Detajl masažnih šob v swim spa bazenu SWIM 580 MAXI", widths: [] },
    { src: "/media/ZR7807-8.jpg", alt: "Swim spa SWIM 580 MAXI, pogled na rob in vzglavnike", widths: [] },
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
