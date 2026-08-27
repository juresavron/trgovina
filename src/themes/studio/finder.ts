/**
 * STUDIO — the guided choice (/izbira).
 *
 * A question is a set of large option LINKS, each carrying the answers so
 * far plus its own — the whole quiz is GET navigation, and the browser's
 * back button IS the "previous question" control (a link restates it
 * anyway, for the visitor who does not think of it). The terminal view is
 * one or two real model cards and an enquiry link that lands on /kontakt
 * with the model attached, exactly like arriving from the product page.
 *
 * Rendered on the page module's vocabulary — masthead, measure, hairlines —
 * so the tool reads as a page of the site, not a widget dropped on one.
 */

import type { ShopConfig } from "../../tenants/types";
import type { ShopContent, PdpContent } from "../../content/types";
import {
  nextStep,
  recommend,
  type FinderAnswers,
  type FinderStep,
} from "../../content/finder";
import { esc } from "../../render/sections";
import type { RenderCtx } from "../../render/sections";
import { renderStudioHeader, renderStudioFooter } from "./chrome";

export const STUDIO_FINDER_CSS = `
  /* ================= §4.x Guided choice ================= */
  :root[data-theme="studio"] .st-fnd {
    max-inline-size: var(--studio-container);
    margin-inline: auto;
    padding: clamp(40px, 6vw, 96px) var(--studio-gutter) clamp(64px, 8vw, 128px);
  }
  :root[data-theme="studio"] .st-fnd-in { max-inline-size: 44rem; }
  :root[data-theme="studio"] .st-fnd-eyebrow {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    color: var(--ink-mute);
    margin: 0 0 10px;
  }
  :root[data-theme="studio"] .st-fnd h1 {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h3);
    letter-spacing: var(--ls-h3);
    line-height: var(--lh-h3);
    color: var(--ink);
    margin: 0 0 10px;
    text-wrap: balance;
  }
  :root[data-theme="studio"] .st-fnd-lead {
    font-size: var(--t-lead);
    line-height: var(--lh-body);
    color: var(--ink-body);
    margin: 0 0 clamp(26px, 3vw, 44px);
    max-inline-size: 36rem;
  }
  /* The options: full-width rows on hairlines, the facts device's rhythm —
   * each one a single large target with the hint under the label. */
  :root[data-theme="studio"] .st-fnd-opts {
    list-style: none;
    margin: 0;
    padding: 0;
    border-block-start: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-fnd-opts li {
    border-block-end: var(--bw-line) solid var(--line);
  }
  :root[data-theme="studio"] .st-fnd-opt {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 16px;
    padding: clamp(16px, 2vw, 24px) 2px;
    text-decoration: none;
  }
  :root[data-theme="studio"] .st-fnd-opt b {
    display: block;
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h6);
    letter-spacing: var(--ls-h6);
    line-height: var(--lh-h6);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-fnd-opt span {
    display: block;
    margin-top: 4px;
    font-size: var(--t-body);
    color: var(--ink-mute);
  }
  :root[data-theme="studio"] .st-fnd-opt .st-fnd-go {
    font-size: 22px;
    color: var(--ink-mute);
    transition: transform 0.3s ease-out, color 0.3s ease-out;
  }
  :root[data-theme="studio"] .st-fnd-opt:hover .st-fnd-go,
  :root[data-theme="studio"] .st-fnd-opt:focus-visible .st-fnd-go {
    transform: translateX(6px);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-fnd-back {
    display: inline-block;
    margin-top: clamp(22px, 3vw, 36px);
    font-size: var(--t-body);
    color: var(--ink-mute);
    text-underline-offset: 3px;
    padding-block: 10px;
    margin-block: -10px;
  }
  /* The verdict: the recommended model as a ruled card row. */
  :root[data-theme="studio"] .st-fnd-why {
    font-size: var(--t-lead);
    line-height: var(--lh-body);
    color: var(--ink-body);
    margin: 0 0 clamp(26px, 3vw, 40px);
  }
  :root[data-theme="studio"] .st-fnd-hits {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 14px;
  }
  :root[data-theme="studio"] .st-fnd-hit {
    border: var(--bw-line) solid var(--line);
    border-radius: var(--r-card);
    padding: clamp(18px, 2.4vw, 28px);
    display: grid;
    gap: 6px;
  }
  :root[data-theme="studio"] .st-fnd-hit .name {
    font-family: var(--f-display);
    font-weight: var(--w-display);
    font-size: var(--t-h5);
    letter-spacing: var(--ls-h5);
    line-height: var(--lh-h5);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-fnd-hit .meta { color: var(--ink-mute); font-size: var(--t-body); }
  :root[data-theme="studio"] .st-fnd-hit .price {
    color: var(--ink);
    font-weight: var(--w-body-med);
    font-variant-numeric: tabular-nums;
  }
  :root[data-theme="studio"] .st-fnd-hit .acts {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  :root[data-theme="studio"] .st-fnd-hit .acts a {
    font-family: var(--f-label);
    font-size: var(--t-label);
    font-weight: var(--w-label);
    letter-spacing: var(--ls-label);
    text-transform: uppercase;
    text-decoration: none;
    padding: 12px 18px;
    border-radius: var(--r-ctrl);
    border: var(--bw-line) solid var(--ink);
    color: var(--ink);
  }
  :root[data-theme="studio"] .st-fnd-hit .acts a.fill {
    background: var(--ink-invert);
    border-color: var(--ink-invert);
    color: var(--on-invert);
  }
`;

/** "Vprašanje 2 od 3" — the relaxation branch is 3 deep, swimming 2. */
function progress(a: FinderAnswers): string {
  const depth = a.namen === "plavanje" ? 2 : 3;
  const answered =
    (a.namen ? 1 : 0) +
    (a.osebe ? 1 : 0) +
    (a.prostor ? 1 : 0) +
    (a.masaza ? 1 : 0);
  return "Vprašanje " + Math.min(answered + 1, depth) + " od " + depth;
}

function stepHtml(base: string, a: FinderAnswers, step: FinderStep): string {
  const params = new URLSearchParams();
  let answered = 0;
  for (const [k, v] of Object.entries(a)) {
    if (v) {
      params.set(k, v);
      answered++;
    }
  }
  return (
    '<p class="st-fnd-eyebrow">' + esc(progress(a)) + "</p>" +
    "<h1>" + esc(step.question) + "</h1>" +
    '<ul class="st-fnd-opts">' +
    step.choices
      .map((c) => {
        const p = new URLSearchParams(params);
        p.set(step.param, c.value);
        return (
          '<li><a class="st-fnd-opt" href="' + esc(base + "?" + p.toString()) + '">' +
          "<span><b>" + esc(c.label) + "</b><span>" + esc(c.hint) + "</span></span>" +
          '<span class="st-fnd-go" aria-hidden="true">→</span></a></li>'
        );
      })
      .join("") +
    "</ul>" +
    (answered > 0
      ? '<a class="st-fnd-back" href="' + esc(base) + '">Začnite znova</a>'
      : "")
  );
}

function resultHtml(
  shop: ShopConfig,
  content: ShopContent,
  a: FinderAnswers,
): string {
  const r = recommend(a);
  const pdps = content.pdps ?? [content.pdp];
  const hits = r.slugs
    .map((slug) => pdps.find((d) => d.slug === slug))
    .filter((d): d is PdpContent => d !== undefined);
  const productBase = shop.routeSlugs["/product"] + "/";
  const contact = shop.routeSlugs["/contact"];
  return (
    '<p class="st-fnd-eyebrow">Naš predlog</p>' +
    "<h1>" + esc(hits[0]?.title ?? "Predlog") + "</h1>" +
    '<p class="st-fnd-why">' + esc(r.why) + "</p>" +
    '<ul class="st-fnd-hits">' +
    hits
      .map(
        (d) =>
          '<li class="st-fnd-hit">' +
          '<span class="name">' + esc(d.title) + "</span>" +
          '<span class="meta">' + esc(d.bar[1]) + "</span>" +
          '<span class="price">' + esc(d.price) +
          (d.price.includes("€") ? " z DDV" : "") + "</span>" +
          '<div class="acts">' +
          '<a class="fill" href="' + esc(contact + "?model=" + d.slug) + '">Povprašajte za ponudbo</a>' +
          '<a href="' + esc(productBase + d.slug) + '">Ogled modela</a>' +
          "</div></li>",
      )
      .join("") +
    "</ul>" +
    '<a class="st-fnd-back" href="' + esc(shop.routeSlugs["/finder"]) + '">Začnite znova</a>'
  );
}

/** The whole page body: chrome, one card, chrome. */
export function renderStudioFinder(
  // ⚠️ ctx ARRIVES BUILT, and the reason is a module cycle: buildCtx lives
  // in render/page.ts, which imports the asset paths, whose module hashes
  // the stylesheet, which is assembled from the studio index — importing
  // page.ts from a studio module closes that ring and BASE_CSS is
  // undefined at init on some entry orders. The worker builds the ctx; a
  // theme module only renders with it.
  ctx: RenderCtx,
  a: FinderAnswers,
): string {
  const shop = ctx.shop;
  const content = ctx.content;
  const step = nextStep(a);
  const inner = step ? stepHtml(shop.routeSlugs["/finder"], a, step) : resultHtml(shop, content, a);
  return (
    renderStudioHeader(ctx) +
    '<main><section class="st-fnd"><div class="st-fnd-in">' +
    inner +
    "</div></section></main>" +
    renderStudioFooter(ctx)
  );
}
