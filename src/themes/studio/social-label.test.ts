import { describe, expect, it } from "vitest";
import { handleRequest } from "../../worker";

describe("social photograph motion control", () => {
  it("names the checkbox with its associated text label", async () => {
    const response = handleRequest(new Request("https://masaznibazenivrelec.si/"));
    const html = await response.text();
    expect(html).toMatch(/<input\b[^>]*id="st-soc-pause"[^>]*type="checkbox"/);
    const labels = [...html.matchAll(/<label\b[^>]*for="st-soc-pause"[^>]*>(.*?)<\/label>/gs)];
    expect(labels).toHaveLength(1);
    expect(labels[0]![0]).not.toMatch(/\baria-label(?:ledby)?=/);
    const name = labels[0]![1]!.replace(/<[^>]*>/g, "").trim();
    expect(name).toBe("Ustavi ali zaženi drsenje slik");
  });
});
