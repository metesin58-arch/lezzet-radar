import type { RatingDist, ScrapedPlace, ScrapedReview } from "./types";

type Rejected = { line: number; reason: string };
type Raw = Record<string, unknown>;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

function parseReviews(v: unknown): ScrapedReview[] {
  if (!Array.isArray(v)) return [];
  const out: ScrapedReview[] = [];
  for (const r of v as Raw[]) {
    const rating = num(r?.Rating) ?? num(r?.rating_float) ?? 0;
    const text = str(r?.Description) ?? str(r?.text_original) ?? "";
    if (!text && !rating) continue;
    out.push({
      author: str(r.Name) ?? "",
      authorPhoto: str(r.ProfilePicture),
      rating: Math.round(rating),
      text,
      relativeTime: str(r.When),
      publishedAt: str(r.published_at),
      images: Array.isArray(r.Images) ? (r.Images as unknown[]).filter((x): x is string => typeof x === "string") : [],
    });
  }
  return out;
}

function parseDist(v: unknown): RatingDist | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Raw;
  const d = {} as RatingDist;
  for (const k of ["1", "2", "3", "4", "5"] as const) d[k] = num(o[k]) ?? 0;
  return d;
}

function parseHours(v: unknown): Record<string, string[]> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, string[]> = {};
  for (const [k, val] of Object.entries(v as Raw))
    if (Array.isArray(val)) out[k] = val.filter((x): x is string => typeof x === "string");
  return Object.keys(out).length ? out : null;
}

/** Validates one raw row. Returns a place or the reason for rejection. */
function toPlace(r: Raw): ScrapedPlace | string {
  const placeId = str(r.place_id);
  const title = str(r.title);
  if (!placeId || !title) return "missing_id";
  const lat = num(r.latitude);
  const lng = num(r.longitude) ?? num(r.longtitude);
  if (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0))
    return "invalid_coords";
  const rating = num(r.review_rating);
  if (rating !== null && (rating < 0 || rating > 5)) return "invalid_rating";
  const addr = r.complete_address as Raw | undefined;
  return {
    placeId,
    cid: str(r.cid),
    dataId: str(r.data_id),
    title,
    category: str(r.category),
    categories: Array.isArray(r.categories) ? (r.categories as unknown[]).filter((x): x is string => typeof x === "string") : [],
    address: str(r.address),
    district: str(addr?.city),
    phone: str(r.phone),
    website: str(r.web_site),
    lat,
    lng,
    rating: rating === 0 && !num(r.review_count) ? null : rating,
    reviewCount: Math.max(0, num(r.review_count) ?? 0),
    reviewsPerRating: parseDist(r.reviews_per_rating),
    priceRange: str(r.price_range),
    openHours: parseHours(r.open_hours),
    thumbnail: str(r.thumbnail),
    link: str(r.link),
    status: str(r.status) ?? "",
    reviews: parseReviews(r.user_reviews),
    raw: r,
  };
}

/** Parses the scraper's JSON Lines output; invalid rows are rejected, not written. */
export function parseScraperOutput(jsonl: string): { places: ScrapedPlace[]; rejected: Rejected[] } {
  const byId = new Map<string, ScrapedPlace>();
  const rejected: Rejected[] = [];
  jsonl.split("\n").forEach((line, i) => {
    if (!line.trim()) return;
    let row: unknown;
    try {
      // Postgres text/jsonb does not accept \u0000; strip it while parsing.
      row = JSON.parse(line, (_k, v) => (typeof v === "string" ? v.replace(/\u0000/g, "") : v));
    } catch {
      rejected.push({ line: i + 1, reason: "invalid_json" });
      return;
    }
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      rejected.push({ line: i + 1, reason: "invalid_json" });
      return;
    }
    const p = toPlace(row as Raw);
    if (typeof p === "string") rejected.push({ line: i + 1, reason: p });
    else byId.set(p.placeId, p);
  });
  return { places: [...byId.values()], rejected };
}
