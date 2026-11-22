import { formatCount, formatRating } from "@/lib/format";
import { StarIcon } from "./icons";

export function Rating({ rating, count, size = "sm" }: { rating: number | null; count?: number; size?: "sm" | "lg" }) {
  return (
    <span className={`inline-flex items-center gap-1 ${size === "lg" ? "text-base" : "text-[13px]"}`}>
      <StarIcon className={`${size === "lg" ? "size-5" : "size-4"} text-star`} />
      <span className="font-semibold">{formatRating(rating)}</span>
      {count !== undefined && <span className="text-muted">({formatCount(count)})</span>}
    </span>
  );
}
