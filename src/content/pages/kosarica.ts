import type { Page } from "../pages";

/**
 * Cart and checkout are per-visitor surfaces, not content, so both are
 * noindex regardless of launch state. Neither is wired to a payment
 * integration yet; the honest page says so and gives the route that does work
 * today — the phone. A basket that silently does nothing is worse than one
 * that says what it is.
 */
export const CART: Page = {
  key: "/cart",
  h1: "Košarica",
  lead: "Spletno naročanje še ni odprto. Naročila trenutno sprejmemo po telefonu ali e-pošti.",
  metaDescription: "Košarica.",
  noindex: true,
  blocks: [
    {
      kind: "prose",
      h: "Zakaj po telefonu",
      p: [
        "Vsak bazen gre pred dostavo skozi ogled lokacije, zato naročilo tako ali tako ni " +
          "opravljeno v trenutku plačila. Dokler spletno plačilo ni vzpostavljeno, je pot krajša, " +
          "če se za model in termin dogovorimo neposredno.",
      ],
    },
    { kind: "contact", h: "Naročilo in vprašanja" },
    {
      kind: "cta",
      h: "Poglejte ponudbo",
      p: "Šest modelov z merami, specifikacijo in cenami.",
      label: "V trgovino",
      href: "/trgovina",
    },
  ],
};

export const CHECKOUT: Page = {
  key: "/checkout",
  h1: "Blagajna",
  lead: "Spletno plačilo še ni vzpostavljeno. Naročilo sklenemo po telefonu ali e-pošti.",
  metaDescription: "Blagajna.",
  noindex: true,
  blocks: [
    { kind: "contact", h: "Kako naročite" },
    {
      kind: "cta",
      h: "Nazaj v trgovino",
      p: "Modeli, mere in specifikacije.",
      label: "V trgovino",
      href: "/trgovina",
    },
  ],
};
