import type { Page } from "../pages";

/**
 * Cart and checkout are per-visitor surfaces, not content, so both are
 * noindex regardless of launch state. Neither is wired to a payment
 * integration yet; the honest page says so and gives the route that does work
 * today — the phone. A basket that silently does nothing is worse than one
 * that says what it is.
 *
 * NOINDEX IS NOT A LICENCE FOR A ONE-WORD DESCRIPTION. Both of these carried
 * "Košarica." and "Blagajna." on the reasoning that nothing would ever read
 * them. Two things do: the person who pastes the URL into a message and gets
 * the description as the link preview, and whoever flips noindex off later.
 * Both descriptions now say what the page says — that ordering runs through
 * the phone — and they are worded differently from each other and from every
 * other page's.
 *
 * The checkout also stopped being four lines long. It is the page where a
 * buyer wants to know how the deal is actually struck, and the answer (a
 * written offer, then a written confirmation on a durable medium) is the same
 * one the terms give, so it costs nothing to repeat here where it is needed.
 */
export const CART: Page = {
  key: "/cart",
  h1: "Košarica",
  lead: "Spletno naročanje še ni odprto. Naročila zaenkrat sprejemamo po telefonu in e-pošti.",
  metaDescription:
    "Spletno naročanje masažnih bazenov še ni odprto. Naročilo in ponudbo uredimo po telefonu " +
    "ali e-pošti, po ogledu lokacije.",
  noindex: true,
  blocks: [
    {
      kind: "prose",
      h: "Zakaj po telefonu",
      p: [
        "Pred dostavo opravimo ogled lokacije, zato naročilo tako ali tako ni sklenjeno " +
          "v trenutku plačila. Dokler spletno plačilo ni vzpostavljeno, je pot krajša, če se za " +
          "model, konfiguracijo in termin dogovorimo neposredno.",
      ],
    },
    { kind: "contact", h: "Naročilo in vprašanja" },
    {
      kind: "cta",
      h: "Poglejte ponudbo",
      p: "Trije masažni bazeni in trije swim spa bazeni — mere, specifikacije in cene.",
      label: "V trgovino",
      href: "/trgovina",
    },
  ],
};

export const CHECKOUT: Page = {
  key: "/checkout",
  h1: "Blagajna",
  lead: "Spletno plačilo še ni vzpostavljeno. Naročilo sklenemo po telefonu ali e-pošti.",
  metaDescription:
    "Spletno plačilo še ni vzpostavljeno. Naročilo sklenemo s pisno ponudbo po telefonu ali " +
    "e-pošti — v njej so končna cena z DDV, obseg montaže in rok.",
  noindex: true,
  // legal: the page states HOW A CONTRACT FORMS, which is a statement of
  // rights and obligations like any in pogoji.ts — it belongs under the same
  // identity gate, and a page describing the seller's offer should name the
  // seller (the imprint below).
  legal: true,
  blocks: [
    {
      kind: "steps",
      h: "Kako sklenemo naročilo",
      items: [
        [
          "Dogovor o modelu",
          "Po telefonu ali e-pošti se dogovorimo za model in konfiguracijo ter za termin ogleda " +
            "lokacije.",
        ],
        [
          "Pisna ponudba",
          "V njej so model in konfiguracija, končna cena z DDV, obseg dostave in montaže, rok " +
            "in plačilni pogoji. Nič od tega ni prepuščeno dogovoru po dostavi.",
        ],
        [
          "Potrditev",
          "Pogodba je sklenjena, ko ponudbo pisno potrdite. Potrditev in pogoje prejmete na " +
            "trajnem nosilcu podatkov, praviloma po e-pošti.",
        ],
      ],
    },
    { kind: "contact", h: "Kako naročite" },
    { kind: "imprint", h: "Prodajalec" },
    {
      kind: "cta",
      h: "Celotni pogoji",
      p: "Kako nastane pogodba, kaj cena vključuje in vaše pravice pri odstopu.",
      label: "Pogoji poslovanja",
      href: "/pogoji-poslovanja",
    },
  ],
};
