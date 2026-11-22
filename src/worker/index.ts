import { claimJob, requeueStale } from "../lib/repo/jobs";
import { dockerRunner } from "../lib/scraper/run";
import { processJob } from "./processJob";
import { migrate } from "../../scripts/migrate";
import { pool } from "../lib/db";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let stopping = false;
process.on("SIGTERM", () => (stopping = true));
process.on("SIGINT", () => (stopping = true));

async function main() {
  // On first boot the worker may start before the web service; it runs the migrations itself (idempotent).
  await migrate();
  console.log("worker başladı");
  let failures = 0;
  let lastRequeue = 0;
  while (!stopping) {
    try {
      if (Date.now() - lastRequeue > 60_000) {
        const n = await requeueStale(15);
        if (n) console.warn(`${n} takılı iş yeniden kuyruğa alındı`);
        lastRequeue = Date.now();
      }
      const job = await claimJob();
      if (!job) {
        await sleep(2000);
        continue;
      }
      const outcome = await processJob(job, dockerRunner);
      failures = outcome === "ok" ? 0 : failures + 1;
    } catch (e) {
      console.error("worker hatası:", e);
      failures++;
    }
    if (failures >= 3) {
      // Several failures in a row likely means Google is blocking us: back off.
      const wait = Math.min(10 * 60_000, 60_000 * 2 ** (failures - 3));
      console.warn(`art arda ${failures} hata, ${Math.round(wait / 1000)} sn bekleniyor`);
      await sleep(wait);
    }
  }
  await pool.end();
  console.log("worker durdu");
}

main();
