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
        "Srednji model sprejme največ ljudi. Največji ima namesto šestega sedeža " +
          "drugi ležalnik in polovico več šob od preostalih dveh. To ni pomanjkljivost " +
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
        ["Koliko stane masažni bazen", "/guide/koliko-stane-masazni-bazen"],
        ["Masažni bazen na terasi", "/guide/masazni-bazen-na-terasi"],
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
];
