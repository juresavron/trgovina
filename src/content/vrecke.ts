import type { PdpContent, ShopContent } from "./types";
import type { Page } from "./pages";
import { UNIVERSAL_PAGES } from "./pages";
import { termsPage } from "./pages/pogoji";
import { cartPage } from "./pages/kosarica";
import {
  ACTIVES,
  CAFFEINE_MG,
  FLAVOURS,
  POUCHES_PER_TIN,
  blendSummary,
  doseText,
  totalActiveMg,
  type PouchFlavour,
} from "../catalog/pouches";
import { PRICE_UNSET } from "../catalog/pricing";

/**
 * THE POUCH SHOP'S OWN WORDS.
 *
 * ⚠️ NOT ONE SENTENCE IS SHARED WITH THE SIBLING SHOP, and that is enforced
 * rather than intended: tenants/cross-shop.test.ts fails the build if any two
 * shops publish the same eight-word run, share a head term, or name each
 * other's domain in their markup. Two storefronts on one Worker wearing one
 * theme is precisely the arrangement Google reads as a doorway network, and
 * the only thing that makes them two sites is that they were written twice.
 *
 * ⚠️ WHAT THIS SHOP MAY NOT SAY, and the supplier's own art says all of it:
 *
 *   — "Healthy alternative", "supports brain function", "stops the jitters".
 *     Health claims on a food are restricted in the EU to the authorised list
 *     (Reg. 1924/2006); none of these is on it. The pages below state what is
 *     in the tin, in what dose, and stop there.
 *   — "More caffeine than your favourite drink", "no withdrawals", "flavour
 *     lasts an hour". Comparative claims about products this shop has not
 *     measured, against competitors it does not name.
 *   — Anything about vitamin B6, magnesium or mint. See the four supplier
 *     conflicts recorded in catalog/pouches.ts: none of the three appears in
 *     the ingredient table.
 *   — Any review. Nobody has bought anything yet, and inventing one is on the
 *     ZVPot-1 blacklist (Priloga I, 23b and 23c) where no balancing applies.
 *
 * What is left after all that is still a shop, and it is a more useful one
 * than the category's norm: the dose of every active, in a table, with the one
 * figure the supplier contradicts itself on marked as unconfirmed.
 */

/* ------------------------------------------------------------ the product */

/** The flavour's product page. One per confirmed flavour. */
function pdpFor(f: PouchFlavour): PdpContent {
  const price = f.priceCents > 0 ? "" : PRICE_UNSET;
  return {
    slug: f.slug,
    // No supplier article number is on the sample art. The slug is the only
    // stable identity this shop has for the variant until one arrives, and
    // saying so beats inventing a code an order cannot be matched on.
    code: "ZAGON-" + f.slug.toUpperCase(),
    family: "kofeinska vrečka",
    eyebrow: "Brez nikotina",
    title: f.name,
    sub:
      "Kofeinska vrečka z okusom " + f.name.toLowerCase() + ": " + blendSummary() +
      ", " + POUCHES_PER_TIN + " vrečk v škatlici. Brez nikotina in brez tobaka.",
    titleSpec: "kofeinske vrečke, " + CAFFEINE_MG + " mg kofeina",
    price,
    // ⚠️ ZERO UNTIL THE OWNER SETS A PRICE. render/page.ts publishes no Offer
    // for a product with no price, which is the honest state: a displayed
    // price is what the customer pays (ZVPot, Directive 98/6/EC), so there is
    // no such thing as a provisional one on a live page.
    priceCents: f.priceCents,
    // Nothing to configure: one formula, one tin size. The hot-tub shop's two
    // colour axes have no analogue here, and an empty configurator renders as
    // nothing rather than as an empty box.
    cfg: [],
    freight: [
      ["Pošiljanje po Sloveniji", "po ceniku ob naročilu", false],
      ["Vrnitev v 14 dneh", "zakonska pravica", true],
    ],
    note:
      "Cena še ni objavljena. Škatlica ima " + POUCHES_PER_TIN + " vrečk; " +
      "sestava je enaka pri vseh okusih.",
    spec: [
      ["Vrečk v škatlici", String(POUCHES_PER_TIN)],
      ["Aktivnih sestavin", String(ACTIVES.length)],
      ["Skupaj aktivnih snovi", totalActiveMg() + " mg na vrečko"],
      ["Kofein", CAFFEINE_MG + " mg na vrečko"],
      ["Nikotin", "ga ni"],
      ["Tobak", "ga ni"],
    ],
    // The manufacturer, named because it is not this shop. A dealer that
    // publishes itself as the brand is telling a search engine it makes the
    // goods — see PdpContent.brand.
    brand: "Geerlun",
    // Nothing is held in stock: nothing has been ordered yet. Absent rather
    // than guessed — an unstated position publishes no availability at all.
    bar: [f.name, blendSummary(), price, "Povprašajte"],
    // ⚠️ THE PAGE SAYS THE FIGURES ARE NOT FINAL, BECAUSE ONE OF THEM IS NOT.
    // catalog/pouches.ts records that the supplier's own collateral gives two
    // different caffeine contents. Until that is settled in writing the page
    // carries the itemised figure AND the fact that it is unconfirmed.
    pricesProvisional: true,
  };
}

const PDPS: PdpContent[] = FLAVOURS.map(pdpFor);

/* -------------------------------------------------------------- the pages */

const ABOUT: Page = {
  key: "/about",
  h1: "Kdo prodaja te vrečke",
  // ⚠️ 35 CHARACTERS IS THIS SHOP'S WHOLE BUDGET. Google stops drawing a
  // title at about 60 and " | Kofeinske vrečke Zagon" is 25 of them — the
  // sibling shop's suffix is 9, so titles that read fine there are cut here.
  // The brand already says "kofeinske vrečke"; repeating it in the head is
  // what pushed this to 63.
  seoTitle: "Kdo prodaja te vrečke",
  lead: "Majhna slovenska trgovina z eno vrsto vrečk in brez zgodbe o življenjskem slogu.",
  metaDescription:
    "Kdo stoji za trgovino s kofeinskimi vrečkami brez nikotina: podjetje, naslov in " +
    "način dela. Brez obljub, ki jih ne moremo preveriti.",
  blocks: [
    {
      kind: "prose",
      p: [
        "Vrečke uvažamo in prodajamo v Sloveniji. Proizvaja jih Geerlun, mi jih " +
          "ne izdelujemo — to piše tudi na strani vsakega okusa, ker je razlika med " +
          "proizvajalcem in prodajalcem pomembna, kadar se kaj zaplete.",
        "Kar znamo povedati o izdelku, je na strani s sestavo: katera snov je notri " +
          "in koliko je je. Kar bi radi vedeli in še ne vemo, je tam prav tako " +
          "označeno. Raje priznamo, da nekaj še preverjamo, kot da si izmislimo " +
          "številko, ki bo pozneje drugačna.",
      ],
    },
    { kind: "imprint", h: "Podatki o podjetju" },
    {
      kind: "cta",
      h: "Vprašanje o izdelku?",
      p: "Odgovorimo po telefonu. Če česa ne vemo, to povemo.",
      label: "Kontakt",
      href: "/contact",
    },
  ],
};

const CONTACT: Page = {
  key: "/contact",
  h1: "Kontakt",
  seoTitle: "Kontakt in povpraševanje",
  lead: "Telefon je najhitrejša pot. Spletno naročanje še ni odprto.",
  metaDescription:
    "Kako nas dosežete: telefon in naslov podjetja. Odgovorimo na vprašanja o " +
    "sestavi vrečk, količinah in dobavi.",
  blocks: [
    {
      kind: "prose",
      p: [
        "Spletnega plačila še nimamo vzpostavljenega in tega ne skrivamo za košarico, " +
          "ki ne dela. Napišite, kaj vas zanima, in odgovorimo z vsem, kar o izdelku " +
          "vemo — vključno s tem, česa še nismo potrdili pri dobavitelju.",
      ],
    },
    { kind: "contact", h: "Kako nas dobite" },
    { kind: "enquiry", h: "Povprašajte", p: "Napišite, kateri okus in koliko škatlic vas zanima." },
  ],
};

/**
 * ⚠️ THE PAGE THE WHOLE SHOP RESTS ON. The category sells on adjectives; this
 * one page is the reason to buy here instead, and it is nothing but the
 * supplier's table plus an honest note about the figure they contradict.
 */
const COMPOSITION: Page = {
  key: "/compare",
  h1: "Kaj je v eni vrečki",
  seoTitle: "Sestava: vse snovi in odmerki",
  lead:
    "Šest snovi, vsaka s svojim odmerkom. Nobene mešanice brez številk in nobene " +
    "sestavine, ki je ne bi znali poimenovati.",
  metaDescription:
    "Popolna sestava kofeinske vrečke: alfa-GPC, L-tirozin, tavrin, gvarana, " +
    "teobromin in kofein, vsak s svojim odmerkom v miligramih.",
  blocks: [
    {
      kind: "prose",
      p: [
        "Večina vrečk v tej kategoriji navaja „patentirano mešanico“ in skupno težo. " +
          "To je podatek, ki kupcu ne pove ničesar: pod eno številko je lahko " +
          "karkoli v katerem koli razmerju. Spodaj je vsaka snov posebej, z " +
          "odmerkom na vrečko.",
        blendSummary() + ". Škatlica jih ima " + POUCHES_PER_TIN + ".",
      ],
    },
    {
      kind: "facts",
      h: "Odmerki na vrečko",
      rows: ACTIVES.map((a) => [a.name, doseText(a)] as [string, string]),
    },
    {
      kind: "list",
      h: "Kaj je katera snov",
      items: ACTIVES.map((a) => a.name + " — " + a.note),
    },
    {
      // ⚠️ THE DISAGREEMENT IS PUBLISHED, NOT SMOOTHED OVER. The supplier's
      // itemised table says 50 mg of caffeine and one of their graphics says
      // 40. A shop that picks one and says nothing is asking the customer to
      // trust a number it has not checked — and caffeine content is the one
      // figure on this product somebody may need for a medical reason.
      kind: "prose",
      h: "Kaj še preverjamo",
      p: [
        "Dobaviteljevo gradivo si pri kofeinu nasprotuje: razpredelnica sestave " +
          "navaja " + CAFFEINE_MG + " mg na vrečko, ena od njihovih grafik pa 40 mg. " +
          "Objavljamo številko iz razpredelnice, ker je to edini dokument, ki " +
          "našteva vse snovi posebej — in to razliko navajamo tukaj, dokler je " +
          "dobavitelj pisno ne potrdi.",
        "Dokler ni potrjena, teh vrečk ne prodajamo. Zaradi tega je trgovina še " +
          "zaprta.",
      ],
    },
    {
      kind: "cta",
      h: "Vprašanje o sestavi?",
      p: "Če potrebujete natančen podatek o kateri snovi, ga poiščemo pri dobavitelju.",
      label: "Kontakt",
      href: "/contact",
    },
  ],
};

const DELIVERY: Page = {
  key: "/delivery",
  h1: "Dostava in vračilo",
  seoTitle: "Dostava in vračilo",
  lead: "Škatlica je paket in ne paleta. Vrnitev v štirinajstih dneh je zakonska pravica.",
  metaDescription:
    "Kako pošiljamo kofeinske vrečke po Sloveniji in kako poteka vračilo v " +
    "14 dneh. Cena pošiljanja se pove ob naročilu.",
  blocks: [
    {
      kind: "prose",
      p: [
        "Naročilo gre v paketu s pošto ali kurirjem. Ceno pošiljanja povemo ob " +
          "naročilu in ne prej, ker je odvisna od števila škatlic in od tega, kam " +
          "gre — izmišljena „brezplačna dostava“ je vračunana drugam.",
      ],
    },
    {
      kind: "steps",
      h: "Kako poteka",
      items: [
        ["Povpraševanje", "Napišete, kateri okus in koliko škatlic. Odgovorimo s ceno in rokom."],
        ["Potrditev", "Ko potrdite, naročilo pripravimo in oddamo."],
        ["Prevzem", "Paket prevzamete doma ali na prevzemnem mestu."],
      ],
    },
    {
      kind: "prose",
      h: "Vračilo",
      p: [
        "Vrnete lahko v štirinajstih dneh od prevzema, brez pojasnila. Podrobnosti in " +
          "obrazec so na strani o odstopu od pogodbe; neposredne stroške vračila nosi " +
          "kupec, razen če se dogovorimo drugače.",
      ],
    },
    {
      kind: "links",
      h: "Naprej",
      items: [
        ["Odstop od pogodbe", "/withdrawal"],
        ["Pogoji poslovanja", "/terms"],
      ],
    },
  ],
};

const FAQ: Page = {
  key: "/faq",
  h1: "Pogosta vprašanja",
  seoTitle: "Vprašanja o sestavi in uporabi",
  // The FAQPage opt-in: worker.ts emits the rich result from the qa block.
  faqPage: true,
  lead: "Kratki odgovori. Kjer odgovora nimamo, to piše.",
  metaDescription:
    "Ali vrečke vsebujejo nikotin, koliko kofeina je v eni, kako se uporabljajo " +
    "in kdaj bo trgovina odprta.",
  blocks: [
    {
      kind: "qa",
      items: [
        [
          "Ali vrečke vsebujejo nikotin?",
          "Ne. Ne vsebujejo nikotina in ne tobaka. To je edina lastnost, po kateri se " +
            "ta izdelek loči od nikotinskih vrečk, s katerimi je v trgovini pogosto " +
            "postavljen na isto polico.",
        ],
        [
          "Koliko kofeina je v eni vrečki?",
          "Po dobaviteljevi razpredelnici sestave " + CAFFEINE_MG + " mg. Isti " +
            "dobavitelj v enem od svojih oglasnih gradiv navaja 40 mg, zato podatek " +
            "pred prodajo potrjujemo pisno — razlika je opisana na strani o sestavi.",
        ],
        [
          "Koliko vrečk je v škatlici?",
          "V eni škatlici jih je " + POUCHES_PER_TIN + ". Sestava je pri vseh okusih " +
            "enaka; razlikuje se samo okus.",
        ],
        [
          "Kdaj bo mogoče naročiti?",
          "Ko potrdimo sestavo pri dobavitelju in objavimo cene. Do takrat je stran " +
            "zaprta in tega ne skrivamo za košarico, ki ne dela.",
        ],
      ],
    },
    {
      kind: "cta",
      h: "Vprašanja ni na seznamu?",
      p: "Vprašajte po telefonu. Če odgovora nimamo, ga poiščemo pri dobavitelju.",
      label: "Kontakt",
      href: "/contact",
    },
  ],
};

/**
 * ⚠️ THIS SHOP WRITES ITS OWN WITHDRAWAL NOTICE, and the shared one would have
 * been a set of promises nobody here made.
 *
 * pages.ts says why in as many words: the shared notice's second step promises
 * "odvoz izvedemo mi" and justifies it with the weight of a hot tub. Art.
 * 14(1) of Directive 2011/83 puts the cost of returning goods on the consumer
 * UNLESS the trader agreed to bear it — so inheriting that page is agreeing to
 * collect returns, at this seller's expense, for an object that fits in a
 * letterbox. The same paragraph drops the withholding right under Art. 13(3)
 * for the same reason.
 *
 * The rights below are identical because they are statute. The two
 * concessions are not, and this shop makes neither.
 */
const WITHDRAWAL_OWN: Page = {
  key: "/withdrawal",
  h1: "Odstop od pogodbe",
  seoTitle: "Odstop od pogodbe v 14 dneh",
  lead:
    "Kupili ste na daljavo, zato imate štirinajst dni, da si premislite. Razloga " +
    "vam ni treba navesti.",
  metaDescription:
    "Kako vrniti kofeinske vrečke v 14 dneh: od kdaj teče rok, kam pošljete " +
    "izdelek, kdo plača poštnino in kdaj dobite denar nazaj.",
  legal: true,
  blocks: [
    { kind: "imprint", h: "Komu se odstop naslovi" },
    {
      kind: "prose",
      h: "Rok",
      p: [
        "Štirinajst dni teče od dneva, ko izdelek prevzamete vi ali kdo, ki ste ga " +
          "za to pooblastili. Če ste v enem naročilu dobili več pošiljk, teče od " +
          "zadnje. Za obvestilo o odstopu zadošča, da ga pošljete znotraj roka — ni " +
          "treba, da ga v tem času tudi prejmemo.",
      ],
    },
    {
      kind: "steps",
      h: "Kako odstopite",
      items: [
        [
          "Sporočite nam",
          "Zadošča nedvoumna izjava, da odstopate. Uporabite lahko obrazec spodaj, " +
            "ni pa obvezen.",
        ],
        [
          "Pošljete izdelek",
          "Pošljete ga nam najpozneje v štirinajstih dneh od obvestila. Neposredne " +
            "stroške vračila nosite vi — pošiljka te velikosti gre po običajni " +
            "poštni tarifi.",
        ],
        [
          "Vrnemo plačilo",
          "V štirinajstih dneh od obvestila, z istim plačilnim sredstvom, kot ste " +
            "plačali. Plačilo lahko zadržimo, dokler izdelka ne prejmemo nazaj ali " +
            "dokler ne dokažete, da ste ga poslali.",
        ],
      ],
    },
    {
      // ⚠️ THE EXCEPTION THAT ACTUALLY APPLIES TO THIS PRODUCT, and it does not
      // apply to a hot tub at all: a food supplement in a sealed tin is goods
      // sealed for health protection, where the right to withdraw falls away
      // once the seal is broken (ZVPot-1, transposing Art. 16(e) of Directive
      // 2011/83). A shop that stays quiet about it and then refuses a return
      // is a shop arguing with a customer after the fact.
      kind: "prose",
      h: "Kdaj odstop ni mogoč",
      p: [
        "Če je škatlica odprta, odstop ni več mogoč. Gre za živilo v zaprti " +
          "embalaži, kjer pravica do odstopa ugasne, ko je varovalni pečat " +
          "odstranjen — to je izjema, ki jo zakon izrecno predvideva iz " +
          "zdravstvenih razlogov.",
        "Nedotaknjeno in nerazprto škatlico lahko vrnete brez pojasnila.",
      ],
    },
    {
      kind: "prose",
      h: "Obrazec za odstop",
      p: [
        "Obrazec ni obvezen. Če ga želite uporabiti, nam pošljite: da odstopate od " +
          "pogodbe, kaj ste naročili, datum naročila in prevzema, svoje ime in " +
          "naslov ter datum.",
      ],
    },
    {
      kind: "cta",
      h: "Nekaj ni jasno?",
      p: "Pokličite, preden pošljete. Hitreje je za oba.",
      label: "Kontakt",
      href: "/contact",
    },
  ],
};

/**
 * What this shop's price covers. The statutory sections of the terms page are
 * shared with the sibling shop because they are law; this paragraph is the
 * offer, and it is the shop's own.
 */
const CART_OWN = cartPage({
  lead:
    "Spletno plačilo še ni vzpostavljeno. Napišite, kaj potrebujete, in " +
    "odgovorimo s ceno in rokom.",
  metaDescription:
    "Spletno plačilo še ni vzpostavljeno. Naročilo dogovorimo po telefonu ali " +
    "prek obrazca, cena pošiljanja se pove ob naročilu.",
  why:
    "Cene še niso objavljene, ker sestave nismo dokončno potrdili pri " +
    "dobavitelju. Dokler je tako, je pošteneje, da se o količini in ceni " +
    "dogovorimo neposredno, kot da bi vas skozi blagajno peljali do zneska, " +
    "ki se lahko še spremeni.",
});

const TERMS_OWN = termsPage([
  "Cene so v evrih in vključujejo DDV. Nanašajo se na eno škatlico. Stroški " +
    "pošiljanja niso vključeni: povemo jih ob naročilu, ker so odvisni od " +
    "števila škatlic in načina prevzema.",
  "Znesek, ki ga plačate, in vse njegove postavke vidite, preden naročilo " +
    "potrdite. Druge cene ne obračunamo.",
]);

const GUIDES_HUB: Page = {
  key: "/guides",
  h1: "Vodiči o kofeinskih vrečkah",
  seoTitle: "Vodiči o vrečkah",
  lead: "En vodič doslej. Vsak odgovarja na eno vprašanje in nobeden ne prodaja.",
  metaDescription:
    "Vodiči o kofeinskih vrečkah: kako se razlikujejo od nikotinskih, kaj pomeni " +
    "odmerek in kaj pomenijo posamezne snovi na seznamu sestave.",
  blocks: [
    {
      kind: "prose",
      p: [
        "Ta kategorija je v Sloveniji nova in večina tega, kar je o njej mogoče " +
          "prebrati, je prevod oglasa. Vodiči tukaj odgovarjajo na vprašanja, ki jih " +
          "postavljajo kupci, in se držijo tega, kar piše na deklaraciji.",
      ],
    },
    {
      kind: "links",
      h: "Vsi vodiči",
      items: [
        [
          "Kofeinske in nikotinske vrečke: kaj je razlika",
          "/vodic/kofeinske-ali-nikotinske-vrecke",
          "Enaka oblika, druga snov in drugačna zakonodaja — kaj se dejansko " +
            "razlikuje in zakaj to ni isto polico.",
        ],
      ],
    },
  ],
};

const GUIDE_ONE: Page & { slug: string } = {
  slug: "kofeinske-ali-nikotinske-vrecke",
  key: "/guide",
  faqPage: true,
  h1: "Kofeinske in nikotinske vrečke: kaj je razlika",
  seoTitle: "Kofeinske ali nikotinske vrečke — razlika",
  lead:
    "Oblika je ista, snov ni. Ena je poživilo iz kave, druga je nikotin, in to " +
    "ločnico pozna tudi zakon.",
  metaDescription:
    "V čem se kofeinske vrečke razlikujejo od nikotinskih: aktivna snov, " +
    "odvisnost, zakonodaja in kaj piše na deklaraciji.",
  blocks: [
    {
      kind: "prose",
      p: [
        "Obe se položita pod ustnico in obe sta videti enako. Razlika je v tem, kaj " +
          "je notri: v nikotinski vrečki je nikotin, v tej ni. Namesto njega je " +
          blendSummary().toLowerCase() + ", od tega " + CAFFEINE_MG +
          " mg kofeina — približno toliko, kolikor ga ima manjša skodelica kave.",
      ],
    },
    {
      kind: "prose",
      h: "Zakaj to ni ista polica",
      p: [
        "Nikotinski izdelki so v Sloveniji urejeni s tobačno zakonodajo: starostna " +
          "meja, omejitve oglaševanja, opozorila na embalaži. Izdelek brez nikotina " +
          "pod ta režim ne sodi — je prehransko dopolnilo, s svojimi pravili o " +
          "označevanju in o tem, kaj sme prodajalec trditi.",
        "Za kupca to pomeni dvoje. Prvič, tega izdelka ne kupujete zato, da bi " +
          "nehali kaditi, in nihče vam tega tukaj ne bo obljubljal. Drugič, ker ne " +
          "gre za tobačni izdelek, tudi opozorila na škatlici niso ista — kar ne " +
          "pomeni, da vsebine ni treba prebrati.",
      ],
    },
    {
      kind: "qa",
      h: "Pogosta vprašanja",
      items: [
        [
          "Ali kofeinska vrečka povzroča odvisnost kot nikotinska?",
          "Nikotin in kofein sta različni snovi in nista primerljiva po tem, kako " +
            "delujeta. Trditev, da ta izdelek „ne povzroča odvisnosti“, je nekaj, " +
            "česar nismo izmerili, zato je ne objavljamo — objavimo pa, koliko " +
            "kofeina je v vrečki, da lahko presodite sami.",
        ],
        [
          "Ali lahko z njimi neham kaditi?",
          "Tega ne trdimo. To ni izdelek za opuščanje kajenja in ni registriran kot " +
            "tak; kdor išče pomoč pri opuščanju, naj vpraša v lekarni ali pri " +
            "osebnem zdravniku.",
        ],
        [
          "Je odmerek kofeina primerljiv s kavo?",
          "Ena vrečka ima " + CAFFEINE_MG + " mg kofeina po dobaviteljevi " +
            "razpredelnici. Skodelica kave ima običajno nekaj deset miligramov več " +
            "ali manj, odvisno od priprave — natančne primerjave s posamezno kavo " +
            "ne navajamo, ker je odvisna od tega, kdo jo kuha.",
        ],
      ],
    },
    {
      kind: "links",
      h: "Naprej",
      items: [
        ["Celotna sestava", "/compare"],
        ["Vsi okusi", "/products"],
      ],
    },
  ],
};

/* ------------------------------------------------------------- the content */

export const vreckeContent: ShopContent = {
  // Seven, in the order the header renders them.
  nav: ["Okusi", "Sestava", "Vodiči", "Dostava", "Pogosta vprašanja", "O nas", "Kontakt"],
  // "none": the theme's two illustrations are a hot tub and a swim spa, and
  // drawing either beside a tin would be a picture of a different product.
  artKey: "none",
  kicker: "Brez nikotina, brez tobaka",
  // The home page's h1. It carries the head term because that is the one
  // string on the site a search engine weights hardest — and it says what the
  // shop is rather than how it feels.
  h1: "Kofeinske vrečke z izpisano sestavo",
  sub:
    "Šest aktivnih snovi z izpisanimi odmerki, " + POUCHES_PER_TIN +
    " vrečk v škatlici. Kaj je notri, piše do miligrama natančno.",
  cta: "Poglejte sestavo",
  metaDescription:
    "Kofeinske vrečke brez nikotina in tobaka: vsaka snov s svojim odmerkom, " +
    POUCHES_PER_TIN + " vrečk v škatlici. Trgovina se odpira.",
  // ⚠️ THE HUB NEEDS ITS OWN SERP LINE. Without one it inherits the home
  // page's, and two URLs competing with the same description is one of them
  // losing — the audit reports it as an error rather than a preference.
  hubMetaDescription:
    "Vsi okusi na enem mestu, z enako sestavo in enakim številom vrečk. Cene " +
    "objavimo, ko so končne.",
  // The head term is in the brand itself, so the tail states the one thing
  // that separates this shop from the category: the doses are printed.
  // ⚠️ SIXTEEN CHARACTERS, AND THE ARITHMETIC IS THE REASON. The home title
  // renders as plural + " — " + this + " | " + name: 19 + tail + 25. Google
  // stops drawing at about 60, so the tail has 16. The squeeze is the
  // placeholder brand repeating the category — a shorter registered name
  // ("Zagon" alone would be 8) hands this line back 14 characters.
  homeTitleTail: "odmerki izpisani",
  membershipBody:
    "Ko trgovino odpremo, to napišemo tistim, ki so vprašali. Nobenega drugega " +
    "sporočila ne pošiljamo.",
  blogLead: "Zapisi o tem, kaj je v vrečkah in kako se ta kategorija ureja.",
  blogMetaDescription:
    "Zapisi o kofeinskih vrečkah: sestava, označevanje in razlike med izdelki, " +
    "ki so si na polici podobni.",
  // The shop has no colour swatch to send; the field is required by the type
  // and this is the enquiry a visitor of THIS shop would actually write.
  swatchMessage: "Prosim za podatke o sestavi in ceni.",
  stockLabels: { inStock: "Na zalogi", toOrder: "Po naročilu" },
  trust: [
    "Sestava izpisana po miligramih",
    "Brez nikotina in brez tobaka",
    "Slovensko podjetje z naslovom",
  ],
  stats: [
    [String(ACTIVES.length), "aktivnih snovi"],
    [CAFFEINE_MG + " mg", "kofeina na vrečko"],
    [String(POUCHES_PER_TIN), "vrečk v škatlici"],
    ["0 mg", "nikotina"],
  ],
  products: FLAVOURS.map((f) => ({
    name: f.name,
    desc: f.note,
    meta: blendSummary(),
    price: f.priceCents > 0 ? "" : PRICE_UNSET,
    art: "none" as const,
    slug: f.slug,
  })),
  moat: {
    h2: "Zakaj je ta stran še zaprta",
    steps: [
      ["Sestava", "Dobaviteljevo gradivo si pri kofeinu nasprotuje. Čakamo pisno potrditev."],
      ["Označevanje", "Kaj mora pisati na škatlici in na strani, uskladimo, preden prodajamo."],
      ["Cene", "Objavimo jih, ko so končne. Začasna cena je obljuba, ki se pozneje prelomi."],
    ],
    claim: ["Odprto, ko bo troje potrjeno", "Ne prej"],
  },
  // ⚠️ EMPTY, AND IT OSTAJA EMPTY UNTIL SOMEBODY KUPI IN NAPIŠE. See the note
  // on ShopContent.reviews: a review nobody wrote is Priloga I, 23c.
  reviews: [],
  guides: [
    ["Vodič", "Kofeinske ali nikotinske vrečke: kaj je razlika?", "kofeinske-ali-nikotinske-vrecke"],
  ],
  pages: [ABOUT, CONTACT, COMPOSITION, DELIVERY, FAQ, GUIDES_HUB, WITHDRAWAL_OWN, TERMS_OWN, CART_OWN, ...UNIVERSAL_PAGES],
  guidePages: [GUIDE_ONE],
  pdp: PDPS[0]!,
  pdps: PDPS,
  footNote:
    "Prehransko dopolnilo ni nadomestilo za uravnoteženo prehrano. Izdelek " +
    "vsebuje kofein.",
};
