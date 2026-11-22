/** ~2 km × 2 km hücreler. Hücre kimliği "satır:sütun". */
export const CELL_KM = 2;
export const LAT_STEP = CELL_KM / 111.32;

export function lngStep(row: number): number {
  const lat = (row + 0.5) * LAT_STEP;
  return CELL_KM / (111.32 * Math.cos((lat * Math.PI) / 180));
}

export function cellIdFor(lat: number, lng: number): string {
  const r = Math.floor(lat / LAT_STEP);
  const c = Math.floor(lng / lngStep(r));
  return `${r}:${c}`;
}

export function cellCenter(cellId: string): { lat: number; lng: number } {
  const [r, c] = cellId.split(":").map(Number);
  return { lat: (r + 0.5) * LAT_STEP, lng: (c + 0.5) * lngStep(r) };
}

export function neighborCells(cellId: string): string[] {
  const { lat, lng } = cellCenter(cellId);
  const [r] = cellId.split(":").map(Number);
  const out: string[] = [];
  for (const dr of [-1, 0, 1])
    for (const dc of [-1, 0, 1]) {
      if (!dr && !dc) continue;
      out.push(cellIdFor(lat + dr * LAT_STEP, lng + dc * lngStep(r)));
    }
  return [...new Set(out)];
}

export function cellsInBBox(minLat: number, minLng: number, maxLat: number, maxLng: number): string[] {
  const out: string[] = [];
  for (let r = Math.floor(minLat / LAT_STEP); r <= Math.floor(maxLat / LAT_STEP); r++) {
    const s = lngStep(r);
    for (let c = Math.floor(minLng / s); c <= Math.floor(maxLng / s); c++) out.push(`${r}:${c}`);
  }
  return out;
}

export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
