import { NextResponse, type NextRequest } from "next/server";
import { searchPlaces } from "@/lib/search";
import { rateLimit } from "@/lib/rateLimit";
import { clientKey } from "@/lib/clientKey";
import { SORT_KEYS, type SortKey } from "@/lib/ranking";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  if (!sp.get("lat") || !sp.get("lng") || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return NextResponse.json({ error: "Geçersiz konum" }, { status: 400 });
  const sort = sp.get("sort") as SortKey | null;
  const ck = clientKey(req.headers, process.env.TRUST_PROXY === "1");
  try {
    const res = await searchPlaces({
      lat,
      lng,
      food: sp.get("food") ?? undefined,
      q: sp.get("q")?.slice(0, 80) ?? undefined,
      sort: sort && SORT_KEYS.includes(sort) ? sort : undefined,
      openNow: sp.get("openNow") === "1",
      price: sp.get("price") ?? undefined,
      allowLive: () => rateLimit(`live:${ck.key}`, ck.limit),
    });
    return NextResponse.json(res);
  } catch (e) {
    console.error("[api/places]", e);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
