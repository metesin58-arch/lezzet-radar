import { query } from "../db";

export type JobStatus = "pending" | "running" | "done" | "failed";

export type Job = {
  id: string;
  cellId: string;
  foodKey: string;
  keyword: string;
  lat: number;
  lng: number;
  priority: number;
  status: JobStatus;
  attempts: number;
  error: string | null;
  resultCount: number | null;
  createdAt: Date;
};

export const PRIORITY = { live: 10, refresh: 5, seed: 0 } as const;
export const MAX_ATTEMPTS = 3;
/** Wait before a retry: 30 s, then 60 s. Back-to-back retries do not help while Google is blocking. */
export const RETRY_BASE_SECONDS = 30;

type Row = Record<string, unknown>;
const mapJob = (r: Row): Job => ({
  id: r.id as string,
  cellId: r.cell_id as string,
  foodKey: r.food_key as string,
  keyword: r.keyword as string,
  lat: Number(r.lat),
  lng: Number(r.lng),
  priority: Number(r.priority),
  status: r.status as JobStatus,
  attempts: Number(r.attempts),
  error: (r.error as string) ?? null,
  resultCount: r.result_count === null ? null : Number(r.result_count),
  createdAt: new Date(r.created_at as string),
});

/** Adds a job, or returns the active job for the same (cell, food) and raises its priority if needed. */
export async function enqueueJob(j: {
  cellId: string;
  foodKey: string;
  keyword: string;
  lat: number;
  lng: number;
  priority: number;
}): Promise<{ id: string; status: JobStatus; created: boolean }> {
  for (let i = 0; i < 5; i++) {
    const [ins] = await query<Row>(
      `insert into scrape_jobs (cell_id, food_key, keyword, lat, lng, priority) values ($1,$2,$3,$4,$5,$6)
       on conflict (cell_id, food_key) where status in ('pending','running') do nothing
       returning id, status`,
      [j.cellId, j.foodKey, j.keyword, j.lat, j.lng, j.priority],
    );
    if (ins) return { id: ins.id as string, status: ins.status as JobStatus, created: true };
    const [ex] = await query<Row>(
      `update scrape_jobs set priority = greatest(priority, $3)
       where cell_id=$1 and food_key=$2 and status in ('pending','running') returning id, status`,
      [j.cellId, j.foodKey, j.priority],
    );
    if (ex) return { id: ex.id as string, status: ex.status as JobStatus, created: false };
    // The active job finished in between; try inserting again.
  }
  throw new Error("enqueueJob: aktif iş bulunamadı");
}

export async function claimJob(): Promise<Job | null> {
  const [r] = await query<Row>(
    `update scrape_jobs set status='running', attempts=attempts+1, started_at=now()
     where id = (select id from scrape_jobs where status='pending' and run_after <= now()
                 order by priority desc, created_at limit 1 for update skip locked)
     returning *`,
  );
  return r ? mapJob(r) : null;
}

export async function completeJob(id: string, resultCount: number): Promise<void> {
  await query(
    `update scrape_jobs set status='done', result_count=$2, error=null, finished_at=now() where id=$1`,
    [id, resultCount],
  );
}

export async function failJob(id: string, error: string, maxAttempts = MAX_ATTEMPTS): Promise<void> {
  await query(
    `update scrape_jobs set error=$2,
        status = case when attempts >= $3 then 'failed' else 'pending' end,
        finished_at = case when attempts >= $3 then now() else null end,
        run_after = now() + make_interval(secs => $4 * power(2, greatest(attempts, 1) - 1))
     where id=$1`,
    [id, error.slice(0, 2000), maxAttempts, RETRY_BASE_SECONDS],
  );
}

export async function getJob(id: string): Promise<Job | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [r] = await query<Row>(`select * from scrape_jobs where id=$1`, [id]);
  return r ? mapJob(r) : null;
}

/** Takes back jobs stuck in running (worker crashed); a job with no attempts left becomes failed. */
export async function requeueStale(minutes = 15): Promise<number> {
  const rows = await query(
    `update scrape_jobs set
        status = case when attempts >= $2 then 'failed' else 'pending' end,
        error = coalesce(error, 'stale'),
        finished_at = case when attempts >= $2 then now() else null end
     where status='running' and started_at < now() - make_interval(mins => $1) returning id`,
    [minutes, MAX_ATTEMPTS],
  );
  return rows.length;
}

export async function findActiveJob(cellId: string, foodKey: string): Promise<{ id: string; status: JobStatus } | null> {
  const [r] = await query<Row>(
    `select id, status from scrape_jobs where cell_id=$1 and food_key=$2 and status in ('pending','running') limit 1`,
    [cellId, foodKey],
  );
  return r ? { id: r.id as string, status: r.status as JobStatus } : null;
}

/** Job info that is safe to show to visitors (no scraper log). */
export function publicJob(j: Job): { id: string; status: JobStatus; resultCount: number | null; error: string | null } {
  return { id: j.id, status: j.status, resultCount: j.resultCount, error: j.status === "failed" ? "Arama başarısız oldu" : null };
}
