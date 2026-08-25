import type { Page } from "../pages";

/**
 * The showroom is a claim the site already makes in footNote — "Razstavni
 * bazen v Ljubljani". The page states that and renders the address from
 * ShopConfig, which is TODO today and therefore renders as visibly unset
 * rather than as an invented street.
 */
export const SHOWROOM: Page = {
  key: "/showroom",
  h1: "Razstavni salon",
  lead:
    "Bazen si je vredno ogledati v živo. Mere na papirju povedo malo o tem, kako globok je " +
    "sedež in kam pridejo noge.",
  metaDescription:
    "Razstavni masažni bazen v Ljubljani — oglejte si model v živo. Obisk po dogovoru.",
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
