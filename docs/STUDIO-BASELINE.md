# STUDIO — the FURNEXA baseline (forensic replication spec)

Derived by direct measurement from 20 screenshots of the owner's Framer theme
at 2000px viewport width. **All px values below are measured at 2000px** —
divide by 1.39 for a 1440px design width, or treat as the clamp maximum.

### Source material

| Source | What it gave us |
| --- | --- |
| 20 screenshots @2000px | every measurement below |
| `css2` font request | the two faces, verbatim |
| **site `_files` bundle (107 files)** | **the real SVG assets and 41 product/scene images** |
| `script*.mjs`, `bootstrap.js`, `edit.html` | nothing — Framer's analytics tracker and editor bundle, carrying only generic `--framer-*` variables |

The bundle shipped the `_files` sidecar without the page HTML, so there is no
source DOM or stylesheet — but it did carry the **icon SVGs and the wordmark**,
which replace guesswork with exact geometry (§4.14), and the **product
photography**, which fixes the image treatment (§4.15).

---

## 1. Type system

| Role | Face | Axes |
| --- | --- | --- |
| Display | **Bricolage Grotesque** | `opsz 12..96`, `wght 200..800` |
| Body / UI | **DM Sans** | `opsz 9..40`, `wght 100..1000` |

Both ship `latin-ext` — Slovenian diacritics native. Confirmed verbatim from
the theme's own `fonts.googleapis.com/css2` request.

### Measured scale (at 2000px)

| Use | Size | Weight | Tracking | Leading |
| --- | --- | --- | --- | --- |
| Hero offer statement ("50% Off") | 90px | 650 | −0.03em | 1.0 |
| Section heading ("Shop by categories") | 68–72px | 600 | −0.025em | 1.05 |
| Page statement (3-line) | 62–68px | 600 | −0.022em | 1.15 |
| Inline-icon paragraph | 52px | 450 | −0.01em | 1.35 |
| Stat value ("800+") | 78px | 500 | −0.02em | 1.0 |
| Card / product title | 26–30px | 600 | −0.01em | 1.2 |
| Feature-row title | 28px | 600 | 0 | 1.3 |
| Body copy | 19–21px | 400 | 0 | 1.6–1.7 |
| Nav item | 15px | 500 | **0.08em** | 1 |
| Uppercase label / chip | 15px | 500 | **0.12em** | 1 |
| Footer legal | 17px | 400 | 0 | 1.5 |

**Rule observed throughout:** display sizes are tight-tracked and heavy;
anything uppercase is small, medium-weight and widely tracked. There is no
middle ground — the theme never sets 30–50px display text except on cards.

---

## 2. Palette (sampled)

| Token | Sampled | Use |
| --- | --- | --- |
| chrome / dark bands | `#0D0D0D` – `#111111` | top bar, testimonial band, footer, About hero |
| page | `#FFFFFF` | every light section |
| product image panel | `#F2F2F2` | the panel a product sits on inside a card |
| quiet tile | `#EFEFEF` | impact-grid left tile |
| card hairline (rest) | `#E4E4E4` | product/category card frame |
| card hairline (hover) | `#111111` | **the frame turns black on hover** — measured on the middle card of both Best Sellers and the shop grid |
| body text | `#4A4A4A` | paragraphs |
| muted text | `#767676` | captions, struck prices, placeholder |
| on-dark body | `#A8A8A8` | footer links, quote attribution |
| dark-band watermark | `#161616` | the giant faint arrow-stadium outline behind the testimonial heading (§4.14) |

**Accent: none.** The theme is monochrome; every drop of color comes from
photography (tan chair, blue chair, orange chair). Our port keeps this and
spends the shop accent only as punctuation — one status dot, hover, and the
accented half of the stats claim.

---

## 3. Layout constants

- Page gutter: **54px** at 2000px (≈2.7vw) — the wordmark, headings and left-aligned
  sections all start here.
- Content max-width: **1900px** for full-bleed bands, **1560px** for text-led
  sections, **930px** for the About reading column.
- Chrome bar height: **90px**.
- Section vertical rhythm: **~130px** top and bottom on light sections,
  **~150px** on dark bands.
- Card radius: **12px**; media radius **12–16px**; the black philosophy card **24px**.
- **Buttons are sharp-cornered (radius 0)** — every CTA: SHOP DEALS, SHOP NOW.
  Pills (labels, chips, arrows) are fully round. This contrast is deliberate
  and is the single easiest thing to get wrong.

---

## 4. Device catalogue (measured)

### 4.1 Chrome bar
Black, 90px. Wordmark left at x=54: uppercase, ~28px, tracking ~0.02em, white.
Nav centered: 5 items, 15px, uppercase, tracking 0.08em, gap ~56px. Right at
x=−48: two circular buttons Ø46px on `#2A2A2A`, white line icons (magnifier,
basket); the basket carries a count badge — small white disc, black numeral.

### 4.2 Hero triptych
Three equal columns, full-bleed, no gaps, height = viewport − chrome.
- **Left**: product photo on `#D9D9D9`, a faint oversized arrow-stadium watermark behind (§4.14).
- **Centre**: black. Stack, centered: outlined pill "LIMITED-TIME OFFER"
  (1px white, radius full, 12×28 padding) → 48px gap → "50% Off" at 90px →
  "Select Best Sellers" 24px in `#D6D6D6` → 56px gap → white **sharp-cornered**
  button, padding 22×60, 16px tracked. A faint oversized **arrow-stadium watermark**
  (§4.14) sits behind the stack.
- **Right**: product photo on warm `#E8E0D6`; product name 40px white and price
  26px white with struck compare-at, overlaid bottom-left.

### 4.3 Statement + story
Left-aligned 3-line statement at 68px starting x=54, max-width ~1350. 90px gap.
"OUR STORY →" at 15px tracked 0.12em. Then a two-column band: body copy left
(19px, max-width 600), image right with a right-aligned uppercase label above it.

### 4.4 Category rail
Centered heading. Cards ~470×500, 1px `#E4E4E4`, radius 12px, white; product
image occupies the top ~55%; name 26px; **price range** ("$1,099 - $3,099")
22px in muted. Cards peek at both viewport edges — it is a rail, not a grid.
Two **stadium** arrow buttons (§4.14 — not circles), centered *below* the rail.

### 4.5 Wordmark band
Full-bleed photo. The brand name is set enormous in white — letters ~200px tall,
spanning nearly the full width — and the **product photo overlaps it** (the sofa
occludes the middle letters). That z-layering is the whole trick. A thin white
callout line runs from a dot on the product to a two-line 20px label. Bottom
left: outlined chip, product name 46px, white sharp-cornered CTA.

### 4.6 Marquee
White band, black text, 17px uppercase tracked 0.12em, items separated by a
small dot. Continuous horizontal scroll.

### 4.7 Best sellers / product grid
Left-aligned heading at x=54. Three cards per row. Card: 1px frame, radius 12px,
padding ~48px; the product sits on a `#F2F2F2` panel with radius 12px occupying
~620px of the ~800px card height; name 30px; price row: current 26px, struck
compare-at 20px muted. **Hover turns the frame black** (`#111`).

### 4.8 Inline-icon statement + stats
Centered outlined pill "WHY FROM US". Then a centered paragraph at **52px,
max-width ~1750**, with **circular outlined icons Ø62px set inline in the text
flow**, vertically centered on the line — small furniture line-glyphs (chair,
drawers, sofa, lamp). This is the theme's signature device.
Below: three stats, centered columns — value 78px with the trailing `+`/`%` as a
**superscript**, caption 18px muted, max-width 280, centered, two lines.

### 4.9 Impact grid
Heading + 21px muted sub, centered. Then a 3-tile row, radius 14px:
left tile `#EFEFEF` with label bottom-left (32px title + 19px muted sub);
centre tile `#A8A8A8` carrying an oversized cropped product photo (the hero
tile, visually bleeding past its neighbours); right tile a room photo with a
**stat overlaid** (58px value + 19px caption) instead of a label.

### 4.10 Dark testimonial
Black band. Centered white heading 72px. A giant faint `#161616` **arrow-stadium
watermark** sits behind it (§4.14) — the same outline as the arrow buttons,
scaled to band width. Left: square B&W portrait
~420px, sharp corners, x=54. Centre: oversized quote glyph ~90px, quote 26px
white leading 1.5 max-width 800, attribution 15px uppercase tracked in muted.
Right: a Ø300px `#1C1C1C` disc containing a small product image. Two **stadium**
arrows (§4.14) in the white ink below it.

### 4.11 Blog cards
Centered heading 72px. Three ~1:1 cards, radius 16px, photo fills, bottom
gradient scrim; a translucent pill chip (15px) and a 30px white title overlaid.

### 4.12 Footer
Black. Giant wordmark ~150px at x=54, **lighter weight (~400) than the chrome
bar's**. Right: "Newsletter" 28px, then an underlined input row — 19px muted
placeholder, 1px bottom rule, arrow at the right end. Then four columns: brand
blurb + contact rows (Ø44px circular icons: mail, phone, pin) and three link
columns at 19px with ~66px row gaps. Hairline rule, then legal line 17px muted.

### 4.13 Secondary-page devices (About / Shop)
- **Slat-textured dark hero**: near-black with fine vertical batten stripes,
  a *horizontally scrolling* oversized word, and a centrally **arched** image
  (top corners rounded to a半 arch, ~640×620). Caption row under it: uppercase
  label left, "• EST. 2019" right.
- **Shop hero**: dark band, page title 90px left with 21px sub; product photo
  right with thin white circle outlines behind it, bleeding below the band.
- **Filter sidebar**: 380px column — uppercase label + hairline, square 22px
  checkboxes with 19px labels, and availability as outlined round pills.
- **Philosophy card**: photo left with a black radius-24px card overlapping it
  on the right, 54px heading + 19px body inside.

### 4.14 The arrow motif — exact geometry (from the source SVGs)

**The arrow button is a stadium, not a circle.** Measured from the theme's own
assets (four variants shipped: left/right × dark/light ink):

```
canvas   36 × 35
outline  35 × 23 rounded rect, rx 11.5, 1px stroke   ← a stadium, wider than tall
arrow    shaft x12 → x24 on y17.5, head 3.18u
ink      #FFFFFF on dark bands · #4D4D4D on light
```

This same outline, scaled to band width and set a few percent off the
background, **is the faint watermark** behind the hero's message panel and the
testimonial heading. Reading it as an "eye" — as an earlier pass of this spec
did — and drawing a circle instead loses the theme's signature. Both live in
`src/themes/studio/icons.ts`, path data verbatim, inked via `currentColor`.

The bundle also ships the **wordmark as an SVG** (126×18 letterform paths,
white fill) — evidence the brand name is treated as artwork, not live text, at
the sizes where it becomes a graphic (chrome bar, footer, wordmark band).

### 4.15 Product photography treatment (from the source images)

41 images; 14 are **transparent-alpha PNG cutouts** — that is the product
system:

- Product is a **cutout on transparency**, composited onto the `#F2F2F2` panel
  by CSS, never a photo with a baked-in background.
- A **soft contact shadow** grounds it — the product sits on the panel, it does
  not float.
- Product fills **~70%** of the frame, centred, generous margin all round.
- **Three-quarter view** for seating; straight-on for beds/tables.
- Even, neutral studio light; no gradient stage, no colour cast.

Scene/lifestyle photography is separate: 2880×1500 ultrawides for full-bleed
bands, 2000×2000 squares for cards, 2761×3905 portrait for the testimonial.

> **Licensing:** those images are the source template's stock and are *not*
> committed to this repo or shipped. They define the treatment our own product
> photography must match.

---

## 5. Porting decisions (where we deliberately differ)

1. **Photography-ready, not photo-faked.** Every photo slot renders a framed
   placeholder at the measured aspect ratio with the right scrim. Product
   photos drop in later with no restructuring.
2. **No dead controls.** The rail's arrows need JS; this Worker ships none
   (LCP budget, docs/SEO.md §4). The rail uses CSS scroll-snap with real
   focusable anchors instead of buttons that would do nothing.
3. **Slovenian, per shop.** The baseline is layout and type only. Copy stays
   per-shop (anti-doorway rule, docs/SEO.md §6) and formal (vikanje).
4. **Accent as punctuation.** FURNEXA is pure monochrome; we allow the shop
   hue in exactly three places so four shops on one baseline still read as
   different companies.
5. **Photography spec, not photography.** §4.15 tells our photographer exactly
   what to deliver: cutouts on transparency with a contact shadow, 70% fill,
   3/4 view. Until those exist, placeholders hold the same geometry.
6. **Struck price format**: the source renders `3,399$` (symbol trailing) next
   to `$2,099` (symbol leading). We normalise to Slovenian convention
   (`3.399 €`) — an inconsistency worth not replicating.

---

## 6. Non-negotiables carried from the kernel

- Every color from a token; no hex inside section modules.
- All interpolated content escaped (`esc()`).
- `overflow-x: clip` on the root; rails scroll in their own container.
- Motion respects `prefers-reduced-motion` (marquee resets, not freezes).
- Contrast measured against the band a token actually sits on.
- Selectors scoped `:root[data-theme="studio"]` — three other themes share the sheet.
