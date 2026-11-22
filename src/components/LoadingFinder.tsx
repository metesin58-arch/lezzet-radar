"use client";
import { useEffect, useState } from "react";
import type { Food } from "@/config/foods";
import { foodVerb } from "@/lib/foodVerb";

export const LOADING_TITLE = "Senin için en lezzetli noktaları buluyorum…";

export function LoadingFinder({ food, inline = false }: { food?: Food | null; inline?: boolean }) {
  const lines = [
    "Yakındaki mekanları tarıyorum…",
    "Yorumları okuyorum…",
    "Puanları karşılaştırıyorum…",
    ...(food && !food.name.includes(" ") ? [`${foodVerb(food)} kokluyorum…`] : []),
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % lines.length), 4000);
    return () => clearInterval(t);
  }, [lines.length]);
  return (
    <div
      className={`flex flex-col items-center justify-center px-8 text-center ${inline ? "py-10" : "min-h-[62dvh]"}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative mb-8 flex size-32 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-accent/25 [animation:lr-pulse_2s_ease-out_infinite]" />
        <span className="absolute inset-0 rounded-full bg-accent/20 [animation:lr-pulse_2s_ease-out_1s_infinite]" />
        <span className="relative flex size-24 items-center justify-center rounded-full bg-accent text-5xl shadow-[0_12px_30px_rgba(232,69,44,0.35)]">
          <span className="[animation:lr-bounce_1.6s_ease-in-out_infinite]">{food?.emoji ?? "🍽️"}</span>
        </span>
      </div>
      <h2 className="max-w-[18ch] text-[22px] font-bold leading-tight">{LOADING_TITLE}</h2>
      <p key={i} className="mt-3 h-5 text-sm text-muted [animation:lr-fade_.4s_ease-out]">
        {lines[i]}
      </p>
      <p className="mt-6 rounded-full bg-canvas px-4 py-2 text-xs text-muted">Bu 1-3 dakika sürebilir</p>
    </div>
  );
}
