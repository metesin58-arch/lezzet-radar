import { FOOD_BY_SLUG } from "../config/foods";
import { markCovered } from "../lib/repo/coverage";
import { completeJob, failJob, MAX_ATTEMPTS, type Job } from "../lib/repo/jobs";
import { upsertPlaces } from "../lib/repo/places";
import { parseScraperOutput } from "../lib/scraper/parse";
import type { ScrapeRunner } from "../lib/scraper/run";

/** Runs a single job. On error existing data is never touched; the job is retried. */
export async function processJob(job: Job, runner: ScrapeRunner): Promise<void> {
  const tag = `[iş ${job.id.slice(0, 8)} ${job.keyword} @${job.cellId} deneme ${job.attempts}]`;
  let res;
  try {
    res = await runner({ keyword: job.keyword, lat: job.lat, lng: job.lng });
  } catch (e) {
    await failJob(job.id, `runner: ${String(e)}`);
    return;
  }
  if (res.exitCode !== 0) {
    console.error(`${tag} scraper çıkış kodu ${res.exitCode}\n${res.log.slice(-2000)}`);
    await failJob(job.id, `exit ${res.exitCode}: ${res.log.slice(-500)}`);
    return;
  }
  const { places, rejected } = parseScraperOutput(res.stdout);
  if (rejected.length) console.warn(`${tag} ${rejected.length} satır reddedildi`, rejected.slice(0, 5));
  if (places.length === 0 && job.attempts < MAX_ATTEMPTS) {
    console.warn(`${tag} boş sonuç, yeniden denenecek`);
    await failJob(job.id, "empty");
    return;
  }
  const food = FOOD_BY_SLUG[job.foodKey] ?? null;
  const n = places.length ? await upsertPlaces(places, job.foodKey, food) : 0;
  await markCovered(job.cellId, job.foodKey, n);
  await completeJob(job.id, n);
  console.log(`${tag} tamam: ${n} mekan`);
}
