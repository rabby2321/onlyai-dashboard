import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allocationId } = await req.json().catch(() => ({}));
  if (!allocationId) return NextResponse.json({ error: "Missing allocationId" }, { status: 400 });

  // Look up the allocation & endpoint securely on the server
  const alloc = await prisma.allocation.findUnique({
    where: { id: allocationId },
    include: { endpoint: true },
  });
  if (!alloc || alloc.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = alloc.endpoint.controllerPath;
  if (!url) return NextResponse.json({ error: "Rotate not configured" }, { status: 400 });

  // Call your controller with a short timeout
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 10_000);

  try {
    const res = await fetch(url, { signal: ac.signal });
    const text = await res.text();
    clearTimeout(t);

    // Try to parse JSON like: {"status":true,"message":"Rotate successfully!"}
    try {
      const j = JSON.parse(text);
      const ok = !!(j.status ?? j.ok ?? res.ok);
      return NextResponse.json({
        ok,
        message: j.message || (ok ? "Rotated" : "Failed"),
        raw: j,
      }, { status: ok ? 200 : 502 });
    } catch {
      // Non-JSON response
      return NextResponse.json({
        ok: res.ok,
        message: res.ok ? "Rotated" : "Failed",
        raw: text,
      }, { status: res.ok ? 200 : 502 });
    }
  } catch (e: any) {
    clearTimeout(t);
    return NextResponse.json({ error: e?.message || "Controller unreachable" }, { status: 504 });
  }
}
