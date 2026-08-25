import type { Page } from "../pages";

export const FAQ: Page = {
  key: "/faq",
  h1: "Pogosta vprašanja",
  lead: "Kar nas kupci vprašajo največkrat — o postavitvi, obratovanju, dostavi in garanciji.",
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
          "Na podlago, ki nosi težo polnega bazena z ljudmi — to je pri masažnih bazenih preko " +
            "dveh ton, pri swim spa bazenih bistveno več. Betonska plošča in ustrezno " +
            "dimenzionirana terasa sta v redu. Ali to velja za vašo lokacijo, preverimo ob ogledu.",
        ],
        [
          "Ali ga lahko postavim v notranjost?",
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
            "zunanjih razmer. Prav zato nikjer ne navajamo mesečnega zneska — brez teh podatkov " +
            "bi bila vsaka številka ugibanje.",
        ],
        [
          "Koliko dela je z vzdrževanjem?",
          "Približno deset minut na teden: preverjanje vode, čiščenje filtra in doziranje. " +
            "Postopek pokažemo ob predaji.",
        ],
        [
          "Kako pogosto se menja voda?",
          "Ob normalni uporabi in pravilnem doziranju nekajkrat letno. Točen ritem je odvisen od " +
            "števila kopalcev in kakovosti vzdrževanja.",
        ],
        [
          "Ali lahko bazen uporabljam pozimi?",
          "Da — pozimi je najbolj prijeten. Bazen naj takrat dela; praznjenje čez zimo je pogosta " +
            "napaka, ker voda ostane v ceveh in črpalkah.",
        ],
      ],
    },
    {
      kind: "qa",
      h: "Nakup in dostava",
      items: [
        [
          "Ali je dostava vključena v ceno?",
          "Da. Cena modela vključuje dostavo, priklop in zagon po vsej Sloveniji. Ne vključuje " +
            "priprave podlage in elektroinštalacije na vaši strani.",
        ],
        [
          "Kako dolgo traja od naročila do dostave?",
          "Odvisno od modela in zaloge. Rok potrdimo ob ponudbi — ne prej, ker bi bil takrat " +
            "ugibanje.",
        ],
        [
          "Ali lahko bazen vidim v živo?",
          "Da, v razstavnem prostoru. Za obisk se dogovorimo vnaprej po telefonu.",
        ],
        [
          "Ali je mogoče plačilo na obroke?",
          "Da, do 36 mesečnih obrokov. Pogoji so odvisni od zneska in ponudnika financiranja; " +
            "izračun pripravimo ob ponudbi.",
        ],
      ],
    },
    {
      kind: "qa",
      h: "Garancija in servis",
      items: [
        [
          "Kakšna je garancija?",
          "Garancijski rok in obseg sta navedena v garancijskem listu, ki ga dobite ob predaji, " +
            "in se razlikujeta po sklopih (školjka, oprema, obloga). Poleg garancije vam kot " +
            "potrošniku pripadajo tudi zakonske pravice iz naslova neskladnosti blaga.",
        ],
        [
          "Kdo popravi okvaro?",
          "Naša servisna mreža. Rezervne dele za modele, ki jih prodajamo, imamo na zalogi — " +
            "to je eden od razlogov, da je ponudba ozka.",
        ],
        [
          "Ali lahko bazen vrnem?",
          "Kot potrošnik imate pri nakupu na daljavo 14 dni za odstop od pogodbe. Postopek in " +
            "izjema pri montiranem blagu sta opisana na strani o odstopu od pogodbe.",
        ],
      ],
    },
    {
      kind: "cta",
      h: "Vprašanja ni na seznamu?",
      p: "Pokličite. Na vprašanja o dostopu, podlagi in priklopu odgovorimo takoj.",
      label: "Kontakt",
      href: "/kontakt",
    },
  ],
};
