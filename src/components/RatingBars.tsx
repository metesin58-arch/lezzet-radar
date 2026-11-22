import type { RatingDist } from "@/lib/scraper/types";

export function RatingBars({ dist }: { dist: RatingDist }) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
  return (
    <ul className="space-y-1.5">
      {(["5", "4", "3", "2", "1"] as const).map((k) => (
        <li key={k} className="flex items-center gap-2 text-xs" data-testid="rating-bar">
          <span className="w-3 text-right font-semibold">{k}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
            <span className="block h-full rounded-full bg-star" style={{ width: `${(dist[k] / total) * 100}%` }} />
          </span>
          <span className="w-9 text-right text-muted">{Math.round((dist[k] / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}
