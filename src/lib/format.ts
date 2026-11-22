export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}

export function walkMinutes(m: number): number {
  return Math.max(1, Math.round(m / 80));
}

export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${(k >= 10 ? Math.round(k).toString() : k.toFixed(1)).replace(".", ",")}B`;
}

export function formatRating(r: number | null): string {
  return r === null ? "–" : r.toFixed(1).replace(".", ",");
}

export function directionsUrl(p: { lat: number; lng: number; placeId: string }): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&destination_place_id=${encodeURIComponent(p.placeId)}`;
}
