"use client";
import Link from "next/link";
import type { PlaceSummary } from "@/lib/search";
import { formatDistance, walkMinutes } from "@/lib/format";
import { useFavorites } from "@/hooks/useFavorites";
import { HeartIcon, WalkIcon } from "./icons";
import { PlaceImage } from "./PlaceImage";
import { Rating } from "./Rating";

function FavButton({ id, className = "" }: { id: string; className?: string }) {
  const fav = useFavorites();
  const on = fav.has(id);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        fav.toggle(id);
      }}
      aria-label={on ? "Favorilerden çıkar" : "Favorilere ekle"}
      aria-pressed={on}
      className={`flex size-9 items-center justify-center rounded-full bg-white/95 shadow ${on ? "text-accent" : "text-ink"} ${className}`}
    >
      <HeartIcon filled={on} className="size-[18px]" />
    </button>
  );
}

export function OpenBadge({ open }: { open: boolean | null }) {
  if (open === null) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${open ? "bg-good-soft text-good" : "bg-canvas text-muted"}`}>
      {open ? "Açık" : "Kapalı"}
    </span>
  );
}

export function FewBadge() {
  return <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">Az yorum</span>;
}

/** Narrow card for the home page's horizontal list. */
export function PlaceCardCompact({ p }: { p: PlaceSummary }) {
  return (
    <Link href={`/mekan/${encodeURIComponent(p.id)}`} className="block w-[200px] shrink-0 rounded-[24px] bg-canvas p-2.5" data-testid="place-card">
      <div className="relative">
        <PlaceImage src={p.thumbnail} alt={p.title} className="h-[132px] w-full rounded-[18px] bg-white" />
        <FavButton id={p.id} className="absolute right-2 top-2" />
      </div>
      <div className="px-1.5 pb-1 pt-2.5">
        <h3 className="truncate text-[15px] font-bold">{p.title}</h3>
        <div className="mt-1 flex items-center justify-between gap-2">
          <Rating rating={p.rating} count={p.reviewCount} />
          <span className="text-[12px] text-muted" data-testid="distance">{formatDistance(p.distanceM)}</span>
        </div>
      </div>
    </Link>
  );
}

/** Full-width card for the results list. */
export function PlaceCardRow({ p, active = false }: { p: PlaceSummary; active?: boolean }) {
  return (
    <Link
      href={`/mekan/${encodeURIComponent(p.id)}`}
      className={`flex gap-3 rounded-[24px] border bg-surface p-2.5 transition ${active ? "border-ink" : "border-line"}`}
      data-testid="place-card"
      data-distance={p.distanceM}
      data-active={active}
    >
      <div className="relative shrink-0">
        <PlaceImage src={p.thumbnail} alt={p.title} className="size-[104px] rounded-[18px] bg-canvas" />
        <FavButton id={p.id} className="absolute right-1.5 top-1.5 size-8" />
      </div>
      <div className="min-w-0 flex-1 py-0.5 pr-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[15px] font-bold">{p.title}</h3>
          {p.priceRange && <span className="shrink-0 text-[12px] text-muted">{p.priceRange}</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Rating rating={p.rating} count={p.reviewCount} />
          <OpenBadge open={p.openNow} />
          {p.fewReviews && <FewBadge />}
        </div>
        <p className="mt-1 flex min-w-0 items-center gap-1 whitespace-nowrap text-[12px] text-muted">
          <WalkIcon className="size-3.5 shrink-0" />
          <span className="shrink-0">
            <span data-testid="distance">{formatDistance(p.distanceM)}</span> · {walkMinutes(p.distanceM)} dk
          </span>
          {p.category && <span className="min-w-0 truncate">· {p.category}</span>}
        </p>
        {p.topReview && (
          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-snug text-ink/75">“{p.topReview.text}”</p>
        )}
      </div>
    </Link>
  );
}
