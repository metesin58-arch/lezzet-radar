"use client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ResultsView } from "@/components/ResultsView";

function Inner() {
  const sp = useSearchParams();
  const food = sp.get("food") ?? undefined;
  const q = sp.get("q") ?? undefined;
  return <ResultsView key={`${food}|${q}`} food={food} q={q} />;
}

export default function AraPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
