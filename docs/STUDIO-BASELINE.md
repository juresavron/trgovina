# STUDIO — the FURNEXA baseline

The owner's Framer theme (`furnexa.framer.website`), ported into the kernel as
the network's **flagship theme**. This document is the replication spec: what
each device is, so any section module can be rebuilt without re-deriving it.

## Fonts (confirmed from the theme's own Google Fonts request)

| Role | Face | Axes |
| --- | --- | --- |
| Display | **Bricolage Grotesque** | `opsz 12..96`, `wght 200..800` |
| Body / UI | **DM Sans** | `opsz 9..40`, `wght 100..1000` |

Both ship `latin-ext` — Slovenian diacritics render natively.

## Palette

Near-monochrome by construction. Photography carries all the color; the shop
accent is punctuation only (a status dot, a hover, an underline) — never a
surface and never body text.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#ffffff` | page |
| `--ink-invert` | `#0d0d0d` | chrome bar, dark bands, footer |
| `--bg-alt` | `#f4f4f4` | product image panels |
| `--line` | `#e4e4e4` | quiet dividers |
| `--line-strong` | `#111111` | the drawn frame around a card |
| `--ink` / `--ink-soft` / `--ink-mute` | `#0a0a0a` / `#4a4a4a` / `#767676` | text ramp |

## Section devices (the replication list)

1. **Chrome bar** — full-bleed near-black, wordmark left, uppercase
   letterspaced nav centered, circular icon buttons right (search, cart with
   count badge). Sticky, `--chrome-h`.
2. **Hero triptych** — three panels edge to edge: product photo · black offer
   panel (pill label, oversized statement, sub, white button) · product photo
   with name + price overlaid bottom.
3. **Statement + story** — oversized display paragraph, small `OUR STORY →`
   link, then a two-column band: body copy left, image right with a small
   uppercase label above it.
4. **Category rail** — horizontally scrolling bordered cards, product on
   white, name + price *range*, circular prev/next buttons centered below.
5. **Wordmark band** — full-bleed photo with the brand name set enormous in
   white across it; a thin callout line pointing at the product, a chip label,
   product name and a white CTA button bottom-left.
6. **Marquee** — infinite ticker of USP statements separated by dots.
7. **Best sellers** — three cards inside drawn hairline frames; image sits on
   `--bg-alt`, then name, price, and a struck-through compare-at price.
8. **Inline-icon statement** — a `WHY FROM US` pill, then a large centered
   paragraph with small circular product icons set *inside the text flow*,
   followed by a three-up stat row (`800+`, `16k+`, `100%`) with captions.
9. **Impact grid** — asymmetric image tiles with a label overlaid bottom-left;
   one tile carries a stat instead.
10. **Dark testimonial** — inverted band, square portrait left, oversized
    quote mark, quote, attribution, product thumb in a circle right, circular
    arrows.
11. **Blog cards** — three photo cards, category chip and title overlaid on a
    bottom gradient.
12. **Footer** — inverted, giant wordmark, newsletter as an underlined input
    with an arrow, three link columns, contact rows with circular icons.

## Kernel mapping

The kernel's section vocabulary already covers most of this; studio's
composition preset (`src/themes/catalog.ts`) orders them. Devices that are
studio-specific (marquee, wordmark band, inline-icon statement) render as
theme modules under `src/themes/studio/`, per docs/THEMES.md's file layout.

## Non-negotiables carried from the kernel

- Every color from a token; no hex inside section modules.
- All interpolated content escaped (`esc()`); content stays per-shop
  Slovenian — the baseline is layout and type, never shared copy.
- `overflow-x: clip` on the root; wide rails scroll in their own container.
- Motion respects `prefers-reduced-motion` (marquee pauses).
- Contrast measured against the band a token actually sits on.
