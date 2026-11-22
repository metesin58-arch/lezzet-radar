import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { resetTestDb, truncateAll } from "./setup";
import { enqueueJob, claimJob, completeJob, failJob, getJob, requeueStale } from "../../src/lib/repo/jobs";
import { query } from "../../src/lib/db";

const J = { cellId: "1:1", foodKey: "lahmacun", keyword: "lahmacun", lat: 41, lng: 29, priority: 0 };

describe("jobs repo", () => {
  beforeAll(resetTestDb);
  beforeEach(truncateAll);

  it("20 eşzamanlı enqueue tek aktif iş açar", async () => {
    const res = await Promise.all(Array.from({ length: 20 }, () => enqueueJob(J)));
    const ids = new Set(res.map((r) => r.id));
    expect(ids.size).toBe(1);
    expect(res.filter((r) => r.created)).toHaveLength(1);
    const [{ n }] = await query<{ n: string }>(`select count(*) n from scrape_jobs`);
    expect(Number(n)).toBe(1);
  });

  it("daha yüksek öncelikli enqueue mevcut işin önceliğini yükseltir", async () => {
    const a = await enqueueJob(J);
    await enqueueJob({ ...J, priority: 10 });
    const [{ priority }] = await query<{ priority: number }>(`select priority from scrape_jobs where id=$1`, [a.id]);
    expect(priority).toBe(10);
  });

  it("paralel claim aynı işi iki kez vermez, öncelik sırasına uyar", async () => {
    await enqueueJob({ ...J, cellId: "1:2" });
    await enqueueJob({ ...J, cellId: "1:3", priority: 10 });
    const [a, b] = await Promise.all([claimJob(), claimJob()]);
    expect(a!.id).not.toBe(b!.id);
    const first = [a!, b!].find((j) => j.priority === 10);
    expect(first).toBeDefined();
    expect(await claimJob()).toBeNull();
    expect(a!.status).toBe("running");
    expect(a!.attempts).toBe(1);
  });

  it("failJob 3. denemede failed yapar", async () => {
    const { id } = await enqueueJob(J);
    for (let i = 1; i <= 3; i++) {
      await query(`update scrape_jobs set run_after = now() - interval '1 second'`); // skip the retry delay
      const j = await claimJob();
      expect(j!.id).toBe(id);
      await failJob(id, "boom");
      expect((await getJob(id))!.status).toBe(i < 3 ? "pending" : "failed");
    }
    expect((await getJob(id))!.error).toBe("boom");
  });

  it("completeJob done ve sonuç sayısı yazar; bitmiş iş yeniden enqueue edilebilir", async () => {
    const { id } = await enqueueJob(J);
    await claimJob();
    await completeJob(id, 16);
    const j = await getJob(id);
    expect(j!.status).toBe("done");
    expect(j!.resultCount).toBe(16);
    const again = await enqueueJob(J);
    expect(again.id).not.toBe(id);
  });

  it("requeueStale takılı kalan işleri geri alır", async () => {
    const { id } = await enqueueJob(J);
    await claimJob();
    await query(`update scrape_jobs set started_at = now() - interval '20 minutes' where id=$1`, [id]);
    expect(await requeueStale(15)).toBe(1);
    expect((await getJob(id))!.status).toBe("pending");
  });
});
