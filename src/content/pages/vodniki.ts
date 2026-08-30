import type { Page } from "../pages";

/**
 * The guides INDEX.
 *
 * ⚠️ IT USED TO BE THE GUIDES THEMSELVES. The note that stood here said the
 * articles "are not written yet, so this page answers the three questions
 * directly rather than linking to pages that do not exist" — true when it was
 * written, and it cost the whole long-tail ladder: 375 words under one title,
 * one h1 and one URL, so none of the three queries had a page to rank. They
 * are written now, one per URL, in ./vodnik.ts. This page lists them.
 */
export const GUIDES: Page = {
  key: "/guides",
  h1: "Vodniki za nakup masažnega bazena",
  seoTitle: "Vodniki za nakup masažnega bazena",
  lead:
    "Trije vodniki: kaj preveriti pred nakupom, koliko stane nakup in obratovanje, " +
    "in kako je z bazenom pozimi.",
  metaDescription:
    "Vodniki za nakup masažnega bazena: nosilnost podlage in dostop, cena nakupa in " +
    "obratovanja, ter delovanje pozimi.",
  blocks: [
    // The index IS the links. Each card's own page carries the article; a
    // summary here would be a fourth copy of text that already has a URL.
    {
      kind: "links",
      h: "Vsi vodniki",
      items: [
        ["Masažni bazen na terasi: kaj preveriti pred nakupom", "/vodnik/masazni-bazen-na-terasi"],
        ["Koliko stane masažni bazen", "/vodnik/koliko-stane-masazni-bazen"],
        ["Masažni bazen pozimi", "/vodnik/masazni-bazen-pozimi"],
      ],
    },
    {
      kind: "cta",
      h: "Ostalo vprašanje?",
      p: "Na vprašanja o dostopu, podlagi in priklopu odgovorimo po telefonu, brez obveznosti.",
      label: "Kontakt",
      href: "/kontakt",
    },
  ],
};
