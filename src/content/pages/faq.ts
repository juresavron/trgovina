import type { Page } from "../pages";

/**
 * The questions the shop is actually asked. Three answers here are checkable
 * against the rest of the site rather than against a copywriter's memory:
 *
 *   WHAT THE PRICE COVERS follows the product pages, which are the page a
 *   customer reads a figure on. PdpContent.freight in content/bazen.ts marks
 *   the site survey and the commissioning "vključeno" and the delivery itself
 *   "po ponudbi". This page said the price included delivery; it did not, and
 *   a price composition stated one way here and another way beside the number
 *   is the kind of contradiction ZVPot exists to punish.
 *
 *   THE GUARANTEE is 2–5 years by section, from the same product pages, and
 *   is the MANUFACTURER'S voluntary one. The consumer's statutory remedy for
 *   non-conforming goods is separate, runs against the seller and lasts two
 *   years from delivery (ZVPot-1, transposing Directive (EU) 2019/771), so
 *   the two are named separately rather than merged into "garancija".
 *
 *   THE WITHDRAWAL ANSWER CLAIMS NO EXEMPTION. It used to send people to "the
 *   exception for installed goods" on the withdrawal page — which states no
 *   such exception, deliberately (see pages/odstop.ts). A cross-reference to
 *   a right-limiting rule that does not exist is worse than no answer.
 */
export const FAQ: Page = {
  key: "/faq",
  // The one page whose main content IS the question set, so the one page that
  // may carry FAQPage. See Page.faqPage.
  faqPage: true,
  h1: "Pogosta vprašanja",
  lead: "Kar nas kupci vprašajo največkrat: o postavitvi, obratovanju, dostavi in garanciji.",
  metaDescription:
    "Pogosta vprašanja o masažnih bazenih: postavitev in podlaga, poraba, vzdrževanje, " +
    "dostava in montaža, garancija in servis.",
  blocks: [
    {
      kind: "qa",
      h: "Postavitev",
      items: [
        [
          "Kam lahko postavim masažni bazen?",
          "Na podlago, ki nosi težo napolnjenega bazena in ljudi v njem. Masažni bazen tehta " +
            "napolnjen od 1.500 do 2.210 kilogramov, swim spa bazen od 5.750 do 8.490 " +
            "kilogramov. Betonska plošča in ustrezno dimenzionirana terasa sta v redu; ali to " +
            "velja za vašo lokacijo, preverimo ob ogledu.",
        ],
        [
          "Ali ga lahko postavim v zaprt prostor?",
          "Da, vendar je treba rešiti prezračevanje in odtok. Zaprt prostor s toplo vodo pomeni " +
            "veliko vlage; brez prezračevanja se ta nabira v konstrukciji.",
        ],
        [
          "Koliko prostora potrebujem okoli bazena?",
          "Poleg mer školjke še dostop do servisne odprtine, kjer so črpalke in krmilnik. Brez " +
            "tega dostopa vsak kasnejši servis pomeni premikanje bazena.",
        ],
      ],
    },
    {
      kind: "qa",
      h: "Obratovanje",
      items: [
        [
          "Koliko elektrike porabi?",
          "Odvisno od temperature, ki jo držite, pogostosti uporabe, kakovosti pokrova in " +
            "zunanjih razmer. Prav zato nikjer ne navajamo mesečnega zneska: brez teh podatkov " +
            "bi bila vsaka številka ugibanje.",
        ],
        [
          "Koliko dela je z vzdrževanjem?",
          "Približno deset minut na teden: preverjanje vode, čiščenje filtra in doziranje. " +
            "Postopek pokažemo ob predaji.",
        ],
        [
          "Kako pogosto je treba zamenjati vodo?",
          "Ob normalni uporabi in pravilnem doziranju nekajkrat letno. Točen ritem je odvisen od " +
            "števila kopalcev in kakovosti vzdrževanja.",
        ],
        [
          "Ali lahko bazen uporabljam pozimi?",
          "Da, pozimi je najbolj prijeten. Bazen naj takrat dela; praznjenje čez zimo je pogosta " +
            "napaka, ker voda ostane v ceveh in črpalkah.",
        ],
      ],
    },
    {
      kind: "qa",
      h: "Nakup in dostava",
      items: [
        [
          "Kaj je vključeno v ceno modela?",
          "Ogled lokacije pred dostavo, zagon, umeritev in predaja. Dostavo z ekipo in opremo " +
            "za prenos obračunamo po ponudbi, ker je odvisna od lokacije in dostopa; znesek je " +
            "v pisni ponudbi, preden karkoli potrdite. V ceni ni priprave podlage in " +
            "elektroinštalacije na vaši strani.",
        ],
        [
          "Kako dolgo traja od naročila do dostave?",
          "Odvisno od modela in zaloge. Rok potrdimo ob ponudbi, ne prej, ker bi bil takrat " +
            "ugibanje.",
        ],
        [
          "Ali lahko bazen vidim v živo?",
          "Razstavnega salona nimamo. Pošljemo vam vzorčnik barv školjke, vse mere in " +
            "specifikacije so na strani vsakega modela, na brezplačnem ogledu lokacije pa " +
            "vam z merami v roki pokažemo, koliko prostora bo bazen zavzel pri vas.",
        ],
        [
          "Ali je mogoče plačilo na obroke?",
          "Obročnega plačila in financiranja ne ponujamo. Plačilni pogoji so zapisani v " +
            "pisni ponudbi, ki jo dobite po ogledu lokacije.",
        ],
      ],
    },
    {
      kind: "qa",
      h: "Garancija in servis",
      items: [
        [
          "Kakšna je garancija?",
          "Tri leta. Obseg je naveden v garancijskem listu, ki ga dobite ob " +
            "predaji. Garancija je prostovoljna zaveza proizvajalca. " +
            "Ločeno od nje in poleg nje imate kot potrošnik zakonske pravice pri neskladnosti " +
            "blaga: za neskladnost, ki se pokaže v dveh letih od dobave, odgovarjamo mi kot " +
            "prodajalec.",
        ],
        [
          "Kdo popravi okvaro?",
          "Naša servisna mreža. Rezervne dele za modele, ki jih prodajamo, imamo na zalogi; " +
            "to je eden od razlogov, da je ponudba ozka.",
        ],
        [
          "Ali lahko bazen vrnem?",
          "Kot potrošnik imate pri nakupu na daljavo 14 dni za odstop od pogodbe, brez " +
            "navedbe razloga. Ker je bazen težak in praviloma že priklopljen, ga ne vračate " +
            "sami. Odvoz izvedemo mi, neposredne stroške vračila pa nosi kupec in jih " +
            "navedemo v pisni ponudbi, še preden pogodbo sklenete. Rok, postopek in stroški " +
            "so opisani na strani o odstopu " +
            "od pogodbe.",
        ],
      ],
    },
    // The withdrawal answer above names its page; qa items are escaped text
    // and cannot carry an anchor, so the name was unreachable from the one
    // page that sends people there. One row of links makes it a route.
    {
      kind: "links",
      h: "Strani, ki jih odgovori omenjajo",
      items: [
        ["Odstop od pogodbe", "/odstop-od-pogodbe"],
        ["Dostava in montaža", "/dostava-in-montaza"],
        ["Pogoji poslovanja", "/pogoji-poslovanja"],
      ],
    },
    {
      kind: "cta",
      h: "Vprašanja ni na seznamu?",
      p: "Pokličite. Na vprašanja o dostopu, podlagi in priklopu odgovorimo po telefonu " +
        "sproti, na e-pošto pa v enem delovnem dnevu.",
      label: "Kontakt",
      href: "/kontakt",
    },
  ],
};
