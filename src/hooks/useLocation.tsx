"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { DISTRICTS, nearestDistrict, type District } from "@/config/districts";
import { readJSON, writeJSON } from "@/lib/storage";

type Loc = { lat: number; lng: number; label: string; manual: boolean };
export type LocationState = {
  status: "idle" | "asking" | "ok" | "denied";
  lat?: number;
  lng?: number;
  label?: string;
  pickerOpen: boolean;
  openPicker(): void;
  closePicker(): void;
  setManual(d: District): void;
  useDevice(): void;
};

const KEY = "lr:loc";
const Ctx = createContext<LocationState | null>(null);

function labelFor(lat: number, lng: number): string {
  const d = nearestDistrict(lat, lng);
  const far = Math.hypot(d.lat - lat, (d.lng - lng) * 0.75) > 0.25; // ~25 km
  return far ? "Konumun" : `${d.name}, İstanbul`;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [loc, setLoc] = useState<Loc | null>(null);
  const [status, setStatus] = useState<LocationState["status"]>("idle");
  const [pickerOpen, setPickerOpen] = useState(false);

  const save = (l: Loc) => {
    setLoc(l);
    setStatus("ok");
    writeJSON(KEY, l);
  };

  const askDevice = useCallback((silent: boolean) => {
    if (!("geolocation" in navigator)) {
      if (!silent) {
        setStatus("denied");
        setPickerOpen(true);
      }
      return;
    }
    if (!silent) setStatus("asking");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude: lat, longitude: lng } = p.coords;
        save({ lat, lng, label: labelFor(lat, lng), manual: false });
        setPickerOpen(false);
      },
      () => {
        if (silent) return;
        setStatus("denied");
        setPickerOpen(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    const saved = readJSON<Loc | null>(KEY, null);
    if (saved && Number.isFinite(saved.lat)) {
      setLoc(saved);
      setStatus("ok");
      if (!saved.manual) askDevice(true);
    } else askDevice(false);
  }, [askDevice]);

  const value: LocationState = {
    status,
    lat: loc?.lat,
    lng: loc?.lng,
    label: loc?.label,
    pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
    setManual: (d) => {
      save({ lat: d.lat, lng: d.lng, label: `${d.name}, İstanbul`, manual: true });
      setPickerOpen(false);
    },
    useDevice: () => askDevice(false),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocation(): LocationState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLocation LocationProvider içinde kullanılmalı");
  return v;
}

export { DISTRICTS };
