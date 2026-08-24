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

## The theme system

Design is structured as a **theme catalog** (`src/themes/`) — the
architecture is specified in [`docs/THEMES.md`](THEMES.md) and ported from
the proven 26-theme system in `simple-site-11a8fbdb`. In short: a shared
kernel (section vocabulary, 6-rung type scale, palette math) under named
themes (`zarja`, `lednik`, `salon`) that own surfaces, typography voice,
edge policy and composition; each shop picks a theme and contributes only
its accent hue/chroma and content. Accent lightness rungs are fixed by the
palette factory so every shop/theme pairing passes measured contrast.

In production fonts are self-hosted, subset to `latin-ext` (č š ž), loaded
with metric-compatible (`size-adjust`) fallbacks → CLS 0. The design
prototype substitutes Google Fonts for speed of iteration — that substitution
does not ship.

## Layout DNA (shared)

- 12-col grid, max-width 1280px content / full-bleed imagery bands.
- Section rhythm: 96–128px vertical between acts; a page is 5–7 acts, each
  one idea.
- Type scale ~1.25 ratio; hero display clamps `2.5rem → 4.625rem`, PDP
  display `1.875rem → 2.75rem`.
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

- **savna**: dusk interiors, warm panel glow, hands on wood; one human
  presence, never stock-smiley. Warm 3200K practicals.
- **kad**: breath fog over open water, frost on the rim, a swimmer's exhale;
  clinical daylight 5600K+.
- **bazen**: terrace at golden hour, water texture close-ups, family scale.
- **fotelj**: living-room evening light, leather/fabric detail, reading lamp.
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
