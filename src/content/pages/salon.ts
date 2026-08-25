import type { Page } from "../pages";

/**
 * The showroom is a claim the site already makes in footNote — "Razstavni
 * bazen v Ljubljani". The page states that and renders the address from
 * ShopConfig, which is TODO today and therefore renders as visibly unset
 * rather than as an invented street.
 *
 * The city is the ONLY thing this page knows about the showroom, and it is
 * short for that reason. Which models stand in it, what the opening hours are
 * and whether a swim spa is on the floor at all are facts nobody has written
 * down; a page that guessed at them would send someone across the country to
 * see a model that is not there. Ask the owner, then lengthen this.
 */
export const SHOWROOM: Page = {
  key: "/showroom",
  h1: "Razstavni salon v Ljubljani",
  lead:
    "Bazen si je vredno ogledati v živo. Mere na papirju povedo malo o tem, kako globok je " +
    "sedež, kam pridejo noge in kako velika je školjka v resnici.",
  metaDescription:
    "Razstavni masažni bazen v Ljubljani — globino, sedeže in mere preverite v živo. " +
    "Obisk po dogovoru, s svetovanjem za vašo lokacijo.",
  blocks: [
    {
      kind: "prose",
      h: "Obisk po dogovoru",
      p: [
        "Razstavni bazen je v Ljubljani. Za obisk se dogovorimo vnaprej po telefonu, da vas " +
          "sprejme nekdo, ki zna odgovoriti na vprašanja o vaši konkretni lokaciji.",
        "Prinesite mere prostora in fotografijo poti do njega. V pol ure se da razčistiti, " +
          "kateri model je pri vas izvedljiv in kaj bi bilo treba pripraviti.",
      ],
    },
    { kind: "contact", h: "Naslov in kontakt" },
    {
      kind: "cta",
      h: "Dogovorite se za termin",
      p: "Pokličite in povejte, kdaj vam ustreza.",
      label: "Kontakt",
      href: "/kontakt",
    },
  ],
};
