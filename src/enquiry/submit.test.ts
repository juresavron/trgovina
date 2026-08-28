import { describe, expect, it } from "vitest";
import {
  CONSENT_TEXT,
  PROBLEM_FIELD,
  PROBLEM_TEXT,
  parseEnquiry,
  type EnquiryProblem,
} from "./submit";
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

  // ⚠️ AND IT SAYS WHICH FIELD. It used to answer a single "dolzina" for all
  // four, so the page could only print "one of the fields is too long" —
  // which is the sentence WCAG SC 3.3.1 exists to forbid, on a form with
  // fourteen controls.
  it("refuses a field longer than the column that stores it, and names it", () => {
    expect(parseEnquiry(body({ ...ok, sporocilo: "x".repeat(4001) }))).toEqual({
      ok: false,
      why: "dolzina-sporocilo",
    });
    expect(parseEnquiry(body({ ...ok, ime: "x".repeat(121) }))).toEqual({
      ok: false,
      why: "dolzina-ime",
    });
    expect(parseEnquiry(body({ ...ok, telefon: "1".repeat(65) }))).toEqual({
      ok: false,
      why: "dolzina-telefon",
    });
    expect(parseEnquiry(body({ ...ok, dostop: "x".repeat(4001) }))).toEqual({
      ok: false,
      why: "dolzina-dostop",
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

  // ⚠️ DERIVED FROM THE TABLE, NOT LISTED AGAIN. The list used to be typed
  // out here, so splitting "dolzina" into one problem per field left the new
  // ones untested while the suite stayed green.
  it("has a sentence for every problem it can report", () => {
    const problems = Object.keys(PROBLEM_TEXT) as EnquiryProblem[];
    expect(problems.length).toBeGreaterThan(5);
    for (const why of problems) {
      expect(PROBLEM_TEXT[why].length, why).toBeGreaterThan(10);
    }
  });

  /**
   * SC 3.3.1 asks that an error identify the item in error. The page can only
   * do that if every problem knows which control it is about — so the two
   * tables must stay in step, and a problem added to one and not the other is
   * a message the page cannot point anywhere.
   */
  it("knows which field every problem is about", () => {
    for (const why of Object.keys(PROBLEM_TEXT) as EnquiryProblem[]) {
      expect(PROBLEM_FIELD, why).toHaveProperty(why);
    }
    expect(PROBLEM_FIELD.robot, "no human reaches the honeypot").toBeNull();
    for (const why of Object.keys(PROBLEM_FIELD) as EnquiryProblem[]) {
      if (why !== "robot") expect(PROBLEM_FIELD[why], why).toBeTruthy();
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

/**
 * ⚠️ A REFUSED SUBMISSION MUST COME BACK FILLED IN.
 *
 * The form posts to its own URL with an empty action, which was chosen so a
 * failed submit keeps ?model= and the whole configuration — the comment at
 * that line says so. What it did not keep was the FIELDS: `field()` never
 * emitted a value, so somebody who wrote their name, two long paragraphs
 * describing the access to their garden and ticked consent, but left out a
 * phone number, got the lot wiped. The access prompt asks for three separate
 * measurements; on a phone, re-typing that is where the enquiry ends.
 *
 * Two things must NOT come back, and they are the point of the whitelist:
 * the honeypot, which a re-rendered value would defeat, and consent, because
 * a box that re-ticks itself is a pre-ticked box on the second attempt —
 * GDPR art. 4(11), Planet49 C-673/17.
 */
describe("the enquiry form after a refusal", () => {
  const render = (sent: Record<string, string>) =>
    handleRequest(
      new Request("https://trgovina.workers.dev/kontakt?shop=bazen"),
      { error: "Vpišite telefon ali e-pošto.", sent },
    );

  it("gives every typed field back", async () => {
    const html = await (await render({
      ime: "Ana Novak",
      eposta: "ana@example.test",
      kraj: "6000 Koper",
      dostop: "Najožji prehod 90 cm, tri stopnice, omarica 12 m stran.",
      sporocilo: "Zanima me dobavni rok.",
      kanal: "e-posta",
    })).text();
    expect(html).toContain('value="Ana Novak"');
    expect(html).toContain('value="ana@example.test"');
    expect(html).toContain('value="6000 Koper"');
    expect(html).toContain("Najožji prehod 90 cm, tri stopnice, omarica 12 m stran.");
    expect(html).toContain("Zanima me dobavni rok.");
    // The chosen channel comes back selected, not reset to neither.
    expect(html).toMatch(/id="enq-k-e"[^>]*checked/);
    expect(html).not.toMatch(/id="enq-k-t"[^>]*checked/);
  });

  it("never re-ticks consent", async () => {
    const html = await (await render({ ime: "Ana Novak" })).text();
    expect(html).toMatch(/id="enq-soglasje"/);
    expect(html, "a box that re-ticks itself is a pre-ticked box")
      .not.toMatch(/id="enq-soglasje"[^>]*checked/);
  });

  /** Whatever a bot put in the honeypot must not be handed back to it. */
  it("never echoes the honeypot", async () => {
    const html = await (await render({ ime: "Ana" })).text();
    expect(html).toMatch(/id="enq-website"[^>]*>/);
    expect(html).not.toMatch(/id="enq-website"[^>]*value=/);
  });

  /** Their own text, round-tripped through a request, is still escaped. */
  it("escapes what it gives back", async () => {
    const html = await (await render({ ime: '"><script>alert(1)</script>' })).text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });
});

/**
 * ⚠️ THE SUMMARY CARD'S FIGURE IS WHAT THE BUYER COMMITS TO.
 *
 * It printed the catalogue base while listing the extras they had just ticked
 * directly underneath. Measured on a real configuration: the product page's
 * bar read 7.060 € and this card read 6.690 €, with "Termo pokrov" and
 * "Dvigalo za termo pokrov" named below the figure. A 370 € contradiction on
 * the one page where somebody decides.
 */
describe("the price on the enquiry summary", () => {
  const at = (qs: string) =>
    handleRequest(new Request("https://trgovina.workers.dev/kontakt?shop=bazen&" + qs));

  it("adds the chosen extras to the base", async () => {
    const bare = await (await at("model=mali-195")).text();
    expect(bare).toContain("6.690");

    const withExtras = await (await at(
      "model=mali-195&oprema=" + encodeURIComponent("Termo pokrov"),
    )).text();
    const card = withExtras.slice(withExtras.indexOf("st-enq-about"));
    const shown = card.slice(0, card.indexOf("</div>"));
    // Whatever it now says, it must not be the bare base while an extra is
    // listed beside it.
    expect(shown).toContain("Termo pokrov");
    expect(shown, "the card still shows the base price next to a paid extra")
      .not.toMatch(/st-enq-about-p">6\.690/);
  });

  /** An unpriced model must not grow a total out of nothing. */
  it("leaves an unset base alone", async () => {
    const html = await (await at("model=mali-195")).text();
    expect(html).not.toContain("NaN");
    expect(html).not.toMatch(/st-enq-about-p">\s*€/);
  });
});

/**
 * ⚠️ SC 3.3.1 AND 1.3.1 ON THE SITE'S ONLY TRANSACTION.
 *
 * /kosarica and /blagajna are placeholders — "spletno naročanje še ni odprto".
 * So this form is the entire mechanism by which anyone can buy anything here,
 * and until now a refused submission put a sentence in a role="alert" above
 * fourteen controls with nothing tying it to any of them: no id on the
 * paragraph, no aria-invalid, no aria-describedby, no focus move. The form
 * carries novalidate, so the browser's own per-field identification was
 * suppressed as well — there was no other channel.
 *
 * The hints had the same shape of problem: visible text, no id, nothing
 * pointing at them, so the three measurements the business needs on the
 * access field were never announced at the control.
 */
describe("a refused enquiry identifies the field it is about", () => {
  const refused = (field: string, error = "Vpišite ime, da vas znamo nagovoriti.") =>
    handleRequest(new Request("https://trgovina.workers.dev/kontakt?shop=bazen"), {
      error,
      field,
    });

  it("marks that field invalid, describes it by the message, and focuses it", async () => {
    const html = await (await refused("ime")).text();
    expect(html).toContain('id="enq-err"');
    const input = /<input[^>]*id="enq-ime"[^>]*>/.exec(html)?.[0] ?? "";
    expect(input, "the field the message names").toContain('aria-invalid="true"');
    expect(input).toContain("autofocus");
    expect(input).toMatch(/aria-describedby="[^"]*enq-err/);
  });

  it("leaves the other fields alone", async () => {
    const html = await (await refused("ime")).text();
    const other = /<input[^>]*id="enq-eposta"[^>]*>/.exec(html)?.[0] ?? "";
    expect(other).not.toContain("aria-invalid");
    expect(other).not.toContain("autofocus");
  });

  /** Consent and the two textareas are built outside the field() helper. */
  it("reaches the controls that are not built by the shared helper", async () => {
    for (const [name, tag] of [
      ["soglasje", "input"],
      ["dostop", "textarea"],
      ["sporocilo", "textarea"],
    ] as const) {
      const html = await (await refused(name)).text();
      const el = new RegExp("<" + tag + "[^>]*id=\"enq-" + name + "\"[^>]*>").exec(html)?.[0] ?? "";
      expect(el, name).toContain('aria-invalid="true"');
      expect(el, name).toContain("autofocus");
    }
  });

  it("announces every hint at its own control", async () => {
    const html = await (await handleRequest(
      new Request("https://trgovina.workers.dev/kontakt?shop=bazen"),
    )).text();
    for (const name of ["kraj", "dostop"]) {
      expect(html, name).toContain('id="enq-' + name + '-hint"');
      const el = new RegExp("<(?:input|textarea)[^>]*id=\"enq-" + name + "\"[^>]*>").exec(html)?.[0] ?? "";
      expect(el, name).toMatch(new RegExp('aria-describedby="[^"]*enq-' + name + '-hint'));
    }
  });

  /** Nothing is marked invalid on a form nobody has submitted yet. */
  it("marks nothing on a first visit", async () => {
    const html = await (await handleRequest(
      new Request("https://trgovina.workers.dev/kontakt?shop=bazen"),
    )).text();
    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain("autofocus");
  });
});
