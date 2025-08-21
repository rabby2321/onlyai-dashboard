import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs"; // Prisma needs Node runtime

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, telegram: true, address: true, createdAt: true },
  });
  return NextResponse.json(u);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: any = {};
  if ("name" in body) data.name = body.name || null;
  if ("telegram" in body) data.telegram = body.telegram || null;
  if ("address" in body) data.address = body.address || null;

  const u = await prisma.user.update({
    where: { id: userId },
    data,
    select: { email: true, name: true, telegram: true, address: true, createdAt: true },
  });
  return NextResponse.json(u);
}
