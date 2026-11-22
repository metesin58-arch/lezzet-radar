"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ResultsView } from "@/components/ResultsView";

function Inner() {
  const sp = useSearchParams();
  return <ResultsView food={sp.get("food") ?? undefined} initialView="map" />;
}

export default function HaritaPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
