"use client";
import { useCallback, useEffect, useState } from "react";
import { readJSON, writeJSON } from "@/lib/storage";

const KEY = "lr:favs";
const EVENT = "lr:favs-changed";

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const load = () => setIds(readJSON<string[]>(KEY, []));
    load();
    window.addEventListener(EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener(EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);
  const toggle = useCallback((id: string) => {
    const cur = readJSON<string[]>(KEY, []);
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur];
    writeJSON(KEY, next);
    setIds(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
