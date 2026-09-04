/**
 * THE FLASH MESSAGES, IN ONE PLACE.
 *
 * Every write answers 303 with ?m= or ?e= and the following GET turns the key
 * back into a sentence. The keys are what travel in the URL, so they are a
 * vocabulary shared by every surface — which is why they are here and not
 * beside any one of them, and why an unknown key falls back to a generic
 * sentence rather than printing the key at a customer of this shop.
 */

/**
 * Why an upload was refused, in the operator's language.
 *
 * One message for every `e` used to render regardless of cause — it always
 * said the alt text was missing — so the day a second failure existed the
 * panel would have confidently reported the wrong one.
 */
export const ERRORS: Record<string, string> = {
  // Kept for links that may still carry it; nothing emits it any more — an
  // upload is no longer refused for want of a description.
  alt: "Opis slike je obvezen.",
  file: "Nobena slika ni bila izbrana.",
  "fin-none": "Te barve ni na seznamu.",
  "fin-noai": "Samodejno poimenovanje ni nastavljeno (manjka ključ za AI).",
  "fin-noimg": "Vzorca te barve ni v shrambi, zato ga model ne more pogledati.",
  "fin-noname": "Model barve ni znal poimenovati. Ime vpišite sami v polje.",
  fin: "Vzorec je shranjen, barve pa ni bilo mogoče dodati na seznam barv. " +
    "Poskusite znova; če se ponovi, jo naložite prek strani Barve.",
  // The panel converts every upload itself, in the browser, before it sends
  // anything — so this message is about the CONVERSION not having run, not
  // about the operator's file being the wrong kind. Naming JavaScript first
  // is the useful half: with script on, no browser this panel supports
  // reaches here.
  type: "Slika ni bila pretvorjena v WebP. To se zgodi le, če je JavaScript " +
    "izklopljen — vklopite ga in poskusite znova.",
  // The page said one thing and the database said another, so nothing was
  // deleted. The operator gets to look before deciding again.
  stale: "Seznam fotografij se je med tem spremenil, zato ni bilo nič " +
    "izbrisano. Osvežite stran in poskusite znova.",
  "no-ai": "Razvrščanje potrebuje GEMINI_API_KEY, ki ni nastavljen.",
  store: "Slike ni bilo mogoče shraniti. Poskusite znova; če se ponovi, " +
    "je težava pri shrambi in ne pri vaši sliki.",
  title: "Zapis potrebuje naslov.",
  post: "Zapisa ni bilo mogoče shraniti. Poskusite znova.",
  rv: "Mnenja ni bilo mogoče shraniti. Poskusite znova.",
  "rv-empty": "Mnenje potrebuje besedilo in podpis.",
  // The tick was offered, the evidence was not. See reviews.ts: the chip is a
  // claim under Annex I 23b and the order number is the check behind it.
  "rv-unverified": "Za oznako »preverjen nakup« vpišite številko naročila.",
};

export const NOTICES: Record<string, string> = {
  saved: "Shranjeno.",
  deleted: "Fotografija je izbrisana.",
  uploaded: "Fotografija je naložena.",
  cleared: "Vse fotografije tega modela so izbrisane.",
  arranged: "Fotografije so razvrščene po vrsti posnetka.",
  // Honest rather than tidy: some were placed, some were not, and pressing
  // the button again continues where this left off.
  "arranged-partly": "Del fotografij je razvrščen. Pritisnite »Razvrsti z UI« " +
    "še enkrat, da se razvrstijo tudi ostale.",
  // Not an error: the operator asked for an empty set and the set is empty.
  "deleted-none": "Ta model ni imel fotografij.",
  "post-saved": "Zapis je shranjen.",
  "enq-saved": "Povpraševanje je posodobljeno.",
  "enq-deleted": "Povpraševanje je izbrisano.",
  "fin-saved": "Ime barve je shranjeno.",
  "fin-named": "Barva je poimenovana po odtenku na vzorcu. Če ime ni pravo, ga popravite v polju.",
  "fin-uploaded":
    "Vzorci so naloženi. Spodaj je seznam barv, ki jih trgovina lahko pokaže.",
  "fin-deleted": "Barva je odstranjena s seznama.",
  "post-published": "Zapis je objavljen in je na spletni strani.",
  "post-unpublished": "Zapis je umaknjen s spletne strani.",
  "post-deleted": "Zapis je izbrisan.",
  "cover-set": "Naslovna slika je naložena.",
  "cover-cleared": "Naslovna slika je odstranjena.",
  "rv-saved": "Mnenje je shranjeno. Na strani se pokaže ob naslednji posodobitvi.",
  "rv-deleted": "Mnenje je izbrisano.",
};
