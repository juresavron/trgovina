import type { GuidePage } from "../pages";
import {
  priceRangeText,
  reheatHoursText,
  reheatKWhText,
  tubAddonRangeText,
  tubAreaListText,
  tubCountLeadText,
  tubFootprintListText,
  tubHeightRangeText,
  tubLitreRangeText,
  tubLoadRangeText,
  tubFilterAreaText,
  tubJetPumpLines,
  tubJetsPerPumpRangeText,
  tubLitreSpanText,
  tubMaxLitresText,
  tubSeatingLines,
} from "../price-range";

/**
 * THE BUYING GUIDES, EACH AT ITS OWN URL.
 *
 * ⚠️ THEY USED TO BE THREE SECTIONS OF ONE PAGE, AND THAT COST THE WHOLE
 * LADDER. /vodniki was 375 words carrying all three, with one <title>
 * ("Vodniki"), one h1 ("Vodniki") and one URL — so the three queries
 * docs/SEO.md §1 names as the topical-authority mechanism ("masažni bazen na
 * terasi", "koliko stane masažni bazen", "masažni bazen pozimi") had no page
 * to rank. None of those strings appeared in the title, the h1 or the URL.
 * Worse, the shop's config has carried a "/guide" segment (/vodnik) from the
 * start and NOTHING was ever routed at it: /vodnik and /vodnik/x both 404'd.
 *
 * Now each guide is a page. The bodies are the same words, moved rather than
 * rewritten — the only edits are the ones the audits asked for, marked where
 * they occur — and each one takes the section heading it already had as its
 * h1, plus a title and a description built around the query it answers.
 *
 * /vodniki stays as the index that links to them, which is what the home
 * page's three cards have always pointed at.
 */

/** One guide, at /vodnik/<slug>. */
export const GUIDE_PAGES: readonly GuidePage[] = [
  {
    slug: "masazni-bazen-na-terasi",
    key: "/guide",
    // The qa block below is eligible for an FAQ rich result; worker.ts reads
    // this opt-in flag exactly as it does for /pogosta-vprasanja.
    faqPage: true,
    h1: "Masažni bazen na terasi: kaj preveriti pred nakupom",
    seoTitle: "Masažni bazen na terasi: kaj preveriti pred nakupom",
    lead:
      // The model is the LAST of the four, and saying so as "model je zadnja
      // od njih" made the reader resolve a feminine adjective against a
      // masculine noun by way of an elided "stvar". The ordinal says it
      // outright and reads faster.
      "Štiri stvari po vrsti, in model je četrta: podlaga, pot do lokacije, " +
      "elektrika in šele nato izbira bazena.",
    metaDescription:
      "Masažni bazen na terasi: nosilnost podlage, širina poti, električni priklop in " +
      "kaj preveriti, preden izberete model. Ogled lokacije je brezplačen.",
    blocks: [
    {
      // ⚠️ THE HEADING IS WHAT KEEPS THE OUTLINE WHOLE. A steps block renders
      // its item titles as h3, which is right on /dostava-in-montaza and
      // /ogled-lokacije because an h2 section heading precedes it there. Here
      // the steps ARE the article, so the page went h1 straight to four h3s
      // — the only skipped heading level on the site. The other two guides
      // are h1 followed by h2s and were already clean.
      //
      // It earns its place editorially too: four numbered items hanging
      // directly off the title had nothing framing them, and the lead
      // promises an order ("štiri stvari po vrsti") that nothing then named.
      h: "Kaj preveriti, po vrsti",
      kind: "steps",
      items: [
        [
          "Podlaga, ne model",
          "Napolnjen masažni bazen tehta od 1.500 do 2.210 kilogramov, z ljudmi v njem pa " +
            "še nekaj sto več; napolnjen swim spa od 5.750 do 8.490 kilogramov. Betonska " +
            // ⚠️ "brez razmisleka" TOLD A READER NOT TO CHECK, about 2.210 kg plus
            // bathers on a slab of unstated thickness over unstated ground. It
            // was the only sentence on the site that did; every other surface
            // hedges ("ali to velja za vašo lokacijo, preverimo ob ogledu").
            "plošča navadno ni sporna, lesena terasa in balkon pa pogosto sta, in to " +
            "je stvar konstrukcije, ne občutka.",
        ],
        [
          "Pot do lokacije",
          "Izmerite najožje mesto na poti: vrata, prehod med hišo in ograjo, ovinek na " +
            "stopnišču. Bazen se prenaša postrani, a širina školjke je fizična meja, ki se " +
            "je ne da obiti.",
        ],
        [
          "Elektrika",
          "Bazen potrebuje svoj odklopnik in zaščitno stikalo; koliko natanko, je odvisno " +
            "od grelca in števila črpalk v modelu. Za vsak model damo pisna navodila, ki " +
            "jih vaš električar preprosto izvede.",
        ],
        [
          "Šele nato model",
          "Koliko oseb, koliko šob, kakšna ležalna pozicija. Ta izbira je prijetna in jo " +
            "lahko naredite v miru; prve tri točke pa določijo, kaj je sploh mogoče.",
        ],
      ],
    },
    // ⚠️ THE GUIDE TOLD THE READER A TOTAL AND LEFT THEM THE DIVISION. Step
    // one above says a full tub weighs 1.500-2.210 kg and that a wooden deck
    // "je stvar konstrukcije, ne občutka" — correct, and unusable: nobody
    // can take a total mass to a builder, because what a builder works in is
    // load per square metre. That division needed two numbers off two
    // different pages, so in practice nobody did it.
    //
    // Every figure below is derived from catalog/pola.ts (see price-range.ts)
    // rather than typed, for the reason the price range already is: this is
    // the page most likely to be read for the number, so it is the worst page
    // to leave a stale one on.
    {
      kind: "prose",
      h: "Koliko je to na kvadratni meter",
      p: [
        "Skupna teža sama pove malo — 2.210 kilogramov je veliko na balkonu in nič " +
          "posebnega na betonski plošči. Uporabna postane, ko jo razdelite na površino, " +
          "na kateri bazen stoji. " + tubCountLeadText() + " " + tubAreaListText() +
          " kvadratnega metra, kar pri polni vodi pomeni " + tubLoadRangeText() +
          " kilogramov na kvadratni meter — in to preden vanj kdo stopi. Pet odraslih " +
          "po 80 kilogramov doda še 400.",
        "Obremenitev je porazdeljena po dnu školjke in ni točkovna, a ohišje tudi ni " +
          "plošča. Betonska plošča na terenu to navadno prenese brez vprašanj. Pri " +
          "leseni terasi in balkonu odloča konstrukcija pod desko — nosilci, njihov " +
          "razpon in način pritrditve — in tega z gledanjem ne oceni nihče.",
        "Zato je ta številka namenjena naprej: vzemite jo s seboj k izvajalcu, ki je " +
          "teraso naredil, ali k statiku. Ob ogledu lokacije pogledamo, kod bo bazen " +
          "prišel in kje bo stal; nosilnost lesene konstrukcije pa je vprašanje za " +
          "tistega, ki jo je načrtoval, in naša ocena na oko tega ne nadomesti.",
      ],
    },
    // The access step above says "izmerite najožje mesto" and names no number
    // to measure against, which leaves the reader with a tape measure and no
    // target. These are the targets, and they are the same three dimensions
    // the model pages publish.
    {
      kind: "prose",
      h: "Katere tri mere nam povejte",
      p: [
        "Bazen pride do mesta postavitve v enem kosu. Školjke merijo " +
          tubFootprintListText() + ", visoke pa so " + tubHeightRangeText() +
          " centimetrov. Ko gre postrani skozi ozko mesto, ni merodajna njena širina, " +
          "ampak višina: odprtina mora preseči tistih " + tubHeightRangeText() +
          " centimetrov in še nekaj za roke. V ovinku in na stopnišču pa šteje " +
          "daljša stranica.",
        "Tri meritve nam povedo največ: najožje mesto na poti, najnižja ovira nad njo " +
          "(nadstrešek, veja, garažna vrata) in najtesnejši ovinek. Prehod čez ograjo " +
          "ali po stopnicah ni izključen, treba pa je zanj vedeti vnaprej — to je " +
          "razlika med pripravljenim in improviziranim dnem dostave.",
      ],
    },
    // ⚠️ THE FIRST qa BLOCK ON A GUIDE, AND IT IS WHY faqPage IS SET. Three
    // questions that the FAQ page does NOT ask: it has "Kam lahko postavim
    // masažni bazen?" and answers it with the total weight, which is the
    // answer this guide exists to go past. Two pages answering one question
    // is how a site outranks itself; two pages answering a question and its
    // follow-up is the ladder docs/SEO.md describes.
    {
      kind: "qa",
      h: "Pogosta vprašanja o postavitvi",
      items: [
        [
          "Koliko kilogramov na kvadratni meter pomeni poln masažni bazen?",
          "Pri naših treh modelih " + tubLoadRangeText() + " kilogramov na kvadratni " +
            "meter, preden vanj kdo stopi. Razlika med modeli je majhna, ker z večjo " +
            "školjko raste tudi površina, na kateri stoji.",
        ],
        [
          "Kdo presodi, ali lesena terasa zdrži?",
          "Izvajalec, ki je teraso naredil, ali statik — na podlagi konstrukcije pod " +
            "desko, ne videza. Mi ob ogledu pogledamo dostop in mesto postavitve; " +
            "presoje nosilnosti lesene konstrukcije ne opravljamo.",
        ],
        [
          "Kako široka mora biti pot do mesta postavitve?",
          "Školjka se prenaša postrani, zato mora najožje mesto preseči njeno višino, " +
            "torej " + tubHeightRangeText() + " centimetrov in še nekaj za roke. V " +
            "ovinku šteje daljša stranica; mere vseh treh školjk so " +
            tubFootprintListText() + ".",
        ],
      ],
    },
    // ⚠️ THE GUIDES PASSED NOTHING ON. All three ended on the same contact
    // panel and linked to not one model page, so the topical-authority ladder
    // docs/SEO.md describes carried a reader — and a crawler — to a form
    // rather than to the catalogue it exists to sell. This block is the rung.
    //
    // The three tubs and not the swim spas: this guide is about a TERRACE,
    // and a swim spa is 5,80 m on a concrete slab in the garden. Naming it
    // here would be an answer to a question the page did not ask.
    {
      kind: "links",
      h: "Kje so mere in teže",
      items: [
        ["BAZEN 195", "/bazen/mali-195"],
        ["BAZEN 210", "/bazen/srednji-210"],
        ["BAZEN 230", "/bazen/veliki-230"],
        ["Primerjava obeh družin", "/primerjava"],
        ["Dostava in montaža", "/dostava-in-montaza"],
        ["Brezplačen ogled lokacije", "/ogled-lokacije"],
      ],
    },
    {
      kind: "cta",
      h: "Ostalo vprašanje?",
      p: "Na vprašanja o dostopu, podlagi in priklopu odgovorimo po telefonu, brez obveznosti.",
      label: "Kontakt",
      href: "/kontakt",
    },
    ],
  },
  {
    slug: "koliko-stane-masazni-bazen",
    key: "/guide",
    // The qa block below is eligible for an FAQ rich result; worker.ts reads
    // this opt-in flag exactly as it does for /pogosta-vprasanja.
    faqPage: true,
    h1: "Koliko stane masažni bazen",
    seoTitle: "Koliko stane masažni bazen — cena in obratovanje",
    lead:
      "Nakupna cena, kaj je v njej in kaj ni, in zakaj mesečnega zneska za " +
      "obratovanje nihče ne more pošteno napovedati.",
    metaDescription:
      "Koliko stane masažni bazen: modeli od 6.690 do 21.690 EUR z DDV, kaj cena " +
      "vključuje, kaj se obračuna po ponudbi in od česa je odvisno obratovanje.",
    blocks: [
    {
      kind: "prose",
      // The site's only three-line h2 stair-stepped 20/12/14 characters at
      // every width. The dropped subtitle is the first sentence's job anyway.
      p: [
        // ⚠️ THE RANGE IS STATED HERE, AND IT USED TO BE WITHHELD. This is the
        // page that answers "koliko stane masažni bazen", and its whole first
        // paragraph was a redirect: "Nakupna cena modela je na strani vsakega
        // modela." A guide that refuses the number in its own title cannot
        // rank for it and does not help the reader who typed it.
        //
        // The monthly OPERATING figure stays withheld two paragraphs down, and
        // that refusal is right — it depends on use, temperature, cover and
        // tariff, none of which the shop knows. The purchase range does not
        // depend on any of them; it is on the shop's own price list.
        //
        // ⚠️ AND IT IS DERIVED, NOT TYPED. priceRangeText() reads the offered
        // models, so a price change moves this sentence with it rather than
        // leaving a stale figure on the page that ranks for the query.
        "Masažni bazeni stanejo " + priceRangeText("tub") + " z DDV, swim spa bazeni " +
          priceRangeText("swim") + " z DDV; cena vsakega modela je na njegovi strani. " +
          "V ceni so ogled lokacije, zagon in predaja; dostavo obračunamo po ponudbi, ker je " +
          "odvisna od naslova in dostopa. Cena ne vključuje priprave podlage in " +
          "elektroinštalacije na vaši strani.",
        "Pri obratovanju sta glavni postavki ogrevanje in filtracija. Obe sta odvisni od stvari, " +
          "ki jih ne moremo napovedati namesto vas: kako pogosto bazen uporabljate, na kateri " +
          "temperaturi ga držite, kako dobro je pokrit in kakšna je vaša cena elektrike. Zato " +
          "nikjer ne navajamo mesečnega zneska; vsaka taka številka bi bila ugibanje.",
        "Kar zanesljivo drži: dobro pokrit bazen porabi bistveno manj kot slabo pokrit, zato je " +
          "termo pokrov prvi in ne zadnji dodatek.",
      ],
    },
    // ⚠️ THE PAGE NAMED A RANGE AND NEVER SAID WHAT MOVES INSIDE IT. A reader
    // who has just been told the three tubs run from one figure to another
    // asks the obvious next question — why — and the guide sent them to three
    // spec tables to work it out. The answer is two facts, and neither is a
    // price: the pump count and the jet count. Stated here, no euro figure
    // goes stale, and the model pages keep the numbers that do move.
    {
      kind: "prose",
      h: "Kaj loči tri masažne bazene po ceni",
      p: [
        "Med modeloma BAZEN 195 in BAZEN 210 se školjka poveča, vode je za 300 litrov " +
          "več in šobi sta dve več — masažna črpalka je pri obeh ena. Med 210 in 230 je " +
          "spet 300 litrov več, a šob je trinajst več in črpalki sta dve namesto ene. " +
          "Zato je drugi korak v ceni večji od prvega: plača se druga črpalka, ne " +
          "dodatni centimetri.",
        "Kar je pri vseh treh enako: 3-kilovatni grelec, krmilnik Balboa, filter z " +
          "9,3 kvadratnega metra površine, školjka iz ameriškega akrila z dvema " +
          "centimetroma izolacije in tri leta garancije. Cena ne kupuje boljše " +
          "tehnike, ampak več prostora in več šob.",
        "Swim spa bazeni so druga kategorija in ne le večji model: stanejo " +
          priceRangeText("swim") + " z DDV, ker so daljši, težji in držijo nekajkrat " +
          "več vode. Če je namen plavanje in ne masaža, je primerjava po ceni z " +
          "masažnim bazenom primerjava dveh različnih stvari.",
      ],
    },
    {
      kind: "prose",
      h: "Dodatna oprema",
      p: [
        "Dodatki so na strani vsakega modela, s ceno ob vsaki postavki, in se sproti " +
          "seštevajo v skupni znesek — nič se ne odkrije šele v ponudbi. Posamezne " +
          "postavke gredo " + tubAddonRangeText() + " z DDV, od LED slapa do termo " +
          "pokrova, ki je največja med njimi in tudi edina, ki se pozna pri " +
          "obratovanju.",
        "Kaj od tega je smiselno, je odvisno od tega, kje bazen stoji in kdaj ga " +
          "uporabljate. Ni pa nobeden od dodatkov pogoj za delovanje: bazen deluje s " +
          "tem, kar je v osnovni ceni.",
      ],
    },
    // The FAQ page asks "Kaj je vključeno v ceno modela?" and answers it. It
    // does NOT ask any of these three, which are the questions that follow.
    {
      kind: "qa",
      h: "Pogosta vprašanja o ceni",
      items: [
        [
          "Zakaj je razlika med 210 in 230 večja kot med 195 in 210?",
          "Ker BAZEN 230 dobi drugo masažno črpalko in trinajst šob več, medtem ko je " +
            "korak z 195 na 210 predvsem večja školjka z dvema šobama več. Vode je pri " +
            "obeh korakih za 300 litrov več.",
        ],
        [
          "Koliko stanejo posamezni dodatki?",
          "Od " + tubAddonRangeText().replace("od ", "") + " z DDV, odvisno od modela " +
            "in postavke. Cena vsake je izpisana ob njej na strani modela, skupni " +
            "znesek pa se sešteva sproti.",
        ],
        [
          "Ali je cena na strani modela z DDV?",
          "Da. Vse cene na tej strani in na straneh modelov so z DDV in enake za vse " +
            "obiskovalce. Kar se obračuna posebej, je dostava, ker je odvisna od " +
            "naslova in dostopa; znesek je v pisni ponudbi.",
        ],
      ],
    },
    // The prices this page talks about, on the pages that state them. A guide
    // that names a range and then offers only a contact form makes the reader
    // search for the figure it just promised.
    {
      kind: "links",
      h: "Cena po modelih",
      items: [
        ["Vsi modeli in cene", "/trgovina"],
        ["BAZEN 195", "/bazen/mali-195"],
        ["BAZEN 210", "/bazen/srednji-210"],
        ["BAZEN 230", "/bazen/veliki-230"],
        ["SWIM 450", "/bazen/swim-450"],
        ["SWIM 580 HIDRO", "/bazen/swim-580-hidro"],
        ["SWIM 580 MAXI", "/bazen/swim-580-maxi"],
      ],
    },
    {
      kind: "cta",
      h: "Ostalo vprašanje?",
      p: "Na vprašanja o dostopu, podlagi in priklopu odgovorimo po telefonu, brez obveznosti.",
      label: "Kontakt",
      href: "/kontakt",
    },
    ],
  },
  {
    slug: "velikost-masaznega-bazena",
    key: "/guide",
    faqPage: true,
    h1: "Katera velikost masažnega bazena",
    // 60 characters is where Google stops drawing a title and the brand is
    // nine of them, so the head is at most 51. "koliko prostora" was in here
    // and took the rendered line to 67; the description carries it instead.
    seoTitle: "Velikost masažnega bazena — koliko oseb",
    lead:
      // ⚠️ THE LEAD STATES THE COUNTER-INTUITION, because it is the reason the
      // page exists. A reader who already believes bigger means more people
      // does not need a guide; they need the models, and those are one click
      // away. This one is for the reader whose intuition is about to cost
      // them the wrong tub.
      "Več sedežev ni večji bazen. Pri nas sedi največ ljudi v srednjem modelu, " +
      "ne v največjem.",
    metaDescription:
      "Velikost masažnega bazena: koliko oseb sprejme kateri model, koliko " +
      "kvadratnih metrov zasede in zakaj največji bazen ni tisti z največ sedeži.",
    blocks: [
    {
      kind: "prose",
      p: [
        "Velikost masažnega bazena se meri na tri načine in vsi trije odločajo o " +
          "nečem drugem: koliko ljudi gre vanj hkrati, koliko prostora zasede pri " +
          "vas doma, in koliko vode je treba greti. Redko se izidejo v isto smer.",
      ],
    },
    {
      kind: "prose",
      h: "Trije modeli, drug ob drugem",
      p: [
        // Derived from the catalogue — see tubSeatingLines() on why this is
        // not typed out.
        ...tubSeatingLines("sl-SI"),
        // ⚠️ THIRTEEN, NOT HALF AGAIN. This said the biggest tub carries
        // polovico več šob than the other two: it carries 50 against 37 and
        // 35, which is 35% and 43% more. The figure the cost guide states is
        // the difference itself and vodnik.test.ts already pins it, so the
        // sentence now says the number two pages agree on instead of a
        // fraction that flattered it.
        "Srednji model sprejme največ ljudi. Največji ima namesto šestega sedeža " +
          "drugi ležalnik in trinajst šob več od srednjega modela. To ni pomanjkljivost " +
          "in ni napaka v ponudbi: ležalnik zasede prostor dveh sedečih mest, ker se v " +
          "njem leži.",
      ],
    },
    {
      kind: "prose",
      h: "Koliko prostora zasede",
      p: [
        tubCountLeadText() + " " + tubAreaListText() + " kvadratnega metra, visoki " +
          "pa so od " + tubHeightRangeText() + " centimetrov. To je mera školjke in " +
          "ne mera prostora, ki ga potrebujete: okoli bazena je treba priti do vseh " +
          "štirih strani, pokrov se odpira navzgor in nazaj, servisna vratca pa " +
          "zahtevajo dostop do ene stranice.",
        "Zato je uporabna mera tista, ki jo izmerimo pri vas, ne tista v " +
          "katalogu. Ogled lokacije je brezplačen in traja pol ure.",
      ],
    },
    {
      kind: "prose",
      h: "Koliko vode in kaj to pomeni",
      p: [
        "Modeli držijo " + tubLitreRangeText() + " litrov. Razlika med najmanjšim " +
          "in največjim je približno tretjina prostornine, in to je edina številka " +
          "med naštetimi, ki se pozna vsak mesec: več vode pomeni več vode za greti " +
          "in večjo gladino, skozi katero toplota uhaja.",
        "Koliko to znese v elektriki, je vprašanje zase — odgovor je v vodniku o " +
          "ceni in obratovanju.",
      ],
    },
    {
      kind: "qa",
      h: "Pogosta vprašanja o velikosti",
      items: [
        [
          "Kateri model sprejme največ oseb?",
          "Srednji, BAZEN 210, s šestimi sedeži. Največji model, BAZEN 230, jih ima " +
            "pet, ker ima namesto šestega sedeža drugi ležalnik.",
        ],
        [
          "Koliko prostora moram imeti okoli bazena?",
          "Toliko, da pridete do vseh štirih strani in da se pokrov odpre navzgor in " +
            "nazaj. Koliko je to pri vas, izmerimo na brezplačnem ogledu — odvisno je " +
            "od tega, kje bazen stoji in s katere strani je servisna stranica.",
        ],
        [
          "Ali je manjši bazen cenejši za obratovanje?",
          "Ima manj vode za greti in manjšo gladino, skozi katero toplota uhaja, zato " +
            "praviloma da. Kolikšna je razlika pri vas, je odvisno od pokrova, mesta " +
            "postavitve in tega, kako pogosto se bazen uporablja.",
        ],
      ],
    },
    {
      kind: "links",
      h: "Naprej",
      items: [
        ["Vsi trije modeli s cenami", "/products"],
        // ⚠️ THE GUIDE'S OWN PATH, NOT ITS ROUTE KEY. resolveHref() resolves an
        // href that IS a key ("/products" -> "/trgovina") and hands back
        // anything else as written — so "/guide/koliko-stane-masazni-bazen",
        // which only LOOKS like a key with a slug on it, rendered verbatim and
        // 404'd. Both of these shipped dead. The sibling guides and the hub
        // have always written the resolved path, and links.test.ts now walks
        // the site so the next one cannot ship.
        ["Koliko stane masažni bazen", "/vodnik/koliko-stane-masazni-bazen"],
        ["Masažni bazen na terasi", "/vodnik/masazni-bazen-na-terasi"],
      ],
    },
    {
      kind: "cta",
      h: "Ne veste, kateri model gre k vam?",
      p: "Pridemo pogledat, izmerimo pot in podlago in povemo, kateri modeli pridejo " +
        "v poštev. Ogled je brezplačen in vas k ničemur ne zavezuje.",
      href: "/kontakt",
      label: "Naročite brezplačen ogled",
    },
    ],
  },
  {
    slug: "masazni-bazen-pozimi",
    key: "/guide",
    // The qa block below is eligible for an FAQ rich result; worker.ts reads
    // this opt-in flag exactly as it does for /pogosta-vprasanja.
    faqPage: true,
    h1: "Masažni bazen pozimi",
    // ⚠️ "STROŠKI" IS GONE FROM THIS TITLE, and it was the only place the
    // word appeared on this page. The body says the bazen works better in
    // winter and that draining it is a mistake; it does not carry one figure
    // or one sentence about what it costs. A title that promises a third
    // subject the page never reaches is a pogo-stick result, and it put this
    // guide in competition with the cost guide, which does answer it.
    seoTitle: "Masažni bazen pozimi — delovanje in praznjenje",
    lead:
      // ⚠️ "PRIDE NA SVOJ RAČUN", NOT "JE NA SVOJEM". Biti na svojem means to
      // be on one's own land, or to insist on one's own view — neither of
      // which is "comes into its own", which is the sentence this wanted.
      "Pozimi masažni bazen pride na svoj račun. Praznjenje čez zimo je pogosta " +
      "napaka, ne previdnost.",
    metaDescription:
      "Masažni bazen pozimi: zakaj deluje bolje kot poleti, kaj naredi pokrov in " +
      "zakaj je prazen bazen v mrazu bolj ogrožen kot poln.",
    blocks: [
    {
      kind: "prose",
      p: [
        "Bazen pozimi dela in se uporablja. To je zanj najboljši letni čas. Voda ostane topla, " +
          "izolacija školjke in pokrov pa opravita večino dela.",
        "Praznjenje čez zimo je pogosta napaka. Prazen bazen v mrazu je bolj ogrožen kot poln " +
          "in delujoč, ker v ceveh in črpalkah ostane voda. Če bazena res ne boste " +
          "uporabljali, mora biti za zimo pravilno pripravljen. Povejte nam, pa vam razložimo " +
          "postopek za vaš model.",
      ],
    },
    // ⚠️ THE PAGE ASSERTED THE CONCLUSION AND NEVER SHOWED THE MECHANISM. It
    // said the shell's insulation and the cover "opravita večino dela" and
    // stopped — which is exactly the sentence a reader has already read on
    // four other sites, and the one they cannot check. What is checkable is
    // in the spec table of every model on this site: the shell, the heater,
    // the circulation pump and the surface the cover has to cover.
    {
      kind: "prose",
      h: "Kaj v resnici drži vodo toplo",
      p: [
        "Tri stvari, in vse tri so v specifikaciji vsakega modela. Školjka je iz " +
          "ameriškega akrila z dvema centimetroma izolacije. Grelec je 3-kilovatni pri " +
          "vseh treh modelih. Obtočna črpalka 0,35 KM pa vodo ves čas premika skozi " +
          "filter, tudi kadar masažne šobe mirujejo — voda v delujočem bazenu nikoli " +
          "ne stoji.",
        "Največ toplote uide skozi gladino, zato o porabi pozimi odloča pokrov in ne " +
          "grelec. Pokriti je treba " + tubAreaListText() + " kvadratnega metra, " +
          "odvisno od modela; to je edina ploskev, ki vodo ločuje od zunanjega zraka, " +
          "in odkrit bazen jo greje neprekinjeno.",
      ],
    },
    {
      kind: "prose",
      h: "Zakaj izklop ni prihranek",
      p: [
        "Bazen drži " + tubLitreRangeText() + " litrov vode. Segreti " +
          tubMaxLitresText() + " litrov za trideset stopinj — približno iz zimske " +
          "vodovodne vode do kopalne temperature — pomeni okoli " + reheatKWhText() +
          " kilovatnih ur, kar s 3-kilovatnim grelcem traja vsaj " + reheatHoursText() +
          " ur, preden odštejete izgube med samim segrevanjem. Tega ni mogoče " +
          "pospešiti; grelec je toliko močan, kot je.",
        "Zato izklop ni prihranek, ampak zamenjava: majhna dnevna poraba pokritega " +
          "bazena se zamenja za en dolg cikel, ki ga je treba načrtovati dan vnaprej. " +
          "Za bazen, ki se uporablja, se to ne izide.",
        // ⚠️ THIS PARAGRAPH USED TO RESTATE THE ONE AT THE TOP OF THE PAGE,
        // almost word for word — "prazen bazen v mrazu je bolj ogrožen kot poln
        // in delujoč, ker voda ostane v ceveh in črpalkah", twice on one
        // screen. It draws the distinction and leaves the argument where it
        // was already made.
        "Ločnica, ki se pogosto zabriše: izklop in praznjenje nista isto. Prvo je " +
          "vprašanje ekonomike in odgovor je zgoraj. Drugo je vprašanje tveganja in " +
          "je opisano v uvodu te strani — bazen, ki res ne bo delal, je treba za zimo " +
          "pripraviti, ne le izprazniti.",
      ],
    },
    {
      kind: "qa",
      h: "Pogosta vprašanja o zimi",
      items: [
        [
          "Kako dolgo traja, da se ohlajen bazen spet segreje?",
          "Pri največjem modelu vsaj " + reheatHoursText() + " ur: " +
            tubMaxLitresText() + " litrov, trideset stopinj razlike in 3-kilovatni " +
            "grelec so okoli " + reheatKWhText() + " kilovatnih ur. Z izgubami med " +
            "segrevanjem je to še dlje.",
        ],
        [
          "Kaj se zgodi, če bazen pozimi izklopim?",
          "Voda se ohladi in nič je ne premika. Nevarnost ni v školjki, ampak v " +
            "ceveh, črpalkah in grelcu, kjer voda ostane. Bazen naj pozimi dela; če " +
            "ne bo delal, mora biti pripravljen za zimo, in to ni isto kot izklop.",
        ],
        [
          "Ali je pokrov pozimi res tako pomemben?",
          "Je edina stvar med toplo vodo in zunanjim zrakom, in pokriti mora " +
            tubAreaListText() + " kvadratnega metra, odvisno od modela. Grelca ni " +
            "mogoče izbrati močnejšega; pokrov je edina postavka, pri kateri se " +
            "poraba pozimi res spremeni.",
        ],
      ],
    },
    // ⚠️ THE COST QUESTION GOES TO THE PAGE THAT ANSWERS IT. This guide's
    // title used to promise "stroški" and its body has never contained a
    // figure or a sentence about cost — the cost guide does, and two pages
    // competing for the same query is how a site outranks itself.
    {
      kind: "links",
      h: "Naprej",
      items: [
        ["Koliko stane masažni bazen", "/vodnik/koliko-stane-masazni-bazen"],
        ["Vsi modeli in cene", "/trgovina"],
        ["Pogosta vprašanja", "/pogosta-vprasanja"],
      ],
    },
    {
      kind: "cta",
      h: "Ostalo vprašanje?",
      p: "Na vprašanja o dostopu, podlagi in priklopu odgovorimo po telefonu, brez obveznosti.",
      label: "Kontakt",
      href: "/kontakt",
    },
    ],
  },
  {
    slug: "vzdrzevanje-masaznega-bazena",
    key: "/guide",
    // The qa block below is eligible for an FAQ rich result; worker.ts reads
    // this opt-in flag exactly as it does for /pogosta-vprasanja.
    faqPage: true,
    h1: "Vzdrževanje masažnega bazena",
    // 51 characters is the head's budget (60 less the nine-character brand),
    // and this is 46.
    seoTitle: "Vzdrževanje masažnega bazena: kaj je res treba",
    lead:
      // ⚠️ THE LEAD SPLITS THE JOB IN TWO, because that split is the answer.
      // The query behind this page is really "how much work is it", and the
      // useful reply is that most of it is not work at all: the filtration
      // runs whether or not anybody thinks about it, and what is left is a
      // short list. A lead that promised tips would be the fourth such page
      // in the results and the reader would learn nothing from ours.
      "Filtriranje teče samo. Vam ostanejo kemija vode, filtrski vložek in pokrov " +
      "— in ta seznam je pri vseh treh modelih enak.",
    metaDescription:
      "Vzdrževanje masažnega bazena: kaj opravi obtočna črpalka s filtrom, kaj " +
      "ostane vam in zakaj je pri večjem modelu dela enako, vode pa več.",
    blocks: [
    {
      kind: "prose",
      p: [
        "Vzdrževanje masažnega bazena je krajši seznam, kot si ga večina " +
          "predstavlja, in razpade na dvoje: na tisto, kar bazen dela sam, in na " +
          "tisto, kar naredite vi. Prvo teče, dokler ima bazen elektriko, in ga ni " +
          "treba načrtovati. Drugo je kratek, a reden opravek.",
        "Kateri model imate, na ta seznam skoraj ne vpliva. Tehnika je pri vseh " +
          "treh naših modelih ista; drugačna je količina vode, ki gre skoznjo.",
      ],
    },
    {
      // ⚠️ THE FILTER AREA IS THE FACT THIS PAGE IS BUILT ON, and it is in the
      // spec table of every model on the site without ever having been
      // explained. It is also the one figure that makes the maintenance
      // question answerable in a sentence: the cartridge does not get bigger
      // with the tub, so the work does not either.
      kind: "prose",
      h: "Kaj bazen naredi sam",
      p: [
        "Bazen filtrira sam. Obtočna črpalka teče ločeno od masažnih šob in vodo " +
          "vleče skozi filtrski vložek, tudi kadar bazen miruje. Ta del " +
          "vzdrževanja se zgodi brez vas.",
        // Derived from the catalogue — see tubFilterAreaText() on why the
        // whole sentence is derived and not just the number in it.
        tubFilterAreaText("sl-SI") + " Vložek je torej isti, ne glede na to, kateri " +
          "model izberete. Vode pa ni enako: modeli držijo " + tubLitreRangeText() +
          " litrov, kar je " + tubLitreSpanText() + " litrov razlike med skrajnima " +
          "modeloma skozi enako veliko filtrirno površino.",
      ],
    },
    {
      kind: "steps",
      h: "Kaj ostane vam",
      items: [
        [
          "Kemija vode",
          "Filter zadrži delce; vsega, kar pride v vodo z ljudmi, ne. Za to sta " +
            "dezinfekcija in uravnavanje kislosti vode. Tega dela z dražjim modelom ni " +
            "mogoče odpraviti — pri vseh treh je enak.",
        ],
        [
          "Filtrski vložek",
          "Vložek se občasno spere in sčasoma zamenja. Kako pogosto, je odvisno od " +
            "tega, koliko se bazen uporablja in koliko ljudi je v njem, ne od " +
            "modela: filtrirna površina je pri vseh treh enaka.",
        ],
        [
          "Pokrov",
          "Pokrov ni samo toplotna izolacija. Kar v vodo ne pade, ni treba " +
            "filtrirati, zato pokrit bazen ostane čist dlje. Pri vzdrževanju se ga " +
            "podcenjuje enako pogosto kot pri porabi.",
        ],
        [
          "Dostop do tehnike",
          "Do črpalk, grelca in filtra se pride skozi servisno stranico ohišja. " +
            "Bazen, postavljen tesno ob zid s te strani, je treba ob vsakem posegu " +
            "premikati — zato je to vprašanje postavitve in ne vzdrževanja, čeprav " +
            "se pokaže šele pri prvem posegu.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Zakaj večji bazen ni več dela",
      p: [
        "Delo je isto: ista kemija, isti vložek, isti pokrov. Drugačna je " +
          "količina. " + tubLitreSpanText() + " litrov razlike med najmanjšim in " +
          "največjim modelom pomeni ob istem odmerku na liter sorazmerno več " +
          "sredstva in daljše polnjenje — ne pa pogostejšega opravila.",
        "Tudi to je razlog, da se pri izbiri modela splača gledati vodo in ne " +
          "vzdrževanja: prostornina se pozna vsak mesec, seznam opravil pa se z " +
          "modelom ne spremeni.",
      ],
    },
    {
      kind: "qa",
      h: "Pogosta vprašanja o vzdrževanju",
      items: [
        [
          "Koliko dela je z masažnim bazenom?",
          "Filtriranje teče samo. Vam ostanejo kemija vode, spiranje in menjava " +
            "filtrskega vložka ter pokrov. Kako pogosto, je odvisno od uporabe; " +
            "model na to skoraj ne vpliva, ker imajo vsi trije enako filtrirno " +
            "površino.",
        ],
        [
          "Ali je vzdrževanje pri večjem bazenu dražje?",
          "Dela je enako, vode je več — največji model drži " + tubLitreSpanText() +
            " litrov več od najmanjšega. Ob istem odmerku na liter to pomeni " +
            "sorazmerno več sredstva in daljše polnjenje. Filtrski vložek je isti.",
        ],
        [
          "Kaj, če bazena dlje časa ne bom uporabljal?",
          "Če bazen dela in je pokrit, obtočna črpalka vodo še naprej poganja skozi " +
            "filter in to je najmanj zahtevno stanje. Tvegano je nasprotno: " +
            "izklopljen bazen, poln vode, ki se ne premika. Kako ga pravilno " +
            "pripraviti, je opisano v vodniku o zimi.",
        ],
      ],
    },
    {
      kind: "links",
      h: "Naprej",
      items: [
        ["Masažni bazen pozimi", "/vodnik/masazni-bazen-pozimi"],
        ["Šobe in črpalke", "/vodnik/sobe-in-crpalke"],
        // The route KEY, resolved per shop by resolveHref(). The two guide
        // links above are real paths and stay written out.
        ["Vsi modeli in cene", "/products"],
      ],
    },
    {
      kind: "cta",
      h: "Vprašanje o vzdrževanju vašega modela?",
      p: "Povejte nam, kateri model vas zanima, in povemo, kaj vzdrževanje pri njem " +
        "v resnici pomeni. Brez obveznosti.",
      href: "/kontakt",
      label: "Kontakt",
    },
    ],
  },
  {
    slug: "sobe-in-crpalke",
    key: "/guide",
    // The qa block below is eligible for an FAQ rich result; worker.ts reads
    // this opt-in flag exactly as it does for /pogosta-vprasanja.
    faqPage: true,
    h1: "Šobe in črpalke masažnega bazena",
    // 42 characters, inside the 51 the head has once the brand is added.
    seoTitle: "Šobe in črpalke: koliko jih res potrebujete",
    lead:
      "Število šob je podatek, ki se najlažje primerja in pove najmanj. Kar " +
      "določa masažo, je razmerje med šobami in črpalkami.",
    metaDescription:
      "Koliko šob potrebuje masažni bazen, koliko jih poganja ena črpalka, kaj " +
      "prinese druga masažna črpalka in zakaj obtočna črpalka ne šteje.",
    blocks: [
    {
      kind: "prose",
      p: [
        "Masažni bazeni se oglašujejo s številom šob, ker je to edini podatek, ki " +
          "ga je mogoče primerjati, ne da bi kdo kamorkoli šel. Pove pa manj kot " +
          "skoraj katerakoli druga vrstica v specifikaciji: šoba je odprtina, in " +
          "kar iz nje naredi masažo, je voda pod tlakom, ki do nje pride.",
        "Vodo pod tlakom dela masažna črpalka. Zato je uporabno vprašanje, koliko " +
          "šob poganja ena črpalka, in ne, koliko šob je vseh skupaj.",
      ],
    },
    {
      // Derived from the catalogue — see tubJetPumpLines() on why the ratio is
      // computed rather than typed, and on why the circulation pump is not in
      // this division.
      kind: "prose",
      h: "Koliko šob poganja ena črpalka",
      p: [
        ...tubJetPumpLines("sl-SI"),
        "To je razmerje iz specifikacije in ne meritev tlaka na posamezni šobi. " +
          "Koliko voda potisne, je odvisno tudi od premera šobe, razporeditve po " +
          "sedežih in dolžine cevi do nje. Razmerje pa je edino, kar se da med " +
          "modeli primerjati brez preizkusa.",
      ],
    },
    {
      kind: "prose",
      h: "Zakaj ima največji model najmanj šob na črpalko",
      p: [
        "Ker ima drugo črpalko. Največji model nosi največ šob in dve masažni " +
          "črpalki, oba manjša pa svoje šobe na eni. Na prvi pogled je to videti, " +
          "kot da ima največji model preprosto več vsega; razlika, ki jo občutite, " +
          "pa je v tem, da vsaka od dveh črpalk poganja manj šob.",
        "Druga črpalka je pri nas del največjega modela in se je ne da dokupiti k " +
          "manjšemu. Zato razlika med srednjim in največjim modelom ni samo v " +
          "školjki — kar je podrobneje razčlenjeno v vodniku o ceni.",
      ],
    },
    {
      kind: "prose",
      h: "Obtočna črpalka ni masažna",
      p: [
        "V specifikaciji je poleg masažnih črpalk še obtočna, 0,35 KM. Ta ne dela " +
          "masaže: vodo poganja skozi filter in teče takrat, ko šobe mirujejo. Kdor " +
          "šteje črpalke, jo zlahka prišteje k masaži, čeprav v tem seštevku nima " +
          "kaj iskati.",
        "Podobno je z zračno masažo, ki je pri nekaterih modelih na voljo kot " +
          "dodatek: zrak ne prihaja iz masažne črpalke in v to številko ne sodi.",
      ],
    },
    {
      kind: "qa",
      h: "Pogosta vprašanja o šobah",
      items: [
        [
          "Koliko šob potrebuje masažni bazen?",
          "Toliko, kolikor jih ena črpalka lahko poganja s tlakom, ki ga občutite. " +
            "Pri naših modelih je to " + tubJetsPerPumpRangeText() + " šob na " +
            "črpalko. Več šob na isto črpalko ni več masaže, ampak ista voda, " +
            "razdeljena na več odprtin.",
        ],
        [
          "Ali je model z dvema črpalkama boljši?",
          "Ima več šob in vsako od njih poganja manj obremenjena črpalka. Ali je to " +
            "za vas boljše, je odvisno od tega, kaj sicer izbirate: druga črpalka " +
            "pride skupaj z največjo školjko in je ni mogoče dokupiti k manjšemu " +
            "modelu.",
        ],
        [
          "Ali lahko šobe dokupim pozneje?",
          "Ne. Šobe so vgrajene v školjko in njihovo število je del modela. Posebej " +
            "se izbirajo osvetlitev, zračna masaža, zvočniki in podobno — kaj " +
            "natanko, je pri vsakem modelu napisano na njegovi strani.",
        ],
      ],
    },
    {
      kind: "links",
      h: "Naprej",
      items: [
        ["Katera velikost masažnega bazena", "/vodnik/velikost-masaznega-bazena"],
        ["Koliko stane masažni bazen", "/vodnik/koliko-stane-masazni-bazen"],
        ["Vsi modeli in cene", "/products"],
      ],
    },
    {
      kind: "cta",
      h: "Razliko se najlažje občuti v vodi",
      p: "Povejte nam, kateri model vas zanima, in povemo, kaj v njem dejansko " +
        "poganja katera črpalka.",
      href: "/kontakt",
      label: "Kontakt",
    },
    ],
  },
];
