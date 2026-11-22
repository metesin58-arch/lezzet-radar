import { FOOD_BY_SLUG } from "../config/foods";
import { markCovered } from "../lib/repo/coverage";
import { completeJob, failJob, MAX_ATTEMPTS, type Job } from "../lib/repo/jobs";
import { upsertPlaces } from "../lib/repo/places";
import { parseScraperOutput } from "../lib/scraper/parse";
import type { ScrapeRunner } from "../lib/scraper/run";

export type JobOutcome = "ok" | "empty" | "failed";

/**
 * Runs a single job. On any error existing data is untouched and the job is retried after a delay.
 * "empty" also counts toward the worker's backoff (it could be a Google block).
 */
export async function processJob(job: Job, runner: ScrapeRunner): Promise<JobOutcome> {
  const tag = `[iş ${job.id.slice(0, 8)} ${job.keyword} @${job.cellId} deneme ${job.attempts}]`;
  const fail = async (msg: string): Promise<JobOutcome> => {
    console.error(`${tag} ${msg.slice(0, 2000)}`);
    await failJob(job.id, msg);
    return "failed";
  };
  try {
    const res = await runner({ keyword: job.keyword, lat: job.lat, lng: job.lng });
    if (res.exitCode !== 0) return fail(`exit ${res.exitCode}: ${res.log.slice(-500)}`);
    if (res.stdout === null) return fail(`no_output: ${res.log.slice(-500)}`);

    const { places, rejected } = parseScraperOutput(res.stdout);
    if (rejected.length) console.warn(`${tag} ${rejected.length} satır reddedildi`, rejected.slice(0, 5));
    if (places.length === 0 && rejected.length > 0) {
      // Every row was rejected: most likely the scraper's output format changed. Do not write "0 results".
      const reasons = [...new Set(rejected.map((r) => r.reason))].join(",");
      return fail(`all_rejected (${rejected.length}): ${reasons}`);
    }
    if (places.length === 0 && job.attempts < MAX_ATTEMPTS) {
      await failJob(job.id, "empty");
      console.warn(`${tag} boş sonuç, gecikmeli yeniden denenecek`);
      return "empty";
    }
    const food = FOOD_BY_SLUG[job.foodKey] ?? null;
    const n = places.length ? await upsertPlaces(places, job.foodKey, food) : 0;
    await markCovered(job.cellId, job.foodKey, n);
    await completeJob(job.id, n);
    console.log(`${tag} tamam: ${n} mekan`);
    return n > 0 ? "ok" : "empty";
  } catch (e) {
    return fail(`hata: ${e instanceof Error ? e.message : String(e)}`);
  }
}
