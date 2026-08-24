# Design — world-class at €3–15k AOV

A €5,000 sauna is not e-commerce; it is considered-purchase retail. The
reference class is Klafs, Effe, Bang & Olufsen, Herman Miller — not a Shopify
theme. The page must feel like the room the product will live in.

## What "world-class" means here, concretely

1. **Editorial calm.** Huge atmospheric photography, restrained type,
   generous whitespace, few words that mean something. No urgency banners, no
   countdown timers, no discount confetti — at this price they *reduce*
   conversion because they read as risk.
2. **Trust before persuasion.** Every scroll answers "can I give these people
   €5,000?": phone number in the header, street address, legal entity, real
   installation photos, verified reviews with photos, financing, showroom
   invitation. The trust block is a design component, not footer filler.
3. **Guided choosing, not catalog browsing.** A sauna buyer doesn't want 40
   SKUs and facets; they want three questions — *indoor or outdoor? how many
   people? 230V or 400V?* — and then two or three right answers, compared
   honestly.
4. **Radical spec transparency.** Heater kW, wood species, glass thickness,
   power requirement, assembly time, delivery method — rendered beautifully,
   because high-AOV buyers read everything and rank the site that lets them.
5. **Logistics as hero content.** "Two-man crew, carried to the room you
   choose, assembled and commissioned in 3 hours, packaging removed" is the
   single most differentiating sentence the network can render — above the
   fold on the PDP, not in an FAQ. It is the moat, so it gets hero treatment.
6. **Speed is a design feature.** LCP < 1.5s with full-bleed imagery is a
   design constraint from sketch one (see SEO.md §4), not an optimization
   pass.

## One skeleton, two souls

Layout, grid, rhythm and the component set are identical network-wide —
that's the kernel. Each shop wears one of two **design modes**
(`ShopConfig.design.mode`), so siblings read as different companies without
forking a line of layout code:

| | `warm` (savna) | `crisp` (krio) |
| --- | --- | --- |
| Display face | **Fraunces** (variable, optical sizing) | **Space Grotesk** |
| Text/UI face | Inter | Inter |
| Surfaces | deep charcoal-browns `oklch(0.22 0.01 40)` | glacial near-whites `oklch(0.97 0.005 230)` |
| Accent | ember amber, hue 55 | cold cyan-blue, hue 225 |
| Imagery | cedar, steam, low warm light | fog, frost, high-key cold light |
| Voice | sensory, unhurried | precise, clinical, performance-led |

Accent colors are oklch `(fixed-L, chroma≤0.14, per-shop hue)` — the
onlyworld discipline: lightness ramps are owned by the theme layer so every
shop passes WCAG contrast automatically, both themes.

Fonts are self-hosted, subset to `latin-ext` (č š ž), loaded with
metric-compatible fallbacks → CLS 0.

## Layout DNA (shared)

- 12-col grid, max-width 1280px content / full-bleed imagery bands.
- Section rhythm: 96–128px vertical between acts; a page is 5–7 acts, each
  one idea.
- Type scale ~1.25 ratio; display sizes clamp `3rem → 5.5rem`.
- PDP: sticky buy bar (price + configured summary + CTA) after the hero
  scrolls out; gallery left / configuration right on desktop, stacked mobile.
- Motion: one entrance transition per act, `prefers-reduced-motion`
  respected; nothing loops.

## Component inventory (the kernel's UI vocabulary)

Hero (keyword H1 + atmosphere + trust strip) · Finder (3 questions → 2–3
recommendations) · ProductCard (price incl. DDV + delivery promise) ·
Configurator (size / wood / heater / services) · SpecTable · CompareTable ·
LogisticsTimeline (order → call → delivery day → installation → first use) ·
ReviewWall (verified, photos) · FinancingCalculator (monthly from €X) ·
GuideCard · FAQ accordion · TrustFooter (entity, VAT ID, address, phone) ·
StickyBuyBar · ShowroomInvite.

## Photography direction (per shop, never shared)

- **savna**: dusk exteriors with lit interiors; steam; hands on cedar; one
  human presence, never stock-smiley. Warm 3200K practicals.
- **krio**: fog rolling off an open chamber; frost detail on the door seal;
  athlete mid-session; clinical daylight 5600K+.
- Every product gets: 1 hero atmosphere, 1 straight-on catalog shot, 3–5
  detail crops, 1 installation-in-progress (trust), 1 in-situ customer shot.
- No stock photography on money pages. Ever. It is instantly recognizable
  and reads as "importer with a template" — the exact competitor we beat.

## Anti-doorway design rule

Shared skeleton is invisible; what's visible must diverge: photography,
copy voice, accent, display face, and the order/selection of homepage acts
(each shop composes its 5–7 acts from the component vocabulary differently).
Two shops side-by-side should feel like two companies with the same *quality
bar*, not the same template.
