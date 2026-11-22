import { NextResponse } from "next/server";
import { getJob, publicJob } from "@/lib/repo/jobs";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const j = await getJob(id);
  if (!j) return NextResponse.json({ error: "İş bulunamadı" }, { status: 404 });
  return NextResponse.json(publicJob(j));
}
