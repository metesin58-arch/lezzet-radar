import { FOODS, FOOD_BY_SLUG } from "../config/foods";
import { cellCenter, cellIdFor } from "./geo/grid";
import { isOpenNow } from "./openNow";
import { sortPlaces, type SortKey } from "./ranking";
import { getCoverage } from "./repo/coverage";
import { enqueueJob, PRIORITY, type JobStatus } from "./repo/jobs";
import { findNearby, type NearbyRow, type TopReview } from "./repo/places";
import { foodKeyForQuery, normalizeTr } from "./text/normalize";

export const RADIUS_STEPS = [2000, 5000, 10000];
export const MIN_RESULTS = 8;
export const STALE_DAYS = 30;
export const FEW_REVIEWS = 30;

export type PlaceSummary = {
  id: string;
  title: string;
  category: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number;
  distanceM: number;
  thumbnail: string | null;
  priceRange: string | null;
  address: string | null;
  openNow: boolean | null;
  fewReviews: boolean;
  topReview: TopReview | null;
};

export type SearchResponse = {
  places: PlaceSummary[];
  radiusM: number;
  foodKey: string | null;
  job: { id: string; status: JobStatus } | null;
  refreshing: boolean;
};

export type SearchParams = {
  lat: number;
  lng: number;
  food?: string;
  q?: string;
  sort?: SortKey;
  openNow?: boolean;
  price?: string;
  /** Whether a new live job may be opened; a function is only called when a job is needed (rate limit). */
  allowLive: boolean | (() => boolean);
};

function resolveFoodKey(p: SearchParams): string | null {
  if (p.food && FOOD_BY_SLUG[p.food]) return p.food;
  if (p.q && normalizeTr(p.q)) return foodKeyForQuery(p.q);
  return null;
}

function keywordFor(foodKey: string, q?: string): string {
  return FOOD_BY_SLUG[foodKey]?.query ?? (q?.trim() || foodKey.slice(2));
}

function toSummary(r: NearbyRow, now: Date): PlaceSummary {
  return {
    id: r.placeId,
    title: r.title,
    category: r.category,
    lat: r.lat,
    lng: r.lng,
    rating: r.rating,
    reviewCount: r.reviewCount,
    distanceM: Math.round(r.distanceM),
    thumbnail: r.thumbnail,
    priceRange: r.priceRange,
    address: r.address,
    openNow: isOpenNow(r.openHours, now),
    fewReviews: r.reviewCount < FEW_REVIEWS,
    topReview: r.topReview,
  };
}

/** For one (cell, food) pair: if never scraped, opens a live job; if stale, a refresh job. */
async function ensureFresh(
  cellId: string,
  foodKey: string,
  keyword: string,
  canLive: () => boolean,
): Promise<{ job: { id: string; status: JobStatus } | null; refreshing: boolean }> {
  const cov = await getCoverage(cellId, foodKey);
  const c = cellCenter(cellId);
  if (!cov) {
    if (!canLive()) return { job: null, refreshing: false };
    const j = await enqueueJob({ cellId, foodKey, keyword, lat: c.lat, lng: c.lng, priority: PRIORITY.live });
    return { job: { id: j.id, status: j.status }, refreshing: false };
  }
  if (Date.now() - cov.lastScrapedAt.getTime() > STALE_DAYS * 86_400_000) {
    await enqueueJob({ cellId, foodKey, keyword, lat: c.lat, lng: c.lng, priority: PRIORITY.refresh });
    return { job: null, refreshing: true };
  }
  return { job: null, refreshing: false };
}

export async function searchPlaces(p: SearchParams): Promise<SearchResponse> {
  const now = new Date();
  const foodKey = resolveFoodKey(p);
  const keys = foodKey ? [foodKey] : FOODS.map((f) => f.slug);

  let rows: NearbyRow[] = [];
  let radiusM = RADIUS_STEPS[0];
  for (const r of RADIUS_STEPS) {
    radiusM = r;
    rows = await findNearby({ lat: p.lat, lng: p.lng, radiusM: r, foodKeys: keys });
    if (rows.length >= MIN_RESULTS) break;
  }

  let places = rows.map((r) => toSummary(r, now));
  if (p.openNow) places = places.filter((x) => x.openNow === true);
  if (p.price) places = places.filter((x) => x.priceRange === p.price);
  const nameMatch = new Map(rows.map((r) => [r.placeId, r.nameMatch]));
  places = sortPlaces(
    places.map((x) => ({ ...x, nameMatch: nameMatch.get(x.id) ?? false })),
    p.sort ?? "onerilen",
  ).map(({ nameMatch: _, ...x }) => x);

  // Live-job permission is asked for once and the answer is reused.
  let liveAnswer: boolean | undefined;
  const canLive = () => (liveAnswer ??= typeof p.allowLive === "function" ? p.allowLive() : p.allowLive);

  const cellId = cellIdFor(p.lat, p.lng);
  let job: SearchResponse["job"] = null;
  let refreshing = false;
  const targets = foodKey ? [foodKey] : FOODS.filter((f) => f.popular).map((f) => f.slug);
  for (const fk of targets) {
    const r = await ensureFresh(cellId, fk, keywordFor(fk, p.q), canLive);
    job ??= r.job;
    refreshing ||= r.refreshing;
  }
  return { places, radiusM, foodKey, job, refreshing };
}
