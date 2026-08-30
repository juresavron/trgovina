/**
 * The guided choice — three questions, one honest recommendation.
 *
 * WHY IT EXISTS. The category's best sites all run a "help me choose" flow,
 * because the highest-intent visitor a spa shop gets is the one who does not
 * yet know WHICH model they need — and a quiz turns that visitor into a
 * pre-qualified enquiry instead of a bounce. For a six-model catalogue the
 * mapping is small enough to be exact rather than fuzzy.
 *
 * WHY IT IS SERVER-RENDERED. Every answer is a GET link that adds one query
 * parameter; the worker renders the next step from the accumulated params.
 * No JS, no state, nothing to hydrate — a crawler and a no-script visitor
 * walk the same path as everyone else, and the terminal page carries real
 * model links a crawler can follow.
 *
 * ⚠️ EVERY RECOMMENDATION IS DERIVED FROM CATALOGUE FACTS a reader can check
 * on the model's own page: seats, lounges, footprint, counter-current jets.
 * The `why` strings say those facts back. Nothing here may claim a property
 * the spec table does not state.
 */

/** One answer a visitor can pick: label, the value it writes, a hint. */
export interface FinderChoice {
  readonly value: string;
  readonly label: string;
  readonly hint: string;
}

export interface FinderStep {
  /** The query parameter this step writes. */
  readonly param: string;
  readonly question: string;
  readonly choices: readonly FinderChoice[];
}

/** What the finder concludes: model slugs, and the reasons said plainly. */
export interface FinderResult {
  /** Product slugs, best first. Never empty. */
  readonly slugs: readonly string[];
  /** One sentence per recommendation, from catalogue facts. */
  readonly why: string;
}

const NAMEN: FinderStep = {
  param: "namen",
  question: "Kaj naj bazen zna?",
  choices: [
    {
      value: "sprostitev",
      label: "Masaža in sprostitev",
      hint: "Sedenje, masažne šobe, večer na terasi.",
    },
    {
      value: "plavanje",
      label: "Plavanje proti toku",
      hint: "Protitočne šobe ustvarijo tok, v katerem se plava na mestu.",
    },
  ],
};

const OSEBE: FinderStep = {
  param: "osebe",
  question: "Koliko vas bo v njem?",
  choices: [
    {
      value: "druzina",
      label: "Do 5 oseb, radi ležimo",
      hint: "Dva ležalnika in trije sedeži.",
    },
    {
      value: "druzba",
      label: "6 oseb naenkrat",
      // "med masažnimi bazeni", not "v ponudbi": both SWIM 580 seat seven,
      // and this step is asked inside the relaxation branch where the
      // comparison set is the hot-tub family — the hint has to say so.
      hint: "En ležalnik in pet sedežev, največ mest med masažnimi bazeni.",
    },
  ],
};

const PROSTOR: FinderStep = {
  param: "prostor",
  question: "Koliko prostora imate?",
  choices: [
    {
      value: "manj",
      label: "Manjša terasa",
      hint: "Okoli dveh metrov v kvadrat.",
    },
    {
      value: "vec",
      label: "Prostora je dovolj",
      hint: "2,3 m v kvadrat ali več.",
    },
  ],
};

const MASAZA: FinderStep = {
  param: "masaza",
  question: "Koliko masaže po plavanju?",
  choices: [
    {
      value: "najvec",
      label: "Čim več",
      hint: "94 masažnih šob in pet črpalk.",
    },
    {
      value: "uravnotezeno",
      label: "Uravnoteženo",
      hint: "38 šob, ležalnik in šest sedežev.",
    },
  ],
};

/** The answers accumulated so far, straight off the query string. */
export interface FinderAnswers {
  readonly namen?: string;
  readonly osebe?: string;
  readonly prostor?: string;
  readonly masaza?: string;
}

/**
 * The next question, or null when the answers already decide a result.
 *
 * The tree is shallow on purpose: relaxation resolves in three questions,
 * swimming in two — a quiz longer than the catalogue is a form, not a help.
 */
export function nextStep(a: FinderAnswers): FinderStep | null {
  if (a.namen !== "sprostitev" && a.namen !== "plavanje") return NAMEN;
  if (a.namen === "plavanje") {
    return a.masaza === "najvec" || a.masaza === "uravnotezeno" ? null : MASAZA;
  }
  if (a.osebe !== "druzina" && a.osebe !== "druzba") return OSEBE;
  if (a.osebe === "druzba") return null;
  return a.prostor === "manj" || a.prostor === "vec" ? null : PROSTOR;
}

/**
 * The answers minus the LAST one given, or null at the start.
 *
 * Derived by replaying the tree rather than by knowing its shape: walk from
 * empty, applying whichever parameter the tree asks for next, and the answer
 * applied last is the one a "back" link removes. A branch added to nextStep()
 * therefore gets a correct back link for free, and cannot drift from one.
 */
export function previousAnswers(a: FinderAnswers): FinderAnswers | null {
  const walked = walk(a);
  if (walked.order.length === 0) return null;
  const back: Record<string, string> = {};
  for (const key of walked.order.slice(0, -1)) back[key] = a[key]!;
  return back as FinderAnswers;
}

/**
 * Replay the tree over an answer set and keep only what the tree ACCEPTED.
 *
 * ⚠️ THE ACCEPTANCE TEST IS WHAT TERMINATES THE LOOP. The first version
 * applied whatever value the query string held for the asked parameter;
 * given ?namen=x, nextStep() re-asks "namen" (an unrecognised value is
 * unanswered by design), the replay applied "x" again, and the walk never
 * advanced — an infinite loop a visitor could reach from the address bar,
 * killing the isolate on an indexable route. A value the step's own choices
 * do not list now ends the walk exactly as an absent one does, so the whole
 * module treats a hand-edited URL as "answered up to the first nonsense".
 */
export function walk(a: FinderAnswers): {
  readonly order: readonly (keyof FinderAnswers)[];
  readonly seen: FinderAnswers;
} {
  const order: (keyof FinderAnswers)[] = [];
  let seen: FinderAnswers = {};
  for (;;) {
    const step = nextStep(seen);
    if (!step) break;
    const key = step.param as keyof FinderAnswers;
    const value = a[key];
    if (!value || !step.choices.some((c) => c.value === value)) break;
    order.push(key);
    seen = { ...seen, [key]: value };
  }
  return { order, seen };
}

/**
 * The verdict for a complete answer set. Callers guard with nextStep() ===
 * null; given an incomplete set this still answers sensibly rather than
 * throwing, because a visitor can hand-edit a URL.
 */
export function recommend(a: FinderAnswers): FinderResult {
  if (a.namen === "plavanje") {
    if (a.masaza === "najvec") {
      return {
        slugs: ["swim-580-maxi", "swim-580-hidro"],
        why:
          "SWIM 580 MAXI ima med vsemi modeli največ masažnih šob: 94 na pet " +
          // ⚠️ "PLAVALNA DOLŽINA" IS NOT A FIGURE THE SHEET GIVES. 5,80 m is
          // the SHELL length, and both 580s carry seven seats and a lounger
          // inside it, so the swimmable run is shorter by an amount nobody has
          // measured. Say the number the supplier states, about the thing it
          // states it about.
          "črpalk, v 5,80 m dolgi školjki. Če toliko masaže ne " +
          "potrebujete, je SWIM 580 HIDRO enaka školjka z 38 šobami.",
      };
    }
    return {
      slugs: ["swim-580-hidro", "swim-580-maxi"],
      why:
        "SWIM 580 HIDRO združi 5,80 m dolgo školjko s 38 masažnimi " +
        "šobami, ležalnikom in šestimi sedeži. Če bi masaže radi še več, ima " +
        "SWIM 580 MAXI na isti dolžini 94 šob.",
    };
  }
  if (a.osebe === "druzba") {
    return {
      slugs: ["srednji-210"],
      why:
        // "med masažnimi bazeni", not "model": this branch is inside the
        // relaxation path, where the comparison set is the hot-tub family —
        // the same scoping the OSEBE hint above already carries. Both SWIM
        // 580s seat seven, so an unqualified "the only model" is a claim the
        // catalogue on the next page contradicts.
        "BAZEN 210 je edini masažni bazen s šestimi mesti: en ležalnik in pet " +
        "sedežev na 2,10 × 2,10 m.",
    };
  }
  if (a.prostor === "manj") {
    return {
      slugs: ["mali-195"],
      why:
        // "gresta", not "greta" — the 3rd-person dual of iti. The collection
        // page two clicks away has it right ("kamor druga dva ne gresta").
        "BAZEN 195 se pri 1,95 × 1,95 m umesti tja, kamor večja modela ne gresta, " +
        "in kljub temu obdrži dva ležalnika in 35 šob.",
    };
  }
  return {
    slugs: ["veliki-230"],
    why:
      // ⚠️ "MED MASAŽNIMI BAZENI", AND IT SAID "v ponudbi". The offer also
      // holds three swim spas from 4,50 to 5,80 m, so "the largest in the
      // range" was contradicted by the shop's own /trgovina two clicks away —
      // on the sentence whose entire job is to explain why this model. Same
      // fault the OSEBE hint in this file was already fixed for.
      "BAZEN 230 je največji med masažnimi bazeni: 2,30 × 2,30 m, dva " +
      "ležalnika in 50 šob na dveh črpalkah.",
  };
}
