# FURNEXA — home page section inventory (source of record)

> **What this is.** A device-by-device inventory of the source theme's home
> page, read out of its saved DOM and stylesheet. Nothing here is estimated;
> anything the saved files could not settle is marked UNKNOWN.
>
> It is the build spec for the studio theme's remaining devices. Where it
> disagrees with `STUDIO-BASELINE.md` §4 — the older screenshot-derived
> catalogue — this file wins. §0–§3 of that document (type, palette, layout)
> are transcribed and remain authoritative for values.
>
> Read the `ssr-variant` caveat in §0 before trusting any tablet or phone
> tree: Framer omits the markup for breakpoints whose component tree matches
> another, so several sections have no phone DOM in the capture at all. The
> responsive CSS is still present and is reported.

Source: `body.html` (SSR output of `https://furnexa.framer.website/`, route `augiA20Il`) + `main.css`.
All values below are read verbatim out of `main.css` / inline `style` attributes. Nothing is estimated;
anything not derivable from the saved files is marked **UNKNOWN**.

---

## 0. How to read this document

### Breakpoints

Framer hydration manifest (`data-framer-hydrate-v2` on `#main`) declares two breakpoint sets:

| hash | media query | label used here |
|---|---|---|
| `72rtr7` | `(min-width: 1200px)` | **DESKTOP** (page body) |
| `1opo0ti` | `(min-width: 810px) and (max-width: 1199.98px)` | **TABLET** (page body) |
| `3s9lpd` | `(max-width: 809.98px)` | **PHONE** (page body) |
| `11colz0` / `rodaa6` / `ami1p4` | same three ranges | desktop / tablet / phone for the **layout template** (header + footer) |

In `main.css` the media blocks are written as `@media (min-width:810px) and (max-width:1199.98px)`
and `@media (max-width:809.98px)`. Text presets use a slightly different pair
(`(max-width:1199px) and (min-width:810px)` / `(max-width:809px) and (min-width:0)`) — same ranges.

### `ssr-variant` wrappers — important caveat

Framer only server-renders the DOM for breakpoints whose component tree actually differs, and hides the
others with `ssr-variant hidden-<hash>`:

* `hidden-3s9lpd` → this DOM is used on desktop + tablet
* `hidden-1opo0ti` → this DOM is used on desktop + phone
* `hidden-3s9lpd hidden-1opo0ti` → **desktop only**

Wherever a section (or a card inside it) is wrapped in `hidden-3s9lpd hidden-1opo0ti`, or is wrapped in
`hidden-3s9lpd` and its only child is wrapped in `hidden-1opo0ti`, **the tablet and/or phone markup is not
in this file at all** — it is created by client-side hydration. The responsive CSS for those elements is
still present (Framer reuses the same `framer-*` classes across breakpoints), so the CSS below remains
valid; only the *element tree* for those breakpoints is missing. Each affected section says so explicitly.

### Colour tokens

`body { … }` in `main.css` defines:

| token | value | token | value |
|---|---|---|---|
| `ac2cb3db…` | `#fff` | `d592b987…` | `#a4a4a4` |
| `dbc43ded…` | `#fff0` (transparent) | `9d1c009c…` | `#15151552` |
| `9f142c4b…` | `#ffffff14` | `52cc8d4c…` | `#f0f0f0` |
| `7c291da7…` | `#ffffff1f` | `92b4f9a2…` | `#ffdfc4` |
| `9cfc4458…` | `#000` | `679e60e6…` | `#f0aa13` |
| `55d623d9…` | `#ffffff52` | `74b11ed7…` | `red` |
| `a71cde58…` | `#151515` | `f3aa6a00…` | `#ff8787` |
| `4b4f3c49…` | `#2e2e2e` | `f81cca99…` | `#ffffff3d` |
| `8745f7a4…` | `#dfdfdf` | | |

Note: several inline styles carry a *stale literal fallback* for `4b4f3c49…` (`rgb(77, 77, 77)`). The token
value that actually applies is **`#2e2e2e`**.

### Text presets (decoded, mapped to the class names that appear in the DOM)

| class | role |
|---|---|
| `framer-styles-preset-u70ip4` | **h1** — Clash Display 92/64/44, w500, ls 0em, lh 1.04 |
| `framer-styles-preset-15obh5x` | **h2** — Clash Display 60/50/38, w500, ls 0em, lh 1.13 (tablet lh 1.1) |
| `framer-styles-preset-wlnecr` | **h3** — Clash Display 48/38/32, w500, ls 0em, lh 1.16 |
| `framer-styles-preset-myi81t` | **h4** — Clash Display 42/42/28, w500, ls .02em, lh 1.19, default `#000` |
| `framer-styles-preset-1jcqjrh` | **h5** — Clash Display 32/26/24, w500, ls .02em, lh 1.1875, `#151515` |
| `framer-styles-preset-1iem9v6` | **h6** — Clash Display 24/19/22, w500, ls 0em, lh 1.33 |
| `framer-styles-preset-t4tm0w` | **lead-xl** — Satoshi 48/44/24, w500, ls .02em, lh 1.3 |
| `framer-styles-preset-1kg1ybv` | **lead** — Satoshi 20/16/18, w500, ls .02em, lh 1.5 |
| `framer-styles-preset-1g8qpc6` | **body** — Satoshi 16, w400, ls .02em, lh 1.625, `#212121` |
| `framer-styles-preset-rm92ac` | **eyebrow** — DM Sans 14, w500, ls .06em, lh 1.71, UPPERCASE, default `#fff` |
| `framer-styles-preset-1ks4mtz` | **label** — DM Sans 14, w500, ls .06em, lh 1.428, default `#fff` |

### Page shell

```
body (bg #fff)
└ #main
  └ div.framer-yI0Oz.framer-11colz0            layout template
    ├ div.framer-uhn8e2-container              → HEADER  (fixed)
    ├ div[data-framer-root].framer-WFOVA.framer-72rtr7   → page body (12 children)
    ├ div#overlay                              empty portal
    ├ div.framer-oyrokt                        spacer (w0 h0, flex-grow 1)
    ├ div.framer-znol1l-container              → FOOTER  (order 1002)
    └ div#template-overlay                     empty portal
```

* `.framer-yI0Oz.framer-11colz0` — `display:flex; flex-flow:column; place-content:center flex-start;
  align-items:center; gap:0; width:100%; height:min-content; padding:0; overflow:clip;
  background-color:#fff`, inline `min-height:100vh; width:auto`.
* `.framer-WFOVA.framer-72rtr7` — CSS says `width:1200px` (TABLET `810px`, PHONE `390px`),
  `background-color:#fff; display:flex; flex-flow:column; place-content:center flex-start;
  align-items:center; gap:0; height:min-content; padding:0; overflow:visible`.
  **But its inline style is `min-height:100vh;width:auto;display:contents`** — `display:contents`
  removes the box entirely, so those 1200/810/390 widths never apply and the sections are direct
  full-viewport-width flex children of `.framer-11colz0`. Content width is therefore governed by the
  per-section `max-width` values (1440px in most sections), not by a page wrapper.

---

# RUNNING ORDER

| # | name | element | full-bleed? |
|---|---|---|---|
| 0 | fixed transparent header | `header.framer-14icmbn` | fixed overlay |
| 1 | hero slideshow + promo ticker | `section.framer-1wx9xwy` | yes, 100vh |
| 2 | "Shop by categories" marquee rail | `section.framer-4tttdd` | yes |
| 3 | brand story two-column | `section.framer-e8u622` | 1440 max |
| 4 | best-seller triptych (offer band) | `section.framer-f22jy` | yes, 100vh |
| 5 | "Best Sellers" 3×2 product grid | `section.framer-17j4c8c` | 1440 max |
| 6 | "Why From us" statement + counters | `section.framer-16xa1sd` | 1296 max |
| 7 | "Trusted by Homeowners" testimonial slider | `section.framer-kn1plq` | yes (dark) |
| 8 | "Our Blogs" 3-card grid | `section.framer-15in4s5` | 1440 max |
| 9 | Instagram image ticker + centred CTA | `section.framer-1x5nurb` | yes |
| 10 | Membership banner band | `section.framer-bvbdx9` | yes |
| — | Frameship cart portal (empty) | `div.framer-73m5iz-container.frameship-contents` | — |
| 11 | footer | `footer.framer-1c864k5` | 1440 max |

Total: **10 `<section>` elements** + header + footer = **12 top-level devices**.

---

# 0. Fixed header (nav)

**Element:** `div.framer-uhn8e2-container > ssr-variant(hidden-ami1p4 hidden-rodaa6) > header.framer-4k5Ol.framer-14icmbn.framer-v-14icmbn` `[Primary]`

**Text:** `Home` · `Shop` · `About` · `Blog` · `Contact` — plus a cart badge reading `0`.
Logo is an `<img>` `CWliZtvkmNA0OKHGUIJ8wf9u0Q.svg` 126×18, `alt="main-logo"`, linking to `/`.

**Skeleton**

```
div.framer-uhn8e2-container
└ ssr-variant(hidden-ami1p4 hidden-rodaa6)          ← DESKTOP-only SSR
  └ header.framer-14icmbn [Primary]
    └ div.framer-1k4w2e8 [Container]
      ├ a.framer-1pg9o5k.framer-1iuukm8 [Logo] → /
      │  └ img 126×18 svg
      ├ nav.framer-1ek18g6 [Nav]
      │  └ div.framer-*-container ×5
      │     └ a.framer-9htpxy [Primary]
      │       ├ div.framer-fuq9s2 [Underline]
      │       └ div.framer-1kzuun5 [Nav Link] > p.preset-rm92ac
      └ div.framer-1bycy89 [Socials]
        ├ div.framer-14cbakl [Icon]  > div.framer-167eez0-container > svg
        └ div.framer-1tykj3n [Icon]  > div.framer-1ikeyks-container > cart component (`0`)
```

**Layout (DESKTOP)**

| selector | values |
|---|---|
| `.framer-uhn8e2-container` | `position:fixed; top:0; left:0; width:100%; height:auto; z-index:8; order:-1000; flex:none` |
| `header.framer-14icmbn` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:10px; width:1200px; height:min-content; padding:16px 40px; overflow:visible`; inline `background-color:rgba(0,0,0,0)` (transparent) and `width:100%` |
| `.framer-1k4w2e8` `[Container]` | `display:flex; flex-flow:row; place-content:center space-between; align-items:center; width:100%; max-width:1440px; height:min-content; padding:0` |
| `.framer-1pg9o5k` `[Logo]` | `display:flex; width:126px; height:20px; aspect-ratio:6.3; gap:10px` |
| `.framer-1ek18g6` `[Nav]` | `display:flex; flex-flow:row; place-content:center flex-start; align-items:center; gap:50px; width:min-content` |
| `.framer-9htpxy` (nav item) | `display:flex; flex-flow:row; gap:8px; width:min-content; cursor:pointer` |
| `.framer-fuq9s2` `[Underline]` | `position:absolute; bottom:0; left:0; width:67px; height:1px; z-index:1`; inline `background-color:#fff; transform:scale(0)` — hover → `width:100%`; "current page" variant `framer-v-1y9uncr` → `width:100%; height:3px` |
| `.framer-1bycy89` `[Socials]` | `display:flex; flex-flow:row; gap:10px; width:min-content` |
| `.framer-14cbakl` / `.framer-1tykj3n` `[Icon]` | `display:flex; width:36px; height:36px; aspect-ratio:1; gap:10px`; inline `border:1px solid #ffffff1f; background-color:#ffffff14; border-radius:99px` |

**TABLET / PHONE:** the whole header SSR block is `hidden-ami1p4 hidden-rodaa6` → **desktop-only markup**;
the small-screen header (variants `framer-v-1u4b1yn` / `framer-v-dvij2e`) is hydrated client-side.
Its CSS is present: `header {width:360px; padding:8px 25px}`, logo `100×16`, icons `34×34`, plus two
elements that never appear in the SSR DOM (`.framer-5ht2ii` h34, `.framer-1nmuyum` h20 — the burger).

**Scroll marker:** `div#header-sticky.framer-vfngub` `[Header Sticky Placeholder]` is the **first child of
the page body**, not of the header: `position:absolute; top:80px; left:0; width:100%; height:93px;
overflow:clip; pointer-events:none; z-index:1`. It is an empty scroll-trigger target.

**Columns at desktop:** 3 (logo / 5-item nav / 2 icons).

---

# 1. Hero slideshow + promo ticker  — `section.framer-1wx9xwy` `[Main Banner]`

**Purpose:** full-viewport-height product slideshow with an oversized wordmark, plus a dark promo ticker
pinned to the bottom edge.

**Text (4 unique slides; the wordmark `FURNEXA` repeats on every slide)**

| slide | h1 (fit-text) | lead-xl tagline | label badge | h4 product | CTA | href |
|---|---|---|---|---|---|---|
| First | `FURNEXA` | `Modern Seating for Cozy Relaxation` | `Armchair` | `Modern armchair` | `Shop now` | `/shop/modern-armchair` |
| Second | `FURNEXA` | `Relax with Stylish Modern Seating` | `Bedroom Furniture Sets` | `Luxe Sofa` | `Shop now` | `/shop/luxe-sofa` |
| Third | `FURNEXA` | `Premium Leather` + second line `Elegant modern chair with curved wooden frame` | `Armchairs` | `Ivory Curve` | `Shop now` | `/shop/ivory-curve` |
| Fourth | `FURNEXA` | `Premium Leather` | `Rocking Chairs` | `Minimalist Armchair` | `Shop now` | `/shop/minimalist-armchair` |

(The CTA renders its label three times — `[Placeholder]`, `[Normal]`, `[Hover]` — for the flip animation.)

**Ticker text (5 unique messages, emitted twice → 10 `<li>`):**
`Free Shipping Worldwide` · `50% Off This Week` · `New Arrivals Just Dropped` ·
`Enjoy exclusive deals and discounts.` · `Limited Stock Available`

**Slide images:** backgrounds `12gosR42…jpg`, `tDYbGMr6…jpg`, `lUnWYKcw…jpg`, `Onte4qqA…jpg`
(all 2880×1500, `alt="tv-cabinet-with-white-color-wall-on-wood-flooring3d-rendering"`);
product cut-outs `pn3jVJBb…png` 838×833, `ph5OQMWR…png` 1298×843, `vbagzMd9…png` 912×1120,
`g5X2MbAC…png` 788×994, all `alt="Sofa"`.

**Skeleton**

```
section.framer-1wx9xwy [Main Banner]
├ ssr-variant(hidden-3s9lpd)
│ └ div.framer-6qnre9-container
│   └ ssr-variant(hidden-1opo0ti)                    ← net effect: DESKTOP-ONLY markup
│     └ div.framer-c1uUV.framer-1la7p2p [Primary]
│       └ div.framer-i5i8zp-container
│         └ section (slideshow root, inline flex)
│           ├ div (viewport, perspective:1200px)
│           │ └ ul  (flex COLUMN, gap 0 → vertical slideshow)
│           │   └ li ×16   (4 unique slides, cloned 4× for the loop)
│           │     └ div.framer-ck0xrt-container
│           │       └ div.framer-vg1oz5.framer-v-<slide> [First|Second|Third|Fourth (Active)]
│           │         ├ div.framer-1isryw5 [Container]
│           │         │ ├ svg.framer-7jkhkq [FURNEXA] > foreignObject.framer-fit-text > h1
│           │         │ ├ div.framer-tmd4y0 [Banner Image Wrap]
│           │         │ │ ├ div.framer-pcndwx-container > div.framer-1ribckq [Primary]   ← animated tagline
│           │         │ │ │   ├ div.framer-1b9uud3 > p.preset-1g8qpc6
│           │         │ │ │   └ div.framer-1mo22yy-container > [Circle Border / Line Wrap / Circle Wrap]
│           │         │ │ └ figure.framer-145zrxd [Banner Image] > img (product PNG)
│           │         │ └ div.framer-8p6btg [Bottom Content]
│           │         │   └ div.framer-1g847hu [Content]
│           │         │     ├ div.framer-lgofa3 [Title Content]
│           │         │     │ ├ div.framer-1hvhdv6 [Badge] > div.framer-cup88i > p.preset-1ks4mtz
│           │         │     │ └ div.framer-10zsvv6 > h4.preset-myi81t
│           │         │     └ div.framer-l8dkp6-container > a.framer-jq14zn [Primary CTA]
│           │         └ figure.framer-19vzubf [Banner Slider Background]
│           │           ├ img (2880×1500 room photo)
│           │           └ div.framer-1cmdgyp [Overlay]
│           └ fieldset.framer--slideshow-controls > 2 × button (Previous / Next, display:none here)
└ div.framer-68yii2 [Ticket Main]
  └ div.framer-1m7za3b [Ticker Slider]
    ├ div.framer-1p75zoy [Overlay]
    └ div.framer-55coob > ul > li.ticker-item ×10
      └ div.framer-1ewdluy [Ticker Content]
        ├ div.framer-1egvnp4 [Dot]
        └ div.framer-80zooe > p.preset-rm92ac
```

**Layout**

| selector | DESKTOP | TABLET | PHONE |
|---|---|---|---|
| `section.framer-1wx9xwy` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:0; width:100%; height:min-content; padding:0; position:relative; overflow:hidden` | = | = |
| `.framer-6qnre9-container` | `flex:none; width:100%; height:auto; position:relative` | = | = |
| `.framer-1la7p2p` (component root) | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:10px; width:1920px; height:min-content; padding:0; overflow:visible`; inline `width:100%` | variant `framer-v-616e0d` `width:810px` | variant `framer-v-kdy6l4` `width:390px` |
| `.framer-i5i8zp-container` (slideshow) | `height:calc(var(--framer-viewport-height,100vh) * 1); width:100%; flex:none; position:relative; cursor:default` | = | = |
| `ul` (track) | inline `display:flex; flex-direction:column; gap:0px; width:100%; height:100%; touch-action:pan-x` — **vertical** slideshow | = | = |
| `.framer-vg1oz5` (slide) | `display:flex; flex-flow:row; place-content:center; align-items:center; gap:10px; width:1920px; height:1000px; padding:0 40px; overflow:visible`; active variants add `flex-wrap:wrap`; inline `width:100%;height:100%` | variants `14v7jiz/1updv0i/ca1vgx/v1ky44/pohef6/1m15apx/1ez93fh/1l7z2yt`: `width:810px; height:700px; padding:0 25px; flex-wrap:wrap` | variants `8x52dq/1y09gy5/z0og/1xnrmzh`: `width:390px; height:700px; padding:0 25px` (`8x52dq` also `overflow:hidden`) |
| `.framer-1isryw5` `[Container]` | `z-index:2; display:flex; flex-flow:column; flex:1 0 0; place-content:center space-between; align-items:center; width:1px; max-width:1440px; height:100%; padding:100px 0 120px; overflow:visible` | `padding:60px 0 46px` | `place-content:flex-start flex-end; align-items:flex-start; padding:40px 0 35px` (gap 0) / `60px 0 35px` with gap 20 or 10 depending on slide variant |
| `svg.framer-7jkhkq` `[FURNEXA]` | `white-space:pre; width:100%; height:auto; position:relative`; inline `transform:scale(1.02)`; inner `h1` is fit-text: Clash Display **290px**, w500, lh 1.03em, align left, colour `#fff` | = | `z-index:1; position:absolute; top:26%; left:50%` |
| `.framer-tmd4y0` `[Banner Image Wrap]` | `z-index:1; display:flex; flex-flow:column; gap:10px; width:min-content; position:absolute; bottom:30px; left:74%`. Per slide: `1v786c3` `width:50%;max-width:558px`; `d3gyb` `top:57%;right:0;width:65%;max-width:863px`; `jkv85f` `bottom:-88px;left:50%;width:50%;max-width:620px`; `kvfr0p` `bottom:-5px;right:90px;width:45%;max-width:540px` | `1updv0i` `width:50%;max-width:558px`; `v1ky44` `top:68%;right:0;width:65%;max-width:863px`; `1m15apx` `bottom:-49px;left:50%;width:47%;max-width:620px`; `1l7z2yt` `bottom:-5px;right:90px;width:45%;max-width:540px` | `8x52dq` `position:relative; order:1; width:75%; max-width:558px`; `1y09gy5` `width:80%;max-width:863px`; `z0og` `width:60%;max-width:620px`; `1xnrmzh` `width:70%;max-width:540px` |
| `figure.framer-145zrxd` `[Banner Image]` | `aspect-ratio:1.04299; height:535px; width:558px; overflow:clip` (per-slide: `1.61308`, `.734597` h844, `.773639` h698; active variants use `width:100%`) | h364 / h306 / h486 / h442 | h244 / h168 / h277 / h307 |
| `.framer-8p6btg` `[Bottom Content]` | `display:flex; flex-flow:row; place-content:center flex-start; align-items:center; gap:10px; width:100%; padding:0` | = | `8x52dq`: `order:2` |
| `.framer-1g847hu` `[Content]` | `display:flex; flex-flow:column; flex:1 0 0; gap:24px; width:1px; max-width:375px` (`kvfr0p` → `max-width:475px`) | = | `gap:20px` |
| `.framer-lgofa3` `[Title Content]` | `display:flex; flex-flow:column; gap:12px; width:100%` | = | = |
| `.framer-1hvhdv6` `[Badge]` | `display:flex; flex-flow:row; gap:10px; width:min-content; padding:2px 12px`; inline `border:1px solid #ffffff52; border-radius:100px; background-color:#ffffff14; backdrop-filter:blur(6px)` | = | = |
| `figure.framer-19vzubf` `[Banner Slider Background]` | `position:absolute; top:0; left:0; width:100%; height:100%; z-index:1; overflow:clip` | = | = |
| `.framer-1cmdgyp` `[Overlay]` | `position:absolute; inset 0; width:100%; height:100%`; inline `background-color:#000; opacity:0.4` | = | = |
| `.framer-68yii2` `[Ticket Main]` | `background-color:#151515; z-index:1; display:flex; flex-flow:column; place-content:center; align-items:center; gap:10px; width:100%; height:min-content; padding:24px 40px; position:absolute; bottom:0; left:0` | `position:relative; bottom:unset; left:unset; padding:24px 25px` | same as tablet |
| `.framer-1m7za3b` `[Ticker Slider]` | `display:flex; flex-flow:row; place-content:center space-between; align-items:center; width:100%; padding:0` | = | = |
| `.framer-1p75zoy` `[Overlay]` | `position:absolute; inset 0; width:100%; height:100%; z-index:1; pointer-events:none; background:linear-gradient(90deg, #151515 0%, #fff0 9.72972%, #fff0 89.7298%, #151515 100%)` | = | = |
| `.framer-55coob` | `display:flex; flex-flow:row; flex:1 0 0; place-content:center flex-start; align-items:center; gap:40px; width:1px; height:min-content; overflow:clip` | = | = |
| `.framer-1ewdluy` `[Ticker Content]` | `display:flex; flex-flow:row; gap:40px; width:min-content` | = | = |
| `.framer-1egvnp4` `[Dot]` | `width:8px; height:8px; aspect-ratio:1; border-radius:100%; background-color:#dfdfdf` | = | = |

**Items at desktop:** 1 slide visible (100vh, vertical loop), 16 `<li>` in the DOM (4 unique × 4 clones);
ticker shows the 5 messages twice.

**⚠ Structural surprise:** the entire slideshow is nested `ssr-variant hidden-3s9lpd` → `ssr-variant
hidden-1opo0ti`, i.e. the saved DOM is the **desktop tree only**. Tablet and phone slide markup is not in
the file. The prev/next `<button>`s exist but carry inline `display:none` (the hero is drag/auto only);
the same controls in sections 2 and 7 are `display:block`, 40×40, `border-radius:40px`, transparent
background, `pointer-events:auto`, with `IXHKKqnMuTZDwbE4wNerrGKicA.svg` / `UlGk2xZFO4EWnYDBzoj6ODvx4.svg`
40×40 arrows.

**⚠ Missing CSS:** the rotating-tagline component in `[Banner Image Wrap]`
(`framer-gc70f`, `framer-1ribckq`, `framer-1b9uud3`, `framer-1mo22yy-container`, `framer-1m9lthc`,
`framer-stcf`, `framer-1k55yjq`, `framer-9ljv2c`, `framer-1xo25ev`, `framer-julavl`, plus its "Reverse"
twins `framer-n0ccwk`, `framer-bmpgw8`, `framer-13yxzio`, `framer-19yaanm`, `framer-1kflzx5`,
`framer-hcsc7`, `framer-e50co`, `framer-1um7t9d`, `framer-j4ugry`, `framer-jnuwbw`) has **no rules in
`main.css`** — it injects its own styles at runtime. Layout for those 20 classes: **UNKNOWN**.

---

# 2. "Shop by categories" marquee rail — `section.framer-4tttdd` `[Shop by Categories]`

**Purpose:** category browse rail — an auto-scrolling slideshow of category cards with price ranges.

**Text**

* h2 (centred): `Shop by categories`
* 6 unique cards (h6 + lead price range), cloned 4× → 24 `<li>`:

| # | h6 | price (lead) | href | image |
|---|---|---|---|---|
| 1 | `Living Room` | `$2,099 - $5,099` | `/shop/living` | `VUPkxg6n2KY3NFwhvvPkGlk9Vk.png` 387×251 `alt="Living Roon"` |
| 2 | `Dining` | `$1,099 - $3,099` | `/shop/dining` | `Q3M6oolT8MKfJEKv07HhwozTFo.png` 711×835 |
| 3 | `Office` | `$3,099 - $6,099` | `/shop/office` | `MRctZvHdLVVrCuX0I6ZDkMDwcM.png` 407×392 |
| 4 | `Bedroom` | `$2,099 - $9,099` | `/shop/bedroom` | `mbRW3iLd10xagQwWPjncg1ILY.png` 387×275 |
| 5 | `Lamps` | `$1,099 - $6,099` | `/shop/lamps` | `Y3mXUpi2kqaqR2i5qgUPoCDuU.png` 256×284 `alt="Bedroom"` |
| 6 | `Office` | `$3,099 - $6,099` | `/shop/office` | `MRctZvHdLVVrCuX0I6ZDkMDwcM.png` (duplicate of #3) |

**Skeleton**

```
section.framer-4tttdd [Shop by Categories]
├ div.framer-1ggnq3l [Title Content]
│ └ ssr-variant(hidden-3s9lpd)
│   └ div.framer-s0s6m6 > h2.preset-15obh5x  "Shop by categories"
└ ssr-variant(hidden-3s9lpd hidden-1opo0ti)          ← DESKTOP-ONLY markup
  └ div.framer-efizvn-container
    └ div.framer-mjWOG.framer-1tfcse4 [Primary]
      └ div.framer-153ofod-container
        └ section (slideshow)
          ├ div > ul (flex row, gap 34px)
          │   └ li ×24
          │     └ div.framer-19gsl8j-container
          │       └ a.framer-xu8bfa [Primary] → /shop/<cat>
          │         └ div.framer-1tyhrtq [Image Box]
          │           ├ div.framer-qli57f [Image Wrap] > figure.framer-16ev5n0 [Image] > img
          │           └ div.framer-17yntsh [Content]
          │             ├ div.framer-tou9dt > h6.preset-1iem9v6
          │             └ div.framer-1snsule [Price] > div.framer-10exi6r > p.preset-1kg1ybv
          └ fieldset.framer--slideshow-controls > 2 × button (Previous / Next, visible)
```

**Layout**

| selector | DESKTOP | TABLET | PHONE |
|---|---|---|---|
| `section.framer-4tttdd` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:40px; width:100%; height:min-content; padding:170px 0; position:relative; overflow:hidden` | `padding:100px 0` | `gap:25px; padding:70px 25px` |
| `.framer-1ggnq3l` `[Title Content]` | `display:flex; flex-flow:row; place-content:center; align-items:center; gap:10px; width:100%; padding:0 40px` | `padding:0 25px` | `padding:0` |
| `.framer-s0s6m6` | `flex:1 0 0; width:1px; height:auto`; h2 `text-align:center` | = | = |
| `.framer-efizvn-container` | `flex:none; width:100%; min-width:1920px; height:auto` | `min-width:1400px` | `min-width:unset` |
| `.framer-1tfcse4` (component) | `display:flex; flex-flow:column; place-content:center flex-start; align-items:center; gap:32px; width:1920px; height:min-content; padding:0`; inline `width:100%` | (same base rule) | variant `framer-v-181lp31` `width:350px` |
| `.framer-153ofod-container` (slider) | `aspect-ratio:3.84; height:500px; width:100%` | = | `framer-v-181lp31`: `aspect-ratio:unset; height:500px` |
| slideshow `section` | inline `padding:20px 0 0` | = | = |
| `ul` track | inline `display:flex; flex-direction:row; gap:34px; touch-action:pan-y` | = | = |
| `.framer-19gsl8j-container` | `width:372px; height:auto; position:relative` | = | = |
| `a.framer-xu8bfa` (card) | `display:flex; flex-flow:column; place-content:center flex-start; align-items:center; gap:0; width:372px; height:min-content; padding:0; cursor:pointer` | = | variant `framer-v-1c70oxt` `cursor:unset` |
| `.framer-1tyhrtq` `[Image Box]` | `display:flex; flex-flow:column; gap:22px; width:100%; height:min-content; padding:34px 50px; overflow:hidden`; inline `border:1px solid #dfdfdf; border-radius:8px; background-color:#fff` | = | `framer-v-1c70oxt`: `gap:10px; padding:30px 25px` |
| `.framer-qli57f` `[Image Wrap]` | `display:flex; flex-flow:column; gap:0; width:95%; height:min-content` | = | = |
| `figure.framer-16ev5n0` `[Image]` | `aspect-ratio:1; height:258px; width:100%` | = | `framer-v-1c70oxt`: `aspect-ratio:unset; height:305px` |
| `.framer-17yntsh` `[Content]` | `display:flex; flex-flow:column; place-content:flex-start; align-items:flex-start; gap:8px; width:100%` | = | = |
| `.framer-1snsule` `[Price]` | `display:flex; flex-flow:wrap; place-content:center flex-start; align-items:center; gap:10px; width:100%` | = | = |
| controls `fieldset` | inline `position:absolute; inset:0; display:flex; justify-content:space-between; align-items:center; pointer-events:none`; buttons `40×40; border-radius:40px; background:transparent; pointer-events:auto` | = | = |

**Items at desktop:** 372px card + 34px gap = **406px pitch**; at the rail's `min-width:1920px` that is
**≈4.7 cards visible**; 6 unique cards, 24 in the DOM.

**⚠ Structural surprise:** the rail markup is `hidden-3s9lpd hidden-1opo0ti` → **desktop-only SSR**. Also,
category #6 is a byte-for-byte duplicate of #3 (`Office`), so the "6-up" rail really only shows 5 distinct
categories.

---

# 3. Brand story, two-column — `section.framer-e8u622` `[Story]`

**Purpose:** editorial/brand block — animated word-by-word headline + "Our Story" link, then a
two-column image/copy composition.

**Text**

* h2 (split into 16 `<span>` words for a stagger animation):
  `Find pieces designed to transform your home one room, one moment, one feeling at a time.`
* Link button: `Our Story` → `/about-us`
* Body paragraph (`#2e2e2e`):
  `Enhance your indoor and outdoor spaces with our timeless, century-old solid oak beam furniture. Designed to withstand the test of time, our pieces will enrich your daily life now and for generations to come.`
* Image caption pair: `Modern Living` (lead) / `Clean, sculptural sofas and lounge pieces` (body)
* Right-column eyebrow (centred, `#151515`): `HIGH QUALITY AND LONG LASTING`
* Images: `JWU7Q53NdQAG1RLQjvKuIB6rTs.jpg` 464×518 `alt="Modern Living"`;
  `C6NHkVhcBgD6lXU95yKmMDXtI.jpg` 826×850 `alt="HIGH QUALITY AND LONG LASTING"`

**Skeleton**

```
section.framer-e8u622 [Story]
├ div.framer-1fkhc1b [Top Content]
│ └ div.framer-qsz4ab [Container]
│   └ ssr-variant(hidden-3s9lpd)
│     └ div.framer-b2r2xa [Title Content]
│       ├ div.framer-euq67t > h2.preset-15obh5x > span ×16
│       └ div.framer-va5vm9-container > a.framer-q57p86 [Primary]
│           ├ div.framer-pa6b9p > p.preset-rm92ac  "Our Story"
│           └ div.framer-1o3bxgq [Icon] > svg
└ div.framer-ujrw9x [Bottom Content]
  └ div.framer-5883up [Container Fluid]
    ├ div.framer-vkch11 [Column]           ← LEFT
    │ └ div.framer-ir9u8j [Content]
    │   ├ ssr-variant(hidden-3s9lpd) > div.framer-zwsazp [Paragraph] > div.framer-1g3cvam > p.preset-1kg1ybv
    │   └ div.framer-1tjrhmt [Product]
    │     ├ ssr-variant(hidden-3s9lpd hidden-1opo0ti) > figure.framer-2wncvh [Image]
    │     │   ├ img 464×518
    │     │   └ div.framer-nlspp8.hidden-3s9lpd [Image Overlap]
    │     └ ssr-variant(hidden-3s9lpd) > div.framer-1g11hca [Content]
    │         ├ div.framer-10kefcg > p.preset-1kg1ybv  "Modern Living"
    │         └ div.framer-1h4ve0i > p.preset-1g8qpc6  "Clean, sculptural sofas…"
    └ div.framer-1jsk3qw [Column]          ← RIGHT
      └ div.framer-1lreiq2 [Inner Content]
        ├ ssr-variant(hidden-3s9lpd) > div.framer-1etvwph > p.preset-rm92ac
        └ ssr-variant(hidden-3s9lpd hidden-1opo0ti) > figure.framer-1p7k6mr [Image]
            ├ img 826×850
            ├ div.framer-1c5gsf8 [Cut]
            └ div.framer-vre6ln.hidden-3s9lpd [Image Overlap]
```

**Layout**

| selector | DESKTOP | TABLET | PHONE |
|---|---|---|---|
| `section.framer-e8u622` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:64px; width:100%; height:min-content; padding:0 40px 170px; overflow:visible` | `padding:0 25px 100px` | `padding:0 25px 70px` |
| `.framer-1fkhc1b` / `.framer-ujrw9x` | `display:flex; flex-flow:row; place-content:center; align-items:center; gap:10px; width:100%; padding:0` | = | = |
| `.framer-qsz4ab` `[Container]` | `display:flex; flex-flow:column; flex:1 0 0; place-content:flex-start; align-items:flex-start; gap:64px; width:1px; max-width:1440px` | = | = |
| `.framer-b2r2xa` `[Title Content]` | `display:flex; flex-flow:column; gap:48px; width:100%; max-width:1015px` | = | `gap:25px` |
| `a.framer-q57p86` (Our Story) | `display:flex; flex-flow:row; gap:8px; width:min-content; padding:0 18px 0 0; cursor:pointer`; icon `.framer-1o3bxgq` `position:absolute; top:50%; right:0` → hover `top:7px; right:-10px` | = | = |
| `.framer-5883up` `[Container Fluid]` | `display:flex; flex-flow:row; flex:1 0 0; place-content:flex-start; align-items:flex-start; gap:0; width:1px` | = | `flex-direction:column; gap:25px` |
| `.framer-vkch11` `[Column]` (left) | `display:flex; flex-flow:column; flex:1 0 0; place-content:flex-end flex-start; align-items:flex-end; gap:215px; width:1px` | = | `flex:none; order:1; width:100%` |
| `.framer-ir9u8j` `[Content]` | `display:flex; flex-flow:column; place-content:flex-start center; align-items:flex-start; gap:10px; width:100%; max-width:720px` | = | `gap:40px` |
| `.framer-zwsazp` `[Paragraph]` | `display:flex; flex-flow:row; gap:10px; width:100%; padding:48px 0` | = | `padding:0` |
| `.framer-1g3cvam` (copy) | `flex:1 0 0; width:1px; max-width:464px; height:auto` | = | = |
| `.framer-1tjrhmt` `[Product]` | `display:flex; flex-flow:row; place-content:flex-end flex-start; align-items:flex-end; gap:24px; width:100%` | = | = |
| `figure.framer-2wncvh` | `aspect-ratio:.895753; height:399px; flex:2 0 0; width:1px` | `height:199px; flex:1 0 0` | `height:177px; flex:1 0 0` |
| `.framer-nlspp8` `[Image Overlap]` | `background-color:#fff; position:absolute; top:-3.13283%; left:-3.14005%; width:106%; height:106%; z-index —` (reveal mask; `hidden-3s9lpd`) | = | not rendered |
| `.framer-1g11hca` `[Content]` | `display:flex; flex-flow:column; flex:1 0 0; gap:8px; width:1px` | = | = |
| `.framer-1jsk3qw` `[Column]` (right) | `display:flex; flex-flow:column; flex:1 0 0; place-content:flex-end flex-start; align-items:flex-end; gap:24px; width:1px` | = | `flex:none; order:0; gap:20px; width:100%` |
| `.framer-1lreiq2` `[Inner Content]` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:24px; width:91%; height:min-content; overflow:clip` | = | `gap:20px; width:100%` |
| `figure.framer-1p7k6mr` | `aspect-ratio:.971765; height:524px; width:100%` | `height:356px` | `height:349px` |
| `.framer-1c5gsf8` `[Cut]` | `position:absolute; top:0; left:0; width:100px; height:60px; aspect-ratio:1.66667; background:linear-gradient(150deg, #fff 48%, #fff0 50%)` — a diagonal corner notch | = | `width:70px; height:42px; top:-1px; left:-1px` |
| `.framer-vre6ln` `[Image Overlap]` | same as `.framer-nlspp8` | = | not rendered |

**Columns at desktop:** 2 (equal `flex:1 0 0`); on phone they stack with the **right column first**
(`order:0` vs `order:1`).

**⚠ Structural surprise:** the phone stacking inverts the visual order — the big "HIGH QUALITY AND LONG
LASTING" image column comes first on phone. Both `<figure>` blocks are `hidden-3s9lpd hidden-1opo0ti`
(desktop-only SSR).

---

# 4. Best-seller triptych / offer band — `section.framer-f22jy` `[Best Seller]`

**Purpose:** a full-height, three-panel promo band — two clickable product panels flanking a dark
"50% Off" offer panel.

**Text**

* Left panel: h5 `Terra Chair`, price lead `$99`, struck compare price body `$149.00` → `/shop/terra-chair`
* Centre panel: eyebrow badge `Limited-Time Offer`, h2 `50% Off`, lead `Select Best Sellers`,
  CTA `Shop Deals` → `/shop`
* Right panel: h5 `Dining Chair`, price lead `$99.00`, struck compare price body `$129.00` → `/shop/dining-chair`
* Images: `JR0MexShsTDtoc8LTHgHoEkNGE.jpg` 948×1489 `alt="Illuminati"` (used twice, at 10% opacity),
  `6wgwNU51K1c5IPykiflpVNLEr0.png` 1167×1299 `alt="Chair"`,
  `SbcxYVsIX4lZoQMeQLrGM4ZArNA.jpg` 960×1500 `alt="Mordern Plastic"`

**Skeleton**

```
ssr-variant(hidden-3s9lpd)                            ← desktop + tablet only
└ section.framer-f22jy [Best Seller]
  ├ div.framer-19kzobf [Background]
  ├ a.framer-1w0qjej.framer-lux5qc [Column] → /shop/terra-chair
  │ ├ div.framer-1684tw1 [Image Wrap] > figure.framer-m852ng [Image] > img
  │ ├ div.framer-16m7pmf [Content]
  │ │ ├ div.framer-17j2dxk > h5.preset-1jcqjrh
  │ │ └ div.framer-1jlhbnl [Price]
  │ │   ├ div.framer-jmkzaf > p.preset-1kg1ybv
  │ │   └ div.framer-f3mhzt [Marked Price]
  │ │     ├ div.framer-x1ae2v [Linethrough]
  │ │     └ div.framer-a6c3pq > p.preset-1g8qpc6
  │ └ figure.framer-1en9z2t [Image] > img (product cut-out)
  ├ div.framer-1ft74nj [Column]
  │ ├ div.framer-1pixgky [Image Wrap] > figure.framer-1egksh9 [Image] > img
  │ └ div.framer-jf9tqt [Content]
  │   ├ div.framer-urylt [ Badge] > div.framer-ujgy2x > p.preset-rm92ac
  │   └ div.framer-1oh7be0 [Main Content]
  │     ├ div.framer-z5amb4 [Title Content]
  │     │ ├ div.framer-216uum > h2.preset-15obh5x  "50% Off"
  │     │ └ div.framer-finvmd > p.preset-1kg1ybv   "Select Best Sellers"
  │     └ div.framer-5lbnc4-container > a.framer-jq14zn [Primary CTA]  "Shop Deals"
  └ a.framer-l0oeur.framer-lux5qc [Column] → /shop/dining-chair
    ├ figure.framer-rbl0ux [Image] > img
    └ div.framer-3m24va [Content]  (h5 + Price, same shape as left)
```

**Layout**

| selector | DESKTOP | TABLET | PHONE |
|---|---|---|---|
| `section.framer-f22jy` | `display:flex; flex-flow:row; place-content:center flex-start; align-items:center; gap:0; width:100%; height:100vh; min-height:1000px; padding:0; overflow:visible` | `height:600px; min-height:unset` | `height:min-content; min-height:unset; flex-direction:column` |
| `.framer-19kzobf` `[Background]` | `background-color:#151515; position:absolute; top:0%; left:0%; width:100%; height:100%; display:flex` | = | `order:3` |
| `a.framer-1w0qjej` (left panel) | `background-color:#dfdfdf; z-index:1; display:flex; flex-flow:column; flex:1 0 0; place-content:center flex-start; align-items:center; gap:0; width:1px; height:100%` | = | `flex:none; order:0; width:100%; height:500px` |
| `.framer-1684tw1` `[Image Wrap]` | `position:absolute; top:0; left:0; width:100%; height:100%; display:flex; overflow:hidden` | = | = |
| `figure.framer-m852ng` | `aspect-ratio:.64; height:925px; width:148%; opacity:.1; position:absolute; top:0; left:0` | `height:625px` | `height:902px` |
| `.framer-16m7pmf` `[Content]` | `z-index:2; display:flex; flex-flow:column; gap:16px; width:100%; padding:70px 40px 0` | `padding:50px 20px 0` | `gap:10px; padding:35px 20px 0` |
| `.framer-1jlhbnl` / `.framer-1n0hoxc` `[Price]` | `display:flex; flex-flow:row; place-content:center flex-start; align-items:center; gap:12px; width:min-content` | = | = |
| `.framer-f3mhzt` `[Marked Price]` | `display:flex; flex-flow:row; gap:10px; width:min-content` | = | = |
| `.framer-x1ae2v` `[Linethrough]` | `background-color:#2e2e2e; height:1px; width:100%; position:absolute; top:calc(50% - .5px); left:0; z-index:1; overflow:clip` | = | = |
| `figure.framer-1en9z2t` (left cut-out) | `aspect-ratio:.766467; height:579px; width:111%; z-index:1; position:absolute; bottom:-58px; left:0` | `height:391px` | `height:346px; width:68%; bottom:0; left:50%; transform:translate(-50%)` |
| `.framer-1ft74nj` (centre panel) | `z-index:1; display:flex; flex-flow:column; flex:1 0 0; place-content:center; align-items:center; gap:0; width:1px; height:100%` | = | `flex:none; order:1; width:100%; height:300px` |
| `figure.framer-1egksh9` | `opacity:.1; width:190%; height:100%; position:absolute; top:0; left:-190px` | = | `width:100%; left:0` |
| `.framer-jf9tqt` `[Content]` | `display:flex; flex-flow:column; gap:24px; width:100%; padding:0 40px` | `padding:0 20px` | `padding:0 20px` |
| `.framer-urylt` `[ Badge]` | `display:flex; flex-flow:row; gap:10px; width:min-content; padding:4px 16px; border:1px solid #dfdfdf; border-radius:50px` | = | = |
| `.framer-1oh7be0` `[Main Content]` | `display:flex; flex-flow:column; gap:40px; width:100%` | = | `gap:24px` |
| `.framer-z5amb4` `[Title Content]` | `display:flex; flex-flow:column; gap:1px; width:100%` | = | = |
| `a.framer-l0oeur` (right panel) | `display:flex; flex-flow:column; flex:1 0 0; place-content:center flex-end; align-items:center; gap:0; width:1px; height:100%` | = | `aspect-ratio:.78; height:500px; flex:none; order:2; width:100%` |
| `figure.framer-rbl0ux` | `z-index:1; position:absolute; top:0; left:0; width:100%; height:100%` | = | = |
| `.framer-3m24va` `[Content]` | `z-index:1; display:flex; flex-flow:column; gap:16px; width:100%; padding:0 40px 40px` | `padding:0 20px 40px` | `gap:10px; padding:0 20px 25px` |

**Columns at desktop:** 3 equal panels (`flex:1 0 0` each), full-viewport-height (min 1000px).

**⚠ Structural surprise:** the whole `<section>` sits inside `ssr-variant hidden-3s9lpd` and there is **no
phone sibling anywhere in the file** — the phone tree is hydrated client-side. The phone CSS nevertheless
exists and describes a 4-row vertical stack: left panel (500px) → centre panel (300px) → right panel
(500px) → background (`order:3`).

---

# 5. "Best Sellers" product grid — `section.framer-17j4c8c` `[Shop]`

**Purpose:** the actual shop grid — 6 product cards laid out as a hairline-ruled 3×2 grid.

**Text**

* h3: `Best Sellers`
* Cards (h6 / price / compare price / stock badge — the last is Frameship-driven and starts `opacity:0`):

| # | h6 | price | compare | stock | href | image |
|---|---|---|---|---|---|---|
| 1 | `Modern armchair` | `$2,099` | `3,399$` | `10 in stock` | `/shop/modern-armchair` | `7WYkV7IFYMHq5S4VLeW7fVFbyhM.jpg` 2000×2000 |
| 2 | `King size bed` | `$1,199` | `1,500$` | `10 in stock` | `/shop/king-size-bed` | `ar1MviHtTYSqZwxrHwb5N5yudbo.jpg` |
| 3 | `Cozy table` | `$699` | — | `10 in stock` | `/shop/cozy-table` | `ESWSPZVVwi8MWgNk9sLai2hcM.jpg` |
| 4 | `Cupboard` | `$299` | — | `10 in stock` | `/shop/cupboard` | `yD0xvCBcnqvsSqH52k4UgL5tXwo.jpg` |
| 5 | `Hanger` | `$99` | — | `10 in stock` | `/shop/hanger` | `KVY6Z4449Nqt1OlKCwPPh0d9Ofs.jpg` |
| 6 | `Luna Nightstand` | `$99` | — | `10 in stock` | `/shop/luna-nightstand` | `OXrN60veG6MzkQAk4WkbJV7iWck.jpg` |

**Skeleton**

```
section.framer-17j4c8c [Shop]
└ div.framer-1ks1o3z [Container]
  ├ div.framer-esjzh0 [Section Title] > div.framer-1b3y5ty > h3.preset-wlnecr  "Best Sellers"
  └ ssr-variant(hidden-3s9lpd)
    └ div.framer-1o5dfxp                      ← CSS GRID
      └ a.framer-8n9iaq.framer-lux5qc ×6 → /shop/<slug>
        └ ssr-variant(hidden-1opo0ti)         ← desktop + phone card markup only
          └ div.framer-1tu05m0-container
            └ div.framer-POmzL.framer-lpgltt [Primary]
              ├ div.framer-1kjsmi4 [Border Overlay]
              ├ div.framer-cke63t [Main Content]
              │ ├ div.framer-163dvyr [Image Wrap] > figure.framer-1s1s2cr [Image] > img
              │ └ div.framer-1er3sbc [Content]
              │   ├ div.framer-rm8ewt > h6.preset-1iem9v6
              │   └ div.framer-sd208v [Price]
              │     ├ div.framer-em9y8p-container  (Satoshi 20 w500 #151515)
              │     └ div.framer-1guwuq4-container (DM Sans 14 w500 #2e2e2e, text-decoration:line-through)
              └ div.framer-1nbbse-container  ("10 in stock", inline opacity:0)
```

**Layout**

| selector | DESKTOP | TABLET | PHONE |
|---|---|---|---|
| `section.framer-17j4c8c` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:10px; width:100%; height:min-content; padding:170px 40px; overflow:visible` | `padding:100px 25px` | `padding:70px 25px` |
| `.framer-1ks1o3z` `[Container]` | `display:flex; flex-flow:column; place-content:center flex-start; align-items:center; gap:40px; width:100%; max-width:1440px; padding:0` | = | `gap:25px` |
| `.framer-esjzh0` `[Section Title]` | `display:flex; flex-flow:row; place-content:flex-end space-between; align-items:flex-end; width:100%; padding:0` (only one child today) | = | = |
| **`.framer-1o5dfxp` (grid)** | `display:grid; grid-template-columns:repeat(3, minmax(50px,1fr)); grid-auto-rows:minmax(0,1fr); justify-content:start; gap:0; width:100%; height:min-content; padding:1px` | (no override — still 3 columns) | `display:flex; flex-flow:column; place-content:flex-start center; align-items:flex-start` → 1 column |
| `a.framer-8n9iaq` | `display:flex; flex-flow:row; place-content:center flex-start; place-self:start; align-items:center; gap:10px; width:100%; padding:0` | = | `align-self:unset` |
| `.framer-1tu05m0-container` | `flex:1 0 0; width:1px; height:auto` | = | = |
| `.framer-lpgltt` (card) | `display:flex; flex-flow:row; place-content:flex-start; align-items:flex-start; gap:10px; width:480px; height:min-content; padding:var(--ddm5pd)`; inline `--ddm5pd:32px; background-color:#fff; width:100%; box-shadow:0 0 0 1px #dfdfdf; border-right:1px solid #fff0; border-bottom:1px solid #fff0` | variant `framer-v-1ayo9zi`: `padding:25px; cursor:unset` | = |
| `.framer-1kjsmi4` `[Border Overlay]` | `position:absolute; top:0; left:0; width:100%; height:100%; z-index:2; pointer-events:none`; inline `border:1px solid #000; opacity:0` → on hover `top:-1px; right:1px; left:unset` | = | = |
| `.framer-cke63t` `[Main Content]` | `display:flex; flex-flow:column; flex:1 0 0; gap:24px; width:1px` | `framer-v-1ayo9zi`: `gap:16px` | = |
| `.framer-163dvyr` `[Image Wrap]` | `aspect-ratio:.832; height:240px; width:100%; display:flex; overflow:hidden` | `framer-v-1ayo9zi`: `aspect-ratio:1.3871; height:144px` | = |
| `figure.framer-1s1s2cr` | `aspect-ratio:1.02932; height:194px; width:100%` | = | = |
| `.framer-1er3sbc` `[Content]` | `display:flex; flex-flow:column; gap:8px; width:100%` | `framer-v-1ayo9zi`: `gap:2px` | = |
| `.framer-sd208v` `[Price]` | `display:flex; flex-flow:row; gap:10px; width:min-content; overflow:clip` | = | = |
| `.framer-1nbbse-container` | `position:absolute; top:0; right:0; z-index:1; width:auto; height:auto` | = | = |

**Items at desktop:** **3 columns × 2 rows = 6 cards.** The hairline grid effect comes from
`gap:0` + `padding:1px` on the grid plus each card's `box-shadow:0 0 0 1px #dfdfdf` (rings overlap).

**⚠ Structural surprise:** each card body is wrapped in `ssr-variant hidden-1opo0ti`, so the **tablet card
variant (`framer-v-1ayo9zi`) is not in the file**; the grid itself stays 3-up at tablet. The "10 in stock"
badge is present but `opacity:0` in the initial render (hover-revealed).

---

# 6. "Why From us" statement + counters — `section.framer-16xa1sd` `[Why From Us]`

**Purpose:** brand-value statement typeset as a wrapping lead-xl paragraph with four inline circular icons
interleaved, followed by three animated stat counters.

**Text**

* Badge (eyebrow, `#151515`): `Why From us`
* Statement, in reading order (each fragment is its own element; ● = 64px circular icon):

  `Experience timeless design,` ● `exceptional comfort, and` `premium` ● `craftsmanship crafted`
  `to elevate every home` `and workspace. Each` ● `piece is thoughtfully` `designed to blend beauty` ●

  (data-framer-name on every fragment repeats the full source string:
  `Experience timeless design, exceptional comfort, and premium craftsmanship crafted to elevate every home and workspace. Each piece is thoughtfully designed to blend beauty`)
* Counter 1 suffix `+`, label `Completed projects delivered with premium quality`
* Counter 2 suffix `k` (h2) + `+`, label `Happy customers trusting our modern designs`
* Counter 3 suffix `%`, label `Client satisfaction achieved through exceptional service`

**Counter values: UNKNOWN.** Each digit is a `framer-sj9jzb` roller containing all ten digits 0–9 stacked
in a 68px-tall clipped column; the displayed digit is chosen by a component variant. SSR renders
counter 1 as `[Primary, "8", "9"]`, counter 2 as `[Primary, Primary]`, counter 3 as `[Primary, "8", "9"]`.
The base variant `framer-v-sj9jzb` is named "Primary" and its digit is not recoverable from the saved
files (the page's component JS chunk is not in `Furnexa - Luxury Furniture Store_files`).

**Skeleton**

```
section.framer-16xa1sd [Why From Us]
└ div.framer-ndzvmu [Container]
  ├ div.framer-yt2d36 [Top Content]                       ← BOTH children carry hidden-3s9lpd
  │ ├ ssr-variant(hidden-3s9lpd) > div.framer-1jqvouq [Badge] > div.framer-1sgsl1l > p.preset-rm92ac
  │ └ div.framer-p2kogq.hidden-3s9lpd [Title Content]
  │   ├ div.framer-1y8dtxs   > p.preset-t4tm0w > span×3   "Experience timeless design,"
  │   ├ div.framer-hped79 [Icon] > svg
  │   ├ div.framer-bl0pv5    > p.preset-t4tm0w > span×3   "exceptional comfort, and"
  │   ├ div.framer-1fyu16c   > p.preset-t4tm0w > span     "premium"
  │   ├ div.framer-d6nd21 [Icon] > svg
  │   ├ div.framer-b0v78t    > p.preset-t4tm0w > span×2   "craftsmanship crafted"
  │   ├ div.framer-1ekr23g   > p.preset-t4tm0w > span×4   "to elevate every home"
  │   ├ div.framer-smdkav    > p.preset-t4tm0w > span×3   "and workspace. Each"
  │   ├ div.framer-7nfr8n [Icon] > svg
  │   ├ div.framer-sxokq6    > p.preset-t4tm0w > span×3   "piece is thoughtfully"
  │   ├ div.framer-q82ugo    > p.preset-t4tm0w > span×4   "designed to blend beauty"
  │   └ div.framer-34mp6c [Icon] > svg
  └ div.framer-1h2c9ql [Bottom Content]
    └ ssr-variant(hidden-3s9lpd) ×3
      └ div.framer-zpg72g | .framer-1nemqx8 | .framer-viwwsv  [Column]
        ├ div.framer-qqiegg [Counter Main]
        │ ├ div.framer-1dc4dzf [Counter]  → N × div.framer-*-container > div.framer-sj9jzb > div.framer-1igcl6t > 10 digit divs
        │ │   (counter 2 also contains div.framer-13pfcdq > h2.preset-15obh5x  "k")
        │ └ div.framer-1ceu65a | .framer-m8m9ke | .framer-1jdlej9 > p.preset-1kg1ybv   "+" | "+" | "%"
        └ div.framer-1jjlfaa | .framer-ql5wh0 | .framer-jjrm2a > p.preset-1g8qpc6 (centred label)
```

**Layout**

| selector | DESKTOP | TABLET | PHONE |
|---|---|---|---|
| `section.framer-16xa1sd` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:10px; width:100%; height:min-content; padding:0 40px 170px; overflow:visible` | `padding:0 25px 100px` | `padding:0 25px 70px` |
| `.framer-ndzvmu` `[Container]` | `display:flex; flex-flow:column; place-content:center flex-start; align-items:center; gap:100px; width:100%; max-width:1296px; padding:0` | = | `gap:40px` |
| `.framer-yt2d36` `[Top Content]` | `display:flex; flex-flow:column; gap:32px; width:100%` | = | `gap:20px` |
| `.framer-1jqvouq` `[Badge]` | `display:flex; flex-flow:row; gap:10px; width:min-content; padding:6px 20px; border:1px solid #dfdfdf; border-radius:50px` | = | = |
| `.framer-p2kogq` `[Title Content]` | `display:flex; flex-flow:wrap; place-content:center; align-items:center; gap:0 14px; width:100%` | = | **not rendered** (`hidden-3s9lpd`) |
| `.framer-hped79` + 3 siblings `[Icon]` | `width:64px; height:64px; aspect-ratio:1; border:2px solid #151515; border-radius:99px; display:flex; place-content:center; gap:10px` | = | — |
| `.framer-1h2c9ql` `[Bottom Content]` | `display:flex; flex-flow:row; place-content:center space-between; align-items:center; width:100%; padding:0` | = | `flex-direction:column; justify-content:flex-start; gap:40px` |
| `.framer-zpg72g` / `.framer-1nemqx8` / `.framer-viwwsv` `[Column]` | `display:flex; flex-flow:column; flex:1 0 0; place-content:center flex-start; align-items:center; gap:12px; width:1px; max-width:225px` | = | `flex:none; gap:6px; width:100%` |
| `.framer-qqiegg` `[Counter Main]` | `display:flex; flex-flow:row; place-content:flex-start center; align-items:flex-start; gap:0; width:100%` | = | = |
| `.framer-1dc4dzf` `[Counter]` | `display:flex; flex-flow:row; gap:0; width:min-content; height:min-content; overflow:clip` | = | = |
| `.framer-sj9jzb` (digit roller) | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:0; width:min-content; height:68px; overflow:clip` | = | = |
| `.framer-1igcl6t` `[Number]` | `display:flex; flex-flow:column; flex:1 0 0; place-content:center flex-start; align-items:center; gap:10px; width:min-content; height:1px` — digit variants switch to `justify-content:flex-end` | = | = |

**Columns at desktop:** 3 counter columns; the statement is a single wrapping flex row (`flex-flow:wrap`).

**⚠ Structural surprise:** the ENTIRE top block (badge + statement) is `hidden-3s9lpd` with **no phone
replacement in the file** — on phone this section renders only the three counters unless the hydrated tree
supplies something else. Counter digit targets are not determinable (see above).

---

# 7. "Trusted by Homeowners" testimonial slider — `section.framer-kn1plq` `[Trusted]`

**Purpose:** dark full-bleed social-proof band with a one-up draggable testimonial carousel.

**Text**

* h2 (centred, `#fff`): `Trusted by Homeowners`
* 4 unique testimonials (lead quote, `#fff`; eyebrow name, `#fff`), cloned 4× → 16 slides:

| # | quote | name | avatar | product PNG |
|---|---|---|---|---|
| 1 | `Our workspace finally feels organized and inspiring. The desk and chair set are sturdy, elegant, and incredibly comfortable for long hours. Highly recommended.` | `Emily K.` | `gdIpPnoNeLlRcXnNClLNRPgaM.jpg` 342×367 `alt="Emily"` | `BCwgFVdUpIV2E0Vatzz8nc1YY.png` 237×238 |
| 2 | `Beautifully designed furniture that feels premium and comfortable. Our living room looks refined and welcoming now. The quality truly exceeded expectations.` | `Daniel R.` | `0lSifXWECafBhhk5HGPHlNBmyn8.jpg` | `zLzZoIdw513G3H4l41CTjNMySJo.png` |
| 3 | `Furnexa pieces transformed our home office completely. Thoughtful design, great comfort, and smooth delivery made the entire experience feel effortless.”` (note the stray closing `”`) | `Sophia M.` | `W1j20H0E8XacKvhqCcv267uj0.jpg` | `53j6ZmS6dKC7ONgoMmrCA82fWkM.png` |
| 4 | `Stylish, comfortable, and timeless furniture. Furnexa helped us create a warm, modern home without compromising on quality or functionality.` | `Alex T.` | `5WuceO7Q9d9H6u5bcUOpOx9Zk.jpg` | `neO1jIOuqtpcbXKNikJlvBiE.png` |

**Skeleton**

```
section.framer-kn1plq [Trusted]
├ ssr-variant(hidden-3s9lpd) > div.framer-1g7jz4i [Background]
├ ssr-variant(hidden-3s9lpd) > figure.framer-14kwb1u [Image] > img (2761×3905, alt="Illuminati")
└ div.framer-8dz110 [Container]
  ├ ssr-variant(hidden-3s9lpd) > div.framer-429h6a > h2.preset-15obh5x
  └ ssr-variant(hidden-3s9lpd hidden-1opo0ti)            ← DESKTOP-ONLY markup
    └ div.framer-9ng3om-container
      └ div.framer-OTIYT.framer-17qo4ux [Primary]
        └ div.framer-1xizrsa-container
          └ section (slideshow)
            ├ div > ul (flex row, gap 40px) > li ×16
            │   └ div.framer-1yv6x5w-container
            │     └ div.framer-pahvk.framer-b83ili [Primary]
            │       ├ div.framer-1y19tb5 [Testimonial Content]
            │       │ ├ figure.framer-1ickboc [Avatar]  (inline filter:grayscale(1))
            │       │ └ div.framer-16ih033 [Testimonial Main]
            │       │   └ div.framer-1ykl1ga [Content]
            │       │     ├ div.framer-1nlkyfs [Main Content]
            │       │     │ ├ div.framer-1ae5drb [“] > svg
            │       │     │ └ div.framer-1nj9rjw > p.preset-1kg1ybv
            │       │     └ div.framer-15isalw > p.preset-rm92ac  (name)
            │       └ div.framer-enyj9j [Testimonial Image] > figure.framer-12o9j0r [Image] > img
            └ fieldset.framer--slideshow-controls > 2 × button (visible)
```

**Layout**

| selector | DESKTOP | TABLET | PHONE |
|---|---|---|---|
| `section.framer-kn1plq` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:0; width:100%; height:min-content; padding:172px 40px; overflow:visible` | `padding:100px 25px 40px` | `padding:70px 25px` |
| `.framer-1g7jz4i` `[Background]` | `background-color:#151515; position:absolute; top:0%; left:0%; width:100%; height:100%; display:flex` | = | not rendered |
| `figure.framer-14kwb1u` | `position:absolute; top:0; left:0; width:100%; height:100%; opacity:.1; mix-blend-mode:difference; z-index:0` | = | not rendered |
| `.framer-8dz110` `[Container]` | `display:flex; flex-flow:column; place-content:center flex-start; align-items:center; gap:80px; width:100%; max-width:1440px; padding:0` | = | `gap:25px` |
| `.framer-9ng3om-container` | `flex:none; width:100%; height:auto` | `height:317px` | = |
| `.framer-17qo4ux` (component) | `display:flex; flex-flow:row; place-content:center; align-items:center; gap:10px; width:1440px; height:400px; padding:0`; inline `width:100%` | (base) | variant `framer-v-1nccd0e` `width:350px; height:min-content` |
| `.framer-1xizrsa-container` | `flex:1 0 0; width:1px; height:100%` | = | `framer-v-1nccd0e`: `height:540px` |
| `ul` track | inline `display:flex; flex-direction:row; gap:40px; touch-action:pan-y` | = | = |
| `.framer-1yv6x5w-container` | `width:1440px; height:auto` → **one testimonial per view** | = | = |
| `.framer-b83ili` (slide) | `display:flex; flex-flow:row; place-content:center flex-start; align-items:center; gap:146px; width:1440px`; second desktop variant `framer-v-1j61cby` `gap:0; width:982px` | `framer-v-3aihnh` `gap:40px; width:760px`; `framer-v-1cesdiy` `gap:0; width:760px` | `framer-v-40ln9i` `flex-direction:column; gap:40px; width:340px`; `framer-v-1t0jhec` `flex-direction:column; gap:0; width:340px` |
| `.framer-1y19tb5` `[Testimonial Content]` | `display:flex; flex-flow:row; flex:1 0 0; gap:146px; width:1px` | `3aihnh` `gap:40px`; `1j61cby/1cesdiy` `gap:64px` | `40ln9i` `flex-direction:column; flex:none; align-items:flex-start; gap:40px; width:100%`; `1t0jhec` same with `gap:24px` |
| `figure.framer-1ickboc` `[Avatar]` | `aspect-ratio:.93188; height:341px; flex:.52 0 0; width:1px`; inline `filter:grayscale(1)` | `3aihnh` `height:190px`; `1j61cby` `342×367`; `1cesdiy` `250×268` | `40ln9i` `177×190`; `1t0jhec` `250×268; max-width:100%` |
| `.framer-16ih033` `[Testimonial Main]` | `display:flex; flex-flow:row; flex:1 0 0; place-content:center flex-end; align-items:center; gap:10px; width:1px` | = | `40ln9i/1t0jhec` `flex:none; width:100%` |
| `.framer-1ykl1ga` `[Content]` | `display:flex; flex-flow:column; flex:2 0 0; gap:48px; width:1px; max-width:586px` | `3aihnh` `gap:24px`; `1j61cby/1cesdiy` `max-width:unset; gap:32px; padding:0 0 30px` | `40ln9i` `gap:24px`; `1t0jhec` `max-width:unset; gap:20px` |
| `.framer-1nlkyfs` `[Main Content]` | `display:flex; flex-flow:column; gap:24px; width:100%` | = | = |
| `.framer-1ae5drb` `[“]` | `width:30px; height:26px` | = | = |
| `.framer-enyj9j` `[Testimonial Image]` | `width:220px; height:220px; aspect-ratio:1; display:flex; overflow:clip`; inline `background-color:#2e2e2e; border-radius:999px` | `3aihnh` `160×160` | = |
| `figure.framer-12o9j0r` | `aspect-ratio:1.09701; height:132px; width:145px` | `3aihnh` `height:100px; width:69%` | = |

**Items at desktop:** 1 testimonial per view; 4 unique, 16 slides in the DOM.

**⚠ Structural surprise:** background + backdrop image are `hidden-3s9lpd` (absent on phone) and the slider
itself is `hidden-3s9lpd hidden-1opo0ti` → **desktop-only SSR**. So on phone this "dark band" has no dark
background element in the saved markup at all.

---

# 8. "Our Blogs" 3-card grid — `section.framer-15in4s5` `[Blog]`

**Purpose:** three editorial teaser cards, each a full-bleed photo with a gradient scrim, a pill category
badge and an h6 title.

**Text**

* h2 (centred): `Our Blogs`

| # | badge (label) | h6 | href | image |
|---|---|---|---|---|
| 1 | `Furniture Guides` | `Design styling tips` | `/blog/design-styling-tips` | `9xlxJqdiptu0ibWgBnCBFvBWU.jpg` 1920×1439 `alt="Lilac Flower"` |
| 2 | `Office Design` | `Office setup ideas` | `/blog/office-setup-ideas` | `zuZZtzi2Jz1lV3dQdKGqe4Es93E.jpg` |
| 3 | `Living Spaces` | `Home décor inspiration` | `/blog/home-d%C3%A9cor-inspiration` | `JnVqt4etePQMlPRrNvstFyDjpg.jpg` |

**Skeleton**

```
section.framer-15in4s5 [Blog]
└ div.framer-19nuvu9 [Container]
  ├ ssr-variant(hidden-3s9lpd) > div.framer-1i8irpx > h2.preset-15obh5x  "Our Blogs"
  └ div.framer-1awetjf                        ← CSS GRID
    └ ssr-variant(hidden-3s9lpd) ×3
      └ a.framer-crqym6.framer-lux5qc → /blog/<slug>
        └ ssr-variant(hidden-1opo0ti)         ← desktop + phone card markup only
          └ div.framer-kgpiii-container
            └ div.framer-BQS7g.framer-3f4mjl [Primary]
              ├ figure.framer-thxjnh [Background]
              │ ├ img
              │ └ div.framer-6hh0cz [Overlay]
              └ div.framer-o9qye6 [Blog Content]
                ├ div.framer-piy5un [Badge] > div.framer-v2jk0g > p.preset-1ks4mtz
                └ div.framer-1hboz2v > h6.preset-1iem9v6
```

**Layout**

| selector | DESKTOP | TABLET | PHONE |
|---|---|---|---|
| `section.framer-15in4s5` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:10px; width:100%; height:min-content; padding:170px 40px; overflow:visible` | `padding:100px 25px` | `padding:70px 25px` |
| `.framer-19nuvu9` `[Container]` | `display:flex; flex-flow:column; place-content:center flex-start; align-items:center; gap:40px; width:100%; max-width:1440px; padding:0` | = | `gap:25px` |
| **`.framer-1awetjf` (grid)** | `display:grid; grid-template-columns:repeat(3, minmax(50px,1fr)); grid-auto-rows:minmax(0,1fr); justify-content:center; gap:20px 24px; width:100%; padding:0` | (no override — 3 columns) | `display:flex; flex-flow:column; align-items:flex-start; gap:25px 24px` → 1 column |
| `a.framer-crqym6` | `display:flex; flex-flow:row; place-content:center flex-start; place-self:start; align-items:center; gap:10px; width:100%` | = | `align-self:unset` |
| `.framer-kgpiii-container` | `flex:1 0 0; width:1px; height:auto` | = | = |
| `.framer-3f4mjl` (card) | `display:flex; flex-flow:column; place-content:center flex-end; align-items:center; gap:0; width:464px; height:min-content; min-height:500px; padding:0; overflow:hidden; cursor:pointer`; inline `width:100%; border-radius:8px` | variant `framer-v-gvxy5u` `height:320px; min-height:unset` | variant `framer-v-zhjk4` `height:360px; min-height:unset` |
| `figure.framer-thxjnh` `[Background]` | `position:absolute; top:0; left:0; width:100%; height:500px; z-index:1; overflow:clip` | = | = |
| `.framer-6hh0cz` `[Overlay]` | `position:absolute; top:0; left:0; width:100%; height:100%; overflow:clip`; inline `background:linear-gradient(180deg, #fff0 30%, #151515 100%); opacity:0.8` | = | = |
| `.framer-o9qye6` `[Blog Content]` | `z-index:1; display:flex; flex-flow:column; place-content:flex-start; align-items:flex-start; gap:16px; width:100%; padding:32px` | `framer-v-gvxy5u`: `padding:25px` | `framer-v-zhjk4`: `gap:8px; padding:25px 25px 20px` |
| `.framer-piy5un` `[Badge]` | `display:flex; flex-flow:row; gap:10px; width:min-content; padding:3px 12px`; inline `border:1px solid #ffffff1f; background-color:#ffffff3d; border-radius:50px; backdrop-filter:blur(6px)` | = | = |

**Items at desktop:** **3 columns × 1 row.**

**⚠ Note:** card #1's `data-framer-name` on the badge is `Trends`, but the rendered text is
`Furniture Guides`. Each card body is `hidden-1opo0ti` → tablet card markup absent from the file.

---

# 9. Instagram ticker + centred CTA — `section.framer-1x5nurb` `[Instagram]`

**Purpose:** full-bleed social image marquee with a dark CTA card floating in the middle of the strip.

**Text**

* Eyebrow-style lead (centred): `Follow @furnexa_home`
* CTA card: h3 (centred, `#fff`) `Transform your space today`; button `Shop Deals` → `/shop`
* Images (4, `alt="Instagram"`): `15nds7uthB92H5D9rKpWdfL0zE.jpg` 546×553,
  `y4BKKZ3kA2Qky5LeG80Hjwkyfl8.jpg` 544×448, `wb5nh8qQibR2sJqMdI5M66it2U.jpg` 726×922,
  `n3AilrWaI2ic14mrenrEdzNtAc.jpg` 364×300

**Skeleton**

```
section.framer-1x5nurb [Instagram]
└ div.framer-n3ddc1 [Container Fluid]
  ├ div.framer-1uribur [Title Content]
  │ └ ssr-variant(hidden-3s9lpd) > div.framer-r0x13r > p.preset-1kg1ybv
  └ div.framer-rlfkqi [Ticker Wrap]
    ├ div.framer-1hshzzz [CTA Wrap]                      ← absolutely centred over the ticker
    │ └ ssr-variant(hidden-3s9lpd)
    │   └ div.framer-54feum [CTA]
    │     ├ div.framer-17rc1ja [Overlay]                 (inset white hairline)
    │     └ div.framer-13klopz [Content]
    │       ├ div.framer-10jyab9 > h3.preset-wlnecr
    │       └ div.framer-1403kyh-container > a.framer-jq14zn [Primary CTA]  "Shop Deals"
    └ div.framer-19ns2d9 > ul > li.ticker-item ×4
      └ div.framer-4629ri [Image Wrap]
        ├ ssr-variant(hidden-3s9lpd) > figure.framer-19ixv19 [Image] > img
        └ div.framer-qu7lbh.hidden-3s9lpd [Image Overlap]
```

**Layout**

| selector | DESKTOP | TABLET | PHONE |
|---|---|---|---|
| `section.framer-1x5nurb` | `display:flex; flex-flow:column; place-content:flex-start; align-items:flex-start; gap:10px; width:100%; height:min-content; padding:0 0 170px; overflow:visible` | `padding:0 0 100px` | `padding:0 0 70px` |
| `.framer-n3ddc1` `[Container Fluid]` | `display:flex; flex-flow:column; place-content:flex-start; align-items:flex-start; gap:24px; width:100%; padding:0` | = | `gap:16px` |
| `.framer-1uribur` `[Title Content]` | `display:flex; flex-flow:row; place-content:center; align-items:center; gap:10px; width:100%; padding:0` | = | = |
| `.framer-r0x13r` | `flex:1 0 0; width:1px; height:auto`; text `text-align:center` | = | = |
| `.framer-rlfkqi` `[Ticker Wrap]` | `display:flex; flex-flow:row; place-content:center; align-items:center; gap:10px; width:100%; height:min-content; overflow:clip` | = | = |
| `.framer-1hshzzz` `[CTA Wrap]` | `background-color:#fff; z-index:1; display:flex; place-content:center; align-items:center; gap:10px; width:min-content; height:100%; padding:0 24px; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%)` | = | `transform:unset; width:55%; padding:0 14px; top:0%; left:22.5%` |
| `.framer-54feum` `[CTA]` | `border:1px solid #151515; background-color:#151515; z-index:1; display:flex; flex-flow:column; place-content:center; align-items:center; gap:0; width:366px; height:min-content; min-height:100%; padding:0; overflow:hidden` | = | `width:100%` |
| `.framer-17rc1ja` `[Overlay]` | `border:1px solid #fff; position:absolute; inset:16px; z-index:1` | = | = |
| `.framer-13klopz` `[Content]` | `z-index:2; display:flex; flex-flow:column; place-content:center flex-start; align-items:center; gap:32px; width:100%; padding:20px` | = | `gap:12px; padding:25px` |
| `.framer-19ns2d9` (track) | `display:flex; flex-flow:row; place-content:center flex-start; align-items:center; flex:1 0 0; gap:24px; width:1px; height:min-content; overflow:clip` | = | = |
| `.framer-4629ri` `[Image Wrap]` | `display:flex; flex-flow:row; gap:0; width:min-content` | = | = |
| `figure.framer-19ixv19` | `aspect-ratio:.99187; height:369px; width:366px` | = | `height:182px; width:180px` |
| `.framer-qu7lbh` `[Image Overlap]` | `background-color:#fff; position:absolute; top:-2.16722%; left:-2.73224%; width:105%; height:104%; z-index:1` (reveal mask) | = | not rendered |

**Items at desktop:** 4 source images at 366px + 24px gap; the ticker component clones them at runtime.
The CTA card is **not** part of the ticker flow — it is an absolutely-centred 366px overlay, so it looks
like a fifth tile but is a separate layer.

---

# 10. Membership banner band — `section.framer-bvbdx9` `[Membership]`

**Purpose:** closing full-bleed photographic band with a darkened overlay, inset hairline frame and a
single centred CTA.

**Text**

* h2 (centred, `#fff`): `Membership`
* body (centred, `#fff`, `opacity:.8`):
  `Unlock savings made just for you with exclusive perks, early access, and member-only offers.`
* CTA: `Join Now` → `/contact-us`
* Image: `Qb5n1jVrJBMVRD4RyelU1AE.jpg` 1920×1228 `alt="Membership Banner"`

**Skeleton**

```
ssr-variant(hidden-3s9lpd)                     ← desktop + tablet only
└ section.framer-bvbdx9 [Membership]
  ├ figure.framer-1jor3l8 [Background]
  │ ├ img 1920×1228
  │ └ div.framer-1b4h4ph [Overlay]
  │   └ div.framer-13mmtb6 [Border]
  └ div.framer-1wnvr3v [Container]
    ├ div.framer-1yog1ep [Title Content]
    │ ├ div.framer-1jr6xon > h2.preset-15obh5x
    │ └ div.framer-7cmc5j > p.preset-1g8qpc6
    └ div.framer-ke0w4j-container > a.framer-jq14zn [Primary CTA]  "Join Now"
```

**Layout**

| selector | DESKTOP | TABLET | PHONE |
|---|---|---|---|
| `section.framer-bvbdx9` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:0; width:100%; height:min-content; min-height:500px; padding:0; overflow:hidden` | = | `min-height:400px` |
| `figure.framer-1jor3l8` `[Background]` | `z-index:1; position:absolute; top:0; left:0%; width:100%; height:100%` | = | = |
| `.framer-1b4h4ph` `[Overlay]` | `background-color:#000; opacity:.6; position:absolute; top:0; left:0; width:100%; height:100%; padding:23px; display:flex; overflow:clip` | = | `padding:14px` |
| `.framer-13mmtb6` `[Border]` | `border:1px solid #fff; opacity:.6; z-index:1; width:100%; height:100%; position:relative` | = | = |
| `.framer-1wnvr3v` `[Container]` | `z-index:1; display:flex; flex-flow:column; place-content:center flex-start; align-items:center; gap:32px; width:100%; max-width:418px; padding:0` | = | `gap:24px; padding:0 25px` |
| `.framer-1yog1ep` `[Title Content]` | `display:flex; flex-flow:column; gap:16px; width:100%` | = | `gap:8px` |

**Columns at desktop:** 1 centred column (max 418px) over a full-bleed image.

**⚠ Structural surprise:** like §4, the whole `<section>` sits in `ssr-variant hidden-3s9lpd` and **no phone
markup exists in the file**.

---

# — Frameship cart portal (not a section)

Immediately after §10, the page body's last child is:

```
div.framer-73m5iz-container.frameship-contents
└ div.framer-QocbP.framer-1byl4ta.frameship-contents
  └ div.framer-1ikeyks-container.frameship-contents
    └ div.framer-1tykj3n.frameship-contents
      └ div.framer-1bycy89.frameship-contents
        └ div.framer-1k4w2e8.frameship-contents
          └ div.framer-14icmbn.frameship-contents
            └ ssr-variant(hidden-ami1p4 hidden-rodaa6 frameship-contents)
              └ div.framer-uhn8e2-container.frameship-contents
                └ div.framer-yI0Oz.framer-11colz0.frameship-contents   (EMPTY)
```

This is an **empty portal placeholder emitted by the Frameship e-commerce plugin** — a chain of divs that
re-echoes the header cart button's ancestor class names with `frameship-contents` appended and terminates
in an empty node. It renders nothing and should not be treated as a section. `div#overlay` and
`div#template-overlay` are likewise empty portal hosts; `div.framer-oyrokt` is a `width:0;height:0;
flex-grow:1; background:0 0` spacer that pushes the footer down when the page is short.

---

# 11. Footer — `footer.framer-1c864k5` `[Primary]`

**Purpose:** dark closing block — logo + newsletter, then contact / three link columns, then copyright +
socials.

**Text**

* Newsletter heading (lead, `#fff`): `Newsletter`; input placeholder `Your email address`
* Blurb (body, `#fff`): `Premium furniture designed for modern living and inspired workspaces.`
* Contact list: `support@furnexa.com` (`mailto: support@furnexa.com`), `+1 (800) 452-8392`
  (`tel: +1 (800) 452-8392`), `214 Westwood Avenue,` `<br>` `California, USA`
* Column heading `Links`: `Home` `/`, `Shop` `/shop`, `About Us` `/about-us`, `Blog` `/blog`, `FAQ` `/faq`
* Column heading `Categories`: `Living Room` `/shop/living`, `Bedroom` `/shop/bedroom`,
  `Office` `/shop/office`, `Dining` `/shop/dining`, `Lamps` `/shop/lamps`
* Column heading `Support`: `Shipping Information` `/legal/shipping`,
  `Return & Refund Policy` `/legal/refund-policy`, `Privacy Policy` `/legal/privacy-policy`,
  `Terms & Conditions` `/legal/terms`, `Contact` `/contact-us`
* Copyright (body, `#fff`, `opacity:.8`): `© 2026 Furnexa. All rights reserved.`
* Socials: `https://facebook.com/`, `https://instagram.com/`, `https://twitter.com/` (icon-only)

**Skeleton**

```
div.framer-znol1l-container
└ ssr-variant(hidden-ami1p4 hidden-rodaa6)            ← DESKTOP-only SSR
  └ footer.framer-NA1gi.framer-1c864k5 [Primary]      (inline background-color:#151515; width:100%)
    └ div.framer-1amsdw6 [Container]
      ├ div.framer-13b8l1r [Top Content]
      │ ├ a.framer-1lkhjxq.framer-165tkuy [Logo] → /  > img (same 126×18 svg, scaled up)
      │ └ div.framer-f4cl51 [Newsletter]
      │   ├ div.framer-n51c68 > p.preset-1kg1ybv  "Newsletter"
      │   └ form.framer-1izmjho
      │     ├ label.framer-lnohxy > div.framer-1jkta9q > input[type=email name=Email]
      │     ├ div.framer-o9cg9r-container > button.framer-tvltfd [Default] (submit arrow)
      │     └ input[type=text] ×11  (honeypots: website, company, message, subject, title,
      │                              description, feedback, notes, details, remarks, comments)
      ├ div.framer-1s05mcu [Bottom Content]
      │ ├ div.framer-1iif8om [Left Content]
      │ │ ├ div.framer-1c2qx4u > p.preset-1g8qpc6
      │ │ └ div.framer-fzgepx [Contact List]
      │ │   └ a/div.framer-* [Contact Item] ×3
      │ │     ├ div.framer-* [Icon] > svg
      │ │     └ div.framer-* > p.preset-1g8qpc6
      │ └ div.framer-atclft [Right Content]
      │   └ div.framer-1plmaci | .framer-5i91cf | .framer-14fpc4p [Links List] ×3
      │     ├ div.framer-rgj2jz | .framer-vlpjgg | .framer-ji7hm [Links] > p.preset-1kg1ybv
      │     └ ul.framer-1atf39q | .framer-1m4e9zc | .framer-1hxekzo [Links Lists]
      │       └ li.framer-*-container ×5
      │         └ a.framer-1787ao4 [Primary]
      │           ├ div.framer-xptfia > p.preset-1g8qpc6
      │           └ div.framer-1lt4zmq [Underline]
      └ div.framer-nm28bk [Copyright Content]
        ├ div.framer-lnogvf > p.preset-1g8qpc6
        └ div.framer-1s5ibxb [Social Lists] > a.framer-* [Social Item] ×3 > svg
```

**Layout** (breakpoint variants are component variants, not media queries: `framer-v-4zuhwf` = tablet,
`framer-v-x6ihmi` = phone)

| selector | DESKTOP | TABLET (`4zuhwf`) | PHONE (`x6ihmi`) |
|---|---|---|---|
| `.framer-znol1l-container` | `flex:none; order:1002; width:100%; height:auto; position:relative` | = | = |
| `footer.framer-1c864k5` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:10px; width:1200px; height:min-content; padding:140px 40px 30px; overflow:hidden`; inline `background-color:#151515; width:100%` | `width:810px; padding:100px 25px 30px` | `width:390px; padding:70px 25px 25px` |
| `.framer-1amsdw6` `[Container]` | `display:flex; flex-flow:column; place-content:flex-start; align-items:flex-start; gap:80px; width:100%; max-width:1440px; padding:0` | = | `gap:40px` |
| `.framer-13b8l1r` `[Top Content]` | `display:flex; flex-flow:row; place-content:center space-between; align-items:center; width:100%; padding:0` | = | `flex-direction:column; justify-content:flex-start; gap:25px` |
| `a.framer-1lkhjxq` `[Logo]` | `display:flex; width:454px; height:85px; aspect-ratio:5.34118; gap:10px` | `width:370px; height:69px` | `width:100%; height:37px` |
| `.framer-f4cl51` `[Newsletter]` | `display:flex; flex-flow:column; flex:1 0 0; gap:8px; width:1px; max-width:350px` | = | `flex:none; width:100%` |
| `form.framer-1izmjho` | `display:flex; flex-flow:column; gap:0; width:100%; overflow:hidden` | = | = |
| `.framer-1jkta9q` (input) | `--framer-input-focused-border-color:#fff; --framer-input-focused-border-width:0 0 1px 0; --framer-input-font-family:"Inter"; --framer-input-font-size:16px; --framer-input-font-weight:400; --framer-input-font-letter-spacing:.02em; --framer-input-font-line-height:1.625em; --framer-input-padding:12px 0 12px 0; width:100%` | = | = |
| `.framer-o9cg9r-container` (submit) | `position:absolute; top:50%; right:0; z-index:1; width:auto; height:auto` | = | = |
| `.framer-1s05mcu` `[Bottom Content]` | `display:flex; flex-flow:row; place-content:flex-start space-between; align-items:flex-start; width:100%; padding:0` | `flex-direction:column; justify-content:flex-start; gap:40px` | same as tablet |
| `.framer-1iif8om` `[Left Content]` | `display:flex; flex-flow:column; flex:1 0 0; gap:32px; width:1px; max-width:311px` | `flex:none; width:100%` | `max-width:unset; flex:none; gap:20px; width:100%` |
| `.framer-fzgepx` `[Contact List]` | `display:flex; flex-flow:column; gap:16px; width:100%` | = | = |
| `[Contact Item]` (`.framer-lbw9jo` etc.) | `display:flex; flex-flow:row; place-content:center flex-start; align-items:center; gap:12px; width:min-content` | = | = |
| `[Icon]` (`.framer-11m23tu` etc.) | `width:36px; height:36px; aspect-ratio:1; display:flex; overflow:clip` | = | `width:30px` |
| **`.framer-atclft` `[Right Content]`** | `display:flex; flex-flow:row; place-content:flex-start space-between; align-items:flex-start; flex:1 0 0; width:1px; max-width:756px` | `flex:none; width:100%` | **`display:grid; grid-template-columns:repeat(2, minmax(50px,1fr)); grid-template-rows:repeat(2, minmax(0,1fr)); grid-auto-rows:minmax(0,1fr); justify-content:center; gap:40px 10px; width:100%`** |
| `[Links List]` (`.framer-1plmaci` etc.) | `display:flex; flex-flow:column; flex:1 0 0; gap:24px; width:1px` | = | `flex:none; place-self:start; gap:20px; width:100%` |
| `ul [Links Lists]` (`.framer-1atf39q` etc.) | `display:flex; flex-flow:column; gap:24px; width:100%; margin:0; padding:0; list-style:none` | = | `gap:14px` |
| `a.framer-1787ao4` | `display:flex; flex-flow:row; gap:10px; width:min-content; cursor:pointer` | = | = |
| `.framer-nm28bk` `[Copyright Content]` | `display:flex; flex-flow:row; place-content:center space-between; align-items:center; width:100%; padding:30px 0 0`; inline `border-top:1px solid rgba(255,255,255,0.12)` (literal, not a token) | = | `flex-direction:column; place-content:flex-start; align-items:flex-start; gap:14px` |
| `.framer-1s5ibxb` `[Social Lists]` | `display:flex; flex-flow:row; gap:12px; width:min-content` | = | = |

**Columns at desktop:** top row 2 (logo / newsletter); middle row 1 + 3 (contact block + three link
columns); bottom row 2 (copyright / socials). On phone the three link columns become a **2×2 grid**
(3 filled cells).

**⚠ Structural surprise:** the newsletter `<form>` carries **11 hidden honeypot text inputs**
(`website, company, message, subject, title, description, feedback, notes, details, remarks, comments`)
in addition to the real `Email` field. Also, the footer SSR block is `hidden-ami1p4 hidden-rodaa6` →
desktop-only markup, same as the header.

---

# Appendix A — shared "Primary" CTA button (`framer-em0x6` / `framer-jq14zn`)

Used in §1 (Shop now), §4 (Shop Deals), §9 (Shop Deals), §10 (Join Now). Renders its label three times
(`[Placeholder]` invisible sizer, `[Normal]`, `[Hover]`) for a 3-D flip.

| selector | values |
|---|---|
| `a.framer-jq14zn` | `display:flex; flex-flow:column; place-content:center; align-items:center; gap:0; width:min-content; height:min-content; padding:0; cursor:pointer; overflow:visible`; inline `border-radius:4px` |
| `.framer-ilr2xn` `[Placeholder]` | `display:flex; flex-flow:row; gap:10px; width:min-content; padding:15px 39px; pointer-events:none` (compact variant `framer-v-1y6r331`: `padding:10px 25px 12px`) |
| `.framer-1fqn3zb` `[Button Wrap]` | `position:absolute; top:0; left:0; z-index:1; display:flex; flex-flow:column; gap:0; width:min-content; height:100%`; on hover `top:unset; bottom:0; justify-content:flex-end` |
| `.framer-1tmsc04` `[Normal]` | `display:flex; flex-flow:row; gap:10px; padding:15px 39px; z-index:1`; inline `border:1px solid #fff; background-color:#fff; border-radius:4px; transform-origin:50% 100%` |
| `.framer-u4e85` `[Hover]` | same box; inline `border:1px solid #fff; background-color:#fff0; border-radius:4px; transform:rotateX(90deg); transform-origin:50% 0%` |

Text link variant (`framer-yQnUm` / `framer-q57p86`, "Our Story"): `display:flex; flex-flow:row; gap:8px;
width:min-content; padding:0 18px 0 0`; the arrow `.framer-1o3bxgq` is `position:absolute; top:50%;
right:0` → hover `top:7px; right:-10px`.

# Appendix B — known gaps / UNKNOWN values

1. **Tablet & phone DOM for §1, §2, §4, §7, §10** and for the individual cards in §5 and §8, and for the
   header and footer, is not in the saved file (Framer `ssr-variant` elision). All responsive **CSS** for
   those elements is present and is reported above; only the element trees are missing.
2. **20 classes have no CSS in `main.css`** — all belong to the hero's animated-tagline sub-component:
   `framer-gc70f, framer-1ribckq, framer-1b9uud3, framer-1mo22yy-container, framer-1m9lthc, framer-stcf,
   framer-1k55yjq, framer-9ljv2c, framer-1xo25ev, framer-julavl, framer-n0ccwk, framer-bmpgw8,
   framer-13yxzio, framer-19yaanm, framer-1kflzx5, framer-hcsc7, framer-e50co, framer-1um7t9d,
   framer-j4ugry, framer-jnuwbw`. Their layout is **UNKNOWN**.
3. **§6 counter target numbers are UNKNOWN** (digit rollers; the component JS is not among the saved
   assets). SSR variants observed: counter 1 `[Primary, 8, 9]`, counter 2 `[Primary, Primary]` + `k`,
   counter 3 `[Primary, 8, 9]`.
4. Prices/stock in §5 are rendered by Frameship components with runtime-inlined typography (no
   `framer-*` classes); the exact values captured above are the SSR snapshot, not static content.
