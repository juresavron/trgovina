/**
 * What KIND of photograph this is, and the order those kinds belong in.
 *
 * A gallery whose first picture is a top-down view on one model and a close-up
 * of a jet on the next reads as a pile of files rather than as a product. The
 * shop sells six pools that are photographed the same way by the same
 * supplier, so the shots exist to be matched up — nobody had told the software
 * what the categories were.
 *
 * So the model that already looks at every photograph to describe it is also
 * asked what it is a picture OF, from this fixed list, and the panel sorts by
 * that. Every pool then opens on the same establishing shot, and a customer
 * comparing two models is comparing like with like instead of learning a new
 * gallery each time.
 *
 * ⚠️ THE KEYS ARE ENGLISH AND THE LABELS ARE SLOVENIAN, on purpose. The key is
 * an identifier — it goes in a database CHECK constraint, in a prompt, and in
 * a URL if it ever gets that far, and an identifier that changes when somebody
 * improves a translation is a migration nobody wanted. The label is what the
 * operator reads.
 *
 * ⚠️ THE ORDER IS EDITORIAL, NOT TECHNICAL, and it is meant to be argued with.
 * It runs from what the thing IS to what it is LIKE: the whole object first,
 * from above and from the side, because that is what somebody deciding between
 * models needs; then how it looks in use, lit and covered; then inside; then
 * the details that only matter once they are interested. Moving an entry in
 * this array reorders every gallery in the shop at the next arrange, and
 * nothing else has to change.
 */

export interface Shot {
  /** Stable identifier. Stored, constrained, and given to the model. */
  readonly key: string;
  /** What the operator sees in the panel. */
  readonly label: string;
  /** How the shot is explained to the model, in its own words. */
  readonly hint: string;
}

export const SHOTS: readonly Shot[] = [
  {
    key: "top",
    label: "Od zgoraj",
    hint: "the whole tub seen from above, looking down into the shell",
  },
  {
    key: "side",
    label: "S strani",
    hint: "the whole tub seen from the side or at an angle, cabinet visible, not lit",
  },
  {
    key: "lit",
    label: "Osvetljen",
    hint: "the whole tub with its lighting on, or photographed at dusk or night",
  },
  {
    key: "cover",
    label: "S pokrovom",
    hint: "the tub closed, or with a cover, lid or enclosure on it",
  },
  {
    key: "interior",
    label: "Notranjost",
    hint: "the inside of the shell, several seats and the floor visible, not a close-up",
  },
  {
    key: "seat",
    label: "Sedež",
    hint: "a close-up of one seat, lounger or headrest",
  },
  {
    key: "jets",
    label: "Šobe",
    hint: "a close-up of the jets, nozzles or controls",
  },
  {
    key: "other",
    label: "Drugo",
    hint: "anything that is none of the above",
  },
];

/** Every valid key, for validating what comes back from the model. */
export const SHOT_KEYS: ReadonlySet<string> = new Set(SHOTS.map((s) => s.key));

/**
 * Where a shot sorts. Unknown and unclassified sort last, together, in the
 * order they already had — a photograph nobody has classified must not jump to
 * the front of a gallery just because it has no answer yet.
 */
export function shotRank(key: string | null | undefined): number {
  if (!key) return SHOTS.length;
  const i = SHOTS.findIndex((s) => s.key === key);
  return i < 0 ? SHOTS.length : i;
}

/** The operator-facing name, or "" for a photograph nobody has classified. */
export function shotLabel(key: string | null | undefined): string {
  return SHOTS.find((s) => s.key === key)?.label ?? "";
}

/**
 * The list as the model is given it.
 *
 * English, because the keys are, and because a categorisation instruction in
 * the same language as the labels invites the model to answer with a label.
 * The description in describe.ts stays Slovenian: that one is read by people.
 */
export function shotMenu(): string {
  return SHOTS.map((s) => "- " + s.key + ": " + s.hint).join("\n");
}

/**
 * Renumber a set of photographs so the gallery runs in shot order.
 *
 * Ties keep the order they already had, which is what makes this safe to press
 * twice: two interior shots stay in the sequence the operator put them in
 * rather than swapping every time. Returns only the rows whose number actually
 * changes, so an already-sorted gallery costs no writes at all.
 */
export function arrange<T extends { id: string; shot?: string | null; sort: number }>(
  rows: readonly T[],
): { id: string; sort: number }[] {
  const ordered = rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const d = shotRank(a.r.shot) - shotRank(b.r.shot);
      if (d !== 0) return d;
      const s = a.r.sort - b.r.sort;
      return s !== 0 ? s : a.i - b.i;
    });
  const out: { id: string; sort: number }[] = [];
  ordered.forEach((x, n) => {
    if (x.r.sort !== n) out.push({ id: x.r.id, sort: n });
  });
  return out;
}
