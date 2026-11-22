"use client";
import { useState } from "react";
import { DISTRICTS } from "@/config/districts";
import { useLocation } from "@/hooks/useLocation";
import { normalizeTr } from "@/lib/text/normalize";
import { Sheet } from "./Sheet";
import { LocateIcon, SearchIcon } from "./icons";

export function DistrictPicker() {
  const loc = useLocation();
  const [q, setQ] = useState("");
  const list = DISTRICTS.filter((d) => normalizeTr(d.name).includes(normalizeTr(q)));
  return (
    <Sheet open={loc.pickerOpen} onClose={loc.closePicker} title="Neredesin?">
      {loc.status === "denied" && (
        <p className="mb-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent">
          Konum izni alınamadı. İlçeni seç, sana en yakın lezzetleri oradan bulalım.
        </p>
      )}
      <button
        onClick={loc.useDevice}
        className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 text-left font-semibold text-white"
      >
        <LocateIcon /> {loc.status === "asking" ? "Konumun alınıyor…" : "Mevcut konumumu kullan"}
      </button>
      <label className="mb-3 flex items-center gap-2 rounded-full bg-canvas px-4 py-3">
        <SearchIcon className="size-4 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="İlçe ara" className="w-full bg-transparent text-sm outline-none" />
      </label>
      <ul className="grid grid-cols-2 gap-2">
        {list.map((d) => (
          <li key={d.name}>
            <button
              onClick={() => loc.setManual(d)}
              className="w-full rounded-2xl border border-line px-4 py-3 text-left text-sm font-medium hover:border-ink"
            >
              {d.name}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
