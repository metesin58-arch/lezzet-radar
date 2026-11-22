"use client";
import Link from "next/link";
import { useState } from "react";
import { FOODS } from "@/config/foods";
import { Sheet } from "./Sheet";

const tile =
  "flex aspect-square flex-col items-center justify-center gap-1.5 rounded-[20px] bg-canvas text-center transition active:scale-95";

export function CategoryGrid({ active }: { active?: string }) {
  const [all, setAll] = useState(false);
  const popular = FOODS.filter((f) => f.popular);
  return (
    <>
      <ul className="grid grid-cols-4 gap-2.5">
        {popular.map((f) => (
          <li key={f.slug}>
            <Link
              href={`/ara?food=${f.slug}`}
              className={`${tile} ${active === f.slug ? "bg-ink text-white" : ""}`}
              aria-current={active === f.slug ? "true" : undefined}
            >
              <span className="text-[28px] leading-none">{f.emoji}</span>
              <span className="text-[12px] font-medium">{f.name}</span>
            </Link>
          </li>
        ))}
        <li>
          <button onClick={() => setAll(true)} className={`${tile} w-full`}>
            <span className="grid grid-cols-2 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="size-2.5 rounded-[4px] border-[1.6px] border-ink" />
              ))}
            </span>
            <span className="mt-1 text-[12px] font-medium">Tümü</span>
          </button>
        </li>
      </ul>
      <Sheet open={all} onClose={() => setAll(false)} title="Ne yemek istiyorsun?">
        <ul className="grid grid-cols-4 gap-2.5">
          {FOODS.map((f) => (
            <li key={f.slug}>
              <Link href={`/ara?food=${f.slug}`} className={tile} onClick={() => setAll(false)}>
                <span className="text-[26px] leading-none">{f.emoji}</span>
                <span className="px-1 text-[11px] font-medium leading-tight">{f.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
