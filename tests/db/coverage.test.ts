import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { resetTestDb, truncateAll } from "./setup";
import { getCoverage, markCovered } from "../../src/lib/repo/coverage";

describe("coverage repo", () => {
  beforeAll(resetTestDb);
  beforeEach(truncateAll);

  it("yazılmamışsa null, yazılınca tarih ve sayı döner", async () => {
    expect(await getCoverage("1:1", "lahmacun")).toBeNull();
    await markCovered("1:1", "lahmacun", 16);
    const c = await getCoverage("1:1", "lahmacun");
    expect(c!.resultCount).toBe(16);
    expect(Date.now() - c!.lastScrapedAt.getTime()).toBeLessThan(60_000);
    await markCovered("1:1", "lahmacun", 20);
    expect((await getCoverage("1:1", "lahmacun"))!.resultCount).toBe(20);
  });
});
