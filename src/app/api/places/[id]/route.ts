import { NextResponse } from "next/server";
import { getPlace } from "@/lib/repo/places";
import { isOpenNow } from "@/lib/openNow";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getPlace(id);
  if (!p) return NextResponse.json({ error: "Mekan bulunamadı" }, { status: 404 });
  return NextResponse.json({ ...p, openNow: isOpenNow(p.openHours, new Date()) });
}
