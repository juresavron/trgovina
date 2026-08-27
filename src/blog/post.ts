/**
 * What a blog post is, and how the text somebody typed becomes page blocks.
 *
 * ⚠️ THE TEXT IS THE SOURCE OF TRUTH, AND THE ONLY THING STORED. The database
 * column is jsonb holding `{"source": "…"}` and nothing else; the blocks below
 * are derived on every render. The obvious alternative — parse once, store the
 * blocks, keep the text beside them for editing — gives you two records of the
 * same post that can disagree, and the day they disagree is the day somebody
 * edits a post and the page does not change. jsonb rather than text because a
 * later field (a series, a tag list, an author) then costs no migration.
 *
 * ⚠️ AND A POST CANNOT EMIT MARKUP. That is the whole reason it is parsed into
 * the same Block vocabulary the editorial pages use rather than stored as HTML
 * or run through a Markdown library: the theme owns how each block looks and
 * escapes every string it renders, so the worst a post can do to the page is
 * be badly written. An admin account is not a licence to inject script into a
 * storefront — the account could be taken, and a blog editor that accepts HTML
 * is the most ordinary way a shop ends up serving somebody else's JavaScript.
 *
 * THE MARKUP THE OPERATOR TYPES is four things, and the panel says so on the
 * page rather than in a manual:
 *
 *   ## Naslov      a heading; what follows belongs under it
 *   - točka        a bullet; consecutive ones are one list
 *   V: vprašanje   a question…
 *   O: odgovor     …and its answer; consecutive pairs are one Q&A block,
 *                  which is also what earns the post an FAQ rich result
 *   -> /pot Ime    a link to one of this shop's own pages; consecutive ones
 *                  are one row
 *   anything else  a paragraph; a blank line starts the next one
 *
 * Nothing here is required. A post that is five paragraphs of prose parses
 * into one prose block, which is exactly right.
 */

import type { Block } from "../content/pages";

export type PostStatus = "draft" | "published";

export interface Post {
  readonly id: string;
  /** The URL segment under the shop's blog route. Unique per shop. */
  readonly slug: string;
  readonly title: string;
  /** The standfirst, and the meta description. Derived if left empty. */
  readonly excerpt: string;
  /** The text the operator typed — see the note at the top of this file. */
  readonly source: string;
  /** A path under this shop's own origin ('/media/blog/…'), or nothing. */
  readonly coverUrl: string | null;
  readonly coverAlt: string;
  readonly status: PostStatus;
  /** ISO timestamp; null while the post has never been published. */
  readonly publishedAt: string | null;
  readonly updatedAt: string;
}

/** A post as the index and the card lists need it — no body. */
export type PostCard = Pick<
  Post,
  "slug" | "title" | "excerpt" | "coverUrl" | "coverAlt" | "publishedAt"
>;

const HEADING = /^##\s+(.+)$/;
const BULLET = /^[-*•–]\s+(.+)$/;
const ASK = /^[VQ]:\s*(.+)$/;
const ANSWER = /^[OA]:\s*(.+)$/;
const LINK = /^->\s*(\S+)\s+(.+)$/;

/**
 * Whether a post may link to this path.
 *
 * ⚠️ INTERNAL ABSOLUTE PATHS ONLY, AND THIS IS THE WHOLE GATE. Everything
 * else in a post is escaped text, so this is the one place a post reaches the
 * href of an anchor — which makes it the one place a taken admin account
 * could publish an outbound link from the shop's own domain, or a javascript:
 * URL into a page a customer trusts.
 *
 * One leading slash, then lowercase letters, digits, hyphen and slash. That
 * refuses a scheme (no colon survives), refuses a host, and refuses the
 * protocol-relative "//evil.example" that a naive startsWith("/") check lets
 * straight through. A line whose target fails is not dropped — it renders as
 * the paragraph it looks like, so the writer sees their own text on the page
 * rather than losing it silently.
 */
export function isInternalPath(href: string): boolean {
  return /^\/[a-z0-9/-]*$/.test(href) && !href.startsWith("//") && !href.includes("..");
}

/**
 * The operator's text, as blocks the theme can render.
 *
 * Line-driven and forgiving on purpose: every line that is not one of the
 * three marked forms is a paragraph, so there is no way to type something
 * that fails to publish. The failure mode of a mistyped marker is a line of
 * prose that says "V vprašanje", which the writer can see and fix, rather
 * than an error page they cannot.
 */
export function parseSource(src: string): Block[] {
  const out: Block[] = [];
  let heading: string | undefined;
  let mode: "none" | "prose" | "list" | "qa" | "links" = "none";
  let paragraphs: string[] = [];
  let current: string[] = [];
  let items: string[] = [];
  let pairs: [string, string][] = [];
  let hrefs: [string, string][] = [];

  const endParagraph = (): void => {
    if (current.length > 0) {
      paragraphs.push(current.join(" "));
      current = [];
    }
  };

  /**
   * Emit whatever has accumulated.
   *
   * ⚠️ A PENDING HEADING SURVIVES A FLUSH THAT EMITTED NOTHING. "## Naslov"
   * followed by a bullet list has to put the heading on the list, and the
   * heading arrives one line before the mode changes — so the switch flushes
   * an empty prose block and would have eaten the heading with it.
   */
  const flush = (): void => {
    endParagraph();
    const head = heading ? { h: heading } : {};
    if (mode === "prose" && paragraphs.length > 0) {
      out.push({ kind: "prose", ...head, p: paragraphs });
    } else if (mode === "list" && items.length > 0) {
      out.push({ kind: "list", ...head, items });
    } else if (mode === "links" && hrefs.length > 0) {
      out.push({ kind: "links", ...head, items: hrefs });
    } else if (mode === "qa") {
      // A question nobody answered is not a Q&A entry, and emitting one would
      // put an empty answer into the FAQ structured data — which is a
      // structured-data violation, not just an ugly page.
      const answered = pairs.filter(([, a]) => a !== "");
      if (answered.length > 0) out.push({ kind: "qa", ...head, items: answered });
      else {
        paragraphs = [];
        items = [];
        pairs = [];
        hrefs = [];
        mode = "none";
        return;
      }
    } else {
      paragraphs = [];
      items = [];
      pairs = [];
      hrefs = [];
      mode = "none";
      return; // heading stays pending
    }
    paragraphs = [];
    items = [];
    pairs = [];
    hrefs = [];
    heading = undefined;
    mode = "none";
  };

  /** A heading with nothing under it is still a heading the writer meant. */
  const orphan = (): void => {
    if (heading) {
      out.push({ kind: "prose", h: heading, p: [] });
      heading = undefined;
    }
  };

  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "") {
      endParagraph();
      continue;
    }

    const h = HEADING.exec(line);
    if (h) {
      flush();
      orphan();
      heading = h[1]!.trim();
      continue;
    }

    const a = ANSWER.exec(line);
    if (a && mode === "qa" && pairs.length > 0 && pairs[pairs.length - 1]![1] === "") {
      pairs[pairs.length - 1]![1] = a[1]!.trim();
      continue;
    }

    const q = ASK.exec(line);
    if (q) {
      if (mode !== "qa") {
        flush();
        mode = "qa";
      }
      pairs.push([q[1]!.trim(), ""]);
      continue;
    }

    const l = LINK.exec(line);
    if (l && isInternalPath(l[1]!)) {
      if (mode !== "links") {
        flush();
        mode = "links";
      }
      hrefs.push([l[2]!.trim(), l[1]!]);
      continue;
    }

    const b = BULLET.exec(line);
    if (b) {
      if (mode !== "list") {
        flush();
        mode = "list";
      }
      items.push(b[1]!.trim());
      continue;
    }

    if (mode !== "prose") {
      flush();
      mode = "prose";
    }
    current.push(line);
  }

  flush();
  orphan();
  return out;
}

/**
 * The first sentences of a post, for a card and for the meta description.
 *
 * Google draws about 155 characters of description, so that is the budget,
 * and the cut is on a word boundary with an ellipsis — a description that
 * ends mid-word reads as broken rather than as truncated. Markers are
 * stripped so a post that opens with a heading does not describe itself as
 * "## Zakaj".
 */
export function excerptFrom(src: string, max = 155): string {
  const first = parseSource(src).find(
    (b): b is Extract<Block, { kind: "prose" }> => b.kind === "prose" && b.p.length > 0,
  );
  const text = first?.p[0] ?? "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > 40 ? cut.slice(0, space) : cut).replace(/[,;:.\s]+$/, "") + "…";
}

/**
 * How long the post takes to read, in whole minutes.
 *
 * 200 words a minute is the usual figure for silent reading of ordinary
 * prose. Never zero: "0 min branja" is worse than a rounding error.
 */
export function readMinutes(src: string): number {
  const words = src.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const MONTHS = [
  "januarja", "februarja", "marca", "aprila", "maja", "junija",
  "julija", "avgusta", "septembra", "oktobra", "novembra", "decembra",
];

/**
 * A date as Slovenian prose — "14. marca 2026".
 *
 * Written out rather than run through Intl: the Worker's ICU data is not
 * something to depend on for four words, and the genitive month names are the
 * form a Slovenian date takes in a sentence, which Intl's "short" and "long"
 * both get wrong in one direction or the other.
 */
export function dateText(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.getUTCDate() + ". " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
}

/** The date part of an ISO timestamp, for <time datetime>. */
export function dateAttr(iso: string): string {
  return iso.slice(0, 10);
}
