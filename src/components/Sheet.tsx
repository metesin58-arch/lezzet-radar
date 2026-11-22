"use client";
import { useEffect } from "react";
import { CloseIcon } from "./icons";

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose(): void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-md flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Kapat" className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="relative max-h-[82dvh] overflow-y-auto rounded-t-[28px] bg-surface px-5 pb-8 pt-3 [animation:lr-fade_.2s_ease-out]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Kapat" className="flex size-9 items-center justify-center rounded-full bg-canvas">
            <CloseIcon className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
