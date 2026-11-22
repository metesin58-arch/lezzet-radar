"use client";
import Link from "next/link";
import { useLocation } from "@/hooks/useLocation";
import { ChevronDown, HeartIcon, PinIcon } from "./icons";

export function LocationHeader() {
  const loc = useLocation();
  const label =
    loc.status === "ok" ? loc.label : loc.status === "asking" || loc.status === "idle" ? "Konum alınıyor…" : "Konum seç";
  return (
    <header className="flex items-center justify-between gap-3">
      <button onClick={loc.openPicker} className="flex min-w-0 items-center gap-3 text-left" aria-label="Konumu değiştir">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-canvas">
          <PinIcon />
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-muted">Konumun</span>
          <span className="flex items-center gap-1 truncate font-semibold">
            <span className="truncate">{label}</span> <ChevronDown className="size-4 shrink-0" />
          </span>
        </span>
      </button>
      <Link href="/favoriler" aria-label="Favoriler" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-canvas">
        <HeartIcon />
      </Link>
    </header>
  );
}
