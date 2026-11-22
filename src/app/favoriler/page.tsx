"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PlaceCardRow } from "@/components/PlaceCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useLocation } from "@/hooks/useLocation";
import { haversineM } from "@/lib/geo/grid";
import type { PlaceDetail } from "@/lib/repo/places";
import type { PlaceSummary } from "@/lib/search";

type Detail = PlaceDetail & { openNow: boolean | null };

export default function FavoritesPage() {
  const fav = useFavorites();
  const loc = useLocation();
  const [items, setItems] = useState<Detail[] | null>(null);
  const key = fav.ids.join(",");

  useEffect(() => {
    let alive = true;
    Promise.all(
      fav.ids.map((id) =>
        fetch(`/api/places/${encodeURIComponent(id)}`)
          .then((r) => (r.ok ? (r.json() as Promise<Detail>) : null))
          .catch(() => null),
      ),
    ).then((rs) => alive && setItems(rs.filter((x): x is Detail => x !== null)));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const summaries: PlaceSummary[] = (items ?? []).map((p) => ({
    id: p.placeId,
    title: p.title,
    category: p.category,
    lat: p.lat,
    lng: p.lng,
    rating: p.rating,
    reviewCount: p.reviewCount,
    distanceM: loc.lat !== undefined && loc.lng !== undefined ? Math.round(haversineM(loc.lat, loc.lng, p.lat, p.lng)) : 0,
    thumbnail: p.thumbnail,
    priceRange: p.priceRange,
    address: p.address,
    openNow: p.openNow,
    fewReviews: p.reviewCount < 30,
    topReview: p.topReview,
  }));

  return (
    <main className="px-5 pt-6">
      <h1 className="text-[26px] font-bold">Favorilerin</h1>
      <p className="mt-1 text-sm text-muted">Beğendiğin mekanlar bu cihazda saklanır.</p>
      <div className="mt-5">
        {!fav.ids.length ? (
          <div className="rounded-[24px] bg-canvas px-5 py-10 text-center">
            <p className="text-4xl">🤍</p>
            <p className="mt-2 font-semibold">Henüz favorin yok</p>
            <p className="mt-1 text-sm text-muted">Bir mekanın kalbine dokun, burada görünsün.</p>
            <Link href="/" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
              Keşfetmeye başla
            </Link>
          </div>
        ) : items === null ? (
          <div className="skeleton h-28 rounded-[24px]" />
        ) : (
          <ul className="space-y-3">
            {summaries.map((p) => (
              <li key={p.id}>
                <PlaceCardRow p={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
