import type { Page } from "../pages";

/**
 * "Do 36 mesečnih obrokov" is one of the four trust claims the storefront
 * already makes, so the page restates exactly that and no more. It names no
 * lender, no interest rate and no monthly figure: none of those is recorded
 * anywhere in this repo, and an invented APR on a financing page is a
 * consumer-credit misstatement, not a copy error.
 */
export const FINANCING: Page = {
  key: "/financing",
  h1: "Financiranje",
  lead:
    "Nakup je mogoče razdeliti na do 36 mesečnih obrokov. Izračun za vaš model in znesek " +
    "pripravimo ob ponudbi.",
  metaDescription:
    "Nakup masažnega bazena na obroke — do 36 mesečnih obrokov. Kako poteka odobritev in " +
    "kaj potrebujete za izračun.",
  blocks: [
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
