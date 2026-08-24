import { describe, it, expect } from "vitest";
import { handleRequest } from "../worker";

/**
 * Mirrors the exact assertions .github/workflows/deploy.yml makes AFTER it
 * deploys. Those are the last line of defence, which is the problem: a change
 * that breaks one is only discovered once it is already live on the QA host.
 * Running them here moves that discovery into `npm test`, where it costs
 * nothing. Keep the two in step — if the workflow's greps change, change these.
 */
describe("deploy smoke assertions hold locally", () => {
  const get = (path: string) =>
    handleRequest(new Request("https://trgovina.worldfans.workers.dev" + path, {
      headers: { host: "trgovina.worldfans.workers.dev" },
    }));

  it("home is 200 and names the savna shop", async () => {
    const r = get("/");
    expect(r.status).toBe(200);
    expect(await r.text()).toContain("Infrardeča savna");
  });

  it("home sends x-robots-tag noindex", () => {
    expect(get("/").headers.get("x-robots-tag")).toMatch(/noindex/i);
  });

  it("?shop=kad names the kad shop", async () => {
    expect(await get("/?shop=kad").text()).toContain("Ledena kad");
  });

  it("robots.txt is closed", async () => {
    expect(await get("/robots.txt").text()).toContain("Disallow: /");
  });
});
