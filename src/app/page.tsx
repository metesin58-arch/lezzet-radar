"use client";
import Link from "next/link";
import { CategoryGrid } from "@/components/CategoryGrid";
import { DistrictPicker } from "@/components/DistrictPicker";
import { LoadingFinder } from "@/components/LoadingFinder";
import { LocationHeader } from "@/components/LocationHeader";
import { PlaceCardCompact } from "@/components/PlaceCard";
import { SearchBar } from "@/components/SearchBar";
import { useLocation } from "@/hooks/useLocation";
import { usePlaces } from "@/hooks/usePlaces";

function SkeletonRow() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {[0, 1].map((i) => (
        <div key={i} className="w-[200px] shrink-0 rounded-[24px] bg-canvas p-2.5">
          <div className="skeleton h-[132px] rounded-[18px]" />
          <div className="skeleton mt-3 h-4 w-3/4 rounded" />
          <div className="skeleton mt-2 h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const loc = useLocation();
  const { data, loading, searching, error, refetch } = usePlaces({ lat: loc.lat, lng: loc.lng });
  const places = data?.places.slice(0, 12) ?? [];

  return (
    <main className="px-5 pt-6">
      <LocationHeader />
      <h1 className="mt-6 text-[28px] font-bold leading-[1.15] tracking-tight">
        Bugün ne <span className="font-medium italic text-muted">yemek</span> istiyorsun?
      </h1>
      <div className="mt-5">
        <SearchBar />
      </div>
      <div className="mt-5">
        <CategoryGrid />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold">Yakınındaki en iyiler</h2>
          <Link href="/ara" className="text-sm font-medium text-muted underline-offset-4 hover:underline">
            Tümünü gör
          </Link>
        </div>
        {loc.status !== "ok" ? (
          <button onClick={loc.openPicker} className="w-full rounded-[24px] bg-canvas px-5 py-6 text-left">
            <span className="block font-semibold">Konumunu seç</span>
            <span className="text-sm text-muted">Sana en yakın, en iyi puanlı yerleri listeleyelim.</span>
          </button>
        ) : error ? (
          <div className="rounded-[24px] bg-canvas px-5 py-6 text-sm">
            Bir şeyler ters gitti. <button className="font-semibold underline" onClick={refetch}>Tekrar dene</button>
          </div>
        ) : places.length ? (
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {places.map((p) => (
              <PlaceCardCompact key={p.id} p={p} />
            ))}
          </div>
        ) : searching ? (
          <LoadingFinder inline />
        ) : loading || !data ? (
          <SkeletonRow />
        ) : (
          <p className="rounded-[24px] bg-canvas px-5 py-6 text-sm text-muted">Bu bölgede henüz mekan bulamadım.</p>
        )}
      </section>
      <DistrictPicker />
    </main>
  );
}
