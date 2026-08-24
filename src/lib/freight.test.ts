import { describe, expect, it } from "vitest";
import {
  FreightError,
  quote,
  zoneForCountry,
  type FreightQuoteInput,
} from "./freight";

const order = (overrides: Partial<FreightQuoteInput> = {}): FreightQuoteInput => ({
  items: [{ freightClass: "pallet", qty: 1 }],
  destinationCountry: "SI",
  ...overrides,
});

describe("zoneForCountry", () => {
  it("maps known countries, case- and whitespace-insensitively", () => {
    expect(zoneForCountry("SI")).toBe("SI");
    expect(zoneForCountry(" hr ")).toBe("NEIGHBORS");
    expect(zoneForCountry("de")).toBe("DE");
  });

  it("returns null for countries we do not deliver to", () => {
    expect(zoneForCountry("FR")).toBeNull();
    expect(zoneForCountry("")).toBeNull();
  });
});

describe("quote — governing class", () => {
  it("takes the highest class across items: the sauna's truck carries the ladle", () => {
    const q = quote(
      order({
        items: [
          { freightClass: "parcel", qty: 3 },
          { freightClass: "two_man", qty: 1 },
        ],
      }),
    );
    expect(q.governingClass).toBe("two_man");
    expect(q.totalCents).toBe(9900);
  });

  it("a pure parcel order stays a parcel", () => {
    const q = quote(order({ items: [{ freightClass: "parcel", qty: 5 }] }));
    expect(q.governingClass).toBe("parcel");
    expect(q.totalCents).toBe(500);
  });
});

describe("quote — refusals (throw, never guess)", () => {
  it("unknown destination throws", () => {
    expect(() => quote(order({ destinationCountry: "FR" }))).toThrowError(
      FreightError,
    );
    try {
      quote(order({ destinationCountry: "FR" }));
    } catch (e) {
      expect((e as FreightError).code).toBe("unknown_destination");
    }
  });

  it("an unpriced lane throws: no white-glove to Germany until a crew covers it", () => {
    try {
      quote(
        order({
          items: [{ freightClass: "white_glove", qty: 1 }],
          destinationCountry: "DE",
        }),
      );
      expect.unreachable("should have thrown");
    } catch (e) {
      expect((e as FreightError).code).toBe("unpriced_lane");
    }
  });

  it("empty and malformed orders throw", () => {
    expect(() => quote(order({ items: [] }))).toThrowError(FreightError);
    expect(() =>
      quote(order({ items: [{ freightClass: "pallet", qty: 0 }] })),
    ).toThrowError(FreightError);
    expect(() =>
      quote(order({ items: [{ freightClass: "pallet", qty: 1.5 }] })),
    ).toThrowError(FreightError);
    expect(() =>
      quote(
        order({
          // The endpoint is public: TypeScript's opinion is not a defense.
          items: [{ freightClass: "drone" as never, qty: 1 }],
        }),
      ),
    ).toThrowError(FreightError);
  });

  it("a service the class cannot carry throws instead of charging silently", () => {
    try {
      quote(
        order({
          items: [{ freightClass: "parcel", qty: 1 }],
          services: { liftGate: true },
        }),
      );
      expect.unreachable("should have thrown");
    } catch (e) {
      expect((e as FreightError).code).toBe("invalid_service");
    }
  });
});

describe("quote — included services are never double-charged", () => {
  it("white glove: requesting installation and room-of-choice adds nothing", () => {
    const q = quote(
      order({
        items: [{ freightClass: "white_glove", qty: 1 }],
        services: { installation: true, roomOfChoice: true },
      }),
    );
    expect(q.totalCents).toBe(24900);
    expect(q.includedServices).toEqual(
      expect.arrayContaining(["installation", "roomOfChoice"]),
    );
    expect(q.lines).toHaveLength(1);
  });

  it("two-man includes room of choice but installation is a paid add-on", () => {
    const q = quote(
      order({
        items: [{ freightClass: "two_man", qty: 1 }],
        services: { roomOfChoice: true, installation: true },
      }),
    );
    expect(q.totalCents).toBe(9900 + 14900);
    expect(q.includedServices).toEqual(["roomOfChoice"]);
  });

  it("a deselected service is not charged", () => {
    const q = quote(
      order({
        items: [{ freightClass: "pallet", qty: 1 }],
        services: { liftGate: false, removal: true },
      }),
    );
    expect(q.totalCents).toBe(4900 + 7900);
  });
});

describe("quote — additional heavy units", () => {
  it("each pallet-class unit beyond the first adds half the base", () => {
    const q = quote(order({ items: [{ freightClass: "pallet", qty: 3 }] }));
    // base 4900 + 2 × round(4900/2)
    expect(q.totalCents).toBe(4900 + 2 * 2450);
  });

  it("parcels never multiply the base: twenty ladles is one box", () => {
    const q = quote(
      order({
        items: [
          { freightClass: "pallet_xl", qty: 1 },
          { freightClass: "parcel", qty: 20 },
        ],
      }),
    );
    expect(q.totalCents).toBe(7900);
  });

  it("mixed heavy classes count all heavy units against the governing base", () => {
    const q = quote(
      order({
        items: [
          { freightClass: "pallet", qty: 1 },
          { freightClass: "two_man", qty: 1 },
        ],
      }),
    );
    expect(q.governingClass).toBe("two_man");
    expect(q.totalCents).toBe(9900 + Math.round(9900 * 0.5));
  });
});

describe("quote — invariants", () => {
  it("total always equals the sum of its lines", () => {
    const q = quote(
      order({
        items: [
          { freightClass: "pallet_xl", qty: 2 },
          { freightClass: "parcel", qty: 1 },
        ],
        destinationCountry: "AT",
        services: { liftGate: true, removal: true },
      }),
    );
    expect(q.totalCents).toBe(q.lines.reduce((s, l) => s + l.cents, 0));
    expect(q.zone).toBe("NEIGHBORS");
  });
});
