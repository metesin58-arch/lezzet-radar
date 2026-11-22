"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { ScrapedReview } from "@/lib/scraper/types";
import { StarIcon } from "./icons";

function Review({ r }: { r: ScrapedReview }) {
  const [open, setOpen] = useState(false);
  const long = r.text.length > 220;
  return (
    <li className="rounded-[20px] bg-canvas p-4" data-testid="review">
      <div className="flex items-center gap-3">
        {r.authorPhoto ? (
          <img src={r.authorPhoto} alt="" referrerPolicy="no-referrer" className="size-9 rounded-full bg-line object-cover" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-line text-sm font-bold">
            {r.author.charAt(0).toLocaleUpperCase("tr") || "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{r.author || "Google kullanıcısı"}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className="flex text-star" aria-label={`${r.rating} yıldız`}>
              {Array.from({ length: 5 }, (_, i) => (
                <StarIcon key={i} className={`size-3.5 ${i < r.rating ? "" : "text-line"}`} />
              ))}
            </span>
            {r.relativeTime}
          </p>
        </div>
      </div>
      {r.text && (
        <p className={`mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink/85 ${!open && long ? "line-clamp-4" : ""}`}>{r.text}</p>
      )}
      {long && (
        <button onClick={() => setOpen(!open)} className="mt-1 text-sm font-semibold">
          {open ? "Daha az göster" : "Devamını oku"}
        </button>
      )}
    </li>
  );
}

export function ReviewList({ reviews, link }: { reviews: ScrapedReview[]; link: string | null }) {
  return (
    <div>
      <ul className="space-y-3">
        {reviews.slice(0, 5).map((r, i) => (
          <Review key={i} r={r} />
        ))}
      </ul>
      {!reviews.length && <p className="text-sm text-muted">Bu mekan için yorum metni yok.</p>}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="mt-4 block text-center text-sm font-semibold underline underline-offset-4">
          Tüm yorumları Google Maps&apos;te gör →
        </a>
      )}
    </div>
  );
}
