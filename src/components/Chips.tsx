"use client";
import type { SortKey } from "@/lib/ranking";

export const SORT_LABELS: Record<SortKey, string> = {
  onerilen: "Önerilen",
  yakin: "En yakın",
  puan: "En yüksek puan",
  yorum: "En çok yorum",
};

function Chip({ on, onClick, children }: { on: boolean; onClick(): void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition ${
        on ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function SortChips({ value, onChange }: { value: SortKey; onChange(v: SortKey): void }) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
      {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
        <Chip key={k} on={value === k} onClick={() => onChange(k)}>
          {SORT_LABELS[k]}
        </Chip>
      ))}
    </div>
  );
}

export function FilterChips({
  openNow,
  onOpenNow,
  prices,
  price,
  onPrice,
}: {
  openNow: boolean;
  onOpenNow(v: boolean): void;
  prices: string[];
  price?: string;
  onPrice(v?: string): void;
}) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
      <Chip on={openNow} onClick={() => onOpenNow(!openNow)}>
        <span className="mr-1.5 inline-block size-2 rounded-full bg-good align-middle" />
        Şu an açık
      </Chip>
      {prices.map((p) => (
        <Chip key={p} on={price === p} onClick={() => onPrice(price === p ? undefined : p)}>
          {p}
        </Chip>
      ))}
    </div>
  );
}
