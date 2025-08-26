// app/api/proxy/rotate/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROTATE_BASE = process.env.ROTATE_BASE || ""; 
// Example: ROTATE_BASE="http://192.168.12.219/selling/rotate?token="

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId as string | undefined;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allocationId } = await req.json().catch(() => ({}));
  if (!allocationId) {
    return Response.json({ error: "Missing allocationId" }, { status: 400 });
  }

  // Make sure the allocation belongs to this user
  const allocation = await prisma.allocation.findFirst({
    where: { id: allocationId, userId },
    include: { endpoint: true },
  });
  if (!allocation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const ep = allocation.endpoint;
  if (!ep) {
    return Response.json({ error: "Endpoint missing" }, { status: 500 });
  }

  let rotateUrl = ep.controllerPath?.trim() || "";
  if (!rotateUrl) {
    return Response.json({ error: "No rotation URL/token configured" }, { status: 400 });
  }

  // If controllerPath is just a token, build from ROTATE_BASE; otherwise use as-is.
  if (!/^https?:\/\//i.test(rotateUrl)) {
    if (!ROTATE_BASE) {
      return Response.json({ error: "ROTATE_BASE not set and controllerPath is not a URL" }, { status: 500 });
    }
    rotateUrl = ROTATE_BASE + encodeURIComponent(rotateUrl);
  }

  try {
    const r = await fetch(rotateUrl, { method: "GET" });
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return Response.json(
        { error: `Rotation failed (${r.status})`, details: text?.slice(0, 200) },
        { status: 502 },
      );
    }
  } catch (e: any) {
    return Response.json({ error: "Rotation request error", details: String(e?.message || e) }, { status: 502 });
  }

  return Response.json({ ok: true });
}
