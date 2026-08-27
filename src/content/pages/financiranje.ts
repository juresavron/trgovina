import type { Page } from "../pages";

/**
 * "Do 36 mesečnih obrokov" is one of the four trust claims the storefront
 * already makes, so that is the only commercial fact this page states. It
 * names no lender, no interest rate, no EOM, no monthly figure, no deposit,
 * no term and nobody who approves credit: none of those is recorded anywhere
 * in this repo, and an invented APR on a financing page is a consumer-credit
 * misstatement, not a copy error.
 *
 * ⚠️ WHICH IS WHY THE LENGTH HAD TO COME FROM SOMEWHERE ELSE. The page was
 * 215 words and could not honestly grow along the axis a financing page
 * normally grows along — rates, examples, a calculator. So it grows as BUYER
 * GUIDANCE instead: what to compare between offers, what to ask the lender
 * before signing, and what the total cost of ownership contains beyond the
 * monthly instalment.
 *
 * That distinction is load-bearing and it is made explicit on the page, in
 * the first block and again in the last. Everything in the question list is
 * written as a question to put to a provider of finance, never as a term this
 * shop offers — a page that reads as an offer is one, whatever the file
 * comment says. The two masses in "Kaj vse plača lastnik" are the
 * catalogue's own (catalog/pola.ts: BAZEN 195 at 1.500 kg filled, BAZEN 230
 * at 2.210 kg), and the refusal to state a running cost matches
 * /pogosta-vprasanja, which refuses it for the same reason.
 */
export const FINANCING: Page = {
  key: "/financing",
  h1: "Financiranje",
  lead:
    "Nakup je mogoče razdeliti na do 36 mesečnih obrokov. Izračun za vaš model in znesek " +
    "pripravimo ob ponudbi.",
  metaDescription:
    "Nakup masažnega bazena na obroke — do 36 mesečnih obrokov. Kako poteka odobritev, kaj " +
    "primerjati med ponudbami financiranja in kaj vprašati pred podpisom.",
  blocks: [
    {
      kind: "prose",
      h: "Kaj pomeni nakup na obroke",
      p: [
        "Gre za dve pogodbi in ne za eno. Bazen kupite pri nas, financiranje pa sklenete s " +
          "ponudnikom financiranja. Mi vemo, koliko stane bazen; koliko stane denar, ve on.",
        "Zato je vse, kar sledi na tej strani, pomoč pri odločanju in ne ponudba financiranja. " +
          "Nobena od spodnjih vrstic ni pogoj, ki bi ga ponujali mi, in nobena ne velja za vaš " +
          "primer, dokler je ne potrdi ponudnik financiranja v svoji ponudbi.",
      ],
    },
    {
      kind: "steps",
      h: "Kako poteka",
      items: [
        [
          "Izberete model in dobite ponudbo",
          "V pisni ponudbi je končna cena z DDV — model in konfiguracija, dostava, priklop in " +
            "zagon. Ta znesek je podlaga za izračun obrokov.",
        ],
        [
          "Pripravimo izračun",
          "Za izbrani znesek in želeno dobo odplačevanja dobite konkreten izračun obroka, " +
            "skupaj z vsemi stroški financiranja.",
        ],
        [
          "Odobritev",
          "Vlogo obravnava ponudnik financiranja. Odobritev ni samodejna in je odvisna od " +
            "njegove presoje.",
        ],
        ["Dostava", "Po odobritvi se dogovorimo za termin ogleda in dostave kot pri vsakem drugem nakupu."],
      ],
    },
    {
      kind: "qa",
      h: "Kaj vprašati ponudnika financiranja",
      items: [
        [
          "Kolikšna je efektivna obrestna mera (EOM)?",
          "To je edina številka, s katero se dve ponudbi sploh dasta primerjati, ker poleg " +
            "obresti zajame tudi stroške odobritve in vodenja. Sama obrestna mera tega ne pove.",
        ],
        [
          "Kolikšen je skupni znesek za plačilo?",
          "Vsota vseh obrokov in stroškov do konca odplačevanja. Daljša doba pomeni nižji obrok " +
            "in praviloma višji skupni znesek — to je ista odločitev, gledana z dveh strani.",
        ],
        [
          "Je obrestna mera fiksna ali spremenljiva?",
          "Pri spremenljivi se obrok med odplačevanjem lahko spremeni. Vprašajte, na kaj je " +
            "vezana in kaj se z obrokom zgodi, če se referenčna mera zviša.",
        ],
        [
          "Kateri stroški so poleg obresti?",
          "Strošek odobritve, vodenja, morebitnega zavarovanja kredita ali obvezne police. " +
            "Zanima vas, ali so že zajeti v EOM in ali se plačajo enkrat ali vsak mesec.",
        ],
        [
          "Kaj velja pri predčasnem odplačilu?",
          "Ali je mogoče kadar koli, ali je omejeno in kakšno nadomestilo si ponudnik pridrži. " +
            "Če nameravate odplačati prej, je to lahko pomembnejše od višine obroka.",
        ],
        [
          "Kaj se zgodi ob zamudi obroka?",
          "Zamudne obresti, opomini in stroški izterjave. Vprašanje, ki je bistveno bolj " +
            "uporabno pred podpisom kot ob prvem zapletu.",
        ],
        [
          "Kaj potrebujete za vlogo?",
          "Seznam dokumentov se med ponudniki razlikuje, zato ga vprašajte, preden začnete " +
            "zbirati papirje. Vprašajte tudi, koliko časa običajno traja obravnava.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Kaj vse plača lastnik",
      p: [
        "Obrok ni celoten strošek nakupa. Poleg cene modela s konfiguracijo sta tu še dostava, " +
          "ki je odvisna od naslova in dostopa, ter priprava podlage in elektroinštalacija na " +
          "vaši strani — teh dveh v ceni bazena ni. Obroke je zato smiselno računati od zneska " +
          "v pisni ponudbi in ne od cene, zapisane ob modelu.",
        "Potem so tu stroški obratovanja: elektrika za ogrevanje in filtracijo, sredstva za " +
          "vodo in filtri. Koliko to znese, je odvisno od temperature, ki jo držite, pogostosti " +
          "uporabe, kakovosti pokrova in zunanjih razmer, zato mesečnega zneska ne navajamo " +
          "nikjer na tem spletnem mestu.",
        "Pri izbiri modela to ni nepomembno. BAZEN 195 napolnjen tehta 1.500 kilogramov, BAZEN " +
          "230 pa 2.210 kilogramov, in večji del te razlike je voda, ki jo je treba ogrevati " +
          "vse leto. Večji model torej ni dražji le ob nakupu.",
      ],
    },
    {
      kind: "facts",
      h: "Kje dobite katero številko",
      rows: [
        [
          "Cena bazena z DDV",
          "V naši pisni ponudbi: model s konfiguracijo, dostava, priklop in zagon.",
        ],
        [
          "Obrok, obrestna mera in EOM",
          "Pri ponudniku financiranja, za vaš konkretni znesek in izbrano dobo.",
        ],
        [
          "Skupni znesek za plačilo",
          "Prav tako pri ponudniku financiranja. To je številka, s katero primerjate ponudbe.",
        ],
        [
          "Stroški obratovanja",
          "Nikjer kot pavšal — odvisni so od uporabe, pokrova in zunanjih razmer.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Kaj na tej strani namenoma ni",
      p: [
        "Ni mesečnega zneska, obrestne mere ali efektivne obrestne mere. Ti podatki so odvisni " +
          "od zneska, dobe in ponudnika financiranja ter veljajo za konkretno vlogo. Objavljena " +
          "številka, ki za vaš primer ne bi držala, ni informacija, ampak zavajanje — zato jo " +
          "dobite v pisni ponudbi, ne na oglasni strani.",
        "Pogodbo o financiranju sklenete s ponudnikom financiranja, ne z nami. Ta vam mora " +
          "pred podpisom izročiti predpisane predpogodbene informacije, v katerih so obrestna " +
          "mera, efektivna obrestna mera, doba in skupni znesek, ki ga boste plačali.",
        "Vse stroške financiranja torej vidite pred podpisom. Če vam kaj ni jasno, vprašajte, " +
          "preden podpišete.",
      ],
    },
    {
      kind: "cta",
      h: "Želite izračun?",
      p: "Povejte model in želeno dobo odplačevanja, izračun pripravimo mi.",
      label: "Kontakt",
      href: "/kontakt",
    },
  ],
};
