import type { Page } from "../pages";

/**
 * The privacy notice. GDPR Articles 13-15 fix what has to be stated and what
 * rights exist, so the substance here is statutory rather than invented — but
 * the CONTROLLER is the company, and identifying the controller is Article
 * 13(1)(a). That comes from ShopConfig and is unset today, which is exactly
 * why legalPagesReady() blocks the launch: a privacy notice with no
 * identifiable controller does not satisfy the article it exists to satisfy.
 *
 * Processing purposes describe what this site actually does today: it takes
 * enquiries by phone and email and serves pages. There is no analytics and no
 * advertising pixel — re-verified against the codebase, see pages/piskotki.ts
 * — so the notice says so rather than reciting the generic paragraphs for
 * things that are not here. There is also no contact form: the storefront's
 * only <form> is the product page's buy row, which is a GET and carries no
 * personal data.
 *
 * ⚠️ THE ONE CLAIM THAT WAS TOO STRONG WAS "NO THIRD-COUNTRY TRANSFER". The
 * site runs on Cloudflare Workers and the photographs come from Supabase
 * through the /media proxy; both are processors that may be reached outside
 * the EEA, and neither has a data-processing agreement recorded in this repo.
 * So the notice now states the safeguard (Article 46 — standard contractual
 * clauses or an adequacy decision) instead of denying that any transfer
 * happens. Confirm the DPAs and the actual processor list with the owner and
 * then name them.
 *
 * FOUR ARTICLE 13 ITEMS WERE MISSING and are statutory rather than
 * commercial, so they were added: whether providing the data is obligatory
 * and what follows if it is not given (13(2)(e)), the absence of automated
 * decision-making and profiling (13(2)(f)), the transfer safeguard above
 * (13(1)(f)), and the supervisory authority named with its address on the web
 * (13(2)(d)).
 */
export const PRIVACY: Page = {
  key: "/privacy",
  h1: "Zasebnost",
  lead:
    "Kdo obdeluje vaše osebne podatke, katere, zakaj in kakšne pravice imate. " +
    "Brez analitike, brez oglaševalskih sledilnikov.",
  metaDescription:
    "Politika zasebnosti: upravljavec, nameni obdelave osebnih podatkov, pravne podlage, " +
    "roki hrambe in pravice posameznika po GDPR.",
  legal: true,
  blocks: [
    { kind: "imprint", h: "Upravljavec osebnih podatkov" },
    {
      kind: "facts",
      h: "Kaj obdelujemo in zakaj",
      rows: [
        [
          "Povpraševanje",
          "Ime, telefon, e-naslov in podatki o lokaciji, ki nam jih sporočite. Namen: odgovor " +
            "na vaše povpraševanje in priprava ponudbe. Pravna podlaga: izvedba ukrepov na " +
            "vašo zahtevo pred sklenitvijo pogodbe.",
        ],
        [
          "Naročilo in dostava",
          "Podatki, potrebni za izvedbo pogodbe, dostavo in montažo. Pravna podlaga: izvajanje " +
            "pogodbe.",
        ],
        [
          "Računi",
          "Podatki na izdanih računih. Pravna podlaga: izpolnitev zakonske obveznosti " +
            "(davčni in računovodski predpisi).",
        ],
        [
          "Servis in garancija",
          "Podatki o modelu, datumu predaje in opravljenih posegih. Pravna podlaga: izvajanje " +
            "pogodbe in zakonske obveznosti.",
        ],
      ],
    },
    {
      kind: "prose",
      h: "Kako dolgo hranimo",
      p: [
        "Povpraševanja, iz katerih ne nastane naročilo, hranimo, dokler so za odgovor še " +
          "smiselna, nato jih izbrišemo. Podatke o sklenjenih poslih hranimo, dokler trajajo " +
          "obveznosti iz pogodbe, jamstva za skladnost blaga in garancije. Račune hranimo " +
          "toliko časa, kolikor zahtevajo davčni predpisi — praviloma deset let.",
        "Podatke nam daste prostovoljno in vam jih ni treba dati. Brez njih pa ne moremo " +
          "odgovoriti na povpraševanje, pripraviti ponudbe ali izvesti dostave in montaže.",
      ],
    },
    {
      kind: "prose",
      h: "Komu jih posredujemo",
      p: [
        "Samo tistim, ki so potrebni za izvedbo posla: prevozniku in montažni ekipi za dostavo, " +
          "računovodskemu servisu za račune, ponudniku financiranja, če se zanj odločite, in " +
          "ponudniku gostovanja spletne strani. Vsak od njih obdeluje podatke po naših navodilih " +
          "in zgolj za navedeni namen.",
        "Kadar kakšen od teh ponudnikov podatke obdeluje zunaj Evropskega gospodarskega " +
          "prostora, to poteka le na podlagi jamstev, ki jih zahteva splošna uredba o varstvu " +
          "podatkov — na primer standardnih pogodbenih določil ali sklepa o ustreznosti.",
        "Osebnih podatkov ne prodajamo, ne uporabljamo za oglaševanje in na njihovi podlagi ne " +
          "izvajamo profiliranja ali avtomatiziranega sprejemanja odločitev.",
      ],
    },
    {
      kind: "prose",
      h: "Pravice, ki jih imate",
      p: [
        "Imate pravico do dostopa do svojih podatkov, do popravka netočnih, do izbrisa, do " +
          "omejitve obdelave, do prenosljivosti in do ugovora zoper obdelavo. Kadar obdelava " +
          "temelji na privolitvi, jo lahko kadar koli prekličete, ne da bi to vplivalo na " +
          "zakonitost obdelave pred preklicem.",
        "Zahtevo naslovite na kontakt spodaj; odgovorimo v roku, ki ga določa splošna uredba o " +
          "varstvu podatkov, torej praviloma v enem mesecu. Če menite, da so vaše pravice " +
          "kršene, se lahko pritožite pri nadzornem organu — to je Informacijski pooblaščenec " +
          "Republike Slovenije, www.ip-rs.si.",
      ],
    },
    { kind: "contact", h: "Kam se obrnete" },
    {
      kind: "cta",
      h: "Piškotkov ni",
      p: "Ta stran ne nalaga piškotkov in ne meri obiska. Kaj to pomeni in kaj se vseeno zabeleži.",
      label: "Piškotki",
      href: "/piskotki",
    },
  ],
};
