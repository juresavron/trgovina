import { describe, expect, it } from "vitest";
import { CONSENT_TEXT, PROBLEM_TEXT, parseEnquiry } from "./submit";
import { handleRequest } from "../worker";
import { STUDIO_CSS } from "../themes/studio";

/**
 * THE ENQUIRY IS THIS SHOP'S TRANSACTION, so the rules that decide whether
 * one exists are worth more than the rules that decide how it looks.
 *
 * Everything here runs against parseEnquiry, which is pure by construction —
 * the network half is one RPC and lives beside it. What these hold down is
 * the set of decisions that are cheap to get wrong and expensive to notice:
 * a lead refused because a valid address looked odd, a lead accepted with no
 * way to answer it, a consent tick the server was helpful about.
 */
const body = (o: Record<string, string>): FormData => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.append(k, v);
  return f;
};
const ok = { ime: "Ana Novak", eposta: "ana@example.com", soglasje: "1" };

describe("what counts as an enquiry", () => {
  it("takes a name and one way to answer", () => {
    const r = parseEnquiry(body(ok));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe("Ana Novak");
      expect(r.value.email).toBe("ana@example.com");
      expect(r.value.phone).toBeNull();
    }
  });

  it("takes a telephone instead of an address", () => {
    const r = parseEnquiry(body({ ime: "Ana", telefon: "040 123 456", soglasje: "1" }));
    expect(r.ok).toBe(true);
  });

  /** A lead nobody can answer is not a lead — the DB says so too. */
  it("refuses an enquiry with no way to answer it", () => {
    const r = parseEnquiry(body({ ime: "Ana", soglasje: "1" }));
    expect(r).toEqual({ ok: false, why: "stik" });
  });

  it("refuses one with no name", () => {
    expect(parseEnquiry(body({ eposta: "a@b.si", soglasje: "1" }))).toEqual({
      ok: false,
      why: "ime",
    });
  });

  /**
   * ⚠️ THE CONSENT TICK IS THE ONE FIELD THE SERVER MAY NOT BE HELPFUL
   * ABOUT. An unchecked box submits nothing at all, so an absent value means
   * the visitor did not consent — and a pre-ticked box is not consent either
   * (GDPR art. 4(11); Planet49 C-673/17). Defaulting it to true here would be
   * the same defect the law names, written in TypeScript.
   */
  it("refuses an enquiry with no consent, however complete", () => {
    expect(
      parseEnquiry(body({ ime: "Ana Novak", eposta: "a@b.si", telefon: "040 1", sporocilo: "Prosim za ponudbo." })),
    ).toEqual({ ok: false, why: "soglasje" });
  });

  it("stores the sentence the page prints, not a reference to it", () => {
    const r = parseEnquiry(body(ok));
    expect(r.ok && r.value.consentText).toBe(CONSENT_TEXT);
  });

  /**
   * The one place a form can lose a real customer while looking correct.
   * These are all deliverable addresses; a stricter pattern rejects the
   * last two and the shop never learns it happened.
   */
  it("accepts the addresses people actually have", () => {
    for (const e of [
      "ana@example.com",
      "ana.novak@masazni-bazeni.si",
      "ana+bazen@example.co.uk",
      "ANA@EXAMPLE.SI",
      "a_b-c@sub.domain.example",
    ]) {
      expect(parseEnquiry(body({ ...ok, eposta: e })).ok, e).toBe(true);
    }
  });

  it("rejects a string that is not an address at all", () => {
    for (const e of ["ana", "ana@", "@example.com", "ana example.com", "ana@example"]) {
      expect(parseEnquiry(body({ ...ok, eposta: e })), e).toEqual({ ok: false, why: "eposta" });
    }
  });

  it("refuses a field longer than the column that stores it", () => {
    expect(parseEnquiry(body({ ...ok, sporocilo: "x".repeat(4001) }))).toEqual({
      ok: false,
      why: "dolzina",
    });
    expect(parseEnquiry(body({ ...ok, ime: "x".repeat(121) }))).toEqual({
      ok: false,
      why: "dolzina",
    });
  });

  it("catches the honeypot before anything else", () => {
    // Deliberately also missing a name: the honeypot must win, so the reply
    // gives a bot no signal about which field it failed on.
    expect(parseEnquiry(body({ website: "http://spam", soglasje: "1" }))).toEqual({
      ok: false,
      why: "robot",
    });
  });

  /**
   * ⚠️ THE MODEL NEVER COMES OFF THE WIRE. The router resolves ?model=
   * against this shop's own catalogue and passes the result in; a slug in the
   * BODY must be ignored entirely, or anyone could store an enquiry about a
   * product this shop does not sell and the shop would answer it.
   */
  it("ignores a model and a configuration posted in the body", () => {
    const f = body({ ...ok, model: "ni-nas-model", barva: "Izmišljena" });
    const r = parseEnquiry(f, { modelSlug: "srednji-210", configuration: { "Barva školjke": "Midnight" } });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.modelSlug).toBe("srednji-210");
      expect(r.value.configuration).toEqual({ "Barva školjke": "Midnight" });
    }
    const bare = parseEnquiry(f);
    expect(bare.ok && bare.value.modelSlug).toBeNull();
    expect(bare.ok && bare.value.configuration).toEqual({});
  });

  it("keeps only a channel it offers", () => {
    expect(parseEnquiry(body({ ...ok, kanal: "telefon" })).ok && true).toBe(true);
    const r = parseEnquiry(body({ ...ok, kanal: "golob" }));
    expect(r.ok && r.value.prefer).toBeNull();
  });

  it("has a sentence for every problem it can report", () => {
    for (const why of ["ime", "stik", "eposta", "soglasje", "dolzina", "robot"] as const) {
      expect(PROBLEM_TEXT[why].length, why).toBeGreaterThan(10);
    }
  });
});

/**
 * THE PAGE AND THE ROW MUST AGREE ABOUT WHAT WAS AGREED TO.
 *
 * GDPR art. 7(1) makes the controller prove consent. The row stores a
 * sentence; the page prints one. If they are ever two different sentences,
 * the stored record is evidence of consent to something the visitor never
 * read — so there is one string, and this is what holds the renderer to it.
 */
describe("the consent sentence", () => {
  const page = () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/kontakt?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    return res.text();
  };

  it("is printed beside the box, word for word", async () => {
    const html = await page();
    // The page escapes its text; the sentence has no markup characters, so
    // the comparison is direct.
    expect(html).toContain(CONSENT_TEXT);
  });

  it("says what happens to the data and for how long", () => {
    expect(CONSENT_TEXT).toMatch(/24 mesec/);
    expect(CONSENT_TEXT).toMatch(/prekli/i);
  });

  it("leaves the box unticked", async () => {
    const html = await page();
    const box = html.slice(html.indexOf('id="enq-soglasje"') - 60, html.indexOf('id="enq-soglasje"') + 90);
    expect(box).not.toContain("checked");
    expect(box).toContain("required");
  });
});

describe("the form's own shape", () => {
  it("posts rather than gets, so a refresh cannot resubmit silently", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/kontakt?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    const html = await res.text();
    expect(html).toContain('<form class="st-enq" method="post"');
    // An EMPTY action, so a failed submission keeps ?model= and the
    // configuration. An action of "/kontakt" would drop them and a mistyped
    // e-mail address would cost the visitor their configuration.
    expect(html).not.toContain('class="st-enq" method="post" action=');
  });

  /**
   * ⚠️ A POST WITH NO OUTCOME IS STILL 405. handleRequest only answers POST
   * when the async layer has already written the row and is handing the
   * result down — otherwise the method gate would become a way to render the
   * contact page as if an enquiry had been made.
   */
  it("refuses a POST that did not come through the write path", () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/kontakt?shop=bazen", {
        method: "POST",
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    expect(res.status).toBe(405);
  });

  it("never lets a shared cache keep an enquiry reply", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/kontakt?shop=bazen", {
        method: "POST",
        headers: { host: "trgovina.workers.dev" },
      }),
      { done: true },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.text()).toContain("Povpraševanje je oddano.");
  });

  it("replaces the form on success rather than leaving it filled", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/kontakt?shop=bazen", {
        method: "POST",
        headers: { host: "trgovina.workers.dev" },
      }),
      { done: true },
    );
    const html = await res.text();
    expect(html).not.toContain('<form class="st-enq"');
  });

  it("shows the reason above the form when one is refused", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/kontakt?shop=bazen", {
        method: "POST",
        headers: { host: "trgovina.workers.dev" },
      }),
      { error: PROBLEM_TEXT.stik },
    );
    const html = await res.text();
    expect(html).toContain('role="alert"');
    expect(html).toContain(PROBLEM_TEXT.stik);
    expect(html).toContain('<form class="st-enq"');
  });

  /**
   * WCAG 1.4.11 holds the boundary of an interactive control to 3:1, and
   * --line is the 1.33:1 decorative hairline between surfaces. A text field
   * whose only edge is that line is a field a low-vision reader cannot find,
   * on the one form standing between a visitor and a €3–10k purchase.
   */
  it("draws its inputs with the control rung, not the decorative hairline", () => {
    const rule = STUDIO_CSS.slice(STUDIO_CSS.indexOf(".st-enq-in {"));
    const body = rule.slice(0, rule.indexOf("}"));
    expect(body).toContain("var(--line-ctrl)");
    expect(body).not.toMatch(/border:[^;]*var\(--line\)/);
  });

  it("keeps every tap target at the floor this project holds", () => {
    expect(STUDIO_CSS).toMatch(/\.st-enq-in \{[^}]*min-block-size: 52px/);
    expect(STUDIO_CSS).toMatch(/\.st-enq-r \{[^}]*min-block-size: var\(--st-tap\)/);
  });
});

/**
 * ⚠️ THREE PLACES PROMISE THE SAME NUMBER, AND THEY MUST AGREE.
 *
 * The retention period for an enquiry is stated by the checkbox the visitor
 * ticks (CONSENT_TEXT), by the privacy notice (/zasebnost), and by the
 * database, which enforces it (public.purge_old_enquiries deletes past 24
 * months). Two of the three are prose and drift silently; the third is the
 * only one a customer cannot read. A notice that says "as long as is
 * sensible" beside a box that says "24 months" is two different promises
 * about one row, and the one that is wrong is whichever the shop is asked
 * about.
 */
describe("the retention period", () => {
  it("is the same number in the consent tick and in the privacy notice", async () => {
    expect(CONSENT_TEXT).toContain("24 mesecev");
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/zasebnost?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    const html = await res.text();
    expect(html).toContain("24 mesecev od oddaje");
    // And the vague promise it replaced is gone rather than sitting beside it.
    expect(html).not.toContain("dokler so za odgovor še smiselna");
  });

  it("tells the visitor the enquiry is stored, not just read", async () => {
    const res = handleRequest(
      new Request("https://trgovina.workers.dev/zasebnost?shop=bazen", {
        headers: { host: "trgovina.workers.dev" },
      }),
    );
    const html = await res.text();
    // The art. 7(1) record is itself personal data and has to be declared.
    expect(html).toContain("besedilo soglasja");
    expect(html).toContain("ponudniku podatkovne baze");
  });
});
