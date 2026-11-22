"use client";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FOOD_BY_SLUG } from "@/config/foods";
import { useLocation } from "@/hooks/useLocation";
import { usePlaces } from "@/hooks/usePlaces";
import type { SortKey } from "@/lib/ranking";
import { matchFood } from "@/lib/text/normalize";
import { CategoryGrid } from "./CategoryGrid";
import { FilterChips, SortChips } from "./Chips";
import { DistrictPicker } from "./DistrictPicker";
import { BackIcon, ListIcon, MapIcon } from "./icons";
import { LoadingFinder } from "./LoadingFinder";
import { PlaceCardRow } from "./PlaceCard";
import { SearchBar } from "./SearchBar";
import { SearchingBanner } from "./SearchingBanner";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="skeleton size-full" />,
});

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3 rounded-[24px] border border-line p-2.5">
          <div className="skeleton size-[104px] rounded-[18px]" />
          <div className="flex-1 space-y-2 py-2">
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResultsView({ food, q, initialView = "list" }: { food?: string; q?: string; initialView?: "list" | "map" }) {
  const router = useRouter();
  const loc = useLocation();
  const [sort, setSort] = useState<SortKey>("onerilen");
  const [openNow, setOpenNow] = useState(false);
  const [price, setPrice] = useState<string | undefined>();
  const [view, setView] = useState(initialView);
  const [activeId, setActiveId] = useState<string | undefined>();
  const stripRef = useRef<HTMLDivElement>(null);

  const foodObj = (food && FOOD_BY_SLUG[food]) || (q ? matchFood(q) : null);
  const { data, error, jobStatus, searching, refetch } = usePlaces({ lat: loc.lat, lng: loc.lng, food, q, sort, openNow, price });
  const places = useMemo(() => data?.places ?? [], [data]);
  const prices = useMemo(() => [...new Set(places.map((p) => p.priceRange).filter(Boolean) as string[])].sort(), [places]);

  const title = foodObj?.name ?? (q ? `“${q}”` : "Yakınındaki yerler");
  const district = loc.label?.split(",")[0];

  useEffect(() => {
    if (!activeId || !stripRef.current) return;
    // Scroll only the horizontal strip; scrollIntoView would scroll the whole page vertically too.
    const strip = stripRef.current;
    const el = strip.querySelector<HTMLElement>(`[data-id="${CSS.escape(activeId)}"]`);
    if (el) strip.scrollTo({ left: el.offsetLeft - (strip.clientWidth - el.clientWidth) / 2, behavior: "smooth" });
  }, [activeId]);

  const failed = jobStatus === "failed";
  const body = (() => {
    if (loc.status !== "ok")
      return (
        <button onClick={loc.openPicker} className="w-full rounded-[24px] bg-canvas px-5 py-6 text-left">
          <span className="block font-semibold">Önce konumunu seç</span>
          <span className="text-sm text-muted">Yakınındaki mekanları bulabilmem için konum gerekiyor.</span>
        </button>
      );
    if (error)
      return (
        <div className="rounded-[24px] bg-canvas px-5 py-6 text-sm">
          Bir şeyler ters gitti. <button className="font-semibold underline" onClick={refetch}>Tekrar dene</button>
        </div>
      );
    if (!places.length && searching) return <LoadingFinder food={foodObj} />;
    if (!places.length && failed)
      return (
        <div className="rounded-[24px] bg-canvas px-5 py-8 text-center">
          <p className="font-semibold">Şu an bu bölgede arama yapamadım, biraz sonra tekrar dene</p>
          <button onClick={refetch} className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
            Tekrar dene
          </button>
        </div>
      );
    if (!data) return <ListSkeleton />;
    if (!places.length)
      return (
        <div className="rounded-[24px] bg-canvas px-5 py-8 text-center">
          <p className="text-4xl">🤷</p>
          <p className="mt-2 font-semibold">{openNow || price ? "Bu filtrelerle sonuç yok" : "Bu bölgede sonuç bulamadım"}</p>
          <p className="mt-1 text-sm text-muted">Başka bir yemek ya da filtre dene.</p>
        </div>
      );
    return null;
  })();

  return (
    <main className="px-5 pt-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          aria-label="Geri"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-canvas"
        >
          <BackIcon />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="truncate text-[17px] font-bold">{title}</h1>
          <button onClick={loc.openPicker} className="text-xs text-muted">
            {district ?? "Konum seç"}
            {data && places.length > 0 && ` · ${places.length} mekan`}
          </button>
        </div>
        <button
          onClick={() => setView(view === "list" ? "map" : "list")}
          aria-label={view === "list" ? "Harita" : "Liste"}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-canvas"
        >
          {view === "list" ? <MapIcon /> : <ListIcon />}
        </button>
      </div>

      {!food && !q && (
        <div className="mt-4 space-y-4">
          <SearchBar />
          {view === "list" && <CategoryGrid />}
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        <SortChips value={sort} onChange={setSort} />
        <FilterChips openNow={openNow} onOpenNow={setOpenNow} prices={prices} price={price} onPrice={setPrice} />
      </div>

      {(searching || data?.refreshing) && places.length > 0 && (
        <div className="mt-3">
          <SearchingBanner text={data?.refreshing && !searching ? "Bilgileri güncelliyorum…" : "Daha fazla yer arıyorum…"} />
        </div>
      )}

      <div className="mt-4">
        {body ??
          (view === "list" ? (
            <ul className="space-y-3">
              {places.map((p) => (
                <li key={p.id}>
                  <PlaceCardRow p={p} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="relative -mx-5 h-[calc(100dvh-235px)] min-h-[420px] overflow-hidden">
              <MapView center={{ lat: loc.lat!, lng: loc.lng! }} places={places} activeId={activeId} onSelect={setActiveId} />
              <div
                ref={stripRef}
                className="no-scrollbar absolute inset-x-0 bottom-[100px] z-[1000] flex snap-x gap-3 overflow-x-auto px-5"
              >
                {places.map((p) => (
                  <div
                    key={p.id}
                    data-id={p.id}
                    className="w-[86%] shrink-0 snap-center drop-shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
                    onMouseEnter={() => setActiveId(p.id)}
                    onFocus={() => setActiveId(p.id)}
                  >
                    <PlaceCardRow p={p} active={p.id === activeId} />
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
      <DistrictPicker />
    </main>
  );
}
