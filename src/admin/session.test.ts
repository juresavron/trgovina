import { describe, it, expect } from "vitest";
import {
  SESSION_TTL_SECONDS,
  mintSession,
  readCookie,
  sessionCookie,
  timingSafeEqual,
  verifySession,
} from "./session";

const SECRET = "a-test-secret-that-is-long-enough";

/**
 * The admin panel holds the service-role key, which bypasses every RLS policy
 * in the database. This cookie is the only thing between the open internet and
 * that key, so its failure modes are worth writing down as tests rather than
 * trusting to a reading.
 */
describe("admin sessions", () => {
  it("accepts what it minted", async () => {
    expect(await verifySession(await mintSession(SECRET), SECRET)).toBe(true);
  });

  it("rejects a different secret", async () => {
    const v = await mintSession(SECRET);
    expect(await verifySession(v, SECRET + "x")).toBe(false);
  });

  /** Rotating ADMIN_SECRET is the only way to revoke, so it has to work. */
  it("is revoked wholesale by changing the secret", async () => {
    const before = await mintSession(SECRET);
    expect(await verifySession(before, "rotated-secret")).toBe(false);
  });

  it("rejects an expired session", async () => {
    const now = Date.now();
    const v = await mintSession(SECRET, now);
    expect(await verifySession(v, SECRET, now + (SESSION_TTL_SECONDS + 1) * 1000)).toBe(false);
  });

  /**
   * The expiry is inside the signature, so extending it invalidates the tag.
   * If this ever passes, a session lasts forever.
   */
  it("rejects an expiry edited after signing", async () => {
    const v = await mintSession(SECRET);
    const tag = v.slice(v.indexOf(".") + 1);
    const forged = String(Math.floor(Date.now() / 1000) + 999999) + "." + tag;
    expect(await verifySession(forged, SECRET)).toBe(false);
  });

  it("rejects junk, empty and missing values", async () => {
    for (const v of ["", ".", "abc", "123", "123.", ".xyz", null, undefined]) {
      expect(await verifySession(v as string | null, SECRET), JSON.stringify(v)).toBe(false);
    }
  });

  it("compares in constant time without getting the answer wrong", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("", "a")).toBe(false);
    // Non-ASCII must not throw or silently truncate.
    expect(timingSafeEqual("gešlo", "gešlo")).toBe(true);
    expect(timingSafeEqual("gešlo", "geslo")).toBe(false);
  });

  /**
   * HttpOnly keeps script out of it, Secure keeps it off plaintext, Strict is
   * the CSRF defence that lets the write routes be plain POSTs, and the /admin
   * path keeps it off every storefront request.
   */
  it("sets a cookie with every flag it depends on", () => {
    const c = sessionCookie("v", 100);
    expect(c).toContain("HttpOnly");
    expect(c).toContain("Secure");
    expect(c).toContain("SameSite=Strict");
    expect(c).toContain("Path=/admin");
  });

  it("reads one cookie out of a header carrying several", () => {
    const req = new Request("https://x.test/", {
      headers: { cookie: "a=1; st_admin=abc.def; b=2" },
    });
    expect(readCookie(req, "st_admin")).toBe("abc.def");
    expect(readCookie(req, "missing")).toBeNull();
  });
});
