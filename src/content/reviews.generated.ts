/**
 * GENERATED from Supabase by scripts/sync-reviews.mjs — do not edit by hand.
 *
 * The shop's customer reviews, as the storefront renders them.
 *
 * ⚠️ WHY THESE ARE BAKED IN RATHER THAN READ AT REQUEST TIME, when blog posts
 * are not. Two reasons, and the second is the one that decides it.
 *
 * The first is architectural: reviews render in the testimonial band, which
 * appears on the home page and on all six product pages. Those are served by
 * `handleRequest`, which is synchronous and env-free — every test calls it
 * directly and the whole render path depends on that. A blog post could move
 * behind the async layer because /blog is its own route; a testimonial cannot,
 * because it is on the page the entire SEO strategy rests on.
 *
 * The second is legal. A review is a claim under Annex I 23b/23c of the
 * Unfair Commercial Practices Directive — banned outright, no balancing test.
 * Baking them means the launch gate in content/pages.ts and the tests in CI
 * see the REAL reviews before a deploy goes out, so a review that should not
 * be published fails a build rather than reaching a customer. Reading them at
 * request time would move that check to a place where nothing can fail.
 *
 * The cost is honest and stated in the panel: a review saved in /admin/mnenja
 * appears on the site at the next update, not the next reload.
 *
 * ⚠️ `verified` IS THE ONLY THING THAT EARNS THE CHIP. The generator carries
 * it straight from the database column the operator ticks against an order
 * number; nothing here infers it, and `placeholder` is reserved for content
 * nobody wrote.
 *
 * ⚠️ THE CHECKED-IN COPY IS A SNAPSHOT AND THE DATABASE IS THE TRUTH, and the
 * difference has already misled one audit. The deploy runs sync-reviews.mjs
 * before it builds, so what SHIPS is whatever the `reviews` table says at that
 * moment; this file is only what the table said the last time somebody ran the
 * script and committed the result. It had drifted to `verified: true` on all
 * four while the table held false on all four, so every local render, preview
 * and screenshot showed "Preverjena mnenja strank" and four "Preverjen nakup"
 * chips that the live site does not draw — and an audit reported the live site
 * as making a claim it does not make.
 *
 * If you are reading a flag here and it matters, check the table:
 *   select author_name, verified, order_id from reviews order by created_at;
 * Re-synced 2026-08-29 against the table: four reviews, none verified,
 * order_id NULL on all four.
 */

import type { ShopContent } from "./types";

export const GENERATED_REVIEWS: Record<string, ShopContent["reviews"]> = {
  bazen: [
    {
      q: "Spa smo si želeli že dolgo, predvsem za večerno sprostitev po napornem dnevu. Zdaj je to postal naš najljubši del doma. Topla voda in masažni curki res naredijo svoje – po nekaj minutah popolnoma odklopiš.",
      who: "Nina in Marko",
      model: "",
      rating: 5,
      role: "Lastnika spa-ja",
      verified: false,
    },
    {
      q: "Sprva smo mislili, da bo spa predvsem za odrasle, ampak ga danes uporablja cela družina. Čez dan uživajo otroci, zvečer pa si vzamemo čas zase. Postal je prostor, kjer smo skupaj in hkrati resnično sproščeni.",
      who: "Družina Kovač",
      model: "",
      rating: 5,
      role: "Zadovoljni uporabniki",
      verified: false,
    },
    {
      q: "Ker veliko treniram, mi je regeneracija zelo pomembna. Topla voda in masažni curki so odlični po napornem treningu. Spa je postal del moje rutine – ne samo za sprostitev, ampak tudi za regeneracijo.",
      who: "Luka",
      model: "",
      rating: 5,
      role: "Aktivni športnik",
      verified: false,
    },
    {
      q: "Najbolj nama je všeč, da lahko uživava v občutku wellnessa, ne da bi kamorkoli odšla. Zvečer prižgeva luči, napolniva spa in si vzameva čas zase. To je bila ena najboljših odločitev za najin dom.",
      who: "Tina in Jure",
      model: "",
      rating: 5,
      role: "Lastnika spa-ja",
      verified: false,
    },
  ],
};
