/**
 * FREIGHT PRICING ENGINE — the logistics moat, as code.
 *
 * This is the component neither source repo has: ocenagor ships a €69 tablica
 * as a flat-rate parcel; this network ships €3–15k pallet freight with
 * two-man crews and commissioning. Pure and deterministic — no I/O, no clock,
 * no randomness — so the checkout Edge Function can call quote() with
 * catalogue-resolved items and persist the result on the order, and tests
 * can pin every lane.
 *
 * Doctrine carried over from ocenagor's catalogue.ts, verbatim in spirit:
 *
 *  - The browser NEVER sets a freight class or a price. Classes come from the
 *    product catalogue rows the server resolves; the client's opinion of
 *    shipping cost is ignored.
 *  - Unknown destinations and unpriced lanes THROW rather than fall back.
 *    A silent default is how you end up delivering a 400 kg sauna to Germany
 *    for the Slovenian parcel rate. A throw surfaces at checkout as an
 *    explicit "pokličite nas" path — a real answer, not a wrong charge.
 *  - Input is treated as hostile even where TypeScript says it can't be:
 *    these functions sit behind a public endpoint.
 */

/**
 * How the goods physically move. Ordered by escalation — an order takes the
 * highest class among its items, because the truck that can deliver the
 * sauna also carries the bucket and ladle.
 *
 *  parcel       courier box (accessories, aroma oils, spare parts)
 *  pallet       standard EUR pallet, kerbside, tail-lift truck
 *  pallet_xl    oversize/heavy pallet (barrel saunas, large cabins)
 *  two_man      two-man crew, carried to room of choice
 *  white_glove  two-man crew + siting + assembly + commissioning + packaging
 *               removal. MANDATORY for cryo chambers — the class itself
 *               includes installation, it cannot be deselected.
 */
export type FreightClass =
  | "parcel"
  | "pallet"
  | "pallet_xl"
  | "two_man"
  | "white_glove";

export const FREIGHT_CLASS_RANK: Record<FreightClass, number> = {
  parcel: 0,
  pallet: 1,
  pallet_xl: 2,
  two_man: 3,
  white_glove: 4,
};

const FREIGHT_CLASSES = Object.keys(FREIGHT_CLASS_RANK) as FreightClass[];

/** Delivery zones. Expansion = adding a zone and its lanes, one review each. */
export type FreightZone = "SI" | "NEIGHBORS" | "DE";

const ZONE_BY_COUNTRY: Record<string, FreightZone> = {
  SI: "SI",
  HR: "NEIGHBORS",
  IT: "NEIGHBORS",
  AT: "NEIGHBORS",
  HU: "NEIGHBORS",
  DE: "DE",
};

/** Returns null for countries we do not deliver to — callers must refuse. */
export function zoneForCountry(country: string): FreightZone | null {
  // Hostile input: a non-string destination is an unknown destination, not a crash.
  if (typeof country !== "string") return null;
  return ZONE_BY_COUNTRY[country.trim().toUpperCase()] ?? null;
}

/**
 * Base charge per order, gross EUR cents (22% DDV included, same gross-price
 * posture as the rest of the network), by class × zone.
 *
 * A MISSING LANE IS A STATEMENT: "we do not deliver this class there yet."
 * quote() throws on it. White-glove outside SI/NEIGHBORS stays unpriced until
 * a crew actually covers it — that is a business decision made here, in one
 * reviewed line, not a fallback.
 *
 * ⚠️ PLACEHOLDER RATES — confirm against real carrier contracts before any
 * shop goes live (the same "confirm this figure" gate STRIPE.md put on the
 * tablica's 5 € delivery).
 */
const BASE_CENTS: Record<FreightClass, Partial<Record<FreightZone, number>>> = {
  parcel: { SI: 500, NEIGHBORS: 1000, DE: 1500 },
  pallet: { SI: 4900, NEIGHBORS: 9900, DE: 14900 },
  pallet_xl: { SI: 7900, NEIGHBORS: 14900, DE: 19900 },
  two_man: { SI: 9900, NEIGHBORS: 19900 },
  white_glove: { SI: 24900, NEIGHBORS: 39900 },
};

/**
 * Each pallet-or-heavier unit beyond the first adds half of ITS OWN class's
 * base rate: the truck is already coming, but a second sauna is a second
 * pallet and a second hour of crew time. Pricing extras by their own class
 * (not the order's governing class) keeps a pallet added to a white-glove
 * order costing a pallet's share — combining shipments must never cost more
 * than splitting them. Parcels don't multiply — twenty ladles is one box.
 */
const ADDITIONAL_UNIT_FACTOR = 0.5;

export interface FreightServices {
  /** Tail-lift at delivery. Pallet classes only — two_man and white_glove carry. */
  liftGate?: boolean;
  /** Carry past the kerb. Included in two_man and white_glove by definition. */
  roomOfChoice?: boolean;
  /** Assembly + commissioning. Included in white_glove by definition. */
  installation?: boolean;
  /** Haul away the old unit. */
  removal?: boolean;
}

type ServiceKey = keyof FreightServices;

/** Gross cents per selected service, by the order's governing class. */
const SERVICE_CENTS: Record<ServiceKey, Partial<Record<FreightClass, number>>> = {
  liftGate: { pallet: 2500, pallet_xl: 3500 },
  roomOfChoice: { pallet: 4900, pallet_xl: 6900 },
  installation: { pallet: 14900, pallet_xl: 19900, two_man: 14900 },
  removal: { pallet: 7900, pallet_xl: 9900, two_man: 7900, white_glove: 7900 },
};

/**
 * Services a class already contains — quoted at 0 and listed as included.
 * liftGate is included in the crew classes because the crew carries: a valid
 * lift-gate selection must survive the cart escalating to two_man/white_glove
 * (adding a cryo chamber to a pallet cart must absorb the selection, not
 * throw the customer out of checkout).
 */
const INCLUDED_SERVICES: Record<FreightClass, ServiceKey[]> = {
  parcel: [],
  pallet: [],
  pallet_xl: [],
  two_man: ["roomOfChoice", "liftGate"],
  white_glove: ["roomOfChoice", "installation", "liftGate"],
};

export interface FreightItem {
  freightClass: FreightClass;
  qty: number;
}

export interface FreightQuoteInput {
  items: FreightItem[];
  /** ISO 3166-1 alpha-2 destination ('SI'). */
  destinationCountry: string;
  services?: FreightServices;
}

export interface FreightQuoteLine {
  kind: "base" | "additional_units" | "service";
  key: string;
  cents: number;
}

export interface FreightQuote {
  zone: FreightZone;
  governingClass: FreightClass;
  lines: FreightQuoteLine[];
  /** Services the governing class contains at no extra charge. */
  includedServices: ServiceKey[];
  totalCents: number;
}

export class FreightError extends Error {
  constructor(
    public readonly code:
      | "empty_order"
      | "invalid_item"
      | "unknown_destination"
      | "unpriced_lane"
      | "invalid_service",
    message: string,
  ) {
    super(message);
    this.name = "FreightError";
  }
}

function isFreightClass(v: unknown): v is FreightClass {
  return typeof v === "string" && (FREIGHT_CLASSES as string[]).includes(v);
}

/**
 * Price freight for one order. Throws FreightError — never guesses.
 */
export function quote(input: FreightQuoteInput): FreightQuote {
  const { items, destinationCountry } = input;

  // Hostile input: services must be a plain object (null/undefined mean "none").
  const services: FreightServices = input.services ?? {};
  if (typeof services !== "object" || Array.isArray(services)) {
    throw new FreightError("invalid_service", "services must be an object.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new FreightError("empty_order", "An order needs at least one item.");
  }
  for (const item of items) {
    if (!isFreightClass(item.freightClass)) {
      throw new FreightError(
        "invalid_item",
        `Unknown freight class: ${String(item.freightClass)}`,
      );
    }
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 100) {
      throw new FreightError(
        "invalid_item",
        `Quantity out of range: ${String(item.qty)}`,
      );
    }
  }

  const zone = zoneForCountry(destinationCountry);
  if (!zone) {
    throw new FreightError(
      "unknown_destination",
      `No delivery to '${destinationCountry}'. Add the country to ZONE_BY_COUNTRY deliberately, or refuse at checkout.`,
    );
  }

  const governingClass = items.reduce<FreightClass>(
    (max, item) =>
      FREIGHT_CLASS_RANK[item.freightClass] > FREIGHT_CLASS_RANK[max]
        ? item.freightClass
        : max,
    "parcel",
  );

  const baseCents = BASE_CENTS[governingClass][zone];
  if (baseCents === undefined) {
    throw new FreightError(
      "unpriced_lane",
      `No ${governingClass} lane to ${zone}. Price it in BASE_CENTS or refuse.`,
    );
  }

  const lines: FreightQuoteLine[] = [
    { kind: "base", key: `${governingClass}:${zone}`, cents: baseCents },
  ];

  // Heavy units beyond the first each add half of THEIR OWN class's base for
  // the zone; the single governing-class unit rides the order base. Every
  // heavy class in the cart must have a priced lane — otherwise refuse.
  const heavyItems = items.filter(
    (i) => FREIGHT_CLASS_RANK[i.freightClass] >= FREIGHT_CLASS_RANK.pallet,
  );
  const heavyUnits = heavyItems.reduce((n, i) => n + i.qty, 0);
  if (heavyUnits > 1) {
    let surcharge = 0;
    for (const item of heavyItems) {
      const ownBase = BASE_CENTS[item.freightClass][zone];
      if (ownBase === undefined) {
        throw new FreightError(
          "unpriced_lane",
          `No ${item.freightClass} lane to ${zone}. Price it in BASE_CENTS or refuse.`,
        );
      }
      surcharge += item.qty * Math.round(ownBase * ADDITIONAL_UNIT_FACTOR);
    }
    // The first governing-class unit is covered by the order base.
    surcharge -= Math.round(baseCents * ADDITIONAL_UNIT_FACTOR);
    if (surcharge > 0) {
      lines.push({
        kind: "additional_units",
        key: `extra_heavy_units:${heavyUnits - 1}`,
        cents: surcharge,
      });
    }
  }

  const included = INCLUDED_SERVICES[governingClass];
  for (const key of Object.keys(services)) {
    // Hostile input: an unknown service key is a refusal, not a TypeError.
    if (!Object.hasOwn(SERVICE_CENTS, key)) {
      throw new FreightError(
        "invalid_service",
        `Unknown service: '${String(key)}'.`,
      );
    }
    const serviceKey = key as ServiceKey;
    if (!services[serviceKey]) continue;
    if (included.includes(serviceKey)) continue; // in the base — never double-charged
    const cents = SERVICE_CENTS[serviceKey][governingClass];
    if (cents === undefined) {
      // e.g. lift-gate on a parcel, installation on a parcel: a UI that offers
      // this is broken, and charging for it silently would hide that. Loud.
      throw new FreightError(
        "invalid_service",
        `Service '${serviceKey}' is not available for class '${governingClass}'.`,
      );
    }
    lines.push({ kind: "service", key: serviceKey, cents });
  }

  return {
    zone,
    governingClass,
    lines,
    includedServices: included,
    totalCents: lines.reduce((sum, l) => sum + l.cents, 0),
  };
}
