"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResponse } from "@/lib/search";
import type { SortKey } from "@/lib/ranking";

export type PlacesQuery = {
  lat?: number;
  lng?: number;
  food?: string;
  q?: string;
  sort?: SortKey;
  openNow?: boolean;
  price?: string;
};

type JobState = "pending" | "running" | "done" | "failed" | null;

export const POLL_MS = 3000;

export function usePlaces(params: PlacesQuery) {
  const [data, setData] = useState<SearchResponse | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobState>(null);
  const [tick, setTick] = useState(0);
  const reqId = useRef(0);

  const { lat, lng, food, q, sort, openNow, price } = params;
  const ready = lat !== undefined && lng !== undefined;

  useEffect(() => {
    if (!ready) return;
    const id = ++reqId.current;
    const sp = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (food) sp.set("food", food);
    if (q) sp.set("q", q);
    if (sort) sp.set("sort", sort);
    if (openNow) sp.set("openNow", "1");
    if (price) sp.set("price", price);
    setLoading(true);
    setError(null);
    fetch(`/api/places?${sp}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Sunucu hatası");
        return r.json() as Promise<SearchResponse>;
      })
      .then((d) => {
        if (id !== reqId.current) return;
        setData(d);
        setJobStatus(d.job ? d.job.status : null);
      })
      .catch((e) => id === reqId.current && setError(String(e.message ?? e)))
      .finally(() => id === reqId.current && setLoading(false));
  }, [ready, lat, lng, food, q, sort, openNow, price, tick]);

  // While a live job is running, poll it every 3 s; refetch the list when it finishes.
  const jobId = data?.job?.id;
  useEffect(() => {
    if (!jobId || (jobStatus !== "pending" && jobStatus !== "running")) return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/jobs/${jobId}`);
        if (!r.ok) return;
        const j = (await r.json()) as { status: JobState };
        setJobStatus(j.status);
        if (j.status === "done") setTick((x) => x + 1);
      } catch {
        /* transient network error: next tick */
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [jobId, jobStatus]);

  const refetch = useCallback(() => setTick((x) => x + 1), []);
  const searching = jobStatus === "pending" || jobStatus === "running";
  return { data, loading, error, jobStatus, searching, refetch, ready };
}
