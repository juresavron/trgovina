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
      hint: "En ležalnik in pet sedežev — največ mest v ponudbi.",
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
  const order: (keyof FinderAnswers)[] = [];
  let seen: FinderAnswers = {};
  for (;;) {
    const step = nextStep(seen);
    if (!step) break;
    const key = step.param as keyof FinderAnswers;
    const value = a[key];
    if (!value) break;
    order.push(key);
    seen = { ...seen, [key]: value };
  }
  if (order.length === 0) return null;
  const back: Record<string, string> = {};
  for (const key of order.slice(0, -1)) back[key] = a[key]!;
  return back as FinderAnswers;
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
          "SWIM 580 MAXI ima med vsemi modeli največ masažnih šob — 94 na pet " +
          "črpalk — ob polni 5,8-metrski plavalni dolžini. Če toliko masaže ne " +
          "potrebujete, je SWIM 580 HIDRO enaka školjka z 38 šobami.",
      };
    }
    return {
      slugs: ["swim-580-hidro", "swim-580-maxi"],
      why:
        "SWIM 580 HIDRO združi 5,8-metrsko plavalno dolžino s 38 masažnimi " +
        "šobami, ležalnikom in šestimi sedeži. Če bi masaže radi še več, ima " +
        "SWIM 580 MAXI na isti dolžini 94 šob.",
    };
  }
  if (a.osebe === "druzba") {
    return {
      slugs: ["srednji-210"],
      why:
        "BAZEN 210 je edini model s šestimi mesti — en ležalnik in pet " +
        "sedežev na 2,10 × 2,10 m.",
    };
  }
  if (a.prostor === "manj") {
    return {
      slugs: ["mali-195"],
      why:
        "BAZEN 195 z 1,95 × 1,95 m stopi tja, kamor večja modela ne greta, " +
        "in kljub temu obdrži dva ležalnika in 35 šob.",
    };
  }
  return {
    slugs: ["veliki-230"],
    why:
      "BAZEN 230 je največji v ponudbi: 2,30 × 2,30 m, dva ležalnika in 50 " +
      "šob na dveh črpalkah.",
  };
}
