# Theme Development Guide

> Standard patterns for building production-ready shop themes.
> Modeled directly on the proven `THEMES_GUIDE.md` architecture from
> `simple-site-11a8fbdb` (26 themes in production), combined with two
> industry structures: Shopify OS 2.0's section/composition model and the
> W3C Design Tokens spec's token tiers.

## The three-layer model

| Layer | Owns | Lives in |
| --- | --- | --- |
| **Kernel** | section vocabulary, type scale, palette math | `src/themes/shared/` |
| **Theme** | surfaces, typography voice, edge policy, composition, motion | `src/themes/<key>/` |
| **Shop** | accent hue/chroma, content, keyword, which theme it wears | `src/tenants/<key>.ts` |

DTCG framing: shared = primitive tokens, theme = semantic tokens,
components = consumers. A component never touches a primitive directly.

## File structure (per theme, at chassis stage)

```
src/themes/<key>/
├── types.ts              # Colors interface + factory, FONT constants,
│                         #   <KEY>_TYPE role map, motion presets  ← EXISTS NOW
├── <Key>Template.tsx     # Entry — calls get<Key>Colors() ONCE, sharedProps down
├── <Key>TopBar.tsx
├── <Key>Hero.tsx
├── <Key>Footer.tsx
├── <Key>StickyBuyBar.tsx
└── sections/             # One component per SectionKey it styles specially;
    └── …                 #   kernel defaults render the rest
```

## The rules (ported verbatim where they earned it)

1. **The color factory is called once**, in the template entry. No section
   imports the palette or computes color. Sections accept
   `{ shop, data, colors }`.
2. **No hardcoded hex, no hardcoded font strings** in components — `colors.*`
   properties and exported FONT constants only.
3. **Typography via roles only.** Components use `<KEY>_TYPE.cardTitle`
   etc.; raw size classes are banned (ESLint rule lands with the chassis,
   scoped to `src/themes/**` — the same enforcement the source repo runs).
   Sizes come from the shared 6-rung scale; themes vary weight, tracking,
   family, case — never size.
4. **Composition over pages.** A page is an ordered `SectionKey[]` from the
   theme's catalog preset (shop-overridable, capped at 10). Every theme can
   render every section. This is Shopify's JSON-template insight applied to
   a code-owned theme set.
5. **The theme root carries `overflow-x: clip`** — not `hidden` (which
   creates a scroll container and re-anchors `position: sticky`). Entrance
   reveals translate on X; a translated box counts toward scrollable area
   until the reveal plays. Ported with its war story intact.
6. **Contrast is measured, not assumed.** The palette factory fixes oklch
   lightness rungs per role; the chassis ports `derivePaletteShades` /
   `ensureContrastAcross` so accents are stepped until AA passes on the
   worst surface they sit on — the source repo's hardest-won lesson.
7. **Edge policy is a token** (`catalog.radius`), not a habit: zarja 0px,
   lednik 4px, salon 18px. No per-component improvisation.
8. **Catalog vs registry.** `catalog.ts` (metadata, gating, presets) exists
   from day one; `registry.ts` (lazy component imports — every theme lazy,
   no "most common" exception) arrives with the chassis.

## The launch themes

| | `zarja` | `lednik` | `salon` |
| --- | --- | --- | --- |
| Ground | near-black warm | near-white cold | warm cream |
| Display | Fraunces | Archivo Expanded | Marcellus |
| Edges | sharp 0px | technical 4px | soft 18px |
| Energy | evening ritual | spec sheet | gallery piece |
| Composition | moat high | stats under hero | products first |
| Worn by | savna, fotelj | kad | bazen |

Shops sharing a theme (savna + fotelj on zarja) differ by accent hue,
photography, copy and composition override — the anti-doorway floor holds
at the theme level exactly as it does at the network level.

## Checklist for a new theme

- [ ] `types.ts`: Colors interface + `get<Key>Colors(palette)`, FONT
      constants, complete `<KEY>_TYPE` role map, motion presets
- [ ] Catalog entry: voice, surface, radius, recommendedFor, composition
- [ ] Template calls the factory once; sharedProps down; root `overflow-x-clip`
- [ ] Renders ALL SectionKeys (kernel defaults acceptable)
- [ ] No hardcoded hex / font strings / raw sizes
- [ ] AA measured on both `bg` and `bgAlt` for every ink it introduces
- [ ] Registry entry (lazy), picker thumbnail before it reaches the union

## Influences

- `simple-site-11a8fbdb/THEMES_GUIDE.md` — the architecture this ports
- [Shopify theme architecture](https://shopify.dev/docs/storefronts/themes/architecture) and
  [JSON templates](https://shopify.dev/docs/storefronts/themes/architecture/templates/json-templates) — composition model
- [Design Tokens Format 2025.10](https://www.designtokens.org/tr/drafts/format/) — token tiers
