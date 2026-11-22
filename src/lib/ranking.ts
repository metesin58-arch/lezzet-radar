export const PRIOR_MEAN = 4.2;
export const PRIOR_WEIGHT = 50;
export const DISTANCE_PENALTY_PER_KM = 0.15;
export const NAME_MATCH_BONUS = 0.1;

export type SortKey = "onerilen" | "yakin" | "puan" | "yorum";
export const SORT_KEYS: SortKey[] = ["onerilen", "yakin", "puan", "yorum"];

type Rankable = { rating: number | null; reviewCount: number; distanceM: number; nameMatch: boolean };

export function bayesScore(rating: number | null, reviewCount: number): number {
  const v = Math.max(0, reviewCount);
  const r = rating ?? PRIOR_MEAN;
  return (v / (v + PRIOR_WEIGHT)) * r + (PRIOR_WEIGHT / (v + PRIOR_WEIGHT)) * PRIOR_MEAN;
}

export function finalScore(p: Rankable): number {
  return (
    bayesScore(p.rating, p.reviewCount) -
    DISTANCE_PENALTY_PER_KM * (p.distanceM / 1000) +
    (p.nameMatch ? NAME_MATCH_BONUS : 0)
  );
}

export function sortPlaces<T extends Rankable>(list: T[], key: SortKey): T[] {
  const out = [...list];
  const cmp: Record<SortKey, (a: T, b: T) => number> = {
    onerilen: (a, b) => finalScore(b) - finalScore(a),
    yakin: (a, b) => a.distanceM - b.distanceM,
    puan: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount,
    yorum: (a, b) => b.reviewCount - a.reviewCount,
  };
  return out.sort(cmp[key]);
}
