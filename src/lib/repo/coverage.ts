import { query } from "../db";

export const STALE_DAYS = 30;
/** "No results here" is not trusted for long: it may have come from a temporary block. */
export const EMPTY_TTL_DAYS = 3;

export function isFresh(c: { lastScrapedAt: Date; resultCount: number }, now = Date.now()): boolean {
  const days = c.resultCount > 0 ? STALE_DAYS : EMPTY_TTL_DAYS;
  return now - c.lastScrapedAt.getTime() < days * 86_400_000;
}

export async function getCoverage(
  cellId: string,
  foodKey: string,
): Promise<{ lastScrapedAt: Date; resultCount: number } | null> {
  const [r] = await query<{ last_scraped_at: Date; result_count: number }>(
    `select last_scraped_at, result_count from coverage where cell_id=$1 and food_key=$2`,
    [cellId, foodKey],
  );
  return r ? { lastScrapedAt: new Date(r.last_scraped_at), resultCount: r.result_count } : null;
}

export async function markCovered(cellId: string, foodKey: string, resultCount: number): Promise<void> {
  await query(
    `insert into coverage (cell_id, food_key, last_scraped_at, result_count) values ($1,$2,now(),$3)
     on conflict (cell_id, food_key) do update set last_scraped_at=now(), result_count=excluded.result_count`,
    [cellId, foodKey, resultCount],
  );
}
