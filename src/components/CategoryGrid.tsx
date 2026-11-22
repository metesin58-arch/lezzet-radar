"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { FOODS, type Food } from "@/config/foods";
import { Sheet } from "./Sheet";

const base = "relative flex aspect-square flex-col items-center justify-center gap-1.5 overflow-hidden rounded-[20px] bg-canvas text-center transition active:scale-95";

/** Photo tile: the photo fills the tile, the name sits on a dark gradient at the bottom. Without a photo: emoji + name. */
function FoodTile({ f, active, small = false, onClick }: { f: Food; active?: boolean; small?: boolean; onClick?: () => void }) {
  const label = small ? "text-[11px] leading-tight" : "text-[12px]";
  return (
    <Link
      href={`/ara?food=${f.slug}`}
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={`${base} ${active ? "ring-2 ring-ink ring-offset-2" : ""} ${!f.image && active ? "bg-ink text-white" : ""}`}
    >
      {f.image ? (
        <>
          <img src={f.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
          <span className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-1 pb-1.5 pt-6 font-semibold text-white ${label}`}>
            {f.name}
          </span>
        </>
      ) : (
        <>
          <span className={`${small ? "text-[26px]" : "text-[28px]"} leading-none`} aria-hidden="true">
            {f.emoji}
          </span>
          <span className={`px-1 font-medium ${label}`}>{f.name}</span>
        </>
      )}
    </Link>
  );
}

export function CategoryGrid({ active }: { active?: string }) {
  const [all, setAll] = useState(false);
  const popular = FOODS.filter((f) => f.popular);
  return (
    <>
      <ul className="grid grid-cols-4 gap-2.5">
        {popular.map((f) => (
          <li key={f.slug}>
            <FoodTile f={f} active={active === f.slug} />
          </li>
        ))}
        <li>
          <button onClick={() => setAll(true)} className={`${base} w-full`}>
            <span className="grid grid-cols-2 gap-1" aria-hidden="true">
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
              <FoodTile f={f} small onClick={() => setAll(false)} />
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}
