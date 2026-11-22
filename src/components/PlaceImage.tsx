"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";

export function PlaceImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={!src || failed ? "/placeholder.svg" : src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
