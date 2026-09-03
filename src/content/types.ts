import type { GuidePage, Page } from "./pages";

/**
 * Shop storefront content — everything the SSR renderer needs beyond
 * ShopConfig. Per shop, hand-written Slovenian; NEVER templated across
 * shops (the anti-doorway rule: shared code, zero shared copy).
 *
 * ⚠️ Reviews are PLACEHOLDER copy until real verified orders exist. They
 * render on the page as design content, but the renderer deliberately emits
 * NO Review/AggregateRating structured data — fabricated review schema is a
 * manual-action magnet and this network's whole strategy is SEO.
 */

/**
 * The drawings a card can ask for.
 *
 * Trimmed to what the one remaining shop sells when the network narrowed to
 * masazni-bazen.si — the sauna, plunge tub, chair, bath and billiard keys went
 * with their shops. "swimspa" is not a variant of "pool": a 5.8 m shell drawn
 * as a 2 m square is the same error as a photograph of the wrong model, and
 * the two sit side by side in the category rail where the difference is the
 * only thing the row is trying to say.
 *
 * "none" is the honest key for a family with no drawing. Without it a shop
 * whose product is neither of these had to claim "pool" to satisfy the type,
 * and a square hot tub standing in for whatever it sells is exactly the
 * wrong picture the paragraph above warns about. It renders the neutral
 * panel — the same thing product-art.ts returns null for.
 */
export type ArtKey = "pool" | "swimspa" | "none";

/**
 * A LISTING PAGE — one product family, at its own URL.
 *
 * The shop sells two things that are not variants of each other: 1.95-2.30 m
 * hot tubs and 3.90-5.80 m swim spas. A single page cannot be the landing
 * page for both without being a worse landing page for each, and a home page
 * that simply prints every model is a catalogue dump rather than a route into
 * one.
 *
 * So each family gets a page it owns: its own H1, its own intro, its own
 * meta description, its own grid. The home page keeps the keyword and sends
 * people here; these pages do the selling. That is also the shape search
 * wants — "masažni bazen" and "swim spa" are different queries with different
 * intent, and one URL cannot rank honestly for both.
 */
export interface Collection {
  /** Route path under the shop, e.g. "/bazeni". Its own URL, not an anchor. */
  path: string;
  h1: string;
  /**
   * The <title>, where it should differ from the h1 — and on a collection it
   * usually should.
   *
   * An h1 names the page for someone already on it ("Masažni bazeni"); a title
   * competes in a result list against nine others, and a bare category noun
   * there is the same string the shop's own name already carries. Without
   * this, /masazni-bazeni titled itself "Masažni bazeni | Masažni bazeni
   * Vrelec" — the head term twice and nothing a searcher could choose on.
   */
  seoTitle?: string;
  /**
   * The copy under the H1 — what this family is and how to choose inside it.
   *
   * ⚠️ PARAGRAPHS, AND IT USED TO BE ONE STRING. A single field invites a
   * single paragraph, and a single paragraph invited every fact: the swim spa
   * intro grew to fifteen lines that recited all three models' length, seats,
   * jets, pumps and filled weight — every one of which the three cards
   * directly below it already print. The reader met the catalogue twice, once
   * as a wall and once as cards, and the wall came first.
   *
   * So the shape says what the copy is for. Lead with what the family is,
   * then what separates the models in a clause each, then what they share.
   * Numbers that are on the cards do not belong here; numbers that are NOT —
   * a filled weight, a shell height — earn their place by deciding something.
   */
  intro: readonly string[];
  metaDescription: string;
  /** Short label for the nav and breadcrumbs. */
  navLabel: string;
  products: ProductCard[];
}

/**
 * A PRODUCT FAMILY, as the rail under the hero shows it.
 *
 * Not a model. The distinction is the whole reason this type exists: a card
 * that names one model must carry that model's own price (ZVPot, transposing
 * Directive 98/6/EC — the price shown against an identified product has to be
 * that product's), whereas a card that names a family may legitimately carry a
 * RANGE, because a range is what a family costs. The rail printed model cards
 * for a while and had to hide the range in the section head to stay honest;
 * with real categories the range belongs on the card again.
 */
export interface Category {
  /** The family's name, plural. */
  name: string;
  /** Count and the dimension the family is actually chosen on. */
  meta: string;
  /** "2.420 € – 2.890 €", or a single price where the family has one model. */
  price: string;
  /** Where the card goes. An in-page anchor or a route. */
  href: string;
  /** The family's lead photograph, where the shop has one. */
  photo?: PdpPhoto;
  /** The drawing to use when it has none. */
  art?: ArtKey;
}

export interface ProductCard {
  name: string;
  desc: string;
  meta: string;
  price: string;
  art: ArtKey;
  badge?: string;
  /**
   * The card's own product page, under the shop's "/product" route. Absent on
   * shops that sell a single model, where every card is the flagship.
   */
  slug?: string;
  /**
   * The model's lead photograph, where it has one. A card with a real picture
   * and a card with a drawing sit side by side quite happily — each is telling
   * the truth about its own model — and a drawing shown where a photograph
   * exists is simply the worse of the two.
   */
  photo?: PdpPhoto;
}

export interface UtilCard {
  util: true;
  h: string;
  p: string;
  cta: string;
  /**
   * Where the CTA goes. Without it the renderer used the flagship model's
   * page for every utility tile — so "Naročite ogled" landed a visitor on a
   * product page with no survey in sight, when the promise was a visit.
   * A tile's action names its own destination.
   */
  href?: string;
}

/**
 * An option offered alongside the product, priced separately.
 *
 * Kept as display strings rather than numbers because the content layer is
 * what the renderer reads, and the renderer must never do arithmetic on money
 * — the price a page shows and the price a customer is charged come from two
 * different trust levels (db/schema.sql's display/charge split). `priceCents`
 * rides along for the total the buy bar shows and for the cart, once there
 * is one.
 */
export interface PdpAddon {
  /** Stable identity: the form field name, and later the variant SKU. */
  key: string;
  label: string;
  /** Display string, already formatted and rounded. */
  price: string;
  /** Gross cents, or 0 when no price is available. */
  priceCents: number;
  /** Quantity, where the supplier states one ("16 kosov"). */
  qty?: string;
  /** Heading this option sits under. Ungrouped options render first. */
  group?: string;
}

/** A photograph of the product, with the alt it must carry. */
export interface PdpPhoto {
  src: string;
  /**
   * Intrinsic size, WHERE IT IS KNOWN. Supabase-served photography carries
   * none — the build cannot reach the bucket to measure it, and the frames
   * that paint these set their own aspect-ratio anyway. See own-media.ts.
   */
  w?: number;
  h?: number;
  widths: readonly (readonly [string, number])[];
  alt: string;
}

export interface PdpContent {
  /** URL segment under routeSlugs["/product"] ('quattro' → /savna/quattro). */
  slug: string;
  /**
   * The supplier's model code — ZR805, ZR7807. The identity an order, a
   * warranty claim and a spare part are matched on, and therefore the `sku`
   * the Product schema publishes: a merchant surface that reconciles feeds
   * against order exports needs the code the back office actually uses.
   */
  code: string;
  /**
   * The family keyword this page competes for — "masažni bazen" or
   * "swim spa". The <title> used to stamp every product with the SHOP's
   * primary keyword, which titled all three swim spas "SWIM 450 — masažni
   * bazen": the collection pages hold the two families apart as different
   * queries, and the product titles were merging them back together.
   */
  family: string;
  eyebrow: string;
  title: string;
  sub: string;
  price: string;
  /** Gross cents for schema.org Offer — never parsed from display strings. */
  priceCents: number;
  cfg: [string, string[], number][];
  freight: [string, string, boolean][];
  note: string;
  spec: [string, string][];
  /**
   * The manufacturer's brand, where it is not the shop's own.
   *
   * ⚠️ ABSENT, productJsonLd PUBLISHED THE SHOP AS THE BRAND. Product.brand
   * was `{ "@type": "Brand", name: shop.name }` unconditionally, so every
   * model on the network was asserted to Google as a product of the shop that
   * retails it. It happens to read acceptably for a white-label range sold
   * under the shop's own name; it is simply false for a dealer — a motorcycle
   * shop would be telling a search engine it manufactures the motorcycles.
   */
  brand?: string;
  /**
   * schema.org itemCondition. Absent means new, which is what the literal
   * asserted for every product on the network. A dealer with used stock says
   * so per model rather than by editing a shared renderer.
   */
  condition?: "new" | "used" | "refurbished" | "damaged";
  /** Trade identifiers, where the product carries them. Absent on white-label
   *  goods — this catalogue's models have a supplier code and no GTIN. */
  gtin?: string;
  mpn?: string;
  bar: [string, string, string, string];
  /**
   * The two facts that go in the <title>, as one already-formatted phrase.
   *
   * ⚠️ THE SIX PRODUCT TITLES USED TO CARRY NO DECISION FACT. They were built
   * as `title + " — " + family + " | " + shop.name`, which rendered "BAZEN 195
   * — masažni bazen | Masažni bazeni Vrelec": six results in a row reading as
   * one product with six serial numbers, and of 49 characters only 9 said
   * anything a searcher could choose on. Two of the six differed only by
   * HIDRO and MAXI, whose actual difference — 38 against 94 masažnih šob —
   * appeared nowhere in either title.
   *
   * So the title takes the footprint and the seats (or, where seats do not
   * separate two models, the jet count). DERIVED, never typed: it is built by
   * the same footprint()/seating()/counted() helpers the standfirst uses, so
   * a supplier's figure changing moves the title with it instead of leaving a
   * stale number on the line Google prints.
   *
   * Optional: a shop with nothing extra to say falls back to `family`, which
   * is the title these pages had.
   */
  titleSpec?: string;
  /** Options priced separately from the product. Absent where there are none. */
  addons?: PdpAddon[];
  /**
   * The assurance row: four short promises with a sub-line each, in the order
   * delivery, returns, payment, help. The icons are the renderer's.
   */
  assure?: [string, string][];
  /**
   * Collapsible sections under the buy column, as [heading, body] — product
   * description, care, delivery terms. The spec table is generated separately
   * and always renders first.
   *
   * The optional third and fourth elements are a "read the whole thing" link:
   * the anchor's WORDS and the ROUTE KEY it points at. A panel body is capped
   * at 320 characters by studio.test.ts, which is right — these are summaries
   * — and a summary with no way through to the page that carries the detail
   * is a dead end. The key rather than a path so a shop that renames its
   * routes does not leave six product pages pointing at a 404.
   */
  panels?: [string, string, string?, string?][];
  /** Shell finish names offered. Names rather than swatches; see catalog/pola.ts. */
  finishes?: string[];
  /**
   * Cabinet panel finishes — the PS skirt, not the shell.
   *
   * A separate list because it is a separate decision, and because it used to
   * be reachable only as prose inside a collapsed panel. A buyer choosing a
   * colour is choosing two.
   */
  cabinetFinishes?: string[];
  /**
   * The model's own photography, in gallery order. Absent where a model has
   * none — the gallery then falls back to the shop's drawing, which is the
   * honest thing to show rather than another model's pictures.
   */
  photos?: PdpPhoto[];
  /**
   * True while the prices on this page are a provisional conversion of cost
   * rather than a selling price the business has set.
   *
   * The page may show them — it is pre-live and noindexed, and a designer
   * needs real figures to look at. Structured data may not: a Product whose
   * Offer carries a number nobody decided is a claim about money made to a
   * search engine, and it is the category of error that earns a manual
   * action. productJsonLd omits the Offer entirely when this is set.
   */
  pricesProvisional?: boolean;
}

export interface ShopContent {
  /**
   * Header labels, by POSITION: 0 Trgovina, 1 O nas, 2 Vodniki, 3 Dostava,
   * 4 Kontakt, 5 Primerjava, 6 the guided choice.
   *
   * ⚠️ APPEND-ONLY. Three renderers index into this tuple (the studio
   * chrome, the legacy header in render/sections.ts, the PDP breadcrumb),
   * and each hardcodes which index maps to which ROUTE. 5 and 6 were
   * appended rather than inserted in display order precisely so the legacy
   * header's nav[1]="/about" stayed true; the studio header states its own
   * display order in renderStudioHeader. Reordering these labels reroutes
   * links silently — extend at the end or not at all.
   */
  nav: [string, string, string, string, string, string, string];
  artKey: ArtKey;
  kicker: string;
  h1: string;
  sub: string;
  cta: string;
  metaDescription: string;
  /**
   * What follows the keyword in the HOME PAGE TITLE — the single
   * highest-value string on the site.
   *
   * ⚠️ IT WAS FOUR WORDS TYPED INTO THE ROUTER, beside a correctly
   * interpolated keyword: `cap(shop.keyword.primary) + " — cena in dostava | "
   * + shop.name`. Half the line knew which shop it was on and half did not, so
   * a motorcycle dealer's home page would have offered Google "Motorno kolo —
   * cena in dostava". The keyword half stays derived; this is the other half.
   */
  homeTitleTail: string;
  /**
   * The band that offers the site visit, on the home page's closing sequence.
   *
   * ⚠️ THIS SENTENCE WAS NETWORK-NEUTRAL WHEN SIX SHOPS EXISTED AND REGRESSED
   * AFTER THE NARROWING. The deleted version read "Oglejte si modele v živo in
   * se posvetujte z našo ekipo", under a comment explaining that no adjective
   * in it agreed with any keyword ON PURPOSE, because the six shops' head
   * terms split across two genders. The showroom claim in it turned out to be
   * false and the replacement — "Pridemo pogledat, kam bi bazen postavili" —
   * was written for one shop and typed into shared code, which is how the
   * discipline was lost along with the comment that carried it.
   */
  membershipBody: string;
  /**
   * The blog index's own three strings.
   *
   * ⚠️ THEY WERE MODULE CONSTANTS UNDER THE COMMENT "Not in a content module:
   * it is two strings." That is the rule this network cannot afford: no
   * user-visible sentence is too short to belong to a shop, and these three
   * named hot tubs in the title, the lead and the meta description of every
   * shop's blog.
   */
  blogLead: string;
  blogMetaDescription: string;
  /**
   * The message prefilled into the enquiry form when a visitor asks for the
   * colour swatch. It is presented to them as something they typed, so it has
   * to be a sentence THIS shop's customer would write — "Prosim za vzorčnik
   * barv školjke" is a hot-tub shell, and it lived in the router.
   */
  swatchMessage: string;
  trust: string[];
  stats: [string, string][];
  /**
   * The product families, for the rail under the hero. Omitted by a shop that
   * sells one family — the rail then falls back to model cards, which is what
   * it did before there were two.
   */
  categories?: Category[];

  products: (ProductCard | UtilCard)[];

  /**
   * The shop's listing pages, one per product family. Each is a real URL with
   * its own H1 and grid — see Collection. The home page links here rather
   * than printing every model itself.
   */
  collections?: Collection[];
  /**
   * The shop hub's own meta description.
   *
   * It used to fall back to `metaDescription`, which is the HOME page's — so
   * two indexable pages shipped identical descriptions, and a search engine
   * choosing between them has nothing to choose on. Every collection already
   * carries its own; the hub is the page that was missed because it has no
   * Collection record of its own.
   */
  hubMetaDescription?: string;
  /**
   * The sentence under the hub's h1.
   *
   * The hub opened with the bare word "Trgovina" and then 260px of nothing
   * before the first family band — a page whose only job is to answer "what
   * do you sell?" was not answering it above the fold. Distinct from
   * hubMetaDescription on purpose: that one is written for a search result,
   * where the reader has not arrived yet.
   */
  hubIntro?: string;
  /**
   * The hub's opening decision, as two cards under the intro: one per family,
   * each with its definition, the three facts the choice actually turns on
   * (size, filled mass, where it stands) and an anchor down to its band.
   *
   * Structured rather than prose because the decision is structurally a
   * comparison: the same three axes, answered twice. As one paragraph this
   * was nine lines in a half-width column — the tallest text block on the
   * page, spent before the visitor had seen a single product.
   */
  hubChoice?: readonly {
    /** Family name — "Masažni bazen". */
    readonly label: string;
    /** What it is, in one or two sentences. */
    readonly text: string;
    /** Label → value, e.g. ["Velikost", "195–230 cm"]. */
    readonly facts: readonly (readonly [string, string])[];
    /** Anchor of the family's band on the hub — "#masazni-bazeni". */
    readonly anchor: string;
    /** The anchor's link text — "Trije modeli". */
    readonly anchorLabel: string;
  }[];
  /**
   * The hub's closing prose, under the family bands.
   *
   * WHY A HUB NEEDS ONE. Everything above it is a decision device: a lede,
   * two cards and two grids of names, spec lines and prices. That answers
   * "which family" and "which model", and answers nothing about HOW TO READ
   * what it just showed — which on this catalogue is a real gap, because the
   * two numbers a visitor instinctively ranks on (jets, seats) are the two
   * that mislead here. The 230 is bigger than the 210 and seats one fewer;
   * the 94-jet swim spa is lighter than the 38-jet one. A hub that shows
   * those figures and says nothing about them is inviting the wrong choice.
   *
   * It is also the page's only running copy. /trgovina is the category page
   * for the shop's primary keyword and it went out with 281 words, nearly all
   * of them product names and figures.
   *
   * ⚠️ NOT A SECOND COPY OF THE COLLECTION INTROS. Those walk the models one
   * by one and live on the family pages; repeating them here is the exact
   * duplication that got `intro` removed from the bands. This says what the
   * grid cannot: how to read it, and what happens after you have chosen.
   */
  hubOutro?: readonly {
    readonly h: string;
    readonly p: readonly string[];
  }[];
  /**
   * Three short proofs shown IN the hero, under the call to action.
   *
   * ⚠️ EVERY ITEM HERE IS A CLAIM IN THE MOST PROMINENT PLACE THE SITE HAS,
   * above the fold on the landing page, so the bar is the highest on the
   * site: it goes in only if the shop has confirmed it and another page
   * backs it up. `trust` (the ticker) is NOT the same list and must not be
   * reused for this — two of its four entries are claims still waiting on
   * the owner, and the hero is the last place to put an unconfirmed one.
   *
   * Kept to three because this row sits between the CTA and the fold: a
   * fourth pushes the button off a phone.
   */
  heroTrust?: readonly [string, string, string];
  moat: {
    h2: string;
    steps: [string, string][];
    claim: [string, string];
  };
  /**
   * Customer reviews.
   *
   * ⚠️ `placeholder` IS A LEGAL FLAG, NOT A DRAFTING NOTE. The storefront
   * renders these under the heading "Preverjena mnenja strank" with a
   * "Preverjen nakup" chip beside each one — claims that the review comes
   * from a real, verified purchase.
   *
   * Making that claim about a review nobody wrote is not a copy error. The
   * Unfair Commercial Practices Directive as amended by the Omnibus Directive
   * (EU) 2019/2161, transposed in ZVPot-1, puts two things on the Annex I
   * blacklist — practices banned outright, with no balancing test:
   *
   *   23b. stating that reviews are submitted by consumers who actually used
   *        or bought the product, without taking reasonable steps to check;
   *   23c. submitting, or having someone submit, false consumer reviews.
   *
   * So a review that is not a real one carries `placeholder: true`, the
   * renderer must not dress it as verified, and the launch gate refuses to
   * let a shop go live while any review is flagged. Delete the flag only
   * when the quote, the person and the order behind it are all real.
   */
  /**
   * Installations this shop has actually done, newest first.
   *
   * ⚠️ THE LIST IS THE ASSERTION; THE UPLOAD IS ONLY WHAT IT POINTS AT. Every
   * other picture on this site degrades to the shop's own product photography
   * until somebody replaces it, and that is right for a band whose job is to
   * be an editorial pause. It is wrong here: this band's whole claim is "we
   * installed these", so a supplier's studio cutout standing in for one would
   * make the claim false — the one place on the site where a borrowed
   * photograph is a false statement rather than a placeholder.
   *
   * So the storefront draws an entry only where one is written here, and an
   * uploaded slot nobody has listed shows nothing. Writing the entry is the
   * moment somebody takes responsibility for the sentence under the picture:
   * a model this shop sells, a place, and when.
   *
   * ⚠️ AND IT IS NOT A REVIEW. Nothing here may carry a customer's words, a
   * name, or a rating — that is the testimonial band, and it answers to Annex
   * I 23b/23c. This is a photograph of a job with a caption of facts. Keep
   * `place` to a town, never an address: the buyer did not consent to having
   * their house located, and "Domžale" carries the whole point anyway.
   *
   * Empty is the correct state until real photographs exist.
   */
  installations?: readonly {
    /**
     * The slot STEM, as the figure blocks write it: "montaza-1", which
     * sitePhoto() resolves to /media/site/montaza-1.webp and the panel
     * registers as site/montaza-1.webp. Six exist.
     */
    readonly slot: string;
    /** The model as the catalogue names it, e.g. "BAZEN 230". */
    readonly model: string;
    /** The town. Never a street or a house number. */
    readonly place: string;
    /** When, as coarse as the caption reads: "marec 2026". */
    readonly month: string;
  }[];
  /**
   * One line beside the testimonial heading.
   *
   * ⚠️ IT MAY DESCRIBE THE REVIEWS AND NOTHING ELSE. This sits at the top of
   * the band that carries the Annex I 23b claim, so a sentence here saying
   * how satisfied customers are, or how many there have been, is that claim
   * enlarged — and unlike the chip nothing checks it. Say what the quotes
   * are and where they came from; the quotes do the persuading.
   *
   * Optional: absent, the intro column is the heading and the link.
   */
  reviewsLead?: string;
  /**
   * The half of the lead that MAKES THE PURCHASE CLAIM, printed only when
   * every quote in the band is verified.
   *
   * ⚠️ THIS FIELD EXISTS BECAUSE THE GATE HAD A HOLE IN IT. The chip and the
   * heading are both conditional on `verified`, and this shop's four reviews
   * are unverified — order_id is NULL on all four — so both correctly stood
   * down. reviewsLead printed regardless, and it said "Zapisali so jih
   * stranke, ki so pri nas kupile bazen": the same Annex I 23b claim the chips
   * were withheld for, in running text where no chip logic could reach it.
   *
   * So the sentence that asserts a purchase goes here and answers to the same
   * test; reviewsLead keeps only what is true either way. If a sentence would
   * be false with the chips off, it belongs in this field.
   */
  reviewsLeadVerified?: string;
  reviews: {
    q: string;
    who: string;
    model: string;
    /**
     * Stars, 1–5, as the customer gave them. Rendered as a row of glyphs
     * with the number in the accessible name — a screen reader hears "5 od
     * 5 zvezdic", not five bullet characters.
     *
     * Optional because a review with no rating is still a review; the row
     * simply does not draw. Nothing INFERS a rating: a missing one is
     * missing, never five.
     */
    rating?: number;
    /**
     * The line under the name — "Aktivni športnik", "Lastnika spa-ja".
     *
     * ⚠️ CONTEXT, NEVER A CLAIM. It says who the person is, not anything
     * about their purchase: `verified` carries that and is the only thing
     * that earns the chip. A role reading "preverjen kupec" would be the
     * Annex I 23b claim smuggled in as a job title.
     */
    role?: string;
    /** True for content nobody wrote. The launch gate refuses live while set. */
    placeholder?: boolean;
    /**
     * ⚠️ THE ANNEX I 23b CLAIM, AND THE ONLY THING THAT EARNS THE CHIP.
     *
     * Separate from `placeholder`, because they are different failures. A
     * placeholder is invented — nobody said it, and no shop may go live with
     * one. An unverified review is REAL and simply has not been checked
     * against an order, which is fine to publish and not fine to dress as a
     * verified purchase.
     *
     * Conflating them was the earlier shape: the chip printed whenever a
     * review was not a placeholder, so a genuine quote the shop had never
     * checked would have carried "Preverjen nakup" the moment the flag came
     * off. The operator ticks this in the panel against an order number.
     */
    verified?: boolean;
  }[];
  /**
   * [chip, title, fragment] — the fragment is the guide's own section id on
   * the guides page, so a card is a door to THE guide, not to the top of a
   * page the reader then scrolls looking for it. Pinned by a structure test
   * against the rendered guides page, because the id is derived from the
   * heading and would silently drift the day someone rewords it.
   */
  guides: [string, string, string][];
  /**
   * THE EDITORIAL AND LEGAL PAGES THIS SHOP PUBLISHES.
   *
   * ⚠️ THIS WAS A GLOBAL IMPORT, AND IT IS THE REASON A SECOND SHOP COULD NOT
   * SHIP. worker.ts looped over a module-level PAGES registry and render/
   * sitemap.ts listed the same one, so every domain on this Worker served the
   * bazen shop's pages: a sauna shop would have published "Vodniki za nakup
   * masažnega bazena" at /vodniki, a comparison of swim spas at /primerjava,
   * and an FAQ answering "Je masažni bazen isto kot jacuzzi?" — each at 200,
   * each in the sitemap, each written about a product it does not sell.
   *
   * Nothing could have caught that. tsc saw a valid array, the router matched
   * on route slugs the new shop had to declare anyway, and every audit in this
   * repo runs against `bazen`.
   *
   * ⚠️ REQUIRED, NOT OPTIONAL, AND THAT IS THE WHOLE POINT. An optional field
   * with a fallback to the bazen set would reproduce the bug for exactly the
   * shop most likely to hit it — the one added in a hurry. Required means the
   * compiler asks the question, and a compile error beats a test.
   *
   * The pages themselves still live in ./pages/, and the six that are genuinely
   * universal (basket, checkout, terms, privacy, cookies, withdrawal — all
   * parameterised from ShopConfig) are exported as UNIVERSAL_PAGES for a new
   * shop to spread into its own list. The other seven are hot-tub copy and are
   * this shop's.
   */
  pages: readonly Page[];
  /**
   * The buying guides at /vodnik/<slug>, for the same reason and with the same
   * history: worker.ts imported GUIDE_PAGES straight from the bazen shop's
   * module, so the three most commercial long-tail URLs on any second shop's
   * domain would have been about somebody else's product.
   */
  guidePages: readonly GuidePage[];
  /** The flagship: the model the home page leads with. */
  pdp: PdpContent;
  /**
   * Every product page this shop serves, the flagship included. A shop with
   * one model may omit it; the router then serves `pdp` alone.
   */
  pdps?: PdpContent[];
  footNote: string;
}
