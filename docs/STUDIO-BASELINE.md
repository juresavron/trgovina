# STUDIO — the FURNEXA baseline (replication spec)

**§1–§3 are transcribed from the source theme's own stylesheet.** §4 onward is
still the earlier screenshot-derived catalogue; where the two disagree, this
file's front half wins and §4 is being reconciled device by device.

---

## 0. Provenance, and what measurement got wrong

The first pass measured this theme off 20 screenshots. The owner then supplied
the theme's saved page — 725 KB of HTML carrying 231 KB of inline CSS, 758
rules, plus the DOM with Framer's inline style attributes. Everything in §1–§3
now comes from that file.

The gap between the two passes is the point of this section: measurement was
not slightly off, it was **categorically wrong about what the theme is**.

| What | Measured | Transcribed | Cost of the error |
| --- | --- | --- | --- |
| Display face | Bricolage Grotesque | **Clash Display** | wrong typeface everywhere |
| Body face | DM Sans | **Satoshi** | wrong typeface everywhere |
| DM Sans' role | the body face | **only the 14px uppercase label** | — |
| Bricolage / Fragment Mono | assumed in use | **used zero times** | LCP paid for faces that never paint |
| Display weight | 600 | **500** | too heavy |
| Display tracking | −0.022em | **0em / +0.02em** | tight where the source is open |
| Card radius | 12px | **8px** | — |
| Button radius | 0px "sharp, the signature" | **4px** | the signature was invented |
| Container | 1900px | **1440px** | every section too wide |
| Gutter | up to 54px | **40 / 25 / 25px** | — |
| Section rhythm | up to 130px | **170 / 100 / 70px** | vertical rhythm too tight |
| Panel greys | `#f2f2f2` **and** `#efefef` | **one grey, `#f0f0f0`** | invented a rung |
| Primary ink | `#0a0a0a` / `#0d0d0d` | **one `#151515`** | invented a rung |
| Accent | "none — the theme is monochrome" | **amber `#f0aa13`** + cream + coral | missed the accent entirely |

Two of these are worth dwelling on, because they are the ones a careful person
still gets wrong:

**Radius could not be read from the stylesheet.** Framer emits most radii as
DOM `style` attributes, so a sheet-only reading finds almost none and concludes
the theme is square. It is not: counted across the DOM there are 8px ×33
(images, cards), 4px ×40 (buttons), 99/999/100px ×48 (pills, circles), 40px ×6.
The correction had to come from the DOM, and the intermediate reading — "cards
are square, buttons are pills" — was as wrong as the original.

**The theme is not monochrome.** It has a three-colour accent set. Sampling
screenshots of a page whose accent appears on two small badges will report no
accent at all.

### Method for anything still open

Read the value out of `page.html`, not off a picture. The scratchpad carries
the extractors used here (`extract.mjs` parses the CSS keeping `@media`
context; `cls.mjs` dumps every rule for a class across breakpoints). If a
value is not in this document's provenance, it was not in the source, and it
is ours to justify rather than to attribute.

### Resolved: the faces are substituted, on purpose

The source sets display type in **Clash Display** and prose in **Satoshi** —
both Fontshare faces, neither on Google Fonts. **We do not use them.**

Every shop here sells in Slovenian, so č/š/ž appear in ordinary retail words,
and nothing reachable proved those faces carry them; the source is an English
furniture site, so its own rendering is no evidence. A missing glyph does not
error — the browser falls back per character, so one word renders in two
typefaces. Shipping that on a storefront headline is worse than shipping a
face that is 95% as close and certainly correct.

The replacements were picked on measurement, not resemblance — see §1. Both
gates now pass:

- `scripts/verify-fonts.mjs` — every required character is in a served subset
  for all three faces at every weight used.
- The two render-blocking third-party origins are down to one. The Fontshare
  stylesheet is gone, which closes the debt docs/SEO.md §4 recorded.

If the owner obtains Clash Display and Satoshi with confirmed latin-ext
coverage and wants them back, it is a two-line change in `tokens.ts` (the
href and the `--f-*` stacks) plus a re-run of the font gate.

---

## 1. Type system

| Role | Source face | **What we ship** | Weights |
| --- | --- | --- | --- |
| Display (h1–h6) | Clash Display | **Chivo** | 500 |
| Prose | Satoshi | **Plus Jakarta Sans** | 400, 500 |
| Label / eyebrow | DM Sans | **DM Sans** (unchanged) | 500 |

### How the replacements were chosen

Not by eye. The source page carries Framer `metric-override` fallbacks that
describe each real face relative to Arial, so the true proportions are
recoverable: `metric/em = override × size-adjust`. Running that on DM Sans —
the one face of the three we can also download — reproduces its real TTF
metrics to four decimal places, which is what makes the other two trustworthy.

| Face | ascent | descent | line-gap | line box |
| --- | --- | --- | --- | --- |
| **Clash Display** (source) | 0.890 | 0.250 | 0.090 | 1.230 |
| Chivo | 0.940 | 0.250 | 0.000 | 1.190 |
| **Satoshi** (source) | 1.010 | 0.240 | 0.100 | 1.350 |
| Plus Jakarta Sans | 1.038 | 0.222 | 0.000 | 1.260 |

This matters beyond taste: the ramp below is calibrated to the source (92px at
1.04 leading), so a face with a different ascent puts a different amount of ink
in the same line box. Chivo matches Clash Display's descent exactly and its
x-height to three decimals; Plus Jakarta Sans is the closest verified face to
Satoshi's unusually tall ascent.

The line-gap column is a non-issue: every leading in this theme is set
explicitly in em, so `line-gap` — which only affects `line-height: normal` —
never applies.

Specimen with the full ranking and the alternates considered:
<https://claude.ai/code/artifact/1640ac21-c764-4632-9298-89b0749c6006>

### The ramp, exactly

Three tiers, at the source's own breakpoints: **≥1200px**, **810–1199px**,
**≤809px**. Sizes are `desktop / tablet / phone`.

The Face column names the **source** face, kept as provenance; our substitute
takes the same role and the same numbers — Chivo wherever it says Clash
Display, Plus Jakarta Sans wherever it says Satoshi.

| Role | Source face | Size | Weight | Tracking | Leading | Colour |
| --- | --- | --- | --- | --- | --- | --- |
| h1 | Clash Display | 92 / 64 / 44 | 500 | 0em | 1.04em | `#151515` |
| h2 | Clash Display | 60 / 50 / 38 | 500 | 0em | 1.13 / 1.1 / 1.13em | `#151515` |
| h3 | Clash Display | 48 / 38 / 32 | 500 | 0em | 1.16em | `#151515` |
| h4 | Clash Display | 42 / 42 / 28 | 500 | 0.02em | 1.19em | `#000` |
| h5 | Clash Display | 32 / 26 / 24 | 500 | 0.02em | 1.1875em | `#151515` |
| h6 | Clash Display | 24 / 19 / **22** | 500 | 0em | 1.33em | `#151515` |
| lead-xl | Satoshi | 48 / 44 / 24 | 500 | 0.02em | 1.3em | `#151515` |
| lead | Satoshi | 20 / 16 / **18** | 500 | 0.02em | 1.5em | `#151515` |
| body | Satoshi | 16 / 16 / 16 | 400 | 0.02em | 1.625em | `#212121` |
| label (uppercase) | DM Sans | 14 | 500 | 0.06em | 1.71em | `#fff` |
| label (tight) | DM Sans | 14 | 500 | 0.06em | 1.428em | `#fff` |

Two entries go **up** on the phone tier rather than down (h6 19→22, lead
16→18). That is in the source. It is why the port uses literal media queries
rather than clamps: a clamp is monotonic and cannot express it.

**The rule that actually governs the theme:** tracking is positive or zero,
never negative, and the only widely-tracked role is the 14px uppercase label
at 0.06em. Display type is set open and light — 500 weight at 92px — not tight
and heavy. The measured pass had this backwards and that, more than any single
value, is why the earlier build read as a different theme.

---

## 2. Palette

Eleven design tokens plus one hardcoded body ink. Not monochrome.

| Token | Value | Use |
| --- | --- | --- |
| page | `#ffffff` | every light section |
| panel | `#f0f0f0` | product panels, quiet tiles — **one grey, not two** |
| mid | `#a4a4a4` | the grey a cropped product bleeds over; muted ink on dark |
| ink | `#151515` | headings, and the dark band's ground — the same token |
| ink (body) | `#212121` | paragraphs — the one colour the source hardcodes |
| dark rung 2 | `#2e2e2e` | dark-on-dark separation |
| black | `#000` | h4 only |
| line | `#dfdfdf` | hairlines, pill-tag borders |
| muted alpha | `#15151552` | source's muted ink — **fails AA as text, see §2.1** |
| on-dark alphas | `#ffffff52` `#ffffff3d` `#ffffff1f` `#ffffff14` | dividers and hairlines on dark |
| **amber** | `#f0aa13` | the accent |
| **cream** | `#ffdfc4` | accent companion |
| **coral** | `#ff8787` | sale / alert |

### 2.1 Where we deliberately differ, and why

The source was never audited for accessibility. Its muted rungs fail WCAG 2.1
AA as text: `#15151552` is **2.08:1** on white, `#ffffff52` is **2.91:1** on
the dark band, against a 4.5:1 floor. Amber on white is 2.01:1.

These shops sell to Slovenian consumers, so the European Accessibility Act
(2019/882) has applied since 28 June 2025 — AA is a legal floor here, not a
preference. So the palette splits **by job, not by name**:

| Job | Token | Value | Ratio |
| --- | --- | --- | --- |
| muted text on light | `--ink-mute` | `#6d6d6d` | 5.17:1 on white, 4.54:1 on panel |
| muted text on dark | `--on-invert-mute` | `#a4a4a4` | 7.33:1 |
| interactive boundary | `--line-ctrl` | `#949494` | 3.03:1 |
| decoration only | `--ink-mute-decor`, `--line`, on-dark alphas | source values, unchanged | 1.2–2.9:1 |

`--on-invert-mute` is `#a4a4a4`, which **is a source token** — the accessible
choice was already in the theme's own palette. `--ink-mute` at `#6d6d6d` is the
lightest rung clearing 4.5:1 on *both* grounds it appears on, so it keeps the
source's quiet feel without failing on the darker one.

Amber is usable on dark (9.10:1) and as large or decorative elements, never as
body text on white. `scripts/verify-contrast.mjs` reads the real token values
out of `tokens.ts` and fails the build on regression.

---

## 3. Layout constants

| Constant | Desktop ≥1200 | Tablet 810–1199 | Phone ≤809 |
| --- | --- | --- | --- |
| Page gutter | **40px** | 25px | 25px (20px on some devices) |
| Section rhythm (padding block) | **170px** | 100px | 70px |
| Content container | **1440px** | — | — |
| Header padding | 16px 40px | 16px 25px | 8px 25px |
| Header height (derived) | **56px** = 24px line + 2×16px | — | 40px |
| Nav gap / item gap | 50px / 8px | — | — |
| Hero | `height:100vh; min-height:1000px` | `height:600px` | auto, column |

Text measures inside the container: **863px** (the reading column), 620px,
558px, 540px.

Card gap 24px; column gap 40px; the small utility gap is 10px.

### Edges

| Shape | Radius | Where |
| --- | --- | --- |
| Card / image | **8px** | 33 uses — the dominant card shape |
| Button | **4px** | 40 uses — the tightest curve on the page |
| Pill / badge | 99px, 999px, 100px, 50px | 48 uses combined |
| Circle | 100% | icon buttons, avatars, dots |
| Large block | 40px | 6 uses |

### Controls

- **Primary button:** padding `15px 39px`, 4px radius, white fill, label in the
  14px uppercase DM Sans role, ink `#151515`. Compact variant `10px 25px`.
- **Circular nav / carousel button:** **64px** square, `99px` radius, **2px**
  `#151515` ring, no fill. (The earlier build drew these badly undersized.)
- **Pill tag:** 50px radius, 1px `#dfdfdf`, padding `4px 16px` or `6px 20px`.
- **Glass badge over photography:** 100px radius, `#ffffff14` fill,
  1px `#ffffff52` hairline, `backdrop-filter: blur(6px)`. The source's only
  backdrop-filter, used 11 times.
- **Inset hairline:** `position:absolute; inset:16px; 1px solid #fff` — a white
  frame floating inside a dark panel.

### Effects found in the source that the port had not catalogued

- **Button label roll.** The primary button holds two identical label rows in a
  clipped stack; on hover the stack slides so the second replaces the first.
- **Digit odometer.** Ten digit glyphs (0–9) repeated eight times with a
  "Number" wrapper — a rolling counter for the stats band.

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
- Panel grey is `#f0f0f0` (`--bg-alt`), not the `#F2F2F2` measured above.

### Hero images: dark along the top edge — a hard requirement

Separate from the cutouts, and non-negotiable. The header is a **fixed
transparent bar with a white logotype and white nav**, so it is legible only
over a dark ground. The source theme never states this because its own hero
photography happens to satisfy it; ours cannot be left to chance.

So any image placed in a hero panel must read dark across its **top ~90px**
at full width. A light or high-key hero image puts the navigation somewhere
between 2.5:1 and 1.1:1 — unreadable, and a WCAG failure on the most-seen
element of the site.

Two mitigations are already in place, and neither replaces the brief: the bar
carries a top-down scrim so a mistake degrades rather than disappears, and the
placeholder panels ship dark so the default state is correct. If a shop's
hero photography must be light, the theme needs a light-header variant — that
is a code change, not a photo swap, and it has not been built.

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
4. **Accent as punctuation.** FURNEXA is *not* monochrome — the screenshot
   pass got this wrong; it carries amber `#f0aa13` with cream and coral
   companions (§2). But it spends them sparingly, on badges and status, and
   that restraint is the part worth keeping. We substitute the per-shop hue in
   those same few places, so six shops on one baseline still read as different
   companies. The hue is oklch with fixed lightness, which keeps contrast
   roughly hue-independent; `scripts/verify-contrast.mjs` resolves each shop's
   real accent and checks it, because adding a shop is a one-line config
   change nobody thinks of as a design edit.
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
