"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { PlaceSummary } from "@/lib/search";
import { formatRating } from "@/lib/format";

function pinIcon(p: PlaceSummary, active: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div class="lr-pin" style="transform:translate(-50%,-100%);display:inline-flex;align-items:center;gap:3px;white-space:nowrap;padding:5px 9px;border-radius:999px;font:600 12px var(--font-jakarta),system-ui;box-shadow:0 4px 14px rgba(0,0,0,.18);${
      active ? "background:#121212;color:#fff;" : "background:#fff;color:#121212;"
    }"><span style="color:#f5a524">★</span>${formatRating(p.rating)}</div>`,
  });
}

function FitBounds({ center, places }: { center: [number, number]; places: PlaceSummary[] }) {
  const map = useMap();
  const key = places.map((p) => p.id).join(",");
  useEffect(() => {
    if (!places.length) {
      map.setView(center, 15);
      return;
    }
    const b = L.latLngBounds([center, ...places.map((p) => [p.lat, p.lng] as [number, number])]);
    map.fitBounds(b, { padding: [40, 40], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

function PanTo({ place }: { place?: PlaceSummary }) {
  const map = useMap();
  useEffect(() => {
    if (place) map.panTo([place.lat, place.lng], { animate: true });
  }, [place, map]);
  return null;
}

export default function MapView({
  center,
  places,
  activeId,
  onSelect,
}: {
  center: { lat: number; lng: number };
  places: PlaceSummary[];
  activeId?: string;
  onSelect(id: string): void;
}) {
  const c: [number, number] = [center.lat, center.lng];
  const active = useMemo(() => places.find((p) => p.id === activeId), [places, activeId]);
  const ref = useRef<L.Map | null>(null);
  return (
    <MapContainer ref={ref} center={c} zoom={15} zoomControl={false} attributionControl className="size-full" style={{ background: "#eef0f2" }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />
      <FitBounds center={c} places={places} />
      <PanTo place={active} />
      <CircleMarker center={c} radius={16} pathOptions={{ stroke: false, fillColor: "#2f80ed", fillOpacity: 0.18 }} />
      <CircleMarker center={c} radius={7} pathOptions={{ color: "#fff", weight: 3, fillColor: "#2f80ed", fillOpacity: 1 }} />
      {places.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={pinIcon(p, p.id === activeId)}
          zIndexOffset={p.id === activeId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(p.id) }}
          title={p.title}
        />
      ))}
    </MapContainer>
  );
}
