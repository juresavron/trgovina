import type { Page } from "../pages";

/**
 * General terms. Two kinds of statement live here and they are treated
 * differently.
 *
 * STATUTORY content — the consumer's right to withdraw, the right to conform-
 * ing goods, the venue for disputes — comes from ZVPot-1 and the Consumer
 * Rights Directive, and is safe to write because the legislature wrote it.
 *
 * COMMERCIAL content — payment terms, deposits, lead times, cancellation
 * charges — is the company's own decision. None of it is recorded anywhere in
 * this repo, so none of it is stated here. Where a term is genuinely
 * company-specific the page says it is fixed in the written offer, which is
 * true and enforceable, rather than inventing a number that would bind the
 * owner to something they never agreed to.
 */
export const TERMS: Page = {
  key: "/terms",
  h1: "Pogoji poslovanja",
  lead:
    "Splošni pogoji za nakup pri nas: kako nastane pogodba, kaj cena vključuje, " +
    "kako poteka dostava in kakšne pravice imate kot potrošnik.",
  metaDescription:
    "Splošni pogoji poslovanja: sklenitev pogodbe, cene, dostava in montaža, " +
    "jamstvo za skladnost blaga, odstop od pogodbe in reševanje sporov.",
  legal: true,
  blocks: [
    { kind: "imprint", h: "Prodajalec" },
    {
      kind: "prose",
      h: "Za koga veljajo ti pogoji",
      p: [
        "Za vse nakupe pri nas. Kadar kupujete kot potrošnik — torej kot fizična oseba zunaj " +
          "svoje dejavnosti — imate poleg teh pogojev tudi pravice po Zakonu o varstvu " +
          "potrošnikov, ki jih ti pogoji ne morejo zmanjšati. Kjer bi bilo določilo teh pogojev " +
          "za potrošnika manj ugodno od zakona, velja zakon.",
      ],
    },
    {
      kind: "steps",
      h: "Kako nastane pogodba",
      items: [
        [
          "Povpraševanje",
          "Cene in opisi na spletni strani so povabilo k nakupu, ne zavezujoča ponudba za " +
            "konkreten posel.",
        ],
        [
          "Ogled lokacije",
          "Pred potrditvijo naročila praviloma opravimo ogled, ker sta izvedljivost dostave in " +
            "priklopa odvisni od lokacije.",
        ],
        [
          "Pisna ponudba",
          "V njej so model in konfiguracija, končna cena z DDV, obseg dostave in montaže, rok " +
            "in plačilni pogoji. Ta ponudba je zavezujoča vsebina posla.",
        ],
        [
          "Potrditev",
          "Pogodba je sklenjena, ko ponudbo pisno potrdite. Takrat potrjeni pogoji veljajo pred " +
            "splošnimi določili na tej strani.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Cene",
      p: [
        "Cene modelov na spletni strani so v evrih in vključujejo DDV ter dostavo, priklop in " +
          "zagon po Sloveniji. Ne vključujejo priprave podlage, gradbenih del in " +
          "elektroinštalacije na strani kupca.",
        "Cena, ki velja za vaš posel, je cena iz pisne ponudbe, ki ste jo potrdili.",
      ],
    },
    {
      kind: "prose",
      h: "Dostava in montaža",
      p: [
        "Dostavo, priklop in zagon izvedemo z lastno ekipo po vsej Sloveniji. Kupec zagotovi " +
          "dostop do lokacije, nosilno podlago in električni priklop po navodilih, ki jih " +
          "prejme pred dostavo.",
        "Če na dan dostave pogoji na lokaciji niso pripravljeni tako, kot je bilo dogovorjeno " +
          "ob ogledu, dostave ni mogoče izvesti in dogovorimo se za nov termin. Rok dobave je " +
          "naveden v potrjeni ponudbi.",
      ],
    },
    {
      kind: "prose",
      h: "Jamstvo za skladnost blaga in garancija",
      p: [
        "Kot potrošnik imate zakonske pravice, če blago ni skladno s pogodbo. Te pravice " +
          "veljajo neodvisno od prostovoljne garancije proizvajalca in poleg nje.",
        "Garancijski rok in obseg sta navedena v garancijskem listu, ki ga prejmete ob predaji. " +
          "Za modele, ki jih prodajamo, zagotavljamo servis in rezervne dele.",
        "Neskladnost ali okvaro nam sporočite čim prej po odkritju, na kontakt spodaj. Opišite " +
          "napako in priložite fotografijo, če je mogoče.",
      ],
    },
    {
      kind: "prose",
      h: "Odstop od pogodbe",
      p: [
        "Pri nakupu na daljavo imate kot potrošnik 14 dni za odstop od pogodbe brez navedbe " +
          "razloga. Rok, postopek in stroški so opisani na ločeni strani o odstopu od pogodbe, " +
          "ki je sestavni del teh pogojev.",
      ],
    },
    {
      kind: "prose",
      h: "Reševanje sporov",
      p: [
        "Reklamacijo najprej naslovite na nas — večina zadev se reši v enem klicu. Za morebitne " +
          "spore je pristojno sodišče po veljavnih predpisih.",
        "Ponudnikov izvensodnega reševanja potrošniških sporov ne priznavamo kot pristojnih; kot " +
          "potrošnik lahko spor kljub temu prijavite pristojnim organom za varstvo potrošnikov.",
      ],
    },
    { kind: "contact", h: "Kontakt za reklamacije" },
  ],
};
