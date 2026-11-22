"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackIcon, ClockIcon, HeartIcon, NavIcon, PhoneIcon, PinIcon, WalkIcon } from "@/components/icons";
import { OpenBadge, FewBadge } from "@/components/PlaceCard";
import { PlaceImage } from "@/components/PlaceImage";
import { Rating } from "@/components/Rating";
import { RatingBars } from "@/components/RatingBars";
import { ReviewList } from "@/components/ReviewList";
import { useFavorites } from "@/hooks/useFavorites";
import { useLocation } from "@/hooks/useLocation";
import { haversineM } from "@/lib/geo/grid";
import { directionsUrl, formatDistance, walkMinutes } from "@/lib/format";
import type { PlaceDetail } from "@/lib/repo/places";

type Detail = PlaceDetail & { openNow: boolean | null };

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const todayName = () =>
  new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone: "Europe/Istanbul" }).format(new Date()).replace(/^./, (c) => c.toLocaleUpperCase("tr"));

export default function PlacePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const loc = useLocation();
  const fav = useFavorites();
  const [p, setP] = useState<Detail | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing" | "error">("loading");

  useEffect(() => {
    fetch(`/api/places/${encodeURIComponent(decodeURIComponent(id))}`)
      .then(async (r) => {
        if (r.status === 404) return setState("missing");
        if (!r.ok) return setState("error");
        setP(await r.json());
        setState("ok");
      })
      .catch(() => setState("error"));
  }, [id]);

  const back = (
    <button
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      aria-label="Geri"
      className="flex size-11 items-center justify-center rounded-full bg-white/95 shadow"
    >
      <BackIcon />
    </button>
  );

  if (state !== "ok" || !p)
    return (
      <main className="px-5 pt-5">
        {back}
        {state === "loading" ? (
          <div className="mt-5 space-y-3">
            <div className="skeleton h-64 rounded-[28px]" />
            <div className="skeleton h-6 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
          </div>
        ) : (
          <div className="mt-16 text-center">
            <p className="text-4xl">🍽️</p>
            <p className="mt-3 font-semibold">{state === "missing" ? "Mekan bulunamadı" : "Bir şeyler ters gitti"}</p>
            <Link href="/" className="mt-4 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
              Ana sayfaya dön
            </Link>
          </div>
        )}
      </main>
    );

  const dist = loc.lat !== undefined && loc.lng !== undefined ? haversineM(loc.lat, loc.lng, p.lat, p.lng) : null;
  const on = fav.has(p.placeId);
  const today = todayName();

  return (
    <main className="pb-6">
      <div className="relative bg-canvas">
        <PlaceImage src={p.thumbnail} alt={p.title} className="h-[300px] w-full" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
          {back}
          <button
            onClick={() => fav.toggle(p.placeId)}
            aria-label={on ? "Favorilerden çıkar" : "Favorilere ekle"}
            aria-pressed={on}
            className={`flex size-11 items-center justify-center rounded-full bg-white/95 shadow ${on ? "text-accent" : ""}`}
          >
            <HeartIcon filled={on} />
          </button>
        </div>
      </div>

      <div className="relative -mt-7 rounded-t-[28px] bg-surface px-5 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          {p.category && <span className="text-xs font-medium uppercase tracking-wide text-muted">{p.category}</span>}
          <OpenBadge open={p.openNow} />
          {p.reviewCount < 30 && <FewBadge />}
        </div>
        <h1 className="mt-1.5 text-[26px] font-bold leading-tight">{p.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <Rating rating={p.rating} count={p.reviewCount} size="lg" />
          {p.priceRange && <span>{p.priceRange}</span>}
          {dist !== null && (
            <span className="flex items-center gap-1">
              <WalkIcon /> {formatDistance(dist)} · {walkMinutes(dist)} dk
            </span>
          )}
        </div>

        {p.reviewsPerRating && (
          <section className="mt-6 flex items-center gap-5 rounded-[24px] border border-line p-4">
            <div className="text-center">
              <p className="text-4xl font-bold">{p.rating?.toFixed(1).replace(".", ",") ?? "–"}</p>
              <p className="mt-1 text-xs text-muted">{p.reviewCount.toLocaleString("tr-TR")} yorum</p>
            </div>
            <div className="flex-1">
              <RatingBars dist={p.reviewsPerRating} />
            </div>
          </section>
        )}

        <section className="mt-6 space-y-3 text-sm">
          {p.address && (
            <p className="flex gap-3">
              <PinIcon className="size-5 shrink-0 text-muted" /> {p.address}
            </p>
          )}
          {p.openHours && (
            <details className="group">
              <summary className="flex cursor-pointer list-none gap-3">
                <ClockIcon className="size-5 shrink-0 text-muted" />
                <span>
                  Bugün: <b>{p.openHours[today]?.join(", ") ?? "bilinmiyor"}</b>
                  <span className="ml-1 text-muted group-open:hidden">· tüm hafta</span>
                </span>
              </summary>
              <ul className="ml-8 mt-2 space-y-1">
                {DAYS.map((d) => (
                  <li key={d} className={`flex justify-between ${d === today ? "font-bold" : "text-muted"}`}>
                    <span>{d}</span>
                    <span>{p.openHours![d]?.join(", ") ?? "–"}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Yorumlar</h2>
          <ReviewList reviews={p.reviews} link={p.link} />
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md gap-3 bg-gradient-to-t from-white via-white to-white/0 px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-6">
        <a
          href={directionsUrl(p)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
        >
          <NavIcon /> Yol tarifi
        </a>
        {p.phone && (
          <a href={`tel:${p.phone.replace(/\s/g, "")}`} aria-label="Ara" className="flex h-14 items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 font-semibold">
            <PhoneIcon /> Ara
          </a>
        )}
      </div>
    </main>
  );
}
