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
 *
 * WHAT THE PRICE COVERS IS NOT A DRAFTING CHOICE EITHER. This section used to
 * say the price included delivery. The product pages say otherwise —
 * PdpContent.freight in content/bazen.ts marks the site survey and the
 * commissioning "vključeno" and the delivery itself "po ponudbi" — and of the
 * two, the one printed beside the figure wins. A price composition that
 * differs between the terms and the product page is a misleading price
 * indication under ZVPot whichever of the two is right.
 *
 * TWO ADDITIONS A SLOVENIAN CONSUMER LAWYER WOULD LOOK FOR, both statutory
 * and therefore safe without the owner: the seller's own two-year liability
 * for non-conformity with its remedy ladder (ZVPot-1, transposing Directive
 * (EU) 2019/771 — and it is the SELLER'S, not the manufacturer's voluntary
 * guarantee, which is why the two are in separate paragraphs), and the
 * confirmation of the concluded contract on a durable medium.
 *
 * ⚠️ NO ODR LINK. The EU online dispute resolution platform was shut down in
 * July 2025 and the regulation behind the link duty repealed, so the link
 * every older Slovenian terms page still carries now goes nowhere. The ZIsRPS
 * declaration — whether the trader recognises an out-of-court provider — is a
 * separate duty and is still made, above.
 */
/**
 * ⚠️ THE PRICE SECTION IS THE SHOP'S, AND IT USED TO BE EVERY SHOP'S.
 *
 * This page sat in UNIVERSAL_PAGES as a const, and its "Cene" section read:
 * prices include commissioning, calibration and handover, a site survey is
 * free and carried out before the quote, and delivery "z ekipo in opremo za
 * prenos" is quoted separately. Every one of those is true of a hot tub and
 * false of anything else — so the second shop registered on this Worker
 * published, on its own statutory terms page, a promise of a free site visit
 * and a commissioning service for a tin of pouches.
 *
 * cross-shop.test.ts caught it as two shared sentences, which is the shape the
 * defect takes from outside; the defect itself is that a commercial promise
 * was living on a page every shop publishes unchanged. Statutory text is
 * shared because the law is the same for both sellers. What the price
 * includes is not law, it is an offer, and an offer belongs to one shop.
 *
 * So the page is a FUNCTION now. A shop passes the paragraphs describing what
 * its own price covers, and everything around them — contract formation,
 * conformity, withdrawal, dispute resolution — stays identical, which is
 * correct: those parts are ZVPot-1 and ZEPT, not marketing.
 */
export function termsPage(priceParagraphs: readonly string[]): Page {
  return {
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
          "Cene in opisi na spletni strani so vabilo k nakupu, ne zavezujoča ponudba za " +
            "konkreten posel. Pogodba se sklepa v slovenskem jeziku.",
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
            "splošnimi določili na tej strani. Potrdilo o sklenjeni pogodbi skupaj s temi " +
            "pogoji prejmete na trajnem nosilcu podatkov, praviloma po e-pošti.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Cene",
      // The shop's own, and the only section of this page that is. See the
      // note at the top for what went wrong while it was not.
      p: [...priceParagraphs],
    },
    {
      kind: "prose",
      h: "Dostava in montaža",
      p: [
        "Dostavo, priklop in zagon izvedemo z lastno ekipo po vsej Sloveniji. Kupec zagotovi " +
          "dostop do lokacije, nosilno podlago in električni priklop po navodilih, ki jih " +
          "prejme pred dostavo.",
        "Če na dan dostave pogoji na lokaciji niso pripravljeni tako, kot je bilo dogovorjeno " +
          "ob ogledu, dostave ni mogoče izvesti in se dogovorimo za nov termin. Rok dobave je " +
          "naveden v potrjeni ponudbi.",
      ],
    },
    {
      kind: "prose",
      h: "Jamstvo za skladnost blaga in garancija",
      p: [
        "Kot prodajalec odgovarjamo za vsako neskladnost blaga, ki obstaja ob dobavi in se " +
          "pokaže v dveh letih od dobave. To je vaša zakonska pravica: velja poleg " +
          "prostovoljne garancije proizvajalca in neodvisno od nje, ti pogoji pa je ne morejo " +
          "omejiti.",
        "Če blago ni skladno s pogodbo, lahko najprej zahtevate brezplačno vzpostavitev " +
          "skladnosti — popravilo ali zamenjavo, med katerima izberete sami, razen če je " +
          "izbrana rešitev nemogoča ali nesorazmerna. Če tega ne izvedemo v razumnem roku in " +
          "brez znatnih nevšečnosti za vas ali če neskladnost kljub temu ostane, lahko " +
          "zahtevate sorazmerno znižanje kupnine ali odstopite od pogodbe in zahtevate vračilo " +
          "plačila; odstop je izključen samo, kadar je neskladnost neznatna. Stroškov " +
          "vzpostavitve skladnosti ne nosite vi.",
        // ⚠️ NO FIGURE, AND NO PLURAL. This said "Za modele, ki jih prodajamo,
        // znaša garancija tri leta" — the first shop's supplier figure, typed
        // into one of the pages every shop publishes unchanged, over a
        // catalogue it assumed had several models. The term is stated where
        // the shop states it: on the product page, beside the price, and in
        // the warranty document handed over. This page only says where.
        "Trajanje in obseg garancije za posamezni model sta navedena na njegovi strani " +
          "in v garancijskem listu, ki ga prejmete ob predaji. Servis in rezervne dele " +
          "zagotavljamo prek svoje mreže.",
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
        "Reklamacijo najprej naslovite na nas. Če se ne " +
          "dogovorimo, o sporu odloča sodišče, določeno z zakonom; kot potrošnik lahko tožbo " +
          "vložite tudi pri sodišču v kraju svojega stalnega prebivališča.",
        "Skladno z zakonom, ki ureja izvensodno reševanje potrošniških sporov, izjavljamo, da " +
          "nobenega izvajalca izvensodnega reševanja potrošniških sporov ne priznavamo kot " +
          "pristojnega. Kot potrošnik lahko kršitev kljub temu prijavite Tržnemu inšpektoratu " +
          "Republike Slovenije.",
      ],
    },
    { kind: "contact", h: "Kontakt za reklamacije" },
    {
      kind: "cta",
      h: "Vračilo v 14 dneh",
      p: "Rok, postopek, vračilo plačila in obrazec za odstop od pogodbe.",
      label: "Odstop od pogodbe",
      // ⚠️ AN INTERNAL ROUTE KEY, NOT A SLUG. This page is one of the six any
      // shop can publish unchanged, and it used to link to this shop's
      // Slovenian URL — which is a dead link on any shop that spells it
      // differently. render/sections.ts resolveHref() turns the key into
      // whatever the serving shop calls the page.
      href: "/withdrawal",
    },
  ],
  };
}
