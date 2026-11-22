"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { matchFood } from "@/lib/text/normalize";
import { ArrowRight, SearchIcon } from "./icons";

export function searchHref(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  const f = matchFood(t);
  return f ? `/ara?food=${f.slug}` : `/ara?q=${encodeURIComponent(t)}`;
}

export function SearchBar({ initial = "", autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const href = searchHref(text);
        if (href) router.push(href);
      }}
      className="flex items-center gap-2"
    >
      <label className="flex h-14 flex-1 items-center gap-2.5 rounded-full bg-canvas px-5">
        <SearchIcon className="size-5 text-muted" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus={autoFocus}
          enterKeyHint="search"
          placeholder="Lahmacun, çiğköfte, burger…"
          aria-label="Ne yemek istiyorsun?"
          className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
      </label>
      <button
        type="submit"
        aria-label="Ara"
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] active:scale-95"
      >
        <ArrowRight />
      </button>
    </form>
  );
}
